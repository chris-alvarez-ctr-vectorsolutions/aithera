# Component Assessment
## Event Indicator (UX-2474) — Current UI — current-ui.html

**Source**: Local file (`products/Scheduling/event-indicator-UX-2474/current-ui.html`)
**Date**: 2026-07-21
**Assessed against**: core v1.22.1, themes v1.9.3 (fetched from CDN). The mock loads
only `@vector-web-components/assets` v1.0.0 (Open Sans) + Font Awesome 6.7.2 — no
`core`/`themes` bundle — so the two CONTEXT.md baselines are the library minimums.

---

## Read this first — what this mock is

`current-ui.html` is a **deliberate, faithful reproduction of the CURRENT production
Vector Scheduling day view**, built as the "before" surface onto which the UX-2474
**event/credential indicator** feature is layered. It is hand-rolled HTML/CSS by
design and intentionally does **not** use the Vector Web Components library — the
whole point is to look exactly like today's shipping product.

So a literal "you should have used VWC here" audit would be misleading: the
surrounding chrome (topnav, sidenav, toolbar, cards, hover card) is legacy
production and is not being rebuilt. The coverage table below therefore reads as
**"when dev builds the UX-2474 indicator into the real product, here is the VWC
component each piece maps to"** — with the genuinely net-new feature (the
credential **status-indicator badge**) called out as the one true gap.

**The UX-2474 feature itself** = credential/qualification status indicators shown on
assigned people in the schedule:
- **Qualifier badge + status icon** (`.pqc` / `.qbadge` / `.hc-cbadge`) — a colored
  credential chip (FF, Capt, BC, PS, PM) with a status glyph inside:
  **Expired** (red circle, white ✕), **Expiring soon** (yellow triangle ⚠),
  **Missing** (red dashed circle, ?).
- **Concurrent-shift flag** (`.cflag` / `.hc-cflag`) — orange circle with a white flag.
- **Black hover detail card** (`.hovercard`) — reproduces production's on-hover card,
  now carrying the credential-status rows and concurrent-shift info.
- Qualifier tags stack **above** the person name (JS re-flows `.prow` → `.stacked`).

---

## Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Top navigation bar (`.topnav`) | `vwc-topnav` | ⚠️ Partial (intentional) | Legacy production topbar reproduced in custom markup. Real product uses `vwc-topnav` with logo/user-menu slots. Not to be rebuilt for this ticket. |
| Left icon rail (`.sidenav`) | `vwc-sidenav` | ⚠️ Partial (intentional) | Hand-rolled icon list mirroring production. Maps to `vwc-sidenav` (collapsed/icon mode) in the real app. |
| List/Calendar view toggle (`.tb-seg`) | `vwc-toggle-button-group` | ⚠️ Partial | Custom segmented control; `vwc-toggle-button-group` (single-select) is the VWC equivalent. |
| Date navigation +/‑ / picker (`.datenav`) | `vaadin-button` + `vaadin-date-picker` | ⚠️ Partial (intentional) | Prev/next/today + date label reproduced; real build pairs `vaadin-button theme="tertiary"` with `vaadin-date-picker theme="outlined"`. |
| Assignment cards (`.acard`, `.offcard`, `.misc-card`) | `vwc-card` | ⚠️ Partial (intentional) | Column/shift cards with header + body. Structurally a `vwc-card` (header/content slots); kept custom to match production density. |
| **Credential status-indicator badge** (`.pqc`, `.qbadge`, `.hc-cbadge` + `.hc-ci` glyphs) | — (none) | ❌ **Gap** | **The core UX-2474 element.** No badge/chip/pill component exists in VWC core. A colored credential chip with an embedded status glyph (expired/expiring/missing) is net-new and a strong candidate for a shared component. See Gap spec below. |
| Concurrent-shift flag (`.cflag` / `.hc-cflag`) | — (none) | ❌ Gap | Small status token (orange circle + flag icon). Same family as the badge gap — an icon-status indicator with no VWC home. Could be a variant/slot of the badge component. |
| Hover detail card (`.hovercard`) | `vaadin-tooltip` / `vaadin-popover` | ⚠️ Partial (intentional) | Reproduces production's black on-hover card, JS-positioned. `vaadin-tooltip` (rich content) or `vaadin-popover` is the VWC path; the bespoke black styling is a deliberate production match. |
| Open-slot tiles (`.oslot`) | `vwc-card` / custom | ⚠️ Partial (intentional) | Hatched "Open slot" tiles with qualifier badges — production-specific pattern, no direct VWC analog beyond a card shell. |
| "Schedule yourself" button (`.sched-self`) | `vaadin-button` | ⚠️ Partial | Custom button; maps to `vaadin-button theme="tertiary"`. |
| Row / card menus (`.acard-menu` ⋮) | `vaadin-menu-bar` / `vaadin-context-menu` | ⚠️ Partial (intentional) | Kebab affordances shown but non-functional in the mock; real build uses a Vaadin menu. |
| Chat FAB (`.chat-fab`) | — (toolbox/AI overlay) | ⚠️ Partial | Decorative here; not part of the ticket scope. |
| Icons (Font Awesome) | `vwc-icon` | ⚠️ Partial (intentional) | Uses Font Awesome (repo default). Production/VWC would use `vwc-icon` (MDI) for the status glyphs. |

---

## Design Token Usage

The mock reproduces the **legacy production palette**, so most values are opaque
brand grays/colors that predate the current VWC theme. A few coincide exactly with
semantic tokens; the rest are documented (not necessarily "to fix", since faithful
reproduction is the goal). When dev builds the indicator into the real VWC product,
the status colors below should use the semantic tokens.

| Color in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
| `#e0782e` (warning / concurrent orange, `.cflag`) | `--lumo-warning-color` | `#e0782e` | ✅ Match |
| `#F06500` (concurrent flag fill) | `--lumo-warning-color` | `#e0782e` | ⚠️ Off — brighter orange; use the warning token |
| `#158444` (success green) | `--lumo-success-color` | `#158444` | ✅ Match |
| `#047857` / `#3f8f3f` / `#3f9442` (greens) | `--lumo-success-color` / `--lumo-success-text-color` | `#158444` / `#0a7637` | ⚠️ Off — use success tokens |
| `#DC2626` / `#B91C1C` / `#c0392b` / `#e53935` (expired / Capt reds) | `--lumo-error-color` | `#d83e38` | ⚠️ Off — several near-reds; consolidate on the error token |
| `#FCD34D` (expiring-soon yellow triangle) | `--vwc-notification-color` | `#ffc700` | ⚠️ Off — warmer yellow; notification/warning token is closest |
| `#2b7fd0` / `#4a90d9` (PM badge, focus outline) | `--lumo-primary-color` | `#0271ce` | ⚠️ Off — legacy blue vs Vector primary |
| `#0a0a0a` (hover card background) | `--lumo-contrast` | `#192434` | ⚠️ Off — pure black vs near-black contrast |
| `#6b7785` / `#8b97a4` / `#9aa6b2` / `#5b6671` (UI grays) | `--lumo-secondary-text-color` / `--lumo-contrast-*` | `#00000099` / alpha contrasts | ⚠️ No direct match — opaque legacy grays vs alpha-based contrast tokens |
| `#ccd2d8` / `#d9dee3` / `#e2e6ea` / `#d4d9df` (borders) | `--lumo-contrast-20pct` | `#1c375a29` | ⚠️ No direct match — opaque vs alpha border tokens |
| `#f3f5f7` / `#f5f7f9` / `#eef0f3` (surface tints) | `--lumo-contrast-5pct` | `#193b670d` | ⚠️ No direct match — opaque tint vs alpha |
| `#fff` (card/badge text & surfaces) | `--lumo-base-color` | `#ffffff` | ✅ Match |

---

## Gap Component Requirements

### Credential Status Badge (a.k.a. Qualifier Indicator)

**Description** — A compact colored chip representing a credential/qualification
(e.g. FF, Capt, BC, PM) with an optional **status glyph** embedded before the label
indicating the credential's validity. It is the central net-new element of UX-2474
and recurs identically across the schedule rows, open-slot tiles, and the hover
detail card, so it should be a single shared component rather than three CSS copies.

**Use Cases** — Scheduling day/week views (person rows, open slots), the on-hover
person detail card, and any future roster/qualification report needing at-a-glance
credential status.

**API (proposed)**

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | — | Credential code shown in the chip (e.g. `FF`, `Capt`). |
| `color` | `string` | — | Chip background (credential color); pair with white text. |
| `status` | `'valid' \| 'expired' \| 'expiring' \| 'missing'` | `'valid'` | Drives the embedded glyph. |
| `date` | `string` | — | Expiry/expiring date surfaced in tooltip/detail contexts. |
| `size` | `'sm' \| 'md'` | `sm` | Schedule rows use `sm`. |

**Variants / States** — `valid` (no glyph); `expired` (red circle, white ✕);
`expiring` (yellow triangle ⚠ with dark outline); `missing` (red dashed circle, ?).
A sibling **concurrent-shift flag** (orange circle + flag icon) is the same
icon-status family and could be a `variant="flag"` or a second small component.

**Design Tokens** — status colors should bind to `--lumo-error-color` (expired/
missing), `--lumo-warning-color` (expiring), `--lumo-success-color` (valid), rather
than the legacy hexes in the mock.

**Accessibility** — glyph needs a text alternative (`aria-label` like "FF —
expired 03/2026"); do not rely on color alone. Status must be conveyed to screen
readers, matching the tooltip text.

**Related Components** — `vwc-icon` (glyph), `vaadin-tooltip` (the detail surface it
appears in).

**Open Questions** — (1) Is the concurrent-shift flag one component with the badge or
separate? (2) Full set of credential types/colors and their source of truth?
(3) Does the badge itself trigger the hover card, or only the person row?

---

## Summary

| Category | Count |
|---|---|
| ✅ Covered | 0 |
| ⚠️ Partial | 10 |
| ❌ Gap | 2 |

**Key takeaways:**
- This mock is an **intentional reproduction of the current production Scheduling
  UI** in custom HTML/CSS; it does not (and should not) load VWC. Read the coverage
  table as a map of what the real product uses, not as defects to fix here.
- The **one real product gap is the credential status-indicator badge** — the core
  of UX-2474. VWC has no badge/chip/pill component, and this pattern (colored
  credential chip + embedded expired/expiring/missing glyph) repeats across rows,
  slots, and the hover card. It's a strong candidate for a shared component.
- The **concurrent-shift flag** is the same icon-status family and has no VWC home
  either — fold it into the badge component as a variant.
- The **hover detail card** intentionally reproduces production's black card;
  `vaadin-tooltip`/`vaadin-popover` is the VWC path when it's built for real.
- The palette is the **legacy production palette**. Warning orange `#e0782e` and
  success green `#158444` happen to match theme tokens exactly; the reds, blue,
  and grays are legacy and should bind to `--lumo-error/​primary/contrast` tokens
  in the production build.
