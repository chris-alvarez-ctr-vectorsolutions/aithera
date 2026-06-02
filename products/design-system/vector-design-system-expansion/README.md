# Vector Design System Expansion

A four-pass audit of the Vector Web Components design system (v1.5.1), grounded in a high-fidelity product UI stress test. Identifies gaps, proposes horizontal expansion, and provides visual references for the design-system team to design against.

## Contents

| File | Purpose | Format |
|---|---|---|
| [`gap-analysis.md`](gap-analysis.md) | The 30-row prioritized backlog. Four-pass methodology (inline HTML, shared CSS, Vaadin fallback, live Storybook verification). Each row classified as misused-existing (A), missing variant (B), or genuinely missing (C). | Markdown |
| [`expansion-matrix.md`](expansion-matrix.md) | Atomized, executable rows for the design-system team. Proof-of-concept slice covering the Badge family (9 rows); structure scales to ~50 rows across ~13 component families. | Markdown |
| [`gallery.html`](gallery.html) | Side-by-side visual comparison. For each invented pattern in the consuming product, renders the nearest existing Vector/Vaadin component next to it. Useful for spotting misuse vs. real gaps. | Live HTML — open in browser |
| [`reference.html`](reference.html) | Visual expansion reference. Organized by component primitive (intent, form, surface, composition modifier, decorative palette) rather than by semantic vocabulary. Shows current state + desired variability with rendered cells. | Live HTML — open in browser |
| [`VECTOR_COMPONENTS_REFERENCE.md`](VECTOR_COMPONENTS_REFERENCE.md) | Quick reference of Vector v1.5.1 component tags, themes, and CSS variables. Auxiliary lookup for the design system. | Markdown |

## How to read

**For a 5-minute overview:** open `reference.html` in a browser, scroll the Badge section. It's the most visual representation of what the design system needs.

**For the full backlog:** read `gap-analysis.md`. The prioritization (Tier 1 / 2 / 3) is what drives the design-system team's roadmap.

**For executable design-system work:** read `expansion-matrix.md`. Each row is a single shippable variant, slot, or prop with acceptance criteria.

**For evidence the analysis is grounded in:** open `gallery.html` in a browser. It shows the patterns the consuming product reinvented and the existing Vector/Vaadin component each one maps to.

## Methodology summary

The analysis ran four passes:

- **Pass A — Inline patterns.** Audited 37 prototype HTML files for custom CSS classes and inline styles playing the role of components.
- **Pass B — Shared CSS.** Audited 2,653 lines of shared CSS across four imported files. Surfaced the entity-panel composite as a self-contained mini-design-system the inline pass missed.
- **Pass C — Vaadin fallback.** Walked every backlog row against the broader Vaadin web-components catalog (Vector wraps Vaadin and Vaadin is the documented fallback). Reclassified 6 rows from "build new component" to "use existing Vaadin primitive."
- **Pass D — Live Storybook verification.** Pulled compiled story + MDX-doc chunks for 20 priority components directly from the Vector Storybook CDN. Corrected several "missing variant" claims by surfacing themes, slots, and props that the static reference doc didn't capture.

The headline finding: **Vector + Vaadin together cover ~85% of what the consuming product needs**, not ~60% as the Vector-only reference doc suggested. The remaining ~15% is mostly variant proliferation on existing primitives, plus ~3 genuinely net-new primitives.

## Notes on the HTML files

Both HTML files load Vector Web Components, Open Sans, and Font Awesome from CDN. Internet access is required to render them — otherwise the live Vector components and icons will not appear.

CDN sources used:

- `cdn.vsp-prod.com/web-components/@vector-web-components/core/v1.5.1/`
- `cdn.vsp-prod.com/web-components/@vector-web-components/themes/v1.1.1/`
- `cdn.vsp-prod.com/web-components/@vector-web-components/assets/v1.0.0/`
- `cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/`

The HTML files are otherwise self-contained — all custom CSS is inlined and there are no local image, font, or script dependencies.

## Bundle status

This bundle was generated 2026-05-27 from analysis of a real product UI stress test. The Badge component section in `reference.html` is fully fleshed out as a proof-of-concept; the gap analysis backlog covers all 30 rows across 13 component families. The remaining ~12 component sections in `reference.html` (Button, Card, Tab, Drawer, Sidenav, Popover, TextField, Empty State, Chip, Field, Entity Panel, Theme) are ready to be built out using the same format, once the Badge format is validated with a design-system stakeholder.
