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

### Per-section traceability — settled 2026-09-18

Content sections tag to the information point(s) they serve. Coverage becomes
traceable to **where a point is actually taught**, not merely asserted at
activity level.

```
SEGMENT 2   covers ③ ④
  Narration │ …
```

Consequences to honour in every modality design:

- every modality's body must have an addressable **section** unit to tag
- a point claimed at activity level with no section serving it is a detectable
  inconsistency — worth surfacing
- depth becomes defensible: you can point at the content that earns it

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

## Open cross-cutting questions

- **Does an integrated assessment count as one activity or two?** Phase 2 embeds
  quizzes in video. In this model, is that one activity covering points at two
  depths, or a video activity plus a check activity composed together? This
  affects coverage tagging and should be settled before video or knowledge
  check is built.
- **Can one section serve points at different depths?** A segment might
  introduce point 3 while reinforcing point 4.
- **How does regeneration interact with hand edits?** If an LED hand-edits
  segment 2 and then regenerates the activity, what survives?
