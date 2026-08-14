# Component Assessment
## Performance Standards for Teacher Practice (Flat Form) — [flat-form.html](flat-form.html)

**Source**: Local file
**Date**: 2026-08-06
**Assessed against**: core v1.22.1, themes v1.9.3 (fetched from CDN). The mock loads **core v1.19.0** and **themes v1.5.0**; CONTEXT.md is not published for either (minimums are core v1.22.1 / themes v1.9.3), so those baselines were substituted. Token values below are quoted from themes v1.9.3 and may differ slightly from v1.5.0.
**Scope**: Whole file, with the **Script question step** audited in depth per request.

---

## Design Element Coverage

### Script question step (focus area)

> **Converted 2026-08-06** — steps 1–3 of the remediation plan were applied after this audit. Rows below marked ✅ Covered *(converted)* were ⚠️ Partial at audit time. The tag-menu container remains ⚠️ Partial on purpose; see "Notable risk".

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Tag picker search field | `vaadin-text-field` + `vwc-icon` suffix | ✅ Covered | `theme="outlined"`, MDI glyph in `suffix` slot. Matches the Quick Search dual-listbox pattern. |
| Composer message input | `vaadin-text-area` | ✅ Covered *(converted)* | `theme="outlined"`. Manual `scrollHeight` autosize **removed** — the component self-grows; the 120px cap moved to CSS `::part(input-field)`. T/S shortcut detection now reads `input.value` with an `\|\| ''` pre-upgrade guard; Backspace-pops-pill reads `selectionStart` off `inputElement` (the host returns `undefined`). Composer border suppressed via `::part(input-field)` so the wrapper remains the visible field. |
| Edit-message input | `vaadin-text-area` | ✅ Covered *(converted)* | `theme="outlined"`, value passed as an attribute. Caret-to-end uses `inputElement.setSelectionRange` inside `requestAnimationFrame` (selection APIs don't exist on the host, and the component needs a frame to upgrade). |
| Reply composer input | `vaadin-text-area` | ✅ Covered *(converted)* | `theme="outlined"`. Focus deferred a frame after the re-render creates it. |
| Send button | `vaadin-button theme="icon primary"` | ✅ Covered *(converted)* | 30×30 footprint pinned in CSS; `disabled` still driven as a property. |
| Tag trigger button | `vaadin-button theme="icon tertiary"` | ✅ Covered *(converted)* | Borderless icon button, sized to match send. |
| Row actions (reply / edit / delete) | `vaadin-button theme="icon tertiary small"` | ✅ Covered *(converted)* | 4 instances (3 message + 1 reply), matching the `theme="icon tertiary small"` convention used in the Keystone hub mocks. Semantic hover colors kept via class. |
| Save / Cancel / Reply actions | `vaadin-button` `primary` / `tertiary` | ✅ Covered *(converted)* | Legacy `.q-script-edit-btn` CSS scoped with `:not(vaadin-button)` so `theme="primary"` supplies the fill rather than the old hand-rolled background. |
| Tag picker menu container | `vaadin-popover` | ⚠️ Partial | `<div class="q-tag-menu">` with `position: fixed` + hand-written flip/clamp positioning and a document-level outside-click handler. **The action-bar "Add Tags" picker in this same file uses `vaadin-popover` for the identical job** — two implementations of one pattern. **Deliberately NOT converted** pending the version question in "Notable risk" below. |
| Tag option rows | `vaadin-list-box` + `vaadin-item` | ⚠️ Partial | `<button class="q-tag-option">` list. Multi-select + checkmark state is currently hand-managed. Tied to the popover decision. |
| Per-button tooltips | `vaadin-tooltip` | ✅ Covered *(converted)* | 7 tooltips bound by `for=` replace the native `title=` attributes, matching the video tile / attachment card pattern. |
| Speaker reassignment chips | `vwc-toggle-button-group` | ⚠️ Partial | Plain `<button>` + `.active` class, kept **deliberately**: `vwc-toggle-button-group` behaves additively inside dialog renderers (selection doesn't clear), a known issue in this repo — plain chips are the documented workaround. |
| Speaker pill / tag chips | — | ❌ Gap | No chip/tag component in the index. CSS `<span>` is correct. See gap note. |
| Speaker avatars | — | ❌ Gap | `vaadin-avatar` is **not** in this bundle (verified absent in v1.19.0 and not in the v1.22.1 runtime list). CSS circle is correct. |
| Message / thread list | — | ❌ Gap | `vaadin-message-list` / `-message-input` are **not** in this bundle (verified absent). A comment-thread pattern has no DS equivalent — the hand-rolled log is the right call. |
| Transcript log container | `vwc-card` | ⚠️ Partial | `<div class="q-script-log">` with border/radius. `vwc-card theme="outlined"` could host it, but its always-rendering `image` slot adds phantom space — the custom container is a defensible choice. |

### Rest of the file

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Form inputs (all types) | `vaadin-text-field`, `-text-area`, `-number-field`, `-select`, `-date-picker`, `-time-picker`, `-date-time-picker`, `-multi-select-combo-box` | ✅ Covered | **All 29 text-input-style fields carry `theme="outlined"`.** Zero violations. |
| Buttons (35 instances) | `vaadin-button` | ✅ Covered | **Every instance has a style variant** (`primary`/`secondary`/`tertiary`/`icon`). Zero unstyled buttons. |
| Checkboxes / radios | `vaadin-checkbox`, `vaadin-radio-group`, `vaadin-radio-button` | ✅ Covered | Correctly no `theme="outlined"` (per CONTEXT.md that attribute is text-input only). |
| Dialogs (Copy / Share / Quick Search / Change Log) | `vaadin-dialog` | ✅ Covered | Uses `renderer` / `headerRenderer` / `footerRenderer` function properties — correct, since `vaadin-dialog` ignores slotted children. |
| Section dividers (Copy dialog) | `vwc-divider` | ✅ Covered | Added this session; replaced three boxed cards. |
| Side panels (video review, attachment detail) | `vwc-drawer` | ✅ Covered | `position="end" overlay resizable theme="no-padding"`, `closable` set via JS property (the attribute coerces truthy). Documented DS gaps compensated locally. |
| Topnav / user menu / notifications | `vwc-topnav`, `vwc-user-menu`, `vwc-notifications-menu` | ✅ Covered | — |
| Tooltips | `vaadin-tooltip` | ✅ Covered | 5 instances bound by `for=`. |
| Progress / loading | `vaadin-progress-bar` | ✅ Covered | `indeterminate` on the Quick Search generate step. |
| Tag pickers (action bar, attachment panel) | `vaadin-popover` | ⚠️ Partial | Works, but see the popover risk note — not in the documented v1.22.1 runtime. |
| Quick Search dual-listbox | `vaadin-list-box` + `vaadin-item` | ⚠️ Partial | Custom `<ul>`/`<button>` panes. Multi-select move semantics and per-pane filtering aren't a `list-box` behavior, so custom is defensible. |
| Forms accordion (Quick Search) | `vaadin-details` / `vaadin-accordion` | ⚠️ Partial | Native `<details>`/`<summary>`, chosen for free disclosure semantics + keyboard handling. `vaadin-details` is available and would be the DS-consistent choice. |
| Rating rubric tiles | — | ❌ Gap | Domain/indicator rubric grid is domain-specific; no DS equivalent. |
| Results table (Quick Search) | `vaadin-grid` / `vwc-sortable-header` | ⚠️ Partial | Plain `<table>` with custom sort carets. `vwc-sortable-header` exists for the header cells and would handle `aria-sort` automatically. |
| Badges / status pills | — | ⚠️ Partial | Uses `theme="badge …"` attribute spans (per repo convention there is no badge element). Consistent with the rest of the repo. |

---

## Design Token Usage

The mock defines a documented `:root` alias layer that already resolves most semantics to tokens (`--brand: var(--lumo-primary-color)`, `--border-soft: var(--lumo-contrast-10pct)`, `--text-strong: var(--lumo-body-text-color)`, `--text-muted: var(--lumo-secondary-text-color)`, `--card-bg: var(--lumo-base-color)`). The table covers the remaining raw values.

| Color in Mock | Nearest Token | Token Value (themes v1.9.3) | Status |
|---|---|---|---|
| `#eef0f3` (`--page-bg`) | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ Off — deliberate. Documented inline: contrast tokens are **translucent rgba**, so sticky/scroll surfaces would let content show through. Keeping opaque hex is correct. |
| `#f8f9fb` (`--workspace-bg`) | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ Off — same documented opacity rationale. |
| `#fafbfc` | `--lumo-base-color` / `--lumo-contrast-5pct` | `#fff` / `#193b670d` | ⚠️ Off — near-white surface; token swap would be a small shift. |
| `#f4f5f7` | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ Off — opaque-surface exception. |
| `#8b5cf6`, `#6d28d9`, `#7c3aed` (`--rec-*`) | — | — | ⚠️ No direct match — intentional feature accent (course-recs violet), documented as distinct from `--brand`. Keep. |
| `#6366f1`, `#3730a3`, `#5b21b6`, `#c7d2fe`, `#eef2ff` | `--lumo-primary-color` family | `#0271ce`, `-10pct` `#0271ce1a` | ⚠️ No direct match — indigo/violet ramp for the recommendations feature. Hue-shifted from the DS blue on purpose. |
| `#ec4899`, `rgba(236,72,153,0.08)` | — | — | ⚠️ No direct match — pink accent in the recs feature. |
| `#f8f5ff`, `#e2d6fa` (compare pane) | — | — | ⚠️ No direct match — violet tint marking "reference, not yours". Keep. |
| `rgba(15,23,42,0.4)` (drawer scrims) | — | — | ⚠️ No direct match — scrim overlay; no scrim token in themes. Reasonable. |
| `rgba(15,23,42,0.55–0.78)` | — | — | ⚠️ No direct match — video-stage overlay chrome. |
| `#d97706` (warning icon) | `--lumo-warning-text-color` | `#995211` | ⚠️ Off — amber vs the DS's browner warning text. The mock documents preferring the **notification** family (`--vwc-notification-*`) for its ambers because `--lumo-warning-*` is orange; this one icon still uses raw amber and **could move to `--notice-text`** for consistency. |
| `#166534` (badge-on text) | `--lumo-success-text-color` | `#0a7637` | ⚠️ Off — recommend the token; small hue shift. |
| `#0044aa` (primary pane badge) | `--lumo-primary-color` | `#0271ce` | ⚠️ Off — recommend `--brand`. |
| `#fef4e2` + domain header swatches | — | — | ⚠️ No direct match — author-selected per-question background swatches; data, not chrome. |
| `rgba(255,255,255,0.25–0.92)` | `--lumo-base-color` @ opacity | `#fff` | ⚠️ No direct match — white overlays on dark media chrome. Fine. |

---

## Gap Component Requirements

Three ❌ Gaps were found. All three are **documented gaps, not spec candidates** — each was verified absent from the bundle, and in every case the custom implementation is the correct choice for a prototype. No new-component specs are proposed; recording them so the DS team can see the demand signal.

### 1. Comment / message thread
`vaadin-message-list`, `vaadin-message`, and `vaadin-message-input` were **verified absent** from the v1.19.0 bundle and are not in the v1.22.1 documented runtime. The script step's transcript — threaded messages, per-message tags, and nested replies without timestamps — has no DS equivalent. **Outstanding decision before any spec**: whether a chat/comment surface belongs in the DS at all, or stays a product-level composition.

### 2. Chip / tag element
No chip component in the index. The mock hand-rolls three variants (speaker pill, message tag, removable tag). Given how many surfaces in this file render tag chips (action bar, attachment panel, script messages, Quick Search), a shared chip is a plausible DS addition. **Outstanding decisions**: removable vs static, icon support, selected state, max-width/truncation behavior.

### 3. Avatar
`vaadin-avatar` **verified absent**. The mock uses CSS circles with a speaker-accent background and an icon glyph. Low-value gap — trivially done in CSS.

---

## Notable risk — `vaadin-popover` is undocumented at the assessed version

`vaadin-popover` is used **17 times** in this mock (action-bar tag picker, attachment tag picker). It **is present** in the v1.19.0 bundle the mock loads — verified directly in `core.iife.js` — but it is **not listed** in the v1.22.1 CONTEXT.md Vaadin runtime inventory.

Two possible readings: it's an undocumented re-export, or it was dropped between v1.19.0 and v1.22.1. **This should be confirmed with the DS team before dev handoff**, and it argues for *not* converting the script step's tag menu to `vaadin-popover` until resolved — the hand-rolled `position: fixed` menu, while inconsistent, has no version risk.

---

## Summary

| Category | At audit | After conversion |
|---|---|---|
| ✅ Covered | 12 | **20** |
| ⚠️ Partial | 17 | 9 |
| ❌ Gap | 3 | 3 |

**Key takeaways**

- **The library-hygiene basics are clean, before and after.** Every text-input-style field carries `theme="outlined"` and every `vaadin-button` carries a style variant — zero violations of the two global rules in core CONTEXT.md, verified again post-conversion (button count 35 → 46, text-area 3 → 6, tooltip 5 → 12). Dialogs correctly use renderer properties rather than slots.
- **The script step was the file's main outlier and is now converted.** Sibling step types (text-entry, date, time, duration) all used Vaadin form components while the script step used raw `<textarea>` ×3 and `<button>` ×10. All three textareas and all ten buttons now use DS components, plus 7 `vaadin-tooltip`s replacing native `title=`.
- **The `vaadin-text-area` port needed four shadow-DOM fixes**, worth knowing for the next conversion of this kind: (1) selection APIs (`selectionStart` / `setSelectionRange`) exist only on `inputElement`, not the host — reading them off the host silently returns `undefined` and disables the shortcut; (2) `focus`/`blur` don't bubble from the shadow root, so `focusin`/`focusout` are required; (3) keydown handlers need `composedPath()` rather than `e.target.closest()`; (4) `.value` is `undefined` before upgrade, so every read needs `|| ''`. The component self-grows, so the manual `scrollHeight` autosize was deleted entirely.
- **Two items are ⚠️ Partial on purpose, not as debt**: the tag-menu container (held pending the `vaadin-popover` version question below) and the speaker-reassignment chips (`vwc-toggle-button-group` misbehaves additively in dialog renderers — plain chips are this repo's documented workaround).
- **Token discipline is strong and its exceptions are documented.** The `:root` alias layer resolves borders/text/brand/surfaces to real tokens, and the two deliberate departures (opaque scroll surfaces; the course-recs violet/pink accent ramp) are explained inline. Three small one-off values could still move to tokens: `#0044aa` → `--brand`, `#166534` → `--lumo-success-text-color`, `#d97706` → `--notice-text`.
- **Two same-job/two-implementation inconsistencies** are worth resolving regardless of component choice: the tag picker (popover vs hand-rolled fixed menu) and the search field (DS `vaadin-text-field` in the script menu and Quick Search, hand-rolled `<input>` in the other three tag menus).
