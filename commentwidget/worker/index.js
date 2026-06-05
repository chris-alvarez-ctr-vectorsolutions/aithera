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
//   log:<iso-timestamp>:<rand>   JSON Event  — append-only, never mutated or deleted.
//                                A delete is a logged event, not an erasure, so the
//                                history survives even when the pin is soft-deleted.

const JSON_HEADERS = { 'content-type': 'application/json' };

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

// --- Activity log (append-only) ----------------------------------------------
// Every meaningful action writes one immutable Event. Records are NEVER updated
// or deleted, so the log is a true history — a deleted pin still has its
// create/edit/delete events. Keyed by ISO timestamp so KV's lexicographic
// list() returns them in chronological order; the viewer sorts newest-first.

async function logEvent(env, { action, author, product, url, pinId, comment, parent }) {
  const ts = new Date().toISOString();
  const evt = {
    ts,
    action,                                   // created | edited | done | reopened | deleted | restored | reply | re-anchored | settings | undo
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
    await env.PINS_KV.put(`log:${ts}:${rand}`, JSON.stringify(evt));
  } catch (err) {
    console.log(`[log] KV write failed: ${err.message}`);
  }
  // Mirror to Confluence so the existing audit page keeps working.
  await logToConfluence(env, formatLogMessage(evt), url);
}

function formatLogMessage(e) {
  const who = e.author;
  const where = e.product || e.url;
  switch (e.action) {
    case 'created':     return `New feedback from ${who} on ${where} — ${truncate(e.comment, 100)}`;
    case 'edited':      return `Edited by ${who} — pin ${e.pinId} — ${truncate(e.comment, 100)}`;
    case 'done':        return `Marked done by ${who} — pin ${e.pinId}`;
    case 'reopened':    return `Reopened by ${who} — pin ${e.pinId}`;
    case 'deleted':     return `Deleted by ${who} — pin ${e.pinId}`;
    case 'restored':    return `Restored by ${who} — pin ${e.pinId}`;
    case 're-anchored': return `Re-anchored by ${who} — pin ${e.pinId} — now ${truncate(e.comment, 100)}`;
    case 'reply':       return `Reply from ${who}${e.parent ? ` to "${truncate(e.parent, 60)}"` : ` on pin ${e.pinId}`}: ${truncate(e.comment, 100)}`;
    case 'undo':        return `Undone by ${who} — pin ${e.pinId}`;
    case 'settings':    return `Settings changed by ${who} — ${e.comment}`;
    default:            return `${e.action} by ${who} — pin ${e.pinId}`;
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

  const prevDone = pin.done, prevDeleted = pin.deleted, prevComment = pin.comment;
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

  await env.PINS_KV.put(key, JSON.stringify(pin));

  if (stashUndo) {
    const undoVal = {
      prevDone, prevDeleted, key,
      undoExpiresAt: Date.now() + 10000
    };
    await env.PINS_KV.put(undoKey(id), JSON.stringify(undoVal), { expirationTtl: 60 });
  }

  const ev = (action, comment) => logEvent(env, { action, author, product: pin.product, url: pin.url, pinId: id, comment });
  // Carry the comment text on every state change so the log row is identifiable
  // (e.g. filtering action=done shows *which* comments were resolved, not just
  // opaque pin ids).
  if (body.done !== undefined && body.done !== prevDone)       await ev(body.done ? 'done' : 'reopened', pin.comment);
  if (body.deleted !== undefined && body.deleted !== prevDeleted) await ev(body.deleted ? 'deleted' : 'restored', pin.comment);
  if (body.comment !== undefined && body.comment !== prevComment) await ev('edited', pin.comment);
  // Moving/re-anchoring a pin is not logged — it's housekeeping, not feedback.

  return json({ pin });
}

async function undoPin(id, request, env) {
  const body = await request.json().catch(() => ({}));
  const author = body.author || 'anonymous';
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
  await logEvent(env, { action: 'undo', author, product: pin.product, url: pin.url, pinId: id });
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
  await logEvent(env, { action: 'reply', author: reply.author, product: pin.product, url: pin.url, pinId: id, comment: reply.text, parent: pin.comment });
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

// --- Confluence (append entry to page body) ----------------------------------

async function logToConfluence(env, message, pageUrl) {
  if (!env.CONFLUENCE_TOKEN || !env.CONFLUENCE_DOMAIN || !env.CONFLUENCE_PAGE_ID || !env.CONFLUENCE_EMAIL) {
    console.log('[confluence] skipped — missing secret(s)');
    return;
  }
  const baseUrl = `https://${env.CONFLUENCE_DOMAIN}/wiki/rest/api/content/${env.CONFLUENCE_PAGE_ID}`;
  const auth = 'Basic ' + btoa(`${env.CONFLUENCE_EMAIL}:${env.CONFLUENCE_TOKEN}`);

  const getRes = await fetch(`${baseUrl}?expand=body.storage,version`, {
    headers: { authorization: auth, accept: 'application/json' }
  });
  if (!getRes.ok) {
    const errBody = await getRes.text().catch(() => '');
    console.log(`[confluence] GET failed ${getRes.status} ${getRes.statusText}: ${errBody.slice(0, 300)}`);
    return;
  }
  const page = await getRes.json();

  const ts = new Date().toISOString();
  const link = pageUrl ? ` <a href="${escapeXml(pageUrl)}">${escapeXml(pageUrl)}</a>` : '';
  const entry = `<p><strong>${ts}</strong> — ${escapeXml(message)}${link}</p>`;
  const newBody = (page.body?.storage?.value || '') + entry;

  const putRes = await fetch(baseUrl, {
    method: 'PUT',
    headers: { authorization: auth, 'content-type': 'application/json' },
    body: JSON.stringify({
      id: env.CONFLUENCE_PAGE_ID,
      type: 'page',
      title: page.title,
      version: { number: (page.version?.number || 1) + 1 },
      body: { storage: { value: newBody, representation: 'storage' } }
    })
  });
  if (!putRes.ok) {
    const errBody = await putRes.text().catch(() => '');
    console.log(`[confluence] PUT failed ${putRes.status} ${putRes.statusText}: ${errBody.slice(0, 300)}`);
  } else {
    console.log(`[confluence] appended OK (page v${(page.version?.number || 1) + 1})`);
  }
}

function truncate(s, n) { s = s || ''; return s.length > n ? s.slice(0, n) + '…' : s; }
function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;' }[c]));
}
