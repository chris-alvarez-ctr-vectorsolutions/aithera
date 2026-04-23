# Learning Studio — Phase 2 Strategy Summary

> **Document Purpose:** This document synthesizes the Phase 2 planning documentation, design decisions, and working prototype into a unified strategy reference. It is intended to inform the next phase of Learning Studio development by identifying what has been designed, what is prototype-ready, what requires deeper design work, and what is deferred to engineering decisions.

---

## 1. Overview

Phase 2 transforms the Learning Studio from a scene-based editing tool into a **structured, scalable content production system**. The foundational architecture has been defined and a working UX prototype exists. The next development phase should be scoped with a clear-eyed view of what is ready, what is a placeholder, and what remains theoretical.

The prototype (objectManager.html) represents a meaningful UX foundation but is not uniformly production-ready across all systems. Several areas require deeper design iteration before engineering handoff. Others are intentionally deferred to engineering, where the UX intent is documented but the implementation model is TBD.

---

## 2. Architecture Decisions — Confirmed & Stable

These decisions are locked and reflected consistently in both the planning documents and the prototype.

### 2.1 Unified Content Model
All content types — Scenes, Knowledge Check questions, Assessment questions, and Citations — exist as first-class items within a single Learning Object. There is no mode-switching between a "scene editor" and a "question editor." The sidebar organizes content by type; the main panel reflects the selected item.

**Status:** ✅ Confirmed in prototype. Sidebar structure and panel switching are implemented.

### 2.2 Two-View Authoring Model
The studio exposes two views of a Learning Object:
- **Author View** — item-level editing (the primary working state)
- **Map View / Flow Map** — structural visualization of the LO as a whole

Map View is a top-level LO view, not a tool or overlay. It is accessed via a dedicated header action ("Open Flow Map"), which correctly elevates it as a peer to Author View.

**Status:** ✅ Header action confirmed in prototype. Map View itself is not yet designed — see Section 4.

### 2.3 Ownership Model
Ownership exists **only at the Learning Object level**. Scene-level and question-level sharing are explicitly excluded. This simplification reduces system complexity and prevents inconsistent behavior.

The prototype implements the **Customize Content** flow — an action that severs a derived LO from its Vector-published source and creates an independently editable copy. The modal correctly communicates the permanence of this action.

**Status:** ✅ Confirmed and implemented in prototype.

### 2.4 Header Architecture
The header is organized into four distinct zones:
- **Context** — LO title, breadcrumb navigation
- **View Switching** — Author / Map toggle
- **Workspace Utilities** — Search, Save state, Comments
- **Lifecycle Actions** — Finalize, Publish (via overflow for destructive/infrequent actions)

**Status:** ✅ Confirmed in prototype. Header anatomy reflects the defined model.

### 2.5 Scene-Level Timeline
The timeline is scoped to individual scenes, not the LO globally. It supports audio, background media, captions, and template tracks. Scene boundaries are strict — no cross-scene timing or blending.

**Status:** ✅ Confirmed in prototype.

### 2.6 Action Distribution Model
Actions are distributed by frequency and context:
- **Workspace-level** — editing, preview, scene-level regeneration
- **Header** — Finalize, Publish
- **Overflow** — Delete, Regenerate LO, Duplicate, Customize Content

**Status:** ✅ Confirmed in prototype. "Regenerate Learning Object" and "Open Flow Map" are correctly placed as header-level actions.

### 2.7 Save + Comment System
Autosave with visible state is implemented. Comments are a workspace utility — a toggleable panel, not embedded in content state. The comment system supports threaded discussions scoped at Course, LO, and Scene levels with Open/Resolved states.

**Status:** ✅ Confirmed in prototype. Comment system is well-developed and multi-user ready.

---

## 3. Systems Requiring Deeper Design Work

The following systems are present in the prototype but represent **baseline or AI-generated solutions** that do not yet meet Phase 2 quality standards. These are flagged as UX design concerns. They are not currently tied to active feature priority requests, but they represent a ceiling on content quality and authoring experience that should be addressed before or alongside any broader rollout.

### 3.1 Question System (Knowledge Checks + Assessments)
The prototype includes a working question editor supporting Multiple Choice, True/False, and Fill in Blank types. Workflow states (In Progress → In Review → Marked as Ready → Complete) are present. Answer options, feedback fields, and point values are accessible.

**Concern:** This is a baseline implementation. The question system as designed does not reflect the depth expected for Phase 2:
- Question card anatomy has not been fully defined
- The relationship between Knowledge Check questions and Assessment questions — and how they differ in behavior, states, and permissions — is not yet modeled
- Integration with the Search → Remediation workflow is not represented
- Question-level state management (how question states interact with LO-level states) is undefined in the UX

This is an area where the prototype provides scaffolding, but the design intent is incomplete.

### 3.2 Citation System
The prototype includes a citation editor supporting Journal Article, Book, Website, and Other types with APA formatting. This was not part of the original Phase 2 planning documents and appears to have been introduced as part of the prototype generation.

**Concern:** The citation system exists as a functional UI element but has no documented design rationale, integration model with scenes/questions, or defined relationship to content output. Its role in the LO authoring workflow — when citations are added, how they surface in rendered output, how they interact with AI-generated content — is undefined. This needs a design pass before it can be considered Phase 2 standard.

### 3.3 Template System
The prototype reflects generic template types (Text Overlay, Lower Third) with basic property controls for position, color, and transitions.

**Concern:** This is a significant area of risk. The current template system in the prototype does **not** reflect the actual available template library, nor does it account for any planned enhancements to the template system. Templates are a primary lever for visual and instructional quality in AI-assisted content generation. Without a template system that reflects real production options and design constraints, the quality ceiling on Phase 2 content output remains tied to the limitations of the current (Phase 1) template set. This should be treated as a blocking concern for any quality claims made about Phase 2 output.

---

## 4. Systems That Are Theoretical — No UX Solution Yet

These systems have been conceptually defined and have clear design intent, but no prototype solution exists. They require dedicated design work before engineering scope can be determined.

### 4.1 Map View / Flow Map
**Intent:** A top-level LO view that visualizes the structural relationships between all content items (scenes, questions, scenario nodes). It is the foundation for future scenario-based and branching learning content. It is accessed as a peer view to Author View, not as an overlay.

**Current state:** The "Open Flow Map" button exists in the header. No Map View has been designed or prototyped. A visual/canvas/whiteboarding-style linking interface has been explored as a possible direction, but no formal interaction model, node types, relationship rules, or lifecycle behavior has been defined.

**What needs to be designed:** Node anatomy, relationship types, read vs. edit behavior in Map View, how Map View state interacts with Author View state, and the transition model between views.

### 4.2 Search → Remediation Workflow
**Intent:** AI-powered search across transcript, media, and questions that creates a **trackable work queue** — not just a result list. Search results carry states (Unreviewed → Reviewed → Updated), and the working set drives a banner-based context layer across the authoring UI. This enables bulk content governance at scale (e.g., policy updates, brand changes, compliance sweeps).

**Current state:** Search is present in the prototype with a result count and basic filtering. The work queue, result states, and banner-driven context system are not implemented. The design intent is well-documented in the planning materials.

**What needs to be designed:** UX for result state transitions, banner behavior and dismissal, cross-content application model (how a remediation session spans multiple scenes/questions), and integration with workflow states.

---

## 5. Engineering-Driven Systems — UX Intent Documented

These systems are primarily shaped by engineering decisions. The UX intent is captured here to provide context for implementation, but the specific models and state machines will be determined during engineering design.

### 5.1 State Management System
The studio requires a **multi-layer state model** that separates distinct types of system state. These must not be conflated, as doing so causes user confusion around editing permissions and system behavior.

**The layers are:**

| Layer | States | Scope |
|---|---|---|
| Workflow State | Not Started, In Progress, Needs Review, Ready, Outdated | Item-level (scenes, questions) |
| Pipeline State | Rendering, Finalizing, Publishing | LO-level and item-level |
| Lock / Editability State | Editable, Locked (rendering), Locked (finalized) | Item-level |
| Ownership State | Local, Shared (read-only), Derived (customizable) | LO-level only |
| Impact State | Used in X courses | LO-level |
| Remediation State | Unreviewed, Reviewed, Updated | Item-level (search context only) |

**UX requirements from these states:**
- Users must always understand *why* something is locked or uneditable — the system should surface the responsible state, not just a generic lock indicator
- Ownership state must be visible near the LO title, not buried in settings
- Pipeline states should be transient and non-blocking where possible — background generation should not halt editing of unrelated content
- Workflow states should be user-settable; pipeline and lock states are system-controlled

### 5.2 LO Lifecycle Management
**Intent:** Learning Objects move through a defined lifecycle that governs what actions are available and how the LO is distributed.

**The stages are:** Draft → Finalized → Published → (Outdated, if superseded)

**UX requirements:**
- Lifecycle stage must be visible in the header without requiring a click
- Finalize and Publish are distinct actions with distinct consequences — Finalize locks the LO for production; Publish distributes it to courses
- An Outdated LO that is in active use in courses must surface this clearly, with a path to either update or fork
- The Customize Content flow is the user-facing expression of ownership state change at lifecycle — it must make the permanence of that action legible (currently implemented correctly in the prototype)

---

## 6. Summary: Readiness by System

| System | Status | Notes |
|---|---|---|
| Unified Content Model | ✅ Ready | Implemented in prototype |
| Author View / Panel Architecture | ✅ Ready | Implemented in prototype |
| Scene System | ✅ Ready | Timeline, media, templates functional |
| Comment System | ✅ Ready | Threaded, multi-scoped, well-developed |
| Ownership / Customize Flow | ✅ Ready | Correctly modeled and implemented |
| Audio Generation | ✅ Ready | Single + per-scene voice, phonetic text |
| Media System (AI / Upload / Stock) | ✅ Ready | All three pathways implemented |
| Header Architecture | ✅ Ready | Matches defined model |
| Action Distribution | ✅ Ready | Matches defined model |
| Question System | ⚠️ Needs Design | Baseline only — states, card anatomy, LO integration incomplete |
| Citation System | ⚠️ Needs Design | Undocumented rationale, no integration model |
| Template System | ⚠️ Blocking Concern | Does not reflect real template library — limits content quality ceiling |
| Map View / Flow Map | 🔲 Theoretical | Button exists; no UX solution |
| Search → Remediation | 🔲 Theoretical | Design intent strong; no prototype implementation |
| State Management | 🔲 Engineering-driven | UX intent documented; implementation TBD |
| LO Lifecycle | 🔲 Engineering-driven | UX intent documented; implementation TBD |

---

## 7. Recommended Focus for Next Phase

Based on the current state of the prototype and the feature priority context, the following framing is recommended for the next development phase:

**Resolve before scaling production use:**
- Template System — the gap between prototype templates and real production templates is a quality risk that compounds with every piece of AI-generated content produced

**Design sprints needed (not current priority requests, but noted as future debt):**
- Question System depth — card anatomy, state integration, Knowledge Check vs. Assessment differentiation
- Citation System — rationale, integration, output model

**Engineering design required (UX intent provided above):**
- State Management System
- LO Lifecycle Management

**Next major UX design effort:**
- Map View / Flow Map — required before scenario-based learning work can begin
- Search → Remediation workflow — well-defined conceptually; ready to move into UX design

---

*Last updated: April 2026*
*Source references: Phase 2 Planning Status, Phase 2 Capabilities Summary, objectManager.html prototype*
