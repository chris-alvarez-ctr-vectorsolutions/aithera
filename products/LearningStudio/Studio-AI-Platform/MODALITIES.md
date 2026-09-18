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
| Scenario | no | no | — |
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

### ~~Per-section traceability~~ → **activity-level tagging** — revised 2026-09-18

**Superseded the same day it was proposed.** Per-section traceability was agreed
before the LO length constraint was on the table, and does not survive it.

**The constraint:** a Learning Object runs **2–5 minutes and typically covers one
main teaching point**. The activity *is* already the granularity. Slicing it to
locate where other points are covered "in some capacity" would invent precision
that does not exist — and would invite tagging incidental mentions as coverage,
which is the dilution the depth scale exists to prevent.

**So: coverage tags at ACTIVITY level.** No section unit, no span tagging, no
named beats. A modality's body does not need an addressable section for
traceability purposes.

**The hierarchy this confirms:**

```
Learning Object  =  Learning Activity   — one point, 2–5 min
Course           =  Output              — composed of many LOs
```

A Course is not a large authored thing; it is an *arrangement* of short
single-point activities. Which is why compose / decompose matter, and why the
same LOs can serve both a Course and an Experience.

It also makes coverage counts legible: an output covering six points needs
roughly six activities, not one sprawling one.

---

## What each modality discussion must resolve

Answer all of these, in the modality's own section below, so surfaces stay
comparable.

1. **What is the body made of?** The repeating unit — segment, dialogue turn,
   decision node, item — and what fields each carries.
2. **What is the section unit for traceability?** Which unit tags to points.
3. **Is it a sequence, a tree, or a set?** Determines the editing model.
4. **What is generated vs. hand-authored?** And what does regeneration preserve?
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

**1. Body unit — the SCENE.** A production chunk, 2–5 min LO total. Carries
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
**Status:** not yet discussed.

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
