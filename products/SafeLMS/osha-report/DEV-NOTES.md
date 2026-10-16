<!--
  DEV-NOTES.md — OSHA Reporting Dashboard (SafeLMS) · DRAFT written at review (2026-10-15)
  Read in the Design Toolbox Flow Map of the dev build: each "## <node-id>" maps to a
  flow-map node and every bullet under it becomes a dev note on that node. Notes stay
  hidden on the design build until a dev_handoff.html exists.

  Source of truth for requirements: PRD - Expanded OSHA Reporting & Capabilities
  (Confluence 29326376990, SAFELMS-32692). Open decisions are tracked in
  mock-definition.md (same folder). Bullets marked "PENDING" depend on those decisions.

  ⚠️ DO NOT SHIP THE TOOLBOX. The bottom-center toolbox pill and its 🗺 Flow Map button
  are REVIEW/HANDOFF TOOLING ONLY. For production, strip the one line
  `<script src=".../designtoolbox/toolbox.js">`, the `window.TOOLBOX_CONFIG` block,
  and the `applyFlowState` / `bootFromHash` flow-map driver.
-->

> author: Design review

## dashboard — OSHA Dashboard
- **Placement:** a new "OSHA Dashboard" tab in the Dashboards menu, next to Impact Insights. Hidden unless the new OSHA Reporting Dashboard preference is on for the district. This is not the existing OSHA columns preference (FR-1, AC-1.1).
- **Scope:** rows are clamped to the signed-in user's position/location permission scope before any filter applies (AC-1.2, A-1).
- **Status Distribution pie:** four statuses only (Passed, In Progress, Not Started, Failed). Static, so clicking it does nothing (no cross-filtering, per Not in scope). It reflects applied panel filters, not the table search.
- **Action Needed cards:** Not Started; Behind Expected Pace (US-2 formula: % Complete < % Elapsed from Effective Date to SafeLMS Due Date); At least 2 failures within a module (module failed-attempt count ≥ 2). Single-select quick filters that apply immediately and sync with the panel (AC-2.1).
- **Card counts:** the "of N people" denominator is a mock addition the PRD doesn't specify (PENDING PM).
- **Table columns, default order:** Learner, Course, Status, % Complete (number + progress bar), Latest Module (Module · Failed Attempts · Quiz Score), Started, Due, Completed, Last Access, Time Spent, Total Course Quiz Failures, Course Failure Date, Certificate. Hidden by default: Username, Expires. The Due default is PENDING (FR-3 vs AC-3.3).
- **Grid:** the table is a stand-in for a DevExtreme DataGrid. Use native sorting, searchPanel (table-only), columnChooser (show/hide + reorder), and add column pinning (AC-3.3). Course is a plain column; there is no group-by. Ignore the older DEV NOTE comment above the table, which still describes grouping and a retry cooldown.
- **Latest Module by provider:** ClickSafety courses show the most recent quiz-bearing module. OSHA 10-Hour Construction (Red Vector) shows the current/next module; its Failed Attempts and Quiz Score stay empty until a quiz is attempted, and that is expected (AC-3.4). The mock only demonstrates the ClickSafety behavior.
- **Module name:** shown verbatim from the feed and wrapped in full. No ellipsis and no hover tooltip, so drop the mock's `title` attribute (AC-3.6, Not in scope).
- **Quiz Score:** ≥ 70 green with a check, ≤ 69 red with an X (AC-3.7).
- **Total Course Quiz Failures:** a cumulative, course-wide integer, separate from the module count; show 0 rather than "—" (AC-3.5). The mock wrongly reuses the latest-module count.
- **Course Failure Date:** populated only after 3 failed attempts within a module; that is also when status becomes Failed (D-2). Re-enrollment behavior is open (D-8).
- **Certificate:** link only when available. ClickSafety URL from the weekly feed for its two courses; Vector-generated link for OSHA 10 Construction (D-4). The column has no header per AC-3.3. The "may take up to a week" note must be a visible callout, not a tooltip (NFR). The mock's preview modal and ClickSafety image for every course are PENDING / wrong for Construction.
- **Last updated + Refresh, pager:** "Last updated" shows the nightly import time. Refresh's behavior is PENDING. The pager shows 25 rows per page with First/‹/›/Last and an "N results" count, and resets to page 1 on any filter, search or sort change.
- **Empty states to build:** when no learners match, the pie must not render (the mock shows a solid red disc), cards must not read "0 of 0", and the table needs a "No learners match these filters" message with Clear filters. Also build loading, stale/failed import, and "no learners in your scope" states.
- **Export:** CSV of the full filtered set, not the current page (AC-5.1, AC-5.2). Give feedback when it starts, and handle the zero-row case.
- **Components:** tabs → `vaadin-tabs`; cards → `vwc-card`; sortable headers → `vwc-sortable-header` (adds `aria-sort`); % bar → `vaadin-progress-bar`; buttons are already correct `vaadin-button`s; status pills → Lumo `theme="badge"` once core is on v1.22.3. The pie has no VWC component (dxPieChart). Swap hard-coded colors for tokens: the mock's `#155DFC` accent is not the Vector primary `--lumo-primary-color` (`#0271ce`). See mock-definition.md → Component confirmation.
- **Info text:** the Action Needed info tooltip must go (NFR: no information in tooltips). Its copy also mentions Email Learners, which is Phase 2.

## filters — Report Filters
- **Behavior:** a right-side panel that edits a draft; nothing applies until Apply Filters (AC-4.1). Closing with ✕ discards the draft. Applied filters show as removable chips after "Filtered to:", with Clear filters (which also resets the group selection and date range).
- **Logic:** options within a section are OR; sections combine with AND (AC-4.5). Table search never affects the overview, chips or export.
- **Order (as designed):** Action Needed · Date Range · People · OSHA Courses · Completion Status · extra checkboxes. The PRD lists date range later; the move under Action Needed is a design decision (2026-10-14).
- **Action Needed:** the PRD specifies multi-select checkboxes (AC-2.1); the mock uses a single-select radio group (PENDING). Either way it stays in sync with the cards.
- **Date Range:** the default is Past 30 days. Presets (Today, Yesterday, Past 7/30/90 days, Past year) are relative to the data's Last updated date. Custom range is one rounded pill with two date fields and an arrow between them; each field opens its own calendar. The draft updates as soon as both dates are valid (no confirm button), and the calendars grey out days that would make end earlier than start. End must be on or after start, or an inline error shows. The default isn't counted as a filter (no chip). A non-default range shows a "Dates:" chip and updates the date text beside the Completion Status Overview title. That text is plain, not a button.
- **Date Range rule:** the mock includes a learner when start ≤ range end and due ≥ range start. The PRD doesn't name the date, so this is PENDING.
- **OSHA Courses:** a fixed checkbox list of the three courses (AC-4.2).
- **Completion Status:** checkboxes for the four statuses (AC-2.3).
- **Due within 30 days:** as built, "In Progress learners whose course Due Date is ≤ 30 days away, including overdue". The PRD says "certifications due within 30 days" (PENDING).
- **2 failures within a module:** must match FR-4 and the card: module failed attempts ≥ 2 for In Progress or Failed learners. The mock's label ("at least 1 failure"), logic (failed-course only) and chip ("Near 3-failure limit") are all wrong.
- **No learner-name filter:** the table search covers it (AC-4.3).
- **Components:** panel → `vwc-drawer position="end"`; Action Needed → `vaadin-radio-group` as built (or `vaadin-checkbox-group` if AC-2.1 multi-select wins); Date Range → consider `vaadin-select theme="outlined"` (opens in an overlay, so no clipping); custom-range fields are native `<input type="date">` in the mock, to match the reference calendar (if built on `vaadin-date-picker`, use `theme="outlined"`); checkboxes → `vaadin-checkbox` in a `vaadin-checkbox-group`; dividers → `vwc-divider`; applied-filter chips have no VWC component yet (gap).

## groups — People Selector / Position & Location
- **Reuse the existing component:** use the standard LMS learner/group selector (as in Compliance by Learner); don't build a new one (AC-4.4). It covers Positions & Locations, Quick Groups, Clever and Dynamic groups.
- **Default:** "All Positions, All Locations", meaning everything within the user's permission scope, not the whole district. Confirm the "Select All Employees In Site" option label is the component's standard wording.
- **Selection display:** the chosen group replaces the default label on the panel's People card (AC-4.4). Applies on Apply Filters like every other filter.
- **Components:** the three picker modals → `vaadin-dialog` (the mock's custom overlays lack a focus trap and Esc handling); the folder tree and list → `vwc-tree-list` (counts in `subtitle`); search → `vaadin-text-field theme="outlined"`; Done → `vaadin-button theme="success primary"`.
- **Quick Groups:** there is no ownership concept, so a group may return zero permitted learners. That must show the empty state, not an error (AC-6.1). Validate scale and whether Quick Groups appear by default with the VRF team (D-7, AC-6.3).

## email — Email Learners (Phase 2)
- **Not in this release:** the PRD's Phase 1 has "No email, SMS or push notifications". This page is Phase 2, to be detailed in its own PRD. Don't build it from this handoff.
- **Kept for reference:** shows a recipient count only (no editable list), a locked greeting and sign-off, an editable message, and Send. The flow-map description ("recipient list … delivery options") is out of date.
