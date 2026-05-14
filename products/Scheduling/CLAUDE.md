# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The parent `CLAUDE.md` and `CORE-CONTEXT.md` at the repo root apply here. This file documents what is specific to Scheduling.

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
