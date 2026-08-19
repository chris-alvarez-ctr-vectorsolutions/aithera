# Mock Definition template

Write the output to `mock-definition.md` at the **feature root** (next to the
loader `index.html`). Use this structure. Omit a section only if it genuinely
does not apply, and say why rather than leaving it silently blank.

Tables use these status markers consistently:

- **❌** — absent / not addressed
- **⚠️** — partial or intentional-but-unspecified
- **✅** — present and correct

---

```markdown
# Mock Definition — <Feature name>

**Mock**: <relative path to the chosen verN/index.html>
**Version handed off**: <label, e.g. V1 — or the name for a kept variant>
**PRD source**: <file path / Confluence URL / Jira key / "pasted" / "none provided">
**Date**: <YYYY-MM-DDThh:mm:ssTZD>
**Components confirmed against**: core <ver>, themes <ver>  <!-- omit if component confirmation was skipped -->

> **Read this first.** This document captures what the visual mock cannot show on
> its own: which requirements it satisfies, where it diverges from the PRD, the
> edge cases still to build, and the Vector components to use. Pair it with the
> mock's flow-map **DEV-NOTES.md** for per-screen detail.

---

## Summary

<2–4 sentences: what the feature is, what state the mock represents, and what is
in / out of scope for this handoff.>

## Reconciliation

<!--
No PRD / requirements document was provided: omit "Requirements missed in the
mock" and "In the mock but not in the requirements doc" entirely — there is
nothing to reconcile against. Only "Potential gaps" applies in that case, and
should run on its own under this heading.
-->

### Requirements missed in the mock (PRD → mock)

| PRD requirement | In mock? | Notes / where it belongs |
|---|---|---|
| <requirement or acceptance criterion> | ❌ / ⚠️ | <what's missing and where it should live> |

### In the mock but not in the requirements doc (mock → PRD)

| Mock element / behavior | In PRD? | Recommendation |
|---|---|---|
| <element or interaction> | ❌ Not specified | Flag to PM: add to PRD, or confirm intentional |

### Potential gaps

Walk each screen/feature against: empty · loading · error/failure · permission/
role · validation · boundary (min/max/long text/overflow) · concurrency ·
offline · zero-results · destructive-action confirmation.

| Area / screen | Edge case | Current handling | What's needed |
|---|---|---|---|
| <area> | <e.g. empty list> | none | <e.g. show empty state with CTA> |

## Behavior & data (not visible in the mock)

- **Data sources**: <where each list/field comes from; mock vs. real data notes>
- **Validation rules**: <field constraints, required/optional, formats, limits>
- **States & transitions**: <what changes on action; loading/success/error flows>
- **Interactions / navigation**: <what each control does; routing between screens>
- **Permissions / roles**: <who sees or can do what>

## Component confirmation

<If audit-mock-vwc ran: it runs **embedded** and there is no separate
`component-assessment.md` — paste its full report body right here as this
section. Lead with the ✅/⚠️/❌ Summary counts and key takeaways, then include the
full Design Element Coverage and Design Token Usage tables (and any Gap
Component Requirements) inline as `###` subsections. The audit's own `##`
headings come in demoted to `###` so they nest under this section. If skipped:
state that the work is deliberately bespoke / not targeting the Vector design
system, and why.>

## Open questions

<Decisions the dev team or PM must resolve before or while building — one bullet
each. Pull unresolved items from Reconciliation and Component confirmation here
so nothing is lost.>

## Handoff notes

- Per-screen developer detail lives in the flow map's **`DEV-NOTES.md`** next to
  this mock — open the flow map and drill into each node.
- ⚠️ **The toolbox dock and flow-map button are review tooling — do not ship
  them.** For production, strip the single `<script src=".../toolbox.js">` include
  from the page. The dock pill, comment widget, and flow map are not part of the
  product design.
```
