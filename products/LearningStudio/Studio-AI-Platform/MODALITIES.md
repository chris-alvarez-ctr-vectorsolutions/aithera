# Modality Authoring — working file

> **This file is the continuity mechanism for a multi-session body of work.**
>
> Each modality (video, podcast, scenario, knowledge check, job aid, …) needs
> its own authoring surface. Each will take a real design discussion. Those
> discussions will span Claude sessions and lose chat context, so **decisions
> land here as they are made** — not at the end.
>
> **If you are picking this up cold:** read `MODEL.md` first (the content
> architecture), then this file's *Shared workflow* section, then the section
> for whichever modality you are working on. Check the status table before
> assuming anything is settled.

---

## Status

| Modality | Surface designed? | Built? | Session notes |
|---|---|---|---|
| Video | **yes** | **substantially built** | Working surface. One real hole: anchors persist as word *indices*, so narration edits desync them — see *Left undone* |
| Podcast | no | no | — |
| Scenario | **yes** | **substantially built** | Six-stage spine, full CRUD, all three practice modes with their own shapes, live rehearsal, beats, a lossy export. See `PARITY.md` |
| Knowledge check | no | no | — |
| Job aid | no | no | — |
| Reflection | no | no | — |

The framework below is what every modality discussion must resolve, so the
answers stay comparable across sessions.

---

## The governing principle

> *"A common platform interaction that is unique by the modality it's creating,
> but ultimately a shared workflow."* — 2026-09-18

One workflow. The **shell, navigation, coverage panel, depth editing, comments
and prompt-targeting are identical everywhere.** Only the *body* — the thing
being authored — differs by modality.

This is the content-agnostic registration seam the model has claimed since the
node design (`MODEL.md`, "Node addressing"): the canvas dispatches a renderer
per type and asks the node what may be done to it. Modality authoring is the
first place that seam does real work rather than being asserted.

---

## Shared workflow — identical for every modality

Settled. A modality discussion does **not** get to redesign these.

| Element | Behaviour |
|---|---|
| **Shell** | Same header, back-nav and layout as the point document — title, meta row, version, provenance |
| **Editing** | Direct (type into the surface) **and** by targeted prompt. Both route through the same node / sub-target model |
| **Coverage panel** | Lists the information points this activity covers, each with its depth and tag provenance |
| **Depth editing** | LED sets and adjusts depth here. **LED-side only** — SME confirmation is shown as state, never performed in-platform (SMEs are external bookends, D8) |
| **Comments** | Activity-level — production feedback, retires with the activity (`MODEL.md`) |
| **Drift** | Pinned point version and any drift severity surface here |
| **Locks** | Any node or field may be **locked** (D32). A locked target refuses all writes — the AI's and the author's — until unlocked. A request that spans a lock reports and asks, never silently works around it |

### ~~Per-section traceability~~ → **activity-level tagging** — revised 2026-09-18, rejustified 2026-09-18

**Superseded the same day it was proposed**, and the *reason* was corrected later
the same day. Both steps are recorded because the first reason turned out to be
wrong, and a reader who saw only the conclusion would re-derive the wrong basis
for it.

**The original reason — withdrawn.** Per-section traceability was dropped on the
grounds that *"a Learning Object runs 2–5 minutes and typically covers one main
teaching point, so the activity is already the granularity."* That premise does
not hold. Per the user (2026-09-18): *"A scenario length is driven by its author.
This could be a quick couple phases with a few turns each or a deep set of
phases, turns and decisions."* Length and scope are a **design decision, not a
property of the format** — and `MODEL.md` already says a scenario may carry the
whole information set.

**The reason that actually holds — the tagging contract.** A coverage tag is a
claim that this activity **satisfies a point to a depth**. That claim is
well-formed regardless of how long the activity runs: a deep scenario simply
carries several tags at several depths, which the many-to-many model has allowed
since D11.

```js
activity.covers = {
  'info-3': { depth: 'working',   state: 'confirmed', at: 2 },
  'info-4': { depth: 'mastery',   state: 'adjusted',  at: 1 },
  'info-6': { depth: 'awareness', state: 'proposed',  at: 1 }
}
```

Nothing about that needs a length. What per-section traceability would add is
**where inside the body** each point is covered — and that is the part still
judged not worth inventing: it would invite tagging incidental mentions as
coverage, which is the dilution the depth scale exists to prevent.

**So: coverage tags at ACTIVITY level.** No section unit, no span tagging, no
named beats.

**The hierarchy, corrected:**

```
Learning Object  =  Learning Activity   — one or more points, author-sized
Course           =  Output              — composed of one or more activities
```

An activity may equal an output on its own, or several may stack into one. Per
the user: *"This is the designer's environment to control and explore based on
the needs of the project to be successful."* The model supplies the validation,
not the sizing.

**What this costs:** coverage counts are no longer legible by arithmetic — an
output covering six points might be one deep scenario or six short activities,
and "6 points / 1 activity" is no longer suspicious on its face. The threshold
check is unaffected, since it reads depths rather than counts.

> **Left open by this:** a long activity claiming many points at many depths is
> harder for a reviewer or an SME to falsify than a short one making a single
> claim. Activity-level tagging is settled; whether a *long* body needs its
> coverage located internally is a question the scenario body design may force.
> Tracked in `OPEN-QUESTIONS.md`.

---

## What each modality discussion must resolve

Answer all of these, in the modality's own section below, so surfaces stay
comparable.

1. **What is the body made of?** The repeating unit — segment, dialogue turn,
   decision node, item — and what fields each carries.
2. **What is the section unit for traceability?** Which unit tags to points.
3. **Is it a sequence, a tree, or a set?** Determines the editing model.
4. ~~**What is generated vs. hand-authored?** And what does regeneration
   preserve?~~ **Answered once, platform-wide — D30.** Both, always, scoped by
   the author's request and by what is walled off. A modality section should
   note only what it specifically guards, not re-answer this.
5. **What can a targeted prompt address?** A whole unit, a field within one?
6. **What does "done" look like?** Any modality-specific completeness signal.
7. **Which depths can it credibly reach?** Guidance only — *format never
   determines depth* (D15); a scenario-based check can assess as validly as a
   simulation.

---

## Prior art to fold in

**Phase 2 already runs a video-with-integrated-assessment authoring flow.** It
is the closest existing thing to what the video modality needs, and the video
discussion should start by reviewing it rather than designing from scratch.

- `products/LearningStudio/Phase2/objectManager.html` — the deep authoring
  surface (scenes, media, voice, assessment integration)
- `products/LearningStudio/Phase2/courseOverview.html` — the course-level view

**Caveat:** fold in the *authoring flow*, not the information architecture.
Phase 2's IA is the linear course pipeline this platform is designed past
(D1) — take the interaction patterns, leave the structure.

---

## Modality sections

*Each gets filled in by its own discussion. Do not pre-empt them here.*

### Video
**Status:** designed 2026-09-18, building.

**1. Body unit — the SCENE.** A production chunk; the activity is author-sized
(see the rejustification above), so the scene count follows the content. Carries
narration (as phonetic-aware tokens), background media, on-screen text overlays,
duration, and status. **No title** — a scene is identified by what it carries,
not by its position. *"A scene should own its coverage, not the reverse"* — so
nothing external references a scene by ordinal, and reordering repairs nothing.

**2. Section unit for traceability — NONE.** Coverage tags at activity level
(see the revised decision above).

**3. Sequence.**

**4. Generated vs. hand-authored.** Narration is AI-drafted then hand-edited;
media is AI-generated / uploaded / stock; audio is TTS per scene. Phonetic
pronunciation survives narration edits (token model, carried forward).

**5. Prompt targets** — a scene, or the narration within it.

**6. Done** — a render gate with human-readable blockers, carried forward from
Phase 2: *"3 scenes are not marked Ready"*, *"2 scenes are missing background
media"*. Shown in a popover, never a dead button.

**7. Depths** — commonly Awareness/Working; Mastery only where a check earns it.
Format never determines depth (D15).

#### Narration is the spine

On-screen text anchors to **words in the narration**, not to seconds. Phase 2
already has the mechanism — a caption-scale ruler rendering one tick per word,
with `getWordSnapPoints()` making word boundaries the snap targets, so an
overlay starts *on the word "derated"* rather than at 3.2s.

**Improvement over Phase 2:** its `clipState` persists `{left, width}` as
percentages, so snapping is a drag-time convenience only — edit the narration
and the overlay silently desyncs. Here the anchor persists as a **word
reference**. Same principle as comment anchors and point pinning: bind to
identity, not position.

Why this matters (user): on-screen text drifting out of sync with spoken
narration is a quality failure in the legacy video format, so timing is
load-bearing rather than polish.

#### Checks

- **Bound at SCENE level** — a check knows which scene's language it came from.
  Word-level anchoring is not needed yet.
- **Placed independently** — inline between scenes, or compiled at the end.
  Binding and placement are separate properties, which is what lets the same
  check serve either delivery pattern without re-authoring.
- Phase 2 hid the video canvas to author questions; here they live in the scene
  flow, since a check must stay synced to the language it tests.

#### The canvas — centre-stage, accurate, scrubbable

**This is a video editor at its core**, folded into the platform chrome: canvas
centre, scenes as a left rail, coverage panel right.

The canvas **composites accurately** — background, positioned overlays and their
enter transitions are real DOM layers, so what you see is what the composition
is. This exists for **QA of AI-generated content**: someone has to look at the
frame and judge it, and an AI-first platform needs that more than a hand-built
one, not less.

**Scrubbing is driven by the word playhead.** Click any word, or play through —
on-screen text appears exactly at its anchored words. That is what makes word
anchoring legible rather than something taken on trust.

> **A known constraint, deliberately designed past.** True frame-accurate
> scrubbing of *rendered* output would need constant third-party render calls;
> there is no internal mechanism for compositing transitions, on-screen text and
> media into frames. The prototype is **not** limited to that constraint — per
> the user: *"This is exploration of the future of this product. If the quality
> output requires new rendering mechanisms, I want to highlight the output
> quality that asks for that update."*
>
> So the canvas composites live in the browser, faithfully, and carries a
> **"preview composite · not the render"** badge. It is honest about what it is
> while making the case for the rendering capability the product wants.

#### Scene cards are a working surface, not a nav list

The rail is the **companion to the canvas**, not an index beside it — you edit
in the card and watch the canvas react. Phase 2's cards carried real capability
(inline contenteditable transcript, voice picker, generate/regenerate lifecycle,
status, duration, kebab, drag-reorder) and that is carried forward rather than
reduced to a title stub with narration stacked under the canvas.

**Accordion**, as Phase 2 had it: the open card is the scene the canvas shows,
so editing and preview stay in step by construction.

**Trade accepted:** a working card needs ~360px, which takes width back from the
canvas (872px → 747px at a 1600px viewport). Worth it — narration is the most
edited thing on the surface and belongs beside the canvas, not below it. The
rail is **drag-resizable** (260–620px) since narration length varies.

**Beyond Phase 2:** the card lists what is on the scene — each overlay with its
word anchor (`w5–29`) and the background media — and clicking an overlay jumps
the playhead so the canvas shows it. Phase 2 had no such manifest; overlays were
discoverable only on the timeline.

#### Card actions

All four card actions are live, as popovers anchored beside the rail so the
canvas stays visible while you work:

- **Voice** — five voices, per scene or applied across the activity. Changing a
  voice invalidates that scene's audio, since the existing take no longer
  matches.
- **Media** — stock / generate / upload as tabs in one popover. Phase 2 used
  three separate modals that all converged on "Apply to Scene"; tabs keep the
  canvas in view while choosing.
- **Add text** — anchors to the words where the playhead sits, and **auto-places
  to avoid a position already occupied** while it is on screen. Overlapping
  overlays are a real defect, so any that remain are outlined on the canvas with
  a count.
- **Scene actions** — regenerate narration, duplicate, move up/down, delete.
  Deleting a scene removes the checks bound to it, since a check bound to
  language that no longer exists is orphaned. Reordering repairs nothing, because
  nothing references a scene by ordinal.

**Column contexts follow Phase 2's division of labour:** the rail owns
**narration and audio** (editable transcript, voice, generate/regenerate,
waveform); the canvas column owns **visuals** (background, on-screen text, and
a layer strip showing what is composited with each overlay's word anchor).
Actions sit with the thing they change.

**Pronunciation** is authored by selecting a word in the narration. Stored as a
token keyed on the word, so it survives narration edits — Phase 2's whole-field
phonetic textarea reset on every keystroke, which is why that approach was
abandoned there across three iterations. Setting one invalidates the scene's
audio, since the existing take no longer matches.

**Rail/canvas split** is drag-resizable (280–640px), stored on `:root` so it
survives re-renders, with double-click to reset.

Built: word ruler with playhead, words/time toggle, transport, accurate
positioned compositing, overlapping anchors in separate timeline lanes,
full-capability scene cards, all four card actions, resizable split, the
sequence rail with checks as siblings, the check editor with its source-language
panel, activity settings, **drag-to-reorder the sequence**, and **drag-to-
re-anchor an overlay**.

#### Re-anchoring — the authoring half of the sync model — 2026-09-18

The playhead *demonstrated* that on-screen text binds to words; this is where an
LED **sets** that binding. Drag the clip body to slide the whole span (its length
is preserved); drag either edge to move one end.

**What is committed is a pair of word indices, never a pixel offset.** That is
the entire point of the mechanism — Phase 2 persisted `{left, width}` as
percentages, so snapping was a drag-time convenience and an overlay silently
desynced the moment narration was edited. Here snapping is not laid over a
continuous value: **the value is discrete.** Word positions are read from the
rendered ruler, which makes word boundaries the only reachable positions —
Phase 2's `getWordSnapPoints()`, arrived at from the data side rather than the
interaction side.

While dragging, the words the clip will span light up on the ruler, so the edit
is legible against the narration rather than against the track. On release the
playhead parks on the new start word, so the canvas shows the result of the
edit rather than whatever frame you were on.

**Both drags auto-scroll their container.** Narration routinely overflows the
track and a long sequence overflows the canvas, so without this you could only
re-anchor to words — or drop into gaps — that happened to be on screen when the
drag began, which is useless for exactly the long content that most needs
re-timing. Dragging near either edge scrolls, the way a text selection scrolls a
document.

#### Reordering — what it is allowed to do — 2026-09-18

Scenes and checks are siblings in one ordered list, so one drag handles both.
The insert bars double as drop zones: they already sit between every pair of
items, so there is nothing to interleave.

Reordering repairs nothing and breaks nothing — no scene is referenced by
ordinal, and a check binds to a scene **id**, not a position. Order is delivery
order and only that.

Two rules, both recorded as decisions because they are the kind a later session
would plausibly undo:

- **A check may not be delivered before the scene it tests** — refused at the
  drop zone with its reason, not flagged (**D25**). The first hard gate in the
  prototype; the reasoning for diverging from *flag, don't gate* is in that
  entry.
- **A scene moves with the checks bound to it** (**D26**), which makes that
  invalid state unreachable rather than defended at two gates.

#### Left undone on video

Updated 2026-09-18, after reorder and re-anchoring landed.

##### The one that matters — the anchor is still an INDEX, not an identity

**This is a hole in the central claim of the video modality, not a stub.**

The design says on-screen text binds to *words* rather than seconds, so it
survives narration edits — and says so explicitly as the improvement over Phase
2, whose percentage-based `clipState` silently desynced. What is built persists
`{anchorFrom, anchorTo}` as **word indices**. An index is a position. Editing
narration *above* an anchor shifts every downstream anchor onto different words.

Demonstrated in the browser against the seeded scene:

```
anchor before : words 7–11 = "completes a documented pre-shift inspection."
insert three words at the start of the narration
anchor after  : words 7–11 = "begins, the operator completes a"
```

The index is unchanged and the words are not. The overlay now appears over
different spoken language than it was authored against — the exact failure the
word-anchoring design exists to prevent.

There is a clamp on narration blur, but it only stops anchors dangling past the
new end (`Math.min(anchor, n - 1)`); it does not follow the words. So the model
currently degrades to Phase 2's behaviour under the one edit that matters, while
the surface *presents* as word-bound.

**What closing it needs** — the same move made everywhere else in this model
(comment excerpts, pinned point versions): bind to identity, not position. Give
each narration word a stable token id at parse time, anchor to those ids, and
resolve id → current index at render. A word whose id no longer exists is a
deleted anchor point, which is a real editorial event the surface should show
rather than silently absorb.

**Until it is closed, do not cite word-anchoring as demonstrated.** Dragging a
clip authors a correct anchor; narration editing then breaks it.

##### Genuine stubs, in rough order of value

- **Scene duplication of checks.** Duplicating a scene copies its overlays but
  not the checks bound to it; the copy has no checks. *(Now inconsistent with
  reorder, which does carry bound checks — D26. The smallest real gap.)*
- **"Regenerate narration"** in the scene kebab toasts rather than doing
  anything. Note it would also need an answer to the anchor question above:
  regenerating narration invalidates every overlay anchor in that scene.
- **Upload** in the media picker is a drop-zone that accepts nothing.
- **Render** produces no output — the gate evaluates correctly but the button
  does not start anything.
- **Pronunciation keys on the word string**, so a word appearing twice in one
  scene gets the same pronunciation in both places. Usually right, occasionally
  not. *(Falls out of the token model above: key on the token id, not the
  string, and this closes with it.)*
- **Checks have no drift state.** *Checks and assessments are different
  instruments* (below) establishes that a check depends on its activity's
  language, so changing narration should make bound checks suspect. Nothing
  computes or shows that yet.

Skipped: trim handles, per-bullet sub-clips, transition pickers — production
detail that proves nothing new about the model.

##### What IS solid on video

So a later session knows what not to re-litigate: the sequence model (scenes
and checks as siblings, reorder with D25/D26 holding), the compositing canvas,
the scene-card working surface and its four actions, the check editor, activity
settings, and clip re-anchoring **as an authoring gesture**. It is the
*persistence* of the anchor across narration edits that is unfinished.

### Podcast
**Status:** not yet discussed.

### Scenario
**Status:** **designed 2026-09-18–19, not built.** Includes the rehearsal
centre-stage surface (below). Prior art reviewed; authoring
model settled (the LED authors a scenario as an activity, author-sized); four
model-level decisions taken (D27–D30); **all seven framework questions
answered** below. Build questions listed at the end of this section.

#### Prior art — the Scenario Simulator (READ-ONLY reference)

`products/aithera/scenario-simulator/` holds a **working scenario authoring
tool** with a dev handoff, a JSON schema, CI contract checks, and a frozen cut
being iframed into Learning Studio. It is far more developed than anything we
would build here.

> ⚠️ **`products/aithera/` is reference only — never edit, move or commit
> anything inside it.** (User, 2026-09-18.) It is a separate product with live
> downstream consumers. Borrow ideas; cite the path; change nothing.

Orientation: `scenario-simulator/HANDOFF.md`, then
`js/README.writer-studio.md` (the authoring contract) and `js/scenario-v4.js`
(the schema preamble — the three numbered points at the top are the ones that
matter).

##### What it independently confirms

**1. The type-agnostic shell is real, not aspirational.** Its shell talks only
to a registered TYPE's public surface — `sections`, `renderFields`, `lints`,
`compile`, `blank`, `normalize`. Adding a pedagogy is adding a module plus an
include line. `grep -c "type.id ===" js/studio-shell.js` returns **0**.

That is the same registration seam `MODEL.md` claims under *Node addressing*
and that this file says modality authoring is "the first place that seam does
real work." **It is not the first place — this tool already did it**, on a
different axis (pedagogy rather than modality) and at production quality. Worth
reading before we design ours, because the shape of the contract is evidence,
not speculation.

**2. "There is no type field" — the modality is emergent.** From
`scenario-v4.js`:

> *A scenario is not "a branching arc" or "a scene sweep" — it is a list of
> phases, each of which picks a practice `mode` (`coach_inquiry` | `roleplay` |
> `observe_react`). What the scenario* is *emerges from the modes it uses. Our
> eight sim types are presets over this one shape.*

They collapsed **eight named scenario types into one shape plus a per-step
mode**. This is directly relevant to our *sequence / tree / set* question and
arguably to the modality list itself.

**3. A scenario is a SEQUENCE of steps, not a branching tree.** Each step pairs
a *practice* (learner acts) with a *debrief* (coach teaches against that
attempt). Branching is not in the shape. Cross-step dependency is expressed as
**`carryover`** — a later step reads from a named earlier step by **id**, which
is the same bind-to-identity move used throughout our model.

This bears directly on the assumption that scenario is *the* modality that
forces a tree. A real production scenario tool concluded it does not.

**4. They hit our D25/D26 problem and solved it the same way.** Their step
`remove()` prunes carryover references to the deleted step and **reports how
many** rather than silently editing steps the author was not looking at; their
`duplicate()` inserts the copy *directly after its original* so every carryover
it holds still names an earlier step. Same class of problem as a check bound to
a scene, same answer: repair the references and say what you did.

**5. Their steps are a rail-driven section list** — the shell owns the rail,
focus view and ⋯ commands; the type owns what a step *is* and what moving or
deleting one costs. That division of labour is worth copying wholesale.

##### What is deliberately different, and must not be flattened

- **Their author is a content designer filling plain-language fields** that a
  per-type compiler assembles into an LLM system prompt around locked,
  safety-critical sections. Ours is an LED with limited subject knowledge
  working from information points. Different author, different starting
  material.
- **Their scenario carries no prompt text and no teaching-point references.**
  It has its own `teaching_points` inline (topic + points), debrief-scoped.
  Ours would need to *derive* from information points and tag coverage — the
  join our model exists to express and theirs has no reason to.
- **They are moving toward customer authoring** and treat "the author is no
  longer trusted" as the premise (`docs/scenario-simulator-customer-authoring.html`,
  2026-08-31). Not our problem yet, but it is why their prompt layer is
  server-side.

##### How it relates to us — settled 2026-09-18

**User's framing:** *"Their editor is the current authoring workflow. It produces
a standalone output like the current Studio / Phase 2 work produces a course
output. These and others will eventually fold into the platform that we are
working on. So this is reference to what a scenario simulation is for our
organization and within our content library, and how the parameters currently
control our output. This is a similar situation to the Phase 2 editor. Keep what
works, leave behind what needs enhanced/optimized, but support the same core
functionality to produce a similar output."*

So this is **D1 applied a second time.** The Scenario Simulator is a standalone
producer that eventually folds in, exactly as Phase 2 is for video. Same
instruction, same split:

| Take | Leave |
|---|---|
| **What v4 shows a scenario is made of** — the parameters the org already agreed control one | Treating v4 as a **fixed target**; it is a live negotiation, and the engine evolves with the platform |
| The **step spine** (practice → debrief), modes, exit gates, transitions | The assumption that a scenario owns its own teaching points |
| `carryover` as an **id-bound** cross-step dependency | Name-matching a phase label to a teaching-point topic (see below) |
| The type-agnostic shell contract (sections / renderFields / lints / list) | Eight named sim types as a user-facing choice |
| Its repair-and-report behaviour on delete/duplicate | — |

##### What a v4 document is — and what it is NOT to us

**Corrected 2026-09-18.** An earlier draft of this section called v4 "the output
contract we must still be able to produce" and said whatever we design "must
still project to" it. That was too strong, and it was wrong about who owns the
format.

**What it is.** A v4 document is the JSON file the Scenario Simulator's **player
engine** loads. "Scenario CML v4" is a schema owned in a *different* repo
(`VectorLearning/scenario-simulator-poc`); `js/scenario-v4.js` is a **port** of
it so the editor can prove an export will load before anyone hands a file over.

**Why it looks immovable.** v4 sets `additionalProperties: false` at every level
— 37 places. An unknown field does not warn, it fails the load outright. So a
field Vector wants but the schema lacks cannot simply be added to a document.

**Why it is not actually fixed.** Vector does not own v4 and is already pushing
on it, in both directions:

- `practice.answer_shape` is a **declared extension** — a field Vector authors
  that v4 rejects, held in their own source of truth with `stripExtensions()`
  producing a loadable copy, and each entry naming *the proposal being made to
  the dev team* so "the reason a field exists never has to be reconstructed from
  a diff."
- Three content-safety flags were **removed** from the format in August, after
  dev confirmed safety is a product feature rather than per-scenario content —
  "a per-scenario flag was describing a decision nobody gets to make."

So v4 is a **live negotiation with a dev team, not a boundary.** It changes.

**Therefore, for us:** v4 is **evidence, not a requirement.** Its value is that
it is a real, dev-agreed answer to *what parameters control a scenario output
for this organization* — the practice/debrief spine, the exit gates, the three
modes, the assessment poles. Each field is there because someone argued for it.
That is the half of the user's framing worth honouring: *"reference to what a
scenario simulation is for our organization and within our content library."*

**The engine evolves with the platform.** Per the user (2026-09-18): *"As the
platform evolves, the player engine and its capabilities will also evolve."*
This is the same stance already taken on video rendering — the prototype is not
limited to what today's engine can play, and where the design asks for a
capability the engine lacks, that is **the case being made**, not a constraint
to design around.

The discipline that comes with it is the reference tool's own: when we author
something v4 has no slot for, **declare it and say what it is for** — the way
`answer_shape` is declared — rather than either silently inventing a field or
quietly dropping the idea.

##### The parameters v4 tells us control a scenario

Read as evidence of what the organization means by a scenario simulation, not as
a schema to satisfy.

A v4 document requires, at content level:
`title` · `coach_persona` · `teaching_points` · `phases` · `closing`
(plus optional `narrative`, an optional ungraded `opening`).

Each **phase** (a step) requires `id` · `label` · `purpose` · `practice` ·
`debrief`:

- **practice** — `mode` (`coach_inquiry` | `roleplay` | `observe_react`),
  `purpose`, `exit` (a turn gate), `transition`, `interaction` (shape selected
  by mode). Vector extension: `answer_shape` (`determinate` | `open`).
- **debrief** — a first-class turn-owning unit: `label`, `key_points`,
  `follow_up_turns`, `transition`; optionally `probe`, `requirement`,
  `final_word`. `follow_up_turns: 0` is delivery-only and is the default
  posture.
- **assessment levels** — `unthoughtful` / `neutral` / `strong`, where the two
  **poles are required and the middle is optional** (decided 2026-08-18: a
  binary step has no neutral, and requiring one is how their POC "invented
  middle tiers just to satisfy the schema"). Worth remembering when we set our
  own depth/evidence fields — the same trap is available to us.

##### The seam their format leaves open, which is exactly ours

v4 keeps `teaching_points` **at content level, grouped by subject**, and a phase
is joined to one by **string-matching the phase's `label` to a topic name**.
Their own validator flags the fragility (`scenario-v4.js` ~line 838): *"that
match can miss — and a miss means the coach hedges on a graded step with nothing
to state plainly."* It warns rather than fails.

That is a **name-based join standing in for an id-based one** — a real
limitation of a standalone document, since there is no library to point into.
Our model already has the id-based version: information points with stable ids,
coverage tags carrying depth, provenance and a pinned version.

**So the enhancement this platform makes to a scenario is not a new authoring
gesture. It is replacing that string match with the real join** — and getting
coverage, depth, drift and transmute for free. A scenario authored here has
`teaching_points` *projected from* the information points it covers, rather than
retyped alongside them.

That is the concrete version of "keep what works, leave behind what needs
optimizing."

**Be honest about what this is, though:** v4 has **no slot for a point
reference.** Its `teaching_points` are inline strings, and
`additionalProperties: false` means an `info-3`-style id cannot simply be added
to a document. So this is not something we "project into" v4 — projecting *down*
to today's format means **flattening the join back into the strings it was meant
to replace**, and the export loses exactly the thing that made it better.

That makes the id-join a **capability the engine would need to grow**, in the
same class as `practice.answer_shape`: a field Vector authors, declares, and
proposes. It is the clearest example of the design asking the player engine to
evolve — which, per the user, is expected rather than a problem.

It is also the sharpest argument for this platform, so it should be *stated* as
a proposal rather than hidden inside an export that silently degrades.

##### Settled 2026-09-18

**The LED authors a scenario here, as an activity.** Per the user: *"the LED
would author a scenario as an activity same as a learning object from this
platform."* So a scenario is not commissioned-and-routed-out; it is a Learning
Activity with a scenario body, sitting under the same shell, coverage panel and
depth editing as every other modality. The shared workflow applies unchanged.

##### Scenario length is the author's call — the activity/document seam dissolves

I raised a seam here: if an LO were fixed at 2–5 minutes and one point, a
six-phase v4 document would be closer to one of our *outputs* than to one of our
activities, and a scenario activity would have to be a **phase** rather than a
document.

**That seam does not exist.** Per the user (2026-09-18):

> *"A scenario length is driven by its author. This could be a quick couple
> phases with a few turns each or a deep set of phases, turns and decisions. An
> activity could equal an output or multiple could be stacked into a single
> output. This is the designer's environment to control and explore based on the
> needs of the project to be successful."*

So **a scenario activity is a v4 document, at whatever size its author makes
it** — and a v4 document is also what an output projects to when several
scenario activities stack. Both (a) and (b) are legal because the sizing is not
the model's decision. The mapping is:

```
scenario ACTIVITY  → a v4 document, author-sized
                     (a couple of phases, or many)
OUTPUT of several  → a v4 document composed from them
scenario activities  (compose supplies the phase order and carryover)
```

This is consistent with `MODEL.md`'s existing claim that a scenario *may carry
the whole information set* — which was always in tension with a fixed LO size,
and is not any more.

**On the mapping above:** it describes how a scenario here *would* reach today's
player, not a rule the design has to satisfy. The engine evolves with the
platform (see above).

**Consequence for this file:** the shared-workflow section's "2–5 min, one main
point" justification for activity-level tagging was withdrawn and rejustified —
see *Per-section traceability → activity-level tagging* above. The conclusion is
unchanged; the reason is different, and the old one was load-bearing enough to
be worth correcting rather than quietly editing.

**Two further decisions came out of this discussion and are recorded in
`DECISIONS.md`, because they are model-level rather than scenario-level:**

- **D27** — the AI assistant is one contextual presence per project, depicted
  per modality. `coach_persona` is the scenario's depiction of it, projected
  down rather than authored per document.
- **D28** — the assistant holds the points as **context** (derived) and carries
  its own **goal** (authored, walled off) — the D23 point/usage wall applied to
  the assistant.
- **D29** — assistance level is **declared by the activity**; the **output
  validates** it against the goal's evidence rules. The coverage pattern with a
  second dimension.

#### The seven framework questions — answered 2026-09-18

v4 is **input to these answers, not a constraint on them.**

**1. Body unit — the STEP.** A practice paired with a debrief.

- **practice** — the learner acts. Carries a `mode` (`coach_inquiry` |
  `roleplay` | `observe_react`), a `purpose`, an **exit gate** (how many turns
  before it moves on), a transition, and an `interaction` whose shape the mode
  selects.
- **debrief** — the coach teaches *against that attempt*. A first-class
  turn-owning unit, not a footer: `key_points`, `follow_up_turns`, an optional
  `probe` and `final_word`. Delivery-only (`follow_up_turns: 0`) is the default
  posture.

**The step is authored as conditions and responses, not as a script.** Its
assessment carries `look_for` / `response` per level — *what to watch for* and
*how the coach reacts* — rather than dialogue. This is the deepest difference
from video, where the body is language the learner receives verbatim. **A
scenario author writes the rules of a conversation, not the conversation.**

Levels are `unthoughtful` / `neutral` / `strong`, **poles required, middle
optional** — carried over from the reference tool's own decision (2026-08-18),
because a binary step has no neutral and requiring one is how their POC came to
"invent middle tiers just to satisfy the schema."

**2. Section unit for traceability — NONE.** Coverage tags at activity level, as
everywhere. A deep scenario simply carries several tags at several depths.
*(See Q11: verification of a long body is an open question, not a tagging one.)*

**3. A SEQUENCE.** Steps run in order. Cross-step dependency is **`carryover`** —
a later step reads from a named earlier step **by id**, which is the same
bind-to-identity move used for comment anchors, point pinning and overlay
anchors.

Worth stating plainly because it contradicts the assumption that scenario is the
modality that forces a tree: **branching is not in the shape.** A production
scenario format concluded that a scenario is a sequence whose *responses* vary,
not a graph of authored paths — the variation lives in the levels, not in the
structure. Decision points are real; they resolve within a step rather than
forking the arc.

**4. Generated vs. hand-authored — see D30.** Both, always, scoped by the ask.
Nothing scenario-specific to add except what it guards: an SME-confirmed
`look_for` calibration is a judgment, and an edit that invalidates it must say
so (Q12).

**5. Prompt targets — a step, a unit within a step, or a field.** The natural
targets are the step itself, its practice or its debrief, and single fields
(`purpose`, one level's `look_for`, `key_points`). One scenario-specific target
worth having: **a character** — *"make the supervisor less hostile"* should be
addressable, since a character is identity and disposition shared across steps.

**6. Done — a gate with human-readable blockers**, the pattern carried forward
from video. Scenario-specific blockers, all computable from the shape:

- a step whose practice has no exit gate — it never advances
- a graded step with no `strong` calibration — nothing to recognise success by
- a `carryover` naming a step that no longer exists, or that now runs later
- a debrief with `follow_up_turns > 0` and nothing to ask
- coverage: a point claimed at Mastery with no step that assesses it

**7. Depths — credibly all three, and the only modality with a real claim to
Mastery.** "Can do it unaided" is what a scenario produces evidence for: the
learner acts, and the calibration says what counted. D15 still holds — format
**suggests**, never determines. A shallow two-step scenario is Awareness work,
and saying "scenario" does not make it Mastery.

##### How this compares to the reference editor

Asked 2026-09-19, before building. The honest summary: **the body is nearly
identical; the surface around it is not.**

**Same — and deliberately so.** Everything about what a scenario *is*:

| | Reference | Ours |
|---|---|---|
| Body unit | phase = practice + debrief | **same** |
| Practice fields | mode, purpose, exit gate, transition, interaction | **same** |
| Modes | `coach_inquiry` · `roleplay` · `observe_react` | **same** |
| Debrief | first-class turn-owning unit; `follow_up_turns: 0` default | **same** |
| Calibration | `look_for` / `response` per level | **same** |
| Levels | poles required, middle optional | **same** |
| Shape | sequence; `carryover` binds by id | **same** |
| Characters | identity + disposition, shared across steps | **same** |
| Steps in a rail | list with add / move / duplicate / remove | **same** |
| Delete repairs refs | prunes carryover, reports the count | **same** (and it is where D26 came from) |
| Done | validation with human-readable blockers | **same** |

That is not incidental overlap — it is the fold-in working as intended. Their
format is the organization's answer to *what a scenario simulation is*, and we
adopted it wholesale rather than inventing a parallel vocabulary.

**Different — and this is the entire argument for the platform.**

**1. The join to information points.** The largest difference by far. Their
editor has **no concept of coverage, depth, or an information point** —
`grep -c "coverage\|depth\|information_point" js/studio-shell.js` returns
**0**. Their `teaching_points` are inline strings authored inside the scenario,
matched to a step by **string-comparing the step's label to a topic name**, which
their own validator flags as fragile.

Ours are **references to points that live above the activity**, carrying depth,
provenance and a pinned version. Everything downstream follows from that one
change: coverage validation, the threshold check, drift, and transmute. None of
it is expressible in their document.

**2. What the author starts from.** Theirs starts from a blank document or a
template and writes a self-contained scenario. Ours starts from an information
set that already exists, and the scenario is **derived** from it. Their author is
a content designer who knows the subject; ours is an LED who does not (D8).

**3. AI's role.** Theirs has a **wizard** — a staged, front-loaded interview that
produces a draft, after which editing is manual. Ours has a **persistent
assistant** addressable at any node or field at any time (D30), plus **locks** to
fence off what is settled (D32). Different shape entirely: theirs generates *then*
gets out of the way; ours stays.

**4. Scope.** Theirs is one modality, standalone, producing a file. Ours is one
modality among six inside a platform where the same points also become a video, a
podcast, a job aid — and where an **output** validates the whole set against a
goal. Their scenario has nowhere to belong; ours belongs to a project.

**5. The prompt is not our surface.** Their inspector's primary tab is the
**compiled prompt**, with authored-vs-locked highlighting — it is the best
debugging tool their team has, and their own notes say it is becoming a
permission rather than a feature as customer authoring approaches. We inherit no
equivalent, and should not: our author is further from the model, and the
assistant is a modelled entity (D27–D29) rather than a prompt to inspect.

**What we drop from their surface**, and why — each is a *deliberate* omission,
not an oversight:

- **The compiled-prompt tab** — see above.
- **Publish / export / import / draft-library chrome** — a publish pipeline owns
  this (D31); the design surface should not carry a second set of the same
  actions. Notably their integration build already **hides exactly these bars**
  for the same reason.
- **The Say/Do split and Playtest tabs** — genuinely useful, and genuinely
  theirs; both are runtime-verification tools that belong wherever the scenario
  is played, not in the authoring layer.
- **The eight named scenario types** — already collapsed by their own format
  ("there is no type field"); we inherit the collapse, not the history.

**Net:** we are building **their body inside a different building.** If a content
designer who uses their editor sat down at ours, the step editor would feel
familiar and the rest of the screen would not — the coverage panel, the depth
tags, the assistant, and the fact that the teaching points are not theirs to
write would all be new.

#### The centre stage — live rehearsal, not a form

**Designed 2026-09-19.** The reference editor is a three-column form: section
nav, fields, inspector. The question put to it: *how do we do for scenario what
the canvas did for video — less form capture, more direct creation?*

##### Why the obvious port fails

The video canvas works because of two properties a scenario does not share:

1. **The artifact has a visual form.** A frame can be looked at and judged.
2. **There is a spine to scrub along.** Words, then time.

A scenario's artifact is **a conversation that has not happened yet**, and it has
no timeline — the learner's path through a step is unknown until they take it.
So "draw the conversation on a canvas" would mean drawing *one fabricated path*
and presenting it as the artifact. That is worse than a form, because it is
confidently wrong.

##### What actually transfers — and the property that makes it different

The video canvas is scrubbable because its output is **deterministic**: the same
word yields the same frame every time. A scenario's output is **probabilistic**:
the same calibration produces a different reply on every run.

So "preview" means two different things, and the surface must treat them
differently. Per the user (2026-09-19):

> *"live rehearsal but I think it needs controls to toggle which parameters the
> designer is testing. Changes to AI guidelines are tested by 'regenerating' an
> AI response chat over and over to see multiple examples of how it will generate
> answers under those guidelines. Verbatim changes result in live updates and
> certain interactions of the scenario can be 'scrubbed' so the designer isn't
> going through a full scenario to see a text change."*

**The split is already real in the format**, which is what makes this
implementable rather than aspirational:

| | Shipped **verbatim** | **Generated** under guidance |
|---|---|---|
| What | `opening_messages`, `final_word`, `key_points`, a delivery-only debrief (`follow_up_turns: 0`), the closing `ideal_response` | the coach's improvised replies, steered by `look_for` / `response` per level |
| Behaviour on edit | **live update** — deterministic, like the video canvas | **reroll** — one sample proves nothing |
| How it is judged | read it | read *several* and judge the spread |

##### The three controls

**1. Live update — for verbatim content.** Edit a `final_word` or an opening
message and the rehearsal reflects it immediately, no rerun. This is exactly the
video canvas's behaviour, and it applies to every field the learner receives as
written.

**2. Reroll — for generated content.** A coach reply carries a **reroll**
control. Pressing it re-runs *that turn only*, under the current calibration,
leaving everything before it fixed. Rolling three or four times is how a designer
sees what a guideline actually produces rather than trusting one lucky sample.

> **This is the honest answer to a probabilistic artifact.** A single generated
> reply shown once, sitting in a canvas, invites exactly the false confidence the
> video canvas's *"preview composite · not the render"* badge exists to prevent.
> Rerolling makes the variability visible instead of hiding it — the spread **is**
> the thing being judged.

Two affordances follow from that:

- **Keep a roll.** A reply worth remembering can be pinned as that level's
  `example` — the format already has `example: { learner, reply }` per level, so
  this writes a real field rather than inventing one. **Rehearsal becomes an
  authoring gesture**, not just a viewer.
- **Show the level each turn hit.** Every coach reply is tagged with the
  calibration level that produced it, and the tag is a link back to the field.
  This is the scenario equivalent of the video canvas making word-anchoring
  legible: it turns an invisible binding into something you can see and click.

**3. Scrub — for position.** Jump to any step and rehearse from there, with
earlier steps' state assumed, rather than replaying the whole scenario to check
one line. Directly analogous to the word playhead, and load-bearing for the same
reason: without it, every small text change costs a full playthrough.

Scrubbing into the middle of a scenario has one wrinkle the video playhead does
not: **`carryover`**. A step that reads from an earlier step needs something to
read. The rehearsal supplies the pinned `example` for that earlier step when it
was not actually played, and **says that it did** — a marked substitution, never
a silent one.

##### What the designer is testing — the toggle

Per the user's *"controls to toggle which parameters the designer is testing."*
Rehearsal is not one mode; it is a small set, because a designer checking
wording has a different question than one checking calibration:

| Mode | The question it answers |
|---|---|
| **Read** | Does the verbatim content say the right thing? *(no generation; fastest)* |
| **Calibrate** | Does a given learner answer land on the level I think it does? *(pin the learner's line, reroll the coach)* |
| **Play** | Does the whole step hold together as an experience? *(free conversation)* |

**Calibrate is the mode the form cannot do at all**, and is the strongest
argument for the surface: type the answer a mediocre learner would give, see
which level catches it, and fix the `look_for` if it catches the wrong one. That
is direct manipulation of the thing being authored — the same relationship the
video canvas has to on-screen text.

##### What stays a form, deliberately

Not everything should become visual. **Structure stays structural:** step order,
modes, exit gates, coverage tags and carryover are best seen as the arc (the rail
and the coverage panel), not acted out. Rehearsal is for **language and
judgment** — what the coach says and what counts as a good answer.

This mirrors video's own division of labour: the rail owns narration and audio,
the canvas owns what is composited. Actions sit with the thing they change.

##### What this asks of the engine

Rehearsal needs to run turns against the real model under the authored
calibration, which is beyond what today's player affords an authoring tool. Per
D31 and the video-rendering precedent, that is **the case being made**, not a
constraint to design around — the same posture as the compositing canvas.

##### The phase spine — building a scenario has stages

**Added 2026-09-19**, after the first build collapsed the whole surface into
step-editing plus a cast strip. Per the user: *"this is missing a layer of
navigation… there are multiple stages of building a scenario past the actual
interaction. Setting up context, creating the world and characters, the
interaction, the summary or results/follow up."*

The reference editor's own note says why, and it is the right reason: *"authors
work one phase at a time (a stepper they can also jump around), so a phase-level
decision is presented at its own altitude instead of buried in one long
scroll."*

Five stages, each a different **kind** of decision:

| | Stage | What it settles |
|---|---|---|
| 1 | **Situation & world** | the setting every step shares, and the cast |
| 2 | **Coverage** | which information points this satisfies, and how deeply |
| 3 | **Interaction** | the steps — the only stage with a rehearsal |
| 4 | **The coach** | how this activity casts the project's assistant |
| 5 | **Close** | what every learner leaves with, whatever path they took |

Two differ from the reference, and both differences are the platform:

- **Teaching → Coverage.** The reference *authors* teaching points inline. Here
  they are **referenced** from the information set — the id-join — so the page
  is a declaration of what this activity satisfies, not a place to write the
  subject. It carries an explicit notice saying so, with a route to the
  information set.
- **Voice & Tone → The coach.** Not a persona invented per scenario, and not one
  inherited read-only either. The page shows **context as project-owned** and
  lets the activity **cast** the persona (D27, corrected) — because the persona
  follows from what the activity asks the learner to do.

**Only Interaction shows the rehearsal**, because it is the only stage with a
conversation to rehearse. The others are authored content, so their centre
column is the authoring page itself. Interaction splits: step editor left,
rehearsal right.

**Each phase carries its own completeness dot**, computed from the same blockers
the render gate uses — so "not ready" is *navigable* rather than merely true.

##### Everything is authored — the collections are editable, 2026-09-19

The first build of this surface was a **viewer with text inputs**: you could
change what existed but not create or remove anything. Per the user: *"I can't
add characters, or turns to the interaction for example. Everything is hard
coded and doesn't seem like it can be built or edited like a designer would
need to."*

Every collection now has full add / remove / reorder:

| Collection | Add | Remove | Reorder |
|---|---|---|---|
| Steps | ✓ (+ duplicate) | ✓ | ✓ |
| Characters | ✓ | ✓ | — |
| Calibration levels | ✓ | ✓ | — |
| Debrief key points | ✓ | ✓ | ✓ |
| Carryover links | ✓ | ✓ | — |
| Coverage tags | ✓ | ✓ | — |
| Expert-answer components | ✓ | ✓ | ✓ |

Plus the per-step controls a form would have buried: the **mode picker** (with
what each mode asks of the learner, since retyping changes what the calibration
judges), the **exit gate** and **follow-up turns** as steppers, and unpinning a
kept example.

**Two rules run through all of it**, and they are the part worth keeping:

1. **A removal that would orphan a reference repairs it and says how many.**
   Deleting a step prunes every `carryover` naming it and reports the count;
   reordering a step past its own source drops the links that would now point
   forward and says so. Never silent, never left dangling. This is the reference
   tool's own behaviour (`remove()` in `v4-universal.js`) and the same rule D26
   settled for video.
2. **An empty collection says what it is for.** "No characters yet — a roleplay
   step needs someone for the learner to talk to" rather than blank space the
   author has to guess about.

Two smaller consequences fell out, both of which keep the model honest:

- **Changing a depth revokes an SME confirmation**, because the confirmation was
  a judgment about the *old* depth. The tag drops to `adjusted` and says so.
- **Setting follow-up turns to 0 deletes the probe**, since a delivery-only
  debrief speaks once and never waits — a probe there could never be answered.

##### Layout — measured, then fixed, 2026-09-19

The first build put four vertical zones on screen before any content, and the
numbers were bad enough to be worth recording:

| | Before | After |
|---|---|---|
| Editor field | 51 chars/line | **78** |
| Rehearsal bubble | 35 chars/line | **55** |
| Zones before content | 4 (chat + icon + phase rail + editor) | 3, one collapsed |

Comfortable prose reading is roughly 45–75 characters. The rehearsal — the thing
you are meant to *read* — was the narrowest element on screen at 35.

**Side-by-side stays**, per the user: *"the editor and rehearsal has to be side
by side so you can reference the chat or part of the interaction that you're
editing directly, and focusing an editor input takes you to the part of the
scenario you're editing."* The two columns are a **reference relationship**, not
a preview — which rules out mode-switching or an overlay.

Three changes:

**1. The phase rail collapses — on any stage.** It collapses to a 46px strip of
numbered chips rather than vanishing, so the spine stays navigable, and keeps a
warning dot on any stage with something outstanding (collapsing must not hide
the one signal the rail carries).

First built as *"collapse on a stage that rehearses"*, then widened after using
it — per the user: *"I think we should just make the side rail collapsible from
any step after seeing this interaction."* A control that appears and disappears
by stage is its own inconsistency.

**The control is universal; the default is per-stage**, because the stages do
not have the same problem. A one-column stage has width to spare and reads
better with the spine visible. Interaction puts an editor and a rehearsal side by
side, and leaving the rail open there costs both the readable width this pass was
about — **78 → 53 chars in the editor, 55 → 38 in a bubble**, measured. So
Interaction lands collapsed and the others land open; the moment the author
toggles, their choice wins and persists across stages. Re-entering the activity
restores the per-stage defaults.

**2. The rehearsal is elevated and pinned to the viewport.** Per the user:
*"I'd like the rehearsal to be in an elevated container that is positioned in
the viewport. This way regardless of how long the editor content is, the
conversation and chat input/send is always in the viewport."* It is
`position: sticky` with a viewport-derived height, so the editor scrolls freely
beneath while the transcript and its composer stay put. The elevation is real —
a lifted shadow and a brighter edge — so it reads as a different *kind* of
surface: something you look into, not a form you type on. Its type is looser and
larger than the editor's for the same reason.

**3. Focusing an editor field lights the turn it governs**, dimming the rest.
The level tag on a turn already does the reverse. Two directions, one
relationship — the same job the word playhead does for on-screen text in video.

**Two class collisions found and fixed** — both cases of the scenario surface
reusing a name the platform already had: `.sai-sub` (the sub-range selection
target for targeted prompting) and `.sai-turn` / `.sai-bubble` (the chat rail's).
The second silently capped rehearsal bubbles at the chat rail's 88%. Rehearsal
turn styles are now scoped under `.sai-reh`, and the layout suite asserts the
chat rail is unchanged.

##### Parity with the reference — audited 2026-09-20

Full field-by-field audit in **`PARITY.md`**. Summary: **~45% of the authoring
surface**, and the shortfall is concentrated rather than spread.

**The gap that matters:** a practice `mode` is a different **shape** in the
reference, not a different label. `roleplay` requires a partner, a character
binding and `progression` (how the scene moves when handled well);
`observe_react` requires an exhibit, a rubric of things to spot, and a spot
target. Here, switching mode changes an icon. Two of three modes have no fields
behind them.

Also absent: `opening_messages` as an array (so a scenario cannot open as an
exchange), canon facts, misconceptions, the scenario-level ungraded opening,
`narrative`, conditional probes, `help_turns`, source references, and document
identity — so nothing here is loadable by a player yet.

**Where this surface is ahead**, and why it is not simply a smaller version of
the reference: coverage is a real id-join to information points the reference
has no concept of; the rehearsal loop has no equivalent there; the assistant is
modelled per project and cast per activity; and threshold validation asks an
output-level question a standalone document cannot.

##### What the design must still resolve

Not framework questions — build questions, to settle when the surface is designed:

- **How the id-join is surfaced.** `teaching_points` projected from covered
  points is the platform's central addition here, and v4 has no slot for it
  (above). What does the author *see*?
- **Whether the rail is steps or something coarser.** Video's rail is scenes and
  checks as siblings; scenario's obvious analogue is steps, but a long scenario
  may want grouping the format does not have.
- **Where the character cast lives.** It is scene-world data shared across
  steps, so it is neither a step field nor a project field. The rehearsal
  surface gives it an obvious home it did not have in a form — a character is
  something you *see speaking* — which may settle this.
- **What rehearsal costs.** Every reroll is a model call, and Calibrate mode
  invites many. Not a blocker for a prototype (the mock fakes it), but a real
  product question the surface should not pretend away.
- **Whether a rehearsal transcript is worth keeping.** Pinning a roll as an
  `example` is settled (D33). Whether a whole *session* is worth saving — as
  evidence for an SME, or as a regression check after an edit — is not.

### Knowledge check
**Status:** not yet discussed.
Note: Phase 2 integrates assessment *into* the video flow; here it is also a
standalone activity. The relationship between those needs resolving.

### Job aid
**Status:** not yet discussed.

### Reflection
**Status:** not yet discussed.

---

## Settled cross-cutting decisions

### Checks and assessments are different instruments — 2026-09-18

Phase 2 calls both "questions" and models them identically (two sibling arrays,
same object shape, nothing but which array they land in distinguishing them).
The team clearly sensed a distinction it had no way to express. It is:

| | Mid-activity **check-in** | **Assessment** activity |
|---|---|---|
| Tests | comprehension — did the language just used land? | understanding — can the concept be applied? |
| Bound to | **the specific narration phrasing** of its activity | the information points only |
| Lives as | a section *inside* the activity | its **own activity** |
| Depth it evidences | Awareness / Working | Mastery |
| Shared across modalities | **never** — language differs per modality | **yes, and should be** |
| Drift trigger | its activity's language changes | its point advances (normal drift) |

**Why checks can't be shared:** if the video says *"the derated figure governs"*
and the podcast says *"the number on the supplementary plate is the one that
counts,"* one shared question is subtly wrong for one of them — and wrong in a
way that reads as a trick, since the learner knows the concept but not the
words. Reuse across modalities is actively harmful here.

**Why assessments should be:** a learner who took the video path and one who
took the podcast path must face the same assessment, or you cannot claim they
met the same threshold.

**Consequence — a new drift trigger.** A check depends on the *language* of its
activity, not only on the point. When narration changes, the check is suspect in
the same way an activity is suspect when its point advances. Same mechanic,
different trigger. Assessments need nothing new; they already depend only on
points.

### Scenes are a production unit, not a content boundary — 2026-09-18

**User's framing:** scenes let an LED construct and design in smaller chunks that
are stitched together into the finished LO — *"similar to film production where
the whole movie isn't made in one sequence but rather smaller chunks stitched
together."*

So a **scene is a working chunk, and the LO is the deliverable.** The LO is the
Learning Activity; scenes are how a person builds it without holding the whole
thing at once.

**Therefore scenes are the wrong unit for point tagging.** A teaching point does
not respect scene boundaries any more than a plot point respects shot
boundaries — one point may span three scenes, two points may share one. Tagging
at scene level would tag production convenience rather than content.

**Open:** what the content boundary actually is for video. A marked span of
narration? A passage that may cross scenes? This must be resolved in the video
section below — per-section traceability depends on it.

---

## Open cross-cutting questions

- **Can one section serve points at different depths?** A section might
  introduce point 3 while reinforcing point 4.
- **How does regeneration interact with hand edits?** If an LED hand-edits
  segment 2 and then regenerates the activity, what survives?
