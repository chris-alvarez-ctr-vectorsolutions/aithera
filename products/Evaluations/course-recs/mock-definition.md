# Mock Definition — Evaluation Form · Course Recommendations (V3)

**Mock**: `ver3/index.html`
**Version handed off**: V3
**Dev build**: `dev_handoff.html` (this folder)
**PRD source**: none provided — see *Reconciliation*
**Date**: 2026-09-25
**Components confirmed against**: core v1.19.0, themes v1.5.0, course-list v1.5.10, lms v1.3.10 (the bundles the mock actually loads)

> **Read this first.** This document captures what the visual mock cannot show on
> its own: the edge cases still to build, the behaviour and data behind the
> screens, and the Vector components to build with. Per-screen detail lives in
> **`DEV-NOTES.md`** beside this file.

---

## Summary

The course-recommendations feature adds a pinned bottom dock to the evaluation
form. Once every required question is answered the banner slides into view;
**Generate recommendations** runs a match against the evaluation's low-rated
components and opens a drawer holding up to **8 assignable courses** from the
reviewer's libraries, plus up to **4 gated courses** available in other
libraries. The reviewer selects courses, opens **Configure Assignment** to set
one shared schedule, and assigns without leaving the form.

**In scope for this handoff:** everything under `.rec-dock` — the banner, the
drawer, both `vwc-course-list` grids, the assignment modal, the Learn More
modal, and the component's own Course Details dialog.

**Out of scope:** the surrounding evaluation form (rubric rows, signature pads,
compare panes, attachments, quick search). Those belong to other prototypes and
were neither audited nor reconciled here.

---

## Reconciliation

**No PRD or requirements document was provided.** The feature was aligned in
meetings and carries approval from Product and Engineering, so the two
PRD-relative passes (*Requirements missed in the mock* and *In the mock but not
in the requirements doc*) are omitted — there is no document to reconcile
against, and inventing requirements to fill them would be worse than leaving
them out. The third pass, **Potential gaps**, ran in full and is the substance
of this section.

### Potential gaps

| Area | Edge case | Current handling | What's needed |
|---|---|---|---|
| Generate | **Failure / error** | ❌ none — `getCourses` is `Promise.resolve`, no `.catch` anywhere | **See the Failure states callout below.** |
| Assignment | **Failure / partial failure** | ❌ none — `commitAssignment()` marks every cart course assigned and closes | **See the Failure states callout below.** |
| Assignment | **Date validation** | ❌ none — no `min`/`max`, no ordering check | **See the Date validation callout below.** |
| Generate | Loading | ✅ bar shows a working state; drawer stays collapsed until results land | Replace the simulated `REC_SEARCH_MS` (1600ms) with the real call |
| Drawer | Empty — no low ratings | ✅ "No performance gaps identified" | — |
| Drawer | Empty — gaps but no licensed matches | ✅ "No matching courses in your libraries" | — |
| Gated list | Empty | ✅ `no_courses_msg` | — |
| Drawer | Zero after invalidation | ✅ changing an answer clears the run and returns the bar to Generate | — |
| Assignment | Duplicate assign | ✅ assigned courses go into `disabledCourseIds` and come back badged | Confirm the real API is idempotent |
| Recs | **Permissions / roles** | ❌ no role model — anyone who can open the form can assign | Confirm who may assign; gate the CTA if it is not universal |
| Recs | Concurrency | ❌ not addressed | What happens if the evaluation is edited in another tab/session mid-assignment? |
| Recs | Offline | ❌ not addressed | Confirm whether the form is used offline; if so, Generate needs an offline state |
| Cards | Boundary — long titles | ⚠️ component clamps lines; untested with very long titles | Spot-check a 120-character course title |
| Assignment | Destructive confirmation | ✅ leaving with unassigned selections warns on submit/save-draft | — |
| Reflow | 320px / 400% zoom | ✅ no horizontal overflow in any state | One residual risk — see *Open questions* |

---

### ⚠️ Callout: Failure states are undefined and must be specified by Engineering

**Nothing in this feature has a failure path.** Both service seams resolve
successfully by construction, and no code path anywhere in the recommendations
feature catches a rejection:

| Seam | Mock implementation | Line |
|---|---|---|
| Recommendation search | `getCourses: () => Promise.resolve(courses)` | `ver3/index.html` (both lists) |
| Assignment commit | `assignCourses: () => Promise.resolve({ success: true })` | licensed list |
| Local commit | `commitAssignment()` — marks every cart course assigned, unconditionally | — |

**This is a deliberate gap, not an oversight in the design.** The correct
behaviour depends on technical details the design does not have: which errors
the recommendation engine and the assignment API can return, whether assignment
is atomic or per-course, whether a partial failure leaves some courses assigned,
and whether failures are retryable.

**Needed from Engineering before this can be designed:**

1. The error shapes each endpoint can return (timeout, 4xx, 5xx, empty).
2. Whether assignment is **atomic** (all-or-nothing) or **per-course** — this
   decides whether a partial-failure UI is needed at all.
3. Whether a failed generate is retryable in place, and whether a failed
   assignment leaves the selection intact so the reviewer can retry.
4. Timeout budget for the search, so the working state's copy can be honest.

Once those land, the states to design are: **search failed**, **search timed
out**, **assignment failed**, and — if assignment is not atomic —
**assignment partially failed**. The working state and the drawer's existing
empty states are the surfaces they attach to.

---

### ⚠️ Callout: Assignment date validation must match the current SafeLMS implementation

The three date fields in **Configure Assignment** — Effective, Due, Expire —
carry **no validation at all**. There is no `min`/`max` on any
`vaadin-date-picker`, and no ordering check before commit, so the mock will
currently accept:

- a **Due date before the Effective date**;
- an **Expire date before the Due date** (a course that expires before it is due);
- any of the three set in the **past**.

**This is not a design decision to make fresh — it must mirror SafeLMS.** The
field labels and help text in this mock were already taken verbatim from the
SafeLMS "Select Dates" assignment step, and the validation should come from the
same place so the two surfaces cannot disagree.

**Needed:** the SafeLMS rules for each field — permitted ranges, the ordering
constraints it enforces, whether past dates are allowed, which fields are
required, and the exact error copy it shows. Implement those rules here rather
than deriving new ones.

---

## Behavior & data (not visible in the mock)

**Data sources — every one of these is mock data in the prototype:**

- `COURSES` is a hardcoded 23-course catalog (16 licensed, 7 unlicensed) defined
  in-file. Replace with the real catalog.
- **Matching**: `COURSE_BY_COMPONENT` maps rubric component ids to courses via
  each course's `addresses` array. A course is a candidate when the evaluation
  rates one of its components at or below `LOW_RATING_MAX_INDEX` (1).
- **Ranking**: results are sorted by **match strength** — how many of the
  evaluation's low-rated components the course addresses — with ties broken on
  catalog id for stability. This is a prototype stand-in for whatever the real
  recommendation engine scores on.
- **Caps**: `MAX_RECS_SHOWN = 8` licensed, `MAX_UNLICENSED_SHOWN = 4` gated.
- **Assignee** is hardcoded as `{ name: 'Austin Smith' }` — wire to the
  evaluation's subject.
- **Latency** is simulated at `REC_SEARCH_MS = 1600`.

**Validation rules:** none implemented for the assignment dates — see the
callout above. The only gate in the feature is `allRequiredAnswered()`, which
controls whether the banner is visible at all.

**States & transitions:**

Two independent axes, both recomputed on every render so they cannot disagree:

- **`data-gate`** — `closed` until every required question is answered, at which
  point the whole dock slides up. Removing a required answer closes it again and
  the dock slides out, clearing any pending selection.
- **`data-state`** — `ready` (Generate CTA) → `generating` (working state in the
  collapsed bar) → `results` (drawer opens onto the list).

Changing any answer after generating **invalidates the run**: the recommendations
clear, the cart clears, and the bar returns to `ready`. There is no Refresh —
regenerating is the only path to a new list.

**Interactions / navigation:** the chevron toggles the drawer; **Select All** and
**Configure Assignment** delegate to the component's public API; **Details** opens
`vwc-course-card`'s own read-only dialog; **Learn More** opens one informational
modal for the whole gated group.

**Permissions / roles:** not modelled — see *Potential gaps*.

---

## Component confirmation

Scope: the course-recommendations feature only — `.rec-dock` / `.rec-bar` / `.rec-drawer`, the two `<vwc-course-list>` grids, the assignment modal (`ensureAssignDialog` / `renderAssignModal` / `renderAssignSettingsBlock`), the upsell Learn More modal, and `showValidationModal` where the rec feature calls it. The surrounding evaluation form (rubric rows, signature pads, compare panes, attachments, quick-search) belongs to other prototypes and was not audited.

Assessed against the **exact bundles the mock loads** — core `v1.19.0`, themes `v1.5.0`, lms `v1.3.10`, course-list `v1.5.10` — downloaded from the CDN and grepped directly, because core v1.19.0 / themes v1.5.0 predate published CONTEXT.md files (minimums are core v1.22.1 / themes v1.9.3). Prop and token documentation is quoted from the repo's vendored context at `context/core/v1.22.3`, `context/themes/v1.9.3`, `context/lms/v1.3.10`, `context/course-list/v1.5.10`; every v1.22.3-documented API relied on by the rec feature was re-verified present in the v1.19.0 bundle and is called out below where it matters.

### Summary

| Category | Count |
|---|---|
| ✅ Covered | 11 |
| ⚠️ Partial | 6 |
| ❌ Gap | 0 |

**Key takeaways**

- **Component usage is correct and unusually well-sourced.** Every tag, prop, event, part and i18n key the rec feature uses was verified present in the v1.19.0 / v1.5.10 / v1.3.10 bundles. Nothing is fabricated, nothing is unverified, and no v1.22.3-only API is being relied on. All three `vaadin-date-picker` instances carry `theme="outlined"`; all four `vaadin-button` instances carry a variant (`primary` / `tertiary`). No hand-rolled dropdown, dialog, tooltip, spinner or paginator — the rec feature reaches for the component every time one exists.
- **The hand-rolled `.rec-dock` decision still holds at v1.19.0, and for a stronger reason than the one on file.** The blocking constraint is not `overlayBreakpoint` — it is that `vwc-drawer` has no collapsed state at all: its stylesheet carries `:host(:not([open])) div.drawer-column { display: none; }`, so "closed" means the whole drawer disappears. There is no persistent bar to dock. (Two secondary notes: `position="bottom"` **does** exist at v1.19.0, contrary to a possible assumption; and the `overlayBreakpoint` criticism is confirmed accurate — its `ResizeObserver` observes `this`, the drawer host, so the breakpoint compares the drawer's own width, never the viewport.) **Keep the hand-roll.**
- **Two of the three known component-team defects are confirmed verbatim in the shipped bundles. The third is not a defect — it is already fixable from the mock.** `version_label` is a documented i18n key on `vwc-course-card`, forwarded from the list via `cardI18n`, so the "Version" → "Variant" rename needs a one-line prop change, not a library change. See the Component-team defects section — this one should come **off** the library ask list.
- **Four shadow-DOM reaches must be flagged at handoff**, all in `shrinkCourseCards()`. They are cosmetic, degrade safely, and are correctly documented in-file — but they are unsupported reaches into sealed internals, not APIs. Each has a specific library ask attached below.
- **Theme-token discipline is strong.** Only two literal hex values survive in the entire rec feature's CSS, one of which is dead. The `--lumo-contrast-*` translucency rule is correctly understood and applied. One easy improvement: the two blue palette values the feature hardcodes (`#1a4c61`, `#ecf8fd`) **do exist as real custom properties in the themes v1.5.0 bundle the mock loads** — the inline comment's reason for hardcoding them is more conservative than it needs to be.

---

### Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Recommendation card grids (licensed + upsell) | `vwc-course-list` | ✅ Covered | Both grids are the real component. Correct API throughout: `courseListService`, `courseAssignmentService`, `courseAssignee`, `courseDefinition`, `multi`, `disableSelection`, `selectedCourseIds`, `disabledCourseIds`, `i18n`, and `payload` as the fetch trigger (a fresh `{ batch: batchSeed, … }` object per mount, per the documented "same reference does not re-trigger" gotcha). `card-heading-level="3"` is the documented attribute form of `cardHeadingLevel`. |
| Course cards | `vwc-course-card` (via the list) | ✅ Covered | Never instantiated directly — rendered by the list, which is correct. `courseDefinition` (with `icon`, `hideInCard`, `isHTML`) is used as the single configuration point for both card face and details dialog. |
| Upsell grid rendered display-only | `vwc-course-list` `disableSelection` | ✅ Covered | The documented prop, not an override — it removes the hidden `<input>` entirely, so an unlicensed course provably cannot enter the cart or reach the assign modal. Correctly preferred over CSS-hiding the checkboxes. |
| Assignment intercept | `pre-assign` (cancelable) | ✅ Covered | `e.preventDefault()` suppresses the component's own confirm dialog so the richer Configure-assignment modal opens instead — exactly the documented interception hook. Verified cancelable in the v1.5.10 bundle. |
| Course details dialog | `vwc-course-card` built-in | ✅ Covered | The component default, nothing intercepted. A prior V3 pass replaced it with a side panel via a capture-phase click listener inside the card's shadow root; that override was reverted. Good call — it removes a shadow reach at no functional cost. |
| Select All | `vwc-course-list.selectAll()` | ✅ Covered | The documented public method. The code also correctly handles the documented consequence — `checked-change` fires only on user interaction, so the selection is mirrored into `cart` manually from `selectedCourseIds` afterward. |
| CTA relabeling | `i18n` (`assign_label`, `no_selection_msg`) | ✅ Covered | Documented keys, verified in the v1.5.10 bundle's `localize()` call sites. Preferred over DOM text replacement. |
| Assignment modal shell | `vaadin-dialog` | ✅ Covered | Uses `headerRenderer` / `renderer` / `footerRenderer` and `requestContentUpdate()` for in-place re-render. Footer buttons carry `theme="tertiary"` (Cancel) and `theme="primary"` (Assign), right-aligned with primary rightmost — matches the core CONTEXT.md layout guidance. |
| Learn More / validation modals | `vaadin-dialog` | ✅ Covered | `showValidationModal` builds a fresh dialog per call (supports nesting) and removes it on close. Same correct renderer + button-variant pattern. |
| Date fields in the assign modal | `vaadin-date-picker theme="outlined"` | ✅ Covered | All three (Effective / Due / Expire) carry `theme="outlined"` per the global rule. One `value-changed` handler covers all three via `data-default-field`. |
| Help affordances on the date fields | `vaadin-tooltip` with `for=` | ✅ Covered | Three tooltips anchored by `for` to focusable `role="button" tabindex="0"` spans — keyboard-reachable, correctly named by `aria-label`. |
| Working / loading indicators | `vwc-spinner` | ⚠️ Partial | The component is used correctly (`loading` prop and `--vwc-spinner-color` both verified present in the v1.19.0 bundle). Partial only because `--vwc-spinner-color: #fff` is set from a literal — see the token table. |
| `.rec-dock` (persistent bar + push drawer) | `vwc-drawer` | ⚠️ Partial — **keep the hand-roll** | Deliberate and correct. `vwc-drawer` at v1.19.0 has **no collapsed/persistent-bar state**: `:host(:not([open])) div.drawer-column { display: none; }`. Its render tree is `drawer-header` (+ optional collapse button) and a `drawer-content` slot — there is no "peek" or "rail" slot that survives close, so the pinned bar has no home. Separately, `overlayBreakpoint` is confirmed broken for viewport use: `this._resizeObserver.observe(this)` observes the drawer host, and `_handleResize` compares `contentRect.width` — the drawer's own width — against the breakpoint. Note for the handoff record: `position="bottom"` **does** exist at v1.19.0 (`:host([position=bottom]) .drawer-column { order: 1; bottom: 0; top: unset; }`), so bottom placement is not the blocker; the missing collapsed state is. |
| Drawer toolbar buttons (Select All, Configure Assignment) | `vaadin-button` | ⚠️ Partial | Plain `<button>` elements, styled by hand, re-hosted out of the component's own toolbars (which are collapsed via three real exported parts — `select-all-button`, `select-all-button-loading`, `action-button`, all verified). Both delegate to the component's public API (`selectAll()`, `actionClick()`), so behavior is the component's. The visual departure is intentional — they sit in a compact drawer strip, not a page toolbar. **Recommendation for the dev build:** substitute `vaadin-button theme="tertiary"` (Select All) and `theme="primary"` (Configure Assignment); both would inherit correct focus rings and hit targets for free. `.rec-selectall-btn` already sets `min-height: 24px` for WCAG 2.5.8, which a `vaadin-button` would not have needed. |
| Upsell "Learn More" button | `vaadin-button` | ⚠️ Partial | Hand-rolled `<button>` with a custom outline treatment. Closest component equivalent is `vaadin-button theme="tertiary"`. Low-stakes, intentional visual fit within the section heading. Focus-visible ring is hand-authored and correct. |
| `.rec-bar` CTA / chevron / count chip | `vaadin-button`; `theme="badge"` | ⚠️ Partial | The bar sits on a blue gradient with white-on-blue controls, which no `vaadin-button` variant provides — the hand-roll is justified. Accessibility is handled properly: the chevron carries `aria-expanded` / `aria-controls` / `aria-label`, and the generating state uses `role="status" aria-live="polite"` rather than a disabled control. The count chip (`.rec-bar-count`) is the one place a **`<span theme="badge contrast pill">`** would have applied — but it is white-on-translucent-white inside the gradient, which the badge theme cannot produce. Keep as-is. |
| Card-face micro-layout (condensed field row, relocated Details button, gated lock, grid spacing) | *(no component API)* | ⚠️ Partial — **flag for handoff** | Four shadow-DOM reaches in `shrinkCourseCards()`. See the next section. |

**No ❌ Gaps.** Every element in the rec feature either uses an appropriate VWC component or departs from one for a stated, defensible reason. No new shared component is warranted by this feature.

---

### Component-team defects (confirmed against the shipped bundles)

**1. `course-list` v1.5.10 grid overflows below ~320px — CONFIRMED.**
Verified in `course-list.iife.js`:

```css
.card-grid {
  display: grid;
  justify-content: space-around;
  grid-template-columns: repeat(auto-fill, 265px);
  gap: 16px;
  margin-top: 21px;
  overflow-y: auto;
  padding-bottom: 21px;
}
```

A **fixed** 265px track with no `minmax()`, against a `vwc-course-card` `.card-container` of `width: 264px; height: 320px` (verified in `lms.iife.js`). Below ~320px of available width the track cannot shrink and the grid overflows horizontally — a WCAG 1.4.10 (Reflow) failure owned by the component. The fix belongs in the library: `repeat(auto-fill, minmax(min(265px, 100%), 265px))` or equivalent. The mock cannot work around it without another shadow reach.

**2. `lms` v1.3.10 selection checkbox is 16×16 — CONFIRMED, fails WCAG 2.5.8.**
Verified in `lms.iife.js`:

```css
.card-header-checkbox-wrapper {
  display: block;
  height: 16px;
  width: 16px;
  position: absolute;
  top: 8px;
  right: 8px;
}
```

16×16 is below the 24×24 minimum target size. Sealed in the card's shadow DOM and not an exported part, so it is not reachable from the page. Library fix required. (This is also the geometry the mock's gated-lock overlay deliberately mirrors — `top: 8px; right: 8px; 16×16` — so a library fix that resizes the checkbox would want the lock resized in step.)

**3. `vwc-course-card` "Version" label — NOT a defect. Fixable from the mock today; remove from the library ask list.**
The label is **not** hardcoded. Verified in `lms.iife.js`, both render sites go through `localize()`:

```js
this.localize("version_label", "Version")   // details dialog section
this.localize("version_label", "Version")   // card subtitle: `${...}: ${this.course.version}`
```

and `localize(e, t, ...n) { const i = this.i18n && this.i18n[e] || t; … }` — so an `i18n` entry wins over the `"Version"` default. `vwc-course-list` forwards its `cardI18n` prop straight into every card (`.i18n="${this.cardI18n}"`, verified in `course-list.iife.js`). **One line on each list gets the rename:**

```js
list.cardI18n = { version_label: 'Variant' };
```

This is a documented prop (`cardI18n`: *"Translations forwarded to each `vwc-course-card`"*) and a documented key, and it relabels both the card subtitle and the details-dialog section. The mock currently does not set `cardI18n` on either list. Recommend applying it rather than filing a library ticket.

---

### Prototype-only shadow-DOM overrides — MUST be flagged for handoff

All four live in `shrinkCourseCards()` (and `injectCardPartStyles`). They are cosmetic, no behavior depends on them, and each degrades safely — if a future library version renames a class the selector simply misses and the card returns to its default. The in-file comments accurately describe every one of them; each claim below was re-verified against the bundles. **None of these are APIs, and none should ship as-is.**

| # | Override | Verified basis | Library ask |
|---|---|---|---|
| 1 | Zeroes the list's `.card-grid` spacing (`margin-top: 0`, `padding-bottom: 0`), flips `overflow: visible`, and re-gaps to `20px` — all `!important`, set directly on the node inside `list.shadowRoot` | `.card-grid` carries `margin-top: 21px; padding-bottom: 21px; overflow-y: auto; gap: 16px` (quoted above). It **is** an exported part (`part="card-grid"`), so `margin`/`padding`/`gap` could be set by `::part(card-grid)` from the page — the shadow reach is not strictly required for those three. `overflow` is also settable via the part. **Recommend converting this one to `vwc-course-list::part(card-grid)` — it is the one reach here that has a fully supported equivalent.** | A `--vwc-course-list-card-grid-gap` token would be cleaner than a part override; `overflow-y: auto` on the grid is arguably wrong by default when the host already scrolls (it clips the cards' drop shadows). |
| 2 | Sets `.card-container` `height: auto !important` (plus `.card-content` / `.card-content-details` to `flex: 0 0 auto`, `min-height: 0`, `height: auto`) inside each `card.shadowRoot` | `.card-container { width: 264px; height: 320px; … }` confirmed. `.card-container` is **not** an exported part (the card's `dynamicParts` array only receives `-label`, `-label-icon`, `-label-text`, `-body` per field — verified: `dynamicParts.push(s,a,l,c)`, which notably excludes even `${e}-wrapper`). No `--vwc-course-card-height` custom property exists in the bundle. So the height is genuinely unreachable by supported means. | Ask for a height token (`--vwc-course-card-height`) or a short/compact card variant. A 320px card sized for several fields wastes ~100px when only one field is on the face. |
| 3 | Moves the Details button (`.card-button`) out of its own row and appends it into the field row (`[part="duration-wrapper"]` / `[part="collection-wrapper"]`), then restyles it inline | `.card-button` carries **no** `part` attribute — verified: it renders as `class="card-button" theme="tertiary" id="details-button"`, with no part. `duration-wrapper` renders as a part on the card but is **not** in the card's `exportparts` (see #2), so `vwc-course-list::part(duration-wrapper)` matches nothing — the mock's comment on this is exactly right. Direct DOM manipulation is the only route. | Ask for `card-button` and `<field>-wrapper` to be added to the card's exported parts, and/or a compact card layout that places Details inline with the field row. |
| 4 | Appends a lock `<span>` (inline MDI SVG) into `.card-header` for gated cards, positioned `top: 8px; right: 8px; 16×16` to occupy the checkbox's slot | `.card-header-checkbox-wrapper { position: absolute; top: 8px; right: 8px; height: 16px; width: 16px; }` confirmed; `.card-header` is `position: relative` with a solid background, so the placement is sound. The card exposes a `disabled-label` slot but **no** header/icon slot, so there is no supported insertion point for a gating affordance. Using an inline SVG rather than a Font Awesome class is the right call here — a webfont glyph that fails to resolve renders zero-width and silently, and this lock is the *only* marker distinguishing gated cards. | Ask for a gated/locked card state (or a header slot) on `vwc-course-card`. `disabled` is the wrong semantic — these cards are merchandise, not already-assigned courses, and `disabled` would render the "Assigned" badge. |

Also note, in the same class but lower risk: `injectCardPartStyles()` appends a `<style>` into `list.shadowRoot` to host the `vwc-course-card::part(…)` rules. This is a legitimate workaround for a real platform limitation — `::part()` does not pierce two shadow boundaries, and the cards sit two deep (page → `vwc-course-list` → `vwc-course-card`) — but it is still an injection into a component's shadow root. The parts it targets (`duration-label`, `duration-label-text`, `duration-label-icon`, `duration-body`, and the `collection-*` equivalents) are all real, dynamically-generated parts, so the rules themselves are supported; only the delivery mechanism is not. A library-side `exportparts` on the card-to-list boundary would remove the need entirely.

---

### Design Token Usage

Token values quoted from `context/themes/v1.9.3/CONTEXT.md`; presence in the loaded bundle re-verified by grepping `themes/v1.5.0/styles.js`.

| Color in mock (rec feature) | Nearest token | Token value | Status |
|---|---|---|---|
| `--rec-grad-blue: #0271ce`, `--rec-accent: #0271ce` | `--lumo-primary-color` | `#0271ce` | ✅ Match — exact. Recommend `var(--lumo-primary-color)`. Present in the v1.5.0 bundle. |
| `--rec-grad-blue-dark: #1a4c61`, `--rec-accent-strong: #1a4c61` | `--vwc-color-picton-blue-900` | `#1a4c61` | ✅ Match — exact. **The inline comment says these are hardcoded because themes v1.5.0 "predates the published token docs." Verified otherwise: `--vwc-color-picton-blue-900: #1a4c61` is literally defined in the v1.5.0 `styles.js` the mock loads.** Safe to swap to `var(--vwc-color-picton-blue-900)`. (Palette, not semantic — acceptable here per the themes guidance allowing palette tokens for custom UI surfaces.) |
| `--rec-grad-blue-tint: #ecf8fd` | `--vwc-color-picton-blue-50` | `#ecf8fd` | ✅ Match — exact, and likewise present in the v1.5.0 bundle. Same recommendation. |
| `--rec-accent-hover: #025da9` | *(none)* | — | ⚠️ No direct match. A hand-darkened hover step off `#0271ce`; no `-hover` or darker primary token exists. Reasonable to keep, or derive with `color-mix(in srgb, var(--lumo-primary-color) 85%, black)` for consistency with the `--deleted-tint` pattern already used elsewhere in the file. |
| `.rec-empty` border `#bbf7d0` | *(none)* | — | ⚠️ No direct match, **and effectively dead.** Vector's green ramp is Conifer (`--vwc-color-conifer-200: #d5ecb5`), a yellow-green — `#bbf7d0` is an emerald tint from a different system and would be a visible hue shift. It is also overridden at every call site: both `.rec-empty` render paths set `border-color` inline (`var(--lumo-success-color)` in the no-gaps state, `var(--border-soft)` in the no-matches state). Recommend deleting the declaration rather than re-mapping it. |
| `.rec-empty` background / text (no-gaps state) | `--lumo-success-color-10pct` / `--lumo-success-text-color` / `--lumo-success-color` | `#1688461a` / `#0a7637` / `#158444` | ✅ Match — already tokens, used semantically and correctly. |
| `.rec-empty` background `#f4f5f7` (no-matches state, inline) | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ Off — and **correctly so.** `--lumo-contrast-5pct` is a translucent rgba overlay; this panel sits inside the scrolling drawer body, so a solid value avoids content showing through. Same deliberate rule the file documents at `:root`. Note it matches `--instr-bg-indicator: #f4f5f7` already defined at `:root` — reuse that instead of repeating the literal. |
| `.assign-modal` surface `#f8f9fb` | `--workspace-bg` (`#f8f9fb`, local) | — | ⚠️ Off by reuse, not by value — identical to the `--workspace-bg` custom property already defined at `:root`. Recommend `var(--workspace-bg)`. |
| `.rec-bar` foreground `#fff`, `.rec-bar-cta` background `#fff`, focus outlines `2px solid #fff` | `--lumo-primary-contrast-color` / `--lumo-base-color` | `#fff` / `#fff` | ✅ Match. `--lumo-primary-contrast-color` is the semantically right one for text/icons on a primary-colored surface. `.rec-configure-btn` already uses `var(--lumo-base-color)` for exactly this, so the file is inconsistent with itself rather than wrong. |
| `--vwc-spinner-color: #fff` on `.rec-bar-spinner` | `--lumo-primary-contrast-color` | `#fff` | ✅ Match. `--vwc-spinner-color` is the component's real hook (verified in the v1.19.0 bundle: `var(--vwc-spinner-color, var(--vwc-brand-color, var(--lumo-primary-color)))`) — correct mechanism, literal value. |
| `.rec-bar` white-alpha scrims (`rgba(255,255,255,0.14 – 0.88)`, `rgba(255,255,255,0.16/0.22/0.3/0.5)`) and the `rgba(16,24,40,0.14)` dock shadow | *(none)* | — | ⚠️ No direct match, and none should be forced. These are alpha scrims layered over a gradient; no Vector token expresses "white at N% over an arbitrary background." The dock shadow is the one candidate for `--lumo-box-shadow-s` (`0 2px 4px -1px #1c375a29, 0 3px 12px -1px #1c345442`) but that is a downward shadow and the dock needs an upward one (`0 -4px 20px`). Keep as-is. |
| `--border-soft`, `--text-muted`, `--text-strong`, `--brand`, `--surface-opaque`, `--workspace-bg` used throughout the rec CSS | `--lumo-contrast-10pct`, `--lumo-secondary-text-color`, `--lumo-body-text-color`, `--lumo-primary-color`, `--lumo-base-color` | `#1a38601a`, `#00000099`, `#000000de`, `#0271ce`, `#fff` | ✅ Match — the rec feature's CSS resolves almost entirely through these aliases rather than literals. This is the reason only two raw hex values survive in the whole feature. |
| `--lumo-primary-color-10pct` (Learn More hover), `--lumo-error-text-color` (required mark) | as named | `#0271ce1a`, `#ca150c` | ✅ Match — correct semantic use. |

**`theme="badge"` usage:** none inside the rec feature. The three `theme="badge …"` instances in the file (lines 4949, 7062, and a comment at 1182) all belong to the out-of-scope evaluation form. Their syntax is correct per the core CONTEXT.md (`theme` attribute on a `<span>`, not an element) — noted only to confirm the pattern is understood in this codebase. The one rec-feature candidate, `.rec-bar-count`, is correctly *not* a badge (see the coverage table).

---

### Recommended actions for the dev build

1. **Set `cardI18n = { version_label: 'Variant' }`** on both `vwc-course-list` instances. This closes the "Version → Variant" ask without a library change — drop it from the component-team list.
2. **Convert override #1 to `vwc-course-list::part(card-grid)`.** `card-grid` is a real exported part; `margin`, `padding`, `gap` and `overflow` are all reachable through it. That removes one of the four shadow reaches outright.
3. **File two library tickets, both confirmed in the shipped bundles:** the `repeat(auto-fill, 265px)` reflow overflow in `course-list` v1.5.10, and the 16×16 selection checkbox in `lms` v1.3.10 (WCAG 2.5.8).
4. **Request three card affordances** to retire overrides #2–#4: a card height token or compact variant; `card-button` + `<field>-wrapper` added to the card's exported parts; and a gated/locked card state (`disabled` is the wrong semantic — it renders an "Assigned" badge).
5. **Keep the hand-rolled `.rec-dock`.** Record the real reason in the handoff: `vwc-drawer` fully hides its column when closed, so there is no persistent-bar state to dock — not that `position="bottom"` is missing (it exists), though the `overlayBreakpoint` criticism is independently confirmed.
6. **Minor token tidy (optional):** swap `#1a4c61` → `var(--vwc-color-picton-blue-900)` and `#ecf8fd` → `var(--vwc-color-picton-blue-50)` (both present in the loaded v1.5.0 bundle), `#f8f9fb` → `var(--workspace-bg)`, inline `#f4f5f7` → `var(--instr-bg-indicator)`, and `#fff` → `var(--lumo-primary-contrast-color)` on the bar. Delete the dead `#bbf7d0` border declaration.


---

## Open questions

1. **Failure states** — blocked on Engineering. See the callout above; four
   specific questions are listed there.
2. **Assignment date validation** — blocked on the SafeLMS rules. See the
   callout above.
3. **Who may assign?** No role model exists. If assignment is not available to
   every evaluator, the CTA needs gating.
4. **Concurrency** — what happens if the evaluation is edited elsewhere while an
   assignment is in flight?
5. **Reflow headroom at 320px.** The licensed grid passes with only ~4px of
   slack, because `course-list` v1.5.10 uses a fixed `repeat(auto-fill, 265px)`
   track against a 264px card. It breaks at ~300px. Nothing to fix in the mock —
   but any future padding change to the drawer body could tip it, and the
   library fix is tracked in *Component confirmation*.
6. **Vector Choice** — the mock marks the top two results. The badge is the
   component's own feature and whether to use it is a leadership call; the
   prototype's rule is a placeholder and is not intended as a spec.

---

## Handoff notes

- Per-screen developer detail lives in **`DEV-NOTES.md`** beside this file.
- ⚠️ **The toolbox dock and flow-map button are review tooling — do not ship
  them.** For production, strip the single `<script src=".../toolbox.js">`
  include from the page. The dock pill, the comment widget and the flow map are
  not part of the product design.
- ⚠️ **`shrinkCourseCards()` reaches into the component's shadow DOM** in four
  places. These are unsupported reaches into sealed internals, not APIs. They
  degrade safely (a renamed internal makes the selector miss, and the card keeps
  its default styling), but they should not be carried into production as-is —
  see *Component confirmation* for the library asks that would retire each one.
- The `.rec-dock` container is **deliberately hand-rolled**, not `vwc-drawer`.
  The reason is recorded in *Component confirmation*: `vwc-drawer` hides its
  column entirely when closed, so it has no persistent-bar state to dock.
