# Form Builder: working model, draft requirements and architecture

**Status:** Draft v1 for review · **Updated:** 2026-10-14

This document pulls together the product analyses ([01 Evaluations](01-evaluations-analysis.md), [02 Check It](02-check-it-analysis.md), [04 EHS](04-ehs-analysis.md)) and the decisions made in discovery so far. Two companion pages illustrate it:

- **[Question Mechanisms](question-mechanisms/index.html):** every mechanism with its product versions, a reference preview and its customization dimensions.
- **[Form Journey Maps](journey-maps/index.html):** each product's full form workflow, showing where the Form Builder takes over and where the product keeps ownership.

**Source tags:** **EV** Evaluations evaluation forms · **EF** Evaluations PD event forms · **CI** Check It Checklist Management · **SB** Check It sandbox · **EHS** EHS forms.

**Confidence:** most evidence comes from mocks and screenshots, not product code. Claims that need confirming are listed in the [code-dive brief](05-code-dive-brief.md). Requirement priorities are **proposals**.

---

## 1. Decisions so far

| # | Decision | Notes |
|---|---|---|
| D1 | **The shared scope is form *authoring*.** Its output is a versioned form definition. | Delivery (rendering, completing, signing, records) stays with each product. |
| D2 | **Assignment, deployment and scheduling stay product-owned** for now. | The Form Builder's job ends at Publish. It needs two hooks into each product's assignment (§6). |
| D3 | **Packaging: a shared authoring experience reached from each product.** | There is no branded destination. Each product's existing library page ("Checklists", "Forms") is the authoring home, and "Create" and "Edit" entry points appear where forms live today. |
| D4 | **No user-facing name.** Users see "Create checklist", "Edit evaluation form" and so on, in their product's own words. **"Form Builder" is the internal project name.** | Product vocabulary (form / checklist, question / step) is therefore a must-have. |
| D5 | **Questions are built from a small set of core *mechanisms*, customized per product** (§4). | Replaces the earlier "canonical type list". |
| D6 | **Product systems plug in through *extensions*** (tags, applies-to statuses, reimbursement codes…) (§5). | Products don't share tag systems. Each one registers its own. |
| D7 | **Scale is separate from Choice.** | Scale = ordered levels where position matters. Choice = categories. |
| D8 | **Yes/No and Pass/Fail are binary Choices.** What an answer *means* (e.g. fails) is set per question, because wording decides it. | E.g. "Any leaks?" Yes = fail. |
| D9 | **Acknowledge belongs to Attest.** | It's about what the answer means, not how it's entered. |
| D10 | **Script is a core mechanism** and supports any number of participants. | Group activities: quotes and actions from many people. |
| D11 | **Timer is a structural property, shown as a pinned widget**, not a split start/stop question. | It attaches to a structural unit: form, section, block or Repeat row. |
| D12 | **Repeat and Nested are different mechanisms.** | Repeat = inline questions asked N times. Nested = another form, with its own owner and version. |
| D13 | **The value claim:** a better way to do what each product does today, *and* every product gains capabilities proven in the others. | §2. A deeper code dive is needed before the claim can be refined. |

---

## 2. Value: better and broader

### Better: authoring today vs. the Form Builder

| | Evaluations (EV+ admin) | Check It | EHS | Form Builder |
|---|---|---|---|---|
| **Where authoring happens** | Separate admin areas (Forms, Paragraph Banks, Color Scales, Tags…) | One builder | Custom fields added to fixed forms; checklist templates edited separately | One authoring experience per product, in product terms |
| **Building** | One question at a time in a modal; no view of the whole form while editing | Canvas with sections and blocks | Fields added one by one | Canvas + inspector, with the whole form visible |
| **Reuse** | Scale presets (probably copied); Form Sections | Linked content blocks | None | Linked blocks and scales, shared within a product |
| **Logic** | Rating level → require duration or annotation | Fail rules → out of service, ticket, notify | Not visible | One rules model |
| **Preview** | A separate Preview button | None | Not seen | Live preview while editing, plus a test run |
| **Review** | None seen | None | None (typos reach production) | Optional content review plus quality checks |
| **Versions** | Unpublished / published; versioning unknown | Draft → publish, version pinning, blast radius | Not seen (placeholder labels go live) | Draft → publish, pinning and blast radius for everyone |

### Broader: what each product gains from the others

Proposals to test with product owners:

| Capability | From | Evaluations gains | Check It gains | EHS gains |
|---|---|---|---|---|
| Linked blocks + link states | CI | Rubric domains and Form Sections as linked blocks | — | Header and risk blocks built once |
| Draft / publish / pinning / blast radius | CI | Safe mid-year edits | — | Records pinned to the version they used |
| Fail rules → follow-up | CI | Low rating → growth plan | — | Unsafe observation → corrective action |
| Evidence off / allowed / required | CI | Required evidence per rubric item | — | Photo required on unsafe findings |
| Scale with descriptors, colours, presets | EV | — | Graded condition (Good / Fair / Poor) | Severity and probability with real descriptors |
| Script, Timer, video annotation | EV | — | Drill debriefs, timed tasks | Incident interviews, timed observations |
| Per-question "who answers" (subtypes) | EV | — | Officer-only steps | Investigator-only sections |
| Paragraph banks, tags | EV | — | Standard deficiency comments; tagged reporting | Standard findings text; tagged trends |
| Relationships between forms | EHS | Evaluation → linked growth plan | Deficiency → work-order form | — |
| Lookups with cascade + auto-fill | EHS | School → grade → teacher | Station → apparatus → equipment | — |
| Locked system fields + custom fields | EHS | District-required fields | Department-required header | — |
| Risk-matrix calculation | EHS | — | Deficiency priority | — |
| Approval workflow | EF | Review before district rollout | Review before publishing to all apparatus | Template review |

---

## 3. The authoring workflow

The Form Builder covers stages **Start → Publish**. Hand off and Maintain connect it to each product.

| Stage | What happens | Best of today | New for everyone |
|---|---|---|---|
| **1. Start** | Pick a kind; start blank, from a template, by copying, or from blocks | CI origin; EV folders and scale presets | One library per product: forms, templates, blocks, scales |
| **2. Build** | Sections, questions, blocks; reorder | CI canvas, block picker, keyboard reorder | All mechanisms, filtered per product |
| **3. Connect** | Rules, calculations, links to other forms | CI fail actions; EV level requirements; EHS parent/child | One rules model |
| **4. Preview & test** | See it as a respondent; try rules | EV Preview button | Live preview at desktop and mobile widths; a test run |
| **5. Review** | Someone checks the content | EF approval (on events, not forms) | Optional content review + quality checks |
| **6. Publish** | Release a version | CI draft/publish, blast radius | Everyone gets versions and impact warnings |
| **7. Hand off** | The product assigns, deploys or attaches it | CI deployments; EV plans; EHS records | Product-owned (D2) |
| **8. Maintain** | Update, retire, see where it's used | CI archive, blast radius | Usage visibility |

The journey maps show how stages 1–2 (Form Builder), 3–4 (assignment and scheduling) and 5–9 (delivery) line up in each product.

---

## 4. Question mechanisms

The **[Question Mechanisms page](question-mechanisms/index.html)** shows every product version and every customization dimension. Summary:

| Mechanism | Collects | Main customizations | EV | CI | EHS |
|---|---|---|---|---|---|
| **Scale** | A position on ordered levels | Levels (up to 8), codes, order, score per level, excluded from averages, descriptors per question, colours, presentation, rules per level, presets | Rating Scale | — | Severity, Probability, Safe/Unsafe |
| **Choice** | Categories, one or many | Single/multi, options, meaning per option (fails), "Other", presentation, triggers | Choose One/Any, Pass/Fail | Pass/Fail, Complete, Select | Dropdowns, Yes/No, additional-form checkboxes |
| **Text** | Words | Lines, limits, format, expected value, rich text, AI assist | Text Entry (+ subtypes) | Text | Text, textarea, hyperlink |
| **Measure** | A number | Unit, format, precision, validation limit vs. fail threshold, entry method | Duration | Numeric, Count vs. par | Number, Currency |
| **Date & time** | A moment | Date/time/both, default, range, relative constraints | Date, Time, DateTime | — | Dates, times |
| **Lookup** | A reference to a product record | Entity, filter by parent, auto-fill, default (me), manual entry | Presenter search | Asset pick | Person, Facility, Unit Number |
| **Location** *(tentative)* | A captured point | Capture method (GPS, map pin, from lookup), accuracy | — | — | Set Location; asset lat/long |
| **Evidence** | Files and media | Methods, off/allowed/required, limits, tags; standalone or attached | Attachments, Allow Attachments | Documentation | Attachments |
| **Script** | Timed, attributed entries | Participants (roles, roster, on the fly), group attribution, entry kinds, time anchor (incl. media), tags | Script, Video annotations | — | — |
| **Attest** | A person's confirmation | Checkbox / typed / drawn, signer role, locking, statement | Signature (locks the signer), Non-locking | Signature, Acknowledge | JSA signatures |
| **Calculate** | A derived value | Formula, matrix lookup, tally, external source | Computed | — | Risk, tallies |
| **Repeat** *(structure)* | Inline questions, N times | Row source (user-added, fixed, per subject), min/max, reorder, presentation | — | Per-asset answers | JSA steps, Observation matrix |
| **Nested** *(structure)* | Another form's results | Target form, trigger, fold-in vs. separate record, inherited fields | — | Nested check | Corrective Action, follow-on forms |
| **Timer** *(structure)* | Time on a unit | Scope, start, stop, limit, output | Elapsed-Time Recording (form setting) | — | — |
| **Display** *(layout)* | Nothing | Headings, instructions, notes | Heading, Instructions | Instruction | Note field |

### Settings every question shares

| Setting | Evidence | Proposal |
|---|---|---|
| Title + rich-text details | EV `Details` editor; CI `context` | One title + rich help |
| Required | EV Required; CI optional | Required / optional, plus "make all mandatory" |
| **Who answers** | EV Text Entry subtypes: Normal, Reflection, Third Party, Read Only, Anyone, Any Evaluator | A core setting; each product supplies its role list |
| Comment / annotation | EV Allow Annotation; CI `comment` off/allowed/required | Off / allowed / required |
| Evidence | EV Allow Attachments; CI `documentation` | Off / allowed / required + methods |
| Tags | EV Pre-Defined and Optional Tags | A product extension (§5) |
| Presentation hints | EV background colour, title font, alignment, divider, selector location | Token-restricted hints; products may ignore them |
| Meaning and rules | CI fail rules; EV per-level Require Duration | Rules model (§7.4) |

**Subtypes.** Product subtypes vary by question type and will come from the code dive. Each one is either a **preset** of a mechanism (a different input) or a **who-answers** value (different permissions).

---

## 5. Product extensions

Products plug their own systems into the Form Builder without sharing them. The Form Builder knows the *shape* of each setting and where its options come from. The product supplies the options and decides what they mean.

| Attaches to | Purpose | Evaluations | Check It | EHS |
|---|---|---|---|---|
| **Form settings** | Product settings for the whole form | Use For (Feature), Type, Observation Form, privacy control, name editing, prevent self-evaluation, sharing behaviour, reimbursement code/subcode/duration | Applies-to statuses, default cadence, checklist type | Additional features (corrective actions, attachments, emails, signatures) |
| **Question** | Product settings on a question | Pre-defined tags | Asset type for per-asset answers | Escalation role on person fields |
| **Answer** | Things the respondent adds | Optional tags; Paragraph Bank text | — | — |
| **Data source** | Lists the Form Builder pulls from | Tag catalogue, scale presets, colour scales, codes, roles | Asset types, entity statuses, stations | Org hierarchy, people, assets, risk matrix |
| **Rule outcome** | What an answer can trigger | Course recommendation | Out of service, ticket, notify | Create a corrective action, create a follow-on form |
| **Publish impact** | What a change affects | Plans using this form | Deployments using this version | Open records using this form |

Each extension declares its **name and wording**, **where it attaches**, **what the author sets** (toggle, pick list, small form), **where its options come from** (fetched live, never copied), and a **publish check** (e.g. a referenced tag still exists). The form definition stores **references** (IDs), so delivery and reporting always resolve against the product's live data.

---

## 6. Form setup and structure (proposed, not yet decided)

### Setup
| Layer | What it is | Who defines it |
|---|---|---|
| Identity | Name, description, folder | Author |
| **Kind** | A product form type, e.g. EV "Use For: Evaluation / Type", CI checklist type, EHS "Corrective Action". It brings the subject type, roles, allowed relationships, product form settings and **locked system fields** | Product (configuration) |
| **Template** | Editable starting content of a kind, e.g. a scale preset, an observation checklist, a district walk-through | Authors (library) |
| Starting point | Blank, template, copy, or from blocks | Author |
| Relationships | Can be nested in, creates follow-on forms, allowed parents | Kind default; author adjusts |

**Kind vs. Template** separates product configuration (rarely changed) from content (often changed). The two are blurred in every product today.

### Structure
```
Form (Kind + setup)
└── Section            ← navigation, layout (1–2 columns), Timer scope, rules
    └── Item           ← Question | Display | Block (reusable, sealed) | Repeat | Nested
```
- Sections are the only required container (a default section is created).
- **Blocks are the only unit of reuse.** A reusable section is a section built from one block.
- Repeat and Nested are items, so they can contain each other (JSA step → corrective actions).
- **Delivery decides pages vs. a wizard.** EHS shows the same form as one page on desktop and as a wizard on mobile.

### Hooks into product assignment (D2)
1. **Publish impact:** the product reports what uses a form or version, which feeds the blast-radius step.
2. **Discoverability:** the product lists published forms of a kind when it sets up plans, deployments or pickers.

The hand-off to a product is the published form's **ID + version + kind**, plus its subject type and roles.

---

## 7. Draft requirements

**M** = Must, **S** = Should, **C** = Could. All priorities are proposals.

### 7.1 Mechanisms and definition
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-M-01 | Questions are built from the core mechanisms (§4). There's one vocabulary in the definition, and nothing is translated between authoring and delivery (the SB bug) | SB | M |
| FB-M-02 | Each mechanism exposes its customization dimensions, and products define **presets** (named versions) on top of them | all | M |
| FB-M-03 | **Mechanism contract:** config schema, inspector panel, defaults, validation, canvas summary, preview. Delivery rendering is product-owned | — | M |
| FB-M-04 | Stable question IDs, separate from labels; reporting keys on ID | CI, EV | M |
| FB-M-05 | Every authorable setting is part of the output contract. A setting a product can't honour is hidden by that product's profile | SB | M |
| FB-M-06 | Scales: up to 8 levels; per-level value, title (128 characters), description (4,000), colour, excluded-from-averages, rules; presets; per-question descriptors; **linked or copied** use | EV | M |
| FB-M-07 | "Who answers" on every question, from a product role list | EV | M |
| FB-M-08 | Legacy mapping: every EV question type and subtype, CI response type and EHS custom field type maps to a mechanism + preset, so forms can migrate | all | M |

### 7.2 Product profiles and extensions
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-P-01 | A **profile** per product sets the mechanisms, presets, settings and vocabulary its authors see | — | M |
| FB-P-02 | **Extensions** at form, question, answer, data-source, rule-outcome and publish-impact level (§5) | all | M |
| FB-P-03 | Product **vocabulary** throughout: form / checklist, question / step, section / block (D4) | all | M |
| FB-P-04 | Kinds bring locked system fields and blocks (EHS header and risk block; EF fixed fields) | EHS, EF | M |
| FB-P-05 | Extension options are fetched live and stored as references, with a validity check at publish | — | M |

### 7.3 Structure and reuse
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-S-01 | Form → Sections → Items (§6) | CI, EF | M |
| FB-S-02 | Reusable blocks: library, categories, multi-use with context labels, sealed order | CI, EV | M |
| FB-S-03 | Link states template → block → unique, with "break link" confirmations | CI, SB | S |
| FB-S-04 | Locked system fields alongside custom questions | EHS, EF | M |
| FB-S-05 | Repeat (user-added, fixed, per subject; nestable) and Nested (fold-in or separate record, inherited fields, spawned by answers) | EHS, CI, EF | M |
| FB-S-06 | Timer as a property of a form, section, block or Repeat row | EV | S |
| FB-S-07 | Folders and copy-to-start in the library | EV, CI | S |
| FB-S-08 | Layout hints (1–2 columns) where reading order = authored order | EF, EHS | M |

### 7.4 Rules
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-R-01 | One declarative model: **when (answer) → then (show, hide, require, enable, fail, set label, trigger outcome)** | all | M (model) / phased |
| FB-R-02 | Fail rules: range, under par, failing options, binary meaning, expected-value mismatch (soft) | CI, SB | M |
| FB-R-03 | Answer-driven requirements: level → duration or annotation; fail → comment or evidence | EV, CI | M |
| FB-R-04 | Cascading lookups and auto-fill | EHS | M (EHS) |
| FB-R-05 | Calculations: formula, matrix lookup, tally, external | EV, EHS, EF | S |
| FB-R-06 | Rule outcomes registered by products (extensions) | CI, EHS, EV | M |
| FB-R-07 | The rule graph is validated at publish (no cycles, no broken references) | — | M |
| FB-R-08 | A plain-language rule summary on each question | CI | S |

### 7.5 Authoring experience
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-A-01 | Canvas + inspector with the whole form visible; no one-question-at-a-time modals | EV pain, CI | M |
| FB-A-02 | Drag **and** keyboard reorder (WCAG 2.1.1) | CI | M |
| FB-A-03 | Live preview at desktop and mobile widths, plus a test run that fires rules | EV, CI gap | M |
| FB-A-04 | Add, duplicate, delete, undo; dirty tracking; exit confirmation | SB | M |
| FB-A-05 | Quality checks before publish: placeholder labels, empty options, broken rules, min > max, spelling | EHS, SB | M |
| FB-A-06 | Optional content review before publish | EHS, EF | S |
| FB-A-07 | Bulk edits (make all mandatory, apply settings to a selection) | CI | S |
| FB-A-08 | Scales to forms of 1,000+ items | CI | M |
| FB-A-09 | Entry points from each product ("Create", "Edit") into the shared experience (D3) | — | M |

### 7.6 Versions and publishing
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-V-01 | Draft → published → archived; published versions are immutable | CI | M |
| FB-V-02 | Products pin to ID + version | CI | M |
| FB-V-03 | Blast radius from product publish-impact extensions; compliance warnings | CI, SB | M |
| FB-V-04 | "Keep identity vs. start a new series" when a question changes | CI | S |
| FB-V-05 | Audit log of definition changes | EV | S |

### 7.7 Accessibility and design system
| ID | Requirement | Pri |
|---|---|---|
| FB-X-01 | The authoring experience meets WCAG 2.2 AA | M |
| FB-X-02 | The definition carries what delivery needs for accessibility: labels, help text, error messages, image alt text | M |
| FB-DS-01 | Built on current Vector core/themes; resolve `vaadin-popover` and `vwc-drawer` gaps first | M |

---

## 8. Definition schema (draft output contract)

```js
FormDefinition {
  schemaVersion, id, version, status: 'draft'|'published'|'archived',
  product, kind, name, description, folder,
  productSettings: { …form-level extensions, opaque to the Form Builder },
  roles: [ roleId ],                         // who-answers / signer roles from the product
  relationships?: { allowedParents:[kind], spawns:[formId], nestableIn:[kind] },
  timer?: { scope:'form', … },
  sections: [{ id, title, help, layout, locked, timer?,
               items: [ Question | Display | BlockRef | Repeat | Nested ] }],
  rules: [ Rule ],
  references: { scales:[{id, linked:true|false}], blocks:[{blockId, version}] },
  meta: { createdBy, publishedBy, publishedAt, sourceTemplateId }
}

Question {
  id,                                        // stable; never the label
  mechanism, preset?,                        // e.g. 'scale' + 'danielson-4'
  title, details, required, answeredBy?: roleId | 'readOnly',
  config: { …mechanism dimensions },
  capture: { comment:'off'|'allowed'|'required',
             evidence:{ mode:'off'|'allowed'|'required', methods:[…] } },
  extensions: { [extensionId]: value },      // e.g. tags, asset type, escalation role
  presentation?: { background, titleFont, align, divider, selectorPosition },
  locked?: boolean                           // system field from the kind
}

Rule { id, when:{ questionId, op, value }, then:[{ effect, target, args }] }
```

Answer and record shapes are product-owned. Products key answers on question ID and definition version.

---

## 9. What the definition must carry for each product's delivery

| Delivery behaviour (product-owned) | Product | Carried by |
|---|---|---|
| Submit blocked until required answers and fail comments are done | CI | `required`, `capture`, fail rules |
| Living document; save any time | EV | Nothing extra |
| Signing locks the signer | EV | Attest `locking` |
| Approvals; some actions skip validation | EF | Validation data only |
| Fail → out of service / ticket / notify | CI | Rule outcomes |
| Level → requires duration or annotation | EV | Rules |
| Answer per asset; nested checks | CI | Repeat (per subject), Nested |
| Child record prefilled from its parent | EHS | `relationships`, inherited fields |
| Follow-on forms created on save | EHS | Choice option → Nested trigger |
| Desktop page vs. mobile wizard | EHS | Sections in authored order |
| Reporting by question, tag, scale | EV | Stable IDs, extension references, scale references |
| Records pinned to their version | CI | ID + version |

---

## 10. Open questions

**For decision (discovery)**
1. Preview: a generic reference preview, or one supplied by each product?
2. Location: its own mechanism, or a capture method shared with Evidence?
3. Rich text: an option on Text, or its own mechanism?
4. Observation matrix: a Repeat shown as a grid, or its own mechanism?
5. Kind vs. Template split and setup layers (§6): agree?
6. Who owns shared libraries (blocks, scales, tags): tenant, product, or both?
7. Scoring model: what each product actually needs (weights, thresholds, roll-ups).

**For the code dive:** see [05-code-dive-brief.md](05-code-dive-brief.md).

---

## 11. Next steps

1. Review this draft and the two companion pages with Evaluations, Check It and EHS product owners.
2. Run the code dive per product ([05](05-code-dive-brief.md)) and replace "Inferred" claims with confirmed ones.
3. Decide the open questions in §10, starting with the setup and structure model.
4. Then define the Form Builder's own experience stage by stage: library and creation first.
