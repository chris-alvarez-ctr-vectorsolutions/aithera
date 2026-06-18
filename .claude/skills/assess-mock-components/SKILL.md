---
name: assess-mock-components
description: >
  Use to audit an EXISTING interactive HTML mock/prototype in this ux-mockups
  repo against the Vector Web Components library and confirm correct theme-token
  usage. Triggers on "assess this mock", "check the components in this prototype",
  "are we using the right VWC components", "audit the theme tokens", "component
  assessment for products/.../index.html", or any request to review what a built
  mock uses vs. what VWC/Vaadin offers. This is the BUILT-CODE auditor — the mock
  already exists as HTML/CSS. (For assessing a Figma design or screenshot during
  planning, that's a different skill: vwc-assess-components.) Produces a
  component-assessment.md report; it never edits the mock.
---

# Assess Mock Components

Audit an already-built HTML prototype in this repo against the Vector Web
Components (VWC/Vaadin) library, and confirm its colors map to Vector theme
tokens. The output is a `component-assessment.md` report that tells the UX team
two things: **(1)** are the components used correctly and is anything reinvented
in custom HTML/CSS that VWC already provides, and **(2)** do the hardcoded color
values match semantic theme tokens.

This skill **reads and reports — it never edits the mock.** The team uses the
report to decide what to change.

## Why this is two-sided (read this first)

The easy half of the audit is validating the VWC tags the mock already uses —
correct tag name, correct theme attribute, correct props. Do that, but it is not
where the value is.

The valuable half is finding **custom HTML/CSS that should have been a VWC
component**. A mock that hand-rolls a `<div>`-based pagination strip, a custom
dropdown menu, or a CSS pill badge is "working" but is reinventing
`vwc-paginator`, `vaadin-popover`, and `vwc-badge`. Catching these is the whole
point — so you must walk the **full component index** against the mock's custom
markup, not just check the tags that happen to be present.

## Step 1 — Resolve the context versions (do not hardcode)

The repo's component and theme references live under versioned directories that
change as the library is bumped. CLAUDE.md's version numbers drift behind the
actual folders, so **discover them at runtime** rather than trusting any
hardcoded path:

```bash
ls -d context/core/v*/   context/themes/v*/
```

Use the highest version directory found for each. The two reference files are:

- `context/core/<ver>/CONTEXT.md` — the component index; each row links to that
  component's own CONTEXT.md under `internal/components/.../CONTEXT.md` with full
  props, themes, and slots.
- `context/themes/<ver>/CONTEXT.md` — every design token with its exact value.

Also read the versions the **mock itself** loads from the CDN (the `core.iife.js`
and `themes/.../styles.js` `<script>` URLs in its `<head>`). If the mock's CDN
version differs from the context-file version, note the gap in the report header
— a component or token may exist in the context files but not in the older
bundle the mock actually loads (or vice-versa). That's real signal, not an error.

## Step 2 — Extract what the mock actually uses

Read the mock's HTML in full. Then pull two inventories:

**Custom elements in use** — every `vaadin-*` / `vwc-*` tag and the `theme=`
attribute on each:

```bash
grep -oE '<(vaadin|vwc)-[a-z-]+' <mock>/index.html | sort | uniq -c
```

**Hardcoded color values** — hex, rgb/rgba, hsl in the `<style>`/CSS:

```bash
grep -noE '#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)' <mock>/index.html | sort -u
```

These greps are a starting net, not the truth — read the markup yourself to
understand intent. A `<div class="badge">` with background CSS is a custom badge
even though no `vwc-` tag appears; the grep won't flag it but your reading must.

## Step 3 — Component coverage (the two-sided audit)

Build one row per distinct design element. Two passes:

1. **Validate what's used.** For each VWC/Vaadin tag found, open its linked
   CONTEXT.md and confirm the tag name, `theme=` value, and props are real and
   correct. Per this repo's CLAUDE.md, **never invent or assume tag/prop names** —
   if it's not in the context file, verify against Storybook MCP
   (`mcp__storybook__get-documentation`) or flag it. Remember every Vaadin form
   control in this repo should carry `theme="outlined"`.

2. **Hunt for missed components.** Walk the full component index in
   `context/core/<ver>/CONTEXT.md` and ask, for each custom HTML/CSS block in the
   mock: *does a VWC component already do this?* Topnavs, paginators, badges,
   popovers, drawers, tabs, steppers, and tree lists are the usual suspects that
   get hand-rolled.

Status legend:

| Status | Meaning |
|---|---|
| ✅ Covered | VWC component used, and used correctly |
| ⚠️ Partial | A VWC component exists but the mock uses custom HTML/CSS instead, or composes/configures it in a non-standard way. Say which component and whether the departure looks intentional. |
| ❌ Gap | No suitable VWC component exists — candidate for a new one |

⚠️ Partial is the most common honest verdict and the most useful — a deliberate
visual departure (e.g. a custom topbar) is fine to keep for a prototype; say so
rather than forcing it to ❌.

## Step 4 — Theme token audit (quote values, never recall)

For each distinct hardcoded color, find the nearest semantic token in
`context/themes/<ver>/CONTEXT.md` and report the match.

**Read every token value out of the themes CONTEXT.md at assessment time. Do not
recall token values from memory — a confidently wrong `--lumo-contrast = #1a1a1a`
destroys the report's value.** Quote the value exactly as the file states it.

Classify each:

| Status | Meaning |
|---|---|
| ✅ Match | Hardcoded value equals the token value — recommend swapping to the token |
| ⚠️ Off | Close to a semantic token but not equal — recommend the token; note the small color shift |
| ⚠️ No direct match | A custom tint with no real token equivalent — note it; don't force a bad match |

Prefer semantic tokens (`--lumo-primary-color`, `--lumo-error-text-color`,
`--lumo-contrast-10pct`, …) over raw values. Tints follow the `-NNpct` naming
(`--lumo-primary-color-10pct`).

## Step 5 — Gap requirements (only for true ❌ gaps)

For each ❌ Gap, before writing a spec, ask the user a couple of targeted
questions (primary action, variants/states, events, similar patterns elsewhere) —
incomplete requirements cause more rework than none. Frame the spec as a
**general-purpose shared component**, not a one-off for this mock. Use this
structure (see the worked example referenced below):

`Description` · `Use Cases` · `API` (props table) · `Events` · `Slots` ·
`Variants / States` · `Design Tokens` · `Accessibility` · `Related Components` ·
`Open Questions`

If a gap is design-blocked (open decisions before a spec is possible), record it
as a short "documented gap" with the outstanding decisions instead of a full
spec.

## Step 6 — Write the report

Write to `component-assessment.md` **in the mock's own folder** (next to its
`index.html`). Follow this structure:

```markdown
# Component Assessment
## <Mock name> — <relative path to index.html>

**Source**: Local file
**Date**: <today, YYYY-MM-DD>
**Mock loads (CDN)**: core <ver>, themes <ver>
**Assessed against (repo context)**: core <ver>, themes <ver>
<!-- If those two differ, add a one-line ⚠️ note about the gap. -->

---

## Design Element Coverage
| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
...

---

## Design Token Usage
| Color in Mock | Nearest Token | Token Value | Status |
|---|---|---|---|
...

---

## Gap Component Requirements
<!-- One section per ❌ Gap; omit this whole section if there are none. -->

---

## Summary
| Category | Count |
|---|---|
| ✅ Covered | N |
| ⚠️ Partial | N |
| ❌ Gap | N |

**Key takeaways:** 3–5 bullets — what's solid, the most notable underused
components, and any gaps worth a new component.
```

A fully worked example of this exact format lives at
`products/Evaluations/manage-events/component-assessment.md` — read it if you
want a concrete reference for depth and tone. (It was generated against an older
library version, so its specific gaps may now be covered — that's expected.)

## Common mistakes

| Mistake | Fix |
|---|---|
| Only checking the tags that are present | Walk the full index for hand-rolled custom HTML/CSS too (Step 3 pass 2) |
| Recalling token values from memory | Quote every value from themes CONTEXT.md at assessment time |
| Hardcoding `v1.22.x` / `v1.9.x` paths | Resolve the latest `context/core/v*` and `context/themes/v*` dirs at runtime |
| Calling a deliberate visual departure a ❌ Gap | If a VWC component exists but was intentionally not used, that's ⚠️ Partial — say why |
| Editing the mock to "fix" findings | This skill reports only; the team decides what to change |
| Writing gap specs before asking the user | Ask the targeted questions first (Step 5) |
