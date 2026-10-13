# Universal Form Builder: synthesis, draft requirements and architecture

This draft builds on [01-evaluations-analysis.md](01-evaluations-analysis.md), [02-check-it-analysis.md](02-check-it-analysis.md) and [04-ehs-analysis.md](04-ehs-analysis.md).

Source tags used throughout:

| Tag | Source |
|---|---|
| **EV** | Evaluations evaluation forms |
| **EF** | Evaluations PD event forms |
| **CI** | Check It Checklist Management (ver1) |
| **SB** | Check It sandbox |
| **EHS** | EHS forms: JSA (mobile prototype), Initial Incident, Corrective Action, Observation (desktop production) |

Priorities are **proposals** for review, not decisions.

---

## 1. Scope: shared authoring, product-owned delivery

```
   SHARED (this effort)                       PRODUCT-OWNED (not this effort)
┌─────────────────────────────┐            ┌──────────────────────────────────┐
│  FORM AUTHORING WORKFLOW    │  publishes │  DELIVERY                        │
│  create · add/configure     │ ─────────► │  Evaluations: living eval doc,   │
│  questions · sections ·     │  versioned │    signers, sharing, change log; │
│  blocks · rules · validate ·│    FORM    │    event request + approvals     │
│  preview · version/publish  │ DEFINITION │  Check It: gated inspection run, │
└─────────────────────────────┘            │    assets, deployments, OOS/     │
                                           │    tickets, schedules            │
                                           │  EHS: desktop records + mobile   │
                                           │    wizard, offline sync, emails  │
                                           │  Future products: their own way  │
                                           └──────────────────────────────────┘
```

- **The shared deliverable is the authoring workflow.** It is the end-to-end experience of building, configuring, validating, previewing and publishing a form.
- **The output is a versioned form definition**, a product-neutral JSON document. It is the only contract between authoring and delivery.
- **Delivery belongs to each product.** This covers how the form is rendered, navigated, completed, signed, submitted, approved, stored and reported on. The runtime findings in 01, 02 and 04 still count as requirements, but **only for what the definition must be able to express** (§6). They are not something the shared effort builds.
- **The bar is current capability.** Anything an Evaluations, Check It or EHS author can configure today (or that the current mocks and production forms define) must be authorable in the shared workflow.

### What this means for each product

| Dimension | Evaluations | Check It | EHS | Consequence for authoring |
|---|---|---|---|---|
| Existing authoring design | None mocked (EV is runtime-only; EF Custom Questions is a placeholder) | Full authoring in CI ver1, plus the SB prototype | Production admin custom fields (10 types) inserted among fixed system fields | CI provides the authoring UX patterns. EV, EF and EHS provide the type and config breadth; EHS confirms fixed + custom fields |
| Container | Flat item list (EV); section cards and groups (EF) | Sections → blocks and/or steps | Fixed sections + custom fields (desktop); stepped wizard (mobile); nested repeating steps (JSA) | Author in sections plus reusable blocks and repeating groups. A flat form is one section |
| Reuse | Form Sections, Paragraph Banks, Library (legacy admin) | Content blocks with link states | Header, risk block and Additional Features bar, each rebuilt per form | One block library concept |
| Pass/fail | `passfail` type only | Most types can carry a fail rule; failures trigger actions | Safe/Unsafe matrix responses; severity × probability risk scoring | Fail rules are authored *configuration*. Products decide the consequences at delivery |
| Conditional logic | Rating → required extras (EV); show/hide/enable (EF) | None (CI); reason-driven fields (Requisition) | Yes/no screening probably controls later sections (unconfirmed) | One declarative rule model, authored and validated in the builder |
| Subject | Evaluee (a person) | Entity or asset | Org hierarchy (Division → Facility…), involved people, assets | The definition references a *subject type*; the product binds the real subject at delivery |
| Record semantics | Living document / approval workflow | Gated, immutable, version-pinned | Parent → child records; forms that create forms; offline sync | Relationships between forms are authored (§2b). Record semantics are never authored; they belong to the product in the form. Product-owned |

---

## 2. Unified question-type catalogue (draft)

Every type found in either product, mapped to one proposed canonical name.

- **Core:** authoring support ships with the shared workflow.
- **Extension:** the product registers the type's authoring configuration through the same contract.
- **Every type is delivered by the product.**

| Canonical type | EV / EF | CI / SB | EHS | Key authorable config | Fail rule? | Tier |
|---|---|---|---|---|---|---|
| `heading` | `heading` | — | section titles | `align` | — | Core |
| `instruction` | `instruction`; EF predefined HTML header | `instruction`; SB `info`; block `instructions` | Static Note custom field | rich text with images, `align`, `size` | — | Core |
| `acknowledge` | — | SB `acknowledge` | — | confirm label | — | Core |
| `passfail` | `passfail` | `passfail`; SB `check` (adds N/A) | — | `responseLabels`, `allowNA`? | yes | Core |
| `complete` (binary, non-failing) | — | `complete`; SB `yes-no` | Yes/No screening (as dropdown) | `responseLabels` | no | Core. *Could merge into `passfail` with a `failable` flag* |
| `choice-single` | `choose-one` (radio/dropdown); EF single select; legacy Single Select | `single`; SB `select` | Dropdown (static list); custom Dropdown field | `options[]`, `display: radio\|dropdown`, `failOptions[]`, `otherRequiresComment` | conditional | Core |
| `choice-multi` | `choose-any`; EF checkbox list/combo; legacy Multiple Select | SB `multi-select` (CI removed it) | Checkbox list (Additional Incident Forms) | `options[]`, `display`, `requiredOptions[]`, `failOptions[]`? | conditional | Core |
| `rating` (scale/rubric) | `rating`; legacy Rating Scale | — | Severity 1–5 / Probability A–E ordinal dropdowns | `scaleId` (shared Color Scale: levels, labels, colours), per-level descriptors, `labelOverride`, per-level requirements | via rules | Core |
| `text` | `text-entry` (`multiline`); EF short/long answer; legacy Text Entry | `text`; SB `text`/`long-text` | Text / Textarea custom fields; AI assist on Incident Description | `multiline`, `placeholder`, `maxLength` (512/1024/10000/20000), `expectedValue` | soft (expected-value mismatch) | Core |
| `rich-text` | EF Event Details editor | — | — | toolbar profile | — | Core (*should*) |
| `number` | EF currency/number fields | `numeric` | Number and Currency ($) custom fields | `unit`, `min`, `max`, `step`/precision, `prefix` (`$`), `thresholdSource`, `default` | outside range | Core |
| `count` | — | `count`; SB `count` | — | `par`, `countNoun` | under par | Core (could be a `number` preset) |
| `date` / `time` / `datetime` | same; legacy same | SB `date`/`datetime` | Date (defaults to today); Time hh:mm | `default: today\|now` | — | Core |
| `duration` | `duration`; legacy Duration | — | — | H/M/S limits | — | Core |
| `timer` (paired start/stop) | `timer-start`/`timer-stop`; legacy Timer | — | — | pairing (`timerId`), manual override allowed | — | Extension (EV) or core *(decide)* |
| `signature` | `signature`, `signature-nonlocking` (`draw`) | `signature`; SB typed-name | JSA drawn signature with "signing as" role | `mode: typed\|drawn\|either`, `locking`, `signerSlot` | — | Core |
| `computed` | `computed` (internal), `computed-value` (external); legacy Computed; EF Budget Remaining | — | Risk = Severity × Probability; Observation tallies | `source: formula\|external`, `formula`, `valueType: score\|text\|currency` | — | Core (formula model TBD) |
| `file` | EF Attachments; per-question attachments | `documentation` (photo/video/file) | Attachments (photo, library, file) on every form | `accept`, limits (10 files, 120 MB…), methods | — | Core (as a type and as a capability) |
| `person-picker` | EF Add Presenter | — | Type-ahead person search; defaults to current user | directory source, allow "Other" | — | Core (*could*) |
| `repeating-group` | EF credit rows, permission rules | — (CI uses per-asset subjects instead) | JSA Steps (nested CAs inside) | child questions, min/max rows | — | Core (*should*) |
| `script` | `script`; legacy Script | — | — | speakers, tag catalogue, replies allowed | — | **Extension (EV)** |
| `video` | `video`; legacy **Video Tag** | — | — | sources, annotation/range capture | — | **Extension (EV)** |
| `nested-check` | — | `nested` | — | `checklistId`, `assetType`, look-back, `minPassing` | yes | **Extension (CI)** |
| `cs-count` | — | SB `cs-count` (no renderer) | — | — | — | Out of scope (Q22: Controlled Substances is outside the form engine) |
| *unknown* | legacy **Third-party Text Entry**; 8 Program Group types | — | — | — | — | **Needs definition** |
| **`lookup`** *(new, EHS)* | — | (CI asset picker is a delivery-side registry pick) | Facility type-ahead (org hierarchy); asset Unit Number → auto-filled detail card | `source` (product-supplied entity type), `filterBy` (parent field, e.g. Division → Facility), `populates[]` (fields filled from the chosen record), `default` | — | Core |
| **`matrix`** *(new, EHS)* | — | — | Observation checklist: topic rows × Safe Act / Unsafe Act / Safe Condition / Unsafe Condition / Follow-up | `rows[]` (topics, grouped by category), `columns[]` (each a mini-type: checkbox, dropdown), tallies feed `computed` | via rules | Core (*should*) |
| **`location`** *(new, EHS)* | — | — | GPS "Set Location" map picker; lat/long from asset | `mode: map\|current\|fromLookup` | — | Core (*could*) |
| **`link`** *(new, EHS)* | — | — | Hyperlink custom field; CA link to parent record | `kind: input\|display` | — | Core (*could*) |

### Capabilities that apply to any question (not types)
| Capability | EV | CI | Proposed authoring control |
|---|---|---|---|
| Required / optional | course-recs only | `optional` | Every answerable type; includes "make all mandatory" |
| Help / context text | `detailsHtml` | `context` | One rich-text `help` field |
| Comment / note | rating notes; `is_comment` vs note | `comment: off\|allowed\|required` | Tri-state, as in CI |
| Documentation / attachments | extras bar; attachments can move between questions | `documentation: off\|allowed\|required` with methods | Tri-state plus allowed methods |
| Tags | required question tags; optional answer tags | — | Tag catalogue supplied by the product |
| Response label overrides | `labelOverride` | `responseLabels` | Display only; never identity (CI Rule 2) |
| Presentation hints | `bg`, `layout`, `divided`, `align`, `size` | — | Token-restricted **hints**. A product may ignore a hint it can't render |
| Per-subject responses | — | `multiResponse {assetType, minItems}` | Subject type comes from the product's lookups; the product binds real subjects at delivery |
| On-fail actions | — | `onFail[]` (oos/ticket/notify) | Action types and their config forms are registered by the product |
| Default values *(EHS)* | — | SB date `default` | `default: today \| now \| currentUser \| <literal>` |
| Inherited from parent *(EHS)* | — | — | `inherit: { fromField, editable }`. The value comes from the parent record (CA ← Incident) |
| Tooltip and helper text *(EHS)* | — | — | `help` (inline helper) plus `tooltip` (info icon), e.g. "For Overdue Notifications" |
| AI assist *(EHS)* | — | — | A per-field toggle on text questions. What it does (generate, rewrite, summarise) is TBD |

### 2b. Relationships between forms (from EHS)
None of these exist in Evaluations or Check It, but all four EHS forms use them. They are authored, so they belong in the definition.

| Relationship | EHS example | Definition element |
|---|---|---|
| **Template first** | Observation: pick a checklist, which generates the form. JSA: "apply existing tasklist" | `templateOf` / a form-level `templateSelector` |
| **Parent → child** | Corrective Action belongs to an Incident, Observation or JSA and inherits Division, Facility, Type and ID | `allowedParents[]` plus per-field `inherit` |
| **A form spawns forms** | Incident "Select Additional Incident Forms" creates linked Investigation, Employee, Safety, Security or Environmental forms | A `choice-multi` whose options reference form definitions (`option.spawnsForm`) |
| **Nested child records in a repeating group** | JSA step → Corrective Actions | `repeating-group` item that references a child form |

Check It's `nested-check` (a whole checklist per asset) is a close relative. A single "form reference" mechanism could cover all five relationships.

---

## 3. Draft requirements: authoring workflow

**M** = Must, **S** = Should, **C** = Could. All priorities are proposed.

### 3.1 Types and definition
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-T-01 | A single canonical type list in the definition. Products deliver those same types with no second "kind" vocabulary and no lossy mapping (the SB bug) | SB | M |
| FB-T-02 | Author every core type in §2 | EV EF CI | M |
| FB-T-03 | **Type authoring contract.** Each type supplies its config schema, an inspector panel, defaults, validation rules, a canvas summary and a preview hint. Products register extension types through the same contract. Delivery rendering is not part of the contract | — | M |
| FB-T-04 | Every question has a stable `id` that never changes, separate from its label. Products key analytics and reporting on `id` and type | CI Rule 2, EV reports | M |
| FB-T-05 | Every authorable setting must be part of the output contract (§6) and documented. A setting that no product honours is not offered (SB severity and photo-required were silently ignored) | SB | M |
| FB-T-06 | Can express everything in the legacy Evaluations `QTYPE_*` list and the CI `RESPONSE_TYPES`, or provide a mapping, so existing forms can migrate | EV CI | M |
| FB-T-07 | Rating scales are shared, reusable objects: level count, labels, colours (Color Scales), with descriptors set per form | EV | M |
| FB-T-08 | Display variants for choice questions (radio / dropdown / checkbox / combo), recorded as hints | EV EF | S |
| FB-T-09 | N/A as a per-question capability that a product can switch on *(CI ruled it out; EV is unknown)* | SB | S? |

### 3.2 Product profiles (how one workflow serves many products)
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-P-01 | Each adopting product registers a **profile** that sets which types, capabilities, rule effects and presentation hints its authors see. Check It hides `rating`/`script`/`video`; Evaluations hides `nested-check`/on-fail actions; EHS hides `rating`/`script`/`nested-check` and adds `lookup`/`matrix`/`location` | — | M |
| FB-P-02 | Profiles provide **lookups** used during authoring: asset/subject types, tag catalogues, signer slots, rating scales, paragraph banks, user directories, domains/categories, **org hierarchy** (Division → Facility → Section/Department/Location), **risk matrices**, linkable form definitions | EV CI EHS | M |
| FB-P-03 | Profiles register **extension types**, **on-fail action types** and **additional features** (with their config forms) | CI EV EHS | M |
| FB-P-04 | Profiles set **vocabulary**: "Checklist / step / block" vs "Form / question / section" | CI EV | S |
| FB-P-05 | Profiles add **form-level settings** that the product needs (e.g. CI `appliesToStatuses`, default cadence, checklist type; EV form kind) without the shared workflow knowing what they mean | CI EV | M |
| FB-P-06 | Profiles supply **publish-impact data** (e.g. CI deployments affected) for the blast-radius step | CI | S |
| FB-P-07 | Profiles supply **locked system fields and blocks** that every form of a kind starts with (EHS header, risk block; EF fixed event fields) | EHS EF | M |

### 3.3 Structure and reuse
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-S-01 | Form → Sections → Items, where an item is a question, display content or a **block reference** | CI EF | M |
| FB-S-02 | **Reusable blocks** with a library, domain/category filters, multi-use with a per-instance context label, and order sealed inside a block | CI, EV Form Sections | M |
| FB-S-03 | Link states `template` → `block` → `unique`, with "break link" confirmations, and template-locked sections that accept local additions | CI SB | S |
| FB-S-04 | Layout hints: two-column with full-width items | EF | S |
| FB-S-05 | Repeating groups (child questions, min/max rows) | EF | S |
| FB-S-06 | Paired or bracketing items (timer start/stop around other questions) | EV | C |
| FB-S-07 | Paragraph Bank (reusable text snippets) linked to text questions | EV | C |
| FB-S-08 | Copy a form or block to seed a new one; start from a template, from blocks or from scratch | CI EV | S |
| FB-S-09 | **System fields** a product can lock into a form (cannot be deleted, limited edits) alongside custom questions. EHS does this in production today; EF would need it if its fixed fields move into the builder | EHS EF | M |
| FB-S-10 | **Nested repeating groups** (JSA step → hazard → control → corrective action), with add, edit, delete and reorder, and a maximum depth | EHS | S |
| FB-S-11 | Reusable **product blocks** that ship with a profile: the org-hierarchy header (Division → Facility → Section/Department/Location) and the severity × probability **risk block** (configurable matrix, initial and residual variants) | EHS | M (EHS) |
| FB-S-12 | Relationships between forms (§2b): template-first, parent → child with inherited fields, forms that spawn forms, child forms inside repeating groups | EHS, CI nested | M (EHS) |
| FB-S-13 | Per-form toggles for **additional features** (Corrective Actions, Attachments, Emails, Signatures). The product supplies the list | EHS | S |

### 3.4 Rules and logic (authored, validated; executed by each product)
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-R-01 | One declarative rule model: **condition (answer on question X) → effect**. Effects: show/hide, require, enable/disable, set label/help, mark failed, trigger an action | all | M (model) / phased (effects) |
| FB-R-02 | Fail rules: numeric range, under par, fail-marked options, pass/fail, expected-value mismatch (soft) | CI SB | M |
| FB-R-03 | Answer-driven requirements: a rating level requires an annotation or duration; a fail requires a comment or documentation | EV CI | M |
| FB-R-04 | Visibility and enablement driven by other answers (Schedule Type, reimbursement, reason codes) | EF, Requisition | S |
| FB-R-05 | Computed fields with a formula model (sum, average, scale roll-up, currency arithmetic) | EV EF | S |
| FB-R-06 | On-fail actions attached to fail rules, with each action type's config form supplied by the product. The level they are authored at is TBD | CI | M (CI) |
| FB-R-07 | The rule graph is validated at publish: no cycles, no references to deleted questions, only effects the product profile supports | — | M |
| FB-R-08 | A plain-language rule summary on the question ("If Fail → comment required; creates High ticket") | CI "This failure will…" | S |
| FB-R-09 | **Cascading lookups and auto-fill:** a field filters by its parent field (Division → Facility), and a lookup fills dependent fields (asset → Make/Model/Year/Lat-Long) | EHS | M (EHS) |
| FB-R-10 | Matrix-lookup calculations (risk = Severity × Probability through a configured matrix) and tallies over matrix answers | EHS | S |

### 3.5 Authoring UX
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-A-01 | Authoring shell: a type palette, a canvas of sections and blocks, and an inspector with staged panels (question → type config → rules/failure → attachments) | CI | M |
| FB-A-02 | Reordering by drag **and** keyboard (Move up / down / to section) to meet WCAG 2.1.1 | CI | M |
| FB-A-03 | **Preview** of the authored form, at desktop and mobile widths, from inside the authoring workflow. The mechanism is TBD: a generic reference preview, or a preview supplied by the product (§7, Q1). Neither product has one | — | M |
| FB-A-04 | Add, duplicate and delete; undo; dirty tracking; exit confirmation; Escape closes the topmost overlay; scroll position kept on edit | SB | M |
| FB-A-05 | Block picker: search, grouped by domain, step-count preview, "add custom questions instead" | SB | S |
| FB-A-06 | Bulk edits: make all mandatory, apply settings to the selection | CI S2 | S |
| FB-A-07 | Validation before publish: missing labels, empty option lists, min > max, broken rules, profile violations, with jump-to-issue links | SB | M |
| FB-A-08 | Scales to very long forms (1,000+ items), with a section/block outline and virtualized canvas | CI brief | M |
| FB-A-09 | Embeddable in each product's shell (product nav, theming) *or* standalone. TBD (§7, Q2) | — | M |
| FB-A-10 | **No default labels at publish.** Labels like "New Currency Field 324" reach production in EHS today, so validation blocks publishing them | EHS | M |
| FB-A-11 | Optional **content review** step (reviewer approves before publish), plus spell-check on authored text. EHS checklist typos suggest content goes live unreviewed | EHS | S |
| FB-A-12 | Guidance that steers authors to the right type, e.g. suggest a yes/no or segmented control instead of a two-option dropdown | EHS | C |
| FB-A-13 | Layout authoring where reading order, tab order and mobile reflow follow the authored order, not the visual column placement | EHS | M |

### 3.6 Versioning and publishing
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-V-01 | Draft → Published → Archived. Published versions are immutable, and editing creates a draft of version n+1 | CI | M |
| FB-V-02 | Every published version has a stable `id + version`, so products can pin deliveries and records to the version they ran against | CI | M |
| FB-V-03 | Publishing shows its **blast radius**: forms and checklists that use a changed block, plus product-supplied impact (deployments) and compliance-mapping warnings | CI SB | M |
| FB-V-04 | Changing a question offers a choice: keep its identity, or "start a new series" to break analytics continuity | CI Q7 | S |
| FB-V-05 | Track the source template of copies and renamed forms | EV | S |
| FB-V-06 | Audit log of definition changes (who, what, when) | EV | S |
| FB-V-07 | **Publish handoff**: products are notified or can fetch new versions (event/API). The definition schema itself is versioned | — | M |

### 3.7 Accessibility
| ID | Requirement | Pri |
|---|---|---|
| FB-X-01 | The authoring workflow meets WCAG 2.2 AA: keyboard reordering, accessible inspector forms, announced validation errors | M |
| FB-X-02 | The definition carries what delivery needs for accessibility: a label on every answerable item, help text, author-set error messages, and alt text for instruction images | M |

### 3.8 Design-system dependencies
| ID | Requirement | Pri |
|---|---|---|
| FB-DS-01 | The authoring workflow is built on current Vector core and themes (≥ the CONTEXT.md minimums) | M |
| FB-DS-02 | Authoring-side component gaps: drag-reorder list with keyboard move, inspector panel pattern, inline alert (**ALERT-C01**), batch-action bar (**LIST-C01**), selectable option card (**OPTCARD-C01**) | S |
| FB-DS-03 | Resolve the `vaadin-popover` documentation gap and the `vwc-drawer` gaps before relying on them | M |
| FB-DS-04 | *(For products' delivery, not this effort)* Shared delivery controls worth promoting to Vector: pass/fail/N-A toggle (**CER-V01**), required-option chip (**CER-V02**), rating tiles, signature field | C |

---

## 4. Proposed architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│  FORM AUTHORING WORKFLOW (shared)                                     │
│  ┌──────────────────────────┐   ┌──────────────────────────────────┐  │
│  │ Authoring shell          │   │ Core                             │  │
│  │ palette · canvas ·       │   │ definition schema (versioned)    │  │
│  │ inspector · block library│◄──┤ type authoring registry          │  │
│  │ rules editor · preview · │   │ rules model + validator          │  │
│  │ validate · publish       │   │ scale / block libraries          │  │
│  └────────────▲─────────────┘   └──────────────────────────────────┘  │
│               │ product profile: types, capabilities, lookups,        │
│               │ extension types, action types, vocabulary,            │
│               │ form-level settings, publish impact, preview adapter  │
└───────────────┼───────────────────────────────────────────────────────┘
                │                        │ publish
┌───────────────┴────────────┐           ▼
│ Product profiles           │   FORM DEFINITION (id + version, JSON)
│ Evaluations · Check It · … │           │
└────────────────────────────┘           ▼
                       ┌───────────────────────────────────────────────┐
                       │ PRODUCT DELIVERY (each product, out of scope) │
                       │ renders, runs rules, binds subject, captures  │
                       │ answers, workflow, records, reporting         │
                       └───────────────────────────────────────────────┘
```

### Draft definition schema (the output contract)
```js
FormDefinition {
  schemaVersion,                     // version of this contract
  id, version, status: 'draft'|'published'|'archived',
  product, profileSettings: { …opaque to the builder, e.g. CI appliesToStatuses, cadence; EHS enabled features },
  relationships?: { allowedParents:[formId], templateSelector?, spawns?:[formId] },   // §2b (EHS)
  name, description, category,
  presentation: { layout: 'single'|'two-column', numbering },
  sections: [{
    id, title, help, locked,
    items: [ QuestionItem | DisplayItem | BlockRef ]
  }],
  rules: [ Rule ],
  references: { scales:[scaleId], blocks:[{blockId, version}], tagCatalogs:[…] },
  meta: { createdBy, publishedBy, publishedAt, sourceTemplateId }
}

QuestionItem {
  id,                                // stable identity; labels never act as identity
  type,                              // one canonical vocabulary (§2)
  label, help, tooltip?, required, system?: { locked, editable:[…] },
  default?: 'today'|'now'|'currentUser'|<literal>,
  inherit?: { fromField, editable },                             // value from parent record (EHS)
  config: { …type-specific },
  capture: { comment: 'off'|'allowed'|'required',
             documentation: { mode:'off'|'allowed'|'required', methods:['photo','video','file'] },
             tags: { required:[], allowed:[] }, allowNA? },
  responseLabels?,
  presentation?: { bg, layout, divided, align, size, display },   // hints
  subjects?: { type:'<assetType>', min },                         // per-subject responses
  failure?: { rule:'auto'|'none', actions:[ {type, config} ] },
  errorMessages?: { required?, range? },
  assist?: { ai: boolean }                                      // EHS AI assist (behaviour TBD)
}

BlockRef { kind:'block', instanceId, blockId, blockVersion, contextLabel,
           linkState:'template'|'block'|'unique', optional }

Rule { id, when: { questionId, op, value }, then: [ { effect:'show'|'hide'|'require'
       |'enable'|'disable'|'fail'|'setLabel'|'action', target, args } ] }
```

*(The answer/response shape is product-owned and not defined here. Products should key answers on `QuestionItem.id`, `BlockRef.instanceId` and the definition `version`.)*

### Principles
1. **Author once, deliver anywhere.** The shared workflow decides *what is asked and under what rules*. Each product decides *how it is presented, completed and what a response means*.
2. **The definition is the only contract.** It is versioned, documented and product-neutral; product-specific settings travel in clearly bounded slots.
3. **One vocabulary, one contract for types.** Core and extension types are authored through the same registry, and nothing is translated between authoring and delivery.
4. **Identity is not the label.** Question ids stay stable across versions; relabeling is a display concern.
5. **Published is immutable.** Products pin to `id + version`.
6. **Profiles, not forks.** Products tailor the workflow through configuration, never by copying the authoring UI.
7. **Nothing authorable is a no-op.** If a product can't honour a setting, its profile hides that setting.

---

## 5. Core vs. extension: proposed split

**Core authoring:**
- heading, instruction, acknowledge
- passfail, complete, choice-single, choice-multi, rating
- text, rich-text, number, count
- date, time, datetime, duration
- signature, computed, file
- repeating-group (nestable), person-picker
- lookup, matrix, location, link *(new from EHS)*

**Extensions** (authoring config registered by the product):
- **Evaluations:** script, video (Video Tag), timer pair *(or core)*, Third-party Text Entry (TBD)
- **Check It:** nested-check, per-asset subject types, on-fail action types (OOS / ticket / notify)
- **EHS:** the risk block (severity × probability matrix), the org-hierarchy header block, additional-feature types (Corrective Actions, Emails), child-form references

---

## 6. Delivery needs the definition must express

These come from the runtime behaviour reviewed in 01, 02 and 04. The shared workflow doesn't build any of these behaviours, but it must **author and output** the data each product needs to deliver them.

| Product delivery behaviour | Product | What the definition must carry |
|---|---|---|
| Submit blocked until required items and fail comments are complete | CI | `required`, `capture.comment/documentation`, fail rules |
| Living document; save at any time | EV | Nothing extra; `required` is advisory for EV (product choice) |
| Approval workflow; some actions skip validation | EF | Nothing extra; validation data only |
| "This failure will: create ticket…" | CI | `failure.actions[]` with config |
| Rating level requires annotation/duration | EV | `require` rules keyed to rating levels |
| Answer per assigned asset; nested sub-checklists | CI | `subjects`, `nested-check` config |
| Multiple signers, locking signature | EV | `signature.signerSlot`, `locking` |
| Read-only, print and compare views | EV EF | Labels, help text and display hints (the products render them) |
| Block navigation index for long runs | CI | Sections and block instances with `contextLabel` |
| Reporting by question, tag, domain, scale | EV | Stable ids, tag references, scale references, rubric domain metadata |
| Records pinned to the version run | CI | `id + version`, immutable once published |
| Applies only when entity is in service | CI | `profileSettings.appliesToStatuses` |
| Desktop single page with anchor navigation vs. mobile stepped wizard | EHS | Sections in authored order; the product chooses page or wizard |
| Child record prefilled from its parent (CA ← Incident) | EHS | `relationships.allowedParents`, per-field `inherit` |
| Linked follow-on forms created on save | EHS | `option.spawnsForm` |
| Overdue escalation emails to second- and third-level owners | EHS | Person fields with an escalation role (product-registered metadata) |
| Offline capture with conflict resolution | EHS (EV legacy) | Nothing extra; records are pinned to `id + version` |

---

## 7. Open questions

**Authoring workflow / architecture**
1. **Preview:** a generic reference renderer inside authoring (it may not match the product exactly), or a preview adapter supplied by each product (exact match, but every product has to build one)? Or a generic preview with a product override?
2. **Packaging:** one authoring app that products link to, or an authoring component embedded in each product's shell?
3. **Publish handoff:** push (event/webhook) or pull (API)? Where are definitions stored, and who owns schema migrations?
4. Who owns shared libraries (blocks, scales, tag catalogues, paragraph banks)? Per tenant, per product or shared across products?
5. Is a single type vocabulary acceptable to all three backends? EV has the legacy `QTYPE_*`, CI defines its own `RESPONSE_TYPES`, and EHS has its custom-field types.
6. Is N/A a universal capability or a profile decision?
7. What scoring model does each product need, and is it authored (weights, thresholds) or product-computed?
8. Who can author and publish? Is permission configured by the product profile?

**Evaluations**

9. What are the 8 Program Group types, Third-party Text Entry and Video Tag?
10. Should `computed` and `computed-value` merge? Should `signature` and `signature-nonlocking` merge? What does a locking signature lock?
11. Do event-form fixed fields become locked system fields in the shared workflow, or stay hard-coded in delivery?
12. Do Feedback forms and Evidence requirements become authored forms?

**Check It**

13. At what level are failure actions authored (step, block, checklist, department default)?
14. Where does a nested checklist's definition come from?
15. Compartments: nesting targets, count targets or both?
16. Does Multi-select come back, now that authoring is shared?

**EHS** (full list in 04 §8)

17. Do the Incident yes/no answers show or hide later sections, and can admins configure that?
18. Which additional features (Corrective Actions, Attachments, Emails, Signatures) can admins toggle per form?
19. What does AI assist do (generate, rewrite, summarise), and should authors control it per field?
20. How are Observation checklist templates authored and versioned today, and who owns the content?
21. How deep can repeating groups nest? Is the risk matrix configurable per tenant?
22. Are custom fields defined per form or in a tenant-wide field library?

---

## 8. Things no reviewed product has designed (gaps to fill in authoring)

- A **preview** inside authoring
- A **scoring** authoring model (weights, thresholds, critical items) if products need one
- **Show/hide branching** between authored questions (EHS screening questions probably need it; unconfirmed)
- **Content review** before publish
- **Permissions** for authoring and publishing
- A complete **accessibility** spec for the authoring UI
- **Migration/import** of existing EV forms, CI checklists and EHS custom fields and templates into the definition format

---

## 9. Suggested next round

1. Validate this framing and the type catalogue with the EV, CI and EHS product owners, and lock the canonical type list and profile model.
2. Answer §7 Q1–Q3 (preview, packaging, handoff). They shape the first mock.
3. Mock `ver1` of the authoring workflow here, starting from CI's authoring patterns. Prove it by authoring one EV evaluation form, one CI checklist and one EHS form (Corrective Action, which exercises system fields, lookups, inheritance and the risk block) in the same workflow under three profiles, and show the definition JSON each one produces.
4. Review the next candidate products' authoring needs against §2 and §3.
