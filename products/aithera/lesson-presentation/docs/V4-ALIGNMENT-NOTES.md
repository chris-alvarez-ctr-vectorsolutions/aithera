# Scenario CML v4 alignment — decisions, gaps, and state

Working notes for the retrofit that makes **POC V4** the authored source of truth
for **UX Universal**, replacing its per-type shapes. Kept next to
`SCENE-SWEEP-CONVERGENCE-PLAN.md` because it is the same kind of document: a
plan you can pick up cold three weeks later.

**Status:** ALL FIVE STAGES BUILT AND VERIFIED (2026-08-17). `?type=v4-universal`
plays POC V4 documents through the existing universal-player resolver; the Studio
authors them; the prompt harness holds all invariants across the 7 types and all
7 templates boot in the browser. What remains is not code: the §7 talking points
with the dev team, the 64 genuine authoring fields, and the decision to flip v4
to the DEFAULT source (gated on §7-A). Play it:
`scenario-live.html?type=v4-universal&observe=text` · verify:
`node prompt-diff.js` + `node regenerate-templates.js` (scratchpad).
**Last updated:** 2026-08-17

### Naming

Two systems, named rather than possessive, so it stays clear which is which:

| Name | What it is |
|---|---|
| **POC V4** | Scenario CML v4 — the content format and engine in `VectorLearning/scenario-simulator-poc`. The format we are aligning to. |
| **UX Universal** | Our prototype authoring + player stack in this repo: Writer Studio, `js/sim-player.js`, the eight scenario types, `scenario-live.html`. |

Both are real systems with real constraints. Where they disagree, the notes say
which one is better on the merits rather than which one is ours.

---

## 0. What v4 is, and the one fact that reframes everything

POC V4 is defined by four things in `VectorLearning/scenario-simulator-poc`:

- `app/lo_schema/lo_cml_v4.schema.json` — the enforced schema
- `docs/authoring/scenario-cml-spec.md` — the 860-line spec (field meanings, §9 rules)
- `docs/authoring/scenario-authoring-guide.md` — craft guidance, drives Studio copy
- `app/content/*.lo.json` — **11 real authored scenarios**, the best fixtures we have

**There is no scenario type field in v4.** §1.1 says it outright: what a scenario
*is* emerges from its parts. A scenario is `phases[]`, and each phase's `practice`
picks one `mode`:

| POC V4 mode | What the learner does | UX Universal beat kind |
|---|---|---|
| `coach_inquiry` | reasons it through with the coach | `coach-led` |
| `roleplay` | acts in a scene | `roleplay` |
| `observe_react` | studies an exhibit, says what's wrong | `observe` |

Every phase pairs one `practice` (learner acts) with one `debrief` (coach teaches
against that attempt). That is the whole model.

### Independent convergence — why we trust the mapping

The converter's output matched the POC V4 team's independent ports of the same
decks, with neither side comparing notes:

| UX Universal type | Ported modes | POC V4 counterpart | |
|---|---|---|---|
| ensemble-arc | `RRRC` | bullying `RRRC` | identical |
| scene-sweep | `OC` | hazcom `OC` | identical |
| guided-arc | `CCR` | marshall `CCR` | identical |
| branching-arc | `CRRR` | wpv `CRCR` | near |
| mix-arc | `COR` | — | no counterpart |

---

## 1. Scenario types survive as TEMPLATES (not as a declared field)

**This is the important consequence of "no type field", and it is good news.**

POC V4 removing the type declaration does **not** remove the eight UX Universal
types. It moves them from the *format* to the *authoring* layer:

- **Before:** `type` was a field in the file, and it bound the scenario to one
  engine path. Changing a scenario's type meant switching engines.
- **After:** a type is a **starting template** — a v4 skeleton with the modes,
  turn budgets and structure that make that shape work. The LXD picks one and
  customizes freely.

Why this is an upgrade for LXDs:

- A template is a starting point, not a contract. Adding a roleplay step to a
  coach-led template is now just adding a phase, not a type migration.
- Templates can be added, edited and retired without touching the engine or the
  format, because nothing downstream reads a type.
- Mixed shapes stop being a special case. Today "mix & match" is its own type;
  in v4 every scenario is already mixed-capable.

The spec agrees: *"A 'tutor scenario' is a description, not a declaration."*

Where this lands in the build: **Writer Studio keeps its type gallery** as a
template picker (Stage 4). `scenario-v4-runtime.js` still derives a *label* from
the modes present (`derivedTypeLabel`) purely so our chrome has something to
display — it constrains nothing.

---

## 2. Decisions made

| # | Decision | Rationale |
|---|---|---|
| D1 | **Full retrofit**: v4 becomes the authored source; Studio and player both move | Chris, 2026-08-17. Alternative (export adapter only) would emit hollow or invalid files, since the converter cannot invent a rubric or a purpose. |
| D2 | **All authorable types**, including scene-sweep | Chris. scene-sweep's hotspots are the one native source that maps cleanly to a v4 observe rubric. |
| D3 | **Compile v4 → the existing runtime shape** rather than rewriting the player | Keeps `sim-player.js` and every module untouched, so the cutover is verifiable by direct comparison instead of hope. |
| D4 | **Fixed 3-level quality scale** — UX Universal's custom tiers normalize onto `unthoughtful`/`neutral`/`strong` | Settled by evidence, not negotiation: it is baked into the POC V4 assessment schema and all 11 scenarios use it. UX Universal's `CONNECTS`/`VAGUE`/`CONFRONTS` do not port. |
| D5 | **Build an explicit `answer_shape` marker**, don't bridge | Chris, 2026-08-17: "otherwise it's just temporary bridges." See §3. |
| D6 | **The converter omits what it cannot source** instead of seeding placeholder prose | Validation errors then *are* the authoring worklist, and nothing half-written can reach a handoff looking finished. |
| D7 | **Scenario types become templates** (§1) | Preserves the LXD workflow with no format support needed. |
| D8 | **Default the mechanical fields POC V4 requires that no deck provides**; never default teaching prose | Chris, 2026-08-17. Blocking fields 131 → 64. Which fields qualify was decided by measuring the 11 POC V4 scenarios (§7-A2). `final_word` stays authored — it is the last thing a learner hears. |

### Deliberately NOT bundled

Three of the four calls in `scenario-simulator-spine-alignment.html` are engine
changes that would alter learner-visible behavior. None is decided, and folding
them into the data move would change pacing for every shipped scenario in the
same commit:

1. **Two-conversation prompt scoping** (POC V4 §2). A stronger anti-leak guarantee
   than UX Universal's single compiled prompt, which stays for now.
2. **Debrief as its own turn-owning rung.** UX Universal keeps two fields on the
   rung (`debrief.talkItThrough` / `.points`).
3. **`carryover` verbatim transcripts.** Carried through as data; nothing
   consumes it yet — the runtime has no transcript channel.

---

## 3. UX Universal extensions — fields POC V4 does not have

POC V4 sets `additionalProperties: false` **at every level**, so an added field is
not an extension point: its loader rejects the whole document. Extensions are
therefore declared explicitly in `js/scenario-v4.js` (`EXTENSIONS`), and the
tooling is loud about the cost:

```
V4.validate(doc)                 → extension valid, reported as a WARNING
V4.validate(doc, {strict:true})  → extension is an ERROR (the POC V4 loader, exactly)
V4.stripExtensions(doc)          → loadable copy + what was removed + what it costs
```

### `practice.answer_shape: "determinate" | "open"`

**What it is.** Does this practice have a right answer the coach must land, or is
it open judgment where landing a verdict defeats the point?

**Why we need it.** UX Universal has steered on this since guided-arc, as
`hasRightAnswer` + `throughLine`:

- `mix-arc.js:983` — injects *"There IS a correct answer here — {throughLine}.
  Hold it during Practice; state it plainly when you teach."*
- `guided-arc.js:382` — teaching verb becomes *"land the point clearly… never
  hedge"* instead of *"deepen what they said"*
- `guided-arc.js:439` — labels the calibration block *"has a right answer"* vs
  *"open, no wrong answer"*

**Why POC V4 has no equivalent.** Two POC V4 constraints exclude it: content
carries no prompt text (§9.2 lints for it), and universal coaching behavior is
template-owned (§4: *"must not be authored"*). The field that inherits the
*content* half is `debrief.key_points` — but that is **required on every
debrief**, so its presence carries no signal about which kind of step this is.

**Cost of stripping it.** Every practice reads as determinate, so the coach
delivers a verdict on reflection steps instead of drawing the learner out.

**The ask** (Chris to raise with the POC V4 team): add a per-practice marker. It is
*content structure*, not prompt text, so it does not violate POC V4 constraint 1.
Expect the pushback *"that's what `levels.strong.look_for` encodes"* — true for a
human reader, not machine-readable.

---

## 4. Things POC V4 cannot express at all

Not gaps to fill — capabilities that do not survive the move. `archive/2026-08-17`
is the only place they still run.

| UX Universal | POC V4 status |
|---|---|
| `intro` — cold-open audio/video context (`js/scene-context.js`) | No equivalent. v4's landing is `narrative` text + `landing_cta_label`. |
| **teach-back** (retrieval) | No mode for it. v4's only coverage-crediting mechanic is welded to `observe_react`'s required `exhibit`, so topic coverage cannot be expressed. |
| `transitions[].onTier` tier-routed branching | Advancement is forward-only and server-owned; tier no longer routes. |
| `elevatedStakes` / `involvesMinors` / `threatContent` | No fields. |
| `playbook[].source` internal ids (`RVCT-479 P017`) | `source_references` takes **external authorities only** (OSHA, Title VII). Internal citations must split out. |
| `course`, `learnerName`, `characterName`, `state` | Catalog metadata lives outside the implementation (§3); `state` is replaced by `carryover`. |

---

## 5. Authoring gaps — roughly 155, and they are real writing

The converter leaves these empty on purpose (D6). **Per phase:**

- `purpose` on the phase **and** the practice — its role in the coach's map of the arc
- a `look_for` for each quality level — our single `guidance` string became
  `response`; the "how to recognise this" half was never written
- `debrief.label` — the decks name this unit ("Coach Debrief"); UX Universal never did
- `debrief.transition.button_label`, and `final_word` for delivery-only debriefs

**Per scenario:** `closing.ideal_response.summary`, `misconceptions`,
`teaching_points` regrouped by subject rather than by phase, character `role` lines.

**Largest single item:** observe `rubric` entries (`id` / `name` /
`standard_term` / `nudge`) plus `spot_target`. Only scene-sweep has any source.

**Judgment call throughout:** most of our beats author **two** tiers; v4 requires
**three**. The middle "well-intentioned but thin" tier must be written per beat.

---

## 6. What is built, and how it was verified

| File | Job |
|---|---|
| `js/scenario-v4.js` | v4 shape + validator: schema, `additionalProperties:false`, the 7 §9.1 cross-field rules, the 8-needle §9.2 lint, derived cap, `EXTENSIONS`, `stripExtensions` |
| `js/scenario-v4-runtime.js` | one compiler, v4 → today's runtime, replacing every per-type `toRuntime`/`toMixArc` |
| scratchpad `port-to-v4.js` | migration tool, native → v4, with shape normalizers for guided-arc / observe-react / teach-back |
| scratchpad `roundtrip.js` | behavior comparison, baseline vs v4 path |
| scratchpad `check-assets.js` | resolves every asset reference per tree |

Verification standing:

- **Validator:** all 11 of the POC V4 scenarios valid, zero warnings. **46/46** negative
  tests catch injected violations at the right JSON path.
- **Round-trip:** **263 of 338** field comparisons identical, and **no outstanding
  information loss**. The remainder breaks down as:
  - *intentional* — tier vocabulary ×14 (D4), `reactionGuidance` ×10 (folded into
    each level's `response`), `framing` ×4 (v4 merges situation into one `narrative`)
  - *additive* ×23 — `type`, `character.name`, `counterpart`, `world`, `sayDoSplit`
    on branching/ensemble/scene-sweep rungs, which never carried those fields
  - *placement only* ×11 — `entry.signpost` / `entry.beats.len`. Verified
    separately: concatenated opener text is **identical on 13 of 14 phases, with
    0 text lost** — the same bubbles, split differently between signpost and
    `beats[]`. Not a defect.
- Two fixes worth remembering: `throughLine` (was ×14, now ×1) is recovered by
  matching a `teaching_points` topic to the phase label, since v4 keeps teaching at
  content level; and `hasRightAnswer` (was ×13, now ×0) reads the `answer_shape`
  extension instead of being guessed from the exit requirement.
- **Assets:** live / `2026-08-04` / `2026-08-17` all resolve identically. Note a
  **pre-existing** 404: `hazmat_scene_3.mp4`, referenced by
  `hazmat-scene-practice.html:1260`, missing from the shared tree.

### Re-run everything

```bash
node js/scenario-v4.js <file.lo.json>          # validate a v4 document
node port-to-v4.js all v4-out                  # port every type, print the worklist
node roundtrip.js                              # behavior diff vs today
node check-assets.js                            # asset resolution, all trees
```

Gotchas worth keeping: a relative path inside a `.js` file resolves against the
**loading document**, not the script's folder (getting this wrong invented 38
phantom breakages); and archive snapshots sit **two levels deeper**, so escaping
paths gain two `../` segments — product videos land at `../../../assets/`, the
repo-root Font Awesome at `../../../../../assets/`.

---

## 7. Talking points for the dev team

Ordered by what costs us most if it goes unaddressed. Each is evidence-backed;
where the POC V4 repo documents the problem, it is quoted, because a point they
already wrote down is far easier to agree on.

### A. POC V4 requires content the LXD decks never contained

Searched the final WPV deck (36pp) for every field we were told to fill:

| Field | Occurrences in deck |
|---|---|
| `purpose` | **0** |
| "final word" | **0** |
| `misconception` | **0** |
| `rubric` | **0** |
| "debrief" | 32 (as *Coach Debrief*, *Final Feedback*, *Personalized Recap*) |
| "look for" | 12 |

Their own `docs/authoring/sme-punch-list.md` records what filling those slots did:

- *"several locked `final_word` lines across the LOs are authored (**spec-required**) with **no deck antecedent**."*
- *"likely **filled to satisfy a schema slot**, not SME-authored"* — invented mid-scene dialogue, Marshall Phase 3
- *"**Wholly synthesized** character behavior cards (jake/marshall/ethan) with **zero deck counterpart**"*
- *"**Possible invented teaching point**… no counterpart anywhere in the 15-slide deck. **Compliance-relevant field.**"*
- *"Added failure modes… the deck's only negative case is non-intervention"*

**The ask:** for fields the POC V4 engine needs but no SME wrote (`purpose`, the two
`transition.button_label`s, `final_word`), agree they are **generated at export
time or defaulted by the engine**, not hand-authored. Hand-authoring them is what
produced an invented compliance claim in the POC V4 Marshall scenario.

Counts still blocking in our ports: `phases[].purpose` 18, `practice.purpose` 18,
`debrief.transition` 18, `practice.transition` 9, `closing.summary` 6,
`characters[].role` 5, `interaction.setting` 8.

### B. Three capabilities UX Universal has and POC V4 cannot express

1. **A clarifying question should not cost a turn.** Ours rebates it
   (`js/sim-core.js:517`: *"the runtime rebates the optimistic turn count… so a
   redirect is free"*). v4 goes the other way explicitly — for a coach practice,
   *"a clarifying question is just a turn."* A confused learner burns budget by
   asking for help.
2. **Safety floors.** `CRISIS_FLOOR` (`js/scenario.js:250`) plus the branching
   threat floor and ensemble minor floor, driven by `elevatedStakes` /
   `involvesMinors` / `threatContent`. **v4 has no field for any of it.** This is a
   safety capability for harassment, workplace violence, bullying and minors
   content, not a nicety.
3. ~~**Watch-and-discuss.**~~ **WITHDRAWN 2026-08-17 — this was wrong.**
   `coachInteraction.media` accepts `type: "video"` and is explicitly *"never
   graded"*, so a coach step with a clip pinned above the conversation IS
   watch-and-discuss. No new mode needed; our mix-arc observe beat maps to
   `coach_inquiry` + `media`, not to `observe_react`. Worth telling them their
   spec prose says "reference **image**" while the schema allows video — a small
   spec/schema disagreement, the kind their own alignment audit tracks.

### C. `practice.answer_shape` — the marker we built (§3)

Determinate vs open judgment. Without it every practice reads as determinate and
the coach delivers a verdict on reflection steps instead of drawing the learner
out. Content structure, not prompt text. Built as a declared extension, which the
POC V4 loader rejects until adopted.

### D. Retry — the decks asked for it and the POC V4 engine dropped it

Their punch list, on Kendra: the deck authors *"can trigger another scene
progression to retry"* and *"the scenario continues until you see what works."*
Their engine is deliberately forward-only, and they logged it as *"a real
deviation from **authored deck intent**."* The LXD intent is on our side here.

### E. Teaching attached to the step, not the scenario

v4 keeps `teaching_points` at content level grouped by subject; ours ties the
teaching line to the step it belongs to. The content-level grouping forced the
label-matching seam in `scenario-v4-runtime.js` (see §6). The per-step model is
the better one — ask for a per-phase link, or agree `debrief.key_points` is the
per-step carrier.

### E2. One `narrative` cannot serve both registers — found at the prompt level

POC V4 §4.1 asserts `narrative` does two jobs: the coach's ground truth *and* what
the learner is shown, deliberately one text so "the coach cannot know a richer
version than the learner was shown."

In practice it broke the compiled prompt. UX Universal authored **two** texts —
`framing`, an outside-in description of the experience, and `establishing.sub`,
the learner-facing situation. The prompt template splices the first into a
sentence. With only `narrative` available, that sentence becomes:

> baseline: *"You facilitate **a short composed scenario on noticing and addressing disrespect at work**…"*
> v4 path: *"You facilitate **You saw it happen. Now decide what it was**…"*

Ungrammatical, on every scenario. Note the field-level round-trip could not catch
this — it took comparing compiled prompts.

Two ways out, and this needs a decision before the cutover:

1. **Restructure our prompt's opening** to render `narrative` as a labeled
   situation block rather than splicing it mid-sentence. This is what POC V4's own
   coach template does, so it aligns us — but it changes prompt text for every
   scenario, which is behavioral.
2. **Add `framing` as a second UX Universal extension**, on the same precedent as
   `answer_shape`: it is authored content with a distinct job (prompt-facing
   description vs learner-facing situation), not prompt text.

Option 1 is the better alignment; option 2 preserves current behavior exactly.

### A2. Button labels — the inconsistency is real, and it splits in two

Chris's hypothesis was that making button labels a field opened up inconsistency.
Measured across the 11 POC V4 scenarios: **63 labels, 27 distinct (43% unique)**.
But the two slots behave differently, which is why D8 treats them differently:

| Slot | Authored | Distinct | Reading |
|---|---|---|---|
| practice → debrief | 29 | **7** — 23 of them `"Talk it through"` | The button always does the same thing. Exceptions include `"Talk it out"`, the same words rearranged. **Drift.** |
| debrief → next step | 29 | **17** — `"Sit down with Bianca"`, `"Find Marco"` | These name what happens next. **Design.** |
| opening | 5 | 4 | Thin sample. |

Also: `"Begin practicing"` is used as **both** an opening and a debrief label across
scenarios — a genuine collision. Ask them to pick a house convention for the
practice button (their own punch list already flags the sibling problem: *"Last-debrief
transition text splits 3-3 across the family… SME/LED to pick the house convention"*).

### G. The surface-plugin layer — UX Universal's extension architecture (Chris, 2026-08-17)

Not the schema extensions (§3) — the PLAYER architecture. In UX Universal, a
custom interaction is a **surface plugin**: it registers into `SimSurfaces` keyed
by phase kind, owns the whole activity (the perception canvas, the notes log, the
teach-back tile board), and the ladder engine stays agnostic — one guarded seam
(`ctx.coverageBlock` feeding the per-turn prompt) plus **typed outputs** the
engine consumes (`turn.spotted` credited ids, completion). The engine never knows
what a canvas is.

The proof this pattern works is already shipped: scene-sweep's photo/hotspot
canvas (V1) and the text-observation log (V2) are **two surfaces over the same
authored scenario and the same output contract**, swapped by a URL flag —
`js/sim-observe-text.js` registered after `js/sim-perception.js`, "last
registration wins," zero engine edits. Teach-back landed the same way
(`js/sim-teachback.js`, owns its whole loop via `ownsInput`). Three interactions,
no runner surgery.

**POC V4 half-built the same idea and then hard-wired it.** Their `[[spotted:]]`
contract is exactly the typed-output pattern — the engine strips the marker,
validates ids against the rubric, and the spec says *"the player's meter and
scorecard read only this."* But it exists for `observe_react` ONLY. Their growth
rule (*"a new practice type is one new mode value plus one new interaction
shape"*) covers the FORMAT side of adding an interaction; there is no stated
equivalent on the ENGINE side — every new mode is engine surgery for them.

**The concrete cost is already visible: teach-back.** It is inexpressible in POC
V4 precisely because their one output contract is welded to `observe_react`'s
required `exhibit`. Generalize the contract — credited-items independent of what
the learner is looking at — and retrieval becomes one new mode plus one surface.

**The ask:** generalize `[[spotted:]]` into a mode-agnostic credited-items output
contract, and treat the interaction surface as pluggable the way the format's
`oneOf` already treats the interaction shape. This also future-proofs their own
growth rule: today it is true of their schema and false of their engine.

### F. Smaller items

- **The mandatory third tier.** Most of our beats author two; v4 requires three,
  and the POC V4 authors *"synthesized"* the missing one. Either a partial scale is
  allowed (as the opening's `levels` already is) or every author invents a middle.
- **`help_turns` default is a trap.** `DEFAULT_HELP_TURNS = 2` turns the affordance
  ON for any scenario that doesn't author the field; the POC V4 audit had to write
  `0` everywhere because *"no deck contemplates it."*
- **`teach-back` maxTurns 99.** Our retrieval loop is effectively uncapped, and v4
  derives the conversation cap by summing budgets — so it produces a nonsensical
  cap. A symptom of retrieval having no v4 mode (§4).

---

## 8. Open questions — UX Universal side

1. **`branching-arc` is live-only**, dropped from the Studio registry in July. Does
   it earn a template again, or stay live-only?
2. **teach-back's future** — inexpressible in v4 (§4). Keep as a non-v4 local type,
   or propose a fourth mode?
3. **`hazmat_scene_3.mp4`** — fix the missing video or drop the reference.
4. **The ~30 recoverable gaps are DONE** (2026-08-17): `look_for` split out of our
   guidance prose at an **89% recovery rate** (41 of 46 quality levels), debrief
   labels set to the decks' own *"Coach Debrief"*, and turn budgets sourced from
   our own engine (guided-arc 2, from `guided-arc.js:1353`). Blocking errors
   177 → 131. What remains is bucket A above — deliberately unfilled pending the
   dev-team conversation.
