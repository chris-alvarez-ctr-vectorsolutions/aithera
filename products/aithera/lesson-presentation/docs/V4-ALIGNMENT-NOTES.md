# Scenario CML v4 Alignment

## Purpose

This document describes the work to make **POC V4 (Scenario CML v4)** the authored source of truth for **UX Universal**.

Today, UX Universal has several scenario types with their own internal shapes and conversion logic. The retrofit replaces those per-type authored shapes with the POC V4 format while preserving the existing player wherever possible.

This document records:

* what has been decided;
* what has already been built and verified;
* where UX Universal and POC V4 still differ;
* what remains to be authored or aligned; and
* which product and format questions are still open.

It is the companion to `SCENE-SWEEP-CONVERGENCE-PLAN.md`.

**Current status:** All five implementation stages are built and verified as of **2026-08-17**.

The `?type=v4-universal` path can now play POC V4 documents through the existing universal-player resolver. Writer Studio can author them, and all seven templates boot successfully in the browser.

The remaining work is primarily:

1. resolving the alignment questions in §14;
2. completing the remaining 64 authoring fields; and
3. deciding whether to make V4 the default authored source, which is gated on §14.1.

### Useful commands

Play a V4 scenario:

```text
scenario-live.html?type=v4-universal&observe=text
```

Verify prompt alignment (session scratchpad, not committed):

```bash
node prompt-diff.js
```

Regenerate the templates (session scratchpad, not committed):

```bash
node regenerate-templates.js
```

**Last updated:** 2026-08-17

The current state has been reconciled against the `scenario-simulator-poc` repository, including:

* `spec-alignment-audit.md`
* `v4-migration-report.md`
* `sme-punch-list.md`

---

## 1. Terminology

| Term             | Meaning                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **POC V4**       | Scenario CML v4, the content format and engine in `VectorLearning/scenario-simulator-poc`. This is the format UX Universal is aligning to. |
| **UX Universal** | Our prototype stack: Writer Studio, `js/sim-player.js`, the scenario types, and `scenario-live.html`.                                      |

The recommendations in this document are based on the resulting behavior and consequences, rather than on which system originally implemented a behavior.

---

## 2. The V4 Model

POC V4 defines a scenario as a sequence of **phases**.

A scenario does not have a scenario-type field. Instead, each phase contains a `practice`, and the practice declares a `mode`.

The three current V4 modes are:

| V4 mode         | Learner activity                                | UX Universal equivalent |
| --------------- | ----------------------------------------------- | ----------------------- |
| `coach_inquiry` | Works through a question with the coach         | `coach-led`             |
| `roleplay`      | Acts out a scene                                | `roleplay`              |
| `observe_react` | Studies an exhibit and identifies what is wrong | `observe`               |

Every phase consists of:

* one `practice`, where the learner does something; and
* one `debrief`, where the coach teaches against that attempt.

This is an important conceptual shift for UX Universal: **the scenario type is no longer part of the content format.**

A useful way to think about it: the three modes are ingredients, and a scenario type is a recipe — a known way of combining them. The engine only ever sees the finished dish. It never asks which recipe you followed, and nothing in the document records one. “Guided arc” is what you'd call the result by looking at it, the way “casserole” describes a dish rather than being printed on it.

### Scenario types become templates

The existing UX Universal scenario types do not need to disappear from the authoring experience.

Instead, they become **starting templates** — the recipes.

A template provides a V4 skeleton with:

* an appropriate sequence of modes;
* sensible turn budgets;
* the expected structure; and
* any other conventions needed to make that scenario shape work.

For example, adding a roleplay phase to a previously coach-led scenario is simply adding another phase — swapping an ingredient, not switching cuisines. It is not a type migration.

This means mixed scenarios become normal rather than exceptional, and templates can evolve without requiring engine changes.

Writer Studio therefore keeps its type gallery as a **template picker**.

`derivedTypeLabel` in `scenario-v4-runtime.js` can still describe the resulting scenario in the Studio/player UI, but it does not constrain the document.

This is consistent with the V4 spec's position that a “tutor scenario” is a description, not a declaration.

---

## 3. Why We Are Doing a Full Retrofit

The decision is to make V4 the authored format throughout UX Universal rather than simply adding an export step.

An export-only solution would leave the existing authoring model intact and attempt to manufacture a valid V4 document afterward. That does not work reliably because the converter cannot invent missing instructional content such as rubrics, purposes, or teaching points.

The retrofit therefore moves both sides of the stack:

**Writer Studio → V4 → V4 runtime compiler → existing universal player**

The important part is that the final step does **not** require rewriting the player.

---

## 4. Decisions

| #  | Decision                                                                                      | Rationale                                                                                                                                                                                                     |
| -- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 | **Use V4 as the authored source of truth.**                                                   | An export adapter cannot reliably invent missing instructional content. Studio and the player therefore move to V4 together.                                                                                  |
| D2 | **Support all authorable scenario shapes, including scene-sweep.**                            | Scene-sweep's hotspots provide a clean source for a V4 `observe_react` rubric.                                                                                                                                |
| D3 | **Compile V4 into the existing runtime shape.**                                               | This allows us to keep `sim-player.js` and the existing modules intact and compare behavior directly before and after the migration.                                                                          |
| D4 | **Normalize all quality scales to three levels: `unthoughtful`, `neutral`, `strong`.**        | This is the assessment model built into V4, and all 11 current V4 scenarios use it. Existing `CONNECTS` / `VAGUE` / `CONFRONTS` vocabulary does not carry over.                                               |
| D5 | **Represent answer shape explicitly.**                                                        | `answer_shape` is needed to distinguish practices with a definite answer from practices where judgment is intentionally open. We should not infer this indirectly.                                            |
| D6 | **Do not invent missing prose during conversion.**                                            | If the source does not contain a field, the converter leaves it empty. Validation errors then become the authoring worklist instead of producing documents that look complete but contain fabricated content. |
| D7 | **Keep scenario types as Studio templates.**                                                  | This preserves the existing LXD workflow without making scenario type part of the V4 format.                                                                                                                  |
| D8 | **Default mechanical fields where V4 requires them and the decks provide no authored value.** | This reduces the authoring burden without inventing teaching content. Teaching prose remains authored. `final_word` remains authored.                                                                         |

The mechanical defaults reduced the initial blocking field count from **131 to 64**. The remaining fields are being evaluated separately in §14.1.

---

## 5. What We Are Not Changing Yet

Three interrelated engine changes were deliberately kept out of the retrofit.

**Why they waited (and which reason has expired).** The original reason was
verifiability: the compiler's job was to produce the SAME runtime from V4 input,
so every behavior difference could be attributed to a bug or a documented choice
(the 264/338 baseline). Deliberate behavior changes bundled into that migration
would have poisoned the attribution. That reason is now RETIRED — Stages 1–5 are
committed and baselined. What still stands is that these are RUNNER changes with
learner-visible consequences, and they are interdependent (see the sequencing
note at the end of this section).

**Recommendation (2026-08-17, awaiting Chris's confirmation): go ahead, sequenced.**

1. **Debrief rung first, scoped to the v4 route only** — ScenarioV4Runtime emits
   the debrief rungs; native types' toRuntime untouched, so shipped demos keep
   their exact behavior. Sizing honesty: the runner has no zero-turn rung
   (`cap = Math.max(1, …)`), so delivery-only debriefs need play-locked-and-
   auto-advance machinery, and the "Phase N of M" display must count V4 phases,
   not rungs. The real fidelity gap is the **10 of 29 interactive debriefs** in
   the POC V4 content — today a probe is asked but the answer has nowhere to
   live, and follow_up_turns / final_word / probe are carried but unconsumed.
   (Today's close-teach already approximates a delivery-only debrief, so those
   19 are roughly right already.)
2. **Scoping + carryover together, AFTER the dev conversation** — partly size
   (it deserves its own prompt-diff-per-scope verification round), partly
   strategy: if the meeting concludes production owns the engine from here, the
   ROI of rebuilding scoping in the prototype drops sharply.

**Carryover alone is a no-op** — in the single-conversation player the model
already sees every earlier turn, so carryover is trivially over-satisfied. The
field only becomes meaningful once scoping exists for it to punch through; it is
part of change #2, not a third change.

### Prompt scoping

POC V4 supports two conversation scopes. UX Universal currently compiles everything into a single prompt.

That behavior remains unchanged for now.

### Debrief ownership

V4 treats debrief as a separate turn-owning structure. UX Universal currently keeps:

```text
debrief.talkItThrough
debrief.points
```

on the rung.

That also remains unchanged for now.

### Carryover

`carryover` is preserved in the V4 data but is not currently consumed by the UX Universal player because there is no transcript channel for it yet.

The `narrative` placement question has been resolved; see §14.6.

---

## 6. UX Universal Extensions

POC V4 uses `additionalProperties: false` throughout its schema. That means a UX Universal-specific field cannot simply be added to a V4 document: the document becomes invalid.

UX Universal therefore has an explicit extension mechanism in `js/scenario-v4.js`.

The validator supports three operations:

```text
V4.validate(doc)
```

Allows registered extensions but reports them as warnings.

```text
V4.validate(doc, {strict:true})
```

Treats extensions as errors, matching the behavior of the POC V4 loader.

```text
V4.stripExtensions(doc)
```

Produces a loadable V4 document, along with a record of what was removed and what behavior that removal costs.

### `practice.answer_shape`

The main proposed extension is:

```text
practice.answer_shape = "determinate" | "open"
```

This answers a question that UX Universal currently answers with:

* `hasRightAnswer`; and
* `throughLine`.

The distinction matters because some practices require the learner to reach a particular answer, while others intentionally ask for judgment or reflection.

V4 currently has no equivalent field.

`debrief.key_points` cannot provide this signal because every debrief is required to have key points.

The nearest existing V4 representation is `levels.strong.look_for`, but that is useful to a human reader rather than a reliable machine-readable declaration.

The proposal is therefore to make answer shape an explicit extension and eventually a V4-supported field.

### Safety flags

UX Universal also needs three flags that V4 currently does not represent:

```text
elevated_stakes
involves_minors
threat_content
```

These flags control safety behavior in the UX Universal runtime.

Without them, a stripped V4 document cannot activate the corresponding safety floors.

---

## 7. Capabilities That V4 Does Not Currently Represent

Some UX Universal capabilities do not have a direct V4 equivalent.

| UX Universal capability                           | V4 status                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `intro` — cold-open audio/video context           | No direct equivalent. V4 uses `narrative` plus `landing_cta_label`.                                               |
| **Teach-back / retrieval**                        | No dedicated V4 mode. The only coverage-crediting mechanic is tied to `observe_react` and its required `exhibit`. |
| `transitions[].onTier` branching                  | V4 advancement is forward-only and server-owned; tiers do not route progression.                                  |
| Safety flags                                      | No V4 fields for `elevatedStakes`, `involvesMinors`, or `threatContent`.                                          |
| `playbook[].source` internal IDs                  | V4 `source_references` is intended for external authorities such as OSHA or Title VII.                            |
| `course`, `learnerName`, `characterName`, `state` | These are catalog/session metadata rather than scenario content. `state` is replaced by V4's `carryover`.         |

These capabilities currently exist only in the archived `2026-08-17` implementation.

---

## 8. Migration Results

The migration tooling converts the existing UX Universal scenario types into V4 documents.

The converter intentionally does not fabricate missing instructional content.

### Initial authoring gap

The first conversion produced approximately:

**177 blocking validation errors.**

After recovering information that could legitimately be sourced from existing UX Universal prose, this fell to:

**131 blocking errors.**

The recovery included:

* splitting `look_for` from guidance where the source clearly supported it;
* setting debrief labels to the decks' existing “Coach Debrief” language;
* recovering turn budgets from the existing implementation.

The current implementation then applies the agreed mechanical defaults, reducing the remaining blocking fields to:

**64.**

These 64 are the actual authoring/alignment work still to be resolved.

---

## 9. What Remains to Be Authored

The largest blocking-field categories, as measured during the ports (before the mechanical defaults were applied):

* `phase.purpose` — 18
* `practice.purpose` — 18
* `debrief.transition` — 18
* `practice.transition` — 9
* `closing.summary` — 6
* `characters[].role` — 5
* `interaction.setting` — 8

The transition-label portion of that list is now covered by the mechanical defaults; the rest remains open.

There are also unresolved instances of:

* `look_for`;
* `final_word`;
* `misconceptions`;
* teaching points that need to be regrouped by subject;
* roleplay settings; and
* observe rubrics and `spot_target`.

The largest single gap is the observe rubric.

Only scene-sweep currently has an authoritative source for the required rubric entries and `spot_target` values.

A recurring issue is that most existing UX Universal beats have **two quality tiers**, while V4 requires **three**.

The V4 ports therefore currently synthesize the missing middle tier. Whether that should remain the format requirement is an open alignment question.

---

## 10. Implementation Completed

The five implementation stages are complete.

| File                                | Purpose                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `js/scenario-v4.js`                 | V4 schema, validator, cross-field rules, linting, extension registry, and extension folding/stripping. |
| `js/scenario-v4-runtime.js`         | Single V4 compiler that converts V4 into the runtime shape consumed by the existing player.            |
| `js/scenario-v4-templates.js`       | Seven starting templates representing the existing authoring shapes.                                   |
| `js/scenario-types/v4-universal.js` | V4 Studio editor and development handoff/export support.                                               |
| `port-to-v4.js` (scratchpad)        | Migration tool for converting existing scenario types to V4.                                           |
| `roundtrip.js` (scratchpad)         | Compares behavior between the current implementation and the V4 path.                                  |
| `check-assets.js` (scratchpad)      | Verifies asset references across the scenario trees.                                                   |

The old per-type `toRuntime` / `toMixArc` conversion paths are replaced by the single V4 compiler.

The three scratchpad tools live in the working session's scratchpad rather than the repository.

---

## 11. Verification

### V4 validation

All 11 existing POC V4 scenarios validate successfully:

* zero warnings;
* zero validation errors;
* 46/46 negative tests fail at the expected JSON path.

One caveat when treating those 11 scenarios as authoring precedent: `GENERATED-DEMOS.md` marks 5 of the 11 as generated demos rather than SME-approved content. They exercise the spec, but they are weaker evidence for authoring norms.

### Round-trip comparison

The migration comparison currently reports:

**263 of 338 field comparisons identical.**

The differences are understood and intentional:

* 14 differences from the V4 three-tier vocabulary;
* 10 `reactionGuidance` values folded into `response`;
* 4 `framing` differences;
* 23 additive fields;
* 11 placement-only differences.

The opener text is identical for 13 of 14 phases; the remaining difference is a structural placement change rather than a content change.

### Recovered semantics

`throughLine` is reduced from 14 occurrences to one by matching a `teaching_points` topic to the phase label.

`hasRightAnswer` is no longer guessed from the exit requirement. It is represented by the explicit `answer_shape` extension.

---

## 12. Asset Verification

Asset resolution is identical across the live tree and the archive snapshots from:

* 2026-08-04
* 2026-08-17

There is one pre-existing missing asset:

```text
hazmat_scene_3.mp4
```

Referenced from:

```text
hazmat-scene-practice.html:1260
```

This is not a V4 migration regression.

---

## 13. Reproducing the Checks

Validate a V4 document:

```bash
node js/scenario-v4.js <file.lo.json>
```

The remaining tools run from the session scratchpad.

Port all existing scenario types:

```bash
node port-to-v4.js all v4-out
```

Compare behavior against the current implementation:

```bash
node roundtrip.js
```

Check asset resolution:

```bash
node check-assets.js
```

One implementation gotcha is worth documenting: a relative path inside a `.js` file is resolved relative to the loading document, not the script's own directory. This previously created 38 false breakages.

Archive snapshots are also two levels deeper than the live tree, so their relative paths require two additional `../` segments.

---

## 14. Alignment Questions

The following are the remaining issues that need a decision. They are ordered roughly by impact.

The detailed evidence is captured in:

```text
scenario-simulator-dev-conversation-guide.html
```

The extension-specific proposal is in:

```text
scenario-simulator-extensions-proposal.html
```

Those documents contain the per-question proposal, evidence, counterpoints, and fallback. This section summarizes the actual decisions still needed.

---

### 14.1 Required fields with no authoritative source

The final WPV deck was searched for every field that the V4 port requires.

The results included:

* `purpose`: 0 occurrences
* “final word”: 0 occurrences
* `misconception`: 0 occurrences
* `rubric`: 0 occurrences
* “debrief”: 32 occurrences
* “look for”: 12 occurrences

The POC authoring work shows that some of these fields were subsequently invented during the ports.

Examples recorded in `sme-punch-list.md` include:

* `final_word` lines that are required by the spec but have no deck antecedent;
* character behavior cards with no corresponding source material;
* teaching points with no counterpart in the source deck.

This is important because the problem is not simply “the decks need more authoring.”

The V4 spec and engine themselves appear to disagree about some required fields.

The strongest example is `phase.purpose`.

The spec describes a prompt consumer for `phase.purpose`, but the audit found that it is never actually rendered into a prompt.

There are **36 `purpose` slots among the current 64 blocking fields**.

#### Proposed direction

Fields that the engine requires but the SME did not author should not automatically become SME authoring work.

In particular:

* `purpose` should either become optional or acquire the consumer described by the spec;
* mechanical transition button labels can be defaulted;
* `final_word` should not be silently invented if it is intended to contain teaching content.

---

### 14.2 Three major capability differences

#### Clarifying questions

UX Universal currently treats a clarification/redirect as free.

V4 counts it as another turn.

This changes the cost of interaction and therefore needs a product decision rather than a silent implementation choice.

#### Safety floors

UX Universal has safety floors for:

* crisis scenarios;
* threat/violence branching; and
* scenarios involving minors.

These are activated by the safety flags described in §6.

V4 currently has no representation for those flags.

This matters for scenarios involving harassment, workplace violence, bullying, and minors.

#### Watch-and-discuss

This issue was previously considered an alignment gap but was **withdrawn on 2026-08-17**.

V4's `coachInteraction.media` supports video and explicitly describes the interaction as ungraded. That is sufficient to represent watch-and-discuss.

The remaining discrepancy is only in the specification wording: the prose refers to a reference **image**, while the schema permits video.

---

### 14.3 `practice.answer_shape`

The extension is already implemented in UX Universal.

The remaining question is whether it should become part of V4 itself.

The field is needed because UX Universal must distinguish between:

* a practice where the coach is expected to land on a particular answer; and
* a practice where multiple reasonable judgments are acceptable.

The current V4 structure does not express that distinction reliably.

---

### 14.4 Retry and mastery loops

The POC punch list records an authoring expectation that learners can trigger another scene progression to retry.

The current engine is forward-only.

This is therefore a genuine behavioral difference between authored intent and engine behavior.

The open question is whether a bounded retry/mastery loop belongs on the roadmap for either system.

---

### 14.5 Where teaching belongs

V4 groups `teaching_points` at the content level, organized by subject.

UX Universal currently associates teaching directly with the step where it is delivered.

This difference forced the V4 runtime compiler to match teaching topics back to phases.

That matching is fragile: if teaching points are regrouped by subject, the runtime can silently fail to associate a point with its intended phase.

Two possible solutions are:

1. add an explicit per-phase link to the relevant teaching point; or
2. use `debrief.key_points` as the per-step teaching carrier.

The second option is closer to the existing V4 structure.

---

### 14.6 Narrative placement — resolved

This issue is closed.

V4 uses a single `narrative` as both coach ground truth and learner-facing scenario context.

UX Universal previously inserted `framing` into the middle of the compiled prompt.

Simply placing V4 `narrative` into that slot produced malformed prompts such as:

```text
You facilitate You saw it happen.
```

The compiler now leaves `framing` empty and renders `narrative` as a labeled situation block, matching the V4 coach template.

This was verified with `prompt-diff.js`.

---

### 14.7 Button labels

The 11 V4 scenarios contain:

* 63 total transition/button labels;
* 27 distinct labels.

The two main transition slots behave very differently.

| Slot                | Authored | Distinct | Interpretation                                                                               |
| ------------------- | -------: | -------: | -------------------------------------------------------------------------------------------- |
| Practice → debrief  |       29 |        7 | Mostly “Talk it through”; the button performs the same action.                               |
| Debrief → next step |       29 |       17 | Labels such as “Sit down with Bianca” or “Find Marco”; the text describes what happens next. |
| Opening             |        5 |        4 | Too small a sample to establish a strong convention.                                         |

The practice-to-debrief button is therefore mostly stylistic drift rather than meaningful content.

A house convention would remove that variation.

The debrief-to-next-step label is different: those labels communicate the next action and therefore appear intentionally authored.

There is also a collision where `"Begin practicing"` is used both as an opening label and a debrief transition.

---

### 14.8 Generalizing typed interaction outputs

UX Universal already has a useful architectural pattern for custom interactions.

A custom interaction:

1. registers a surface plugin;
2. owns the interaction;
3. produces typed outputs; and
4. hands those outputs back to the engine through a common seam.

Scene-sweep demonstrates this with two different surfaces:

* the V1 photo canvas; and
* the V2 text observation log.

Both use the same scenario/output contract and can be swapped by URL flag.

Teach-back followed the same general `ownsInput` pattern.

V4 has a similar concept with its `[[spotted:...]]` contract. The engine strips the marker, validates the referenced IDs, and uses the resulting values for scoring and coverage.

The limitation is that V4 currently ties this mechanism specifically to `observe_react`.

That makes teach-back difficult to represent because its interaction contract is not an `observe_react` exhibit.

#### Proposed direction

Define a **mode-independent credited-items output contract**, paired with a pluggable interaction surface.

That would allow new interaction types to be added without tying their scoring/output semantics to a particular practice mode.

---

## 15. Extension Strategy

POC V4 currently has no formal extension mechanism.

The schema uses strict `additionalProperties: false`, and the spec explicitly treats fields outside the format as load errors.

That makes it difficult to evolve the format incrementally because every new extension must effectively be standardized and implemented before documents containing it can be loaded.

Two proposals are intentionally being kept separate.

### Proposal 1: Extension envelopes

Add an `extensions` object to `content` and `practice`.

Extensions would use namespaced keys such as:

```text
vector:answer_shape
```

The rule would be:

> An engine must load a document containing an extension it does not understand and must ignore that extension.

This preserves normal typo detection. A typo such as `final_wrod` would still fail validation because it is not inside the extension namespace.

The UX Universal implementation already has the machinery to produce this shape through:

```text
ScenarioV4.foldExtensions()
```

The development handoff can export a proposed V4 document using the folded form.

### Proposal 2: Behavioral contracts

The `EXTENSIONS` registry would document:

* why each extension exists;
* what behavior is lost if it is ignored; and
* which implementation/tests define its behavior.

For example:

```text
elevated_stakes
    → activates the crisis/safety floor

answer_shape
    → controls whether the coach should hedge or land on a definitive answer
```

This lets adoption happen independently for each extension.

A field can therefore be introduced into documents before every consumer has implemented it, while still making its intended behavior explicit.

### Current approach

Until the extension envelope proposal is adopted, the development handoff exports both:

* **strip** — a document that loads in today's V4 implementation, with explicit information about what was lost;
* **fold** — the proposed namespaced extension representation.

Internal authoring remains flat. Folding is an export projection.

---

## 16. Smaller Alignment Issues

Several lower-priority questions remain.

### Third quality tier

Most UX Universal beats currently author two tiers, while V4 requires three.

The current ports synthesize the missing tier.

One option is to allow a partial scale, similar to the way the opening's `levels` structure already works.

Otherwise every author will have to invent a middle tier even when the source material only defines two meaningful levels.

### `help_turns`

The V4 loader defaults `help_turns` to 2.

The POC audit set this to 0 everywhere because the decks do not explicitly contemplate help turns.

This should be confirmed as an intentional product default rather than a value inferred from the decks.

### `spot_target`

The POC engine currently does not implement the gating behavior implied by `spot_target`.

UX Universal's observe surfaces do gate progression based on coverage.

The intended behavior should be confirmed before either implementation is treated as authoritative.

### Teach-back turn cap

V4 derives the maximum turn count by summing practice budgets.

Teach-back currently uses a value of 99 for `maxTurns`, which produces an effectively uncapped retrieval loop.

The resulting derived cap is therefore nonsensical.

This is another symptom of teach-back having no dedicated V4 mode.

---

## 17. Independent Convergence

One of the strongest arguments for the V4 alignment is that the two systems independently arrived at nearly the same scenario structures.

The converter's output was compared with independent POC V4 ports of the same decks, without the teams coordinating the mappings beforehand.

| UX Universal type | Mode sequence | POC V4 counterpart | Result                |
| ----------------- | ------------- | ------------------ | --------------------- |
| ensemble-arc      | `RRRC`        | bullying `RRRC`    | Identical             |
| scene-sweep       | `OC`          | hazcom `OC`        | Identical             |
| guided-arc        | `CCR`         | marshall `CCR`     | Identical             |
| branching-arc     | `CRRR`        | WPV `CRCR`         | Near                  |
| mix-arc           | `COR`         | —                  | No direct counterpart |

This suggests that the V4 phase/mode model is a good underlying representation for the existing scenario families.

The remaining problems are primarily around missing metadata, extensions, and a handful of behavioral differences—not a fundamental mismatch in the scenario model.

---

## 18. Loader Architecture

Both systems independently use the same general architectural pattern:

**authored format → loader normalization → internal runtime representation**

POC V4's `lo_v4.py` normalizes V4 into the internal representation used by its V3 builder. `load_lo_file` dispatches based on `schema_version` and supports the 2.2, 3.0, and 4.x formats.

UX Universal's `scenario-v4-runtime.js` similarly compiles V4 into the runtime shape already consumed by `sim-player.js`.

This is an important architectural precedent.

It means the authored format does not need to become the runtime representation.

The V4 compiler can remain the compatibility boundary between content and the existing player.

---

## 19. Remaining UX Universal Decisions

Three questions remain specifically on the UX Universal side.

### 1. What happens to `branching-arc`?

`branching-arc` is currently live-only and was removed from the Studio registry in July.

Question:

**Should it return as a Studio template, or remain live-only?**

### 2. What happens to teach-back?

Teach-back cannot currently be expressed naturally in V4.

There are two likely directions:

* keep it as a UX Universal-specific local type; or
* propose a fourth V4 mode through the generalized interaction/output model described above.

### 3. What happens to `hazmat_scene_3.mp4`?

The asset is already missing in the existing implementation.

Decision:

* restore the missing video; or
* remove the reference.

---

## 20. Recommended Next Steps

The implementation work is substantially complete. The next phase should focus on decisions rather than further infrastructure.

### Priority 1 — Resolve §14.1

Determine which required V4 fields represent genuine authoring requirements and which are artifacts of the spec/engine mismatch.

In particular:

* `purpose`;
* transition labels; and
* `final_word`.

This is the main blocker to reducing the 64 remaining fields.

### Priority 2 — Decide the extension model

Resolve whether V4 should support a namespaced extension envelope.

If adopted, formalize `answer_shape` and the safety flags as the first extensions.

### Priority 3 — Resolve behavioral differences

Make explicit product decisions about:

* clarification-question cost;
* safety floors;
* retry/mastery;
* three-tier assessment;
* help turns; and
* `spot_target` behavior.

### Priority 4 — Decide the future of teach-back

This is the largest remaining mismatch between the two models.

The cleanest long-term architecture is likely a generalized interaction/output contract rather than continuing to special-case teach-back.

### Priority 5 — Complete authoring

Once §14.1 is settled, finish the remaining 64 fields and re-run (from the session scratchpad):

```bash
node roundtrip.js
node check-assets.js
node prompt-diff.js
```

### Priority 6 — Flip V4 to the default source

Once the alignment decisions are resolved and the authoring gaps are closed, make V4 the default authored source rather than requiring:

```text
?type=v4-universal
```

The existing universal player can remain the runtime target behind the V4 compiler.

---

## 21. Bottom Line

The V4 retrofit is no longer an experimental conversion path. The core architecture is built and verified.

The current model is:

```text
Writer Studio
     ↓
Scenario CML V4
     ↓
V4 runtime compiler
     ↓
existing universal player
```

The existing scenario types survive as **recipes, not as fields on the dish** — authoring templates rather than competing content formats.

The migration has demonstrated that V4 can represent the existing scenario families with very little behavioral loss, and independent ports have converged on essentially the same phase/mode structures.

The remaining work is therefore not “make V4 work.”

It is to decide **what V4 should require, what UX Universal-specific behavior belongs in extensions, and which genuine product behaviors should be standardized rather than silently preserved from the old implementation.**

Once those decisions are made, the remaining authoring work is finite and the system is in a position to make V4 the default authored source.
