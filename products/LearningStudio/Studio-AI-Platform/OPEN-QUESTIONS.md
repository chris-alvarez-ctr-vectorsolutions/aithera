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
activities pin the version they were authored against. What remains open is the
*review* flow, deferred with the information-updating phase (D7).

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
