# Studio AI Platform

Exploration mock for an AI-first authoring platform: a chat layer that drives a
content canvas, over a deeper manual editing surface.

**Open `index.html` directly in a browser.** No build, no server.

---

## If you are picking this up cold

Read in this order:

| File | What it holds |
|---|---|
| **`MODEL.md`** | The content architecture and the **reasoning** behind it. Start here. |
| **`DECISIONS.md`** | What was decided, what was rejected, and why. Read before re-proposing anything. |
| **`OPEN-QUESTIONS.md`** | What's unresolved, and what each would change. |
| **`MODALITIES.md`** | **Active work.** Per-modality authoring surfaces — a multi-session effort with its own status table. Read if you're working on any modality. |
| `PARITY.md` | Scenario surface vs. the Scenario Simulator, field by field. Read before claiming the scenario surface could produce a deliverable. |
| `index.html` | The implementation. |

> **Working on a modality authoring surface?** `MODALITIES.md` is the
> continuity file for that effort — it carries the shared workflow every
> modality must honour, the questions each discussion has to answer, and a
> status table. Record decisions there **as they are made**, not at the end;
> that work is expected to span sessions.

The git log is also a real changelog — commit bodies carry rationale.

---

## Status

Exploration. Not engineering-committed, not dev-ready.

**Deliberately built without** the Design Toolbox or the version loader — see
`DECISIONS.md` D9. This is a permitted choice under the repo conventions, not an
oversight.

**V1 starts at "1":** the information set arrives already sourced and verified.
The 0→1 sourcing workflow is a later pass (D7).

---

## Where this stands — 2026-09-20

The **information layer, activity layer and outputs** are all modelled and
demonstrable, with depth/goal validation live. **Two modalities have substantial
authoring surfaces** — video and scenario. Four are undesigned.

**Video** — the playhead demonstrates the word-anchored sync model and dragging a
clip authors it. One real hole remains: anchors persist as word *indices*, so
editing narration above an overlay shifts it onto different words
(`MODALITIES.md`, *Left undone on video*).

**Scenario** — a six-stage spine (Framing, World, Coverage, Interaction, Coach,
Close), full add/remove/reorder on every collection, all three practice modes
with their own field shapes, a **live rehearsal** you author against, **beats**
that make a coverage claim over generated content checkable, and an export that
reports what it cannot carry. Audited against the reference editor in
`PARITY.md`.

**The model gained a lot this session:** the AI assistant as a modelled entity
(D27–D29), manual locks (D32), the point library (D34), approval staleness
(D41), beats (D42, D46), and Experience reachability (D47). `DECISIONS.md` runs
to D47; `OPEN-QUESTIONS.md` has 17 of 20 closed, with the remaining three all
blocked on deliberately-unbuilt work.

See `MODALITIES.md` for per-modality status and `PARITY.md` for how the scenario
surface compares to the production reference.

## What works in the prototype

- Three layers, switched from the left icon rail: Information Set → Learning
  Activities → Outputs
- Node selection with a glow; a second click targets a sub-range for prompting
- Targeted prompting with staged progress; node status survives a canvas repaint
- Comment drawer with excerpt snapshots and change markers, at two levels
- Transmute — generate a new modality against the same information points
- Threshold check on each output, with a **goal toggle** in the top bar that
  visibly changes the verdict on identical content
- Manual-editor view swap (stub destination)
- **Video authoring** — open an activity from the Activities layer: sequence
  rail with scenes and checks as siblings, centre-stage canvas compositing
  background and word-anchored on-screen text, a word playhead you can scrub or
  play, editable narration with pronunciation tokens, per-scene audio and voice,
  and activity settings governing check delivery
- **Sequence reordering** — drag any scene or check to a new position. A scene
  carries the checks bound to it (D26); a check may not be dragged before the
  scene whose language it tests, and the drop is refused with its reason (D25)
- **Overlay re-anchoring** — drag a clip to slide it, or either edge to change
  where it starts or ends. Commits word indices, never pixels — though an index
  is still a position, so narration edits above an anchor move it (see
  `MODALITIES.md`)
- **Scenario authoring** — a six-stage spine in a collapsible rail, with every
  collection add/remove/reorderable (steps, characters, calibration levels,
  key points, carryover, coverage, expert-answer components)
- **All three practice modes with their own field shapes** — a coach inquiry
  opens with messages; a roleplay adds a scene, a partner picked from the cast
  and levels carrying a scene *progression*; an observe-and-react adds an
  exhibit, a rubric of what to spot and a spot target. Retyping a step reshapes
  it and says what it dropped
- **Live rehearsal** — play as the learner, watch which calibration level
  catches your answer, **reroll** to see the spread a guideline actually
  produces, and pin a good draw as that level's example. Verbatim content
  updates live; generated content rerolls (D33)
- **Beats** — a coverage claim over generated content names the step that
  guarantees it, so "covered" becomes "covered and unskippable" (D42)
- **Point library** — import a point another project already authored; the copy
  is this project's own (D34)
- **Experience reachability** — the map marks which activities every learner
  meets, names the points a learner can skip, and offers a one-click *require*
  (D47)
- **Export** — a preview of the projected document that reports what the
  projection cannot carry, rather than pretending the loss away

Everything is in-memory. Reload resets. **That is a prototype limitation, not
the model** — the platform is a design surface with its own version control,
interim saves, drafts and collaboration, and a dedicated publish pipeline owns
detailed versioning and gates anything reaching live services (D31).

## What is not built

- **Information authoring** — no way to write a point from scratch (deferred,
  D7). Importing one from the library works; authoring one does not.
- **Four modalities** — podcast, knowledge check, job aid, reflection.
- **Compose** — replies in chat; no arrangement surface.
- **Locks** (D32) — decided in full, implemented nowhere. A `.sai-fld-txt.locked`
  style exists and nothing applies it; that is the whole of it.
- **The learner preview** (D44) — a button that says where it would go.
- **Persistence** — in-memory by design here; the pipeline owns it (D31).

`OPEN-QUESTIONS.md` has the three remaining questions, all blocked on the above.

---

## Picking up the visual pass

A second visual pass ran **2026-09-20**; details in `MODALITIES.md` under
*Measure, the parts the first pass missed* and *The third collision*.

**Measure the block, not a line.** Every reading width in these documents is an
average of characters per line over a whole block. Sampling one rendered line
reports the *longest* line and overstates by 20–40%, which is how the last pass
briefly capped things that were fine. Comfortable range is 45–75.

Current state, all measured:

| Surface | chars/line |
|---|---|
| Point document | 75 |
| Card note, one-column stage | 71 |
| Field, one-column stage | 49 |
| Interaction editor | 35 |
| Rehearsal bubble | 24 |

The Interaction editor and rehearsal bubble read **low**, not high — they are
the two-column stage and were left alone this pass. If anything wants attention
next, it is those two, and the fix is width, not type size.

**`.sai-` class collisions have now bitten three times** — `.sai-sub` (the
sub-range prompt target), `.sai-turn` / `.sai-bubble` (the chat rail's), and
`.sai-ph`, where the video pronunciation token was inheriting the scenario
phase-rail button and rendering as a full-width flex row inside a sentence.
That third one broke a *mechanism*, not a measurement, and had been visible in
every screenshot since the scenario rail landed. **Check for an existing rule
before naming a new one** — and state `display` explicitly on an inline token.

**Coverage and Close are no longer the thinnest stages.** That note was stale:
Coverage carries the id-join notice, per-point depth controls, beats, approval
staleness and misconceptions; Close carries the verbatim summary, the expert
answer, source references and the export. Both are substantial. If a stage
wants work now it is **Framing**, which is three cards and a read-only
document id.
