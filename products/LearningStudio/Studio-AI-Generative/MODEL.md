# Studio AI — Generative Authoring Model

> The reasoning behind the spin-off. Builds on
> [`../Studio-AI-Platform/MODEL.md`](../Studio-AI-Platform/MODEL.md) and does not
> restate it. D-numbers refer to the parent's `DECISIONS.md`; **G-numbers** are
> this folder's own decisions.
>
> Status: planning. Nothing here is committed engineering.

---

## The shift

The parent platform authors an activity by **editing its body** — scenes on a
timeline, steps in a spine, fields in a form — with AI as a drafting and
targeted-prompt assistant inside that surface.

This model authors an activity by **directing its generation**. The author
writes a brief, receives a rendered artifact, reviews it, and asks for changes.
The artifact is something you look at and point into, not a structure you edit.

The parent already leaned this way. D30 states the editing model as *"the same
interaction as Claude Code in VSCode,"* and scenario rehearsal (D33) already
works by generating, judging, and pinning rather than editing. This model makes
that the **only** mode and removes the surfaces it was layered over.

**What does not change is the line D48 draws.** Above the information set the
subject is decided; below it is delivery. Everything here is below the line.

---

## Vocabulary

Parent terms (Learning Project, Knowledge Library, Information Set, Information
Point, Learning Activity, Output, Goal, AI Assistant, Beat) keep their meaning.
New terms:

| Term | Meaning |
|---|---|
| **Project brief** | The project-level layer where delivery is decided: style, assets, terminology, audience defaults, assistant persona, standing constraints, and the **generation plan**. Spans every activity in the project (G7). |
| **Generation plan** | The part of the project brief that lists activities × variations, each with its points, modality, variation and overrides. |
| **Activity spec** | One row of the generation plan: what this activity inherits from the project brief, and what it overrides. |
| **Generation** | One rendered artifact produced from an activity spec plus any revision tasks. Immutable once produced. Numbered within its activity. |
| **Element** | An addressable part of a generation — a narration line, an on-screen text block, a sign in a scene, a dialogue turn, a checklist row. Carries a stable id. |
| **Annotation** | A review note anchored to an element (or a region) of a specific generation. A targeted prompt, not a comment thread. |
| **Revision task** | Everything the author queued while reviewing a generation — annotations, restores, lock changes, general instructions — sent to the AI together as one task. Produces the next generation (G9). |
| **Variation** | A sibling activity generated from the same points along a format or audience axis. |
| **Batch** *(later)* | Several activity specs from the generation plan generated in one run. |

**Generation vs. version.** A generation is a design-time iteration, like a
`verN/` folder in this repo. A *version* remains the publish pipeline's concept
(D31). Approving generation 7 is what hands content to publish; generations 1–6
are working history.

---

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

### Two levers, deliberately distinct

| Lever | Changes | Effect on the next generation |
|---|---|---|
| **Edit the brief or spec** | what the activity *is* — points, depth, audience, format, style | A fresh generation. Prior annotations are offered for carry-forward, not applied blindly. A project-brief edit reaches every activity that inherits the field (G7). |
| **Send a revision task** | how *this* artifact executes its spec | A revision of generation n. Everything not targeted is preserved, subject to G6. |

The distinction matters because they fail differently. A brief edit that should
have been an annotation throws away work the author liked; an annotation that
should have been a brief edit fixes one instance while the brief keeps producing
the problem. The UI should make the choice visible — and when the same
annotation recurs across generations, suggest promoting it into the spec or
the project brief.

### What carries forward between generations

- **Locked elements** (D32) — copied verbatim. A revision task that would
  touch one reports and asks, exactly as the parent's locks do.
- **Verbatim values set by annotation** — auto-locked (G4).
- **Everything not targeted** — preserved by intent. Whether the engine can
  guarantee this is OQ Q3; the review surface must show what changed either way.

### Generation is probabilistic; review must be honest about it

D33 holds: a single draw is never *the* output. Two consequences here:

- A spec can ask for **2–3 candidate generations** side by side; the author
  picks one to continue from. This is the version-switcher pattern from this
  repo, used as a choosing tool.
- For activities that are **generated at runtime** (a scenario coach, an
  adaptive path), the artifact under review is the *guidance*, and review still
  needs rehearsal-style rerolling (D33) and beats (D42). A rendered artifact
  only stands in for the learner's experience when the content is static.

---

## G1 · Two review modes; learner preview gates approval
**2026-10-15**

| | Authoring review | Learner preview |
|---|---|---|
| Purpose | the working loop | the last look before approval |
| Shows | the artifact plus its workings — element outlines, what changed since n−1, coverage claims, beats, locks | only what a learner sees, in the real player (D44) |
| Can do | annotate, target, lock, compare generations, request a revision | walk it as a learner; report which beats fired and which points were reached |
| Required? | — | **yes** — nothing is approved without one |

D44 already split these. The change is that learner preview stops being an
optional button and becomes the **gate**. In a canvas model the author has
assembled every piece and knows what the learner gets; in a generative model
they have *reviewed* it, which is weaker, so the final walk-through earns its
place.

**Which approval it gates** (clarified 2026-10-16, G12): an activity's
**content approval** is granted *from* its learner preview report, and the
SME's **depth confirmation** is made from the same report. An **output**
preview is required before pipeline handoff when the output's traversal is
generated (an Experience, D47); for a fixed-sequence Course the per-activity
previews suffice and the output walk-through is optional. The mock currently
requires it for both — see OQ Q15.

---

## G2 · Variations run on two axes, with different rules
**2026-10-15** · revised 2026-10-16 by G13 — format moved to the output

Common real cases: a refresher and a full course from the same material; the
same content for fire, law, EMS, a factory floor, a construction site.

| Axis | Examples | May change | Must not change |
|---|---|---|---|
| **Format** | refresher · microlearning · full course | the **bar** an output is held to (G13), length, which points are carried | the information set |
| **Audience** | fire · law · EMS · factory · construction | **depiction** — setting, characters, terminology, examples, imagery | the points, and their required depths |

**Audience changes depiction, never subject.** If law enforcement genuinely needs
different points than fire — different regulations, different procedure — that
is a different information set, curated above the line by an SME. Letting an
audience variation quietly swap points would put a subject decision below D48's
line, where no SME sees it, and the threshold would stop meaning one thing.

**Format can change the bar, and must say so.** A refresher that requires only
Awareness is a legitimate design choice, but it is not equivalent to the full
course. ~~The variation records its depth overrides so an output built from it
validates against *its* bar.~~ **Revised (G13):** the bar is a property of the
**output's format**, not an override on an activity. A refresher *activity* is
just a generation instruction (shorter, lighter treatment); the refresher
**output** is the configured thing, and its format sets the bar the threshold
checks. There is no activity-level depth override.

**Audience variations are sibling activities, not renderings of one activity**
— the same reasoning as transmute (parent `MODEL.md`: *"a video and a podcast
are distinct activities carrying the same teaching points"*). Each has its own
generations, coverage claims, and approval. Transmute is a variation along a
third axis, modality.

**Open:** a variation is forked from its base at creation; nothing yet says
whether a later revision of the base propagates to, flags, or ignores its
variants (OQ Q14).

---

## G3 · Brief fields split into project-wide and per-activity
**2026-10-15** · revised the same day by G7

*Originally:* one brief per activity, with a shared profile later. *Revised:*
the brief is project-level from the start (G7). What was "the profile" is the
project brief; what was "the brief" is an activity spec within it. The field
split below survives unchanged; only where each column lives moved.

| Project brief — inherited by every activity | Activity spec — per activity |
|---|---|
| Visual style, brand, asset library | Points covered |
| Voice, tone, terminology list | Modality |
| Audience defaults (setting, roles, equipment) | Treatment and length (e.g. "refresher-length") — an instruction, not a bar (G13) |
| Assistant persona defaults (D27) | Assistant goal for this activity (D28) |
| Standing constraints ("never depict a rollover") | Activity-specific constraints |

**Usage guidelines (D23) and the assistant goal (D28) stay walled off.** They
steer generation and are never passed into learner-facing language. A brief has
the same two halves a point does: context that generates, directives that
govern.

**Override, don't fork.** An activity spec inherits from the project brief and
overrides field by field, and shows which fields are overridden — the same
visibility a lock gives.

---

## G4 · All-prompt editing, made precise by element targeting
**2026-10-15**

Leadership's direction is all-prompt editing — no manual editor. That works only
if prompting can be as precise as editing. The parent POC already shows how:
select the thing, then say what's wrong with it. *"The sign on the wall has the
wrong text"* is a guess for the AI to resolve; selecting the sign and saying
*"this text should read X"* is an instruction.

**This makes element addressing a hard requirement on generation.** Parent
`MODEL.md` calls node addressing *"the single most load-bearing decision in the
build"*; here it reaches into the generator itself. A generation must be
**composed of addressable elements**, each with a stable id the generator issued
and can regenerate alone — not rendered flat.

| Content | Targeting grain | Fallback |
|---|---|---|
| Text, narration, dialogue, checklist rows | element, and sub-range within it (D5) | — |
| Composed scene (background + placed objects + overlays) | element — the sign is its own object | — |
| Flat generated image | **region** — draw a box, regenerate inside it (inpainting) | coarser but still targeted |
| Audio | transcript line + timestamp | — |
| Video | element in the composed frame at a timestamp | poster-frame region |

These grains mirror the parent's comment-excerpt table — what can be captured
for a comment is what can be targeted by an annotation.

**Verbatim instructions land verbatim, and then they're locked.** *"This text
should read X"* is not guidance to interpret. The revision must apply it
exactly, the change report must confirm it did, and the value is **auto-locked**
so a later *"tighten this scene"* cannot reword it. The author can unlock it like
any other lock (D32).

**This reframes D37.** The parent blocks AI-scaffolding language in verbatim
fields. Here there are no fields — verbatim text is *set by prompt* and then
*protected by lock*. The prompt-smell check moves to the annotation: an
instruction whose quoted value talks about the AI or the interface still blocks.

**Annotations can anchor precisely; comments still can't.** D5 refused sub-node
comment anchors because regeneration orphans them, and allowed sub-range prompt
targets because *"a prompt's anchor only has to live as long as the prompt."* An
annotation is a prompt anchored to an **immutable** generation, so a precise
anchor is safe. Production discussion that must outlive generations still
anchors at activity level.

---

## G5 · "What changed" is a list and a visual layer; the list is the source of truth
**2026-10-15** · resolves OQ Q1

Element addressing (G4) means the platform knows exactly which elements differ
between generation n−1 and n. That gets shown two ways.

**The visual layer: a change map.** Changed elements get a highlight on the
artifact itself, like a hotspot map: a glow or pulse on the sign that was
re-lettered, the narration line that was rewritten. **It can be toggled on and
off**, because the author also needs to judge the generation without
decoration. Each grain from G4 has its own treatment:

| Content | Visual treatment |
|---|---|
| Text, narration, dialogue | element highlight; the changed sub-range is marked within it |
| Composed scene | outline or glow on the changed object |
| Flat image region | the region outlined |
| Audio, video | markers on the timeline at changed spans; the element glows while the playhead is inside one |

**The list: the actionable source of truth.** One row per changed element,
showing:

- the element, with an excerpt (parent comment-excerpt table)
- what changed, before → after
- **why it changed**: the annotation that asked for it, or *unrequested* (G6)
- **jump to**: scrolls or seeks the review to where the change shows, and
  pulses it, even with the change map toggled off

Time-based media make the jump essential. A changed overlay at 1:42 is invisible
until the playhead is there, so the list is the only reliable way to find every
change. That is why the list, not the visual layer, is the source of truth: the
visual layer only shows changes that are currently on screen.

**List actions:** jump, accept, annotate further, and **restore**, which puts
the element back to its n−1 value. Restore isn't manual editing: it is a
targeted request whose value is already known, so it can be applied exactly.

**Changes are always against the generation being continued from**, normally
n−1. If the author picked a candidate (D33 extension), the diff is against that
candidate.

---

## G6 · Recomposition can drift; the change report must catch what wasn't asked for
**2026-10-15** · resolves OQ Q3

**Assumption: anything regenerated can drift.** Element targeting mitigates
this. Untargeted elements aren't actually regenerated, so their content holds.
But the **final composition** is rebuilt, and that can still move things
nobody asked to move:

- a longer narration line shifts the timing of everything after it
- a re-lettered sign reflows or changes scale in the scene
- an inpainted region changes lighting or edge detail around it
- a rewritten dialogue turn changes how the next generated turn reads

**So every change is one of two kinds, and the report keeps them apart:**

| Kind | Source | Treatment |
|---|---|---|
| **Requested** | traces to an annotation or brief edit | normal change-map highlight; list row cites the request |
| **Unrequested** | no request explains it | **distinct, louder highlight**; listed first; must be accepted or restored before approval |

**Detection is computed by comparing the generations, never taken from the
generator's account of what it did.** A generator that says "only the sign
changed" is the claim being checked, not the evidence. This follows the
parent's pattern: drift (D19), approvals (D41) and set changes (D43) are all
computed and reported, never assumed.

**Locks get the same check.** A locked element (D32) that differs in the new
generation is a defect, not drift. It is reported as a failed lock, and the
generation can't be approved until it's resolved.

**For the prototype:** this is an engineering problem the mock won't solve, but
it must show it. Seed at least one unrequested change (e.g. an overlay's timing
shifted by a narration edit) so the review flow demonstrates how it is caught.
How likely drift is depends on the engine; the UI is the same either way.

---

## G7 · The project brief is its own layer, and the main human-in-the-loop point
**2026-10-15** · resolves part of OQ Q2; brief-edit handling in G10

**The brief is a project property, not an activity property.** It will span
many activities, so it doesn't belong inside any one activity's review screen.
It becomes a layer of its own, the first one below D48's line:

```
INFORMATION SET   — what the learner must know         (decided by the SME)
──────────────── D48 line ────────────────
PROJECT BRIEF     — how it's delivered, to whom, in what style
ACTIVITIES        — generated from set + brief
OUTPUTS
```

The information set is where the subject gets decided; the project brief is
where delivery gets decided. In navigation it sits between Information Set and
Activities.

**It is mostly a form.** The brief is the key point where a human decides, so
its fields are set deliberately and read as structure, not prose. Leadership's
all-prompt direction applies to *reviewing generated content*; the brief is the
thing that content is held to, so it stays explicit.

**AI assists where the work is heavy, and never decides alone.** Assistance is
per field, depending on what the field holds:

| Field | Assistance |
|---|---|
| **Which points each activity covers** | AI **proposes** the assignment from the information set; the author accepts or adjusts. Curation must not be forced manual. |
| Output format (Full course / Refresher / Microlearning) | Author-set on the output; the format's bar is data (G13). No per-activity depth override. |
| Audience defaults (setting, roles, equipment, terminology) | AI drafts from the chosen audience; author edits. |
| Style, assets, standing constraints | Author-set. AI may suggest; it never fills these silently. |
| Assistant goal (D28) | Author-set. |

Every AI suggestion appears as a proposed value the author accepts, in the same
`proposed` sense as D16. Nothing in the brief changes without a person
accepting it.

**On the review screen the brief is one line of context**, e.g. *"Forklift
Brief v3 · Video · Refresher · Construction · 2 overrides"*. Clicking it opens
the project brief scrolled to this activity's spec.

**A project-brief edit reaches many activities.** Before saving, the edit shows
which activities inherit the changed fields. The author then picks what happens
to them (G10).

---

## G8 · The AI panel is a dockable module
**2026-10-15** · resolves the rest of OQ Q2

The parent's pinned left chat rail is gone. Review tooling is **one panel** with
tabs (Changes, Pending, History) and a composer for general instructions. The
author places it where the work needs it:

| State | Good for |
|---|---|
| Docked right | default: text and scene review |
| Docked left | preference, or pairing with a wide artifact |
| Docked bottom | **timeline modalities** — video and audio want width, and the change list lines up under the timeline |
| Floating | moved next to whatever is being reviewed |
| Minimized pill | full-screen judging; shows the pending count |

**Annotation stays on the artifact, wherever the panel is.** Clicking an element
opens a popover on that element, and a pending annotation leaves a pin on it.
The panel collects what has been queued; it isn't where annotating happens.

**A floating panel never covers the selected element.** It moves aside when the
author selects something underneath it.

**Position is remembered** per user, and possibly per modality (bottom for
video, right for a job aid).

**Deferred:** splitting the composer from the Changes list into separately
movable pieces. Start with one panel; split only if review shows a need.

---

## G9 · Review edits batch into one revision task
**2026-10-15** · resolves the batching half of OQ Q2

Everything the author does while reviewing a generation queues up in
**Pending** and goes to the AI together as **one revision task**. Nothing
regenerates per annotation.

A revision task can carry:

- element and region annotations (G4)
- restores of changed elements to their previous value (G5)
- accepts or restores of unrequested changes (G6)
- treatment-level spec edits — audience, length, assistant goal (G14)
- general instructions from the composer

**Locks are not task items** (revised 2026-10-16). A lock has to be in force
*before* the task runs for the engine to honour it, so locking and unlocking
apply immediately; the task **records** which locks were in force. The mock
already behaves this way.

Brief edits, and spec edits to an activity's **points**, are **not** part of a
revision task. They are the other lever (G10, G14).

**Why one task per round:** each generation then has one readable cause in
History. Recomposition happens once instead of once per edit, which gives drift
(G6) fewer chances. And the author reviews the whole artifact before asking for
anything, rather than chasing one fix at a time.

**A task is a unit with status.** It shows as queued, then working, then done in
History. While it runs, the affected elements show `working` status on the
artifact (parent node `status`), and the new generation opens with the change
map (G5) on.

---

## G10 · A brief edit asks the author: start over, or analyse what still holds
**2026-10-15** · resolves OQ Q8

Saving a change to the project brief offers **two actions, and the author
picks one**. Only activities that inherit the changed fields are in scope; an
activity that overrides a field isn't affected by a change to it.

### Action 1 · Refresh — start over

Every affected activity gets a fresh generation from the new brief. Prior
generations stay in History as the old lineage.

Before it runs, the author sees what a fresh start throws away: **locked
elements and verbatim values** set in earlier rounds (G4), and **approvals**
(D41). Locks are listed with a keep-or-drop choice, since they record decisions
the author made, and a refresh shouldn't silently undo them.

Right when the brief change is fundamental — a new audience, a new visual style
— and patching existing content would cost more than regenerating it.

### Action 2 · Analyse — check existing content against the change

The AI reviews each affected activity's current generation against the edited
brief and reports, per activity and per element, one of:

| Verdict | Meaning | Example |
|---|---|---|
| **Holds** | unaffected by the change | narration that doesn't use the changed terminology |
| **Out of date** | reflects the old brief, but isn't harmful | an earlier visual style, an older term the audience still understands |
| **Wrong** | conflicts with the new brief | depicts something a new standing constraint forbids; wrong equipment for the new audience |

The verdicts are **proposals** (D16): the AI does the legwork, the author
decides. Each finding gets a **disposition** from the author:

| Disposition | What happens |
|---|---|
| **Update** | queued as an annotation in that activity's Pending (G9) |
| **Delete** | queued as a removal in that activity's Pending |
| **Leave as is** | recorded as a deliberate decision; the finding closes |
| **Start over** *(whole activity)* | that one activity gets Action 1 |

So analysis doesn't invent a new editing path. Its output feeds the same
revision tasks review already uses (G9), and running them is the same batch
action. Each activity's next generation then shows its changes through the usual
change list and map (G5).

**"Wrong" can't be ignored by default.** Following the parent's flag-vs-gate
split (D14, D19, D37): *out of date* is a flag, and leaving it is a judgment
call. *Wrong* blocks approval of that activity until it has a disposition, and
*leave as is* on a wrong finding asks for a reason.

**Analysis is what makes the brief safe to edit.** Without it, every brief edit
is either a blind regenerate or a manual audit of every activity. With it, the
author can make a small terminology fix and get back a short list of the places
it matters.

---

## G11 · Content approvals carry; a publish approval never does
**2026-10-15** · resolves OQ Q12

There are two kinds of approval, and they behave differently when things
change.

| | Content approval | Pipeline handoff *(was "publish approval"; renamed by G12)* |
|---|---|---|
| **On** | an activity's content: depth, coverage, accuracy (D41) | an output, as a whole, for entry into the publish pipeline |
| **Gates** | that activity's readiness | admission to the pipeline (D31) — release itself is the pipeline's |
| **When something changes** | carries over if its content didn't change | **cleared** — a new approval is required |

**Content approvals carry over.** After a brief edit (G10), an activity whose
findings were *holds*, *out of date* or *leave as is* has the same content it
was approved on, so its approval stands. An activity that gets updated or
started over has new content, and D41 applies as usual: the approval shows as
out of date and a human re-approves. A *wrong* finding left as is also keeps its
approval, but its reason travels with the activity, so whoever approves publish
sees it.

**A publish approval is pinned to the exact state it approved,** meaning the
brief version, each activity's generation in the output, **and the version and
lifecycle of every point those activities claim** (added 2026-10-16 when the
information layer was ported). If any of that changes, the approval no longer
applies:

- a project-brief edit that reaches the output, even when every finding holds
- a revision task applied to any activity in the output
- an activity added to or removed from the output
- a refresh (G10, action 1)
- an information point being edited (version bump) or archived

The output goes back to needing approval, and publish is blocked until it gets
one. The old approval stays in history, marked with what changed after it.

**This is stricter than D41 on purpose.** D41 shows an approval as out of date
and doesn't block, because whether a change matters is a human judgment, and a
trivial wording fix shouldn't throw out an SME's review. That still holds for
content. But a publish approval is what lets content reach learners, so it must
never be standing in for a state nobody approved. Nothing reaches publish on an
approval given before a change.

**Re-approving handoff is lighter than the first time.** The approver sees what
changed since the last publish approval: the brief diff, each activity's
generation changes (G5), and every *leave as is* disposition with its reason.
They review the delta, not the whole output.

---

## G12 · Two roles, three approvals; the goal says whether the SME is required
**2026-10-16** · resolves OQ Q5 in part; fills the role gap in G11

The model had two approvals and no roles. The parent is explicit that the LED
has limited subject knowledge (D8), that depth confirmation is the SME's
(D16), and that a goal may require it (D17). So:

| Approval | On | Granted by | Means |
|---|---|---|---|
| **Content approval** | an activity's generation | the **LED** | "This generation is the intended artifact." Granted from the learner preview report (G1). Pinned to the generation; a later generation shows it as out of date (D41). |
| **Depth confirmation** | each point an activity claims, at a depth | the **SME** | The parent's `confirmed` tag, unchanged (D16). Made from the same preview report, per point. Pinned to the generation it was confirmed against; stale only for points whose carrying elements changed. |
| **Pipeline handoff** | an output | the **LED** | "This exact state may enter the publish pipeline." Pinned to brief version + every generation (G11). Replaces the earlier "publish approval" wording. |

**Release is not ours.** Publishing, content-library configuration and
translation are a separate downstream workflow owned by the pipeline (D31). Our
last gate admits content *into* that workflow; it does not release it to
learners. So there is no third "release owner" role here.

**Whether the SME is required is a content-team decision**, likely applied to
work above a market-importance threshold. It is **not derived** by this model.
The least-configuration home for it is the one the parent already has: the
project **goal** carries `requiresConfirmation` (D17), and the content team
picks the goal. If the team ever needs SME-required independent of goal, it
becomes a single project-level flag — added when needed, not before.

**The SME works from the preview, not the authoring surface.** The preview
report lists which points a learner reached and where; the SME confirms each
depth there. This keeps D8 (SMEs as bookends) while reopening the cheapest part
of Q5: the SME needs a link and a role, not the review tooling.

**Gates for pipeline handoff, by goal:**

| Gate | Goal without SME | Goal with SME |
|---|---|---|
| Every activity content-approved (LED) against its current generation | required | required |
| Every claimed depth SME-confirmed against the current generation | — | **required** |
| Output previewed since the last change | when traversal is generated (G1) | same |
| Threshold met (G13) | required | required |

**Consequence for the mock:** depth provenance (D16) comes back — the threshold
table shows it per point, the preview report gains the SME's confirm control,
and a role switch lets a reviewer demo each path.

---

## G13 · The bar lives on the output's format; there is no activity depth override
**2026-10-16** · revises G2

The question was where a refresher's lower bar is recorded. Three candidates:
an override on the variation activity (G2's original wording), a bar on the
output, or a new goal. The principle that decided it: **reuse the configuration
axes that already exist; add none.**

| Configuration | Lives on | Status |
|---|---|---|
| Required depth per point | information set | parent, D13 |
| Goal — evidence rules, SME required | project | parent, D17 |
| **Format** — Full course · Refresher · Microlearning | **output** | ours (G2), moved from activity to output |

**The format sets the bar.** *Full course*: every point at its required depth.
*Refresher* / *Microlearning*: Awareness on the points the output carries. Held
as a data table like the goals, so leadership can add formats without new code
paths. The Outputs card names the format it validated against.

**What this removes:**

- The **activity-level depth override**. An activity delivers what it delivers:
  the generator claims a depth, the reviewer checks it, the output's format
  decides whether that is enough.
- The **refresher as a configured activity variation**. "Make this as a
  refresher" is a treatment instruction in the spec — shorter, lighter — the
  same kind of thing as audience depiction. The *configured* thing is the
  Refresher **output**: a separate configuration, not an override.

Audience variations are unaffected: they never touched depth and stay
activity-level because they change depiction, not the bar.

**Why not a goal.** Goals are about evidence standards (SME-confirmed, assessed).
A refresher lowers the bar but needs the same evidence rules as whatever goal
the project has. Making it a goal would multiply goals × formats into one list.

---

## G14 · Spec edits split by field: treatment rides the next task, points get the G10 choice
**2026-10-16** · resolves the gap raised after Pass 2

An activity's spec has two kinds of field, and they already map to a line the
model draws — *what* is taught versus *how* it is delivered.

| Spec field | Kind | Path |
|---|---|---|
| Audience variant, treatment/length, assistant goal, activity constraints | how | **Rides the next revision task** as an item ("spec: audience → Fire service"). The generation that comes back shows what moved via G5/G6, like any annotation. Nothing regenerates until the task is sent. |
| **Points covered** | what | **Scoped G10**: adding or removing a point opens the analyse/refresh choice for this one activity. Analyse reports what in the current generation already covers an added point, or what carried a removed one. |

**Removing a point clears any SME confirmation on it**, reported rather than
silently repaired (D43). Adding one leaves existing confirmations alone.

**Why not one path.** G10's analysis exists because a brief edit reaches many
artifacts the author can't eyeball. A treatment edit reaches one artifact the
author is looking at, so the loop is the right weight. A points edit is a
change to the activity's *claims*, which is what confirmations hang on — so it
gets the heavier handling regardless of grain.

**Modality** is not editable on an existing activity. Changing modality is
transmute (parent `MODEL.md`), which creates a sibling activity.

**Built 2026-10-19 (Pass 8).** Two things the build settled:

- *An added point the generation doesn't carry* is a fourth analysis verdict,
  **not covered**, with two dispositions: **cover it** (a `cover` item in
  Pending — the next generation adds a carrier, and that carrier is the
  requested change) or **claim anyway**. The second leaves a claim standing
  with no carrier: Coverage and the preview report show it as not reached, and
  it travels to the handoff review as "left as is". Whether an uncarried claim
  should be allowed to stand at all is open; the mock allows it and makes it
  visible rather than forbidding it.
- *A removed point* is simply no longer claimed by the next generation — the
  generator re-proposes its claims against the spec — and the diff attributes
  the dropped claim to the spec, not to drift. The content that carried it
  stays unless the author removes it in the analysis.

---

## G15 · A spec item is attributed by scope, not by element
**2026-10-19** · raised by building G14

G5/G6 attribute a change to a request by element id: an annotation targets an
element, so a change to that element is requested and everything else is
drift. A treatment-level spec edit (G14) names no element — "make this
refresher-length" legitimately moves every narration line — so by-id
attribution would report the whole generation as drift.

A spec item therefore declares a **scope**: the element kinds and fields the
field is entitled to move, supplied by the modality adapter. For the video,
*treatment* may move narration text and remove lines; *audience* may relabel
objects and redraw backgrounds; *assistant goal* may rewrite overlays;
*activity constraints* may move nothing (they steer generation; if a
generation changes under a constraint edit, that change is drift). For the
scenario: *treatment* → step exit gates and probes; *audience* → settings;
*goal* → the coach persona; *constraints* → characters' dress.

Everything inside the scope is requested; everything outside is drift, caught
by comparison and shown louder (G6), exactly as for an annotation. This keeps
G6's stance — attribution never trusts the generator's account of what it did
— while giving a spec edit the breadth it needs. A `cover` item is scoped the
same way: a new element of the carrier kind, plus the claim it adds.

---

## G16 · An output's structure is composed from a brief, and every connection carries its reason
**2026-10-19** · Pass 9, stage 1 · builds on parent D4 (edges live in the output) and D47 (reachability is computed; the author pins)

**Compose** was the one parent operation never built. It is now the same
shape as everything below the line in this spin-off: a **composition
brief** directs it, the AI **proposes** the structure, the author reviews and
accepts (D16). The brief is three things: the **default path** (an ordered
list — the spine every learner is expected to follow), **rules** in prose
that route by outcome, and a **completion** rule.

**Outcomes are flat and per modality** (settled with the user, 2026-10-19):
a knowledge check passes or fails; a scenario lands a level at a beat step;
a video, podcast or job aid completes. Score bands belong to the real
product, not this proof. **The entry is single and pinned**: every learner
starts at the same activity, so every path has one root and reachability is
one computation.

**Every connection carries its reason.** The map alone is not the QA
artifact; the map *with why each connection exists* is what a reviewer signs
off. Five kinds:

| Reason | Drawn by | Says |
|---|---|---|
| **default** | the brief's path | "Default path, step n" |
| **rule n** | a brief rule | quotes the rule; the outcome it fires on |
| **repair** | the composer | which point fell short on which path, and why this activity (the lightest carrier) was inserted |
| **pin** | the author (D47) | which rule's skip now lands here instead of past it |
| **gate** | the completion rule | the exit |

The composer's **reasoning** is kept in order beside the map ("Rule 3: Strong
on step 1 skips the check — straight to completion. Repair: on that path P1
fell short of Working, so the inspection card was inserted before
completion. Short: P3 is guaranteed on 4 of 5 paths and no repair exists.").

**Repairs never override a rule.** When a path is short, the composer inserts
the lightest activity that carries the point at the bar — as its **own
instance** in the structure, never a node a rule's loop already owns — but
it will not insert something the path's own rule skips. If the only carrier is
exactly what the rule skips, it reports **short** and offers the author the
fix: pin that activity required, drop the rule, or change the format's bar.
The author decides; the composer explains.

**The threshold reads reachability.** A point counts only if every path from
entry to completion carries it at the bar (D47). The Outputs threshold gains
"on paths: every path / n of m", and the handoff pin records the structure
version, so a pin, a new rule or an accepted proposal clears a handoff like
any other change (G11).

**Pins apply at once; brief edits propose.** A pin is the author's input to
the computation, so it recomposes immediately and bumps the version. A brief
edit (a rule added, the path reordered) produces a **proposal** — the
connections that would be added or removed, each with its reason, and the
composer's new reasoning — accepted or discarded.

**What the composer understands** is deliberately three rule shapes in this
mock (fail X → repeat Y, retry; level on step N → Y before Z; level on step
N → skip Z). An instruction outside them is **unmapped**: kept in the brief,
flagged, and a handoff gate until reworded or removed. The real product's
composer is a model; the point here is that an instruction it cannot honour
is surfaced, never silently dropped.

**Built 2026-10-20 (Pass 11) — creation and membership.** Creating an output
is writing its composition brief; the composer's first proposal is the
output, as v1. An output's **activity set is derived from its structure**:
an activity is in an output because a node refers to it. There is no
separate membership list to drift from the paths — adding to the default
path, or writing a rule that names an activity, is what adds it. Kind and
format are author configuration (G13): a format change moves the bar and
is caught by the output signature like any other change; a change to Course
drops rules and pins, because a Course is one path.

**A simplification to remember:** a scenario's outcome edges are treated as
alternatives in rule order. A learner can in fact be Strong on step 1 *and*
Unthoughtful on step 2; the mock routes on whichever rule fires first.

**Resolves OQ Q15:** a Course is one path, so an output walk-through is
optional; an Experience's traversal is generated, so the walk-through
(stage 2, the output rehearsal) is required before handoff.

---

## G17 · Output rehearsal is outcome-driven traversal; the all-paths table is the sign-off
**2026-10-19** · Pass 9, stage 2 · D33 and D44 applied at output level

At activity level the probabilistic thing is the coach's reply, so rehearsal
(D33) rerolls replies. At output level the probabilistic thing is the
**path** — which activity comes next given what the learner just did — so
output rehearsal is the same instrument pointed at a different variable.

**The walk.** The reviewer starts at the entry and, at each activity, picks
an outcome (the flat set from G16). Each button names the connection it
fires and the reason it carries, and the trace accumulates as a readable
record: *Entry → video (completed, default path) → scenario (step 2:
Unthoughtful) → podcast (brief rule 2) → check (failed) → inspection card
(brief rule 1) → check (passed) → completion (gate)*. **Change** at any step
truncates the trace there and rerolls everything after it — the D33 reroll,
applied to a route instead of a reply. At completion, the points table says
what this path reached against the bar.

**The sign-off.** Beside the walk, every path from entry to completion is
enumerated with every point against the bar. A red row names the path and
the point it misses. **Sign off all paths** is offered only when every row
is green, and it pins the structure version plus the activities' current
generations (via the output signature): a pin, an accepted proposal, or any
activity regenerating clears it, like a handoff (G11). The handoff gate for
an Experience reads it.

**The authoring gesture.** Where a walk ends short, the pin (D47) is offered
in the completion panel, naming the lightest activity in the structure that
carries the missing point at the bar. Rehearsal is where the gap is found,
so rehearsal is where the fix is made — the same stance D33 took at activity
level, where a kept roll becomes the example.

**What stays separate** (D44): the rehearsal shows its workings — reasons,
rerolls, the all-paths table. The learner preview (stage 3, built the same
day) shows none of them: it runs the real activities, follows the edges on
their actual outcomes — the scenario's landed levels, a pass/fail choice on
the check's stand-in since the real check would score it — and only the
**report** afterwards explains the path with the composer's reasons, the
points it reached, the beats fired, and which of the enumerated paths it
was.

---

## Coverage under generation

The parent has the LED tag coverage. Here the **generator claims** coverage and
the **reviewer checks** it:

- Each generation carries its own `covers` claims, `proposed` (D16), with the
  element or beat that carries each point.
- The reviewer adjusts or confirms. A confirmation pins the generation it was
  made against — the activity-side mirror of `at:` that D41 asked for. A new
  generation makes the confirmation **visibly stale**, never silently green, and
  never auto-renewed.
- Generated runtime content still needs beats (D42). Static rendered content can
  be verified by reading the generation.

Because every generation re-proposes its claims, *"what does this now appear to
cover"* — the "suggest" half of D41 — comes for free.

**Where it shows (Pass 8):** the review panel's **Coverage** tab — per claimed
point, the carriers in the viewed generation (elements with timestamps for the
video, the beat step for the scenario), who judged the depth, the point
version; a claim with no carrier is flagged with a one-click cover request;
content the generation carries that the spec doesn't claim is listed apart.
Approval and confirmation are still granted from the preview report (G12).

---

## Parent decisions — carried, changed, superseded

| | Decisions |
|---|---|
| **Carried as-is** | D2–D4, D6, D7, D11–D24 (the whole information and coverage model), D27–D29, D32, D34–D36, D38–D40, D42, D43, D45–D48 |
| **Changed** | **D5** — annotations may anchor precisely, because they anchor to an immutable generation (G4). **D30** — still permissive, but the manual editor is gone; precision comes from targeting. **D31** — generations are a design-time concept distinct from publish versions. **D33** — extended: candidate generations side by side. **D37** — moves from verbatim fields to annotation values (G4). **D41** — still holds for content approvals; a publish approval is cleared by any change instead of shown as stale (G11). **D44** — learner preview becomes a required gate (G1). |
| **Superseded** | **D25, D26** — sequence-editing rules for the video timeline, now constraints the generator must satisfy and review must check rather than drag behaviours to refuse. The `MODALITIES.md` surface designs — replaced by review renderers. **D10** — visual direction to be decided for a review-first surface. |
| **Revisit** | **D8** — SMEs as external bookends. A shareable generation makes in-platform SME review cheap. See OQ Q5. |

---

## Scenario — the seven answers (built 2026-10-16)

The first modality to answer the questions below after video, and the one
that tests the model hardest, because its content is generated at runtime.

| | Scenario |
|---|---|
| 1 · Previewed how? | **Generated at runtime.** Authoring review is the parent's rehearsal (D33): Read for verbatim content, Calibrate to see which level catches an answer, Play for free conversation with reroll. Learner preview plays one run. |
| 2 · Elements | The six-stage spine as element groups: narrative, opening messages, setting, canon facts, characters, coach persona, tone guidelines, misconceptions; per step — purpose, opening/brief, scene, exhibit, rubric items, calibration guidelines, pinned examples, key points, probe, final word; closing summary, components, references; and the **coverage claims** as one element. |
| 3 · Excerpt | The element's primary text; for multi-field elements (character, guideline) every field. |
| 4 · Beat | A **step** (D42, D46). The coverage element names the beat per point; the reviewer checks the step is unskippable (exits after ≥1 turn). |
| 5 · "What changed" | Text diff per field, as for video. Plus the **coverage element**: a moved beat is a field change. No timeline; Jump switches to the element's phase and step. |
| 6 · Depth guidance | Working credibly; Mastery when a roleplay holds under pressure. Guidance only (D15). |
| 7 · Generator guarantees | Carryover names steps by id, never position; an opening is verbatim; the closing ships verbatim on every path; a kept roll becomes the level's example and is locked. |

**Two things the port settled about the model:**

- **Keep-as-example is a Pending item** (`pin`), not a direct write. D33 made
  rehearsal an authoring gesture; G9 makes every edit a task item. A pin is a
  targeted request whose value is already known — exactly the shape G5 gave
  restore — so it rides the next task and locks on landing.
- **Drift's second form is real.** Rewriting a guideline regenerates the
  example drawn under it and can re-anchor a beat. Both show as unrequested
  because the diff compares generations rather than trusting the generator
  (G6). A point whose beat step changed shows its SME confirmation as stale,
  per point (G12).

---

## What each modality now has to answer

Replaces the parent's seven framework questions. A modality no longer needs an
authoring surface; it needs a **review renderer**.

1. **How is a generation previewed in authoring review?** And is it static or
   generated at runtime (which decides whether rerolling applies)?
2. **What are its elements?** The addressable parts, and their targeting grain.
3. **What is the excerpt type** an annotation captures?
4. **What is its beat?** (D46 — shared word, defined per modality.)
5. **What does "what changed" look like** between generation n−1 and n?
6. **Which depths can it credibly reach?** Guidance only (D15).
7. **What must the generator guarantee structurally?** e.g. a check never before
   the scene it tests (formerly D25).
