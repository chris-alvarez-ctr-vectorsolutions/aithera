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
//   pin:<encoded-url>:<pin-id>   JSON Pin
//   undo:<pin-id>                JSON { prevDone, prevDeleted, key, undoExpiresAt }  TTL 60s
//                                (10s logical TTL enforced via undoExpiresAt; KV min TTL is 60s)
//   log:<iso-timestamp>:<rand>   JSON Event  — append-only, never mutated; auto-
//                                expires after a ~90-day retention window (TTL).
//                                Only lifecycle bookends are logged to conserve KV
//                                writes: 'created' and 'deleted'.

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

const pinKey = (pageUrl, id) => `pin:${encodeURIComponent(pageUrl)}:${id}`;
const undoKey = (id) => `undo:${id}`;
const settingsKey = (pageUrl) => `settings:${encodeURIComponent(pageUrl)}`;
const DEFAULT_SETTINGS = { visitorMode: false, commentsDisabled: false };

async function getPin(env, pageUrl, id) {
  const key = pinKey(pageUrl, id);
  const pin = await env.PINS_KV.get(key, 'json');
  return pin ? { key, pin } : null;
}

// --- Activity log (append-only, retained ~90 days) ---------------------------
// Records are never mutated, only appended, and auto-expire after a rolling
// retention window (LOG_TTL_SECONDS) so the store stays small — listLog reads
// every entry on each view, so unbounded growth would inflate metered reads.
// To conserve KV writes, only 'created' and 'deleted' events are written (status
// churn like done/edit/reply lives on the pin itself, not as separate events).
// Keyed by ISO timestamp so KV's lexicographic list() returns them in
// chronological order; the viewer sorts newest-first.

async function logEvent(env, { action, author, product, url, pinId, comment, parent }) {
  const ts = new Date().toISOString();
  const evt = {
    ts,
    action,                                   // created | deleted
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
  const prefix = `pin:${encodeURIComponent(pageUrl)}:`;
  const out = [];
  let cursor;
  do {
    const res = await env.PINS_KV.list({ prefix, cursor });
    for (const key of res.keys) {
      const pin = await env.PINS_KV.get(key.name, 'json');
      if (pin && !pin.deleted) out.push(pin);
    }
    cursor = res.cursor;
    if (res.list_complete) break;
  } while (cursor);
  out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
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
    screenshot: body.screenshot || '',
    comment: body.comment,
    author: body.author,
    timestamp: new Date().toISOString(),
    done: false,
    deleted: false,
    thread: []
  };
  await env.PINS_KV.put(pinKey(pin.url, id), JSON.stringify(pin));
  await logEvent(env, { action: 'created', author: pin.author, product: pin.product, url: pin.url, pinId: id, comment: pin.comment });
  return json({ pin }, 201);
}

async function updatePin(id, request, env) {
  const body = await request.json();
  if (!body.url) return json({ error: 'Missing url' }, 400);
  const found = await getPin(env, body.url, id);
  if (!found) return json({ error: 'Pin not found' }, 404);
  const { key, pin } = found;
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

  await env.PINS_KV.put(key, JSON.stringify(pin));

  if (stashUndo) {
    const undoVal = {
      prevDone, prevDeleted, key,
      undoExpiresAt: Date.now() + 10000
    };
    await env.PINS_KV.put(undoKey(id), JSON.stringify(undoVal), { expirationTtl: 60 });
  }

  // KV write budget: the free tier allows only 1,000 writes/day, and a separate
  // log entry on every action doubles that cost. So we log only the lifecycle
  // bookends — created (in createPin) and deleted (here). Status churn (done,
  // reopen, edit, restore, move) updates the pin but is NOT written as its own
  // log event; the pin itself always carries the current state. The undo stash
  // for done/delete is kept (it's the accidental-delete safety net).
  if (body.deleted === true && prevDeleted !== true) {
    await logEvent(env, { action: 'deleted', author, product: pin.product, url: pin.url, pinId: id, comment: pin.comment });
  }

  return json({ pin });
}

async function undoPin(id, request, env) {
  const undoData = await env.PINS_KV.get(undoKey(id), 'json');
  if (!undoData || undoData.undoExpiresAt < Date.now()) {
    return json({ error: 'Undo window has expired' }, 409);
  }
  const pin = await env.PINS_KV.get(undoData.key, 'json');
  if (!pin) return json({ error: 'Pin not found' }, 404);
  pin.done = undoData.prevDone;
  pin.deleted = undoData.prevDeleted;
  await env.PINS_KV.put(undoData.key, JSON.stringify(pin));
  await env.PINS_KV.delete(undoKey(id));
  // Undo is not logged separately (KV write budget).
  return json({ pin });
}

async function replyToPin(id, request, env) {
  const body = await request.json();
  if (!body.url || !body.author || !body.text) return json({ error: 'Missing url, author, or text' }, 400);
  const found = await getPin(env, body.url, id);
  if (!found) return json({ error: 'Pin not found' }, 404);
  const { key, pin } = found;
  const reply = {
    id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author: body.author,
    text: body.text,
    timestamp: new Date().toISOString()
  };
  pin.thread = pin.thread || [];
  pin.thread.push(reply);
  await env.PINS_KV.put(key, JSON.stringify(pin));
  // Replies are not logged separately (KV write budget) — they live on the pin.
  return json({ pin });
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
function cleanViewState(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') continue;
    const sel = String(item.sel || '').slice(0, 400);
    if (!sel) continue;
    out.push({ sel, text: String(item.text || '').slice(0, 80) });
    if (out.length >= 16) break;
  }
  return out;
}
