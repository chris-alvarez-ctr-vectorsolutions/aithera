# Studio AI — Generative Authoring — Open Questions

> What's unresolved, and what each answer would change. G-numbers refer to
> `MODEL.md`; D-numbers to the parent's `DECISIONS.md`.

---

## Blocking the first mock

### ~~Q1 · What does "what changed" look like between generations?~~ → **G5**, 2026-10-15

Both a list and a visual layer. See `MODEL.md` G5.

### ~~Q2 · Where does the brief live in the layout?~~ → **G7, G8, G9**, 2026-10-15

The brief is project-level, its own layer between Information Set and
Activities (G7). The review tooling is one dockable panel, not a pinned rail
(G8). Review edits batch into one revision task (G9).

### ~~Q3 · Can the engine guarantee untargeted content is preserved?~~ → **G6**, 2026-10-15

No, and the design assumes it can't. Element targeting reduces drift, but
recomposition can still cause changes nobody asked for. This is an engineering
question the prototype won't solve, but it must represent it. See `MODEL.md` G6.

---

## Needed before variations are built

### Q4 · Do audience variants share confirmations?

G2 says an audience variation changes depiction, never points or depths. Does an
SME's confirmation of the fire variant's depth carry to the law variant? The
points and depths are identical; the depiction differs, and depiction can affect
whether a point actually lands. Leaning: no sharing — each variant is its own
activity with its own approval (D41) — but the platform may *propose* the
confirmation from a sibling.

### Q5 · Do SMEs review inside the platform now? — *partly answered by G12*

G12 settles the mechanism: the SME confirms depth from the learner preview
report, per point, with a link and a role rather than the review tooling. Still
open: whether the SME can also leave subject-matter annotations from there
(they'd be point-level feedback routed to the point, per the parent's two
comment kinds), and how the SME is notified that confirmations are stale.

### ~~Q6 · How are format depth overrides governed?~~ → **G13**, 2026-10-16

There are no depth overrides. The bar is set by the output's format, held as
data; configuring a Refresher output is the whole act.

---

## Needed before batch generation

### Q7 · How do you review thirty generations?

Batch (G3) produces many artifacts at once. Tabs don't scale. Likely needs a
review queue: sort by coverage gaps and stale confirmations, approve in bulk
where nothing is flagged, open individually where something is. Related to the
parent's L1 (information-set health surface) and D45 (scale is managed by
scoping, not bulk tools) — which this may need to revisit.

### ~~Q8 · How does a project-brief change get applied?~~ → **G10**, 2026-10-15

The author picks: refresh (start over), or analyse existing content against the
change and disposition each finding (update, delete, leave as is, start over).

### ~~Q12 · Does "leave as is" carry an approval across a brief change?~~ → **G11**, 2026-10-15

Content approvals carry over when content didn't change. A publish approval
never carries: any change to an output clears it, and publish needs a new one.

### Q13 · Does translation come back through this platform?

Release is a downstream workflow (publish, library configuration, translation).
Translation is the one step that may need the underlying content changed. Two
possibilities: the pipeline edits its own copy, and our approved generation and
the shipped content diverge (D31 says the pipeline owns that); or the change
comes **back** as a language variation through this platform, re-entering the
gates. The second is cleaner for the model — translation becomes a third
variation axis beside format and audience — but it's a workflow question for
the pipeline team.

### Q14 · Does a base revision propagate to its variants?

A variation is forked from its base at creation (G2). Revise the base video and
the Construction-site variant isn't analysed or flagged. Options: propagate
(variants re-generate from the base's new generation plus their own overrides),
flag (variants show "base moved — review" and offer a scoped G10 analyse), or
ignore (true fork). Leaning: flag, following D19/D43 — compute and report.

### Q15 · Is an output walk-through required for a fixed-sequence Course?

G1 now says: required when traversal is generated (Experience), optional for a
Course. The mock requires it for both. Decide whether composition itself —
order, transitions, what the learner meets first — is worth a mandatory
walk-through even when every activity has been previewed.

---

## Deferred, noted so they aren't lost

### Q9 · Inpainting fallback for flat images

G4 names region targeting as the fallback where an image isn't composed. Whether
the image pipeline produces composed scenes, flat images, or both is an
engineering decision; the review surface should support both grains either way.

### Q10 · Does a lock record why it was set?

Inherited from the parent (D32 left it open). More relevant here: an auto-lock
from a verbatim annotation already has a reason — the annotation that set it —
and could link back to it.

### Q11 · Promoting a recurring annotation into the spec or project brief

MODEL.md suggests offering this when the same annotation recurs. What counts as
"the same" — and whether it promotes to the activity spec or straight to the project brief — is
undecided.
