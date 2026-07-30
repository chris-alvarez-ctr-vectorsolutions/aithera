# Component Assessment
## Performance Standards for Teacher Practice (Flat Form) — flat-form.html

**Source**: Local file (`products/Evaluations/course-recs/flat-form.html`)
**Date**: 2026-07-29 (re-assessed; supersedes the 2026-07-22 pass)
**Assessed against**: core v1.19.0 loaded (CONTEXT.md unavailable; assessed against **core v1.22.1**), themes v1.5.0 loaded (CONTEXT.md unavailable; assessed against **themes v1.9.3**) — both fetched from CDN.

> Version caveat: the mock loads core v1.19.0 / themes v1.5.0, which predate the
> first published CONTEXT.md files. Assessment uses the minimum available baselines
> (core v1.22.1, themes v1.9.3). A few components/tokens flagged below may differ
> slightly from what v1.19.0/v1.5.0 actually shipped.

---

## Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Top navigation bar | `vwc-topnav` | ✅ Covered | Used with `notifications-menu` + `user-menu` slots filled by `vwc-notifications-menu` / `vwc-user-menu`. Correct. |
| Buttons (30×) | `vaadin-button` | ✅ Covered | Every instance carries a style variant (`primary`/`secondary`/`tertiary`, one `icon secondary`). No unstyled buttons. Correct per CLAUDE.md. |
| Text inputs / textareas | `vaadin-text-field`, `vaadin-text-area` | ✅ Covered | All carry `theme="outlined"`. |
| Number / date / time / datetime | `vaadin-number-field`, `vaadin-date-picker`, `vaadin-time-picker`, `vaadin-date-time-picker` | ✅ Covered | All `theme="outlined"`. |
| Select | `vaadin-select` | ✅ Covered | `theme="outlined"`; items set via JS. |
| Radio groups | `vaadin-radio-group` + `vaadin-radio-button` | ✅ Covered | `theme="horizontal"` used for inline layouts (Copy dialog). Valid. |
| Checkbox | `vaadin-checkbox` | ✅ Covered | Native label attr used. |
| All modals (Copy, Share, Assign, Validation, Signature, Quick Search, Change Log) | `vaadin-dialog` | ✅ Covered | Recently converted; renderer-driven header/body/footer per the component's slot-less API. Correct. |
| Side panels (Video review, Attachment edit) | `vwc-drawer` | ⚠️ Partial | Correct component, but driven as a standalone overlay with several `::part`/host CSS workarounds (self-anchor, scrim, width, content-height). Intentional; the DS gaps are logged in `DESIGN-SYSTEM-GAPS.md`. |
| Loading indicator (Quick Search) | `vaadin-progress-bar` | ✅ Covered | `indeterminate` used correctly. |
| Compare-mode divider / split | *(custom)* | ⚠️ Partial | Hand-rolled resizable split pane. No VWC split/layout component exists — reasonable custom. |
| Segmented control — "Mandatory / Suggested" (Assign modal) | `vwc-toggle-button-group` + `vwc-toggle-button` | ⚠️ Partial | Hand-rolled `.assign-segment` button pair. `vwc-toggle-button-group` is the intended single-select control. **Prior repo memory notes `vwc-toggle-button-group` misbehaves inside dialog renderers** (selection goes additive) — so the custom chips are a deliberate, documented workaround, not an oversight. Keep, but revisit if the component is fixed. |
| Course-list tabs (`.cl-tabs` / `.cl-tab`) | `vaadin-tabs` + `vaadin-tab` | ⚠️ Partial | Custom tab strip with count/warning adornments. `vaadin-tabs` covers the base pattern; the per-tab count/warning badges aren't native. Fine for the prototype; consider `vaadin-tabs` if adornments can be slotted. |
| Custom dropdown menus — ⋯ Actions menu, Compare menu, Add-Tags search menus (`.actions-menu`, `.q-tag-menu`) | `vaadin-popover` (+ `vaadin-list-box`/`vaadin-item`) | ✅ Covered (converted) | **`vaadin-popover` IS registered in the loaded bundle** (verified live), along with `vaadin-list-box` + `vaadin-item`. The ⋯ Actions and Compare menus are now `vaadin-popover` + `vaadin-list-box`; the Add-Tags menus use `vaadin-popover` for the overlay/positioning/outside-click with the search + checkable multi-select list in its renderer. This removed the hand-rolled fixed-positioning + outside-click code (the earlier source of the off-screen/close bugs). |
| Tags — multi-select search + chips | *(custom)* / `vaadin-multi-select-combo-box` | ⚠️ Partial | The earlier `vaadin-multi-select-combo-box` was intentionally dropped in favor of the button+search-dropdown+chips pattern (per the designer's A/B comparison). Deliberate departure. |
| Static status pills — "Off" lock pill, section/gap badges, signed badge, address chips, variant chips (`.copy-badge-off`, `.rec-section-badge`, `.rec-gap-chip`, `.sig-signed-badge`, `.rec-addr-chip`, `.details-variant-chip`) | `theme="badge …"` attribute pattern | ✅ Covered (converted) | **No badge OR chip ELEMENT exists in the loaded bundle** — `vwc-badge`, `vaadin-badge`, `vwc-chip`, `vaadin-chip`, `vwc-tag` are all unregistered (verified live). The DS ships badges as a `theme="badge <variant>"` **attribute** on a plain element (verified: a `<span theme="badge success">` picks up the tint bg + text + padding + radius from tokens). These non-interactive pills were moved to that pattern. |
| Removable / interactive chips — tag chips (`.q-tag-custom-chip`), quick-search chips (`.qs-chip`) | *(none available)* | ❌ Gap | **DS has no chip/tag element at all** (see above) and the `theme="badge"` attribute is display-only — it can't host a remove ✕ or selection behavior. These chips (removable, with an ✕ affordance) therefore **cannot** use a VWC component and remain custom of necessity. **Candidate for a new `vwc-chip` component** (removable + selectable). |
| Draggable session-timer widget | *(custom)* | ❌ Gap | No VWC floating/draggable widget. Deliberate prototype affordance; not a general component candidate. |
| Video scrubber / progress (`.q-video-progress`) | *(custom)* — NOT `vaadin-progress-bar` | ⚠️ Partial | A media scrubber (seek), not a data progress indicator; `vaadin-progress-bar` is the wrong semantic. Correct to keep custom. |
| Signature pad (canvas) | *(custom)* | ❌ Gap | No VWC signature/canvas component. Legitimately custom. |
| Comment-thread / Script transcript, rec cards, form-header meta | *(custom)* | ⚠️ Partial | Bespoke layouts with no 1:1 VWC equivalent; `vwc-card` could back the rec cards but the current custom cards carry feature-specific structure. Fine for a prototype. |

### Added in the 2026-07-29 re-assessment

Findings not covered by the previous pass. Verified against the current file.

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Course-detail slide-over (`.details-panel` + `.details-overlay`) | `vwc-drawer` | ⚠️ Partial | Built from scratch in JS at [flat-form.html:6454](products/Evaluations/course-recs/flat-form.html#L6454) — `createElement('div')` for both panel and a manual `.details-overlay` scrim, with hand-written click-to-close. The same file already drives `vwc-drawer` correctly twice for the video-review and attachment panels. **The clearest remaining inconsistency**: converting it would inherit the backdrop, `inert` content handling, focus restore, and Escape handling already solved for the other two panels — and would consolidate the drawer `::part` workarounds already logged in `DESIGN-SYSTEM-GAPS.md` into one place instead of two patterns. |
| Tooltips (23 native `title=` attributes) | `vaadin-tooltip` | ⚠️ Partial | Zero `vaadin-tooltip` in the file. Native `title` tooltips are not keyboard-accessible, can't be styled, and have an uncontrollable delay — a WCAG 2.2 AA concern given the DS targets that bar. Worth converting the informational ones (e.g. the `rec-addr-chip` "Addresses …" hints); pure-affordance ones like the ✕ "Remove" labels are lower priority since they also carry `aria-label`. |
| Section headings (`.rec-generate-title` + `.rec-generate-desc`, `.recs-zone-title` + `.recs-zone-sub`) | `vwc-headline` | ⚠️ Partial | Raw `<h1>`–`<h4>` with custom title/subtitle class pairs. Several of these hand-build exactly the icon + `header-text` + `subtext` slot structure `vwc-headline` provides. Low risk, cosmetic consolidation. |
| Section dividers (`.actions-menu-divider`, `.qs-menu-divider`, `.cl-legend-sep`) | `vwc-divider` | ⚠️ Partial | CSS `border-top` rules. Distinct from the author-selectable form-builder dividers noted in the token table — these are menu/UI separators, where `vwc-divider` applies cleanly. |
| Quick-search results table (`.qs-table` + `.qs-sort-btn`) | `vwc-sortable-header`, `vwc-paginator` | ⚠️ Partial | Raw `<table>` with a hand-rolled sort button; no `vwc-sortable-header` or `vaadin-grid` present. Sorting is already being hand-built, and `vwc-sortable-header` handles the `aria-sort` wiring on the `<th>` plus clearing sibling headers. No pagination today — flag `vwc-paginator` if the result set grows beyond a screen. |
| Collapsible course rows (`.assign-course` + chevron), question details (`.q-details`) | `vaadin-details` | ⚠️ Partial | Custom chevron-rotate disclosure driven by an `.expanded` class. `vaadin-details` supplies the disclosure semantics and ARIA. Defensible to keep given the custom header layout, but worth a look. |
| Back-nav in secondary topbar (`.topbar-back-btn`) | `vwc-bread-crumb-nav` | ⚠️ Partial | "← Evaluation Users" is a custom `<button>`. `vwc-bread-crumb-nav` covers the hierarchical trail; the surrounding topbar also hosts the title, share pill, and action cluster, so it is not a drop-in — only the back link itself is a candidate. |
| Floating cart pill (`.floating-cart`) | *(none)* | ❌ Gap | Viewport-anchored persistent count + CTA. No VWC equivalent; feature-specific, not a general component candidate. |
| Rubric rating grid (`.rubric-grid` / `.rubric-tile`) | *(none)* | ❌ Gap | Tile-based `role="radiogroup"` scoring matrix with per-level color coding. `vaadin-radio-group` covers the semantics but not the tiled scoring-matrix presentation. **Possible general-purpose candidate** — see Gap Requirements below. |

---

## Design Token Usage

Values quoted from themes CONTEXT.md (v1.9.3) at assessment time.

| Color in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
| `#fff` (surfaces, 78×) | `--lumo-base-color` | `#fff` | ✅ Match |
| `#0066cc` (`--brand`, links, primary accents) | `--lumo-primary-color` | `#0271ce` | ⚠️ Off — both mid-blue; swap to the token (slight hue shift). |
| `#0271ce` — *(not currently used)* | `--lumo-primary-color` | `#0271ce` | — reference |
| `#158444` (success green) | `--lumo-success-color` | `#158444` | ✅ Match — exact; use the token. |
| `#b91c1c`, `#991b1b`, `#dc2626` (destructive reds) | `--lumo-error-text-color` | `#ca150c` | ⚠️ Off — near error red; standardize on `--lumo-error-text-color` / `--lumo-error-color` (`#d83e38`). |
| `#fee2e2`, `#fef2f2` (error-tint backgrounds) | `--lumo-error-color-10pct` | `#e71d131a` | ⚠️ Off — semantic error tint; the token is a translucent overlay vs. the mock's solid tint. |
| `#fef3c7`, `#fffbeb` (warning-tint backgrounds) | `--lumo-warning-color-10pct` | `#ffcc001a` | ⚠️ Off — warning tint; token is translucent. |
| `#fde68a` (warning border) | `--lumo-warning-color` | `#e0782e` | ⚠️ No direct match — a light amber border; no light warning-tint border token. |
| `#92400e`, `#8a6500` (warning text) | `--lumo-warning-text-color` | `#995211` | ⚠️ Off — amber-brown warning text; use the token. |
| `#e2e4e8`, `#c4ccd6` (`--border-soft`, borders/dividers) | `--lumo-contrast-10pct` / `-20pct` | `#1a38601a` / `#1c375a29` | ⚠️ No direct match (intentional) — these solid greys are the **form-builder's divider styling**, kept deliberately consistent with the author-selectable "add divider or not" feature. Not a token deviation to fix; the solid value is required so it matches the dividers users apply. (The nearest tokens are translucent contrast overlays, which would shift against stacked surfaces.) |
| `#6b7280`, `#9aa0ac` (muted text) | `--lumo-secondary-text-color` | `#00000099` | ⚠️ Off — muted greys; token is a translucent black. |
| `#1e293b` (strong ink) | `--lumo-contrast` | `#192434` | ⚠️ Off — near-black; close to the darkest contrast token. |
| `#8b5cf6`, `#6d28d9`, `#7c3aed`, `#5b21b6` (`--rec-accent` purple) | — | — | ⚠️ No direct match — deliberate feature accent for the course-recs zone (kept distinct from `--brand`). No token equivalent; keep as a documented feature palette. |
| `#ec4899` (rec pink accent) | — | — | ⚠️ No direct match — feature accent. |
| `#eef2ff`/`#c7d2fe`/`#3730a3`/`#6366f1` (tag-chip indigo set) | — | — | ⚠️ No direct match — a self-consistent indigo chip palette; no semantic token. Consider consolidating to one accent. |
| `#f4f5f7`, `#fafbfc` (subtle fills) | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ Off — very light fills; token is translucent. |
| `#e0edff` (signature-pad tint) | `--lumo-primary-color-10pct` | `#0271ce1a` | ⚠️ Off — light primary tint; token is translucent. |
| `rgba(15,23,42,0.4)` (modal/drawer scrim) | — | — | ⚠️ No direct match — no scrim/overlay token exposed. |

Added in the 2026-07-29 pass:

| Color in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
| `#0a7637` (dark success text, 2×) | `--lumo-success-text-color` | `#0a7637` | ✅ Match — exact; second exact hit alongside `#158444`. |
| `#0271ce` (2×) | `--lumo-primary-color` | `#0271ce` | ✅ Match — exact. **Corrects the prior row** that recorded `#0271ce` as "not currently used": the file now has two occurrences, so it carries **two** primary blues (`#0066cc` and `#0271ce`). Reconciling onto the token also removes that internal inconsistency. |
| `#f0c040`, `#fde68a`, `#fef3c7`, `#fffbeb` (warning yellows) | `--lumo-warning-color` | `#e0782e` | ⚠️ Off — worth calling out explicitly: Vector's warning is **orange**, the mock's is **yellow**. This is a hue change, not a shade tweak, so a straight swap will visibly alter the warning treatments (including the six pills already on `theme="badge warning"`, which render from the token). Confirm with design before converting. |
| `#d1fae5`, `#a7f3d0`, `#065f46`, `#047857` (success tints/text) | `--lumo-success-color-10pct` / `--lumo-success-text-color` | `#1688461a` / `#0a7637` | ⚠️ Off — Tailwind emerald scale sitting alongside the two *exact* success-token hits in the same file. Inconsistent internally. |
| `#b45309`, `#b48810` (further warning text) | `--lumo-warning-text-color` | `#995211` | ⚠️ Off — brings the count to **four** distinct amber/brown text values where one token applies. |
| `#334155`, `#4b5563`, `#94a3b8` (further ink/muted greys) | `--lumo-body-text-color` / `--lumo-secondary-text-color` | `#000000de` / `#00000099` | ⚠️ Off — the muted/ink grey set is wider than the prior pass captured: six distinct values across two token slots. |
| `rgba(0,0,0,0.04 / .06 / .12 / .14 / .18)` box-shadows | Elevation levels | five levels, `0 1px 4px -1px` → `0 18px 64px -8px` | ⚠️ Off — shadows are hand-rolled throughout; themes ships a five-step elevation scale. Not previously assessed. |

**Overall palette note:** the error, warning, neutral, and much of the success scale track **Tailwind's** palette rather than Vector's. The exceptions are three exact token hits (`#158444`, `#0a7637`, `#0271ce`). This is the single largest source of drift in the file — larger than any individual component finding.

---

## Gap Component Requirements

Of the ❌ gaps, most are legitimately feature-specific (signature canvas, draggable timer,
floating cart, video scrubber). Two are worth considering as **general-purpose shared
components**, but per the skill's process both need requirements input before a spec is
written — questions first:

**`vwc-chip` (removable/selectable chip)** — the strongest candidate, carried over from the
prior pass. Still unspecced. Open questions: removable-only, or selectable too? Does it need
a leading icon/avatar slot? Sizes? Is a read-only variant needed, or does `theme="badge"`
already cover that case?

**Rubric rating grid** — are score levels a fixed scale or per-form? Single or multi-select
per criterion? Is the per-level color author-configurable (it appears to be here)? Is this
pattern used outside Evaluations?

The **split-pane comparison layout** sits between the two — genuinely reusable in principle,
but ask whether side-by-side comparison appears anywhere beyond this feature before treating
it as a library candidate.

---

## Summary

| Category | Count |
|---|---|
| ✅ Covered | 13 |
| ⚠️ Partial | 15 |
| ❌ Gap | 5 |

**Key takeaways:**

*Re-assessment (2026-07-29) — what changed since the 2026-07-22 pass:*

- **The prior pass's conversion claims all hold up.** Re-verified in the current file: the ⋯ Actions and Compare menus are `vaadin-popover` with `for=` anchoring, and six static pills carry `theme="badge contrast"` / `theme="badge warning"`. No regressions.
- **Seven new ⚠️ Partials and two new ❌ Gaps** are recorded above — chiefly the hand-rolled course-detail slide-over (which should be `vwc-drawer`, already used correctly twice in the same file), the total absence of `vaadin-tooltip` behind 23 native `title=` attributes, and the unsorted/unpaginated quick-search table.
- **`#0271ce` is now in use (2×)**, correcting the prior report's "not currently used" row — the file carries two different primary blues.
- **The token picture is worse than the prior pass conveyed.** Beyond the individual off-by-a-shade rows, the error/warning/neutral scales are systematically **Tailwind's palette**, and box-shadows bypass the five-step elevation scale entirely. The warning case needs a design decision, not a find-and-replace: Vector's warning is orange, the mock's is yellow.

*Standing findings from the prior pass (still accurate):*

- **Component usage is solid.** All form inputs carry `theme="outlined"`, every `vaadin-button` has a variant, all seven modals are `vaadin-dialog`, both side panels are `vwc-drawer`. Nothing uses a fabricated tag or an unstyled control.
- **Dropdown menus converted to `vaadin-popover`.** `vaadin-popover` + `vaadin-list-box`/`vaadin-item` are present in the loaded bundle (verified live), so the ⋯ Actions, Compare, and Add-Tags menus were moved off hand-rolled fixed-position markup — eliminating the manual positioning + outside-click code that previously caused off-screen/auto-close bugs.
- **Static pills converted to the `theme="badge"` attribute pattern.** The DS ships badges as an attribute (no badge element exists in this bundle), verified to pick up tint/text/padding from tokens. Non-interactive pills (Off/lock, section & gap badges, signed badge, address & variant chips) now use it.
- **Removable chips are a genuine ❌ gap → `vwc-chip` request.** No badge/chip/tag ELEMENT exists in the bundle, and the `theme="badge"` attribute is display-only — it can't host a remove ✕ or selection state. The tag chips and quick-search chips therefore stay custom of necessity. This is the clearest new-component candidate from the mock (removable + selectable chip).
- **Remaining ⚠️ Partials are deliberate, documented departures:** the tag *input* pattern (chosen over `vaadin-multi-select-combo-box` in an A/B), the Mandatory/Suggested segmented control (avoids the known `vwc-toggle-button-group`-in-dialog bug), the course-list tabs' count/warning adornments, and the solid grey **dividers/borders** — which are the form-builder's author-selectable divider feature, intentionally kept solid to match applied dividers (not a token deviation).
- **`vwc-drawer` overlay workarounds** (self-anchor, scrim, width, content-height) remain the most actionable DS requests — captured in `DESIGN-SYSTEM-GAPS.md`.
- **Other ❌ gaps (draggable timer widget, signature canvas)** are genuinely outside the library — appropriate as custom prototype code.
- **Token swaps still worth doing:** `#158444` → `--lumo-success-color` (exact), `#0066cc` → `--lumo-primary-color`, destructive reds → `--lumo-error-*`. Feature-accent purple/pink and the solid divider greys have no token by design.
