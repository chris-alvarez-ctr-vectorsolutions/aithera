# Component Assessment
## EHS Mobile App — Main (current scope) — `products/EHS/Mobile App - main.html`

**Source**: Local file
**Date**: 2026-07-29
**Assessed against**: core v1.22.1, themes v1.9.3 (fetched from CDN)
<!-- The mock loads NO @vector-web-components/core or /themes bundle — only assets v1.0.0
     (Open Sans fonts). Versions above are the minimum CONTEXT.md baselines, used as the
     comparison reference. -->

> **Read this first.** This prototype simulates a **native mobile app** inside a phone
> frame. It deliberately loads no VWC/Vaadin runtime and contains zero `vaadin-*`/`vwc-*`
> elements — every pattern is hand-rolled HTML/CSS, which is a reasonable choice for a
> native-app design target (VWC ships web components for web apps). The value of this
> report is therefore (1) mapping each hand-rolled pattern to its nearest VWC concept so
> a web counterpart stays consistent, and (2) checking that the color language matches
> Vector theme tokens — which it largely does.

---

## Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Phone frame + top app bar (screen title, back button) | `vwc-topnav` | ⚠️ Partial | Deliberate native-mobile idiom. `vwc-topnav` is a web app bar; not a fit inside a phone frame. Keep custom. |
| Bottom navigation bar (`.bottom-nav`, `.nav-badge`) | — (nearest: `vaadin-tabs`) | ❌ Gap | No VWC bottom-nav exists. Whether a shared component is warranted depends on the mobile delivery stack (see Gap notes). |
| Record cards, V2 design (`.record-card-row`, type row, sections, footer) | `vwc-card` | ⚠️ Partial | Custom mobile card with upload-status pills and section rows. `vwc-card` slots (`header`/`content`/`actions`) could host an equivalent on web. Departure looks intentional. |
| Status badges / pills (`.badge-pending`, `-submitted`, `-missing`, `-downloaded`, `-waitingsync`, form-status, risk levels) | — | ❌ Gap | No badge/chip component exists in core v1.22.1's index. This is the mock's most reused custom pattern (upload status model + risk ratings). |
| Filter chips row (`.records-chips-row`, `.rs-fac-chip`, removable `applied-chip-x`) | — (nearest: `vwc-toggle-button-group`) | ⚠️ Partial | Toggle-button-group covers select/deselect semantics on web, but not removable "applied filter" chips. Related to the badge/chip gap above. |
| Records filter bottom sheet (`.filter-sheet-*`) | `vwc-drawer` (`position="bottom"`, `overlay`) | ⚠️ Partial | Drawer covers bottom-sheet mechanics on web (overlay, backdrop, close). The mock's sheet is a mobile idiom with Apply/Reset footer; composition would be custom. |
| Action sheet (`.sheet-action`, `.sheet-action-danger`) | `vwc-drawer` / `vaadin-dialog` | ⚠️ Partial | Mobile action sheet; drawer-from-bottom is the nearest web equivalent. |
| JSA wizard step indicator (`.jsa-stepper`, chevron steps) | `vwc-stepper` + `vwc-stepper-step` | ⚠️ Partial | VWC stepper exists (linear mode, `complete`, `errorMessage`). Mock hand-rolls a compact mobile variant. A web version of this wizard should use `vwc-stepper`. |
| Wizard form fields (text, textarea, selects — 25 inputs) | `vaadin-text-field`, `vaadin-text-area`, `vaadin-select`, `vaadin-date-picker` (all `theme="outlined"`) | ⚠️ Partial | Native-styled mobile inputs. On web these map 1:1 to outlined Vaadin fields. |
| Buttons (`.btn-primary`, `.btn-ghost`; 282 `<button>`s) | `vaadin-button` (`primary` / `tertiary`) | ⚠️ Partial | Two-variant system maps cleanly to Vaadin `primary` and `tertiary`. Color modifiers (`error primary`) cover the danger actions. |
| Edit-mode / filter toggles (`.editmode-toggle`, `.jsa-filter-toggle`) | `vwc-switch`, `vwc-toggle-button-group` | ⚠️ Partial | Switch semantics exist in VWC; mock styles its own for the mobile look. |
| Toast / snackbar (`#toast`, `.ca-toast`, copy-ID action) | `vaadin-notification` | ⚠️ Partial | Notification covers timing/positioning on web; mock's toast carries an inline action button. |
| Offline sync + conflict-resolution dialogs (all-or-nothing, side-by-side yours/theirs) | `vaadin-dialog` (renderer-based) | ⚠️ Partial | Bespoke flow by design; on web this composes inside `vaadin-dialog` with custom content. The yours=green / theirs=indigo comparison layout is fully custom. |
| Record view read-only screens (`screen-ro-*`) sectioned content | `vaadin-details` / `vwc-card` | ⚠️ Partial | Collapsible sections map to `vaadin-details` on web. |
| Attachments (thumbnail grid, add-attachment) | `vaadin-upload` | ⚠️ Partial | Upload covers file intake on web; camera-first capture is native territory. |
| Sync progress (offline syncing screen) | `vwc-spinner`, `vaadin-progress-bar` | ⚠️ Partial | Hand-rolled indicators; direct equivalents exist for web. |
| Signature capture (`screen-jsa-signature`, `screen-ro-signature`) | — | ❌ Gap | Nothing in VWC. Typically a native SDK / canvas control. |

---

## Design Token Usage

Token values quoted from themes v1.9.3 CONTEXT.md at assessment time.

| Color in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
| `#0271ce` (110 uses — primary actions, links, active nav) | `--lumo-primary-color` | `#0271ce` | ✅ Match |
| `rgba(2,113,206,0.1)` | `--lumo-primary-color-10pct` | `#0271ce1a` | ✅ Match (1a ≈ 10%) |
| `rgba(2,113,206,0.08)` / `0.05` / `0.65` | `--lumo-primary-color-10pct` / `-50pct` | `#0271ce1a` / `#0271cec2` | ⚠️ Off — custom alpha tints; recommend the 10pct/50pct tokens |
| `rgba(0,0,0,0.87)` (body text) | `--lumo-body-text-color` | `#000000de` | ✅ Match (de = 0.87) |
| `rgba(0,0,0,0.6)` | `--lumo-secondary-text-color` | `#00000099` | ✅ Match (99 = 0.6) |
| `rgba(0,0,0,0.55)` / `0.5` / `0.45` / `0.7` | `--lumo-secondary-text-color` | `#00000099` | ⚠️ No direct match — in-between alphas; consolidate on the token |
| `rgba(0,0,0,0.4)` / `0.35` | `--lumo-disabled-text-color` | `#00000061` (0.38) | ⚠️ Off — recommend the token |
| `#ca150c` (error text) | `--lumo-error-text-color` | `#ca150c` | ✅ Match |
| `#0a7637` (success text) | `--lumo-success-text-color` | `#0a7637` | ✅ Match |
| `#168846` (success accents) | `--lumo-success-color` | `#158444` | ⚠️ Off — one step brighter; note `#168846` is the base of `--lumo-success-color-10pct` (`#1688461a`) |
| `rgba(22,136,70,0.12)` (success tint) | `--lumo-success-color-10pct` | `#1688461a` | ⚠️ Off — 12% vs 10% |
| `#985211` (warning text) | `--lumo-warning-text-color` | `#995211` | ⚠️ Off — off by one hex digit; recommend the token |
| `#fff` | `--lumo-base-color` | `#fff` | ✅ Match |
| `#f5f9fd` (canvas) | — | — | ⚠️ No direct match — this is the documented EHS canvas value (product CLAUDE.md); keep as product standard |
| `#e5e7eb`, `#d1d5db`, `#f3f4f6`, `#f9fafb`, `#9ca3af`, `#64748b`, `#526583` (neutrals) | `--lumo-contrast-10pct` / `-20pct` / `-40pct`, `--lumo-secondary-text-color` | `#1a38601a` / `#1c375a29` / `#1c324f61`, `#00000099` | ⚠️ No direct match — Tailwind-style opaque grays vs Vector's blue-tinted alpha contrast scale; visually close, not equal |
| `#0065ba`, `#0261b4` (pressed/darker blues) | `--lumo-primary-color` | `#0271ce` | ⚠️ No direct match — custom pressed-state shades; no darker semantic token exists |
| `#1a2940`, `#1e1e1e`, `#3a3a3c` (dark surfaces/text) | `--lumo-contrast` | `#192434` | ⚠️ Off — near-black utility shades |
| `rgba(0,0,0,0.05–0.1)` (dividers, shadows) | `--lumo-contrast-5pct` / `-10pct` | `#193b670d` / `#1a38601a` | ⚠️ Off — neutral black vs blue-tinted contrast tints |

---

## Gap Component Requirements

All three gaps are **documented gaps** rather than full specs: each has an outstanding
platform decision that should be answered first (native mobile vs web/hybrid delivery
determines whether a VWC component is even the right vehicle).

### 1. Status badge / chip
The mock's most reused custom pattern: upload-status pills (Pending Upload, Pending
Update, Missing Fields, Uploaded, Downloaded, Waiting to sync), form-status badges, and
risk-level chips. Core v1.22.1's index has **no badge or chip component**, and web mocks
across this repo hand-roll the same thing.
**Open decisions:** semantic variant set (success/warning/error/info/neutral vs free
color), removable "applied filter" chip variant, icon slot, size scale.

### 2. Bottom navigation (mobile)
Three-tab bottom nav with badge counts. No VWC equivalent; `vaadin-tabs` is the nearest
web concept.
**Open decisions:** is EHS mobile shipping native (then this is a native pattern, not a
VWC candidate) or web/hybrid? Badge counts, center FAB accommodation.

### 3. Signature capture
Draw-to-sign canvas used by the JSA signature step and shown in read-only records.
**Open decisions:** native SDK vs web canvas component; storage format (vector strokes vs
raster); re-sign/clear affordances; audit metadata (who/when) display.

---

## Summary

| Category | Count |
|---|---|
| ✅ Covered | 0 |
| ⚠️ Partial | 14 |
| ❌ Gap | 3 |

**Key takeaways:**

- **Zero VWC usage is intentional, not an error.** This is a native-mobile prototype in a
  phone frame; it loads only the assets package (fonts). Every ⚠️ Partial above is a
  deliberate mobile idiom with a named web-side equivalent for consistency.
- **The color language is strongly token-aligned.** Primary (`#0271ce`), error text
  (`#ca150c`), success text (`#0a7637`), body text (`rgba(0,0,0,0.87)`) and secondary text
  (`rgba(0,0,0,0.6)`) all match lumo semantic tokens exactly — the mobile design and the
  web design system agree on the core palette.
- **Two one-step drifts worth fixing in the design source:** warning text `#985211` vs
  token `#995211` (single hex digit), and success accent `#168846` vs `--lumo-success-color`
  `#158444`.
- **Neutrals drift from the system.** Borders/surfaces use Tailwind-style opaque grays
  (`#e5e7eb`, `#d1d5db`, …) instead of Vector's blue-tinted alpha contrast scale. Visually
  close; a dev implementing the web counterpart should use `--lumo-contrast-*` tokens, not
  the hex values.
- **Status badge/chip is the standout component gap** — heavily reused here and across
  other repo mocks with no core component to reach for. Bottom nav and signature capture
  are platform-decision-blocked.
