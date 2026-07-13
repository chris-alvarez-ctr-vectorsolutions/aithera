/* =========================================================================
   AITHERA ACTION-PRACTICE PROXY — Cloudflare Worker

   Why this exists: action-practice-live.html is a static page (GitHub Pages),
   and a static page can never hold an API key safely. This Worker sits in
   the middle: the page POSTs the conversation here, the Worker attaches the
   Anthropic API key (stored as a Cloudflare secret, never in the browser),
   forwards the request to the Anthropic Messages API, and returns the reply.

       browser page  ──POST──▶  this Worker  ──POST──▶  api.anthropic.com
                     ◀──JSON──              ◀──JSON──

   Deploy steps are in README.md next to this file.
   ========================================================================= */

// Models the page is allowed to request. Anything else is rejected so a
// stranger who finds the Worker URL can't run expensive models on our key.
const ALLOWED_MODELS = [
  'claude-sonnet-4-6',
  'claude-sonnet-5',
  'claude-opus-4-8',
  'claude-haiku-4-5',
];

// Hard ceiling on response length, whatever the page asks for.
const MAX_TOKENS_CAP = 2000;

// Origins allowed to call this Worker from a browser. Add your GitHub Pages
// origin here once you know it. Leave the localhost entries for local preview.
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:4599',
  'http://127.0.0.1:4599',
  'http://localhost:4601',
  'http://127.0.0.1:4601',
  'https://vectorlearning.github.io',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // Browser pre-flight check — answer it and stop.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return new Response('POST only', { status: 405, headers: corsHeaders(origin) });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Body must be JSON' }, 400, origin);
    }

    // ---- Guardrails: this endpoint is public, so validate everything ----
    if (!ALLOWED_MODELS.includes(body.model)) {
      return json({ error: 'Model not allowed' }, 400, origin);
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return json({ error: 'messages[] required' }, 400, origin);
    }
    // Keep request sizes sane (a real conversation never gets near these).
    const totalChars = JSON.stringify(body.messages).length + String(body.system || '').length;
    if (totalChars > 120_000) {
      return json({ error: 'Conversation too large' }, 413, origin);
    }

    // ---- Forward to the Anthropic Messages API ----
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY, // the Cloudflare secret — set via dashboard or `wrangler secret put`
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model,
        max_tokens: Math.min(Number(body.max_tokens) || 1200, MAX_TOKENS_CAP),
        system: body.system,
        messages: body.messages,
      }),
    });

    // Pass the Anthropic response straight through (status + JSON body),
    // adding CORS headers so the browser is allowed to read it.
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
