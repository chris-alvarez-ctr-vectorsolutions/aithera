# EHS: form builder needs

> **How to read this.** The shared effort covers **authoring** only. EHS owns delivery: the mobile wizard, desktop single-page forms, offline sync, emails and record history. The runtime behaviour below is here to show **what an authored form definition must be able to express** (see 03 §6).

**Source:** the Claude Doc *EHS Form Inventory for Universal Form Builder Analysis* by Andy Xia, 2026-10-13 ([link](https://claude.ai/artifact/38tfiVgJ12bmwkGXTi2YnN)).
- The doc reads field types from screenshots; a red asterisk marks a required field.
- The test-environment values in it (Division D-051, Facility F-000051, checklist "another one") are placeholders.
- This file summarises that doc. The field-by-field tables and screenshots are kept in the doc itself.

Unlike Evaluations and Check It, the EHS desktop forms are **production** screens, not mocks. Only the JSA form is a prototype (mobile).

## 1. Forms reviewed

| Form | Platform | Shape | What it adds |
|---|---|---|---|
| **JSA** (Job Safety Analysis) | Mobile prototype | 6-step wizard built around **repeating Steps** | Risk scoring for each step (initial and residual), nested corrective actions, drawn signatures, offline sync |
| **Initial Incident** | Desktop, production | Long two-column single page | 13 required fields, yes/no screening questions, AI assist on the description, checkboxes that **create follow-on forms**, a full set of custom field types |
| **Corrective Action** | Desktop, production | Long single page, **child record** | Inherits context from its parent, asset lookup with an auto-filled card, three-level escalation chain |
| **Observation** | Desktop, production | **Pick a template**, then a form with a checklist matrix | Topic × response grid; counts tallied automatically |

Other form types are planned (Inspection, Hazard, Observation on mobile) but not built yet. Only JSA and Corrective Action have mobile forms.

## 2. Field types in use

| Type | Where | Maps to the 03 catalogue |
|---|---|---|
| Single-line text | All | `text` |
| Multi-line text (+ AI assist button on Incident Description) | All | `text` (`multiline`), plus an **AI assist** capability |
| Number | Incident custom field | `number` |
| Currency ($) | Incident and JSA custom fields | `number` (`prefix`) |
| Date (calendar; defaults to today) | All | `date` (`default: today`) |
| Time (hh:mm am/pm) | Incident, Observation | `time` |
| Dropdown (static list) | All | `choice-single` (dropdown) |
| Yes/No as a dropdown | Incident screening questions | `choice-single`, or a yes/no `complete`-style binary (see §5) |
| Ordinal-scale dropdown (Severity 1–5, Probability A–E) | JSA, Incident, CA | `choice-single` with a scale, or `rating` *(new: ordinal values feed a calculation)* |
| Type-ahead **person** search (can default to the current user) | Incident, CA, Observation, JSA signatures | `person-picker` |
| Type-ahead **entity** search (Facility) | All | **New: `lookup`** (org hierarchy) |
| **Lookup with an auto-filled detail card** (asset Unit Number → Category, Make, Model, Year, Lat/Long) | Corrective Action | **New: `lookup`** with `populates[]` |
| Checkbox list (multi-select) | Incident "Select Additional Incident Forms" | `choice-multi`, plus **spawns forms** (§4) |
| **Checkbox matrix row** (topics × Safe Act / Unsafe Act / Safe Condition / Unsafe Condition / Follow-up dropdown) | Observation | **New: `matrix`** |
| Calculated / read-only (Risk, tallies, inherited ids) | All | `computed` (formula) |
| Hyperlink | Incident custom field; CA link to its parent | **New: `link`** (display or input) |
| Static note | Incident custom field | `instruction` |
| Map / GPS picker ("Set Location") | Incident | **New: `location`** |
| Photo / file attachment | All | `file`, plus the documentation capability |
| Drawn signature with a "signing as" role | JSA | `signature` (`drawn`, `signerSlot`) |
| Repeating group (sub-form) with add / edit / delete / reorder | JSA steps | `repeating-group` *(must allow nesting, §3)* |

**Admin-configurable custom field types already in production** (Incident "New … Field 311–320"): currency, date, dropdown, search, hyperlink, note, number, text, textarea, time. These form the EHS baseline the shared workflow must at least match.

## 3. Structure

- **Fixed system fields mixed with custom fields.**
  - Every form has a core of fixed fields (Division, Facility, dates, Status…).
  - Admins can insert custom fields among them.
  - This confirms the locked-system-fields model (03, FB-S-09) is a real need, not a hypothetical one.
- **Shared header block:** Division, Facility, Section, Department, Location, Detailed Location, used across all four forms. The **org hierarchy** (Division → Facility → Section/Department/Location) filters the options in each field below it.
- **Risk block:** Severity × Probability → calculated Risk, each with an info tooltip.
  - It appears on three forms.
  - The JSA has it twice per step (initial and residual).
  - It is a strong candidate for a **reusable block with a configurable matrix**.
- **Additional Features bar:**
  - The bar can include Corrective Actions, Attachments, Emails and Signatures.
  - The set differs per form. For example, the CA form has no signatures and no nested CAs.
  - Open question: is this toggled per form by admins?
- **Repeating groups** exist only in the JSA (Steps). Each step holds its own attachments and **nested corrective actions**, so the builder needs **nested repeating groups** (step → hazard → control → CA?).
- **Layout:**
  - Desktop forms are long single pages with **two columns**, anchor navigation, and collapsible sections that each have a "Top" link.
  - The JSA on mobile is a **stepped wizard**.
  - The source doc notes that the two-column layout reads out of order: unrelated fields sit side by side, so tab order and mobile reflow need explicit rules.

## 4. Relationships between forms (new to this analysis)

| Pattern | Example | What the definition must express |
|---|---|---|
| **Template first, then form** | Observation: pick a checklist, which generates the form (checklist id passed in the URL). JSA: start from scratch or "apply existing tasklist" | Template/form references; a form whose content comes from a selected template |
| **Parent → child inheritance** | CA inherits Originating Type, System ID, Division and Facility from Incident, Observation or JSA | Fields marked **inherited from parent** (read-only or prefilled), and which parent types a form can belong to |
| **A form spawns forms** | Incident checkboxes create linked Investigation, Employee, Safety, Security or Environmental forms; Investigation is checked by default | A question whose options are **linked form definitions** |
| **Nested child records** | Corrective Actions created from a JSA step, a JSA, an Incident or an Observation | Embedding a child-form reference inside a repeating group |

Neither Evaluations nor Check It has these patterns. The closest is Check It's `nested-check`, which embeds a whole checklist for each asset.

## 5. Behaviours the definition must express

| Behaviour | Example |
|---|---|
| **Default values:** today, the current user, a fixed value ("Open") | Date Identified, Investigator, Primary Observer, Status |
| **Prefill from context:** the parent record or the user's org | CA Division and Facility |
| **Lookup populates other fields** | Asset Unit Number → detail card |
| **Calculated fields:** a matrix lookup and tallies | Risk from Severity × Probability; Observation Total, Safe and Unsafe counts |
| **Conditional screening** (assumed, not confirmed) | Incident yes/no questions (vehicle, injury, property damage) probably control which later sections appear |
| **Help tooltips** on fields | Severity, Probability, Risk, Investigator, Responsible Party |
| **Helper text** under fields | "For Overdue Notifications" |
| **Escalation chain:** people fields that carry notification meaning | Responsible Party → Second Level → Third Level, used for overdue notices |
| **Compliance flag and send-email toggle** on a record | Mobile CA: "Required for regulatory compliance", "Send Email Notification" |
| **AI assist on a text field** | Incident Description sparkle button. Unclear whether it generates, rewrites or summarises |

## 6. Delivery features (product-owned, recorded for context)

- **Offline-first mobile:** a "No connection" banner, a sync queue, sync-failed and can't-sync states, and a **conflict resolver** (pick a version, or Save as New). Downloads are configured by facility, date range and record type.
- **Record actions:** Save, Continue, Clone, Close, Print, Print Summary, Print Card; anchor navigation; a History Section (audit trail).
- **Records list** with filters: report type, status, upload status, ownership, sort.

## 7. Quality signals for authoring

From the source doc's observations:

1. **Placeholder labels reach production.** Fields named "New Currency Field 324" or "New Dropdown Field 313" are live, even in the mobile prototype. The authoring workflow must **block publishing with a default label**.
2. **Template text has typos** ("Exists and Aisles Clear", "Spills and Leakes"). This suggests authored content has **no review step**, which argues for an optional review/approval step before publish.
3. **Yes/No modelled as dropdowns** costs taps on mobile. Authors should choose a yes/no or segmented type, not a dropdown with two options.
4. **The observation matrix doesn't stack on mobile.** A matrix type needs a responsive presentation hint (e.g. one card per topic with response chips), which the product renders.
5. **The risk matrix is rebuilt three times.** A reusable block would prevent that.

## 8. EHS open questions relevant to the builder

From the source doc, plus implications for the shared workflow:

1. Do the Incident yes/no answers show or hide later sections, and can admins configure that logic?
2. Which Additional Features (Corrective Actions, Attachments, Emails, Signatures) can admins toggle per form?
3. What does the AI sparkle do: generate, rewrite or summarise? Should authors be able to turn it on per text field?
4. How are checklist templates authored and versioned today, and who owns the content?
5. What does the History Section record (audit-trail format)?
6. How deep do repeating groups go (step → hazard → control)?
7. Are the risk matrix's dimensions and labels (1–5 × A–E) configurable per tenant?
8. Do custom fields share a tenant-wide field library, or are they defined per form?
