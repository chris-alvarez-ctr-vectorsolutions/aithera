---
version: 1.0
stage_2_complete: pending
stage_3_complete: pending
stage_4_complete: pending
stage_5_complete: pending
initiative_key: GT-5775
product: Guardian Tracking
target_pi: PI.26.5.DEC.04
sector: Public (Public Safety / Law Enforcement)
milestone_source: https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/28102164507/Individual+Summary+Reports
milestone_title: Individual Summary Reports
confluence_url: https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/29325459469/PRD+Individual+Summary+Reports+GT-5775
created_at: 2026-08-27
last_synced: 2026-08-27
---

# PRD: Individual Summary Reports

## Milestone Reference

**Source:** [Individual Summary Reports](https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/28102164507/Individual+Summary+Reports)

This PRD details the requirements for a per-individual summary report in Guardian Tracking that assembles one person's document and flag history into a single scannable view for a chosen period — so a supervisor can recognize a risk trend before a critical incident rather than after one.

> **Scope correction from Jira.** GT-5775 was titled *"Create Individual Summaries (Guardian Scores)"* and promised *"a 'Guardian Score' — an individual readiness score from an algorithm with admin-adjustable weights."* **The Guardian Score is out of scope.** This initiative delivers Flag Progression bars and per-category metric tiles. The Jira title and description have been corrected (2026-08-27).

---

## Product Context

**Product:** Guardian Tracking (`gt-five` @ `c92e7807`, v2026.3.4, verified 2026-08-27)

**Tech Stack:** React 18.3 + Vite + TypeScript, React Router 7, TanStack Query 5, **Vector Web Components** (`core` ^1.24.2) — React is replacing legacy Vue 2.7 and owns the routes in scope. Charting: `chart.js` ^4.5.1 + `react-chartjs-2` ^5.3.1 + `d3` ^7.9.0. Backend: Node 22 / Express + Sequelize, **PostgreSQL**, TurboRepo. Reporting: jsReport ^4.10.1 + `@sparticuz/chromium` on Lambda with S3 output.

**Key Integrations:** None external. Entirely self-contained within `gt-five` — no Target Solutions, Keystone, PowerDMS, or RMS dependency.

**Constraints:** AWS **GovCloud** (`us-gov-east-1`). **CJIS compliance** enforced in-product via the `security.cjis` setting. Datadog monitoring.

**Directly reusable existing capability:**
- **`relationships`** — flattened transitive-closure cache of every supervisor-subordinate pair with `degree`. Makes "self + anyone downline" one query.
- **`documentViewability`** — precomputed per-document access honoring `confidentialGroupId`, `GrantedDocumentAccess`, and ghost mode. Every read path filters through it.
- **Dashboard `EngagementCategories`** — per-category counts plus flag classification, exposed as `EngagementCategoryItem.ruleType` (`Positive_Recognition` / `Early_Intervention` / `Both` / `Neither`). The polarity source for metric tiles.
- **Threshold Alerts** — GT's flags. `ThresholdAlertRule` carries `threshold`, `timespan`, per-trigger `weight`; `ThresholdAlertType` is exactly `EarlyIntervention` / `PositiveRecognition`.
- **`/reports/users/:id`** → `SubordinateProfilePage.tsx`, the existing individual view this initiative rebuilds.

---

## 1. USE CASES

| Business Use Case | Value to User (Why?) | How We Are Solving | High Level Acceptance Criteria |
|---|---|---|---|
| A supervisor opens one report for an individual and sees every document type they accumulated in a period | Recognizes a trend without reconstructing it from scattered records | 1. Open roster at `/reports/users`<br>2. Select self or anyone downline<br>3. Report loads for the default period<br>4. Header, open-flag status, flag progression, tiles, and timeline render as one view | - Reachable from the roster for the acting user and any downline individual<br>- Documents excluded by `documentViewability` never appear<br>- Renders for an individual with zero documents (empty state)<br>- Renders for terminated/inactive individuals |
| A supervisor compares each category against the prior period | Distinguishes an ongoing baseline from a recent behavioral change | 1. Select a reporting period<br>2. Tiles show category name and in-period count<br>3. Each tile shows the delta vs. the immediately preceding period of equal length<br>4. Delta renders as increase, decrease, or explicit no-change | - Every tile compares against the immediately preceding period of equal length<br>- Three distinct delta states, with no-change explicit rather than a zero<br>- Tile colour follows the category's inherited flag classification<br>- Tiles render at zero rather than disappearing<br>- Delta shows `n/a` where the prior period is unobservable |
| A supervisor sees whether an individual currently has an open flag before reading anything else | Present-tense risk status is unmissable, never buried under period statistics | 1. Report loads<br>2. Open-flag indicator renders in the header, right-aligned, visually separated from tiles<br>3. Shows count of active flags in an alert treatment | - Count reflects currently active flags, not a period statistic<br>- Visually separated from metric tiles<br>- Alert treatment applies only when count > 0<br>- Respects flag viewability including handling-group restrictions |
| A supervisor sees progress toward each flag an individual is trending against | Sees risk building *before* it trips a threshold — the "early" in early intervention | 1. Load progression for every rule with a non-zero accumulated score<br>2. Render a progress bar toward each rule's threshold<br>3. A rule with an open flag reads 100%<br>4. Permitted users click through to act | - A bar appears for every rule where accumulated score is non-zero<br>- Progress is accumulated score relative to that rule's threshold<br>- A rule with an open flag reads 100%<br>- Click-through routes into the existing flag workflow, only for permitted users |
| A supervisor sees commendations, corrective actions, and exposure events on a shared timeline | Spots clustering across categories that a single-category report would hide | 1. Timeline renders on one horizontal axis with month labels<br>2. Default view groups categories by flag classification<br>3. Filter by flag association or category<br>4. Click a marker to drill in, staying within the report | - Single axis spans the selected period with month labels<br>- Default grouping is by flag classification<br>- Filterable by flag association and by category<br>- Flags render as distinct markers with inline dated callouts<br>- Stays readable at high density<br>- Drill-down keeps the user in the report |
| A supervisor or individual exports the report as a PDF | A shareable, retainable artifact; an individual's exposure and mental-health record travels with them after their tenure ends, with no admin approval step | 1. Select the reporting period<br>2. Select Export PDF<br>3. System produces the report for that period<br>4. User obtains the PDF | - Export reflects the report as displayed for the selected period<br>- An individual can export their own report without admin approval<br>- Gated on the existing `PrintDocument` permission<br>- Honours `documentViewability` — no document appears that the requester could not view in-app<br>- Export is audit-logged |

---

## 2. SCOPE CONSIDERATIONS

### Additional Scope Details

- **Access model:** One hierarchy rule governs the whole report — a user may view **themselves and anyone downline**. No separate supervisor / admin / officer visibility tiers.
- **Visibility follows the current chain**, not the chain as it stood when each document was created.
- **Confidential document inheritance:** The report inherits GT's existing **group-based** restriction model (`confidentialGroupId` + `GrantedDocumentAccess`, via `documentViewability`). No new per-category permission model.
- **Polarity is derived, not configured:** A category inherits classification from its flag associations, using the existing dashboard `ruleType` colours — `Positive_Recognition` blue `rgba(33,150,243,·)`, `Early_Intervention` amber `rgba(216,155,56,·)`, `Both` dark grey `rgba(76,76,76,·)`, `Neither` purple `rgba(171,71,188,·)`. **This supersedes the milestone document's green/red/grey scheme.**
- **Single global reporting period** drives the entire report — tiles, deltas, prior-period comparison, and timeline axis. The milestone document's separate tile-level control is not built.
- **Metric tiles are opt-in with an active empty state:** No categories enabled by default. The empty state must itself be the on-ramp — a user must be able to begin enabling and seeing tiles from the report, not be sent elsewhere to discover the feature.
- **Tile content:** category name, in-period count, and delta vs. the immediately preceding period of equal length, in three explicit states (increase / decrease / no-change).
- **Flag progression:** a bar for every rule with a non-zero accumulated score; 100% where an open flag exists, with permission-gated click-through into the existing flag workflow.
- **Timeline density is a functional requirement.** Unreadable output is not acceptable; markers must cluster or stack.
- **No hire-date logic.** Neither hire date nor user-created date is considered anywhere in data display or period computation.
- **Mobile responsive** — phone and tablet, not desktop only.
- **Audit logging:** viewing and exporting a summary are both audit-logged, extending the existing report audit-event pattern.
- **Permission reuse:** report and export reuse the existing **`PrintDocument`** permission. No new permission type.

### Out of Scope

**Explicitly Excluded:**
- **Guardian Score** — any composite score, algorithm, or admin-adjustable weighting
- Cross-individual or aggregate views (no ranked roster, no "show everyone trending adverse")
- Scheduled or emailed delivery — the report is pull-only
- Excel/CSV export — PDF only
- Proactive notifications or alerts derived from the report
- Creating or editing documents within the report (read-only apart from flag click-through)
- Historical report snapshots — always computed live
- Secondary entry points (flag, document, dashboard, notification)
- A tile-level period control independent of the report period
- A new permission type for viewing summaries

**Future Consideration (Deferred):**
- Secondary entry points
- Composite scoring, should the Guardian Score return as its own initiative
- Tile ordering and tile-count limits

### Edge Cases

- **Zero documents in period:** purposeful empty state, not a zero-filled report.
- **No observable prior period:** show `n/a`. *(See Gap Analysis — interacts with the no-hire-date rule.)*
- **Category with no documents ever:** tile renders at zero rather than dropping off.
- **Very dense timeline:** 200+ entries in a period, or 15 on one day, must cluster or stack and stay legible.
- **Terminated or inactive individuals:** still viewable; downline rule must still resolve.
- **Reorganization mid-period:** visibility resolves against the current chain.
- **Category classified `Both`:** ambiguous polarity. *(See Gap Analysis.)*

---

## 3. DEPENDENCIES & CONSTRAINTS

### Dependencies

| Dependency | Type | Owner | Impact | Status | Notes |
|---|---|---|---|---|---|
| `documentViewability` access table | Internal data | GT Engineering | High | Active | All read paths and the PDF export filter through it |
| `relationships` closure cache | Internal data | GT Engineering | High | Active | Self + downline scoping in one query |
| Dashboard `EngagementCategories` / `ruleType` | Internal API | GT Engineering | High | Active | Polarity source; tiles extend this per-individual |
| Threshold Alert engine (`ThresholdAlertBusinessRule`) | Internal service | GT Engineering | High | Active | `getWeight()` must become an on-demand read path |
| `packages/reports` (jsReport + Lambda + S3) | Internal service | GT Engineering | High | Active | PDF export path; see export fork below |
| Vector Web Components | Library | Vector Platform | Medium | Active | Tiles and header should be VWC compositions |
| `chart.js` / `react-chartjs-2` / `d3` | Library | GT Engineering | Medium | Active | Timeline and progression rendering |
| Feature-flag mechanism | Infrastructure | GT Engineering | High | **Missing** | None found in `gt-five`; see Gap Analysis |
| Beta customer cohort | Business | Product | Medium | TBD | Not yet selected |
| UX for empty-state on-ramp and timeline density | Design | UX | High | TBD | Both are functional requirements without a design |

### Constraints

**Technical:**
- Frontend must be **React 18.3 + Vector Web Components**; legacy Vue 2.7 is being retired and is not a build target.
- All data access routes through `documentViewability`, including ghost-mode support.
- GT's only export mechanism is **asynchronous server-side jsReport rendering to S3** (request → `Report` record → SQS → Lambda → S3 → WebSocket → presigned URL). No synchronous client-side print path exists.
- Sub-threshold flag scores are **not persisted**. `getWeight()` computes accumulated weight on document save and discards it unless it crosses `rule.threshold`; only a fired `ThresholdAlert` stores `score`.
- `Setting` records are **immutable by design** — seeded at deployment, migrations only — so new department-level configuration requires a migration.

**Business:**
- **CJIS compliance** applies. The report aggregates sensitive material, including exposure and mental-health documentation, into one view and one exportable artifact — concentrating disclosure risk relative to per-document access.
- Confidential documents are restricted by **group**, not category; there is no per-category confidentiality mechanism to inherit.
- No categories are tile-enabled by default, so a department sees no tiles until someone enables them.
- A user without `PrintDocument` cannot export.
- Mobile-responsive delivery is required.

**Timeline:**
- Target PI **PI.26.5.DEC.04**; Jira critical date **2026-12-31**, due **2027-01-01**.
- T-shirt estimate **M (1.0)**. The Flag Progression read path and the timeline chart component are the two largest unknowns against that estimate.

---

## 4. SUCCESS METRICS

The milestone document contains no success criteria and none were set during Q&A. **These metrics are proposed, not agreed**, and need Product sign-off before Stage 3. All are measurable with the audit logging this PRD already requires, plus existing Datadog instrumentation.

| Metric | Target | Measurement Method | Timeline |
|---|---|---|---|
| Beta department activation | [TBD] % enable ≥1 metric tile | Departments with ≥1 tile-enabled category | 30 days post-enablement |
| Supervisor adoption | [TBD] % of supervisors with downline view ≥1 report | Distinct acting users in view audit events | 60 days post-enablement |
| Repeat use | [TBD] % of adopters return within 30 days | Distinct acting users across two consecutive 30-day windows | 90 days post-beta |
| Export usage | [TBD] exports per active department per month | Export audit events | Ongoing from beta |
| Sales gap closure | Demonstrable in the standard demo script | Demo enablement sign-off | Before GA |
| Report performance | p95 render within [TBD] seconds | Datadog APM on summary-report endpoints | Continuous from beta |

---

## 5. ROLLOUT APPROACH

### Deployment Strategy

**Approach:** Feature flag with a beta customer cohort, then progressive enablement.

**Rationale:** The report concentrates sensitive material — exposure and mental-health documentation included — into a single view and a portable PDF, in a CJIS environment. Flagged rollout validates aggregation and confidentiality behaviour against real department data and real hierarchies before broad exposure. Because no tiles are enabled by default, early departments also test whether the empty-state on-ramp actually leads admins to configure tiles.

**Blocking prerequisite:** `gt-five` has **no feature-flag mechanism**, and `Setting` cannot accept new settings without a migration. The mechanism must be built as part of this initiative, or an existing gating pattern identified. This is the first thing Stage 3 must resolve.

### Phases

**Phase 1 — Internal validation:** Staging and internal departments only. Validates viewability filtering against confidential documents, downline resolution across reorganized hierarchies, timeline density, and export fidelity.

**Phase 2 — Beta cohort:** Selected customer departments (cohort **TBD**). Validates the empty-state on-ramp, tile configuration, performance against production volumes, and PDF export at scale. Success gates progression.

**Phase 3 — Progressive GA:** Flag opened progressively across remaining departments, with demo enablement and release notes per the Jira initiative.

---

## 6. GAP ANALYSIS & RISK FLAGS

### Technical Risks

**PDF export contradicts the only existing export architecture** (HIGH)
The requirement is that Export PDF is "just a pdf export of the page itself." No such path exists. `packages/reports` is exclusively asynchronous, and all five existing report types work that way.
- **Risk:** Reusing the platform means a sixth jsReport template that **re-renders the report server-side** — forcing the timeline chart and progression bars to render in headless Chromium, materially harder than rendering in a browser. Building a true client-side page print instead means net-new export machinery outside the established pattern, with its own audit, permission, and CJIS handling.
- **Recommendation:** Resolve in Stage 2 before prototyping the export; prototype the timeline in headless Chromium early to prove feasibility. Either way, the `PrintDocument` gate, `documentViewability` filtering, and audit logging must hold.

**Flag Progression requires a net-new computation path** (HIGH)
Progression needs each individual's accumulated score toward every rule. That number is not stored — `getWeight()` computes it on document save, compares it to `rule.threshold`, and discards it unless a flag fires.
- **Risk:** The report must invoke this **per individual × per active rule** on demand. For a department with many active rules and a long timespan this is a heavy synchronous read against involvements — the largest new backend capability here and a real threat to the M (1.0) estimate.
- **Recommendation:** Stage 3 decides between on-demand computation, a materialized per-user-per-rule score (the cache-rebuild pattern `relationships` and `flattenedPermissions` already use), or a hybrid. Load-test against the largest production department before committing.

**No feature-flag mechanism exists** (HIGH)
The rollout strategy depends on a capability the codebase lacks; `Setting` cannot be extended without a migration.
- **Recommendation:** First Stage 3 decision. Scope the mechanism explicitly, or identify an existing gating pattern (permission-based, or department-scoped setting via migration).

**Aggregation concentrates CJIS disclosure risk** (MEDIUM)
Per-document controls were designed for per-document disclosure. This report deliberately aggregates a person's full history into one view and one portable PDF.
- **Risk:** A viewer correctly permitted to see each document individually gains a materially more sensitive artifact in aggregate. Officer self-export is designed to bypass admin approval — the intent — but that means an unreviewed export of aggregated sensitive material.
- **Recommendation:** Legal/compliance review of the aggregate export before GA. Audit logging of view and export is non-negotiable.

### Logic Conflicts

**`n/a` deltas cannot be determined without tenure**
`n/a` is required when there is no prior period, *and* hire date and user-created date must never be considered. These are incompatible: without tenure, a short-tenured individual's prior window is simply empty, which computes as a decrease, not `n/a`.
- **Recommendation:** Define "unobservable prior period" on a non-tenure basis — most plausibly, the prior window predating the department's earliest document data. Anything later is a true zero. Confirm in Stage 2.

**Colour scheme conflicts with the milestone document**
The document specifies Commendation green, Corrective action red, Other grey, with deltas red/green by polarity. The agreed treatment inherits the dashboard palette: blue, amber, grey, purple — neither red nor green exists in it.
- **Conflict:** Most dangerously, **grey collides.** The document uses grey for "Other / no flag affiliation"; the dashboard uses grey for **`Both`** and purple for **`Neither`**. A grey marker means the opposite thing under each scheme.
- **Recommendation:** Update the milestone document so the stale scheme cannot be implemented by mistake. Treat the dashboard `DATASETS` const as the single source of truth.

**Delta treatment cannot express polarity under the inherited palette** — *unresolved*
The four dashboard colours encode **category identity**, not direction of change. "Delta colour follows the type of flag, not the direction the number changed" was satisfiable under red/green; it is not under blue/amber/grey/purple, which carry no adverse/favorable meaning. "Corrective actions trending up is bad" becomes inexpressible.
- **Recommendation:** Product and UX decide in Stage 2 whether the delta takes the category identity colour, or retains a separate good/bad treatment layered over an identity-coloured tile. **This blocks the final tile specification.**

**Category classified `Both` has ambiguous polarity**
`ruleType` can be `Both` when a category is tied to both an Early Intervention and a Positive Recognition rule; inheritance gives no answer on whether an increase is favorable or adverse.
- **Recommendation:** Confirm `Both` renders grey and neutral, with no directional delta treatment.

### Workflow Gaps

**`occurred` vs `created` date**
The dashboard aggregates on **`occurred`**, explicitly "to reflect actual incident timing." The milestone document says the timeline shows documents **"created"** in the period. These produce different reports from the same data, and tiles reusing the dashboard query would silently inherit `occurred`.
- **Recommendation:** Choose one basis for the whole report and state it on the report and PDF. `occurred` is the stronger default for behavioural trend analysis and matches existing precedent.

**Empty-state on-ramp is a requirement without a design**
No categories are enabled by default, and the empty state must make it simple to start seeing tiles. But tile configuration is expected to live in category administration — a different screen under different permissions from the supervisor viewing an empty report.
- **Gap:** A supervisor without category-admin rights cannot act on the on-ramp; the requirement may implicitly need an inline admin affordance or an admin-targeted prompt.
- **Recommendation:** UX designs the empty state explicitly, including the non-admin supervisor case. Confirm whether "no defaults" means literally none, or none beyond a seed set inferable from existing flag associations.

**Timeline density has no defined behaviour**
"Unreadable is not an option" is a constraint, not a specification. Clustering thresholds, stacking rules, and marker-collapse behaviour are undefined.
- **Recommendation:** Prototype in Stage 2 against the densest real record available. `react-chartjs-2` with dynamic height (as `Involvements.tsx` does) or a `d3` custom axis are both viable; the choice depends on the headless-Chromium export decision.

**Confidential document handling remains open**
Flagged during Q&A and unresolved. Inheriting the group-based model is implementable, but its interaction with *officer self-export* is undefined — an officer's own exposure or mental-health documents may sit in a confidential group they do not belong to.
- **Recommendation:** Resolve in Stage 2. Determine whether officer self-export sees confidential documents about themselves, and reconcile against `documentViewability`, which governs viewing, not subject-hood.

### Recommendations for Stage 2-3 (Prototype & Solution Design)

1. **Resolve the PDF export architecture** — async jsReport template vs. client-side page print; blocks the timeline design — **HIGH PRIORITY**
2. **Resolve the feature-flag mechanism** — rollout is not executable without it — **HIGH PRIORITY**
3. **Design and load-test the Flag Progression read path** — primary estimate risk — **HIGH PRIORITY**
4. **Settle the delta colour treatment** — blocks the final tile spec
5. **Pick one date basis (`occurred` vs `created`)** and apply it report-wide
6. **Define "unobservable prior period"** without reference to tenure
7. **Correct the milestone document's colour scheme** so the stale values cannot be implemented
8. **Design the empty-state on-ramp**, including the non-admin supervisor case
9. **Prototype timeline density** against the densest available real record
10. **Compliance review of the aggregate export**, including officer self-export of confidential documents
11. **Correct Jira GT-5775** title and description to remove the Guardian Score — *completed 2026-08-27*

---

## 7. OPEN QUESTIONS / TO BE DETERMINED

| Question | Owner | Target Date | Notes |
|---|---|---|---|
| How are confidential documents handled, especially for officer self-export? | Product | Before Stage 3 | Raised in Q&A. Group inheritance agreed in principle; subject-hood vs. viewability undefined |
| Does the delta indicator use category identity colour, or a separate good/bad treatment? | Product + UX | Before Stage 3 | Asked in Q&A, unanswered. Blocks final tile spec |
| Is the report period basis `occurred` or `created`? | Product | Before Stage 3 | Dashboard precedent is `occurred`; milestone doc says `created` |
| What defines an "unobservable" prior period, given hire date cannot be used? | Product | Before Stage 3 | Determines `n/a` vs. a true zero |
| Does a `Both`-classified category render neutral with no directional delta? | Product + UX | Before Stage 3 | Polarity inheritance gives no answer |
| Does the empty-state on-ramp need an inline admin affordance for non-admin supervisors? | UX | Before Stage 3 | Tile config lives in category admin, a different permission scope |
| Does "no default tiles" mean literally none, or none beyond an inferable seed set? | Product | Before Stage 2 | Adoption risk on a sales-driven initiative |
| Where exactly does tile configuration live, and does it need ordering or a cap? | UX | Before Stage 3 | Per-category toggle on category admin recommended; ordering unaddressed |
| Should secondary entry points exist in a later PI? | Product | Post-GA | Deferred from this initiative |
| Which departments form the beta cohort? | Product | Before Phase 2 | Not selected; not currently blocking |
| What are the agreed success metric targets? | Product | Before Stage 3 | All Section 4 targets are proposed, not agreed |

---

## Next Steps

**Stage 2: Prototype Generation** — Load this PRD into the prototype prompt for a clickable mock. Priority targets: timeline density behaviour, the empty-state on-ramp, and metric tile delta treatment.

**Stage 3: Solution Design** — TO runs the solution design plugin against requirements and `gt-five`. Must resolve the export architecture, the feature-flag mechanism, and the Flag Progression computation strategy.

**Stage 4: Epic Breakdown** — PRD + Prototype + Solution Design feed the epic generator for Jira epics and stories with sequencing and dependencies.

**Stage 5: Execution** — Development implements, QA validates, release follows the rollout plan.

**Operational Details:** Customer communications, demo enablement, training, and release notes tracked in the Jira Initiative (Demo: required; Release Notes: needed).

---

## Document Metadata

**Initiative Key:** GT-5775
**Product:** Guardian Tracking | **Sector:** Public (Public Safety / Law Enforcement) | **Target PI:** PI.26.5.DEC.04
**Jira:** [View in Jira](https://lmsportal.atlassian.net/browse/GT-5775)
**Confluence PRD:** [PRD: Individual Summary Reports (GT-5775)](https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/29325459469/PRD+Individual+Summary+Reports+GT-5775)
**Milestone Source:** [Individual Summary Reports](https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/28102164507/Individual+Summary+Reports)
**Code Reference:** `guardian-tracking/gt-five` @ `c92e7807` (v2026.3.4, verified 2026-08-27)
**Created:** 2026-08-27 by Claude AI Assistant
**Last Synced:** 2026-08-27
