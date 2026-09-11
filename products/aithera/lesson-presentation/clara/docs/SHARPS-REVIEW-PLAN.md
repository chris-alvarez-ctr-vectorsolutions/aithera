# Contain the Sharp — review findings and improvement plan

Written 2026-09-11 from a two-pass review of the CLARA sharps prototype
(`clara/sharps.html` + `js/layered-sharps.js`, on the shared `js/layered-engine.js`)
against the stakeholder doc "How the Learning Layer's Engine Works"
(`~/Downloads/Learning_Engine_Overview.pdf`, rendered in `clara/learning-engine.html`).
All decisions below were taken by Chris on 2026-09-11. **Nothing in the prototype has
been changed yet.** This file is the brief for the thread that does the work.

## 0. Before touching anything

- Another session holds **uncommitted edits** to `clara/sharps.html`, `js/layered-sharps.js`
  and `clara/index.html` (last touched 2026-09-11 09:51; the confidence-and-plan screen was
  rebuilt into a two-part "Plan the walk" layer). Land or park that work first, then start
  from the committed state. Shared-worktree rules apply: back up, stage own hunks, no add-all.
- Preview: `http://localhost:4599/products/aithera/lesson-presentation/clara/sharps.html`
  (another chat's server already serves the repo root on 4599; just navigate).
- Standing rules that apply to every edit: no framework vocabulary on learner screens
  (gate, test-out, objective, battery, beat, Know/Feel/Do, evidenced, policy — CLARA's lines
  included); labels are plain format + duration metadata; CLARA is "they" and appears only to
  react or to explain something written nowhere on screen; bump `?v=` on the script tags.
- Verify with both paths (procedure proven / not proven) in all four sectors, run the
  invisible-icon console check, and run the vocabulary regex sweep before calling anything done.
- Browser-pane note: a hidden pane stalls the engine's rAF transitions; use `?step=<id>`
  deep links and `resize_window` first.

## 1. What the review found

### Pass 1 — alignment with the Learning Engine doc

1. **No remediation loop.** A failed Know check gets two tries at the same question, then
   Continue opens and nothing returns. Doc: failed items go on a remediation list, return
   before the Do objects in a different modality with a fresh question from the bank; gates
   repeat until passed.
2. **Test-up fires off the wrong objective.** K3 (spotting conditions, locked) is never in
   the battery; its "harder cases" trigger is `k2up = (K1 proven)`. K2 is never asked either,
   though the doc says remediating items always are.
3. **F3 is not a before/after pair.** Entry asks how many coworkers use the container; the
   post asks where your own shift sits against the figure. The record chip grades guess
   accuracy, not the shift.
4. **K1 is checked twice.** The in-flow check runs for learners who proved K1 in the battery.
   Doc: the pre-battery proof stands.
5. **The record cannot see the scenario.** Both Do rows read "In the scenario" regardless of
   outcome or whether it ran; CLARA asserts "nine of the ten are answered, Rob".
6. **Title page mastery rule** ("Good or above on 80% of objectives") is the aptitude
   vision's threshold, not the doc's per-objective mastery.
7. **Policy vocabulary drift.** Code uses gate / remediate / ask / never + a lock string;
   doc uses None / Ask (sampled) / Remediate / Gate + a separate locked flag. Several flags
   route nothing.
8. **Test-up re-scores.** Harder cases are still graded; doc says served harder, not quizzed.
9. **Feel before Know** (deliberate; doc says conventionally Know → Feel → Do).
10. **Hub lane is stale** (promises a beat added on low Feel, a 30/60/90 follow-up, a
    real-time moment; says nine objectives — the module has ten).
11. **Doc's prototype brief not met:** one composite end to end, a scorecard. Only Module 4
    exists; no sequencing, unlock, or recency credit visible.
12. **Audio declined** at module level while the doc lists audio in the first cut and uses
    the post battery for exactly that case.
13. **No Learning Layer view for sharps.** `clara/structures.html` covers only Bystander,
    yet the code says the routing vocabulary "lives in the Learning Layer view".
14. Reviewer-facing captions use "battery / beats / policy chip" where the doc says card,
    learning object, permutation, break point, locked.

### Pass 2 — the learner's experience

- The way forward moves: CLARA's bubble on battery items 1–3, the footer on item 4, a
  relabelled footer on three screens, in-content buttons elsewhere.
- Expectation-setting lines ("two tries", "no right answer") sit behind CLARA's unread dot;
  the 7-second idle hint interrupts reading the timeline brief.
- After two misses on a check the answer is never stated and the remaining option is still
  clickable (and would record a pass).
- Ordering item: after a miss the correct order is never shown.
- Explainer screen defaults to a PLACEHOLDER video poster; the clip teaches disposal, not
  the mechanism; "Read" unlocks Continue in 0.7 s; CLARA's summary pre-empts the check.
- Procedure screen: designer's objective sentence as subtitle; steps hidden behind the video;
  four steps mixed with two rules under "the order is the procedure"; Skip visible.
- Case 2 harder-variant line says "both answers" over three options.
- "Part 2 of 2" appears on four screens with no Part 1.
- Several CLARA bubble replies run past 60 words.
- Cohort screen: recall quotes different wording from the question asked; "You said" tag
  reads as a mismatch; disclaimer talks to reviewers.
- Plan screen and record mention a "check after the course" that exists nowhere.
- Handoff to the scenario reloads into different chrome with no bridge; Manufacturing casts
  the learner as the person injecting insulin while the scenario makes Chris the diabetic.
- Record: hardcoded "Rob", unconditional count, K1 row hides a failed check, "evidenced" and
  "objective" leaks, "Recorded · low" band.
- Review-only affordances visible to learners: Skip pills, jump-anywhere syllabus rows, S key.
- Interstitial "Your Updated Path" appears in the syllabus on the proven path.
- Accessibility (low confidence, verify with VoiceOver): option buttons and folded timeline
  heads came back unnamed in the tree; Part marker is visual only.

## 2. Decisions (Chris, 2026-09-11)

| # | Fork | Decision |
|---|------|----------|
| D1 | Forward control | **Footer button, relabelled per act** ("Next question", "Done reading", "One more question", "Plan the walk", "Continue"). CLARA's bubble = reactions + chat only. In-content buttons only for acts inside a screen (Begin, Then what, Show me the numbers, Done, Commit it). |
| D2 | Remediation scope | **Know only, inserted live before Perform.** K1 card loops with fresh items until passed; K2 card runs once then moves on. Different modality than served. Banks of 2 alternates each. |
| D3 | Scenario data | **Yes — additive session-storage write** from the shared player at debrief, keyed by scenario id, per-beat tiers. Record renders D1/D2 beat by beat. |
| D4 | Pre battery | **Five items:** K1 ordering task, new K2 misconception item, new K3 recognition item, F1, F3. "Never acceptable" item moves to K1's check bank. |
| D5 | Engine scope | **Sharps first, behind opt-in flags** passed at `register()`. Bystander untouched; its sweep is a later follow-up. |
| D6 | Feel + K3 | **F1 remediates via "Who Handles Your Waste"** (inserted only when the F1 post answer stays unfavourable). **K3 = gate + locked.** F2 and F4 shown as *sampled*, deterministic by sector. |
| D7 | Audio | **Build a listen carrier + post battery.** Explainer article gets the Bystander TTS pattern; choosing it defers the K2 check to a post-battery step before the record. |
| D8 | Composite | **Build the shell now:** Bloodborne Pathogens course page, six modules with states (some mastered earlier under the recency window), Module 4 launches sharps, completion unlocks Module 5. Draft scorecard alongside. |
| D9 | Order | **Keep Feel first;** state the departure in the step caption and the Learning Layer view. |
| D10 | Chain role | **Rewrite the Manufacturing timeline:** Chris hands you his sharp while he takes a call. |
| D11 | Handoff | **Bridge screen inside the module; a flag tells the player to skip its own establishing card** and open on beat one. |
| D12 | Follow-up | **Drop the later-check references** (CLARA's commit line, D3 record row). The written plan stays as the artifact; D3 stays open. |
| — | Defaults taken | Placeholder explainer video hidden from learners (Demo menu only). Watch / Read / Step-through chooser exposed to learners on the procedure screen. |

## 3. The plan, line by line

Effort: S under an hour · M a working session · L several sessions.

### A. Global patterns (do first; every screen fix depends on them)

1. **One home for the way forward** (D1). Engine flag e.g. `nav: 'footer'`; battery items
   use `setNextAction('Next question')`; remove `setCoachAction` usage from sharps; audit
   every screen's forward control. — M — `layered-engine.js`, `layered-sharps.js`.
2. **Rules on the page, posture lines lead.** Eyebrows carry the rule ("Check: 1 question ·
   two tries", "Not graded"); remaining posture lines get `coach.lead: true`; `coach.hint:false`
   on reading screens (timeline brief, explainer, account, procedure). — S.
3. **Review mode.** Skip becomes a Demo-menu row; syllabus rows clickable only for completed
   sections unless review mode; S key only in review mode; Demo button stays as the single
   entry. — S — engine + two video frames + title page.
4. **Part markers start at one.** "Part 1 of 2" from the start on the budget choice and the
   shift pick; drop the counter on the account and cohort screens (first half is a read/reveal). — S.
5. **Bubble length cap** ~35 words; split or trim the gloves reply, the rating-vs-purchase
   gap reply, the container principle reply, both puncture-check replies. — S.
6. **Vocabulary sweep, two audiences.** Learner strings → plain English (title card,
   placeholder poster, record footer, canned reply "evidenced/objective"); reviewer captions
   and Learning Layer view → doc glossary (card, learning object, permutation, break point,
   pre battery, locked, test-out/test-up, remediation, goal). Add the regex sweep to the
   done-checklist. — S / M.
7. **Accessible names + icon check.** Verify with VoiceOver; label `.bl-option`/`.cs-opt`
   and `.ch-head`; announce the second-part heading; run the icon check on every screen. — S.
8. **Hide interstitial rows** from the title-page list (engine already excludes them from
   the count). — S.

### B. Assessment mechanics (in this order: battery → routing → remediation → write-back → record)

9. **Five-item battery** (D4). New K2 item (the "more blood on a needle" misconception, a
   *different* item from the in-flow check) and K3 recognition item. Routing: K1 correct →
   drop procedure + case 1; K3 correct → both cases harder and ungraded; K2 correct → explainer
   served in its more demanding permutation with no check (gate `hzcheck` off). Update the
   title-page legend ("first four answers"). — M.
10. **Remediation loop** (D2). Two content builders inserted between `debrief` and `walk`
    via `when()` predicates reading `inflow.passed` / `hazard.passed`: "Another look: the
    procedure" (modality ≠ served; fresh item; loops until passed) and "Another look: why a
    trace matters" (one retry then on). Section counter grows (`refreshNav`), title page shows
    the added card, record says "passed on the second look, in writing". Author banks. — M–L.
11. **Check closure.** On the second miss: mark the correct option, disable the set, CLARA
    states the answer, record the miss, line says it comes back later. — S.
12. **K1 not tested twice.** `inflow.when = () => batteryResult() !== 'proven'`. — S.
13. **Scenario write-back** (D3). Shared player writes
    `sessionStorage['scenario-result:<id>'] = { beats:[{id,tier}], completedAt }` at debrief;
    record reads it: D1 ← decision + pressure, D2 ← container (+ transfer as bonus). Also record
    the carrier chosen for K2 and the modality for K1. Counts and CLARA's opening line derive
    from the record. — M — shared player (`composed-scenarios/index.html` / `js/sim-player.js`),
    ships carefully.
14. **F3 as a real pair.** Post re-asks the identical entry item after the reveal; record
    shows a move chip; accuracy stays as the evidence sentence; recall quotes `BATTERY[…].stem`
    directly. — S.
15. **Policy model in doc terms** (D6). `policy: none|ask|remediate|gate`, `locked: bool`,
    `sampled: bool`. Mapping: K1 gate; K2 remediate+locked; K3 gate+locked; F1 remediate;
    F2 ask+sampled; F3 remediate; F4 ask+sampled; D1, D2 gate; D3 none (declared extension).
    F1 remediation = "Who Handles Your Waste" inserted only when the F1 post stays ≤ Somewhat.
    Sampling shown deterministically by sector (e.g. F4 in sample for two of four sectors),
    record says "not asked of you this time — sampled across your cohort". Captions render
    from these fields. — S rename, M for the mechanics.
16. **Test-up as permutation.** Harder cases stay but are not scored; record: "proven at the
    start, served harder, not re-scored". — S.
17. **Title-page mastery rule.** Replace the 80% card with the doc's rule: every section done,
    each check passed, the end-of-shift scenario performed, no final test. (Bystander carries
    the same card — note the inconsistency until swept.) — S.
18. **Feel-first stays** (D9); caption + Learning Layer view name the departure. — S.
19. **Listen carrier + post battery** (D7). TTS carrier for the explainer article (Bystander
    Audio Summary pattern, learner-initiated, never autoplay); `postbattery` step before
    `record`, `when` any check was deferred; holds the K2 check when audio was chosen. — M–L.
20. **Composite shell + scorecard** (D8). New course page (e.g. `clara/bloodborne.html`):
    six modules BO-1…BO-6 — pull the outcome names from
    `~/Downloads/Ideal Knowledge Layer Prototype Plan.pdf` (pypdf works) — states: two mastered
    months ago and counting under the 365-day window, Module 4 in progress, rest locked;
    Module 4 launches `sharps.html`; finishing the record marks Module 4 mastered and unlocks
    Module 5. Entry from `clara/dashboard.html`. Draft reviewer scorecard from the doc's five
    prototype must-haves + the four capabilities. — M + S.
21. **Learning Layer view for sharps.** Module switcher on `structures.html`; render the
    sharps objectives table, battery plan, permutation matrix and this run's derivation chain
    from the same `OBJECTIVES` data. — M.

### C. Screen-by-screen

22. **Title page:** items 17, 8, 3; legend/time card copy for five questions. — S.
23. **Ordering item:** on a miss, re-sort into the correct order with misplaced rows still
    amber. — S.
24. **Timeline:** hint off on the brief; on the safe route make "Want to try the other path?"
    primary and Continue secondary; close the calm node naming what was avoided; **rewrite the
    Manufacturing incident per D10** (Chris hands you his sharp while he takes a call). — S + content.
25. **Why Sharps Are Dangerous:** default carrier = Read while `HAZARD_PLACEHOLDER`; hide the
    placeholder video from learners (Demo only); "Done reading" gate; CLARA's line moves to
    after Done reading and is softened so it does not hand over the check's answer. Real
    explainer footage remains a content request. — S.
26. **Safe Handling, Step by Step:** learner lede instead of the objective sentence; expose the
    Watch/Read/Step-through chooser to learners (retire the review-only modality control);
    split into four numbered steps + two unnumbered rules; Skip → Demo menu; podcast decline
    text only in review mode. — M.
27. **Cases:** "both answers" → "all three"; openers per item 2; grading per item 16. — S.
28. **Account + budget screens:** items 4 and 5. — S.
29. **What Your Shift Does:** quote the real stem; tag reads "Your guess: about half" beside the
    figure; learner-facing disclaimer, deployment sentence to the caption; post = same item
    (item 14). — S.
30. **When You Are Behind:** drop later-check references (D12) from CLARA's commit line and
    the D3 record row. Coordinate with the in-flight rebuild of this screen. — S.
31. **End of Shift handoff (D11):** a real module screen — eyebrow "Perform: live roleplay,
    about 5 minutes", the moment in two lines, what will happen, "Enter the scenario"; pass a
    flag so the player skips its establishing card. — S–M — `mix-arc.js` EXAMPLE_SHARPS /
    player boot.
32. **Your Record:** name from the frame or none; counts derived; K1 states pass/fail and the
    remediation return; Do rows from item 13; "evidenced" → "shown"; F4 band → "Recorded" with
    the number in the sentence. — S once 10 and 13 exist.
33. **Hub lane** (`clara/index.html` ~line 214): rewrite to the current module — entry
    questions, one section removed and two made harder, four sectors, a live roleplay, a record
    with one line open on purpose; ten objectives; chips to match. — S.

## 4. Sequence

1. Land/park the other session's edits (§0).
2. Global patterns (A1–A8) behind engine flags.
3. Mechanics in order: battery (9) → routing (12, 16) → remediation (10, 11, 15) →
   write-back (13) → F3 pair (14) → record (32).
4. Screen content (22–31), then audio + post battery (19).
5. Stakeholder-facing: hub (33), Learning Layer view (21), title rule (17), composite shell +
   scorecard (20).
6. Verification: both paths × four sectors, icon check, vocabulary sweep, VoiceOver pass,
   screenshots. Then ship per the default workflow when Chris says done.

## 5. Kickoff prompt for the new thread

> Read `products/aithera/lesson-presentation/clara/docs/SHARPS-REVIEW-PLAN.md` and the memory
> note it links. Start with §0 (another session's uncommitted edits to the sharps files must
> land or be parked first). Then take the plan in the §4 order, one item at a time, confirming
> with me before each mechanics item in §B. No PRs; ship to vl/main when I say done.
