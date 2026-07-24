# Design Editor (POC)

A **designer-only** browser overlay for making manual Figma-lite tweaks to any
prototype in this repo and exporting them as a copy-paste payload for Claude in
VS Code. It replicates a small slice of a design canvas — enough to nudge
positions and adjust basic CSS (color, border, shadow, radius, spacing) —
without leaving the browser.

## Design constraints (why it works the way it does)

- **Never ships to GitHub Pages.** The editor is injected by a **bookmarklet**,
  so no mock's HTML ever gets a `<script>` line. There is nothing to strip
  before a push and nothing to leak.
- **Zero-touch on existing files.** It imports nothing from the Design Toolbox
  (`toolbox.js`, `feedback-widget.js`, `flow-map.js`) and touches no mock. Any
  shared-looking logic (e.g. the element→selector builder) is re-implemented
  self-contained inside `editor.js`.
- **Localhost-only.** `editor.js` refuses to run unless the hostname is
  `localhost`/`127.0.0.1` — a hard guard on top of the bookmarklet delivery.
- **Non-destructive.** Edits apply via `element.style` and are recorded as
  *deltas*. The DOM is never re-serialized or written back. Applying edits to
  the real file is done by Claude from the pasted prompt.

## Files

| File | Purpose |
|---|---|
| `editor.js` | The whole editor. Injected at runtime; never referenced by a mock. |
| `setup.html` | One-page installer — drag the bookmarklet to your bookmarks bar. |
| `README.md` | This file. |

## Setup

1. Serve the repo locally (VS Code **Live Server**, default port `5500`).
2. Open `http://localhost:5500/designeditor/setup.html`.
3. Set your port, then drag **✏️ Edit Mode** to your bookmarks bar.

## Use

1. Open any prototype on localhost.
2. Click **✏️ Edit Mode** in the bookmarks bar → the editor toolbar appears.
3. Click an element, tweak it, hit **Finish & Export**, copy the prompt into Claude.
4. Click **✏️ Edit Mode** again to turn the editor off (it toggles).

## Features

- ✅ Bookmarklet injection on localhost (with toggle-off)
- ✅ Hover outline + click-to-select with selector label
- ✅ **Element navigator** — a breadcrumb of the selected element's ancestors
  (click any crumb to reselect it) plus a collapsible **mini tree** (parent →
  selected → children) with hover-highlight. Solves "I clicked the row but want
  the container." Also **Alt-click** = select parent, **arrow keys** = ↑ parent /
  ↓ first child / ← → siblings.
- ✅ **Property panel** — organized into collapsible **accordion buckets**:
  - **Layout** — display switcher; **flex controls** (direction/justify/align/
    wrap/gap) auto-appear when the element is `display:flex`, **grid controls**
    when `display:grid`, and flex/grid **item** controls (align-self/flex/order)
    when the element is a flex/grid child; width/height/max-width
  - **Table** (context-aware, padding-first) — appears for table-family elements,
    showing only what works for the selection. A `<table>` gets the controls that
    actually read as good table spacing: **cell padding for all cells** as two
    controls — **Vertical** (top & bottom) and **Horizontal** (left & right),
    each writing both sides so content stays centered with equal spacing —
    **zebra striping**, **header emphasis** (bg + bold), and **row/column
    dividers**. All palette/token-aware and applied as scoped rules to the
    table's cells/rows. A `<tr>` gets row height; a `<td>`/`<th>` gets cell
    height + per-side padding for that one cell, **plus column operations**:
    **◀ Move left / Move right ▶** physically reorder the column (the `<th>` and
    every `<td>` at that index across all rows) and **Hide** removes it — with a
    **column map** of chips showing the order (click to jump). These are
    *structural* edits (they actually rearrange/hide DOM nodes), fully undoable,
    and export as precise instructions Claude can apply to the markup — e.g.
    *"Move the Status column left (swap with Owner)"*, *"Remove the ID column"* —
    so column changes are **not** deferred to the screenshot. (Disabled for
    tables using `colspan`/`rowspan`, where column indices are ambiguous.)

    > Why padding, not gaps: CSS `gap` does nothing on tables, and
    > `border-spacing` detaches every cell (ugly outer + inter-column spacing).
    > Cell padding keeps borders clean while giving content room — it's what
    > "space out my table" actually means. (There are no gap controls.)
    >
    > Dividers force the table to `border-collapse: collapse` when enabled — on a
    > collapsed table a per-cell `border-bottom` otherwise loses to the next
    > row's `border-top`, which is why row dividers previously appeared not to
    > apply while column dividers did.
    >
    > Zebra striping targets the alternate rows **and** their cells (some tables
    > paint the `<tr>`, others the `<td>`). Its default color is the canonical
    > `--lumo-contrast-5pct` zebra token, which is only ~5% opacity — genuinely
    > subtle over a light table, so it can look like nothing changed. Use the
    > **Stripe color** picker to bump it to a stronger palette value.
    >
    > Table-wide edits (padding/zebra/header/dividers) style descendant cells via
    > a scoped CSS rule and export as a small CSS block for Claude, scoped to
    > that table.
  - **Spacing** — per-side padding & margin (linked "all" + expandable 4 sides),
    token-snapped
  - **Border** — width, style, color, radius
  - **Typography** — color, size, weight, align, line-height, letter-spacing
  - **Effects** — background, box-shadow, opacity
  - Colors use **design-system palette swatches** + a custom picker/hex fallback
  - The panel is **draggable** (grab the header) and **resizable** (drag the
    bottom-right grip); its position/size persist as you reselect elements
- ✅ **Design-system aware** — pixel controls **snap to theme tokens** and colors
  offer the **palette first**, so edits export as tokens, not magic numbers
- ✅ **Move tool** — drag any element to reposition (non-destructive
  `transform: translate`); press **M** for move, **V** for select
- ✅ **Undo / Redo** across every edit (`⌘Z` / `⌘⇧Z`), **Esc** to deselect
- ✅ **Finish & Export** → generated prompt (Copy button) + a **screenshot**
  (html2canvas) with a Copy-image button
- ✅ Shadow-DOM (Vector component) awareness note on the panel

### Two principles behind the export

**1. The tool calls out _what_ changed, not brittle geometry.** Values are
precise where the tool can be precise (which property, which token); position is
deferred to the screenshot, which is the medium actually good at spatial intent.

**2. Nothing exports as a raw pixel.** The browser tool isn't pixel-accurate, and
hand-dialed values shouldn't become magic numbers. So:

- **Pixel properties snap to design-system tokens.** Drag padding to ~17px and it
  snaps to the 16px step and exports `var(--lumo-space-m)`. Claude applies the
  token, never `17px`. (Scales from `THEMES-CONTEXT.md`: `--lumo-space-*`,
  `--lumo-border-radius-*`, `--lumo-font-size-*`.)
- **Colors come from the palette first.** The color control shows semantic theme
  swatches (Primary, Success, Warning, Error, text greys, base). Picking one
  exports `var(--lumo-primary-color)`. A custom picker/hex is the secondary
  escape hatch for genuinely off-palette colors (those export as the literal hex).
- **Moves defer to the screenshot.** A drag records only *that* the element moved
  and *which* element; its new placement is read from the attached screenshot.
  No pixel offsets, no guessed "below the table" descriptions.

### Export format

Grouped **by element** — one numbered section per edited element (label +
selector + line), so you can verify everything you changed on one element in one
place, and Claude gets an unambiguous anchor:

```
## Edits — products/.../ver1.html

### 1. "Upgrade to Pro"  (.card.pro, line 42)
VALUES:
    font-size:     var(--lumo-font-size-xxl)  /* 24px */
    padding:       var(--lumo-space-m)  /* 16px */
    color:         var(--lumo-primary-color) /* Primary */
    border-color:  #8899aa

### 2. input.search  (line 88)
MOVED — repositioned; see the screenshot for its new placement.
```

The prompt preamble tells Claude to apply the named token (never an off-scale px)
and to treat the screenshot as the source of truth for all repositioning.

**Override:** hold **⇧ Shift while dragging** to mark that move as
**pixel-exact** — it then exports as a literal offset in the EXACT section
instead of as relational intent. The outline label shows which mode is active.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `V` | Select tool |
| `M` | Move tool (drag to reposition) |
| `⌘Z` / `Ctrl Z` | Undo |
| `⌘⇧Z` / `Ctrl Y` | Redo |
| `Esc` | Deselect |

**Not yet built** (possible next steps):

- Theme-custom-property (`--lumo-*`) knobs for `vaadin-*` / `vwc-*` internals
- Before/after side-by-side screenshot (currently captures the after-state)

## Notes / gotchas

- **CSP:** the thin bookmarklet injects `editor.js` via a `<script>` tag, which
  works on same-origin localhost. If a page's CSP ever blocks it, the fallback
  is a "fat" bookmarklet with `editor.js` inlined (regenerate when the file
  changes). Not needed so far.
- **Cache:** the bookmarklet appends `?t=<timestamp>` so edits to `editor.js`
  are picked up on the next click without a hard refresh.
