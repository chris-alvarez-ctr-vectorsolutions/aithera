# Feedback Widget

A drop-in visual feedback widget for the `ux-mockups` GitHub Pages site. Anyone visiting a mockup can drop pins on the page, leave a comment, reply in a thread, mark items done, or delete them. All pin state lives in Cloudflare KV (so every teammate sees the same pins) and every action is logged to a Confluence page as a permanent receipt.

There is no login flow — users type their name once and it is remembered in `localStorage`.

## Embed

Add this one line before `</body>` in any mockup HTML file:

```html
<script src="/commentwidget/feedback-widget.js"></script>
```

That's it. A "＋ Add feedback" toolbar appears bottom-right of the page.

## Architecture

```
Mockup HTML ──▶ feedback-widget.js ──▶ Cloudflare Worker ──▶ Cloudflare KV
                                              │
                                              └──▶ Confluence (logs)
```

- HTML mockups are static and never modified by the widget.
- Pins and threads live in Cloudflare KV — shared across all viewers.
- The Worker is the only thing that talks to KV and Confluence.
- The widget only talks to the Worker.

## Files

| File | Purpose |
|---|---|
| `feedback-widget.js` | The widget itself — single self-contained file embedded on each mockup. |
| `worker/index.js` | Cloudflare Worker handling the API. |
| `worker/wrangler.toml` | Worker config (KV binding, env vars). |

## Deploy the Worker

You only need to do this once.

### 1. Install Wrangler and authenticate

```bash
npm install -g wrangler
wrangler login
```

### 2. Create the KV namespace

```bash
cd commentwidget/worker
wrangler kv:namespace create PINS_KV
```

Wrangler prints something like:

```
🌀 Creating namespace with title "ux-mockups-feedback-PINS_KV"
✨ Success!
Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "PINS_KV"
id = "abc123..."
```

Copy that `id` value into `wrangler.toml`, replacing `REPLACE_WITH_KV_NAMESPACE_ID`.

### 3. Set the Confluence secrets

```bash
wrangler secret put CONFLUENCE_TOKEN
wrangler secret put CONFLUENCE_EMAIL
```

`CONFLUENCE_TOKEN` is an Atlassian API token created at:
https://id.atlassian.com/manage-profile/security/api-tokens

`CONFLUENCE_EMAIL` is the email address associated with that token.

### 4. Verify the other env vars

The non-secret vars are already set in `wrangler.toml`. Confirm they're correct for your setup:

| Var | Default | Notes |
|---|---|---|
| `CONFLUENCE_DOMAIN` | `lmsportal.atlassian.net` | Confluence Cloud domain, no protocol. |
| `CONFLUENCE_PAGE_ID` | `28919529490` | Page the Worker appends log entries to. |
| `ALLOWED_ORIGIN` | GitHub Pages + localhost | Comma-separated CORS allowlist. Add any new origin that needs to call the Worker. |

#### How to find a Confluence page ID

Open the Confluence page in a browser. The URL looks like:

```
https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/28919529490/Designer+Workflow+...
```

The number between `/pages/` and the title slug is the page ID. In the current setup that page is:

https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/28919529490/Designer+Workflow+Claude+Code+VS+Code

#### Setting the allowed origin

`ALLOWED_ORIGIN` is a comma-separated list of origins the Worker accepts requests from. Include every domain the widget will be embedded on, plus localhost for testing:

```toml
ALLOWED_ORIGIN = "https://vectorlearning.github.io,http://localhost:8000,http://127.0.0.1:8000"
```

GitHub Pages projects sit under `https://<org>.github.io` — the path doesn't matter, only the origin (scheme + host + port).

### 5. Deploy

```bash
wrangler deploy
```

Wrangler prints the deployed Worker URL, e.g.:

```
https://ux-mockups-feedback.<your-account>.workers.dev
```

### 6. Point the widget at the Worker

Open `commentwidget/feedback-widget.js` and replace the `CW_WORKER_URL` constant near the top with the Worker URL from the previous step:

```js
const CW_WORKER_URL = 'https://ux-mockups-feedback.<your-account>.workers.dev';
```

Commit and push. GitHub Pages will serve the updated widget on next deploy.

## Updating the widget

1. Edit `commentwidget/feedback-widget.js`.
2. Bump the `WIDGET_VERSION` constant at the top.
3. Commit and push. Pages will pick up the new file.

Browsers may cache the widget aggressively. If teammates aren't seeing the update, ask them to hard-reload (Cmd+Shift+R) or add a cache-busting query string when embedding (`?v=1.0.1`).

## How it behaves

- **On load**, the widget fetches all non-deleted pins for the current page URL and draws them.
- **Pin dot**: colored circle with the author's first initial. Click to open the detail panel.
- **Element-anchored**: each pin stores its target element's selector plus a relative offset (`relX`/`relY`) inside that element's box. Dots are positioned from the element's live bounding rect, so they scroll and reflow with the page instead of floating at a fixed spot.
- **Drag to re-pin**: drag a dot onto another element either (a) in comment mode, or (b) while that pin's detail panel is open. The element under the cursor is outlined as you drag; on drop the pin re-anchors — its `selector`, `elementText`, `elementHtml`, `dataFile`/`dataLine`, and offset are recaptured immediately (so the "Copy for Claude Code" prompt and "Open in VS Code" button both point at the new element). The screenshot is recaptured asynchronously in the background and PATCHed back once html2canvas finishes — the drop confirmation isn't blocked on it, and the panel auto-refreshes when the new image lands. If the user drags the same pin again before the previous capture completes, the stale capture is discarded. If the panel was open during the drag, it re-renders against the new anchor.
- **Copy for Claude Code**: the panel's "✨ Copy for Claude Code" button copies a structured prompt — file path, the element's opening HTML tag, its inner text, and the CSS selector hint — telling Claude Code to Grep for the line first, then apply the feedback. The HTML tag is the most grep-friendly needle and is the strongest signal Claude Code gets to land on the right line. If the pinned element is annotated with `data-file`/`data-line` (see Source-Inspector annotations below), the prompt names the exact `file:line` outright.
- **Open in VS Code**: a "📂 Open in VS Code" button appears alongside the Claude prompt button whenever the pinned element has `data-file` + `data-line` attributes (added by `scripts/annotate-source.py`, documented in [`SOURCE-INSPECTOR.md`](../SOURCE-INSPECTOR.md)). Clicking it opens the exact line in your local VS Code via the `vscode://file/<abs>:<line>` URL handler. The first click prompts you for your local repo-root path (e.g. `/Users/you/code/ux-mockups`) — that's saved in `localStorage` (`cw-repo-root`) per browser so you only do it once. To reset it: `localStorage.removeItem("cw-repo-root")`.
  - **Static-HTML mockups** are fully supported once annotated. Re-run the annotation script after edits when line numbers drift.
  - **React/SPA-style mockups** (anything that renders the UI from JSX inside `<script type="text/babel">`, e.g. `Scheduling/Rules engine only/`) have only their static shell annotated — the runtime React elements aren't tagged. For those, the VS Code button (when present) points at the shell line; "Copy for Claude Code" is the more useful path because Claude Code can grep the JSX source for the `HTML:` or `text:` needle.
- **Done pins** render muted with a checkmark and stay visible until the next page refresh.
- **Deleted pins** are soft-deleted (`deleted: true` in KV) and never shown.
- **Stranded pins**: if a pin's CSS selector no longer matches anything on the page (mockup changed), the pin can't be placed on the canvas. **Admins** see a small sidebar listing the stranded pins so they can open and delete (or otherwise clean up) each one. Non-admins don't see the sidebar — a broken pin is noise they can't act on.
- **Undo**: marking a pin done or deleting it shows a toast with an `Undo` button. The undo window is 10 seconds, enforced by the Worker. After that the toast disappears and the Worker returns 409 if undo is attempted.
- **Confluence logs**: every create / mark-done / delete / undo / reply / edit appends a timestamped entry to the configured Confluence page.

## Data model (KV)

```js
// Key: pin:<encoded-page-url>:<pin-id>
{
  id: "pin_<timestamp>_<rand>",
  url: "https://...",
  product: "Scheduling",
  selector: "...",
  elementText: "first 200 chars",
  elementHtml: "<button class=\"primary\" data-action=\"save\">",  // opening tag only, ≤500 chars — used by the Claude Code prompt
  dataFile: "products/Foo/index.html",  // from nearest data-file ancestor (annotate-source.py), empty if page not annotated
  dataLine: "327",                       // from nearest data-line ancestor — pair with dataFile to enable "Open in VS Code"
  x: 0.0,            // legacy fallback: viewport-width fraction
  y: 0.0,            // legacy fallback: page-height fraction
  relX: 0.5,         // anchor offset within the element box (0–1), null if pre-anchoring
  relY: 0.0,         // anchor offset within the element box (0–1), null if pre-anchoring
  screenshot: "data:image/jpeg;base64,...",
  comment: "...",
  author: "Sarah Chen",
  timestamp: "2026-05-22T14:00:00Z",
  done: false,
  deleted: false,
  thread: [
    { id: "reply_<ts>_<rand>", author: "Marcus", text: "...", timestamp: "..." }
  ]
}

// Key: undo:<pin-id>  (TTL 60s)
{ prevDone: false, prevDeleted: false, key: "pin:...", undoExpiresAt: 1234567890 }
```

> KV's minimum TTL is 60s, so the undo record lives for 60s but the Worker enforces the logical 10s window via `undoExpiresAt`. Undo requests after the 10s window return 409 even though the key still exists.

## Worker API

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/pins?url=<encoded>` | — | Returns active (non-deleted) pins for the URL. |
| `POST` | `/pins` | pin fields | Creates a pin. |
| `PATCH` | `/pins/:id` | `{ url, done?, deleted?, comment?, author?, x?, y?, selector?, elementText?, elementHtml?, dataFile?, dataLine?, relX?, relY? }` | Updates a pin. `url` is required for direct KV lookup. Passing `selector`/`elementHtml`/`dataFile`/`dataLine`/`relX`/`relY` re-anchors a dragged pin to a new element. |
| `POST` | `/pins/:id/undo` | `{ url, author? }` | Reverts last done/delete on this pin if within 10s window. 409 if expired. |
| `POST` | `/pins/:id/replies` | `{ url, author, text }` | Appends a reply to the pin thread. |

## Troubleshooting

**Pins don't appear.** Check the browser console. If you see CORS errors, the page's origin isn't in `ALLOWED_ORIGIN`. Update `wrangler.toml` and redeploy.

**"Failed to load pins" in the console.** Confirm `CW_WORKER_URL` in `feedback-widget.js` matches the deployed Worker URL.

**Confluence logging silently fails.** The Worker swallows Confluence errors so users aren't blocked. Check Worker logs (`wrangler tail`) to see what's failing — most often a bad token or a version conflict (someone else edited the page).

**Screenshots are missing.** `html2canvas` is loaded lazily from a CDN — if the user is offline or has CDN scripts blocked, the pin is created without a screenshot.
