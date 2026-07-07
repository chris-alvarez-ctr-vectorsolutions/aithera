# Component Assessment
## Crew Scheduling — Deployments — products/Scheduling/deployment/index.html

**Source**: Local file
**Date**: 2026-07-07
**Assessed against**: core v1.22.1, themes v1.9.3 (fetched from CDN). The mock loads
core **v1.19.0** and themes **v1.5.0**; CONTEXT.md is unpublished at those versions, so
this assessment uses the minimum-available baselines (core v1.22.1 / themes v1.9.3).

This mock deliberately **reproduces the current CrewScheduler production chrome** (dark
topnav, sidenav, plain data table) so the deployment flow reads as a real screen. Most
"⚠️ Partial" rows below are that intentional departure — they are fine to keep for a
prototype and are called out only so the dev team knows the VWC equivalent for the real build.

---

## Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Buttons (26) | `vaadin-button` | ✅ Covered | Every button carries a variant (`primary` / `secondary` / `tertiary`), and the review Deploy uses `theme="success primary"`. Correct usage. |
| Select fields (9) | `vaadin-select` | ✅ Covered | `theme="outlined"` present; work-type selects now `required`. |
| Date / time pickers | `vaadin-date-picker`, `vaadin-time-picker` | ✅ Covered | `theme="outlined"`. |
| Text field / area / number | `vaadin-text-field`, `vaadin-text-area`, `vaadin-number-field` | ✅ Covered | `theme="outlined"`. |
| Radio / checkbox | `vaadin-radio-group` + `vaadin-radio-button`, `vaadin-checkbox` | ✅ Covered | Deployment-type radios + template checkbox. |
| Top navigation bar | `vwc-topnav` | ⚠️ Partial | Hand-rolled `.topnav` div to mirror production chrome (avatar, admin badge, account switcher). Intentional; real build should use `vwc-topnav` + `vwc-user-menu` + `vwc-account-switcher`. |
| Side navigation | `vwc-sidenav` | ⚠️ Partial | Custom `.sidenav` list. Intentional production reproduction; maps to `vwc-sidenav` (data-driven `items`). |
| Breadcrumb | `vwc-bread-crumb-nav` | ⚠️ Partial | `.breadcrumb` is custom markup → `vwc-bread-crumb-nav`. |
| Multi-step stepper (V2) | `vwc-stepper` + `vwc-stepper-step` | ⚠️ Partial | Custom `.v-stepper` / `.vstep` chips + manual `gotoStep()`. VWC `vwc-stepper` covers this (active/complete states, `active-step-change`). |
| Tabs (Active/Archived; Pick/Templates/Build) | `vaadin-tabs` | ⚠️ Partial | Custom `.tabs` / `.dep-tabs`. `vaadin-tabs` is the standard. |
| Cart panel / review island / drawers | `vwc-drawer` | ⚠️ Partial | `.cart-panel`, review island, and modal overlays are custom slide-up panels → `vwc-drawer` (sidebar/overlay modes). |
| Modal dialogs (Select employee, Qualifiers, Template editor, Edit deployment) | `vaadin-dialog` | ⚠️ Partial | Custom `.overlay`/`.dialog` divs. `vaadin-dialog` provides focus-trap, backdrop, renderer API. |
| Row actions menu (⋯) | `vaadin-popover` | ⚠️ Partial | `#rowMenu` is a custom absolutely-positioned menu → `vaadin-popover`. |
| Info tooltips (`data-tip`) | `vaadin-tooltip` | ⚠️ Partial | Custom CSS tooltip → `vaadin-tooltip`. |
| Density toggle (Compact/Comfortable) | `vwc-toggle-button-group` | ⚠️ Partial | Custom `.dep-viewtoggle` two-button group → `vwc-toggle-button-group` (single-select). |
| "Deployable" on/off switch | `vwc-switch` | ⚠️ Partial | Custom CSS `.toggle` → `vwc-switch`. |
| Assignments data table | `vaadin-grid` | ⚠️ Partial | Plain `<table class="assign">`. Intentional (mirrors production list); `vaadin-grid` for the real build (sorting/selection/virtual scroll). |
| Content cards (`.acard`, `.v-card`) | `vwc-card` | ⚠️ Partial | Custom cards → `vwc-card` (slots: header/content/actions). |
| Section headings (h1/h2) | `vwc-headline` | ⚠️ Partial | Plain headings → `vwc-headline` (`headingLevel`, icon slot). |
| Dividers | `vwc-divider` | ⚠️ Partial | `.divider` rule → `vwc-divider`. |
| Toast notifications | `vaadin-notification` | ⚠️ Partial | Custom `.toast` + `showToast()` → `vaadin-notification`. |
| Icons | Font Awesome 6 | ✅ Covered | Per repo convention (FA is the default icon set); `vwc-icon` only where a VWC slot needs it. |
| Status / count badges (`.row-new-badge`, `.dep-tab-count`, `.sn-badge`, `.mt-type`, `.cov`) | — | ❌ Gap | No Badge component in the fetched core index (v1.22.1). These small pills are custom CSS. See documented gap below. |

---

## Design Token Usage
Representative mapping of the mock's hardcoded colors to the nearest theme token
(values quoted from themes v1.9.3 CONTEXT.md). The mock defines its own `:root`
palette; most map onto Lumo tokens with small shifts.

| Color in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
| `#fff` / `#ffffff` (surfaces) | `--lumo-base-color` | `#fff` | ✅ Match |
| `#0271ce` (`--blue`) | `--lumo-primary-color` | `#0271ce` | ✅ Match |
| `#1565c0` (`--blue-link`), `#1d4ed8` | `--lumo-primary-color` | `#0271ce` | ⚠️ Off — swap to the primary token (slightly deeper blue). |
| `#e23b3b` (`--red`), `#e0892e`… | `--lumo-error-color` | `#d83e38` | ⚠️ Off — use `--lumo-error-color`. |
| `#1f9d57` / `#16a34a` / `#2e7d52` (greens) | `--lumo-success-color` | `#158444` | ⚠️ Off — use `--lumo-success-color` / `--lumo-success-text-color` (`#0a7637`). |
| `#e0a82e` / `#e0892e` (amber) | `--lumo-warning-color` | `#e0782e` | ⚠️ Off — use `--lumo-warning-color`. |
| `#192434`-family dark nav (`#1f2937`, `#18233a`) | `--lumo-contrast` | `#192434` | ⚠️ Off — close to full contrast; custom nav shade. |
| `#5a6675` (`--text-muted`), `#8a93a0` (`--text-soft`), `#6b7682` | `--lumo-secondary-text-color` | `#00000099` | ⚠️ No direct match — Lumo greys are alpha-on-contrast, not solid hexes. |
| `#e2e6ea` (page bg), `#cfd5db` / `#c2c7ce` (borders) | `--lumo-contrast-10pct` | `#1a38601a` | ⚠️ No direct match — solid vs. translucent tint. |
| `#eef5fd` / `#e0edfb` / `#e7f0fb` (blue tints: selected bucket, chips) | `--lumo-primary-color-10pct` | `#0271ce1a` | ⚠️ Off — a translucent primary tint gives the same effect. |
| `#7b3ff2` / `#6b4c9a` (deployment swatch purple) | — | — | ⚠️ No direct match — decorative color-picker swatch; no semantic token. |

---

## Gap Component Requirements

### Badge / count pill (documented gap)
Small status/count pills are used throughout (Just-deployed, tab counts, sidenav
"49/100", template type, coverage state) but there is **no Badge component in the
fetched core index (v1.22.1)**. Before specifying one, the team should confirm:
- variants needed (neutral / info / success / warning / error), and
- whether it also carries a count vs. just a label.

Recorded as a documented gap rather than a full spec pending those decisions. (Note:
the repo `CORE-CONTEXT.md` references a `vwc-badge`; it is not present in the CDN index
at the assessed version — worth reconciling.)

---

## Summary
| Category | Count |
|---|---|
| ✅ Covered | 7 |
| ⚠️ Partial | 15 |
| ❌ Gap | 1 |

**Key takeaways:**
- **Form controls are solid** — every Vaadin input uses `theme="outlined"` and every
  button has a proper variant, including the new green (`success primary`) review Deploy.
- **The big "Partial" cluster is intentional production-chrome reproduction** (topnav,
  sidenav, plain table). Keep for the prototype; the real build should adopt `vwc-topnav`,
  `vwc-sidenav`, and `vaadin-grid`.
- **Most genuinely reusable VWC pieces are hand-rolled**: the V2 stepper (`vwc-stepper`),
  tabs (`vaadin-tabs`), drawers/cart (`vwc-drawer`), dialogs (`vaadin-dialog`), row menu
  (`vaadin-popover`), tooltips (`vaadin-tooltip`), density toggle (`vwc-toggle-button-group`),
  and the deployable switch (`vwc-switch`) — these are the highest-value swaps for dev.
- **Colors are close but off-token**: blues/reds/greens/ambers should snap to
  `--lumo-primary/error/success/warning`; the custom solid greys have no exact Lumo hex
  (Lumo uses alpha-on-contrast) so they're acceptable to keep or re-derive.
- **One gap**: a shared Badge/count-pill component — pending variant decisions.
