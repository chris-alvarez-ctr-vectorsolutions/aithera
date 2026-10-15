# Form Builder: code-dive brief

**For:** engineering leads on Evaluations (EV+), Check It and EHS · **Status:** Draft v1.1 · **Updated:** 2026-10-14

Discovery so far comes from mocks, prototypes and screenshots. This brief lists what we need confirmed from each product's **actual code and configuration** before the Form Builder model ([03](03-synthesis-and-requirements.md)) can be refined.

**For each product, please return:**
1. **The question / field type inventory:** every type, its **subtypes**, and every setting stored per type. For each subtype, say whether it changes the **input** (becomes a preset) or **who can answer or edit** (feeds "who answers").
2. **The form-level settings inventory:** every setting stored on a form, and what reads it at delivery.
3. **The answers to the product questions below.**

A table per product is fine: *type → subtypes → settings → where stored → what reads it*.

---

## Questions for every product

| # | Question | Why it matters |
|---|---|---|
| A1 | Where are form definitions stored, and what is the schema (tables or documents)? | Migration path to the shared definition |
| A2 | Is there versioning? When a published form is edited, do in-progress or completed records change? | Draft / publish / pinning (FB-V-01, FB-V-02) |
| A3 | How are question IDs assigned, and do reports key on ID or label? | Stable identity (FB-M-04) |
| A4 | What product systems do forms reference (tags, statuses, codes, org units, people, assets), and how — by ID or by copied text? | Product extensions (§5 of 03) |
| A5 | What uses a form once it's published (plans, deployments, records), and can that be queried? | Publish-impact hook |
| A6 | Who can author and publish forms (permissions)? | Authoring permissions |
| A7 | Any conditional logic (show/hide, require) today, even if hidden in configuration? | Rules model (FB-R-01) |

---

## Evaluations (EV+)

**First pass answered (2026-10-14)** by two code-reconciled product documents in [`product-documentation/`](product-documentation/): *Evaluation Form Redesign (Backend Preferences)* and *Question Subtype Definitions*. Findings are in [01 §1a](01-evaluations-analysis.md).

**Answered**
| # | Question | Answer |
|---|---|---|
| EV1 | Subtypes per type: what do they control? | **Who may answer**, relative to the record (author, evaluee, View / Record permission, no one, system). There's an allowed-subtype matrix per type |
| EV2 | Is "Third-party Text Entry" a subtype? | Yes: the Third Party subtype (View permission). Video Tag is most likely the Video type |
| EV3 | Timing features | A form-level Elapsed-Time bar (`rec_elapsed`, locks after publish) **and** a separate per-question Timer type |
| EV4 | How are Computed values calculated? | A **Computed Expression Wizard** + validations; Computed Only answers update after lock *(wizard behaviour still to detail)* |
| EV11 | Use For / Type values | Use For: Evaluation, Coaching, Activity Tracking (Both and PD Tracking exist in the model). Type: Normal, Read-Only, Computed |
| EV12 | Observation Form flag | Classifies the instance for reporting and the mobile API. Doesn't change answering. Turned on automatically by elapsed time |
| EV13 | Sharing Behavior | Author / any evaluator / disabled. "Required for form completion" (default true) blocks completion until the form is shared |
| EV14 | Signature Behavior | Three modes: locks signer, first signature locks all, locks all prior |
| EV15 | Reimbursement codes | **JAC codes**: California JAC (metadata) and CalFire JAC (0/1/many; several codes inject a required question) |
| EV16 | Status values | Archived, Draft, Published, Superseded, Publish-Restricted, Deleted. Can't return to Draft |

**Still open**
| # | Question |
|---|---|
| EV5 | At delivery, how do Pre-Defined vs. Optional tags differ? What does Allow Annotation store? |
| EV6 | Where are scale presets managed, and by whom? |
| EV7 | Is a chosen preset **copied** or **linked**? Can values and titles be edited afterwards? |
| EV8 | Do colour scales attach to presets? |
| EV9 | Do reports group by preset, or only by question? |
| EV10 | One preset name looks like two names run together. Is this a data issue? |
| EV17 | How do Plans and Plan Assignments reference forms (ID, version or copy)? |
| EV18 | Do plan forms have due dates, windows or reminders? |
| EV19 | Program Groups: what are the 8 legacy question types, and how do Event Attributes relate? |
| EV20 | **Pass/Fail "Critical"** special behaviour: what does it do (auto-fail the form? flag?) |
| EV21 | **"Overall Duration"** special behaviour on Pass/Fail and Duration: what does it roll up into? |
| EV22 | **Superseded**: how does a form become superseded, and what happens to in-progress instances? Is there any draft-of-published editing? |
| EV23 | Why is the **Timer** question type missing from the admin dropdown screenshot? Hidden by feature or mode? |
| EV24 | **Auto** subtype: what does the system fill, and when? |
| EV25 | **Publish-Restricted** access lists: where are they managed, and are they per form? |
| EV26 | Can Evaluation forms be started by the evaluee (initiator) for any Use For, or only some? |

---

## Check It

Most of Check It's model is visible in the Checklist Management design (02). These questions confirm what's built vs. designed.

| # | Question |
|---|---|
| CI1 | Which parts of the Checklist Management design exist in production today vs. are planned (blocks, link states, versioning, deployments, schedules)? |
| CI2 | The current production response types and their settings (the PRD says seven types; its table lists eight). |
| CI3 | How are failure actions (out of service, ticket, notify) configured and executed today? |
| CI4 | How do deployments reference checklists (ID + version)? Can "what uses this version" be queried? |
| CI5 | Asset registry: which asset types and statuses exist, and how would the Form Builder fetch them? |
| CI6 | Offline and mobile: what exists today, and what does the native app read? |

---

## EHS

Evidence so far: Andy Xia's form inventory (production screenshots + the JSA mobile prototype). The admin side was not seen.

| # | Question |
|---|---|
| EHS1 | Where and how do admins add custom fields? Are they defined per form or in a tenant-wide field library? |
| EHS2 | The full custom field type list and settings (we saw currency, date, dropdown, search, hyperlink, note, number, text, textarea, time). |
| EHS3 | Is there any publish, versioning or review step for custom fields or checklist templates? |
| EHS4 | Do the Incident yes/no screening answers show or hide later sections? Is that configurable? |
| EHS5 | Which Additional Features (corrective actions, attachments, emails, signatures) can admins toggle per form? |
| EHS6 | How are observation checklist templates authored and versioned, and who owns them? |
| EHS7 | Risk matrix: are its dimensions and labels (1–5 × A–E) configurable per tenant? |
| EHS8 | Parent → child: how does a corrective action inherit fields, and which parent types are allowed? |
| EHS9 | JSA: is an "existing tasklist" a template or a copied record? |
| EHS10 | What does the AI assist on Incident Description do, and is it configurable per field? |
| EHS11 | What does the History Section record? |

---

## What happens with the answers

Each answer either **confirms**, **corrects** or **adds to** the model in [03](03-synthesis-and-requirements.md). Confirmed claims lose their "Inferred" tag on the [journey maps](journey-maps/index.html). The type inventories become the legacy-mapping table (FB-M-08): every existing type and subtype → a mechanism + preset.
