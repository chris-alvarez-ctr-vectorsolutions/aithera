# Form Builder: discovery

**Status:** Discovery v1.1 — ready for review · **Started:** 2026-10-13 · **Updated:** 2026-10-14
**Internal project name:** Form Builder. There is no user-facing name: users see "Create checklist", "Edit evaluation form" and so on, in their own product's terms.

## What this is

Several Vector products each build their own form, checklist or question editor. This project designs **one shared form-authoring experience** that:

1. **does what each product already does, in a better way**, and
2. **brings every product the capabilities proven in the others.**

**Scope**
- **Shared (the Form Builder):** authoring. That means creating a form; building it from question mechanisms, sections and reusable blocks; rules; preview; review; and publishing a **versioned form definition**.
- **Product-owned:** **assignment, deployment and scheduling** (decided for now), and **delivery**: completing, signing, reviewing, follow-up, records and reporting.
- **The connection:** products plug their own systems (tags, statuses, codes, org data…) into the Form Builder through **extensions**, and consume the published definition.

## Reading order

| # | Document | What it covers |
|---|---|---|
| — | **[Form Journey Maps](journey-maps/index.html)** (page) | Each product's full form workflow in 9 stages, showing where the Form Builder takes over, where the product keeps ownership, and how sure we are of each claim. **Start here.** |
| 03 | **[Working model, requirements & architecture](03-synthesis-and-requirements.md)** | Decisions so far, the value story, the authoring workflow, mechanisms, extensions, setup and structure, draft requirements, the definition schema |
| 06 | **[Shared core vs. product](06-shared-vs-product.md)** | The four layers (core, profile, extensions, product-owned), how to decide where something belongs, and worked examples incl. TargetSolutions Tags and JAC codes |
| — | **[Question Mechanisms](question-mechanisms/index.html)** (page) | The 15 mechanisms, each with its product versions, a live reference preview and its customization dimensions |
| 07 | **[Check It iteration 1: technical brief](07-check-it-technical-brief.md)** | For the Check It technical owner: the decisions that avoid a refactor when Evaluations adopts, where Check It's features go, traps, questions |
| 05 | **[Code-dive brief](05-code-dive-brief.md)** | What engineering needs to confirm in each product's code |
| 01 | [Evaluations analysis](01-evaluations-analysis.md) | Evaluation forms, PD event forms, and **EV+ authoring confirmed against code** (§1a) |
| 02 | [Check It analysis](02-check-it-analysis.md) | Checklist Management and the sandbox prototype |
| 04 | [EHS analysis](04-ehs-analysis.md) | Incident, Corrective Action, Observation and JSA forms |

## Key points

1. **Each product built one part of authoring well, and no product has all of it.** Check It has versioning and reusable blocks. Evaluations has the richest question types, scale presets and per-question roles. EHS has relationships between forms and system + custom fields. Nobody has live preview, review or testing.
2. **Questions come from about a dozen core mechanisms** (Scale, Choice, Text, Measure, Date & time, Lookup, Location, Evidence, Script, Attest, Calculate, plus Repeat, Nested and Timer for structure). Each product customizes them with **presets**.
3. **Products don't share their systems; they plug them in.** Tags, applies-to statuses, JAC codes, org hierarchy, rule outcomes and publish impact are all **product extensions**. EV's TargetSolutions Tags already work this way in production (06).
4. **The Form Builder's job ends at Publish.** Products receive a form ID + version + kind and handle assignment and delivery. The Form Builder still asks each product "what uses this version?" so authors see the impact before publishing.

## Evidence and confidence

- **Code-confirmed:** EV+ form and question settings, subtypes and lifecycle, from two product documents reconciled against the TeachPoint form engine ([`product-documentation/`](product-documentation/)).
- **Seen in product:** EV+ admin screenshots; EHS production forms (via Andy Xia's [form inventory](https://claude.ai/artifact/38tfiVgJ12bmwkGXTi2YnN)).
- **Seen in design:** mocks and prototypes in this repo (Evaluations evaluation and event forms, Check It Checklist Management and sandbox, the EHS mobile JSA).
- **Inferred:** from navigation, data maps and naming. Mostly Evaluations plan assignment and EHS admin configuration.

Everything inferred is listed in the [code-dive brief](05-code-dive-brief.md). Product folders were reviewed **read-only**. Check It's `_planning/` docs are git-ignored and local-only, so their findings are summarised in 02.

## Sources reviewed

**Evaluations:** `evaluation-form/` (ver1, ver2 and handoff docs), `event-forms/` (both versions, UPDATE-LOG, open-questions CSV), `course-recs/` (incl. legacy value maps), `admin-ui/`, `manage-activities/`, `manage-events/`, `evaluation-users/`, `reports/`. Plus EV+ admin screenshots (form setup, Add/Edit Question, subtypes, scale presets) and the product documents *Evaluation Form Redesign (Backend Preferences)* and *Question Subtype Definitions* in [`product-documentation/`](product-documentation/).
**Check It:** `Checklist-management/ver1` and `_planning/*`; `sandbox/`; a brief look at `Controlled-substances/` and `Requisition-workflow/`.
**EHS:** Andy Xia's Claude Doc *EHS Form Inventory for Universal Form Builder Analysis* (production screenshots + JSA mobile prototype).

## Next steps

- [ ] Review the journey maps, 03 and the mechanisms page with Evaluations, Check It and EHS product owners.
- [ ] Run the code dive for Check It and EHS, and finish the open Evaluations items ([05](05-code-dive-brief.md)).
- [ ] Decide the open questions in 03 §10, starting with form setup and structure (Kind vs. Template).
- [ ] Define the Form Builder experience stage by stage, starting with the library and form creation.
- [ ] Decide which other products to review next.
