SafeLMS is a product of vector solutions.

## Required: GitHub Pages share pill

**Every HTML mock under `products/SafeLMS/` must include a floating "Share Link" pill at the bottom-right of the page that copies the live GitHub Pages URL to the clipboard.** This makes it easy for designers, PMs, and developers to grab and share the live URL without leaving the prototype.

- The pill auto-derives the GitHub Pages URL from `window.location.pathname`, so the same snippet works on `file://`, `localhost`, and the live Pages site — no per-file configuration.
- The pill snippet is **already present in `base-template/index.html`**. When creating a new mock by copying the base template, the pill comes along for free — do not remove it.
- The dashboard at `products/SafeLMS/dashboard/index.html` also includes the pill — it has its own shareable Pages URL.
- When asked to add the pill to an existing mock that doesn't have it, paste the snippet just before the closing `</body>` tag.

### Canonical snippet

```html
<!-- GitHub Pages share pill (auto-derives URL from path) -->
<style>
  .gh-share-pill {
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 2147483000;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #18181b;
    color: #fff;
    padding: 9px 14px;
    border-radius: 999px;
    font: 600 12px/1 'SF Mono', Menlo, Consolas, monospace;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
    opacity: 0.85;
    transition: opacity 0.15s ease, transform 0.15s ease;
    text-decoration: none;
  }
  .gh-share-pill:hover { opacity: 1; transform: translateY(-2px); }
  .gh-share-pill.is-copied { background: #10b981; }
</style>
<button class="gh-share-pill" id="ghSharePill" type="button" aria-label="Copy live GitHub Pages URL">🔗 Share Link</button>
<script>
  (function() {
    const pill = document.getElementById('ghSharePill');
    if (!pill) return;
    const m = window.location.pathname.match(/\/products\/([^/]+)\/(.+?)\/(?:index\.html)?$/i);
    const url = m
      ? `https://vectorlearning.github.io/ux-mockups/products/${m[1]}/${m[2]}/`
      : 'https://vectorlearning.github.io/ux-mockups/';
    pill.title = url;
    pill.addEventListener('click', () => {
      navigator.clipboard.writeText(url).then(() => {
        pill.innerHTML = '✓ Copied!';
        pill.classList.add('is-copied');
        setTimeout(() => {
          pill.innerHTML = '🔗 Share Link';
          pill.classList.remove('is-copied');
        }, 1500);
      });
    });
  })();
</script>
```

## Dashboard Maintenance

There is a prototype index at [`./dashboard/index.html`](./dashboard/index.html) that the UX team shares with PMs and developers as a single link to every in-progress SafeLMS mock. **The entire list of mocks plus their metadata and the recent-activity log come from [`./dashboard/meta.json`](./dashboard/meta.json)** — that JSON file is the *single source of truth* for what the dashboard shows. (The repo is private, so the dashboard cannot discover folders via the GitHub API; it relies on Claude to keep meta.json accurate.)

**Whenever you create, modify, rename, or delete any file under `products/SafeLMS/` (other than under `dashboard/` itself), you MUST also update `dashboard/meta.json` in the same turn.** Do not split this across turns and do not skip it.

### What to update on every edit

1. **Append a `recentChanges` entry** to the top of the array with:
   - `date` — today's date as `YYYY-MM-DD`
   - `path` — file path relative to `products/SafeLMS/` (e.g. `"reports/index.html"`)
   - `summary` — one short past-tense sentence ("Added export filter for course completion data.")
2. **Update `mocks[<folder-key>]` for the mock you touched**, if the change is user-visible:
   - Refresh `description` if the mock's purpose evolved
   - Change `status` if the mock graduated to a new stage: `concept` → `in-progress` → `review` → `ready` (or `archived` for retired work)
   - Add `ticket` if a Jira/Linear ticket is newly associated
3. **Create a new `mocks[<folder-key>]` entry whenever you create a new mock folder.** The key is the folder path relative to `products/SafeLMS/` (e.g. `"onboarding-flow"`, or `"Modals/timeout-warning"` for a sub-section), with no trailing `/index.html`. **A new folder without a matching `mocks` entry will not appear on the dashboard at all** — this step is not optional.
4. **Delete the `mocks[<folder-key>]` entry whenever you delete or rename a mock folder.** Log the rename/deletion in `recentChanges`.
5. **Trim `recentChanges` to the 20 most recent entries** — drop older entries beyond that. Newer entries go at the top.

### Why this matters

This page is the single shareable link the team gives stakeholders. Because the repo is private, the dashboard can't fall back to filesystem discovery — meta.json is the entire source of truth. If you forget to update it, mocks vanish or show stale statuses, and the dashboard loses the team's trust. Updating meta.json takes 10 seconds; recovering from a "the dashboard is wrong" complaint costs much more.

### meta.json schema

```json
{
  "version": 1,
  "jiraBaseUrl": "https://<workspace>.atlassian.net/browse/",
  "recentChanges": [
    { "date": "YYYY-MM-DD", "path": "<folder>/<file>", "summary": "Short past-tense sentence." }
  ],
  "mocks": {
    "<folder-key>": {
      "title": "Optional title override (default: humanized folder name)",
      "description": "Optional one-line description shown on the card",
      "status": "concept | in-progress | review | ready | archived",
      "ticket": "Optional ticket ID, e.g. SAFELMS-30656",
      "ticketUrl": "Optional full ticket URL (only needed if it lives outside jiraBaseUrl)"
    }
  }
}
```

**About `jiraBaseUrl`:** when set (e.g. `"https://vectorsolutions.atlassian.net/browse/"`), every mock's `ticket` value is auto-appended to form a clickable link on the dashboard. You only need to fill the per-mock `ticketUrl` when a particular ticket lives in a different Jira instance and the base URL doesn't apply. Leave `jiraBaseUrl` as `""` to render tickets as plain (non-linked) badges.

### Exceptions

- Edits **inside `dashboard/`** (the dashboard's own files) do not require a meta.json update — the dashboard is not a tracked mock.
- Pure documentation tweaks to this CLAUDE.md or the project README do not need a `recentChanges` entry.
