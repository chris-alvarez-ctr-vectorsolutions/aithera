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
| Mark | 40×40 tile, `border-radius: 8px`, `var(--lumo-primary-color, #0271ce)`, white `fa-fire-flame-curved` |
| Eyebrow | `NEW IN KEYSTONE` — 12px, bold, `letter-spacing: .09em`, uppercase, `#77b6f2` |
| LIVE pill | Fill `#6ee7ad`, text `#0a3b2a`, 11px bold uppercase, `border-radius: 999px`; sits beside the eyebrow |
| Headline | "Stop hunting for what's due." — `#fff`, bold, 32px, `line-height: 1.12` |
| Body | "The **Department Hub** gathers every open task across your Vector applications, prioritized in one place — with department readiness at a glance." 15px, `#bcd8f5`; "Department Hub" bold `#fff` |

**Right column — action.** White CTA "View the Department Hub" with bold `#0d2a4d` label; beneath
it, right-aligned 13px `#9dc6ec` subline "Or find it any time in the left navigation". To the
CTA's right, a 40px square of `rgba(255,255,255,.12)`, `border-radius: 8px`, holding a white ✕.

**Two deliberate deviations from these mocks' current conventions**, both taken from the
approved screenshot:

1. The CTA is a **rounded rect (~10px), not the pill** these files otherwise force via
   `vaadin-button { --vaadin-button-border-radius: 999px }`. Scoped to this banner only.
2. **White-on-dark is not a stock Vector button variant.** The closest library variant,
   `theme="contrast primary"`, is dark-filled and would disappear on this background. The CTA is
   a `vaadin-button theme="primary"` with a banner-scoped inverse override (white surface, navy
   label). This is a design-system gap to call out at dev handoff, not something dev should
   guess at.

## Behavior

Unchanged from the current banner, and intentionally so:

- CTA switches the mock to the Hub view via the existing per-file view router.
- ✕ hides the banner.
- **Dismissal is session-only** — no `localStorage`, no cookie. A reload always restores the
  banner, so a demo cannot be left in a state where the banner is unrecoverable mid-presentation.
- Existing element IDs (`*-announce`, `*-announce-cta`, `*-announce-dismiss`) are preserved, so
  each file's dismiss/CTA JavaScript needs no changes.

## Responsive

Below 900px the action column stacks under the copy: CTA becomes full-width, the subline centers
under it, and the ✕ moves to an absolutely positioned top-right corner button so it never sits
below the fold of the banner.

## Accessibility

- Keeps `<section role="region" aria-label="New feature announcement">`.
- ✕ keeps its `aria-label="Dismiss announcement"`; the flame tile and the ✕ glyph are
  `aria-hidden="true"` (the button label carries the meaning).
- Contrast: white headline and white CTA label on the navy gradient clear WCAG AA comfortably.
  The light-blue eyebrow, body, and subline are checked against the *lightest* point of the
  gradient (the right edge, `#0f5fbd`), which is the worst case for those elements — the subline
  in particular sits over that end of the gradient.

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
