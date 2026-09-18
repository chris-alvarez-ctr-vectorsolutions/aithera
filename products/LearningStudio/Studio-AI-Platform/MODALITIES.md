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
| Video | no | no | — |
| Podcast | no | no | — |
| Scenario | no | no | — |
| Knowledge check | no | no | — |
| Job aid | no | no | — |
| Reflection | no | no | — |

Nothing is designed yet. The framework below is what every modality discussion
must resolve, so the answers stay comparable across sessions.

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
**Status:** not yet discussed.
Phase 2's objectManager is the prior art — review before designing.

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
