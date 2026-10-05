# Component Assessment
## Content Studio — Media Selection Flow — `products/LearningStudio/Phase1/EditorUI-updates/objectManager.html`

**Source**: Local file
**Date**: 2026-10-02
**Assessed against**: core v1.22.3, themes v1.9.3 (local cache). The mock loads **core v1.19.0** and **themes v1.5.0**, both of which predate CONTEXT.md publication (minimums are core v1.22.1 / themes v1.9.3), so this assessment uses the minimum-version fallback per CLAUDE.md.

**Scope**: The media selection flow only — the "Add Media" toolbar button and its dropdown menu, and the three media modals (`#modal-media-generate`, `#modal-media-upload`, `#modal-media-stock`) with their related CSS. The rest of the file was not assessed.

**Version availability check**: Every component recommended below was confirmed present in the **v1.19.0 bundle the mock actually loads** (verified by inspecting `core.iife.js` directly) — `vaadin-dialog`, `vaadin-popover`, `vwc-card`, `vaadin-upload`, `vaadin-tabs`, `vwc-item`, `vaadin-list-box`, `vwc-tiling-grid`, `vwc-divider`, `vaadin-select`. **No recommendation here is blocked by the older library version.**

---

## Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Prompt / search text inputs | `vaadin-text-field` | ✅ Covered | Both carry `theme="outlined"` as this repo requires. Correct. |
| Generate / Search / Cancel / Apply buttons | `vaadin-button` | ✅ Covered | 7 instances, `theme="primary"` and `theme="secondary"` used correctly. |
| Media type selector (Image / Video) | `vaadin-radio-group` + `vaadin-radio-button` | ✅ Covered | Correct `label`/`value` props, `value-changed` wiring, and a visible `label`. Per CONTEXT.md, radio groups correctly do **not** carry `theme="outlined"`. |
| **Modal shell** (all three modals) | `vaadin-dialog` | ⚠️ Partial | Hand-rolled `.modal-backdrop` / `.modal` / `.modal-header` / `.modal-footer`. `vaadin-dialog` exists and provides focus trapping, Esc-to-close, scroll locking, and `aria-modal` — **all absent here**. This is the single highest-value finding: it is an accessibility gap, not just a styling one. Note `vaadin-dialog` uses renderer functions, so adoption is a real refactor. |
| **Add Media dropdown menu** | `vaadin-popover` | ⚠️ Partial | `.add-media-menu` is a hand-rolled absolutely-positioned div with a custom `.open` class and manual outside-click handling. `vaadin-popover` provides positioning, dismissal, and focus management. The three menu rows are also close to `vwc-item` (`type="button"`, `item-role="menuitem"`), though `vwc-item` is documented as an internal primitive — using it standalone is supported but off the main path. |
| **Add Media trigger button** | `vaadin-button` | ⚠️ Partial | `.tb-btn.outline` is a hand-rolled button in the floating toolbar. `vaadin-button theme="tertiary"` or `theme="secondary"` would cover it. The toolbar is a deliberate custom glass-morphic surface, so this departure looks intentional — low priority. |
| **Upload dropzone** | `vaadin-upload` | ⚠️ Partial | `.upload-dropzone` hand-rolls drag-over states, a hidden `<input type="file">`, and a fake `.upload-browse-btn` (a `<span>` styled as a button). `vaadin-upload` provides the whole pattern including drag-drop, file-type restriction, and progress. Per CONTEXT.md it does **not** need `theme="outlined"`. Strong candidate — this is a near-exact match to what the component does. |
| **Stock results grid** | `vwc-tiling-grid` + `vwc-tiling-grid-tile` | ⚠️ Partial | `.stock-grid` is a fixed `repeat(3, 1fr)` CSS grid. `vwc-tiling-grid` auto-fits via `--vwc-tiling-grid-cell-min-width` and would be responsive. Caveat worth knowing: it uses `grid-auto-flow: dense`, so tiles may not render in DOM order — acceptable for a stock library, but it changes behavior. |
| **AI version stepper** (`‹ 1 / 3 ›`) | `vwc-stepper` / `vwc-paginator` | ⚠️ Partial | `.ai-ver-bar` hand-rolls prev/next buttons and a count. Neither library component is a clean fit — `vwc-stepper` models a multi-step wizard and `vwc-paginator` models page-size + page-number controls. The custom control is reasonable; flagging only so the dev team knows it was considered and rejected deliberately. |
| **Style picker dropdown** | `vaadin-select` / `vaadin-list-box` + `vwc-item` | ⚠️ Partial | `.ai-style-trigger` + `.ai-style-dropdown` is a hand-rolled listbox with `role="listbox"` and `aria-haspopup`. `vaadin-select` with a renderer covers this, and the ARIA comes free. Note: my project memory records that `vaadin-select` is the **preferred** control in this repo unless stated otherwise, which supports adopting it here. |
| **Edit-mode ratio segmented control** | `vwc-toggle-button-group` | ⚠️ Partial | `.aec-seg` + `.aec-seg-btn.active` hand-rolls a two-option segmented control. `vwc-toggle-button-group` is the real component for this. **Important:** it requires a `name` attribute to work in single-select — it delegates mutual exclusion to native radio grouping, and without `name` it behaves additively. That missing attribute is why several other mocks in this repo abandoned it. |
| **Zoom slider** | — | ❌ Gap | `.aec-slider` is a native `<input type="range">`. There is **no slider/range component** in the VWC core index. A styled native input is the correct call. See Gap Requirements below. |
| Modal minimize button | `vaadin-button theme="icon"` | ⚠️ Partial | `.modal-minimize-btn` with a custom CSS `.minimize-tooltip`. `vaadin-button theme="icon"` plus `vaadin-tooltip` would cover both halves. |
| Video badge / duration chip on stock tiles | `theme="badge"` | ⚠️ Partial | `.stock-video-len` is a custom dark pill. Vaadin ships Lumo badge styles applied via `theme="badge contrast"` on a `<span>`. Note the duration chip needs a dark translucent scrim over imagery, which the badge theme will not replicate — this departure is probably justified. |
| Header / footer separators in modals | `vwc-divider` | ⚠️ Partial | `.modal-header` / `.modal-footer` use `border-bottom: 1px solid #f3f4f6`. Low value to change; noting for completeness. |

---

## Design Token Usage

All token values below are quoted from the cached `context/themes/v1.9.3/CONTEXT.md` at assessment time.

| Color in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
| `#0ea5e9` (dropzone hover, stock focus, `.upload-item-edit:hover`, scrollbar) | `--lumo-primary-color` | `#0271ce` | ⚠️ **Off** — the mock's sky-blue is noticeably lighter and greener than Vector's primary. This is the most pervasive token drift in scope: it appears as the interactive/accent color across all three modals. Recommend `--lumo-primary-color`; expect a visible shift to a deeper blue. |
| `rgba(14,165,233,0.2)` (stock grid scrollbar thumb) | `--lumo-primary-color-10pct` | `#0271ce1a` | ⚠️ Off — same `#0ea5e9` family at ~20% vs. the token's 10%. |
| `#f3f4f6` (menu hover, menu item dividers, modal header/footer borders) | `--lumo-contrast-5pct` / `--lumo-contrast-10pct` | `#193b670d` / `#1a38601a` | ⚠️ Off — neutral grey vs. the tokens' blue-tinted translucency. **Caution:** these tokens are translucent overlays, not opaque greys (a known issue recorded in project memory). On the modal surface that is fine; do not substitute them onto a sticky/overlapping element without checking. |
| `#0f2e3d` (`.modal-title`) | `--lumo-header-text-color` | `#000000de` | ⚠️ Off — the mock uses a deliberate dark teal-navy; the token is a near-black alpha. Arguably an intentional brand-ish choice, but it is unmanaged. |
| `#f9fafb` (dropzone resting background) | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ Off — very close in effect; translucency caveat applies. |
| `#f0f9ff` (dropzone drag-over background) | `--lumo-primary-color-10pct` | `#0271ce1a` | ⚠️ Off — correct *semantic* intent (a primary-tinted hover), wrong hue family. |
| `#7c3aed` + `#ede9fe` (AI menu icon + modal title icon) | — | — | ⚠️ **No direct match** — purple is the AI-feature accent across this mock and has no semantic equivalent in the theme. Leave as-is; worth noting as an intentional product-level accent, not an error. |
| `#2563eb` + `#dbeafe` (Upload menu icon) | `--lumo-primary-color` / `--lumo-primary-color-10pct` | `#0271ce` / `#0271ce1a` | ⚠️ Off — a *third* blue in scope (alongside `#0ea5e9` and the token blue). Consolidating these is the cheapest consistency win available. |
| `#dcfce7` (Stock menu icon background) | `--lumo-success-color-10pct` | `#1688461a` | ⚠️ Off — pairs with `--lumo-success-color`, which the same rule **already uses correctly** for the foreground. Swapping the background completes the pair. |
| `rgba(0,0,0,0.4)` (`.modal-backdrop`) | — | — | ⚠️ No direct match — no scrim token is published. Adopting `vaadin-dialog` makes this moot (it supplies its own overlay). |
| `.modal` box-shadow `0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)` | `--lumo-box-shadow-xl` | `0 4px 24px -3px #1c375a29, 0 18px 64px -8px #1c324f61` | ⚠️ Off — a published elevation scale exists (`xs`/`s`/`m`/`l`/`xl`) and is unused throughout. The menu's `0 8px 24px rgba(0,0,0,0.12)` maps similarly to `--lumo-box-shadow-m`. |
| `rgba(0,0,0,0.55 / 0.62 / 0.68)` (video badge, tile edit button) | — | — | ⚠️ No direct match — dark scrims over imagery. Correctly left as raw values. |
| `var(--lumo-base-color)`, `var(--lumo-contrast-10pct)`, `var(--lumo-contrast-20pct)`, `var(--lumo-success-color)`, `var(--lumo-secondary-text-color)`, `var(--lumo-disabled-text-color)`, `var(--lumo-body-text-color)`, `var(--lumo-contrast)` | — | — | ✅ **Match** — already tokenized. Roughly half the CSS in scope uses tokens correctly; the drift is concentrated in the accent blues and the neutral greys. |

---

## Gap Component Requirements

### ❌ Gap — Slider / Range input

The zoom control (`.aec-slider`) is a native `<input type="range">`. Walking the full component index confirms **no slider, range, or numeric-scrubber component exists** in VWC core (`vaadin-number-field` is a text input with steppers, not a continuous range).

This is a genuine gap, but it is **design-blocked** rather than ready for a spec. Before a shared component could be specified, the team would need to decide:

- Is a continuous range control a pattern Vector needs generally, or only inside media editing?
- Does it need a visible value readout, tick marks, or a dual-handle (min/max) variant?
- Should it share the form-control label/helper/error anatomy that `vaadin-text-field` uses?

Recorded as a documented gap. **Recommendation for this mock: keep the styled native input** — it is accessible by default, keyboard-operable, and the right call for a prototype.

---

## Summary

| Category | Count |
|---|---|
| ✅ Covered | 3 |
| ⚠️ Partial | 12 |
| ❌ Gap | 1 |

**Key takeaways:**

- **What's solid:** every form control the flow actually uses — text fields, buttons, the radio group — is a real VWC component with correct props and the right `theme` values. About half the CSS in scope already uses theme tokens.

- **The one finding with user impact: the modals are not `vaadin-dialog`.** All three hand-roll the shell, which means **no focus trap, no Esc-to-close, no scroll lock, and no `aria-modal`**. Everything else in this report is consistency; this one is accessibility. It is also the largest refactor, since `vaadin-dialog` is renderer-based.

- **`vaadin-upload` is the best effort-to-value swap.** The dropzone hand-rolls drag-over state, a hidden file input, and a `<span>` dressed as a button — which is precisely what the component provides, and it needs no `theme="outlined"`.

- **Three different blues are doing one job.** `#0ea5e9` (interactive accent), `#2563eb` (upload icon), and the actual `--lumo-primary-color` `#0271ce` all appear in this flow. Consolidating on the token is the cheapest coherence win, though it will visibly deepen the accent color — a design decision, not a mechanical find-and-replace.

- **The published elevation scale is unused.** `--lumo-box-shadow-xs` through `-xl` exist; every shadow in scope is hand-authored.

- **If the segmented ratio control is ever swapped to `vwc-toggle-button-group`, it must carry a `name` attribute.** The component delegates single-select to native radio grouping; without `name` it behaves additively. That undocumented requirement is why other mocks in this repo abandoned the component — worth capturing in the handoff so the dev team doesn't rediscover it.

- **Scope note:** this audit covers the media selection flow only. The LO lock/provenance surfaces, scene list, and question/citation panels were not assessed.
