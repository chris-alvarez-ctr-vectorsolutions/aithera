# Mock Definition — OSHA Reporting Dashboard

**Stage**: In review
**Mock**: `products/SafeLMS/osha-report/ver1.2/index.html`
**Version**: V1.2 (V1.3 is the same design with 9 Not Started learners added to the demo data; every finding applies to both)
**PRD source**: [PRD - Expanded OSHA Reporting & Capabilities](https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/29326376990/PRD+-+Expanded+OSHA+Reporting+Capabilities) (Confluence, last modified 2026-09-11) · Jira [SAFELMS-32692](https://lmsportal.atlassian.net/browse/SAFELMS-32692)
**Reviewed**: 2026-10-15
**Handed off**: not yet
**Components confirmed against**: see Component confirmation

> **Nothing here locks the mock.** Design can keep changing in review and after
> handoff. Post-handoff changes are recorded in the Handoff log at the bottom and
> listed under "Changed since handoff" on the dashboard card.
>
> **Read this first.** This document captures what the visual mock cannot show on
> its own: which requirements it satisfies, where it diverges from the PRD, the
> edge cases still to build, and the Vector components to use. Pair it with the
> **DEV-NOTES.md** in this folder for per-screen detail.

---

## Summary

The OSHA Reporting Dashboard is a new tab in the SafeLMS Dashboards menu for admins and teachers tracking OSHA 10/30-hour course progress. It has a Completion Status Overview (status pie and three Action Needed cards), a Filters side panel, and the OSHA Completion Report table with latest-module detail and a certificate link. V1.2 covers Phase 1 of the PRD. The Email Learners page from Phase 2 is still in the file, but only the flow map reaches it.

The review found the mock broadly aligned with Phase 1. These need a decision before handoff, most important first:

1. **Action Needed filter in the panel.** The panel is single-select (radio buttons). AC-2.1 says multi-select checkboxes.
2. **"2 failures within a module" filter.** The panel option says "at least 1 failure" and only matches learners who already failed the course. FR-4 says at least 2 failures within a module.
3. **Total Course Quiz Failures.** The column shows the same number as the latest module's failed attempts. AC-3.5 says it is a separate, course-wide total.
4. **OSHA 10-Hour Construction behavior.** This course is Vector-authored. The mock shows the wrong latest-module behavior (AC-3.4) and the ClickSafety certificate (D-4) for it.
5. **Hover tooltips.** Tooltips carry information in three places, which the accessibility NFR rules out.
6. **No-results state.** When filters match no learners, the pie turns solid red and the table goes blank with no message.

The Date Range filter, removed on 2026-07-15 (a44243f3), was restored on 2026-10-14 (efb2d531) and now sits under Action Needed.

## Reconciliation

### Requirements missed in the mock (PRD → mock)

| PRD requirement | In mock? | Notes / where it belongs |
|---|---|---|
| AC-2.1 — panel Action Needed checkboxes are **multi-select**, at the top of the panel; tiles are single-select | ❌ | The panel uses a single-select `vaadin-radio-group` ("All learners" + 3 buckets). This was a deliberate change (commits 331a2f22, 3f70c935, "single-select Action Needed filter"), so either update AC-2.1 or switch the panel back to checkboxes. Tiles are correctly single-select and stay in sync. |
| FR-4 — filter "learners with at least 2 failures within a module" | ❌ | The extra checkbox reads "Only learners with at least 1 failure within a module". Its logic is `status === 'failed' && attempts >= 2`, so it only returns learners who already **failed the course**, and its chip reads "Near 3-failure limit". The label, the logic and the chip all need to match FR-4 and the "At least 2 failures" card (`GROUP_MATCH.retry`). |
| AC-3.5 — Total Course Quiz Failures is a cumulative count across the course, **distinct** from the module count | ❌ | The column renders `r.attempts`, the same value as the Latest Module "Failed Attempts" column. Passed learners whose latest module shows 1 failed attempt (e.g. Abbott, Cleo) show "—" for the course total, so the total is lower than one module's count. AC-3.5 also asks for a plain integer, so show 0, not "—". |
| AC-3.4 — Red Vector (OSHA 10-Hour Construction) shows the **current/next** module; name populated, attempts and score empty until a quiz is attempted | ⚠️ | The mock treats all three courses as ClickSafety (latest module *with a quiz result*). The expected Red Vector state, a module name with empty Failed Attempts and Quiz Score, is never shown. Add at least one Construction learner in that state. |
| D-4 — Vector-authored course certificate is generated dynamically by Vector; ClickSafety certificate only for ClickSafety courses | ❌ | "View certificate" opens the ClickSafety certificate image for **all three** courses, including OSHA 10-Hour Construction. |
| AC-3.3 — columns are user-configurable: **pin**/hide/reorder | ⚠️ | Manage columns supports show/hide and drag-to-reorder, but not pinning. |
| AC-3.3 — Certificate column has **no header**; an info callout says certificates may take up to a week | ⚠️ | The column has a "Certificate" header. The "up to a week" text is a hover/focus tooltip on an info icon (see NFR row). |
| NFR Accessibility — "this dashboard avoids tooltips for conveying information" (also Not in scope: hover tooltips on module names) | ❌ | Three tooltips carry information: (1) the Action Needed info icon (`vaadin-tooltip`), (2) the Certificate header info icon (`.ci-tip`), (3) a native `title` attribute on every module name (duplicates the wrapped text). Replace (1) and (2) with visible text or an inline callout, and drop (3). |
| FR-4 — "certifications due within 30 days" / "certifications due in under 30 days" | ⚠️ | The mock offers "Only learners in progress with course due ≤ 30 days". It uses the course Due Date, is limited to In Progress learners, and includes overdue ones. The PRD's wording ("certifications due") is ambiguous; confirm the intended date and population. |
| FR-4 — date range "including relative ranges like 'past 30 days'" | ✅ / ⚠️ | Restored 2026-10-14: Today, Yesterday, Past 7/30/90 days, Past year, or a custom range; applies on Apply Filters and narrows the table, pie and cards. **Open:** the PRD doesn't say which date it filters on. The mock assumes the assignment window (start date to due date) overlapping the range. |
| AC-5.1 — export as CSV at launch | ⚠️ | An Export button exists but does nothing visible. Nothing shows the format (CSV) or confirms the download. AC-5.2 (export honors applied filters) can't be seen. |
| FR-1 / AC-1.1 — dashboard hidden unless the new OSHA Reporting Dashboard preference is on | ⚠️ | Not representable in a mock; the tab is always shown. Call out for dev (see Behavior & data). |
| AC-1.2 / US-3 — group-scoped admins see only their learners | ⚠️ | Not demonstrated; no scoped-admin variant. See Potential gaps for the "no permitted learners" case. |
| FR-3 — table includes due date; AC-3.3 default column list omits Due | ⚠️ | The PRD contradicts itself. The mock shows Due by default, between Started and Completed. PM to confirm the default. |
| AC-2.1 tiles single-select + sync with panel; AC-2.2 search/sort don't change the summary; AC-2.3 four status values; AC-2.4 2-failure tile threshold | ✅ | Matches. The tile uses `attempts >= 2` for In Progress or Failed learners. |
| AC-3.1 learner and username are separate sortable columns | ✅ | Username is hidden by default, as AC-3.3 lists it. |
| AC-3.2 % complete with a progress bar | ✅ | |
| AC-3.6 module names wrap in full, no ellipsis | ✅ | Wraps (`.lm-name`), but see the `title` tooltip above. |
| AC-3.7 quiz score ≥ 70 green with check, ≤ 69 red with X | ✅ | `quizScoreCellHTML`. |
| AC-4.1 panel applies on Apply Filters and updates table + pie + counts; AC-4.2 fixed course checkbox list; AC-4.3 no learner-name filter; AC-4.4 standard group selector, default "All Positions, All Locations", selection shown in panel, cleared by Clear filters; AC-4.5 OR within a section, AND across | ✅ | The People card plus the People Selector cover Positions & Locations, Dynamic, Clever and Quick Groups. |
| Not in scope — cross-filtering from the summary visualization | ✅ | The pie is static (`PIE_DRILLS = false`). Only the Action Needed tiles filter the table, as AC-2.1 allows. |

### In the mock but not in the requirements doc (mock → PRD)

| Mock element / behavior | In PRD? | Recommendation |
|---|---|---|
| Email Learners compose page (locked greeting/sign-off, editable message, send) and its flow-map node | ❌ Not in this PRD (Phase 2 "detailed out separately"; Not in scope: "No email, SMS or push notifications for this release") | Mark the page and flow-map node as Phase 2, or move them to their own mock, so dev doesn't build them in Phase 1. |
| Certificate opens a preview modal with "Download PDF" | ❌ PRD says "certificate link" | Confirm with PM: link out vs. in-app preview. |
| Action Needed cards show "N **of M people**" | ❌ PRD specifies counts only | Add to PRD or confirm intentional. Also see Potential gaps for "of 0". |
| "Last updated Jun 22, 2026 6:00 AM" + Refresh button on the table | ❌ | Add to PRD. Data is nightly (NFR), so define what Refresh does: re-query the latest nightly data, not a live refresh. |
| Pagination: 25 rows per page, First / ‹ › / Last pill pager, "N results" | ❌ | Add to PRD (page size, whether export ignores paging). |
| Default sort Learner A→Z; every column sortable | ❌ | Add to PRD or confirm intentional. |
| Manage columns "Reset" | ❌ | Confirm intentional. |
| Date Range hint "Learners whose assignment (start to due date) falls in this range." and its overlap rule | ❌ | PM to confirm which date the range uses (see Open questions). |
| Expires (hidden column) = pass date + 1 year for passed learners | ❌ PRD D-2 leaves Expiration semantics open | Don't build from the demo data; wait for the ClickSafety answer. |
| People card in the panel ("All positions at All Locations") opening the People Selector with "Select All Employees In Site" | ⚠️ AC-4.4 specifies the standard component | Matches the PRD's intent. Confirm the "In Site" label is the standard component's own wording, since the PRD's default is the user's permission scope, not the whole district. |
| Course-fail rule enforced in code: a learner is Failed only after 3 failed attempts | ⚠️ Implied by D-2/D-8, not stated as a status rule | Add the rule to the PRD so status mapping is explicit. |

### Potential gaps

| Area / screen | Edge case | Current handling | What's needed |
|---|---|---|---|
| Overview + table | **Zero results** after filtering (e.g. Completion Status = Not Started in V1.2, or a Quick Group with no permitted learners per AC-6.1) | Pie turns **solid red** (reads as 100% Failed), legend shows four 0s, cards show "0 of 0 people", table body is blank with only "0 results" | An empty state for the pie (like the existing dashed ring), the cards, and the table ("No learners match these filters" + Clear filters). |
| Whole dashboard | Loading (first load, Apply Filters, Refresh) | Refresh spins its icon; nothing else | Loading state for the overview and the table. |
| Whole dashboard | Data feed failed or is stale (nightly ClickSafety/Red Vector import missing) | None; "Last updated" always shows a fixed date | Error or stale-data message when the last import is old or failed. |
| Permissions | Admin whose scope has no OSHA learners; preference off | None | Empty state for "no learners in your scope"; tab hidden when the preference is off. |
| Table | Learner re-enrolled after 3 failures (D-8): progress drops, failure fields reset or persist | Not shown | Blocked on the ClickSafety answer in D-8; design the "reset" row once known. |
| Table | Passed learner whose certificate hasn't arrived yet (weekly feed) | Every passed learner shows "View certificate" | A "pending" state for passed learners without a certificate URL yet. |
| Table | Red Vector learner with a current module but no quiz yet | Not shown (see AC-3.4 row) | Module name + empty attempts/score. |
| Filters panel | Custom date range validation | End before start shows an error; missing dates show an error | ✅ Handled. |
| Filters panel | Large numbers of positions, locations, Quick Groups (D-7) | Tree search exists | Confirm scale with the VRF team (D-7, AC-6.3). |
| Export | Export with 0 rows; large exports | No feedback | Disable or warn at 0 rows; progress or "export started" feedback. |
| Overview | Long learner/course names, very large counts in cards | Cards wrap | ✅ Acceptable; confirm at 3-digit counts. |

### Claims to verify

| Claim in the mock | Where | PRD says | Verdict |
|---|---|---|---|
| "Click a category to filter the report to those learners (click again to clear) Or use Email Learners to contact that group." | Action Needed info tooltip | Not in scope: "No email, SMS or push notifications for this release." NFR: avoid tooltips for conveying information. | ❌ Contradicts: email is Phase 2, and the copy is in a tooltip. |
| "Only learners with at least 1 failure within a module" | Filters panel checkbox | FR-4: "learners with at least 2 failure within a module" | ❌ Contradicts |
| "Near 3-failure limit" | Applied-filter chip for the same checkbox | FR-4: "at least 2 failure within a module" | ❌ Contradicts (different concept from the label and the PRD) |
| "At least 2 failures within a module — connect for remediation" | Action Needed card + panel radio | FR-2: "At Least 2 Failures Within a Module (connect for remediation)" | ✅ Matches |
| "Behind pace — needs a nudge" (panel) vs. "Behind the expected pace — needs a nudge" (card) | Panel radio label, card label | FR-2: "Behind Expected Pace" | ⚠️ Wording differs between card and panel; align. |
| Due-soon and Behind Pace use the Due Date, "NOT the Expiration date" | Code comment (`dueSoon`) | US-2: "Due Date is the SafeLMS-side due date; ClickSafety's expiration date is not used in this calculation." | ✅ Matches |
| "Assignment dates. ClickSafety reports these per enrollment" | Code comment (`courseDates`) | D-2: ClickSafety has "No assignment date — only a start/launch date"; D-3: assignment and due date "are tracked at the SafeLMS level" | ❌ Contradicts: due and assignment dates come from SafeLMS, not ClickSafety. |
| "behind = backend-flagged 'behind the expected pace'" | Data comment | US-2: Behind Pace = % Complete < % Elapsed, from the **Effective Date** to the Due Date | ⚠️ Consistent, but the demo flags are hand-set, not computed. The mock has no Effective Date field. Dev must implement the US-2 formula. |
| A learner is Failed only after 3 attempts; the Course Failure Date arrives then | Code comment ("Course-fail rule") + Course Failure Date column | D-2: "Failure Date (reached after 3 failed attempts within a module)" | ✅ Matches (the "3 attempts **within a module**" part) |
| Total Course Quiz Failures = the learner's latest-module failed attempts | `COLUMNS.attempts` renders `r.attempts` | AC-3.5: "cumulative count of quiz failures across the whole course, distinct from the module-level count" | ❌ Contradicts |
| "Each OSHA course has 10 modules; the last is the Final Assessment" | Module model comment + demo data | Not stated; module counts come from the provider | ⚠️ Not in PRD (demo assumption; don't build from it) |
| Module names are "a two-digit lesson number … then 'Topic Quiz:', then the topic" (e.g. "02. Topic Quiz: Introduction to OSHA") | Module model comment + demo strings | AC-3.4 example: "26 Topic Quiz Ergonomics", displayed verbatim | ⚠️ The verbatim rule matches, but the demo format (period + colon) differs from the PRD's sample. Use real feed strings in testing. |
| Latest Module = "the module ClickSafety most recently reported", for every course | Column comment + flow-map node desc | AC-3.4: Red Vector course shows the current/next module | ❌ Contradicts for OSHA 10-Hour Construction |
| "Certificates may take up to a week to display after a learner passes." | Certificate header info tooltip | AC-3.3: "Info callout informing the user that the certificate may take up to a week to display." | ✅ Text matches · ⚠️ delivered as a tooltip (NFR) |
| ClickSafety certificate (serial, IACET CEUs, contact hours) for every course | Certificate modal | D-4: Vector-authored course has no ClickSafety certificate; its link is generated by Vector | ❌ Contradicts for OSHA 10-Hour Construction |
| Email Learners: "recipient list, message body, and delivery options" | Flow-map node `email` description | Phase 2: "a simple confirmation (recipient count) … not an editable recipient list" (and the page itself shows a count only) | ❌ Contradicts both the PRD and the page |
| Status pie + Action Needed cards + table with Latest Module; "No per-module modal" | Flow-map node `dashboard` description | Not in scope: "module-by-module drill-down or detail view" | ✅ Matches |
| Filter panel lists action-needed, date range, Position/Location, Quick Groups, courses, status, due ≤ 30 days | Flow-map node `filters` description | FR-4 also lists "at least 2 failure within a module" | ⚠️ Omits the 2-failures filter (which is itself mislabeled) |
| Group-by-course rows with expand/collapse; "Failure/Retry (eligible-to-retry = failure date + cooldown)"; overview is "dxPieChart + dxChart" | DEV NOTE comment above the table | The table is a flat list (Course is a column). The PRD never mentions a retry cooldown. The bar chart was replaced by Action Needed cards. | ❌ Stale/unsupported. The cooldown appears nowhere in the PRD. Remove or rewrite this dev note before handoff. |
| "Completion Status Overview (pie + bar)" | Top-of-file CSS comment | Overview = one summary visualization + three Action Needed indicators | ⚠️ Stale |
| "V1/V1.1 …, V1.2 adds a dynamic status pie that drills into the selected Action Needed group, and V2 is the pre-update report" | `products.json` desc (dashboard card) | — | ❌ Stale: the loader lists only V1.2/V1.3 and the pie is static. Rewrite the card description. |
| Expires = pass date + 1 year; in-progress learners have their own expiry | Demo data | D-2: "the exact semantics of Expiration Date … still need to be clarified directly with ClickSafety" | ⚠️ Not in PRD |
| Date range: "Learners whose assignment (start to due date) falls in this range." | Filters panel hint | FR-4: "date range — including relative ranges like 'past 30 days'" (no date named) | ⚠️ Not in PRD (assumption added 2026-10-14) |

**Built and later removed:** the Date Range filter (removed a44243f3 on 2026-07-15, restored efb2d531 on 2026-10-14). The other removals are consistent with the PRD: row/card/toolbar Email buttons and table multi-select (Phase 2), Modules Complete (out of scope), and the "Data refreshed nightly" note.

## Behavior & data (not visible in the mock)

- **Data sources**: ClickSafety nightly feed for OSHA 10 General Industry and OSHA 30 Construction; Red Vector (Vector-authored) for OSHA 10 Construction; SafeLMS for effective date, due date and permissions (D-1–D-3). Demo data is hand-tuned (48 learners in V1.2, 57 in V1.3) so no two on-screen counts repeat; don't treat demo values as rules.
- **Status mapping**: four values only (Passed, In Progress, Not Started, Failed). Failed = 3 failed attempts within a module (D-2). 1–2 failures stay In Progress.
- **Behind Pace**: compute per US-2 with the Effective Date and the SafeLMS Due Date. The mock's `behind` flags are hand-set.
- **Latest module**: ClickSafety = most recent quiz event; Red Vector = current/next module (AC-3.4). Module name verbatim from the feed.
- **Filters**: draft until Apply Filters; OR within a section, AND across; table search and sort are view-only and don't touch the overview, chips or export. Tiles are single-select quick filters that sync with the panel.
- **Date range**: presets are relative to the data's "Last updated" date. In the mock, a learner matches when start ≤ range end and due ≥ range start (Not Started learners have no start date). Pending PM confirmation.
- **Export**: CSV of the filtered set (AC-5.2), not just the visible page.
- **Permissions / roles**: the dashboard is behind the new OSHA Reporting Dashboard preference (off by default). Row scope is the user's position/location permission, which clamps every filter (A-1, AC-6.1).
- **Certificate**: ClickSafety URL from the weekly feed for its two courses; a Vector-generated link for OSHA 10 Construction (D-4). Shown only when available.

## Component confirmation

_Pending: the Vector component audit is running and will be pasted here._

## Open questions

- **Action Needed in the panel:** single-select (as built) or multi-select (AC-2.1)? Update whichever is wrong.
- **2-failures filter:** confirm FR-4's "at least 2 failures within a module", then fix the panel label, logic and chip to match the card.
- **Date range:** which date does it apply to (assignment window as built, start date, completion date, last access)? Is "Past 30 days" the right default?
- **"Certifications due within 30 days":** course due date for In Progress learners (as built), or certification expiry?
- **Total Course Quiz Failures:** confirm the feed supplies a course-wide total alongside the module count (D-2 open item), and show 0 rather than "—".
- **Certificate:** link vs. preview modal; no column header per AC-3.3; pending state before the weekly feed delivers it.
- **Due column:** on by default (FR-3, as built) or off (AC-3.3 default list)?
- **Refresh button:** keep it, given nightly data? What does it do?
- **Info text:** where does the "up to a week" certificate note and the Action Needed explanation go now that tooltips are out?
- **Email Learners page:** confirm it's Phase 2 and should be separated from this handoff.
- **Re-enrollment (D-8)** and **Expiration Date semantics (D-2)** remain open with ClickSafety.

## Handoff notes

- Per-screen developer detail lives in **`DEV-NOTES.md`** in this folder. It renders in the flow map of the dev build once one exists.
- ⚠️ **The toolbox dock and flow-map button are review tooling — do not ship them.** For production, strip the single `<script src=".../toolbox.js">` include from the page, along with the `window.TOOLBOX_CONFIG` block and the `applyFlowState` / `bootFromHash` flow-map driver. The dock pill, comment widget and flow map are not part of the product design.
- The table is a visual stand-in for a DevExtreme DataGrid; see DEV-NOTES for the mapping (and ignore the stale DEV NOTE comment above the table until it's rewritten).

## Handoff log

Every handoff, re-sync, and post-handoff change, newest last. Changes keep
happening after handoff; this is where they are written down.

| Date | Change | Version | Dev build re-synced? | Devs told? |
|---|---|---|---|---|

Not handed off yet.
