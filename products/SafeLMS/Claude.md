SafeLMS is a product of vector solutions.

## Dashboard Maintenance

There is a prototype index at [`./dashboard/index.html`](./dashboard/index.html) that the UX team shares with PMs and developers as a single link to every in-progress SafeLMS mock. It lists each mock with its GitHub Pages URL, GitHub source link, any dev-handoff build, and a recent-activity log.

**This dashboard now maintains itself — you normally do not touch it.**

- **The UI is shared.** `dashboard/index.html` is a thin shell that loads [`/designtoolbox/dashboard.js`](../../designtoolbox/dashboard.js) (the same file every product's dashboard uses). Don't edit the shell or rebuild the dashboard here — to change how the dashboard *looks or behaves for all products*, edit `designtoolbox/dashboard.js`.
- **The data is auto-generated.** `dashboard/meta.json` is regenerated on every push by [`scripts/build-dashboards.js`](../../scripts/build-dashboards.js) (via `.github/workflows/dashboards.yml`). It scans `products/SafeLMS/` and rebuilds:
  - the **mock list** — every folder with an `index.html` appears automatically; deleted/renamed folders drop off automatically (the private-repo "can't list folders in the browser" problem is solved at build time, not by hand);
  - **`devHandoff`** — set automatically when a `dev_handoff.html` exists next to a mock's `index.html` (which also moves the card to **Ready for Dev** and leads with the dev build links); cleared when the file is removed;
  - **`recentChanges`** — rebuilt from `git log` (commit date + path + commit subject), newest 20.

  So: create a mock folder and push → it appears. Add a `dev_handoff.html` and push → it flips to Ready for Dev. Write good commit messages → they become the changelog. **No meta.json edits required.**

### Optional polish (preserved across regenerations)

The generator is non-destructive: any of these fields you set on a mock in `meta.json` are kept when it regenerates. Set them only if you want to override the auto-derived defaults (the dashboard humanizes the folder name into a title and infers a description otherwise):

```json
"mocks": {
  "<folder-key>": {
    "title": "Optional — overrides the humanized folder name",
    "description": "Optional — ONE short sentence shown on the card (keep it a quick what-it-is, not a feature list; cards clamp to 3 lines)",
    "status": "concept | in-progress | review | ready | ready-for-dev | archived",
    "ticket": "Optional ticket ID (also auto-detected from a trailing ALPHA-#### in the folder name)",
    "ticketUrl": "Optional full ticket URL (only if it lives outside jiraBaseUrl)",
    "extraLinks": [ { "label": "Current UI", "file": "current-ui.html" } ]
  }
}
```

Top-level `jiraBaseUrl` is also preserved; when set, each mock's `ticket` is appended to form a clickable Jira link. `status` is the main thing worth curating by hand — it can't be inferred (except `ready-for-dev`, which the dev-handoff file drives).

### Running it locally

`node scripts/build-dashboards.js` from the repo root regenerates the meta.json files immediately, so you can preview before pushing. CI does the same on push and commits the result with `[skip ci]`.

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
