# Build your own dashboards (Convergence + Vector EHS) · dev notes

> author: Design handoff
> date: 2026-10-06

Based on the Readiness Hub (Keystone) Agency Intelligence pattern, rebuilt on the Bridge unified home: the same V3 app-rail shell, KPI row, recommended actions and modules, plus a published-dashboard container, a Dashboards page and a build canvas. All dashboards render from one metric catalog (`dashboards.js`) and `data.js`.

## home Home
- **Unchanged from the unified home** except the new "My dashboards" module between the KPI row and Recommended actions, and a Dashboards item in the side nav (Insights group).

## my-dash My dashboards + Ask
- **Published-dashboard container:** a picker (dashboards you own or that were published to you), owner / published-by chip, the dashboard's own date range, Export, Edit (owner only). Widgets render in the same 12-column grid the builder uses, so what you build is exactly what the home shows.
- **Ask panel (optional, toggled from the module header):** "Try asking" prompts, text answers only, each answer carries its sources (EHS incidents, Convergence training records) and an "Add as widget" button. Answers never render charts in the thread; the widget lands on the dashboard. A dashboard published to you cannot be edited; the add action explains that and points to Dashboards. No AI branding per Bridge's rule: the panel is titled "Ask".

## dash-list Dashboards
- **Table of every dashboard** the user owns or receives: name + created date, owner, source products, widget count, status (Draft / Published), audience summary, updated. Search and All / Draft / Published segments. Row opens the build view. "New dashboard" creates an untitled draft and opens Add a widget straight away.

## build Build canvas
- **Build bar:** back to Dashboards, icon, inline rename (click the name), date range select (scopes every widget), auto-save chip, Export, Publish or Manage audience, status badge, Edit / Preview switch.
- **Panes:** Ask panel (340px, sticky) + canvas. The grid is 12 columns on 48px row tracks; widgets span 3 / 4 / 6 / 8 / 12 columns and a fixed number of rows per viz (KPI 3, bar/line 5, pair/scatter/table 6) so rows end level. Widget menu (⋮): width Third / Half / Two thirds / Full, Export as CSV, Remove (with Undo toast). The dashed "Add widget" slot is a grid sibling sized like a half-width widget.
- **Preview** hides the Ask panel, the add slot and the widget menus and shows a note naming the audience.

## add-widget Add a widget
- **Step 1 Pick a metric:** catalog grouped by product (Vector EHS: incidents, incident types, near misses, corrective actions, past-due actions, observations, inspections; Convergence: training compliance, overdue training, overdue by course, qualifications expiring, completions per week), searchable, plus **Cross-product pairs** (Incident rate × Training compliance, Near misses × Overdue training, Open corrective actions × Compliance, Observations × Overdue training).
- **Step 2 Choose how to show it:** chips limited to the viz types the metric supports (Big number, Bar, Trend line, Donut, Table; pairs: Paired bars, Scatter, Table). **Step 3 Preview** renders the real widget at canvas scale. Add puts it on the canvas sized by viz (KPI quarter width, charts half, pair tables full).
- **Data:** every metric is computed per facility from `data.js`, so widgets follow the location filter and look alive without wiring.

## build-ask Ask, then add as widget
- Same Ask panel as the home; in the build view the answer's widget goes onto the open dashboard. Typing a question matches it to the nearest canned prompt in this prototype.

## publish Publish to an audience
- **Job titles** (chips: Plant manager, EHS coordinator, Training administrator, Regional director, VP Operations, Shift supervisor, Safety committee) and **named people** (searchable chips). Union of both, counted in the summary line; people without a Convergence role see training widgets as locked. Publish turns the draft Published; Manage audience reopens the same dialog with Unpublish (Undo toast).

## build-preview Preview as audience
- The dashboard exactly as the audience's home container shows it, with the date-range control they also get.
