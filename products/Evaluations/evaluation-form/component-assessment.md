# Component Assessment
## Evaluation Form (V2 — accessibility pass) — ver2/index.html

**Source**: Local file
**Date**: 2026-09-16
**Assessed against**: core v1.22.3, themes v1.9.3 (local cache). The mock loads
core v1.19.0 / themes v1.5.0; neither publishes a CONTEXT.md (both return 404
from the CDN, and both predate the v1.22.1 / v1.9.3 minimums), so the nearest
available baseline was used.

**Scope**: This audit covers **only the changes made in the V2 accessibility
pass** — 401 added lines versus ver1 — not the whole mock. Those changes are:
the script composer, transcript rows and reply composer; the rating-rubric
reflow; the date/time and dropdown width rules; the single-row mobile header
(including Compare Forms moving into the ⋯ menu); the attachment-card reflow;
and the small tap-target fixes.

---

## Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Date / time / select width caps | `vaadin-date-picker`, `vaadin-time-picker`, `vaadin-date-time-picker`, `vaadin-select` | ✅ Covered | Existing DS components kept. Changes are layout-only (`width`, `max-width`, `min-width`) plus `--vaadin-field-default-width`, which is Vaadin's own documented custom property (verified live: resolves to `12em`). All four carry the mandatory `theme="outlined"`. |
| Script composer field | `vaadin-text-area` | ✅ Covered | Unchanged component; only `flex-wrap`/`flex-basis` on the wrapper and `::part(input-field)` min-height. Both `input-field` and `label` parts verified against the live shadow DOM. |
| Reply composer field + buttons | `vaadin-text-area`, `vaadin-button` | ✅ Covered | Stacking is layout-only. The label fix trims the **host** padding on the existing `vaadin-button`; no custom button was introduced. Buttons retain their `theme="tertiary"` / `theme="primary"` variants. |
| Transcript row actions (reply / edit / delete) | `vaadin-button theme="icon tertiary small"` | ✅ Covered | Existing DS buttons. Only footprint changed (40px → 32px below 360px, 28px for reply delete) — both still clear the 24px minimum. |
| Compare Forms in the ⋯ menu | `vaadin-popover` + existing `.actions-menu-item` pattern | ✅ Covered | New menu item is structurally identical to its five siblings (`<button class="actions-menu-item" type="button" role="menuitem">` + Font Awesome icon), rendered into the real `vaadin-popover`. No new menu primitive invented. |
| Compare chooser anchor | `vaadin-popover` (`for="compareFormsBtn"`) | ✅ Covered | The anchor button is collapsed with `width: 0; opacity: 0` rather than `display: none`, specifically so the DS popover retains a positioning anchor. Working *with* the component's contract, not around it. |
| Rating rubric reflow | — (custom `.rubric-grid` / `.rubric-tile`) | ⚠️ Partial | Pre-existing custom radio-card pattern, not introduced here; V2 only changed `grid-template-columns`. A DS equivalent would be `vaadin-radio-group` + `vaadin-radio-button`, but those don't render full-bleed descriptor cards with colour bars. Deliberate departure — leave as-is for the prototype. |
| Attachment card reflow | — (custom `.q-attachment-card`) | ⚠️ Partial | Pre-existing custom card; V2 only added `flex-wrap`, `max-width: 100%` and a full-width filename below 560px. `vwc-card` exists but is a content-surface component, not a compact file chip with inline actions. Departure predates this work. |
| ⋯ menu divider | `vwc-divider` | ⚠️ Partial | I added a third `.actions-menu-divider` to match the two already in the menu. `vwc-divider` (with `inset` / `inset-start` / `inset-end`) is the DS component for this. Matching the existing siblings was the right local call, but the whole menu could adopt `vwc-divider` in one sweep at implementation. |
| Single-row mobile header | — (custom `.topbar`) | ⚠️ Partial | Hand-rolled app chrome that predates this work; `vwc-topnav` exists but this is a page-level action bar, not the product topnav (the real `vwc-topnav` sits above it). V2 only restacked the existing Back crumb (`vaadin-button theme="tertiary"`) and title. Intentional departure. |

---

## Design Token Usage

The 401 added lines introduce **zero hardcoded colour values** — no hex, `rgb()`,
or `hsl()`. The only colours referenced are existing variables:

| Colour in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
| `var(--text-muted)` | `--lumo-secondary-text-color` (via local alias) | `#00000099` | ✅ Match — the mock aliases `--text-muted: var(--lumo-secondary-text-color)` |
| `var(--lumo-contrast-20pct)` | `--lumo-contrast-20pct` | `#1c375a29` | ✅ Match — DS token used directly |
| `var(--notice-tint)` | `--vwc-notification-color-10pct` (via local alias) | `#ffc7001a` | ✅ Match — the mock aliases `--notice-tint: var(--vwc-notification-color-10pct)` |

One raw value, `#8a4b00`, appears in the diff context but is **pre-existing in
ver1** (`.cl-tab-warning` copy colour) — not introduced by this work. Worth a
token swap eventually; out of scope here.

Everything else added in V2 is a layout property — `flex`, `grid-template-columns`,
`width`, `min-height`, `padding`, `gap`, `order` — which carries no colour and
needs no token.

---

## Summary

| Category | Count |
|---|---|
| ✅ Covered | 6 |
| ⚠️ Partial | 4 |
| ❌ Gap | 0 |

**Key takeaways:**

- **No new components were invented and none were replaced.** Every V2 change is
  a layout or sizing adjustment on components the mock already used. The audit
  found no case where the accessibility work reached for custom HTML in place of
  an available VWC component.
- **Token discipline is clean.** Zero hardcoded colours across 401 added lines;
  the three colour references all resolve to real DS tokens, quoted above from
  themes v1.9.3.
- **Shadow-DOM contracts were respected.** The three `::part()` targets
  (`input-field`, `label`) and `--vaadin-field-default-width` were verified
  against the live components rather than assumed. Where no part is exposed — the
  date-time picker's internal `.slots` flex row — the layout was **not** forced;
  the two halves stay side by side instead, which is why that picker is the one
  element still cramped at 320px.
- **All four ⚠️ Partials predate this work** (rubric cards, attachment chips,
  custom topbar) except the menu divider. None are regressions introduced by the
  accessibility pass; they're existing prototype decisions worth a look at
  implementation.
- **One concrete cleanup for dev:** the ⋯ menu's dividers could become
  `vwc-divider`. Low priority, cosmetic parity only.

**Caveat on the version gap:** the mock runs core v1.19.0 / themes v1.5.0, three
minor versions behind the assessed baseline. Tag names, the `theme="outlined"`
requirement, and the token values quoted here are stable across that range, but
a component added after v1.19.0 would not be available to this mock. Worth
confirming at implementation if any ⚠️ Partial is converted to a DS component.
