# Component Assessment
## Evaluation Form — [ver1/index.html](ver1/index.html)

**Source**: Local file
**Date**: 2026-08-14
**Assessed against**: core **v1.22.1**, themes **v1.9.3** (fetched from CDN).
The mock loads **core v1.19.0** and **themes v1.5.0**; CONTEXT.md is not published
below core v1.22.1 / themes v1.9.3, so those baselines were substituted. Token
values quoted below come from themes v1.9.3 and may differ slightly from v1.5.0.
**Scope**: The locked V1 handoff version, in full.

> **Supersedes** the 2026-08-06 audit, which was written against the pre-handoff
> `course-recs/flat-form.html`. **+31 component instances** have landed since —
> the script step's conversion to DS components, the paired start/end timer, the
> deleted form state, and share-on-signature in three signature modals.
> Component totals: **109 → 140**, with no removals.

---

## What changed since the last audit

| Tag | Then | Now | Δ | Driver |
|---|---|---|---|---|
| `vaadin-button` | 35 | 51 | **+16** | Script row actions, timer controls, restore, back |
| `vaadin-tooltip` | 5 | 12 | **+7** | Replaced native `title=` on script row actions |
| `vaadin-text-area` | 3 | 6 | **+3** | Script composer, message edit, comment composer |
| `vaadin-number-field` | 4 | 7 | **+3** | Timer custom-result h/m/s fields |
| `vaadin-text-field` | 3 | 4 | **+1** | Script tag-menu search |
| `vwc-icon` | 2 | 3 | **+1** | Script tag-menu search glyph |

Net effect: the script step moved from ⚠️ Partial to ✅ Covered across its inputs,
buttons, and tooltips — the single biggest coverage gain in this file.

---

## Design Element Coverage

### Global rules (core CONTEXT.md, "Theme requirements")

| Rule | Result |
|---|---|
| Text-input fields carry `theme="outlined"` | ✅ **0 violations** across 34 input-style fields |
| `vaadin-button` carries a style variant | ✅ **0 violations** across 51 buttons |

Variant distribution: `primary` ×16, `tertiary` ×14, `secondary` ×11,
`icon tertiary small` ×5, `icon tertiary` ×3, `icon secondary` ×1, `icon primary` ×1.

### Components in use — all verified present in the loaded v1.19.0 bundle

| Design Element | Component | Status | Notes |
|---|---|---|---|
| Topbar shell | `vwc-topnav`, `vwc-user-menu`, `vwc-notifications-menu` | ✅ Covered | — |
| Buttons (all) | `vaadin-button` | ✅ Covered | Every instance variant-tagged. Icon-only buttons need a local override for the theme's tertiary label underline — see gap 2. |
| Tooltips | `vaadin-tooltip` | ✅ Covered | 12 instances, bound by `for=`. Native `title=` eliminated from the script step. |
| Text inputs | `vaadin-text-field`, `-text-area`, `-number-field` | ✅ Covered | All `theme="outlined"`. Script step's 3 textareas converted; see the shadow-DOM notes in DEV-NOTES. |
| Date/time | `vaadin-date-picker`, `-time-picker`, `-date-time-picker` | ✅ Covered | All `theme="outlined"`. |
| Selects / multi-select | `vaadin-select`, `-multi-select-combo-box` | ✅ Covered | All `theme="outlined"`. |
| Checkboxes / radios | `vaadin-checkbox`, `-radio-group`, `-radio-button` | ✅ Covered | Correctly no `theme="outlined"` (text-input only). **`vaadin-radio-button` is undocumented at v1.22.1** — see gap 3. |
| Dialogs | `vaadin-dialog` | ✅ Covered | Uses `renderer` / `headerRenderer` / `footerRenderer` function properties — correct, since this component ignores slotted children. |
| Section dividers | `vwc-divider` | ✅ Covered | Copy Form dialog. |
| Side panels | `vwc-drawer` | ✅ Covered | `position="end" overlay resizable theme="no-padding"`; `closable` set as a JS property (the attribute coerces truthy). Both capped at 50vw desktop / 100vw mobile. |
| Progress | `vaadin-progress-bar` | ✅ Covered | `indeterminate` on Quick Search generate. |
| Icons | `vwc-icon` | ✅ Covered | MDI paths, used in `suffix` slots. |
| Popovers | `vaadin-popover` | ⚠️ Partial | Works in v1.19.0 but **undocumented at v1.22.1** — see gap 1. |

### Hand-rolled — a component exists but wasn't used

| Design Element | Component that exists | Status | Notes |
|---|---|---|---|
| Change Log tabs | `vaadin-tabs` + `vaadin-tab` | ⚠️ Partial | `<button class="cl-tab">` + `role="tablist"`. A straightforward swap; the custom version exists for the compact underline styling. |
| Quick Search forms accordion | `vaadin-details` | ⚠️ Partial | Native `<details>`/`<summary>`, chosen for free disclosure semantics + keyboard handling. `vaadin-details` is the DS-consistent choice. |
| Tag picker menus (script step) | `vaadin-popover` | ⚠️ Partial | Hand-rolled `position: fixed` menu with flip/clamp positioning. **The action-bar tag picker in this same file uses `vaadin-popover` for the identical job** — two implementations of one pattern. Held pending gap 1. |
| Tag option rows | `vaadin-list-box` + `vaadin-item` | ⚠️ Partial | `<button class="q-tag-option">`; multi-select + checkmark state hand-managed. Tied to the popover decision. |
| Quick Search results table | `vaadin-grid` / `vwc-sortable-header` | ⚠️ Partial | Plain `<table>` with custom sort carets. `vwc-sortable-header` would handle `aria-sort` automatically. |
| Dual-listbox panes | `vaadin-list-box` | ⚠️ Partial | Custom `<ul>`/`<button>`. Move semantics and per-pane filtering aren't list-box behaviours, so custom is defensible. |
| Privacy toggle | `vwc-toggle-button-group` | ⚠️ Partial | **Deliberate** — that component behaves additively outside a form context (repo-documented). Plain buttons + `.active`. |
| Speaker reassignment chips | `vwc-toggle-button-group` | ⚠️ Partial | **Deliberate** — same additive-selection issue inside dialog renderers. |
| Pass/Fail buttons | `vwc-toggle-button-group` | ⚠️ Partial | Same reasoning; 13 instances. |
| Transcript log container | `vwc-card` | ⚠️ Partial | `<div class="q-script-log">`. `vwc-card theme="outlined"` could host it, but its always-rendering `image` slot adds phantom space. |
| Status pills / badges | — | ⚠️ Partial | `theme="badge …"` attribute spans, per repo convention (no badge element exists). |

### New in this version

| Design Element | Component | Status | Notes |
|---|---|---|---|
| Paired timer (start/end) | `vaadin-button` + `vaadin-number-field` | ✅ Covered | One clock per `timerId`; both halves are views of the same state, so they can't drift. Custom result via 3 outlined number fields. |
| Deleted-state banner | — | ⚠️ Partial | Custom banner. `vaadin-notification` exists but is transient (toast); a persistent sticky state banner has no DS equivalent. Reasonable custom. |
| Share-on-signature opt-in | — | ⚠️ Partial | Native `<input type="checkbox">` rather than `vaadin-checkbox`. **Actionable**: `vaadin-checkbox` is available and used elsewhere in this file (6×); this is the one inconsistent checkbox. |
| Rating rubric tiles | — | ❌ Gap | Domain/indicator grid, 26 instances. No DS equivalent. |
| Comment / message thread | — | ❌ Gap | `vaadin-message-list` / `-message` / `-message-input` **verified absent** from the bundle. |
| Chips / tags | — | ❌ Gap | No chip component. Hand-rolled in 4 places (speaker pill, message tag, custom tag chip, attachment tag). |
| Avatars | — | ❌ Gap | `vaadin-avatar` **verified absent**. CSS circles. |

---

## Design Token Usage

The mock defines a documented `:root` alias layer that already resolves most
semantics to real tokens: `--brand: var(--lumo-primary-color)`,
`--border-soft: var(--lumo-contrast-10pct)`,
`--text-strong: var(--lumo-body-text-color)`,
`--text-muted: var(--lumo-secondary-text-color)`,
`--card-bg` / `--surface-opaque: var(--lumo-base-color)`, and the notice family
mapped to `--vwc-notification-*`. The table covers the remaining raw values.

| Color in Mock | Nearest Token | Token Value (themes v1.9.3) | Status |
|---|---|---|---|
| `rgba(216, 62, 56, 0.06)` — deleted-state wash | `--lumo-error-color` @ 6% | `#d83e38` | ✅ **Match** — 216,62,56 **is** `#d83e38`. Recommend `color-mix(in srgb, var(--lumo-error-color) 6%, transparent)` or an error tint token instead of the literal rgba. **New since last audit.** |
| `#d97706` — warning icon | `--lumo-warning-text-color` | `#995211` | ⚠️ Off — amber vs the DS's browner warning text. The mock documents preferring `--vwc-notification-*` for ambers; this icon could move to `--notice-text` (`#a66900`). |
| `#166534` — badge-on text | `--lumo-success-text-color` | `#0a7637` | ⚠️ Off — recommend the token; small hue shift. |
| `#0044aa` — primary pane badge | `--lumo-primary-color` | `#0271ce` | ⚠️ Off — recommend `--brand`. |
| `#eef0f3` (`--page-bg`), `#f8f9fb` (`--workspace-bg`), `#fafbfc`, `#f4f5f7` | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ Off — **deliberate and documented**: contrast tokens are translucent rgba, so a sticky/scrolling surface would let content show through. Opaque hex is correct here. |
| `#8b5cf6`, `#6d28d9`, `#7c3aed` (`--rec-*`) | — | — | ⚠️ No direct match — intentional course-recs violet accent, documented as distinct from `--brand`. |
| `#6366f1`, `#3730a3`, `#5b21b6`, `#c7d2fe`, `#eef2ff` | `--lumo-primary-color` family | `#0271ce`, `-10pct` `#0271ce1a` | ⚠️ No direct match — indigo/violet ramp for the recommendations feature, hue-shifted on purpose. |
| `#ec4899`, `rgba(236,72,153,0.08)` | — | — | ⚠️ No direct match — pink accent, recs feature. |
| `#f8f5ff`, `#e2d6fa` — compare pane | — | — | ⚠️ No direct match — violet tint marking "reference, not yours". |
| `rgba(15,23,42,0.4)` — drawer scrims | — | — | ⚠️ No direct match — no scrim token in themes. |
| `rgba(15,23,42,0.55–0.78)` | — | — | ⚠️ No direct match — video-stage overlay chrome. |
| `rgba(255,255,255,0.25–0.92)` | `--lumo-base-color` @ opacity | `#fff` | ⚠️ No direct match — white overlays on dark media chrome. |
| `#fef4e2` + domain header swatches | — | — | ⚠️ No direct match — author-selected per-question backgrounds; data, not chrome. |

88 distinct hardcoded values total. The count is up from the last audit, but the
additions are concentrated in the deleted state (one value, and it's a ✅ Match)
and the timer (which uses `--brand` / `--text-*` aliases throughout).

---

## Documented gaps — confirm before build

### 1. `vaadin-popover` is undocumented at v1.22.1 (**highest risk**)
Used **4 element instances / ~17 references** (actions menu, compare menu, tag
pickers). **Verified present** in the v1.19.0 bundle this mock loads; **`popover`
appears zero times** in the v1.22.1 CONTEXT.md runtime inventory. Either an
undocumented re-export or dropped between versions. **Confirm with the DS team** —
if dropped, these menus need a different component, which changes what devs build.
This is why the script step's tag menu was *not* converted to `vaadin-popover`
despite the inconsistency.

### 2. `theme~=icon` does not reset the tertiary label underline
The Vector theme sets
`vaadin-button[theme~=tertiary]::part(label){text-decoration:underline}`, and
`theme~=icon` never resets it — so an icon-only tertiary button gets an underline
struck through the glyph. Worked around locally, but the override must
**out-specify** the theme rather than merely follow it, because `themes.js` injects
via `document.adoptedStyleSheets`, which applies *after* every `<style>` element.
Affects 9 icon-only buttons here. **DS fix: add `text-decoration: none` to the
`theme~=icon` label rule.**

### 3. `vaadin-radio-button` is undocumented at v1.22.1 (**new finding**)
10 instances. `vaadin-radio-group` **is** listed in the v1.22.1 runtime inventory
but `vaadin-radio-button` is not — despite a group being unusable without buttons
inside it. Verified present in the v1.19.0 bundle. Reads as a documentation
omission rather than a removal (low risk), but worth confirming alongside gap 1.

### 4. `vwc-toggle-button-group` behaves additively outside a form context
Selection doesn't clear inside dialog renderers. Repo-documented; plain buttons
with an `.active` class are the standard workaround. Affects the privacy toggle,
speaker chips, and 13 pass/fail buttons.

### 5. No DS equivalent (verified absent from the bundle)
Comment/message threads (`vaadin-message-*`), chips, and avatars
(`vaadin-avatar`). The hand-rolled implementations are the right call; recorded as
demand signal. Chips are the strongest candidate for a shared component — 4
distinct hand-rolled variants in this file alone.

Longer-form notes: [`../course-recs/DESIGN-SYSTEM-GAPS.md`](../course-recs/DESIGN-SYSTEM-GAPS.md)

---

## Summary

| Category | Previous audit | This audit |
|---|---|---|
| ✅ Covered | 20 | **13 element groups** (broader per-row grouping) |
| ⚠️ Partial | 9 | **15** |
| ❌ Gap | 3 | **4** |

Row counts aren't directly comparable — this audit groups by design element rather
than by individual tag, and adds rows for the timer, deleted state, and
share-on-sign that didn't exist before. The meaningful movement is **the script
step going from Partial to Covered** on inputs, buttons, and tooltips.

**Key takeaways**

- **Library hygiene is clean and got cleaner.** 0 of 34 input fields miss
  `theme="outlined"`; 0 of 51 buttons miss a style variant — verified after
  +31 instances landed. Dialogs correctly use renderer properties, not slots.
- **The script step is no longer the outlier.** Its 3 textareas, 10 buttons, and 7
  tooltips are now DS components, matching every sibling question type.
- **Three actionable items, all small**: the deleted-state wash is literally
  `--lumo-error-color` at 6% and should reference the token; the share-on-sign
  opt-in is the file's only native `<input type="checkbox">` where
  `vaadin-checkbox` is used 6× elsewhere; and `#0044aa` / `#166534` / `#d97706`
  could move to `--brand` / `--lumo-success-text-color` / `--notice-text`.
- **One new documentation gap found**: `vaadin-radio-button` (10 uses) is absent
  from the v1.22.1 runtime list, same as `vaadin-popover`. Low risk, but it means
  **two** of this file's tags aren't in the documented inventory.
- **`vaadin-popover` remains the only finding that could change the build.** Still
  unresolved; still the reason the script tag menu stays hand-rolled.
