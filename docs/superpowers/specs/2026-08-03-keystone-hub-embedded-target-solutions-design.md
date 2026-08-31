# Keystone-Department-Hub — embedded in Target Solutions

**Date:** 2026-08-03
**Product:** Keystone-Department-Hub
**Feature folder:** `products/Keystone-Department-Hub/embedded-target-solutions/`

## Purpose

The Keystone-Department-Hub will ultimately be published inside several Vector
Solutions applications. Before that happens we need bake-outs that show internal
audiences what the hub looks like *wearing each host app's chrome*.

This spec covers the **first of three**: Target Solutions. Check It and Scheduling
follow as sibling features and are explicitly out of scope here.

The deliverable is demo-driven. In a live demo the presenter must be able to click
back and forth between the Target Solutions **homepage** and the **Keystone
Department Hub** using the real left navigation, with the Target Solutions top nav
and sidebar staying put across the switch.

## Scope

**In scope**

- A recreation of today's Target Solutions homepage, faithful enough to read as the
  real product.
- The Target Solutions top nav and left navigation, rendered as persistent chrome.
- A new **Keystone Hub** left-nav link.
- The hub itself, embedded in the Target Solutions content area.
- A new announcement banner on the homepage promoting the hub.

**Out of scope**

- Check It and Scheduling views (next features).
- The app-switcher panel behind the bento icon (see *Deferred: app switcher*).
- Any change to `keystone-hub/` itself.

## File layout

Every feature in this repo is a versioned folder behind a generic loader.

```
products/Keystone-Department-Hub/
  keystone-hub/                     ← existing hub. NOT modified by this work.
  embedded-target-solutions/
    index.html                      ← the LOADER. Verbatim copy of base-template/index.html.
    versions.json                   ← [{ "id": "ver1", "label": "V1", "path": "ver1/index.html" }]
    ver1/
      index.html                    ← the entire design lives here
```

All design work happens in `ver1/index.html`. The feature-root `index.html` is the
generic version loader and is never edited.

**Relative paths from `ver1/index.html`:**

| Target | Path |
| --- | --- |
| The hub (iframe source) | `../../keystone-hub/index.html` |
| Design Toolbox | `../../../../designtoolbox/toolbox.js` |

### `products.json`

Add a folder group to the existing `Keystone-Department-Hub` product, alongside the
three current top-level items (which stay where they are):

```json
{
  "folder": "Embedded App Views",
  "items": [
    {
      "name": "In Target Solutions",
      "rel": "embedded-target-solutions",
      "modified": "2026-08-03",
      "desc": "The Department Hub embedded in the Target Solutions shell, with a recreated TS homepage you can click between.",
      "status": "in-progress"
    }
  ]
}
```

The folder is created now, with one child, so `embedded-check-it` and
`embedded-scheduling` drop in later with no restructuring.

## Architecture

The page is a **persistent shell wrapping two swappable views**.

```
.ts-app  [data-view="home" | "hub"]
├── .ts-accentbar          crimson 4px rule
├── .ts-topnav             logo · department name · icon rail · avatar
└── .ts-body
    ├── .ts-sidebar        badge · collapse toggle · nav
    └── .ts-content
        ├── #view-home     the recreated homepage      (visible when data-view="home")
        └── #view-hub      <iframe> of the real hub    (visible when data-view="hub")
```

A single `data-view` attribute on `.ts-app` decides which view is shown; CSS does the
hiding. Nothing in the shell re-renders on a switch, so the sidebar and top nav never
flicker and the demo click is instantaneous.

**Why an attribute and not two pages:** two separate HTML files would reload the whole
shell on every click, and would duplicate the nav markup that Check It and Scheduling
will each need their own copy of anyway.

### Embedding the hub

`#view-hub` contains one element:

```html
<iframe src="../../keystone-hub/index.html" title="Keystone-Department-Hub"></iframe>
```

Rationale:

- **Zero duplication.** Edits to the real hub appear here automatically. There is no
  second copy to keep in sync.
- **No collisions.** The hub ships its own `styles.css` with its own CSS custom
  properties and a `#root` element. In one shared document those would fight the
  Target Solutions shell's styles. An iframe gives it a clean document.
- **Full interactivity survives.** Filters, sort headers, dialogs, and the role FAB
  all keep working, untouched.
- **Reusable.** Check It and Scheduling reuse the same one-line embed.

The iframe fills the content area and is sized so the hub scrolls *within* the Target
Solutions frame — which is how an embedded product page actually behaves.

## The shell

### Accent bar

A 4px crimson rule pinned above the top nav, full bleed.

### Top nav

White, ~80px tall, containing:

- The Vector Solutions logo (left).
- `Springfield Fire Department` as the department name.
- A right-side icon rail: **apps/bento grid**, **help**, **notifications bell**, and a
  circular `JL` avatar.

Everything here is decorative **except the bento icon** — see *Deferred: app switcher*.

### Left sidebar

267px wide, white background.

- A Maltese-cross department badge at the top.
- The circular collapse chevron on the sidebar's right edge, vertically centered on
  the badge. Decorative.
- The navigation, in two visually distinct blocks:

**White block — interactive.**

| Item | Icon | Behavior |
| --- | --- | --- |
| Home | house | Sets `data-view="home"` |
| Keystone Hub | fire-flame | Sets `data-view="hub"`. Carries a small **NEW** pill. |

`Keystone Hub` sits directly **below** Home. Both render on white, matching the
existing Home treatment.

**Black block — decorative.**

`Administration` (with its expanded chevron) and everything beneath it — Dashboard,
Generate Reports, Completions, Assignments, Manage Users, Manage Credentials, Manage
Events, Course Library, Activities Builder, Test Builder, File Center, Account — on a
dark charcoal background with white text and the inset dividers from the current
product. `Test Builder` renders in its active state, matching the source screenshot.

These are not clickable. They exist for fidelity so the demo reads as the real
application.

**Active state.** Exactly one of Home / Keystone Hub reads as selected at any time,
driven by `data-view`.

## View: `home`

Recreates the current Target Solutions homepage, top to bottom.

### 1. Announcement banner — NEW

The one genuinely new element on this page. Sits at the very top of the content
column, above Frequent Activities.

- Keystone-accented card announcing the new Department Hub.
- A primary **"View the Department Hub"** button that sets `data-view="hub"` *and*
  moves the sidebar selection to Keystone Hub — the same end state as clicking the
  nav link, so both demo paths converge.
- A dismiss `×`. Dismissal is **session-only, not persisted** — reloading the page
  brings the banner back, so the demo always resets to a known state.

### 2. Frequent Activities

White card, crimson top rule, title, and a collapse chevron at top right.

- A `Station-based Trainings` label in link blue.
- **One row of nine solid-color tiles**: EMT Basics, Extinguisher Training, Fire
  Basics, Firewalls, Hydrant Training, Sprinkler System Basics, Vehicle
  Stabilization, When Hoses Attack, When Hoses Attack. Each is a rounded square with a
  white glyph and a white label. The repeated `When Hoses Attack` label is intentional
  — it appears twice in the source, in two different tile colors.

The real product shows a second, pastel `Field-based Trainings` row. **It is
deliberately omitted** to save vertical space, so the To Do and Bulletin Board cards
sit higher in the demo.

### 3. To Do

White card, left column of a two-column row.

- Header: `To Do`, plus search / sort / filter icon buttons.
- Tabs: `All` · `Credentials` · `Assignments`, with the red active underline on `All`.
- Four task rows, each a bordered rounded block containing:
  - A colored square type chip — row 1 Credential (teal), row 2 Activity (orange),
    row 3 Course (blue), row 4 Course (purple).
  - An `ISO | 458468` meta line.
  - A blue link title (`Wildfire Emergency Response Credential`).
  - A `📌 Pinned` marker and expand chevron on the right, where present.
  - A date line (`Exp Date: Mar 22, 2025`).
  - A status chip: `Not Started` (gray) or `Validation Rejected` (red).

Static. No filtering or sorting behavior.

### 4. Bulletin Board

White card, right column.

- Header `Bulletin Board` with an edit pencil.
- `Welcome` heading and the existing explanatory body copy.
- A framed chart-image placeholder.

## View: `hub`

The content area is given entirely to the hub iframe. The announcement banner,
Frequent Activities, To Do, and Bulletin Board are all hidden — this is a different
page in the same application, not an overlay.

## Deferred: app switcher

The bento/apps-grid icon in the top nav will eventually open an app switcher that
launches other Vector applications in new tabs. **That UI is not part of this work** —
it will be provided later.

To make dropping it in a content swap rather than a rewire, this build ships:

- The bento icon as a **real, focusable `<button>`** with an accessible name, not a
  decorative glyph.
- A wired click handler that currently toggles nothing visible.
- An empty, hidden `#ts-app-switcher` container positioned relative to the button,
  ready to receive the panel markup.

Every other top-nav icon stays decorative.

## Component and styling approach

The source homepage is a **legacy Target Solutions page** — its navigation, activity
tiles, and cards predate the Vector Web Components library. Rebuilding that chrome
in VWC would misrepresent what exists today.

So the split is:

- **Recreated existing chrome** (top nav, sidebar, Frequent Activities tiles, To Do
  rows, Bulletin Board) — plain semantic HTML and CSS, styled to match the current
  product.
- **New elements** (the announcement banner, the Keystone Hub nav link's NEW pill,
  the banner's CTA button) — **Vector Web Components and theme tokens**, since these
  are the parts a developer would actually build.

This keeps the handoff honest: the components a developer must implement are the ones
already expressed as components.

## Design Toolbox

`ver1/index.html` includes the Design Toolbox at
`../../../../designtoolbox/toolbox.js` so the mock supports comments and the flow map
during review, consistent with every other feature in this repo.

## Success criteria

1. Opening `embedded-target-solutions/` shows the Target Solutions shell with the
   recreated homepage.
2. Clicking **Keystone Hub** in the left nav swaps the content area to the live hub
   with no shell reload; the sidebar selection moves.
3. Clicking **Home** returns to the homepage.
4. The banner's CTA reaches the same state as the nav link.
5. The embedded hub is fully interactive — filters, sorting, dialogs, and the role FAB
   all work.
6. The bento button is focusable and has an accessible name.
7. The feature appears on the product dashboard under an **Embedded App Views**
   folder.
