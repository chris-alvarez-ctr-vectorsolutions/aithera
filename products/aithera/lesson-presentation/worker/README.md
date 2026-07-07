# Action Practice — Live AI proxy (Cloudflare Worker)

`action-practice-live.html` talks to a real Claude model. Static pages can't
hold an API key, so a tiny Cloudflare Worker sits in the middle: the page sends
the conversation to the Worker, the Worker attaches the key (stored as a
Cloudflare secret) and forwards it to the Anthropic API.

You only do this setup **once**. After that, iterating on prompts is just
editing the HTML file — no redeploys needed.

---

## What you need

1. A **Cloudflare account** — free tier is plenty (100,000 requests/day).
   Sign up at https://dash.cloudflare.com/sign-up
2. An **Anthropic API key** — from https://console.anthropic.com → API Keys.
   If Vector already has an org account, ask for a key scoped to prototyping
   rather than creating a personal one.

## Setup — dashboard path (no tools to install, ~5 minutes)

1. Log in at https://dash.cloudflare.com
2. Left sidebar → **Workers & Pages** → **Create** → **Create Worker**
3. Give it a name, e.g. `aithera-action-proxy` → **Deploy** (it deploys a
   hello-world first; that's expected)
4. Click **Edit code**, delete the placeholder, paste in the full contents of
   `worker.js` from this folder → **Deploy**
5. Back on the Worker's page → **Settings** → **Variables and Secrets** →
   **Add** → type **Secret** → name `ANTHROPIC_API_KEY`, value = your API key
   → **Deploy**
6. Copy the Worker URL shown at the top — it looks like
   `https://aithera-action-proxy.<your-subdomain>.workers.dev`

## Wire the page to it

In `action-practice-live.html`, find this line near the top of the script:

```js
const WORKER_URL = '';   // e.g. 'https://action-proxy.<you>.workers.dev'
```

Paste your Worker URL between the quotes. That's it — the page detects the URL
and switches from the scripted demo engine to live Claude.

## One safety check

`worker.js` has an `ALLOWED_ORIGINS` list near the top. It controls which
websites' pages may call your Worker from a browser. It ships with localhost
(for local preview) and `vectorlearning.github.io`. If the prototype is served
from anywhere else, add that origin and re-deploy the Worker.

The Worker also refuses unknown models and caps response length, so a stranger
who discovers the URL can't run up the bill in interesting ways — but the URL
is still a lightly-guarded door to a paid API. Fine for a prototype; don't
ship it as-is.

## Setup — CLI path (optional, for the terminal-inclined)

```sh
npm install -g wrangler
cd products/aithera/lesson-presentation/worker
wrangler login
wrangler deploy
wrangler secret put ANTHROPIC_API_KEY   # paste the key when prompted
```

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Browser console shows a CORS error | Your page's origin isn't in `ALLOWED_ORIGINS` in worker.js |
| `401` from the Worker | `ANTHROPIC_API_KEY` secret missing or wrong — re-add it and Deploy |
| `Model not allowed` | The page requests a model that isn't in `ALLOWED_MODELS` in worker.js |
| Coach replies with the same fallback line every time | The model returned something the page couldn't parse — check the browser console for the raw response |
