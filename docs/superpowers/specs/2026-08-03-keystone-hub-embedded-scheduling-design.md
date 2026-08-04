# Keystone Department Hub — embedded in Vector Scheduling

**Date:** 2026-08-03
**Product:** Keystone Department Hub
**Feature folder:** `products/Keystone Department Hub/embedded-scheduling/`

## Purpose

The second of the host-app bake-outs showing the Keystone Department Hub wearing
another Vector application's chrome. Target Solutions shipped first
(`embedded-target-solutions/`); this is Vector Scheduling. Check It remains.

Same demo goal: a presenter clicks between the Scheduling homepage and the
Department Hub using the real left navigation, with the Scheduling top bar and
sidebar holding still across the switch.

## Scope

**In scope**

- A recreation of the Vector Scheduling homepage, faithful enough to read as the
  real product.
- The Scheduling dark top bar and dark left sidebar as persistent chrome.
- A new **Keystone Hub** left-nav link.
- The hub, embedded in the Scheduling content area.
- An announcement banner on the homepage promoting the hub.

**Out of scope**

- The Check It view.
- Any change to `keystone-hub/` or to `embedded-target-solutions/`.

## Decisions carried from Target Solutions

These were settled during the first bake-out and are not revisited:

- The hub is embedded **by reference** via `<iframe src="../../keystone-hub/index.html">`,
  never copied. Eagerly loaded — no `loading="lazy"`, which would stall the first
  demo click.
- One feature folder per host app, all grouped under the **Embedded App Views**
  folder in `products.json`.
- A `data-view` attribute on the root element swaps two sibling views; CSS hides
  the inactive one, so the chrome never re-renders.
- Legacy host chrome is plain HTML/CSS. Only genuinely **new** elements — the
  announcement banner, its buttons, the NEW pill — use Vector components and
  theme tokens.
- Banner dismissal is session-only. No storage, so a reload resets the demo.

## Decisions specific to this bake-out

### Class prefix: `sch-`, self-contained

Every class and the view-switch function are prefixed `sch-` / `sch`. Nothing is
shared with `embedded-target-solutions/`, which keeps its `ts-` prefix.

Each app view is therefore a standalone file that reads naturally on its own,
matching how every other mock in this repo works. There is no shared stylesheet
whose edit could break three mocks at once, and the already-reviewed Target
Solutions build is not touched.

The cost is duplicated architecture across files. That is the accepted trade —
duplication between independent mock files is this repo's convention.

### Roster depth: two unit groups

Today's Roster recreates **Battalion 1** and **Engine 11** only. The source page
also shows Engine 1 and Engine 12; those are omitted to keep the markup
proportionate.

The two kept groups still cover every state the roster can show: a fully staffed
group (blue bar, `2/1`) and a short-staffed one (red bar, `2/3`) with Open Slot
rows, plus a Comp Time Worked row alongside Regular Time rows.

**One deliberate deviation from the source:** the `HAZ` and `TIL` crew badges live
on Engine 1 and Engine 12, so cutting those groups would drop the badge treatment
entirely. A `HAZ` badge is therefore placed on one Battalion 1 crew member. The
roster is sample data, and the real product supports badges on any crew member.

## File layout

```
products/Keystone Department Hub/
  keystone-hub/                 ← existing hub. NOT modified.
  embedded-target-solutions/    ← first bake-out. NOT modified.
  embedded-scheduling/
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

Append a second item to the **existing** `Embedded App Views` folder group under
the `Keystone Department Hub` product:

```json
{
  "name": "In Vector Scheduling",
  "rel": "embedded-scheduling",
  "modified": "2026-08-03",
  "desc": "The Department Hub embedded in the Vector Scheduling shell, with a recreated Scheduling homepage you can click between.",
  "status": "in-progress"
}
```

## Architecture

```
.sch-app  [data-view="home" | "hub"]
├── .sch-topbar            dark global bar
└── .sch-body
    ├── .sch-sidebar       dark nav rail
    └── .sch-content
        ├── #view-home     the recreated homepage
        └── #view-hub      <iframe> of the real hub
```

`window.schSetView(name)` sets `data-view` on `.sch-app`, moves the sidebar's
active state to the matching nav item, and resets the content column's scroll.
The banner CTA calls this same function, so both demo paths land in one state.

## The shell

### Top bar

Dark, full width. Left to right: a circular avatar with `John Vector ▾`;
`Quick + ▾`; a calendar icon; a bell carrying a red `2` badge; a `?` help icon;
an orange `admin` link; and a white tenant chip reading
`Crewsense Fire Rescue - Do not change` with a small department crest.

Right side: a wrench icon, a white account selector reading
`#2257 Crewsense Fire Resc… ▾`, and the Vector Solutions / Vector Scheduling
lockup in white.

All decorative.

### Sidebar

210px, dark slate. A collapse control sits at the top, then:

**Interactive — the only two routing items.**

| Item | Behavior |
| --- | --- |
| `Vector Scheduling` with a `Pro` suffix and a house icon | Sets `data-view="home"` |
| `Keystone Hub` with a flame icon | Sets `data-view="hub"`. Carries a **NEW** pill. |

`Keystone Hub` sits directly below the home item, as the source's first nav entry.

**Decorative — for fidelity.**

Crew Scheduling, Assistant, CallBacks, Notify, Time Offs, Absence, Bulletin Board,
Trade Board, Employees (with its `485 / 750` teal count pill), Forms, File Manager,
Reports, TimeClock, Logs. Each keeps its colored icon; the expandable ones keep
their right-hand chevron. None are focusable.

## View: `home`

1. **Page title** — `Welcome to Vector Scheduling, John Vector`.

2. **Announcement banner — NEW.** The one new element. Announces the hub, with a
   primary **View the Department Hub** button calling `schSetView('hub')` and a
   dismiss `×`. Dismissal is session-only.

3. **Two-column body.**

   **Left column** — two stacked cards:
   - *Announcements*: `System Announcement` with its `02/21/2025 09:55` timestamp,
     the two red status/updates links, the blue `Open Support Ticket` link, the
     dated `TEST` entries with their trash and `Edit` affordances and attribution
     lines, `Implementation Process` with its body copy, and the teal **Add new**
     button.
   - *Shift Trading*: `Shift Trades` and `There are no pending Trade Requests`.

   **Right column** — *Today's Roster*:
   - Header with `Monthly Views`, `Edit Schedule`, `Custom Views`, `Print`, and
     `? Help` buttons.
   - `collapse all / expand all` links.
   - A date stepper: back arrow, calendar icon, `Monday, August 3, 2026`, forward
     arrow.
   - A full-width blue **B Shift** bar.
   - A `Todays Staffing Count Report` disclosure row.
   - `Availability` with a `0 / 10` meter.
   - **Battalion 1** `[Dist 1]`, blue `2 / 1` meter — David Farrar (`BC`, one
     `HAZ` badge, 24 hrs), Kylene McCallum (`BC`, 08:00–17:00, 9 hrs), Kelly Ahrens
     (`DE1`, 24 hrs). Times render red, as in the source.
   - **Engine 11** `[Dist 3]`, red `2 / 3` meter — Elaine Carey (`FF`), Matthew
     Bilby (`-`, `Comp Time Worked [CTW]`), then three yellow **Open Slot** rows
     with dashed borders for `CPT`, `DE1`, and `FF`.

   Everything in the roster is static. No sorting, filtering, or expansion.

## View: `hub`

The content area is given entirely to the hub iframe; the homepage is hidden.
This is a different page in the same application, not an overlay.

## Icons

Font Awesome **Pro** 6.7.2, self-hosted at the repo root (adopted in `fb2afdd`).
Before commit, the zero-width sweep must return an empty array:

```js
[...document.querySelectorAll('i[class*="fa-"]')].filter(e => !e.getBoundingClientRect().width).map(e => e.className)
```

Three Pro-only classes rendered as invisible glyphs during the Target Solutions
build while the repo was still on Font Awesome Free. That failure is silent — no
console error — so the sweep is a required gate, not a nicety.

## Success criteria

1. The feature opens on the Scheduling shell with the recreated homepage.
2. Clicking **Keystone Hub** swaps the content to the live hub with no shell
   reload; the sidebar's active item moves.
3. Clicking **Vector Scheduling** returns to the homepage.
4. The banner CTA reaches the same state as the nav link.
5. The embedded hub is fully interactive.
6. The zero-width icon sweep returns `[]`.
7. The feature appears under **Embedded App Views** on the product dashboard,
   beside **In Target Solutions**.
