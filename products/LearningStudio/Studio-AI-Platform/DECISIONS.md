# Studio AI Platform — Decision Log

> Decisions taken during design, with the alternatives and the reasoning.
> **Rejected options are recorded deliberately** — they are the ones most
> likely to be re-proposed by someone (or some session) without this context.
>
> Newest decisions at the bottom. Date = when settled.

---

## D1 · Don't fork Phase 2 — build the shell fresh
**2026-09-16**

Phase 2's `courseOverview.html` (2,923 lines) and `objectManager.html` (11,357
lines) were the starting point on the table.

**Decided:** lift markup, renderers and component patterns where useful; do
**not** inherit their information architecture.

**Why:** Phase 2's IA *is* the linear course pipeline — the exact thing this
platform is designed to move past. Forking 500KB of it would bake in the
assumption we're trying to break. Also relevant: Phase 2 is hand-built DOM with
no data model, so there was nothing to port at the model layer anyway — the type
vocabulary (`multiple-choice`, `journal`, `scene`, `true-false`, `text`,
`website`, `book`) exists only as scattered string literals.

**Rejected:** verbatim replication of both files first, then layering chat on
top. Fastest to something clickable; inherits the IA debt.

---

## D2 · Drop the word "course"
**2026-09-16**

**Decided:** the top-level container is a **Learning Project**; pieces are
**Learning Activities**; deliverables are **Outputs** (Course / Experience as
specific formats).

**Why (user's framing):** "course" presumes linear or lightly-branched content
with a start and an end. The direction is a set of information that gets a
learner to an outcome — whatever grouping, in whatever modality they prefer, is
the experience they're delivered. Completion is meeting a threshold, not
reaching the end.

**Note:** "Outputs" remains a placeholder collective noun. May not need one.

---

## D3 · Three layers, not two
**2026-09-16**

**Decided:** Information Set → Learning Activities → Outputs.

**Why:** the information layer was initially modelled as a *supporting* detail
that made transmute coherent. That was backwards. Everything derives from the
points; the points persist while activities are regenerated; the SME's real
expertise is about the points, not video pacing. It is the primary artifact.

**Rejected:** activities as the base unit with outputs as views over them. Can't
express "the same information as a video *and* a podcast" — they'd be two
unrelated activities with no way to assert equivalence.

---

## D4 · Content graph separate from compilation
**2026-09-16**

**Decided:** nodes own *what they are*; a separate layer declares *how they
assemble*. Edges live in the output, not on the node.

**Why:** the same nodes must compile into a linear Course, a traversable web, or
an adaptive path. If containment is the only relationship a node can have, that's
impossible — it's Phase 2's assumption again.

---

## D5 · Comments anchor at node level; prompts may target sub-ranges
**2026-09-16**

**Decided:** asymmetric binding. Comments → nodes (scene-level or above).
Targeted prompts → may address a field or string, but **ephemeral**, never
persisted.

**Why (user's framing):** anchor stability, not precision. A prompt's anchor
only has to live as long as the prompt — seconds. A comment's has to live as
long as the conversation — weeks, across many rebuilds. Tagging a string that
will be deleted and re-added under a new id guarantees orphaned comments.
Higher in the hierarchy is less likely to be wholly replaced, and when it is,
"delete all associated comments" is a sensible confirmation.

**Rejected:** uniform fine-grained anchoring for both. Precise but orphans
threads constantly.

---

## D6 · Comment excerpts are snapshots, not links
**2026-09-16**

**Decided:** capture the cheapest legible representation at write time — text
string, audio transcript line + timestamp, media frame, described structural
state. Plus a change marker.

**Why:** a snapshot cannot break because it never pointed at anything. For
non-text especially, "this changed since the comment was written" carries most
of the value at a fraction of the machinery.

---

## D7 · V1 starts at "1" — no information sourcing workflow
**2026-09-16**

**Decided:** the information set arrives already sourced and verified. The 0→1
document-in / points-out workflow is a later pass.

**Why (user's framing):** the derivation operations are what make this a
platform and what a reviewer needs to see. Gating them behind a half-built
authoring flow buries the argument. The information set as a *given* still
communicates its centrality.

**Consequence:** the seeded set displays provenance and verification state so the
V2 workflow has an obvious slot to plug into rather than needing a retrofit.

---

## D8 · Document-in / points-out, not conversational elicitation
**2026-09-16** *(for the deferred V2 workflow)*

**Decided:** the LED brings source material; AI proposes an information set from
it plus model knowledge; the LED shapes it; an SME reviews.

**Why:** the user is an LED with **limited subject knowledge**; SMEs are
external bookends. Conversational elicitation assumes the expertise is in the
room — interviewing someone who can't answer is worse than useless. Reviewing
and correcting a proposed set is a job you *can* do without deep subject
knowledge.

**Implications for that build:** per-point **provenance** is essential (sourced
vs. model knowledge) so a non-expert can route uncertainty rather than approve
text they can't judge; and the AI should flag thin areas rather than hide them.

---

## D9 · No Design Toolbox, no version loader
**2026-09-17**

**Decided:** single flat `index.html`. No `versions.json`, no `verN/`, no
toolbox include.

**Why (user):** exploration; preserving versions isn't a requirement, and the
code will get complex — keep the UI surface free of extra wiring.

**Note:** explicitly permitted by repo convention — the toolbox and versioning
are opt-in and nothing blocks a commit without them.

---

## D10 · Dark slate, dense editor tooling
**2026-09-17**

**Decided:** dark base, moderately dense, layer switching via a left icon rail,
conversation muted.

**Why (user's framing):** "dense UI editor tooling run by an MCP rather than a
chat attached to a traditional website." The stark blue-filled chat bubbles were
pulling attention away from the content area; chat should read as a passive
interaction and intent-capture feature that *drives* the content area.

**Consequence:** accent colour is spent almost entirely in the canvas — selection
glow and node status — so the content area owns the visual energy. Vector's
light tokens could not carry over: the contrast scale is translucent
dark-on-light overlays that vanish on a dark ground, so the surface palette is
explicit with Vector accent hues lifted for legibility.

**Later refinement:** chat turns restored to left/right alignment by sender, but
without saturated fills — side, a one-step surface change and ink weight carry
the speaker.

---

## D11 · Coverage is many-to-many tags with a depth dimension
**2026-09-17**

**Decided:** an activity satisfies or doesn't satisfy a point; one activity may
satisfy many points and vice versa. Each tag carries a **depth**.

**Why (user's framing):** "an information point doesn't necessarily constitute a
1-1 activity — a video could cover multiple points, a scenario could cover all
of them." The many-to-many part was already modelled; what was missing is that
coverage was **binary**, which makes the coverage count useless as a quality
signal — a job aid mentioning load limits counted the same as a scenario making
you apply them under pressure.

---

## D12 · Depth scale: Awareness / Working / Mastery
**2026-09-17**

**Decided:** learner-capability language — knows it exists / can do it with
support / can do it unaided.

**Why:** matches the threshold framing used throughout ("whatever grouping gets
them to meet that threshold"). Describes the learner, not the activity.

**Rejected:** Introduce / Reinforce / Assess (describes what the activity does,
not the resulting capability); Bloom's levels (more granular = more tagging
burden and more per-tag disagreement); bare numeric 1–5 (nothing tells an LED
what a "3" means — inconsistent across a library).

---

## D13 · Required depth is set per point
**2026-09-17**

**Decided:** each information point declares its own bar; unset points inherit
the project goal's default.

**Why:** a tip-over survival point demands more than a right-of-way point. One
bar for the whole set treats a critical safety point the same as a minor one.

---

## D14 · Validation passes on highest achieved depth, with a progression warning
**2026-09-17**

**Decided:** a point is satisfied when the deepest coverage in the output meets
its required depth. If it reaches the bar with nothing beneath it, it still
passes but is **flagged** — assessed without being taught.

**Rejected:** cumulative laddering (must introduce *and* reinforce *and* assess).
Stricter and pedagogically defensible, but would block outputs that are
legitimately fine; the warning surfaces the same signal without gating.

---

## D15 · Modality never determines depth
**2026-09-17**

**Decided:** format may **suggest** a starting depth; it never sets one. All
generated tags land as `proposed`.

**Why (user's framing):** "Assess won't always require a high fidelity
interaction like a simulation or scenario. Things like scenario based knowledge
checks that ask more of a longer read question and answer will suffice at the
LED/SME's discretion."

**Superseded:** transmute previously inferred depth from modality (job aid →
awareness, simulation → mastery). Removed.

---

## D16 · Depth tags carry provenance
**2026-09-17**

**Decided:** every activity→point tag records who set it — `proposed` (AI),
`adjusted` (LED), `confirmed` (SME).

**Why:** depth is a judgment, so the gate must distinguish a guess from a
judgment. Also lets a Compliance-goal project *require* SME confirmation.

**Rejected:** a bare depth value with no provenance. Least machinery, but the
quality gate can't tell an AI guess from an SME call — which defeats its purpose.

---

## D17 · Project goal is a separate axis from depth
**2026-09-17**

**Decided:** the Learning Project carries a **goal** (Compliance, Capability)
supplying the default depth bar *and* evidence rules. Points may override their
own bar.

**Why (user's framing):** "the threshold is also relative to the goal of the
content. Sometimes it will be mastery, sometimes compliance, sometimes
awareness." Compliance is **not a rung** between Working and Mastery — it's a
different kind of bar. It can demand documented, SME-confirmed assessment while
asking only moderate cognitive depth; Capability demands demonstrable
performance and cares less about documentation.

**Held as data, not hard-coded branches** — leadership will define the real list.

**Demonstrated:** identical activities and depth tags read 5/6 with 4 points
never assessed and 2 unconfirmed judgments under Compliance, versus 5/6 with
only a build-up warning under Capability.
