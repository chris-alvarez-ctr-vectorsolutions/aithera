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

---

## D18 · Information points are design-time context, never delivered
**2026-09-17**

**Decided:** a point is written as context for the AI and the designer — the
source activities are derived from. A learner never encounters one. **Activities
are the shareable unit**; points are not shared, instanced or variant-ed.

**Why (user's framing):** *"the information point itself should never be
delivered to the user… an activity could be shared but not a point. Multiple
activities could be sourced from the same point."*

**Supersedes:** an earlier recommendation in this session that points be
Shared-LO-shaped (shared, versioned, push-on-edit). That was wrong — it treated
the point as the durable artifact worth sharing and conflated *durable* with
*deliverable*. The point persists as reference; the activity is what ships.

**Resolves:** Q4 (library vs. document) is the wrong question for points — they
are neither. Q6 (activity in multiple projects) → yes, via the org's existing
Shared LO model.

**Aligns with** the established Content Portal / Phase 2 vocabulary:
`Shared` / `Unique` / `Instance` / `Variant` / `Copy`. Note two reserved terms —
**"global"** means brand assets and platform settings in this org, not shared
content; **"outdated"** is taken by the AI render-pipeline state. Neither should
be reused for content reuse or source staleness.

---

## D19 · Drift is computed from a pinned version; severity comes from lifecycle
**2026-09-17**

**Decided:** a coverage tag pins the point version it was authored against
(`at: 2`). Drift is derived by comparing to the point's current version rather
than fired as an event. Severity is read from the point's lifecycle, not from a
content diff:

| Point state | Derived activity | Blocks delivery? |
|---|---|---|
| `current`, pinned behind | low-severity update tag | no |
| `archived` | critical | yes |

**Why (user's framing):** *"Out of date information is not necessarily a deal
breaker and there is usually a grace period of how long that information is
still acceptable… Only certain cases would result in an immediate edit with a
strict no-deliver dependency on archived or old versions."*

**Grace is soft, with no date field.** Standards evolve (WCAG versions,
electrical codes) and the field carries its own tolerance for how long older
guidance remains acceptable in practice. Old information is not wrong, only not
current.

**Rejected:** diffing v2→v3 to infer materiality. Unreliable, and it puts the
system in the position of judging. Archival is already an explicit human act
meaning "no longer acceptable to teach," so severity is a decision someone made.

**No-deliver is a leadership declaration.** Out-of-scope tooling may scan for
risky or outdated information, but a human sets severity and assigns the work.

---

## D20 · Depth confirmation records its version; currency is derived
**2026-09-17**

**Decided:** a version bump never revokes confirmation. The tag records which
version it was confirmed against, and *confirmed-against-current* is computed.
No fourth tag state.

**Why:** keeps strictness in the goal rules where the rest of it already lives —
Compliance sets `requiresCurrent: true`, Capability leaves it false. One field,
free derivation.

**Rejected:** auto-demoting confirmation on any bump (nags designers over
trivial edits); leaving confirmation untouched and unqualified (the compliance
gate silently stops being honest over time).

**Deferred:** re-confirming depth after a bump is a **delta review** — AI-assisted
LED/SME collaboration evaluating v2→v3. That belongs to the information
updating phase, which V1 starts past (D7). V1 models the state, not the review.

**Also out of scope for now** (user's call): a task/assignment primitive for
routing that work to LEDs.

---

## D21 · A point is the smallest definable facet of a subject
**2026-09-17**

**Decided:** atomicity is the authoring rule — one point, one facet.

**Why (user):** *"The point should be the smallest definable facet of a topic or
subject."* It also makes coverage tagging honest: an activity either satisfies
the whole facet or it does not, with no partial-credit ambiguity.

**Consequence:** some seeded points are arguably compound ("travel with the load
low *and* tilted back") and would split under a strict reading. Left as-is for
now; worth revisiting when points become authorable.

---

## D22 · Points are documents, not summaries
**2026-09-17**

**Decided:** each point carries a five-section document — the claim, why it
matters, specifics and thresholds, common failure modes, what competence looks
like. Cards remain the index; the document is a drill-in with direct editing
*and* prompt targeting.

**Why (user):** *"I would expect several sentences or paragraphs required to
cover each point in depth so it has all the context needed to generate
activities from them."* The prior seed was summary-shaped — enough to say what a
point was about, nowhere near enough to generate a video, a podcast and a
scenario without the AI inventing the substance. Which is precisely the subject
knowledge the LED lacks and the SME was meant to supply.

**Structure is light and named**, not free prose and not a form: reliable
section boundaries for generation, readable top to bottom by a human. Per the
user: *"AI readable but formatted so they can be easily understood by humans as
well."*

**Editing is dual** — type directly into a section, or select it and prompt. Both
route through the same node/sub-target model already used on the canvas.

---

## D23 · Usage guidelines are walled off from the document
**2026-09-17**

**Decided:** directives about how to *use* a point live outside the point
document, in a separate panel, and are never passed to language generation.

**Why (user's framing):** *"Separating context from usage in some way gives us a
defined line to guardrail against usage being accidentally used in activity
language. We can wall off the usage documents completely from the language
generation."*

This is stronger than the "different reviewers" reasoning that first motivated
the split. It guards a real failure mode: a directive like *"do not depict a
rollover graphically"* sitting inside the source document can surface in
generated narration.

**Secondary benefit:** an SME reviewing for accuracy reads only the information.
The two halves have different reviewers and different lifespans.

---

## D24 · Points version as a whole
**2026-09-17**

**Decided:** the point is the versioned unit; sections do not version
independently.

**Why:** matches the atomicity rule (D21) — if a point is the smallest definable
facet, its sections are facets of one thing rather than separable units.
Per-section versioning would enable more precise drift (*"only failure modes
changed, so activities not teaching failure modes are unaffected"*) but that
value only lands with the delta-review flow, which is deferred (D20). Building
the versioning half without the review half would be speculative.

---

## D25 · A check may not be delivered before the scene it tests — refused, not flagged
**2026-09-18**

**Decided:** dragging a check above its source scene in the sequence is
**refused at the drop zone**. The zone shows a refusal state and the reason
("not before the scene it tests"); releasing there changes nothing.

**Why:** a check is bound to the specific narration phrasing of one scene
(*Checks and assessments are different instruments*, `MODALITIES.md`). Delivered
before that scene, it asks the learner about language they have not heard yet.
That is not a quality signal to weigh — it is an incoherent sequence.

**Deliberately stricter than the `far` indicator beside it**, which flags a
check delivered well *after* its source and still allows it. The asymmetry is
the point: **late is a judgment call about pacing; early is broken.**

**Divergence, recorded on purpose:** D14 and D19 both chose *flag, don't gate* —
a progression warning that passes, drift that stays advisory. This is the first
hard gate in the prototype. The distinction that justifies it: those flag
**judgments that may be defensible** (assessed without build-up; teaching
guidance that is old but not yet wrong). This forbids a state that is **never
defensible**, and unlike drift it is created by a single direct action, so it
can be refused at the moment it is attempted rather than reported afterwards.
*(User's call, 2026-09-18.)*

**Rejected:** allowing it with a warning in the check's bound-line (consistent
with `far`, but leaves a broken sequence sitting there); allowing it silently
(throws away a signal the rail already surfaces).

---

## D26 · A scene moves with the checks bound to it
**2026-09-18**

**Decided:** dragging a scene in the sequence carries every check bound to it,
preserving their relative order. Checks still drag independently.

**Why:** D25 only guarded the *check's* drag. Dragging a **scene** past its own
check produced exactly the forbidden state by another route — found by
exercising all 24 possible drags against the seeded sequence, not by reading
the code.

Refusing the scene drop instead was the alternative, and it is worse: the user
gets blocked moving a scene for a reason belonging to a different item, and the
remedy (move the check first) is unobvious. Carrying the checks along makes the
invalid state **unreachable by construction** rather than defended at two
separate gates.

**Precedent:** deleting a scene already deletes the checks bound to it. The
binding already survives structural edits; this applies the same rule to
movement.

**Consequence:** a scene whose checks are scattered through the sequence gets
them **gathered** to it when moved. That is the correct reading of "move this
scene" — and the no-op test compares the resulting sequence rather than the
block's offsets, so a drag that would spell the same order is correctly treated
as no move at all.
