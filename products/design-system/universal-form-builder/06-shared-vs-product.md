# Form Builder: shared core vs. product

**Status:** Draft v1.1 for review (setup decided) · **Updated:** 2026-10-22

This document answers one question for engineering and product owners: **what does the shared Form Builder own, and what does each product supply?** It is the companion to [03](03-synthesis-and-requirements.md) §4–§6.

## The four layers

```
┌──────────────────────────────────────────────────────────────────────┐
│ 4. PRODUCT-OWNED (outside the Form Builder)                          │
│    Assignment · scheduling · delivery · completion status · records ·│
│    reporting · integrations at run time                              │
├──────────────────────────────────────────────────────────────────────┤
│ 3. PRODUCT EXTENSIONS (product systems plugged in)                   │
│    Form / question / option / answer settings · data sources ·       │
│    rule outcomes · publish impact · metadata-only · injected         │
│    questions · integration sync                                      │
├──────────────────────────────────────────────────────────────────────┤
│ 2. PRODUCT PROFILE (configuration of the shared core)                │
│    Which mechanisms and settings are on · presets · setup fields and │
│    the rules between them · vocabulary · answerer relationships and  │
│    permission levels · default values                                │
├──────────────────────────────────────────────────────────────────────┤
│ 1. SHARED CORE (the Form Builder)                                    │
│    Mechanisms + dimensions · structure (sections, blocks, Repeat,    │
│    Nested, Timer) · rules model · who-answers model · signing model  │
│    · lifecycle + versions · authoring experience · definition schema │
└──────────────────────────────────────────────────────────────────────┘
```

| Layer | Owned by | Changes when | What it contains |
|---|---|---|---|
| **1. Shared core** | Form Builder team | Rarely; affects every product | The mechanisms and their customization dimensions; structure; rules; the who-answers *model* (relationships + permission levels); the signing *model* (locking modes); lifecycle and versions; the authoring UI; the definition schema |
| **2. Product profile** | Each product, as **configuration** | When a product changes what its authors can do | Which mechanisms, dimensions and settings are on; **presets** (named versions of a mechanism); **setup fields** and the rules between them (each form stores its own **setup values**, [08](08-prototype-build-brief.md) P2); **vocabulary**; the product's **relationships and permission levels** for who answers |
| **3. Product extensions** | Each product, as **integrations** | When a product system changes | Settings whose **options or meaning live in the product**: tags, statuses, codes, org data, assets; rule outcomes; publish impact; metadata-only fields; injected questions; integration sync |
| **4. Product-owned** | Each product | Independently | Everything after Publish: assignment, scheduling, rendering, completion status, signing workflow, records, reporting, sync |

## Deciding where something belongs

Ask in order and stop at the first "yes":

1. **Does it happen after a form is published?** (assign, schedule, fill in, sign, compute status, report) → **Layer 4, product-owned.** The definition just has to carry the data it needs (03 §9).
2. **Do the product's own systems supply its options, or decide what it means?** (a tag catalogue, entity statuses, JAC codes, "create a ticket") → **Layer 3, extension.**
3. **Is it the shared core with product-specific choices?** (which mechanisms are on, a named scale, product wording, which roles exist) → **Layer 2, profile.**
4. **Would two or more products need it, with the same meaning?** → **Layer 1, shared core.**
5. **None of the above?** It's probably a product-specific delivery behaviour (layer 4) or a new mechanism dimension (layer 1). Discuss before adding it.

**Signs something is in the wrong layer:**
- **Core features that only one product can use**, e.g. an "applies-to status" field in the core. That's an extension.
- **Extensions that re-implement core behaviour**, e.g. a product-built "required" flag. That's core.
- **Profiles that need code to work.** If configuration isn't enough, it's an extension.

## Worked examples

### A. Evaluations rubric rating
| Part | Layer | Why |
|---|---|---|
| Scale mechanism: levels, values, descriptors, exclude from averages, per-level rules | 1 Core | Scale is shared. EHS severity uses the same mechanism |
| "Danielson 4-level", "2–8 Level" presets | 2 Profile | Product-specific named versions of a core mechanism |
| Who answers = Reflection (the evaluee) | 1 Core model + 2 Profile values | The relationship model is core; "evaluee" and the permission levels come from EV's profile |
| Pre-defined tags on the question | 3 Extension | The tag catalogue lives in EV |
| Averaging in reports | 4 Product | EV reporting reads values and exclude-from-averages from the definition |

### B. Check It Pass/Fail step that creates a ticket
| Part | Layer | Why |
|---|---|---|
| Binary Choice with "Fail" meaning; comment required on fail | 1 Core | Choice, meaning per option, and rules are shared |
| "Pass/Fail step" preset with Yes/No relabeling | 2 Profile | CI's named version, in CI's vocabulary ("step") |
| Rule outcome "create ticket (priority, assignee)" | 3 Extension | Tickets are a CI system; CI registers the outcome and its settings form |
| Applies-to statuses on the checklist | 3 Extension | Entity statuses live in CI |
| Running the check, gating submit, creating the ticket | 4 Product | Delivery |

### C. Evaluations TargetSolutions Tags (already in production)
| Part | Layer | Why |
|---|---|---|
| A multi-select form setting, stored as references | 1 Core | The generic extension setting UI and storage |
| Shown only when `TARGETSOLUTIONS_INTEGRATION` is on and the form is in the PUBLIC domain | 2 Profile (conditions) | Product rules for when a setting appears |
| Tag catalogue fetched live from the TargetSolutions API; **metadata-only** | 3 Extension | The data and meaning belong to an outside system |
| Tags sent to TargetSolutions when an instance completes | 4 Product | Run-time integration reads the tags from the definition |

This is the model working today. It shows that **cross-product integration is an extension, not a shared tag system.**

### D. CalFire JAC codes
| Part | Layer | Why |
|---|---|---|
| Attach 0, 1 or many codes, plus "required" and duration, to a form | 3 Extension | The JAC code list and its meaning belong to EV/CalFire |
| Only available when the CalFire JAC feature is on | 2 Profile (conditions) | Feature-flagged setting |
| With several codes, **a required pick-a-code question is injected** at the top during fill-in | 3 Extension behaviour → 4 Product | The extension declares "inject a question"; delivery renders it |

### E. EHS Corrective Action with inherited fields
| Part | Layer | Why |
|---|---|---|
| Nested mechanism (separate linked record, inherited fields) | 1 Core | Relationships between forms are shared structure |
| "Corrective Action" form type with locked system fields (Originating Type, ID, Division, Facility) | 2 Profile | A product setup value. Locked system fields are EHS-only and wait with the EHS profile |
| Responsible party, escalation levels | 3 Extension (escalation role) + 4 Product (notifications) | People and escalation belong to EHS |

### F. Signature locking
| Part | Layer | Why |
|---|---|---|
| Locking modes (signer / all / prior), who signs, required, drawn | 1 Core | Signing is a shared model; EV's three modes become core options |
| Which modes a product offers; default mode | 2 Profile | CI may offer only "submit & sign" |
| Notify when ready, show on to-do list | 1 Core flag + 4 Product | The definition carries the intent; the product sends notifications and owns the to-do list |

## What each product supplies

| Product | Profile (layer 2) | Extensions (layer 3) |
|---|---|---|
| **Evaluations** | Setup values (Use for: Evaluation, Coaching, Activity Tracking; Type: Normal, Read-Only, Computed); scale presets; relationships (author, evaluee) + permission levels (View, Record); vocabulary | Tags (question and option), TS Tags, JAC codes, Observation flag, privacy, sharing behaviour, name editing, self-evaluation restriction, course-recommendation outcome, publish impact (plans, instances) |
| **Check It** | Setup values (Checklist type, filter metadata only); presets (Pass/Fail step, Count vs. par); vocabulary (checklist, step, block); relationships (performer) | Applies-to statuses, cadence, asset types, ticket / out-of-service / notify outcomes, publish impact (deployments) |
| **EHS** | Setup values (form type: Incident, Corrective Action, Observation, JSA) with locked system fields; risk-matrix preset; vocabulary | Org hierarchy, people, assets, additional features, create-CA / follow-on-form outcomes, escalation roles, publish impact (records) |

## Open points
- **Who builds extensions:** each product team, against a published extension contract? Or the Form Builder team, from product specs?
- **Versioning of extensions:** if a product changes an extension (e.g. new ticket fields), how do published forms that reference it stay valid?
- **Feature flags:** are per-tenant feature flags (TS integration, CalFire JAC) part of the profile, or evaluated live through an extension?
