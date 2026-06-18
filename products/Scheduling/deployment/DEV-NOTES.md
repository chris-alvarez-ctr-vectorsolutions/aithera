# Dev Notes — Deployment

Developer handoff notes for the Deployment flow. Each `## <node-id>` maps to a step
on the Flow Map; every bullet shows as a 📝 dev note on that node and in its drawer.
These are design-intent and gotcha notes — not a spec.

> author: Design handoff

## land — Edit Assignments (landing)
- This is the Crew Scheduling landing; the primary branch point is "Add New Deployment", which opens the form. The deployment *type* ("Create from scratch" vs "Select existing assignments") is chosen there and drives which of the two flows below runs.
- The two flows share one form and one Select Employee dialog — build them as one screen with a mode flag, not two separate pages.
- **Deployable tooltip (AC-1.3):** the "Is Deployable?" column header has an info icon explaining what the toggle does (appears in the deployment workflow; doesn't affect active/past deployments).
- **Single Quick Deploy (AC-7.6):** each row's **⋯ ellipses menu** has Deploy / Edit / Delete; Deploy jumps into the Select-existing flow with that assignment pre-selected. It first opens a small date-pick dialog because the start/end date is a hard prerequisite (employees pre-populate from the start date).
- **Multi-select deploy (AC-7.8/7.9):** the "Select to deploy" header button enters checkbox-select mode — a checkbox appears on every *deployable* row and a sticky bottom bar shows "N selected · Deploy selected →". Deploying opens the same date-pick dialog (titled "N assignments"), then drops into the Select-existing flow with **all** selected assignments pre-selected. (Chosen UI pattern: checkbox mode — see PRD AC-7.8 alternatives shift-click / "Deploy multiple" in ellipses.)
- **Manage Templates** (header button) opens a dedicated page replacing the old multi-step "manage templates" flow — see the manage-templates notes below.

## n1 — Create form (initial, empty)
- Flow A ("Create from scratch") starts with **zero qualifiers** — the form is intentionally empty until the user adds them. Don't pre-seed.
- The primary-qualifier hint text changes once any qualifier exists ("at least one primary qualifier" → "at least one qualifier").

## n2 — Details + qualifiers
- **Open slots are generated from qualifiers, not entered manually.** Each primary qualifier count creates that many open slots; shared qualifiers (PM/EMT/HM) attach to every slot as ordinal-numbered sub-badges, e.g. PM(1).
- **Hard rule: total shared qualifiers can never exceed total primary qualifiers.** The stepper silently refuses to increment shared past that ceiling — enforce server-side too, not just in the UI.
- Slot identity is `(qualifier key + ordinal)`. When counts change, already-assigned employees must be preserved for surviving slots (the prototype re-matches by key+ordinal on every rebuild). Losing assignments on a re-render is a bug.

## n3 — Select Employee (picker)
- Employees are **ranked, not filtered**: full match of all required primary + shared quals = "Recommended", some = "Partial match", none = falls to the bottom. Everyone is still selectable.
- `PM1` in employee data is treated as `PM` for matching — normalize that alias on the backend.
- OT / PTO status shows as a trailing tag and only as an availability note (`· OT` / `· PTO`) when the person otherwise matches — it does **not** block selection.
- ⚠️ This roster is mocked at 6 people. Real stations can have hundreds — the picker list must be virtualized and the ranking sort must run server-side or be debounced; don't sort the full list on every keystroke client-side.

## n4 — Positions filled (result)
- "Filled" is a count of slots with an employee (`filled/total` pill); deploying with open slots is allowed in Flow A here, but confirm whether production should warn before deploying partially filled.
- Each filled slot supports remove/replace in place (the × clears the slot back to open and re-opens the picker).

## m1 — Existing deployment (initial)
- Flow B ("Select existing assignments") pre-populates employees from **who is already scheduled on the start date** — so start & end dates are required *before* the Select Assignments button enables. The gate + helper text is deliberate; keep the disabled-until-dated behavior.
- Only assignments flagged `isDeployable` appear in the picker modal. Non-deployable ones (e.g. unselected templates) are hidden, not greyed.

## m2 — Select Assignment(s) view
- This is a **near-full-screen working view (~85% of the viewport)**, not a narrow modal — it needs room for search and a broad multi-column card grid (customers can have hundreds of deployable assignments). Build it as a wide panel/route, not a small dialog.
- **Search** filters the cards by assignment name (and assigned employee name). Server-side/paginated filtering is required at real scale; don't load+render every assignment client-side.
- The view lists only **deployable** assignment cards (the "Is Deployable?" setting), **sorted alphabetically** (AC-3.1), each with its slot bars; a checkbox toggles whether the assignment is included in the deployment.
- Open slots inside a card are fillable right there (clicking an open bar opens the same Select Employee dialog in "flowB" mode targeting that card+slot). Filled bars can be removed back to open.

## m3 — Select Employee (from an assignment slot)
- Same dialog as n3 but launched against a specific assignment slot's quals (Branch A). On Continue it writes back to that assignment card, not to the Flow A slots — the dialog has two write targets keyed by mode, watch that the right one fires.

## m4 — Create Assignment Template
- Branch B: build a **reusable** assignment template. Creating it doesn't fill people — it's a definition of open positions, surfaced separately from the chosen assignments.
- The builder is an **inline panel** under "Assignment Template(s)" inside the Select Assignment(s) view (not a separate dialog). The "+ Create New Assignment Template" trigger reveals it; Cancel/Create are inline; the trigger hides while creating and once a template exists.
- The builder must support: **(1) naming** the template; **(2) qualified positions** — each added position takes a **primary qualifier and an optional shared qualifier** (AC-5.5), creating one slot requiring them; **(3) open positions with no qualifier** (minimum staffing) via a count field. The template's slots = qualified open slots + plain open slots — i.e. **partial qualifier coverage** is the default (cover some positions, leave the rest open). All slots start open and get filled per-deployment, not in the template editor.
- Templates the builder creates are saved into the shared `TEMPLATES` list, so they also appear on (and are editable from) the Manage Templates page.
- This is being split into its own story but kept in the same initiative; the goal is to **completely replace the old multi-step "manage templates" flow**. In production a template is a saved, named, reusable entity — design the data model for reuse across deployments. Migration intent: enabling "Is Deployable?" on an existing assignment should surface it as a template automatically.

## m5 — Assignments filled
- The modal now shows both the chosen assignments (with slots filled) and the created template. Save Roster commits both into the form result.

## m6 — Deployment created (result)
- Result renders two sections: "Assignment(s)" (the selected assignments) and "Assignment Template(s)". Each card/template is independently removable from the result.
- Open slots in the result are clickable — clicking one opens the Select Employee people picker (flowB mode) to fill that position in place, and the result re-renders with the chosen person. Filled bars can be cleared back to open via their ×.
- Removing the template card just unsets the template; removing an assignment card unselects it. Confirm whether removal here should also detach already-assigned people or just drop the card.

## Manage Templates (separate page — not a flow-map node yet)
- Dedicated page opened from the **Manage Templates** header button; **replaces the old multi-step "manage templates" flow** (described by the team as "garbage"). Has its own back link.
- Lists **deployable assignments + saved templates** together as cards (alphabetical), with a filter toggle (All / Deployable assignments / Templates) and a search box. Each card shows a type badge, a **summary line** (position count + qualifier breakdown + open count, AC-6.2), and its slot bars.
- **Create New Template** (AC-5.1/US-21): button opens the Template Editor dialog (same fields as the inline builder — name, qualified positions with primary + optional shared, open-position count). Saves to `TEMPLATES` without deploying.
- **Edit** (AC-6.3/US-26): per-template Edit opens the same dialog pre-filled; saving updates that template in place. **Delete** (AC-6.5/US-27): per-template trash button removes it (a confirm notes historical deployments are preserved).
- Only **templates** get Edit/Delete; deployable-assignment cards are read-only here.
- Migration intent (backend, Cari to spike): existing templates are tied to assignments — enabling "Is Deployable?" on those should make them appear here as templates automatically (low effort).
- Pre-rollout: target the customers with the most templates for beta/feedback before replacing their workflow (DB query action item).

## Quick Deploy + multi-select (entry from the Crew Scheduler / Edit Assignments)
- **Single (AC-7.6/7.7):** each row's **⋯ ellipses menu → Deploy** opens a date-pick dialog, then drops into the Select-existing flow with that assignment pre-selected.
- **Multiple (AC-7.8/7.9):** **"Select to deploy"** enters checkbox mode (checkbox per deployable row + sticky "Deploy N selected" bar). Deploying opens the date-pick dialog for all selected, then pre-selects them all in the flow. Chosen pattern = **checkbox mode** (PRD listed shift-click and an ellipses "Deploy multiple" as alternatives — settled with design here).
- The date dialog exists because start/end date is a hard prerequisite (employees pre-populate from the start date). Open design questions from the review/PRD: where exactly this lives in the real CrewScheduler, and whether the date can be inferred from the scheduled context rather than asked.
- Prototype detail: assignments selected from the scheduler that aren't in the demo `ASSIGNMENTS` set are synthesized as deployable cards with a couple of open positions so the flow can demonstrate them.
