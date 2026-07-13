# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The parent `CLAUDE.md` and `CORE-CONTEXT.md` at the repo root apply here. This file documents what is specific to Scheduling.

## Dashboard Maintenance

There is a prototype index at [`./dashboard/index.html`](./dashboard/index.html) that the UX team shares with PMs and developers as a single link to every in-progress Scheduling mock. It lists each mock with its GitHub Pages URL, GitHub source link, any dev-handoff build, and a recent-activity log.

**This dashboard now maintains itself — you normally do not touch it.**

- **The UI is shared.** `dashboard/index.html` is a thin shell that loads [`/designtoolbox/dashboard.js`](../../designtoolbox/dashboard.js) (the same file every product's dashboard uses). Don't edit the shell or rebuild the dashboard here — to change how the dashboard *looks or behaves for all products*, edit `designtoolbox/dashboard.js`.
- **The data is auto-generated.** `dashboard/meta.json` is regenerated on every push by [`scripts/build-dashboards.js`](../../scripts/build-dashboards.js) (via `.github/workflows/dashboards.yml`). It scans `products/Scheduling/` and rebuilds:
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
    "ticket": "Optional ticket ID (also auto-detected from a trailing ALPHA-#### in the folder name, e.g. UX-2474)",
    "ticketUrl": "Optional full ticket URL (only if it lives outside jiraBaseUrl)",
    "extraLinks": [ { "label": "Current UI", "file": "current-ui.html" } ]
  }
}
```

Top-level `jiraBaseUrl` is also preserved; when set, each mock's `ticket` is appended to form a clickable Jira link. `status` is the main thing worth curating by hand — it can't be inferred (except `ready-for-dev`, which the dev-handoff file drives).

### Running it locally

`node scripts/build-dashboards.js` from the repo root regenerates the meta.json files immediately, so you can preview before pushing. CI does the same on push and commits the result with `[skip ci]`.

## Two prototype styles coexist here

Mockups in this directory split into two architectures. Match the existing style of the mock you're editing — do not mix them.

| Mock | Style | Stack |
|---|---|---|
| `Event Indicator: UX-2474/` | Standard repo style | Vector web components + vanilla JS + Open Sans |
| `theme-colors/` | Standard repo style | Vector web components + vanilla JS + Open Sans |
| `rules-engine-only/` | "CallBack" React prototype | React 18 + Babel standalone via CDN + Inter font |
| `ai-search-engine-dashboard/` | "CallBack" React prototype | React 18 + Babel standalone via CDN + Inter font |
| `advance-scheduling/` | empty placeholder | — |

The CallBack prototypes predate the repo-wide vanilla/Vector convention and use Lumo CSS variables (`--lumo-primary-color`, etc.) rather than Vector theme tokens. Treat them as a legacy island — when starting a *new* Scheduling mock, scaffold the versioned feature structure per the parent CLAUDE.md ("For a NEW mock"): copy `base-template/index.html` (the loader) to the feature root untouched, add `versions.json`, and do the design in `ver1/index.html` copied from `base-template/version.html` (the blank Vector canvas), using Vector components.

## CallBack React prototype architecture

The `rules-engine-only/index.html` and `ai-search-engine-dashboard/index.html` files share an authoring pattern that is non-obvious from reading any single block:

- **Multi-block `<script type="text/babel">` layout.** The file is split into ~5–10 separate Babel script blocks (PRIMITIVES, SHELL, view-specific blocks, app entry). Each block ends with `Object.assign(window, { ... })` to publish its components onto `window`, which is how later blocks consume them. There are no imports — components must be defined in an earlier block and re-published to `window`.
- **`useAppSt` is just an alias for `useState`.** Different blocks alias `useState` with different local names (`useStateW`, `useAppSt`) to avoid re-declaration errors across blocks. The aliasing is cosmetic, not semantic.
- **Shared primitives live in the PRIMITIVES block at the top:** `Icon`, `Button`, `TextField`, `Badge`, `Avatar`, `Checkbox`, plus an `ICONS` lookup table of inline SVG paths. The product uses its own SVG icon set (not Font Awesome) — when adding an icon, extend `ICONS` rather than pulling in a new library.
- **Color palette is hardcoded.** Lumo CSS vars at `:root` define the surface colors; component primitives also bake in hexes inline (`#0271CE` primary, `#D83E38` error, `#158444` success, `#E0782E` warning, `#192434` text). Stay consistent with these when extending.
- **Navigation shell is data-driven.** `SHELL_NAV` (outer 66px sidebar) and `SubSidebar`'s `items` array (inner 220px sidebar) define the entire IA. The active sub-view is held in app-level state and switched via a big ternary in the main `App` component.

## Event Indicator (UX-2474)

The `Event Indicator: UX-2474/` mock is the active design artifact for ticket UX-2474. Recent commits (`git log -- 'products/Scheduling/Event Indicator: UX-2474/'`) capture the scope: scheduling column layout, event grouping with sticky headers, sign-up section, attendee autocomplete, resizable sidebar sections, legend modal, event-edit modal with color/attendee/flag pickers.

Layout structure (top-down): 40px dark topnav → 48px dark icon sidenav → toolbar with filter panel → colored shift date-nav → main schedule body with `.sched-col` cards in a wrapping flex row + a 300px collapsible right sidebar.

### Shift-edit modal (`current-ui.html`)

`event-indicator-UX-2474/current-ui.html` is the production-faithful "before" companion to the redesign. It contains a reusable **shift-edit modal** reproducing the live edit-shift dialog the scheduler sees when clicking an assigned person on the day view.

- **Trigger:** clicking any assigned person row (`.prow[data-modby]` or `.drow[data-modby]`) opens it. The same rows still show the black hover-card on hover; the modal is the click action. Closes on the ✕, backdrop click, or Esc.
- **Markup/CSS prefix:** everything is namespaced `.sm-*` (`.shift-modal`, `.sm-head`, `.sm-body`, `.sm-field`, `.sm-foot`, etc.); the overlay is `#shiftModal.modal-overlay`. It's plain vanilla CSS/JS in the file's production-reproduction style — **not** Vector web components (this page deliberately mimics current production, not the design system).
- **Dynamic title:** `Name — Assignment — Date`, assembled in JS from the clicked row's name, its parent `.acard` title, and the date-nav date. Form field values (project code, work type, times, break) are static representative content.
- **Concurrent-shift line:** when the clicked person has another shift that day (the row carries `data-cc-type` / `data-cc-assignment` / `data-cc-time`), `buildConcurrentBanner()` renders a compact single line **between the title and the form fields** — the orange concurrent flag (`.sm-cc-flag`), then the bold assignment name (`.sm-cc-name`) + plain time range (`.sm-cc-time`). No box, no caption. Rows without `data-cc-*` open the modal with no line. (This is the "school resource officer" readout pattern, pared down.)
- **Footer:** four buttons on a **single line** (`.sm-foot` is `flex-wrap: nowrap`, `.sm-btn` is `white-space: nowrap` at 12px) — green Save / green "Save today and all future shifts" / red "Delete today only" / red "Delete from rotation". Keep them on one line when editing labels or widths.

## Theme Colors mock

`theme-colors/index.html` is a settings-page prototype for an interactive theme picker. Its `:root` declares two distinct token groups that are documented inline at the top of the file:

- `--bar-*` — driven by the color/gradient/image picker for the nav + topbar.
- `--page-*` — derived via HSL math from the key color + appearance mode (light/dark).

When editing this mock, preserve that two-group split — the picker JavaScript depends on it.

## Source Inspector

Mocks here are candidates for the Alt+click → VS Code workflow described in the root `SOURCE-INSPECTOR.md`. Annotate via `python3 scripts/annotate-source.py "products/Scheduling/<Mock Name>/index.html"` from the repo root. The annotate script skips `<script>` and `<style>` blocks, so the CallBack React mocks will only get attributes on their top-level HTML (the `<div id="app">` shell) — not on JSX inside Babel script blocks.

## Viewing mocks

All mocks open directly in a browser — no server, no build. Folder names contain spaces and a colon (`Event Indicator: UX-2474`), so quote paths in shell commands.
