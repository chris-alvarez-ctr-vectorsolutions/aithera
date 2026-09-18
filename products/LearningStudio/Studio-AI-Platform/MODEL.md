# Studio AI Platform — Content Model

> The architecture behind the prototype. This document holds the **reasoning**;
> `index.html` holds the implementation. If the two disagree, this document is
> the intent and the code is behind.
>
> Status: exploration. Nothing here is committed engineering.

---

## What this is

An AI-first authoring platform where a chat layer drives a content canvas, over
a deeper manual editing surface. It is **not** a course builder with AI bolted
on — the content model is deliberately not course-shaped.

The user is an internal **LED** (Learning Experience Designer) with limited
subject knowledge. **SMEs are external** and act as bookends — upfront input, or
final review and approval — not as ongoing collaborators. This is why the
platform leads with AI proposing and the LED shaping, rather than AI
interviewing an expert.

---

## Vocabulary

We deliberately avoid the word **"course."** It presumes linear structure, a
start and an end, and completion-as-finishing. The direction here is a body of
information that gets a learner to an outcome — whatever grouping and modality
meets the threshold is the experience they're delivered.

| Term | Meaning |
|---|---|
| **Learning Project** | Top-level container. Holds one information set and everything derived from it. Authoring-side term; learners never see it. |
| **Information Set** | The verified teaching points that define the subject. The primary artifact. |
| **Information Point** | One teaching point. **Design-time context, never delivered to a learner** — it is the source an activity is authored from. The durable unit; survives every regeneration below it. |
| **Learning Activity** | A modality expression of one or more points: video, podcast, scenario, knowledge check, job aid, reflection. |
| **Output** | What gets delivered. Either a **structural format** (Course, Training — defined shape, ordering rules) or an **open-ended format** (Experience — assembles from learner interaction). |
| **Goal** | The standard the project is held to — Compliance, Capability. Sets the default depth bar and the evidence rules. |

> "Outputs" is still a placeholder for the collective noun over Courses and
> Experiences. It may not need one.

---

## The three layers

```
Learning Project — "Forklift Safety & Operation"   goal: Compliance
  │
  ├─ INFORMATION SET            ← the primary artifact
  │    6 verified teaching points
  │    each declares a REQUIRED DEPTH
  │         │
  │         │  derive ↓          (transmute works laterally here)
  │
  ├─ LEARNING ACTIVITIES        ← modality expressions
  │    video · podcast · scenario · check · job aid · reflection
  │    each TAGS the points it covers, at a DEPTH
  │         │
  │         │  compose ↓ / decompose ↑
  │
  └─ OUTPUTS
       Course (structural)  ·  Experience (open-ended)
       validated against the information set
```

**The information set is the primary artifact.** Everything below it is
derivable and regenerable; the points persist. That is the core claim of the
platform — you are building an information architecture with content generation
attached, not a content editor with an information model bolted on. It is also
why the back catalog is commercially interesting: it isn't a library of courses,
it's an unextracted library of information points.

### Operations

| Operation | Direction | What it demonstrates |
|---|---|---|
| **Derive** | points → activities | Activities are authored against the points. |
| **Transmute** | lateral, at the activity layer | Same points, another modality. Proves the information layer is real. |
| **Compose** | activities → output | New sequencing, or non-sequenced assembly. |
| **Decompose** | output → activities | The migration path for the existing course library. |

Transmute is **not** a conversion. A video and a podcast are distinct activities
carrying the same teaching points — not one activity rendered twice. That
distinction is what the information layer exists to express.

---

## Node addressing — one scheme, three consumers

Chat turns, canvas selection, and comment threads all name nodes **by id**,
never by DOM element. This is the single most load-bearing decision in the
build.

```js
{
  id:       'n_7f3a',          // stable, opaque, survives re-render and rebuild
  type:     'question.multiple-choice',   // dotted — family fallback for
                                          // half-registered types
  layer:    'information' | 'activity' | 'output',
  status:   'idle' | 'thinking' | 'working' | 'stale',
  capabilities: [...],         // what may be done to this node
}
```

**Why id-addressing matters:** a canvas repaint mid-prompt cannot orphan a
comment or lose a chat turn's referent. The node re-renders from its id and
keeps its identity.

**Why `status` lives on the node:** it's what lets the collapsed chat rail and
the canvas both read working state from one source. Put status in chat state and
a hidden rail can't report it.

**Why `capabilities` matters:** the canvas must not know what a multiple-choice
question is. It asks the node what may be done to it. That's the registration
seam that makes the shell content-agnostic — a new content type declares
capabilities and gets correct selection behavior for free.

---

## Coverage — tags, not a hierarchy

An activity **satisfies or doesn't satisfy** an information point. The
relationship is many-to-many: a scenario may carry the whole set; a point may be
carried by many activities.

```js
activity.covers = {
  'info-3': { depth: 'working', state: 'confirmed' },
  'info-4': { depth: 'working', state: 'adjusted'  }
}
```

### Depth — Awareness / Working / Mastery

| Level | Meaning |
|---|---|
| **Awareness** | knows it exists |
| **Working** | can do it with support |
| **Mastery** | can do it unaided |

Learner-capability language, chosen to match the threshold framing.

**Depth is never derived from modality.** A scenario-based knowledge check with
a long-read stem can assess as validly as a high-fidelity simulation — it is the
LED/SME's discretion. Format may *suggest* a starting value; it never determines
one.

### Tag provenance

Because depth is a judgment, we track who made it:

| State | Meaning |
|---|---|
| `proposed` | AI's guess — unreviewed |
| `adjusted` | LED has set it |
| `confirmed` | SME has confirmed it |

This lets the quality gate distinguish a guess from a judgment — and lets a
Compliance-goal project *require* confirmation.

---

## The threshold

**The information set is the threshold that equates to a learned subject.** An
output is valid when every point is satisfied to the depth that point requires.

Required depth is set **per point**, because a tip-over survival point demands
more than a right-of-way point. A point without its own bar inherits the
project goal's default.

### Goals are a separate axis from depth

Compliance is **not** a rung between Working and Mastery. It is a different kind
of bar: it may demand documented, SME-confirmed assessment while asking only
moderate cognitive depth, where Capability demands demonstrable performance and
cares less about paperwork.

```js
GOALS = {
  compliance: { defaultDepth: 'working',
                requiresConfirmation: true,   // depth must be SME-confirmed
                requiresAssessment: true },   // every point needs assessing
  capability: { defaultDepth: 'working',
                requiresConfirmation: false,
                requiresAssessment: false }
}
```

Two to start. Held as **data, not hard-coded branches**, because leadership will
define the real list.

### Validation rule

A point is **satisfied** when the highest depth any activity in the output
delivers meets or exceeds the point's required depth.

A point that reaches its bar with nothing built up beneath it still passes, but
is **flagged** — assessed without being taught. Practical gate; quality signal
still surfaced.

The goal then applies its evidence rules on top.

---

## Points are context; activities are content

**An information point is never delivered to a learner.** It is written as
context for the AI and the designer — the source from which activities are
derived. This is what decides the reuse model:

| | Shared? | Mechanism |
|---|---|---|
| **Information point** | no | Not shared, instanced or variant-ed. It isn't a deliverable, so there is nothing to instance into a course. One point sources many activities, one-way. |
| **Learning Activity** | yes | The deliverable unit — structurally a Learning Object. Follows the org's established **Shared / Unique / Instance** model. |

Because activities are project-owned deliverables, their depth tags stay
unambiguous: depth is about how *this* activity treats a point *in this
context*.

### A point is the smallest definable facet of a subject

Atomicity is the authoring rule. A point covers one facet — not a cluster of
related guidance — which is what makes coverage tagging honest: an activity
either satisfies the whole facet or it does not.

### The point document

A point is the **generation source**, so it carries the substance an activity is
built from, not a summary. The card in the list is an index entry; the point
itself is a document, drilled into and edited either directly or by targeted
prompt.

Five named sections — structured enough for reliable AI boundaries, written as
prose so an SME reads it top to bottom:

| Section | Carries |
|---|---|
| **The point** | the claim itself |
| **Why it matters** | the reasoning; what goes wrong without it |
| **Specifics & thresholds** | figures, procedures, conditions, exceptions |
| **Common failure modes** | how it actually fails in practice |
| **What competence looks like** | the observable behaviour of someone who has it |

### Usage guidelines are walled off

Directives about *how to use* a point — pairing rules, depiction constraints,
"do not generate specific figures until the SME confirms" — live **outside the
document**, in their own panel.

This is a **guardrail, not a layout preference.** Mixed into the document, a
directive like *"do not depict a rollover graphically"* can leak into generated
narration. The separation gives a defined line to wall off: usage is never
passed to language generation.

It also means an SME reviewing for accuracy reads only the information, and the
two halves have different reviewers and different lifespans.

### Point versioning and drift

A coverage tag pins the point **version** it was authored and judged against:

```js
'info-3': { depth: 'working', state: 'confirmed', at: 2 }
```

Drift is then **computed, not fired as an event** — if the point has moved on,
every tag pinned to an older version is out of date. Severity comes from the
point's **lifecycle**, never from diffing content, because materiality is a
human declaration rather than something to infer:

| Point state | Derived activity | Blocks delivery? |
|---|---|---|
| `current`, tag pinned behind | low-severity "update available" | **no** |
| `archived` | critical | **yes** — hard no-deliver dependency |

**Out of date is not a defect.** Standards evolve — WCAG versions, electrical
codes — and the field carries its own grace period for how long the older
guidance remains acceptable in practice. The old information is not wrong, only
not current. So drift is advisory and soft, with **no deadline field**.

**No-deliver is a leadership call.** Out-of-scope tooling may scan information
points for outdated or risky content, but a human declares the severity and
assigns the work to LEDs.

### Re-confirming depth after a version bump

Confirmation is **never revoked** by a version bump. It records which version it
was made against, so *confirmed-against-current* is derivable — no fourth tag
state needed. The goal rules then decide whether that is good enough
(`requiresCurrent` is true for Compliance, false for Capability).

Deciding whether depth still holds after v2 → v3 is a **delta review** —
AI-assisted, LED/SME collaboration. That flow belongs to the information
updating phase, which V1 starts past (D7). V1 models the resulting *state*, not
the review.

---

## Collaboration — two comment kinds

| Anchored to | Kind | Lifespan |
|---|---|---|
| **Information point** | subject-matter review — correctness, currency | persists across every derivation |
| **Learning Activity** | production feedback — treatment, pacing, tone | retires with that activity |

**Comments anchor at node level only.** Sub-node ranges are promptable but
**never persisted as anchors** — a regenerated string would orphan the thread.
The asymmetry is deliberate: a prompt's anchor only has to live as long as the
prompt; a comment's has to live as long as the conversation.

A comment doesn't need to point *at* the broken text — it needs to get a human
to the bundle where the problem is. Navigation, not annotation.

### Excerpts

Comments capture the **cheapest legible representation** at write time — a
historical snapshot, never a live anchor, so it cannot break:

| Entity | Captured |
|---|---|
| Text | the quoted string |
| Image / scene | thumbnail as it appeared |
| Audio | transcript line + timestamp |
| Video | poster frame at the commented timestamp |
| Structural | described state — *"was: 3 bundles, quiz last"* |

Plus a **change marker** whenever the anchored content has changed since the
comment was written.

---

## Shell

- **Chat rail** — fixed side rail, collapsible to zero width. Passive: intent
  capture that *drives* the canvas, never the loudest thing on screen. Records
  the overall process; mini-processes resolve in the canvas.
- **Canvas** — renders nodes per type. Selection is coarse (node); a second
  click targets a sub-range for prompting.
- **Icon rail** — layer switching as a mode selector, outboard of the chat rail.
- **Manual editor** — a deliberate view swap, not an overlay. Carries selection,
  the points the node must cover, open threads, and a return path.

Status readout sits in the context bar and reads off **node** status, so it
stays truthful whether the log is open, hidden, or mid-repaint.
