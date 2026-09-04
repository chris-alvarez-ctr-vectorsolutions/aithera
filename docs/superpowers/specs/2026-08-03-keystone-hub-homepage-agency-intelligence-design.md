# Keystone-Department-Hub — Agency Intelligence chat inside the dashboard container

**Date:** 2026-08-03
**Scope:** `products/Keystone-Department-Hub/keystone-hub/` — the published-dashboard
container on the hub homepage. Inherited by the three embedded app shells for free.

## Problem

Any user with the proper AI permissions configured in the **AI access tab** of the
Agency Intelligence page should get the Agency Intelligence chat input on their own
dashboard — chat on the left, dashboard widgets on the right.

Most of this already exists as data and logic; what's missing is the surface.

- The grant model is built. `agency-intel-ai-data.js` seeds grants (`battalion_chief`
  and `captain` titles; Naima Whitfield `u12` and Cassidy Park `u14` named
  individually) and the AI access tab at `agency-intel-page.js:441` manages them under
  the heading *"Homepage Agency Intelligence — who gets an assistant on their homepage."*
- The answer engine is built. `AGENCY_INTEL_AI.homepageRespond()` checks the asker's
  entitlements, returns denial text when they lack a source, and emits an audit record.
- **There is no homepage surface.** `hub.js:860` records that the chat card "used to
  mount inside the retired coverage hero's right column… no in-page mount, no height
  cost." `hub-agency-intel.js` (978 lines) is still included but orphaned — only its
  `widgetsRail()` / `dashboardsRail()` are referenced, and only from the retired
  `coverageHero()`.

## Decisions

| Question | Decision |
|---|---|
| Which surface | Hub homepage; the three embedded shells inherit it (they `<iframe>` the real `keystone-hub/index.html`) |
| Where in the page | **Inside the dashboard container** (`.kx-pubdash`), not alongside the task table |
| Side | Left; widgets on the right |
| Height | Start compact (~200px, no change from today), grow to ~520px on first ask |
| Gate source | `AGENCY_INTEL_AI.seedGrants()`, read directly — one source of truth |
| Panel code | New slim panel on `homepageRespond()`, plus one contextual action ("Add as a widget") |
| Charts in chat | Never. Answers become widgets in the grid; the grid is the canvas here |

### Why not revive `hub-agency-intel.js`

It has seeded correlative prompts, inline chartlets, CSV download and a build wizard —
tempting, but it fights two decisions that still hold. `agency-intel-ai-data.js` states
the homepage is *"text only — no canvas on the homepage; charts live in Agency
Intelligence,"* and its build wizard now duplicates what the Agency Intelligence page
does properly. Its three seeded prompts are worth keeping; the rest is not.

## 1. The gate

`INDIVIDUALS` in `agency-intel-page-data.js` is derived from `K.PEOPLE`, so the hub and
the Agency Intelligence page already share one roster. The gate therefore needs **no new
data**.

Resolution: `K.ROLES[state.role].selfId` → matching `AGENCY_INTEL.INDIVIDUALS` entry →
granted if `seedGrants().individuals` names that id, **or** `seedGrants().titles`
includes that person's `titleId`.

| Hub role | Person | Rank → title | Granted? | Can query |
|---|---|---|---|---|
| Chief | Jamie Smith (`u1`) | `battalion_chief` | Yes — title grant | ts, ci, gt, ev — **not `sched`** |
| Training Officer | Naima Whitfield (`u12`) | `training_officer` | Yes — named individually | ts, ev, gt |
| Lieutenant | Sloane Kim (`u3`) | `lieutenant` | No — the granted Lieutenant is Cassidy Park (`u14`) | — |
| Firefighter | Riley Brennan (`u5`) | `firefighter` | No | — |

Three consequences worth stating:

1. **Chief (granted) and Firefighter (not granted) both render `.kx-pubdash` by
   default.** Switching between those two roles demonstrates the gate in the same
   container with no flags to toggle.
2. **The Training Officer holds a grant but sees no panel in this scope.** Role → hero
   mapping is not uniform (`hub.js:842`): Chief and Firefighter get
   `publishedDashboard()`, while the Training Officer gets `complianceHero()` and the
   Lieutenant a third variant — both behind the `futureOn` flag. Since the panel lives
   inside `.kx-pubdash`, a granted role whose hero is not a dashboard container gets
   nothing. Holding a grant and seeing a panel are therefore not the same thing here;
   extending to `complianceHero()` is a non-goal (§8).
3. The Chief deliberately lacks `sched` (`agency-intel-page-data.js:56`), so *"which
   shifts are open next week?"* is **declined on their own homepage**. The
   access-reconciliation story lands on the surface it was written for.

When a role is not granted, `publishedDashboard()` returns exactly what it returns
today — no wrapper, no panel, no height change. The ungranted case is a true no-op, not
a hidden element.

## 2. Layout

`publishedDashboard()` currently renders `head → .kx-pubgrid → foot`. It becomes
`head → .kx-pubbody → foot`, where `.kx-pubbody` is a flex row:

- `.kx-aipanel` — left, `width: 320px`, `flex-shrink: 0`
- `.kx-pubgrid` — right, `flex: 1`, **12-column definition unchanged**

Leaving the grid definition alone is what keeps `pubWidget()` and every `w: 4` spec
working untouched. At a 1440px viewport the grid still gets ~1030px, so three KPI
widgets sit at ~335px each and **the widget row does not reflow**.

Below 980px the panel goes full-width above the grid, following the pattern already at
`index.html:455`.

## 3. The three states

### Compact — default, ~200px

`align-self: stretch` makes the panel exactly as tall as the widget row. Nothing below
it moves; container height is unchanged from today.

Contents: header (gradient `agency-intel-mark`, "Agency Intelligence", and a subtitle
scoped to the dashboard — *"Ask about B-1 Coverage Snapshot"*), three suggestion chips,
and the input.

The chips carry **short** labels — "Overtime risk · 30 days", "Training × inspections",
"Credentials × CEUs" — because the full sentences from `hub-agency-intel.js`'s
`EXAMPLES` become mostly ellipsis at 320px. The full sentence is what gets sent, and
sits in the `title` attribute.

### Expanded — after first ask, ~520px

The container grows downward. **The widget row does not move** — it stays pinned at the
top, three across. The new height is taken by the thread on the left and, on the right,
the empty grid row beneath the widgets.

That row is not decoration: it is where **"Add as a widget"** results land. Until
something lands there it renders as a dashed placeholder — `add_chart` icon, "Answers
you add land here" — which fills the space honestly and teaches the interaction.

This is the reason "grow on first ask" is right here and would not have been on the
task-table layout: the extra height is doing a job, not merely accommodating a taller
panel.

### Collapsed

A chevron in the panel header collapses it to a ~40px vertical strip (mark + rotated
label) and the grid reclaims full width — reusing the `.cpv-collapsed` pattern from the
build view. The container was deliberately height-budgeted, so a reviewer who wants to
see the dashboard as it ships today needs exactly one click.

The header also carries **New chat** (`restart_alt`), which returns the panel to
compact.

### Visual language

Ported from the build view's `.cpv-*` styles (376px → 320px) so the panel reads as the
same component the user saw in Agency Intelligence. In the build view that panel sits on
the **right**; on the dashboard it is on the **left**. That difference is intentional.

## 4. Answering

Send calls `AGENCY_INTEL_AI.homepageRespond(question, person)`, which returns
`{ text, denied, entry }`. Four outcomes, all **text-only** in the thread:

| Outcome | Thread content | Action offered |
|---|---|---|
| Answered | Text bubble | **Add as a widget** — when `entry.metricId` is set **and** `cfg.owned` |
| Declined | Denial text + muted line naming the missing source | None |
| No data | Text bubble | None |
| Unrecognized / small talk | Text bubble | None |

The `**bold**` in the seeded answers is handled by porting `agencyIntelBubble()`. The
thinking state reuses the three-dot "Querying your apps…" bubble.

## 5. Add as a widget

`CC.buildSpec(metricId, 'kpi')` already yields label, number, delta, tone and sparkline
data, and `pubWidget()` already renders it — so this is wiring, not new machinery.

Added widgets go into a session array that `publishedDashboard()` renders after
`cfg.widgets` at `w: 4`, landing in the placeholder row.

Gated on `cfg.owned`. The Firefighter's dashboard is read-only ("only Training can
edit"), so a consumer never gets an edit affordance. That role has no grant today, so
the guard never fires — but it is the rule that keeps this correct if a grant is ever
added for a consumer role.

## 6. Files

| File | Change |
|---|---|
| `hub-ai-panel.js` | **New.** Panel state, markup, wiring, respond; inherits the three seeded prompts |
| `hub-hero.js` | `publishedDashboard()` gains `.kx-pubbody`, the panel mount, added-widget rendering |
| `index.html` | Three new script tags; `.kx-pubbody` / `.kx-aipanel` styles; ported panel styles |
| `styles.css` | Shared `.agency-intel-mark`, thread bubbles, dot animation, send button — one definition instead of two copies |
| `products.json` | Refresh the Department Hub `desc` and `modified` |

**Script order** in `index.html`: `agency-intel-page-data.js` and
`agency-intel-ai-data.js` go after `custom-dashboards.js` (page-data derives
`INDIVIDUALS` from `K.PEOPLE`, so it must follow `data.js`); `hub-ai-panel.js` goes
after `hub-hero.js`.

`hub.js` is untouched. The panel re-renders through `window.KXHub.render()`, the same
path every other hub interaction uses.

`hub-agency-intel.js` **stays on disk but leaves the script list.** It is 978 lines of
dead JS on the page, but the retired `coverageHero()` guards on `window.KXAgencyIntel`
and its comment says it is kept because restoring is cheap. Dropping the include removes
the weight; deleting the file would destroy that restore path.

## 7. Known gap — the audit log does not cross pages

The AI access tab's audit log reads `state.aiLog`, seeded inside
`agency-intelligence-dashboard.html` — a separate document. localStorage persistence was
**rejected** so that every reviewer opens to the same state, which is the existing
convention (`agency-intel-roster.js:568`: *"deliberately no localStorage, so every
reviewer opens to the same state"*).

Consequence: **a question asked on the hub will not appear in that audit log.** The hub
keeps its own entries in memory for the session. The loop is demonstrable on each page,
but not across them.

Closing it later means persisting `aiLog`, and accepting that reviewers no longer share
one starting state. Recorded here as an open choice, not an oversight.

## 8. Non-goals

- The compliance hero (Training Officer) and lieutenant hero. Both are behind the
  `futureOn` flag, and the Chief-vs-Firefighter contrast already demonstrates the gate
  in one container.
- Any chart rendering inside the chat thread.
- Persistence of grants, added widgets, or the log.
- Changes to the task table, filter bar, or greeting header.
- Changes to the three embedded shells. They `<iframe>` the hub, so they inherit this
  with no edits.

## 9. Structural note

`keystone-hub/` predates the versioned-feature convention in `CLAUDE.md` — no
`versions.json`, no `verN/`. This work edits in place to match the folder as it already
is, rather than restructuring it as a side effect.
