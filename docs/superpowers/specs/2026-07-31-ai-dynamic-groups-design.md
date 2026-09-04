# AI Dynamic Groups in the Publish Flow — Design

**Date:** 2026-07-31
**Product:** Keystone-Department-Hub → Agency Intelligence dashboard
**Files:** `products/Keystone-Department-Hub/keystone-hub/`

## Problem

Publishing a dashboard means choosing who sees it. Today the audience picker offers job
titles only — and the "Named individuals" option is **non-functional**: `openAssignDialog`
initializes `sel.individuals` and counts it in the reach math, but no UI anywhere selects a
person. The previous prototype had a two-tab picker (Job titles / Named individuals); the
rebuild flattened it into a single dialog of title checkboxes and lost the second tab.

Neither version lets a chief describe an audience the way they actually think about it —
"HazMat-certified engineers in Battalion 2, excluding probationary staff." Every attribute
that would make that possible (pay grade, tenure, certifications) is absent from the roster.

## Goals

1. Rebuild the audience step as a stepped dialog with three ways in: **Job titles**,
   **Named individuals** (built from scratch), and **AI groups** (new).
2. Let the user build an audience through back-and-forth conversation, filtering on the
   dimensions a fire department actually tracks.
3. Groups are **live rules** — they keep re-evaluating as the roster changes — and are
   **saved and reusable** across publishes.

## Non-goals

- The access / grant / override wizard steps from the previous prototype.
- Editing a saved group in place (see Decisions).
- Managing groups anywhere outside the publish flow.
- Any real model call. The conversation is a deterministic phrase matcher.
- Changes to the cadence/format controls or the publish action itself.

---

## Architecture

Two new modules, following the existing `agency-intel-*.js` / `window.AGENCY_INTEL_*`
convention. `agency-intel-page.js` is already 1,982 lines — the largest file in the product —
so this work must not land inside it.

| Module | Responsibility | Depends on |
|---|---|---|
| `agency-intel-roster.js` | Extended roster, attribute vocabulary, rule engine, saved-groups store, NL parse. **No DOM.** | `KEYSTONE` (`K.PEOPLE`, stations), `AGENCY_INTEL` (job titles) |
| `agency-intel-audience.js` | The stepped audience dialog: three tabs, chat transcript, chips, count, name list. | `agency-intel-roster.js`, `KX` helpers |

`agency-intel-page.js` keeps `openAssignDialog` as a thin delegation to the audience module.
Load order in `agency-intelligence-dashboard.html`: roster → audience → page.

**`K.PEOPLE` in `data.js` is not modified.** `hub.js` and `prioritization.js` read it for task
assignees; growing it 14 → 113 there risks regressions in unrelated screens. The roster module
decorates and extends it instead — the same pattern `INDIVIDUALS` already uses.

---

## Data model

### Roster

`agency-intel-roster.js` builds a **113-person department in total** — not 113 in addition to
the existing people. The 14 in `K.PEOPLE` pass through verbatim as seeds and **count against the
title totals**; the remaining **99** are generated **deterministically** — fixed name pools and
index-based assignment, no `Math.random()` — so counts and names are stable across reloads.

Totals match `JOB_TITLES` exactly: 4 Battalion Chief, 9 Captain, 14 Lieutenant, 3 Training
Officer, 2 Fleet Manager, 11 Engineer, 8 Paramedic, 62 Firefighter = **113**. The seeds already
supply 1 BC, 2 Captains, 3 Lieutenants, 1 Training Officer, 1 Engineer, 1 Paramedic and
5 Firefighters (`Firefighter/EMT` resolves to `firefighter` via the existing `RANK_TO_TITLE`
fallback), so generation fills only the shortfall per title.

| Field | Values |
|---|---|
| `id`, `name` | unique id, display name |
| `titleId` / `rank` | the 8 existing job titles |
| `station` | st1, st4, st7, st9, st12, st14 |
| `battalion` | B-1, B-2, B-3 (derived from station) |
| `stationLabel` | Downtown / HQ, Riverside, East Hills, Industrial, North, Airport |
| `shift` | A, B, C, — |
| `grade` | FF-1…FF-3, ENG-1/2, LT-1/2, CPT-1/2, BC-1, TO-1, FM-1 |
| `hired` | ISO date |
| `tenureYrs` | derived from `hired` against `CP.APP_TODAY` |
| `type` | career, volunteer, part-time |
| `assignment` | suppression, ems, prevention, training, fleet, admin |
| `certs` | paramedic, emt, hazmat, evoc, cpr, technical-rescue, arff |
| `entitlements` | derived from `titleId` (existing behavior, unchanged) |

`arff` concentrates at the Airport station (st14) and `technical-rescue` at Industrial (st9),
so location-plus-certification queries return sensible, non-uniform results.

### Rule shape

A rule is a **flat AND of clauses**. Each clause ORs its values and may be negated:

```js
{
  id: 'grp_hazmat_b2',
  name: 'HazMat · B-2 engineers',
  createdAt: '2026-07-31',
  clauses: [
    { field: 'titleId',   op: 'in',  values: ['engineer'] },
    { field: 'certs',     op: 'has', values: ['hazmat'] },
    { field: 'battalion', op: 'in',  values: ['B-2'] },
    { field: 'tenureYrs', op: 'gte', values: [1], negate: true }
  ]
}
```

Operators: `in` (value ∈ list), `has` (array field contains), `gte` / `lte` (numeric, for
tenure), `before` / `after` (dates, for `hired`).

**Why flat, not a nested boolean tree.** Nesting would express more, but it cannot be rendered
honestly as a row of removable chips — and the chips are how the user audits what the AI
inferred about who receives a dashboard. One clause = one chip, always. A user needing true
nested logic can build two groups and select both (selections union).

### Evaluation

```js
evaluate(rule) → { people: [...], count: N, coverage: { missing: ['ts', 'ci'], ... } }
```

`coverage` reports which data sources some matched members lack, reusing the existing
`reconcileAccess` idea so the AI tab inherits the same access warnings the job-title rows show.

---

## The audience dialog

Two steps, 680px wide (up from 560 — the chat needs the room).

```
┌─────────────────────────────────────────────────────────────┐
│ ▪ Who sees it live?                                     ✕   │
│   Put "Q3 Readiness" on the homepage of a role, specific    │
│   people, or an AI-built group. Everyone selected gets it   │
│   automatically — current and future.                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┬────────────────────┬─────────────────┐    │
│  │ ▣ Job titles │ ⌾ Named individuals│ ✦ AI groups NEW │    │
│  └──────────────┴────────────────────┴─────────────────┘    │
│   …active tab body, scrolls…                                │
├─────────────────────────────────────────────────────────────┤
│ Reaches 14 people · 2 sources missing   ← Back   Review →   │
└─────────────────────────────────────────────────────────────┘
```

**Tab 1 · Job titles.** Two-column card grid (checkbox, title, "N people", entitlement chips) —
the layout from the reference screenshot, replacing the current single-column rows. Eight
titles fit without scrolling.

**Tab 2 · Named individuals.** New. Search field over the 113-person roster, then a scrollable
list: checkbox, name, `rank · Sta. 7 · FF-2`, entitlement dots. Selected people collapse into
removable chips pinned above the list.

**Tab 3 · AI groups.** Saved groups listed first (selectable, each with live count), then
"✦ Describe a new group" opening the conversation.

**Selections union across all three tabs, de-duplicated by person.** The footer reports one
combined reach. Forcing one mode per publish would mean a chief wanting "all Captains plus the
HazMat crew" has to describe Captains to the AI just to combine them.

`Review & publish` is disabled while reach is zero. Step 2 is the existing cadence/format
controls and publish action, unchanged.

---

## The conversation

A deterministic phrase matcher over the attribute vocabulary — the same technique as the
existing plain-language engine at `agency-intel-page-data.js:657`.

**Parsing.** Each attribute owns a synonym set: `hazmat|haz-mat`, `medics?|paramedics?`,
`b-?2|battalion 2`, `airport|east hills|riverside|industrial|north|downtown|hq`, `a shift|shift a`,
`rookies?|new hires?|probationary`, `hired (before|after) <year>`, `volunteer|career|part-time`,
plus every job title, pay grade, assignment and certification. Negation words — `exclude`,
`except`, `not`, `without`, `minus` — flip the clause that follows.

**Turns merge into the standing rule.** Same field unions its values ("and B-3" widens the
battalion clause); `only` / `actually just` replaces; `remove` / `drop` deletes. This is what
makes it a conversation rather than repeated one-shot queries.

**Clarifying questions.** Three triggers, each earning its interruption:

1. **Location ambiguity** — a station named alongside its battalion:
   *"Station 7 only, or all of B-2?"*
2. **Word ambiguity** — "medics" is both a job title and a certification:
   *"Paramedics by rank, or anyone paramedic-certified?"*
3. **Zero matches** — never a bare "0 people." Names the clause that emptied the set and offers
   to drop it: *"No one matches — Fleet Manager plus HazMat has no overlap. Drop HazMat?"*

**Unrecognized input teaches the vocabulary** rather than failing: *"I can't filter on 'good
attitude.' I can work with rank, station, battalion, shift, pay grade, tenure, certifications,
employment type and assignment."*

**UI.** Transcript reuses the dock's `.cpv-*` bubble styles. Criteria chips sit below with `×`
to remove (re-evaluates instantly). Live count expands to show up to 8 names, then "+ N more."
The empty state offers three starter prompts, since nobody guesses a vocabulary cold. Saving
pre-fills a name generated from the clauses ("HazMat · B-2 engineers"), which the user can
override.

---

## Saved groups

Stored in the roster module as `{ id, name, clauses, createdAt }`. **Three are seeded** so the
reusable story is legible on first open: "HazMat · B-2 engineers", "New hires · first year",
"Airport · C shift". Newly saved groups live in memory for the session — **no localStorage**, so
every reviewer opening the link sees the same starting state.

Dynamism is carried by the badge and copy, not by faked drift: each group shows
`Live rule · re-evaluates nightly · N today`, and the publish confirmation states that new
matching people receive it automatically. Showing "14 today (was 12)" was rejected — it would
require inventing membership history the prototype has no basis for, and a developer might try
to implement it.

---

## Integration

`assignedTo` gains a third key:

```js
assignedTo: { titles: [...], individuals: [...], groups: ['grp_hazmat_b2'] }
```

Six consumers read that shape. Each needs to account for groups or it silently under-reports
who has access:

| Location | Change |
|---|---|
| `audienceReach` (page.js:146) | add group members, **de-duplicated by person** |
| `audienceCell` (page.js:189) | render group names with the ✦ mark alongside titles |
| `openAssignDialog` (page.js:1149) | seed `groups` from the current audience |
| `assignDash` (page.js:1272) | "one live dashboard per person" release logic must release group members too |
| `reconcileAccess` (page-data.js) | accept `groups` when computing missing sources |
| `PRE_ASSIGNED` seed | one seeded dashboard published to a group, so the table shows the state on load |

**De-dup is the likeliest source of a wrong number.** Titles report *counts* (Captain = 9) while
groups resolve to *people*, so `audienceReach` must resolve titles to person sets and return a
resolved `Set` of person ids rather than summing integers.

---

## Edge cases

- **Zero-match rule** cannot be saved or used; the primary action disables and the AI offers to
  drop the emptying clause.
- **Removing the last chip** returns the tab to its empty state with starter prompts, clears the
  count, and re-disables `Review & publish`.
- **Saved groups are read-only.** "Duplicate & refine" opens a fresh conversation seeded with
  the group's clauses. Editing in place would silently change the audience of every other
  dashboard published to that group.
- **Entitlement gaps** in a matched set surface exactly as the job-title rows do today.
- **Large matches** (62 firefighters) cap the name list at 8 with "+ N more."
- **Dialog renders into a `vaadin-dialog` overlay outside `#root`** — handlers must use the
  document-level delegation documented at page.js:1397, or clicks never fire.
- **The chat input must write to state without a re-render**, or the caret jumps mid-sentence.
- **Tab state is independent** — switching preserves each tab's selections and the transcript.

## Verification

- `node --check` on both new modules.
- Drive the flow in a browser: each tab; all three clarifying-question paths; the zero-match
  path; chip removal; save-then-reuse; union across all three tabs **with an overlapping person**
  to prove the de-dup count; publish; confirm the dashboards table audience cell shows the group.
- Console clean on a fresh load.

## Decisions and their rationale

| Decision | Why |
|---|---|
| Flat clause list, not nested booleans | Chips must honestly represent the rule; nesting can't be chipped |
| Union across tabs | "All Captains plus the HazMat crew" is a real ask |
| Live rule, saved & reusable | Matches "dynamic groups" and the flow's existing "current and future" promise |
| Saved groups read-only | In-place edits would silently change other dashboards' audiences |
| No localStorage | Predictable shared starting state for design review |
| Don't touch `K.PEOPLE` | `hub.js` / `prioritization.js` depend on it |
| Two modules, not one | Rule engine is worth reasoning about independently of the dialog |
