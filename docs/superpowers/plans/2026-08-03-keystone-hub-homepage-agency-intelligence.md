# Homepage Agency Intelligence Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the Agency Intelligence chat inside the hub's published-dashboard container — chat left, widgets right — visible only to roles the AI access tab has granted.

**Architecture:** `publishedDashboard()` in `hub-hero.js` wraps its widget grid in a new `.kx-pubbody` flex row and mounts a new `hub-ai-panel.js` module on the left when the role holds a grant. The panel calls the existing `AGENCY_INTEL_AI.homepageRespond()` for answers, entitlement checks and denials. Answers that resolve to a metric can be added to the grid as a `w:4` KPI widget via the existing `CC.buildSpec()` / `pubWidget()` path.

**Tech Stack:** Vanilla ES5-style JS (no build step, no framework), plain CSS, Material Symbols via `KX.micon()`. Verification is browser-based via the Playwright MCP tools — this repo has **no test framework**.

**Spec:** `docs/superpowers/specs/2026-08-03-keystone-hub-homepage-agency-intelligence-design.md`

## Global Constraints

- **No frameworks, no build tools, no npm packages.** Vanilla HTML/CSS/JS only.
- **Match the surrounding code style:** IIFE module wrapper, `var`, string concatenation for markup, `/* global window, document, ... */` header comment. Do not introduce template literals, `const`/`let`, arrow functions, or classes into `hub-*.js` — those files are deliberately ES5-flavoured so they load before any Babel layer.
- **All markup goes through `KX.esc()`** for text and `KX.attr()` for attribute values. Icons go through `KX.micon(name, opts)`.
- **Colors and spacing come from tokens in `styles.css`** (`--ink-*`, `--surface-*`, `--amber-*`, `--teal-*`, `--coral-*`, `--elev-*`, `--radius-pill`, `--font-display`, `--font-numeric`). Never hard-code a hex value.
- **Panel width: `320px`.** (The build view's equivalent is 376px; this is deliberately narrower.)
- **Compact height must not change the container height** vs. `main` today. Expanded target: `520px`.
- **Charts never render inside the chat thread.** A chart only ever appears as a widget in `.kx-pubgrid`.
- **No `localStorage`** for grants, thread, or added widgets. Session-only, so every reviewer opens to the same state.
- **Do not edit** `data.js`, `hub.js`, `custom-dashboards.js`, `agency-intel-page.js`, `agency-intel-ai-data.js`, or `agency-intel-page-data.js`. This work is additive.
- **Repo root:** `/Users/johnlangford/Documents/VibeCode/ux-mockups`. All paths below are relative to it.
- **Hub directory:** `products/Keystone Department Hub/keystone-hub/`. Referred to below as `<HUB>/`.
- **Page URL for verification:** `file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/keystone-hub/index.html`

### Playwright MCP tools are deferred

Before the first verification step, load them once:

```
ToolSearch: select:mcp__playwright__browser_navigate,mcp__playwright__browser_evaluate,mcp__playwright__browser_console_messages,mcp__playwright__browser_take_screenshot,mcp__playwright__browser_click,mcp__playwright__browser_type
```

### Role-switch shortcut used throughout verification

`setRole()` is not exported from `hub.js`, but `state` and `render()` are. To switch roles in a verification step:

```js
window.KXHub.state.role = 'ff';
window.KXHub.render();
```

This skips `setRole()`'s saved-view reset, which is irrelevant to `.kx-pubdash` assertions.

### Reference data (verified — do not re-derive)

`METRIC_SOURCE` (`agency-intel-page-data.js:24`) and job-title entitlements (`:58`):

| Metric | Source | Chief `[ts,ci,gt,ev]` | Training Officer `[ts,ev,gt]` |
|---|---|---|---|
| `training_completion`, `credential_expirations`, `policy_acks` | `ts` | answers | answers |
| `overdue_inspections`, `apparatus_downtime`, `equipment_failures` | `ci` | answers | **declines** |
| `response_time`, `incident_volume` | `gt` | answers | answers |
| `ceu_progress` | `ev` | answers | answers |
| `open_shifts`, `pto_pending`, `ot_trend`, `sick_leave`, `trade_requests` | `sched` | **declines** | **declines** |
| `tasks_by_app` | all five | **declines** | **declines** |

**The Chief lacks `sched`.** Every scheduling metric — including overtime — is declined for the default role. This is why suggestion chips are entitlement-filtered rather than hand-picked (Task 3).

All 15 `metricId`s used by `homepageRespond()` exist in both `AVAILABLE_METRICS` and `METRIC_DATA`, so `CC.buildSpec(metricId, 'kpi')` never returns `null` for an answered question. Verified against `custom-dashboards.js:13-30` and `:80-208`.

---

## File Structure

| File | Responsibility |
|---|---|
| `<HUB>/hub-ai-panel.js` | **New.** Owns the panel: the grant gate, panel state (thread / draft / thinking / collapsed / added), markup for all three states, event wiring, and the call into `homepageRespond()`. Exports `window.KXAIPanel`. |
| `<HUB>/hub-hero.js` | `publishedDashboard()` only: wrap the grid in `.kx-pubbody`, mount the panel, render added widgets and the drop placeholder. |
| `<HUB>/index.html` | Script tags; `.kx-pubbody` / `.kx-pubgrid` layout rules (page-specific, next to the existing `.kx-pubdash` rules). |
| `<HUB>/styles.css` | Panel component CSS (`.kx-ai-*`) and the shared `.agency-intel-mark`. |
| `<HUB>/agency-intelligence-dashboard.html` | Delete its now-duplicated `.agency-intel-mark` rule (Task 6 only). |
| `products.json` | Refresh the Department Hub `desc` and `modified`. |

`hub.js` is **not modified.** The gate derives the role from `publishedDashboard()`'s `variant` argument via a local map, because `window.KXHub` does not exist yet during the first render (`hub.js:1486` calls `setRole()` → `render()` before assigning `window.KXHub` at `:1503`).

`hub-agency-intel.js` **stays on disk but leaves the script list** (Task 1). The retired `coverageHero()` guards on `window.KXAgencyIntel`, so dropping the include degrades gracefully and keeps the documented restore path intact.

---

## Task 1: Load grant data, drop the dead script, add the gate

**Files:**
- Modify: `products/Keystone Department Hub/keystone-hub/index.html:636-644`
- Create: `products/Keystone Department Hub/keystone-hub/hub-ai-panel.js`

**Interfaces:**
- Consumes: `window.AGENCY_INTEL.INDIVIDUALS` (from `agency-intel-page-data.js`), `window.AGENCY_INTEL_AI.seedGrants()` (from `agency-intel-ai-data.js`), `window.KEYSTONE.ROLES`.
- Produces: `window.KXAIPanel.hasAccess(roleId) -> boolean` and `window.KXAIPanel.personFor(roleId) -> object|null` (an `AGENCY_INTEL.INDIVIDUALS` entry). Both are used by Tasks 2–5.

- [ ] **Step 1: Add the two data scripts and remove the dead one**

In `<HUB>/index.html`, replace the script block at lines 636-644 with:

```html
<!-- Data layer (plain JS, runs first) -->
<script src="data.js"></script>
<script src="custom-dashboards.js"></script>

<!-- Agency Intelligence grant model + homepage answer engine. Shared verbatim
     with agency-intelligence-dashboard.html so the hub's access gate reads the
     same grants the AI access tab manages. page-data derives INDIVIDUALS from
     K.PEOPLE, so it must come after data.js. -->
<script src="agency-intel-page-data.js"></script>
<script src="agency-intel-ai-data.js"></script>

<!-- Shared helpers, then chart renderers, then the page layers -->
<script src="keystone-shared.js"></script>
<script src="charts.js"></script>
<script src="hub-hero.js"></script>
<script src="hub-ai-panel.js"></script>
<script src="hub.js"></script>
```

Note what left: `hub-agency-intel.js`. The file stays on disk — the retired
`coverageHero()` guards on `window.KXAgencyIntel`, so it degrades to `''`.

- [ ] **Step 2: Create the module with the gate**

Create `<HUB>/hub-ai-panel.js`:

```js
/* global window, document, KEYSTONE, KX */
/* ========================================================================
   hub-ai-panel.js — Homepage Agency Intelligence, docked inside the
   published-dashboard container.
   ------------------------------------------------------------------------
   Chat on the left of .kx-pubdash, widgets on the right. Visible only to
   roles the AI access tab has granted — the gate reads the same
   seedGrants() the tab manages, so there is one source of truth and no
   duplicated permission model.

   Text answers only. A chart never renders in the thread; an answer that
   resolves to a metric can be ADDED to the widget grid, which is the canvas
   on this surface.
   ======================================================================== */

(function () {
  'use strict';

  var K = window.KEYSTONE;

  /* =====================================================================
     ACCESS GATE
     ---------------------------------------------------------------------
     A role is granted if the AI access tab names the person directly, or
     grants their job title. Same resolution the tab's own grant rows use.
     ===================================================================== */

  // Resolved once — seedGrants() is a pure seed with no session mutation.
  var grants = null;
  function getGrants() {
    var AI = window.AGENCY_INTEL_AI;
    if (!grants && AI && AI.seedGrants) grants = AI.seedGrants();
    return grants || { titles: [], individuals: [] };
  }

  // A grant record is { id, grantedAt, grantedBy }; tolerate a bare id too,
  // matching grantId() in agency-intel-page.js.
  function ids(list) {
    return (list || []).map(function (g) {
      return (g && typeof g === 'object') ? g.id : g;
    });
  }

  // roleId -> the AGENCY_INTEL.INDIVIDUALS entry for that role's person.
  function personFor(roleId) {
    var role = K.ROLES[roleId];
    var CP = window.AGENCY_INTEL;
    if (!role || !CP || !CP.INDIVIDUALS) return null;
    return CP.INDIVIDUALS.find(function (p) { return p.id === role.selfId; }) || null;
  }

  function hasAccess(roleId) {
    var person = personFor(roleId);
    if (!person) return false;
    var g = getGrants();
    if (ids(g.individuals).indexOf(person.id) !== -1) return true;
    return ids(g.titles).indexOf(person.titleId) !== -1;
  }

  window.KXAIPanel = {
    hasAccess: hasAccess,
    personFor: personFor
  };
})();
```

- [ ] **Step 3: Verify the gate resolves correctly for all four roles**

Load the Playwright tools (see Global Constraints), then:

```
browser_navigate → file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/keystone-hub/index.html
```

```
browser_evaluate → () => ({
  chief:    window.KXAIPanel.hasAccess('chief'),
  training: window.KXAIPanel.hasAccess('training'),
  lt:       window.KXAIPanel.hasAccess('lt'),
  ff:       window.KXAIPanel.hasAccess('ff'),
  chiefTitle: window.KXAIPanel.personFor('chief').titleId,
  ltName:     window.KXAIPanel.personFor('lt').name
})
```

Expected exactly:

```json
{ "chief": true, "training": true, "lt": false, "ff": false,
  "chiefTitle": "battalion_chief", "ltName": "Sloane Kim" }
```

If `chief` is `false`, the data scripts are in the wrong order — `agency-intel-page-data.js` must come after `data.js`.

- [ ] **Step 4: Verify nothing broke by dropping `hub-agency-intel.js`**

```
browser_console_messages
```

Expected: **no** entries of type `error`. Specifically no `KXAgencyIntel is not defined`.

```
browser_evaluate → () => ({
  agencyIntelGone: typeof window.KXAgencyIntel,
  dashRendered: !!document.querySelector('.kx-pubdash'),
  widgetCount: document.querySelectorAll('.kx-pubwidget').length
})
```

Expected: `{ "agencyIntelGone": "undefined", "dashRendered": true, "widgetCount": 3 }`

- [ ] **Step 5: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/keystone-hub/index.html" \
        "products/Keystone Department Hub/keystone-hub/hub-ai-panel.js"
git commit -m "Keystone hub: read the AI access tab's grants, drop the orphaned chat card

The hub now loads the same agency-intel grant model the AI access tab
manages, so homepage access has one source of truth. hub-agency-intel.js
leaves the script list but stays on disk — coverageHero() guards on it."
```

---

## Task 2: Two-column body and the compact panel

**Files:**
- Modify: `products/Keystone Department Hub/keystone-hub/hub-hero.js:656-694` (`publishedDashboard`)
- Modify: `products/Keystone Department Hub/keystone-hub/index.html:404` and `:454` area (layout rules)
- Modify: `products/Keystone Department Hub/keystone-hub/styles.css` (append panel component CSS)
- Modify: `products/Keystone Department Hub/keystone-hub/hub-ai-panel.js`

**Interfaces:**
- Consumes: `KXAIPanel.hasAccess(roleId)` from Task 1.
- Produces:
  - `KXAIPanel.html(cfg) -> string` — the panel markup. `cfg` is the `CHIEF_DASH` / `FF_DASH` / `LT_DASH` object, used for the subtitle (`cfg.name`) and, later, the `cfg.owned` guard.
  - `KXAIPanel.isExpanded() -> boolean` — always `false` until Task 3.
  - `KXAIPanel.addedWidgets() -> array` — always `[]` until Task 4.

- [ ] **Step 1: Add the layout rules to `index.html`**

In `<HUB>/index.html`, immediately **after** the `.kx-pubdash` rule at line 404, insert:

```css
  /* Dashboard body: Agency Intelligence panel (left) + widget grid (right).
     The grid keeps its own 12-column definition so every w:4 widget spec and
     pubWidget() work untouched. */
  .kx-pubbody { display: flex; gap: 12px; align-items: stretch; min-width: 0; }
  .kx-pubbody > .kx-pubgrid { flex: 1; min-width: 0; }
  /* Expanded: the container grows downward, but the widget row must NOT
     stretch to fill it — rows keep natural height and stack from the top,
     leaving the second row free for widgets added from chat. */
  .kx-pubbody.is-expanded { min-height: 520px; }
  .kx-pubbody.is-expanded > .kx-pubgrid { align-content: start; }
  @media (max-width: 980px) {
    .kx-pubbody { flex-direction: column; }
    .kx-pubbody.is-expanded { min-height: 0; }
  }
```

- [ ] **Step 2: Add the panel component CSS to `styles.css`**

Append to `<HUB>/styles.css`:

```css
/* =====================================================================
   HOMEPAGE AGENCY INTELLIGENCE PANEL
   ---------------------------------------------------------------------
   Ported from the build view's .cpv-* dock (376px there, 320px here) so
   the panel reads as the same component the user met in Agency
   Intelligence. In the build view it docks right; on the dashboard it
   docks left. That difference is intentional.
   ===================================================================== */

.agency-intel-mark {
  border-radius: 9px; flex-shrink: 0; color: white;
  background: linear-gradient(135deg, var(--amber-400) 0%, var(--coral-400) 100%);
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.16);
}

.kx-aipanel {
  width: 320px; flex-shrink: 0; align-self: stretch;
  display: flex; flex-direction: column; min-height: 0;
  background: var(--surface-1); border: 1px solid var(--ink-100);
  border-radius: 14px; box-shadow: var(--elev-1); overflow: hidden;
}
@media (max-width: 980px) { .kx-aipanel { width: 100%; } }

.kx-ai-head {
  display: flex; align-items: center; gap: 10px; padding: 11px 12px;
  border-bottom: 1px solid var(--ink-100);
  background: linear-gradient(180deg, var(--surface-1), var(--surface-2));
}
.kx-ai-head .t { font-weight: 700; font-size: 14px; color: var(--ink-900); line-height: 1.15; }
.kx-ai-head .s {
  font-size: 11px; color: var(--ink-500); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}

/* Suggestion chips — one non-wrapping scrollable row, so the compact panel
   fits inside the widget row's height at any label length. */
.kx-ai-chips {
  display: flex; gap: 6px; flex-wrap: nowrap; overflow-x: auto;
  padding: 10px 12px; scrollbar-width: none;
}
.kx-ai-chips::-webkit-scrollbar { display: none; }
.kx-ai-chip {
  flex-shrink: 0; padding: 5px 11px; border-radius: var(--radius-pill);
  border: 1px solid var(--ink-200); background: var(--surface-1);
  color: var(--ink-800); font-size: 11.5px; font-weight: 600;
  cursor: pointer; font-family: inherit; white-space: nowrap;
}
.kx-ai-chip:hover { border-color: var(--amber-400); background: var(--amber-50); }

.kx-ai-input-wrap { border-top: 1px solid var(--ink-100); padding: 10px; background: var(--surface-2); margin-top: auto; }
.kx-ai-input {
  display: flex; align-items: flex-end; gap: 8px; background: var(--surface-1);
  border: 1px solid var(--ink-200); border-radius: 12px; padding: 6px 7px 6px 12px;
}
.kx-ai-input:focus-within { border-color: var(--amber-400); box-shadow: 0 0 0 3px var(--amber-50); }
.kx-ai-input textarea {
  flex: 1; resize: none; border: none; outline: none; background: transparent;
  font-family: inherit; font-size: 12.5px; color: var(--ink-900);
  padding: 4px 0; min-height: 38px; max-height: 120px; line-height: 1.4;
}
.kx-ai-send {
  width: 30px; height: 30px; border-radius: var(--radius-pill); border: none;
  flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
  background: var(--ink-200); color: var(--ink-500); cursor: default;
}
.kx-ai-send.is-ready { background: var(--ink-900); color: white; cursor: pointer; }
.kx-ai-legal { font-size: 10px; color: var(--ink-400); margin-top: 6px; padding-left: 4px; line-height: 1.4; }
```

- [ ] **Step 3: Add the compact panel markup to `hub-ai-panel.js`**

In `<HUB>/hub-ai-panel.js`, insert after the access-gate section and before
`window.KXAIPanel = {`:

```js
  var esc = KX.esc, micon = KX.micon;

  /* =====================================================================
     STATE — session only. No localStorage, so every reviewer opens the
     same way.
     ===================================================================== */

  var state = {
    thread: [],      // { role:'user', text } | { role:'assistant', text, metricId, denied }
    draft: '',
    thinking: false,
    collapsed: false,
    added: []        // widget specs added to the grid from chat
  };

  function isExpanded() { return state.thread.length > 0 || state.thinking; }
  function addedWidgets() { return state.added; }

  function mark(size) {
    size = size || 28;
    return '<span class="agency-intel-mark" style="width:' + size + 'px;height:' + size + 'px">' +
      micon('auto_awesome', { size: Math.round(size * 0.56), fill: 1 }) + '</span>';
  }

  /* =====================================================================
     PANEL MARKUP
     ===================================================================== */

  function inputHtml() {
    var ready = !!state.draft.trim() && !state.thinking;
    return '<div class="kx-ai-input-wrap"><div class="kx-ai-input">' +
      '<textarea id="kxAiDraft" rows="1" ' +
      'placeholder="Ask Agency Intelligence about your data">' + esc(state.draft) + '</textarea>' +
      '<button class="kx-ai-send' + (ready ? ' is-ready' : '') + '" id="kxAiSend" ' +
      'title="Send" aria-label="Send"' + (ready ? '' : ' disabled') + '>' +
      micon('arrow_upward', { size: 17, weight: 500 }) + '</button>' +
      '</div>' +
      '<div class="kx-ai-legal">Charts land on the dashboard, never in chat. ' +
      'Agency Intelligence can be wrong — verify before acting.</div></div>';
  }

  function html(cfg) {
    return '<div class="kx-aipanel" id="kxAiPanel">' +
      '<div class="kx-ai-head">' + mark(28) +
      '<div style="flex:1;min-width:0">' +
      '<div class="t">Agency Intelligence</div>' +
      '<div class="s">Ask about ' + esc((cfg && cfg.name) || 'your dashboard') + '</div>' +
      '</div></div>' +
      inputHtml() +
      '</div>';
  }
```

Then replace the export block at the bottom with:

```js
  window.KXAIPanel = {
    hasAccess: hasAccess,
    personFor: personFor,
    html: html,
    isExpanded: isExpanded,
    addedWidgets: addedWidgets
  };
```

- [ ] **Step 4: Mount the panel from `publishedDashboard()`**

In `<HUB>/hub-hero.js`, insert immediately **before** `function publishedDashboard(variant) {` (line 656):

```js
  // variant -> the role that renders it (see hub.js:843). Kept local because
  // window.KXHub does not exist yet during the first render: hub.js calls
  // setRole() -> render() at :1486, and only assigns window.KXHub at :1503.
  var VARIANT_ROLE = { chief: 'chief', firefighter: 'ff', lieutenant: 'lt' };
```

Then, inside `publishedDashboard`, replace the single body line (line 688):

```js
      '<div class="kx-pubgrid">' + cfg.widgets.map(function (w) { return pubWidget(w, cfg.ownerShort); }).join('') + '</div>' +
```

with:

```js
      dashBody(cfg, variant) +
```

And add this helper immediately **before** `function publishedDashboard(variant) {`, after the
`VARIANT_ROLE` map:

```js
  // The dashboard body. Without a grant this is exactly the grid that shipped
  // before — no wrapper, no panel, no height change. The ungranted case is a
  // real no-op, not a hidden element.
  function dashBody(cfg, variant) {
    var AI = window.KXAIPanel;
    var grid = '<div class="kx-pubgrid">' +
      cfg.widgets.map(function (w) { return pubWidget(w, cfg.ownerShort); }).join('') +
      '</div>';

    if (!AI || !AI.hasAccess(VARIANT_ROLE[variant])) return grid;

    return '<div class="kx-pubbody' + (AI.isExpanded() ? ' is-expanded' : '') + '">' +
      AI.html(cfg) + grid + '</div>';
  }
```

- [ ] **Step 5: Verify the gate, the layout, and that the container height is unchanged**

First capture the baseline height **before** reloading with the change — if you
already reloaded, `git stash` is not needed; the assertion below is absolute,
not comparative.

```
browser_navigate → file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/keystone-hub/index.html
```

```
browser_evaluate → () => {
  const dash = document.querySelector('.kx-pubdash');
  const panel = document.querySelector('.kx-aipanel');
  const grid = document.querySelector('.kx-pubgrid');
  const w = [...document.querySelectorAll('.kx-pubwidget')];
  return {
    role: window.KXHub.state.role,
    panelPresent: !!panel,
    panelWidth: panel && Math.round(panel.getBoundingClientRect().width),
    panelIsLeftOfGrid: panel && grid &&
      panel.getBoundingClientRect().right <= grid.getBoundingClientRect().left + 1,
    dashHeight: Math.round(dash.getBoundingClientRect().height),
    widgetCount: w.length,
    widgetsOnOneRow: new Set(w.map(e => Math.round(e.getBoundingClientRect().top))).size === 1,
    expanded: document.querySelector('.kx-pubbody').classList.contains('is-expanded')
  };
}
```

Expected: `role: "chief"`, `panelPresent: true`, `panelWidth: 320`,
`panelIsLeftOfGrid: true`, `widgetCount: 3`, `widgetsOnOneRow: true`,
`expanded: false`.

Then confirm the ungranted case is a true no-op **and** use it as the height
baseline — the Firefighter's dashboard is the same container without a panel, so
comparing the two is a far better test than any absolute pixel figure:

```
browser_evaluate → () => {
  const h = () => Math.round(document.querySelector('.kx-pubdash').getBoundingClientRect().height);
  window.KXHub.state.role = 'chief'; window.KXHub.render();
  const granted = h();
  window.KXHub.state.role = 'ff'; window.KXHub.render();
  return {
    grantedHeight: granted,
    ungrantedHeight: h(),
    delta: Math.abs(granted - h()),
    panelPresent: !!document.querySelector('.kx-aipanel'),
    bodyWrapper: !!document.querySelector('.kx-pubbody'),
    widgetCount: document.querySelectorAll('.kx-pubwidget').length
  };
}
```

Expected: `panelPresent: false`, `bodyWrapper: false`, `widgetCount: 3` — the
Firefighter gets neither the panel nor the wrapper — and **`delta` at most 8**.
The compact panel must not make the container taller than the same container
without it. A larger delta means the panel's minimum content height exceeds the
widget row; shrink the textarea's `min-height` rather than letting the container
grow.

```
browser_console_messages
```

Expected: no `error` entries.

- [ ] **Step 6: Screenshot for the visual record**

```
browser_evaluate → () => { window.KXHub.state.role = 'chief'; window.KXHub.render(); }
browser_take_screenshot → filename: keystone-ai-panel-compact.png
```

Confirm by eye: panel sits left, three KPI widgets right on one row, panel is
exactly as tall as the widget row, input visible without scrolling.

- [ ] **Step 7: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/keystone-hub/index.html" \
        "products/Keystone Department Hub/keystone-hub/styles.css" \
        "products/Keystone Department Hub/keystone-hub/hub-hero.js" \
        "products/Keystone Department Hub/keystone-hub/hub-ai-panel.js"
git commit -m "Keystone hub: dock Agency Intelligence inside the dashboard container

Chat left, widgets right, in a new .kx-pubbody flex row. Compact by
default so the container height — and the task list's position — is
unchanged. Ungranted roles get the grid exactly as it shipped before."
```

---

## Task 2b: Let the hub flex, and let widgets wrap

**Why this task exists (added after Task 2):** the original plan claimed three
`w:4` widgets would sit at ~335px each beside the 320px panel. That was wrong —
`styles.css:349` caps `.kx-main` at `max-width: 1200px`, which the plan's research
missed. The real grid width is 726px, each widget 234px, and **all three widget
titles clip** ("Open s…", "Creden…", "Overdu…"). Legible titles need ~275px per
widget, so three widgets plus a usable panel cannot fit inside 1200px.

The human partner ruled the 1200px cap arbitrary: **the dashboard and the task
list below it should both flex to fill the available width**, and **dashboard
widgets may wrap to multiple rows when the screen is small**.

**Files:**
- Modify: `products/Keystone Department Hub/keystone-hub/styles.css:349`
- Modify: `products/Keystone Department Hub/keystone-hub/index.html` (widget-span breakpoints, next to the existing `.kx-pubgrid` rules)

**Interfaces:** none new. This is a CSS-only change.

- [ ] **Step 1: Remove the width cap**

In `<HUB>/styles.css:349`, the rule currently reads:

```css
.kx-main { flex: 1; min-width: 0; max-width: 1200px; margin: 0 auto; padding: 0 32px; width: 100%; }
```

Replace it with:

```css
/* No width cap: the dashboard and the task list below it both flex to fill the
   available space. A fixed 1200px cap starved the dashboard body once the
   Agency Intelligence panel took 320px of it — three KPI widgets fell to 234px
   and every title ellipsized. */
.kx-main { flex: 1; min-width: 0; margin: 0 auto; padding: 0 32px; width: 100%; }
```

This affects every role and the whole page, not just the dashboard — that is
intended and explicitly authorised.

- [ ] **Step 2: Let the widgets wrap instead of clipping**

Widget spans come from inline `grid-column: span N` written by `pubWidget()`, so
the breakpoints must override with `!important`, exactly as the existing 860px
rule at `index.html:455` already does.

Add immediately after the `.kx-pubbody` rules added in Task 2:

```css
  /* Widget wrapping. Spans are inline styles from pubWidget(), so these
     overrides need !important — same technique as the 860px rule below.
     Thresholds are viewport-based because the grid's own width depends on
     whether the AI panel is docked beside it. */
  /* Two across: the panel plus three widgets stops being legible here. */
  @media (max-width: 1360px) {
    .kx-pubbody .kx-pubgrid > .kx-pubwidget { grid-column: span 6 !important; }
  }
  /* Panel has stacked above the grid by now, so the grid has full width back
     and three across fits again. */
  @media (max-width: 980px) {
    .kx-pubbody .kx-pubgrid > .kx-pubwidget { grid-column: span 4 !important; }
  }
```

The existing `@media (max-width: 860px)` rule that forces `grid-column: 1 / -1`
stays as-is and continues to win below 860px because it comes later in the file.

Note both new rules are scoped to `.kx-pubbody` — a dashboard **without** the AI
panel keeps its original three-across behaviour at every width, so ungranted
roles see no change whatsoever.

- [ ] **Step 3: Verify titles are legible and nothing else regressed**

```
browser_navigate → http://127.0.0.1:8765/products/Keystone%20Department%20Hub/keystone-hub/index.html
```

```
browser_evaluate → () => {
  const t = [...document.querySelectorAll('.kx-pubwidget .title')];
  return {
    viewport: window.innerWidth,
    mainWidth: Math.round(document.querySelector('.kx-main').getBoundingClientRect().width),
    gridWidth: Math.round(document.querySelector('.kx-pubgrid').getBoundingClientRect().width),
    widgetWidth: Math.round(document.querySelector('.kx-pubwidget').getBoundingClientRect().width),
    anyClipped: t.some(e => e.scrollWidth > e.clientWidth + 1),
    titles: t.map(e => e.textContent)
  };
}
```

Expected: `mainWidth` **greater than 1200** (the cap is gone),
`anyClipped: false`, and `titles` reading in full:
`["Open shifts", "Credentials expiring", "Overdue inspections"]`.

- [ ] **Step 4: Verify the wrap thresholds and the ungranted role**

Load `mcp__playwright__browser_resize` as well for this step.

At each width, resize then measure:

```
browser_resize → 1500 x 900
browser_evaluate → () => ({
  rows: new Set([...document.querySelectorAll('.kx-pubwidget')].map(e => Math.round(e.getBoundingClientRect().top))).size,
  anyClipped: [...document.querySelectorAll('.kx-pubwidget .title')].some(e => e.scrollWidth > e.clientWidth + 1)
})
```

Expected at 1500: `rows: 1`, `anyClipped: false`.

Repeat at **1200 x 900** — expected `rows: 2`, `anyClipped: false` (two across,
third wraps).

Repeat at **900 x 900** — expected `anyClipped: false`; the panel has stacked
above the grid, so also assert:

```
browser_evaluate → () => {
  const p = document.querySelector('.kx-aipanel');
  const g = document.querySelector('.kx-pubgrid');
  return { panelFullWidth: Math.abs(p.getBoundingClientRect().width - g.getBoundingClientRect().width) < 4,
           panelAboveGrid: p.getBoundingClientRect().bottom <= g.getBoundingClientRect().top + 1 };
}
```

Expected: both `true`. **This also clears the Task 2 deferred minor** that the
980px stacking had never been exercised in a browser — report it as verified.

Then confirm the ungranted role is untouched at a wrapping width:

```
browser_resize → 1200 x 900
browser_evaluate → () => {
  window.KXHub.state.role = 'ff'; window.KXHub.render();
  return {
    bodyWrapper: !!document.querySelector('.kx-pubbody'),
    rows: new Set([...document.querySelectorAll('.kx-pubwidget')].map(e => Math.round(e.getBoundingClientRect().top))).size
  };
}
```

Expected: `bodyWrapper: false` and `rows: 1` — with no panel there is no
`.kx-pubbody`, so the new breakpoints do not apply and the Firefighter's three
widgets stay on one row exactly as they always did.

Finally restore the window and check the console:

```
browser_resize → 1405 x 900
browser_console_messages
```

Expected: no `error` entries (a favicon 404 is pre-existing and not a finding).

- [ ] **Step 5: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/keystone-hub/styles.css" \
        "products/Keystone Department Hub/keystone-hub/index.html"
git commit -m "Keystone hub: let the page flex, and let dashboard widgets wrap

The 1200px cap on .kx-main was arbitrary, and once the Agency Intelligence
panel claimed 320px of the dashboard body it starved the widgets to 234px
— every KPI title ellipsized. The page now fills the available width, and
widgets beside the panel wrap to two rows before they'd become unreadable.
Scoped to .kx-pubbody, so a dashboard without the panel is unchanged."
```

---

## Task 2c: Give the widget title its own row

**Why this task exists (added after Task 2b was measured).** Task 2b removed the
1200px cap, which fixed the severe clipping. But measurement at a 1405px viewport
showed the squeeze was not gone, only softened:

| | granted (Chief) | ungranted (Firefighter) |
|---|---|---|
| widget rows | 2 | 1 |
| widget width | 454px | 409px |
| `.kx-pubdash` height | **422px** | **261px** |

A 161px height delta, versus the 8px Task 2 established. And two-across is
wasteful — it hands each widget 454px to render a two-digit number, when what it
needed was ~310px.

The cause is the widget header row: `iconChip + title + range control`, where
`pdRangeControl()` takes ~105px. That is why a widget needs ~310px for a legible
title, why three need ~954px of grid, and why that only exists above ~1435px
viewport beside a 320px panel.

**The human partner's decision: move the date-range control out of the title
row.** The title then owns its row and needs ~205px, so three-across fits from
roughly 1100px upward — the compact container keeps today's height on every
realistic screen, and Task 2b's wrap rules become a true small-screen fallback
instead of the common case.

**Accepted cost, stated plainly:** the range control becomes a compact footer row
inside each widget, adding roughly 26px of widget height **for every role,
including ungranted ones**. That reverses a deliberate choice recorded at
`hub-hero.js:575-582` ("Narrow (w:4) widgets used to stack the title above a
second row… which cost ~31px per widget"). It is the right reversal now: 26px is
the price of legible titles, against 161px for the two-across fallback.

**Files:**
- Modify: `products/Keystone Department Hub/keystone-hub/hub-hero.js` (`pubWidget`, around lines 574-592)
- Modify: `products/Keystone Department Hub/keystone-hub/index.html` (a footer rule, and re-measured breakpoints)

**Interfaces:** none new. `pdRangeControl(w, ownerLabel, compact)` keeps its
signature and all its existing behaviour (the dirty-state dot, the Reset button,
the popover menu) — only its position in the markup changes.

- [ ] **Step 1: Move the range control into a footer row**

In `<HUB>/hub-hero.js`, `pubWidget()` currently ends:

```js
    return '<div class="kx-pubwidget" style="grid-column:span ' + (w.w || 6) + '">' +
      '<div class="kx-pubwidget-head">' + iconChip +
      '<span class="title">' + esc(title) + '</span>' +
      (srcs ? '<span class="srcs">' + srcs + '</span>' : '') +
      '<span class="rng">' + pdRangeControl(w, ownerLabel, narrow) + '</span></div>' +
      '<div style="margin-top:10px;flex:1;display:flex;flex-direction:column;justify-content:center">' + body + '</div>' +
      '</div>';
```

Replace with:

```js
    // The range control sits BELOW the value, not beside the title. It used to
    // share the header row, where it took ~105px and forced every title into an
    // ellipsis once the Agency Intelligence panel claimed 320px of the body.
    // Giving the title its own row drops a widget's legible minimum from ~310px
    // to ~205px, which is what lets three widgets stay on one row at ordinary
    // laptop widths instead of wrapping to two.
    return '<div class="kx-pubwidget" style="grid-column:span ' + (w.w || 6) + '">' +
      '<div class="kx-pubwidget-head">' + iconChip +
      '<span class="title">' + esc(title) + '</span>' +
      (srcs ? '<span class="srcs">' + srcs + '</span>' : '') +
      '</div>' +
      '<div style="margin-top:10px;flex:1;display:flex;flex-direction:column;justify-content:center">' + body + '</div>' +
      '<div class="kx-pubwidget-foot">' + pdRangeControl(w, ownerLabel, narrow) + '</div>' +
      '</div>';
```

Note `narrow` keeps its meaning and still governs both the source-chip drop and
the abbreviated range label — do not change how it is computed.

- [ ] **Step 2: Style the footer row**

In `<HUB>/index.html`, immediately after the `.kx-pubwidget-head` rule, add:

```css
  /* Range control's new home: its own compact row under the value, so the
     title above it never has to share horizontal space with it. */
  .kx-pubwidget-foot { display: flex; align-items: center; margin-top: 8px; min-width: 0; }
```

- [ ] **Step 3: Re-measure the breakpoints — do NOT trust arithmetic**

Task 2b's thresholds (1450px and 1090px) were calibrated against the OLD
~310px-per-widget minimum. With the title on its own row the minimum drops to
roughly 205px, so both thresholds are now too conservative and must be
re-derived **by measurement in the browser**, not by calculation. Two earlier
attempts in this plan got this wrong by computing it.

Method — binary-search each boundary with the real page:

1. Load the page as the Chief (granted, so `.kx-pubbody` exists).
2. Temporarily neutralise the two Task 2b breakpoints so you can find the true
   clip point of a three-across layout. In the browser only (never edit the file
   for this), force spans back and step the viewport width down:

```
browser_evaluate → () => {
  document.querySelectorAll('.kx-pubbody .kx-pubgrid > .kx-pubwidget')
    .forEach(e => e.style.setProperty('grid-column', 'span 4', 'important'));
  const t = [...document.querySelectorAll('.kx-pubwidget .title')];
  return { vw: window.innerWidth,
           widgetW: Math.round(document.querySelector('.kx-pubwidget').getBoundingClientRect().width),
           anyClipped: t.some(e => e.scrollWidth > e.clientWidth + 1) };
}
```

Resize downward (try 1400, 1300, 1200, 1150, 1100, 1050, 1000) re-running the
probe after each `browser_resize`, and record the widest width at which
`anyClipped` first becomes `true`. **Round the three-across threshold UP to the
next 10px above that clip point** — that is your new `span 6` breakpoint.

3. Repeat the same procedure with `span 6` forced, to find where two-across
   starts clipping. Round up likewise — that is your new `1 / -1` breakpoint.

4. Replace the two `max-width` values in the Task 2b block in `index.html` with
   your measured numbers, and **update the comment** to state the new
   ~205px-per-widget minimum and both measured clip points. Leave the existing
   `@media (max-width: 860px)` rule alone.

Report both measured clip points and both chosen thresholds in your report.

- [ ] **Step 4: Verify the height delta is back to ~flat**

The whole point of this task. With the real (not forced) CSS in place, at a
1405x900 viewport:

```
browser_evaluate → () => {
  const probe = () => {
    const w = [...document.querySelectorAll('.kx-pubwidget')];
    return {
      rows: new Set(w.map(e => Math.round(e.getBoundingClientRect().top))).size,
      widgetW: Math.round(w[0].getBoundingClientRect().width),
      dashH: Math.round(document.querySelector('.kx-pubdash').getBoundingClientRect().height),
      clipped: [...document.querySelectorAll('.kx-pubwidget .title')].some(e => e.scrollWidth > e.clientWidth + 1)
    };
  };
  window.KXHub.state.role = 'chief'; window.KXHub.render();
  const granted = probe();
  window.KXHub.state.role = 'ff'; window.KXHub.render();
  const ungranted = probe();
  window.KXHub.state.role = 'chief'; window.KXHub.render();
  return { granted, ungranted, heightDelta: granted.dashH - ungranted.dashH };
}
```

Required: `granted.rows` is **1**, `granted.clipped` and `ungranted.clipped` both
**false**, and `heightDelta` **at most 12**. If the delta exceeds 12, three
widgets are still not fitting on one row at this width — lower the `span 6`
threshold and re-measure rather than reporting a pass.

- [ ] **Step 5: Verify the range control still works where it moved to**

Moving markup can break delegated handlers. `hub-hero.js`'s `wire()` delegates
`[data-range-toggle]`, `[data-range-pick]` and `[data-range-reset]` from `#root`,
so relocating the control inside the same widget should keep them working — prove
it:

```
browser_evaluate → () => {
  document.querySelector('[data-range-toggle]').click();
  return { menuOpen: !!document.querySelector('.kx-menu'),
           optionCount: document.querySelectorAll('[data-range-pick]').length };
}
```

Expected: `menuOpen: true` and `optionCount` greater than 0.

Then pick a different range and confirm the dirty state and Reset appear:

```
browser_evaluate → () => {
  const opts = [...document.querySelectorAll('[data-range-pick]')];
  const pick = opts.find(o => o.getAttribute('data-range-val') !== 'next_14') || opts[1];
  pick.click();
  return { dirtyDot: !!document.querySelector('.kx-range-btn.is-dirty'),
           resetShown: !!document.querySelector('[data-range-reset]'),
           footPresent: !!document.querySelector('.kx-pubwidget-foot') };
}
```

Expected: all three `true`.

- [ ] **Step 6: Verify wide and narrow widths, and the ungranted role**

At **1800x900**: `rows: 1`, no clipping, and confirm the page below the
dashboard still looks reasonable (report anything that now reads badly — the
task table's column spread at wide widths was already flagged as a concern in
Task 2b).

At your measured two-across threshold minus 20px: `rows: 2`, no clipping.

At **900x900**: no clipping, panel stacked above the grid.

For the **Firefighter** at 1405x900: `rows: 1`, no clipping, and note the
widget-height increase from the new footer row is expected and accepted.

```
browser_console_messages
```

Expected: no `error` entries (the favicon 404 is pre-existing).

- [ ] **Step 7: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/keystone-hub/hub-hero.js" \
        "products/Keystone Department Hub/keystone-hub/index.html"
git commit -m "Keystone dashboard: the widget title gets its own row

The date-range control shared the header with the title and took ~105px of
it, so a widget needed ~310px to show its name — and three of those plus
the Agency Intelligence panel only fit above ~1435px, dropping ordinary
laptops to a two-across layout 161px taller than it needed to be. The
control moves to a compact row under the value: a widget now needs ~205px,
three stay on one row at normal widths, and the dashboard keeps its height.

Costs ~26px of widget height for every role, reversing the single-row-head
choice made when nothing shared the dashboard body."
```

---

## Task 3: Ask and answer — the expanded state

**Files:**
- Modify: `products/Keystone Department Hub/keystone-hub/hub-ai-panel.js`
- Modify: `products/Keystone Department Hub/keystone-hub/styles.css` (append thread CSS)

**Interfaces:**
- Consumes: `KXAIPanel.html(cfg)`, `state`, `isExpanded()` from Task 2; `window.AGENCY_INTEL_AI.homepageRespond(question, person, overrides)` which returns `{ text, denied?, entry }` where `entry` is `null` for small talk and otherwise `{ metricId, outcome, deniedSources, ... }`; `window.AGENCY_INTEL.metricSources(metricId) -> string[]`; `window.KEYSTONE.SOURCES[src].name`.
- Produces: thread rendering plus `state.thread` entries shaped
  `{ role:'assistant', text, metricId: string|null, denied: boolean }`. Task 4
  reads `metricId` and `denied` to decide whether to offer the add action.

- [ ] **Step 1: Append thread CSS to `styles.css`**

```css
.kx-ai-thread {
  flex: 1; min-height: 0; overflow-y: auto; padding: 14px 12px;
  display: flex; flex-direction: column; gap: 12px;
}
.kx-ai-user { display: flex; justify-content: flex-end; }
.kx-ai-user .bubble {
  max-width: 86%; padding: 7px 11px; border-radius: 13px 13px 4px 13px;
  background: var(--ink-900); color: white; font-size: 12.5px; line-height: 1.45;
}
.kx-ai-turn { display: flex; gap: 8px; align-items: flex-start; }
.kx-ai-turn .bubble {
  background: var(--surface-2); border: 1px solid var(--ink-100);
  border-radius: 13px 13px 13px 4px; padding: 8px 11px;
  font-size: 12.5px; line-height: 1.5; color: var(--ink-700);
}
.kx-ai-denied {
  display: flex; align-items: flex-start; gap: 6px; font-size: 11px;
  color: var(--lumo-error-text-color); line-height: 1.45;
}
.kx-ai-dot {
  width: 5px; height: 5px; border-radius: 99px; background: var(--ink-500);
  display: inline-block; animation: kx-ai-bounce 1s ease-in-out infinite;
}
@keyframes kx-ai-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-3px); opacity: 1; }
}
```

- [ ] **Step 2: Add entitlement-filtered suggestions, turn rendering, and send**

In `<HUB>/hub-ai-panel.js`, insert after the `mark()` helper:

```js
  /* =====================================================================
     SUGGESTIONS
     ---------------------------------------------------------------------
     Filtered by the asker's entitlements. The system knows what it will
     refuse, so it must not suggest it — the Chief lacks Scheduling, and a
     hand-picked "overtime risk" chip would open the panel on a refusal.

     Each entry's metricId MUST match what matchQuestion() in
     agency-intel-ai-data.js routes `q` to, or the filter lies. Verified:
       'behind on training'   -> training_completion
       'inspections overdue'  -> overdue_inspections
       'average response time'-> response_time
       'CEU completion'       -> ceu_progress
       'cert expires'         -> credential_expirations
       'shifts are open'      -> open_shifts
     ===================================================================== */

  var SUGGESTION_POOL = [
    { metricId: 'training_completion',    label: 'Training compliance',  q: 'Which stations are behind on training?' },
    { metricId: 'overdue_inspections',    label: 'Overdue inspections',  q: 'Which inspections are overdue at Station 4?' },
    { metricId: 'response_time',          label: 'Response time',        q: 'What’s our average response time this quarter?' },
    { metricId: 'ceu_progress',           label: 'CEU progress',         q: 'CEU completion by station?' },
    { metricId: 'credential_expirations', label: 'Credentials expiring', q: 'Whose paramedic cert expires in the next 60 days?' },
    { metricId: 'open_shifts',            label: 'Open shifts',          q: 'Which shifts are open next week?' }
  ];

  function suggestionsFor(person) {
    var CP = window.AGENCY_INTEL;
    var AI = window.AGENCY_INTEL_AI;
    if (!CP || !AI || !person) return [];
    var ent = AI.personEntitlements(person, null);
    return SUGGESTION_POOL.filter(function (s) {
      return CP.metricSources(s.metricId).every(function (src) {
        return ent.indexOf(src) !== -1;
      });
    }).slice(0, 3);
  }

  function chipsHtml(person) {
    var list = suggestionsFor(person);
    if (!list.length) return '';
    return '<div class="kx-ai-chips">' + list.map(function (s, i) {
      return '<button class="kx-ai-chip" data-kx-ai-chip="' + i + '" ' +
        'title="' + KX.attr(s.q) + '">' + esc(s.label) + '</button>';
    }).join('') + '</div>';
  }

  // Bold spans in the seeded answers arrive as **markdown**.
  function bubbleText(text) {
    return String(text).split('**').map(function (part, i) {
      return i % 2
        ? '<strong style="color:var(--ink-900)">' + esc(part) + '</strong>'
        : esc(part);
    }).join('');
  }

  function turnHtml(msg) {
    if (msg.role === 'user') {
      return '<div class="kx-ai-user"><div class="bubble">' + esc(msg.text) + '</div></div>';
    }
    return '<div class="kx-ai-turn">' + mark(24) +
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:7px">' +
      '<div class="bubble">' + bubbleText(msg.text) + '</div>' +
      (msg.denied
        ? '<div class="kx-ai-denied">' + micon('block', { size: 13, fill: 1 }) +
          '<span>' + esc(msg.deniedNote || 'Outside your data permissions.') + '</span></div>'
        : '') +
      '</div></div>';
  }

  function thinkingHtml() {
    return '<div class="kx-ai-turn" style="align-items:center">' + mark(24) +
      '<div style="display:inline-flex;align-items:center;gap:5px;padding:8px 12px;' +
      'background:var(--surface-2);border:1px solid var(--ink-100);border-radius:13px 13px 13px 4px">' +
      '<span class="kx-ai-dot"></span>' +
      '<span class="kx-ai-dot" style="animation-delay:140ms"></span>' +
      '<span class="kx-ai-dot" style="animation-delay:280ms"></span>' +
      '<span style="font-size:11px;color:var(--ink-500);margin-left:4px;font-style:italic">' +
      'Querying your apps…</span></div></div>';
  }

  function threadHtml() {
    return '<div class="kx-ai-thread" id="kxAiThread">' +
      state.thread.map(turnHtml).join('') +
      (state.thinking ? thinkingHtml() : '') +
      '</div>';
  }
```

- [ ] **Step 3: Move the disclaimer into the expanded state only**

**Controller amendment, decided after Task 2 measured the compact panel.** The
compact panel has no height headroom — the granted/ungranted height delta is
already at its 8px ceiling. The chips row adds ~34px, which would blow it.

Resolution: **in compact, the chips row takes the disclaimer's place.** The
disclaimer only matters once answers exist, so it renders only when expanded.
Net compact height change: roughly zero.

Change `inputHtml()` (added in Task 2) to take the flag:

```js
  function inputHtml(expanded) {
    var ready = !!state.draft.trim() && !state.thinking;
    return '<div class="kx-ai-input-wrap"><div class="kx-ai-input">' +
      '<textarea id="kxAiDraft" rows="1" ' +
      'placeholder="Ask Agency Intelligence about your data">' + esc(state.draft) + '</textarea>' +
      '<button class="kx-ai-send' + (ready ? ' is-ready' : '') + '" id="kxAiSend" ' +
      'title="Send" aria-label="Send"' + (ready ? '' : ' disabled') + '>' +
      micon('arrow_upward', { size: 17, weight: 500 }) + '</button>' +
      '</div>' +
      // Only once there are answers to caveat. The compact panel spends that
      // vertical space on suggestion chips instead, and has none to spare.
      (expanded
        ? '<div class="kx-ai-legal">Charts land on the dashboard, never in chat. ' +
          'Agency Intelligence can be wrong — verify before acting.</div>'
        : '') +
      '</div>';
  }
```

- [ ] **Step 4: Rewrite `html()` to show the thread once expanded**

Replace the `html(cfg)` function from Task 2 with:

```js
  function html(cfg) {
    var person = currentPerson;
    return '<div class="kx-aipanel" id="kxAiPanel">' +
      '<div class="kx-ai-head">' + mark(28) +
      '<div style="flex:1;min-width:0">' +
      '<div class="t">Agency Intelligence</div>' +
      '<div class="s">Ask about ' + esc((cfg && cfg.name) || 'your dashboard') + '</div>' +
      '</div></div>' +
      (isExpanded() ? threadHtml() : chipsHtml(person)) +
      inputHtml(isExpanded()) +
      '</div>';
  }
```

`currentPerson` is set when the hero mounts the panel. Add near the state block:

```js
  // Set every render from the variant the hero is drawing, so respond() and the
  // suggestion filter always use the right asker.
  var currentPerson = null;
  function setRole(roleId) { currentPerson = personFor(roleId); }
```

And in `<HUB>/hub-hero.js`, inside `dashBody`, add the `setRole` call right after
the access check:

```js
    if (!AI || !AI.hasAccess(VARIANT_ROLE[variant])) return grid;
    AI.setRole(VARIANT_ROLE[variant]);
```

- [ ] **Step 5: Add send + respond + wiring**

Append to `<HUB>/hub-ai-panel.js`, before the export block:

```js
  /* =====================================================================
     ASKING
     ===================================================================== */

  function deniedNote(entry) {
    var K2 = window.KEYSTONE;
    var srcs = (entry && entry.deniedSources) || [];
    if (!srcs.length) return 'Outside your data permissions.';
    var names = srcs.map(function (s) {
      return (K2.SOURCES[s] || {}).name || s;
    }).join(', ');
    return 'Needs ' + names + ' — your account has no access. An administrator can grant it.';
  }

  function send() {
    var q = state.draft.trim();
    if (!q || state.thinking || !currentPerson) return;
    state.thread.push({ role: 'user', text: q });
    state.draft = '';
    state.thinking = true;
    window.KXHub.render();

    // A beat of latency so the thinking state is legible; this is a prototype,
    // there is no request behind it.
    window.setTimeout(function () {
      var res = window.AGENCY_INTEL_AI.homepageRespond(q, currentPerson, null);
      state.thinking = false;
      state.thread.push({
        role: 'assistant',
        text: res.text,
        metricId: (res.entry && res.entry.outcome === 'answered') ? res.entry.metricId : null,
        denied: !!res.denied,
        deniedNote: res.denied ? deniedNote(res.entry) : ''
      });
      window.KXHub.render();
      scrollThread();
    }, 620);
  }

  function scrollThread() {
    var t = document.getElementById('kxAiThread');
    if (t) t.scrollTop = t.scrollHeight;
  }

  /* =====================================================================
     WIRING — one delegated listener on #root, guarded so the hub's
     re-renders never stack handlers.
     ===================================================================== */

  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;
    var root = document.getElementById('root');

    root.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-kx-ai-chip]');
      if (chip) {
        var list = suggestionsFor(currentPerson);
        var s = list[Number(chip.getAttribute('data-kx-ai-chip'))];
        if (s) { state.draft = s.q; send(); }
        return;
      }
      if (e.target.closest('#kxAiSend')) { send(); return; }
    });

    root.addEventListener('input', function (e) {
      if (e.target.id === 'kxAiDraft') {
        state.draft = e.target.value;
        // Toggle the send button in place — a full re-render would steal focus
        // and drop the caret mid-sentence.
        var btn = document.getElementById('kxAiSend');
        if (btn) {
          var ready = !!state.draft.trim() && !state.thinking;
          btn.classList.toggle('is-ready', ready);
          btn.disabled = !ready;
        }
      }
    });

    root.addEventListener('keydown', function (e) {
      if (e.target.id === 'kxAiDraft' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
  }
```

Add `wire()` to the export block and call it on load:

```js
  window.KXAIPanel = {
    hasAccess: hasAccess,
    personFor: personFor,
    setRole: setRole,
    html: html,
    isExpanded: isExpanded,
    addedWidgets: addedWidgets,
    wire: wire
  };

  // The hub renders before this file's consumers exist, so wire on DOM ready
  // rather than from the hero's render path.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
```

- [ ] **Step 6: Verify an answered question**

```
browser_navigate → file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/keystone-hub/index.html
```

```
browser_evaluate → () => [...document.querySelectorAll('.kx-ai-chip')].map(c => c.textContent)
```

Expected exactly: `["Training compliance", "Overdue inspections", "Response time"]` —
the Chief's three entitled suggestions. **If "Open shifts" appears, the
entitlement filter is broken.**

Click the first chip, wait for the answer, then assert:

```
browser_click → element: "Training compliance" chip, ref from a browser_snapshot
```

```
browser_evaluate → () => new Promise(r => setTimeout(() => r({
  expanded: document.querySelector('.kx-pubbody').classList.contains('is-expanded'),
  dashHeight: Math.round(document.querySelector('.kx-pubdash').getBoundingClientRect().height),
  turns: document.querySelectorAll('.kx-ai-thread > *').length,
  answer: document.querySelector('.kx-ai-turn .bubble').textContent.slice(0, 40),
  deniedShown: !!document.querySelector('.kx-ai-denied'),
  widgetsStillOneRow: new Set([...document.querySelectorAll('.kx-pubwidget')]
    .map(e => Math.round(e.getBoundingClientRect().top))).size === 1
}), 1200))
```

Expected: `expanded: true`, `dashHeight` at least `500`, `turns: 2`,
`answer` starts with `"Training completion is at 79%"`, `deniedShown: false`,
`widgetsStillOneRow: true` — **the widget row must not have moved or reflowed.**

- [ ] **Step 7: Verify the decline path — the Chief and Scheduling**

```
browser_evaluate → () => {
  window.KXAIPanel.setRole('chief');
  document.getElementById('kxAiDraft').value = 'Which shifts are open next week?';
  document.getElementById('kxAiDraft').dispatchEvent(new Event('input', { bubbles: true }));
  document.getElementById('kxAiSend').click();
  return new Promise(r => setTimeout(() => r({
    deniedShown: !!document.querySelector('.kx-ai-denied'),
    note: document.querySelector('.kx-ai-denied span').textContent
  }), 1200));
}
```

Expected: `deniedShown: true` and `note` containing **"Vector Scheduling"** (the
`K.SOURCES.sched.name`) and "no access". This is the access-reconciliation story
landing on the Chief's own homepage.

```
browser_console_messages
```

Expected: no `error` entries.

- [ ] **Step 8: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/keystone-hub/hub-ai-panel.js" \
        "products/Keystone Department Hub/keystone-hub/hub-hero.js" \
        "products/Keystone Department Hub/keystone-hub/styles.css"
git commit -m "Keystone hub: the homepage assistant answers, and declines

Wired to homepageRespond(), so entitlement checks and denials come from
the same engine the AI access tab audits. Suggestion chips are filtered by
the asker's entitlements — the Chief lacks Scheduling, and the panel must
not suggest what it will refuse. Asking grows the container; the widget
row does not move."
```

---

## Task 4: Add as a widget

**Files:**
- Modify: `products/Keystone Department Hub/keystone-hub/hub-ai-panel.js`
- Modify: `products/Keystone Department Hub/keystone-hub/hub-hero.js` (`dashBody`)
- Modify: `products/Keystone Department Hub/keystone-hub/styles.css` (append action + drop-zone CSS)

**Interfaces:**
- Consumes: thread entries with `metricId` from Task 3; `window.KEYSTONE_CUSTOM.buildSpec(metricId, 'kpi')`; `window.AGENCY_INTEL.metricSources(metricId)`; `pubWidget(w, ownerLabel)` in `hub-hero.js`.
- Produces: `KXAIPanel.addedWidgets() -> array` of widget specs shaped
  `{ id, metricId, viz:'kpi', w:4, range:'last_30', source:string[] }` — the
  exact shape `pubWidget()` already consumes for `CHIEF_DASH` entries.

- [ ] **Step 1: Append the action and drop-zone CSS**

```css
.kx-ai-add {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  padding: 5px 10px; border-radius: 8px; cursor: pointer; font-family: inherit;
  border: 1px solid var(--ink-200); background: var(--surface-1);
  font-size: 11.5px; font-weight: 600; color: var(--ink-800);
}
.kx-ai-add:hover { border-color: var(--amber-400); background: var(--amber-50); }
.kx-ai-added {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  padding: 5px 10px; background: var(--teal-50); border: 1px solid var(--teal-100);
  border-radius: 8px; font-size: 11.5px; font-weight: 600; color: var(--teal-600);
}
/* The row the expanded container opens up. Not decoration — it is where
   widgets added from chat land, and it says so until one does. */
.kx-ai-drop {
  min-height: 150px; border: 1.5px dashed var(--ink-200); border-radius: 14px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 7px; color: var(--ink-400); font-size: 12.5px; text-align: center; padding: 16px;
}
```

- [ ] **Step 2: Offer the action on answered turns**

In `<HUB>/hub-ai-panel.js`, add an `owned` flag to state and set it from the hero:

```js
  // Only the dashboard's owner may change it. A read-only published dashboard
  // ("only Training can edit") must never offer an edit affordance.
  var currentOwned = false;
```

Extend `setRole` into a single per-render setup call — replace `setRole` with:

```js
  function setContext(roleId, cfg) {
    currentPerson = personFor(roleId);
    currentOwned = !!(cfg && cfg.owned);
  }
```

In `<HUB>/hub-hero.js`, replace the `AI.setRole(...)` line inside `dashBody` with:

```js
    AI.setContext(VARIANT_ROLE[variant], cfg);
```

**Also update the export block** — `setRole` is gone and must not be left
exported:

```js
    setContext: setContext,
```

replaces `setRole: setRole,` in `window.KXAIPanel`.

Then in `turnHtml()`, replace the whole assistant branch with:

```js
    var canAdd = msg.metricId && currentOwned && !msg.added;
    return '<div class="kx-ai-turn">' + mark(24) +
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:7px">' +
      '<div class="bubble">' + bubbleText(msg.text) + '</div>' +
      (msg.denied
        ? '<div class="kx-ai-denied">' + micon('block', { size: 13, fill: 1 }) +
          '<span>' + esc(msg.deniedNote || 'Outside your data permissions.') + '</span></div>'
        : '') +
      (canAdd
        ? '<button class="kx-ai-add" data-kx-ai-add="' + KX.attr(msg.metricId) + '">' +
          micon('add_chart', { size: 14, fill: 1 }) + 'Add as a widget</button>'
        : '') +
      (msg.added
        ? '<div class="kx-ai-added">' + micon('check_circle', { size: 14, fill: 1 }) +
          'Added to ' + esc(msg.added) + '</div>'
        : '') +
      '</div></div>';
```

`turnHtml` now needs the message index to mark the right turn as added. Change
its signature and the call site:

```js
  function turnHtml(msg, idx) {
```

and inside, replace the add button's markup attribute list with both attributes:

```js
        ? '<button class="kx-ai-add" data-kx-ai-add="' + KX.attr(msg.metricId) + '" ' +
          'data-kx-ai-add-turn="' + idx + '">' +
          micon('add_chart', { size: 14, fill: 1 }) + 'Add as a widget</button>'
```

`state.thread.map(turnHtml)` already passes the index, so no change there.

- [ ] **Step 3: Add the handler**

In `wire()`, insert before the `#kxAiSend` check:

```js
      var add = e.target.closest('[data-kx-ai-add]');
      if (add) {
        addWidget(add.getAttribute('data-kx-ai-add'),
                  Number(add.getAttribute('data-kx-ai-add-turn')));
        return;
      }
```

And add the function before `wire()`:

```js
  var addSeq = 0;

  // buildSpec() supplies label, number, delta, tone and the sparkline; pubWidget()
  // renders it. This is wiring, not new machinery.
  function addWidget(metricId, turnIdx) {
    var CC = window.KEYSTONE_CUSTOM;
    var CP = window.AGENCY_INTEL;
    var spec = CC.buildSpec(metricId, 'kpi');
    if (!spec) return;
    addSeq += 1;
    state.added.push({
      id: 'ai' + addSeq,
      metricId: metricId,
      viz: 'kpi',
      w: 4,
      range: 'last_30',
      source: CP.metricSources(metricId)
    });
    var turn = state.thread[turnIdx];
    if (turn) turn.added = spec.label;
    window.KXHub.render();
  }
```

- [ ] **Step 4: Render added widgets and the drop placeholder**

In `<HUB>/hub-hero.js`, replace `dashBody` with:

```js
  function dashBody(cfg, variant) {
    var AI = window.KXAIPanel;
    var granted = AI && AI.hasAccess(VARIANT_ROLE[variant]);
    if (granted) AI.setContext(VARIANT_ROLE[variant], cfg);

    var added = granted ? AI.addedWidgets() : [];
    var cells = cfg.widgets.concat(added)
      .map(function (w) { return pubWidget(w, cfg.ownerShort); }).join('');

    // Expanded with nothing added yet: name the empty row rather than leave a
    // hole. It is the landing zone for "Add as a widget".
    if (granted && AI.isExpanded() && !added.length && cfg.owned) {
      cells += '<div class="kx-ai-drop" style="grid-column:span 12">' +
        micon('add_chart', { size: 26, fill: 1 }) +
        '<span>Answers you add land here</span></div>';
    }

    var grid = '<div class="kx-pubgrid">' + cells + '</div>';
    if (!granted) return grid;

    return '<div class="kx-pubbody' + (AI.isExpanded() ? ' is-expanded' : '') + '">' +
      AI.html(cfg) + grid + '</div>';
  }
```

- [ ] **Step 5: Verify the add path**

```
browser_navigate → file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/keystone-hub/index.html
```

```
browser_evaluate → () => {
  document.querySelector('[data-kx-ai-chip="0"]').click();
  return new Promise(r => setTimeout(() => r({
    addOffered: !!document.querySelector('[data-kx-ai-add]'),
    dropShown: !!document.querySelector('.kx-ai-drop'),
    widgetCount: document.querySelectorAll('.kx-pubwidget').length
  }), 1200));
}
```

Expected: `{ "addOffered": true, "dropShown": true, "widgetCount": 3 }`

```
browser_evaluate → () => {
  document.querySelector('[data-kx-ai-add]').click();
  const w = [...document.querySelectorAll('.kx-pubwidget')];
  const last = w[w.length - 1];
  return {
    widgetCount: w.length,
    dropGone: !document.querySelector('.kx-ai-drop'),
    confirmShown: !!document.querySelector('.kx-ai-added'),
    addGone: !document.querySelector('[data-kx-ai-add]'),
    newTitle: last.querySelector('.title').textContent,
    newSpan: getComputedStyle(last).gridColumn,
    hasNumber: /[0-9]/.test(last.querySelector('.kx-kpi-num').textContent),
    onSecondRow: Math.round(last.getBoundingClientRect().top) >
                 Math.round(w[0].getBoundingClientRect().top)
  };
}
```

Expected: `widgetCount: 4`, `dropGone: true`, `confirmShown: true`,
`addGone: true`, `newTitle: "Training completion"`, `newSpan` containing
`span 4`, `hasNumber: true`, `onSecondRow: true`.

- [ ] **Step 6: Verify a read-only dashboard never offers the action**

The Firefighter has no grant, so force the guard directly:

```
browser_evaluate → () => {
  const H = window.KXHero;
  // FF_DASH is not owned — publishedDashboard('firefighter') must produce no
  // add affordance even if a grant existed.
  const html = H.publishedDashboard('firefighter');
  return { hasAdd: html.indexOf('data-kx-ai-add') !== -1,
           hasDrop: html.indexOf('kx-ai-drop') !== -1 };
}
```

Expected: `{ "hasAdd": false, "hasDrop": false }`

```
browser_console_messages
```

Expected: no `error` entries.

- [ ] **Step 7: Screenshot and commit**

```
browser_take_screenshot → filename: keystone-ai-panel-expanded.png
```

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/keystone-hub/hub-ai-panel.js" \
        "products/Keystone Department Hub/keystone-hub/hub-hero.js" \
        "products/Keystone Department Hub/keystone-hub/styles.css"
git commit -m "Keystone hub: answers become widgets on the dashboard

An answered question offers 'Add as a widget', which lands a w:4 KPI in
the row the expanded container opens up — via buildSpec/pubWidget, so no
new chart machinery. Guarded on cfg.owned: a read-only published
dashboard never offers an edit affordance."
```

---

## Task 5: Collapse and New chat

**Files:**
- Modify: `products/Keystone Department Hub/keystone-hub/hub-ai-panel.js`
- Modify: `products/Keystone Department Hub/keystone-hub/styles.css` (append collapsed CSS)

**Interfaces:**
- Consumes: `state.collapsed`, `state.thread`, `isExpanded()` from Tasks 2-3.
- Produces: no new exports. `isExpanded()` gains a `!state.collapsed` clause, so
  `dashBody()` in `hub-hero.js` needs no change — a collapsed panel reports as
  not expanded and the container returns to compact height automatically.

- [ ] **Step 1: Append the collapsed-strip CSS**

```css
.kx-ai-collapsed {
  width: 40px; flex-shrink: 0; align-self: stretch; cursor: pointer;
  background: var(--surface-1); border: 1px solid var(--ink-100);
  border-radius: 14px; box-shadow: var(--elev-1);
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 12px 0;
}
.kx-ai-collapsed .vlabel {
  writing-mode: vertical-rl; transform: rotate(180deg);
  font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: var(--ink-600);
}
@media (max-width: 980px) {
  .kx-ai-collapsed { width: 100%; flex-direction: row; justify-content: center; padding: 10px 0; }
  .kx-ai-collapsed .vlabel { writing-mode: horizontal-tb; transform: none; }
}
```

- [ ] **Step 2: Add the two header controls and the collapsed branch**

In `<HUB>/hub-ai-panel.js`, update `isExpanded()`:

```js
  // A collapsed panel reports as not expanded, so the container returns to
  // compact height with no extra bookkeeping in the hero.
  function isExpanded() { return !state.collapsed && (state.thread.length > 0 || state.thinking); }
```

Add the header buttons — in `html(cfg)`, replace the `</div></div>` that closes
the head with:

```js
      '</div>' +
      (state.thread.length
        ? '<button class="kx-ai-iconbtn" id="kxAiNew" title="New chat" aria-label="New chat">' +
          micon('restart_alt', { size: 16 }) + '</button>'
        : '') +
      '<button class="kx-ai-iconbtn" id="kxAiCollapse" title="Collapse Agency Intelligence" ' +
      'aria-label="Collapse Agency Intelligence">' + micon('chevron_left', { size: 17 }) +
      '</button></div>' +
```

Add the collapsed branch at the top of `html(cfg)`:

```js
  function html(cfg) {
    if (state.collapsed) {
      return '<button class="kx-ai-collapsed" id="kxAiExpand" ' +
        'title="Open Agency Intelligence" aria-label="Open Agency Intelligence">' +
        mark(24) + '<span class="vlabel">Agency Intelligence</span>' +
        micon('chevron_right', { size: 16, color: 'var(--ink-400)', style: 'margin-top:auto' }) +
        '</button>';
    }
    var person = currentPerson;
    /* ...unchanged from Task 3... */
  }
```

Add the icon-button CSS to `styles.css`:

```css
.kx-ai-iconbtn {
  width: 26px; height: 26px; flex-shrink: 0; border-radius: 7px; cursor: pointer;
  border: none; background: transparent; color: var(--ink-500);
  display: inline-flex; align-items: center; justify-content: center;
}
.kx-ai-iconbtn:hover { background: var(--surface-3); color: var(--ink-800); }
```

- [ ] **Step 3: Wire the three controls**

In `wire()`, add before the chip handler:

```js
      if (e.target.closest('#kxAiCollapse')) {
        state.collapsed = true;
        window.KXHub.render();
        return;
      }
      if (e.target.closest('#kxAiExpand')) {
        state.collapsed = false;
        window.KXHub.render();
        return;
      }
      if (e.target.closest('#kxAiNew')) {
        state.thread = [];
        state.draft = '';
        state.thinking = false;
        // Widgets already added stay on the dashboard — clearing the chat is
        // not undoing a publish.
        window.KXHub.render();
        return;
      }
```

- [ ] **Step 4: Verify collapse reclaims the grid, and New chat resets**

```
browser_navigate → file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/keystone-hub/index.html
```

```
browser_evaluate → () => {
  const before = document.querySelector('.kx-pubgrid').getBoundingClientRect().width;
  document.getElementById('kxAiCollapse').click();
  const strip = document.querySelector('.kx-ai-collapsed');
  return {
    stripShown: !!strip,
    stripWidth: strip && Math.round(strip.getBoundingClientRect().width),
    panelGone: !document.querySelector('.kx-aipanel'),
    gridWider: document.querySelector('.kx-pubgrid').getBoundingClientRect().width > before + 200
  };
}
```

Expected: `{ "stripShown": true, "stripWidth": 40, "panelGone": true, "gridWider": true }`

```
browser_evaluate → () => {
  document.getElementById('kxAiExpand').click();
  document.querySelector('[data-kx-ai-chip="0"]').click();
  return new Promise(r => setTimeout(() => {
    document.querySelector('[data-kx-ai-add]').click();
    document.getElementById('kxAiNew').click();
    r({
      threadCleared: document.querySelectorAll('.kx-ai-turn').length === 0,
      chipsBack: document.querySelectorAll('.kx-ai-chip').length === 3,
      compact: !document.querySelector('.kx-pubbody').classList.contains('is-expanded'),
      widgetKept: document.querySelectorAll('.kx-pubwidget').length === 4
    });
  }, 1200));
}
```

Expected all four `true` — New chat clears the conversation and returns to
compact, but the widget it produced stays on the dashboard.

Then collapse while expanded, to confirm the container shrinks back:

```
browser_evaluate → () => {
  document.querySelector('[data-kx-ai-chip="0"]').click();
  return new Promise(r => setTimeout(() => {
    const tall = Math.round(document.querySelector('.kx-pubdash').getBoundingClientRect().height);
    document.getElementById('kxAiCollapse').click();
    r({ tall, short: Math.round(document.querySelector('.kx-pubdash').getBoundingClientRect().height) });
  }, 1200));
}
```

Expected: `tall` at least `500`, and `short` at least 150px less than `tall`.

```
browser_console_messages
```

Expected: no `error` entries.

- [ ] **Step 5: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/keystone-hub/hub-ai-panel.js" \
        "products/Keystone Department Hub/keystone-hub/styles.css"
git commit -m "Keystone hub: collapse the assistant, or start a fresh chat

The container was deliberately height-budgeted, so seeing the dashboard
as it ships today is one click: collapse to a 40px strip and the grid
reclaims full width. New chat clears the thread but keeps widgets already
added — clearing a conversation is not undoing a publish."
```

---

## Task 6: Dedupe the shared mark, update `products.json`, final sweep

**Files** — five, because this task also absorbs four cleanups deferred by
earlier reviews (see Step 2b):
- Modify: `products/Keystone Department Hub/keystone-hub/agency-intelligence-dashboard.html:44-49` (delete the duplicated `.agency-intel-mark` rule)
- Modify: `products.json:702-707` (refresh `desc` and `modified`)
- Modify: `products/Keystone Department Hub/keystone-hub/index.html` (delete the dead `.kx-pubwidget-head .rng` rule)
- Modify: `products/Keystone Department Hub/keystone-hub/hub-ai-panel.js` (confirmation copy, shared-state comment, chevron class)
- Modify: `products/Keystone Department Hub/keystone-hub/styles.css` (chevron positioning per orientation)

**Interfaces:**
- Consumes: `.agency-intel-mark` now defined in `styles.css` (Task 2).
- Produces: nothing. This task removes a duplicate and refreshes metadata.

- [ ] **Step 1: Delete the duplicated rule from the Agency Intelligence page**

`.agency-intel-mark` is now defined in `styles.css`, which
`agency-intelligence-dashboard.html` already loads. Delete lines 44-49 of that
file — the block starting `.agency-intel-mark {` and ending with its closing
brace. Leave every `.cp-*` and `.cpv-*` rule alone: the build view's dock is a
different size and a different set of states, and rewriting it is not part of
this work.

- [ ] **Step 2: Verify the mark still renders on the Agency Intelligence page**

```
browser_navigate → file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/keystone-hub/agency-intelligence-dashboard.html
```

```
browser_evaluate → () => {
  const m = document.querySelector('.agency-intel-mark');
  const bg = m && getComputedStyle(m).backgroundImage;
  return { present: !!m, hasGradient: !!bg && bg.indexOf('gradient') !== -1,
           width: m && Math.round(m.getBoundingClientRect().width) };
}
```

Expected: `present: true`, `hasGradient: true`, `width` greater than `0`. A
`width` of `0` or a missing gradient means `styles.css` is not reached from this
page — restore the inline block if so.

- [ ] **Step 2b: Carried-forward cleanups from Tasks 2c, 4 and 5**

Four small items that earlier reviews raised and deferred to this task. Each is
independently verifiable; none is optional.

**(a) Remove the dead `.rng` rule.** Task 2c moved the range control out of the
widget header into `.kx-pubwidget-foot`, so no markup emits a `.rng` span inside
the head any more. In `<HUB>/index.html`, delete the now-unreachable
`.kx-pubwidget-head .rng` rule. Confirm with `grep -rn '"rng"\|\.rng' ` over
`<HUB>/` that nothing else references it before deleting.

**(b) Fix the confirmation copy.** In `<HUB>/hub-ai-panel.js`, `turnHtml()`
currently renders `'Added to ' + esc(msg.added)`, which reads as though the
widget was added *to* a thing called "Training completion". It was added *as* a
widget. Change the string to:

```js
          'Added ' + esc(msg.added) + ' to the dashboard'
```

Keep `esc()` exactly where it is.

**(c) Document the shared-state limitation.** The human partner ruled that
`state.added` / `state.thread` stay page-global rather than being scoped per
dashboard, and that the limitation be recorded for developers. Add this comment
immediately above the `var state = {` declaration in `<HUB>/hub-ai-panel.js`,
keeping whatever text already documents the state shape:

```js
  // NOT SCOPED PER DASHBOARD — deliberate, and a real limitation to carry into
  // any implementation. state.thread and state.added are page-global, while
  // dashBody() concatenates addedWidgets() onto whichever dashboard variant is
  // currently rendering. Today nothing exposes it: the Chief is the only role
  // that is both granted an assistant and the owner of their dashboard. But
  // granting a non-owning role — a pure seedGrants() data change, no code
  // involved — would render the Chief's chat-added widgets on that role's
  // read-only dashboard and show them the Chief's conversation. A production
  // build must key both arrays by dashboard identity.
```

**(d) Fix the collapsed strip's chevron at narrow widths.** `.kx-ai-collapsed`
flips to `flex-direction: row` at ≤980px, but the chevron carries an inline
`margin-top: auto` set unconditionally in JS, which in row mode acts on the cross
axis and can bottom-align it. Move that positioning out of JS and into the CSS
that knows the orientation.

In `<HUB>/hub-ai-panel.js`, drop the inline style from the collapsed strip's
chevron — i.e. change `micon('chevron_right', { size: 16, color: 'var(--ink-400)', style: 'margin-top:auto' })`
so it no longer passes `style`, and give the icon a class the CSS can target
instead (`{ size: 16, color: 'var(--ink-400)', cls: 'kx-ai-collapsed-chev' }` —
`micon` already supports `cls`).

In `<HUB>/styles.css`, push it to the trailing edge per orientation:

```css
.kx-ai-collapsed .kx-ai-collapsed-chev { margin-top: auto; }
@media (max-width: 980px) {
  .kx-ai-collapsed .kx-ai-collapsed-chev { margin-top: 0; margin-left: auto; }
}
```

Verify at **900x900** that the collapsed strip renders as a horizontal bar with
the chevron beside the label rather than below it, and paste the measurement:

```
browser_evaluate → () => {
  const s = document.querySelector('.kx-ai-collapsed');
  const c = s && s.querySelector('.kx-ai-collapsed-chev');
  if (!s || !c) return { error: 'strip or chevron missing' };
  const sr = s.getBoundingClientRect(), cr = c.getBoundingClientRect();
  return { stripIsHorizontal: sr.width > sr.height,
           chevronVerticallyCentred: Math.abs((cr.top + cr.height/2) - (sr.top + sr.height/2)) < 10 };
}
```

Expected: both `true`.

- [ ] **Step 3: Update `products.json`**

Replace the Department Hub item (currently `products.json:702-707`) with:

```json
        {
          "name": "Department Hub",
          "rel": "keystone-hub",
          "modified": "2026-08-03",
          "desc": "Department landing for fire/EMS leaders, with an Agency Intelligence assistant docked in the dashboard for granted roles: ask, get an answer or a refusal, add it as a widget."
        },
```

- [ ] **Step 4: Verify the JSON parses**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
python3 -c "import json; d=json.load(open('products.json')); print('ok')"
```

Expected: `ok`

- [ ] **Step 5: Final sweep — both pages, all four roles, no console errors**

```
browser_navigate → file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/keystone-hub/index.html
```

```
browser_evaluate → () => {
  const out = {};
  ['chief','training','lt','ff'].forEach(r => {
    window.KXHub.state.role = r;
    window.KXHub.render();
    out[r] = {
      panel: !!document.querySelector('.kx-aipanel') || !!document.querySelector('.kx-ai-collapsed'),
      granted: window.KXAIPanel.hasAccess(r),
      widgets: document.querySelectorAll('.kx-pubwidget').length
    };
  });
  return out;
}
```

Expected: `chief.panel: true`, `ff.panel: false`, `lt.panel: false`.
`training.granted: true` but `training.panel: false` — the Training Officer holds
a grant, yet renders `complianceHero()`, not a dashboard container. **That is the
documented behaviour** (spec §1 consequence 2), not a bug.

Then check every icon actually rendered — a Material Symbols name that does not
exist renders as a zero-width invisible glyph with no console error:

```
browser_evaluate → () => [...document.querySelectorAll('.material-symbols-outlined')]
  .filter(e => !e.getBoundingClientRect().width)
  .map(e => e.textContent)
```

Expected: `[]`

```
browser_console_messages
```

Expected: no `error` entries.

- [ ] **Step 6: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/keystone-hub/agency-intelligence-dashboard.html" \
        products.json
git commit -m "Keystone: one definition of the Agency Intelligence mark, refreshed dashboard copy

The mark now lives in the shared styles.css, so the Agency Intelligence
page drops its inline copy."
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| §1 The gate (`seedGrants()`, title-or-individual) | Task 1 |
| §1 consequence 2 — Training Officer granted, no panel | Task 6 Step 5 (asserted as expected behaviour) |
| §1 consequence 3 — Chief declines Scheduling | Task 3 Step 6 |
| §2 Layout (`.kx-pubbody`, 320px, grid untouched, 980px breakpoint) | Task 2 |
| §3 Compact state | Task 2 |
| §3 Expanded state + dashed placeholder | Tasks 3 and 4 |
| §3 Collapsed state | Task 5 |
| §3 New chat | Task 5 |
| §3 Visual language (ported `.cpv-*`, left not right) | Task 2 Step 2 |
| §4 Four answer outcomes, text-only | Task 3 |
| §5 Add as a widget, `cfg.owned` guard | Task 4 |
| §6 Files, script order, `hub-agency-intel.js` dropped not deleted | Task 1 |
| §6 Shared mark, one definition | Task 6 |
| §6 `products.json` | Task 6 |
| §7 No cross-page audit log | Not implemented — by design |
| §8 Non-goals | Respected; no task touches `complianceHero`, the embedded shells, or persistence |

**Deviations from the spec, deliberate:**

1. **Suggestion chips are entitlement-filtered** (Task 3 Step 2). The spec named
   three fixed chips borrowed from `hub-agency-intel.js`'s `EXAMPLES`, two of
   which resolve to Scheduling metrics the Chief cannot see — so the default role
   would have opened the panel on refusals. Filtering by entitlement is ~8 lines
   and makes the rule real: the system never suggests what it will decline.
2. **Only `.agency-intel-mark` is deduped**, not the whole `.cpv-*` block
   (Task 6 Step 1). The spec said "one definition instead of two copies"; in
   practice only the mark is genuinely identical. The dock differs in width
   (376 vs 320) and in its state set, so the panel gets its own `.kx-ai-*` rules
   and the build view is left untouched — rewriting a 691-line file for no
   functional gain is the larger risk.
3. **Compact panel shows a scrollable chip row, not a wrapped one.** At 320px
   wide and ~200px tall, three wrapped chips do not fit alongside the head and
   input. One non-wrapping `overflow-x: auto` row fits at any label length and
   keeps all three reachable.

**Placeholder scan:** none. Every code step carries the actual code; every
verification step carries the actual expression and its expected value.

**Type consistency:** `hasAccess(roleId)`, `personFor(roleId)`,
`setContext(roleId, cfg)`, `html(cfg)`, `isExpanded()`, `addedWidgets()`,
`wire()` — the export list in Task 5 matches every call site in Tasks 2-4.
Note `setRole(roleId)` introduced in Task 3 Step 3 is **replaced** by
`setContext(roleId, cfg)` in Task 4 Step 2, and the `hub-hero.js` call site is
updated in the same step; `setRole` must not appear in the final export list.
Widget specs use `{ id, metricId, viz, w, range, source }` throughout, matching
the `CHIEF_DASH` entries `pubWidget()` already consumes.
