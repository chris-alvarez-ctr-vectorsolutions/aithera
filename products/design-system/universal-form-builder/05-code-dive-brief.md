# Form Builder: code-dive brief

**For:** engineering leads on Evaluations (EV+), Check It and EHS · **Status:** Draft v1 · **Updated:** 2026-10-14

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

Screens reviewed: Form setup (Name, Folder, Description, Use For, Type, flags, Sharing, Signature, Reimbursement, Status) and Add/Edit Question (type list, subtypes, rating-scale editor, appearance).

**Question types and subtypes**
| # | Question |
|---|---|
| EV1 | The full subtype list for every question type. Text Entry has Normal, Reflection, Third Party, Read Only, Anyone and Any Evaluator. What does each one control? |
| EV2 | Is the legacy "Third-party Text Entry" the Text Entry › Third Party subtype? Is "Video Tag" the Video type? |
| EV3 | Timer: is "Include Elapsed-Time Recording" the only timing feature? The evaluation-form mock's start/stop timer pair isn't in the admin type list. |
| EV4 | Computed: how is the value calculated, and where is the formula configured? |
| EV5 | What do Allow Annotation and Allow Attachments store, and how do Pre-Defined vs. Optional Tags differ at delivery? |

**Scales**
| # | Question |
|---|---|
| EV6 | Where are scale presets (2–8 Level, named 4-level frameworks) managed, and by whom? |
| EV7 | When an author picks a preset, is it **copied** into the question or **linked**? Can values and titles be edited afterwards? |
| EV8 | Do colour scales attach to a preset, or are they set separately? |
| EV9 | Do reports group by preset, or only by question? What does "Exclude from averages report" do? |
| EV10 | One preset name appears to be two names run together ("…Unsatisfactory4 Level - Distinguished…"). Is this a data issue? |

**Form settings**
| # | Question |
|---|---|
| EV11 | The full list of **Use For (Feature)** and **Type** values. Do event custom questions and feedback forms use this same admin? |
| EV12 | What does the **Observation Form** flag change? |
| EV13 | Sharing Behavior: what values exist, and what does "Required for form completion" enforce? |
| EV14 | Signature Behavior: what values exist besides "locks signer from further editing"? |
| EV15 | What do Reimbursement Code, Subcode and Duration feed, and where do codes come from? |
| EV16 | Status: is there anything beyond Unpublished / Published? |

**Assignment (product-owned, for the journey map)**
| # | Question |
|---|---|
| EV17 | How do Plans and Plan Assignments reference forms (by ID, by version, or by copy)? |
| EV18 | Do due dates, windows or reminders exist for plan forms? |
| EV19 | Program Groups: what are the 8 legacy question types, and how do Event Attributes relate to them? |

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
