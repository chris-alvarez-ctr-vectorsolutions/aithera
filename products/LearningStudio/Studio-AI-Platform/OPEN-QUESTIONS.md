# Studio AI Platform — Open Questions

> Unresolved structural and theoretical questions, with what each would change.
> Ordered by how much UI surface they'd reshape if answered *after* a UX pass
> rather than before.
>
> **A question being deferred is fine. A question being forgotten is not** —
> that's what this file is for.

---

## RESOLVED since first writing

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

### Q3 · Coverage tag staleness
*(part of the Q1 conversation)*

Coverage tags are static. If the hazard walkthrough is shortened, its tags
survive unchanged — it may no longer cover what it claims at the depth it
claims.

Something has to invalidate them. This is the same problem the comment change
marker solves, applied to coverage. Likely needs a `stale` state on the tag and
a re-confirmation path.

---

### Q4 · Reuse scope — is the information layer a library or a document?
**Would reshape: the information layer's entire navigation model.**

Forklift safety and warehouse safety will share points, and probably activities.

- **Library:** points are global, projects *reference* them. Needs search,
  reuse affordances, "used in 4 projects" indicators, and a governance story for
  editing a shared point.
- **Document:** points are owned by a project and copied. Simpler; duplicates
  diverge silently.

Probably a short conversation — the answer may already be obvious — but the
consequences are large.

---

## In progress

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

### Q11 · Does a long activity need its coverage located internally?
**Raised 2026-09-18, by activity size becoming the author's call.**

Activity-level coverage tagging is settled and rejustified. But a **long** body —
a deep scenario of many phases and decisions — may claim several points at
several depths, and that claim is harder for a reviewer or an SME to falsify
than a short activity making a single claim. "This 12-phase scenario covers all
six points" is not checkable by reading a tag.

Per-section traceability was rejected for good reasons that still stand (it
invents precision that does not exist, and invites tagging incidental mentions
as coverage). So this is **not** a proposal to reopen it — it is a question about
whether *verification* needs something tagging does not supply:

- nothing, because the SME reviews the activity itself and the tag is a summary;
- an **evidence note** per tag (Q5's field, arriving for a different reason);
- or a lighter affordance — "show me where" as a **review-time** aid rather than
  an authored anchor.

**Would reshape:** the coverage panel's review affordances, not the tag model.

**Watch for it** when the scenario body is designed — a deep scenario is the
first body where this actually bites.

---

### Q12 · Nothing detects that an activity's own content moved
**Raised 2026-09-18 by D30; scoped down by D31. Has two callers already.**

**Downgraded by D32.** Manual locks let an author freeze what has been decided,
which **prevents** the problem rather than detecting it after the fact. What
remains here is a backstop for content nobody thought to lock — worth keeping on
the list, no longer the primary answer.

**Scope note.** This is **not** about work leaking to live — a dedicated publish
pipeline gates that (D31) — nor about losing work, which version control and
drafts handle. It is about a **claim inside the design surface going stale**, and
the surface being unable to say so. Publish blocks the ship; it cannot explain
the block to an LED or tell an SME they are re-reviewing rather than reading
something fresh.

The model tracks drift on one axis only: a coverage tag pins the **point
version** it was judged against (`at: 2`), so *"the point moved under this
confirmation"* is computed. There is no equivalent for the other direction —
**"the activity's own content moved"** — and two settled decisions now depend on
it:

- **Checks** (`MODALITIES.md`, *Checks and assessments are different
  instruments*): a check is bound to the specific narration phrasing of its
  activity, so changing that language should make the check suspect. *"Same
  mechanic, different trigger."* Nothing computes it.
- **SME confirmation under permissive editing (D30):** an SME confirms a depth
  judgment — and in a scenario, a `look_for` calibration — against specific
  content. An unscoped AI edit can rewrite that content while the confirmation
  stays green, which makes the compliance gate assert something untrue.

**What it probably needs** is the move the model already makes everywhere else:
**bind to identity, not position.** A confirmation records *what it was made
against*, not merely *when* — so "confirmed-against-current" stays derivable, no
new tag state required, exactly as D20 did for point versions.

Deliberately **computed, never gated** — the same call D19 made for drift, for the
same reason: materiality is a human declaration, and the platform should surface
the signal rather than judge it.

The open part is what "the content it was made against" means concretely —
an activity content hash, a per-field revision counter, or something coarser.
Too coarse and every typo nags; too fine and it never fires.

**Related:** the video anchor hole (`MODALITIES.md`, *Left undone on video*) is
the same class of bug — an index standing in for an identity — and a token-id
model there may supply the primitive this needs.

**Would reshape:** the coverage panel's confirmation display, the check's drift
state, and whatever surface reports "this changed since it was approved."

---

## Raised by the parity pass — 2026-09-20

*Worked through all six PARITY.md items without stopping to ask. These are the
decisions I made on my own judgment, or deliberately deferred. Each names what I
did and what would change if you decide otherwise.*

### Q13 · Does an activity own a scenario-level opening, or is that the output's job?
**I built it. Worth confirming.**

v4 has an `opening` — one ungraded exchange before the phases, to get the
learner talking before any teaching. I added it as part of the Framing stage.

**The tension:** an activity here is author-sized and may be composed with others
into an output (D30-era decision). If three scenario activities stack into one
output, the learner meets **three warm-ups**. The reference has no such problem,
because its document *is* the whole deliverable.

- **Keep it on the activity** (what I built): faithful to v4, and a standalone
  activity needs its own way in.
- **Move it to the output**: one warm-up per delivery, but an activity delivered
  alone then has none.
- **Keep it, and let compose drop all but the first**: probably right, but it is
  a real compose rule that does not exist yet.

### Q14 · Should `implementation_id` be authored at all?
**I made it an editable field. I am not sure it should be.**

The reference is explicit that *"the document carries its own identity in
`implementation_id`; filenames are for people, and nothing downstream should
parse them."* I exposed it as a text input on the Framing stage.

But this platform already gives every node a **stable opaque id** (`MODEL.md`,
*Node addressing*), and the whole argument there is that ids are not for humans
to type. An author editing an implementation id can break the thing that
identifies their scenario to a player.

Likely right answer: **derive it from the activity's node id and show it
read-only**, the way the coverage page shows point ids. One line to change.

### Q15 · What is the export actually FOR?
**Built as a preview. Not wired to anything.**

The Close stage now shows the projected document, what the projection lost, and
which fields are Vector extensions. What it does not do is *go* anywhere.

Options, and they are quite different products:
- **A read-only honesty surface** — "here is what a player would get, and here is
  what this platform knows that it cannot carry." Argues for the format growing.
- **A real handoff** — download, or push to the pipeline (D31).
- **Round-trip** — import a v4 document and author it here, which is the
  migration path for scenarios already authored in the reference editor. That is
  a *decompose* question (`MODEL.md`) and probably the most valuable of the
  three.

### Q16 · Does a rubric item want to bind to an information point?
**Deliberately not built.**

An observe_react's rubric lists what a learner should spot. Several of those map
onto information points — "faces the truck" *is* the three-point-contact point.
Binding them would let coverage be computed from the rubric rather than asserted
separately, which is the id-join argument applied one level deeper.

**Why I left it:** it is the per-section traceability question again
(`MODALITIES.md`), which was settled as *coverage tags at activity level*. Doing
this for rubric items only would be inconsistent unless it is a deliberate
exception — and it might be, since a rubric item is a **discrete assertion**
rather than a span of prose, which is exactly what made span-tagging unreliable.

### Q17 · The prompt-smell lint fires on authored prose. Is its list right?
**I adapted the reference's needles and added a few.**

It flags authored text containing *the ai, the model, the interface, the ui, the
chat window, this prompt, as an ai, `[[`, `]]`*. The reference's reasoning is
that this text is compiled into a system prompt and a learner should never meet
it.

Two things to check: whether the list is too aggressive for a platform where an
author might legitimately write *"the AI assistant will summarise"* in a
**purpose** field (guidance, never spoken), and whether the lint should apply
only to **verbatim** fields rather than to all of them. Currently it scans both.

### Q18 · Is `help_turns` a real authoring control?
**Carried in the data, not exposed.**

Every mode's shape has `help_turns` — how much help before the step moves on.
I kept it in the model and the export but gave it no editor, because I could not
tell whether it is an authoring decision or a platform default. The reference
exposes it nowhere obvious either.

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

### Q5 · Does depth require evidence, or just assertion?
**Scoped yes/no.**

Currently an SME confirms a depth and that is the truth. For Compliance you may
need the *reason* recorded — *"assessed via 6 scored items at an 80%
threshold."*

It's one field, but deciding now avoids a retrofit.

### Q6 · Can an activity belong to multiple projects?
**Follows from Q4.** Determines whether comments and depth tags are per-project
or global. Likely free once Q4 is settled.

### Q7 · Collective noun for Outputs
**Cosmetic.** "Outputs" is a placeholder over Courses and Experiences.
*Deliverables* is warmer. Skipping the collective entirely is also fine.

---

## Valuable later — explicitly out of scope for now

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
