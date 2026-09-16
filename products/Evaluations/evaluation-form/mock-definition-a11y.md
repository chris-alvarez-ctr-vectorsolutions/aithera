# Mock Definition — Evaluation Form · 400% Zoom Accessibility Pass (V2)

**Mock**: `ver2/index.html`
**Version handed off**: V2 — companion to the V1 desktop handoff
**Dev build**: `dev_handoff_a11y.html` (this pass) · `dev_handoff.html` (V1 desktop, unchanged)
**PRD source**: none provided — mock-only definition (see *Reconciliation*)
**Date**: 2026-09-16
**Components confirmed against**: core v1.19.0, themes v1.5.0 (loaded); assessed against vendored `context/` core v1.22.3, themes v1.9.3

> **Read this first — and read it *second*.** This is a **companion** document,
> not a replacement. [`mock-definition.md`](mock-definition.md) remains the
> primary build brief: it specifies the form itself, all 19 question types, the
> dialogs, and the workflow. **Read that first.** This file covers only what
> changed in the accessibility pass, so a developer implementing the form needs
> both.

---

## Two dev builds — read this before you open either

This feature has **two** dev builds at the feature root, and they are not
interchangeable:

| Build | Source | Covers |
|---|---|---|
| [`dev_handoff.html`](dev_handoff.html) | `ver1/index.html` | The original desktop design. Still the reference for the full feature set. |
| [`dev_handoff_a11y.html`](dev_handoff_a11y.html) | `ver2/index.html` | This pass: 400% zoom / small-viewport behavior, **minus** the course-recommendations feature. |

**The product dashboard card links only the first one.** The dashboard tooling
supports exactly one dev build per card, so the a11y build is reached by direct
URL:

- **Dev Page (GitHub Pages)**
  `https://vectorlearning.github.io/ux-mockups/products/Evaluations/evaluation-form/dev_handoff_a11y.html`
- **Dev HTML (GitHub blob)**
  `https://github.com/vectorlearning/ux-mockups/blob/main/products/Evaluations/evaluation-form/dev_handoff_a11y.html`

See [`DASHBOARD-GAP.md`](DASHBOARD-GAP.md) for the tooling limitation and the
proposed fix (owned by the dashboard maintainer, not this handoff).

**Where the two builds disagree, V2 wins on layout below 980px** and V1 remains
the reference for everything else. V2 is byte-identical to V1 at ≥1024px except
for the removed recommendations feature — verified, not assumed (see *Verification*).

---

## Summary

V2 makes the evaluation form usable at **400% browser zoom** and at phone
widths, and removes the course-recommendations feature.

400% zoom on a 1280px display yields a **320px CSS viewport**, which is below
every breakpoint the original design had. The work targets two WCAG 2.2 AA
criteria:

- **1.4.10 Reflow** — no horizontal scrolling at a 320px viewport.
- **2.5.8 Target Size (Minimum)** — interactive targets at least 24×24 CSS px.

**Scope boundary — important.** This pass covers *only* those two criteria.
**Colour contrast (1.4.3), keyboard navigation and focus order (2.1.1 / 2.4.3),
and screen-reader semantics are explicitly NOT covered here** — per the
designer, those are handled by dev at implementation time and are not a design
deliverable. Do not read "accessibility pass" as "fully WCAG AA."

**Design constraint honoured throughout**: the desktop UI was not to change.
Every fix is additive CSS inside `max-width` media queries.

---

## What changed from V1

Ten changes, grouped. Each is CSS-only unless noted.

### Reflow fixes (WCAG 1.4.10)

| # | Area | Problem at 320px | Fix |
|---|---|---|---|
| 1 | **Rating rubric** | `.q.layout-next-to .rubric-grid` pinned the grid to 4 columns at *every* width, defeating the existing breakpoints. Tiles rendered **53px wide** and level labels ("Exemplary") were clipped by the tile's `overflow: hidden` — actual content loss. | Re-applied the column reflow in the next-to variant; long labels wrap. |
| 2 | **Rating rubric (all widths)** | The 4→2→1 ladder only reached one column at 560px, leaving a 2-column band from 980px→560px with ~216–250px tiles — too narrow to read a descriptor. | **One tile per row below 980px**, both layouts. Per the designer this is a non-negotiable form-design rule, not just an overflow fix. |
| 3 | **Date / time / select fields** | Kept their natural width (date-time picker **338px**) and pushed past the viewport. | Capped to the column below 720px; `--vaadin-field-default-width` overridden so the picker's two halves shrink. |
| 4 | **`.q-dropdown`** | `min-width: 240px` overflowed narrow columns. | Released at the same breakpoint. |
| 5 | **Attachment cards** | `inline-flex` + `max-width: 300px` + nowrap filename couldn't shrink into the ~230px column; pushed **43px past the card edge** and clipped their own action buttons. | Below 560px the card fills the column and wraps: filename on its own line, actions right-aligned beneath. |

### Script (transcript) question

| # | Area | Problem | Fix |
|---|---|---|---|
| 6 | **Composer field** | Tag + send buttons and gaps left the textarea **108px** wide (~13 characters). | Below 560px the row wraps: full-width field, buttons beneath. 108px → **204px** at 320px. |
| 7 | **Speaker pill** | Once a speaker is tagged, the pill (~99px) renders in the field's `prefix` slot — the same nowrap row as the textarea — eating ~40% of the field (152px of typing width at 375px). | Pill moves to its own line above the text. 152px → **259px**. |
| 8 | **Transcript rows** | Name, timestamp and the ~120px action group competed for one line; the timestamp broke mid-value ("9:43" / "PM"). | Avatar kept; **speaker name stacked over timestamp** beside it; actions right. Buttons drop 40px→32px below 360px (still ≥24px). |
| 9 | **Reply composer** | A nowrap row of [textarea, Cancel, Comment] crushed the textarea to **7px wide × 270px tall** — a vertical sliver — while Comment overflowed the card. Replying was impossible. | Stacked: full-width field, buttons sharing the line below. 7px → **187px** at 375px. |

### Header

| # | Area | Problem | Fix |
|---|---|---|---|
| 10 | **Mobile header** | The actions cluster (191px: Cancel + Compare + Save + ⋯) was wider than the space beside the title, forcing a 3-row, **142px** header. | **Compare Forms moved into the ⋯ menu**; Back crumb stacked above the title. Header **142px → 98px**, title and actions on one row. |

### Tap targets (WCAG 2.5.8)

| Control | Before | After |
|---|---|---|
| `.notes-toggle` ("Add notes") | 71×21 | 71×**24** |
| `.q-video-summary-open` | 99×21 | 99×**24** |
| `.q-tag-custom-chip-x` (tag ×) | 15×15 | **24×24** |

### Feature removal

**The course-recommendations feature is gone from V2** — −1,771 lines. Removed:
the recommendations zone, the Generate/Refresh flow, rec cards, the course cart
and floating widget, the whole Assign-courses modal, the course-details drawer,
the `COURSES` mock catalog, and ~800 lines of associated CSS.

V1's `mock-definition.md` already listed this panel as *"a prototype experiment,
flagged rather than specified"* and out of scope — so this removal aligns the
mock with what was already the handoff position. **Do not build it.**

Two consequential behaviour changes fall out of the removal:

- **Submit** no longer shows the "pending course recommendations will be
  discarded" confirmation — it goes straight to the submitted modal.
- **Save draft** no longer warns that recommendations aren't stored — it saves
  and toasts directly.

---

## Reconciliation

**No PRD was provided** for this pass (none exists for the V1 handoff either).
Per the wrap-up process, the PRD→mock and mock→PRD passes are omitted — there is
nothing to reconcile against — and only **Potential gaps** applies.

The two WCAG criteria in scope act as the de-facto requirements, and both are
met at a 320px viewport across five interactive states (see *Verification*).

### Potential gaps

States neither the V2 work nor V1's brief addresses. These are not defects in
the mock — they are decisions a developer will otherwise hit in QA.

| Gap | Where | Note |
|---|---|---|
| **Date-time picker stays 2-up at 320px** | DateTime question | Its two halves sit in a shadow-DOM flex row (`.slots`) that exposes **no `part`** and is `flex-wrap: nowrap`, so page CSS cannot stack them. Four approaches were tried; the only one that changed anything pushed the time field off-screen. Both halves stay legible (127px / 101px) and inside the viewport, but cramped. **A true stack requires replacing the component with separate `vaadin-date-picker` + `vaadin-time-picker` — a visible design change, not taken.** |
| **Long speaker labels** | Transcript rows | `.q-script-who` uses `flex: 1 0 auto` and will not shrink, so a speaker label much longer than "Teacher"/"Student" could push the action buttons toward the card edge. Only the two seeded speakers were tested. |
| **Very long filenames** | Attachment cards | The filename now wraps rather than ellipsizing below 560px, so a pathological filename grows the card vertically. No max-line clamp is specified. |
| **Landscape phone / short viewports** | Video review panel | Verified at 320×512 and 320×640 portrait. A short landscape viewport (e.g. 640×320) was not tested; the panel is `height: 100vh` with internal scroll, so it should hold, but it is unverified. |
| **Text-only zoom (1.4.4)** | Whole form | This pass covers *page* zoom (1.4.10). Browser text-only zoom / 200% text resize (**1.4.4 Resize Text**) was not separately tested. |
| **Reduced-motion** | Toolbox + drawers | No `prefers-reduced-motion` handling was added or audited. |
| **The two builds will drift** | Both handoffs | V1's `dev_handoff.html` still contains the course-recommendations feature and none of these fixes. If the form changes again, both builds need regenerating or one needs retiring. |

---

## Behavior & data (not visible in the mock)

Everything in V1's [`mock-definition.md` → *Behavior & data*](mock-definition.md)
still applies unchanged — this pass added no new data, state, or network
behavior. Two additions specific to V2:

- **The ⋯ menu's Compare Forms item is width-conditional.** It is injected by
  the popover renderer only when `window.matchMedia('(max-width: 720px)')`
  matches, so it never double-appears alongside the standalone button on
  desktop. If the header is reimplemented, that pairing must be preserved — the
  menu item and the CSS that hides the button are two halves of one behavior.
- **`#compareMenuWrap` is collapsed with `width: 0; opacity: 0`, deliberately
  NOT `display: none`.** The compare chooser's `vaadin-popover` is anchored
  `for="compareFormsBtn"`; a `display: none` anchor gives the overlay nothing to
  position against and it opens **empty**. This was hit and fixed during the
  work — please don't "tidy" it back to `display: none`.

---

## Component confirmation

**Full audit**: [`component-assessment.md`](component-assessment.md) — run
against this version and committed. Summary:

| Category | Count |
|---|---|
| ✅ Covered | 6 |
| ⚠️ Partial | 4 |
| ❌ Gap | 0 |

- **No new components were invented and none replaced.** All 401 added lines are
  layout/sizing adjustments on components the mock already used.
- **Zero hardcoded colours** across the added lines. The three colour references
  resolve to real tokens: `--lumo-secondary-text-color` (`#00000099`),
  `--lumo-contrast-20pct` (`#1c375a29`), `--vwc-notification-color-10pct`
  (`#ffc7001a`).
- **Shadow-DOM contracts verified, not assumed.** The `::part(input-field)` /
  `::part(label)` targets and `--vaadin-field-default-width` were confirmed
  against the live components.
- **All four ⚠️ Partials predate this work** (rubric cards, attachment chips,
  custom topbar) except the ⋯ menu divider, which could adopt `vwc-divider`.
- Every Vaadin form field carries the mandatory `theme="outlined"`; every
  `vaadin-button` carries a theme variant.

---

## Verification

Measured with Playwright, not eyeballed.

**WCAG 1.4.10 + 2.5.8 at a 320px viewport** (400% zoom on 1280px) — five
interactive states, all passing with zero overflow, zero undersized targets, no
clipped text, and no page errors:

1. Initial load (empty form) 2. Fully filled form 3. ⋯ menu open
4. Script reply composer open 5. Video review panel open

The same audit passes against **`dev_handoff_a11y.html`** itself, not just the
design file.

**No horizontal overflow** at 1440 / 1280 / 1024 / 768 / 600 / 400 / 320 / **280**px.

**Desktop unchanged** — layout boxes are pixel-identical to V1 at 1024px, 1280px
and 1440px. Attachment cards measure 307×42 in both V1 and V2 at 600/768/1024/1280px.

**Functionality after the changes**: script notes post (tagged with speaker),
replies post and delete, video upload → review panel → timestamped annotation
saves, rubric selection works at 375/768/1280, attachment edit + remove work at
320 and 1280, fill-all and save work. 30 questions and 3 rubrics render with no
console errors.

---

## Open questions

1. **Does the date-time picker need to stack at 320px?** It currently does not
   (see *Potential gaps*). Stacking means dropping `vaadin-date-time-picker` for
   two separate fields — a design decision, not a CSS one.
2. **Which build is authoritative long-term?** V1 has the recommendations
   feature and no a11y work; V2 has the a11y work and no recommendations.
   Someone should decide whether V1 is retired once this lands.
3. **Do the ⋯ menu dividers become `vwc-divider`?** Cosmetic DS parity, flagged
   in the component assessment. Low priority.
4. **The 980px rubric threshold** was chosen because it was the existing
   breakpoint. If rubrics should also stack on small laptops, that number moves.
5. **Everything flagged in V1's Open questions still stands** — notably that the
   locking signature does not lock and `handleSubmit` is dead code. Those are
   unchanged by this pass.

---

## Handoff notes

⚠️ **Do not ship the Design Toolbox.** `dev_handoff_a11y.html` loads
`../../../designtoolbox/toolbox.js`. That is **review tooling, not product** —
strip that one `<script>` line (and the `window.TOOLBOX` line above it) for
production. The toolbox dock must never reach a real user.

- **Comments are OFF and the flow map is OFF** in this build
  (`window.TOOLBOX = { comments: false, flowMap: false }`), matching the V1
  handoff's configuration. This mock predates flow-map scaffolding, so there is
  no flow map and therefore **no `DEV-NOTES.md` entry for this pass** — the
  per-screen detail in the existing [`DEV-NOTES.md`](DEV-NOTES.md) still applies
  to the form itself.
- **All V2 changes are additive CSS inside `max-width` media queries.** Nothing
  in the desktop path was modified, so the desktop implementation can proceed
  from V1's brief without re-reading this one — but the responsive rules here
  must come along with it.
- **Breakpoints used**: 980px (rubric stacking), 720px (field width caps, header
  collapse), 560px (script + attachment reflow), 360px (transcript button
  sizing). These are the existing breakpoints in the file; no new scale was
  introduced.
