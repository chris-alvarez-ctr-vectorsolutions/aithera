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

---

## D27 · The AI assistant is one contextual presence per project, depicted per modality
**2026-09-18**

**Decided:** a Learning Project carries **one AI assistant**. Each modality
renders its own **depiction** of it — `coach_persona` in a scenario, whatever
the equivalent is for video, podcast or a job aid. The context is constant; the
face changes.

**Why (user's framing):** *"the coach persona is a user-facing depiction of a
contextual AI assistant per project. For a scenario, a coach persona makes
sense. For different modalities, the AI assistant is likely to take on different
personas but the context is the same."*

**Corrected 2026-09-19.** This entry first said the persona is *"projected
down"* from the project — inherited, read-only at the activity. **That was an
over-tightening of what was actually said.** The user's words were *"the AI
assistant is likely to take on different personas"* — the persona **varies**;
only the context is constant.

Per the user (2026-09-19): *"isn't this an instance of an activity determining
what persona the project assistant takes?"* — yes. **The activity determines the
persona**, because the persona follows from what the activity asks the learner to
do. That is D28's rule already: the assistant's **goal** derives from what the
learner must do to complete the activity, and the persona is how that goal is
depicted.

So the direction of authority is:

| | Owner | Varies by |
|---|---|---|
| **Context** — what the assistant knows | the **project** (its information set) | nothing; constant across the project |
| **Goal + persona** — what it is for, and the face it wears | the **activity** | every activity |

The project's assistant supplies the **through-line** — a recognisable
disposition a learner meets across the whole project — and each activity casts
it for the job at hand: a coach in a scenario, a narrator in a video, a host in a
podcast. Not one fixed voice, and not a free-for-all either.

**Consequence for the fold-in:** the Scenario Simulator holds `coach_persona` per
scenario document, which is **structurally right and stays that way here**. What
changes is only that it is no longer authored in a vacuum — it is cast against a
project assistant that already exists, so the surface shows what it is varying
*from*.

**Rejected:** a persona authored with **no project-level referent at all** —
which is the reference tool's position, forced on it by being standalone. Across
a library of activities from one information set, wholly independent personas are
drift waiting to happen, and nothing would detect it. The project assistant is
what they vary *from*; it is not a value they merely inherit.

---

## D28 · The assistant has a GOAL, walled off from its context — the D23 pattern again
**2026-09-18**

**Decided:** the assistant takes the **information points as its context** — what
it knows. Separately, and structurally apart, it carries a **goal of its own**:
what it is *for* in this activity — helping, teaching, explaining, executing
actions. That goal derives from what the learner is expected to learn or do to
complete the activity.

**Why (user's framing):** *"it should have the points as context, but should also
have a similar concept to usage guidelines where the persona depicted has a goal
of its own based on what the user is expected to learn or do to complete the
activity. Helping, teaching, explaining, executing actions, etc."*

**This is D23's wall, applied to the assistant.** The two halves divide exactly
as the point document and its usage guidelines do:

| | Information point | AI assistant |
|---|---|---|
| **Context** — passed to generation | the five-section document | the points it covers |
| **Directive** — walled off | usage guidelines | the assistant's goal |

The same failure mode justifies the same wall: a directive like *"do not give the
answer away"* sitting inside the assistant's context can surface in what it says
to a learner. Keeping the goal structurally separate gives a defined line to
guardrail against.

**Consequence:** context is **derived, never authored** — the assistant knows the
subject because it holds the points, so there is no subject summary to write and
therefore none to drift. Only the goal is authored.

---

## D29 · Assistance level is declared by the ACTIVITY; the output validates against it
**2026-09-18**

**Decided:** an activity declares what its assistant is permitted to do. An
**output admits or refuses activities** based on that declaration, under its
goal's rules. Assistance is not scoped top-down from the output.

**Why (user's framing):** *"assistance level should be set by activity. Output
goals will allow or restrict activities based on their assistance capabilities.
An output with a strict compliance grading probably shouldn't allow activities
that let the AI assistant give all the answers."*

**This is the coverage pattern exactly.** An activity declares its depth per
point; the output validates the set against the goal's bar. Now: an activity
declares its assistance; the output validates it against the goal's evidence
rules. **One validation model, a second dimension** — not a new mechanism.

```
activity.assist = 'explains' | 'teaches' | 'hints' | 'executes' | …
output (goal: compliance) → refuses an activity whose assistant
                            can supply an assessed answer
```

**Why declared rather than scoped:** an activity is a deliverable that may sit in
several outputs (D18, via the Shared LO model). If the output set the assistance
level, the same activity would behave differently in each — and its evidence
claim would stop meaning one thing. Declaring it on the activity keeps the
activity honest about what it is, and makes the output's admission decision a
validation rather than a mutation.

**Consequence — a new validation signal.** Alongside *"point 3 is not assessed"*
the threshold check can now report *"this activity's assistant may supply the
answer, which Compliance does not admit."* Same surface, same shape.

**Open:** the vocabulary of assistance levels. `helping / teaching / explaining /
executing` came from the user as examples, not as a closed list. Hold it as data
like `GOALS`, for the same reason — leadership will define the real one.

---

## D30 · Everything is editable; scope comes from the request and the walls
**2026-09-18**

**Decided:** there is no fixed split between AI-generated and hand-authored
content. An author may start blank and write everything by hand, or take an AI
draft and shape it. Regeneration has no fixed preserve-list either: the author
scopes each change — a whole redraft, a single step, one field, or a concept
expressed as a request.

**User's framing:** *"technically, an author could start blank and hand author it
completely, but we would want an AI drafting workflow as well… I think
everything is open to edits and will be scoped by the author. They will choose to
fully regenerate or scope changes to specific fields or concepts through
targeting tools or specific requests with the platform AI. Essentially the AI
will [have] the same interaction as Claude Code in VSCode. Anything is editable
in theory, it depends what is asked for and what is specifically guarded against
or walled off."*

**This supersedes the framework's Q4** (*"what is generated vs. hand-authored,
and what does regeneration preserve?"*) **as a per-modality question.** It is one
answer for every modality: both, always, scoped by the ask. A modality section
should no longer answer it — only note anything modality-specific it guards.

**Why it is the right generalization:** the platform already has the parts — node
ids, sub-range prompt targeting, per-node `capabilities`, and two walls (D23,
D28). "Scoped by the request" is what those were built for.

**Consequences accepted, recorded because they are real:**

**1. ~~Diff and undo become load-bearing, not polish.~~ — mostly retracted by
D31.** This argued that the Claude Code analogy imports permissiveness without
the working tree and version control that make it safe. **The premise was wrong:**
the platform has its own version control, interim saves and drafts, and a publish
pipeline that owns detailed versioning (D31). The reasoning was taken from the
*prototype's* in-memory statelessness and mistook a prototype limitation for a
model gap.

What survives is narrower, and is **legibility rather than recovery**: within one
turn, an author who scopes a change and gets a wider one should be able to see
what moved. An affordance, not a mechanism.

**2. A second wall is needed — write scope, not just read scope.** D23 and D28
wall content off from what the AI **reads**. This needs the other direction: what
the AI may **write**. They are different lists.

The load-bearing case is **SME confirmation**. An SME confirms a depth judgment
(and, in a scenario, a `look_for` calibration) against specific content. If an
unscoped *"tighten this scenario"* rewrites that calibration while the
confirmation stays visibly green, the compliance gate is asserting something
untrue — the exact failure D20 was written to prevent on the version axis.

**This is not a reason to restrict editing**, and it is not solved by the publish
gate — publish stops the content shipping, but cannot tell the LED *why* they are
blocked or tell the SME they are **re-reviewing** rather than seeing something
fresh (D31). It is the rule that makes permissive editing honest:

> **An edit that invalidates someone else's judgment must say so.**

Today the model detects *"the point moved under this confirmation"* (`at:` pins
the point version). It has **no equivalent for "the activity's own content moved
under this confirmation."** That is the same missing mechanic already flagged for
checks — *a check depends on its activity's language, and nothing computes that
yet* (`MODALITIES.md`). One gap, now with two callers. Tracked as **Q12**.

**Rejected:** a fixed preserve-list for regeneration (sticky hand-edits, or
structure-sticky/prose-free). Both invent a policy the author is better placed to
state per request, and neither survives "regenerate this whole thing now the
points have changed."

**Out of scope, noted by the user:** *"folding in or allowing dedicated workflows
for all of these AI-assisted generation workflows into our platform is another
design and UX problem to solve."* The 0→1 drafting workflows — for a point set, a
scenario, a course — are their own design problem, related to D7/D8's deferred
information-authoring pass.

---

## D31 · This is a design surface; a publish pipeline owns version control and the live boundary
**2026-09-18**

**Decided:** the platform is an **AI-assisted design surface**. It has its own
version control, interim saves, drafts and collaboration, and a **dedicated
publish pipeline** owns detailed versioning and gates everything reaching live
services and content offerings.

**User's framing:** *"this is still an authoring tool that will have its own
version control and publish pipeline with interim saves, drafts, and
collaboration. The publishing pipeline will handle the detailed version control,
this is simply an AI-assisted design surface… development and implementation will
determine what can be written. Again this will be gated by a dedicated publish
pipeline that prevents any design work from leaking into the live services or
content offerings."*

**What this settles:**

- **Nothing in the design surface reaches a learner without passing publish.**
  Draft state is expected to be incomplete, inconsistent and mid-edit; that is
  what a design surface is for.
- **Detailed version control is not this platform's model problem.** Saves,
  drafts, history and recovery belong to the pipeline.
- **Write scope is an implementation decision**, not a model one. D30's "what the
  AI may write" is determined in development.

**Retracts half of D30's first consequence.** D30 recorded that diff and undo are
"load-bearing, not polish," reasoning from the Claude Code analogy importing
permissiveness without a safety net. That reasoning **was based on the
prototype's in-memory statelessness and mistook a prototype limitation for a
model gap.** With version control and drafts present, recovery is solved.

What survives is smaller and is **legibility, not recovery**: within a single
turn, an author who scopes a change and gets a wider one should be able to see
what moved. That is an affordance, not a mechanism — and "undo" answers it.

**Does NOT retract the second consequence, which is a different problem.**
Publish stops bad content reaching learners. It does not stop a **claim inside
the design surface from going stale**: an SME confirms a calibration, an author
later rewrites the thing confirmed, and the confirmation still reads green *in
the authoring tool*.

Publish correctly blocks that from shipping. What publish cannot do is tell the
LED **why** they are blocked, or tell the SME they are **re-reviewing** rather
than seeing something fresh. Those are design-surface jobs, and the surface is
where the information is missing.

This is the same shape as drift, which the model already chose to **compute
rather than gate** (D19), on the grounds that materiality is a human
declaration. The same reasoning applies: not a wall, not a restriction —

> **`confirmed` should record what it was confirmed against**, exactly as a
> coverage tag already records the point version with `at:`. One field, and
> staleness is derived.

No new tag state, no fourth status, no blocking — precisely the shape D20 chose
for the version axis. Tracked as **Q12**, now scoped to that.

**Consequence for `OPEN-QUESTIONS.md` Q1:** the "published version distinct from
the working one" it speculated about is **settled in principle** — that is the
pipeline. What remains open there is only what the *design surface* shows about
published state.

---

## D32 · Manual locks — the author freezes what has been decided
**2026-09-18**

**Decided:** an author may **lock** any node or field. A locked target refuses
**all writes** — the AI's and the author's own — until it is explicitly
unlocked.

**User's framing:** *"a valuable feature would be to allow the designer to lock
certain aspects manually that are discussed, decided and locked in. This would
allow continued AI assistance without the risk of unnoticed changes or requiring
detailed QA every time a small change is applied."*

**Why this is better than the alternative it replaced.** Q12 proposed that
`confirmed` record what it was confirmed against, so staleness could be derived —
**detection**: tell the author afterwards that something moved. A lock is
**prevention**: the AI cannot touch it, so there is nothing to detect and nothing
to re-QA. It is also a decision a human actually made, rather than a derived
signal someone still has to interpret.

The stated cost it removes is the real one: *"requiring detailed QA every time a
small change is applied."* Permissive editing (D30) is only comfortable if the
author can fence off what is settled.

### Grain — any node or field

Locks use the **existing addressing** — node id plus optional sub-target — which
is what prompt targeting already uses. No new addressing model.

This deliberately **differs from comments (D5)**, which anchor at node level only
because a sub-node anchor orphans when content is regenerated. That reasoning
does not transfer: **a lock's entire job is to prevent that regeneration.** A
locked field cannot be replaced out from under its own anchor.

### All writes, not just the AI's

Locked means locked. The author unlocks deliberately, edits, and re-locks.

**Why not AI-only:** with collaboration in the platform (D31), the decision needs
protecting from a *colleague* as much as from the model — and "discussed,
decided and locked in" is a statement about the content's status, not about who
is typing. An AI-only lock would also make the lock's meaning depend on who was
holding the keyboard, which is not what was decided.

**Cost accepted:** a step on every legitimate edit. That is the point — the step
is the author reopening a decision on purpose.

### A partly-locked target refuses loudly, never silently

The case this must not get wrong: an author locks one `look_for`, then asks to
**regenerate the whole step**.

- The request is **not silently honoured around the lock** — the author asked
  for something the platform will not fully do, and regenerating "everything
  except that one field" can produce a step whose parts no longer agree.
- It is **not silently refused** either.
- It **reports**: *"3 of 5 fields in this step are locked. Regenerate the rest,
  or unlock first?"* — and the author chooses.

Same posture as the render gate: **human-readable blockers, never a dead
button.**

### Consequences

- **`capabilities` gets its first real consumer.** Every node already declares
  `capabilities`, and nothing reads them yet. A lock is the canonical case — the
  canvas asks the node what may be done to it, and a locked node answers
  "nothing." That is the registration seam doing work rather than being
  asserted.
- **Lock state is authoring state, not content.** It does not travel to a
  learner, and it is not part of what publish ships.
- **Q12 narrows further.** With locks available, the staleness-detection field is
  no longer the primary answer — it is at most a backstop for content nobody
  thought to lock. Left open, downgraded.

**Not decided here:** whether a lock records *why* it was set (a note, a link to
the discussion, or nothing). Worth a field if locks are meant to carry
"discussed and decided," but it is additive and can wait for the surface.

---

## D33 · Preview a probabilistic artifact by rerolling, not by showing one sample
**2026-09-19**

**Decided:** where a surface previews AI-generated content, it must let the
author **re-run the generation repeatedly** and judge the spread. A single
generated sample is never presented as *the* output. Content shipped **verbatim**
updates live instead, with no rerun.

**User's framing:** *"Changes to AI guidelines are tested by 'regenerating' an AI
response chat over and over to see multiple examples of how it will generate
answers under those guidelines. Verbatim changes result in live updates and
certain interactions of the scenario can be 'scrubbed' so the designer isn't
going through a full scenario to see a text change."*

**Why this is a decision and not a feature detail.** The video canvas is
trustworthy because video output is **deterministic** — the same word yields the
same frame. Generated conversation is **probabilistic**: the same calibration
produces a different reply every run. Porting the canvas pattern naively would
show one roll of the dice in a surface whose whole promise is *what you see is
what it is* — inviting exactly the false confidence the *"preview composite · not
the render"* badge was added to prevent.

**Rerolling makes variability visible rather than hiding it.** The spread is the
thing being judged, so the surface must show a spread.

**Three consequences, all reusable beyond scenario:**

1. **Split the preview by determinism, not by field type.** Any modality mixing
   authored and generated content needs the same split: verbatim → live update;
   generated → reroll.
2. **A kept roll should become authored content.** A generated reply worth
   remembering is pinned into the format's own `example` field rather than being
   a screenshot. **Preview becomes an authoring gesture.**
3. **Show which guidance produced what.** Each generated turn is tagged with the
   calibration level that steered it, and the tag links back to the field. This
   is the same job the word playhead does for on-screen text: make an invisible
   binding legible and clickable.

**Rejected:** showing a single generated example inline in the form (cheap, and
actively misleading — it reads as the answer rather than as one draw); and
generating nothing, leaving the author to imagine the output (what the reference
editor does today, and the thing this is meant to fix).

**Asks of the engine:** running turns against the real model under authored
calibration, from inside an authoring tool. Beyond today's player. Per D31 and
the video-rendering precedent, that is the case being made rather than a
constraint to design around.

---

## D34 · The project is the authoring unit; the library accumulates from projects
**2026-09-20** · resolves **Q4**, and therefore **Q6**

**Decided:** information points are **owned by a project** — authored in its
scope, not referenced out of a global set. Separately, points **accumulate into
a library** across projects, and a new project may **import** existing points
rather than re-authoring them.

**User's framing:** *"They are a document in the sense of each project, but
information points will likely decompose into a library of 'what info do we have
on forklifts' to generate new starting points for projects. The specific project
will determine which points are authored and which ones are imported because
they already exist in the library. We won't ask an SME to write everything they
know about forklift safety — we'll give them the scope of the desired project,
and over the course of several projects, develop a library of points that cover
forklifts."*

**Why this is neither of the options I offered.** I framed it as library *or*
document: points global and referenced, versus project-owned and copied. The
answer is that those describe **two different moments**, not two architectures.

- **Authoring** is project-scoped, because an SME is given a *scope* and asked
  about that. Nobody can write everything they know about forklifts, and asking
  them to produces nothing.
- **The library is an outcome**, built up as projects finish, and its job is to
  give the *next* project a starting position rather than a blank page.

This is `MODEL.md`'s back-catalog claim arrived at from the other end: the
commercial asset is an unextracted library of information points, and this says
where that library actually comes from. It is a **by-product of doing the work**,
not a precondition for starting it.

**Consequences:**

- **No shared-edit governance problem.** A project owns its points, so editing
  one cannot silently change another project. The question I thought Q4 was
  asking does not arise.
- **Import is a real operation**, and the surface it needs is a *search over the
  library scoped by subject* — "what do we already have on forklifts" — not a
  reference picker.
- **Provenance gains a value.** A point is authored-here or imported-from-library
  (alongside D8's sourced vs. model-knowledge). An imported point may carry
  where it came from, which is what makes the library legible rather than a
  dumping ground.
- **Drift across the library is out of scope for now.** If project B imports a
  point and project A later corrects it, nothing propagates — by design, since
  the point was copied. Whether the library should notice that divergence is a
  later question (**Q19**).
- **Q6 follows:** an activity belongs to one project. Sharing an activity is the
  org's existing Shared LO model (D18), unchanged.

**Rejected:** points global and referenced (creates a governance question about
who may edit a shared point, and makes an edit in one project a change in
another); and pure copy with no library at all (loses the back-catalog argument
entirely).

---

## D35 · Confirmation is the evidence; no separate evidence field
**2026-09-20** · resolves **Q5**

**Decided:** an SME's confirmation, recorded against a point version, **is** the
audit record. No note, no structured evidence kind.

**Why (user):** *"Confirmation IS the evidence."* The tag already carries who
judged it (`state`) and what they judged it against (`at`), which is a real
trail. A free-text reason invites prose that satisfies a field without meaning
anything — box-ticking that looks like rigour.

**Rejected:** an optional note (cheap, but a field that is usually empty and
occasionally lied to is worse than no field); structured evidence kinds
(queryable, but more machinery than the question justifies, and it would need
maintaining as a vocabulary).

**Revisit if** a Compliance audit actually asks *"confirmed on what basis?"* and
`state` + `at` turns out not to answer it.

---

## D36 · "Outputs" stays
**2026-09-20** · resolves **Q7**

**Decided:** keep **Outputs** as the collective over Course and Experience.

**Why (user):** it is accurate, neutral, already in the UI and every document,
and nobody misreads it. *Deliverables* is warmer but buys nothing; dropping the
collective entirely would mean renaming a layer that works.

Closed rather than deferred — the question had been open since the first session
and was costing more attention than the answer is worth.

---

## D37 · Prompt-smell: blocks on verbatim text, warns on guidance
**2026-09-20** · resolves **Q17**

**Decided:** authored text that talks about the AI or the interface **blocks the
gate** when it sits in a field the learner reads literally, and **warns** when it
sits in guidance.

**Why the lint exists at all** (worth stating, since it was inherited from the
reference without justification): the coach's dialogue is *generated* from what
the author writes in `look_for`, `response` and `purpose` — those are compiled
into a system prompt. An author who writes *"the AI should redirect here"* has
put that phrasing into the prompt, and the model can echo it back. **The
scaffolding leaks into the performance.**

**Why the split:**

| | Example | Treatment |
|---|---|---|
| **Verbatim** — the learner reads it | an opening saying *"the AI will now ask you…"* | **blocks** — definitely wrong |
| **Guidance** — steers generation | a `response` saying *"the AI should redirect"* | **warns** — may be deliberate |

The reference blocks on both, because its document *is* a prompt and it is
protecting a loader. Here the distinction between verbatim and guidance is
already load-bearing across the whole surface (D33), so the lint honours it
rather than flattening it.

This is also the platform's usual flag-vs-gate split (D14, D19) applied to a new
signal: gate what is certainly broken, flag what is a judgment.

---

## D38 · A scenario's opening stays on the activity, with no compose rule
**2026-09-20** · resolves **Q13**

**Decided:** the ungraded opening reflection belongs to the activity. If several
scenario activities compose into one output, the learner meets several warm-ups,
and **nothing silently removes them**.

**Why (user):** *"Keep on activity, no rule — author's problem."* What was
authored is what is delivered. A compose rule that quietly dropped warm-ups would
be hidden behaviour, and this platform has consistently chosen to surface a
signal rather than act on it (D14, D19, D32).

**Consistent with** *"this is the designer's environment to control and explore"*
(D30-era). The designer can see three warm-ups in a composed output and remove
two.

**Worth revisiting** when compose gets a real surface: the *right* move there may
be to show the collision rather than either fix it or ignore it.

---

## D39 · `implementation_id` is derived and read-only
**2026-09-20** · resolves **Q14**

**Decided:** the export's document id is **generated from the activity's node
id** and displayed read-only.

**Why:** `MODEL.md`'s node addressing is explicit that ids are *stable, opaque,
and survive re-render and rebuild* — the whole point is that they are not typed
by humans. Exposing the document id as a text field let an author break the thing
that identifies their scenario to a player, with a typo.

Shown rather than hidden, the way the coverage page shows point ids: visible,
referenceable, not editable.

**Rejected:** editable (faithful to the reference, which has no node-id model to
derive from — it must author identity because nothing else supplies it); and
derive-with-override (the migration case it protects is hypothetical, and an
override is a footgun kept loaded for a case nobody has hit).

---

## D40 · Coverage stays at activity level — rubric items do not bind to points
**2026-09-20** · resolves **Q16**

**Decided:** an observe_react's rubric items are **not** bound to information
points. Coverage remains a claim about the whole activity.

**Why (user):** keep tagging at activity level. The argument *for* binding was
that a rubric item is a discrete assertion rather than a span of prose, so it
escapes the reason per-section traceability was rejected. That is true, and still
not enough: it would make coverage computed in one modality and asserted in every
other, which is a worse inconsistency than the precision it buys.

**Consistent with** the activity-level tagging decision and its rejustification
(`MODALITIES.md`): the tagging contract is *this activity satisfies this point to
this depth*, and that claim is well-formed without locating it internally.

---

## D41 · Approval staleness is computed and shown; re-approval is always human
**2026-09-20** · resolves **Q12**

**Decided:** when content changes under an approval, the platform **shows that
the approval is out of date**. It never re-approves anything itself. The same
human process that granted the approval runs again over the edited content.

**User's framing:** *"Whatever process set the initial approval would just happen
again with the edited content. This will not be generated approval. We need the
platform to show when that approval is out of date — and maybe suggest what a
set of content satisfies — but this will always be a human-in-the-loop
verification."*

**What this settles.** Q12 was framed as a detection problem; the answer is that
detection is the *whole* job. The platform's role is to make staleness visible
and, at most, to **propose** what edited content appears to satisfy. The judgment
is never derived.

**Mechanically** this is D20's move, applied on the second axis. A coverage tag
already pins the **point version** it was judged against (`at: 2`), which makes
*"the point moved under this tag"* computable. This adds the mirror: record what
the approval was made against on the **activity** side, so *"the activity moved
under this approval"* is computable too. Two axes, one derivation, no new tag
state.

**Deliberately not gated.** An out-of-date approval is a signal, not a block —
the same call D19 made for drift, for the same reason: materiality is a human
declaration. A trivial wording fix should not invalidate an SME's judgment, and
only a person can say which is which.

**The "suggest" half is a real feature, recorded so it is not lost:** given
edited content, the platform may propose *which points it now appears to satisfy,
and to what depth* — as a **proposal** in the D16 sense (`proposed`, awaiting a
human), never as an adjustment. That is the AI doing the legwork a reviewer would
otherwise do by hand, without taking the decision.

**Also resolves the check case.** A check bound to its activity's language
(`MODALITIES.md`) is the same shape: the narration moved, so the check is
suspect. Same mechanic, same treatment, same human in the loop.

---

## D42 · Static content is verified at activity level; generated content needs milestones
**2026-09-20** · resolves **Q11**, and states a principle beyond scenario

**Decided:** a point covered by **generated** content must be anchored to a
**required beat** — a milestone in the interaction that cannot be skipped, so the
learner reaches it whatever path they take. A beat may be satisfied by
**testing out**: if the beat assesses the point and the learner demonstrates it,
that counts as completion.

**User's framing:** *"I think it's a required beat that can't be skipped, with
the exception of if that beat assesses the user knows the point and they 'test
out' of it without completing. I think the key difference here is that static
content can be verified at the activity level because it is static. Dynamic or
generated content needs these milestones to anchor to. This pattern will likely
expand past video and scenario outputs."*

**This is the principle, and it is bigger than scenario:**

| Content | Why coverage is trustworthy | What a tag means |
|---|---|---|
| **Static** — narration, a key point, the closing | every learner receives the same bytes | a claim about the activity, verifiable by reading it |
| **Generated** — a coach's replies, an adaptive path | no two learners receive the same thing | a claim about *a distribution*, unverifiable by reading any one run |

So **activity-level tagging was never wrong — it was under-specified.** It is
sufficient for static content and insufficient for generated content, and the
platform did not previously distinguish the two.

**What a required beat adds:** a coverage tag on generated content names the beat
that guarantees it. Validation can then say something stronger than *"an activity
claims this point"* — it can say *"every learner reaches this point, because this
beat cannot be skipped."*

**Test-out is part of the guarantee, not an exception to it.** The bar is that the
learner **arrives at the point**, not that they sit through the teaching. A beat
that assesses and passes them has done its job better than one that delivers to
someone who already knew it — and this is exactly the threshold framing the whole
model rests on (*completion is meeting a threshold, not reaching the end*).

**Why this generalises**, per the user: any modality with a generated or adaptive
element has the same hole. A branching video, an adaptive path through an output,
a podcast that responds — each needs beats for the same reason, and the
mechanism should be defined once rather than per modality.

**Revises Q11's framing.** I had posed it as *"a long activity is hard for an SME
to falsify"* and offered review-time aids. Length was the wrong axis: a **short**
generated activity has the same problem, and a **long** static one does not.

---

## D43 · An information-set change recomputes and reports — the same treatment as drift
**2026-09-20** · resolves **Q2**

**Decided:** adding or removing an information point **recomputes every affected
output and shows what changed**. Nothing blocks, nothing is silently repaired.

- **Add a point** → every output re-evaluates against the new set. An output that
  was complete and now is not says so, naming the point nothing covers.
- **Remove a point** → activities carrying a tag to it are reported as orphaned,
  and the tags are cleared on request rather than behind the author's back.

**Why (user):** *"Recompute and show — same as drift."* And that consistency is
the argument. The platform already answers every "something moved underneath
this" question the same way: compute it, surface it, let a human decide whether
it matters (D19 for point versions, D41 for approvals, D42 for beats). A set
change is the same event at a different altitude, and inventing a fourth
mechanic for it would be the odd choice.

**Why it does not block.** Q2 called this *"the most likely real-world event in
the whole system"* — which is precisely the argument *against* gating it. A
platform that halts on its most common event is a platform people route around.
An output dropping from 6/6 to 6/7 is information, not an error.

**Removal is reported, not auto-pruned** — deliberately unlike a step deletion
(D26), which prunes carryover immediately. The difference: a carryover names a
step *inside the same activity*, so its author is present and the repair is
local. A point removal reaches into **activities somebody else may own**, and
silently editing their coverage claims is exactly the kind of invisible change
D30's discussion ruled against.

**Related:** `MODEL.md` already gives a point a `lifecycle` (`current` /
`archived`), and archiving is the softer path — the tag survives and is flagged
critical rather than orphaned. Whether hard removal should exist at all is worth
asking when information authoring is built (D7).

---

## D44 · Rehearsal is a targeted preview; an output previews in a real player
**2026-09-20** · resolves **Q8**

**Decided:** **yes**, authors need to preview traversal — and it is **two
different things**, which this had conflated:

| | What it is | Where |
|---|---|---|
| **Rehearsal** (built) | a *targeted* preview — one step, one calibration, rerolled to see the spread | inside the authoring surface |
| **Learner preview** (not built) | the real thing, as a learner meets it | **a new tab or window, in the media player UI** |

**User's framing:** *"Rehearsal is a targeted preview, but all outputs should
have a way to externally preview what the learner will see and simulate as a
learner. This likely spawns a new tab/window with our media player UI so it's a
realistic preview."*

**Why the split matters.** Rehearsal deliberately shows its workings — level
tags, reroll controls, the verbatim/guidance badges. That is what makes it an
authoring instrument (D33), and it is exactly what disqualifies it as a
representation of the learner's experience. A preview that shows the scaffolding
is not a preview.

So the learner preview is **not a mode of the authoring surface**. It leaves —
new tab, real player chrome, no authoring affordances. The reference tool reached
the same conclusion by a different route: its "Preview as learner" opens the
player, and it deliberately collapsed two separate actions into one because doing
them in the wrong order silently showed the wrong content.

**Scope: all outputs, not just scenarios.** A Course and an Experience both need
it, and the Experience needs it most — its traversal is generated, so the only
way to see what a learner meets is to be one. With beats (D42), that walk is
*checkable* rather than impressionistic: it can report which points were reached
and whether every beat fired.

**Not built.** It needs a player, which is out of scope here. Recorded so the
authoring surface leaves room for it rather than growing a half-version of it
internally.

---

## D45 · Tagging at scale is managed by scoping activities, not by a bulk tool
**2026-09-20** · resolves **Q10**

**Decided:** AI proposes tags for an LED to review (which D16's provenance model
already supports), and the volume stays manageable because **activities are
scoped to a small information set** — one an author can expect a learner to
actually learn and retain.

**User's framing:** *"A combination of the AI proposing so the LED can review,
but also that activities' best practice is to scope them to a smaller info set
that can be learned and retained. Also not to have several activities that repeat
info in different ways. I'm not too concerned with an unreasonable matrix
spawning from the info points."*

**Why this dissolves the question rather than answering it.** Q10 imagined 40
points × 30 activities as 1,200 decisions. That is a **grid**, and the model is
not a grid — an activity covers the points it covers, typically few. The scale
problem was an artifact of picturing a matrix where the real structure is a
sparse set of deliberate claims.

Two authoring norms keep it that way, and both are pedagogy rather than tooling:

- **Scope an activity to what can be learned and retained.** An activity claiming
  fifteen points is a design problem before it is a tagging problem.
- **Do not build several activities that repeat the same information differently.**
  Redundant coverage is the thing that would inflate the tag count, and it is
  already bad practice for its own reasons.

**Consequence:** no bulk-review surface is planned. If a real project produces
enough tags that review becomes a burden, that is evidence the activities are
scoped wrongly — a signal worth surfacing rather than a volume worth tooling
around.

**Kept from the original question:** AI proposal with LED review is still the
creation path, and `proposed` / `adjusted` / `confirmed` (D16) is still what makes
a guess distinguishable from a judgment.

---

## D46 · A beat is one named concept, defined per modality as they are built
**2026-09-20** · resolves **Q20**

**Decided:** **beat** is standard vocabulary across the platform — the same word
for the same idea wherever generated content needs anchoring. Each modality
defines what its own beats are *as it is built*, rather than the platform
designing beats for modalities that do not exist yet.

**User's framing:** *"For now everything is scoped to either video output or
scenario, but as we develop modalities I'd like to keep the terminology
standardized so the same concepts are conveyed with the same terms across
modalities, activities, outputs, etc."*

**What this settles, and what it deliberately does not.** Q20 asked whether a
beat is one shared primitive or a per-modality concept, and treated that as a
binary. It is neither: **the concept and its name are shared; the definition is
per-modality and arrives with the modality.**

So the rule is a naming discipline rather than an abstraction:

> A **beat** is a unit the learner provably reaches. Wherever a modality has
> generated content, the thing that guarantees a point is called a beat — not a
> checkpoint, not a milestone, not a gate.

**Defined so far:**

| Where | A beat is | Why |
|---|---|---|
| **Scenario** | a **step** | the conversation is generated; the step is the unit a learner provably reaches |
| **Output — Experience** | an **activity**, reachable on every path | the *traversal* is generated, so the guarantee is a property of the composition (D47) |
| **Video** | — | static once rendered; every learner sees the same frames. A video *with checks* may need one, and that is the video modality's call when it gets there |
| Podcast, job aid, reflection | — | undesigned; each defines its own when built |

**Why not design the rest now.** Designing beats for a podcast before the podcast
surface exists would be inventing a constraint for content nobody has authored.
The naming discipline is what keeps the concepts from diverging in the meantime —
which is the actual risk, since two modalities designed months apart will
otherwise coin two words for the same thing.

**Consequence for the docs:** *beat* joins the vocabulary in `MODEL.md` rather
than living only in the scenario section, so the next modality inherits the term
instead of reinventing it.

---

## D47 · An Experience computes reachability; the author can pin an activity required
**2026-09-20** · resolves the second half of **Q20**

**Decided:** for an output whose traversal is generated — the Experience format,
a graph with learner-choice edges — a point's coverage is **guaranteed when every
path from the entry passes through an activity that covers it**. That is
computed. Where it comes out short, the author may **pin an activity as
required**, which is what makes it so.

**Why both** (user: *"compute, and let the author pin"*): the computation says
*why* something is not guaranteed — *"reachable on 1 of 3 paths"* — which an
authored required/optional flag cannot. The pin is the action that fixes it. One
explains, the other repairs.

**Why computing alone is not enough:** it can only report. An author looking at
*"info-3 is reachable on 1 of 3 paths"* needs a way to act on it, and rewiring
edges by hand to force a path is a worse interaction than saying *this one is
required*.

**Why authoring alone is not enough:** a required/optional flag **duplicates what
the edges already say**, and the two can disagree. Then the platform has two
answers to the same question and no way to choose. Computing from the graph keeps
one source of truth; the pin is an input to that graph, not a parallel claim
about it.

**This is the same shape as coverage itself.** An activity *declares* what it
covers and the output *validates* the set (D29). Here an author *declares* what is
required and the traversal *computes* what that guarantees. Declaration plus
derivation, not assertion.

**Scope.** Only outputs with a generated or branching traversal need this. A
structural Course is a sequence — every learner meets everything, so reachability
is trivially total and the question does not arise.
