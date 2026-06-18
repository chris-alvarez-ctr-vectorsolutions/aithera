# Dev Notes — Deployment

Developer handoff notes for the Deployment flow. Each `## <node-id>` maps to a step
on the Flow Map; every bullet shows as a 📝 dev note on that node and in its drawer.
These are design-intent and gotcha notes — not a spec.

> author: Design handoff

## land — Edit Assignments (landing)
- This is the Crew Scheduling landing; the primary branch point is "Add New Deployment", which opens the form. The deployment *type* ("Create from scratch" vs "Select existing assignments") is chosen there and drives which of the two flows below runs.
- The two flows share one form and one Select Employee dialog — build them as one screen with a mode flag, not two separate pages.
- **Quick Deploy:** deployable assignment rows show a ⚡ Deploy action that jumps straight into the Select-existing flow with that assignment pre-selected (others available to add). It first opens a small date-pick dialog because the start/end date is a hard prerequisite (employees pre-populate from the start date) — that quick step is how we satisfy the prerequisite without making the user open the full form first.
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
- The view lists only **deployable** assignment cards (the "Is Deployable?" setting), each with its slot bars; a checkbox toggles whether the assignment is included in the deployment.
- Open slots inside a card are fillable right there (clicking an open bar opens the same Select Employee dialog in "flowB" mode targeting that card+slot). Filled bars can be removed back to open.

## m3 — Select Employee (from an assignment slot)
- Same dialog as n3 but launched against a specific assignment slot's quals (Branch A). On Continue it writes back to that assignment card, not to the Flow A slots — the dialog has two write targets keyed by mode, watch that the right one fires.

## m4 — Create Assignment Template
- Branch B: build a **reusable** assignment template. Creating it doesn't fill people — it's a definition of open positions, surfaced separately from the chosen assignments.
- The builder is an **inline panel** under "Assignment Template(s)" inside the Select Assignment(s) view (not a separate dialog). The "+ Create New Assignment Template" trigger reveals it; Cancel/Create are inline; the trigger hides while creating and once a template exists.
- The builder must support: **(1) naming** the template; **(2) qualified positions** — each qualifier added creates one position requiring it; **(3) open positions with no qualifier** (minimum staffing) via a count field. The template's slots = qualified open slots + plain open slots — i.e. **partial qualifier coverage** is the default (cover some positions, leave the rest open). All slots start open and get filled per-deployment, not in the template editor.
- This is being split into its own story but kept in the same initiative; the goal is to **completely replace the old multi-step "manage templates" flow**. In production a template is a saved, named, reusable entity — design the data model for reuse across deployments. Migration intent: enabling "Is Deployable?" on an existing assignment should surface it as a template automatically.

## m5 — Assignments filled
- The modal now shows both the chosen assignments (with slots filled) and the created template. Save Roster commits both into the form result.

## m6 — Deployment created (result)
- Result renders two sections: "Assignment(s)" (the selected assignments) and "Assignment Template(s)". Each card/template is independently removable from the result.
- Open slots in the result are clickable — clicking one opens the Select Employee people picker (flowB mode) to fill that position in place, and the result re-renders with the chosen person. Filled bars can be cleared back to open via their ×.
- Removing the template card just unsets the template; removing an assignment card unselects it. Confirm whether removal here should also detach already-assigned people or just drop the card.

## Manage Templates (separate page — not a flow-map node yet)
- Dedicated page opened from the **Manage Templates** header button; **replaces the old multi-step "manage templates" flow** (described by the team as "garbage"). Has its own back link.
- Lists **deployable assignments + saved templates** together as cards, with a filter toggle (All / Deployable assignments / Templates) and a search box. Each card shows a type badge (assignment vs template) and its slot bars.
- Migration intent (backend, Cari to spike): existing templates are tied to assignments — enabling "Is Deployable?" on those should make them appear here as templates automatically (low effort).
- Pre-rollout: target the customers with the most templates for beta/feedback before replacing their workflow (DB query action item).

## Quick Deploy (entry from the Crew Scheduler / Edit Assignments rows)
- Deployable assignment rows expose a ⚡ Deploy quick-action → opens a **date-pick dialog** (start/end), then drops into the Select-existing flow with **that assignment pre-selected** (others still addable). The date dialog exists because the start/end date is a hard prerequisite (employees pre-populate from the start date) — pre-filling/quick-picking it is how we avoid forcing the full form first.
- Open design question from the review: where exactly this is triggered in the real Crew Scheduler, and whether dates can be inferred from context rather than asked.
