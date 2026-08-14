# Evaluations+ Admin UI — Explanation & Summary

**Companion document to `ver1/dashboard.html`, for the development team.**

Its purpose is to clarify the intent and implementation details behind this
prototype that the visuals alone don't convey. Read the mock for *what* it looks
like; read this for *what must be preserved, what is configurable, and why
specific choices were made.*

---

## ⚠️ The top nav and side nav are FROZEN

> **The top navigation bar and the left side navigation in this prototype are
> reproductions of the CURRENT shipped Evaluations+ admin UI. They are to be
> built and behave EXACTLY as they do in production today — with their existing
> functionality, information architecture, and interaction behavior fully
> preserved — REGARDLESS OF ANY VISUAL DISCREPANCY between this prototype and
> the live application.**

This is the single most important instruction in this document.

| Question | Answer |
| --- | --- |
| The prototype's nav spacing/color/font differs from production. Which wins? | **Production wins.** Keep what ships today. |
| The prototype's nav is missing an item that exists in production. | **Keep the production item.** This prototype is not the source of truth for nav contents. |
| The prototype's nav shows an item that no longer exists in production. | **Keep production.** Do not re-add a removed item. |
| Should I "clean up" or modernize the nav while I'm in here? | **No.** Not in scope. |
| Should I migrate the nav to Vector Web Components? | **No.** See "Layout contract". |
| The nav hover/active/focus styling differs. | **Production wins.** |
| Permissions hide certain nav items for some roles. | **Preserve that logic exactly.** The prototype shows a full-access view. |

**The chrome here is context, not a redesign.** It is drawn so content designs can
be evaluated in place. Any pixel-level difference from the live application is an
artifact of hand-rebuilding the shell in a static mock — it is **never** a design
change request.

### The only thing being designed

Everything inside `#content-region`, which is explicitly delimited in the file:

```html
<!-- ▼▼▼ EDITABLE ZONE: replace this whole region with the new design ▼▼▼ -->
<div id="content-region"> … </div>
<!-- ▲▲▲ END EDITABLE ZONE ▲▲▲ -->
```

The CSS for that region is fenced under its own banner comment near the bottom of
the `<style>` block.

---

## The landing screen

An **admin landing screen**, not a dashboard. Its job is to confirm where you are
and let you get on with your work.

**No data is displayed here** — no metrics, KPI tiles, charts, activity feeds,
counts, disk usage, or login history. Do not add any. The audience is an
administrator, and the vocabulary is administrative, not learner-facing.

Three elements, nothing else:

| Element | Implementation | Notes |
| --- | --- | --- |
| Welcome heading | `vwc-headline` `headinglevel="1"` | Static text at the component's native 24px, bold |
| Accent bar | `<div class="landing-divider">` | 40×2px rule tinted to the account's header color |
| Orientation sentence | `<p class="landing-copy">` | One generic line pointing at the left nav |

The block is vertically centered in the content column on a 520px measure. The
content region contains **no JavaScript** — no data fetching, state, or clock
logic.

### Copy is intentionally generic and static

Two constraints on the text, both deliberate:

- **The heading is fixed text.** It is not personalized and not time-of-day aware.
  No clock or session tracking backs this screen, so the page must not imply one
  exists.
- **The orientation line names no specific admin areas.** Enumerating sections
  (schools, forms, permissions, …) would duplicate the side nav and go stale as the
  IA changes. The nav is the source of truth for what's manageable.

**The account name is not repeated in the content area.** The frozen top bar
already displays it, centered, directly above the heading — it remains the single
place the active account is identified.

---

## The header color is an admin preference

The accent bar is tinted to the **global header color**, a user preference in the
admin section. The frozen top bar and the accent bar both read one variable:

```css
:root { --app-header-color: #ef8f3c; }   /* legacy Evaluations+ amber default */
```

**Feed the account's configured header color into this variable** and both
surfaces stay in sync. The top bar's `background` is
`var(--app-header-color, #ef8f3c)`.

This value is deliberately **not** a Lumo token: it is per-account data rather
than a design constant, and no Vector palette token matches the legacy amber
(`--lumo-primary-color` is blue, `#0271ce`).

---

## Implementation details for the landing region

Non-obvious specifics that will cost time if rediscovered:

- **The attribute is `headinglevel`, NOT `heading-level`.** The hyphenated form is
  silently ignored and `vwc-headline` falls back to its default `<h2>` — an
  accessibility defect for a page's main heading. This renders a true `<h1>`.
- **Bold has no official API on `vwc-headline`.** It exposes no theme attribute,
  font-weight prop, or CSS custom property for weight. `font-weight: 700` is set on
  the **slotted `<span>`**, which works because slotted content stays in the light
  DOM and inherits through the slot — no shadow-DOM piercing required.
- **The accent bar is a `<div>`, not `vwc-divider`.** `vwc-divider` is a
  full-width separator with only `inset` / `insetStart` / `insetEnd` props — no CSS
  custom properties for width, thickness, or color — so it cannot express a 40×2px
  bar.
- **`.main` and `#content-region` are flex columns.** This exists so a content
  child can stretch to fill the column height and center vertically. It is a
  layout enabler with no visual effect on the shell.

### Tokens

Every color and spacing value in the landing region resolves from `var(--lumo-*)`:

| Property | Token | Value |
| --- | --- | --- |
| Heading color | `--lumo-header-text-color` | `#000000de` → `rgb(33,33,33)` |
| Copy color | `--lumo-secondary-text-color` | `#00000099` → `rgb(102,102,102)` |
| Copy font size | `--lumo-font-size-m` | `14px` |
| Padding / margins | `--lumo-space-s`/`m`/`l`/`xl` | `8`/`16`/`24`/`40px` |
| Accent bar radius | `--lumo-border-radius-s` | `0.25em` |
| Accent bar color | `--app-header-color` | per-account preference |

**No theme changes are required.** Two values stay literal by necessity: the
copy's `line-height: 1.65` (the themes bundle defines no line-height tokens, and
only `--lumo-font-size-m` of the size scale), and the header color above. The font
stack inherits Open Sans, matching `--lumo-font-family`.

### Contrast

Both text elements meet WCAG 2.2 AA against the white content background:

| Element | Token | Ratio | AA needs |
| --- | --- | --- | --- |
| Heading, 24px bold | `--lumo-header-text-color` | 16.1:1 | 3.0 (large) |
| Copy, 14px | `--lumo-secondary-text-color` | 5.74:1 | 4.5 |

**Keep body text in this region at `--lumo-secondary-text-color` or darker.**
`--lumo-tertiary-text-color` computes to **3.11:1** on white and **fails AA** — do
not use it for anything a user needs to read.

---

## Layout contract

Fixed-chrome shell: `body` does not scroll. Only the content column (`.main`)
scrolls, beneath a fixed top bar and beside a fixed side nav. Content placed in
`#content-region` should assume it lives inside an independently scrolling column,
not a scrolling page.

The chrome is built with semantic HTML and CSS rather than `vwc-topnav` /
`vwc-sidenav` because it replicates a legacy screen — fidelity to what ships today
matters more than conformance to the current design system, and the production side
nav's always-expanded groups with navigable headers don't match `vwc-sidenav`'s
collapsible-group model.

**That is scoped to the frozen chrome only. New content inside `#content-region`
should use Vector Web Components** (`vaadin-*` / `vwc-*`) and theme tokens.

---

## Do not ship the Design Toolbox

`ver1/dashboard.html` includes the shared Design Toolbox:

```html
<script src="../../../../designtoolbox/toolbox.js"></script>
```

The bottom-center **toolbox pill** and its **🗺 Flow Map button are review and
handoff tooling only — they are not part of the product design.** Developers must
**not** ship the `toolbox.js` include, the dock pill, or the flow map button.
Strip that single `<script>` line for production.

---

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Version loader (copied verbatim from `base-template/`; never edit) |
| `versions.json` | Version manifest |
| `ver1/dashboard.html` | The prototype — frozen chrome + editable content region |
| `explanation-summary.md` | This document |
