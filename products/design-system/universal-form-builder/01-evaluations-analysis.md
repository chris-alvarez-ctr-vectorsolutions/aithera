# Evaluations: form builder needs

> **How to read this.** The shared effort covers **authoring** only. Delivery (rendering, signing, sharing, approvals, records) stays with Evaluations. The runtime behaviour documented below is here to show **what an authored form definition must be able to express** (see 03 §9). It is not a list of things the shared workflow builds.

Paths are relative to `products/Evaluations/`. Unless a file is named, line numbers refer to `evaluation-form/ver1/index.html`.

- `ver2` has the same data model and renderer at different line numbers: `renderQuestion` is at ver2:5916. V2 adds reflow and target-size accessibility fixes and removes course recommendations.
- `course-recs/ver1–3` hold a copy of the same question showcase.

## 1. Where forms appear in Evaluations

| Form family | Who authors | Who fills | Mocked? |
|---|---|---|---|
| **Evaluation forms** (rubric observation, walk-through, mid-year/end-of-year, self-assessment) | District admin, via Admin › Forms › Library | Evaluator about an educator (the "Evaluee"). The educator fills self-assessments | Runtime only (`evaluation-form/`) |
| **PD Event Request form**, Custom Questions section | Admin, via PD Tracking › Programs / Form Sections | Event author, then reviewed by approvers | Runtime only, with placeholder questions (`event-forms/`) |
| **Feedback forms** | Admin (PD Tracking › Feedback) | Event attendees | Not mocked. Referenced as Required / Optional / Disabled per event, with per-slot templates |
| **Evidence** submission | n/a | Attendee, reviewed by approver | Review side only (`manage-events/`) |

The admin navigation (`administration/landing-message/ver1/dashboard.html:405-426`, the frozen production IA) shows the **authoring areas the builder would replace or absorb**:

- **Forms**, with Paragraph Banks, Computed Reports and Library under it
- **Tags**
- **Plans** and Plan Assignments
- **Account Preferences › Color Scales**
- **PD Tracking**, with Programs, Form Sections, Feedback and Certificates under it

## 1a. EV+ form authoring today (code-confirmed)

**Sources:** EV+ admin screenshots (2026-10-14), plus two product documents in [`product-documentation/`](product-documentation/):
- *Evaluation Form Redesign (Backend Preferences)*
- *Question Subtype Definitions*

Both are reconciled against the TeachPoint form engine. **This section overrides earlier inferences** in this document, and anything in the mock that conflicts with it.

**Vocabulary:**
- **Rubric:** a form definition (`core/Rubric.java`), edited in the admin "Rubric Editor" (`admin/rubricedit.xhtml`, `RubricEdit.java`).
- **Userdata:** a filled-in instance.
- **Owner / author:** the user who started the instance.
- **Evaluee / subject:** the person being evaluated.

### Form settings
| # | Setting | Values (stored field) | Notes | Form Builder model (03) |
|---|---|---|---|---|
| 1 | **Use For (Feature)** | Evaluation (0, default), Coaching (1), Activity Tracking (3). `Both` (2) and `PD Tracking` (4) exist in the model but can't be selected (`feature_type`) | Pickers filter by feature. Only Evaluation forms work on mobile | **Setup value** (EV profile) |
| 2 | **Type** | Normal (0), Read-Only (1), Computed (2) (`type`) | **Locked after publish.** Read-Only = fully view-only; leaving discards the instance. Computed = answers auto-calculated. Read-Only and Computed hide settings 3–7, 9 and 10. Only Normal works on mobile | **Setup value** (EV profile); Read-Only and Computed set who answers for the whole form |
| 3 | Include Elapsed-Time Recording | on/off (`rec_elapsed`) | A form-level Start/Stop bar; H:M:S editable; has a maximum; force-stopped when the form closes; never blocks completion. Turning it on also turns on #4. **Locked after publish.** **Separate from the per-question Timer type** | **Timer**, scope = form |
| 4 | Observation Form | on/off (`observation`) | Classifies the instance for observation reporting and the mobile API. Doesn't change answering | EV extension (form metadata) |
| 5 | Allow Privacy Control | on/off (`allow_private`) | Owner-only On/Off toggle in the header. Private hides the form from the evaluee and suppresses notifications. Stored value is inverted | EV extension (form) |
| 6 | Allow Form Name Editing | on/off (`allow_rnameedit`) | Inline rename, subject to signature locks. Shows the original name when it's been renamed | EV extension (form) |
| 7 | Allow "Pass All" | on/off (`pass_all_button`) | Owner-only Pass All / Clear All for Pass/Fail questions, with confirmation | Core delivery hint |
| 8 | Prevent use for self-evaluation | boolean (`restrict_self_evaluation`); default comes from a district preference | Enforced in the **picker** (the form is hidden when user = subject), not at submit. Evaluation forms only | EV extension (form) |
| 9 | Sharing Behavior | Author can share (0, default), Any evaluator can share (1), Sharing disabled (2); plus **Required for form completion** (default **true**) | **Locked after publish.** When required, the form can't complete until it's shared | EV extension (form) |
| 10 | **Signature Behavior** | **Locks signer** (0, default) · **First signature locks all questions** (1) · **Locks all questions prior to the signature** (2) | Signing is gated on the required questions being answered (all of them, those before the signature, or the signer's own, depending on mode). Locks apply to questions, headings and attachments | **Attest** locking mode (form-level) |
| 11 | **JAC codes** | **California JAC:** code + duration, admin metadata only. **CalFire JAC:** 0, 1 or many codes, plus required and duration | CalFire with **several codes injects a pick-a-code question at the top of the form** (required if configured). Each subsystem is behind a district feature flag | EV extension: metadata + **injected question** |
| 12 | **Status** | Archived (0), Unpublished/Draft (1, default), Published (2), **Superseded** (3), **Publish-Restricted** (4), Deleted (−1, internal) | A form **can't return to Draft**. Publish-Restricted = fillable only by users on evaluator and evaluee access lists | Lifecycle (§7.6 of 03) |
| 13 | **TargetSolutions Tags** | A list of TS tags (ID + name) **fetched live from the TargetSolutions API**, stored on the form definition | **Invisible during fill-in.** Sent to TargetSolutions on completion. Behind the district feature flag `TARGETSOLUTIONS_INTEGRATION` + the PUBLIC domain | EV extension: **metadata-only + integration** |

**Completion is computed, not submitted by hand:** Created → Shared → Submitted → Completed. Three things drive it together:
- all required questions answered
- all required signatures signed (according to the Signature Behavior mode)
- the form shared, if sharing is required

**Owner-gated controls** (privacy, Pass All, sharing by role) are disabled in review, archived and imported states.

### Question settings (Add/Edit Question)

Every question type also carries: **Title** + rich-text **Details**, **Required**, **Allow Attachments**, **Allow Annotation**, **Pre-defined Tags**, **Optional Tags**. Appearance: background colour, title font, title alignment, divider line, and position of the answer control (underneath the title, the default, or next to it).

| Type | Type-specific settings |
|---|---|
| Heading, Instructions | Always Read Only. Instructions have rich-text details |
| Text Entry | **Max length**, **watermark** (placeholder) |
| Rating Scale | Up to **8 ratings**: numeric **value**, **title** (required, 128 characters), **description** (4,000 characters), **Exclude from averages report**, **Require Duration**. **Choose scale** presets: 2–8 Level, plus named frameworks |
| Choose One | **Text input for selection** ("Other"), **pre-defined tag on an option**, format **dropdown or column list**, **1–4 columns** |
| Choose Any | 1–4 columns, text input for selection, pre-defined tag on an option |
| Date, Time, Date/Time | Standard settings only |
| Signature, Signature (non-locking) | Required, **Hand Drawn**, **Notify when ready for signature**, **Show on to-do list when ready**. Who signs = the subtype |
| Computed | **Computed Expression Wizard**, **validations**, **Hidden**, description (not visible) |
| Scripting | Rich text, attachments, tags (default subtype: Any Evaluator) |
| Video | Rich text, tags (default subtype: Anyone) |
| **Pass/Fail** | **Special behaviour: None / Critical / Overall Duration.** Each option has an editable **title**, **numeric value**, description and **Exclude from averages report**, so Pass/Fail answers are averaged like ratings |
| Duration | Special behaviour: None / Overall Duration |
| Timer | A per-question type. It's in the engine's subtype matrix but missing from the admin dropdown screenshot (to confirm) |

**Rich text in the builder:** font size (small / normal / large / huge), bold, underline, text colour, text background colour, numbered and bulleted lists, indent, alignment, hyperlink, image. Rich text options during fill-in are configured separately.

### Question subtypes = who can answer

A subtype **never changes how a question looks.** It decides **who may answer**, relative to the record:

| Subtype | Who can answer |
|---|---|
| Normal | The **author** (whoever started the form). **"Normal follows the initiator"**: on an evaluee-started form, the evaluee answers |
| Reflection | The **evaluee** |
| Third Party | Users with **View** permission, other than the author and evaluee (e.g. secondary evaluators, supervisors) |
| Any Evaluator | Users with **Record** permission, except the evaluee |
| Anyone | Users with **Record** permission, including the evaluee |
| Read Only | No one (display text, instructions, examples) |
| *Auto* (system) | The system fills it |
| *Computed Only* (system) | A formula fills it, and it **can update even after the form is locked** |

**Allowed per type (enforced by the engine):**
- Headings and Instructions: Read Only only.
- Signatures and Computed: never Read Only.
- Script and Video: Normal, Any Evaluator and Anyone only.
- Every other type: all six.

**Signatures use the same logic:** "who signs" is chosen exactly like "who answers".

### Authoring pain visible today
- Questions are added **one at a time in a modal**, with no view of the whole form.
- **Preview** is a separate step.
- Scale levels are typed per question (presets help, but copy vs. link is unknown).
- Settings are a **long flat list** whose availability depends on other settings (Type, Feature).
- Several settings **lock after publish** without warning in the UI.

See 03 §2.

### The Forms list (screenshot, 2026-10-22)
EV+ keeps this list; the Form Builder starts from it (03 §6). The list will be redesigned by EV+ in the design system.

| Part | What it shows |
|---|---|
| Header | Search with a filter button, **Edit Columns**, **Actions**, **Add Form** |
| Status chips | **Unpublished**, Published, **Publish-restricted**, each with a count. EV+ says "Unpublished" where the docs say Draft |
| Folders | Folder rows in the list ("Observations") and an "All Forms" breadcrumb; **Move To** on each row |
| Columns | Name, **Vers.**, **Form Rec** (filled-in records), **Plan Use** (plans using it), Status (a link). Use for is not a default column |
| Row menu | Edit, **Copy**, **Preview**, Move To, **Manage Alias**, Export PDF, Export CSV, Export XML |
| Actions menu | **Import from file**, **Import from data**, **Reorder forms** |

What it adds to the model:
- **Copies per occurrence.** "PDP Form (Teacher)" exists four times (Second, Third, Fourth Occurrence): the same form filled out at set intervals, copied once per interval. The duplication looks like it comes from the plan model, not authoring. It also splits reporting: each copy is a separate form, so a question can't be followed across intervals (P4). Research C2.
- **Forms move between districts as files** (Export XML, Import from file). Libraries can stay separate per district with import as a copy, but a form built from linked blocks or scales needs a rule for what travels with it (P6).
- **Preview from the list** without opening the editor should be the same preview as the builder's (P1).
- **Manage Alias**, **Import from data** and **Reorder forms** are unknown: code dive EV27–EV29.

## 2. Question types: evaluation forms

`renderQuestion` has exactly 19 branches (6497-6880, confirmed in DEV-NOTES.md:56-80).

### Common settings (every type)
| Setting | Values | Source |
|---|---|---|
| `title` | text | `wrapStandard` 6884 |
| `detailsHtml` | rich text with paragraphs, links and images | 6044-6049 |
| `bg` | `bg-d1`…`bg-d4`, `bg-neutral`, `''` (presentation fill) | 53-59, 783-842 |
| `layout` | `'under'` (default) or `'next-to'` (title in a left column) | 6488-6495 |
| `divided` | boolean; draws a rule above the question | 6488-6495 |
| `extras` | boolean; adds a per-question **Tags + Attachments** action bar | 5964, 5934-5941 |
| `required` | shown in the course-recs copy (`course-recs/ver3:6801-6812`); not used in evaluation-form | — |

### Type catalogue
| # | `type` | Captures | Config | Notes |
|---|---|---|---|---|
| 1 | `instruction` | nothing (display) | `align` (left / center / right), `size` (sm / lg) | 6498 |
| 2 | `heading` | nothing (display) | `align` | Used as a section divider because there are no real sections. 6507 |
| 3 | `rating` | one level index, plus optional notes | `component {id, title, footnote?, levels[], cells[]}` holds a rubric descriptor for each level. Also `labelOverride`, `conditional`, and `requirements {levelIdx: {annotation, duration}}` | Level colours come from `RATING_COLORS` (5876). Rubric structure is Domain › Indicator › Component (`DOMAINS` 5365). 6897-6975 |
| 4 | `text-entry` | string | `multiline`, `placeholder` | Bug: one seed item uses `variant:'multi'`, which is ignored. 6517 |
| 5 | `choose-one` | one choice | `choices[]`, `name`, `variant:'dropdown'` + `placeholder` | Shows radio buttons, or a dropdown when `variant` is set. 6524 |
| 6 | `choose-any` | array of choices | `choices[]` | 6547 |
| 7 | `date` | date | — | 6560 |
| 8 | `time` | time | — | 6563 |
| 9 | `datetime` | date + time | — | 6566 |
| 10 | `timer-start` | elapsed time (paired) | `timerId` | Other questions can sit between the start and stop halves, and either half controls the timer. After stopping, the time can be edited manually (H/M/S). 6573-6615, 8206 |
| 11 | `timer-stop` | (paired with 10) | `timerId` | |
| 12 | `signature` (locking) | signer name + timestamp | `signer` slot, `label` | Shows a "Locking" badge and has no Clear. The lock is **not actually enforced**. 6616, 7884 |
| 13 | `signature-nonlocking` | name + timestamp, or a drawn PNG | `draw:true` switches to a canvas pad | Has Clear / re-sign. 7921, 9425 |
| 14 | `computed` | read-only value calculated from answers on this form | `value` | **No formula model.** The value is hard-coded `'3.42'`. 6648 |
| 15 | `computed-value` | read-only value from an outside workflow | `valueType: 'score' \| 'text'`, `value` | 6656 |
| 16 | `passfail` | pass / fail | — | Uses plain buttons. 6665 |
| 17 | `duration` | H / M / S | fixed limits | 6677 |
| 18 | `script` | chat-style transcript | `scriptId`. Speakers are set globally: `{id, trigger:'T'/'S', label, side, icon, accent}` | Messages can have tags and nested replies. 6688-6774 |
| 19 | `video` | uploaded video plus timestamped annotations | `videoId`, `duration` | Comes from an upload or Google Drive. Annotation shape is `{id, t, text, addedAt}`. 6775-6880 |

### Legacy backend type list (the authoritative "existing" set)
`course-recs/_planning/quick-search-report-value-map.md:40, 70-77` lists the `Question.QTYPE_*` values:

> Text Entry, **Third-party Text Entry**, Single Select, Multiple Select, Rating Scale, Pass/Fail, Timer, Duration, Script, **Video Tag**, Date, Time, DateTime, Computed

- Each answer can also carry **Annotations**, **Question Attachments** and **Tags**.
- **Third-party Text Entry** and **Video Tag** are not in the mock showcase. The code-confirmed docs (§1a) show Third Party is a subtype (who can answer). Video Tag is most likely the Video type (to confirm).
- The legacy stored answer row (`course-recs/_planning/form-change-log-value-map.md:35-66`) has these columns: `rating_id`, `value`, `text`, `text_duration`/`is_duration`, `date_value`, `int_value`, `range_start`/`range_end` (video), `is_annotation`, `is_comment` (Note vs Comment), `signature_userdata_id` (drawn signature), and `rdorder`.

### What does *not* exist on any question (in the mock)
*The EV+ admin (§1a) corrects two items: **Required** exists per question, and scale size is configurable (2–8 levels, with "Exclude from averages report" acting like N/A).*
- Per-question `required` in the mock (except in the course-recs copy). **Exists in production.**
- N/A
- Points or weights. Production scale levels do carry numeric values.
- Default values
- Min/max or length limits
- A configurable scale size in the mock. **Production supports 2–8 levels.** Reports show scales with 4 levels and with 2 (Observed / Not Observed) (`reports/index.html:1123-1180`)
- Help text separate from `detailsHtml`
- A general comment field: only rating notes and the extras bar exist

## 3. Question and field types: PD event forms

### Custom Questions (`event-forms/index.html:1323-1403`; identical in v2)
UPDATE-LOG.md says this section is a **placeholder only**. It is not a design proposal.

What it shows:
- Questions sit in titled **groups** laid out in a **2-column grid**. A `.full-width` class makes a question span both columns.
- Four types are shown:
  - short answer (`vaadin-text-field`)
  - single-select dropdown (native `<select>`)
  - long answer (`vaadin-text-area`)
  - multi-select checkbox list
- Read-only empty states read "No response", "No selection" and "None selected".

The legacy system behind this section has **two separate data models**, which must not be conflated (CSV A18):
- **Event Attributes**: event-level `SINGLE_SELECT` and `MULTI_SELECT` fields.
- **Custom Questions / Program Groups** (`groups.xhtml`): described as "the 8-type question system". **None of the reviewed files list the 8 types. Request them.**

### Fixed event fields: input patterns the renderer must support
These are system fields, not authored questions. They still show which **input primitives and behaviours** the shared renderer needs. Line numbers are in `event-forms/index.html`.

| Pattern | Example |
|---|---|
| Text, required text, "Optional" placeholder | Title*, Course # (839-842) |
| Text area | Description (846) |
| Multi-select combo box (required) | Subject Area*, Content (849-857) |
| **Rich-text editor**, collapsed until opened | Event Details: undo/redo, B/I/U/S, H1-H3, sub/superscript, lists, alignment, image, link, code, clear (861-903) |
| **Currency number**, `$` prefix, min 0, step 0.01 | Budget Allocated / Actual (914-928) |
| **Calculated field**, negative values shown in red | Budget Remaining (`updateBudget` 1712) |
| Select | Feedback: Required / Optional / Disabled (931) |
| **Checkbox that enables dependent fields** | Enable Reimbursement → Code / Subcode (939-943, 2232) |
| **Radio that swaps whole sub-sections** | Schedule Type: Single / Multiple (944-952) |
| Radio with an **inline number inside an option** | Max Attendees: Unlimited / "Limit to [N]" |
| **Repeating row group** with add and remove; remove is hidden when only one row is left | Event Credits rows: PH / ISH / GC, min 0, step 0.5 (2176-2229) |
| **Checkbox disabled until a condition is met**, with an explanatory tooltip | Credits Approval › By Presenter (1197-1210) |
| **Person picker**: search after 3 characters, result list, "Other" manual entry | Add Presenter (1890-1947) |
| **Rule builder**: repeatable `{params:[{name, values[]}]}` | Publish To (905-912, 2244-2400) |
| **File upload**: drop zone, per-file progress, cancel | Attachments (1405-1440) |
| **Recurrence**: freq, interval, ends after N or on a date (v2) | Session repeat (`index-v2.html:2096-2105`) |

Field behaviours that come only from the CSV:
- **Character limits** of 512, 1024, 10000 or 20000 depending on the field, applied by clamping input and showing a dismissible alert (B21).
- **Field visibility driven by privacy type** (A26).
- Values that **vary by time slot**, replacing one value (B22).
- **Author Can Edit** overrides for each field (A36).

## 4. Form structure

| | Evaluation form | Event form |
|---|---|---|
| Container | **Flat ordered `items[]`**. CSS says "No sections, no nested groupings — the builder has no concept of those" (770-771) | Fixed section cards, with titled groups inside the Custom Questions section |
| Sections | Faked with `heading` / `instruction` items plus a `bg` fill. Admin › Form Sections suggests **reusable sections** exist in the legacy authoring tool | Event Info › Scheduling › Custom Questions › Attachments |
| Conditional logic | Only **rating level → required annotation and/or duration** (`refreshConditionalReqs` 7001-7040). A banner reads "This rating requires extra information." | Show/hide sub-sections, enable/disable fields, and relabel or hide columns. See §3 and CSV A26, A27, A33, A34 |
| Repeating | None | Credit rows, sessions, presenters, permission rules |
| Calculated | `computed` / `computed-value` (no formula model) | Budget Remaining |
| Paired questions | Timer start/stop with questions in between | — |

## 5. Scoring

**The mock has no scoring model.** It has no points, weights, totals, thresholds, critical items or auto-fail.

What it does have:
- `LOW_RATING_MAX_INDEX = 1` (5817-5824) marks low ratings, but this only feeds course recommendations.
- "Pass all" (9748-9769) sets every rating to its top level and every pass/fail to Pass.
- `computed` implies scores exist, and **reports aggregate by question, tag, domain, pass/fail and rating scale** (`reports/index.html:1645-1690`).

The scoring model has to come from legacy behaviour or the PRD. It has not been designed.

## 6. Runtime, workflow and record behaviour

### Evaluation forms
- **There is no submit, by design** in the mock: "This is a living document" (4558-4560). Save always behaves as a draft save. *Production differs: completion is computed (Created → Shared → Submitted → Completed) from required answers, required signatures and sharing; see §1a.*
- The form counts as **created on first edit**. Before that the user can Cancel; after that they can Delete, which is a soft delete with Restore (9706-9725, 9863).
- **Multiple signers**: evaluator, teacher and acknowledgement slots. Each signature can also share the form (`shareOnSignHtml` 9900).
  - Signer identity is not checked.
  - There are no rules about signing order.
  - Locking does not actually lock the form.
- **Sharing** is one-way and cannot be revoked. A Privacy toggle sets the form to visible only to the author.
- **Change log** records every edit with Edits and Access tabs. Sources are WEB, SYNC, MOBILE API and AUTO, and switched-user edits are recorded as "X AS Y". Visibility depends on role (`form-change-log-value-map.md:205-219`).
- Other runtime features:
  - **Copy Form** (4629-4740): a new evaluee, date handling, which data to copy (all or author-only), and whether to copy signatures and attachments.
  - **Compare mode**: read-only side-by-side.
  - **Quick Search**: a report that searches across forms.
  - **Paragraph Bank**: canned text, not wired up in the mock.
  - Export to PDF and print.
- **Attachments** can be tagged, described and **moved between questions** (`reassignAttachment` 5946).
- Upload limits are shown but not enforced: 10 files, 120 MB per file, 1,200 MB per video (5998-6001).
- Mobile and offline sync exist in legacy, as shown by the SYNC source and "Sync Rejected".

### Event forms
- Role-based footers (`applyRole` 1743):
  - **Author**: Save Draft / Save / Submit.
  - **Approver**: Decline / Return to Author / Mark Reviewed / Save / Approve. There is a read-only approver variant.
- Read-only mode is a **chromeless label + value** rendering (`body.ro-mode`, CSS 502-573). The shared renderer needs this mode.
- The full legacy action set is in CSV A16/A23/A28-30/A39: APPROVE, APPROVE_AS_CO, DECLINE, REVIEW (three variants), RETURN_TO_AUTHOR, NOTIFY_AUTHOR, CANCEL/UNCANCEL, DELETE_DRAFT, UNDELETE, REIMBURSEMENT_APPROVE, CLOSE, SAVE_DRAFT.
  - These actions **skip validation**: SAVE_DRAFT, DELETE_DRAFT, RETURN_TO_AUTHOR, CLOSE, UNDELETE, CANCEL, NOTIFY_AUTHOR.
- Statuses: DRAFT, PENDING, ACCEPTED, PENDING_CO_APPROVAL, WAITING_REVIEW_EVALUATOR, INCOMPLETE, DELETED, CANCELLED. The list is not complete (A37).

## 7. Data model (as mocked)

```js
// Evaluation question item (6141-6166)
{ type:'rating', component, divided:true, layout:'under', bg:'', labelOverride:'…',
  conditional:true,
  requirements:{ 0:{annotation:true,duration:true}, 1:{…}, 2:{annotation:true,duration:false}, 3:{…} } }
{ type:'choose-one', title, detailsHtml, choices:['A','B','C'], name:'…', variant?:'dropdown' }
{ type:'timer-start', timerId:'timer-1', … }

// Rubric component (5378-5385)
{ id:'1A.1', title, footnote?, levels:['Unsatisfactory','Development Needed','Effective','Exemplary'], cells:[…4] }
```

The form has **no definition object**; it is just a bare `items[]` array. Answers are spread across separate stores:

- `ratings`
- `conditionalReqs`
- `scriptLogs`
- `videoNotes`
- `stepExtras`
- `attachmentsById`
- `signatures`

The universal builder should replace these with a **single answer envelope per question**.

## 8. Design-system notes

- The evaluation-form mock loads **core v1.19.0 / themes v1.5.0**, which is older than the CONTEXT.md minimums. It was audited against v1.22.3 / v1.9.3: 22 covered, 6 partial, 0 gaps (mock-definition.md:159-218).
- **Custom-built (no Vector component):**
  - Rating tiles: a deliberate choice; implemented as `role="radio"` inside a `radiogroup`
  - Pass/fail buttons
  - Signature block and drawing pad
  - Computed card
  - Attachment cards
- **Risk:** `vaadin-popover` is not in the v1.22.1+ docs, and four menus depend on it (mock-definition.md:243-248).
- Drawer gaps are documented in `evaluation-form/DESIGN-SYSTEM-GAPS.md:13-108`: anchoring, scrim, width, event detail and scroll-lock.
- **Accessibility work so far covers only Reflow (1.4.10 at 320px) and Target Size (2.5.8).** Contrast, keyboard, focus order and screen-reader support were left to dev (mock-definition-a11y.md:52-63). Below 980px, rating tiles stack one per row as a hard rule.

## 9. Evaluations-specific open questions relevant to the builder

From `evaluation-form/mock-definition.md:241-287` and the event-forms CSV:

1. Should `computed` and `computed-value` be merged? Should `signature` and `signature-nonlocking` become one type with a mode?
2. ~~What does a locking signature lock?~~ **Answered (code):** a per-form Signature Behavior with three modes: locks the signer, first signature locks all, or locks everything before the signature. See §1a.
3. ~~Submit step?~~ **Answered:** production computes completion (Created → Shared → Submitted → Completed); see §1a.
4. What are the 8 Program Group question types? How do Event Attributes and Custom Questions converge, if they do?
5. ~~Third-party Text Entry~~ **Answered:** the Third Party subtype (View permission). Video Tag is most likely the Video type; to confirm ([05](05-code-dive-brief.md)).
6. Is Paragraph Bank a reusable-text library that the builder should own?
7. What is the scoring model: rating-scale roll-ups, the formula for `computed`, colour scales?
8. How should offline/sync conflicts be handled? The legacy SYNC and MOBILE API sources imply they happen.
9. Who owns the permission model for authoring, sharing and approving?
