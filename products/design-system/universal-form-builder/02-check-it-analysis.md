# Check It: form builder needs (Checklist Management)

> **How to read this.** The shared effort covers **authoring** only. Check It owns delivery: runs, gating, sign-off, failure consequences, deployments and schedules. Its authoring patterns (§6) are the main UX input. Its runtime behaviour (§4, §7) is here to show **what the definition must express** (see 03 §9). Deployments and scheduling stay in Check It and would consume published definitions.

Sources and how line numbers are cited:

- **CM** = `products/check-it/Checklist-management/ver1/index.html`, which uses core v1.22.3 / themes v1.9.3. Plain line numbers below point here.
- **SB** = `products/check-it/sandbox/`, which uses core v1.5.1 / themes v1.1.1. The sandbox is an older dark prototype slated for a rewrite rather than a port. Its concepts are still useful requirements input.
- Planning docs live in `Checklist-management/_planning/` (brief, OPEN-QUESTIONS, BUILD-STATUS). They are **git-ignored and local-only**.

Check It is the only product that has a **designed authoring experience**, so it is the main source of builder UX patterns.

## 1. The four-layer model

The design brief (:19-28) defines four layers:

| Layer | What it is | Builder equivalent |
|---|---|---|
| **Content Block** | A reusable, ordered set of steps. It has no schedule or entity. | Reusable question group / section |
| **Checklist** | Ordered sections that hold blocks and/or local steps, plus `appliesToStatuses` | Form definition |
| **Deployment** | Binds a checklist to one entity and owns that entity's schedule. The PRD calls it "Assignment". | Product-owned assignment layer (outside the builder) |
| **Check record** | Created when a check runs; pinned to the checklist version | Form response / instance |

## 2. Response types (CM)

`RESPONSE_TYPES` (3607-3645) lists each type with `value`, `label`, runtime `kind`, `input`, `carriesPassFail` (true / false / `'contextual'`) and `help`. `stepCanFail()` (3684-3695) decides per step whether it can fail.

| `value` | Captures | Type-specific config | Fails when |
|---|---|---|---|
| `instruction` | nothing (display) | `context` | never |
| `passfail` | pass / fail | `responseLabels {pass, fail}`, e.g. "Yes/No" (Q41) | Fail. **A fail always forces a comment**, and that is not configurable (4853, 5084) |
| `complete` | complete / incomplete | `responseLabels {complete, incomplete}` | **never**: incomplete counts as a state, not a failure |
| `numeric` | number | `unit`, `min`, `max` (the "Accepted range") | outside min/max. Only possible when a bound is set (`numericFails` 5040) |
| `single` | one option | `options[]`, `failOptions[]` | a fail-marked option is chosen. The fail mark follows the option when it is renamed (10756-10817) |
| `count` | non-negative integer (stepper) | `par`, `countNoun` | **under par**. Over par is not a failure (5031-5039) |
| `text` | string | `context` | never |
| `signature` | canvas data URL + `signedAt` | — | never |
| `nested` | runs another checklist inline for each asset of a type assigned to the entity | `checklistId`, `assetType`, `lookBack` (`always` / `skip`), `lookBackDays` (30), `minPassing`, `itemNoun` | fewer than `minPassing` items pass |

**Removed on purpose:**
- **Multi-select.** Relabeling (Q41) is meant to cover it.
- `repeat`, which became `nested`.
- The Compartment and Equipment types, replaced by nesting plus asset-tied steps (brief Rule 4).
- **N/A** is explicitly out of scope (A2).

**Not built yet:**
- A single asset-tied step (Q12b, `assetId`).
- A Select "Other" option that requires a comment (Q12).

**Not present at all:**
- A date or expiration-date type. Expiry is written as free text on the asset.
- Serial number capture.
- Scan as an answer. Scan is used only to pick an asset.

### Properties every step can carry
| Property | Values | Notes |
|---|---|---|
| `label` | text | The only hard requirement (10419) |
| `context` | text | Help text or instructions; no images |
| `optional` | bool | Default is required |
| `comment` | `off` / `allowed` / `required` | A tri-state that replaces the PRD's four booleans (4839-4862) |
| `documentation` | `off` / `allowed` / `required` | Methods: photo, video, file. Any one of them satisfies "required" (`DOC_METHODS` 4775) |
| `responseLabels` | per slot | Display only. **Identity and analytics never depend on the label (Rule 2)** |
| `multiResponse` | `{assetType, minItems}` | One question, one answer per asset picked from the registry. `minItems` is a floor (the "3 required, 5 carried" case). Comment and documents stay at step level (4796-4825) |
| `onFail[]` | `oos`, `ticket`, `notify` | See §4 |

**Block-level settings:**
- `instructions {text, images[]}` appear above step 1 (Q40).
- Each block instance has its own `contextLabel`, so one block can be placed more than once with different labels, e.g. "Driver front" and "Driver rear".

## 3. Sandbox vocabularies: a warning about mapping between them

The sandbox had **two vocabularies joined by a lossy compiler**, which is a direct requirements lesson:

- **Authoring (5 `type`s):** `passfail`, `text`, `numeric`, `single`, `multi` (SB `block-creator.html:1337-1341`)
- **Runtime (14 `kind`s):** `check`, `yes-no`, `numeric`, `text`, `long-text`, `select`, `multi-select`, `count`, `signature`, `date`, `datetime`, `info`, `acknowledge`, `cs-count` (SB `ceremony-fire-rig-check.html:2343-2356`)

`resolveKind` (SB `sandbox-compile.js:68-81`) maps passfail→check, single→select and multi→multi-select. Text and numeric map to themselves.

Nine runtime kinds **cannot be authored at all**. The mapping also causes these problems:

- Editing a seed block silently changes `yes-no`, `date` and `acknowledge` steps to `check` (SB `block-creator.html:1231`).
- Inline steps always compile to `check` and lose their photo setting (SB `sandbox-compile.js:170-183`).
- `severity` (critical / warning / none) is carried through but **never read** at runtime.
- "Photo required" compiles to "photo allowed".

Some runtime ideas from the sandbox are worth keeping and are **not** in CM:

| Idea | Detail |
|---|---|
| **N/A** as a third state on pass/fail | CM later ruled N/A out (A2). Evaluations may still need it |
| `numeric.thresholdSource` | Cites a regulation such as "NFPA 1911 §6.3" and shows it in a tooltip |
| `numeric.default` and date `default` | Values `'today'` or `'now'` |
| `text.expectedValue` | A case-insensitive match. A mismatch is a *soft discrepancy*: it is flagged in the summary but does not count as a failure |
| `acknowledge` | An info card plus an "I confirm" checkbox |
| `multi-select.required: [values]` | Specific options must be picked (DS gap CER-V02). It is not enforced |
| `long-text` | A separate type from `text`. Evaluations folds this into `multiline` instead |
| `date` / `datetime` | Expiry and in-service dates |

## 4. Failure handling

`FAILURE_ACTIONS` (4747-4757) can be combined. If none are set, the failure is recorded and nothing else happens.

| Action | Config |
|---|---|
| `oos`: take the entity out of service | An officer can override with a readiness determination |
| `ticket`: create a ticket | `ticketConfig {priority: low\|normal\|high\|critical, assignTo: responsible\|queue\|user, userId, titleMode: step\|custom, title, includeAnswer}` (4673-4694) |
| `notify` | `notifyConfig {targets: responsible\|officer\|station\|user[], userIds, channels: app\|email\|sms}` (4696-4710) |

**At runtime:**
- Each step shows "This failure will: …".
- Submit shows the deduplicated set of consequences from all failed steps (6487-6534).

**Additional runtime behaviour from the sandbox** (SB `ceremony-fire-rig-check.html`):
- An inline deficiency form can create several work orders per item, each with its own scope, description and urgency (Normal / Priority / Urgent) (3635-3757).
- **Carried-over work orders** from the previous run must be dispositioned (Confirm / Log new / Resolve) before Pass is allowed.
- **Replacement asset swap** picks a spare from the in-stock pool.
- An attest summary ends in a **readiness determination**.

**Open question 6:** at what level are failure actions authored — step, block, checklist, or a department default?

## 5. Structure

**Hierarchy:**
- Checklist → `sections[]` → `items[]`, an interleaved, ordered list of `{kind:'step', step}` and `{kind:'block', inst}` (3266-3296).
- A shared block's steps are **sealed**: nothing can be inserted inside it, though steps can sit between blocks.

**Link-state ladder:**
- `template` → `block` → `unique` (broken out into local steps; `explodeBlock` 11532). Each step down asks for confirmation.
- The sandbox adds **template-locked sections**, which take local additions appended after the template steps.

**Reuse:**
- Blocks are many-to-many with checklists.
- `multiUse` controls whether a block can be placed more than once.
- Each block has a `domain` (DOMAINS 3308) that filters where it is offered.
- Blocks and checklists can be copied to seed new ones.

**Ordering:**
- Drag and drop, plus **Move up / Move down / Move to section** in a "…" menu. These exist because drag-only reordering fails WCAG 2.1.1 (7452, 7529, 7769).
- Sections can be reordered and renamed.

**Repeat per asset** has three distinct mechanisms:
1. `multiResponse`: one question answered per asset.
2. `nested`: a whole sub-checklist per asset. Nesting is one level deep and only from apparatus or station (`NESTABLE_FROM` 3815). The child checklist needs `perItemOnly`.
3. Bulk run:
   - Pattern A: sibling deployments share one pass, which writes **N separate records**.
   - Pattern B: "Check another item".

**Record rules:** nested results fold into one record (Q34), while bulk runs write one record each (Q32).

**Conditional logic:** none in Checklist Management. The only conditional-field precedent in Check It is **Requisition-workflow**:
- The `REASONS` map changes the detail label, the help text and whether a photo is required (`Requisition-workflow/ver1/index.html:1309-1324`).
- Example: *replace* → photo plus "What happened?"; *new* → justification.

## 6. Authoring UX (the strongest input for the builder shell)

| Pattern | Where |
|---|---|
| New checklist dialog: name, type, default cadence, applies-to statuses. Starts as a draft with `liveVersion:null` and cannot be deployed until published | 5133-5265 |
| New block dialog: name, domain, description, multi-use | 5269-5355 |
| **Staged step editor:** Question (label, context, type, required) → type config → "When this step fails" (opt-in) → Attachments | `buildStepForm` 10403-10918 |
| **Block picker panel:** search, grouped by domain, step count, multi-use tag, and an "Add custom steps instead" option | SB `checklist-builder.html:3026-3103` |
| **Draft / publish versioning:** saving a draft creates v(live+1) and leaves running checks untouched. Publish lists the affected deployments. In-flight runs keep their version. Each deployment records the version it runs | 12531, 12865-12880, 4089-4119 |
| **Blast-radius dialog** for publishing a block, with a compliance-impact warning (e.g. "maps to NFPA 1911 §6.3.2") | 11668; SB `block-creator.html:1136-1170` |
| Lifecycle: Published / Draft / Archived. Archiving clears deployments and breaks block links | 4229-4234 |
| Dirty tracking, exit confirmation, Escape closes the topmost overlay, re-render only the edited card (keeps scroll position) | SB `block-creator.html:1386-1397`, SB `checklist-builder.html:4312-4339` |
| Deployments: entity picker with facets, batch deploy / schedule / status | 11235, 12429-12510 |
| Schedules: calendar-anchored (`freq, dueTime, days, graceHours, anchor, dayOfMonth, nth, weekday, month`). Occurrence states: done, due, upcoming, missed, cancelled, voided | 3326-3443 |

**Missing:**
- A **preview of the runtime form from the builder** (neither CM nor the sandbox has one).
- "Make all mandatory" (S2).
- The "version this question vs. start a new series" callout (Q7).
- A per-block "applies to" restriction by equipment type (S3).

## 7. Runtime / completion UX

**Layout:**
- Responsive, two columns on desktop.
- The block index becomes a jump menu. It exists because production checklists can reach **1,094 steps**, and 359 have 250 or more (brief :116).
- Navigation is a flat list of blocks: consecutive local steps are grouped into pseudo-blocks (`buildRunBlocks` 4937-4978).
- Answers are keyed `secId/instId/stepId`, so a block used twice doesn't collide.

**Gating:**
- `stepBlocker()` (5060-5094) is the only gate, and it cannot be overridden. It blocks on: not answered, N of M recorded, a comment required on fail, a comment required, or documentation required.
- Submit shows "Go to it" links to each blocker.

**Sign-off:**
- "Submit & sign" is done by the person who performed the check.
- There is **no reviewer** (Q14). A department setting for "officer attestation" contradicts that decision.

**Not designed:**
- **Save-and-resume.** "Leave run" discards the run.
- **Offline** (Q15 is undecided). In six months, 13,775 checks were fully answered but never submitted.

**Runtime answer shape** (4927):
```js
{ value, comment, docs:[{method,name}], items:[{assetId,value}],
  nested?:{[assetId]:{done,skipped,forced,answers}}, signedAt? }
```

## 8. Data model (CM, 3254-3306)

```js
block     { id, name, domain, description, multiUse, status, version, usedBy,
            instructions?:{text, images[]}, steps:[step] }
checklist { id, name, type, cadence, appliesToStatuses[], defaultSchedule, status, version,
            liveVersion|null, hasDraft, origin:'template'|'blocks'|'scratch', perItemOnly?,
            sections:[{ id, name, collapsed, templateLocked,
                        items:[{kind:'step',step} | {kind:'block',inst}] }],
            deployments:[…] }
inst      { instanceId, blockId, contextLabel, linkState:'template'|'block'|'unique', expanded, optional }
step      { id, label, type, context?, optional?, comment?, documentation?, responseLabels?,
            unit?, min?, max?, options?, failOptions?, par?, countNoun?, multiResponse?,
            checklistId?, assetType?, lookBack?, lookBackDays?, minPassing?,   // nested
            onFail?, ticketConfig?, notifyConfig? }
```

## 9. How Check It differs from a generic form

- **Asset binding.** Answers belong to a specific asset permanently (Rule 3). Multi-response and nested steps resolve from the asset registry at run time.
- **Entity status drives applicability** through `appliesToStatuses`. A failure can change that status (out of service).
- **Analytics identity sits on the question id and type, never on the label** (Rule 2).
- Aggregation is per department only. There is no cross-tenant shared template library (Rule 5).
- **Controlled Substances is explicitly outside the form engine** (Q22). It has record-like fields: lot #, expiration, administered/wasted dose, witness, discrepancies.
- Compartments are **not modelled** (open question 3). Count-vs-par is entered by hand and does not read inventory.

## 10. Check It open questions relevant to the builder

From OPEN-QUESTIONS.md and the brief (:186-200):

1. Where does a nested checklist come from: the step, the asset, or a default the step can override?
2. Is asset type enough to group equipment, or are tags or compartments needed?
3. Is a compartment a nesting target, a count target, or both?
4. Seven types or eight? The PRD prose and its table disagree.
5. At what level are failure actions authored?
6. Offline capture (Q15), maximum checklist length (Q17), and who can author, publish and assign (Q19).
7. What is an "assembly", i.e. a nested loadout (Q29)?
8. Migration scope and cutoff (Q27/Q28).

## Appendix: defects observed in the source mocks (not fixed; review-only scope)

**CM:**
- `nestConflictsForStep()` reads `sec.blocks` (3873), a field that `sectionItems()` deletes at load (4254). As a result, the Q30 nesting guard never fires.
- The flow-map state at 13031 has the same `x.blocks` problem and would throw an error.

**SB:**
- **The store re-seeds on every load.** The seed returns `schemaVersion: 2` while the store expects `3` (`sandbox-seed.js:226` vs `sandbox-store.js:53`), so saved edits never persist.
- `appendBlocks` is never compiled.
- `cs-count` has no renderer.
- Publish never changes the status or version.
- Activate writes `'active'`, a status the store doesn't know.
- An unpublished checklist can still be deployed.
