# Dev Notes — Deployment

Developer handoff notes for the Deployment flow. Each `## <node-id>` maps to a node
on the Flow Map (`land`, `d1`, `d2`, `d3`, `d4`); every bullet shows as a 📝 dev note
on that node and in its drawer. These are design-intent and gotcha notes — not a spec.

> author: Design handoff

---

## Handoff / dev build — READ FIRST

**Standardized on V2.** The master `index.html` still carries the V1/V2/V3 version pill for
design comparison, but **V2 is the design to build** (stepper: Deployment details → Pick or
build → Review & deploy). The **dev build (`dev_handoff.html`) is locked to V2** with the
pill hidden, comments off, and the flow map on.

**⚠️ Do NOT ship the review/handoff tooling.** The bottom-center **toolbox pill** and its
**🗺 Flow Map** button are review tooling, not product. For production, **strip the single
`<script src="../../../designtoolbox/toolbox.js">` include** (and the `window.TOOLBOX` line
above it). None of that dock/flow-map UI is part of the deployment design.

**Dashboard status → "Ready for Dev".** Because `dev_handoff.html` exists next to `index.html`,
this mock's Scheduling-dashboard card shows the **"Ready for Dev" status pill**, the **Dev Page +
Dev HTML links lead** (with a "View Dev Build" button), and the original designer file collapses
into a "Designer file" drawer. The dev-handoff file **drives that status** — the mock's
`meta.json` `status` is `ready-for-dev` (leaving it unset would also work; just don't pin a stale
`in-progress`). Creating `dev_handoff.html` + pushing is what marks it Ready for Dev.

**Stripped in the dev build only (master keeps them):** the **Templates** feature and the
**"Save as reusable template"** controls (checkbox in the builder + "Save as template" on a
built card) are removed from `dev_handoff.html` — the first release ships without templates.
They remain in `index.html` for future scope.

**Component mapping:** see `component-assessment.md` next to this file for the VWC/Vaadin
component each element maps to (form controls are correct; topnav/sidenav/table are
intentional production-chrome reproductions; the stepper, tabs, drawers, dialogs, row menu,
tooltips, density toggle, and the deployable switch are the highest-value VWC swaps for dev).

**Recent V2 changes to build (this handoff):**
- Work Type — On-Duty/Off-Duty fields are **required** (asterisk).
- **Deploy shows only on the Review step** and is **green** (`success`); earlier steps show
  **Cancel next to Continue**, with **Back as an uncolored pill** far-left. No sticky action bar.
- Picking an assignment **hoists it into a "Selected (N)" bucket** at the top of the list
  (light-blue background), moved out of the unselected group; the list stays searchable.
- The shared-qualifier **"cover" badge is hidden** in V2.
- **Review page (Step 3)**: no card background; a **scannable summary** — identity, then a
  2-column grid of stacked **label-above-value** pairs (schedule/dates first, then code,
  location, work types, shift type), then Notes, split by hairlines. (Replaced the old
  far-apart label-left / value-right list.)
- The **"Run callback to fill open positions"** button was removed (open slots still fill via
  callback as copy notes).
- The **multi-select "Select to deploy"** path on the landing was **removed entirely** —
  deploy via **Add New Deployment** or a row's **⋯ → Deploy**.
- **Edit-after-deploy is end-date-only** (start date locks after deploy; MVP).
- The **"Selected (N)" bucket** is a blue **section panel**; each pick inside is a **white card
  with a bright-blue outline** (not a filled blue card).
- The floating **"Review deployment" island** (the bottom expandable peek) was **removed** —
  Step 3 in the stepper is the only review surface now.
- **New assignments** built from scratch render **inline under a plain "New assignments" heading**
  in the build area — not a separate collapsible folder.
- The **"mark an assignment as deployable" hint** sits **above** the Existing-assignments box
  (not inside it).
- The builder's **"Save as a reusable template" info tooltip was removed.**
- **Search fields** (assignments, templates, employee picker) are **`vaadin-text-field`**
  (outlined, magnifying-glass `prefix` icon, `clear-button-visible`) — the design-system search.
- **Canceling** a started deployment (named it, picked/built an assignment, or added builder
  positions) shows a **"Discard this deployment?"** confirm (Discard & leave / Keep editing);
  an untouched builder cancels with no prompt.

---

## land — Edit Assignments (landing)
- The Crew Scheduling landing; the primary branch point is **Add New Deployment**, which opens
  the single-page/stepper deployment builder.
- **Deployable tooltip (AC-1.3):** the "Is Deployable?" column header has an info icon
  explaining the toggle (appears in the deployment workflow; doesn't affect active/past
  deployments).
- **Single Quick Deploy (AC-7.6/7.7):** each row's **⋯ ellipses menu** has Deploy / Edit /
  Delete; Deploy first opens a small date-pick dialog (start/end date is a hard prerequisite —
  employees pre-populate from the start date), then drops into the builder with that assignment
  pre-selected.
- **Multi-select deploy was removed** (old "Select to deploy" checkbox mode + sticky bar). To
  deploy several assignments, use **Add New Deployment** and pick them inside the flow.
- The **"Deployable" toggle** per row is a `vwc-switch` in the real build.
- **Manage Templates** (header button) — present in the **master only; removed from the dev
  build** (templates are out of the first release).

## d1 — Deployment details (Step 1)
- Leads with the **deployment type** — 24-hour (default, runs continuously) or **recurring** (a
  daily time frame that repeats). The effective dates live inside the chosen type, with a
  plain-language summary once dates/times are set.
- Then the details: **deployment name** (shown in the crew scheduler; for multiple assignments
  it prefixes each — "Name – Assignment"), **code**, **CrewScheduler location**, and the two
  **Work Type** fields.
- **Work Type — On-Duty / Off-Duty are required** (asterisk) — build as required selects.
- "This is a work shift" is a locked-on flag for this flow.
- **Deploy is not available here** — only Continue (+ Cancel). See d4.

## d2 — Pick or build assignments (Step 2)
- **Existing deployable assignments appear automatically off the start date** (no Pull step) as
  selectable cards showing name + a position summary. Only `isDeployable` assignments show, and
  they're **sorted alphabetically** (AC-3.1). At real scale this list must be
  server-filtered/virtualized — don't render every assignment client-side.
- **Selecting hoists the card into a "Selected (N)" bucket** at the top (light-blue background),
  pulled out of the unselected group so the user sees everything chosen together; **search still
  filters** the rest.
- **Shared-qualifier "cover" badge is hidden** in V2 (was "PM covered · Name" / "no one holds it").
- **Templates** (multi-select) tab — **master only; stripped from the dev build.**
- **Select Employee picker** (opened from an open slot): employees are **ranked, not filtered** —
  full match of required primary + shared quals = "Recommended", some = "Partial", none falls to
  the bottom but stays selectable. `PM1` normalizes to `PM` for matching. OT/PTO is a trailing
  availability note, not a block. ⚠️ Mocked at a handful of people — virtualize + rank
  server-side for real stations (hundreds).
- Open slots inside a card are **fillable in place**; filled bars can be cleared back to open.

## d3 — Build assignment(s) (Step 2 · from scratch)
- A **two-column qualifier builder** inside Step 2. Left picks required **primary + optional
  shared** qualifiers (steppers); **hard rule: shared qualifiers can never exceed primary**
  (enforce server-side too). Right shows the resulting open slots, fillable now or later.
- **Open slots are generated from qualifiers, not entered manually.** Slot identity is
  `(qualifier key + ordinal)`; when counts change, preserve already-assigned people for surviving
  slots (re-match by key+ordinal) — losing assignments on re-render is a bug.
- **"Save as reusable template"** (checkbox + a built card's "Save as template") — **master only;
  stripped from the dev build.**
- Built cards land in a **"New assignments"** list where they can be renamed, re-staffed, or removed.

## d4 — Review & deploy (Result)
- **Review layout (V2):** no card background; **schedule (start/end) on top**, other details
  (code, location, work types, shift type) underneath; **label-left / value-right**; condensed.
  Empty fields read "Not set" so the review is the full record.
- **"Assignments in this deployment"** lists each selected/built assignment read-only with its
  slot bars.
- **Deploy is green and lives only here** (with Back as an uncolored pill + Cancel). Enabled once
  a name, dates, and ≥1 assignment are set; clicking while incomplete jumps to the offending step
  and highlights it. Deploying returns to the crew scheduler with a toast; each assignment becomes
  a "Name – Assignment" row (AC-7.3).
- Deploying with **open slots is allowed** (they fill via callback later).

## Edit after deploy (from the landing ⋯ → Edit)
- **End-date-only (MVP):** the start **date** locks after deploying (only its time can be
  fine-tuned); the **end date/time is editable** and applies to **every assignment in the group**.
- Assignments can be added to / removed from the group; open slots filled in place. Saving routes
  through a **note modal** so the change is annotated on the confirmation.

## Manage Templates (master only — removed from the dev build)
- Dedicated page from the **Manage Templates** header button; replaces the old multi-step flow.
  Lists deployable assignments + saved templates as cards (alphabetical) with an All/Assignments/
  Templates filter + search. Create/Edit/Delete templates via the editor dialog.
- **Not in the first release** — stripped from `dev_handoff.html`. Kept in `index.html` for
  future scope; migration intent: enabling "Is Deployable?" on an assignment should surface it as
  a template automatically.
