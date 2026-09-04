# Design Decisions — Individual Summary Reports (GT-5775)

**Companion to:** [`gt-5775-prd.md`](../gt-5775-prd.md) · **Prototype:** [`ver1/index.html`](ver1/index.html)
**Stage:** 2 (Prototype) · **Status:** proposed, pending team review
**Author:** UX · **Last updated:** 2026-08-28

---

## How to use this document

This records the design decisions made while building the Stage 2 prototype. **Nothing here has been
agreed by the team, and the PRD has deliberately not been edited.** The prototype had to resolve
questions the PRD leaves open — a mock cannot render an undecided colour — so each decision below is
a *working assumption made visible*, not a settled outcome.

Review this alongside §7 of the PRD. Every item states what was decided, why, and what it would cost
to reverse. Once the team aligns, the agreed items fold into the PRD and this file records the
rationale that got there.

Three categories, by how much attention each needs:

| Section | What it contains | Review priority |
|---|---|---|
| [A. Answers to open PRD questions](#a-answers-to-open-prd-questions) | Decisions against §7 questions the PRD explicitly flagged | **High** — these are the ones you asked for |
| [B. Decisions the PRD didn't anticipate](#b-decisions-the-prd-didnt-anticipate) | Gaps found while building that the PRD doesn't mention | **High** — new information |
| [C. Conflicts and corrections](#c-conflicts-and-corrections) | Where the prototype contradicts the PRD, or the PRD contradicts itself | **Highest** — one is a data-model error |

---

## A. Answers to open PRD questions

### A1 · Delta indicator: category identity colour or good/bad treatment?
**PRD §7** — *Product + UX, before Stage 3. "Blocks final tile spec."*

**Decided:** Both, on separate elements. **Category identity moved to a badge; valence moved to the
card.** The tile fill is a muted green/red/grey tint, the top bar is full-intensity valence, and the
delta chip is full-intensity valence with white text. The identity badge carries the mandated
`ruleType` colour as a tinted design-system badge.

**Why:** The PRD notes the four mandated colours "encode category identity, not direction of change,"
making *"corrective actions trending up is bad"* inexpressible. Splitting the two encodings onto
different elements lets both be shown without either overriding the other. On the current demo data
two amber (Early Intervention) categories sit on opposite-coloured cards — Use of Force +4 on red,
Citizen Complaint −3 on green — which is the distinction that was previously invisible.

**Reversal cost:** Low. Encoding is CSS-variable driven; collapsing back to a single-signal tile is a
contained change.

---

### A2 · Does a `Both`-classified category render neutral with no directional delta?
**PRD §7** — *Product + UX, before Stage 3.*

**Decided:** Yes. `Both` **and** `Neither` render a neutral grey card with a non-directional delta
chip, in both directions.

**Why:** Polarity inheritance gives no answer for `Both`, and inventing one would be guessing at
whether an increase is favourable. Grey states the count and the change honestly while declining to
judge it. Matches the PRD's own recommendation.

**Note:** This applies to **tiles only**. Flag progression is *not* subject to the same ambiguity —
see [C1](#c1-both-and-neither-cannot-exist-on-a-rule-data-model-correction).

---

### A3 · Is the report period basis `occurred` or `created`?
**PRD §7** — *Product, before Stage 3.*

**Decided:** `occurred`, and **stated on the page** — the period bar reads "dated by *occurred*, not
created."

**Why:** Three converging reasons. The dashboard already aggregates on `occurred` "to reflect actual
incident timing"; `occurred` is the stronger basis for behavioural trend analysis; and the **existing
`SubordinateProfilePage` already uses "Occurred" as its column header**, so the screen being replaced
has set the precedent with users. The PRD recommends `occurred`; this treats it as settled and makes
the basis visible rather than silent.

**Reversal cost:** Low in the mock; potentially significant in backend query work.

---

### A4 · What defines an "unobservable" prior period, given hire date cannot be used?
**PRD §7** — *Product, before Stage 3.*

**Decided (provisional):** A prior window is unobservable when it **predates the department's earliest
document data**. Anything later is a true zero, not `n/a`.

**Why:** Follows the PRD's own suggested non-tenure basis. The prototype demonstrates the state
(Equipment Damage renders `n/a` with the explanation "no comparable prior period") but the *rule* is
a placeholder for Product to confirm.

**Still open:** Whether "department's earliest document data" is the right anchor, and whether it is
computed per-department or per-category. **This one genuinely needs Product** — the prototype only
shows the state, not the logic that produces it.

---

### A5 · Does the empty-state on-ramp need an inline admin affordance for non-admin supervisors?
**PRD §7** — *UX, before Stage 3.*

**Decided:** Dual path, branching on permission.

- **Category admin** → inline "Choose categories" picker plus a "Use suggested set" shortcut, both
  actionable without leaving the report.
- **Supervisor without admin rights** → explanation of what tiles would show, an **"Ask my
  administrator"** request action, and a note saying where configuration lives and why they can't
  reach it.

**Why:** The PRD flags that "a supervisor without category-admin rights cannot act on the on-ramp."
Showing the same button to both roles produces a dead end for the larger group. The non-admin path
converts a dead end into a request.

**Still open:** Whether "Ask my administrator" is a real notification, a mailto, or a queued request —
this needs a backend answer. The prototype shows an optimistic confirmation only.

---

### A6 · Where does tile configuration live, and does it need ordering or a cap?
**PRD §7** — *UX, before Stage 3.*

**Partially decided.** The prototype assumes configuration lives in **category administration** (per
the PRD's recommendation) and adds an inline entry point from the report for admins. **Ordering and
caps are not addressed** — tiles render in configuration order with no limit.

**Still open:** Ordering control, a maximum tile count, and whether the inline picker writes to the
same store as category admin. Deferred in the PRD as a "Future Consideration"; flagging that the
prototype does not resolve it.

---

## B. Decisions the PRD didn't anticipate

### B1 · Flag progression needs a bound
**Not in the PRD.**

**Problem:** The PRD says "a bar for every rule with a non-zero accumulated score" — which is
unbounded. A department with 20 active rules would push tiles and the timeline off-screen entirely.

**Decided:** Show the **5 closest to threshold**, with **all fired rules always visible regardless of
rank**, and the remainder behind a "Show all N rules" toggle.

**Why:** Preserves the section's purpose (surfacing imminent risk) without letting rule count dictate
page length. Fired rules are never hidden by ranking.

---

### B2 · Timeline density behaviour
**PRD §6** — *"Unreadable is not an option" is a constraint, not a specification.*

**Decided:** Swim lanes by flag classification **plus** clustering within a lane.

- One lane per classification; lane height grows with content
- A bucket holding more than **3** documents collapses to a count bubble; fewer stack as dots
- Bucket resolution scales with zoom, so clusters genuinely separate rather than just stretching

**Verified against the PRD's stated worst cases** — 214 documents in a period and 15 on a single day.
Clusters resolve 7 → 5 → 2 → 2 → 1 across the zoom range.

**Known limit, by design:** documents sharing a date **never** separate at any zoom. The 15-on-one-day
case stays a count bubble permanently; the drill-in popover is the only way to read it. This is
correct behaviour, but it means **the popover is load-bearing, not a convenience.**

---

### B3 · Timeline zoom and navigation
**Not in the PRD.**

**Decided:** A zoom slider (7 steps, fit-to-period → day level) in the chart footer, with horizontal
scroll, drag-to-pan, and Ctrl/⌘+scroll. Lane labels and the month axis stay pinned while the track
scrolls. Zoom resets to Fit when the period or density changes.

**Why:** Emerged from review — clustering alone can't serve both "see the whole period" and "read one
week." The axis subdivides as you zoom (months → half-months → weeks → days) so added width carries
real resolution.

**Cost note:** This is net-new interaction not scoped in the PRD, and it interacts with the unresolved
PDF export decision — see [B6](#b6-export-fidelity-under-zoom-unresolved).

---

### B4 · Flag progression polarity and the two-list split
**Not in the PRD.**

**Problem found in review:** every progression bar filled in category-identity colour, so a full bar
meant "flag raised" for Early Intervention and "recognition earned" for Positive Recognition — visually
identical, semantically opposite.

**Decided:** Split into **two sections with different encodings**.

| Section | Rules | Encoding | Rationale |
|---|---|---|---|
| **Flag progression** | Early Intervention | Grey → amber → orange → red risk scale | Proximity to a flag is a genuine risk gradient |
| **Recognition progression** | Positive Recognition | One flat blue, no scale | Recognition accrual has no gradient — 20% is not "worse" than 80% |

Each list keeps its own top-5 + overflow and its own empty state.

**Why a fourth band:** Three bands left a large gap between "approaching" (50%) and "flag raised"
(100%). 80–99% is precisely the range a supervisor most needs to catch, so it gets its own step. **This
is an addition beyond what was discussed** and is easy to drop back to three.

---

### B5 · Accessibility: the mandated palette fails WCAG in two places
**Not in the PRD, but the PRD requires WCAG 2.2 AA.**

**Problem:** White text on the mandated `Early_Intervention` amber `rgb(216,155,56)` is **2.42:1** and
on `Positive_Recognition` blue `rgb(33,150,243)` is **3.12:1** — both fail AA for text.

**Decided:** Keep every mandated colour value **unchanged** and adapt what sits on top:

- Identity badges use a **tinted** fill with a darkened category text colour (4.51–5.95:1)
- The amber risk-band glyph takes dark ink rather than white (5.66:1)
- Delta chips keep white text — all three valence colours already pass (4.67–5.79:1)

**Why:** The palette is fixed by the PRD and AA is a stated requirement, so the text adapts instead of
the brand colours.

**Worth flagging to the team:** this will recur anywhere the amber or blue carries text. Either
accept per-element adaptation as the standing pattern, or take darker palette variants back to
Product. **A decision here has reach beyond this initiative.**

---

### B6 · Export fidelity under zoom (unresolved)
**PRD §6** — *export architecture is HIGH risk and unresolved.*

**Not decided.** The prototype adds zoom, pan, and interactive drill-in — none of which survive a PDF.
The PRD already flags that server-side jsReport rendering would force the timeline into headless
Chromium.

**Open:** what the PDF shows for a timeline whose on-screen value is interactive. Options: render at
fit-to-period only; render the current zoom/scroll state; or paginate the timeline across the period.
**This should be decided before the export architecture is committed**, since it changes what the
renderer must support.

---

### B7 · Report ordering
**Minor; contradicts the PRD's implied order.**

**Decided:** Header → Flag progression → Recognition progression → Category tiles → Timeline.

**Why:** The PRD lists tiles before progression. Progression is the forward-looking risk signal and
tiles are retrospective counts, so urgency argues for progression first. **Low-confidence call, easily
reversed** — flagged because it deviates from the PRD's ordering.

---

## C. Conflicts and corrections

### C1 · `Both` and `Neither` cannot exist on a rule — data-model correction
**Correction to a real modelling error; affects implementation, not just design.**

**The PRD is internally consistent but easy to misread.** §Product Context states `ThresholdAlertType`
is **exactly** `EarlyIntervention` / `PositiveRecognition`. The four values `Positive_Recognition` /
`Early_Intervention` / `Both` / `Neither` are **`ruleType` — a property of a *category***, which may be
tied to several rules.

**Therefore:**

| Value | Valid on a category? | Valid on a rule? | What it means for progression |
|---|---|---|---|
| `Early_Intervention` | yes | **yes** | One bar, risk-scaled |
| `Positive_Recognition` | yes | **yes** | One bar, flat blue |
| `Both` | yes | **no** | Category tied to one EI rule *and* one PR rule → **two bars**, each unambiguous |
| `Neither` | yes | **no** | No rule association → no threshold → **no bar at all** (still gets a tile) |

**Why it matters:** the first prototype build assigned `Both` and `Neither` to individual rules, which
is not representable. `Neither` is the clearer error — a rule with no threshold type has no threshold
to progress toward, so it cannot produce a progress bar.

**Consequence, and this is the useful part:** because a rule is always exactly one of two types,
**flag progression can be fully polarised even though tiles cannot.** The `Both` ambiguity that forces
tiles neutral ([A2](#a2-does-a-both-classified-category-render-neutral-with-no-directional-delta))
never reaches progression, because it resolves into two separate, individually-unambiguous bars. The
prototype demonstrates this with "Pursuit Policy Review" appearing as an EI bar in one section and a
PR bar in the other.

**Needs confirmation from GT Engineering** that this reading of the schema is correct before it is
relied on.

---

### C2 · Open-flag count must derive from rules, not roster data
**Consistency fix.**

The header open-flag count and the progression list were sourced independently and had drifted
(header said 2; one rule was open). The count now derives from the rules, **counting Early
Intervention only** — a fired Positive Recognition rule is recognition, not a flag.

**Implication for build:** these must share one source. Worth stating explicitly in the solution
design.

---

### C3 · Milestone document colour scheme is still stale
**PRD §6 recommends correcting it; not yet done.**

The milestone document still specifies Commendation green / Corrective action red / Other grey. The
agreed treatment is the dashboard palette. **Grey collides between the two schemes** — "Other/no flag
affiliation" in one, `Both` in the other.

**Not a prototype decision** — flagged because the PRD's recommendation #7 remains outstanding and the
stale scheme can still be implemented by mistake.

---

### C4 · Roster stat label appears to be a mislabel
**Out of scope; noted opportunistically.**

The existing Subordinates roster shows three circle stats, the third labelled **"Creative Employees"** —
almost certainly a mislabel — and colours two of the three red-orange, reading as alarm where none is
intended. The prototype's roster replica substitutes "Employees w/ Open Flags" as a more useful stat
beside this feature.

**Not part of GT-5775.** Raised because the report is entered from this screen and inherits its
visual context. Belongs in GT's backlog, not this initiative.

---

## Decisions still needed from the team

Ordered by what blocks the most work.

| # | Question | Owner | Blocks |
|---|---|---|---|
| 1 | Confirm [C1](#c1-both-and-neither-cannot-exist-on-a-rule-data-model-correction) — `Both`/`Neither` are category-level only | GT Engineering | Progression data model and read path |
| 2 | Accept or reject the [A1](#a1-delta-indicator-category-identity-colour-or-goodbad-treatment) split encoding | Product + UX | Final tile spec (PRD says this blocks it) |
| 3 | Define "unobservable prior period" precisely ([A4](#a4-what-defines-an-unobservable-prior-period-given-hire-date-cannot-be-used)) | Product | `n/a` vs. true-zero logic |
| 4 | Decide export fidelity under zoom ([B6](#b6-export-fidelity-under-zoom-unresolved)) | Product + Eng | Export architecture decision |
| 5 | Ratify per-element contrast adaptation ([B5](#b5-accessibility-the-mandated-palette-fails-wcag-in-two-places)) | Design System + Product | Any future use of the mandated palette with text |
| 6 | Confirm `occurred` as the report-wide basis ([A3](#a3-is-the-report-period-basis-occurred-or-created)) | Product | Backend query shape |
| 7 | Decide what "Ask my administrator" actually does ([A5](#a5-does-the-empty-state-on-ramp-need-an-inline-admin-affordance-for-non-admin-supervisors)) | Product | Empty-state build |
| 8 | Keep or drop the 4th risk band ([B4](#b4-flag-progression-polarity-and-the-two-list-split)) | UX | Cosmetic only |
| 9 | Keep or reverse progression-before-tiles ordering ([B7](#b7-report-ordering)) | UX | Cosmetic only |

**Unchanged from PRD §7 and not addressed here** — these need no prototype input: confidential-document
handling for officer self-export, feature-flag mechanism, beta cohort selection, and success-metric
targets.

---

## Prototype states for review

The prototype's control rail (top right, collapsible — not product UI) switches every state below.
The flow map (🗺 in the toolbox dock) deep-links to each.

| State | Shows |
|---|---|
| Subordinates roster | Entry point; Actions button opens the report |
| Individual Summary | Default report, all regions populated |
| Dense timeline (200+) | 214 documents plus 15 on one day |
| Zoomed in (4×) | Same record with clusters separated and the axis at week level |
| Empty tiles — admin | On-ramp with inline configuration |
| Empty tiles — supervisor | On-ramp without admin rights ([A5](#a5-does-the-empty-state-on-ramp-need-an-inline-admin-affordance-for-non-admin-supervisors)) |
| No open flags | Alert treatment fully suppressed |
| Zero documents | Purposeful empty report |
