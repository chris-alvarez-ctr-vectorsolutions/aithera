# Keystone Hub — promote the task count to a section header

**Date:** 2026-08-04
**Scope:** The `37 tasks` count at the left of the task list's filter row in
`products/Keystone Department Hub/keystone-hub/`.

## Problem

The count already functions as the task list's title — it is the only label between the greeting
hero and the table — but it is styled as incidental UI text: 16px, regular weight, `--ink-700`.
Two measured problems follow from that:

1. **It doesn't read as a header.** At 16px/400 it is smaller than the 40px pills beside it and no
   heavier than the table's own body text, so nothing tells a user what the table below is for.
2. **It hangs off to the left of everything else.** Measured at 1440px: the greeting `h1` starts at
   x=56 (the hero carries a 24px inner padding), the table's first column header text starts at
   x=52, and the count sits at x=32. It is the only text on the page left of both.

The page also has no heading for the task list at all — the greeting `h1` is the only heading, so
there is nothing between it and the table for assistive navigation.

## Constraint that shapes the solution

The CSS above the hero records that the hero was compressed from ~175px to ~90px specifically to
keep the top of the task list above the fold. A header on its own line would spend ~30px of that
reclaimed budget, so the header stays **inline** as the left-hand anchor of the existing filter
row, where the 40px pills already set the row height and the header costs zero extra height.

## Design

**Markup** (`keystone-hub/hub.js`, the `filterBar` renderer): the count's wrapper element changes
from `<span class="kx-count">` to `<h2 class="kx-count">`. The inner structure is unchanged — the
number, then `<span>task</span>` / `<span>tasks</span>` with the existing singular/plural logic.
An `h2` is the correct rung below the greeting `h1` and gives the task list the heading it
currently lacks.

**Style** (`keystone-hub/index.html`, the `.kx-count` rules):

```css
  .kx-count {
    margin: 0;                          /* reset the h2 default */
    font-size: 20px; font-weight: 600; line-height: 1.2;
    color: var(--ink-900);              /* was --ink-700 — the same ink as the h1 */
    padding-left: 20px;                 /* 32px → 52px */
    min-width: 132px;                   /* was 72px */
    font-variant-numeric: tabular-nums; flex-shrink: 0;
  }
  .kx-count span { color: var(--ink-500); font-weight: 500; }
```

Rationale for each value:

- **20px/600** sits a clear step below the 26px greeting and a clear step above the 14–16px
  controls, so the hierarchy reads in one glance. Open Sans, not the Fraunces display face — the
  display face was considered and rejected as too editorial next to the pills.
- **`padding-left: 20px`** lands the text at x=52, matching the "App" column header directly
  beneath it and within 4px of the greeting above. Aligning to the greeting exactly (24px, x=56)
  was the alternative; the table wins because the header belongs to the table.
- **`min-width: 132px`** keeps the pills from shuffling sideways as the count changes width between
  one and three digits (`8 tasks` → `137 tasks`). `tabular-nums` only equalises digit *widths*, not
  digit *counts*, so the min-width is what actually holds the row steady.
- **"tasks" keeps `--ink-500` at the same 20px** so the number carries the emphasis without the
  word shrinking into a footnote.

## Unchanged

- The wording stays `<n> tasks`, counting whatever the active filter shows. Showing `8 of 37 tasks`
  when filtered was considered and rejected as extra copy in a deliberately economical spot.
- The filter row keeps its `flex-wrap`, so on narrow screens the header wraps onto its own line —
  the right outcome there, and no separate mobile size is needed.
- The pills shift right by 60px on desktop (measured: "My tasks" moves from x=114 to x=174), into
  space that is currently empty.
- The table does not move down.

## Verification

At 1440px in the browser. Measured before-values, for comparison: count at x=32, `SPAN`, 16px/400;
filter row 40px tall; table card top at y=677; "My tasks" pill at x=114.

- The header's text starts at x=52, matching the first column header. The filter row is still 40px
  tall and the table card's top is still y=677 — the header costs no height, because the 40px pills
  set that row.
- Applying a status filter changes the number without moving the "My tasks" pill.
- Computed style is 20px/600, `rgb(19, 29, 39)`, and the element is an `H2` whose `textContent` is
  `37 tasks` unfiltered.
- The singular case still reads `1 task`.

## Out of scope

`.kx-count` is defined and used only in `keystone-hub/index.html` and `keystone-hub/hub.js`, so no
other page in the product is affected. The sibling pages (`prioritization-settings.html`,
`agency-intelligence-dashboard.html`) have no task-count element and are untouched.
