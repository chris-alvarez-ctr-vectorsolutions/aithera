# Unified Home Dashboard (Convergence + Vector EHS) · dev notes

> author: Design handoff
> date: 2026-09-25

Three versions share these notes and differ only in where a recommendation's details open (`window.REC_DETAIL_MODE` in each version's index.html): **V1** below the row (hover previews, Pin keeps it open), **V2** a right-hand side panel on click, **V3** a details column on click that shrinks the cards to two per row. Everything else is identical.

Notes are grouped by flow-map node. They render in the dev_handoff build only; while the mock is in progress the commit history is the change log.

## home Home, all facilities
- **App shell:** the V3 app-rail shell from design-system/navigation/v3-app-rail.html (markup in ver1/index.html, styles in shell.css, behaviour in shell.js). Full-height 56px product rail on the left (Bridge pinned on top, then licensed platforms, waffle launcher at the bottom), 56px top bar inset to its right (nav toggle, Vector | Bridge lockup, centred scoped search, notifications, help, avatar menu), 280px side nav that collapses to a 56px icon column from the top-bar toggle only, with a hover peek overlay (clone of the nav, 16px halo, 100ms in / 500ms out; clicking the toggle while peeking docks it). V3's placeholder colours resolve to Vector theme tokens. Nav items are one unified IA (Home; Work: Incidents, Corrective actions, Inspections and observations, Training, Qualifications; Insights: Reports; Organization: People, Locations; Settings pinned at the foot). Never group items by product.
- **Location picker lives in the side nav** (V3 placement: context and navigation together). The button shows only the current location name; the menu is a fixed-position tree-list (Company › Region › Facility › Department, names only, hierarchy by indentation, find-as-you-type) positioned from the button so the scrolling nav never crops it. The filter row shows the current scope with a Change link that expands the nav and opens the picker. The page scrolls inside the content column, not the window.
- **Shared hierarchy:** the location picker is Company › Region › Facility › Department and must resolve to the same IDs in both products. Mismatched hierarchies are a known customer pain; the picker never shows two trees.
- **Filter row scopes everything:** location, date range and search sit in one row above the modules. Every module re-renders against the same slice; the comparison note says which prior period the deltas use.
- **KPI tiles:** stat-card pattern (outline icon + label, 34px value, delta pill with a diagonal arrow, "vs. prior period" line, 12-point sparkline). Each tile carries a subtle source chip (EHS or Training). Up is always shown as bad for these four metrics.
- **Recommended actions are the hero:** three cards per row, ranked high › medium › low. A card is deliberately sparse: severity, location, a one-line attention call and a one-line stat. The action row (Pin or Details, plus the ONE primary CTA bottom-right) is hidden at rest and appears on hover, keyboard focus, or while the card is open, so six primary buttons never compete for attention. Hovering a card (160ms) previews its detail panel under that row; the panel stays while the pointer is on the card or the panel and closes 260ms after leaving. "Pin", revealed on hover or keyboard focus, pins the panel open ("Pinned"); clicking again or "Unpin" closes it. While something is pinned, hovering other cards does not preview. One panel open at a time with the from › to source pair, the full story, the suggested action, the evidence panels (each labelled with its product) and the secondary actions (snooze, edit rule, dismiss). Status (assigned, sent, flagged) replaces the stat line on the card.
- **Charts:** one hue per chart, emphasis (accent for the current period, grey for the prior). Values are always in text as well; hover titles on bars. No dual axes.
- **Facility comparison:** heat cells use one sequential red ramp for TRIR and overdue training so a risky row reads dark-dark at a glance. Values are always printed. Rows drill into the facility (sets the global scope).
- **Assigned to me:** one list for both products, source chip per row, due state by colour and icon (overdue, soon, later).
- **Compliance calendar:** month grid with EHS colour buckets (blue = training / inspections / qualifications, orange = corrective actions, red = regulatory deadlines). Icons carry the category so colour is never the only cue. Regulatory deadlines (300 Log review, 300A posting, 300A ITA submission) are listed under the grid because they fall outside the visible month.
- **OSHA audit readiness:** a score plus a checklist that mixes EHS records (300 Log, 301s, 300A) and Convergence records (training and PIT operator records for injured employees). Export builds one packet (PDF + XLSX).

## rec-detail Recommendation details
- **Chunked content, same in every version:** source pair › title › severity / location / updated › "What changed" › "Rule" (when a rule fired) › "Suggested action" (tinted) › status strip › "Why you are seeing this" (evidence panels, each labelled with its product) › actions (primary, secondary, dismiss). Section labels are 12px/600 secondary text; the title is 18px.
- **V1 below:** the panel spans the row under the card; hover previews it, Pin keeps it open. **V2 panel:** a 540px fixed side panel over the content column, closed with × or Escape. **V3 column:** a 440px sticky column inside the module; the grid drops to two cards per row while it is open.

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
