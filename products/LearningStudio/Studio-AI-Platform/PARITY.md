# Scenario surface — feature parity against the reference editor

> **Audited 2026-09-20** against `products/aithera/scenario-simulator/`
> (READ-ONLY reference — nothing in that folder is modified).
>
> **Why this audit matters.** The reference editor produces real JSON that drives
> a real player session. It is therefore the best available estimate of *the
> depth of creation a deliverable scenario actually requires* — not a design
> opinion, a working contract. Anything it authors that this surface cannot is a
> gap between "demonstrates the idea" and "could produce a deliverable".

---

## Headline

**Roughly 45% of the authoring surface, and the missing 55% is not evenly
distributed.** What is built is built properly — the sequence model, coverage,
the rehearsal loop, and full CRUD on every collection it exposes. What is
missing is concentrated in one place: **the two non-default practice modes are
labels with no fields behind them.**

| | Reference | Here |
|---|---|---|
| Distinct authorable fields | **66** | ~22 |
| Practice modes with their own shape | **3** | **1** |
| Validation rules | **32** schema + loader rules | 9 blockers |
| Scenario-level sections | 8 | 5 stages |
| Produces a loadable document | **yes** | no |

---

## The one gap that matters most

**A mode is a different SHAPE, not a different label.** This is the single
biggest divergence, and it is invisible in the current build because the seeded
scenario's modes are cosmetic.

| Mode | What the reference requires | Here |
|---|---|---|
| `coach_inquiry` | `opening_messages`, `levels`, `conditional_probes`, `help_turns` | opening + levels ✓ |
| `roleplay` | `setting`, **`partner_label`**, **`character_id`**, `emotion_hint`, `opening_messages`, levels **with `progression`**, `help_turns` | **nothing mode-specific** |
| `observe_react` | **`exhibit`** (`type` image/video, `src`, `alt`, `facts`), **`rubric[]`** (`id`, `name`, `standard_term`, `nudge`), **`spot_target`**, **`brief[]`** | **nothing mode-specific** |

So today, switching a step to *Observe & react* changes an icon. In the
reference it changes what you must author entirely: you attach an exhibit, write
a rubric of the things a learner should spot, and set how many of them count as
success. That is a different authoring task, not a different label.

**`progression`** is the other mode-specific field worth naming: legal *only*
inside a roleplay's levels, because only a scene has something to resolve. It is
how the author says the scene MOVES when the learner handles it well — the thing
that makes a roleplay a scene rather than a quiz.

---

## Field-by-field

### Present and honest

- **Step spine** — `id`, `label`, `purpose`, `mode`, exit turns, opening
- **Calibration** — `look_for` / `response` / `example` per level, poles
  required and middle optional, with the reference's own reasoning
- **Debrief** — `label`, `key_points`, `follow_up_turns`, `probe`, `final_word`,
  and the delivery-only rule (`follow_up_turns: 0` forbids a probe)
- **Carryover** — bound by id, add/remove, repaired on delete and on reorder
- **Cast** — `id`, `name`, `role`, `behavior`
- **World** — `setting`
- **Closing** — summary + components (the reference's `ideal_response`)
- **Coach persona** — with the project/activity split this platform adds

### Absent

| Field | What it is | Cost of not having it |
|---|---|---|
| `exhibit`, `rubric`, `spot_target`, `brief` | the entire observe_react shape | that mode cannot be authored at all |
| `partner_label`, `character_id`, `emotion_hint`, `progression` | the roleplay shape | a roleplay has no partner and cannot progress |
| `opening_messages[]` | opening is an **array** of messages, each with an optional `character_id` and `emotion` | a scenario opens with one flat line, never a short exchange |
| `canon` / `canon_facts` | facts true of the world, with `reveal_when` | the coach has no world facts to draw on or withhold |
| `teaching_points` | topic + points, debrief-scoped | ours are point REFERENCES — deliberate, see below |
| `misconceptions` | wrong beliefs worth correcting, with a redirect | a real authoring surface for a real pedagogy need |
| `tone_guidelines` | how the coach sounds | partially covered by the persona |
| `narrative` | the framing the learner reads first | no slot |
| `opening` (scenario-level) | an ungraded warm-up before the phases | no slot — ours starts at step 1 |
| `conditional_probes` | probe only if required concepts are missing | no slot |
| `help_turns` | how much help before moving on | no slot |
| `source_references` | external authority (an OSHA clause) on the close | no slot; matters for a Compliance goal |
| `implementation_id`, `schema_version`, `modality` | document identity | no slot; needed to be loadable |
| `input_placeholder`, `jot_placeholder`, `transition.button_label`, `landing_cta_label` | learner-facing microcopy | small individually, real in aggregate |

---

## Validation

The reference validates in two layers, and both matter:

1. **Schema** — `additionalProperties: false` in 37 places, required-field
   checks, enum checks. An unknown field fails the load.
2. **Loader cross-field rules (§9.1)** — numbered, with reasons. Rule 3:
   carryover names an earlier phase. Rule 4: a roleplay `character_id` must name
   a declared character. Rule 5: `progression` only in roleplay. Rule 6:
   `spot_target` within the rubric, rubric ids unique. Rule 7: a probe needs
   somewhere to be answered.
3. **Prompt-smell lint (§9.2)** — rejects authored strings that talk about the
   AI or the interface. *"Guidance like 'CALIBRATION ONLY, do not evaluate' is a
   load error in v4, not a style preference."*

**Here: 9 blockers**, all shape-level (missing exit gate, missing pole, broken
carryover, a debrief that waits but asks nothing, a point below its required
depth). The cross-field rules that have equivalents are honoured — carryover
direction is enforced on reorder and repaired on delete. The **prompt-smell lint
has no equivalent**, and it is the one an AI-first platform arguably needs more
than they do, since more of the text is generated.

---

## Where this surface is AHEAD

Not a smaller version of the reference — a different thing in four respects, all
of which are the platform's argument:

1. **Coverage is a real join.** The reference has no concept of an information
   point; its `teaching_points` are inline strings matched to a step by
   comparing the step's label to a topic name, which its own validator flags as
   fragile. Ours reference points that live above the activity, carrying depth,
   provenance and a pinned version — so a point change is visible everywhere it
   is used. *This is the id-join v4 has no slot for.*
2. **Rehearsal.** The reference has a Playtest tab; it has no surface where you
   type a learner answer, watch which calibration level catches it, reroll to
   see the spread, and pin a good draw into the format's own `example` field.
3. **The assistant is modelled.** One presence per project, cast per activity
   (D27–D29), rather than a persona invented per document.
4. **Threshold validation.** Depth, goal rules and drift — the output-level
   question the reference cannot ask because a standalone document has no
   project to be validated against.

---

## What parity would actually take

In the order that buys the most:

1. **Mode-specific interaction shapes** — roleplay and observe_react. This is
   the difference between three modes and one, and it is most of the missing
   depth.
2. **`opening_messages` as an array**, with `character_id` — lets a scenario open
   as an exchange, and connects the cast to the steps.
3. **Canon facts and misconceptions** — both are real authoring surfaces for
   things the coach needs and neither has any slot today.
4. **The scenario-level opening** (ungraded warm-up) and `narrative`.
5. **Document identity + an export** — `implementation_id`, `schema_version`,
   and a projection that produces something a player could load. Until this
   exists, "produces a deliverable scenario" is untested.
6. **A prompt-smell lint**, adapted — more valuable here than there.

Items 1–2 would take this from *demonstrating the idea* to *plausibly
authoring a deliverable*. Items 5–6 are what "deliverable" actually means.
