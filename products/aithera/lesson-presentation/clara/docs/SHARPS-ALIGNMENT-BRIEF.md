# Contain the Sharp — aligning to the K&A script and the Q4 PRD

Written 2026-09-16 from a comparison of the CLARA sharps prototype
(`clara/sharps.html` + `js/layered-sharps.js`, on the shared `js/layered-engine.js`,
Manufacturing lens) against two new inputs Chris supplied:

- **K&A's structural script** — `~/Downloads/Contain_the_Sharp_Manufacturing.pdf`,
  "Contain the Sharp — Manufacturing — video course script" (Module 4, Bloodborne
  Pathogens, RVCT-303B, roles: chemical · industrial). A slide-by-slide walkthrough
  of every screen, question, and routing rule for this module as K&A designed it.
- **The Q4 PRD** — `~/Downloads/Learning+Engine+Prototype+—+PRD+(Q4+2026).doc`
  (Confluence export), which names this module "Bundle C — Bloodborne Pathogens
  Module 4" and requires it (alongside Bundle A, Hazing Prevention — not yet built
  anywhere in this repo) to prove specific V1 capabilities in front of customers
  in November.

**Nothing in the prototype has been changed yet.** Eleven of the twelve forks
below are now decided (§2a) — one (D12, the K1 compliance-lock flag) is still
open. §5 is the firm build plan against those decisions.

## 0. Before touching anything

- **Live uncommitted state as of 2026-09-16:** `clara/course.html`, `clara/index.html`,
  `clara/learning-engine-sharps.html`, `clara/learning-engine.html`, `clara/scenario.html`,
  `clara/sharps.html`, `js/layered-course.js`, and `js/layered-sharps.js` are all
  modified but uncommitted, plus an untracked `assets/courses/renee-hero.jpg`. The
  course/scenario files and the Renee asset look unrelated to sharps (Harassment
  Prevention work in flight). Land or park whichever of this is someone else's
  work before starting anything below — shared-worktree rules apply: back up,
  stage your own hunks, no `add -A`.
- [SHARPS-REVIEW-PLAN.md](SHARPS-REVIEW-PLAN.md) (2026-09-11) is a **separate,
  still-partially-open** brief reconciling this same module against the "How the
  Learning Engine's Engine Works" doc. Some of its 33 items may already be done
  (recent commit `87094916`: "battery pagination, collapsible lens panel, Sharps
  worked example"; `b9b1e686`: wrong-choice praise / case numbering / injury
  callout fixes) — check its plan against current code before assuming any item
  is still outstanding. The two briefs overlap in places (both touch the pre-check,
  both touch F2/F4 sampling) — reconcile them into one sequence before building,
  don't run them as independent threads.
- Preview: `http://localhost:4599/products/aithera/lesson-presentation/clara/sharps.html`
  if a server on 4599 is already up; otherwise start one (see `launch.json`).
- Standing rules: no framework vocabulary on learner screens (gate, test-out,
  objective, battery, beat, Know/Feel/Do — CLARA's lines included); labels are
  plain format + duration metadata; CLARA is "they" and appears only to react or
  explain something written nowhere on screen; bump `?v=` on every script tag you
  touch; a hidden Browser-pane stalls the engine's rAF transitions — `resize_window`
  first and use `?step=<id>` deep links.

## 1. What the two documents found

### 1a. Against K&A's Manufacturing script

1. **The objective set doesn't match.** K&A's traceability slide lists 8
   objectives (K1, K2, F1, F2, F3, D1, D2, D3). The build has **10** — it splits
   K&A's single K2 ("Know/Observe — spot hazard conditions") into a code `K2`
   (why a sharp is dangerous, mechanism) and a code `K3` (recognizing an unsafe
   container), and adds an `F4` self-efficacy item with no K&A counterpart at all.
   Objective definitions: `js/layered-sharps.js:58-116`.
2. **Pre-check: 5 items built vs. 4 scripted, and the routing architecture
   differs.** K&A has one K1 MC question doing double duty — it drives test-out
   directly, and (only if K1 is later locked) falls back to driving test-up
   instead. The build splits this across two separate items: a `K1` ordering/drag
   task drives test-out only (`js/layered-sharps.js:882-966`, routing at
   `:1198-1206`), and a separate `K3` diagnostic drives test-up only. K&A's K1 is
   single-select MC; the build's K1 is a drag-to-order task.
3. **Cases 1–3 line up well.** `js/layered-sharps.js:327-329` — box-cutter blade
   set down at the bench (Case 1), container past its fill line (Case 2), and
   contaminated glass concealed in general waste (Case 3) all match K&A's
   premises closely, just relocated to Acme's plant clinic/dock.
4. **F2 (engineering controls) is asked here despite an explicit instruction not
   to.** K&A slide 27: *"NO QUESTION IN THIS MODULE... F2 is asked once for the
   whole course... it isn't repeated among this module's questions."* The build
   samples Manufacturing **in** on an F2 follow-up question
   (`SAMPLE_MAP` at `js/layered-sharps.js:673-674`; asked inside the `controls`
   step).
5. **The Chris/Jacob story is duplicated with a second, unscripted case.** K&A's
   Case 4 (Chris hands off, Jacob gets stuck) maps onto the build's `chain` step
   well — now made interactive (learner picks the route). But the build *also*
   runs a second, separate F1 case (`case4`, "A Coworker Got Stuck") with a
   different victim ("Ruben") and a different incident that has no counterpart
   anywhere in K&A's script.
6. **The debrief contradicts K&A's stated method.** K&A's remediation slide (31)
   is explicit: *"No statistic is used."* The build's `debrief` step instead
   reveals specific Manufacturing numbers — 55% / 33% / 12% — code-commented as
   illustrative only, not real data (`js/layered-sharps.js:3485-3487`).
7. **The simulation is a different scenario than the one scripted.** K&A's sim:
   you find a blade *left by someone unknown* on a neighboring bench — a fresh,
   unclaimed hazard testing recognition plus procedure from scratch. The built
   sim ("End of Shift," `scenario-simulator/js/scenario-types/mix-arc.js:862-1062`)
   instead re-stages Chris handing you his syringe directly — the same incident
   as the `chain` screen, now as the final exam. Rubric differs too: K&A specifies
   a named Timing/Technique/Route/Recovery instrument; the build uses
   MISSED/PARTIAL/SOUND tiers per beat — semantically overlapping, not the same
   instrument. K&A's Beat 4 is a pure sentiment question ("what would make this
   hardest on your worst shift?"); the build's Beat 4 equivalent is a bonus
   interaction with Jacob, different content.
8. **D3 (30/60/90 follow-up) isn't built, and the team already flagged this
   itself.** K&A wants a real platform-data pull at 30/60/90 days. What exists is
   an in-module, learner-authored if-then plan; the Record screen states outright
   *"still open — nothing today can show whether it held"*
   (`js/layered-sharps.js:4328-4334`). A prior version's CLARA promise of a real
   check-in was deliberately removed because nothing schedules one
   (`js/layered-sharps.js:4030-4034`).
9. **K1's compliance-lock status is an open regulatory question K&A flags but the
   build has already answered.** K&A slide 8: the test-out shortcut "exists only
   if K1 stays test-out eligible... proposed, not confirmed against
   1910.1030(g)(2)(vii)(E)/(F)." The build ships K1 as `gate`, `locked: false` —
   live, decided, with no "unconfirmed" flag surfaced anywhere a reviewer would
   see it (unlike D3, which the Record screen does mark as open).
10. **The simulation is not sector-lensed — and K&A's own design also treats the
    rubric as fixed across the module,** so this one point is a coincidental match
    even though the two scenarios' actual content doesn't match (see #7).

### 1b. Against the Q4 PRD's capability-coverage matrix

Every V1 capability in the PRD has to be proven in full by at least one of two
bundles. Only Bundle C (this module) exists in the repo — **Bundle A (Hazing
Prevention) isn't built anywhere**, so any capability assigned to Bundle A alone
currently has zero coverage.

| Capability | Required for Bundle C | Status |
|---|---|---|
| Test-out / test-up | PARTIAL | Built and demonstrable — Record screen reflects drops/swaps |
| In-course remediation | PARTIAL | Built — K1 loops on fresh items, K2 gets one retry |
| **Role-based content** | **FULL** | **Not built.** `roles: 'chemical · industrial'` is a dead display string (`js/layered-sharps.js:324`), never used to branch content. Only *sector* varies (4-way), never *role*. Since Bundle A is "NOT TESTED" on this row by design, this V1 capability has **no coverage anywhere** in the prototype right now. |
| Microlearning | FULL | Plausible (standalone module) but not timed/verified |
| Modality switch (text↔audio) | PARTIAL | Built for the hazard screen — video/article/"Listen" picker with browser-TTS stand-in, defers the check to keep credit |
| **Translation (Spanish)** | **FULL** | **Not built at all** — no Spanish content, no i18n scaffolding anywhere in the sharps files. Same "only coverage" severity as role-based content. |

Other findings:

- **Do objects don't match the PRD's in-scope baseline.** Scope specifies
  "a demonstration video plus a stand-in multiple-choice question, gating." What's
  built for D1/D2 is a full branching roleplay simulation with tiered grading —
  the PRD's own **Stretch** item, not the baseline. The PRD's own Alignment-items
  table already lists this as open, owned by Chris: *"Non-AI Do objectives...
  whether it replaces the demonstration-video-plus-stand-in-question... is open."*
  Related: the PRD explicitly parks *"the AI cost model for ScenSim / roleplay Do
  evaluations"* as not being measured — if the built beats grade free responses
  live, demoing them in November exercises exactly the mechanism the PRD says
  isn't cost-modeled yet.
- **Not found in the sharps files:** a self-assigned-identity / URL-prefillable /
  resumable launch page, and links to the legacy course for side-by-side
  comparison. Both are named in PRD scope's "In" list. May live elsewhere (a
  composite-shell concern), but nothing in `sharps.html` or `bloodborne.html`
  surfaced either.
- **Solid:** "LO-level evidence of everything the learner did" is well covered —
  the Record screen (`js/layered-sharps.js:4083-4393`) is built exactly for this.
- **Connective note:** the PRD's Alignment table flags "pre/post question reuse...
  hasn't been confirmed to support the measurement design" (owned by Mike
  Martynowicz) — this is the same issue SHARPS-REVIEW-PLAN.md's finding #3
  already raised: F3's pre-item asks a quantity guess, not the clean
  agree/disagree pair either doc wants. One open question, not two.

## 2. Open decisions

Original fork list, kept for reference. Resolution status is in §2a below —
check there before assuming any row is still open.

| # | Fork | Options |
|---|------|---------|
| D1 | Objective-set realignment | Keep the built 10 (K1–K3/F1–F4/D1–D3) as a richer superset of K&A's 8, and document the difference · or fold code-K3 back into K2 and cut F4 to match K&A exactly |
| D2 | Pre-check shape | Keep the built 5-item battery (ordering task + 2 diagnostic MC + 2 Likert) · or collapse to K&A's 4-question, single-K1-gate design |
| D3 | F2 in-module question | Drop it from Manufacturing's `SAMPLE_MAP` to match K&A's explicit instruction · or keep it, and ask K&A to reconcile why F2 is listed as one of "this module's own eight objectives" if it's truly answered only in Module 2 |
| D4 | Case4 / chain duplication | Keep both the Chris/Jacob (`chain`) and Ruben (`case4`) stories as built · or retire one to match K&A's single Case 4 |
| D5 | Debrief statistic | Replace the 55/33/12% cohort reveal with K&A's pure narrative correction (no number) · or keep a number, sourced from real data once it exists, and treat K&A's "no statistic" instruction as a design disagreement to raise with them rather than follow |
| D6 | Simulation redesign | Keep the one simulation shared across all four sectors (current design, ties to this module's own `chain` narrative) · or build a Manufacturing-specific "unclaimed blade" sim matching K&A's script, breaking the "one sim proves the skill for everyone" principle |
| D7 | D3/Sustain follow-up | Leave as the documented self-report intention (current state; not required anywhere in the PRD) · or invest in a real platform-data 30/60/90 mechanic, which needs a data source (incident log, container-change log) that doesn't exist in this stack yet |
| D8 | Role-based content (PRD) | Build a second axis (role — e.g. chemical · industrial within Manufacturing) for at least one verified objective · decide whether it's a standing capability across all four sectors (all four already carry a dead `roles:` string) or a Manufacturing-only demo built just to satisfy this PRD row |
| D9 | Translation (PRD) | Decide the content architecture (refactor inline strings into a translatable table) · decide which LOs count as "top LOs" · decide who translates and who signs off, since "inherits the SME signature without re-review" is a process claim a prototype can't demonstrate on its own |
| D10 | Do-object mechanic (PRD) | Keep the roleplay sim as Bundle C's sole Do proof and get the PRD's scope language updated to match · or additionally build the simpler "video + stand-in MC" baseline so the documented minimum is shown somewhere too |
| D11 | Launch page / legacy-course links | Decide whether these live on `sharps.html` itself or on the composite shell `clara/bloodborne.html`, before building either |
| D12 | K1 compliance-lock | Ship K1 test-out as currently built (unlocked, live) while K&A's own OSHA determination is still open · or provisionally mark K1 "unconfirmed" in the build the same way D3 already is, until compliance rules |

## 2a. Decisions taken (Chris, 2026-09-16)

| # | Decision | Why |
|---|----------|-----|
| D8 | **Skip.** Not building a role axis. | Learners don't switch roles mid-module, so this is a content question, not an engine question. If K&A/SME author real chemical-vs-industrial content and hand it to us, we'll incorporate it then. Nothing to build speculatively. |
| D9 | **Skip for this prototype.** Not testing translation. | Spanish text via an i18n table is straightforward whenever it's needed — that's not the open question. The real blocker is translating media/other assets, and that's out of scope for what this prototype needs to prove. |
| D3 | **Do it.** Drop F2's Manufacturing sampling. | Straightforward — matches K&A's explicit "no question in this module" instruction. |
| D2 | **Keep the built 5-item battery as-is.** No collapse to K&A's 4-question design. | |
| D11 | **Build it.** Launch page with self-assigned identity, resume, and URL-prefillable params for learner role, name, and media preference. | Confirmed useful regardless of the D8 outcome — the same launch-parameter mechanism that already picks a sector could carry a role parameter later, whenever real per-role content exists. This doesn't foreclose D8, it just isn't gated on it. |
| D7 | **Leaning skip / defer**, not fully closed. | "Hard to demo without real data" — no incident-log or container-change data source exists in this stack. Lowest-stakes item on the list: the PRD's coverage matrix never requires a working follow-up mechanic at all, so this can sit exactly where it is indefinitely with no PRD risk. Revisit only if K&A specifically asks. |
| D1 | **Fall back to K&A's outline.** Trim from 10 objectives to their 8. | Cut `F4` entirely (no K&A counterpart). Fold the "why a sharp is dangerous" mechanism content (code's `K2`) and the recognition content (code's `K3`) into K&A's single K2 — the mechanism stays as supporting narration, not its own tracked/gated objective; the recognition objective is what carries K&A's K2 ID and lock policy going forward. |
| D4 | **Trim to one Chris/Jacob story.** | Keep `chain` (the interactive version — matches K&A's Case 4 by name and content, and the module's Feel-first structure is built around it). Retire `case4`/"A Coworker Got Stuck" (Ruben) — no K&A counterpart, and F1 doesn't need two touches once `chain` carries it. |
| D5 | **Keep the number in the debrief.** Tentative — "not sure, but as a prototype it makes sense to show a number." | No code change: this is already what's built (the 55/33/12% cohort reveal). Flag stands: the number is illustrative, not real data — worth a real cohort figure, or at least a "this isn't a real number" caveat, before this is ever shown outside a prototype context. |
| D6 | **Build K&A's scenario.** The hands-on scene becomes a situation the learner hasn't met before — a blade left by someone unknown, not Chris handing off his syringe. | Directly resolves the redundancy D4 also raised: with `chain` as the sole Chris/Jacob touch and the sim now a genuinely different incident, the module no longer re-tests the same moment twice. Highest-effort item on this list — see §4 and §5 for what it touches. |
| D10 | **Keep the full live simulation as the primary experience.** Add a reviewer-only toggle in the existing Demo menu to preview a simpler video + stand-in-MC version. | Satisfies the PRD's literal baseline requirement (it exists, it's showable) without exposing a weaker experience to real learners, and without building a fully separate parallel mechanic. Reuses the same reviewer-only-control pattern already used elsewhere (Skip → Demo menu, sector/lens switching). |

**Still open:** D12 (K1 compliance-lock flag) — the only item not addressed.
Not an LXD call; needs a compliance/legal answer on whether
1910.1030(g)(2)(vii)(E)/(F) actually locks K1, or a decision to ship with an
"unconfirmed" flag in the meantime the way D3/Sustain already carries one.

## 3. What doesn't make sense in their source documents

Raise these with the source teams rather than resolving them unilaterally in code.

**K&A's script:**
- Slide 4 says "four questions decide the learner's path," but the reference
  table on slide 40 lists what reads as five pre-check items — including a K1
  question ("First action before using a sharp") that never appears as its own
  slide anywhere else in the deck. Looks like an editing gap in their source.
- F2 is listed as one of this module's own eight objectives (slide 3, badged
  "From Source · LO 4.3"), but slide 27 says it's answered once, in Module 2, and
  not among this module's questions — a real tension between "this module owns
  eight objectives" and "one of those eight is answered elsewhere."
- The K1 compliance-lock is an open regulatory question (slide 8, citing
  1910.1030(g)(2)(vii)(E)/(F)) that four slides of test-out/test-up branching
  logic are built contingent on, with no marker for which slides change if it
  flips. Same caveat on D3 (slide 39: "assumes Manufacturing uses the
  platform-data channel... neither confirmed"). Building precisely-detailed
  mechanics on unconfirmed premises for something shown to customers in November
  is worth a timeline check before committing further.
- The debrief's "no statistic is used" instruction is a defensible instructional
  choice but in real tension with how false-consensus corrections usually work
  best (a concrete norm number is typically what moves the belief) — a design
  disagreement worth having with K&A, not a silent fix.

**The PRD:**
- Section 2's prose calls Bundle C "many roles," while the scope section's line
  item says "two sectors, two roles." Not testable as written — needs a number.
- The role-based-content requirement never names which two roles to build. K&A's
  "chemical · industrial" is the obvious source but the PRD doesn't say so.
- Translation's "FULL... inherits the SME signature without re-review" is a claim
  about a review *process*, not a renderable prototype feature — a UI showing
  Spanish text doesn't prove a re-review was skipped. Needs a real
  translation-and-signoff workflow running alongside the build.
- The in-scope Do-object baseline directly contradicts what's already built and
  working for this exact module. The PRD hasn't caught up to its own Stretch
  goal already having shipped for Bundle C.
- "Near-production interface quality" vs. "production-quality UX" — already
  flagged as unresolved in the PRD's own Alignment-items table. Nothing to add,
  just confirming it's still open.

## 4. What would break

- **The objective taxonomy is duplicated in three other files, not just
  `layered-sharps.js`.** `clara/learning-engine-sharps.html:1558-1218` hand-copies
  the full K1–K3/F1–F4/D1–D3 array into its own independently-runnable worked
  example, with its own sampling logic; `clara/index.html:230` hard-codes "ten
  objectives" in the hub-lane copy; `clara/structures.html` reads the sharps
  module's live sessionStorage and its own copy of the objectives table. There's
  no propagation checklist for this family the way `js/README.writer-studio.md`
  §7a covers Writer Studio. Any D1/D3 objective-set change has to touch all four
  files or the two stakeholder-facing explainer pages — exactly what you'd show
  K&A or the PRD's authors — go stale.
- **The simulation is deliberately shared across all four sectors.** A D6 rebuild
  to match K&A's premise means either giving Manufacturing its own scenario
  (breaking a currently-intentional design principle) or accepting the mismatch
  stays. Touches `scenario-simulator/js/scenario-types/mix-arc.js`, a shared
  module outside this module's own files — ship carefully, per
  SHARPS-REVIEW-PLAN.md's own note on this exact surface.
- **Case4/chain de-duplication (D4) removes a guarded design property.** Three
  separate code comments (`chain`, `case4`, hazard `jobPara`) explicitly protect
  against reusing the same incident across screens. Cutting the Ruben story
  relaxes a rule the code enforces on purpose.
- **A role axis (D8) doesn't stay contained to Manufacturing.** All four lenses
  already carry an unused `roles:` string (Education: "teacher · administrator",
  AEC: "architect · engineer · construction", Public: "EMS · fire · law
  enforcement"). Building the mechanic for Manufacturing only, while the same
  dead field sits on the other three, will read as an obvious gap the moment
  anyone opens the Learning Layer view.
- **Translation (D9) multiplies the content-maintenance surface.** 4 sectors × 2
  languages, minimum, for whichever LOs get translated — every future content
  edit to those LOs has to remember to touch both languages going forward.
- **The Do-object decision (D10), if it goes to "build both,"** means maintaining
  two divergent Do mechanics for the same module rather than one — real ongoing
  cost either way this is decided.

## 5. The plan, line by line

Effort: S under an hour · M a working session · L several sessions. D12 is the
only remaining open call — get it before or during step 1, everything else below
is decided and buildable in order.

### A. Foundational — do first, everything else depends on it

**Shipped 2026-09-16** (`3f552f85`, plus the `index.html` label fix). Verified
end to end in-browser: battery (4 items), hazard (plain narration, no check),
cases 2/3 (K2 label correct), controls (F2 skipped for Manufacturing), walk
(opens on the D3 plan, no rating), Record screen (8 rows, correct counts).

1. **D1 — trim to K&A's 8 objectives.** Cut `F4`. Fold code's `K2` (mechanism)
   into supporting narration under the recognition objective, which takes over
   K&A's `K2` id and lock policy (was code's `K3`). Update `js/layered-sharps.js`
   and the one-line `clara/index.html` hub-lane label ("ten objectives" → eight)
   in the same change — cheap enough not to defer, and leaving an obviously
   false count on the module's own entry point isn't worth saving for round 2.
   **`clara/learning-engine-sharps.html` (the workbench) and
   `clara/structures.html` (the Learning Layer view) are deliberately NOT
   touched here** — see §6, queued for round 2. Both will show the old
   10-objective set and stale content until that round lands; that's an
   accepted, temporary inconsistency, not an oversight. — S–M for this round's slice.

### B. Content-level fixes, once A lands

2. **D3 — drop F2's Manufacturing sampling** from `SAMPLE_MAP`. — S. **Shipped
   with A above (`3f552f85`).**
3. **D4 — retire `case4` ("A Coworker Got Stuck," Ruben).** Confirm F1's
   post-check still has enough surface carried by `chain` alone before deleting. — S–M.
   **Shipped (`690ea395`).** F1's post-rating moved onto `chain` (revealed once
   after it first settles). `downstream`'s trigger now reads `chain.post`.
   Known consequence: `downstream` stayed in its original position (after
   controls, before debrief) rather than moving next to `chain` — the ask and
   its remediation now sit further apart than before. Worth revisiting later,
   not done this round.
4. **D5 — no change.** Already matches the decision (the debrief's numeric
   reveal is what's built). Leave the "illustrative, not real data" comment in
   place as a flag for later. — none.
5. **D12 — resolve the K1 compliance-lock call.** If shipping K1 unlocked as-is,
   add a reviewer-visible "unconfirmed, pending compliance" marker, the same way
   D3/Sustain is already flagged on the Record screen. — S, pending the decision itself.
   **Shipped (`690ea395`).** Ships K1 live/unlocked as built — neither team can
   make the actual regulatory call, so this is a reviewer-visible flag only
   (K1's `lock` string, the battery step's caption), not a learner-facing change.
6. **D7 — no action.** Leave D3/Sustain as the documented self-report intention.

### C. The simulation rebuild (D6) — the big one

**Shipped (`d8ff3f77`).** "The Blade That Is Not Yours" (`unclaimed-blade-sharps`,
was `end-of-shift-sharps`) replaces the Chris/Jacob hand-off. Four `coach-led`
beats (decision, execution, container, close) — no character to negotiate with,
matching K&A's script. Verified end to end with the live AI player: correct
tier grading, correct debrief delivery, correct sessionStorage write-back,
correct Record-screen rendering against the new beat ids. **Manufacturing
only, this round** — Education, AEC, and Public sector keep the old Chris/Jacob
simulation for now, queued at §6.

**Watch item found during verification, not fully closed:** the shared
player's tier-reporting can drop a beat's tier under some turn patterns (model
non-determinism, not a fixed bug — same class of issue already flagged for
other sim types). Tightened `reactionGuidance` on the execution/container
beats since those feed the Record screen's D2 evidence; the closing beat's
tiers are left loose on purpose since nothing reads them. Worth a spot-check
on a few more live runs before calling this fully reliable.

7. ~~Author the new hands-on scene per K&A's script~~ — done, see above.

### D. Do-object baseline (D10)

8. Add a reviewer-only row to the existing Demo menu that swaps the live
   simulation for a short demonstration video plus one stand-in multiple-choice
   question — same pattern as the Skip → Demo-menu move and the sector/lens
   switcher. Learners never see it; it exists so the PRD's literal baseline is
   demonstrable on request. — M.

   **Shipped (`025423cd`).** A "Do-object baseline" row on the handoff
   screen's Demo menu flips `enact`'s hand-off from a function, checked fresh
   on every visit, so the toggle takes effect with no reload. On (reviewer
   only, off by default): `enact` renders in-page instead of redirecting — a
   placeholder video (falls back to text, since no clip exists at that path
   yet) plus one stand-in multiple-choice question, gating Continue the same
   way the rest of the module gates on an answer. Off (every learner, always):
   unchanged, the live AI scenario. Verified end to end in-browser both ways.
   **Known simplification, not fixed this round:** the Record screen's D1/D2
   rows read the live scenario's own write-back and already fall back to
   generic "in the scenario" phrasing when that is absent — which is also
   what a baseline-mode run shows, so the copy reads slightly off for that
   path specifically ("with a real interruption rather than a button on a
   page," when a reviewer just used one). Not worth chasing: no learner ever
   takes this path, only a reviewer demonstrating it on request.

### E. Launch page (D11)

9. Self-assigned learner identity, resumable progress, and URL-prefillable
   params for role, name, and media preference. Decide placement — `sharps.html`
   itself vs. the composite shell `clara/bloodborne.html` — before building. — M.

**Not building this round (D8, D9):** role-based content and translation. No
line items — both are explicitly parked, see §2a.

## 6. Queued for round 2 (Chris, 2026-09-16)

Deliberately deferred until round 1 (§5, A–E) ships — not blocking it, not
bundled into it.

1. **The workbench (`clara/learning-engine-sharps.html`).** Its live worked
   example hand-copies the full objective array, the pre-battery presets
   ("The learner, as written," "Compliance launch"), the sampling explanation,
   and the rubric/permutation panels. All of it needs to be resynced to
   whatever round 1 actually ships: 8 objectives instead of 10, the new
   simulation content in place of the Chris/Jacob one, and the Demo-menu
   baseline toggle (D10) reflected if the workbench is meant to demonstrate it
   too. This is the heaviest of the deferred items — it's a second,
   independently-runnable implementation of the same ideas, not a config file.
2. **The Learning Layer view (`clara/structures.html`).** Its objectives table
   is a maintained reference, not something read live from the module — same
   resync need as the workbench, lighter lift.
3. **Sector parity — Education, AEC, Public sector.** Write each of them a
   scenario matching Manufacturing's new K&A-caliber standard (a fresh,
   unclaimed-hazard situation in that sector's own setting), replacing their
   current shared Chris/Jacob sim. No source script exists for these three the
   way K&A wrote one for Manufacturing — this is original authoring, not a port,
   and it's the reason it's queued rather than done alongside Manufacturing's
   rebuild in round 1.
4. Once all three are done, re-run the check in §7 step 6 (workbench and
   Learning Layer view match the shipped module) as confirmation, not as new
   discovery.

Until round 2 lands: the workbench and Learning Layer view show the old
10-objective set, and Education/AEC/Public sector still run the retired
Chris/Jacob simulation while Manufacturing runs the new one. Both are known,
accepted gaps, not something to fix opportunistically mid-round-1.

## 7. Sequence

1. Land/park the other session's uncommitted edits (§0).
2. Reconcile this brief against SHARPS-REVIEW-PLAN.md's still-open items so the
   two don't run as separate, conflicting threads.
3. Get D12 resolved (the one remaining open call) — quick, doesn't block starting A.
4. Build round 1 in order: A (objective trim) → B (small content fixes) →
   C (simulation rebuild) → D (Demo-menu baseline toggle) → E (launch page).
   D and E don't depend on C and can run in parallel with it if useful.
5. Raise §3's document-level inconsistencies with K&A and with the PRD's owners
   in parallel with the build.
6. Verification on round 1: both-paths × four-sectors sweep, icon check,
   vocabulary sweep as SHARPS-REVIEW-PLAN.md §4 specifies, plus a fresh pass on
   the new simulation specifically. Ship per the default workflow when Chris
   says done.
7. Once round 1 has shipped, pick up round 2 (§6): resync the workbench and the
   Learning Layer view to match.

## 8. Kickoff prompt for the new thread

> Read `products/aithera/lesson-presentation/clara/docs/SHARPS-ALIGNMENT-BRIEF.md`
> in full, and `SHARPS-REVIEW-PLAN.md` alongside it — the two overlap and need to
> be reconciled into one sequence, not run independently. Start with §0 (land or
> park whatever's currently uncommitted). Eleven of twelve decisions are already
> taken (§2a) — get D12 (the K1 compliance-lock flag) from Chris, then build §5
> in order, confirming with Chris before starting part C (the simulation
> rebuild), since it's the highest-cost item and touches shared code outside
> this module. §6 (the workbench and Learning Layer view) is queued for a
> second round after §5 ships — don't pull it forward into round 1. No PRs;
> ship to vl/main when Chris says done.
