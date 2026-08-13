// Cloudflare Worker for the ux-mockups feedback widget.
//
// Endpoints:
//   GET    /pins?url=<encoded-page-url>
//   POST   /pins
//   PATCH  /pins/:id            body: { url, author?, done?, deleted?, comment? }
//   POST   /pins/:id/undo       body: { url, author? }
//   POST   /pins/:id/replies    body: { url, author, text }
//   GET    /log?limit=&action=&product=&url=   append-only activity history (newest first)
//
// KV layout:
//   pins:<encoded-url>           JSON Pin[] — ALL pins for a page in one blob, so a
//                                page load costs 1 read and 0 list operations. KV
//                                meters list ops against a small daily free-tier
//                                budget (1,000/day); the old one-key-per-pin layout
//                                forced a list() on every page load, which was the
//                                dominant source of metered usage. This blob layout
//                                eliminates it. Trade-off: writes to a page are
//                                read-modify-write on the whole array, so two people
//                                commenting on the SAME page within the same instant
//                                could clobber each other. Acceptable here — write
//                                volume is tiny (~tens/month) and KV has no CAS.
//   pin:<encoded-url>:<pin-id>   LEGACY one-key-per-pin layout. Read once by
//                                readPins() to lazily migrate a page into the blob
//                                above, then ignored. New writes never touch these.
//   undo:<pin-id>                JSON { prevDone, prevDeleted, url, pinId, undoExpiresAt }  TTL 60s
//                                (10s logical TTL enforced via undoExpiresAt; KV min TTL is 60s)
//   log:<iso-timestamp>:<rand>   JSON Event  — append-only, never mutated; auto-
//                                expires after a ~90-day retention window (TTL).
//                                Only 'created' events are logged (deletions and
//                                status churn are intentionally not logged), which
//                                also keeps KV writes well under the free-tier cap.

const JSON_HEADERS = { 'content-type': 'application/json' };
const LOG_TTL_SECONDS = 90 * 24 * 60 * 60; // 90-day rolling retention for activity-log entries

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    let res;
    try {
      const route = matchRoute(request.method, url.pathname);
      if (route.name === 'list')       res = await listPins(url, env);
      else if (route.name === 'log')    res = await listLog(url, env);
      else if (route.name === 'create') res = await createPin(request, env);
      else if (route.name === 'update') res = await updatePin(route.id, request, env);
      else if (route.name === 'undo')   res = await undoPin(route.id, request, env);
      else if (route.name === 'reply')  res = await replyToPin(route.id, request, env);
      else if (route.name === 'settings-get')   res = await getSettings(url, env);
      else if (route.name === 'settings-patch') res = await patchSettings(request, env);
      else res = json({ error: 'Not found' }, 404);
    } catch (err) {
      res = json({ error: err.message || 'Server error' }, 500);
    }

    return withCors(res, cors);
  }
};

// --- Routing -----------------------------------------------------------------

function matchRoute(method, pathname) {
  if (method === 'GET'  && pathname === '/pins') return { name: 'list' };
  if (method === 'GET'  && pathname === '/log')  return { name: 'log' };
  if (method === 'POST' && pathname === '/pins') return { name: 'create' };
  if (method === 'GET'   && pathname === '/settings') return { name: 'settings-get' };
  if (method === 'PATCH' && pathname === '/settings') return { name: 'settings-patch' };
  const m = pathname.match(/^\/pins\/([^/]+)(?:\/(undo|replies))?$/);
  if (m) {
    const id = m[1], sub = m[2];
    if (method === 'PATCH' && !sub)              return { name: 'update', id };
    if (method === 'POST'  && sub === 'undo')    return { name: 'undo', id };
    if (method === 'POST'  && sub === 'replies') return { name: 'reply', id };
  }
  return { name: 'unknown' };
}

// --- CORS --------------------------------------------------------------------

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  const allow = allowed.includes(origin) ? origin : '';
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'Origin'
  };
}

function withCors(res, cors) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

// --- KV helpers --------------------------------------------------------------

const pinsKey = (pageUrl) => `pins:${encodeURIComponent(pageUrl)}`;
const legacyPinPrefix = (pageUrl) => `pin:${encodeURIComponent(pageUrl)}:`;
const undoKey = (id) => `undo:${id}`;
const settingsKey = (pageUrl) => `settings:${encodeURIComponent(pageUrl)}`;
const DEFAULT_SETTINGS = { visitorMode: false, commentsDisabled: false };

// Read every pin for a page as a single array.
//
// Steady state: one KV read of the `pins:<url>` blob, ZERO list operations.
//
// First access after deploy (blob absent): fall back to the legacy
// one-key-per-pin layout, consolidate those keys into the blob, and persist it
// so every subsequent load is list-free. We write the blob even when a page has
// no pins (empty array) — that "page with no comments" case was the bulk of the
// old list volume, and writing an empty blob stops it from listing on each load.
// Legacy keys are left in place (harmless, tiny) rather than deleted, so the
// migration is idempotent and self-heals if a blob write ever fails.
async function readPins(env, pageUrl) {
  const blob = await env.PINS_KV.get(pinsKey(pageUrl), 'json');
  if (blob !== null) return Array.isArray(blob) ? blob : [];
  const migrated = await collectLegacyPins(env, pageUrl);
  await writePins(env, pageUrl, migrated);
  return migrated;
}

// One-time migration helper: gather any legacy `pin:<url>:<id>` keys for a page.
// This is the only remaining list() in the pin path and runs at most once per
// page (until its blob exists).
async function collectLegacyPins(env, pageUrl) {
  const prefix = legacyPinPrefix(pageUrl);
  const out = [];
  let cursor;
  do {
    const res = await env.PINS_KV.list({ prefix, cursor });
    for (const key of res.keys) {
      const pin = await env.PINS_KV.get(key.name, 'json');
      if (pin) out.push(pin);
    }
    cursor = res.cursor;
    if (res.list_complete) break;
  } while (cursor);
  return out;
}

async function writePins(env, pageUrl, pins) {
  await env.PINS_KV.put(pinsKey(pageUrl), JSON.stringify(pins));
}

// Locate a single pin within a page's blob. Returns { pins, idx } so callers can
// mutate the entry in place and write the whole array back, or null if not found.
async function findPin(env, pageUrl, id) {
  const pins = await readPins(env, pageUrl);
  const idx = pins.findIndex(p => p && p.id === id);
  return idx === -1 ? null : { pins, idx };
}

// --- Activity log (append-only, retained ~90 days) ---------------------------
// Records are never mutated, only appended, and auto-expire after a rolling
// retention window (LOG_TTL_SECONDS) so the store stays small — listLog reads
// every entry on each view, so unbounded growth would inflate metered reads.
// Only 'created' events are written: deletions are intentionally not logged (a
// deleted comment should leave no trail), and status churn like done/edit/reply
// lives on the pin itself, not as separate events. This also keeps KV writes low.
// Keyed by ISO timestamp so KV's lexicographic list() returns them in
// chronological order; the viewer sorts newest-first.

async function logEvent(env, { action, author, product, url, pinId, comment, parent }) {
  const ts = new Date().toISOString();
  const evt = {
    ts,
    action,                                   // created
    author: author || 'anonymous',
    product: product || '',
    url: url || '',
    pinId: pinId || '',
    comment: truncate(comment || '', 200),
    parent: truncate(parent || '', 200),      // for replies: the root comment being replied to
  };
  // rand suffix avoids key collisions when two events share a millisecond.
  const rand = Math.random().toString(36).slice(2, 8);
  try {
    // Retention: entries auto-expire after LOG_TTL_SECONDS so the log can't grow
    // without bound — which matters because listLog reads EVERY entry on each
    // view, and reads are also metered. A rolling ~90-day window is plenty of
    // history for a prototyping tool.
    await env.PINS_KV.put(`log:${ts}:${rand}`, JSON.stringify(evt), { expirationTtl: LOG_TTL_SECONDS });
  } catch (err) {
    console.log(`[log] KV write failed: ${err.message}`);
  }
}

async function listLog(url, env) {
  const limit = Math.min(Number(url.searchParams.get('limit')) || 500, 2000);
  const fAction = (url.searchParams.get('action') || '').trim();
  const fProduct = (url.searchParams.get('product') || '').trim();
  const fUrl = (url.searchParams.get('url') || '').trim();

  const events = [];
  let cursor;
  do {
    const res = await env.PINS_KV.list({ prefix: 'log:', cursor });
    for (const key of res.keys) {
      const evt = await env.PINS_KV.get(key.name, 'json');
      if (!evt) continue;
      if (fAction && evt.action !== fAction) continue;
      if (fProduct && evt.product !== fProduct) continue;
      if (fUrl && evt.url !== fUrl) continue;
      events.push(evt);
    }
    cursor = res.cursor;
    if (res.list_complete) break;
  } while (cursor);

  // Newest first; cap at limit.
  events.sort((a, b) => b.ts.localeCompare(a.ts));
  return json({ events: events.slice(0, limit), total: events.length });
}

// --- Handlers ----------------------------------------------------------------

async function listPins(url, env) {
  const pageUrl = url.searchParams.get('url');
  if (!pageUrl) return json({ error: 'Missing url' }, 400);
  const out = (await readPins(env, pageUrl))
    .filter(pin => pin && !pin.deleted)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return json({ pins: out });
}

async function createPin(request, env) {
  const body = await request.json();
  for (const k of ['url', 'selector', 'author', 'comment']) {
    if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
  }
  const id = `pin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const pin = {
    id,
    url: body.url,
    product: body.product || '',
    selector: body.selector,
    elementText: (body.elementText || '').slice(0, 200),
    elementHtml: (body.elementHtml || '').slice(0, 500),
    dataFile: (body.dataFile || '').slice(0, 300),
    dataLine: (body.dataLine || '').toString().slice(0, 10),
    x: Number(body.x) || 0,
    y: Number(body.y) || 0,
    relX: body.relX != null ? Number(body.relX) : null,
    relY: body.relY != null ? Number(body.relY) : null,
    // Interaction state the comment was left in (active toggle-group members:
    // version switcher, tabs, nav, etc.). The widget only pins the comment when
    // the page is back in this state; otherwise it lists in the side drawer.
    viewState: cleanViewState(body.viewState),
    // The click path the reviewer took from page load to this comment. The
    // widget's "Go" navigation replays it from a fresh load to reach steps that
    // toggle-state restore can't (modals, wizard steps, innerHTML-built screens).
    trail: cleanTrail(body.trail),
    screenshot: body.screenshot || '',
    comment: body.comment,
    author: body.author,
    timestamp: new Date().toISOString(),
    done: false,
    deleted: false,
    thread: []
  };
  const pins = await readPins(env, pin.url);
  pins.push(pin);
  await writePins(env, pin.url, pins);
  await logEvent(env, { action: 'created', author: pin.author, product: pin.product, url: pin.url, pinId: id, comment: pin.comment });
  return json({ pin }, 201);
}

async function updatePin(id, request, env) {
  const body = await request.json();
  if (!body.url) return json({ error: 'Missing url' }, 400);
  const found = await findPin(env, body.url, id);
  if (!found) return json({ error: 'Pin not found' }, 404);
  const { pins, idx } = found;
  const pin = pins[idx];
  const author = body.author || pin.author;

  const prevDone = pin.done, prevDeleted = pin.deleted;
  let stashUndo = false;

  if (body.done !== undefined && body.done !== pin.done) {
    if (body.done === true) stashUndo = true;
    pin.done = body.done;
  }
  if (body.deleted !== undefined && body.deleted !== pin.deleted) {
    if (body.deleted === true) stashUndo = true;
    pin.deleted = body.deleted;
  }
  if (body.comment !== undefined && body.comment !== pin.comment) {
    pin.comment = body.comment;
  }
  if (body.x !== undefined) pin.x = Number(body.x);
  if (body.y !== undefined) pin.y = Number(body.y);

  // Re-anchoring: a dragged pin can land on a different element, so the
  // selector / element text / relative offset travel with the move.
  const prevSelector = pin.selector;
  if (body.selector !== undefined) pin.selector = body.selector;
  if (body.elementText !== undefined) pin.elementText = String(body.elementText).slice(0, 200);
  if (body.elementHtml !== undefined) pin.elementHtml = String(body.elementHtml).slice(0, 500);
  if (body.dataFile !== undefined) pin.dataFile = String(body.dataFile).slice(0, 300);
  if (body.dataLine !== undefined) pin.dataLine = String(body.dataLine).slice(0, 10);
  // Screenshot updates land via a follow-up PATCH after drag-to-re-pin
  // (recaptured by the widget once html2canvas finishes). Only overwrite when
  // the client sent a non-empty value so a failed capture can't blank out the
  // existing image.
  if (body.screenshot !== undefined && body.screenshot) pin.screenshot = body.screenshot;
  if (body.relX !== undefined) pin.relX = body.relX != null ? Number(body.relX) : null;
  if (body.relY !== undefined) pin.relY = body.relY != null ? Number(body.relY) : null;
  // A move/re-anchor recaptures the interaction state, so accept a replacement.
  if (body.viewState !== undefined) pin.viewState = cleanViewState(body.viewState);
  if (body.trail !== undefined) pin.trail = cleanTrail(body.trail);
  // Re-anchoring to a different element invalidates the recorded click path
  // (it led to the OLD element). A current widget always PATCHes a fresh trail
  // alongside the new selector; an older cached widget re-anchors WITHOUT a
  // trail field — drop the stale one rather than leave a path that now points
  // somewhere unrelated. (A pure metadata edit — comment/done/etc. with no new
  // selector — keeps the trail.)
  else if (body.selector !== undefined && body.selector !== prevSelector) pin.trail = [];

  await writePins(env, body.url, pins);

  if (stashUndo) {
    const undoVal = {
      prevDone, prevDeleted, url: body.url, pinId: id,
      undoExpiresAt: Date.now() + 10000
    };
    await env.PINS_KV.put(undoKey(id), JSON.stringify(undoVal), { expirationTtl: 60 });
  }

  // Deletions are intentionally NOT logged — a deleted comment should just be
  // gone, with no activity-log trail. (We still keep the undo stash above as the
  // accidental-delete safety net.) Status churn — done, reopen, edit, restore,
  // move — isn't logged either; the pin always carries its current state. Only
  // 'created' is written to the activity log (in createPin), which also keeps us
  // well under the KV free-tier write budget.

  return json({ pin });
}

async function undoPin(id, request, env) {
  const undoData = await env.PINS_KV.get(undoKey(id), 'json');
  if (!undoData || undoData.undoExpiresAt < Date.now()) {
    return json({ error: 'Undo window has expired' }, 409);
  }
  const found = await findPin(env, undoData.url, undoData.pinId);
  if (!found) return json({ error: 'Pin not found' }, 404);
  const { pins, idx } = found;
  pins[idx].done = undoData.prevDone;
  pins[idx].deleted = undoData.prevDeleted;
  await writePins(env, undoData.url, pins);
  await env.PINS_KV.delete(undoKey(id));
  // Undo is not logged separately (KV write budget).
  return json({ pin: pins[idx] });
}

async function replyToPin(id, request, env) {
  const body = await request.json();
  if (!body.url || !body.author || !body.text) return json({ error: 'Missing url, author, or text' }, 400);
  const found = await findPin(env, body.url, id);
  if (!found) return json({ error: 'Pin not found' }, 404);
  const { pins, idx } = found;
  const reply = {
    id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author: body.author,
    text: body.text,
    timestamp: new Date().toISOString()
  };
  pins[idx].thread = pins[idx].thread || [];
  pins[idx].thread.push(reply);
  await writePins(env, body.url, pins);
  // Replies are not logged separately (KV write budget) — they live on the pin.
  return json({ pin: pins[idx] });
}

// --- Settings (per-URL admin toggles) ----------------------------------------

async function getSettings(url, env) {
  const pageUrl = url.searchParams.get('url');
  if (!pageUrl) return json({ error: 'Missing url' }, 400);
  const stored = await env.PINS_KV.get(settingsKey(pageUrl), 'json');
  return json({ settings: { ...DEFAULT_SETTINGS, ...(stored || {}) } });
}

async function patchSettings(request, env) {
  const body = await request.json();
  if (!body.url) return json({ error: 'Missing url' }, 400);
  const key = settingsKey(body.url);
  const stored = (await env.PINS_KV.get(key, 'json')) || { ...DEFAULT_SETTINGS };
  if (typeof body.visitorMode === 'boolean') stored.visitorMode = body.visitorMode;
  if (typeof body.commentsDisabled === 'boolean') stored.commentsDisabled = body.commentsDisabled;
  await env.PINS_KV.put(key, JSON.stringify(stored));
  // Mode changes (visitor mode / disable comments) are admin housekeeping, not
  // feedback activity — intentionally not logged.
  return json({ settings: stored });
}

function truncate(s, n) { s = s || ''; return s.length > n ? s.slice(0, n) + '…' : s; }

// Sanitize the interaction-state snapshot sent by the widget. It's an array of
// { sel, text } descriptors (one per active toggle-group member). We cap the
// count and string lengths and drop anything malformed — it's display/matching
// metadata, never executed, so light validation is enough.
// Hard cap on how many array entries we'll even look at, independent of how
// many survive validation — so a pathological body (100k junk entries) can't
// spin the loop. Both cleaners keep at most 16/40 valid entries anyway.
const MAX_SCAN = 2000;

function cleanViewState(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const item of v.slice(0, MAX_SCAN)) {
    if (!item || typeof item !== 'object') continue;
    const sel = String(item.sel || '').slice(0, 400);
    if (!sel) continue;
    out.push({ sel, text: String(item.text || '').slice(0, 80) });
    if (out.length >= 16) break;
  }
  return out;
}

// Sanitize the click trail sent by the widget: an ordered array of
// { s: selector, t: control text } steps recorded from the reviewer's real
// clicks. Same posture as cleanViewState — replayed metadata, never executed
// as code — so cap counts and lengths and drop anything malformed.
function cleanTrail(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const item of v.slice(0, MAX_SCAN)) {
    if (!item || typeof item !== 'object') continue;
    const s = String(item.s || '').slice(0, 400);
    if (!s) continue;
    out.push({ s, t: String(item.t || '').slice(0, 80) });
    if (out.length >= 40) break;
  }
  return out;
}
