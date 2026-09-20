# Studio AI Platform — Open Questions

> Unresolved structural and theoretical questions, with what each would change.
> Ordered by how much UI surface they'd reshape if answered *after* a UX pass
> rather than before.
>
> **A question being deferred is fine. A question being forgotten is not** —
> that's what this file is for.

---

## RESOLVED since first writing

**2026-09-20 — a pass through every open question.** Nine closed:

- **Q4** (library vs. document) → **D34.** Neither: the project is the authoring
  unit, and the library is what *accumulates* from projects. Import copies.
- **Q5** (evidence for depth) → **D35.** No separate field; confirmation is the
  evidence.
- **Q6** (activity in multiple projects) → **D34.** One project; sharing is the
  org's existing Shared LO model.
- **Q7** (collective noun) → **D36.** "Outputs" stays.
- **Q13** (scenario opening) → **D38.** Stays on the activity, no compose rule.
- **Q14** (`implementation_id`) → **D39.** Derived from the node id, read-only.
- **Q15** (what the export is for) → stubbed as a preview, per the user: *"we
  don't need this to produce or handle real files — this is just UX
  exploration."*
- **Q16** (rubric → point binding) → **D40.** No; coverage stays at activity
  level.
- **Q17** (prompt-smell lint) → **D37.** Blocks on verbatim, warns on guidance.
- **Q18** (`help_turns`) → built as a pacing control beside the exit gate.
- **Q11** (verifying a long activity) → **D42.** Wrong axis: it is not length but
  whether the content is *generated*. Static content is verifiable at activity
  level; generated content anchors to a **required beat** the learner cannot skip.
- **Q12** (activity content moving) → **D41.** Staleness is computed and shown;
  re-approval is always human.

**Thirteen of eighteen closed** (Q3 too — D41 and D42 answer it directly). What remains is one cluster (Q1/Q2/Q3 — the
update-review flow, deferred with D7), three explicitly deferred (Q8/Q9/Q10), and
two new ones raised by the answers (**Q19**, **Q20**).


- **Q4 (reuse scope)** → D18. Wrong question for points: they are design-time
  context, never delivered, so not shared. Activities are the shareable unit and
  follow the org's existing Shared/Unique/Instance model.
- **Q6 (activity in multiple projects)** → D18. Yes, via that same mechanism.
- **Q3 (coverage tag staleness)** → D19. Tags pin a point version; drift is
  computed, severity comes from the point's lifecycle.
- **Q2 (set changes after outputs exist)** → D19. Partially: derived activities
  carry a low-severity update tag, or a critical flag if the source was
  archived. The *review flow* for acting on it is deferred (see Q1).

---

## Blocking a UX pass

### Q1 · Versioning and staleness
**Partially resolved by D19** — points now carry a version and a lifecycle, and
activities pin the version they were authored against. **Further resolved by
D31:** detailed version control is **not this platform's problem** — the platform
is a design surface with its own drafts and interim saves, and a dedicated
publish pipeline owns versioning and gates everything reaching live services.
The "published version distinct from the working one" speculated about below is
therefore settled in principle.

What remains open is the *review* flow, deferred with the information-updating
phase (D7), and what the **design surface** should show about published state.

**Narrowed again 2026-09-20 by D41:** the *signal* half is built — the surface
computes and shows when an approval has gone out of date. What is still missing
is the **flow** a reviewer follows from that signal, which is the same
delta-review deferred by D20.

**Would reshape: the update-review surface.**

Activities and outputs still don't version. SMEs correct information points, activities get regenerated,
outputs get recomposed — and there's no notion of *which version of a point* an
activity was authored against.

The question this can't currently answer:

> "This course shipped in March. Point 3 changed in June. Is the shipped course
> now wrong?"

For a Compliance-goal library that's the audit question, not an academic one.

**What it adds to the UI:** history affordances, staleness indicators on nodes
and tags, diff views, possibly a "published version" concept distinct from the
working one.

**Absorbs:** Q2, Q3.

---

### Q2 · What happens when the information set changes after outputs exist?
*(part of the Q1 conversation)*

Add a seventh point and every existing output silently becomes incomplete.
Remove one and activities carry tags to nothing.

Is that a notification, a blocking state, a diff, a re-validation prompt? This
is the **most likely real-world event** in the whole system and it is currently
unmodelled — the validation engine assumes a static set.

---

### ~~Q3 · Coverage tag staleness~~
**RESOLVED 2026-09-20 → D41 + D42.** This asked exactly the right question —
*"if the hazard walkthrough is shortened, its tags survive unchanged"* — and it
is now answered on both halves:

- **D41** computes it. An approval records what it was granted over, so the
  surface shows *"this approval is out of date"* when that content moves.
  Advisory, never gated; re-approval is a human step.
- **D42** prevents the sharpest case. A point covered by generated content names
  a **beat** that guarantees it, and deleting that beat reports the points that
  just lost their guarantee rather than leaving a claim that quietly stopped
  being true.

**Rejected as predicted-but-wrong:** a `stale` state on the tag. Staleness is
*derived* from what the approval was made against, exactly as D20 decided for
point versions — no fourth tag state, and one fewer thing to keep in sync.

---

### ~~Q4 · Reuse scope — is the information layer a library or a document?~~
**RESOLVED 2026-09-20 → D34.** Neither option as posed. Points are authored inside a project; the library is what accumulates across projects and gives the next one a starting position. Import copies, so there is no shared-edit governance problem.

### Modality authoring surfaces
**Started 2026-09-18 — tracked in `MODALITIES.md`, not here.**

Each modality (video, podcast, scenario, knowledge check, …) needs its own
authoring surface within one shared workflow. Multi-session by nature; the
framework, the shared-workflow contract, and the per-modality status live in
`MODALITIES.md`.

Settled so far: **activity-level coverage tagging** (justified by the tagging
contract — an activity either satisfies a point to a depth or it does not —
*not* by any fixed LO length; see the rejustification in `MODALITIES.md`),
**activity size is the author's call** (an activity may equal an output, or
several may stack into one), **LED-side depth editing** (SME confirmation shown
as state, never performed in-platform), **scenes are a production unit** not a
content boundary, **checks vs. assessments** are different instruments with
different binding and reuse rules, and the **AI assistant** is a modelled entity
(D27–D29).

---

### Q20 · What counts as a beat outside a scenario?
**Raised 2026-09-20 by D42.**

D42 says generated content anchors to a required beat, and the user expects the
pattern to *"expand past video and scenario outputs."* In a scenario a beat is a
step. Elsewhere it is undefined:

- **Video** is static once rendered — every learner sees the same frames — so it
  may need no beats at all. But a video *with checks* is partly interactive, and
  a check the learner can fail is closer to a beat than a scene is.
- **An adaptive output** (the Experience format) is where this bites hardest: the
  path itself is generated, so a beat has to be a property of the *composition*
  rather than of any one activity.
- **A podcast or job aid** may be wholly static and need nothing.

**The question:** is a beat a per-modality concept that each surface defines, or
one shared primitive — *"a unit the learner provably reaches"* — that modalities
register against? The second is more consistent with the node model, and is
probably right, but it has not been designed.

**Would reshape:** the coverage panel wherever a modality has generated content,
and the Experience format's validation.

---

### Q19 · Does the library notice when a copy diverges?
**Raised 2026-09-20 by D34.**

Points are project-owned and importing copies, which is what removes the
shared-edit governance problem. The cost is the mirror image: if project B
imports a point and project A later corrects it, **nothing propagates and
nothing notices**.

That is correct for delivery — B's activities were authored against B's copy,
and changing it underneath them is exactly the drift D19 is careful about. It is
less obviously correct for the *library*, whose value is being the place you
find what the organisation knows. A library holding three divergent versions of
the same OSHA rule is worth less than one that can say so.

Not a propagation question — that was settled by copying. A **reporting**
question, and it belongs with `L1` (the information-set health surface) rather
than with the authoring flow:

- does the library show that a point has diverged across projects?
- can it show which copy is newest, or most recently SME-confirmed?
- is "reconcile these three copies" a real operation, or a human conversation?

**Would reshape:** the library's own surface, which does not exist yet.

---

### ~~Q11 · Does a long activity need its coverage located internally?~~
**RESOLVED 2026-09-20 → D42.** The framing was wrong: length is not the axis.
A **short generated** activity has the same problem and a **long static** one
does not. Static content is verifiable at activity level because every learner
receives the same bytes; generated content needs a **required beat** — a
milestone the learner reaches whatever path they take, or tests out of by
demonstrating the point.

### ~~Q12 · Nothing detects that an activity's own content moved~~
**RESOLVED 2026-09-20 → D41.** The platform computes and shows that an approval
is out of date; a human re-approves. It may *propose* what edited content
appears to satisfy, never adjust. Advisory, never gated — the same call D19 made
for drift.

---

## ~~Raised by the parity pass~~ — all resolved 2026-09-20

*Six questions raised after working through the parity items, all settled the
next day. Kept as a record of what was decided and why; the reasoning lives in
`DECISIONS.md`.*

| | Question | Resolution |
|---|---|---|
| **Q13** | Does the activity own a scenario-level opening? | **D38** — yes, and no compose rule silently removes duplicates. What was authored is what is delivered. |
| **Q14** | Should `implementation_id` be authored? | **D39** — no. Derived from the activity's node id, shown read-only. A typo should not be able to repoint a scenario. |
| **Q15** | What is the export for? | **Stubbed as a preview.** Per the user: *"we don't need this to produce or handle real files — this is just UX exploration."* It shows what a player would get and what the projection loses; it moves nothing. |
| **Q16** | Should a rubric item bind to an information point? | **D40** — no. Coverage stays a claim about the whole activity; binding in one modality only would be a worse inconsistency than the precision it buys. |
| **Q17** | Is the prompt-smell lint right? | **D37** — split it. Blocks on verbatim text (the learner reads it), warns on guidance (may be deliberate). |
| **Q18** | Is `help_turns` a real control? | **Yes, built** — beside the exit gate, as pacing: how many times the coach may help a stuck learner before moving on. |

---

## Next up

### N1 · Architecture map — a visual of how a subject exists in the platform
**Requested 2026-09-17. Do this before, or alongside, the UI/UX pass.**

The model now has enough moving parts that the relationships are hard to hold
in your head, and no single artifact shows them together. `MODEL.md` describes
them in prose; the prototype demonstrates them in use; neither *maps* them.

What it should show — the entities and the edges between them:

- **Learning Project** → carries a **goal** (Compliance / Capability), which
  supplies the default depth bar and the evidence rules
- **Information Point** → versioned, has a lifecycle (`current` / `archived`),
  declares a **required depth**, is the smallest definable facet of a subject,
  and is **never delivered**
- the **point document** (5 sections) vs. its **usage guidelines** — and the
  wall between them, since that boundary is a guardrail rather than a layout
- **Learning Activity** → derived from points, tagged to each with a
  **depth** + **provenance** + a **pinned point version**
- **drift** as a computed relationship, not an event — and its two severities
- **Output** (structural Course / open-ended Experience) → composed of
  activities, validated against the information set under the project goal
- **Comments** at two levels, with different propagation and lifespans
- the four operations — derive, transmute, compose, decompose — as directed
  edges between layers

Open sub-questions for when we take it on:

- **Is it documentation or a product surface?** A diagram in the docs explains
  the architecture to people. A live map *inside* the platform would let an LED
  see their actual subject — which points are thin, which activities are
  adrift, where coverage is concentrated. Those are very different builds, and
  the second is arguably a real feature.
**Settled 2026-09-18:** this is an **explainer artifact for stakeholders and
coworkers** — documentation, not a product surface.

**✅ BUILT 2026-09-18** — <https://claude.ai/code/artifact/43f854ec-a47d-4b75-a27d-2fc7a2d6a335>
("How a subject lives in Studio AI"). Private by default; share from the page's
share menu. Layered so one artifact serves both audiences: the concept argument
runs first, a visible "below this line — the mechanics" break separates it, and
the detail follows. Three diagrams carry the load — the three layers with their
four operations, the point document vs. its walled-off usage guidelines, and
drift branching into advisory vs. blocked.

Republish from the session that made it (same file path), or from anywhere by
passing that URL. Source: `scratchpad/explainer/arch.html` — not committed to
this repo, since the artifact is the deliverable.

---

## Quick to settle

### ~~Q5 · Does depth require evidence, or just assertion?~~
**RESOLVED 2026-09-20 → D35.** No separate evidence field. The tag already records who judged it and against which version.

### ~~Q6 · Can an activity belong to multiple projects?~~
**RESOLVED 2026-09-20 → D34.** One project. Sharing an activity is the org's existing Shared LO model (D18).

### ~~Q7 · Collective noun for Outputs~~
**RESOLVED 2026-09-20 → D36.** "Outputs" stays.

### L1 · Information-set health & analytics surface
**Raised 2026-09-18. Build after the rest exists.**

A reporting/analytical surface evaluating the overall **health of an
information set** and the hierarchical tree of activities and outputs beneath
it. Distinct from N1's explainer diagram: this reads the live data and reports
on it.

Signals it would surface, all already computable from the model:

- points that are thin, unsourced, or awaiting SME verification
- points whose required depth nothing in the library reaches
- activities pinned behind their point's current version (drift), and any
  sourced from archived points
- depth judgments still AI-proposed rather than SME-confirmed
- outputs failing their goal's threshold check, and why
- coverage concentration — points carried by one activity only, or by none

**Why it waits:** every signal depends on the authoring surfaces that don't yet
exist. Reporting on data nobody can create or correct is a dead end.

---

## Safely deferred

### Q8 · Learner-side runtime
Everything built is the authoring surface. The Experience's traversal rules and
"covered to threshold" completion imply a runtime evaluating learner results
against the information set.

Not needed for an authoring UX pass. **But:** if authors need to *preview* or
*test* traversal, that's a mode the UI must accommodate — worth a yes/no even if
the runtime itself is far off.

### Q9 · Decompose's hard case
Breaking a course into activities is easy when activities are already tagged.
The real migration case is a **legacy course with no information points** —
extraction has to invent them.

Depends on the deferred 0→1 workflow (D8). Decompose needs it more than compose
does.

### Q10 · Depth tagging at scale
Six points × six activities is 36 potential tags, and it's hand-authorable. A
real project might be 40 points × 30 activities. How tags get created and
maintained at that volume is unaddressed — AI proposal helps, but bulk review
and confirmation is its own UX problem.

---

## Known unbuilt (not questions — just not built yet)

These are settled in principle; they simply have no surface.

- **Information authoring** — no way to create or edit a point (deferred, D7).
- **Depth editing** — every tag and required bar is visible but not settable.
  Given depth is now a judgment with provenance, the *set depth → route to SME →
  see it confirm* flow is probably the highest-value next build.
- **Goal picker** — cycles on click rather than offering a real control.
- **Compose** — replies in chat; no arrangement surface.
- **Decompose** — narrates rather than animating the breakdown.
- **Manual editor** — deliberate stub. The seam is the design work.
- **Comment posting** — reading threads works; writing doesn't.
- **Persistence** — everything is in-memory; reload resets.
