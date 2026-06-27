# Component Assessment
## Async Reports — products/SafeLMS/async-reports/index.html

**Source**: Local file
**Date**: 2026-06-26
**Assessed against**: core v1.22.1, themes v1.9.3 (fetched from CDN). The mock loads **core v1.19.0** and **themes v1.5.0**; CONTEXT.md files are not published for those versions, so they were assessed against the minimum-available baselines (core v1.22.1, themes v1.9.3).

---

## Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Filter selects (time, repeat, ordinal, weekday, unit) | `vaadin-select` | ✅ Covered | 10×, all carry `theme="outlined"`. List options rendered via `vaadin-list-box` + `vaadin-item` in the renderer — correct pattern. |
| Numeric inputs (every-N, end-after-N, last-N) | `vaadin-number-field` | ✅ Covered | 6×, all `theme="outlined"`. |
| Date pickers (schedule date, end date, range) | `vaadin-date-picker` | ✅ Covered | 8×, all `theme="outlined"`. A shadow-DOM `dpFix()` patches calendar padding — harmless prototype polish. |
| Select dropdown lists | `vaadin-list-box` / `vaadin-item` | ✅ Covered | Used inside select renderers. |
| Radio options (runs-on, end, date-range) | `vaadin-radio-group` + `vaadin-radio-button` | ⚠️ Partial | Uses bare `vaadin-radio-button` with shared `name=` attributes and **no `vaadin-radio-group` wrapper**. Wrap each set in `vaadin-radio-group` for proper grouping/keyboard/ARIA. |
| Report tabs (Quick, Compliance by Employee, …) | `vaadin-tabs` / `vaadin-tab` | ⚠️ Partial | Hand-rolled `.tabs`/`.tab` divs with a JS `active` class. `vaadin-tabs` provides selection state, keyboard nav, and the selection underline for free. |
| All buttons (Run Report, split-button, pager, Run Now / Schedule / Edit, export, modal Cancel/Confirm, "Email Me…") | `vaadin-button` | ⚠️ Partial | **Zero `vaadin-button` in the mock** — every button is a custom `<button>` with inline/utility CSS. These should be `vaadin-button` with `theme="primary|secondary|tertiary"`. Most impactful single swap. |
| Results pager (First / ‹ / 1 / › / Last) | `vwc-paginator` | ⚠️ Partial | Hand-rolled `.pager`. `vwc-paginator` gives page-size select, range text ("X–Y of Z"), and a `page-change` event out of the box. |
| Data table + Report Log table | `vaadin-grid` (or `.vwc-table` theme) | ⚠️ Partial | Custom `table.data` / `.log-table` built via `innerHTML`. Intentional for layout control (grouped employee rows, custom cells), but `vaadin-grid` or the themed `.vwc-table` class would standardize headers, borders, hover, and sorting. |
| Inline schedule dropdown (split Run button) | `vaadin-popover` | ⚠️ Partial | Custom `.schedule-dropdown` panel toggled by class, with bespoke outside-click handling that already has to special-case Vaadin overlays. `vaadin-popover` handles anchoring + dismissal natively. |
| Export-format menu (CSV / Excel) | `vaadin-popover` (or `vaadin-menu-bar`) | ⚠️ Partial | Custom `.export-menu` popover per log row. |
| Scheduler modal | `vaadin-dialog` | ⚠️ Partial | Custom `.modal-scrim`/`.modal` with manual open/close. `vaadin-dialog` provides focus trap, Esc-to-close, and backdrop. (Note: `vaadin-dialog` uses renderer functions, not slotted content — see CORE-CONTEXT.md.) |
| Loading spinner | `vwc-spinner` | ⚠️ Partial | Custom CSS `.loading-spinner`. `vwc-spinner` is the standard. |
| "Email request sent" confirmation | `vaadin-notification` | ⚠️ Partial | Custom fixed-position `.toast`. `vaadin-notification` is the system toast with positioning + auto-dismiss. |
| Email-address opt-in toggle | `vwc-switch` | ⚠️ Partial | Custom `.email-toggle` pill. `vwc-switch` is the design-system switch. |
| Pencil banner (Report Log info notice) | _(no direct VWC)_ | ⚠️ Partial (intentional) | Documented Vector pattern in `products/SafeLMS/CLAUDE.md`. Keep as the canonical custom banner. |
| Blue reports sub-header / tab bar | `vwc-topnav` | ⚠️ Partial (intentional) | This is an in-page reports header, not the app topnav — custom is appropriate for the prototype. |
| Schedule / status pills ("None", schedule badges) | _(no `vwc-badge` in this version)_ | ⚠️ No direct match | The fetched core v1.22.1 index has no badge component; custom pills are acceptable. Revisit if a badge ships. |

---

## Design Token Usage

Values quoted from themes CONTEXT.md (v1.9.3). The mock predates a token pass — it uses a **Tailwind-style blue/slate/green palette** rather than Vector's Lumo tokens, so most colors are "close but not equal."

| Color in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
| `#fff` | `--lumo-base-color` | `#fff` | ✅ Match — swap card/page backgrounds to the token. |
| `#155DFC` (primary blue) | `--lumo-primary-color` | `#0271ce` | ⚠️ No direct match — mock blue is a brighter, bluer hue. Either map to `--lumo-primary-color` or set `--vwc-brand-color` so the whole app shifts together. |
| `#1447E6`, `#1D64E8`, `#1D4ED8`, `#1038C8` (blue hover/active) | `--lumo-primary-color` (states) | `#0271ce` | ⚠️ No direct match — hand-built blue scale; collapse onto primary + its `-10pct`/`-50pct` tints. |
| `#364153`, `#374C61`, `#1E3A5F` (dark ink) | `--lumo-contrast` | `#192434` | ⚠️ Off — close dark slate; use `--lumo-contrast` / `--lumo-body-text-color`. |
| `#4A5565`, `#64748B`, `#6A7282`, `#6B8AB0` (muted text) | `--lumo-secondary-text-color` | `#00000099` | ⚠️ Off — map to secondary/tertiary text tokens. |
| `#21A366`, `#16a34a`, `#4CB84E`, `#6FC77A` (greens) | `--lumo-success-color` | `#158444` | ⚠️ Off — success family; pick the semantic token. |
| `#E6F4EA`, `#ECFDF5` (green tints) | `--lumo-success-color-10pct` | `#1688461a` | ⚠️ Off — success background tint. |
| `#E5E7EB`/`#e5e7eb`, `#EEF2F6`, `#E9EBF0`, `#C4C9D4` (hairlines/borders) | `--lumo-contrast-10pct` / `-20pct` | `#1a38601a` / `#1c375a29` | ⚠️ Off — neutral borders. |
| `#EEF1F5` (gray canvas) | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ Off — canvas gray (documented reports pattern); token is the nearest neutral. |
| `#F3F4F6`, `#EFF6FF`, `#DBEAFE`, `#BFDBFE`, `#E1EBF9`, `#E9F0FF`, `#F0F4FF` (light-blue tints) | `--lumo-primary-color-10pct` | `#0271ce1a` | ⚠️ Off — subtle primary highlights. |
| `#FFB020`, `#F5BD3A` (amber) | `--lumo-warning-color` / `--vwc-notification-color` | `#e0782e` / `#ffc700` | ⚠️ Off — pick warning vs notification by intent. |
| `#F35B5B` (red) | `--lumo-error-color` | `#d83e38` | ⚠️ Off — error family. |
| `rgba(16,24,40,.10/.06/.18)` (card shadows) | `--lumo-box-shadow-s` / `-m` | `0 2px 4px -1px #1c375a29, …` | ⚠️ Off — custom shadow; elevation tokens are the standard depth scale. |

---

## Summary

| Category | Count |
|---|---|
| ✅ Covered | 4 |
| ⚠️ Partial | 13 |
| ❌ Gap | 0 |

**Key takeaways:**

- **Form inputs are the strong half.** Selects, number fields, and date pickers all use the right Vaadin tags with `theme="outlined"`, and selects compose `vaadin-list-box`/`vaadin-item` correctly.
- **Buttons are the biggest, cheapest win.** The mock has **no `vaadin-button` at all** — every button is custom. Converting to `vaadin-button` with proper `theme` variants is the highest-impact change for design-system fidelity.
- **Several interaction shells are hand-rolled where a component exists:** tabs → `vaadin-tabs`, pager → `vwc-paginator`, modal → `vaadin-dialog`, the two dropdown panels → `vaadin-popover`, spinner → `vwc-spinner`, toast → `vaadin-notification`, email toggle → `vwc-switch`. None are wrong for a prototype, but they're the list of "reinvented" components for the dev build.
- **Wrap the radio buttons** in `vaadin-radio-group` — currently bare `vaadin-radio-button`s grouped only by `name=`.
- **No gaps.** Every element maps to an existing VWC/Vaadin component or a documented custom Vector pattern (pencil banner, reports canvas). The pending work is adoption + a theme-token pass (the palette is Tailwind-ish, not Lumo), not new components.
