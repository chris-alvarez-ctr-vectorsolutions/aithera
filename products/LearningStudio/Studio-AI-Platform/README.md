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

## Where this stands — 2026-09-18

The **information layer, activity layer and outputs** are all modelled and
demonstrable, with depth/goal validation live. The **video modality** now has a
substantial authoring surface. Five other modalities are undesigned.

See `MODALITIES.md` for the per-modality status and what is left undone on
video.

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

Everything is in-memory. Reload resets.

## What is not built

See the tail of `OPEN-QUESTIONS.md`. Briefly: no information authoring, no depth
editing, no real compose surface, no persistence.
