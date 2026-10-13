# Universal Form Builder: discovery

**Status:** Discovery, round 1 (Evaluations, Check It and EHS reviewed) · **Started:** 2026-10-13

## Why this exists

Several Vector products each build their own form, checklist or question editor. The goal is to design **one shared form *authoring* workflow** that several products can adopt, and that handles everything those products can do today.

**Scope:**
- **In scope (shared):** authoring a form. This covers creating it, adding and configuring questions, structure, reuse, rules, validation, preview, and versioning/publishing. The authoring workflow **outputs a versioned form definition**.
- **Out of scope (product-owned):** how a form is **displayed or delivered** to the people who fill it in. Each product reads the definition and renders it in its own way: Evaluations as a living evaluation document or an event request with approvals, Check It as a gated inspection run tied to an asset. Each product also owns workflow, records, assignment and scheduling.

**The contract between the two is the form definition.** The authoring workflow must capture everything each product's delivery needs, but it does not decide how that delivery looks or behaves.

This folder holds:

- an inventory of each product's current authoring needs
- a draft list of requirements for the shared authoring workflow
- a proposed architecture for the authoring workflow and its output contract

Each product would use the shared authoring workflow for:

| Product | Builder would power | Reviewed in |
|---|---|---|
| **Evaluations** | Evaluation forms (rubric observations, walk-throughs, self-assessments), PD event request forms (Custom Questions), feedback forms | [01-evaluations-analysis.md](01-evaluations-analysis.md) |
| **Check It** | Checklist Management: content blocks, checklists, deployments | [02-check-it-analysis.md](02-check-it-analysis.md) |
| **EHS** | JSA, Initial Incident, Corrective Action and Observation forms, and their admin custom fields and checklist templates | [04-ehs-analysis.md](04-ehs-analysis.md) |

The cross-product synthesis, the draft requirements and the architecture are in **[03-synthesis-and-requirements.md](03-synthesis-and-requirements.md)**.

## Read this first

1. **No reviewed product has a builder designed for its own use case, except Check It.**
   - Evaluations' evaluation form is a *fill-out* (runtime) mock. The question types are real, but the authoring UI has never been designed.
   - Event forms show four placeholder Custom Question types and explicitly do not propose a design for authoring them.
   - Check It is the only product with a designed builder: Checklist Management `ver1`, plus the older `sandbox` prototype.

   - EHS has production admin custom fields (10 types) inserted among fixed system fields, but no builder design was reviewed.

   So Check It's authoring patterns are the main input for builder UX. Evaluations and EHS are the main inputs for **question-type breadth**. EHS adds **relationships between forms**: template-first creation, parent → child inheritance, and forms that spawn forms.
2. **The two products deliver forms very differently, so delivery stays with each product.**
   - Evaluations: a form is a living document with no submit, multiple signers, sharing and an audit log.
   - Check It: a run is a gated submit-and-sign record bound to a physical asset, with failure consequences such as out-of-service status, tickets and notifications.

   The shared authoring workflow doesn't try to reconcile these. It produces a definition rich enough for both: required fields, fail rules, rules that require extra information, signer slots, and per-asset questions. Each product interprets that definition. The runtime behaviour reviewed in 01 and 02 is recorded as **what the definition must express**, not as something to build. See 03 §4.
3. **Keep one type vocabulary.** The Check It sandbox had 5 authoring types and 14 runtime kinds, joined by a lossy mapping. Editing a step quietly turned it into a different type. The universal builder must use one type list across authoring, runtime and reporting.

## Scope and method

- These products were reviewed **read-only**. Nothing in `products/Evaluations/` or `products/check-it/` was changed.
- Every claim cites a source file and line so it can be checked. Line numbers are as of 2026-10-13, and the source mocks are still changing.
- Check It's `_planning/` docs (design brief, open questions, build status) are **git-ignored and local-only**. Teammates who clone the repo won't have them. Findings drawn from them are summarised here so the content isn't lost.

## Sources reviewed

**Evaluations**
- `evaluation-form/` ver1 and ver2, mock-definition.md, mock-definition-a11y.md, DEV-NOTES.md, DESIGN-SYSTEM-GAPS.md, component-assessment.md
- `event-forms/index.html` and `index-v2.html`, UPDATE-LOG.md, and the open-questions CSV
- `course-recs/`, which holds a copy of the question showcase and the legacy value maps in `_planning/`
- `admin-ui/`, `manage-activities/`, `manage-events/`, `evaluation-users/`, `reports/`, STATUS.md

**EHS**
- Andy Xia's Claude Doc *EHS Form Inventory for Universal Form Builder Analysis* (2026-10-13), drawn from screenshots of the production desktop forms and the mobile JSA prototype. No EHS repo files were reviewed.

**Check It**
- `Checklist-management/ver1` and `_planning/*`
- `sandbox/` (checklist-builder, block-creator, ceremony-fire-rig-check, the store/compile/seed JS, GAP-REPORT)
- A brief look at `Controlled-substances/` and `Requisition-workflow/`

## Next steps

- [ ] Review this round with the Evaluations, Check It and EHS product owners. Work through the open questions in 03 §7.
- [ ] Get the definitions of the legacy Evaluations "8-type" Program Group question system, plus **Third-party Text Entry** and **Video Tag**. None of the reviewed files define them.
- [ ] Decide which candidate products to review next. Any other product with forms, surveys, inspections or intake should be considered.
- [ ] Confirm the canonical type list and the core vs. extension split (03 §2, §5).
- [ ] Decide how authoring preview works: a generic reference preview, or a preview supplied by each product (03 §7, Q1).
- [ ] Mock the authoring workflow (palette, canvas, inspector, preview, publish) as `ver1` in this folder, using Check It CM `ver1` as the starting point for its patterns.
