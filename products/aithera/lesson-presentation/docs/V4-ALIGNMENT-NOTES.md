# Scenario CML v4 alignment — decisions, gaps, and state

Working notes for the retrofit that makes **POC V4** the authored source of truth
for **UX Universal**, replacing its per-type shapes. Companion to
`SCENE-SWEEP-CONVERGENCE-PLAN.md`.

**Status:** ALL FIVE STAGES BUILT AND VERIFIED (2026-08-17). `?type=v4-universal`
plays POC V4 documents through the existing universal-player resolver; the Studio
authors them; all 7 templates boot in the browser. Remaining: the §7 alignment
items, the 64 authoring fields, and the decision to flip v4 to the default
source (gated on §7-A). Play: `scenario-live.html?type=v4-universal&observe=text`
· verify: `node prompt-diff.js` + `node regenerate-templates.js` (scratchpad).
**Last updated:** 2026-08-17 — reconciled against the `scenario-simulator-poc`
repo, including its `spec-alignment-audit.md`, `v4-migration-report.md`, and
`sme-punch-list.md`.

### Naming

| Name | What it is |
|---|---|
| **POC V4** | Scenario CML v4 — the content format and engine in `VectorLearning/scenario-simulator-poc`. The format we are aligning to. |
| **UX Universal** | Our prototype stack: Writer Studio, `js/sim-player.js`, the eight scenario types, `scenario-live.html`. |

Recommendations below are argued from consequences, not from which system a
behavior came from.

---

## 0. What v4 is

POC V4 is defined by:

- `app/lo_schema/lo_cml_v4.schema.json` — the enforced schema
- `docs/authoring/scenario-cml-spec.md` — the 860-line spec
- `docs/authoring/scenario-authoring-guide.md` — craft guidance, drives Studio copy
- `app/content/*.lo.json` — 11 authored scenarios. Per `GENERATED-DEMOS.md`,
  5 of the 11 are generated demos, not SME-approved — useful as fixtures, weak
  as precedent for authoring norms.

**There is no scenario type field.** A scenario is `phases[]`; each phase's
`practice` picks one `mode`:

| POC V4 mode | What the learner does | UX Universal beat kind |
|---|---|---|
| `coach_inquiry` | reasons it through with the coach | `coach-led` |
| `roleplay` | acts in a scene | `roleplay` |
| `observe_react` | studies an exhibit, says what's wrong | `observe` |

Every phase pairs one `practice` (learner acts) with one `debrief` (coach
teaches against that attempt).

**Both stacks normalize at the loader.** POC V4's `lo_v4.py` normalizes v4 into
the internal shape its v3 builder consumes; `load_lo_file` dispatches on
`schema_version` (2.2 / 3.0 / 4.x). UX Universal's `scenario-v4-runtime.js`
compiles v4 into the runtime shape `sim-player.js` already reads. This shared
precedent frames §7-H.

**Independent convergence.** The converter's output matched the POC V4 team's
independent ports of the same decks, with neither side comparing notes:

| UX Universal type | Ported modes | POC V4 counterpart | |
|---|---|---|---|
| ensemble-arc | `RRRC` | bullying `RRRC` | identical |
| scene-sweep | `OC` | hazcom `OC` | identical |
| guided-arc | `CCR` | marshall `CCR` | identical |
| branching-arc | `CRRR` | wpv `CRCR` | near |
| mix-arc | `COR` | — | no counterpart |

---

## 1. Scenario types survive as templates

Removing the type declaration moves the eight types from the format to the
authoring layer. A type is now a starting template — a v4 skeleton with the
modes, budgets and structure that make that shape work. Adding a roleplay step
to a coach-led template is adding a phase, not a type migration; templates
change without engine edits, since nothing downstream reads a type; mixed
shapes stop being a special case. Spec: *"A 'tutor scenario' is a description,
not a declaration."*

Writer Studio keeps its type gallery as a template picker (Stage 4).
`derivedTypeLabel` in `scenario-v4-runtime.js` labels the chrome from the modes
present; it constrains nothing.

---

## 2. Decisions made

| # | Decision | Rationale |
|---|---|---|
| D1 | **Full retrofit**: v4 becomes the authored source; Studio and player both move | Chris, 2026-08-17. An export adapter alone would emit hollow or invalid files — the converter cannot invent a rubric or a purpose. |
| D2 | **All authorable types**, including scene-sweep | Chris. scene-sweep's hotspots are the one native source that maps cleanly to a v4 observe rubric. |
| D3 | **Compile v4 → the existing runtime shape** rather than rewriting the player | Keeps `sim-player.js` and every module untouched; the cutover is verifiable by direct comparison. |
| D4 | **Fixed 3-level quality scale** — custom tiers normalize onto `unthoughtful`/`neutral`/`strong` | Baked into the POC V4 assessment schema; all 11 scenarios use it. `CONNECTS`/`VAGUE`/`CONFRONTS` do not port. |
| D5 | **Build an explicit `answer_shape` marker**, don't bridge | Chris, 2026-08-17: "otherwise it's just temporary bridges." See §3. |
| D6 | **The converter omits what it cannot source** — no placeholder prose | Validation errors are then the authoring worklist; nothing half-written reaches a handoff looking finished. |
| D7 | **Scenario types become templates** (§1) | Preserves the LXD workflow with no format support needed. |
| D8 | **Default the mechanical fields POC V4 requires that no deck provides**; never default teaching prose | Chris, 2026-08-17. Blocking fields 131 → 64; qualifying fields measured on the 11 scenarios (§7-A2). `final_word` stays authored. |

### Deliberately NOT bundled

Two engine changes would alter learner-visible behavior and stay undecided:

1. **Two-conversation prompt scoping** (POC V4 §2). UX Universal keeps its single
   compiled prompt for now.
2. **Debrief as its own turn-owning rung.** UX Universal keeps two fields on the
   rung (`debrief.talkItThrough` / `.points`).

**`carryover`** is carried through as data; nothing consumes it yet (no
transcript channel). The `narrative` placement call is resolved — §7-E2.

---

## 3. UX Universal extensions

POC V4 sets `additionalProperties: false` at every level, so an added field
fails the whole load. Extensions are declared in `js/scenario-v4.js`
(`EXTENSIONS`):

```
V4.validate(doc)                 → extension valid, reported as a WARNING
V4.validate(doc, {strict:true})  → extension is an ERROR (the POC V4 loader, exactly)
V4.stripExtensions(doc)          → loadable copy + what was removed + what it costs
```

### `practice.answer_shape: "determinate" | "open"`

Does this practice have a right answer the coach must land, or is it open
judgment? UX Universal has steered on this since guided-arc as `hasRightAnswer`
+ `throughLine` (`mix-arc.js:983`, `guided-arc.js:382`, `guided-arc.js:439`).
POC V4 has no equivalent: content carries no prompt text (§9.2), coaching
behavior is template-owned (§4), and `debrief.key_points` is required on every
debrief, so its presence carries no signal. Stripped, every practice reads as
determinate and the coach delivers a verdict on reflection steps. Proposal in
§7-C; the nearest existing carrier, `levels.strong.look_for`, encodes this for
a human reader but not machine-readably.

### Content safety flags: `elevated_stakes`, `involves_minors`, `threat_content`

Booleans that arm UX Universal's safety floors (§7-B2). v4 has no field for
them; on a stripped document the floors never arm and nothing reports it.

---

## 4. Capabilities without a v4 representation

`archive/2026-08-17` is the only place these still run.

| UX Universal | POC V4 status |
|---|---|
| `intro` — cold-open audio/video context (`js/scene-context.js`) | No equivalent. v4's landing is `narrative` text + `landing_cta_label`. |
| **teach-back** (retrieval) | No mode for it; the only coverage-crediting mechanic is tied to `observe_react`'s required `exhibit`. |
| `transitions[].onTier` tier-routed branching | Advancement is forward-only and server-owned; tier no longer routes. |
| `elevatedStakes` / `involvesMinors` / `threatContent` | No fields (§3). |
| `playbook[].source` internal ids (`RVCT-479 P017`) | `source_references` takes external authorities only (OSHA, Title VII). |
| `course`, `learnerName`, `characterName`, `state` | Catalog metadata lives outside the implementation (§3); `state` is replaced by `carryover`. |

---

## 5. Authoring gaps

The converter leaves unsourceable fields empty (D6), so validation errors are
the worklist:

- **~177** blocking errors at first port.
- **→ 131** after recovering what our own prose could source (2026-08-17):
  `look_for` split from guidance at an 89% rate (41 of 46 levels), debrief
  labels set to the decks' own "Coach Debrief", turn budgets from
  `guided-arc.js:1353`.
- **→ 64** after D8 defaulted the mechanical fields.

Remaining, deliberately unfilled pending §7-A: `purpose` on phase and practice
(18 + 18), `debrief.transition` 18, `practice.transition` 9, `closing.summary`
6, `characters[].role` 5, `interaction.setting` 8 — plus `look_for` where
recovery fell short, `final_word` for delivery-only debriefs, `misconceptions`,
`teaching_points` regrouped by subject, and roleplay `setting`s. Largest single
item: observe `rubric` entries + `spot_target` — only scene-sweep has a source.
Throughout: most of our beats author two tiers; v4 requires three.

---

## 6. Built and verified

| File | Job |
|---|---|
| `js/scenario-v4.js` | v4 shape + validator: schema, the 7 §9.1 cross-field rules, the 8-needle §9.2 lint, derived cap, `EXTENSIONS`, `stripExtensions`, `foldExtensions` |
| `js/scenario-v4-runtime.js` | one compiler, v4 → today's runtime, replacing every per-type `toRuntime`/`toMixArc` |
| `js/scenario-v4-templates.js` | the 7 starting templates (§1) |
| `js/scenario-types/v4-universal.js` | the one Studio editor + dev-handoff export (strip and fold profiles) |
| scratchpad `port-to-v4.js` | migration tool, native → v4 |
| scratchpad `roundtrip.js` | behavior comparison, baseline vs v4 path |
| scratchpad `check-assets.js` | resolves every asset reference per tree |

- **Validator:** all 11 POC V4 scenarios valid, zero warnings; 46/46 negative
  tests fail at the right JSON path.
- **Round-trip:** 263 of 338 field comparisons identical, no information loss.
  Remainder: intentional (tier vocabulary ×14 per D4, `reactionGuidance` ×10
  folded into `response`, `framing` ×4), additive ×23, placement-only ×11
  (opener text identical on 13 of 14 phases, split differently).
- `throughLine` (×14 → ×1) is recovered by matching a `teaching_points` topic to
  the phase label; `hasRightAnswer` (×13 → ×0) reads `answer_shape` instead of
  being guessed from the exit requirement.
- **Assets:** live / `2026-08-04` / `2026-08-17` resolve identically. Pre-existing
  404: `hazmat_scene_3.mp4` (`hazmat-scene-practice.html:1260`).

### Re-run

```bash
node js/scenario-v4.js <file.lo.json>          # validate a v4 document
node port-to-v4.js all v4-out                  # port every type, print the worklist
node roundtrip.js                              # behavior diff vs today
node check-assets.js                            # asset resolution, all trees
```

Gotchas: a relative path inside a `.js` file resolves against the loading
document, not the script's folder (this once invented 38 phantom breakages);
archive snapshots sit two levels deeper, so escaping paths gain two `../`
segments.

---

## 7. Open alignment items

> Presentable form: `scenario-simulator-dev-conversation-guide.html` — per-point
> cards with proposal, evidence, counterpoints, fallback. The extensions
> proposal also has its own page, `scenario-simulator-extensions-proposal.html`.
> This section is the raw evidence record behind both.

Ordered by impact.

### A. Required fields with no source — and no consumer

The final WPV deck (36pp), searched for every field the ports must fill:
`purpose` 0 occurrences, "final word" 0, `misconception` 0, `rubric` 0,
"debrief" 32, "look for" 12.

`sme-punch-list.md` records what hand-filling those slots did during the POC
ports:

- *"several locked `final_word` lines across the LOs are authored (**spec-required**) with **no deck antecedent**."*
- *"**Wholly synthesized** character behavior cards (jake/marshall/ethan) with **zero deck counterpart**"*
- *"**Possible invented teaching point**… no counterpart anywhere in the 15-slide deck. **Compliance-relevant field.**"*

`spec-alignment-audit.md` P5: *"`phase.purpose` is never rendered into any
prompt… The only required spec field with a stated prompt consumer that has
none."* That makes `purpose` — 36 of the 64 blocking slots — a documented
spec/engine disagreement, not only an authoring burden.

**Proposal:** fields the engine requires but no SME wrote (`purpose`, the two
`transition.button_label`s, `final_word`) are generated at export time or
defaulted by the engine. For `purpose`: make it optional, or give it the
consumer the spec describes.

### B. Three capability differences

1. **Cost of a clarifying question.** UX Universal rebates it
   (`js/sim-core.js:517` — "a redirect is free"); in v4, *"a clarifying question
   is just a turn."* Needs a product decision.
2. **Safety floors.** `CRISIS_FLOOR` (`js/scenario.js:250`), the branching
   threat floor and the ensemble minor floor arm off the §3 safety flags. v4 has
   no field for them. Relevant to harassment, workplace violence, bullying and
   minors content.
3. ~~**Watch-and-discuss.**~~ WITHDRAWN 2026-08-17 — wrong.
   `coachInteraction.media` accepts `type: "video"` and is *"never graded"*;
   that is watch-and-discuss. Our mix-arc observe beat maps to `coach_inquiry` +
   `media`. Residual: the spec prose says "reference **image**" while the schema
   allows video.

### C. `practice.answer_shape` (§3)

Built as a declared extension; the POC V4 loader rejects it until adopted.

### D. Retry

The POC punch list, on Kendra: the deck authors *"can trigger another scene
progression to retry"*; the engine is forward-only, logged there as *"a real
deviation from **authored deck intent**."* Open for both systems: does a bounded
retry/mastery loop belong on the roadmap?

### E. Teaching attached to the step vs the scenario

v4 groups `teaching_points` at content level by subject; UX Universal ties the
teaching line to its step. The grouping forced the label-matching seam in
`scenario-v4-runtime.js` (§6), which silently misses if topics are regrouped by
subject — the grouping the spec prefers. Resolutions: a per-phase link field, or
`debrief.key_points` as the per-step carrier.

### E2. `narrative` placement — RESOLVED 2026-08-17

POC V4 keeps one `narrative` as both coach ground truth and learner-facing text
(§4.1). Our prompt template spliced `framing` mid-sentence; feeding `narrative`
into that slot produced *"You facilitate You saw it happen."* on every scenario —
visible only in compiled prompts, not field diffs. Resolution: the compiler
leaves `framing` empty and renders `narrative` as a labeled situation block,
matching the POC V4 coach template. Verified by `prompt-diff.js`.

### A2. Button labels

Measured across the 11 scenarios: 63 labels, 27 distinct. The two slots behave
differently, which is why D8 treats them differently:

| Slot | Authored | Distinct | Reading |
|---|---|---|---|
| practice → debrief | 29 | **7** — 23 of them `"Talk it through"` | The button always does the same thing. **Drift.** |
| debrief → next step | 29 | **17** — `"Sit down with Bianca"`, `"Find Marco"` | These name what happens next. **Design.** |
| opening | 5 | 4 | Thin sample. |

`"Begin practicing"` is used as both an opening and a debrief label — a
collision. A house convention for the practice button would resolve it; the
punch list flags the sibling problem (*"Last-debrief transition text splits 3-3
across the family… SME/LED to pick the house convention"*).

### G. Generalizing the typed-output pattern

In UX Universal a custom interaction is a surface plugin: it registers into
`SimSurfaces` keyed by phase kind, owns the whole activity, and the engine
consumes typed outputs (`turn.spotted`, completion) through one seam
(`ctx.coverageBlock`). Shipped proof: scene-sweep's photo canvas (V1) and the
text-observation log (V2) are two surfaces over the same scenario and output
contract, swapped by URL flag; teach-back landed the same way (`ownsInput`).

POC V4's `[[spotted:]]` contract is the same idea — the engine strips the
marker, validates ids, *"the player's meter and scorecard read only this"* — but
exists for `observe_react` only. Its growth rule covers the format side of a new
interaction; the docs state no engine-side equivalent. Hence teach-back is
inexpressible: the one output contract requires `observe_react`'s `exhibit`.

**Proposal:** a mode-agnostic credited-items output contract, and a pluggable
interaction surface to match the format's `oneOf`.

### H. Extension mechanism

POC V4 documents no extension mechanism, no must-ignore semantics, and no
deprecation policy beyond `^4\.` version dispatch; the spec's position is *"a
field not in this spec is a load error, not an extension point."* Two proposals,
deliberately separable — if loading a field required implementing it first,
every extension would block:

**Proposal 1 — must-ignore extension envelopes.** Keep
`additionalProperties:false` everywhere except one `extensions` container on
`content` and on each `practice`, holding namespaced keys
(`vector:answer_shape`), under the rule: an engine MUST load what it does not
implement and MUST ignore it (the xAPI/FHIR pattern). Typo-catching survives —
`final_wrod` still fails. Measured on marshall with the 5 extension values:
flat fields → 4 scattered rejections; enveloped → rejections at one key kind.
`ScenarioV4.foldExtensions()` emits this shape; the Dev handoff panel downloads
it as `<id>.proposed.lo.json`.

**Proposal 2 — per-extension behavioral contracts.** The `EXTENSIONS` registry
carries why each field exists and what ignoring it costs; the UX Universal
player carries the testable behavior (crisis floor off `elevated_stakes`,
hedge-vs-land off `answer_shape`). Adoption is per-extension: the field loads
immediately and behaves identically once implemented, because the reference
implementation is runnable.

Until Proposal 1 lands, the Dev handoff export keeps both profiles — strip
(loads today, losses stated) and fold (the proposal). Internal authoring stays
flat; folding is an export projection.

### F. Smaller items

- **Mandatory third tier.** Most of our beats author two; v4 requires three; the
  POC ports *"synthesized"* the missing one. Allow a partial scale (as the
  opening's `levels` already is), or every author invents a middle.
- **`help_turns` defaults on.** `DEFAULT_HELP_TURNS = 2` (`lo_loader.py:426`);
  the POC audit wrote `0` everywhere because *"no deck contemplates it."*
- **`spot_target` gating is unimplemented** in the POC engine (its audit); UX
  Universal's observe surfaces do gate on coverage. Confirm intended behavior
  before either implementation is treated as the reference.
- **teach-back maxTurns 99.** v4 derives the cap by summing budgets, so an
  uncapped retrieval loop produces a nonsensical cap — a symptom of retrieval
  having no mode (§4).

---

## 8. Open questions — UX Universal side

1. **`branching-arc` is live-only**, dropped from the Studio registry in July.
   Template again, or stay live-only?
2. **teach-back** — inexpressible in v4 (§4). Non-v4 local type, or propose a
   fourth mode (§7-G)?
3. **`hazmat_scene_3.mp4`** — fix the missing video or drop the reference.
