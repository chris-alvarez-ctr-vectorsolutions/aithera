# Unified Home Dashboard (Convergence + Vector EHS) · dev notes

> author: Design handoff
> date: 2026-09-25

One version. A recommendation's details open in a right-hand side panel on click (`window.REC_DETAIL_MODE = 'panel'`). The home page is also what the user builds: Settings › Build your dashboard puts this same page into edit mode (see `build` below).

Notes are grouped by flow-map node. They render in the dev_handoff build only; while the mock is in progress the commit history is the change log.

## home Home, all facilities
- **App shell:** the V3 app-rail shell from design-system/navigation/v3-app-rail.html (markup in ver1/index.html, styles in shell.css, behaviour in shell.js). Full-height 56px product rail on the left (Bridge pinned on top, then licensed platforms, waffle launcher at the bottom), 56px top bar inset to its right (nav toggle, Vector | Bridge lockup, centred scoped search, notifications, help, avatar menu), 280px side nav that collapses to a 56px icon column from the top-bar toggle only, with a hover peek overlay (clone of the nav, 16px halo, 100ms in / 500ms out; clicking the toggle while peeking docks it). V3's placeholder colours resolve to Vector theme tokens. Nav items are one unified IA (Home; Work: Incidents, Corrective actions, Inspections and observations, Training, Qualifications; Insights: Reports; Organization: People, Locations; Settings pinned at the foot). Never group items by product.
- **Location picker lives in the top bar,** right of search and left of the notification bell, with a divider on each side. The button shows only the current location name; the menu is a fixed-position tree-list (Company › Region › Facility › Department, names only, hierarchy by indentation, find-as-you-type) hung from the button's right edge so it never runs past the window. The filter row shows the current scope with a Change link that opens the same picker. The page scrolls inside the content column, not the window.
- **Shared hierarchy:** the location picker is Company › Region › Facility › Department and must resolve to the same IDs in both products. Mismatched hierarchies are a known customer pain; the picker never shows two trees.
- **Filter row scopes everything:** location, date range and search sit in one row above the widgets. Every widget re-renders against the same slice; the comparison note says which prior period the deltas use.
- **KPI tiles:** stat-card pattern (outline icon + label, 34px value, delta pill with a diagonal arrow, "vs. prior period" line, 12-point sparkline). Each tile carries a subtle source chip (EHS or Training). Up is always shown as bad for these four metrics.
- **Ask for a recommendation** (widget header): a thread in a dialog, ported from the Readiness Hub's Agency Intelligence panel. The user says what they have noticed (chips add common observations) and picks a location or lets the text decide; after a 620ms beat with thinking dots, the answer is a severity + headline, a bold summary built from both products (incidents, near misses, the department carrying them, the training gap), its sources, and two actions: Add to Recommended actions, or Ask differently. Adding inserts the card at the top of the widget tagged "From your question", opens it in the side panel, and offers Remove in the toast. Keyword matching stands in for the service; the dev build should call the recommendation service with the note + location.
- **Recommended actions are the hero:** three cards per row, ranked high › medium › low. A card is deliberately sparse: severity, location, a one-line attention call and a one-line stat. The action row (Pin or Details, plus the ONE primary CTA bottom-right) is hidden at rest and appears on hover, keyboard focus, or while the card is open, so six primary buttons never compete for attention. Hovering a card (160ms) previews its detail panel under that row; the panel stays while the pointer is on the card or the panel and closes 260ms after leaving. "Pin", revealed on hover or keyboard focus, pins the panel open ("Pinned"); clicking again or "Unpin" closes it. While something is pinned, hovering other cards does not preview. One panel open at a time with the from › to source pair, the full story, the suggested action, the evidence panels (each labelled with its product) and the secondary actions (snooze, edit rule, dismiss). Status (assigned, sent, flagged) replaces the stat line on the card.
- **Charts:** one hue per chart, emphasis (accent for the current period, grey for the prior). Values are always in text as well; hover titles on bars. No dual axes.
- **Facility comparison:** heat cells use one sequential red ramp for TRIR and overdue training so a risky row reads dark-dark at a glance. Values are always printed. Rows drill into the facility (sets the global scope).
- **Assigned to me:** one list for both products, source chip per row, due state by colour and icon (overdue, soon, later).
- **Compliance calendar:** month grid with EHS colour buckets (blue = training / inspections / qualifications, orange = corrective actions, red = regulatory deadlines). Icons carry the category so colour is never the only cue. Regulatory deadlines (300 Log review, 300A posting, 300A ITA submission) are listed under the grid because they fall outside the visible month.
- **OSHA audit readiness:** a score (86% company-wide, 83% at Plant 4) plus a checklist that mixes EHS records (300 Log, 301s, 300A) and Convergence records (training and PIT operator records for injured employees). Export builds one packet (PDF + XLSX).

## create-module Add widget (full-screen takeover)
- **Not a modal.** Add widget (page header, top right) opens a full-screen takeover modeled on the Readiness Hub build view: a header bar (back to Dashboard, title, tabs Create a new widget | Existing widgets, Cancel + Add to dashboard), then three columns.
- **Left, chat (376px):** Keystone docked-panel design: header with New conversation and Minimize, a thread with Try asking prompts, a textarea with a round send button (Enter sends, Shift+Enter breaks), and the note that charts land on the preview, never in the thread. Follow-ups refine the widget ("make it a table", "just Plant 2", "only Lockout/Tagout", "last 30 days"). **Minimize** folds it to a 56px rail with a vertical label and the message count; the parameters column widens. Clicking the rail reopens it.
- **Middle, parameters (380px):** Widget name, 1 Where, 2 Date range, 3 Metrics, 4 Show as. **Metrics is a multi-select checklist** (no separate "compare with" step): sectioned by plain-text headings Vector EHS and Convergence, pick any mix, no limit ("7 selected", Clear). Each selected row shows its series color swatch (ten distinct colors, one per catalog metric), assigned in selection order so a metric keeps its color as others change. Scatter is offered only with exactly two metrics. Auto-titles past three metrics read "A, B and N more"; the user can rename. The chat fills these; editing one updates the preview.
- **Date range:** Same as the dashboard (default, the widget follows the filter row), Last 30 days, Last 90 days, Last 12 months, Year to date. A range other than the dashboard's shows as a calendar chip in the widget header and in its subtitle, and the trend axis relabels (4 weeks ago / 12 months ago / January). Counts scale with the range; rates and percentages do not.
- **Right, preview:** the widget exactly as it will render on the dashboard, outlined, between ghost bars for Key metrics and Recommended actions, with a note on where it lands. Add to dashboard is disabled until a metric is set. With Click into metrics on, every number in the preview is clickable (see below).
- **Wording:** these are "widgets" everywhere a user reads it (button, takeover, settings, menus, toasts). CSS class names still say module; that is not user-facing.

## specific Be specific (per-metric multi-select)
- **Every parameter dropdown is a multi-select** (`vaadin-multi-select-combo-box`, outlined): chips in the field, checkbox rows in the list (filled when selected, matching the metric checklist), the overlay stays open while picking several, and an empty field means "all".
- **Where:** empty = All facilities (rows per facility). One facility = rows per department at that facility. Two or more = those facilities compared side by side, titled "Plant 4 and Plant 2" (short names). The chat reads several facilities from one sentence ("at Plant 2 and Plant 4").
- **Prototype pill, "Be specific dropdowns":** when on, each selected metric gets a multi-select under its row that narrows it: Courses for the training metrics (Forklift Safety Refresher, Lockout/Tagout, Hazard Communication, Walking-Working Surfaces, Safe Lifting & Ergonomics), Qualifications, Incident types, Near-miss types, Observation categories, Corrective-action sources, Inspection types. Placeholder "All courses" (or types).
- **Effect:** one or two choices append to the label in the title, legend, table header and caption, e.g. "Overdue training (Lockout/Tagout, Hazard Communication), Plant 2 – Columbus"; three or more read "(3 courses)". Values are the narrowed slice (shares add up). The chat sets them too: "overdue on Lockout/Tagout or Hazard Communication" picks both; "only Lockout/Tagout" replaces the current picks. Removing a metric clears its choices; Clear clears all.
- **Off:** the per-metric dropdowns are hidden and the widget shows the whole metric. Choices already made stay in the spec so toggling the pill does not lose work.
- **Dev:** `spec.scope` is `all`, one facility id, or ids joined with commas; `spec.detail` maps a metric id to a list of options. The API needs a facility list and a per-metric filter list (course ids, incident type ids, qualification ids) alongside the date range. Changing Where or a detail re-renders only the preview so the open overlay is kept.

## widget-filter Filter a built widget
- **Why:** the specific picks set at build time are a scope, not a single view. A widget with incidents narrowed to Slips and trips, Lacerations and Ergonomic strain shows a **filter row** under its header: "All 3 incident types" (the picks combined, default), one chip per pick, a divider, then "Total incidents" (the metric with no narrowing). One row per metric that has picks.
- **Effect:** the chosen view re-renders the body only; the title keeps the build-time description. Labels follow the view: "Incidents (Lacerations)" or "Incidents (total)" in the legend, table header, big numbers and caption. Click into a number and the drawer matches the view (its records are only that type, or every type for Total).
- **Where it shows:** on the dashboard, in the create preview (so the builder can check each view before adding) and in Existing-widget previews. The view is kept with the widget; Edit keeps it, Reset to default keeps it.
- **Dev:** `spec.filter` maps a metric id to `all` | one pick | `total`. The widget request is the same as the build-time request with that metric's filter list replaced by the view.

## drill Click into a metric (records behind a number)
- **Prototype pill, "Click into metrics":** when on, numbers become actionable. On the dashboard: the four Key metrics tiles, and in built widgets every big number, bar, table cell, scatter dot and legend entry. In the takeover: the same elements in the preview and in Existing-widget previews. Hover shows a focus ring; Enter or Space works from the keyboard.
- **Drawer (760px, from the right, under the top bar):** product chip, location path (facility › department when a department row was clicked), date-range chip if the widget has one; the metric name with its specific choice ("Overdue training: Lockout/Tagout"), the value and what it means in people or records ("7.3%  22 people overdue"); a Filter these records field with an N of M count; a record table whose columns depend on the metric (training: Employee, Course, Department, Facility, Due, Overdue by; incidents: Incident, Type, Employee, Where, Date, Status; corrective actions: Action, Title, Source, Owner, Where, Due; and so on); and a footer with the primary action for that product (Assign training + Open in Convergence, or Open in Vector EHS) and Export CSV. Past 40 records the drawer says so and points to the product for the full list. Escape, the ×, or a click outside closes it.
- **Off:** nothing is clickable and the captions drop the "click to see the records" sentence.
- **Dev:** the drawer needs a records endpoint per metric that accepts location, department, date range and the specific filter, and returns rows plus a total. Rows are generated here from the sample employees and courses.

## existing-modules Add widget: Existing widgets
- Every widget in dashboard order, standard and built, with sources, Preview, and an On / Off switch; built widgets also have Edit (reopens the takeover in edit mode) and Remove (asks first, then an Undo toast). Escape or Done closes the takeover.

## existing-preview Preview an existing widget
- **Preview** expands a live render under the row: standard widgets are shown as they render on the dashboard right now (same data, same filters), built widgets through the same renderer as the create preview. Hide preview collapses it. Several can be open at once; the state is kept while the takeover is open.

## confirm-remove Remove widget?
- Removing a built widget, from its ⋮ menu on the dashboard or from Existing widgets, asks first: "Remove this widget?" with the widget's name, a note that it comes off the dashboard for this user only and that Undo is available briefly, then Cancel / Remove widget (error primary). After removal the toast still offers Undo, which puts the widget back in its old position.

## settings Settings
- **Home dashboard is the first row:** widget count, built-widget count, Arrange your dashboard (primary), Reset to default. Adding widgets happens on the home, not here. Other rows (Notifications, Data sync, Recommendation rules, Profile) are placeholders.

## build Home in edit mode
- **What you build is the home page itself.** The page header and banners hide; a sticky build bar (Reset, Back to settings, Done) sits on top; every widget gets a chrome bar with its name, sources, description, Move up / Move down and a Shown / Hidden switch. Hidden widgets stay in place at 35% so they can be turned back on. Order and hidden set are the user's saved layout.

## describe Built from a description
- **Describe the report you want** (Create tab): a sentence such as "Compare safety trends at Plant 4 with its training data" is read as a thread (question bubble, thinking beat, read-back in bold: metrics, location, date range, chart type), and the widget is built in the preview for adjusting or adding. Matching order: the parser reads locations (one or several), metrics, specific choices (course, incident type), date range words (last 30 days, last 12 months, quarter, year to date) and chart words; a starting comparison is used only when it covers every metric the sentence names, and the sentence's own location always wins. The dev build should send the sentence to the service and show its interpretation the same way.
- **Construct a comparison:** Where (all facilities, or one facility which breaks down by department), any number of metrics from either product, a date range, and Show as (trend with series indexed to 100 so they share one axis, bars by location, scatter by location, big numbers, table). Four starting comparisons are offered first, e.g. safety trend vs training at Plant 4. Live preview at canvas scale; Add lands it directly under Key metrics.

## rec-detail Recommendation details
- **Chunked content, same in every version:** source pair › title › severity / location / updated › "What changed" › "Rule" (when a rule fired) › "Suggested action" (tinted) › status strip › "Why you are seeing this" (evidence panels, each labelled with its product) › actions (primary, secondary, dismiss). Section labels are 12px/600 secondary text; the title is 18px.
- **Side panel:** a 540px fixed panel over the content column, closed with × or Escape.

## plant4 Plant 4 – Riverside
- **Drill-down keeps the page:** selecting a facility in the nav picker rescopes every widget in place; the location chip in the filter row shows the path and clears it with its ×.
- **Comparison becomes departments:** facility scope swaps the comparison rows for that facility's departments with the same columns.
- **Audit numbers are per establishment:** the readiness score and checklist switch to the facility's own 300 Log.

## dismissed Dismissed, with undo
- **One click, no reason:** Dismiss removes the card immediately (short slide-out) and shows a toast with an Undo button for about six seconds. The dismissal is written to the recommendation log without a reason. Dismissing hides the card for everyone with access; it returns if the trend changes materially.
- **Snooze still asks how long** (7 / 14 / 30 days) with an optional reason, and also offers Undo from its toast.

## assign1 Employees (editable)
- **Pre-selected from the rule:** PIT operators at the facility with no completion in the last 12 months. Rows show last completion and any incident involvement (from EHS) so the reviewer sees why each person is included.
- **Editable list:** uncheck or Remove to exclude, Add back to restore, filter by department, add anyone else by name. The footer count updates live. Next is disabled with zero selected.
- **Scale:** lists can be hundreds long; virtualise the table.

## assign2 Course and due date
- **Prefilled from the recommendation:** course, due date (today + 30), type Required. Switches: notify supervisors, track completions against the safety trend (writes the assignment back to the related EHS records), hands-on sign-off.

## assign3 Message to learners
- **Why note:** prefilled, editable, shown to learners in the training plan and email. The preview on the right is the learner's actual card, including the optional one-line safety summary from EHS (counts only, no names).

## assign4 Review and confirm
- **Edit links** jump back to the step. The side panel spells out what happens in each product on confirm.

## assigned Assigned
- **Card becomes a tracker:** the recommendation shows an In progress strip with a progress bar (0 of N complete), the approval task disappears from Assigned to me, the due date lands on the calendar (highlighted as new), and a toast confirms with a View assignment link.

## ehs-only Safety access only
- **Default persona is the Safety and Training admin.** There is no in-page persona switch; this variant is reached from the flow map (`#fm=ehs-only`) or `?role=ehs`.
- **Graceful degrade, not empty states:** training nav items are removed; the two training KPI tiles collapse into one dashed "needs a Convergence role" tile; training columns leave the comparison table; training tasks and calendar items are filtered out; training evidence panels show a locked placeholder that names the training admin.
- **Send to Training admin:** any recommendation whose action lives in Convergence swaps its primary button for "Send to Training admin". The recipient gets the recommendation with the evidence attached in their own Assigned to me list.
- **Request access** lives in the info banner.

## loading Loading
- **Skeletons hold the frame:** tiles, cards and table rows keep their size while loading; no layout jump. Refreshing on a scope change dims the current render instead of flashing skeletons.

## error Training sync error
- **One product down, the other usable:** a banner with Retry sync, training tiles marked "Last good value, 3 h old", training evidence panels replaced by a dashed notice. EHS data stays interactive.

## empty No recommendations
- **Explicit all-caught-up state** with the rule that would create new items, and a Manage rules link.
