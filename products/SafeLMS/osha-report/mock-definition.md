# Mock Definition — OSHA Reporting Dashboard

**Stage**: In review
**Mock**: `products/SafeLMS/osha-report/ver1.2/index.html`
**Version**: V1.2 (V1.3 is the same design with 9 Not Started learners added to the demo data; every finding applies to both)
**PRD source**: [PRD - Expanded OSHA Reporting & Capabilities](https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/29326376990/PRD+-+Expanded+OSHA+Reporting+Capabilities) (Confluence, last modified 2026-09-11) · Jira [SAFELMS-32692](https://lmsportal.atlassian.net/browse/SAFELMS-32692)
**Reviewed**: 2026-10-15
**Handed off**: not yet
**Components confirmed against**: core v1.22.1, themes v1.9.3 (minimum CONTEXT.md baselines; the mock itself loads core v1.19.0 / themes v1.5.0)

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
7. **Custom date range uses browser date fields, not Vector.** Since 2026-10-16 the custom range is a pill holding two native `<input type="date">` fields, each opening its own browser calendar, to match the reference design. `vaadin-date-picker` can't take that look. Dev should confirm the look with design and decide whether to build it on `vaadin-date-picker` or accept the native control.

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

> **Version fallback:** the mock loads **core v1.19.0** and **themes v1.5.0**. Both predate the first versions that ship a CONTEXT.md, so this audit used the minimum baselines: core v1.22.1 (fetched from the CDN, plus its per-component CONTEXT.md files) and themes v1.9.3 (local `context/themes/v1.9.3/`). The page runs older libraries than the ones it was checked against. `base-template/version.html` is now on core v1.22.3 / themes v1.9.3. Where v1.22.3 (cached locally) documents something v1.22.1 doesn't, the notes say so.

### Summary

| Category | Count |
|---|---|
| ✅ Covered | 7 |
| ⚠️ Partial | 26 |
| ❌ Gap | 3 |

**Key takeaways:**
- **What's solid:** where the mock uses Vaadin, it uses it correctly. That covers every `vaadin-button` (valid `primary`/`secondary`/`tertiary` variants, primary furthest right), the certificate `vaadin-dialog`, the toast `vaadin-notification`, the `vaadin-tooltip` and the Action Needed `vaadin-radio-group`.
- **One real usage error (since replaced):** the two custom-range `vaadin-date-picker`s used `theme="small"` without `outlined`. Core CONTEXT.md says date pickers **must** include `theme="outlined"`. On 2026-10-16 they were replaced with native date fields on purpose (see the table row).
- **Most of the page is hand-built where a VWC component exists.** The biggest ones to replace:
  - The three audience-picker modals (People, Group and List Selector) are custom overlays. They should use `vaadin-dialog`, which the certificate already uses, so the page currently has two dialog systems.
  - The folder-tree picker is custom. `vwc-tree-list` covers nested items, icon, subtitle, single select and keyboard navigation.
  - The right filter panel is custom. It could be `vwc-drawer position="end"`.
  - The dashboard tabs are custom. They could be `vaadin-tabs`.
  - The search inputs are native. They could be `vaadin-text-field theme="outlined"`.
  - The Date Range dropdown is custom. It could be `vaadin-select theme="outlined"`.
  - The sortable headers are custom. They could be `vwc-sortable-header`.
- **Departures that look intentional** (fine to keep for the prototype):
  - The SafeLMS chrome: sidebar and blue banner.
  - The production-matched pill pager (`vwc-paginator`'s shadow DOM can't be restyled).
  - The CSS-only certificate-header tooltip (a `for`-bound `vaadin-tooltip` loses its anchor when the header re-renders).
  - The table, which production builds as a DevExtreme dxDataGrid.
- **Colors:**
  - Only `--blue-accent #0271CE` exactly equals a token (`--lumo-primary-color`).
  - The main accent `--blue-primary #155DFC` is a noticeably different blue from the Vector primary.
  - Status colors are Tailwind-style values close to, but not equal to, the success, error and warning tokens.
  - The neutral grays are very close to the `--lumo-contrast-*` composites.
- **Three true gaps** (no component in core v1.22.1): data-viz charts, removable filter chips, and an inline info banner.
- **Upgrade note:** bumping core to v1.22.3 documents and makes available Lumo `theme="badge"` (status pills and tags) and `vaadin-popover` (the column menu). Neither is in the v1.22.1 CONTEXT.md.
- **Unverified attributes:** these are Vaadin 24 API. Core CONTEXT.md lists the elements but defers to the Vaadin docs for their props, so they couldn't be checked:
  - `theme="small"` on `vaadin-button`, `vaadin-checkbox` and `vaadin-date-picker`.
  - `theme="vertical"` on `vaadin-radio-group`.
  - `no-close-on-outside-click`, `headerRenderer`, `renderer` and `footerRenderer` on `vaadin-dialog`.
  - `position`, `duration` and `renderer` on `vaadin-notification`.
  - `for`, `position` and `text` on `vaadin-tooltip`.

### Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Left sidebar nav (logo, welcome, MAIN/ADMIN groups, district emblem) | `vwc-sidenav` | ⚠️ Partial | Hand-built `.sidebar`/`.nav-item`. `vwc-sidenav` takes `items` (link/group/divider), `activeItemId` and the `topFixed` slot. **Intentional:** SafeLMS chrome. |
| Blue page-title banner ("Dashboard" + description) | `vwc-headline` (header-text + subtext) | ⚠️ Partial | `vwc-topnav` is an app bar (logo, menu slots, 72px default height), not a page-title banner. `vwc-headline` covers title + subtext but not the gradient banner. **Intentional** SafeLMS chrome. |
| Dashboard tabs (Completions / Impact Insights / OSHA Dashboard) | `vaadin-tabs` + `vaadin-tab` | ⚠️ Partial | Native `<button role="tab">` with JS-managed `aria-selected`. Vaadin tabs add keyboard arrow navigation and selection state, and follow `--vwc-brand-color`. |
| Filters / Export / Clear filters buttons | `vaadin-button` | ✅ Covered | `theme="secondary small"`, `"primary small"`, `"tertiary small"` are valid variants. FA icons in `slot="prefix"`. The `small` modifier is **unverified**. |
| Applied-filter chips (removable, "Key: value ×") | none | ❌ Gap | No dismissible chip/tag in core v1.22.1. Lumo `theme="badge"` (v1.22.3) is static with no remove action. See Gap 2. |
| Content cards (Completion Status Overview, OSHA Completion Report, Email Learners card) | `vwc-card` | ⚠️ Partial | Hand-built `.report-card` / `.email-card`. `vwc-card theme="outlined"` (or `padded`) with `header`/`content` slots covers this. |
| Pill labels and tags (status badges, "sample name" tag, lock chip) | Lumo `theme="badge"` (core v1.22.3 only) | ⚠️ Partial | Custom `.status-badge` / `.date-badge` / `.ec-sample`. Only usable after upgrading core. The Quiz Score cell (colored text + ✓/✗) needs no component. |
| Status Distribution pie + legend | none | ❌ Gap | CSS `conic-gradient` pie. No chart component in core; production uses a DevExtreme dxPieChart. Drill views are off (`PIE_DRILLS = false`). |
| Section info icon + tooltip ("Action Needed ⓘ") | `vaadin-tooltip` | ✅ Covered | Anchored with `for="actionNeededInfo"` to a native `<button>`, so it works on hover and keyboard focus. Attributes **unverified**. (The PRD's NFR rules out conveying information this way; see Reconciliation.) |
| Action Needed tiles (count "of N", label, icon; click to filter, click again to clear) | `vwc-card` (surface); `vwc-toggle-button-group` (selection) | ⚠️ Partial | Custom `div role="button" aria-pressed`. `vwc-toggle-button-group` suppresses deselection ("always has one selected"), and the tiles allow click-to-clear, so it isn't a drop-in. Use a `vwc-card` surface and keep the toggle logic. |
| Search inputs (table "Search learners…", modal "Search…") | `vaadin-text-field theme="outlined"` | ⚠️ Partial | Native `<input>` + absolutely positioned FA icon. The Vaadin field has a `prefix` slot plus built-in focus and clear. |
| Manage-columns button + menu (show/hide, drag-to-reorder, Reset) | `vaadin-button theme="icon secondary"`; `vaadin-checkbox`; `vaadin-popover` (v1.22.3 only) | ⚠️ Partial | Native button, `div` menu and native checkboxes. The overlay needs `vaadin-popover` (not in v1.22.1). The DnD package wasn't verified (no CONTEXT.md fetched). Production uses the dxDataGrid `columnChooser`. |
| "Last updated" + Refresh text action | `vaadin-button theme="tertiary"` | ⚠️ Partial | Native text button styled to the production Reports page (`#0747A6`). **Intentional.** |
| Results count + pill pager (First / ‹ 1 › / Last) | `vwc-paginator` | ⚠️ Partial | **Intentional and documented:** the paginator's shadow DOM can't be restyled. `vwc-paginator` also has a page-size selector and "X–Y of Z" text, which this pager doesn't. |
| Report table (sticky two-row grouped header, "Latest Module" band, horizontal scroll) | Themes `.vwc-table`; `vaadin-grid` | ⚠️ Partial | Native `<table>` + custom CSS. Doesn't use the themes table tokens (`--vwc-table-header-background-color`, `--vwc-table-border-color`, `--vwc-table-row-hover-color`). Production is a dxDataGrid. |
| Sortable column headers | `vwc-sortable-header` | ⚠️ Partial | Custom `.sortable-th`, and it sets no `aria-sort`. `vwc-sortable-header` sets `aria-sort` automatically and fires `sort-direction-change`. |
| % Complete mini progress bar | `vaadin-progress-bar` | ⚠️ Partial | Custom `.mod-bar` span. |
| "View certificate" row link | `vaadin-button theme="tertiary small"` | ⚠️ Partial | Native `<button class="cert-link">` styled as a link. |
| Certificate column-header info callout | `vaadin-tooltip` | ⚠️ Partial | CSS-only tooltip. **Intentional and documented** (anchor lost on re-render). The PRD wants a visible callout instead; see Reconciliation. |
| Right "Report Filters" panel (collapsible, pinned Apply footer) | `vwc-drawer position="end"` | ⚠️ Partial | Custom `aside`. `vwc-drawer` covers push mode (`overlay=false`), close button, focus restore (`restoreFocusSelector`) and `overlay-breakpoint`. |
| Icon-only buttons (panel ✕, modal ✕, Email ← back) | `vaadin-button theme="icon"` / `"icon tertiary"` | ⚠️ Partial | Native buttons. The certificate dialog's close already uses `theme="icon tertiary"`. |
| Action Needed radio list (filter panel) | `vaadin-radio-group` + `vaadin-radio-button` | ✅ Covered | `value` / `label` used correctly. Radio groups don't need `outlined`. `theme="vertical"` **unverified**. (The PRD asks for multi-select checkboxes here; see Reconciliation.) |
| Date Range dropdown (trigger + inline preset list + Custom option) | `vaadin-select theme="outlined"` | ⚠️ Partial | Custom; inline to avoid clipping in the scrolling panel. `vaadin-select` opens in an overlay layer, so the panel wouldn't clip it. Worth reconsidering. |
| Custom-range Start / End date pickers | `vaadin-date-picker` | ⚠️ Partial | **Deliberate departure (2026-10-16):** two native `<input type="date">` fields in one rounded pill with an arrow between them, each opening its own browser calendar (month menu, up/down arrows, Clear / Today) to match the reference design. The audit's earlier finding (pickers missing `theme="outlined"`) no longer applies. If built on `vaadin-date-picker`, it must use `theme="outlined"`. |
| Filter section dividers | `vwc-divider` | ⚠️ Partial | Custom `div.filter-divider`. |
| People launcher card (icon + "All positions / at All Locations") | `vaadin-button` or `vwc-card` | ⚠️ Partial | Custom button card; no dedicated selection-summary launcher. |
| Course / Completion Status / extra-option checkboxes | `vaadin-checkbox` (+ `vaadin-checkbox-group`) | ⚠️ Partial | Right component, but the label is a sibling `<span>` in a wrapping `<label>` rather than the checkbox's `label` attribute. Confirm label clicks toggle it. `vaadin-checkbox-group` would add an accessible group label. |
| Apply Filters / "Use these dates" buttons | `vaadin-button` | ✅ Covered | `theme="primary"` (full-width footer) and `theme="secondary small"`. |
| People Selector, Group Selector and List picker modals | `vaadin-dialog` | ⚠️ Partial | Custom `.tree-modal-overlay` (`role="dialog" aria-modal`). No visible focus trap or Esc handling. Inconsistent with the certificate modal's `vaadin-dialog`. |
| Position / Location folder tree and list picker | `vwc-tree-list` | ⚠️ Partial | Custom `.tm-node` tree. `vwc-tree-list` covers nested `items` (id, text, icon, subtitle, children), single `value`, `value-change` and ARIA tree keyboard nav. Counts can go in `subtitle`; live search stays custom. |
| People Selector option buttons | `vaadin-button` | ⚠️ Partial | Custom large light-blue buttons (`#E8F0FE`). |
| Modal "Done" button (green) | `vaadin-button theme="success primary"` | ⚠️ Partial | Custom `.tm-done` (`#15803d`); the `success` modifier is documented for this. |
| Inline text links ("(Click here to change)", footer links) | Themes `.vwc-link`; `vaadin-button theme="tertiary"` | ⚠️ Partial | Custom underlined text; themes documents `.vwc-link` with `--vwc-link-color` / `--vwc-link-decoration-color`. |
| Email message textarea | `vaadin-text-area theme="outlined"` | ⚠️ Partial | Native `<textarea>` with custom border and glow. The Email page is reachable **only from the flow map** in V1.2 (`openActionGroup` is never called; rows render only "View certificate"). |
| Email Cancel / Send buttons | `vaadin-button` | ✅ Covered | `tertiary` + `primary`, primary furthest right. |
| Info banner / hint ("greeting and sign-off are locked…", recipients hint) | none | ❌ Gap | Custom `.pencil-banner` and `.ec-header-hint`. Core v1.22.1 has no inline alert/banner (`vaadin-notification` is a transient toast). See Gap 3. |
| Certificate dialog (header, certificate image, Close / Download PDF) | `vaadin-dialog` (+ `vaadin-button`) | ✅ Covered | Header/body/footer renderers; `icon tertiary` close; tertiary + primary footer. Props **unverified**. |
| Success toast | `vaadin-notification` | ✅ Covered | `position="bottom-center"`, `duration="3200"`, renderer. **Unverified**. |

### Design Token Usage

Token values are quoted from themes v1.9.3 CONTEXT.md. "≈ composite" is the token's alpha value blended over white.

| Color in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
| `#0271CE` (`--blue-accent`: active tab, links, info hover) | `--lumo-primary-color` / `--lumo-primary-text-color` | `#0271ce` | ✅ Match — swap to the token |
| `#155DFC` (`--blue-primary`: bar fills, focus rings, active card border, icons) | `--lumo-primary-color` | `#0271ce` | ⚠️ Off — noticeably brighter, more violet; the main accent doesn't match the Vector primary |
| `#1038C8`, `#1d4ed8`, `#3b6fd4`, `#005DBD`, `#0747A6` (chip text, active option, pager/Refresh) | `--lumo-primary-text-color` | `#0271ce` | ⚠️ Off (pager/Refresh values sampled from production on purpose) |
| `#3b82f6` (In Progress pie/legend) | `--lumo-primary-color` | `#0271ce` | ⚠️ Off |
| `#eff6ff`, `#dbeafe`, `#F0F5FF`, `#E1EBF9`, `#E8F0FE`, `#d8e6fd`, `#EEF2FF`, `#eef2f7`, `#FBFCFE` (blue tints) | `--lumo-primary-color-10pct` | `#0271ce1a` (≈ `#E5F0FA`) | ⚠️ Off (`#E1EBF9` closest) |
| `#bfdbfe`, `#93c5fd`, `#C7D2FE` (chip border/remove icon, sample-tag border) | `--lumo-primary-color-10pct` / `-50pct` | `#0271ce1a` / `#0271cec2` | ⚠️ No direct match |
| `rgba(21,93,252,.12–.20)` (focus glows) | `--lumo-primary-color-10pct` | `#0271ce1a` | ⚠️ Off |
| `#101828` (`--ink`: headings, counts) | `--lumo-header-text-color` / `--lumo-contrast` | `#000000de` / `#192434` | ⚠️ Off |
| `#344055` (`--ink-2`: body), `#1D2939` | `--lumo-body-text-color` / `--lumo-contrast-90pct` | `#000000de` / `#18273af0` | ⚠️ Off |
| `#6A7282` (`--muted`), `#4b5563`, `#4A5565` | `--lumo-secondary-text-color` | `#00000099` | ⚠️ Off (cooler gray) |
| `#99A1AF` (`--muted-2`: icons, hints) | `--lumo-tertiary-text-color` | `#1c304a85` (≈ `#8993A0`) | ⚠️ Off |
| `#374C61`, `#364C61`, `#364153` (sidebar / Last-updated) | `--lumo-contrast-80pct` | `#1a293dd4` | ⚠️ Off (SafeLMS chrome, sampled on purpose) |
| `#E5E7EB` (`--hair`: borders) | `--lumo-contrast-10pct` | `#1a38601a` (≈ `#E8EBEF`) | ⚠️ Off (near-equal) |
| `#F3F4F6`, `#F2F5F8`, `#f9fafb`, `#fafafa` (canvas, hover, table header) | `--lumo-contrast-5pct` | `#193b670d` (≈ `#F3F5F7`) | ⚠️ Off (first two near-equal) |
| `#e9eaec`, `#e2e5ea`, `#CFD6E0` (hover fills, card hover border) | `--lumo-contrast-10pct` | `#1a38601a` | ⚠️ Off |
| `#d1d5db` (input borders, Not Started pie), `#D6DEEA` | `--lumo-contrast-20pct` | `#1c375a29` (≈ `#DBDFE5`) | ⚠️ Off |
| `rgba(30,58,95,0.025)` (Latest Module band) | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ No direct match |
| `#fff` | `--lumo-base-color` | `#fff` | ✅ Match — swap to the token |
| `#15803d` (Passed text, quiz pass, Done) | `--lumo-success-color` / `--lumo-success-text-color` | `#158444` / `#0a7637` | ⚠️ Off (very close) |
| `#22c55e` (Passed pie), `#4ADE80` (toast check) | `--lumo-success-color` | `#158444` | ⚠️ Off (much brighter) |
| `#dcfce7` (Passed badge background) | `--lumo-success-color-10pct` | `#1688461a` (≈ `#E7F3EC`) | ⚠️ Off |
| `#126b34` (Done hover) | none (handled by `theme="success primary"`) | none | ⚠️ No direct match |
| `#dc2626` (Failed pie) | `--lumo-error-color` | `#d83e38` | ⚠️ Off (close) |
| `#b91c1c` (Failed text, quiz fail) | `--lumo-error-text-color` | `#ca150c` | ⚠️ Off (close) |
| `#fee2e2` (Failed badge, retry tile) | `--lumo-error-color-10pct` | `#e71d131a` (≈ `#FDE8E7`) | ⚠️ Off (close) |
| `#f4a5a5` (dormant drill) | `--vwc-color-cinnabar-200` | `#f4ada4` | ⚠️ Off (inactive) |
| `#d97706` (nudge icon) | `--lumo-warning-color` | `#e0782e` | ⚠️ Off (close) |
| `#92400e`, `#b45309` (Overdue / due-soon text) | `--lumo-warning-text-color` | `#995211` | ⚠️ Off (close) |
| `#fef3c7` (nudge tile, Overdue badge) | `--lumo-warning-color-10pct` | `#ffcc001a` | ⚠️ Off |
| `#f59e0b`, `#14b8a6`, `#7c3aed` (dormant drill colors) | `--vwc-color-ecstacy-500` / `--vwc-color-puerto-rico-500` / `--vwc-color-vivid-violet-700` | `#f98e2b` / `#3cbfae` / `#7e398c` | ⚠️ Off (dormant) |
| `#fdece4` / `#c2410c` (Location node icon tile) | `--vwc-color-ecstacy-50` / `-700` | `#fef4ea` / `#b1651f` | ⚠️ Off |
| Topbar gradient `#05347a → #095ad2` and related chrome values | none | none | ⚠️ No direct match (SafeLMS brand chrome, intentional) |
| `rgba(16,24,40,.45)` (custom modal backdrop) | none (provided by `vaadin-dialog`) | none | ⚠️ Goes away with `vaadin-dialog` |
| `0 1px 3px rgba(16,24,40,.10)` (+ `0 1px 2px …06`) | `--lumo-box-shadow-xs` | `0 1px 4px -1px #1c304a85` | ⚠️ Off |
| `0 10px 28px rgba(16,24,40,.16)`, `0 8px 28px -6px rgba(16,24,40,.28)` | `--lumo-box-shadow-m` | `0 2px 6px -1px #1c375a29, 0 8px 24px -4px #1c324f61` | ⚠️ Off |
| `0 18px 64px -8px rgba(16,24,40,.35)` (custom modals) | `--lumo-box-shadow-xl` | `0 4px 24px -3px #1c375a29, 0 18px 64px -8px #1c324f61` | ⚠️ Off (same geometry, different color) |
| `#1b2330`, hatch `#fafafa` / `#d9d9d9` (certificate overlay) | none | none | ⚠️ Matched to the ClickSafety PNG on purpose |

Font: the `"Open Sans"` stack matches `--lumo-font-family`. Body text is 16px; `--lumo-font-size-m` is `14px`.

Excluded: unused CSS for elements this version never renders (`.chart-flip`, `.donut`, `.prog-chart`, `.bar-chart`, `.module-breakdown`, `.dlv-*`, `.pp*`, `.info-grid`, `.detail-grid`, `.group-row`, `.tree-launch`, `.tree-dropdown`, `.filter-chips`) and the flow-map color `#9ec5fe`. Worth removing that dead CSS before the dev build.

### Gap Component Requirements

The audit ran embedded, without designer input, so each gap lists its open decisions.

**1. Data-viz charts (Status Distribution pie/donut + legend).**
- **Proposal:** a shared chart surface, or an official stance on the third-party chart library.
- **Open:**
  - If production uses DevExtreme dxPieChart, VWC only needs a palette/theming guide, as themes already provides for AG Grid and FullCalendar.
  - Which tokens should the status series use? There is no semantic data-viz series set today.
  - Should the dashed empty ring be standardized?
  - Is the drill-down coming back (`PIE_DRILLS`)?

**2. Removable filter chip.**
- **Proposal:** a dismissible "Key: value ×" chip with a remove event, possibly extending Lumo `badge` (v1.22.3).
- **Open:**
  - Does it need a key prefix, max width with truncation, and a "Clear all" companion?
  - Does each remove button need an `aria-label`, and where does focus go after removal?
  - Does it overlap with future multi-select combo box chips?

**3. Inline info / alert banner.**
- **Proposal:** a persistent message block with info, success, warning and error variants (icon, left accent, optional actions, optional dismiss).
- **Open:**
  - Is it a VWC component or a themes CSS class (like `.vwc-link` / `.vwc-table`)?
  - What does the "hint" density look like compared with a full banner?
  - Should it use `role="status"` or `role="alert"`?
  - Is it dismissible?

## Open questions

- **Action Needed in the panel:** single-select (as built) or multi-select (AC-2.1)? Update whichever is wrong.
- **2-failures filter:** confirm FR-4's "at least 2 failures within a module", then fix the panel label, logic and chip to match the card.
- **Date range:** which date does it apply to (assignment window as built, start date, completion date, last access)? Is "Past 90 days" (design default since 2026-10-16) the right default? The PRD only gives "past 30 days" as an example.
- **"Certifications due within 30 days":** course due date for In Progress learners (as built), or certification expiry?
- **Total Course Quiz Failures:** confirm the feed supplies a course-wide total alongside the module count (D-2 open item), and show 0 rather than "—".
- **Certificate:** link vs. preview modal; no column header per AC-3.3; pending state before the weekly feed delivers it.
- **Due column:** on by default (FR-3, as built) or off (AC-3.3 default list)?
- **Refresh button:** keep it, given nightly data? What does it do?
- **Info text:** where does the "up to a week" certificate note and the Action Needed explanation go now that tooltips are out?
- **Email Learners page:** confirm it's Phase 2 and should be separated from this handoff.
- **Component library version:** the mock loads core v1.19.0 / themes v1.5.0; the template is on core v1.22.3. Build against the current version, which also makes the Lumo badge and `vaadin-popover` available.
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
