# Form Builder: working model, draft requirements and architecture

**Status:** Draft v1.1 for review · **Updated:** 2026-10-14

This document pulls together the product analyses ([01 Evaluations](01-evaluations-analysis.md), [02 Check It](02-check-it-analysis.md), [04 EHS](04-ehs-analysis.md)) and the decisions made in discovery so far. **[06 Shared core vs. product](06-shared-vs-product.md)** explains which layer owns what. Two companion pages illustrate it:

- **[Question Mechanisms](question-mechanisms/index.html):** every mechanism with its product versions, a reference preview and its customization dimensions.
- **[Form Journey Maps](journey-maps/index.html):** each product's full form workflow, showing where the Form Builder takes over and where the product keeps ownership.

**Source tags:** **EV** Evaluations evaluation forms · **EF** Evaluations PD event forms · **CI** Check It Checklist Management · **SB** Check It sandbox · **EHS** EHS forms.

**Confidence:**
- **Evaluations is now code-confirmed** for form settings, question settings and subtypes (01 §1a, from the EV product documents).
- Check It comes from its designed mocks.
- EHS comes from production screenshots.

Remaining claims to confirm are in the [code-dive brief](05-code-dive-brief.md). Requirement priorities are **proposals**.

---

## 1. Decisions so far

| # | Decision | Notes |
|---|---|---|
| D1 | **The shared scope is form *authoring*.** Its output is a versioned form definition. | Delivery (rendering, completing, signing, records) stays with each product. |
| D2 | **Assignment, deployment and scheduling stay product-owned** for now. | The Form Builder's job ends at Publish. It needs two hooks into each product's assignment (§6). |
| D3 | **Packaging: a shared authoring experience reached from each product.** | There is no branded destination. Each product's existing library page ("Checklists", "Forms") is the authoring home, and "Create" and "Edit" entry points appear where forms live today. |
| D4 | **No user-facing name.** Users see "Create checklist", "Edit evaluation form" and so on, in their product's own words. **"Form Builder" is the internal project name.** | Product vocabulary is therefore a must-have. |
| D5 | **Questions are built from a small set of core *mechanisms*, customized per product** (§4). | Replaces the earlier "canonical type list". |
| D6 | **Product systems plug in through *extensions*** (§5). | Products don't share tag systems. Each one registers its own. EV's TargetSolutions Tags already work this way in production. |
| D7 | **Scale is separate from Choice.** | Scale = ordered levels with per-question descriptors, where position matters. Choice = categories. |
| D8 | **Yes/No and Pass/Fail are binary Choices.** What an answer *means* (e.g. fails) is set per question. **Choice options can carry a numeric value and "exclude from averages"**, so Choice answers can be scored and averaged (EV averages Pass/Fail). | Decided 2026-10-14 (option A). |
| D9 | **Acknowledge belongs to Attest.** | It's about what the answer means, not how it's entered. |
| D10 | **Script is a core mechanism** and supports any number of participants. | |
| D11 | **Timer is a structural property, shown as a pinned widget.** | EV has both a form-level elapsed-time bar and a per-question Timer type; both map here. |
| D12 | **Repeat and Nested are different mechanisms.** | Repeat = inline questions asked N times. Nested = another form. |
| D13 | **The value claim:** a better way to do what each product does today, *and* every product gains capabilities proven in the others. | §2. |

---

## 2. Value: better and broader

### Better: authoring today vs. the Form Builder

| | Evaluations (EV+, code-confirmed) | Check It | EHS | Form Builder |
|---|---|---|---|---|
| **Building** | One question at a time in a modal; no view of the whole form | Canvas with sections and blocks | Fields added one by one | Canvas + inspector, with the whole form visible |
| **Settings** | 13 form settings in a flat list; availability depends on Type and Feature; several **lock after publish** without warning | Few | Feature toggles | Grouped settings, shown only when they apply, with lock warnings |
| **Reuse** | Scale presets (copy vs. link unknown) | Linked content blocks | None | Linked blocks and scales within a product |
| **Logic** | Level → require duration; Computed Expression Wizard | Fail rules → out of service, ticket, notify | Not visible | One rules model |
| **Preview** | Separate Preview button | None | Not seen | Live preview while editing, plus a test run |
| **Review** | None | None | None (typos reach production) | Optional content review + quality checks |
| **Lifecycle** | Draft → Published → Superseded / Publish-Restricted / Archived; can't return to Draft | Draft → publish, version pinning, blast radius | Not seen (placeholder labels go live) | Versioned drafts of published forms, pinning, blast radius |

### Broader: what each product gains from the others

Proposals to test with product owners:

| Capability | From | Evaluations gains | Check It gains | EHS gains |
|---|---|---|---|---|
| Linked blocks + link states | CI | Rubric domains and Form Sections as linked blocks | — | Header and risk blocks built once |
| Draft of a published form, pinning, blast radius | CI | Edit without superseding; safe mid-year changes | — | Records pinned to the version they used |
| Fail rules → follow-up | CI | Low rating → growth plan | — | Unsafe observation → corrective action |
| Evidence off / allowed / required | CI | Required evidence per rubric item | — | Photo required on unsafe findings |
| Scale presets, descriptors, values | EV | — | Graded condition (Good / Fair / Poor) | Severity and probability with real descriptors |
| Relationship-based "who answers" | EV | — | Officer-only steps | Investigator-only sections |
| Signature locking modes, notify-to-sign, to-do | EV | — | Multi-signer sign-off if needed | JSA crew signatures with reminders |
| Script, Timer, video annotation | EV | — | Drill debriefs, timed tasks | Interviews, timed observations |
| Integration extensions (TS Tags) | EV | — | Feed TargetSolutions or other systems | Same |
| Relationships between forms | EHS | Evaluation → linked growth plan | Deficiency → work-order form | — |
| Lookups with cascade + auto-fill | EHS | School → grade → teacher | Station → apparatus → equipment | — |
| Locked system fields + custom fields | EHS | District-required fields | Department-required header | — |
| Risk-matrix calculation | EHS | — | Deficiency priority | — |
| Approval workflow | EF | Review before district rollout | Review before publishing | Template review |

---

## 3. The authoring workflow

The Form Builder covers stages **Start → Publish**. Hand off and Maintain connect it to each product.

| Stage | What happens | Best of today | New for everyone |
|---|---|---|---|
| **1. Start** | Pick a kind and mode; start blank, from a template, by copying, or from blocks | CI origin; EV folders, Use For / Type | One library per product: forms, templates, blocks, scales |
| **2. Build** | Sections, questions, blocks; reorder | CI canvas, block picker, keyboard reorder | All mechanisms, filtered per product |
| **3. Connect** | Rules, calculations, links to other forms | CI fail actions; EV expression wizard and level requirements; EHS parent/child | One rules model |
| **4. Preview & test** | See it as each respondent; try rules | EV Preview button | Live preview per role and device; a test run |
| **5. Review** | Someone checks the content | EF approval (on events) | Optional content review + quality checks |
| **6. Publish** | Release a version | CI draft/publish, blast radius; EV restricted publishing | Versions, impact warnings, lock warnings |
| **7. Hand off** | The product assigns, deploys or attaches it | CI deployments; EV plans; EHS records | Product-owned (D2) |
| **8. Maintain** | Update, supersede, retire, see where it's used | CI archive; EV Superseded | Usage visibility |

---

## 4. Question mechanisms

The **[Question Mechanisms page](question-mechanisms/index.html)** shows every product version and every customization dimension.

| Mechanism | Collects | Main customizations | EV (code) | CI | EHS |
|---|---|---|---|---|---|
| **Scale** | A position on ordered levels | Up to 8 levels; per-level value, title, description, exclude from averages, rules (require duration); colours; presets; per-question descriptors | Rating Scale | — | Severity, Probability, Safe/Unsafe |
| **Choice** | Categories, one or many | Single/multi; options with **value** and **exclude from averages**; meaning per option (fails, critical); "Other" text input; **tags per option**; dropdown / column list, **1–4 columns** | Choose One/Any, Pass/Fail (values, Critical) | Pass/Fail, Complete, Select | Dropdowns, Yes/No, follow-on-form checkboxes |
| **Text** | Words | Lines, max length, watermark, format, expected value, rich text, AI assist | Text Entry | Text | Text, textarea, hyperlink |
| **Measure** | A number | Unit, format, precision, validation limit vs. fail threshold, entry method | Duration (special: Overall Duration) | Numeric, Count vs. par | Number, Currency |
| **Date & time** | A moment | Date/time/both, default, range, relative constraints | Date, Time, DateTime | — | Dates, times |
| **Lookup** | A reference to a product record | Entity, filter by parent, auto-fill, default (me), manual entry | Presenter search (EF) | Asset pick | Person, Facility, Unit Number |
| **Location** *(tentative)* | A captured point | Capture method, accuracy | — | — | Set Location; asset lat/long |
| **Evidence** | Files and media | Methods, off/allowed/required, limits, tags | Allow Attachments | Documentation | Attachments |
| **Script** | Timed, attributed entries | Participants, group attribution, entry kinds, time anchor (incl. media), tags | Scripting, Video | — | — |
| **Attest** | A person's confirmation | Checkbox / typed / **hand-drawn**; **who signs** (= who answers); required; **locking mode** (form-level: signer / all / prior); **notify when ready**; **show on to-do list** | Signature, Non-locking | Signature, Acknowledge | JSA signatures |
| **Calculate** | A derived value | Formula (**expression wizard**), matrix lookup, tally, external; **validations**; hidden; can update after lock | Computed (Computed Only) | — | Risk, tallies |
| **Repeat** *(structure)* | Inline questions, N times | Row source, min/max, reorder, presentation | — | Per-asset answers | JSA steps, Observation matrix |
| **Nested** *(structure)* | Another form's results | Target form, trigger, fold-in vs. separate record, inherited fields | — | Nested check | Corrective Action, follow-on forms |
| **Timer** *(structure)* | Time on a unit | Scope, start, stop, max, manual edit, output | Elapsed-Time Recording (form); Timer question | — | — |
| **Display** *(layout)* | Nothing | Headings, instructions, notes | Heading, Instructions | Instruction | Note field |

### Settings every question shares

| Setting | Evidence | Proposal |
|---|---|---|
| Title + rich-text details | EV Details editor; CI `context` | One title + rich help, with a product-set toolbar |
| Required | EV, CI | Required / optional, plus "make all mandatory" |
| **Who answers** | EV subtypes (code) | **Defined by relationship to the record**, never by fixed role names: the **initiator** ("Normal follows the initiator"), the **subject** (Reflection), **participants by permission level** (Third Party = View; Any Evaluator / Anyone = Record), **no one** (Read Only), or **the system** (Auto, Computed Only). Products supply their relationships and permission levels. Each mechanism declares which answerers it allows (e.g. Attest can't be Read Only). Attest's "who signs" is the same setting |
| Comment / annotation | EV Allow Annotation; CI `comment` | Off / allowed / required |
| Evidence | EV Allow Attachments; CI `documentation` | Off / allowed / required + methods |
| Tags | EV Pre-Defined / Optional Tags, tags per option | Product extension (§5) |
| Presentation hints | EV background, title font, alignment, divider, control position | Token-restricted hints; products may ignore them |
| Special behaviour | EV Pass/Fail Critical, Overall Duration | Meaning flags (critical) and roll-up targets; exact semantics in the code dive |

---

## 5. Product extensions

Products plug their own systems into the Form Builder without sharing them. The Form Builder knows the *shape* of each setting and where its options come from. The product supplies the options and decides what they mean. Layers and placement tests are in [06](06-shared-vs-product.md).

### Where extensions attach

| Attaches to | Evaluations (code) | Check It | EHS |
|---|---|---|---|
| **Form settings** | Use For (Feature), Observation, privacy, name editing, self-evaluation restriction, sharing behaviour, JAC codes, **TS Tags** | Applies-to statuses, default cadence, checklist type | Additional features |
| **Question** | Pre-defined tags | Asset type for per-asset answers | Escalation role on person fields |
| **Option** *(new)* | Pre-defined tag on a Choose One/Any option | — | — |
| **Answer** | Optional tags; Paragraph Bank text | — | — |
| **Data source** | Tag catalogue, **TargetSolutions tag catalogue (live API)**, scale presets, JAC codes, permission levels | Asset types, entity statuses, stations | Org hierarchy, people, assets, risk matrix |
| **Rule outcome** | Course recommendation | Out of service, ticket, notify | Create a corrective action or follow-on form |
| **Publish impact** | Plans and instances using the form | Deployments using the version | Open records using the form |

### What an extension can do

| Behaviour | Example |
|---|---|
| Add an author-set value | Sharing behaviour; applies-to statuses |
| **Metadata only**: never shown to respondents | TS Tags, California JAC, Observation flag |
| **Inject a question at delivery** | CalFire JAC: several codes → a required pick-a-code question at the top |
| **Sync to an integration** | TS Tags sent to TargetSolutions on completion |
| Depend on other settings | Self-evaluation restriction only for Evaluation forms; Computed mode hides seven settings |
| Lock after publish | Sharing behaviour, Type, elapsed time |

Each extension declares its **name and wording**, **where it attaches**, **what the author sets**, **where its options come from** (fetched live, stored as references), **conditions** (when it's shown), **lock-after-publish**, and a **publish check**.

---

## 6. Form setup and structure (proposed, not yet decided)

### Setup
| Layer | What it is | Who defines it | EV evidence |
|---|---|---|---|
| Identity | Name, description, folder | Author | Name, Description, Folder |
| **Kind** | Product form type. Brings subject type, relationships, product settings, locked system fields | Product | Use For (Feature) |
| **Mode** | **Normal / Read-only / Computed**: whether anyone answers, and how | Shared (core) | Type (locked after publish) |
| **Initiator** | Who can start an instance (e.g. evaluator or evaluee). It decides who "Normal" questions belong to | Kind default | "Normal follows the initiator" |
| **Template** | Editable starting content of a kind | Authors | Scale presets; library |
| Relationships | Nested in, creates follow-on forms, allowed parents | Kind default; author adjusts | — (EHS, CI) |
| Availability | Who may fill a published form (restricted lists) | Product (assignment-adjacent) | Publish-Restricted access lists |

### Structure
```
Form (Kind + Mode + setup)
└── Section            ← navigation, layout (1–2 columns), Timer scope, rules
    └── Item           ← Question | Display | Block (reusable, sealed) | Repeat | Nested
```
- Sections are the only required container. **Blocks are the only unit of reuse.**
- Repeat and Nested are items, so they can contain each other.
- **Delivery decides pages vs. a wizard.**

### Completion is derived from the definition
Products compute completion from definition data. For example, EV goes Created → Shared → Submitted → Completed, driven by:
- **required** questions
- **required signatures** under the form's **locking mode**
- product rules such as sharing being required

The definition carries everything needed for that calculation. The Form Builder never computes status.

### Hooks into product assignment (D2)
1. **Publish impact:** the product reports what uses a form or version.
2. **Discoverability:** the product lists published forms of a kind, respecting availability restrictions.

The hand-off is the published form's **ID + version + kind + mode**, plus its subject type and roles.

---

## 7. Draft requirements

**M** = Must, **S** = Should, **C** = Could. All priorities are proposals.

### 7.1 Mechanisms and definition
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-M-01 | Questions are built from the core mechanisms (§4); one vocabulary, nothing translated between authoring and delivery | SB | M |
| FB-M-02 | Mechanisms expose customization dimensions; products define **presets** | all | M |
| FB-M-03 | Mechanism contract: config schema, inspector panel, defaults, validation, allowed answerers, canvas summary, preview | — | M |
| FB-M-04 | Stable question IDs, separate from labels; reporting keys on ID | CI, EV | M |
| FB-M-05 | Every authorable setting is part of the output contract; a profile hides settings its product can't honour | SB | M |
| FB-M-06 | Scales: up to 8 levels; per-level value, title (128), description (4,000), colour, exclude from averages, rules; presets; per-question descriptors; linked or copied | EV | M |
| FB-M-07 | **Who answers**: relationship-based (initiator, subject, participants by permission level, no one, system), with per-mechanism allowed values | EV | M |
| FB-M-08 | Legacy mapping: every EV type and subtype, CI response type and EHS field type maps to a mechanism + preset + who-answers value | all | M |
| FB-M-09 | Choice options carry an optional **numeric value**, **exclude from averages**, **meaning** (fails / critical) and **tags** (D8) | EV, CI | M |
| FB-M-10 | Attest: typed / drawn, required, who signs, **form-level locking mode** (signer / all / prior), notify when ready, show on to-do list | EV | M |
| FB-M-11 | Calculate: guided expression builder, validations, hidden, may update after lock | EV | S |

### 7.2 Product profiles and extensions
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-P-01 | A **profile** per product sets the mechanisms, presets, settings and vocabulary its authors see | — | M |
| FB-P-02 | **Extensions** at form, question, **option**, answer, data-source, rule-outcome and publish-impact level (§5) | all | M |
| FB-P-03 | Product **vocabulary** throughout (D4) | all | M |
| FB-P-04 | Kinds bring locked system fields and blocks | EHS, EF | M |
| FB-P-05 | Extension options are fetched live (e.g. the TargetSolutions API) and stored as references, with a publish check | EV | M |
| FB-P-06 | Extension behaviours: **metadata-only**, **injected question at delivery**, **integration sync** | EV | M |
| FB-P-07 | **Conditional settings**: settings show only when they apply (by kind, mode, feature flag, other settings) | EV | M |

### 7.3 Structure and reuse
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-S-01 | Form → Sections → Items (§6) | CI, EF | M |
| FB-S-02 | Reusable blocks: library, categories, multi-use with context labels, sealed order | CI, EV | M |
| FB-S-03 | Link states template → block → unique, with "break link" confirmations | CI, SB | S |
| FB-S-04 | Locked system fields alongside custom questions | EHS, EF | M |
| FB-S-05 | Repeat and Nested (§4) | EHS, CI, EF | M |
| FB-S-06 | Timer at form, section, block or Repeat row scope; also as a per-question timer | EV | S |
| FB-S-07 | Folders and copy-to-start in the library | EV, CI | S |
| FB-S-08 | Layout hints (1–2 columns, control position) where reading order = authored order | EF, EHS, EV | M |
| FB-S-09 | **Form mode** (Normal / Read-only / Computed) and **initiator** in setup | EV | M |

### 7.4 Rules
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-R-01 | One declarative model: **when (answer) → then (show, hide, require, enable, fail, set label, trigger outcome)** | all | M (model) / phased |
| FB-R-02 | Fail rules: range, under par, failing options, binary meaning, expected-value mismatch (soft) | CI, SB | M |
| FB-R-03 | Answer-driven requirements: level → duration or annotation; fail → comment or evidence | EV, CI | M |
| FB-R-04 | Cascading lookups and auto-fill | EHS | M (EHS) |
| FB-R-05 | Calculations: formula, matrix lookup, tally, external | EV, EHS, EF | S |
| FB-R-06 | Rule outcomes registered by products | CI, EHS, EV | M |
| FB-R-07 | The rule graph is validated at publish | — | M |
| FB-R-08 | A plain-language rule summary on each question | CI | S |

### 7.5 Authoring experience
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-A-01 | Canvas + inspector with the whole form visible; no one-question-at-a-time modals | EV, CI | M |
| FB-A-02 | Drag **and** keyboard reorder (WCAG 2.1.1) | CI | M |
| FB-A-03 | Live preview **per respondent** (initiator, subject, other roles) and per device, plus a test run | EV, CI | M |
| FB-A-04 | Add, duplicate, delete, undo; dirty tracking; exit confirmation | SB | M |
| FB-A-05 | Quality checks before publish: placeholder labels, empty options, broken rules, min > max, spelling | EHS, SB | M |
| FB-A-06 | Optional content review before publish | EHS, EF | S |
| FB-A-07 | Bulk edits | CI | S |
| FB-A-08 | Scales to forms of 1,000+ items | CI | M |
| FB-A-09 | Entry points from each product ("Create", "Edit") (D3) | — | M |
| FB-A-10 | Settings grouped and explained; **warn before publish** about settings that will lock | EV | M |

### 7.6 Versions and publishing
| ID | Requirement | Src | Pri |
|---|---|---|---|
| FB-V-01 | Lifecycle: draft → published → superseded / archived; **a draft of a published form** can be edited without affecting live instances | CI, EV | M |
| FB-V-02 | Products pin to ID + version | CI | M |
| FB-V-03 | Blast radius from publish-impact extensions; compliance warnings | CI, SB | M |
| FB-V-04 | "Keep identity vs. start a new series" when a question changes | CI | S |
| FB-V-05 | Audit log of definition changes | EV | S |
| FB-V-06 | Each setting declares whether it **locks after publish** | EV | M |
| FB-V-07 | **Restricted availability** (EV Publish-Restricted) as product-supplied access rules | EV | S |

### 7.7 Accessibility and design system
| ID | Requirement | Pri |
|---|---|---|
| FB-X-01 | The authoring experience meets WCAG 2.2 AA | M |
| FB-X-02 | The definition carries what delivery needs for accessibility | M |
| FB-DS-01 | Built on current Vector core/themes; resolve `vaadin-popover` and `vwc-drawer` gaps first | M |

---

## 8. Definition schema (draft output contract)

```js
FormDefinition {
  schemaVersion, id, version, status: 'draft'|'published'|'superseded'|'archived',
  product, kind, mode: 'normal'|'readOnly'|'computed',
  initiator: [ relationship ],               // who can start an instance
  name, description, folder,
  signing: { lockMode: 'signer'|'all'|'prior' },
  timer?: { scope:'form', max?, editable:true },
  productSettings: { [extensionId]: value }, // form-level extensions (incl. metadata-only)
  relationships?: { allowedParents:[kind], spawns:[formId], nestableIn:[kind] },
  sections: [{ id, title, help, layout, locked, timer?,
               items: [ Question | Display | BlockRef | Repeat | Nested ] }],
  rules: [ Rule ],
  references: { scales:[{id, linked:true|false}], blocks:[{blockId, version}] },
  meta: { createdBy, publishedBy, publishedAt, sourceTemplateId, supersedes? }
}

Question {
  id, mechanism, preset?,
  title, details, required,
  answeredBy: { relation:'initiator'|'subject'|'participants'|'none'|'system',
                permission?:'view'|'record', excludeSubject?:boolean },
  config: { …mechanism dimensions },          // e.g. choice.options[{ id, label, value?, excludeFromAverages?, meaning?, tags? }]
  capture: { comment:'off'|'allowed'|'required',
             evidence:{ mode:'off'|'allowed'|'required', methods:[…] } },
  extensions: { [extensionId]: value },
  presentation?: { background, titleFont, align, divider, controlPosition, columns },
  locked?: boolean
}

Rule { id, when:{ questionId, op, value }, then:[{ effect, target, args }] }
```

Answer and record shapes are product-owned. Products key answers on question ID and definition version.

---

## 9. What the definition must carry for each product's delivery

| Delivery behaviour (product-owned) | Product | Carried by |
|---|---|---|
| Completion computed (EV Created → Shared → Submitted → Completed; CI gated submit) | EV, CI | `required`, Attest questions, `signing.lockMode`, product settings (sharing) |
| Signing locks (signer / all / prior) | EV | `signing.lockMode` |
| Who may answer each question | EV | `answeredBy`, `initiator` |
| Read-only and computed forms | EV | `mode` |
| Injected questions (CalFire JAC) | EV | Form extension value |
| Integration sync (TS Tags) | EV | Metadata-only extension |
| Fail → out of service / ticket / notify | CI | Rule outcomes |
| Answer per asset; nested checks | CI | Repeat (per subject), Nested |
| Child record prefilled from its parent | EHS | `relationships`, inherited fields |
| Follow-on forms created on save | EHS | Choice option → Nested trigger |
| Desktop page vs. mobile wizard | EHS | Sections in authored order |
| Reporting by question, tag, scale, averages | EV | Stable IDs, option and level values, exclude-from-averages, references |
| Records pinned to their version | CI | ID + version |

---

## 10. Open questions

**For decision (discovery)**
1. Preview: a generic reference preview, or one supplied by each product?
2. Location: its own mechanism, or a capture method shared with Evidence?
3. Rich text: an option on Text, or its own mechanism?
4. Observation matrix: a Repeat shown as a grid, or its own mechanism?
5. Kind / Mode / Template split and setup layers (§6): agree?
6. Who owns shared libraries (blocks, scales, tags): tenant, product, or both?
7. Scoring model across products (EV averages ratings and Pass/Fail values; what do CI and EHS need?).
8. Should the Form Builder keep EV's per-question Timer type, or fold it into Timer scopes?

**For the code dive:** see [05-code-dive-brief.md](05-code-dive-brief.md).

---

## 11. Next steps

1. Review this draft, [06](06-shared-vs-product.md) and the two companion pages with Evaluations, Check It and EHS product owners.
2. Run the code dive for Check It and EHS ([05](05-code-dive-brief.md)). Evaluations' first pass is in.
3. Decide the open questions in §10, starting with setup (Kind / Mode / Template).
4. Then define the Form Builder experience stage by stage: library and creation first.
