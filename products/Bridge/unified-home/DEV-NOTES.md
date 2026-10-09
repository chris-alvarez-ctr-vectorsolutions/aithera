# Unified Home Dashboard (Convergence + Vector EHS) · dev notes

> author: Design handoff
> date: 2026-09-25

One version. A recommendation's details open in a right-hand side panel on click (`window.REC_DETAIL_MODE = 'panel'`). The home page is also what the user builds: Settings › Build your dashboard puts this same page into edit mode (see `build` below).

Notes are grouped by flow-map node. They render in the dev_handoff build only; while the mock is in progress the commit history is the change log.

## home Home, all facilities
- **App shell:** the V3 app-rail shell from design-system/navigation/v3-app-rail.html (markup in ver1/index.html, styles in shell.css, behaviour in shell.js). Full-height 56px product rail on the left (Bridge pinned on top, then licensed platforms, waffle launcher at the bottom), 56px top bar inset to its right (nav toggle, Vector | Bridge lockup, centred scoped search, notifications, help, avatar menu), 280px side nav that collapses to a 56px icon column from the top-bar toggle only, with a hover peek overlay (clone of the nav, 16px halo, 100ms in / 500ms out; clicking the toggle while peeking docks it). V3's placeholder colours resolve to Vector theme tokens. Nav items are one unified IA (Home; Work: Incidents, Corrective actions, Inspections and observations, Training, Qualifications; Insights: Reports; Organization: People, Locations; Settings pinned at the foot). Never group items by product.
- **Location picker lives in the top bar,** right of search and left of the notification bell, with a divider on each side. The button shows only the current location name; the menu is a fixed-position tree-list (Company › Region › Facility › Department, names only, hierarchy by indentation, find-as-you-type) hung from the button's right edge so it never runs past the window. The filter row shows the current scope with a Change link that opens the same picker. The page scrolls inside the content column, not the window.
- **Shared hierarchy:** the location picker is Company › Region › Facility › Department and must resolve to the same IDs in both products. Mismatched hierarchies are a known customer pain; the picker never shows two trees.
- **Filter row scopes everything:** location, date range and search sit in one row above the modules. Every module re-renders against the same slice; the comparison note says which prior period the deltas use.
- **KPI tiles:** stat-card pattern (outline icon + label, 34px value, delta pill with a diagonal arrow, "vs. prior period" line, 12-point sparkline). Each tile carries a subtle source chip (EHS or Training). Up is always shown as bad for these four metrics.
- **Ask for a recommendation** (module header): a thread in a dialog, ported from the Readiness Hub's Agency Intelligence panel. The user says what they have noticed (chips add common observations) and picks a location or lets the text decide; after a 620ms beat with thinking dots, the answer is a severity + headline, a bold summary built from both products (incidents, near misses, the department carrying them, the training gap), its sources, and two actions: Add to Recommended actions, or Ask differently. Adding inserts the card at the top of the module tagged "From your question", opens it in the side panel, and offers Remove in the toast. Keyword matching stands in for the service; the dev build should call the recommendation service with the note + location.
- **Recommended actions are the hero:** three cards per row, ranked high › medium › low. A card is deliberately sparse: severity, location, a one-line attention call and a one-line stat. The action row (Pin or Details, plus the ONE primary CTA bottom-right) is hidden at rest and appears on hover, keyboard focus, or while the card is open, so six primary buttons never compete for attention. Hovering a card (160ms) previews its detail panel under that row; the panel stays while the pointer is on the card or the panel and closes 260ms after leaving. "Pin", revealed on hover or keyboard focus, pins the panel open ("Pinned"); clicking again or "Unpin" closes it. While something is pinned, hovering other cards does not preview. One panel open at a time with the from › to source pair, the full story, the suggested action, the evidence panels (each labelled with its product) and the secondary actions (snooze, edit rule, dismiss). Status (assigned, sent, flagged) replaces the stat line on the card.
- **Charts:** one hue per chart, emphasis (accent for the current period, grey for the prior). Values are always in text as well; hover titles on bars. No dual axes.
- **Facility comparison:** heat cells use one sequential red ramp for TRIR and overdue training so a risky row reads dark-dark at a glance. Values are always printed. Rows drill into the facility (sets the global scope).
- **Assigned to me:** one list for both products, source chip per row, due state by colour and icon (overdue, soon, later).
- **Compliance calendar:** month grid with EHS colour buckets (blue = training / inspections / qualifications, orange = corrective actions, red = regulatory deadlines). Icons carry the category so colour is never the only cue. Regulatory deadlines (300 Log review, 300A posting, 300A ITA submission) are listed under the grid because they fall outside the visible month.
- **OSHA audit readiness:** a score (86% company-wide, 83% at Plant 4) plus a checklist that mixes EHS records (300 Log, 301s, 300A) and Convergence records (training and PIT operator records for injured employees). Export builds one packet (PDF + XLSX).

## add-module Add module: Existing modules
- **The whole dashboard is the user's modules.** The Add module button (page header, top right, above the KPI tiles) opens a modal with two tabs. Existing modules lists every module in dashboard order, standard and built, each with its sources, an On / Off switch (Off hides it in place, On adds it back) and Remove for built ones. A footer button jumps to Create a new module.
- **Built modules are page-level modules:** a new one lands directly under Key metrics as a full-width module card with its own header (title, sources, ⋮ menu: Edit, Move up, Move down, Remove with Undo). They move and hide like any other module.

## create-module Add module: Create a new module
- **Readiness Hub style instructions:** a compact "Describe the report you want" box at the top of the steps column (sentence field, Build it, Try asking chips in a row). Charts land on the dashboard, never in the thread.
- **Build by hand gets the room (2026-10-08):** the steps column is the wide one. 1 Where (select, who the module is about), 2 Metric (two-column grid of metric buttons under plain-text headings Vector EHS / Convergence, not badges), 3 Compare with another metric (an On/Off switch, Off by default; switching On reveals the second metric grid), 4 Show as. The preview is a sticky right column that is always visible. Every dialog CTA sits in one footer at the bottom right (Cancel / Add to my dashboard; Existing tab: Done / Create a new module). Existing modules is a single-column list.

## settings Settings
- **Home dashboard is the first row:** module count, built-module count, Arrange your dashboard (primary), Reset to default. Adding modules happens on the home, not here. Other rows (Notifications, Data sync, Recommendation rules, Profile) are placeholders.

## build Home in edit mode
- **What you build is the home page itself.** The page header and banners hide; a sticky build bar (Reset, Back to settings, Done) sits on top; every module gets a chrome bar with its name, sources, description, Move up / Move down and a Shown / Hidden switch. Hidden modules stay in place at 35% so they can be turned back on. Your modules gains an Add module slot and a per-module menu (Edit, width Third / Half / Two thirds / Full, Remove with Undo). Order and hidden set are the user's saved layout.

## describe Built from a description
- **Describe the report you want** (Create tab): a sentence such as "Compare safety trends at Plant 4 with its training data" is read as a thread (question bubble, thinking beat, read-back in bold: metric, compare-with, location, chart type), and the module is built below for adjusting or adding. Matching order, as in the Readiness Hub: keyword overlap with the starting comparisons first, then a parser for location, one or two metrics and chart words. The dev build should send the sentence to the service and show its interpretation the same way.
- **Construct a comparison:** Where (all facilities, or one facility which breaks down by department), a metric from either product, an optional metric to compare with, and Show as (trend over 12 weeks with both series indexed to 100 so they share one axis, bars by location, scatter by location, big numbers, table). Four starting comparisons are offered first, e.g. safety trend vs training at Plant 4. Live preview at canvas scale; Add puts it in Your modules.

## rec-detail Recommendation details
- **Chunked content, same in every version:** source pair › title › severity / location / updated › "What changed" › "Rule" (when a rule fired) › "Suggested action" (tinted) › status strip › "Why you are seeing this" (evidence panels, each labelled with its product) › actions (primary, secondary, dismiss). Section labels are 12px/600 secondary text; the title is 18px.
- **Side panel:** a 540px fixed panel over the content column, closed with × or Escape.

## plant4 Plant 4 – Riverside
- **Drill-down keeps the page:** selecting a facility in the nav picker rescopes every module in place; the location chip in the filter row shows the path and clears it with its ×.
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
