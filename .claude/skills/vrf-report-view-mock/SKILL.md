---
name: vrf-report-view-mock
description: >-
  Generate a self-contained static HTML mock/prototype of a Vector report using
  the <vrf-report-view> web component backed by a hand-authored mock service,
  with all bundles loaded from the Vector dev CDN. Use when someone (often a
  designer) wants to prototype or mock up a report — its filters, charts, data
  grids, master-detail rows, cell renderers — without a real backend, or asks for
  a "report mock", "vrf-report-view mock/prototype", or a "static report HTML".
  Produces one .html file that opens directly in a browser. Only uses report-view
  features that currently exist.
---

# Static `vrf-report-view` mock generator

Produces a single `.html` file that renders a fully interactive `vrf-report-view`
driven by an in-file mock `IVectorReportViewService`. No build step, no server —
all component bundles load from the Vector dev CDN.

`report-view` is **entirely metadata-driven**: the report's filters, charts,
grids, columns, and cell renderers all come from the report/layout/dataset
objects the service returns. So a mock is just a mock service returning
hand-authored metadata. Your job is to author that metadata + row data using
**only supported features**.

## Workflow

### 1. Load the feature reference FIRST (required)

Before authoring anything, read the package's `CONTEXT.md` docs so you use only
supported config keys. Two docs matter:

- **service** `internal/services/CONTEXT.md` — the `IVectorReportViewService`
  interface, REST/response types, `queryDataset`/`VrfDatasetData`, saved-view
  payloads.
- **component** `internal/components/report-view/CONTEXT.md` — filters, visuals
  (grids + charts), columns, cell renderers, master-detail, the mock recipe.
  (The root `CONTEXT.md` is an index of both.)

Get them from whichever source is available, in this priority:

1. **node_modules** (if you're in a project that installs the package):
   `node_modules/@vector-reporting-framework/report-view/CONTEXT.md` and
   `.../internal/services/CONTEXT.md` and
   `.../internal/components/report-view/CONTEXT.md`.
2. **A clone of the `reporting-view` repo**:
   `projects/report-view/CONTEXT.md`,
   `projects/report-view/src/internal/services/CONTEXT.md`,
   `projects/report-view/src/internal/components/report-view/CONTEXT.md`.
3. **The CDN** (needs a report-view version — see step 3). WebFetch:
   `https://cdn.develop.vsp-nonprod.com/web-components/@vector-reporting-framework/report-view/v${RV_VERSION}/CONTEXT.md`
   (plus `/internal/services/CONTEXT.md` and
   `/internal/components/report-view/CONTEXT.md` at the same version path).

### 2. Reconcile the request against the feature set — stop and ask if it doesn't fit

The mock must only use features that exist in the report-view version you're
pinning. After reading the CONTEXT.md docs, check every part of the user's
request against them. If any part can't be expressed with the documented config
(an unsupported filter type, visual, renderer, layout, interaction, service
capability…), **do not fake it and do not silently drop it**. Faking it — hand-
written HTML/CSS/JS outside the component, a monkey-patched bundle, a renderer
the component doesn't have — produces a mock that misrepresents what the product
can actually do, which is the one thing this skill exists to prevent.

Instead, stop and tell the user plainly:

- Which specific part of their request isn't supported today, and what the docs
  do offer in that area.
- **Alternatives** — the closest *first-class* supported approach (a different
  filter type, a supported visual, a different renderer type), and what it would
  and wouldn't convey. Offer to build the mock with the alternative. Read the
  next section before you propose one — a `template` renderer usually is **not**
  a legitimate alternative.
- **A feature proposal** — offer to write one up for the web component team to
  implement. Ask which they'd like before continuing.

If the rest of the report is unaffected, offer to build the mock now with the
gap called out (a note in the handoff, not a fake implementation) so they have
something to look at while the proposal is considered.

#### Templates are not an escape hatch — never bypass the real component

The `template` cell/section renderer can emit arbitrary sanitized HTML, including
custom elements and inline styles. That makes it powerful enough to hand-roll a
replacement for almost any component feature — and it is the single easiest way to
produce a mock that lies. **A hand-rolled template is not "supported" just because
`template` is a documented key.**

The test is *what the template renders*, not that you used a documented key:

- ✅ **Legitimate** — rendering data the component has no opinion about: a
  consumer-owned custom element, a host-owned button that opens a host-owned modal
  (the documented pattern — `on*` handlers are stripped by DOMPurify, so a real
  element is the only way to make a cell interactive), a row-scoped detail panel, a
  bit of row-specific markup or a heading.
- ❌ **Bypassing** — reimplementing, extending, or restyling something the
  component already owns: a hand-drawn `<div>` progress bar because the real
  `progress-bar` renderer can't do value-based color; a hand-styled pill because
  the `status` renderer's `themeMap` lacks a theme you want; a grid of cards
  because there's no card visual; CSS reaching into the component's internals to
  restyle its parts.

**If the missing capability is generic and would be useful to other reports, it
belongs in the component — not in a template in one mock.** Value-based progress-bar
color, a new badge theme, a new filter control, a new visual type: all generic. Say
it isn't supported, offer the feature proposal, and ship the mock with the real
renderer in its default state.

Do not build the bypass "just so they can see it," even when asked to make it look
right, and even though it would be easy. A mock whose bar is the wrong color tells
the designer the truth about the product; a mock with a fake bar tells them a
feature exists that doesn't, and that lie survives into design reviews, specs, and
sprint planning. If the user explicitly wants a visual-only approximation after
hearing this, that's their call — but label it unmistakably in the mock (a comment
at the code, a callout in the handoff) and in the feature proposal's "Workaround"
section, so nobody downstream mistakes it for shipped behavior.

#### Writing a feature proposal

Only when the user asks for one. Write it to a markdown file next to the mock
(e.g. `<report-name>-feature-proposal.md`), addressed to the web component team,
and keep it short and concrete:

- **Feature** — one-line summary.
- **Motivation / use case** — the report the designer is building and what the
  missing capability is for. Screenshots or the mock file are useful; reference
  them.
- **Current behavior** — what report-view does today, quoting the relevant
  CONTEXT.md config for the version you checked (e.g. "the `filters[].type` values
  listed in the component CONTEXT.md are …; there's no…"). Cite the doc, don't
  recite a list from memory — the supported types change per version.
- **Proposed behavior** — what the user wants, sketched as the metadata it would
  take. Propose config shaped like the existing keys (this is a suggestion for
  the team, not a spec — say so).
- **Workaround used in the mock**, if any, and why it falls short.
- **Version** — the report-view version checked against.

Tell the user the file path and that it's ready to hand to the web component team.

### 3. Determine bundle versions

The page loads **four** classic IIFE scripts needing **three** version numbers:

| Bundle | CDN path (under `…/web-components/`) | Version placeholder |
| --- | --- | --- |
| VWC themes | `@vector-web-components/themes/v${V}/styles.js` | `__THEMES_VERSION__` |
| VWC core | `@vector-web-components/core/v${V}/core.iife.js` | `__CORE_VERSION__` |
| report-view | `@vector-reporting-framework/report-view/v${V}/report-view.iife.js` | `__RV_VERSION__` |
| DevExtreme theme | `@vector-reporting-framework/report-view/v${V}/dx-light-theme.js` | `__RV_VERSION__` (same as report-view) |

CDN host: `https://cdn.develop.vsp-nonprod.com`.

**Generally use the latest of each.** A designer may need a specific version to
match the product they're designing for. Find versions on the storybook
**change-log** pages:

- report-view: `https://cdn.develop.vsp-nonprod.com/web-components/@vector-reporting-framework/storybook/latest/index.html?path=/docs/packages-reportview-change-log--docs`
- VWC core & themes: `https://cdn.develop.vsp-nonprod.com/web-components/@vector-web-components/storybook/latest/index.html?path=/docs/packages-core-change-log--docs`

Programmatic fallbacks for the latest version:
- `curl -s https://cdn.develop.vsp-nonprod.com/web-components/@vector-reporting-framework/report-view/versions.json` (newest first).
- Same `versions.json` path under `@vector-web-components/core` and
  `@vector-web-components/themes`.

If the user can't find the report-view version, remind them it's on that
change-log page and they should likely **just use the latest**.

### 4. Author the mock

Copy `templates/report-view-mock.template.html` (next to this file) to the output
location, then:

- Replace the three `__*_VERSION__` placeholders.
- Rewrite `REPORT`, `LAYOUT`, `DATASET`, `ROWS`, and the `getDistinctValues` /
  `queryDataset` logic to match the report the user wants. Model filters/visuals/
  columns/renderers on the component CONTEXT.md.
- Keep `disableview` on the element unless the user wants to demo saved views (if
  so, remove it and implement the saved-view service methods).

The template is a working single-dataset example (date-range + status filter, a
pie/bar chart, and a grid with a status-pill renderer). For richer reports
(multi-dataset, master-detail sub-grids, template sections, custom cell elements)
follow the master-detail and renderer sections of the component CONTEXT.md.

#### One data point per column

Designers often ask for a column that packs several distinct data points into one
cell — a name *and* a completion date, a title *and* a status. This is possible,
but **push back and encourage splitting it into separate columns** before you
build it. A column per data point keeps sorting, filtering, and column-level
formatting meaningful; a merged column makes them useless or misleading, since
the grid can only sort and filter on the whole cell.

Suggest the split, say why, and build it that way unless the user still wants
them merged after hearing the tradeoff — it's their call, not a hard rule.

Combining fields that together form **one** data point is fine and needs no
pushback — e.g. `${last_name}, ${first_name}` as a single "Name" column, or a
city/state pair. The test is whether a user would ever want to sort or filter on
the parts independently.

### 5. Verify & hand off

- Open the file in a browser; check the devtools console for errors (unregistered
  elements → a VWC bundle failed/omitted; `NaN` chart values → wrong
  `${value}_${aggregation}` key).
- Tell the user which versions you pinned and how to open it.
- Restate any unsupported parts of the request you flagged in step 2 — what the
  mock does instead, and whether a feature proposal is written or still on offer.

## Required load order (already correct in the template)

All four are **classic IIFE scripts** — no `type="module"`, no `async`. Keep this
order so elements/tokens exist before report-view uses them, and put them at the
**end of `<body>`**, not in `<head>` (see the first gotcha):

```html
<script src="…/@vector-web-components/themes/v__THEMES_VERSION__/styles.js"></script>
<script src="…/@vector-web-components/core/v__CORE_VERSION__/core.iife.js"></script>
<script src="…/@vector-reporting-framework/report-view/v__RV_VERSION__/report-view.iife.js"></script>
<script src="…/@vector-reporting-framework/report-view/v__RV_VERSION__/dx-light-theme.js"></script>
```

## Gotchas

- **Load the bundles at the end of `<body>`, never in `<head>`.**
  `core.iife.js` calls `document.body.appendChild(...)` at load time. From
  `<head>`, `document.body` is still `null`, so core throws mid-init and silently
  leaves part of its element registry unregistered (e.g. `vwc-icon` never
  defines, so icons render as nothing) while `vaadin-*` elements that registered
  before the throw still work — which makes it look like a styling bug, not a
  load-order bug. Symptom: one `TypeError: Cannot read properties of null
  (reading 'appendChild')` in the console.
- **Attach the service BEFORE the element enters the DOM.** `vectorReportViewService`
  is a property, not an attribute — but assigning it to an element already in the
  markup is a race: the component starts its data task on its first Lit update, and
  if the service isn't there yet it renders *"An unknown error occurred"* and does
  **not** retry when the property lands. Create the element in JS, set
  `vectorReportViewService` / `reportId` / `disableView`, then append it (the
  template does this). Don't hard-code `<vrf-report-view reportid="…">` in the HTML.
- **VWC is not bundled into report-view.** The report-view IIFE renders
  `vwc-card`, `vwc-drawer`, `vaadin-button`, `vwc-icon`, etc. but does **not**
  register them — that's what `core.iife.js` + `styles.js` do. Omit either and the
  page renders blank/unstyled. (DevExtreme, Lit, and Chart.js **are** bundled in.)
- **Icons inside `vaadin-button` need `slot="prefix"`.** A `vwc-icon` dropped into
  the button's default slot sits inline with the label and misaligns.
- **Grid column state persists** to `localStorage` under
  `vrf-report-view-grid-state:<reportId>:<gridId>` (it's `localStorage` rather than
  `sessionStorage` precisely because `disableview` is set). After you add or reorder
  columns, a browser that already opened the mock replays its saved order and
  **appends the new column last** — it looks like the layout is wrong when it isn't.
  Tell the user to clear that key (or change the grid's `id`) and reload.
- **`queryDataset` has two branches.** Charts send `groupBy` + `totalSummary`;
  return rows keyed `${binding.value}_${binding.aggregation}` (e.g.
  `user_id_count`). Grids send paging/sort/filter; return `{ data, totalCount,
  summary }` with rows keyed by column `dataField`.
- **Distinct filters.** Filter types that declare `optionsSource: 'distinct'`
  trigger `getDistinctValues(datasetId, column)` — return their option lists. The
  service CONTEXT.md names which types support it in the version you're targeting.
- **`disableview`** avoids needing `saveView`/`listSavedViews`/`getView`/etc.
  Remove it only when demoing saved views.
- **Version skew.** report-view is built against a range of VWC core. If elements
  look wrong, pin the core/themes versions noted in that report-view release's
  change log rather than always-latest.
- **No topnav in a bare mock** → set `--vwc-topnav-height: 0px` on
  `vrf-report-view` so the filter drawer aligns to the top (template does this).
- **Point a `date-range` filter at a column every row actually has**, and make the
  mock rows fall inside its default range. A range on e.g. `last_accessed` drops
  every never-started row (its value is null), so a whole category vanishes from
  the grid *and* the chart on first load and the mock looks broken/empty. Prefer a
  column like an assigned/created date, and generate row dates relative to *this
  month* — a fixed `Date.now() - N days` offset silently falls outside a
  `start-of-month → today` default when the file is opened early in a month.

## Files

- `templates/report-view-mock.template.html` — the scaffold to copy and fill in.
