# Feedback Widget

A drop-in visual feedback widget for the `ux-mockups` GitHub Pages site. Anyone visiting a mockup can drop pins on the page, leave a comment, reply in a thread, mark items done, or delete them. All pin state lives in Cloudflare KV (so every teammate sees the same pins) and every feedback action is recorded in an append-only activity log (also in KV), viewable at `designtoolbox/log.html`.

There is no login flow — users type their name once and it is remembered in `localStorage`.

## Embed

Add this one line before `</body>` in any mockup HTML file:

```html
<script src="/designtoolbox/feedback-widget.js"></script>
```

That's it. A "＋ Add feedback" toolbar appears bottom-right of the page.

## Architecture

```
Mockup HTML ──▶ feedback-widget.js ──▶ Cloudflare Worker ──▶ Cloudflare KV
                                                              (pins + activity log)
```

- HTML mockups are static and never modified by the widget.
- Pins, threads, and the activity log all live in Cloudflare KV — shared across all viewers.
- The Worker is the only thing that talks to KV.
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
cd designtoolbox/worker
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

### 3. Verify the env vars

The non-secret vars are set in `wrangler.toml`. Confirm they're correct for your setup:

| Var | Default | Notes |
|---|---|---|
| `ALLOWED_ORIGIN` | GitHub Pages + localhost | Comma-separated CORS allowlist. Add any new origin that needs to call the Worker. |

#### Setting the allowed origin

`ALLOWED_ORIGIN` is a comma-separated list of origins the Worker accepts requests from. Include every domain the widget will be embedded on, plus localhost for testing:

```toml
ALLOWED_ORIGIN = "https://vectorlearning.github.io,http://localhost:8000,http://127.0.0.1:8000"
```

GitHub Pages projects sit under `https://<org>.github.io` — the path doesn't matter, only the origin (scheme + host + port).

### 4. Deploy

```bash
wrangler deploy
```

Wrangler prints the deployed Worker URL, e.g.:

```
https://ux-mockups-feedback.<your-account>.workers.dev
```

### 6. Point the widget at the Worker

Open `designtoolbox/feedback-widget.js` and replace the `CW_WORKER_URL` constant near the top with the Worker URL from the previous step:

```js
const CW_WORKER_URL = 'https://ux-mockups-feedback.<your-account>.workers.dev';
```

Commit and push. GitHub Pages will serve the updated widget on next deploy.

## Updating the widget

1. Edit `designtoolbox/feedback-widget.js`.
2. Bump the `WIDGET_VERSION` constant at the top.
3. Commit and push. Pages will pick up the new file.

Browsers may cache the widget aggressively. If teammates aren't seeing the update, ask them to hard-reload (Cmd+Shift+R) or add a cache-busting query string when embedding (`?v=1.0.1`).

## How it behaves

- **On load**, the widget fetches all non-deleted pins for the current page URL and draws them.
- **Pin dot**: colored circle with the author's first initial. Click to open the detail panel.
- **Element-anchored**: each pin stores its target element's selector plus a relative offset (`relX`/`relY`) inside that element's box. Dots are positioned from the element's live bounding rect, so they scroll and reflow with the page instead of floating at a fixed spot.
- **Drag to re-pin**: drag a dot onto another element either (a) in comment mode, or (b) while that pin's detail panel is open. The element under the cursor is outlined as you drag; on drop the pin re-anchors — its `selector`, `elementText`, `elementHtml`, `dataFile`/`dataLine`, and offset are recaptured immediately (so the "Open in VS Code" button points at the new element). The screenshot is recaptured asynchronously in the background and PATCHed back once html2canvas finishes — the drop confirmation isn't blocked on it, and the panel auto-refreshes when the new image lands. If the user drags the same pin again before the previous capture completes, the stale capture is discarded. If the panel was open during the drag, it re-renders against the new anchor.
- **Open in VS Code**: a "📂 Open in VS Code" button appears in the panel's action row whenever the pinned element has `data-file` + `data-line` attributes (added by `scripts/annotate-source.py`, documented in [`SOURCE-INSPECTOR.md`](../SOURCE-INSPECTOR.md)). Clicking it opens the exact line in your local VS Code via the `vscode://file/<abs>:<line>` URL handler. The first click prompts you for your local repo-root path (e.g. `/Users/you/code/ux-mockups`) — that's saved in `localStorage` (`cw-repo-root`) per browser so you only do it once. To reset it: `localStorage.removeItem("cw-repo-root")`.
  - **Static-HTML mockups** are fully supported once annotated. Re-run the annotation script after edits when line numbers drift.
  - **React/SPA-style mockups** (anything that renders the UI from JSX inside `<script type="text/babel">`, e.g. `Scheduling/rules-engine-only/`) have only their static shell annotated — the runtime React elements aren't tagged. For those, the VS Code button (when present) points at the shell line and you'll need to navigate to the actual JSX from there.
- **Done pins** render muted with a checkmark and stay visible until the next page refresh.
- **Deleted pins** are soft-deleted (`deleted: true` in KV) and never shown.
- **Comment navigator**: a single hub in the bottom-left corner shows the **total number of comments** on the page and lets you review every one without hunting. A Prev/Next stepper (`‹ 3 / 12 ›`) jumps to each comment in turn — scrolling to it, switching to its screen/state if needed, and opening its panel — and an expandable list groups every comment by where it lives: **On this screen**, **On other screens** (a different screen, version, tab, or toggle of a single-file mock), and **Not found** (the anchored element no longer exists). The hub is purely client-side over the already-loaded comments, so navigating adds no Cloudflare reads, writes, or lists. The count reflects open comments (resolved/done ones drop off), and respects visitor mode.
- **Stranded comments** (the "Not found" group): if a pin's CSS selector no longer matches anything on the page (mockup changed), the pin can't be placed on the canvas. It appears in the navigator's **Not found** group for **admins only** so they can open and clean it up — non-admins don't see it, since a broken pin is noise they can't act on.
- **Undo**: marking a pin done or deleting it shows a toast with an `Undo` button. The undo window is 10 seconds, enforced by the Worker. After that the toast disappears and the Worker returns 409 if undo is attempted.
- **Activity log**: every create / mark-done / delete / undo / reply / edit appends a timestamped, append-only entry in KV (`log:` keys), viewable at `designtoolbox/log.html`. Pin moves and admin mode changes are intentionally not logged.

## Data model (KV)

All pins for a page are stored together in **one** KV value (`pins:<encoded-page-url>` → an array of pin objects). A page load is therefore a single KV read with **no list operation** — KV meters list ops against a small daily free-tier budget, and the previous one-key-per-pin layout forced a `list()` on every page load. The Worker lazily migrates any legacy `pin:<url>:<id>` keys into the blob the first time a page is read after deploy, so no manual migration step is needed. Trade-off: writes are read-modify-write on the whole array, so two people commenting on the *same page* in the same instant could clobber each other — acceptable given the low write volume and that KV has no compare-and-swap.

```js
// Key: pins:<encoded-page-url>   →   array of pin objects, each shaped like:
{
  id: "pin_<timestamp>_<rand>",
  url: "https://...",
  product: "Scheduling",
  selector: "...",
  elementText: "first 200 chars",
  elementHtml: "<button class=\"primary\" data-action=\"save\">",  // opening tag only, ≤500 chars — persisted for the data model / activity log
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
{ prevDone: false, prevDeleted: false, url: "https://...", pinId: "pin_...", undoExpiresAt: 1234567890 }
```

> KV's minimum TTL is 60s, so the undo record lives for 60s but the Worker enforces the logical 10s window via `undoExpiresAt`. Undo requests after the 10s window return 409 even though the key still exists.

## ⚠️ Renaming or moving a mock orphans its comments

**Comments are keyed by the page URL, not the file.** The KV key is `pins:<encodeURIComponent(pageUrl)>`, where `pageUrl` is rebuilt from the `/products/...` path (`canonicalPageUrl()` in `feedback-widget.js`). So if you **rename or move a mock folder** — or a versioned `verN/verN.html` file — every page under it gets a **new** key, and the existing comments stay behind under the **old** key. They aren't deleted, just unreachable: the widget now looks up the new path and finds nothing.

**A space in a folder name makes it worse.** The browser encodes the space as `%20` in the URL, so the old key contains `versioning%2520test` (the `%20`, itself re-encoded by `encodeURIComponent`). That stray `%` is the tell-tale sign of a space-folder rename.

**Two ways to avoid the pain:**

1. **Prefer hyphens over spaces** in new mock/feature folder names (`versioning-test`, not `versioning test`). No spaces → no `%20` → cleaner keys and URLs. (This is also why the loader/versioned-folder convention uses hyphenated names.)
2. **After any rename/move, re-link the comments** with the helper script — it copies the pins from the old key to the new one AND repoints the activity-log links, so both reappear on the renamed page:

   ```sh
   cd designtoolbox/worker      # so wrangler picks up wrangler.toml (KV namespace id)
   wrangler login               # one-time auth; the script shells out to wrangler

   # (optional) see what's in KV for a folder — old vs new path, per-version comment counts:
   node ../scripts/relink-comments.js --inspect "versioning"

   # dry run first — prints exactly what it would copy/repoint, writes nothing:
   node ../scripts/relink-comments.js --from "versioning test" --to "versioning-test"
   # then actually do it:
   node ../scripts/relink-comments.js --from "versioning test" --to "versioning-test" --apply
   ```

   `--from`/`--to` are the old/new path fragments (bare folder name, or `Scheduling/versioning test` for a more precise match). Spaces are handled automatically. The script:
   - **copies `pins:` and `settings:` keys** to the new path (matches *every* page under the folder — so all versions, `ver1`/`ver2`/…, are relinked in one run), **leaves the originals in place** as a backup, and won't overwrite a destination that already has comments;
   - **rewrites the `url` inside matching `log:` entries in place** so the activity-log (`log.html`) links point at the renamed page instead of the dead one (TTL refreshed to 90 days).

   Use `--inspect` first if a comment (e.g. a specific version's) doesn't come back — it prints each `pins:` key's decoded page URL and active-comment count, so you can see whether that version's comments live under the old or new path. Reload the renamed mock on GitHub Pages afterward. See `designtoolbox/scripts/relink-comments.js` for full options (`--no-log`, `--no-settings`, `--namespace-id`).

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

**Screenshots are missing.** `html2canvas` is loaded lazily from a CDN — if the user is offline or has CDN scripts blocked, the pin is created without a screenshot.
