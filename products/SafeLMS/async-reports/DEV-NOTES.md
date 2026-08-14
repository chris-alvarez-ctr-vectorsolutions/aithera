<!--
  DEV-NOTES.md — Async Reports (SafeLMS)
  Read in the Design Toolbox Flow Map: each "## <node-id>" maps to a flow-map
  node and every bullet under it becomes a dev note on that node. Authoring is
  done here in Markdown, not in the browser.

  ⚠️ DO NOT SHIP THE TOOLBOX. The bottom-center toolbox pill and its 🗺 Flow Map
  button are REVIEW/HANDOFF TOOLING ONLY — they are not part of the product.
  For production, strip the one line `<script src=".../designtoolbox/toolbox.js">`
  AND the `window.TOOLBOX_CONFIG` block, plus the `applyFlowState`/`bootFromHash`
  flow-map driver block (all clearly commented in index.html). The screens
  themselves are the deliverable; the flow map just lets you drill into each.

  Component mapping below folds in component-assessment.md (assessed against
  core v1.22.1 / themes v1.9.3). Headline items: the mock uses correct Vaadin
  form inputs (theme="outlined") but hand-rolls buttons, tabs, pager, modal,
  popovers, spinner, toast, and the switch — those are flagged per screen.
-->

> author: Design handoff

## n1 — Report landing (empty state)
- **Entry screen:** a report tab (default Compliance by Employee) with the filter card on the gray reports canvas and an empty results area: "Please configure the filters to generate report."
- **Tabs → vaadin-tabs:** the custom `.tabs`/`.tab` divs (JS `active` class) should build with `vaadin-tabs` / `vaadin-tab` (selection state + keyboard nav + underline for free).
- **Filters are real Vaadin:** `vaadin-select`, `vaadin-number-field`, `vaadin-date-picker`, all with `theme="outlined"` (keep this). Visibility is flow-driven — the position block and email-address row show only for the compliance flow (`applyFilterVisibility`).
- **Run Report → primary button:** the custom split `<button>` maps to `vaadin-button theme="primary"`, with the schedule dropdown as the split affordance (see n6/n7 for the dropdown note).
- **Branches out:** Run Report → n2, Report Log button → n5, Quick tab → n6.
- **Edge cases:** empty/zero-result state vs. populated; filter validation before Run is enabled.

## n2 — Generating (async)
- **Async generation:** after Run Report the report generates asynchronously (prototype simulates ~1 min via `REPORT_DELAY_MS`). Real build: kick off the job, poll/subscribe for completion.
- **Completions async pattern:** spinner + message ("This report may take a while. View and download it from the Report Log when it's ready, or opt in below and we'll email you.") + an "Email Me the Report When Ready" opt-in button.
- **Spinner → vwc-spinner:** the custom `.loading-spinner` CSS maps to `vwc-spinner`.
- **Email-Me → vaadin-button:** the custom `<button>` maps to `vaadin-button` (secondary/tertiary).
- **Two states:** default loading text (other tabs) vs. the completions message+button variant — driven by which flow ran.
- **Branches out:** n2 → n4 when generation finishes; n2 → n3 if the user opts into email.

## n3 — Email requested (opt-in branch)
- **Opt-in branch off n2:** clicking "Email Me…" puts the button into a pressed/disabled "Email request sent" state (can't re-request) and floats a confirmation toast; it auto-dismisses (~7s) and clears on leaving the view.
- **Toast → vaadin-notification:** the custom fixed-position `.toast` maps to `vaadin-notification` (system positioning + auto-close).
- **Real disabled state:** the button's disabled/pressed state should map to `vaadin-button` `disabled` + a sent affordance, not a CSS-only class.
- **Still reaches n4:** the report keeps generating in the background.

## n4 — Report ready (results)
- **Results table:** on completion the table renders, preceded by the generated-at row (`genrow`): "Generated <timestamp>", a Refresh button, the result count, and the pager.
- **Table → vaadin-grid:** the `table.data` (built via `innerHTML`) maps to `vaadin-grid` or the themed `.vwc-table` class. Custom is acceptable for the grouped employee-row layout, but standardize headers/borders/hover/sort.
- **Pager → vwc-paginator:** the `.pager` (First/‹/1/›/Last) maps to `vwc-paginator` (page-size select, "X–Y of Z" range text, a `page-change` event).
- **Refresh button:** `vaadin-button theme="tertiary"` with an icon.

## n5 — Report Log
- **Opened from the header:** the Report Log button in the blue header (a header button, not a tab — it deselects the tabs).
- **Pencil banner on top:** "Only the Compliance and Completion reports are saved here while they generate." The canonical custom Vector pencil-banner pattern (documented in `products/SafeLMS/CLAUDE.md`) — keep as-is, no VWC equivalent, dismiss-only.
- **Log table:** `.log-table` lists saved/generating reports with per-row Export menus (CSV / Excel).
- **Export menu → vaadin-popover:** the custom `.export-menu` popover (toggled by class) maps to `vaadin-popover` (or `vaadin-menu-bar`) for anchoring + outside-click dismissal.
- **Edge cases:** report still generating vs. ready (only ready rows are exportable); empty log.

## n6 — Quick Reports
- **Quick tab:** a table of saved/scheduled reports, each row showing a schedule badge ("None" vs. an active cadence) and per-row actions Run Now / Schedule / Edit Schedule.
- **Row actions → vaadin-button:** the custom `<button>`s map to `vaadin-button` (tertiary in-row).
- **Schedule badge is custom:** no `vwc-badge` in the pinned library version, so a custom pill is acceptable; revisit if a badge component ships.
- **Opens the scheduler:** Schedule / Edit Schedule → n7.

## n7 — Schedule a report (modal)
- **Scheduler modal:** the `.modal-scrim`/`.modal` sets a report's cadence — time, repeat (with the expanding repeat panel), runs-on / end / date-range option groups, and a plain-language summary line that updates live.
- **Modal → vaadin-dialog:** the custom modal maps to `vaadin-dialog` (focus trap, Esc-to-close, backdrop). Note `vaadin-dialog` uses renderer functions, not slotted content (see CORE-CONTEXT.md).
- **Wrap the radio groups:** the runs-on / end / date-range sets are bare `vaadin-radio-button`s grouped only by `name=` → wrap each in `vaadin-radio-group`.
- **Inputs already correct:** selects/number fields/date pickers inside the modal are correct Vaadin with `theme="outlined"` — keep.
- **Shared with the n1 dropdown:** the same scheduling logic powers the inline schedule dropdown on the Run Report split button (n1); both should use `vaadin-popover` for the panel rather than the hand-rolled class toggle + bespoke outside-click handling.
- **Footer buttons:** Cancel / Confirm custom buttons → `vaadin-button` (`secondary` / `primary`).
