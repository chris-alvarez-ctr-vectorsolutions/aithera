# Keystone-Department-Hub — embedded in Vector Check It

**Date:** 2026-08-03
**Product:** Keystone-Department-Hub
**Feature folder:** `products/Keystone-Department-Hub/embedded-check-it/`

## Purpose

The third and final host-app bake-out, showing the Keystone-Department-Hub wearing
another Vector application's chrome. Target Solutions and Vector Scheduling shipped
first. With this one the set is complete.

Same demo goal: a presenter clicks between the Check It homepage and the Department
Hub using the real left navigation, with the Check It top bar and sidebar holding
still across the switch.

## Scope

**In scope**

- A recreation of the Vector Check It homepage.
- The Check It dark top bar and white left sidebar as persistent chrome.
- A new **Keystone Hub** left-nav link.
- The hub, embedded in the Check It content area.
- An announcement banner on the homepage promoting the hub.

**Out of scope**

- Any change to `keystone-hub/`, `embedded-target-solutions/`, or
  `embedded-scheduling/`.

## Decisions carried from the earlier bake-outs

Settled previously and not revisited:

- The hub is embedded **by reference** via
  `<iframe src="../../keystone-hub/index.html">`, never copied, and eagerly loaded
  — no `loading="lazy"`, which would stall the first demo click.
- One feature folder per host app, all grouped under the **Embedded App Views**
  folder in `products.json`.
- A `data-view` attribute on the root element swaps two sibling views; CSS hides the
  inactive one, so the chrome never re-renders.
- Legacy host chrome is plain HTML/CSS. Only genuinely **new** elements — the
  announcement banner, its buttons, the NEW pill — use Vector components and theme
  tokens.
- Banner dismissal is session-only. No storage, so a reload resets the demo.
- Classes and the view-switch function use an app-specific prefix shared with
  nothing. Here that is `ci-` / `ciSetView`. Each host-app view stays a standalone
  file, and the two shipped builds cannot be broken from this one.

## What differs from the earlier two

**The sidebar is white, not dark.** Scheduling's rail was dark slate and Target
Solutions' had a black Administration block. Check It's is white with a right hairline.
Active state is therefore a **filled rounded pill** behind the item rather than a
left accent bar.

**The sidebar has a search field** at the top — `Search equipment / Apparat…` with a
magnifying glass. Decorative.

**One nav item carries an alert treatment.** `Department` renders in red on a pale
pink pill with a red warning triangle, distinct from the other items. That is its
state in the source and is reproduced as-is.

**The page is sparse.** The responsibilities table holds two rows above a tall empty
body, with the paginator pinned beneath it. That expanse is characteristic of the real
page and is kept rather than collapsed — shrinking it would misrepresent the product.

## File layout

```
products/Keystone-Department-Hub/
  keystone-hub/                 ← existing hub. NOT modified.
  embedded-target-solutions/    ← shipped. NOT modified.
  embedded-scheduling/          ← shipped. NOT modified.
  embedded-check-it/
    index.html                  ← the LOADER. Verbatim copy of base-template/index.html.
    versions.json               ← [{ "id": "ver1", "label": "V1", "path": "ver1/index.html" }]
    ver1/
      index.html                ← the entire design
```

**Relative paths from `ver1/index.html`:**

| Target | Path |
| --- | --- |
| The hub, for the iframe | `../../keystone-hub/index.html` |
| Font Awesome Pro | `../../../../assets/fontawesome/css/all.min.css` |
| Design Toolbox | `../../../../designtoolbox/toolbox.js` |

### `products.json`

Append a third item to the existing `Embedded App Views` folder group:

```json
{
  "name": "In Vector Check It",
  "rel": "embedded-check-it",
  "modified": "2026-08-03",
  "desc": "The Department Hub embedded in the Vector Check It shell, with a recreated Check It homepage you can click between.",
  "status": "in-progress"
}
```

## Architecture

```
.ci-app  [data-view="home" | "hub"]
├── .ci-topbar             dark navy global bar
└── .ci-body
    ├── .ci-sidebar        white nav rail
    └── .ci-content
        ├── #view-home     the recreated homepage
        └── #view-hub      <iframe> of the real hub
```

`window.ciSetView(name)` sets `data-view` on `.ci-app`, moves the sidebar's active
state to the matching nav item, and resets the content column's scroll. The banner
CTA calls the same function, so both demo paths land in one state.

## The shell

### Top bar

Dark navy, full width. Left: the Vector Solutions mark with `Vector Check It` set
beneath it. Right: a green circular avatar and `Austin Smith`. All decorative.

### Sidebar

233px, white, with a right hairline.

A decorative search field sits at the top: `Search equipment / Apparat…` with a
magnifying-glass icon.

**Interactive — the only two routing items.**

| Item | Behavior |
| --- | --- |
| `Home`, house icon | Sets `data-view="home"` |
| `Keystone Hub`, flame icon | Sets `data-view="hub"`. Carries a **NEW** pill. |

`Keystone Hub` sits directly below `Home`.

**Decorative — for fidelity.**

Fleet, Store Rooms, Equipment, Inventory, Controlled Substances, Tickets, Service
Tasks, Checklist Library, Dashboards, Reports, Users, Department, Fleet Summary,
Support Center. Items that expand keep their chevron. `Department` keeps its red
alert treatment. None are focusable.

## View: `home`

1. **`View Activity Feed`** — a link at the top right of the content area.

2. **Page header** — `Welcome back, Austin Smith` with the subtitle
   `Review current assignments and recent activity`, followed by a horizontal rule.

3. **Announcement banner — NEW.** Sits below the rule and above `My Responsibilities`,
   so the page keeps its own greeting and the banner reads as page content rather
   than chrome. Announces the hub, with a primary **View the Department Hub** button
   calling `ciSetView('hub')` and a dismiss `×`. Dismissal is session-only.

4. **My Responsibilities** — a section heading, then the tab row
   `Equipment · Inventory · Apparatus · Tickets` with `Equipment` active and
   underlined, then the table:

   | Name ↑ | Pool Name (Type) | Location | Serial No | End of Life | Status |
   | --- | --- | --- | --- | --- | --- |
   | **shark** | A Test for Emily (STANDARD) | Austin Smith | - | - | `In Service` |
   | **Test1** | UX Test (PPE) | Austin Smith | | - | `In Service` |

   Names render as bold navy links; `In Service` is a green chip. Below the two rows
   the table body runs tall and empty, with the footer pinned beneath it:
   `Items per page: 10 ▾`, `1-2 of 2`, and the `|‹ ‹ 1 › ›|` pager.

   Everything in the table is static. No sorting, paging, or tab switching beyond the
   active underline.

5. **Chat FAB** — a blue circular message button, bottom right. Decorative.

## View: `hub`

The content area is given entirely to the hub iframe; the homepage is hidden. A
different page in the same application, not an overlay.

## Icons

Font Awesome **Pro** 6.7.2, self-hosted at the repo root. Before commit, the
zero-width sweep must return an empty array:

```js
[...document.querySelectorAll('i[class*="fa-"]')].filter(e => !e.getBoundingClientRect().width).map(e => e.className)
```

The failure this catches is silent — a missing icon class renders as an invisible
zero-width glyph with no console error — so the sweep is a required gate.

## Success criteria

1. The feature opens on the Check It shell with the recreated homepage.
2. Clicking **Keystone Hub** swaps the content to the live hub with no shell reload;
   the sidebar's active item moves.
3. Clicking **Home** returns to the homepage.
4. The banner CTA reaches the same state as the nav link.
5. The embedded hub is fully interactive.
6. The zero-width icon sweep returns `[]`.
7. The feature appears under **Embedded App Views** on the product dashboard,
   alongside the Target Solutions and Scheduling views.
