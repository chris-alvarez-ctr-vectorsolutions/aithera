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
