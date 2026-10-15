# Form Builder: Check It iteration 1, technical alignment brief

**For:** the Check It technical owner · **From:** UX (Form Builder discovery) · **Date:** 2026-10-14
**Background reading (optional):** [03 Working model](03-synthesis-and-requirements.md) · [06 Shared core vs. product](06-shared-vs-product.md) · [05 Code-dive brief](05-code-dive-brief.md)

## Why this meeting

Check It is the first product to build the Form Builder: the shared form-authoring experience that Evaluations adopts next quarter and EHS after that. Check It's checklist authoring becomes **iteration 1 of a shared platform**, not a Check It feature to generalise later.

**The goal:** agree the decisions that would force a refactor if Check It made them alone, before iteration 1 starts.

**Principle: design for three products, build for one.** The schema and contracts account for Evaluations and EHS from day one, and iteration 1 implements only what Check It needs. Evaluations' form engine is already documented to code level (01 §1a), so its needs are known, not guessed.

## Decisions needed

| # | Decision | Why it's expensive to change later | Proposal |
|---|---|---|---|
| 1 | **Where the Form Builder lives** (code + storage) | Authoring code or definitions inside Check It's codebase or database have to be extracted when Evaluations adopts | A separate module/package and a definition store that is shared, or schema-compatible. Check It consumes it the way Evaluations will |
| 2 | **Definition schema** | A Check It-shaped schema forces Evaluations to migrate or fork | Start from 03 §8. Include fields Check It won't use yet as optional (`answeredBy`, option `value` / `excludeFromAverages`, form `mode`, `signing.lockMode`, `extensions`). Version the schema from v1 |
| 3 | **Core vs. extension boundary** | Check It concepts in the core (assets, tickets, statuses) have to be pulled out later | The placement table below |
| 4 | **Extension contract** | Hard-wired integrations mean custom code for every product | A real contract from day one, with Check It as its first user (four extensions below) |
| 5 | **Delivery reads the published definition** | A Check It-specific compiled runtime format creates two vocabularies; the sandbox prototype already hit this | Check It's run engine reads the published definition directly |
| 6 | **Identity, versions, lifecycle** | Evaluations needs statuses Check It doesn't (Superseded, Publish-Restricted) | Stable question IDs, ID + version pinning, a status list that can grow |

## Where Check It's features go

**Core:** build generically now.
- Sections, blocks, link states
- Choice with per-option meaning (fail), plus optional values
- Measure (accepted range, par)
- Text
- Comment / evidence off / allowed / required
- Attest
- Repeat (one row per subject)
- Nested
- Rules model with "fail" as an effect
- Draft / publish / pinning
- Who answers (Check It default: the initiator only)

**Profile:** Check It configuration of the core.
- Presets: Pass/Fail step with a required comment on fail, Yes/No relabeling, Complete/Incomplete, Count vs. par
- Checklist types (kinds)
- Block domains
- Vocabulary (checklist, step, block)

**Extensions:** Check It systems plugged in. These are the first four to build:
1. **Rule outcomes:** out of service, create ticket, notify, each with its own config form (today's `ticketConfig`, `notifyConfig`)
2. **Form settings:** applies-to statuses, default cadence
3. **Data source:** the asset registry (asset types, assigned assets) for per-asset answers and nested checks
4. **Publish impact:** "which deployments use this version" for the blast-radius dialog

**Product-owned:** stays in Check It.
- Deployments, schedules, occurrences
- Runs and submit gating
- Bulk runs; how nested results fold in
- The out-of-service override
- Readiness, history

## The traps

Any one of these would force a refactor next quarter:

1. **`onFail` and `ticketConfig` on the step model.** Fail should be a rule effect, and out of service / ticket / notify registered outcomes.
2. **`assetType` / `multiResponse` as core fields.** Generalise to "row source = subjects of type X, supplied by a product data source".
3. **A Check It response-type list** (`RESPONSE_TYPES` with runtime `kind`) as the type system. Use mechanism + preset.
4. **Leaving out who answers, option values or locking mode** because Check It has one respondent and doesn't score. Evaluations needs all three, so they should be optional fields now.
5. **Hard-coded "checklist / step" labels** in the authoring UI. Use profile vocabulary.

## Questions for you

1. **What's in production today** vs. designed in Checklist Management (blocks, link states, versioning, deployments, schedules)? Is iteration 1 a migration or new work?
2. Which **response types and settings** exist in production (the PRD lists seven in prose and eight in its table)?
3. How do deployments reference checklists, and can **"what uses this version"** be queried?
4. How are **failure actions** configured and executed today?
5. How would the Form Builder **fetch asset types and assigned assets**?
6. What does the **native app** read today, and what are the offline plans?
7. **Boundary calls:** are Nested's look-back window and minimum passing core Nested settings or a Check It extension? Is "eligible for nesting" (`perItemOnly`) core or Check It-specific?

## What we'd like to leave with

- [ ] A decision on **packaging and storage** (#1)
- [ ] Agreement to use the **shared schema** as the starting point (#2, #6)
- [ ] The **first four extensions** confirmed (#4)
- [ ] Agreement that delivery **reads the definition directly** (#5)
- [ ] Answers or owners for questions 1–7
- [ ] **A named Evaluations technical reviewer** for the schema and extension contract before they're locked. This is the cheapest insurance against a refactor.
