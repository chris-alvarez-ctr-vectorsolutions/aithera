# Studio AI — Generative Authoring

A spin-off of [`../Studio-AI-Platform/`](../Studio-AI-Platform/README.md) that
replaces the per-modality **authoring surfaces** with a **brief → generate →
review → revise** loop. The author stops building content on a canvas and
starts directing it: set up a brief, get a generated artifact back, review it,
point at what's wrong, get the next generation.

The comparison the team already lives: a UX designer moving from a Figma canvas
to reviewing a live HTML prototype that Claude Code built — and steering the
next version by pointing at things and saying what should change.

**Status:** exploration. Passes 1–5 of the mock are built (`ver1/index.html`, opened
through the loader `index.html`). Started 2026-10-15.

Built as a versioned feature with the Design Toolbox and a flow map; the flow
map has a deep link to every state below. **Hand-rolled UI, no Vector
components** — this is exploration, and the components don't cover a generated
artifact, a change map or a dockable panel. Same call as the parent prototype.

---

## If you are picking this up cold

Read the parent platform's `MODEL.md` first — this folder **does not restate the
information layer**, it builds on it.

| File | What it holds |
|---|---|
| [`../Studio-AI-Platform/MODEL.md`](../Studio-AI-Platform/MODEL.md) | The knowledge library, information set, points, depth, coverage, goals. **All of it still holds.** |
| **`MODEL.md`** | The generative loop, the project brief, variations, element targeting, review tooling — and which parent decisions carry, change, or are superseded. |
| **`OPEN-QUESTIONS.md`** | What's unresolved, and what each answer would change. |

---

## The one-paragraph pitch

The parent platform's core claim is that the **information set is the primary
artifact** and everything beneath it is derivable. It then spent most of its
effort building hand-crafted authoring surfaces for that derivable layer — a
video canvas, a six-stage scenario editor — with four more modalities still
undesigned. This spin-off takes the core claim at its word: if activities are
derivable, author them by **directing the derivation**, not by assembling the
result. The information layer stays. The surfaces under it become a brief, a
generated artifact, and a review loop shared by every modality.

---

## What is kept, what is replaced

| Kept — the subject (above the line, D48) | Replaced — the delivery authoring (below it) |
|---|---|
| Knowledge library, information set, point documents — **ported into this mock as its own layer (Pass 5)** | The video canvas and timeline editing |
| Walled-off usage guidelines (D23) and assistant goal (D28) | The scenario six-stage form |
| Depth, coverage, goals, the threshold | Four undesigned modality surfaces — **never built** |
| Drift, approval staleness, locks, node addressing | Direct editing as the primary mode |
| Beats (D42), learner preview (D44) | |

## The loop

```
PROJECT BRIEF ─▶ ACTIVITY SPEC ─▶ GENERATION n ─▶ AUTHORING REVIEW ─▶ revision task ─┐
      ▲                                                │                             │
      │ (edit the brief / spec)                        │ satisfied                   │
      └────────────────────────────────────────────────┤                             │
                                                       ▼                             │
                                          LEARNER PREVIEW ─▶ APPROVE ─▶ publish       │
                                                                                     │
                                                   GENERATION n+1 ◀──────────────────┘
```

Details in `MODEL.md`.

---

## Settled at kickoff — 2026-10-15

From the planning conversation; reasoning in `MODEL.md`.

- **Two review modes.** Authoring review is the working loop; learner preview is
  a required gate before approval.
- **Variations are two axes** — format (refresher, microlearning, full course)
  and audience (fire, law, EMS, factory, construction site).
- **The brief is project-level** (G7): its own layer between Information Set
  and Activities. Mostly a form, since it's the key human-in-the-loop point;
  AI proposes where the work is heavy (e.g. assigning points to activities).
  Each activity is a spec inside it that inherits and overrides.
- **A brief edit asks the author what to do** (G10): start the affected
  activities over, or analyse existing content against the change and decide
  per finding (update, delete, leave as is).
- **Content approvals carry; the pipeline handoff doesn't** (G11, renamed by
  G12). Any change to an output clears its handoff approval.

## Settled 2026-10-16 — after the evaluative pass

- **Two roles, three approvals** (G12): the LED grants content approval and
  the pipeline handoff; the SME confirms depth per point, from the preview
  report. Whether the SME is required comes from the project goal (D17) — a
  content-team decision, not derived. Release is downstream, not ours.
- **The bar lives on the output's format** (G13): Full course / Refresher /
  Microlearning, held as data. No activity-level depth override; a refresher
  activity is a treatment instruction, a Refresher output is the configuration.
- **Spec edits split by field** (G14): treatment edits ride the next revision
  task; point changes get the G10 analyse/refresh choice scoped to one activity.
- **Locks apply immediately**; a revision task records them (G9 revised).
- **All-prompt editing, element-targeted.** No manual editor. Precision comes
  from targeting an element ("this sign"), not from a form field.
- **What changed is a list plus a change map** (G5); unrequested changes from
  recomposition are caught by comparison and shown louder (G6).
- **The AI panel is a dockable module** (G8): right, left, bottom, floating,
  or minimized.
- **Review edits batch into one revision task** (G9).

## What the mock shows — Pass 1, the review loop

- **A generated video built from addressable elements** — background image,
  objects (the forklift), signs, overlays, narration lines. Hover outlines them;
  click one to annotate it in place (G4).
- **Exact wording** — tick "use my wording exactly" and the text lands verbatim,
  then locks. The seeded case: the scene 3 sign reads *DEFECTS ONLY*, which
  contradicts the narration.
- **Region targeting** for flat images — the ⬚ tool draws a box on the
  background (G4 fallback).
- **Pending → one revision task** with an optional general instruction (G9).
  The task runs with visible steps; targeted elements shimmer.
- **Change list + change map** (G5) — requested changes glow blue, unrequested
  glow amber, with timeline markers. The list is the source of truth: Jump
  seeks to the change and pulses it even with the map off.
- **Unrequested drift is computed, not reported by the generator** (G6). The
  diff compares generations and attributes each change to a request or to
  nothing. Shortening narration line 1 in scene 2 shifts the callout's timing;
  re-lettering the sign changes its text size. Neither was asked for.
- **Accept / Restore / Annotate** per change. A restore queues into the next
  task. Open unrequested changes block "Ready for learner preview".
- **Generations** — switch to any earlier one, read-only.
- **Dockable panel** (G8) — right, left, bottom (frame shrinks so the timeline
  stays visible), floating (drag the header; moves aside from your selection),
  minimized pill.

## What the mock shows — Pass 2, the project brief

Open it from **Brief** in the left rail, or the brief chip in the activity's top
bar (which lands on that activity's row).

- **The brief is its own layer** (G7), between the information set and the
  activities. A form in three sections plus walled-off **standing constraints**
  (D23). Edited fields are marked, and a save bar says how many generated
  activities the edit reaches.
- **The AI proposes; you accept** (D16). Changing the audience drafts the rest
  of that section; **Suggest** proposes a constraint. Proposals are dashed blue.
- **Generation plan** — activities × variations, each row an activity spec
  that inherits the brief and shows what it overrides. **Variation** adds a
  refresher, a microlearning or an audience variant; the AI proposes the points
  and, for a format variation, lowered depth (G2). You accept, then Generate.
- **Saving asks what happens to existing content** (G10). It lists what
  changed, which activities it reaches, which are exempt because they override
  the field, and which aren't generated yet. **Refresh** names the locks it would
  throw away (keep or drop each) and the approvals that go stale. **Analyse**
  checks each activity and reports holds / out of date / wrong.
- **Findings get a decision each** — update, delete, leave as is, or start
  that activity over. A wrong finding blocks Apply until decided, and leaving
  one as is needs a reason. Updates for the video go into **its Pending** — the
  same revision task review uses (G9) — and the next generation shows them as
  requested changes.
- **Approvals** (G11) — content approvals carry until the queued updates
  regenerate the activity; the output's publish approval is cleared by the save.

The video's findings read its **live** state: fix the truck during review and
the analysis says that element holds.

## What the mock shows — Pass 3, the gates

- **Learner preview** (G1, D44) — **Learner preview** on the review screen opens
  a separate window with the learner's chrome and none of the authoring layer.
  You can scrub back but not past what you've watched; 1×/2×/4× is a preview
  convenience. It unlocks only once every unrequested change has a decision.
- **The preview report** says which points a learner actually reached, where
  and when — read from the elements the generation claims carry each point. A
  static video needs no beats (D42).
- **Content approval is granted from the preview**, pinned to that generation
  (D41). The next generation shows it as out of date.
- **Outputs layer** (left rail) — per output: each activity's content approval
  and brief currency, a **threshold** table (every point against its bar, from
  the best activity carrying it), and the **publish approval** with what it's
  pinned to. Forklift Competency starts approved; Forklift Safety Refresher
  misses its bar on P2 and P5.
- **Publish approval is computed against its pin** (G11) — a new video
  generation, a brief edit, or any activity regenerating clears it, and the card
  says exactly what changed. Four gates must pass: threshold met, every activity
  current with the brief, every content approval current, and an output preview
  since the last change.
- **Output preview** walks the activities in order; modalities without a player
  show a stand-in card.
- **Re-approval reviews the delta** — brief changes since the pin, every
  generation change (unrequested ones with their decisions), and anything left
  as is during brief analysis with its reason. Then **Send to publish pipeline**
  (D31).

Activities other than the main video have **simulated** Regenerate and Approve
buttons (labelled "sim") so the gates can be satisfied end to end.

## What the mock shows — Pass 5, the Information Set layer (2026-10-16)

Chosen over a read-only stub because, with four layers, the one the model
turns on has to be visible. Ported from the parent — the six point documents,
the library and the two SME comment threads are the parent's seed data,
extracted verbatim rather than retyped.

- **The set** — six cards: required depth (met/unmet against the best any
  activity delivers), version, provenance (sourced vs. model knowledge),
  verified/awaiting SME, carried-by count, comments. A banner above the line
  explains why this layer is different from the three below it.
- **Point document** — the five sections, directly editable, with **usage
  guidelines walled off** beside them (D23). **Propose a rewrite** per section
  is a D16 proposal: accept or dismiss. Saving bumps the point **as a whole**
  (D24) and the save bar says how many claims will read as behind.
- **Drift, computed** (D19/D20) — every activity claim pins the point version
  it was judged against. After a save, those claims show *v3→v4 update
  available* in the plan and the point's **Carried by** table — advisory. *Mark
  reviewed* re-pins a claim and drops an SME confirmation to LED-set, because
  the SME hasn't re-looked. The podcast's P3 claim is seeded at v2 so drift is
  visible from the start.
- **Archive** is the hard case — every dependant becomes a no-deliver, and a
  new handoff gate ("no activity depends on an archived point") blocks.
- **The handoff pin now includes point versions and lifecycle** (G11): editing
  or archiving a point clears an output's handoff approval and the card says
  which point moved.
- **Library import** copies (D34) and reports the new point as carried by
  nothing (D43). **Remove** orphans the claims naming the point and reports
  them; *Clear them* prunes on request only.
- **Derive an activity** from a point adds a proposed row to the generation
  plan — the parent's points → activities operation, now wired to the brief.
- Point names in the Outputs threshold link to the point.

**Seed deviation, kept:** P6 requires Working here (parent: Mastery) so the
Competency output can pass — documented in the seed.

## What the mock shows — Pass 4, after the evaluative pass (2026-10-16)

- **Depth provenance is back** (D16, G12) — every claimed point carries
  *proposed / LED set / SME confirmed*, pinned to a generation. The threshold
  table has a **Judged by** column; the plan chips carry a provenance dot; the
  preview report shows the state per point. **Seeded, not editable** — the
  SME's confirm control is deliberately not built; the states are data.
- **Staleness is per point, not per activity.** A confirmation goes stale only
  when an element *carrying that point* changed since it was made. The
  `outputs-stale-sme` flow state shows it: a revision to the line carrying P2
  stales P2's confirmation while P1's holds.
- **The SME gate is driven by the project goal** (`GOAL.requiresConfirmation`,
  parent D17). Compliance here, so it appears; flip the flag and it's gone.
- **Format lives on the output** (G13) — `FORMATS` is a data table (Full course
  / Refresher / Microlearning → bar). The Outputs card names the format and
  goal it validated against. The plan's "Format" column became **Treatment**
  (a spec instruction), the depth-override badge is gone, and the variation
  menu offers audience variations only, pointing at Outputs for formats.
- **"Publish approval" is now "pipeline handoff"** everywhere (G12). Release is
  the pipeline's workflow.
- Small fixes: annotating an unrequested change counts as its decision; flow
  states no longer overwrite your dock preference; the brief chip computes its
  override count.

**Data changed for Pass 3:** scene 1 gained a narration line on three-point
contact so the video genuinely carries P2; the video's spec now claims P1 and
P2 only (what its content carries); P6's required depth is Working so the
Competency output can pass.

Everything is in-memory; reload resets.

## Next

1. ~~Close the blocking questions (Q1–Q3).~~ Done 2026-10-15.
2. ~~Prove the loop on **video**.~~ Pass 1, built 2026-10-15.
3. ~~**Pass 2 — the project brief layer**~~ — built 2026-10-15.
4. ~~**Pass 3 — gates**~~ — built 2026-10-15.
5. ~~**Pass 5 — the Information Set layer**~~ — built 2026-10-16.
6. **Pass 6** — G14 spec edits (treatment fields ride the task; point changes
   get a scoped analyse/refresh) and a **coverage panel** in the review tooling
   (G1 promises it; the preview report is the only place claims show today).
7. Prove the loop again on **job aid** — an undesigned modality — to show a new
   modality needs a review renderer, not a surface.
