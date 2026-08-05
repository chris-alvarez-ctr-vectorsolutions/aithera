# Component Assessment
## Report Redesign V2 (Management Pages) — Report Redesign with CRUD.html

**Source**: Local file
**Date**: 2026-06-29
**Assessed against**: core v1.19.0 loaded (CONTEXT.md unavailable at that version; component index assessed against the repo `CORE-CONTEXT.md` / core v1.22.1 baseline); themes v1.5.0 loaded (CONTEXT.md unavailable; token values quoted from themes **v1.9.3** CONTEXT.md fetched from the CDN).

---

## Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Top navigation bar | `vwc-topnav` | ✅ Covered | Logo prop, `slot="rightSide"` pill links, user/notifications/language menus. |
| User / notifications / language menus | `vwc-user-menu`, `vwc-notifications-menu`, `vwc-language-selector-dialog` | ✅ Covered | Slotted into the topnav. |
| Left report nav | `vwc-sidenav` | ✅ Covered | Data-driven `items`; shadow-DOM patched for text-only compact items. |
| Buttons (Schedule, Share, Save View, dialog actions) | `vaadin-button` | ✅ Covered | Style variants present (`primary` / `secondary` / `tertiary`); a few icon buttons. |
| Text inputs (schedule name, subject, saved-view name, search) | `vaadin-text-field` | ✅ Covered | `theme="outlined"` used. |
| Body message / description | `vaadin-text-area` | ✅ Covered | `theme="outlined"`. |
| Frequency / time / format / month selects | `vaadin-select` | ✅ Covered | `theme="outlined"`. |
| Date pickers (start/end/custom range) | `vaadin-date-picker` | ✅ Covered | `theme="outlined"`. |
| Report-type & saved-view CRUD filters | `vaadin-multi-select-combo-box` | ✅ Covered | Multi-select filtering on the CRUD grids. |
| Checkboxes (status, additional options) | `vaadin-checkbox` | ✅ Covered | — |
| Recurrence "on the Nth weekday / day" | `vaadin-radio-button` | ✅ Covered | Native radios also present in `input[name=monthMode]`. |
| Dialogs (Send/Schedule, delete, details, save view, manage schedules, etc.) | `vaadin-dialog` | ✅ Covered | Renderer/footerRenderer pattern; fixed-size overlays via `overlayClass`. |
| Report + CRUD data tables | `vaadin-grid` | ⚠️ Partial | Hand-rolled `<table class="report-table">` (completion report, training details, Saved Views, Scheduled Reports). `vaadin-grid` exists with columns/sorters/selection; the custom tables are an intentional prototype choice (custom expand/band/inline behavior), but production should evaluate `vaadin-grid`. |
| Report-type badges (`.rt-badge`) | `vwc-badge` | ⚠️ Partial | Custom CSS pills for "Qualification / Activity Exception". `vwc-badge` covers status/label pills. |
| Saved-views dropdown, Save/Share split menus, month-mode, date-range presets | `vaadin-popover` / `vaadin-menu-bar` | ⚠️ Partial | Hand-rolled anchored menus (`.sv-dropdown`, `.split-btn-menu`, `.date-range-dd`). Behaviorally bespoke (rich rows, search, custom-range calendar); acceptable for the prototype, but `vaadin-popover` is the production primitive. |
| Recipients / filter / applied-view chips | (no direct VWC chip) | ⚠️ Partial | Custom chip CSS (`.recip-chip`, `.filter-chips`, `.rvs-chip`). No dedicated VWC chip component confirmed in the index — reasonable to keep custom; candidate for a shared chip if one is added. |
| Send-once vs Schedule mode toggle | `vwc-toggle-button-group` | ⚠️ Partial | Currently hidden (mode set by entry point) — the visible pattern is fine; if re-exposed, `vwc-toggle-button-group` fits. |
| Toasts | `vaadin-notification` | ⚠️ Partial | Custom `showToast`. `vaadin-notification` is the VWC equivalent. |

---

## Design Token Usage

The prototype was built on a **Tailwind-style palette**, not the Vector Lumo tokens, so most colors are close-but-not-equal to a semantic token. Values below are quoted from themes **v1.9.3** CONTEXT.md.

| Color in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
| `#fff` (surfaces) | `--lumo-base-color` | `#fff` | ✅ Match |
| `#2563eb` (primary blue — buttons, links, active) | `--lumo-primary-color` | `#0271ce` | ⚠️ Off — Tailwind blue vs Vector blue; notable brand shift, recommend the token |
| `#1d4ed8` (darker blue accents) | `--lumo-primary-text-color` | `#0271ce` | ⚠️ Off |
| `#eff6ff` / `#dbeafe` / `#bfdbfe` (blue tints, chips) | `--lumo-primary-color-10pct` | `#0271ce1a` | ⚠️ Off |
| `#111827` (headings) | `--lumo-header-text-color` | `#000000de` | ⚠️ Off |
| `#374151` (body text) | `--lumo-body-text-color` | `#000000de` | ⚠️ Off |
| `#6b7280` (secondary text) | `--lumo-secondary-text-color` | `#00000099` | ⚠️ Off |
| `#9ca3af` (tertiary/placeholder) | `--lumo-tertiary-text-color` | `#1c304a85` | ⚠️ Off |
| `#e5e7eb` / `#d1d5db` (borders/dividers) | `--lumo-contrast-10pct` / `--lumo-contrast-20pct` | `#1a38601a` / `#1c375a29` | ⚠️ Off |
| `#dc2626` / `#b91c1c` (error, clear ×, delete) | `--lumo-error-color` / `--lumo-error-text-color` | `#d83e38` / `#ca150c` | ⚠️ Off |
| `#15803d` / `#047857` / `#ecfdf5` (success/green) | `--lumo-success-text-color` / `--lumo-success-color-10pct` | `#0a7637` / `#1688461a` | ⚠️ Off |
| `#f59e0b` (favorite star) | `--lumo-warning-color` | `#e0782e` | ⚠️ Off — amber vs Vector orange |
| `#f3f4f6` / `#f9fafb` / `#f5f7fa` (row/hover fills) | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ No direct match — flat gray tints; token is a translucent contrast |

---

## Summary

| Category | Count |
|---|---|
| ✅ Covered | 12 |
| ⚠️ Partial | 6 |
| ❌ Gap | 0 |

**Key takeaways:**
- **Component usage is strong.** Chrome (topnav, sidenav, menus), every form control, and all dialogs use the correct VWC/Vaadin components with `theme="outlined"` on inputs and proper button variants. No true gaps — nothing needs a brand-new component.
- **Biggest production follow-up is color tokens.** The prototype uses a Tailwind palette; almost every value is "off" from the Vector Lumo token. Most impactful swap: the primary blue `#2563eb` → `--lumo-primary-color` (`#0271ce`), plus the blue tints → `--lumo-primary-color-10pct`, grays → `--lumo-contrast-*`/text tokens, and the favorite star `#f59e0b` → `--lumo-warning-color`.
- **Data tables are hand-rolled.** The report and CRUD tables are custom `<table>`s (for custom expand/inline/flat behaviors). Fine for the prototype; production should weigh `vaadin-grid`.
- **Anchored menus / toasts / badges are custom** where `vaadin-popover`, `vaadin-notification`, and `vwc-badge` exist — intentional prototype departures, called out for the dev build.
- Assessment is against baseline CONTEXT.md versions (the loaded core v1.19.0 / themes v1.5.0 predate published CONTEXT.md); re-check tag/prop specifics against the version the production app ships.
