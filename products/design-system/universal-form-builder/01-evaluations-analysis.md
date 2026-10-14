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

The admin navigation (`admin-ui/ver1/dashboard.html:405-426`, the frozen production IA) shows the **authoring areas the builder would replace or absorb**:

- **Forms**, with Paragraph Banks, Computed Reports and Library under it
- **Tags**
- **Plans** and Plan Assignments
- **Account Preferences › Color Scales**
- **PD Tracking**, with Programs, Form Sections, Feedback and Certificates under it

## 1a. EV+ admin authoring (seen in product)

Production screenshots of the EV+ admin, shared on 2026-10-14, show how forms are authored today. **These override earlier inferences** in this document and on the journey maps.

### Form setup screen
| Setting | Control | Form Builder model (03) |
|---|---|---|
| Name | Text | Core setup |
| Folder | Display ("All Forms"): forms are organised in folders | Core setup (library) |
| Description | Rich text (bold, italic, paragraph style) | Core setup |
| **Use For (Feature)** | Dropdown ("Evaluation") | **Kind** |
| **Type** | Dropdown ("Normal") | **Kind** |
| **Observation Form** | Checkbox | **Kind** (meaning to confirm) |
| **Include Elapsed-Time Recording** | Checkbox | **Timer**, scope = whole form |
| Allow Privacy Control | Checkbox | EV extension (form) |
| Allow Form Name Editing | Checkbox | EV extension (form) |
| Allow 'Pass All' option for Pass/Fail Questions | Checkbox | Core delivery hint |
| Prevent use for self evaluation | Checkbox | EV extension (form) |
| Sharing Behavior | Dropdown ("Author can share") + "Required for form completion" | EV extension (form) |
| **Signature Behavior** | Dropdown ("Signature locks signer from further editing") | **Attest** locking. Locking applies to *the signer*, not the whole form |
| Reimbursement Code, Subcode, Duration, Select Code | Text + code picker | EV extension (form) + code data source |
| **Status** | Radio ("Unpublished") | A publish state exists; versioning unknown |
| Save · **Preview** · Close | Buttons | Preview exists, as a separate step |

### Add/Edit Question (modal, one question at a time)
- **16 types:** Heading, Instructions, Text Entry, Rating Scale, Choose One, Choose Any, Date, Time, DateTime, Signature, Signature (Non-locking), Computed, Script, Video, Pass/Fail, Duration. There is **no Timer type** (timing is the form-level setting) and **no computed-value**. Both of those in the evaluation-form mock look like new design proposals.
- **Subtype** varies by type. Text Entry has: Normal, **Reflection**, **Third Party**, **Read Only**, **Anyone**, **Any Evaluator**. These look like *who can answer or edit*, which feeds the "who answers" setting (03 §4). "Third-party Text Entry" in the legacy data map is very likely this subtype.
- **Title** plus a **Details** rich-text body (underline, colour, highlight, lists, indent, alignment, link, image).
- **Required**, **Allow Attachments**, **Allow Annotation** (all on/off).
- **Pre-Defined Tags** and **Optional Tags** per question.
- **Rating Scale → Choose scale:** blank sizes **2–8 Level**, plus named 4-level presets (e.g. "Unsatisfactory / Development Needed / Effective / Exemplary"; "Highly Effective / Effective / Improvement Necessary / Ineffective"). Levels then appear as rows with:
  - **Value** (numeric, e.g. 4.0 → 1.0)
  - **Title** (required, 128 characters)
  - **Description** (optional, 4,000 characters)
  - **Exclude from averages report**
  - **Require Duration**

  Whether a preset is copied into the question or linked is unknown.
- **Question Appearance:** Background Color, Title Font, Title Alignment, divider line above, location of the rating scale selector ("Underneath the question title").
- Add · Preview · Cancel.

**Authoring pain visible in these screens:** questions are added one at a time in a modal with no view of the whole form; preview is a separate step; scale levels are typed per question; settings are a long flat list of checkboxes. See 03 §2.

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
- **Third-party Text Entry** and **Video Tag** are not in the mock showcase. The EV+ admin (§1a) suggests Third-party is a Text Entry subtype and Video Tag is the Video type. To confirm.
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
- **There is no submit, by design**: "This is a living document" (4558-4560). Save always behaves as a draft save.
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
2. ~~What does a locking signature lock?~~ **Answered by the EV+ admin:** "Signature locks signer from further editing", so it locks the signer, not the whole form.
3. Do evaluation forms ever need a submit step, or are they always living documents?
4. What are the 8 Program Group question types? How do Event Attributes and Custom Questions converge, if they do?
5. Third-party Text Entry and Video Tag: likely a Text Entry subtype and the Video type (§1a). To confirm in the code dive ([05](05-code-dive-brief.md)).
6. Is Paragraph Bank a reusable-text library that the builder should own?
7. What is the scoring model: rating-scale roll-ups, the formula for `computed`, colour scales?
8. How should offline/sync conflicts be handled? The legacy SYNC and MOBILE API sources imply they happen.
9. Who owns the permission model for authoring, sharing and approving?
