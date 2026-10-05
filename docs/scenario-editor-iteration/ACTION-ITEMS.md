# Scenario Editor — Iteration Action Items

Review notes and proposed design actions for a **next-generation scenario
authoring interface**, gathered from a walkthrough of the existing prototype.

| | |
|---|---|
| **Reviewed** | `products/aithera/scenario-simulator/scenario-editor/` (read-only reference) |
| **Reviewer** | Austin Smith |
| **Date** | 2026-09-23 |
| **Status** | Review complete — ready to plan a prototype |

> **The reviewed prototype is off limits.** `products/aithera/` is not ours — it
> is reference material only. Nothing in it was modified to produce this
> document, and nothing in it should be modified as a result of it. All design
> work goes into a **separate prototype instance**.

---

## 1. What was reviewed

The **Scenario Editor** (internally "Writer Studio") is an authoring tool for
AI-driven conversational training scenarios. Its premise: as assessment moves
from multiple-choice to AI conversation, the author's job shifts from writing
answer keys to writing **guidance**. Authors never touch raw prompt text — they
fill structured, plain-language fields, and a compiler assembles the model's
system prompt around **locked engine sections** they can see but not break.

**Architecture, in brief** (matters because most findings are primitive-level):

- Vanilla JS, no build step, no backend — `localStorage` is the persistence seam
- A **type-agnostic shell** (`studio-shell.js`) that renders whatever a
  registered scenario TYPE declares. Zero per-type branches
- The go-forward type is **`v4-universal`** (Scenario CML v4). Legacy types are
  no longer authored
- Authors build every field through shared `studioApi` primitives — **`tf()`**
  (a field), **`rowsBlock()`/`subRows()`** (a list), **`rowCard()`** (a container)

**Why the primitives matter:** because every section is built from the same
three helpers, a change to one primitive reshapes the entire editor at once.
Several of the highest-value items below are single-primitive changes.

**The interface as it stands:**

- **Top bar** — build tag, save status, `Local drafts` · `New scenario` · `Export JSON`
- **Publish strip** — publish state + `Preview as learner`
- **Three columns** — phase rail (left), authoring form (center), Inspector (right)
- **Six phases** — Start → Situation & World → Teaching → Interaction →
  Voice & Tone → Debrief & Close
- **Inspector tabs** — Compiled prompt · Validation · Playtest · Say/Do Split

---

## 2. Themes

Individual findings cluster into six recurring problems. The themes matter more
than any single item — they are what a redesign should actually address.

| # | Theme | Items |
|---|---|---|
| **T1** | **Document-level identity is trapped inside a linear sequence.** Title, prior-context and scenario settings are authored as if they were steps in a flow, when they describe the whole document and should be reachable at any time. | AI-01 · AI-02 · AI-03 · AI-04 |
| **T2** | **Lists of complex objects are rendered fully inline.** Every list expands every member, always. Form length scales linearly with content, and the author can never see a collection at a glance. | AI-05 · AI-11 |
| **T3** | **One visual treatment for everything.** A setting, an AI instruction and verbatim learner text look identical. A fixed engine-owned set looks identical to a user-added list. Depth is invisible. | AI-06 · AI-07 · AI-09 |
| **T4** | **Phase order does not match authoring dependency.** Some phases hold nothing actionable; others sit downstream of content that does not depend on them. | AI-04 · AI-10 |
| **T5** | **The tool reports state but never acknowledges progress.** Validation is precise about what is wrong and silent about what just got fixed. Navigation moves the author without telling them where they landed. | AI-08 · AI-14 |
| **T6** | **The Inspector's scope is unclear.** A niche debugging view holds the default position; the anti-frustration tool is a tab you must remember to open; one tab is unrelated to authoring entirely. | AI-12 · AI-13 · AI-15 |

A seventh observation cuts across several items and is worth stating on its own:

> **T7 — Review is a first-class mode the editor does not have.** Much content
> arrives pre-filled (the `.pptx` brief importer parses it deterministically;
> the AI wizard drafts complete scenarios; templates load finished production
> documents). For that content the primary act is **reading and checking**, not
> typing from blank. The expert answer in particular is described as
> *audit-defensible* and is the artifact most likely to be reviewed by an SME,
> compliance or legal — and reviewing it today means scrolling ~98 textareas.

---

## 3. Action items

Ordered by area. **Priority** reflects leverage, not effort.

---

### AI-01 · Prior context becomes a setting, not an authoring task

| | |
|---|---|
| **Area** | Start → *What came before this scenario?* |
| **Theme** | T1 |
| **Priority** | High |

**Observation.** The help text already admits the endgame: *"In production this
is pulled in automatically — you are filling it in here so the AI can hand off
cleanly."* In the next iteration the authoring tool **owns the preceding
content**, so the prior context is known, not described. This becomes a
**decision** — should this scenario look at the previous content, or ignore
it? — rather than a **definition task**.

**Today.** Three free-text fields (`previousLO.title` · `.covered` ·
`.handoff`) the author hand-writes. The content reaches the coach only, never
the learner.

**Proposed action.** Replace the prose fields with a setting. The author's only
input is the choice; the content resolves from the surrounding course structure.

**Open questions.**
1. Binary (use / ignore), or is there a middle state such as *"use it, but don't assume mastery"*?
2. When "use it" is on, does the author see a read-only read-out of the resolved content, or nothing?
3. Default for a new scenario — on or off?
4. Migration: existing documents carry authored prose. Does it survive as a read-only override, or get dropped?
5. When a scenario is first in a course, does the setting disable itself, or is that the same as "ignore"?

---

### AI-02 · Scenario title becomes a document-level identifier

| | |
|---|---|
| **Area** | Start → Basics → first field |
| **Theme** | T1 |
| **Priority** | Medium |

**Observation.** The title identifies the whole document, so it does not belong
as a field inside one step of a linear form. It should be a higher-level
identifier, **editable or generatable at any time**.

**Today.** A plain text field buried as the first input inside Basics. The
editor chrome shows only `Scenario Simulator · <type label>` — the scenario's
own name appears **nowhere** in the chrome.

**Proposed action.** Promote the title into the editor chrome as an
inline-editable identifier reachable from any phase, with generation available
on demand rather than only at draft time.

**Open questions.**
1. Does it leave Basics entirely, or stay as a mirrored field?
2. Generate from what? The narrative is the richest source but is authored in a later phase — part of why the field feels misplaced.
3. The implementation id is **derived from the title** and shown as a read-out beneath it. Where does that provenance line live if the title moves?
4. What does the chrome show before a title exists?

---

### AI-03 · Standardize the landing button label

| | |
|---|---|
| **Area** | Start → Basics → *Landing button label* |
| **Theme** | T1 |
| **Priority** | Low |

**Observation.** If per-scenario customization of this button is not a valuable
requirement, standardize it and drop the field.

**Today.** Optional free text; blank already falls back to the player default
and is stripped at prune. The author is offered a decision without a reason to
make it.

**Proposed action.** Remove the input and let the player default own the label.
Same reasoning the team already applied when five id fields were deleted —
*"not one of the five was a decision an author makes, and all five were text
boxes."*

**Open questions.**
1. Is there a known case where a client or source deck names this button specifically? Cheap to remove, expensive to un-remove.
2. Do any existing production documents set it? If so, removal is lossy unless preserved-but-hidden.
3. The step editor has the same shape of field — *Button into the debrief*. If landing CTA does not earn customization, that one likely deserves the same scrutiny.

---

### AI-04 · The Start phase dissolves

| | |
|---|---|
| **Area** | Phase ✨ Start |
| **Theme** | T1 · T4 |
| **Priority** | High |

**Observation.** Once the title moves to the chrome, the CTA is standardized,
and prior context becomes a setting, nothing is left on Start that belongs in a
sequence.

**Today.** Start renders exactly three things:

| Renders | Fate |
|---|---|
| **Mode chooser** | Already **read-only** — one card, no alternatives offered, note reads *"Set when the scenario was created."* Not a decision |
| **Scenario title** | → chrome (AI-02) |
| **Implementation id** | Derived read-out, follows the title |
| **Landing button label** | → removed (AI-03) |
| **What came before this scenario?** | → a setting (AI-01) |

Net remainder: **one read-only card and one toggle.** Neither is a step.

**Proposed action.** Remove the Start phase. The editor opens on Situation &
World. Phase badges are already positional, so nothing renumbers by hand.

**Open questions.**
1. **Is there a scenario-level settings surface at all?** Title, prior-context, implementation id and type are all document-level. The real answer may be a persistent **document header / settings panel**, not a phase. Decide this before designing AI-02 in isolation.
2. Does the mode read-out survive anywhere? It states a fact the author cannot change or act on.
3. Opening straight onto Situation & World means the first thing an author sees is a blank narrative box. Does the wizard/template path cover the orientation Start provided?

---

### AI-05 · Replace the inline-expanded list pattern with summary rows + a dedicated authoring surface

| | |
|---|---|
| **Area** | Editor-wide — **21 list instances** in the go-forward type (17 `rowsBlock`, 4 `subRows`) |
| **Theme** | T2 |
| **Priority** | **Highest — the single biggest structural lever** |

**Observation.** Facts and characters are a *creation loop* rendered fully
inline and expanded. The same applies in Teaching. The real problem is not any
one section: **the form is simultaneously the authoring workspace and the
storage display.** Those should separate — **author in a dedicated surface,
store the final result in the form.** A more elegant way to handle loop
instances, rather than authoring groups of fields inline and stacking the form
to long scroll lengths.

**Today.** `rowsBlock` renders **every row fully expanded, always**. There is no
collapsed state in the primitive, so form length scales linearly with content —
and these are production documents where teaching topics carry up to ten points
each.

**Density by instance:**

| Section | List | Shape |
|---|---|---|
| Situation & World | Canon facts | 1 textarea × n |
| Situation & World | **Characters** | 5 fields + 2 nested lists (one of 2-field cards) — **4 levels deep** |
| Teaching | **Teaching points** | Topic + nested points list (up to 10) |
| Teaching | Misconceptions | 2 textareas × n |
| Voice & Tone | Tone rules | 1 textarea × n |
| Debrief & Close | Component groups, references | see AI-11 |
| Step editor | Levels, rubric items, carryover, debrief points | the remainder |

Critically, the author **cannot see the cast at a glance** — which is the one
thing they need when authoring steps that reference a character.

**Proposed action.** Change the primitive, not the call sites. Give `rowsBlock`
a summary/detail mode: a compact, scannable row per item in the form, with an
access point opening the full field group in a dedicated surface. Seventeen
sections improve from one change, and types keep their existing declarative
calls.

**Precedent already in the codebase.** The shell solved this exact problem once,
for **steps** — `section.list` promotes items to their own rail entries with a
focus view, because *"stacking those in one card put the fourth step behind a
scroll past the other three."* Identical reasoning. Note the existing answer was
a **rail + focus view**, not a modal.

**Open questions.**
1. **One pattern, or a tier system?** A tone rule (one textarea) and a character (four levels deep) may not want the same treatment. Likely two modes — inline-compact for single-field lists, summary + surface for multi-field ones.
2. **Modal vs. side panel vs. the existing rail/focus pattern.** A modal suits a create loop but covers the narrative being written against; a side panel keeps context but splits focus; `section.list` is free and consistent but overloads the rail. Prototype at least two.
3. **What is the summary?** The design crux. Probably a type-owned `summary(item, i)` alongside `renderRow` — consistent with how `section.list` already declares `items: () => [{title, meta, icon}]`.
4. **Reuse `section.list`'s vocabulary** so the editor has *one* list concept at two altitudes rather than two unrelated ones.
5. **Does the author lose overview?** Teaching points are often written against each other. Summary rows must not hide what the author is reasoning about — expand-in-place may be needed as a middle state.
6. **Reorder** — do characters, facts and topics need ordering, and does the summary row host it?
7. **Validation surfacing is a correctness requirement.** An error inside a collapsed item must be visible **on the row**, or authors will miss it entirely.

---

### AI-06 · Visually type the inputs — settings vs. AI guidance vs. verbatim text

| | |
|---|---|
| **Area** | Step editor (most acute); editor-wide |
| **Theme** | T3 |
| **Priority** | High |

**Observation.** The editor sets fundamentally different *kinds* of information
through identical-looking inputs. These should be grouped into buckets with
visual styling that tells the author at a glance: *this is a setting* · *this
guides the AI* · *this is verbatim display text*.

**Today.** The register **is already declared — but only in prose, inside helper
text**, in at least four phrasings (*Model-facing* / *Learner-facing* /
*Locked — delivered verbatim* / *Shipped verbatim*). Every field renders as an
identical text field, so the author must read to learn what a field is.

| Register | What it is | Examples |
|---|---|---|
| **Setting** | A configuration value; no prose, no voice | Turn budget · Button into the debrief · Follow-up turns · Chat header name |
| **AI guidance** | Model-facing instruction the learner never sees | Purpose of the step · Purpose of the practice · Exit requirement · *Look for* / *Response* / *Progression* |
| **Verbatim** | Shipped word-for-word to the learner, no model call | Final word · Handoff line · Opener · Required-concept probe · Expert answer |

**Why it matters beyond density: the register determines how you write.**
Verbatim fields carry authoring rules (*"Author it as a statement, never a
question"*); guidance fields are prose about intent; settings are numbers and
labels. Getting the register wrong produces content that is structurally valid
and pedagogically broken — exactly the failure the locked-engine premise exists
to prevent.

**Proposed action.** Make register a **declared property of the field** rather
than a sentence in its helper — a `register` option on `tf()` — with distinct
visual treatment per register, and fields grouped so like sits with like.

**Open questions.**
1. **How many buckets?** Three is the clean read, but **locked engine sections** and **derived read-outs** (ids) are arguably a fourth and fifth state.
2. **Grouping vs. styling, or both?** Grouping is the stronger signal but fights the step editor's deliberate **narrative order** (practice → levels → debrief mirrors the learner's experience). Possible answer: group *within* each narrative block, not across the whole step.
3. **Visual language** must survive dark mode and stay in Vector tokens. A leading rule + icon is safer than tinted field backgrounds.
4. **Does verbatim earn a different input entirely?** It is the one register where what-you-type-is-what-they-read — a quotation frame, or an inline rendered preview, may be warranted (ties to AI-15).
5. **Does styling replace the helper prose?** If legible, *"Model-facing: …"* becomes redundant prefix noise — an opportunity to shorten many helpers.
6. **Can register be derived rather than hand-tagged?** The compiler already knows which text is dynamic vs. locked (the Compiled prompt tab highlights exactly this). Worth checking before tagging 100+ call sites by hand.

---

### AI-07 · Typed containers and real containment hierarchy

| | |
|---|---|
| **Area** | Quality levels (clearest case); editor-wide |
| **Theme** | T3 |
| **Priority** | High |

**Observation.** Answer validity is three buckets — *unthoughtful* / *neutral* /
*strong* — but they are stacked at the same visual hierarchy as the rest of the
form. They should be grouped in a form container, and the form overall needs
hierarchy treatment so containers are handled differently, or at least
hierarchically.

**Today.** The levels *do* use a container — but it is the **same `rowCard`**
used for a canon fact, a character and a misconception. One component serves
three genuinely different jobs:

| Container kind | Example | Cardinality | Add/remove? |
|---|---|---|---|
| **Fixed set** | Quality levels | Exactly 3, engine-owned | **No** — delete deliberately omitted |
| **User list** | Characters, canon facts, misconceptions | Unbounded | Yes |
| **Nested list** | A character's known facts | Unbounded, one level deeper | Yes |

Nothing on screen distinguishes *"these three are the complete set and always
will be"* from *"add as many as you like."* And the three levels are not merely
a set — they are a **scale**, which no visual treatment reflects. At 4–5 fields
per level × 3 levels, that is 12–15 textareas inside a step that already has
~15 fields around them.

**Proposed action.** Two related moves: **type the container** (fixed
engine-owned set vs. user-extensible list vs. nested list should read
distinctly), and **establish a depth scale** so section → group → container →
field is legible.

**Open questions.**
1. **Is the levels group a stack or a comparison?** Authors write *strong*
   partly by contrast with *unthoughtful* — the three are calibrated against one
   another, yet stacked vertically they are never on screen together. A
   **3-column comparison layout** may be the one place horizontal beats
   vertical. Prototype it specifically.
2. **Interaction with AI-05** — if lists collapse to summaries, fixed containers become the main thing still expanded inline. Design the two together.
3. **Interaction with AI-06** — a level card contains guidance fields *and* example fields, so register styling operates *inside* containers. Container tint + field accent + Vector tokens is three signals in a small area; they must compose.
4. **Is a fixed set a list at all?** "Three named variants of one thing" may warrant its own concept (a `variantsBlock`) rather than styling `rowCard` three ways.
5. `progression` appears only on roleplay steps, so the container's field count changes by mode (4 vs. 5). The layout must absorb that without reflowing badly.
6. **Sweep for other fixed sets** masquerading as lists.

---

### AI-08 · Refine step traversal — summary ↔ detail, and add-step in particular

| | |
|---|---|
| **Area** | Interaction → Steps |
| **Theme** | T5 |
| **Priority** | High |

**Observation.** The steps summary holds real value, but the interaction is
clunky. Adding a step **jump-cuts straight into a new nested form** — abrupt.
Perhaps the author sets up how many steps up front and decides where to go
themselves. Each step definitely needs its own surface given how complex they
get, but **traversal between step detail and steps summary needs refinement.**

**Today.**
- **Add is a hard cut.** Adding calls `add()` then **immediately** switches the whole center pane to an empty step form — no pause, no sense of where the step landed in the arc
- **The transition is asymmetric.** Entry is automatic and instant; exit requires finding the crumb (*← All steps*) or reaching the last step's footer
- **Phase navigation ejects silently.** Changing phase nulls the active item with no acknowledgement
- **The rail and the form both hold the list**, but only the rail shows all of it — two renderings competing for one job

**Supporting evidence for "set up steps up front":** the `.pptx` brief importer
already parses a mode-prefixed **step outline** from the deck's STEP slides — so
on the import path the arc's shape is known before any step is written. An
"outline first, fill later" model matches how these are actually authored.

**Proposed action.** Make the **arc view** a real destination, with adding a step
being an act *on the arc* rather than a teleport away from it. Options to
prototype: add-in-place (empty card appears, author chooses when to open);
outline mode (name/mode all steps, then fill); soft entry (arc stays visible
alongside the step).

**Open questions.**
1. **Where does the arc live — rail, center, or both?** Today it is both, badly. Pick one as canonical.
2. **Is step count knowable up front?** True for the import path, less so from scratch. Does outline mode need to be optional?
3. **What does the arc view show per step?** Name, mode, turn budget, lint state — and possibly **carryover dependencies**, since steps reference each other and no current surface shows that graph.
4. **Reorder** currently lives only in the rail; `move` already returns a cost string (broken carryovers) that needs a good home.
5. **Should leaving a step be explicit?** Silent ejection on phase change breaks the sense of place.
6. **Do characters get the same traversal model** if AI-05 gives them a panel? Two list-of-complex-things with two different models would be inconsistent.

**Note.** The step detail inherits **AI-05** (its own nested lists) and **AI-07**
(the quality levels). **The step editor is where AI-05, AI-06, AI-07, AI-08 and
AI-09 all converge — it is the right prototype surface for the whole programme.**

---

### AI-09 · Depth, width and grouping — show where concepts begin and end

| | |
|---|---|
| **Area** | Step form; applies form-wide |
| **Theme** | T3 |
| **Priority** | Medium |

**Observation.** The step form displays everything full width, **including the
outlined containers**. Visual grouping would help the author understand where
concepts start and end.

**Today, from the stylesheet:**

| | A section card | An item card inside a list |
|---|---|---|
| Width | full | **full** |
| Background | same token | same token |
| Border | same token | same token |
| Indentation | none | **none** |

A nested item is nearly indistinguishable from the section containing it, so a
container's edges read as page-wide rules rather than a boundary around a
concept. Meanwhile **prose is already disciplined** — a `62ch` measure is
applied in a dozen places to headers, leads and helper text. The *text* has a
hierarchy the *structure* does not.

The team hit this once already and fixed it locally: nested sub-rows had their
border stripped because *"a card inside a card reads as a peer of its parent,
which is the opposite of what nesting means here."* Correct fix, applied at one
depth — not a system.

**Proposed action.** Establish a **depth system** — containers narrow, indent or
shift ground as they nest — so depth is readable without reading. Candidates:
progressive indentation with a left rule; ground-shift instead of repeated
borders; width reduction by depth.

**Open questions.**
1. **How many depths must it survive?** Characters reach four. A two-level system will not hold.
2. **Indent vs. inset vs. ground-shift at depth 4?** Indentation compounds and eats width; ground-shift does not compound but has fewer usable steps before contrast fails. Likely a hybrid.
3. **Should inputs be narrower than the column?** A one-line setting at full width reads as more important than it is — **field width may be a free register signal** (ties to AI-06).
4. **Both Inspector states** (expanded and collapsed) change the column width; the system must work at both.
5. **Dark mode** is gated but present. Note that Lumo `--lumo-contrast-Npct` tokens are **translucent overlays, not opaque greys** — they stack unpredictably when nested, which is exactly what a depth system does. Prefer solid values.
6. **Check the Vector themes reference for an existing nested-containment precedent** before inventing a bespoke scale.

---

### AI-10 · Coach persona belongs with Situation & World

| | |
|---|---|
| **Area** | Voice & Tone → Coach voice |
| **Theme** | T4 |
| **Priority** | Medium (cheap to change, clear rationale) |

**Observation.** Coach persona feels out of place — it should be authored
alongside Situation & World and the characters. Is there anything in Teaching or
Interaction with implications for the coach that would justify authoring it
after?

**Answer: no.** Verified three ways:

| Check | Finding |
|---|---|
| Does anything downstream write to it? | **No.** Coach persona and tone rules have exactly one consumer — the runtime reads them into a flat persona/guidance pair |
| Do steps or teaching derive from it? | **No.** The flow is one-way: voice flows *into* every debrief; nothing flows back |
| What does the AI wizard do? | Authors coach voice in **task 1**, bundled with title and narrative — **before** world, steps and teaching |

The wizard's task order is the strongest signal available, because it is the one
ordering in the system that was *forced* by real cross-field rules and
documented as such. It puts coach voice first; the editor's rail puts it fourth.

**A further argument:** the coach is arguably **a character in the world** — the
one the learner actually talks to. The characters list declares everyone *else*
who can appear in a scene, while the coach is authored three phases away under a
different heading.

**Proposed action.** Move the voice section into the Situation & World group. In
the current architecture this is a one-word `group` change; the Voice & Tone
phase then disappears automatically, since no section would declare that group.

**Open questions.**
1. **Move it, or move and merge it?** Presenting the coach *as* a cast member is the stronger version but changes how the characters list reads.
2. **The Voice & Tone phase disappears entirely** — with AI-04 that takes the rail from six phases to four. Confirm that is the intended shape.
3. **Is tone-rules the same altitude as persona?** One line of identity vs. an unbounded list of constraints. The list is another AI-05 instance.
4. **Counter-argument worth testing with LXDs:** writing the coach's voice *after* seeing the arc might produce a better-calibrated voice even though no field depends on it. The wizard optimizes for generation dependencies, not human ergonomics. Ask the team directly.
5. The section's guidance warns *"Universal coaching behavior is template-owned — do not re-author it here."* That caution matters **more** if the coach sits beside freely-authored characters.

---

### AI-11 · Debrief & Close — stored, reviewable items instead of inline fields

| | |
|---|---|
| **Area** | Debrief & Close → Expert answer |
| **Theme** | T2 · T7 |
| **Priority** | High |

**Observation.** Same loop workflow applies. Displaying several multi-input
containers of **different types** (groups, references) would be more legible and
reviewable as **stored items** rather than inline editable fields.

**Today — the densest section in the editor.** The code's own comment records
the scale: **37 component groups across the production documents, carrying 98
components total**, all rendered inline and expanded in one scroll.

Two container kinds sit adjacent, rendered identically:

| | Component group | Source reference |
|---|---|---|
| Shape | Title + **nested list** of components | A single line of text |
| Nesting | 2 levels | 1 level |
| Content | Authored prose — the expert answer | A citation (*Title VII*, *29 CFR 1910.1200*) |
| Rendered as | the same card | the same card |

A one-line citation gets the same full-width bordered card as a multi-part
group — the AI-07 problem in its clearest form.

**"Reviewable" is the key framing.** The expert answer is described as
*audit-defensible* and *shipped verbatim to every learner on every path*. It is
the artifact most likely to be reviewed by someone other than the author.

**Proposed action.** Apply the AI-05 pattern with the AI-07 type distinction —
component groups become summary rows opening to a panel (and likely a **read
view**); source references stop being cards entirely and become a compact list
or chip row.

**Open questions.**
1. **Is there a review mode?** This section argues for a **read-only rendering of the expert answer as a learner or auditor would see it** — arguably more valuable here than better editing. See T7.
2. **Should references be a different control?** A closed-ish vocabulary of external authorities, already guarded by a lint (*never an internal course id*) — a chip input or a picker over known standards fits better than free-text cards.
3. **Grouping is meaningful, not decorative** — *"grouped as the source material groups it."* Any summary must preserve the visible group → component relationship.
4. **Step debriefs carry their own key-point lists** — same pattern, different surface. Confirms AI-05 is editor-wide.
5. The `.pptx` importer already parses component groups and the summary deterministically, reinforcing that the primary interaction here is **review and refine**, not create-from-blank.

---

### AI-12 · Demote the Compiled prompt tab

| | |
|---|---|
| **Area** | Inspector |
| **Theme** | T6 |
| **Priority** | Low effort, clear win |

**Observation.** The compiled prompt can be buried if needed — it will be a very
niche, targeted tool with low usage.

**Today.** It is the **first tab and the default open pane**, so it is what
every author sees on load. Its own legend undercuts it: *"this is the prompt
**the preview** runs on… production builds its own from the same fields, so read
this to learn what your guidance turns into, **not as the exact text that
ships**."* A learning/debugging aid holding the most valuable position.

**Proposed action.** Make **Validation** the default tab; demote Compiled prompt
to last position or behind a disclosure. Same treatment for Say/Do Split
(see AI-15).

---

### AI-13 · Validation should be persistent and always accessible

| | |
|---|---|
| **Area** | Inspector → Validation |
| **Theme** | T6 |
| **Priority** | High |

**Observation.** Validation is core — it keeps the author from becoming
frustrated tracking down anything preventing them from moving forward. It should
be a **persistent, accessible feature for regular check-ins.**

**What already works and should be preserved:** per-section dots, per-item dots
on step rail entries, phase-aggregate dots, severity ranking, and deep links
that open the **exact step** an error belongs to. The data model is solid.

**What does not:** it lives in a tab competing with two other tools, inside a
panel the author can collapse entirely — and the collapse state persists across
sessions. An author who hides the Inspector loses the list of what is wrong
**permanently and silently**; only the rail dots remain.

**Proposed action.** Give validation a persistent home independent of the
Inspector's tab strip — an always-visible status affordance (count + worst
severity) that expands to the full list and survives Inspector collapse.

**Open questions.**
1. **Where does it live when the Inspector collapses?** The publish strip already tracks the blocking count and may be the natural home.
2. Does it need to exist in two places (persistent summary + full list), and does that duplicate confusingly?

---

### AI-14 · Reaching a valid state must be felt — permanent affordance and temporary acknowledgement

| | |
|---|---|
| **Area** | Validation, rail, phases, list items |
| **Theme** | T5 |
| **Priority** | **High — the most substantive UX gap found** |

**Observation.** Reaching a validated state could have a more noticeable state
change, **both temporary and permanent**:

- **Permanent** — a better affordance that a section or grouping has reached a valid state
- **Temporary** — a more attention-grabbing element updating the UI, the counters, the newly-valid state, and the reduced gaps left to correct

**The core finding: the editor cannot currently celebrate anything, by
construction.** The lint pass recomputes the full result from scratch on every
change and diffs against nothing. It knows *"0 errors"* but never *"you just
went from 3 to 0."* With no before-state, there is no moment to mark.

| | Today | Gap |
|---|---|---|
| **Valid section** | A small check-glyph dot, same size and position as the error dot | Valid and invalid differ only by glyph and colour — no felt difference |
| **All valid** | A static pill (*"All checks pass"*) — **visible only if the panel is open on that tab** | The most important state in the tool is the easiest to never see |
| **Progress** | None | No sense of *"4 left"* → *"1 left"*; no trajectory |
| **Transition** | None | The moment of becoming valid passes unmarked |

**Proposed action.** Make lint state **stateful** — retain the previous result,
diff it, and drive two treatments: a genuinely distinct **complete** treatment
on sections, phases and list items (not a recoloured dot — valid should read as
*finished* at a glance from the rail), and an **animated acknowledgement** on
transition, strongest at the last error resolved, when the scenario becomes
publishable.

**Open questions.**
1. **What granularity earns a moment?** Every lint cleared risks noise. Probably: quiet counter animation always, a real moment at section/phase clear, a distinct one at fully valid.
2. **Does "gaps left to correct" need a progress model?** Error count moves *up* as well as down (adding a step adds errors), so a progress bar could read as going backwards. *"4 things left"* may be better than percent-complete.
3. **Warnings vs. errors.** Zero errors = publishable; zero errors + zero warnings = clean. Two states — does celebrating the first undercut the second?
4. **Where does the moment appear** if the author is deep in a step and the cleared section is elsewhere? Toasts exist but already carry list-edit costs.
5. **Restraint.** These are professionals in long sessions. Celebration should scale with significance — the last-error moment can be substantial precisely because everything below it is subtle.
6. **Does the publish strip become the permanent readiness affordance?** Ties to AI-13.

---

### AI-15 · Say/Do Split is a player rendering concern, not an authoring one

| | |
|---|---|
| **Area** | Inspector → Say/Do Split |
| **Theme** | T6 |
| **Priority** | Medium — scope correction |

**Observation.** Interesting, but if this use case is not solved by a
**surface-level real-time preview where the author can "execute" a section of
the scenario against their set form fields**, then it belongs as a direct AI
test rather than something inside the scenario. Enter a string, see how it will
be displayed. **This is not a scenario setting — it is a media player rendering
issue.**

**Fully confirmed.** The module's own docblock: *"for **DISPLAY only**. The raw
text always still goes to the reaction model verbatim; this never rewrites
intent, only how the move is shown."* The tab reads **zero scenario fields** —
its only inputs are a free-text box and the worker URL. Every other Inspector
tab is a view of the document being authored; this one is unrelated to it. No
authored field tunes the split, so there is no authoring decision to inform.

**Proposed action.** Remove it from the authoring Inspector. Two homes matching
the two halves of the observation: if the need is *"will my scene text render
correctly?"*, answer it with a **real preview against actual fields**; if the
need is *"how does the splitter behave on arbitrary input?"*, that is a
**standalone dev/QA tool** outside the editor.

**The larger idea — surface-level real-time preview — is the more valuable
half.** An author executing a *section* of their scenario against their own
authored fields, in place, would subsume both this tab and much of Playtest, and
answers a question the editor cannot currently answer: *what does what I just
wrote actually look like to a learner?*

**Open questions.**
1. **Does it replace or complement Playtest?** Playtest is *run the scenario*; section preview is *render this one thing I am editing, now* — lighter, faster, more continuous, closer to authoring than testing.
2. **What granularity is "a section"?** A step is the natural unit. A single **verbatim field** may be better still — those ship literally, so rendering them is pure value with no model call.
3. **Inline vs. inspector?** A verbatim field could render its preview **beside the field** — ties directly to AI-06.
4. **Confirm with the dev team before deleting** rather than relocating; the splitter is shared with the live player and someone may be using this to debug real rendering.
5. **Inspector shape after AI-12 + AI-15:** Validation + Playtest/Preview — a much clearer statement of what the panel is for: *is it correct*, and *what does it look like*.

---

## 4. Suggested sequencing for the prototype

Not a commitment — a starting proposal for the separate prototype instance.

**Prototype surface: the step editor.** AI-05, AI-06, AI-07, AI-08 and AI-09 all
converge there, at maximum depth and density. Solving it once yields the
patterns for every other section.

| Wave | Items | Rationale |
|---|---|---|
| **1 — Design system** | AI-06 · AI-07 · AI-09 | Field register, container kind and nesting depth are **three signals that must compose in the same small area**. Design them as one visual language, not three fixes. |
| **2 — The loop pattern** | AI-05 · AI-11 | One primitive, every section. Depends on Wave 1 for how a summary row and its surface should look. |
| **3 — Structure & flow** | AI-04 · AI-10 · AI-01 · AI-02 · AI-03 | Phase reduction (six → four) and the document-level settings surface. Largely independent of Waves 1–2; can run in parallel. |
| **4 — Feedback & traversal** | AI-08 · AI-13 · AI-14 | Needs the summary/arc views from Wave 2 to have somewhere to put state. |
| **5 — Inspector scope** | AI-12 · AI-15 | Low effort; AI-15's *section preview* idea may grow into its own piece of work. |

**Decide before Wave 1:**
- Is there a **document-level settings surface**? (AI-04 Q1) — shapes AI-01/02/03
- Is the levels group a **stack or a comparison**? (AI-07 Q1) — shapes the step layout
- **Modal, panel, or rail/focus** for loop authoring? (AI-05 Q2) — shapes everything in Wave 2

**Worth asking the LXD team directly:**
- Does anyone customize the landing button label? (AI-03)
- Would authoring coach voice *early* feel right, or is late deliberate? (AI-10 Q4)
- Is anyone relying on the Say/Do Split tab? (AI-15 Q4)

---

## 5. Constraints for the build

- **`products/aithera/` is off limits.** Reference only — never edited, never committed against. Not owned by this team.
- **Build in a separate prototype instance**, scaffolded per this repo's conventions (versioned feature folder, `ver1/index.html`, catalog entry).
- **Vector Web Components** throughout — verify every tag, prop and token against the CONTEXT.md for the version in use. Never from memory.
- **Vanilla HTML/CSS/JS.** No frameworks, no build tools.
