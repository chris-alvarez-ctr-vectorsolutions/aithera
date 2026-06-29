# Design Toolbox

A drop-in bundle of the design team's review tools for any mockup on the
`ux-mockups` site. Add one line and a mock gets:

1. **Comment / feedback widget** — the existing pin-and-comment tool
   (`designtoolbox/feedback-widget.js`).
2. **Flow Map** — a branching map of the mock's screens with **live thumbnails**,
   click-to-open-live, **dev notes** (from a committed `DEV-NOTES.md`), and
   **per-step comment counts**.

> Think of it as "turn on the toolbox for this design file." If a designer says
> *"add everything in the toolbox to this mock,"* this is the one include.

## Embed

Add before `</body>`:

```html
<script src="/designtoolbox/toolbox.js"></script>
```

(or a relative path from the mock, e.g. `../../../designtoolbox/toolbox.js`).

That alone gives you the comment widget on every page. To also get the **Flow
Map**, define a flow config first (see below). With no config, the flow map
simply doesn't appear — the comment widget still does.

### Opt-outs

```html
<script>window.TOOLBOX = { comments: false };</script>  <!-- flow map only -->
<script>window.TOOLBOX = { flowMap: false };</script>   <!-- comments only -->
```

`?toolbox=off` in the URL disables everything for that visit.

### Toolbox dock (the bottom-center pill)

`toolbox.js` defines `window.ToolboxDock` — a shared bottom-center pill (the
"version switcher") that the tools dock their launcher buttons into, so the
**💬 Comments** button and the **🗺 Flow Map** button sit together in one pill
instead of each floating in its own corner. Each tool calls
`window.ToolboxDock.add(buttonEl)` and the dock inserts a divider between
entries (in load order: comments, then flow map).

If the mock already ships its own `.version-switcher` element (a multi-version
mock with V1/V2 buttons), the dock **adopts** it, so the design-version buttons
and the toolbox launchers share that single pill. When `ToolboxDock` isn't
present (a mock that includes `feedback-widget.js` directly, without
`toolbox.js`), the comment widget falls back to its original floating bubble and
the flow map to its own standalone pill — so those mocks are unaffected.

---

## Flow Map

The flow map opens from a **"Flow Map"** button in the bottom-center toolbox
dock (see above). It shows your screens as nodes connected by arrows, grouped
into labelled lanes (flows).

- **Live thumbnails.** Each node renders the *real mock* at that screen's state
  inside a scaled, non-interactive `<iframe>`. There are **no static images** —
  restyle the design and the thumbnails update automatically. Hover a node to
  swell it and read more.
- **Open live.** Click a node to drive the actual mock into that state (skipping
  the manual clicks to get there).
- **💬 Comment counts.** Each node shows how many feedback-widget comments were
  left in that part of the flow. Click the chip to jump there and reveal the
  pins. *(Counts are grouped by flow — the widget's state capture pinpoints the
  flow, not always the exact step.)*
- **📝 Dev notes.** Read-only developer notes — *"be careful: this list can be
  hundreds long, virtualize it."* Notes live in a committed **`DEV-NOTES.md`**
  next to the mock (so the whole team sees the same notes — no `localStorage`,
  no per-browser state). Click **"Dev notes"** on a node (or the 📝 chip) to read
  them in the drawer; the badge count is the number of notes for that step.
  Authoring is done in the Markdown file, not in the browser — see *Dev notes
  file format* below.

### Dev notes file format

Dev notes are loaded read-only from a Markdown file. By default the flow map
fetches **`DEV-NOTES.md`** from the mock's own folder (next to its
`index.html`); override the path with `flowMap.devNotes` in `TOOLBOX_CONFIG`.

Each `## <node-id>` heading maps to a node on the map (the id is the first token
after `##`; anything after it is a human-readable title and ignored by the
parser). Every `-`/`*` bullet under a heading becomes one dev note and counts
toward the node's 📝 badge. An optional `> author: <name>` line sets the
attribution shown on notes (default: *Design handoff*).

```markdown
> author: Design handoff

## n2 — Details + qualifiers
- Open slots are generated from qualifiers, not entered manually.
- Total shared qualifiers can never exceed total primary qualifiers.

## n3 — Select Employee
- Employees are ranked, not filtered: full match = Recommended.
```

Notes for a `## <id>` that doesn't match any node are simply ignored, so the
file can stay ahead of (or behind) the map without breaking. Because the file
is fetched at runtime, a `file://` open may be blocked by CORS — the notes
appear on GitHub Pages (or any served origin), and absence degrades silently.

### How live thumbnails + open-live work

The flow map needs two things from the host page:

1. **A state driver** — a global function that puts the page into a given
   screen's state. Default name: `window.applyFlowState(id, opts)`. `opts.instant`
   is passed for thumbnails (skip animations/scrolling).
2. **Hash boot** — on load, read `#fm=<state>` and call the driver. The map's
   thumbnail iframes load the same page at `?fmthumb=1#fm=<state>`; the
   `?fmthumb=1` tells `toolbox.js` to load **nothing** (no widgets) so the
   thumbnail is a clean snapshot and never recurses.

```js
function applyFlowState(id, opts) { /* set the screen for `id` */ }
window.applyFlowState = applyFlowState;
function bootFromHash() {
  const m = (location.hash || '').match(/fm=([\w-]+)/);
  if (m) applyFlowState(decodeURIComponent(m[1]), { instant: true });
}
bootFromHash();
window.addEventListener('hashchange', bootFromHash);
```

For multi-file mocks, point each node's thumbnail at a different URL instead by
giving the node a `url` (future option); for single-page state-driven mocks use
`state` + the driver above.

### Config

Define `window.TOOLBOX_CONFIG.flowMap` before the toolbox include:

```js
window.TOOLBOX_CONFIG = {
  flowMap: {
    title: 'My Mock — Flow Map',
    applyState: 'applyFlowState',         // global state-driver fn name
    canvas: { w: 2080, h: 1120 },         // virtual canvas size
    flows: [
      { id: 'create', name: 'Create Flow', pill: 'A', color: '#7ee0a8',
        lane: { x, y, w, h }, labelXY: { x, y } },
    ],
    nodes: [
      { id: 'n1', flow: 'create', x, y,
        step: 'Step 1', name: 'Initial form',
        state: 'n1',                       // passed to applyFlowState + #fm=
        match: ['Create from scratch'],    // captured-state labels → comment bucket
        desc: 'Short description shown on hover.',
        entry: true                        // optional: styles as the entry node
      },
    ],
    edges: [ ['n1','n2'], ['n2','n3','branch'] ],  // 3rd item 'branch' = dashed
  }
};
```

| Field | Purpose |
|---|---|
| `node.state` | Value handed to the state driver / `#fm=` hash. |
| `node.match` | Labels from a comment's captured interaction state (the controls it was left under). A comment is bucketed to a flow when its labels include these. Counts group by flow. |
| `node.entry` | Marks the shared entry screen (e.g. a landing) that branches into flows. |
| `edge[2]` | `'branch'` renders the connector dashed (a fork/merge). |

Comment counts read the feedback widget's pins via the same Worker and canonical
page URL the widget uses, so they line up automatically. Off the published Pages
site (localhost / `file://`) the fetch is skipped and counts stay empty.

## Files

| File | Purpose |
|---|---|
| `toolbox.js` | One-line loader. Injects the comment widget + flow map; recursion guard for thumbnails. |
| `flow-map.js` | The flow map (live thumbnails, open-live, annotations, comment counts). Config-driven. |

## Reference implementation

`products/Scheduling/deployment/index.html` is the first consumer — see its
`window.TOOLBOX_CONFIG`, `applyFlowState`, and `bootFromHash` for a worked
example across two branching flows.

---

## Dev handoff build

> **This is the standardized dev-handoff process.** It is the same for every
> designer and every mock. The trigger + step-by-step procedure also lives in
> the root `CLAUDE.md` ("Dev Handoff Process") so the agent runs it identically
> every time a designer says *"this is ready for dev / ready for handoff."* This
> section documents the toolbox/dashboard **mechanics** that process relies on.

When a mock is ready for developers, it gets a **`dev_handoff.html`** — a copy
of the design that hides the review comments and keeps the flow map (with dev
notes) as the handoff reference.

### What a dev build is

`dev_handoff.html` is a **byte copy of the chosen design version's
`index.html`**, with one line added before the `toolbox.js` include:

```html
<script>window.TOOLBOX = { comments: false };</script>
<script src="../../../designtoolbox/toolbox.js"></script>
```

`comments:false` hides the **entire comment feature** — both the pin-and-comment
widget and the flow map's **💬 comment-count chips** (the flow map suppresses its
comment counts whenever the comment widget is off, surfacing **dev notes only**).
The **flow map stays on**, so developers still get the screens, live thumbnails,
and the read-only **dev-note annotations** from `DEV-NOTES.md`.

### Annotations live in the flow map, not on the page

The handoff intentionally adds **no annotation elements to the page itself** —
the design stays clean. Every developer-facing detail (what changed, what to
build, which VWC/Vaadin component each element maps to, states, edge cases) goes
into `DEV-NOTES.md` per node, so developers see the **full picture** (the whole
flow) and can drill into **every detail** per screen — see *Dev notes file
format* above.

### ⚠️ The toolbox dock is NOT part of the product

The bottom-center **toolbox pill** and its **🗺 Flow Map button are
review/handoff tooling only — not part of the shipping product.** Developers
must **NOT ship the `toolbox.js` include, the dock pill, or the flow map
button** — strip that one `<script src=".../toolbox.js">` line for production.
Say this in each mock's `DEV-NOTES.md` too.

### Multiple versions

If a mock has more than one version (a `.version-switcher` V1/V2, or several
variants), the designer is asked **which version to keep** before the build —
we usually launch only one. If they keep more than one (e.g. **alpha** + **beta**
both going to dev), each kept version gets its own dev build named accordingly:
`dev_handoff_alpha.html`, `dev_handoff_beta.html`, etc. Point the dashboard at a
non-default name with `devHandoff: "<file>.html"` in that mock's `meta.json`.

### Dashboard wiring (automatic)

`scripts/build-dashboards.js` detects a `dev_handoff.html` next to a mock's
`index.html` on push and sets `devHandoff` on the card. `dashboard.js` then:

- flips the card's status to **Ready for Dev**;
- renders the **Dev Page + Dev HTML (GitHub) links first**, with a **"View Dev
  Build"** primary button;
- collapses the **original design links into a "Designer file" drawer** (the
  prototype-with-comments build, kept one click away, not the primary action).

No hand-editing of `meta.json` is needed unless the dev file uses a non-default
name (see *Multiple versions* above).

---

## Linking a product to its dashboard on the index

**What I want:** A few products (SafeLMS and Scheduling today) have a *product
dashboard* — a live status board of every prototype in that product, with each
mock's status, its recent changes, and Jira links in one place
(`products/SafeLMS/dashboard/`, `products/Scheduling/dashboard/`). That
dashboard, not the plain prototype table, is the product's real home. So on the
top-level ux-mockups index (`/index.html`, "Prototypes by Product"), the product
**card itself should open the dashboard** — one click, straight to the board —
and the card should carry a **one-sentence description** of what that dashboard
is. The flat prototype table stays reachable, but as a secondary "View all
prototypes" link, not the primary action.

**How it's wired (the SafeLMS / Scheduling pattern):** in the `PRODUCTS` array in
`/index.html`, give the product two extra fields:

```js
{
  label: 'SafeLMS', slug: 'safelms', icon: 'fa-graduation-cap', color: '#0ea5e9',
  dashboardHref: 'products/SafeLMS/dashboard/',                 // card opens this in a new tab
  description: 'A live status board of every SafeLMS prototype — statuses, recent changes, and Jira links in one place.',
  items: [ /* … prototypes, as usual … */ ],
}
```

With `dashboardHref` set, the index renders that product's card differently:

- **Clicking the card** opens `dashboardHref` in a new tab (the primary action),
  and the label gets an outbound-link ↗ icon to signal it leaves the index.
- **`description`** shows as the card's body — keep it to **one sentence**.
- A small **"View all N prototypes →"** link in the card footer still routes to
  the in-index table (`#<slug>`) for that product, so the full Jira + last-modified
  list remains one click away.
- In the product's table view, the header title also links to `dashboardHref`, so
  the dashboard is reachable whichever way you arrive.

**To give another product the same treatment**, build its dashboard under
`products/<Product>/dashboard/` (see the next section), then add `dashboardHref`
+ a one-sentence `description` to that product's entry in `PRODUCTS`. No other
code changes — the card rendering keys off `dashboardHref`.

---

## Product dashboard (shared + auto-updating)

`dashboard.js` is the **single shared implementation** of the per-product
"Design Lab" — the status board a product links its index card to (above). It
renders cards for every prototype in a product, each with its **GitHub Pages
URL, GitHub source link, dev-handoff build, status, and Jira ticket**, plus a
recent-activity log. SafeLMS and Scheduling are the first two consumers.

### How a product enrolls (two files, no rebuild)

A product's dashboard is a **thin shell** that loads the shared script — the
shell is byte-identical for every product (the product name is read from the
`/products/<Product>/dashboard/` path):

```html
<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prototype Index</title>
</head><body>
  <script src="../../../designtoolbox/dashboard.js"></script>
  <script src="../../../designtoolbox/feedback-widget.js"></script>
</body></html>
```

The only product-specific data is `dashboard/meta.json` next to the shell — and
**you don't write that by hand** (see below). To enroll a new product:

1. Drop the shell above at `products/<Product>/dashboard/index.html`.
2. Add the product to `ENROLLED` in [`scripts/build-dashboards.js`](../scripts/build-dashboards.js).
3. (Optional) add a colour/emoji theme entry to `PRODUCT_THEMES` in `dashboard.js`.
4. Run `node scripts/build-dashboards.js` (or just push — CI does it).

Improve `dashboard.js` once and **every** product's dashboard updates — no more
copy-paste drift between product dashboards.

### Auto-updating meta.json (nobody maintains it)

`meta.json` is regenerated on every push by `scripts/build-dashboards.js`
(wired up in [`.github/workflows/dashboards.yml`](../.github/workflows/dashboards.yml)),
because the private repo can't be directory-listed from the browser. The build
step does the listing instead and rebuilds:

- **the mock list** — every folder with an `index.html` under the product
  (added on create, removed on delete/rename);
- **`devHandoff`** — set when a `dev_handoff.html` sits next to a mock's
  `index.html` (flips the card to *Ready for Dev*);
- **`recentChanges`** — from `git log` (date + path + commit subject), newest 20.

It is **non-destructive**: any human-curated `title` / `description` / `status` /
`ticket` / `ticketUrl` / `extraLinks` already in `meta.json` is preserved across
regenerations. So designers never have to touch it, but *may* enrich a card and
the build won't clobber it. The CI commit carries `[skip ci]` so it doesn't
re-trigger itself.

> **Descriptions: one short sentence.** A card's `description` is a quick
> "what this design is" — ONE short sentence, never a feature list or a
> paragraph. Long descriptions make cards uneven and bury the link/status, so
> `.card-description` clamps to 3 lines as a backstop — but write them short.
> This holds for every product.

The generator output is exact: regenerate locally with
`node scripts/build-dashboards.js` and commit the result, or let the push do it.
