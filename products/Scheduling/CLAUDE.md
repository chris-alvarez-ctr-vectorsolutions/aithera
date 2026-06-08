# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The parent `CLAUDE.md` and `CORE-CONTEXT.md` at the repo root apply here. This file documents what is specific to Scheduling.

## Dashboard Maintenance

There is a prototype index at [`./dashboard/index.html`](./dashboard/index.html) that the UX team shares with PMs and developers as a single link to every in-progress Scheduling mock. **The entire list of mocks plus their metadata and the recent-activity log come from [`./dashboard/meta.json`](./dashboard/meta.json)** — that JSON file is the *single source of truth* for what the dashboard shows. (The repo is private, so the dashboard cannot discover folders via the GitHub API; it relies on Claude to keep meta.json accurate.)

**Whenever you create, modify, rename, or delete any file under `products/Scheduling/` (other than under `dashboard/` itself), you MUST also update `dashboard/meta.json` in the same turn.** Do not split this across turns and do not skip it.

### What to update on every edit

1. **Append a `recentChanges` entry** to the top of the array with:
   - `date` — today's date as `YYYY-MM-DD`
   - `path` — file path relative to `products/Scheduling/` (e.g. `"Event Indicator UX-2474/index.html"`)
   - `summary` — one short past-tense sentence ("Added attendee autocomplete to the event-edit modal.")
2. **Update `mocks[<folder-key>]` for the mock you touched**, if the change is user-visible:
   - Refresh `description` if the mock's purpose evolved
   - Change `status` if the mock graduated to a new stage: `concept` → `in-progress` → `review` → `ready` (or `archived` for retired work)
   - Add `ticket` if a Jira/Linear ticket is newly associated
3. **Create a new `mocks[<folder-key>]` entry whenever you create a new mock folder.** The key is the folder path relative to `products/Scheduling/` (e.g. `"advance-scheduling"`, or `"Modals/recurring-event"` for a sub-section), with no trailing `/index.html`. **A new folder without a matching `mocks` entry will not appear on the dashboard at all** — this step is not optional.
4. **Delete the `mocks[<folder-key>]` entry whenever you delete or rename a mock folder.** Log the rename/deletion in `recentChanges`.
5. **Trim `recentChanges` to the 20 most recent entries** — drop older entries beyond that. Newer entries go at the top.

### Dev handoff files

When you create a `dev_handoff.html` inside a mock folder (a clean, comment-widget-free copy a developer can build from), update that mock's `mocks[<folder-key>]` entry **in the same turn — automatically, without being asked**:

- Set `"devHandoff": true`. The dashboard card then shows two extra links — the dev build's **GitHub Pages** URL (Dev Page) and its **GitHub** raw-HTML URL (Dev HTML) — plus a "Dev Handoff" button, alongside the existing design links.
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
      "ticket": "Optional ticket ID, e.g. UX-2474",
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

## Two prototype styles coexist here

Mockups in this directory split into two architectures. Match the existing style of the mock you're editing — do not mix them.

| Mock | Style | Stack |
|---|---|---|
| `Event Indicator: UX-2474/` | Standard repo style | Vector web components + vanilla JS + Open Sans |
| `Theme Colors/` | Standard repo style | Vector web components + vanilla JS + Open Sans |
| `Rules engine only/` | "CallBack" React prototype | React 18 + Babel standalone via CDN + Inter font |
| `AI search engine dashboard/` | "CallBack" React prototype | React 18 + Babel standalone via CDN + Inter font |
| `advance-scheduling/` | empty placeholder | — |

The CallBack prototypes predate the repo-wide vanilla/Vector convention and use Lumo CSS variables (`--lumo-primary-color`, etc.) rather than Vector theme tokens. Treat them as a legacy island — when starting a *new* Scheduling mock, copy from the root `base-template/index.html` and use Vector components per the parent CLAUDE.md.

## CallBack React prototype architecture

The `Rules engine only/index.html` and `AI search engine dashboard/index.html` files share an authoring pattern that is non-obvious from reading any single block:

- **Multi-block `<script type="text/babel">` layout.** The file is split into ~5–10 separate Babel script blocks (PRIMITIVES, SHELL, view-specific blocks, app entry). Each block ends with `Object.assign(window, { ... })` to publish its components onto `window`, which is how later blocks consume them. There are no imports — components must be defined in an earlier block and re-published to `window`.
- **`useAppSt` is just an alias for `useState`.** Different blocks alias `useState` with different local names (`useStateW`, `useAppSt`) to avoid re-declaration errors across blocks. The aliasing is cosmetic, not semantic.
- **Shared primitives live in the PRIMITIVES block at the top:** `Icon`, `Button`, `TextField`, `Badge`, `Avatar`, `Checkbox`, plus an `ICONS` lookup table of inline SVG paths. The product uses its own SVG icon set (not Font Awesome) — when adding an icon, extend `ICONS` rather than pulling in a new library.
- **Color palette is hardcoded.** Lumo CSS vars at `:root` define the surface colors; component primitives also bake in hexes inline (`#0271CE` primary, `#D83E38` error, `#158444` success, `#E0782E` warning, `#192434` text). Stay consistent with these when extending.
- **Navigation shell is data-driven.** `SHELL_NAV` (outer 66px sidebar) and `SubSidebar`'s `items` array (inner 220px sidebar) define the entire IA. The active sub-view is held in app-level state and switched via a big ternary in the main `App` component.

## Event Indicator (UX-2474)

The `Event Indicator: UX-2474/` mock is the active design artifact for ticket UX-2474. Recent commits (`git log -- 'products/Scheduling/Event Indicator: UX-2474/'`) capture the scope: scheduling column layout, event grouping with sticky headers, sign-up section, attendee autocomplete, resizable sidebar sections, legend modal, event-edit modal with color/attendee/flag pickers.

Layout structure (top-down): 40px dark topnav → 48px dark icon sidenav → toolbar with filter panel → colored shift date-nav → main schedule body with `.sched-col` cards in a wrapping flex row + a 300px collapsible right sidebar.

## Theme Colors mock

`Theme Colors/index.html` is a settings-page prototype for an interactive theme picker. Its `:root` declares two distinct token groups that are documented inline at the top of the file:

- `--bar-*` — driven by the color/gradient/image picker for the nav + topbar.
- `--page-*` — derived via HSL math from the key color + appearance mode (light/dark).

When editing this mock, preserve that two-group split — the picker JavaScript depends on it.

## Source Inspector

Mocks here are candidates for the Alt+click → VS Code workflow described in the root `SOURCE-INSPECTOR.md`. Annotate via `python3 scripts/annotate-source.py "products/Scheduling/<Mock Name>/index.html"` from the repo root. The annotate script skips `<script>` and `<style>` blocks, so the CallBack React mocks will only get attributes on their top-level HTML (the `<div id="app">` shell) — not on JSX inside Babel script blocks.

## Viewing mocks

All mocks open directly in a browser — no server, no build. Folder names contain spaces and a colon (`Event Indicator: UX-2474`), so quote paths in shell commands.
