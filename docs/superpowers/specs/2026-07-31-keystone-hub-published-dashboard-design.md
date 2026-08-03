# Keystone Department Hub — published dashboard above the task list

**Date:** 2026-07-31
**Scope:** Chief and Firefighter views of `products/Keystone Department Hub/keystone-hub/`

## Problem

Both the chief and firefighter views need a published dashboard sitting above the task
list. The hard constraint: the dashboard must not push the top of the task list below
the fold. Today it does — the chief's Battalion Pulse hero alone is ~500px, and the
firefighter's published dashboard is ~460px because of a full-width line chart.

Separately, the firefighter dashboard needs to be a proposal safe enough to push to
every customer: it cannot expose data a line firefighter shouldn't see, and it cannot
read as surveillance.

## Decisions

| Question | Decision |
|---|---|
| Greeting header | Slim by ~half; drop the three big-number vital tiles; keep a brief greeting + day overview |
| Battalion Pulse hero (chief) | Retired — the published dashboard replaces it |
| Agency Intelligence entry point | Relocated into the published dashboard's header |
| Firefighter dashboard provenance | Default template, agency-published |

## 1. Slim greeting (all roles)

- Remove `.kx-vitals` (3 stat tiles); `.kx-greeting` collapses to one full-width column.
- Headline `clamp(28px, 3.4vw, 44px)` → `clamp(20px, 2.1vw, 26px)`. Serif display face
  and colored numeral both stay.
- The day overview survives as an **inline stat line** folded into the subtitle:
  colored dot + count + label. ~20px instead of ~70px of tiles.
- Padding trims: `.kx-hero-inner` top `24→16`, `.kx-greeting` `8px 0 24px → 4px 0 12px`,
  `margin-bottom 16→10`.

The greeting counts are **task-queue** state (late / at risk / P0); the dashboard shows
**readiness metrics**. Different data, so the inline line is a bridge into the table,
not a duplicate of the card.

Target: ~175px → ~90px.

## 2. Chief dashboard — "B-1 Coverage Snapshot"

One row, three KPI widgets at `w:4`, each with the built-in 26px sparkline so trend
comes free without a second row.

| Widget | Metric (`AVAILABLE_METRICS`) | Range | Source |
|---|---|---|---|
| Open shifts | `open_shifts` | Next 14 days | Scheduling |
| Credentials expiring | `credential_expirations` | Next 30 days | TargetSolutions |
| Overdue inspections | `overdue_inspections` | Last 30 days | Check It |

Each is from a different source app — the Keystone premise made visible at a glance —
each is a chief's to act on, and each maps to a task type already in the table below.

Provenance: the chief is the builder, so the badge reads **"Your dashboard"** (not
"Published to you") and the footer reads "You own this". This is what earns the
Agency Intelligence link in §4 — the chief can genuinely edit it.

## 3. Firefighter dashboard — safe-by-default

Three widgets, one row, `w:4` each. **`ff4` (full-width "My CEU hours logged" line
chart) is deleted** — ~190px, the single biggest height cost, and the least actionable
widget on the card.

| Widget | Value | Detail |
|---|---|---|
| My required training | `92%` | 2 courses remaining · sparkline |
| Next credential expiring | `18 days` | Paramedic recert · renew by Jul 12 · warn tone |
| CEU progress | `38%` | 14 of 36 hours · slim progress bar, due Dec 31 |

### Safety rationale

Every widget passes three tests: it is the firefighter's **own record**, it is
**already visible to them** in the source product today, and it is **personally
actionable**. Nothing on the card tells them anything new about anyone else.

Deliberately excluded:

- **No peer comparison, ranking, or leaderboard.** The biggest complaint generator —
  reads as surveillance and lands as a labor-relations problem.
- **No station / battalion / department rollups.** Any aggregate is a window into
  colleagues' compliance status.
- **No staffing, overtime, sick-leave, or PTO figures.** Labor-sensitive, and not a
  line firefighter's to see in aggregate.
- **No Guardian Tracking, evaluation, or disciplinary signal.** The most sensitive
  record class in the suite; must never surface on a home dashboard, even one's own.
- **No response-time or incident metrics.** Operational data that invites misreading
  and that they cannot personally act on.
- **No metric framed as a score.** All three are completion-or-countdown against a
  stated requirement, never a grade.

Provenance: header keeps "Published to you" plus the publisher name, with a small
"Keystone starter template" note so the shipped-default origin is legible.

## 4. Agency Intelligence links → dashboard header

The retired rail's links move into the published-dashboard header as a right-side
control cluster on the row that already holds the title and badge.

- **Switch dashboard** — tertiary button + chevron opening the existing `kx-menu`,
  populated from `CC.loadDashboards()`. Absorbs `dashboardsRail()`.
- **Agency Intelligence** — tertiary link to `agency-intelligence-dashboard.html`,
  new tab. Gated on `r.admin`, so the firefighter never sees it.
- Firefighter gets the switcher only if more than one dashboard is published to them;
  otherwise the header stays a clean title.
- **`widgetsRail()` (pinned widget tiles) is retired, not relocated** — it showed the
  same metrics the dashboard now shows, one card higher.

## 5. Height budget

| Region | Now | After |
|---|---|---|
| Greeting | ~175px | ~90px |
| Chief hero (Pulse + facets + rails + AI card) | ~500px+ | 0 (retired) |
| Published dashboard | ~460px (FF, 4 widgets) | ~250px (3 widgets, 1 row) |
| Spacer + filter bar | ~68px | ~68px |
| **Total above the table** | **~740px+** | **~408px** |

On a ~780px viewport that leaves ~370px for the table — header plus roughly seven
rows. Estimates computed from CSS; verified in-browser during implementation.

## Files

Touched: `hub.js`, `hub-hero.js`, `index.html`.

**Not touched:** `hub-agency-intel.js`, `agency-intel-*.js`,
`agency-intelligence-dashboard.html` — active parallel work. The dashboard switcher
reads `CC.loadDashboards()` from `custom-dashboards.js` instead of going through the
agency-intel layer.

## Known gaps (flagged, out of scope)

1. The greeting slim is global, so Training Officer and Lieutenant inherit it. Their
   heroes are otherwise untouched — which leaves the Lieutenant still carrying a
   6-widget dashboard with a full-width table, so his task list stays below the fold.
2. Retired code stays in the file, unreferenced and marked `RETIRED` (`coverageHero`,
   `pulseMeter`, `facets`, `facetDetail`, `computePulse`, `microSpark` — ~300 lines),
   so the Pulse is cheap to restore mid-review.
