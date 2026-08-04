# Keystone Department Hub — replacement announcement banner

**Date:** 2026-08-04
**Scope:** The "new feature" announcement banner on the recreated host-app homepages in the
three embedded-view mocks (Target Solutions, Vector Check It, Vector Scheduling).

## Problem

Each embedded mock's recreated homepage opens with a light announcement card — white surface,
blue left accent stripe, circular flame mark, headline "Introducing the Keystone Department
Hub" with a NEW pill, body copy, a primary CTA and a tertiary ✕. It announces the Hub, but it
reads as one more card in a page already full of cards: it competes with Frequent Activities
and the bulletin panels instead of standing out as a product announcement.

The replacement is a dark, Keystone-branded banner that deliberately breaks the host app's
visual rhythm, with sharper copy that leads with the user benefit rather than the product name.

## Decisions taken before design

- **Swap in place in `ver1`** for all three embeds. No `ver2`, no version pill — the old banner
  lives in git history only.
- **Identical in all three host apps.** Same gradient, copy, radius, and spacing everywhere; it
  reads as one recognizable Keystone announcement, not three host-tinted variants, and hands off
  to dev as a single component.
- **Keep the flame mark** (`fa-fire-flame-curved`) — already the banner's glyph, and it ties to
  the fire/EMS audience of all three host apps. It moves onto the blue rounded tile.

## Visual design

**Frame.** Full content-width block, first element in the home view (exactly where today's card
sits, above Frequent Activities or its equivalent). `border-radius: 14px`, no border,
`padding: 26px 30px`, diagonal gradient:

```css
background: linear-gradient(100deg, #08172b 0%, #0d3a72 55%, #0f5fbd 100%);
```

**Left column — copy.**

| Element | Spec |
|---|---|
| Mark | 34×34 tile, `border-radius: 8px`, `var(--lumo-primary-color, #0271ce)`, white `fa-fire-flame-curved` |
| Eyebrow | `NEW IN KEYSTONE` — 12px, bold, `letter-spacing: .09em`, uppercase, `#77b6f2` |
| LIVE pill | Fill `#6ee7ad`, text `#0a3b2a`, 11px bold uppercase, `border-radius: 999px`; sits beside the eyebrow |
| Headline | "Stop hunting for what's due." — `#fff`, bold, 30px, `line-height: 1.12`. Marked up as an **`h2`**: it is the visually dominant heading on the page and must not sit a level below the section titles beneath it (in Target Solutions it is also the document's first heading) |
| Body | "The **Department Hub** gathers every open task across your Vector applications, prioritized in one place — with department readiness at a glance." 15px, `#bcd8f5`; "Department Hub" bold `#fff` |

**Right column — action.** White CTA "View the Department Hub" with bold `#0d2a4d` label; beneath
it, centred 13px `#cfe3f8` subline "Or find it any time in the left navigation". To the CTA's
right, a 36px square of `rgba(255,255,255,.12)`, `border-radius: 8px`, holding a white ✕.

The ✕ aligns to the **CTA's centre**, not to the centre of the taller CTA+subline stack — so the
action block is `align-items: flex-start` and the ✕ carries `margin-top: calc(var(--lumo-space-xs)
+ 2px)`, which is the CTA's own default top margin plus the 2px that centres a 36px square against
a 40px button.

All sizes above are measured off the approved screenshot read as a 2× capture (2380px original ≈
a 1190px-wide banner in CSS pixels), which puts the banner at ~180px tall.

**Two deliberate deviations from these mocks' current conventions**, both taken from the
approved screenshot:

1. The CTA is a **rounded rect (~10px), not the pill** these files otherwise force via
   `vaadin-button { --vaadin-button-border-radius: 999px }`. Scoped to this banner only.
2. **White-on-dark is not a stock Vector button variant.** The closest library variant,
   `theme="contrast primary"`, is dark-filled and would disappear on this background. The CTA is
   a `vaadin-button theme="primary"` with a banner-scoped inverse override (white surface, navy
   label). This is a design-system gap to call out at dev handoff, not something dev should
   guess at.

   The override's colour is carried by **direct `background` / `color` declarations on the host
   element**, which win over the component's own `:host` rules. The custom properties set beside
   them are Lumo's **theme-specific** names — `--vaadin-button-primary-background` /
   `--vaadin-button-primary-text-color` for `theme="primary"`,
   `--vaadin-button-tertiary-background` / `--vaadin-button-tertiary-text-color` for
   `theme="tertiary"`. The **generic** `--vaadin-button-background` and
   `--vaadin-button-text-color` names are **inert on a themed button** — probe buttons in the
   browser stay Vector-blue when only those are set — so they cannot substitute for the direct
   declarations and are not used. (`--vaadin-button-border-radius` is the exception: it is
   generic and does apply, which is what carries the 10px radius in point 1.)

## Behavior

Unchanged from the current banner, and intentionally so:

- CTA switches the mock to the Hub view via the existing per-file view router.
- ✕ hides the banner.
- **Dismissal is session-only** — no `localStorage`, no cookie. A reload always restores the
  banner, so a demo cannot be left in a state where the banner is unrecoverable mid-presentation.
- Existing element IDs (`*-announce`, `*-announce-cta`, `*-announce-dismiss`) are preserved, so
  each file's dismiss/CTA JavaScript needs no changes.

## Responsive

Two stages, and the first of them keys off **available width, not viewport width**. The banner
lives in a content column roughly 320px narrower than the viewport, so a viewport media query
fires far too late: at a 901px viewport the banner is only ~567px wide, and a fixed action column
there ends up wider than the copy beside it — inverting the intended hierarchy.

**Stage 1 — wrap on available width.** The banner is `flex-wrap: wrap` with `gap: 20px 28px`; the
copy is `flex: 1 1 380px` and the action block is `flex: 0 0 auto; margin-left: auto`. As soon as
the copy can no longer hold its 380px basis alongside the action block, the action block drops to
its own row and sits **right-aligned** there rather than stretching. Nothing about the wide layout
changes: at a 1400px viewport the banner is a single row, ~184px tall, exactly as approved.

**Stage 2 — the phone case, below 900px.** The container flips to `column` and the action column
stacks under the copy: CTA becomes full-width, the subline centers under it, and the ✕ moves to an
absolutely positioned top-right corner button so it never sits below the fold of the banner. Two
resets are required here and are load-bearing: the copy's `flex-basis` must return to `auto` (in a
column container that basis is a *height*, and 380px of it would be dead space), and the action
block's `margin-left` must return to `0` (a cross-axis auto margin defeats `align-items: stretch`,
which would leave the CTA at its content width instead of full-width).

Measured banner heights across the range (Target Solutions, at the widths verified): 1400 → 184.6px
single row; 1150 → 207.1px single row; 1000 → 277.6px wrapped; 901 → 300.1px wrapped; 760 → 291.4px
phone case.

## Accessibility

- Keeps `<section role="region" aria-label="New feature announcement">`.
- ✕ keeps its `aria-label="Dismiss announcement"`; the flame tile and the ✕ glyph are
  `aria-hidden="true"` (the button label carries the meaning).
- **Keyboard focus** on the banner's two buttons is a **white 3px ring at a 2px offset**, scoped to
  the banner (`#<prefix>-announce vaadin-button:focus-visible`). It has to be scoped and explicit:
  Lumo's own focus ring resolves to `rgba(2,113,206,.76)` and each host page sets a global
  `:focus-visible { outline: 2px solid <link blue> }` — both are blue on navy, ~1.4:1, i.e. no
  perceivable indicator. The scoped rule also sets `box-shadow: none` so Lumo's blue ring is not
  left painted underneath. The 2px offset matters on the white CTA: it keeps a navy gap between the
  button face and the ring, so the ring reads against navy on both of its edges rather than
  vanishing into the button.

- Contrast: because the background is a gradient, each text element is checked against the
  gradient colour **at its own rightmost extent** — the brightest ground that element's text
  actually crosses — not against a single global value and not against a convenient stop. (The
  earlier version of this table evaluated the subline at the 70% point and so certified a colour
  that failed at the run's right end.) Measured ratios, all WCAG passes:

  | Element | On (gradient at its right end) | Ratio |
  |---|---|---|
  | Headline `#fff` | `#0c3261` (~42% across) | 12.8 |
  | Body `#bcd8f5` | `#0d3a72` (~55% across) | 7.7 |
  | Eyebrow `#77b6f2` | `#0a2344` (~19% across) | 7.3 |
  | LIVE pill text `#0a3b2a` | `#6ee7ad` | 8.2 |
  | Subline `#cfe3f8` | `#0f58af` (~92% across) | 5.3 |
  | CTA label `#0d2a4d` | `#fff` | 14.4 |
  | Focus ring `#fff` | `#0f58af` (non-text floor is 3.0) | 6.9 |

  The subline is the one element whose text run reaches deep into the bright end of the gradient:
  it spans roughly **70%→92%** of the banner width, where the ground climbs to `#0f58af`. At the
  originally specified `#9dc6ec` that measured **3.86:1** — an AA failure across the right half of
  the run — so the subline is `#cfe3f8`, which holds 5.27:1 at the run's right end and 7.05:1 at
  its left. Only the gradient's final stop (`#0f5fbd`) carries no text at all; the CTA's own white
  fill covers that region.

## Files touched

The banner's CSS block and its markup are replaced in place in each of:

- `products/Keystone Department Hub/embedded-target-solutions/ver1/index.html` (`ts-` prefix)
- `products/Keystone Department Hub/embedded-check-it/ver1/index.html` (`ci-` prefix)
- `products/Keystone Department Hub/embedded-scheduling/ver1/index.html` (`sch-` prefix)

Each file keeps its own class prefix; the values are identical across the three. `products.json`
gets refreshed `modified` dates for the three embedded entries. No other page changes.

## Verification

- Load each of the three mocks in the browser at ~1400px and at ~760px; confirm the banner
  matches the approved design and that the stacked layout holds.
- **Sweep the whole width range, not just the endpoints** — 1400, 1150, 1000, 901, 760. At 1400 the
  banner must be unchanged from the approved design (single row, ~184px tall); through the
  901–1150 band the action block must wrap onto its own right-aligned row rather than squeezing the
  copy narrower than itself. Endpoint-only checking is what let that band ship broken.
- **Tab to each banner button and read its computed `outline` / `box-shadow`.** Required:
  `outline: rgb(255, 255, 255) solid 3px`, `outline-offset: 2px`, `box-shadow: none`. A blue ring
  here means the scoped rule is missing or has been outranked.
- Click the CTA in each (routes to the Hub view) and the ✕ (banner hides, reload restores it).
- Run the silent-icon check from `CLAUDE.md` in each file — a Font Awesome class that isn't in
  the loaded set renders as a zero-width invisible glyph with no console error:

  ```js
  [...document.querySelectorAll('i[class*="fa-"]')].filter(e => !e.getBoundingClientRect().width).map(e => e.className)
  ```

  Requires an empty array.

## Out of scope

- The standalone Hub mock (`keystone-hub/`) has no announcement banner and is untouched.
- No dev-handoff build. These three mocks stay `in-progress`; handoff is a separate ask that
  runs the documented dev-handoff process.
