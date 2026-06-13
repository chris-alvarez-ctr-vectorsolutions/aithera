# Report Redesign — `dupe` vs. original `index`

A menu of the design changes in the **redesign** (`dupe.html` / `dupe.js` / `dupe.css`)
measured against the **original** (`index.html` / `script.js` / `styles.css`).

The two are now fully separate file sets — `index.html` loads `styles.css` + `script.js`,
`dupe.html` loads `dupe.css` + `dupe.js`. Nothing here has been applied to the original.
Use this doc to decide which pieces you want, then we can port just those into `index`.

Each item notes **where it lives** (class/id/function markers you can grep) and how
**self-contained** it is, so you can pull one without dragging in the rest.

---

## TL;DR — pick list

| # | Change | Area | Effort to port | Self-contained? |
|---|--------|------|----------------|-----------------|
| 1 | Inline saved-view **selector dropdown** (replaces modal) | Report headers | Medium | Mostly |
| 2 | **Active filter chips** bar | Report headers | Medium | Yes |
| 3 | **"Modified view"** banner + Restore | Report pages | Low | Yes |
| 4 | **Save / Update View** split-button logic | Report headers | Low | Yes |
| 5 | **Unsaved-changes navigation guard** | Global nav | Medium | Yes |
| 6 | Scheduled Reports **grouped into saved-view bands** | Scheduled Reports | Medium | Yes |
| 7 | Scheduled Reports **readability pass** (this session) | Scheduled Reports | Low | Yes |
| 8 | Scheduled Reports **toolbar** (filters in first row) | Scheduled Reports | Low | Yes |
| 9 | **Filter facets** ("Last 90 days · 145 Users…") helper | Saved Views, Schedules | Low | Yes |
| 10 | Manage Saved Views **table restructure** + hover actions | Manage Saved Views | Low | Yes |
| 11 | **Report-type color badges** (`rt-badge`) | Multiple | Trivial | Yes |
| 12 | **Confirmation dialogs** before delete | Saved Views, Schedules | Low | Yes |
| 13 | **Recipient token input** + picker dialog | Send/Schedule dialog | Medium | Yes |
| 14 | **"Does this repeat?"** scheduling controls | Send/Schedule dialog | Medium | Yes |
| 15 | **Views & Schedules** combined page (experimental) | New page | High | Yes (opt-in) |
| 16 | **Saved-view context notes** in email dialog | Send/Schedule dialog | Low | Yes |

---

## Report header & filter experience (Qualification + Activity Exception)

### 1. Inline saved-view selector dropdown
**What:** The original opens a **modal** ("Select Saved View") to apply a view. The redesign
replaces it with an **anchored dropdown** that drops under a selector button — searchable,
sortable, grouped by report type, with favorite stars and report-type badges. The applied view
shows as a chip (with star + clear) right in the header.
**Original:** modal `#selectSavedViewDialog`, "Apply Saved View" button.
**Redesign:**
- HTML: `.view-selector`, `#qualViewSelector` / `#actExViewSelector`, `.vs-chip`, `.vs-trigger` (dupe.html ~78–112 / ~677–711)
- CSS: `.view-selector`, `.view-selector.has-view`, `.vs-chip`, `.vs-trigger` (~954–1043); dropdown `.sv-dropdown`, `.sv-dd-*` (~2870–2967)
- JS: dupe.js ~1079–1241
**Self-contained:** mostly — it leans on the filter-chips (#2) and facets (#9) for its row content.

### 2. Active filter chips bar
**What:** A secondary toolbar that appears **only when filters are active**, showing each
applied filter as a rounded pill (with icon) plus a "Clear all". The original shows filters as a
plain text summary.
**Redesign:**
- HTML: `.filters-bar`, `.active-filter-chips` (dupe.html ~114–131 / ~713–730)
- CSS: `.filters-bar`, `.filter-chip`, `.filter-chip-clear-all` (~1404–1509)
- JS: dupe.js ~917–996
**Self-contained:** yes.

### 3. "Modified view" banner + Restore
**What:** Original shows a static "Saved View Applied" banner. Redesign shows it only **after you
edit** an applied view's filters — "you've modified this view" — with a **Restore saved view**
button (pen icon, rotate-left restore). Pairs with the dirty-tracking in #4/#5.
**Redesign:**
- HTML: `.edited-banner`, `.edited-banner-restore` (dupe.html ~133–141 / ~732–740)
- CSS: `.edited-banner*` (~1064–1094)
- JS: `markViewDirty()`, restore flow (dupe.js ~903–1077, 3612–3644)
**Self-contained:** yes (needs the `filtersTouched` flag from #5 to know when to show).

### 4. Save / Update View split-button
**What:** The "Save View" button becomes **"Update View"** when a view is applied, and opens a
small menu (Update vs. Save New). With no applied view it just saves directly. Added to **both**
reports (original only had it loosely on Qualification).
**Redesign:** JS dupe.js ~541–572, ~853–857; Activity Exception parity ~2030–2061.
**Self-contained:** yes.

### 5. Unsaved-changes navigation guard
**What:** If you've edited filters on an applied view and try to navigate away, the redesign
**blocks navigation** and asks to Save / Discard / Keep editing. Original has no such guard.
**Redesign:**
- HTML: `#unsavedChangesDialog` (dupe.html ~1225–1232)
- JS: state `currentReportId` / `pendingNavId` / `filtersTouched` / `filterSnapshot`; guard at dupe.js ~63–107, ~3587–3686
**Self-contained:** yes — but it's the backbone the banner (#3) and dirty-button (#4) read from, so port together for full effect.

---

## Scheduled Reports page

### 6. Grouped saved-view "bands"
**What:** Original renders schedules as one **flat list**. Redesign **groups deliveries under the
saved view they belong to** — a full-width slate band (chevron + view name + report badge) with
the individual delivery rows nested beneath and **collapsible**.
**Redesign:**
- CSS: `.sr-band`, `.sr-group-row`, `.sr-expand`, `.sr-band-name`, `.sr-delivery`, `.sr-dname` (~2613–2720)
- JS: `renderScheduledReports()` grouping + band markup + expand/collapse wiring (dupe.js ~3107+)
**Self-contained:** yes.

### 7. Scheduled Reports readability pass *(this session)*
**What:** A set of legibility tweaks on top of the bands:
- **Bold delivery name** as the row anchor; other columns muted.
- **"Sent As"** drops the repeated "Email" label → just the format chip (Excel/PDF/CSV).
- **Schedule as a sentence** — `Monthly on day 1 at 9:00 PM`, cadence word bolded (`scheduleCellHTML()`), instead of two stacked lines.
- **End date moved** out of Schedule to a muted amber "Ends …" line under **Next Send**.
- Band shows **only name + report badge** (removed the written-out facets and the bookmark icon).
- Band chevron + name pulled **left** so it reads as a parent header above the indented rows.
- Body cells padded to **align under their headers**; "Name" header indented to the paper-plane icon.
**Redesign:** `scheduleCellHTML()` / `sentAsHTML()` (dupe.js ~2486–2506); CSS `.sr-schedule`, `.sr-fmt`, `.sr-nextsend .sr-ends`, `.sr-dname`, `.sr-table thead th:first-child` (~2613–2710).
**Self-contained:** yes — these are the lowest-risk, highest-readability wins. Depends on #6 being present.

### 8. Toolbar restructure
**What:** Original had a "All Scheduled Reports" title row + a separate filter bar below. Redesign
**drops the title** and puts **Report filter + Sort by in the first row** alongside the search.
**Redesign:** dupe.html ~1107–1127.
**Self-contained:** yes.

---

## Saved-view filter facets (shared helper)

### 9. Filter facets text ("Last 90 days · 145 Users · All statuses")
**What:** A compact, read-only, dot-separated summary of a view's filters (date / activities /
users / status / columns), rendered as quiet caption text rather than pills. Lets you tell views
apart **without opening the editor**. Used on Manage Saved Views, and available for Scheduled
Reports / Views & Schedules.
**Redesign:** `viewContentFacets()` + `viewFacetsHTML()` (dupe.js ~2120–2145); CSS `.view-facets`, `.vf-item`, `.vf-sep` (~2861–2867).
**Self-contained:** yes — a small helper, easy to drop in anywhere.

---

## Manage Saved Views page

### 10. Table restructure + hover row actions
**What:** Columns change from `Name | Report | Description | Date Range | Actions` to
`Name | Report Type | Description | Filters | Actions`. The **Filters** column uses the facets
(#9). Action buttons shrink to **hover-revealed pencil/trash icons**. Adds a small **clock+count
"scheduled" tag** next to view names and an **empty state**.
**Redesign:**
- HTML header: dupe.html ~1025–1038
- CSS: `.msv-row-actions`, `.msv-edit-icon`, `.msv-delete-icon`, `.msv-filters-cell`, `.msv-sched-tag` (~2538–3021)
- JS: `renderManageSavedViews()`, `schedNameTag()` (dupe.js ~2147–2218)
**Self-contained:** yes (uses facets #9).

---

## Cross-cutting visual components

### 11. Report-type color badges
**What:** Small rounded badges color-coded by report type — blue (Qualification), amber (Activity
Exception), gray (other). Used on bands, lists, and selectors.
**Redesign:** `.rt-badge`, `.rt-badge.rt-qual / .rt-actex / .rt-other` (~2682–2693); helper `reportBadgeClass()` in dupe.js.
**Self-contained:** trivial — pure CSS + one helper.

### 12. Confirmation dialogs before destructive actions
**What:** Original deletes saved views / schedules immediately. Redesign adds **confirm dialogs**
(`savedViewDeleteDialog`, `scheduleDeleteDialog`), and the saved-view one **warns if the view feeds
active schedules**.
**Redesign:** `openDeleteSavedViewDialog()`, `openDeleteScheduleDialog()` (dupe.js); dialogs in dupe.html ~1225–1232.
**Self-contained:** yes.

---

## Send / Schedule (email) dialog

### 13. Recipient token input + picker
**What:** Recipients become removable **chips/tokens** with inline validation (invalid emails go
red), plus a structured **picker dialog** (name / email / location columns, search, checkboxes).
**Redesign:** CSS `.recip-box`, `.recip-chip(.invalid)`, `.recip-input`, `.recip-pick-*` (~2375–2489, ~2746–2770); JS recipient logic in dupe.js.
**Self-contained:** yes.

### 14. "Does this report repeat?" scheduling controls
**What:** Replaces tab-style mode switching with an inline radio pill (**Send once** vs.
**Scheduled**), plus a day-of-week selector for weekly cadence. Also adds **subject + message**
fields to the data model.
**Redesign:** CSS `.repeat-ask`, `.repeat-opt`, `.dow-btn`, `.dow-row` (~2290–2358); data fields `subject`/`message` on `SCHEDULED_REPORTS` (dupe.js ~2262–2297).
**Self-contained:** yes.

### 16. Saved-view context notes
**What:** Blue/amber banners in the dialog telling you whether this delivery is **tied to a saved
view** (info) or **not** (warning), plus a callout when saving-as-new will auto-create a schedule.
**Redesign:** `.email-sv-note(.has-view/.no-view)`, `.svs-callout` (~2500–2535).
**Self-contained:** yes.

---

## New page (opt-in)

### 15. Views & Schedules — combined page *(experimental)*
**What:** A whole new page merging saved-view management with their scheduled deliveries in one
place. Toggles between **Cards** and **List** layouts; each view shows its filters + deliveries;
both the **card and the deliveries list collapse independently** (state persists). Favorites,
delivery counts, inline add/edit/delete.
**Redesign:**
- HTML: `#viewsSchedulesLayout`, `.cmb-*` (dupe.html ~1054–1091)
- CSS: `.cmb-card`, `.cmb-listrow`, `.cmb-collapse-btn`, `.cmb-delivs-toggle`, `.cmb-deliv-*` (~3042–3354)
- JS: `initCombinedViewsPage()` IIFE (dupe.js ~3688–3977)
**Self-contained:** yes, but the largest piece. The redesign comments mark exactly what to delete to
remove it (the layout block, the `views-schedules` nav entry, the `isCombined` branch, the CSS block,
the JS IIFE) — so it's also the easiest to *leave out*.

---

## Notes on porting

- **Lowest-risk, highest-impact first:** #7 (readability), #8 (toolbar), #9 (facets), #11 (badges),
  #12 (confirm dialogs). These are mostly additive and won't fight existing logic.
- **Port as a bundle:** #3 + #4 + #5 share the dirty-tracking state — porting one without the others
  leaves dead ends.
- **#1 (selector) and #2 (chips)** reshape the report header together; decide on the header story
  before pulling either.
- All redesign features were built to **add** state/helpers/markup rather than overwrite original
  logic, so conflicts when merging into `index` should be minimal.

*Locations are approximate — grep the listed class names / function names for the exact spots.*
