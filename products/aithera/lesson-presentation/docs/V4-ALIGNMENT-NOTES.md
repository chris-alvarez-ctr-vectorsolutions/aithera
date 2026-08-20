# Scenario CML v4 Alignment

## Purpose

This document is the shared record of the alignment between **POC V4 (Scenario CML v4)** and **UX Universal**. It is written for both teams — the team building the V4 format and engine, and the team building the UX prototypes — and its job is to make the remaining decisions easy to see and act on.

The work it describes makes POC V4 the authored source of truth for UX Universal. Previously, each UX Universal scenario type carried its own internal shape and conversion logic. The retrofit replaces those per-type shapes with the POC V4 format while keeping the existing player.

**Who owns which decision** is the first thing to establish, and it has its own section immediately below — the POC V4 team's decisions are called out separately from ours, so a reader can find their own calls without reading past ours.

This document records:

* what has been decided;
* what has already been built and verified;
* where UX Universal and POC V4 still differ;
* what remains to be authored or aligned; and
* which product and format questions are still open.

**Status (2026-08-18):** The retrofit is implemented and verified. In concrete terms:

* V4 documents play through the existing UX Universal player (`scenario-live.html?type=v4-universal`);
* the Editor authors V4 directly; and
* all seven starting templates boot in the browser.

The remaining work is decisions and authoring, not infrastructure:

1. resolving the alignment questions in §9;
2. completing the remaining 61 authoring fields; and
3. deciding whether to make V4 the default authored source, which is gated on §9.1.

The current state has been reconciled against the `scenario-simulator-poc` repository, including `spec-alignment-audit.md`, `v4-migration-report.md`, and `sme-punch-list.md`.

Implementation and verification detail — what was built, the test results, and how to reproduce the checks — is collected in the appendix (§17).

**Last updated:** 2026-08-18

---

## 1. Terminology

| Term             | Meaning                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **POC V4**       | Scenario CML v4, the content format and engine in `VectorLearning/scenario-simulator-poc`. This is the format UX Universal is aligning to. |
| **UX Universal** | The UX prototyping stack: the Editor, `js/sim-player.js`, the scenario types, and `scenario-live.html`.                                    |
| **Editor**       | The UX Universal authoring tool (`writer-studio-v2.html`). Called “Editor” throughout to avoid confusion with Learning Studio, a separate product. |
| **Extension**    | A schema field added to a V4 document that the V4 format does not define (§6, §10). A data concept.                                        |
| **Surface**      | A pluggable interaction module in the UX Universal player (§9.8). A player concept. Surfaces are not extensions, and neither requires the other. |

The recommendations in this document are based on the resulting behavior and consequences, rather than on which system originally implemented a behavior.

---

## Meeting Outcomes — 2026-08-18

The alignment meeting happened. Eight items were decided; this section is the authoritative record and **supersedes the open-question framing in the sections below** wherever the two disagree. *Who Decides What* still routes ownership; this says what the owners said.

Read it for the consequences, not just the verdicts — five of the eight change something on our side, and two of them mean our shipped player now diverges from an agreed decision.

| Item | Outcome | What it costs or changes here |
| --- | --- | --- |
| Safety flags (ask 01) | **Declined for V1.** A generic "trauma-informed response" block instead of three per-scenario booleans. | Tripwire is *broadened* — every scenario gets it, not just flagged ones. **The portrayal layer is the accepted gap.** |
| `answer_shape` (ask 02) | **Deferred, not declined.** `ideal_response` is the proxy today; K&A want the option; evaluate the current state first. | Action is ours: test whether the proxy actually holds. Our extension stays internal meanwhile. |
| Required fields (ask 03) | **Partly resolved — and our premise was wrong.** `phase.purpose` IS used; one spec location isn't; `practice.purpose` is used today. Dev is updating the spec. | Stop claiming "never rendered." `final_word`, `misconception`, `help_turns`, `spot_target` got **no answer** and stay open. |
| Turn cost (ask 04) | **Granted for the case we asked about** — a clarifying question ideally does not cost a turn — **plus two new requirements.** | We already do the ideal for clarifying. Gibberish and apathy must now COUNT, and we give both a free redirect. See below. |
| Pluggable surfaces | **Deferred — revisit later.** Reason given: avoid overloading prompts or over-fitting to unknown future types. | Park item, now with a real decision behind it. |
| Prior-LO context | **Yes — for the LLM only, never learner-facing.** No media cold-open. | Built in authoring and two native types. **The v4 route strips it.** New gap — see below. |
| Flexible 1–9 tiers | **Declined as open-ended, but the neutral tier becomes OPTIONAL.** Dev updating spec; the other two stay required. | This is the ask we withdrew, granted anyway. Our validator requires all three. |
| Retry / rewind | **Do not include.** Whole-scenario restart is sufficient; revisit later. | **We ship it, uncapped.** Now an intentional divergence or a thing to gate. |

### The three that need work on our side

**1. Our turn-cost behavior now disagrees with an agreed decision.** `SimCore.nonAnswerPolicy` distinguishes three non-answers and makes *all* of them free (`action: "redirect"`, never counted). The decision splits them:

* *Clarifying question* — free. **We match, and we match the preferred reading**, not the "acceptable in v1" fallback.
* *Gibberish / trolling* — must count as a turn. **We give it a free redirect.** Direct conflict.
* *Apathy / refusal* — must count as a turn, then probe and redirect with whatever turns remain; if none remain, address it in coach feedback and try to re-engage in the next phase. Our case 2 is explicitly scoped to "STUCK, NOT REFUSING" and gives the first instance a free nudge, so **active refusal is not cleanly handled at all**, and the feedback-carry plus next-phase re-engagement does not exist.

The carry is buildable on existing machinery (`transitions[].set` already moves learner-dependent state across phases), but nothing populates it for disengagement today.

**2. The one thing they said yes to is the one thing the go-forward format cannot carry.** Prior-LO context is approved for the model. It exists in the studio (`contextSource: 'previous-lo'` plus `previousLO {title, covered, handoff}`) and compiles into the prompt on `observe-react` and `teach-back`. But `v4-universal` lists both keys in `SHELL_KEYS` and **strips them before validation and export**, because V4 has no field for them — so on the path we are steering all new authoring toward, approved context silently does not reach the model. Needs a home in the format, which is awkward timing: the envelope mechanism that would have carried it was just declined for the safety flags.

**3. Optional neutral is a validator change.** `scenario-v4.js` requires all three tiers when the block is present (`required: LEVELS`, the "all three tiers required" rule). Making neutral optional is a small, contained edit — and it retires the §11 "third quality tier — withdrawn" entry, since the thing we talked ourselves out of asking for was granted unprompted. Worth recording *why* that matters: our withdrawal rested on a deck-level tier count that never tested the beat-level claim, so the five two-pole practices were not simply a porting artifact after all.

### On the safety-flag decision, stated fairly

The generic block is a defensible V1 call and in one respect strictly better than what we asked for: a floor that arms on *every* scenario cannot be forgotten by an author who leaves a flag off. What it does not replace is the always-on portrayal layer, which is most of what our flags do and does not depend on any learner disclosing anything — `MINOR_SECTION` is six provisions and only the sixth is a tripwire; the other five constrain how minors are depicted on every turn (age-appropriate and never sexualized, a child who caused harm modeled as recoverable, the target never voiced and never placed with the bully, no invented abuse beyond canon).

One routing detail is worth keeping visible regardless of V1 scope: our minors tripwire points to mandated reporting plus 911, not 988. A generic trauma-informed block that routes everything to a crisis line handles adult self-harm disclosure correctly and a child-safety disclosure incorrectly — different obligation, different destination.

Our player keeps its flag-driven floors, so this is now a **documented intentional divergence** rather than a gap to close.

---

## Who Decides What

The alignment work produced two very different kinds of open item, and reading them as one list is what makes this document hard to act on.

**Ours alone.** How UX Universal authors, compiles and plays a scenario — the decisions in §4 and the three questions in §14. They are recorded here so the POC V4 team can see what we did and why. Nothing in §4 is an ask; none of it needs their sign-off.

**Theirs.** Changes to the Scenario CML v4 format or to the POC V4 engine. Every one is an ask, and each carries its evidence, its likely counterpoint and a fallback in the conversation guide. **This is the list to bring to the meeting.**

**Jointly owned.** Learner-experience behavior that would be wrong to settle differently in the two players, or content policy that binds both authoring paths.

### Asks on POC V4 — the format or the engine

**Status as of the 2026-08-18 meeting is in the last column.** Seven of these nine were answered; the two `§11` defaults were not raised. Full consequences: *Meeting Outcomes*, above.

| Owner | Item | Where | The ask, in one line | Status |
| --- | --- | --- | --- | --- |
| POC V4 | Extension envelopes | §10 | Allow one `extensions` key on `content` and on each `practice` — namespaced, must-ignore. One allowlisted key is the whole change. | **Declined for V1** — generic block instead |
| POC V4 | Safety flags | §6, §9.2 | With no way to declare crisis / threat / minors content, a handed-over document loses its safety floor and leaves no trace one existed. | **Declined for V1** — generic trauma-informed block |
| POC V4 | `practice.answer_shape` | §9.3 | A machine-readable graded-vs-open marker. `levels.strong.look_for` carries it to a human reader, not to a parser. | **Deferred** — test the `ideal_response` proxy first |
| POC V4 | `phase.purpose` as a required field | §9.1 | The other three `purpose` fields render into the coach's arc map; `phase.purpose` is required, carried by the loader, and never rendered. Make it optional, or render it. | **Resolved against us** — it IS used; dev updating spec |
| POC V4 | `help_turns` default | §11 | The loader defaults it to 2, which arms the mid-scene help affordance for any scenario that omits the field. Confirm, or default it off. | Not raised — still open |
| POC V4 | `spot_target` gating | §11 | The spec says the target gates completion; the shipped engine does not gate on it. Confirm which is the contract. | Not raised — still open |
| POC V4 | Clarifying-question cost | §9.2 | Adopt the redirect rebate so a clarifying turn does not spend practice budget. Engine behavior on their side; reference implementation on ours. | **Granted** — clarify free; refusal/gibberish cost |
| POC V4 | Generalized credited-items output | §9.8 | Lift the `[[spotted:]]` contract off `observe_react` so a new interaction is one mode plus one surface rather than engine surgery. Its own session. | **Deferred** — revisit later |
| POC V4 | Spec-versus-build divergences | spine §E | Five places the v4 specification and the shipped v4 engine disagree. Ours to report, theirs to reconcile. | Reported; theirs to reconcile |

### Ours — no POC V4 input needed

Listed for transparency, not for discussion.

| Owner | Item | Where |
| --- | --- | --- |
| UX Universal | D1–D8 — the authored format, the runtime strategy, adopting the fixed scale, the conversion policy, templates, mechanical defaults | §4 |
| UX Universal | The three shipped engine changes — debrief rung, prompt scoping, carryover consumption | §5 |
| UX Universal | Where `narrative` renders in the compiled prompt | §9.6 |
| UX Universal | Whether `branching-arc` returns as an Editor template | §14 |
| UX Universal | Whether teach-back stays a local type | §14 |
| UX Universal | The missing `hazmat_scene_3.mp4` reference | §14 |
| UX Universal | Finishing the remaining authoring fields | §8 |
| UX Universal | Compile fidelity — 184 dropped values (fixed 2026-08-18) | *Compile Fidelity* |

### Jointly owned — product or content policy

| Owner | Item | Where | Why it needs both |
| --- | --- | --- | --- |
| Joint | Retry / mastery loops | §9.4 | The decks asked for it; the UX player ships a scene-response retry today; the POC engine is forward-only. A roadmap call, not a format tweak. |
| Joint | House button-label convention | §9.7 | Content policy that binds both authoring paths. |
| Joint | Where teaching attaches — per phase, or grouped by subject | §9.5 | Accepted as-is for now; a per-phase link would change both sides. |
| Joint | Teach-back and the derived turn cap | §11 | Only bites if a retrieval-style mode lands (§9.8). |

### Already closed — recorded so they are not re-raised

| Owner | Item | Resolution |
| --- | --- | --- |
| Closed | Watch-and-discuss | Withdrawn 2026-08-17. `coachInteraction.media` accepts video and is explicitly ungraded; a coach step with a pinned clip *is* watch-and-discuss. |
| Closed | Narrative placement | §9.6 — resolved on the UX Universal side, no proposal needed. |
| Closed | The four data-model divergences | All four closed; what resolved each is in the spine-alignment note, §D. |

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

The Editor therefore keeps its type gallery as a **template picker**.

`derivedTypeLabel` in `scenario-v4-runtime.js` can still describe the resulting scenario in the Editor and player UI, but it does not constrain the document.

This is consistent with the V4 spec's position that a “tutor scenario” is a description, not a declaration.

---

## 3. Why We Are Doing a Full Retrofit

The decision is to make V4 the authored format throughout UX Universal rather than simply adding an export step.

An export-only solution would leave the existing authoring model intact and attempt to manufacture a valid V4 document afterward. That does not work reliably because the converter cannot invent missing instructional content such as rubrics, purposes, or teaching points.

The retrofit therefore moves both sides of the stack:

**Editor → V4 → V4 runtime compiler → existing UX Universal player**

The important part is that the final step does **not** require rewriting the UX Universal player.

---

## 4. Decisions — UX Universal, already taken

**These are UX Universal decisions, made and shipped.** They are recorded so the POC V4 team can see what the prototype does and why; none of them is an ask, and none needs their sign-off. The asks are the POC V4 rows in *Who Decides What* above.

| #  | Concerns                    | Decision                                                                                      | Rationale                                                                                                                                                                                                     |
| -- | --------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 | The authored format         | **Use V4 as the authored source of truth.**                                                   | An export adapter cannot reliably invent missing instructional content. The Editor and the UX Universal player therefore move to V4 together.                                                                  |
| D2 | Which types are authorable  | **Support all authorable scenario shapes, including scene-sweep.**                            | Scene-sweep's hotspots provide a clean source for a V4 `observe_react` rubric.                                                                                                                                |
| D3 | The runtime strategy        | **Compile V4 into the existing runtime shape.**                                               | This keeps `sim-player.js` and the existing modules intact and allows behavior to be compared directly before and after the migration.                                                                          |
| D4 | The assessment scale        | **Normalize all quality scales to three levels: `unthoughtful`, `neutral`, `strong`.**        | This is the assessment model built into V4, and all 11 current V4 scenarios use it. Existing `CONNECTS` / `VAGUE` / `CONFRONTS` vocabulary does not carry over.                                               |
| D5 | Graded vs. open practices   | **Represent answer shape explicitly.**                                                        | `answer_shape` is needed to distinguish practices with a definite answer from practices where judgment is intentionally open. This should not be inferred indirectly.                                            |
| D6 | Conversion policy           | **Do not invent missing prose during conversion.**                                            | If the source does not contain a field, the converter leaves it empty. Validation errors then become the authoring worklist instead of producing documents that look complete but contain fabricated content. |
| D7 | The authoring workflow      | **Keep scenario types as Editor templates.**                                                  | This preserves the existing LXD workflow without making scenario type part of the V4 format.                                                                                                                  |
| D8 | Required-field defaults     | **Default mechanical fields where V4 requires them and the decks provide no authored value.** | This reduces the authoring burden without inventing teaching content. Teaching prose remains authored. `final_word` remains authored.                                                                         |

The mechanical defaults cover every `transition.button_label` and both `purpose` slots. Measured against the current templates and validator, they take the blocking field count from **128 to 61** — the 67 they fill are 31 button labels and 36 purposes. The 61 that remain are real authoring work; §9.1 asks whether some of them should be required at all.

---

## 5. Deferred Engine Changes — All Three Now Shipped

Three interrelated engine changes were deliberately kept out of the initial
retrofit, and all three have since shipped. This section records what each one
was, why it waited, and what it now does — the sequencing mattered, and the
reasons a change waited are worth keeping alongside the change itself.

**Why they waited (and which reason has expired).** The original reason was
verifiability: the compiler's job was to produce the SAME runtime from V4 input,
so every behavior difference could be attributed to a bug or a documented choice
(the round-trip baseline, §17). Deliberate behavior changes bundled into that
migration would have poisoned the attribution. That reason is retired — the
retrofit is committed and baselined. What still stands is that these are RUNNER
changes with learner-visible consequences, and they are interdependent.

### Debrief ownership — SHIPPED (05150b5, confirmed 2026-08-17)

The debrief is now its own rung on the V4 route, with native types untouched —
and the implementation needed **zero runner edits**, landing smaller than the
sizing estimate predicted (no zero-turn machinery was required):

* An **interactive** debrief (`follow_up_turns >= 1`) becomes a real coach rung
  with the derived id `{phase_id}.debrief`: cap = `follow_up_turns`, the locked
  `probe` delivered verbatim as the entry (immediately after the practice rung's
  closing feedback, matching V4's ordering), `probe.levels` grading the answers,
  `requirement` as the early exit, and `final_word` opening the rung's own close.
* A **delivery-only** debrief (`follow_up_turns: 0` — 19 of the 29 in the V4
  content) emits no rung: the practice rung's fused close-teach already is that
  debrief, and its `final_word` is now delivered verbatim as the following
  rung's locked entry bridge (terminal phases ride the close-teach opener).
* Ladder assembly also fixed the `entry.cta` off-by-one the conversion had
  flagged: a practice rung's button is the previous debrief's transition label;
  a debrief rung's button is its own practice's transition label.

Verified on the V4 content: marshall expands to 6 rungs (interactive caps
1/2/2), wpv stays 4 rungs with final words as bridges, floor-lead's and kendra's
probes ride their debrief rungs verbatim; live boot confirmed in the player.

**Found and fixed during verification:** mix-arc's compile never consumed
`elevatedStakes` (its own Kendra example promises a 988 floor it never
delivered), and the minor floor existed only in ensemble-arc — so on the V4
route two of the three safety flags armed nothing. `v4-universal.compile` now
appends the floors from canonical text (guided-arc's LEARNER SAFETY wording +
`CRISIS_FLOOR` verbatim; ensemble's `MINOR_SECTION.text()` verbatim). A
methodological note worth keeping: the earlier floor check had passed on
authored prose that coincidentally contained the word "crisis" — safety
assertions are verified by reading the compiled prompt, not by keyword match.

### Prompt scoping — SHIPPED (f49cf79, 2026-08-17)

Originally deferred pending the alignment conversation. That reasoning was
retired once the prototype was confirmed as the **preview environment for
Editor output**: without scoping, an author signs off content against a coach
that structurally knows more than the production engine's ever will, so every
preview-based sign-off carried a fidelity gap.

Implemented as **redaction-recompile** (`js/scenario-v4-scopes.js`): each scope's
prompt is the same shipped builder run over a redacted copy of the document, so
the engine's JSON-turn contract is identical in every scope by construction.

| Scope | Sees |
| --- | --- |
| coach / practice | the arc, not the answers — `teaching_points`, `misconceptions`, `key_points`, probes and the closing answer all absent |
| coach / debrief | everything, plus a serialized teaching-points and misconceptions block |
| scene / *rung* | one phase plus `scene_world` — no narrative, no opening, no teaching, no other phases |

Verified across all 11 V4 scenarios × every phase: teaching and playbook absent
from every practice and scene scope, released at debrief. Compiled sizes on the
Marshall arc: scene 11.3k < practice 18.8k < debrief 20k characters.

Three deltas from full V4 fidelity are recorded in the module header: the
closing answer stays in the debrief scope (our close is model-written there,
where V4 composes it server-side); a delivery-only carryover slice includes its
fused close-teach; context addenda reach coach scopes only.

### Carryover — SHIPPED with scoping (f49cf79)

Carryover consumption was never a separable change. In a single-conversation
player it is a no-op — the model already sees every earlier turn, so carryover
is trivially over-satisfied. It became meaningful only once scopes existed for
it to punch through.

Now: a scene turn's history is its own rung slice plus the **verbatim** slices
of the phases its `carryover` grants (V4 §7.2.5 — "never a summary"); coach
turns keep the full brief. Slice boundaries are recorded through a guarded
`onRungEnter` hook in `sim-player.applyDeliver`, inert on every native route.

The `narrative` placement question has been resolved; see §9.6.

---

## 6. UX Universal Extensions

UX Universal needs a small number of fields that the V4 format does not define: an answer-shape marker and three content safety flags. This section explains how those fields are handled so that authored documents stay compatible with the V4 engine. Whether V4 should adopt the fields themselves is queued as alignment questions — §9.2 for the safety floors, §9.3 for answer shape — and the general mechanism question is §10.

“Extension” here always means a schema field. The player's pluggable interaction modules are a separate concept — surfaces — covered in §9.8.

Because V4 uses `additionalProperties: false` throughout its schema, an unrecognized field invalidates the whole document. The extra fields are therefore registered as **declared extensions** in `js/scenario-v4.js`, and the tooling keeps their status explicit:

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

The practical consequence: internally authored documents carry the extension fields, and the development handoff produces a V4-compliant document by stripping them — with an explicit record of which behavior is lost. Nothing UX-specific reaches a handoff unannounced.

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

**On quantifying the failed inference — don't.** The converter did once guess `hasRightAnswer` from the exit requirement, and that guess was replaced by the explicit field (§17, *Recovered semantics*). There is **no measurement of how often the guess was wrong**, so no hit-rate should be quoted for it. A "wrong on 13 of 14 beats" figure reached the talking points page and was removed on 2026-08-18: the only 13-of-14 in this document is the round-trip finding that *opener text is identical for 13 of 14 phases* (§17), an unrelated comparison. The qualitative argument needs no number — an `exit.requirement` states what the learner must do, not whether a conclusion is correct.

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

Some UX Universal capabilities have no direct V4 equivalent. They currently run only in the archived `2026-08-17` implementation.

This is an inventory, not a list of asks — none of these appear in *Who Decides What* except the safety flags, which are there on their own evidence. Each entry says what is actually exercised today, because a capability the schema permits and no scenario uses is not a gap in V4.

**Cold-open context (`intro`).**
A narrated audio or video scene that plays before the conversation begins, setting the situation cinematically (`js/scene-context.js`). V4's landing experience is `narrative` text plus a `landing_cta_label`; there is no media cold-open.

**Teach-back (retrieval practice).**
The learner explains the material back in their own words, and the runtime credits them as they cover the required topics. V4 has no mode for this; its only coverage-crediting mechanic is tied to `observe_react` and its required `exhibit`.

**Tier-conditioned transitions (`transitions[].onTier`).**
The quality tier the model reports at a phase close selects a transition record, which writes scenario state and names the next phase. V4 advancement is forward-only and server-owned; tiers never participate in it.

Read the scope carefully before treating this as a gap, because the mechanism is broader than anything authored on it. The schema permits a fork — different tiers naming different `next` phases — but **no shipped scenario forks**: across all five types, 24 of 24 authored tier-transition blocks converge on the same next phase, and the tier varies only the `set` payload. What tiers actually do today is carry learner-dependent *aftermath* forward as state ("hardened — shut down, the grievance curdling" versus "steadied — heard, with limits he accepted"), which is the same job V4 gives `carryover`, by a different mechanism (spine note §D-3, closed).

The provenance matters too, and cuts against raising this at all. Tier routing was built for the workplace-violence POC because that deck asked for it in as many words — "branches on the learner's handling," "a genuinely branching scenario," "the evolution is contingent on the learner, not scripted." **The final version of that deck reversed it**: "branch" and "contingent" appear nowhere in it, and the arc slide now reads "One fixed arc: the situation escalates through every level; the learner's handling shapes the response, not the path." So the authored source retired the requirement before any scenario exercised it. Treat the forking capability as unexercised and unrequested rather than as something V4 is missing.

**Safety flags.**
`elevatedStakes`, `involvesMinors`, and `threatContent` — authored booleans that arm the runtime safety floors described in §6. V4 has no fields for them.

**Internal source citations (`playbook[].source`).**
Playbook entries can cite internal course material (for example, `RVCT-479 P017`). V4's `source_references` is intended for external authorities such as OSHA or Title VII, so internal citations have no home.

**Presentation and session fields.**
`course`, `learnerName`, `characterName`, and `state`. In V4, catalog metadata lives outside the scenario document, and `state` is replaced by `carryover`.

---

## Compile Fidelity — Found and Fixed

Every earlier revision of this document described the gap in one direction: things UX Universal needs that V4 cannot express (§6, §7). Running the POC's own eleven scenarios through our V4 compiler on 2026-08-18 showed the other direction — **184 authored values that never reached the model** — and it was ours to fix. It is fixed; this section is the record.

**Read the 184 correctly, because it is a leaf-value count and reads bigger than it is.** It is **three fields**, not a broad sweep, and the table below counts each field's leaves separately: a worked example contributes two values (`learner` + `reply`), as does a disclosure (`fact` + `reveal_when`). So 184 leaf values = **97 authored items** = **3 fields** — 78 worked examples, 9 disclosure facts, 10 emotion hints — and `levels[].example` alone is 156 of the 184. All three framings are true; quoting 184 without the field count invites a recomputation that makes it look inflated. Two further scoping caveats: the measurement spans all eleven scenarios, of which `GENERATED-DEMOS.md` marks five as generated demos rather than SME-approved content (§17), and the SME/demo split of the 184 has **not** been measured. What is unqualified is that all three fields were dropped wherever they were authored.

**What was lost, and why nothing caught it.** The compiler was validated by a round-trip: does a V4 document produce the same runtime our native types produce (§17)? That test is blind by construction to fields V4 has and our native types do not — which is precisely the set that was dropped. They could not appear as a diff, so they appeared as nothing.

| Authored field | Values in the 11 | Before | After |
| --- | ---: | ---: | ---: |
| `levels[].example.learner` | 78 | 0 | 78 |
| `levels[].example.reply` | 78 | 0 | 78 |
| `characters[].canon_facts.fact` | 9 | 0 | 9 |
| `characters[].canon_facts.reveal_when` | 9 | 0 | 9 |
| `roleplay.emotion_hint` | 10 | 0 | 10 |

**The fixes.**

* **Worked examples** — `calibrationFromLevels` now appends each tier's example learner utterance and the reply it should draw, labelled, so an example never reads as more criteria.
* **Earned disclosure** — `canon_facts` *is* our own mechanic: a fact a character holds back plus `reveal_when`, the condition that earns it. We shipped it first as ensemble-arc's `cast[].disclosures[]` and never wired V4's field to it. Now emitted by `disclosuresBlock` in `v4-universal.js`, appended after the builder in the same shape the safety floors use, carrying ensemble-arc's canonical wording so both routes instruct identically. The mix-arc builder has no disclosure concept, which is why this is appended rather than taught to it.
* **Emotional direction** — `emotion_hint` is the character's opening emotional state, not a per-tier reaction, so the existing "direction lives in each tier's `response`" reasoning never covered it. It now populates `reactionGuidance`.

**Verification.** All 184 values reach the compiled prompt across all eleven scenarios. All eleven still validate; all seven of our templates still compile; Marshall still expands to 6 rungs. The change touches only the V4 route — the native per-type routes are untouched.

*One methodological note worth keeping.* The first re-measurement reported 176 of 184 and named eight stragglers. All eight were false negatives from a minimum-length guard in the test itself: values like `"anxious"`, `"grief"` and `"I'll call 911."` fall below it. The test was wrong, not the fix — a reminder that a measurement needs checking before its number is quoted.

---

## 8. The Authoring Gap

The migration tooling converts each existing UX Universal scenario type into a V4 document. Per D6, it does not fabricate missing instructional content, so validation errors are the authoring worklist.

That worklist moved in three steps during the migration: **177** blocking errors on first conversion; **131** after recovering what existing prose could legitimately source (`look_for` split from guidance where the source supported it, debrief labels set to the decks' existing “Coach Debrief” language, turn budgets recovered from the existing implementation); then the D8 mechanical defaults.

Re-measured against the current templates and validator, the live figures are **128 blocking fields raw, 61 after the mechanical defaults**. Those 61 are the actual remaining authoring work. The figures are reproducible — see §17.

What the defaults cover, and what is left:

| Field | Raw | After defaults |
| --- | ---: | ---: |
| `phase.purpose` | 18 | 0 — defaulted |
| `practice.purpose` | 18 | 0 — defaulted |
| `debrief.transition` | 18 | 0 — defaulted |
| `practice.transition` | 9 | 0 — defaulted |
| `opening.transition` | 4 | 0 — defaulted |
| `practice.interaction.setting` | 8 | 8 |
| `closing.ideal_response.summary` | 6 | 6 |
| `characters[].role` | 5 | 5 |
| `interaction.levels.neutral` | 5 | 5 |
| `opening.label` / `purpose` / `exit` | 12 | 12 |
| `look_for` (neutral, unthoughtful, strong) | 9 | 9 |
| `teaching_points` | 4 | 4 |
| `debrief.final_word` | 2 | 2 |
| `coach_persona` | 2 | 2 |
| `practice.exit.when.turns` | 2 | 2 |
| observe `exhibit` / `rubric` / `spot_target` | 3 | 3 |
| `debrief.key_points`, `opening_messages`, `closing.ideal_response` | 3 | 3 |
| **Total** | **128** | **61** |

Note what the defaults do and do not settle. They fill `purpose` on our side with generated stub prose, which unblocks our ports but does not answer whether the field should be required at all — that question is §9.1 and it is POC V4's to decide.

Beyond the counted fields there is unfinished work the validator cannot see: teaching points that need regrouping by subject, and observe rubrics that need an authoritative source.

The largest single gap is the observe rubric. Only scene-sweep currently has an authoritative source for the required rubric entries and `spot_target` values.

This document previously recorded that most UX Universal beats author two quality tiers against V4's required three, and treated the gap as a candidate format change. **Measurement reversed it.** Of the 17 ported practices that carry a `levels` block, 12 already have all three; the 5 that do not are all `unthoughtful` + `strong`, a deliberate two-pole shape. And every source deck authors all three abundantly — bullying 14 / 14 / 16, WPV 8 / 11 / 15, HazCom 6 / 6 / 12 by tier-label count. No LXD source is constrained to two tiers, so the missing middles are a porting artifact and finishing them is UX Universal authoring work (§8), not a V4 requirement to relax.

---

## 9. Alignment Questions

The following are the remaining issues that need a decision. They are ordered roughly by impact, and each heading names the side that owns it — §9.1 through §9.4 and §9.8 are asks on POC V4; §9.5 and §9.7 are joint; §9.6 was ours and is closed.

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

### 9.1 Required fields with no authoritative source — POC V4 decides

> **Outcome, 2026-08-18 — the `purpose` premise was resolved against us.** Dev states `phase.purpose` IS used, with one location in the spec where a `purpose` is not, and `practice.purpose` is used today; they are updating the spec to match the build. So the claim repeated below — sourced from *their* alignment audit (item P5), which called it the only required field with a stated prompt consumer and none — was accurate to that document and is no longer accurate to the engine. Treat the `purpose` line here as history, not as a live finding.
>
> The rest of this section stands: `final_word`, `misconception`, `help_turns` and `spot_target` were **not answered**, and the argument for them is unchanged — a required field no author writes gets carried through the editor and wizard as mandatory and then filled by the model, which is how generated prose reaches a compliance-relevant slot.

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

The V4 spec and engine disagree about one required field — narrower than first recorded here, verified against the engine code at the repo's current tip (2026-08-18).

Three of the four `purpose` fields DO render into the compiled prompt: `serialize_arc_roadmap` (`prompt_v3.py`) prints the opening's, each practice's, and each debrief's `purpose` as the lines of the coach's arc map. **`phase.purpose` is the exception**: the schema requires it, `lo_v4.py` carries it, and the roadmap prints only the phase label. The audit's P5 states exactly this.

That splits the 36 purpose slots among the 128 raw required-field gaps in the ports:

* `practice.purpose` × 18 — feeds a real consumer. Genuine authoring: a stubbed value degrades the arc map the model reasons from, so these should be written (or generated and reviewed), not left as filler.
* `phase.purpose` × 18 — feeds nothing. Whether a field the engine never reads should be required at all is unresolved and belongs to POC V4.

UX Universal has defaulted both sets with generated stub prose (D8), so neither blocks authoring — for `practice.purpose` that is a quality cost to pay down; for `phase.purpose` it is filler for an unread field.

#### Proposed direction — the ask on POC V4

Fields that the engine requires but the SME did not author should not automatically become SME authoring work.

In particular:

* `phase.purpose` should either become optional or be rendered into the arc roadmap alongside the other three `purpose` fields;
* mechanical transition button labels can be defaulted;
* `final_word` should not be silently invented if it is intended to contain teaching content (the schema requires it only on delivery-only debriefs — `follow_up_turns: 0`; the exit `final_word`s are optional).

---

### 9.2 Three major capability differences — POC V4 decides

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

### 9.3 `practice.answer_shape` — POC V4 decides

The extension is already implemented in UX Universal.

The remaining question is whether it should become part of V4 itself.

The field is needed because UX Universal must distinguish between:

* a practice where the coach is expected to land on a particular answer; and
* a practice where multiple reasonable judgments are acceptable.

The current V4 structure does not express that distinction reliably.

---

### 9.4 Retry and mastery loops — jointly owned

The POC punch list records an authoring expectation that learners can trigger another scene progression to retry.

The POC engine is forward-only. The UX Universal player, by contrast, **ships a scene-response retry today**: every learner scene line carries a "Try a different approach" control (`scenario-live.html`, `tryDifferentApproach`) that truncates the transcript back to that moment *and* rewinds the ladder state from a snapshot taken at send time — phase index, turn count, tier, scenario variables — so the model's `[SYSTEM STATE]` matches the truncated history. It applies to scene responses only, remains available until the scenario completes, and is currently uncapped.

So the behavioral difference is real and runs in one direction: authored deck intent and the shipped UX player have retry; the POC engine does not.

The open questions are whether the POC engine adopts it, and what the cap policy should be (each redo is a fresh model turn, and today nothing limits how many times a learner rewinds).

> **Outcome, 2026-08-18: do not include.** The POC engine will not adopt retry; whole-scenario restart is considered sufficient, revisitable later. The first open question is therefore closed and the second is now entirely ours: our player keeps an uncapped rewind, which is a **documented intentional divergence** plus an unbounded model-cost surface. Deciding whether to cap it, gate it as prototype-only, or retire it is UX Universal's call.

---

### 9.5 Where teaching belongs — jointly owned

V4 groups `teaching_points` at the content level, organized by subject.

UX Universal currently associates teaching directly with the step where it is delivered.

This difference forced the V4 runtime compiler to match teaching topics back to phases.

That matching is fragile: if teaching points are regrouped by subject, the runtime can silently fail to associate a point with its intended phase.

Two possible solutions are:

1. add an explicit per-phase link to the relevant teaching point; or
2. use `debrief.key_points` as the per-step teaching carrier.

The second option is closer to the existing V4 structure.

---

### 9.6 Narrative placement — resolved (was UX Universal's)

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

### 9.7 Button labels — jointly owned (content policy)

The 11 V4 scenarios contain:

* 63 total transition/button labels;
* 27 distinct labels.

The two main transition slots behave very differently.

| Slot | Authored | Distinct | All 11 | Interpretation |
| --- | ---: | ---: | --- | --- |
| Practice → debrief | 17 | 2 | 29 / 7 | 16 of 17 are “Talk it through”. An unwritten default, not drift. |
| Debrief → next step | 17 | 10 | 29 / 17 | “Sit down with Bianca”, “Find Marco” — the text describes what happens next. |
| Opening | 3 | 3 | 5 / 4 | Too small a sample to establish a convention. |

The **Authored / Distinct** columns count the six SME scenarios only, which is the right basis for an authoring convention: `GENERATED-DEMOS.md` marks the other five as Claude-authored spec exercisers with no source-deck traceability. The all-11 figures are given alongside because earlier revisions of this document quoted them; the shape is the same, diluted.

The practice-to-debrief button is therefore mostly stylistic drift rather than meaningful content.

A house convention would remove that variation.

The debrief-to-next-step label is different: those labels communicate the next action and therefore appear intentionally authored.

There is also a collision where `"Begin practicing"` is used both as an opening label and a debrief transition.

---

### 9.8 Generalizing typed interaction outputs — POC V4 decides

A terminology note before the substance: this section is about **interaction surfaces** in the player, not the schema **extensions** of §6 and §10. An extension is a field added to a document; a surface is a module added to a player. The two are independent — scene-sweep needs a surface but no extension, and `answer_shape` is an extension that needs no surface.

The UX Universal player treats a custom interaction as a surface: a module that registers into a registry (`SimSurfaces.register({ kind, install })` in `js/sim-surfaces.js`), keyed by the phase kind it owns. The surface owns the whole activity — the canvas, the log, the tile board — and reports back to the engine through typed outputs.

That output contract is declared, not hard-coded. A surface registers `turnFields` with validators — for example `turnFields: { spotted: … }` — and the engine parses the model's turn, validates the referenced IDs, and hands the credited values back to the surface. The engine consumes typed data; it never knows what a canvas is.

The pattern is proven in shipped code:

* Spot the Hazard (`kind: 'spot'`) has **two interchangeable surfaces** — the photo/hotspot canvas (`js/sim-perception.js`) and the text observation log (`js/sim-observe-text.js`). Same authored scenario, same output contract, swapped by a URL flag, zero engine edits.
* Teach-back (`kind: 'teach'`, `js/sim-teachback.js`) goes further: it declares `ownsInput`, so the surface takes over the composer entirely while it runs.

Adding a surface is additive — register it and include its script. No runner changes.

V4 has the same idea in its `[[spotted:...]]` contract: the engine strips the marker, validates the referenced IDs against the rubric, and uses the result for scoring and coverage. The limitation is that this contract exists only for `observe_react` and is tied to its required `exhibit`.

That is exactly what makes teach-back hard to represent: its surface exists and runs today, but there is no V4 mode to trigger it and no mode-independent way to carry its credited-items output.

#### Proposed direction

Define a **mode-independent credited-items output contract**, paired with a pluggable interaction surface. The V4 schema's `oneOf` already treats the interaction *shape* as pluggable; this extends the same idea to the engine.

A new interaction type then becomes one new `mode` value plus one registered surface, with no change to existing modes.

---

## 10. Extension Strategy — POC V4 decides

This is the single largest ask on the POC V4 team, and the one to raise first.

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

## 11. Smaller Alignment Issues

Several lower-priority questions remain. The third quality tier, `help_turns` and `spot_target` are POC V4's calls; the teach-back cap only matters if a retrieval mode lands and is joint.

### Third quality tier — withdrawn, then granted anyway

> **Outcome, 2026-08-18: the neutral tier becomes OPTIONAL.** Decided in the alignment meeting off K&A's own proposal, after we had withdrawn the ask. The open-ended 1–9 form was declined (complexity and prompt volume); `unthoughtful` and `strong` stay required; dev is updating the spec. **Our validator still requires all three** (`scenario-v4.js`, `required: LEVELS`) and needs the edit.
>
> The withdrawal below was measured at the **deck** level — how often each tier label appears across a whole deck — and the ask was about the **beat** level: whether a given beat grounds three. Those are different questions, and the count never tested the one that mattered. K&A independently reported the same pressure from the other side: their port "had to invent middle tiers just to satisfy the schema," which is the required-field-with-no-author argument arriving on a field we had not applied it to. So our five two-pole practices were not simply a porting artifact. Kept below as the reasoning, not as a live position.

Previously raised as an ask on V4: allow a partial scale on practices, the way `opening.levels` already works, on the premise that source material often defines only two meaningful levels.

**Withdrawn 2026-08-18, on measurement.** All three source decks author all three tiers, and abundantly:

| Deck | `unthoughtful` | `neutral` / average | `strong` / ideal |
| --- | ---: | ---: | ---: |
| Workplace violence (final) | 8 | 11 | 15 |
| Bullying | 14 | 14 | 16 |
| HazCom | 6 | 6 | 12 |

No source is constrained to two levels. Of our 17 ported practices, 5 carry only `unthoughtful` + `strong`; that is our porting shape, not the deck's. The middles are ours to author.

### `help_turns`

The V4 loader defaults `help_turns` to 2 (`DEFAULT_HELP_TURNS`), which arms the mid-scene help affordance for any scene interaction that omits the field. The spec notes `coach_inquiry` has no such field — there, the learner is already talking to the coach.

The authored split is the evidence: **all six SME scenarios set it to 0** (nine instances). Every `2` is in one of the five Claude-generated demos. An earlier revision of this document said the POC audit "set this to 0 everywhere"; that is true of the SME content and not of the repository as a whole.

The default should be confirmed as an intentional product choice rather than inherited.

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

## 12. Independent Convergence

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

## 13. Loader Architecture

Both systems independently use the same general architectural pattern:

**authored format → loader normalization → internal runtime representation**

POC V4's `lo_v4.py` normalizes V4 into the internal representation used by its V3 builder. `load_lo_file` dispatches based on `schema_version` and supports the 2.2, 3.0, and 4.x formats.

UX Universal's `scenario-v4-runtime.js` similarly compiles V4 into the runtime shape already consumed by `sim-player.js`.

This is an important architectural precedent.

It means the authored format does not need to become the runtime representation.

The V4 compiler can remain the compatibility boundary between content and the existing player.

---

## 14. Remaining UX Universal Decisions

Three questions remain specifically on the UX Universal side. **None of them is an ask on the POC V4 team**; they are listed so the record is complete. The one with a downstream consequence is teach-back: if we choose the second direction below, it turns into the §9.8 ask, which is already on their list.

### 1. What happens to `branching-arc`?

`branching-arc` is currently live-only and was removed from the Editor registry in July.

The §7 finding sharpens this question rather than answering it. The type's distinguishing feature was tier-routed forking; its own source deck withdrew that requirement, and its shipped scenario converges on one path like every other type. What is left that is genuinely its own is the escalation ladder and the cast/canon primitives — which mix-arc and ensemble-arc already carry.

Question:

**Should it return as an Editor template, remain live-only, or fold into mix-arc?**

### 2. What happens to teach-back?

Teach-back cannot currently be expressed naturally in V4.

There are two likely directions:

* keep it as a UX Universal-specific local type; or
* propose a fourth V4 mode through the generalized interaction/output model described in §9.8.

### 3. What happens to `hazmat_scene_3.mp4`?

The asset is already missing in the existing implementation.

Decision:

* restore the missing video; or
* remove the reference.

---

## 15. Recommended Next Steps

The implementation work is substantially complete. The next phase should focus on decisions rather than further infrastructure.

### Priority 1 — Resolve §9.1 · POC V4

Determine which required V4 fields represent genuine authoring requirements and which are artifacts of the spec/engine mismatch.

In particular:

* `purpose`;
* transition labels; and
* `final_word`.

This is the main blocker to reducing the 61 remaining fields.

### Priority 2 — Decide the extension model · POC V4

Resolve whether V4 should support a namespaced extension envelope.

If adopted, formalize `answer_shape` and the safety flags as the first extensions.

### Priority 3 — Resolve behavioral differences · POC V4 and joint

Make explicit product decisions about:

* clarification-question cost;
* safety floors;
* retry/mastery;
* three-tier assessment;
* help turns; and
* `spot_target` behavior.

### Priority 4 — Decide the future of teach-back · UX Universal, then POC V4

This is the largest remaining mismatch between the two models.

The cleanest long-term architecture is likely a generalized interaction/output contract rather than continuing to special-case teach-back.

### Priority 5 — Complete authoring · UX Universal

Once §9.1 is settled, finish the remaining 61 fields and re-run the verification checks described in the appendix (§17).

### Priority 6 — Flip V4 to the default source · UX Universal

The compile-fidelity blocker is cleared — worked examples, disclosure facts and their reveal timing now reach the model, so the Editor's fields do what they appear to do. What remains gating this is the alignment decisions and the authoring gap.

**The Editor already steers new work to V4, ahead of the flip.** `v4-universal` carries a `goForward` flag: it leads the wizard's "What are you building?" grid and the shell's current-type card, and the other six registered types are badged *"Legacy — for editing existing scenarios."* Existing content keeps a fully first-class editing path; only the default for *new* scenarios moved. Two things are deliberately not done yet: the URL is still an opt-in (`?type=v4-universal`), and V4 has no start-from-scratch interview, so picking Universal Scenario opens the editor on its template gallery rather than an interview. Contract detail: `js/README.writer-studio.md` §3b.

Once the alignment decisions are resolved and the authoring gaps are closed, make V4 the default authored source rather than requiring:

```text
?type=v4-universal
```

The existing UX Universal player can remain the runtime target behind the V4 compiler.

---

## 16. Bottom Line

The V4 retrofit is no longer an experimental conversion path. The core architecture is built and verified.

The current model is:

```text
Editor
     ↓
Scenario CML V4
     ↓
V4 runtime compiler
     ↓
existing UX Universal player
```

The existing scenario types survive as **recipes, not as fields on the dish** — authoring templates rather than competing content formats.

The migration has demonstrated that V4 can represent the existing scenario families with very little behavioral loss, and independent ports have converged on essentially the same phase/mode structures.

The remaining work is therefore not “make V4 work.”

It is to decide **what V4 should require, what UX Universal-specific behavior belongs in extensions, and which genuine product behaviors should be standardized rather than silently preserved from the old implementation.**

Most of those calls are POC V4's to make. *Who Decides What*, near the top, is the routed list — ten asks on the format or the engine, four joint, the rest ours.

Once those decisions are made, the remaining authoring work is finite and the system is in a position to make V4 the default authored source.

---

## 17. Appendix: The Conversion Record

Supplemental detail on how the conversion effort went — what was built, how it was verified, and how to reproduce the checks.

### What was built

| File                                | Purpose                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `js/scenario-v4.js`                 | V4 schema, validator, cross-field rules, linting, extension registry, and extension folding/stripping. |
| `js/scenario-v4-runtime.js`         | Single V4 compiler that converts V4 into the runtime shape consumed by the existing player.            |
| `js/scenario-v4-templates.js`       | Seven starting templates representing the existing authoring shapes.                                   |
| `js/scenario-types/v4-universal.js` | The V4 Editor surface and development handoff/export support.                                          |
| `port-to-v4.js` (scratchpad)        | Migration tool for converting existing scenario types to V4.                                           |
| `roundtrip.js` (scratchpad)         | Compares behavior between the current implementation and the V4 path.                                  |
| `check-assets.js` (scratchpad)      | Verifies asset references across the scenario trees.                                                   |

On the V4 route this single compiler replaces what would otherwise have been a per-type conversion path. The native per-type `toRuntime` / `toMixArc` paths are untouched and still ship — `?type=v4-universal` selects the V4 compiler, every other `?type=` still runs its own.

### V4 validation

The 11 scenarios live in `VectorLearning/scenario-simulator-poc`, not in this repository, so this check is reproducible only with that repo checked out alongside. All 11 validate successfully against our port of the schema:

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

### Asset verification

Asset resolution is identical across the live tree and the archive snapshots from 2026-08-04 and 2026-08-17.

There is one pre-existing missing asset — `hazmat_scene_3.mp4`, referenced from `hazmat-scene-practice.html:1260`. This is not a V4 migration regression.

### Reproducing the checks

Play a V4 scenario in the browser:

```text
scenario-live.html?type=v4-universal&observe=text
```

Validate a V4 document (this tool is in the repository):

```bash
node js/scenario-v4.js <file.lo.json>
```

Reproduce the blocking-field counts in §8 — 128 raw, 61 after the D8 defaults:

```bash
node -e "const V4=require('./js/scenario-v4.js'),T=require('./js/scenario-v4-templates.js');
let raw=0,def=0;for(const t of T.list()){const d=T.get(t.id);
raw+=V4.validate(d).errors.length;
def+=V4.validate(V4.applyHouseDefaults(JSON.parse(JSON.stringify(d))).doc).errors.length;}
console.log(raw,def);"
```

The remaining tools — `port-to-v4.js`, `roundtrip.js`, `check-assets.js`, `prompt-diff.js`, and `regenerate-templates.js` — live in the working session's scratchpad rather than the repository, so they are recorded here as part of the effort rather than as commands others can run.

Two path gotchas worth documenting: a relative path inside a `.js` file is resolved relative to the loading document, not the script's own directory (this previously created 38 false breakages); and archive snapshots are two levels deeper than the live tree, so their relative paths require two additional `../` segments.
