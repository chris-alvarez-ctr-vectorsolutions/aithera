# Dev Notes — Report Redesign V2 (Management Pages)

**Prototype:** `Report Redesign with CRUD.html` (+ `script.js`, `styles.css`)
**Dev build:** `Report Redesign with CRUD_dev_handoff.html` (comments off, flow map on)
**Handed off:** 2026-06-29
**Component audit:** see `component-assessment.md` (same folder)

> ⚠️ **Do NOT ship the Design Toolbox.** The bottom-center dock pill and its 🗺 Flow Map button are review/handoff tooling only — they are **not part of the product**. For production, strip the one line
> `<script src="…/designtoolbox/toolbox.js"></script>` (and the `window.TOOLBOX = { comments:false }` line above it) from the build. Everything the app needs works without it.

> **Vanilla prototype.** HTML + one `script.js` + one `styles.css`, no framework/build. It renders live from the Vector Web Components CDN (core `v1.19.0`, themes `v1.5.0`). Data is in-memory mock arrays (`SAVED_VIEWS`, `SCHEDULED_REPORTS`, users/quals); there are no real network calls — wire these to the real Reporting APIs.

---

## Components (map to production VWC)

Full audit in `component-assessment.md`. Summary:

- **Chrome:** `vwc-topnav` (logo + pill links + `vwc-user-menu` / `vwc-notifications-menu` / `vwc-language-selector-dialog`), `vwc-sidenav` (data-driven `items`).
- **Forms:** `vaadin-text-field` / `vaadin-text-area` / `vaadin-select` / `vaadin-date-picker` / `vaadin-multi-select-combo-box` / `vaadin-checkbox` / `vaadin-radio-button` — all inputs carry `theme="outlined"`. `vaadin-button` uses `primary` / `secondary` / `tertiary` variants.
- **Dialogs:** `vaadin-dialog` with the renderer/footerRenderer pattern; overlays are pinned to fixed sizes via `overlayClass` (never resize on interaction).
- **Intentional prototype departures** (fine to keep for the prototype; production should evaluate the real primitive): data grids are hand-rolled `<table>` (vs `vaadin-grid`); anchored menus/dropdowns are custom (vs `vaadin-popover`/`vaadin-menu-bar`); report-type pills are custom (vs `vwc-badge`); toasts are custom (vs `vaadin-notification`); chips are custom.
- **Colors:** built on a Tailwind-style palette, not Vector Lumo tokens. Biggest production swap: primary blue `#2563eb` → `--lumo-primary-color` (`#0271ce`). See the token table in `component-assessment.md`.

---

## Screens / surfaces + what to build

### 1. Qualification Reporting (default report)
- **Title block (order matters):** "Last updated …" line, then the `<h1>`, then — when a saved view is applied — a **removable chip** (`🔖 {view name} ✕`) followed by "· N scheduled reports" as a metadata link.
  - The **✕ clears** the applied view; the **"N scheduled reports" link** opens the *Manage scheduled reports* dialog (§7).
- **Actions row:** **Schedule Report** (opens the schedule dialog, §5), **Share ▾** (menu: *Email report now* → one-time email dialog §6; *Download report* → toast), **Save View** split button (Save / Save New), **Saved views ▾** dropdown (§8).
- **Completion Status Overview** card (pie + bar; the date badge mirrors the applied filter range).
- **Two report tables** (Qualification Completion, Qualification Training Details) — custom expandable `<table>`s.
- **Filter panel** (right): Date Range preset dropdown + custom range, Qualifications & Users pickers (multi-select w/ chips), Qualification Status checkboxes, additional options.

### 2. Activity Exception Report
- Same chrome/actions/filters pattern as §1 with its own filters. The applied-view chip/subtitle mechanism is shared but only renders on the report matching the applied view's type.

### 3. Saved Views (CRUD) — `Manage Saved Views`
- Single-layer grid. Columns: **★ favorite** (toggle, persists to the row), **Name**, **Report** (badge), **Description**, **Date Range**, **Scheduled Reports** (count; clicking a non-zero count → Scheduled Reports page pre-filtered to that view), **actions**.
- Filters: **Report types** (multi-select), **Show** (All / Favorited / Not favorited), **Sort by** (Name / Favorited first / Most scheduled reports), search.
- **Edit** → opens the *report itself* with that view applied (edit filters live, then Save View). **Delete** → confirm dialog.

### 4. Scheduled Reports (CRUD)
- **Flat single-layer grid** (no grouping/expansion). Columns: **Name**, **Report** (short badge, full name in tooltip), **Saved View** (link → details), **Schedule**, **Recipients**, **Delivery** (file format), **Next Send**, **actions**.
- Filters: **Report types** (multi-select) + **Saved view** (multi-select) + **Sort by** + search.
- No "create scheduled report" here — schedules are created only from a report's **Schedule Report** action.
- **Edit** → navigates to the schedule's report, applies its saved view, then opens the schedule dialog (edit happens on the report). **Delete** → confirm.

### 5. Schedule Report dialog (recurring)
- **Two-column:** left = form, right = report summary. 24px padding; overlay stays off screen edges; fixed size (no resize on interaction).
- **Required:** Recipients, Scheduled report name, Start date, and (only when no saved view is applied) the inline **Saved view name**. All other fields optional.
- Recipients (token input + "Browse all users"); Recurrence (frequency + weekly days / monthly weekday-or-day + start/time/optional end); **Email message** — Subject prefilled `[Report] - [Schedule name]` (live-syncs until edited), Body prefilled with the Convergence delivery copy; **Delivery** = downloadable report file, **File format** select (PDF/Excel/CSV) — link delivery was removed.
- **No stacked modal:** when scheduling without an applied view, the *Save as a saved view* name/description capture appears **inline** in the summary column (with helper text that a saved view is required).

### 6. Email report now (one-time)
- Same two-column dialog opened in "once" mode from **Share → Email report now**. No recurrence/saved-view requirement; recipients + email message + format.

### 7. Manage scheduled reports dialog
- Opened from the report-page "N scheduled reports" link. Lists this view's deliveries with **Edit** / **Delete** per row and **Schedule new report**.

### 8. Saved views dropdown
- Shows up to **10** items: **favorites first, then most recent**; the rest hidden behind **"View all (N)"** (opens the *Select saved view* modal, §9). The star is a read-only indicator here — favoriting happens only in the CRUD grid (§3) and modals.

### 9. Select saved view modal / 10. Save view dialog / 11. Delete confirmations
- Fixed-size two-panel picker (list + preview) — pinned via `overlayClass` so selecting a view never resizes it. Save-view create/edit + delete confirmations are standard `vaadin-dialog`s.

---

## States & edge cases
- **Applied view is dirty** (filters edited after applying): tracked by `viewDirty`; the Save View control switches to "Update View"; navigating away warns via the unsaved-changes dialog.
- **Editing a saved view that feeds schedules:** live-link warning lists affected scheduled reports (they change when the view changes) with an option to "save as new view."
- **Report-type / saved-view filters** are multi-select; empty = all.
- **Delete of a scheduled report** refreshes the CRUD grid, the report-page count, and the manage dialog if open.

## Notes for production
- Replace mock arrays with real APIs; the delivery model is a Convergence download link (context only — no real link generated).
- Swap the Tailwind palette for Lumo tokens (see assessment) and re-check VWC tag/prop specifics against the version the app ships (this prototype loads core `v1.19.0` / themes `v1.5.0`).
- Labels/section headers are sentence case by design — do not reintroduce all-caps.
