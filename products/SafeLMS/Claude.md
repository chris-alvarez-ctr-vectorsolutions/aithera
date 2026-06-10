SafeLMS is a product of vector solutions.

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

### Dev handoff files

When you create a `dev_handoff.html` inside a mock folder (a clean, comment-widget-free copy a developer can build from), update that mock's `mocks[<folder-key>]` entry **in the same turn — automatically, without being asked**:

- Set `"devHandoff": true`. The dashboard card then leads with the dev build links — the **GitHub Pages** URL (Dev Page) and the **GitHub** raw-HTML URL (Dev HTML) — and a primary **View Dev Build** button. The original design links (Pages + GitHub for the commented prototype) collapse into a closed "Design version" drawer on the card, available when needed.
- Set `"status": "ready-for-dev"`. This moves the card into the **Ready for Dev** group.

`devHandoff` defaults to the filename `dev_handoff.html`; pass a filename string instead of `true` only if the handoff file is named differently. If you later delete the dev_handoff file, remove `devHandoff` and reset the status.

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
      "status": "concept | in-progress | review | ready | ready-for-dev | archived",
      "ticket": "Optional ticket ID, e.g. SAFELMS-30656",
      "ticketUrl": "Optional full ticket URL (only needed if it lives outside jiraBaseUrl)",
      "devHandoff": "Optional. Set to true (or a filename) when a dev_handoff.html exists — the dashboard then shows the dev build links and the Ready for Dev status"
    }
  }
}
```

**About `jiraBaseUrl`:** when set (e.g. `"https://vectorsolutions.atlassian.net/browse/"`), every mock's `ticket` value is auto-appended to form a clickable link on the dashboard. You only need to fill the per-mock `ticketUrl` when a particular ticket lives in a different Jira instance and the base URL doesn't apply. Leave `jiraBaseUrl` as `""` to render tickets as plain (non-linked) badges.

### Exceptions

- Edits **inside `dashboard/`** (the dashboard's own files) do not require a meta.json update — the dashboard is not a tracked mock.
- Pure documentation tweaks to this CLAUDE.md or the project README do not need a `recentChanges` entry.

## Reports UI patterns

These are the canonical patterns for SafeLMS **reports** screens. The reference implementations live in [`reports/index.html`](./reports/index.html) and [`async-reports/index.html`](./async-reports/index.html) (with its `dev_handoff.html` mirror). When building or editing anything to do with the reports views or the pencil banner, match these specs so the screens stay consistent.

### Reports layout — floating white cards on a gray canvas

The reports content sits on a **gray canvas** with each major block rendered as a **floating white card**: rounded corners, a soft shadow, **no border**.

- **Canvas:** the main content area (`.main`) background is gray — `#EEF1F5` (async-reports) / `#f2f5f8` (reports). The blue topbar and white tab bar keep their own backgrounds; the date row and cards sit on the gray.
- **Cards** (`.report-card`, `.filters`, `.table-card`, `.log-card`):
  - `background: #fff;`
  - `border: none;` (never a 1px hairline — the shadow defines the edge)
  - `border-radius: 12px;`
  - `box-shadow: 0 1px 3px rgba(16,24,40,.10), 0 1px 2px rgba(16,24,40,.06);`
  - horizontal margin `24px` from the canvas edges
- **Filters as a card header:** when filters and results share one card, the filters block is the card's top section — white, `padding: 18px 24px`, with a `border-bottom: 1px solid var(--hair)` divider below it (no inset gray box).
- **Clipping caveat:** do **not** put `overflow: hidden` on a card that contains an absolutely-positioned popover (the inline scheduling dropdown or a row's export-format menu) — it will be clipped. Round the corner cells instead (e.g. `border-top-left-radius`/`border-bottom-left-radius` on the first/last `th`/`td`) so header and row-hover fills follow the radius.

### Pencil banner

The **pencil banner** is the Vector informational banner used inside reports screens. In async-reports it sits **at the top of the Report Log page** (above the log table) as the "only Compliance/Completion reports are saved here while they generate" notice. It is a **white card with a blue left accent, an info icon in a light-blue rounded square, dark body text, and a dismiss "✕"** — informational only (no primary action button in the default form).

Markup:

```html
<div class="pencil-banner">
  <span class="pb-icon">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  </span>
  <span class="pb-text">Only the Compliance and Completion reports are saved here while they generate. Refresh the page to see the latest updates.</span>
  <button class="pb-close" aria-label="Dismiss">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
</div>
```

CSS:

```css
.pencil-banner {
  position: relative;
  display: flex; align-items: flex-start; gap: 16px;
  margin: 16px 0 0;
  padding: 18px 48px 18px 22px;          /* right padding leaves room for the ✕ */
  background: #fff;
  border-radius: 4px;
  border-left: 6px solid var(--blue-primary);   /* #155DFC blue accent */
  box-shadow: 0 1px 3px rgba(16,24,40,.10), 0 1px 2px rgba(16,24,40,.06);
}
.pencil-banner.hidden { display: none; }
.pencil-banner .pb-icon {
  flex-shrink: 0; width: 40px; height: 40px;
  border-radius: 10px;                   /* rounded SQUARE, not a circle */
  background: #E1EBF9; color: var(--blue-primary);
  display: grid; place-items: center;
}
.pencil-banner .pb-text {
  flex: 1; align-self: center;
  font-size: 14px; line-height: 1.55; color: #1D2939;
}
.pencil-banner .pb-close {
  position: absolute; top: 50%; right: 16px; transform: translateY(-50%);  /* vertically centered, stays right */
  background: 0; border: 0; color: #99A1AF; cursor: pointer;
  display: grid; place-items: center; padding: 6px; border-radius: 6px;
  transition: color .12s, background .12s;
}
.pencil-banner .pb-close:hover { color: #475467; background: var(--hair-2); }
```

Notes:
- **Icon container is a rounded square (`border-radius: 10px`), not a circle**, filled `#E1EBF9` with the blue `var(--blue-primary)` info glyph.
- **Left accent** is a `6px` blue `border-left`; combined with the `12px` radius it rounds neatly at the top-left/bottom-left corners.
- If a variant needs an action button, add a `.pb-action` (filled blue button, `align-self: center`) before `.pb-close` — but the default banner is dismiss-only.
