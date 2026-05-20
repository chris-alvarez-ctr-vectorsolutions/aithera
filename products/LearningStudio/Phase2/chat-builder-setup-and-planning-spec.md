# Chat-Driven Course Builder: Setup & Planning Spec

> **Scope:** This document covers everything from project kickoff up to (but not including) the **Generate** action. Generation, post-generation review, and integration with the existing studio editor are out of scope here — they are downstream of this spec and will be covered separately.

---

## 1. Purpose

This is an AI-optimized layer that sits **above** the existing manual creation studio. Its goal is to take a non-instructional-designer (HR, training department, etc.) from "I need to make a course" to a polished, generation-ready plan with as little structured input as possible. The target experience is **chat → refine → output**, with the studio editor reserved for surgical post-generation tweaks.

The hard constraint that shapes the entire workflow: **scene-level generation is the expensive operation.** Transcripts, media, and per-scene rendering are time- and cost-intensive on the backend. Everything in this spec is about getting as far as possible **before** that generation runs — building structure, intent, source bindings, and stylistic parameters cheaply, so that the eventual generation call produces something close to final on the first pass.

---

## 2. Core Principles

These are the governing rules. When in doubt during prototyping, return to these.

**Generate a strawman fast, then let users react.** Non-experts are far better at reacting to something concrete than specifying something abstract. Default to producing something the user can edit, not asking them to fill in fields.

**Decisions get made for the user; users override.** Every question we ask is a moment of potential disengagement or wrong-answer guessing. The AI should infer and act, then surface its assumptions for confirmation. "I assumed 30 minutes — change this" beats "How long should the course be?"

**Plan cheaply; commit expensively.** All planning artifacts (brief, talking points, structure, samples) are cheap, regenerable, and disposable. Real content (scenes, transcripts, final media) is only produced at the explicit Generate action.

**Samples are previews, not drafts.** Tone samples and media samples illustrate what the finished thing will *feel* like. They are not pieces of the final course. Users select stylistic parameters from samples; those parameters feed generation.

**The AI has memory and uses it.** Committed decisions stay committed. The system should reference prior locks ("you wanted scenario-heavy") when later requests would contradict them, rather than silently overriding.

**One workspace, beginning to end.** The chat builder is not a wizard that hands users off to a different product. It persists all the way through generation and into refinement. The studio's Author View becomes a mode within this workspace, not a separate destination.

---

## 3. The Plan / Execute Split

This is the load-bearing architectural concept. The entire workflow has two tiers:

**Planning tier** — produces a **Course Plan**: a structured representation of intent, structure, parameters, and source bindings. Cheap to produce, cheap to revise, fully editable through chat. Includes Learning Object shells, talking points, locked stylistic decisions, and pending refinement instructions.

**Execution tier** — triggered by the Generate action. Takes the Course Plan as input and produces real Learning Object content: scenes, transcripts, media, questions. This is where the expensive backend operations happen. Output is the same kind of LO that the existing studio produces — generation is essentially a high-quality first draft of work the studio would otherwise build manually.

The user lives in the planning tier for as long as possible. Most of this spec describes the planning tier.

---

## 4. Workflow Phases (Pre-Generate)

The user moves through four phases. Each phase is designed to require minimum input and produce maximum scaffolding for the next.

### 4.1 Intake

**Goal:** Get the system the raw materials and a one-line direction.

**UI:** Chat-dominant. Prominent drag-and-drop zone. Minimal chrome.

**User actions:**
- Drop in artifacts: policies, regulations, brand guides, existing course material, reference docs, anything relevant. Multiple files. No required types.
- Write a short kickoff prompt: "Create a workplace harassment course for new managers" or similar.

**System actions (in the background, while user uploads):**
- Analyze each artifact: detect type, extract topics, pull key terms, identify section structure, flag any cross-document conflicts.
- Build an inventory the AI can reference when the kickoff prompt arrives.
- By the time the user submits their prompt, the AI already has context.

**Output of this phase:** Source records populated, project metadata initialized, ready to propose a brief.

### 4.2 Brief Negotiation

**Goal:** Produce a Course Plan structure (LO list, duration allocation, source bindings) the user accepts.

**UI:** Still chat-dominant. AI proposes a brief. User reacts in chat. Brief artifact updates live in a canvas area.

**Critical mechanics:**
- **AI proposes first.** Brief is generated from the kickoff prompt and source analysis, not asked for field by field.
- **One targeted question max.** If the AI needs clarification, it asks exactly one question with concrete framing ("Is the focus prevention, response, or both?"). It does not ask for objectives, audience details, length, or other things it can infer or default.
- **Visible budget.** Duration target vs. current allocation is shown throughout. Guardrail pushbacks reference the budget concretely ("you have 4 minutes left, this topic typically needs 6") rather than vaguely ("are you sure?").
- **Commitment memory.** Once a decision is accepted ("scenario-heavy structure"), it's locked and surfaced in the rail. The AI references locks when later requests would contradict them.

**Output of this phase:** A Course Plan with project metadata, source bindings per LO, LO list with intent and talking points, and an accepted overall structure.

This phase ends when the user explicitly accepts the brief. **Acceptance triggers The Warp** (see UI section).

### 4.3 Style Anchoring

**Goal:** Lock global stylistic parameters by having the user pick from representative samples.

This is split into separate, isolated decisions rather than a bundled "style" question:

**4.3.1 Narrative tone**
- System picks a representative talking point from the proposed structure.
- Generates 3 short passages in different tones (e.g., conversational, professional, direct).
- User picks one. ~15 seconds.

**4.3.2 Visual style**
- System generates the same illustrative subject in 3–4 visual styles (illustrated, photographic, flat corporate, etc.).
- User picks one.
- If a brand guide was uploaded, the system can pre-bias toward visual styles compatible with it.

**4.3.3 Supplementary technique style** *(lower priority, can skip with default)*
- 2–3 examples of how knowledge checks, callouts, summaries will look.
- User picks one or accepts default.

**Critical mechanics:**
- **All samples are generated from the actual proposed course content**, not generic placeholders. Users pick based on how *their* content feels in each style.
- **Each sample is labeled "preview only — not part of your course"** to prevent the misunderstanding that they're approving final prose.
- **Samples are cheap and regenerable.** Users can request more options without churning real content.
- **Selections are stored as parameters** — labels plus richer descriptors that generation can use as prompt input.

**Output of this phase:** Global parameters populated and locked.

### 4.4 Ready-to-Generate State

**Goal:** Final review before committing to the expensive generation step.

**UI:** Structure-dominant. The full Course Plan is visible. A "ready to generate" summary surfaces:
- Number of LOs
- Estimated number of scenes to be created
- Estimated generation time
- Source bindings (which docs ground which LOs)
- Locked parameters (tone, visual style, etc.)
- Pending refinements per LO

The Generate button is **persistently visible from much earlier**, but **conditionally enabled**. If something is blocking generation, the button labels what's missing ("Generate course (visual style not selected)"). This way the user always knows generation is coming and what's gating it.

This phase ends when the user clicks Generate. **Anything after that is out of scope for this spec.**

---

## 5. UI Architecture

### 5.1 The Warp

A literal animated transition that occurs when the user accepts the brief at the end of Phase 4.2. Before the warp:
- Chat is full-width or near-full-width.
- Canvas shows the brief as it's being negotiated.
- No rail yet.

The warp:
- Chat panel animates to the side, shrinking to a side rail width.
- A left meta-rail materializes (budget, locks, progress).
- The course structure visual takes center stage in the canvas.

After the warp, the user is in the persistent three-zone workspace that they'll remain in through generation and refinement. The warp marks the moment when the brief commits and the workflow shifts from "shaping intent" to "refining a concrete plan."

### 5.2 Three-Zone Layout (Post-Warp)

```
┌──────────┬─────────────────────────────────┬──────────┐
│          │                                 │          │
│   LEFT   │         MAIN CANVAS             │  RIGHT   │
│   RAIL   │      (dynamic, mode-based)      │   CHAT   │
│          │                                 │          │
│  budget  │                                 │  command │
│  locks   │                                 │  history │
│ progress │                                 │ contextual│
│  sources │                                 │  prompts │
│          │                                 │          │
└──────────┴─────────────────────────────────┴──────────┘
```

Each zone has a clear job. They don't compete. The canvas is where the eye goes; rail and chat are supporting.

### 5.3 Left Rail Anatomy

Always visible. Contents:

**Duration budget**
- Target duration
- Current allocated duration (sum across LOs)
- Remaining duration
- Visual indicator (bar / ring)

**Progress checkpoints**
- Brief accepted ✓
- Tone selected ✓
- Visual style selected ✓
- Supplementary style selected ✓
- Ready to generate

**Locked decisions**
- A list of pills/chips: "scenario-heavy", "conversational tone", "uses uploaded harassment policy", etc.
- Each lock shows its **source**: user-selected, AI-inferred, or default. AI-inferred and default invite review; user-selected don't.
- Each lock is clickable to unlock and revisit.

**Source materials**
- The uploaded docs, always one click away.
- Status per doc (analyzed / processing / failed).
- Optionally: which LOs reference this source.

**Generate button**
- Persistent, prominent.
- Conditionally enabled.
- Labels what's blocking when disabled.

### 5.4 Canvas Modes (Pre-Generate)

The canvas is dynamic — its content changes based on what's currently being discussed. Only one mode is shown at a time. Transitions between modes should be smooth, not abrupt.

Each canvas mode has a small breadcrumb/label at its top ("Course Structure" / "Choosing Narrative Tone" / "LO 3: Bystander Intervention") so the user always knows what they're looking at.

| Mode | Shown when | Editable via chat? | Editable directly? |
|------|------------|---------------------|---------------------|
| **Brief negotiation** | Phase 4.2 (pre-warp) | Yes | Limited |
| **Course structure** | Default post-warp | Yes | Yes (reorder, edit titles) |
| **LO detail** | User selects an LO | Yes | Yes (talking points, intent, duration) |
| **Tone picker** | Phase 4.3.1 | Request more options | Click to select |
| **Visual style picker** | Phase 4.3.2 | Request more options | Click to select |
| **Supplementary style picker** | Phase 4.3.3 | Request more options | Click to select |
| **Source viewer** | User clicks a source | Limited | Read-only |
| **Ready-to-generate summary** | Phase 4.4 | Yes (final tweaks) | Limited |

The **Course structure** mode is the user's "home." When nothing specific is being discussed, the canvas defaults to this.

### 5.5 Chat's Evolving Role

**Pre-warp:** Chat is the primary surface. Users converse to shape the brief. Chat carries most of the interaction weight.

**Post-warp:** Chat is the command bar with memory. Users type intent; the canvas reflects the change. Chat is visually quieter (smaller text, less contrast) so the canvas dominates attention. Chat is also collapsible for users who prefer direct manipulation.

**Bidirectional binding:** Typing in chat updates the canvas. Clicking in the canvas updates chat context. Example: clicking LO 3 in the structure view orients chat to "editing LO 3," and chat suggestions become LO-3-specific.

**Re-promotion on important moments:** If the user requests something that triggers a guardrail conversation ("that pushes you 8 minutes over budget"), chat can briefly expand or highlight to surface the need for attention. The warp isn't one-way — chat can re-promote when it matters.

**Contextual suggestions:** Chat input shows quick-action suggestions based on the current canvas mode. Structure view → "reorder sections", "add a topic". LO detail → "rewrite talking points", "change duration". Tone picker → "show more options".

---

## 6. Data Model: The Course Plan

The Course Plan is the central artifact of the planning tier. It is a structured representation that captures everything the chat workflow has decided. It feeds the Generate action.

The plan has five layers.

### 6.1 Project Layer

Identity and intent.

```
CoursePlan {
  id
  title                    // auto-suggested, editable
  description              // AI-maintained summary
  target_audience          // who the course is for
  target_duration_minutes  // the budget
  project_type             // compliance | soft-skills | technical-onboarding | other
  owner / organization
  created_at / updated_at
}
```

**Notes:**
- `target_audience` should be inferred from the kickoff prompt and surfaced for confirmation, not asked cold.
- `project_type` is optional but useful for applying different instructional defaults.

### 6.2 Source Layer

Uploaded artifacts and what the system understands about them.

```
Source {
  id
  file_reference
  detected_type            // policy | regulation | brand-guide | existing-course | reference | other
  status                   // analyzed | processing | failed
  extracted_topics         // list of topics found in the doc
  key_terms                // for vocabulary consistency
  section_anchors          // structured headings/sections (for grounded citation)
  authority_level          // authoritative | supplementary
  conflicts_with           // list of other source IDs this contradicts
}
```

**Notes:**
- `authority_level` defaults from `detected_type` (policies and regulations are authoritative, references are supplementary) but is overridable.
- When two sources conflict and one is authoritative, generation should defer to the authoritative one and surface the conflict to the user.
- `section_anchors` retains the doc's internal structure so generation can cite specific sections if needed.
- Sources **persist throughout the session** and are re-referenceable. The user will say things like "make sure LO 4 reflects what the policy says about retaliation" — the AI needs to go back to source.

### 6.3 Global Parameters Layer

Decisions that apply to the entire course. These are the locks shown in the rail.

```
GlobalParameters {
  narrative_tone {
    label                  // e.g., "conversational"
    descriptor             // richer description for generation prompts
    source                 // user-selected | ai-inferred | default
    locked                 // bool — won't change without explicit unlock
  }
  visual_style { label, descriptor, source, locked }
  supplementary_style { label, descriptor, source, locked }
  instructional_density    // light | standard | dense
  formality                // separate from tone; affects register
  branding_constraints {
    colors, fonts, logo_usage  // extracted from brand guide if present
  }
  instructional_approach_bias  // scenario-heavy | content-heavy | assessment-heavy | balanced
  reading_level
  accessibility_requirements
}
```

**Notes:**
- Each parameter has a `source` field. AI-inferred and default invite user review; user-selected don't.
- Each parameter has a `locked` flag. Locked parameters require explicit unlock before the AI will change them. This is how commitment memory works in practice.
- `narrative_tone` and `visual_style` are selected through the sample-picking flows in Phase 4.3.

### 6.4 Structure Layer

The list of Learning Object plans. This is the heart of the Course Plan and where most editing happens.

```
LOPlan {
  id
  position                 // order in sequence
  title
  description
  instructional_intent     // introduce-concept | build-skill | assess | reinforce | other
  target_duration_minutes
  content_composition {
    has_opening_scenario   // bool
    content_talking_points // list of bullets
    knowledge_check_slots  // count + topic hints
    has_summary            // bool
  }
  source_bindings [        // which sources ground this LO
    { source_id, section_anchor?, weight }
  ]
  reuse_reference {        // if this LO pulls from existing library
    existing_lo_id
    reuse_mode             // use-as-is | derive-copy | inspiration-only
  } | null
  question_intentions [    // placeholders for questions
    { topic_hint, intent }
  ]
  status                   // planned | sampled | generated | edited | finalized
  version                  // increments when definition meaningfully changes
}
```

**Notes:**
- **Talking points are the canonical content representation during planning.** They are the cheap, editable shape of what the eventual transcript will cover. The user can edit them freely; the AI can reason about them; generation expands them into prose.
- **Composition is intentionally not fully prescriptive.** Don't specify exact scene counts at plan time. Specify intent and talking points; let generation determine the scene count based on density and duration. User can override if they care, but the default should leave that flexibility.
- `source_bindings` can be at the section level, not just the document level. This enables targeted grounding ("LO 4 is grounded specifically in Section 4.2 of the harassment policy").
- `reuse_reference` interacts with the existing ownership model:
  - `use-as-is` → existing LO is included by reference; impact state increments.
  - `derive-copy` → a new LO is created starting from the existing LO's content, then planned forward.
  - `inspiration-only` → existing LO is used as input to AI but not directly reused.
- `version` enables detecting when a plan has drifted from generated content (similar to the existing Outdated state, one level up).

### 6.5 Refinement Layer

Deferred instructions and per-LO overrides. These accumulate during planning and are applied at generation.

```
Refinement {
  id
  target {
    type                   // global | lo | talking-point | question-slot
    target_id              // null if global
  }
  instruction              // user's natural-language request
  refinement_type          // tone-shift | content-emphasis | style-override | structural
  status                   // pending | applied | rejected
  source_chat_turn         // for audit and revisit
  created_at
}
```

**Notes:**
- Refinements are how the system handles user requests that **can't be acted on yet because content doesn't exist**. "Make LO 4 funnier" pre-generate becomes a refinement against LO 4, applied when generation runs.
- The rail can show "3 refinements pending" against an LO, expandable to view the list.
- **Refinements are a planning-tier construct.** Once content exists post-generation, the user edits it directly (manually or through chat that operates on real content). The refinement abstraction is no longer needed at that point.

---

## 7. Sample Generation

Sample generation is its own subsystem because it sits between "cheap planning" and "expensive generation." Samples cost something to produce but are explicitly throwaway.

**What samples are:**
- Short generated passages or images that illustrate stylistic options.
- Generated from real content in the proposed plan (talking points, illustrative LO subjects), not generic placeholders.
- Labeled "preview only — not part of your course."

**What samples are not:**
- Drafts of final content.
- Persistent. They are discarded once a selection is made.
- Bound to specific scenes in the final course.

**Cost management:**
- Samples are generated on-demand when the user enters a picker mode.
- The user can request "more options," which generates additional samples at additional cost.
- Sample generation should not begin until the brief is explicitly accepted (post-warp) — this avoids spending sample-generation budget on plans that change fundamentally afterward.

**Output of sample selection:**
- A label and descriptor are stored in `GlobalParameters` for the corresponding parameter.
- The samples themselves are discarded.
- The selected parameter is locked but unlockable.

---

## 8. Integration with the Existing Phase 2 Architecture

This chat-builder layer **does not introduce new persistent content types.** It produces Learning Objects, scenes, and questions — the same artifacts the existing studio produces. The chat-builder is a production accelerator, not a parallel system.

Specific integration points:

**Generation output:** Each LO Plan resolves into a real Learning Object in the existing system, entering at the "In Progress" workflow state. The studio's state model, ownership model, finalization/publishing logic, remediation flow, and search all apply downstream as defined in the existing Phase 2 spec.

**Ownership and reuse:** When the user accepts a reuse proposal in the planning tier, ownership behaves per the existing model. "Use as-is" increments impact state on the existing LO. "Derive copy" creates a new LO with the existing ownership rules.

**Source bindings persist as LO metadata** post-generation. This enables the existing remediation flow to know what grounded a given LO when policies update later.

**The Course Plan itself is a new persistent artifact.** It does not become an LO — it's a planning record that produced LOs. Whether it persists indefinitely or is archived after a period is an open question (see §10), but at minimum it persists long enough to support regeneration scenarios.

**The studio's Author View becomes a canvas mode** in this workspace post-generation. The user is never handed off to a different product. Pre-generate canvas modes give way to post-generate canvas modes; the rail and chat remain. (Post-generate UX is out of scope for this spec.)

---

## 9. Implementation Notes for Prototyping

A few things worth highlighting for engineers building from this spec:

**Chat-to-plan distillation is itself a design problem.** The AI is responsible for translating natural-language conversation into structured plan updates. If a critical decision is only implied in chat history and not captured in the plan, generation will miss it. Build the plan as the source of truth; the chat is the interface, not the record.

**The plan should be persistently visible.** The user should always be able to see the current state of their plan in the canvas or rail. The chat is conversational; the plan is canonical. Discrepancies between the two are bugs.

**Versioning matters earlier than you'd think.** `LOPlan.version` should increment any time a meaningful definition change occurs, so that post-generation drift can be detected. Build this in from the start rather than retrofitting.

**Background source analysis should happen during upload.** Don't wait for the kickoff prompt to start analyzing artifacts. By the time the user finishes typing their first message, the AI should already have an inventory.

**Sample generation costs are not zero.** Plan for cost tracking and rate-limiting on sample regeneration. Users will ask for "more options" liberally.

**The "warp" is a UX commitment, not just an animation.** Before the warp, the workflow is fluid and exploratory. After, it's structured refinement. The visual transition is a signal — make sure backend state changes align with it (brief acceptance, plan persistence, sample generation eligibility).

**Chat suggestions should be derived from canvas state, not hardcoded.** When the canvas is in LO detail mode, suggestions are LO-specific. When in structure mode, they're course-wide. Build the suggestion system as a function of canvas state from the start.

---

## 10. Open Questions

Decisions that have not yet been made and that will shape the prototype:

**How much structure does the user explicitly control vs. AI maintains?** Working assumption: user controls intent and talking points; AI controls composition (scene count, question placement) unless overridden. Worth testing.

**Are talking points the canonical user-facing representation of content during planning?** Working assumption: yes. Alternatives (outlines, narrative summaries) could be surfaced as additional views but talking points are primary.

**Does the Course Plan persist indefinitely post-generation, or get archived?** Working assumption: persist. Regeneration is a key workflow and needs the plan. But this implies lifecycle management for plans.

**How does reuse interact with planning detail?** If the user accepts a reuse proposal, does the LO Plan still get full planning detail (talking points, etc.)? Probably depends on reuse mode: `use-as-is` needs no planning detail; `derive-copy` needs the full plan starting from the source LO's actual content.

**Quality signals for reusable content.** If existing LOs can be pulled into new courses, bad LOs propagate. Need either explicit quality signals (manager-approved, recently-updated, high-usage) or a way for the AI to assess fit. May want to start with "only Finalized LOs are eligible for reuse."

**Source-grounding specificity.** Should generated content cite specific sections of source documents ("according to Section 4.2 of the Employee Handbook…")? Probably depends on project type — compliance training should cite, soft-skills shouldn't. Worth making configurable.

**Style scope.** Are tone/visual style decisions per-course or per-organization? An org with a brand wants consistent application across courses. Worth considering whether GlobalParameters has an org-level default layer that courses inherit from.

**Compliance / sign-off.** HR content often needs legal review. Worth deciding whether the state model needs a "Pending Review" state between Ready and Published for legally-sensitive content. Not unique to this layer, but more important because the AI generates volume.

---

## 11. Out of Scope (For This Spec)

To be clear about boundaries, the following are explicitly **not** covered here and will be specified separately:

- The Generate action itself: prompt construction, generation orchestration, per-LO and per-scene generation, progress visualization, failure handling.
- Post-generation review UX: how the user is guided through reviewing newly-generated content.
- Post-generation editing: how chat-driven and direct-manipulation edits coexist after content exists.
- Integration with the studio's Author View as a canvas mode.
- Map View behavior post-generation.
- Regeneration workflows (single LO, full course, with diffing).
- Lifecycle of the Course Plan after the course is finalized or published.
