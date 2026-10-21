# Form Builder: prototype build brief

**Status:** Passes 1–5 built, reviewable · **Updated:** 2026-10-21 · **Prototype:** [`prototype/`](prototype/) (versioned feature; design work in `prototype/ver1/index.html`)

> **Build status.** Passes 1–5 are built and verified in Chrome; every surface has a flow-map scene with a deep link. **Pass 6 (the EHS profile) is on hold** by decision on 2026-10-21: EHS stays an inferred profile in this brief until its code dive. The walkthrough script below is ready to run with Check It and Evaluations.

## Purpose

One clickable prototype of the shared form-authoring experience, walked through in two product vocabularies, to review the model in [03](03-synthesis-and-requirements.md) and [06](06-shared-vs-product.md) as a working thing rather than a document. Once it is stable it becomes the stimulus for the EV+ research ([research/](research/ev-plus-research-questions.md)).

**Decisions taken 2026-10-21**

- **Check It and Evaluations are first-class profiles.** EHS is a stress test added in the last pass.
- **Vector components when they fit, hand-rolled when they don't.** This is a design-system concept, so Vector is the default; a mechanism preview, a canvas or a change map is hand-rolled if no component is a real solution. Core v1.22.3 / themes v1.9.3 from the base template.
- **A new file, not a fork of the Check It mock.** Check It's prototype carries a product type list at its core (`RESPONSE_TYPES`, the trap in [07](07-check-it-technical-brief.md)). Its *patterns* and *seed data* are ported; the type system is rebuilt as mechanism + preset with profile-driven vocabulary from line one.
- **The walkthrough comes first.** Research validates it afterwards.

## Modelling assumptions

Open questions from 03 §10 resolved as prototype assumptions. Each is tagged so reviewers know it is a choice, not a finding. The walkthrough is where they get tested.

| # | Assumption | Replaces | Confidence |
|---|---|---|---|
| P1 | **Preview is a reference renderer owned by the Form Builder.** Products may substitute their own later | 03 Q1 | Proposal |
| P2 | **Setup = Kind + Mode + Template.** Kind comes from the profile and brings subject type, relationships, settings and locked fields. Mode (Normal / Read-only / Computed) is core. Template is editable starting content | 03 Q5 | Proposal, EV code-grounded |
| P3 | **Propagation policy is a profile setting.** Check It: a block publish updates every checklist using it. Evaluations: held, with a notice on affected forms until each is republished | PRD block publish vs. EV mid-year change | Proposal |
| P4 | **Question identity is separate from the per-version question ID.** A material edit asks "keep history" or "start a new series"; reports key on identity | FB-V-04 as Should | Proposal; PRD Q7 provisional |
| P5 | **Location and rich text are dimensions**, on Evidence and Text. **The observation matrix is a Repeat rendered as a grid** | 03 Q2–Q4 | Proposal |
| P6 | **Libraries are tenant-scoped per product.** No cross-product sharing of blocks, scales or tags | 03 Q6 | Proposal |
| P7 | **No scoring.** Values and exclude-from-averages are authored; nothing is computed in the prototype | 03 Q7 | Deferred |
| P8 | **Per-question Timer folds into Timer scopes**: form, section, block, Repeat row, or a single question | 03 Q8 | Proposal |

## Architecture of the prototype

Everything the builder edits is the definition schema from 03 §8, held in memory. The UI reads three registries and one profile.

```
PROFILE (per product, data)            REGISTRIES (shared, code)
  mechanisms on/off + dimensions          mechanisms[15]: config, inspector, defaults,
  presets                                   validation, allowed answerers, canvas
  kinds (+ locked system fields)            summary, preview
  vocabulary                              extensions: 7 attachment points
  relationships + permission levels       rules: when → then (show/hide/require/
  propagation policy                        fail/outcome/set label)
  extensions in use
                 │                                    │
                 └──────────► BUILDER UI ◄────────────┘
                                  │
                          FormDefinition (03 §8)
                                  │
                        reference renderer (preview)
```

A **profile switch** in the toolbox dock swaps the whole experience between Check It and Evaluations without reloading, so the walkthrough can show the same shell wearing both vocabularies.

## Profiles

### Check It (code-grounded through the Checklist Management mock and PRD)

| Layer | Contents |
|---|---|
| Vocabulary | checklist, section, step, content block, deployment, perform, publish |
| Kinds | Apparatus check, Station check, Equipment check, Capital equipment check. Subject = the entity type |
| Mechanisms on | Display, Choice, Measure, Text, Attest, Evidence (as capture), Repeat (per asset), Nested |
| Presets | **Pass/Fail step** (binary Choice, Fail means fails, comment required on fail, Yes/No relabel), **Complete/Incomplete** (binary, no fail meaning), **Select** (single, fail-marked options, "Other" requires comment), **Numeric** (Measure with accepted range → fail), **Count vs. par** (Measure, under par → fail), **Signature** (Attest, drawn) |
| Who answers | Initiator only (the performer). Not shown in the inspector |
| Mode | Normal only |
| Propagation | Auto-follow on block publish |
| Extensions | Form: applies-to statuses, default cadence, AI voice, eligible for nesting. Question: asset type for per-asset answers. Data source: asset registry. Rule outcomes: out of service, create ticket, notify. Publish impact: deployments using the version |
| Lifecycle | Draft → Published → Archived; version pinning; blast radius |

### Evaluations (code-confirmed, 01 §1a)

| Layer | Contents |
|---|---|
| Vocabulary | form, section, question, rubric domain (block), plan, evaluator, evaluee |
| Kinds | Evaluation, Coaching, Activity Tracking. Subject = the evaluee |
| Mechanisms on | Display, Scale, Choice, Text, Measure (Duration), Date & time, Attest, Calculate, Script, Evidence, Timer, Repeat (not in use), Nested (growth plan, proposal) |
| Presets | **Rating Scale** 2–8 levels with value, title, description, exclude from averages, require duration; named frameworks (Danielson 4-level). **Pass/Fail** as binary Choice with values and Critical. **Choose One / Choose Any** with dropdown or 1–4 columns, "Other" text, tag per option |
| Who answers | Initiator (Normal), subject (Reflection), participants by permission: View (Third Party), Record except subject (Any Evaluator), Record incl. subject (Anyone), no one (Read Only), system (Auto, Computed Only). Per-mechanism allowed matrix from the subtype PDF |
| Mode | Normal / Read-only / Computed; locks after publish |
| Signing | Lock mode: signer / first locks all / locks prior. Notify when ready, show on to-do |
| Propagation | Hold and notify |
| Extensions | Form: Observation flag, privacy, name editing, Pass All, self-evaluation restriction, sharing behaviour + required for completion, JAC codes (CalFire injects a question), TS Tags (metadata, live catalogue). Question: pre-defined tags. Option: tag. Answer: optional tags, Paragraph Bank. Publish impact: plans and instances |
| Lifecycle | Draft → Published → Superseded / Publish-Restricted / Archived; cannot return to Draft |

### EHS (inferred from the inventory doc; pass 6 only)

| Layer | Contents |
|---|---|
| Vocabulary | form, section, field, record, custom field |
| Kinds | Incident, Corrective Action, Observation, JSA, each with locked system fields (Division, Facility, dates, Status) |
| Mechanisms on | Display, Scale (severity, probability), Choice, Text (AI assist), Measure (number, currency), Date & time, Lookup (org hierarchy cascade, asset with auto-fill), Evidence (incl. location), Attest (drawn, signing-as role), Calculate (risk matrix, tallies), Repeat (JSA steps, observation grid), Nested (corrective action, spawned forms) |
| Who answers | Initiator; escalation roles as an extension |
| Extensions | Data sources: org hierarchy, people, assets, risk matrix. Rule outcome: create corrective action / follow-on form. Form: additional features bar |

## Seed content

Three forms that together touch every mechanism, plus a small library per product.

| Product | Form | What it exercises |
|---|---|---|
| Evaluations | **Classroom Observation** (Danielson). Domains 1–3 as linked blocks; a Reflection text question; a Third Party comment; a locking evaluator signature and a non-locking evaluee signature; a computed average; elapsed-time Timer; TS Tags; two CalFire JAC codes | Scale, who-answers variety, Attest lock modes, Calculate, Timer, metadata and injected-question extensions, blocks |
| Check It | **Apparatus Morning Check**, lifted from the Checklist Management seed. Cab block, pump block, a Count vs. par step, a nested SCBA step with look-back, a multi-response bottle step, a ticket outcome on a fail | Choice presets with meaning, Measure, Repeat per asset, Nested, rule outcomes, applies-to statuses, blast radius |
| EHS (pass 6) | **Initial Incident**. Locked header block with cascading lookups; yes/no screening that shows sections; a risk block; a checkbox that spawns a Corrective Action | Lookup, locked fields, show/hide rules, Calculate, Nested as separate record |

Libraries: 4 blocks and 3 scales for Evaluations; 5 blocks for Check It; the EHS header and risk blocks.

## Surfaces by pass

Each pass ends in a review. The flow map gains a node per surface so every scene has a deep link.

| Pass | Surfaces | Reused from Check It | New |
|---|---|---|---|
| **1** | Library (forms, templates, blocks, scales) · Create and setup (Kind, Mode, initiator, name) · Builder canvas + inspector with every mechanism on the profile · Profile switch | Canvas layout, staged inspector, dialog scaffolding | Mechanism registry, profile vocabulary, who-answers control, settings grouped and conditional |
| **2** | Block library and picker · Link states template → block → unique · Drag + keyboard reorder · Repeat and Nested items · Context labels on repeated blocks | Picker, ladder, overflow menu, explodeBlock | Repeat row source; Nested target + fold-in vs. separate |
| **3** | Rules panel (when → then) · Rule outcomes from the profile · Extensions at every attachment point · Injected-question extension · Plain-language rule summary on a question | Failure actions, ticket/notify config forms | Declarative rules, extension registry |
| **4** | Live preview per respondent and device · Test run · Quality checks (placeholder labels, empty options, broken rules, min > max) · Optional content review | — | Reference renderer |
| **5** | Publish: lock warnings, blast radius from publish impact, propagation policy · Versions and supersede · "Keep history / new series" on a material edit · Maintain: where used, archive | Draft/publish, blast-radius dialog | Identity vs. version, hold-and-notify |
| **6** | EHS profile over the same shell · Flow map complete · Walkthrough script | — | Lookup, locked fields, spawned forms. **EHS on hold (2026-10-21).** Flow map and script done without it |

## Walkthrough script

Thirty minutes, two profiles, the same shell. Each step names the flow-map scene (🗺 in the toolbox dock, or `#fm=<scene>` on the URL) so a reviewer can jump straight to it.

### Part 1: Evaluations (12 min)

| # | Scene | Do | Say |
|---|---|---|---|
| 1 | `library-ev` | Open the Forms library. Point at the status column. | One library per product: forms, templates, form sections, scales. Statuses are Evaluations' own, including Superseded and Publish-Restricted. Code-confirmed. |
| 2 | `setup-ev` | Click New form. Pick Evaluation, leave Mode on Normal, choose "The evaluee" as who can start it. Cancel. | Setup is Kind + Mode + Template (P2). Mode locks after publish and the dialog says so before you pick. "Normal follows the initiator" is why who-can-start-it sits here. |
| 3 | `builder-ev` | Open Classroom Observation. Expand Domain 3. | Canvas + inspector, whole form visible. Danielson domains are linked form sections: edit once in the library, every form follows. The pinned timer and the injected JAC question show where delivery puts them. |
| 4 | `question-ev` | Select Teacher reflection. Open Who answers. Try to pick Read Only on a signature (disabled). | Who answers is a relationship to the record, not a role. The allowed matrix per mechanism is the engine's. |
| 5 | `preview-ev` | Preview as the evaluee, then switch to Evaluator. Switch to Phone. | Reference renderer (P1): what the definition expresses, not Evaluations' delivery. Locked questions make the subtype model visible. |
| 6 | `testrun-ev` | Test run the Walk-through. Rate two look-fors; watch completion. | Completion is derived from the definition: required answers, signatures under the lock mode, the sharing gate. The builder never computes status; the product does, from this data. |
| 7 | `rule-ev` | Open the rule on a look-for. Add "open a growth plan". Cancel. | One rules model everywhere. Outcomes are registered by the product: Evaluations offers course recommendation and growth plan; Check It will offer tickets. |
| 8 | `quality-ev` → `publish-first-ev` | Show the coaching log's three errors, then open Publish on the self-assessment. | Quality gate blocks publish. First publish lists what locks. Publish-Restricted is an availability option. |
| 9 | `publish-block-ev` → `pending-ev` | Publish Domain 3. Open Classroom Observation. | Propagation is a profile policy (P3): Evaluations holds, so the form shows a notice and keeps its version until someone republishes. |

### Part 2: Check It (12 min)

| # | Scene | Do | Say |
|---|---|---|---|
| 10 | `library-ci` | Switch the profile to Check It. | Same shell, different words: checklists, steps, content blocks. Nothing reloaded. |
| 11 | `builder-ci` | Open Apparatus Morning Check. | Local steps interleave with linked content blocks. This is the prototype's reading of the PRD, not the PRD's: the PRD says questions live only in blocks. Decision needed. |
| 12 | `picker-ci` | Add step → Measure → Count vs. par. Cancel. | Mechanism + preset. Pass/Fail, Count vs. par and Nested check are Check It presets of shared mechanisms. |
| 13 | `blockpicker-ci` → `blockeditor-ci` | Add a content block; note the disabled single-use one. Open SCBA Readiness in the library. | Sealed blocks, multi-use rule, block-level instructions with images (Q40), blast-radius note reading the auto-follow policy. |
| 14 | `repeat-ci` | Select the per-bottle Repeat. | Per-asset answers are a Repeat whose rows come from Check It's asset registry: the SCBA case without product fields in the core (07, trap 2). |
| 15 | `question-ci` → `rule-ci` | Select the nested ladders step, then open its rule. | Nested check with look-back as a Check It dimension. Fail → create a ticket with Check It's own ticket settings (07, trap 1). |
| 16 | `preview-ci` | Test run on a phone. Fail the first step. | Required comment, "this failure will: create a ticket", submit gated with Go-to-it blockers. |
| 17 | `identity-ci` | Show the reworded bay-door step. Pick Keep history. | A material edit asks: same question or a new series (P4, PRD Q7). Labels never carry identity. |
| 18 | `publish-ci` → `json-ci` | Open Publish, then View definition. | Blast radius from Check It's publish-impact extension: seven deployments. The JSON is the schema-v1 contract both products consume. |

### Part 3: the contrast (5 min)

| # | Scene | Do | Say |
|---|---|---|---|
| 19 | `blockeditor-ci` → `blockeditor-ev` | Publish a block in each profile. | Same action, two policies: Check It auto-follows, Evaluations holds. That difference lives in the profile, not the core. |
| 20 | `rulespanel-ci` | Open the rules panel. | Rules travel with blocks; the panel shows them once per block with the placement count. |

### What to collect from reviewers

- Which of P1–P8 they would decide differently, and why.
- Whether the Check It profile's local-steps reading (step 11) is acceptable to Check It product.
- Anything in either profile that is wrong for that product. The confidence tags say what is code-confirmed and what is a guess.
- Vocabulary that still reads as the other product's.

## Confidence tags in the prototype

Every surface and seed value carries one of: **Code-confirmed** (EV settings, subtypes), **Seen in design** (Check It), **Inferred** (EHS, EV plan assignment), **Assumption** (P1–P8). The toolbox comment layer is on; reviewers annotate in place.

## Not in the prototype

- Assignment, scheduling, deployment, delivery (D2). The hand-off is shown as the publish result: ID + version + kind + mode.
- Scoring (P7), offline, mobile authoring, permissions enforcement (the four capabilities are named in the publish dialog, not enforced).
- Migration from legacy forms.

## Folder layout

```
universal-form-builder/
  08-prototype-build-brief.md     this document
  prototype/
    index.html                    loader (verbatim base-template)
    versions.json
    ver1/index.html               the prototype
```
