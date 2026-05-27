// Cloudflare Worker for the ux-mockups feedback widget.
//
// Endpoints:
//   GET    /pins?url=<encoded-page-url>
//   POST   /pins
//   PATCH  /pins/:id            body: { url, author?, done?, deleted?, comment? }
//   POST   /pins/:id/undo       body: { url, author? }
//   POST   /pins/:id/replies    body: { url, author, text }
//
// KV layout:
//   pin:<encoded-url>:<pin-id>   JSON Pin
//   undo:<pin-id>                JSON { prevDone, prevDeleted, key, undoExpiresAt }  TTL 60s
//                                (10s logical TTL enforced via undoExpiresAt; KV min TTL is 60s)

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
  await logToConfluence(env,
    `New feedback from ${pin.author} on ${pin.product || pin.url} — ${truncate(pin.comment, 100)}`,
    pin.url);
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

  if (body.done === true)    await logToConfluence(env, `Marked done by ${author} — pin ${id}`, pin.url);
  if (body.deleted === true) await logToConfluence(env, `Deleted by ${author} — pin ${id}`, pin.url);
  if (body.comment !== undefined && body.comment !== prevComment) {
    await logToConfluence(env, `Edited by ${author} — pin ${id} — ${truncate(pin.comment, 100)}`, pin.url);
  }
  if (body.selector !== undefined && body.selector !== prevSelector) {
    await logToConfluence(env, `Re-anchored by ${author} — pin ${id} — now ${truncate(pin.selector, 100)}`, pin.url);
  }

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
  await logToConfluence(env, `Undone by ${author} — pin ${id}`, pin.url);
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
  await logToConfluence(env, `Reply from ${reply.author} on pin ${id}: ${truncate(reply.text, 100)}`, pin.url);
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
  const author = body.author || 'admin';
  await logToConfluence(env,
    `Settings changed by ${author} — visitorMode=${stored.visitorMode}, commentsDisabled=${stored.commentsDisabled}`,
    body.url);
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
