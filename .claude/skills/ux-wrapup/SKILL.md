---
name: ux-wrapup
description: >
  Use to WRAP UP a completed mock in this ux-mockups repo and hand it off to the
  dev team. This is the single skill for the whole "the mock is done" phase — it
  reconciles the mock against its PRD (finding requirements the mock missed,
  things built that the PRD never specified, and edge cases missing from both),
  conditionally confirms Vector Web Component usage, writes a mock-definition.md
  build brief, refreshes the flow map's DEV-NOTES.md, and produces the
  dev_handoff.html build. Trigger on "wrap up this mock", "the mockup is
  complete", "this is ready for dev", "ready for handoff", "it's dev-handoff
  time", "hand this off", "reconcile this against the PRD", "generate the mock
  definition", or any request to finalize/hand off a finished prototype. It reads
  and reports — it never rewrites the design. Do NOT use for building or editing a
  mock (that's normal design work) or for auditing components on their own (that's
  audit-mock-vwc).
---

# UX Wrap-Up (mock completion & dev handoff)

The designer has finished a mock and wants to hand it to developers. This skill
owns that entire phase. Its central value is the **PRD reconciliation**: a mock
is a picture, and a picture cannot tell a developer which requirements it
actually satisfies, where it quietly drifted from the spec, or which states were
never drawn. This skill surfaces all three, confirms the Vector components to
build with, and packages everything the dev team (and the Claude session that
implements it) needs alongside the mock.

**This skill reads and reports — it never rewrites the design.** It produces
documents and a byte-copy handoff build; it does not "fix" the mock. If it finds
gaps, it writes them down for the team to decide on. The one exception is
**Phase 0.5**, which *relocates* a legacy flat mock into the standard feature
folder so the rest of the pipeline can see it — that moves and rewires files, but
still changes nothing about the design itself.

## Outputs at a glance

Everything lands next to the mock's feature-root `index.html`:

| File | Purpose | Consumer |
|---|---|---|
| `mock-definition.md` | **Read-me-first build brief** — reconciliation, behavior/data specs, and the full component assessment folded into its Component confirmation section | Dev team + the implementing Claude session |
| `DEV-NOTES.md` | Per-screen annotations rendered inside the flow map | Flow map UI (parsed by `flow-map.js`) |
| `dev_handoff.html` | Copy of the chosen version with comments off, flow map on | Developers reviewing the build |

The component audit is **not** a separate file in this flow — `audit-mock-vwc`
runs embedded and its report becomes `mock-definition.md`'s Component
confirmation section (Phase 3). It only writes a standalone
`component-assessment.md` when run on its own, outside this wrap-up.

`mock-definition.md` is the new entry point; `DEV-NOTES.md` is the per-screen
detail layer the flow map needs (see Phase 5 — its filename and section format
are a hard contract, don't rename it).

## Run these phases in order

### Phase 0 — Pick the version FIRST (before anything else)

Feature folders are versioned: the design lives in separate **`verN/index.html`**
files listed in **`versions.json`**, behind the feature-root loader `index.html`.
Read `versions.json` to see which versions exist. Then:

- **Exactly ONE version (or a legacy flat mock, which becomes `ver1` in Phase 0.5):
  do NOT ask — proceed silently with that version.** One version means the choice
  is already made; asking "which version?" when there's only one is noise. This is
  the common case — most mocks launch a single version — so the wrap-up should run
  start-to-finish without a version question.
- **More than one version: STOP and ask** which to hand off (name them by their
  `label`, e.g. "V1 or V2?"), so the handoff doesn't carry dead variants. A legacy
  in-file `.version-switcher` V1/V2 pill counts as multiple versions too — same
  question applies.

Details for the two cases:

- If they keep **one** version, build the handoff from that version's file.
- If they intentionally keep **more than one** (e.g. an **alpha** and a **beta**
  both going to dev), **ask what to name each**, then produce one set of outputs
  per kept version, named accordingly (e.g. `dev_handoff_alpha.html`).
- Never guess which version to keep or what to call it.

Everything below operates on the **chosen version's file** (`verN/index.html`),
never the feature-root loader `index.html` — the loader has no design in it.

### Phase 0.5 — Legacy flat mock? Fold it into a feature folder NOW (not before)

Many older mocks predate the versioned-folder structure: they live as loose
`.html` files directly in the product folder, often without the Design Toolbox.
**Leave them alone while design iterates — never retrofit versioning or the
toolbox onto an old mock outside a wrap-up, and never flag a designer for it.**
But the moment one is declared ready for dev, it gets the standard shape first,
because the dashboard automation (Phase 7) only detects a `dev_handoff.html`
beside a feature's `index.html` — it can NEVER flip the card for a flat file, and
hand-approximating it loses the flow map and the GitHub dev links (this is exactly
how the EHS "Mobile App — Main" handoff went wrong in Jul 2026):

1. Scaffold the feature folder exactly as for a new mock (see CLAUDE.md, "For a
   NEW mock"): `products/<Product>/<feature>/` with the loader `index.html`
   (copied verbatim from `base-template/index.html`), a single-entry
   `versions.json`, and the design file **moved** to `ver1/index.html`.
2. Add the Design Toolbox include to the design file (comments **enabled**), and
   fix any repo-root-relative asset paths for the new depth (`../../../../…`).
3. Update the mock's `rel` in `products.json` in the **same commit** (pre-commit
   Guard A2 enforces this), and **re-share the new URL** — the old flat-file link
   404s for anyone holding it.
4. Continue with Phases 1–8 exactly as for any other mock. The `dev_handoff.html`
   goes at the new feature root — **never floating loose in the product folder**.

**Never** add a separate dashboard card that points at a dev build, and **never**
hand-pin `"status": "ready-for-dev"` on a flat-file mock — a handoff is a *state*
of the existing mock's card, not a new card. `scripts/check-dev-handoff.js`
(pre-commit Guard A3 + the check-mock-structure CI workflow) blocks all of this
for NEW handoffs; handoffs that predate the guard are grandfathered silently.

This is the **one** place the wrap-up is allowed to restructure files. It moves
and rewires — it still does not redesign.

### Phase 1 — Get the PRD (optional for smaller work)

The reconciliation is richest with source-of-truth requirements, but a PRD isn't
mandatory — small work items legitimately have none. The PRD can arrive as:

- **A local file** — a path to `.md` / `.txt` / `.pdf` / `.docx` in or near the
  repo. Read it directly.
- **Pasted text** — the designer drops the PRD into chat.
- **Confluence / Jira** — the PRD lives in Confluence or is tracked as a Jira
  issue. Pull it with the **Atlassian MCP** (search/fetch the page or issue by
  URL or key). If the Atlassian tools aren't loaded, load them via ToolSearch.

If **no PRD or other requirements document is available**, say so and ask the
designer whether to proceed with a mock-only definition. If they confirm: every
other section of the template still applies, but in **Reconciliation**, omit
**Requirements missed in the mock** and **In the mock but not in the
requirements doc** entirely — there's nothing to reconcile against — and run
**only Potential gaps** (Phase 2). Don't invent requirements to fill the
omitted subsections.

### Phase 2 — Reconcile the mock (the core)

Read the PRD (if one exists) and the chosen `verN/index.html` in full, then
produce the **Reconciliation** section. With a PRD, this is a **three-way gap
analysis**; with no PRD (Phase 1), only the third pass applies. Each pass
catches a different, real failure mode:

1. **Requirements missed in the mock (PRD → mock).** For every requirement,
   acceptance criterion, and user story in the PRD, is it represented in the
   mock? Mark ❌ Missing or ⚠️ Partial and say where it should live. This is the
   classic "we forgot to design the export button" catch. *(Skip when no PRD.)*

2. **In the mock but not in the requirements doc (mock → PRD).** For every
   meaningful element and behavior in the mock, is it called out in the PRD?
   Things built but never specified aren't necessarily wrong — but they're
   scope the PM should knowingly accept. Flag each as "add to PRD, or confirm
   intentional." This is the "who decided we're adding bulk-select?" catch.
   *(Skip when no PRD.)*

3. **Potential gaps.** The mock shows the happy path and the PRD (when one
   exists) often assumes it. Walk this checklist per screen/feature and flag
   anything neither the mock nor the requirements address: **empty · loading ·
   error/failure · permission/role · validation · boundary (min/max/long
   text/overflow) · concurrency · offline · zero-results/search-miss ·
   destructive-action confirmation.** These are the states developers otherwise
   discover in QA. *(Always runs, PRD or not.)*

Be specific and honest — a deliberate visual departure is fine, just name it as
intentional rather than forcing it into a "gap."

### Phase 3 — Confirm component needs (conditional)

**Indicator:** run the component confirmation when **either** the chosen mock uses
real Vector components **or** the PRD calls for the Vector design system.

Detect real component usage:

```bash
grep -oE '<(vaadin|vwc)-[a-z-]+' <feature>/verN/index.html | sort -u
```

Any `vaadin-*` / `vwc-*` hits → the mock targets the design system. Also scan the
PRD for "Vector", "VWC", "design system", or named components.

- **If the indicator fires:** invoke the **`audit-mock-vwc`** skill (via the
  Skill tool) on the chosen `verN/index.html`, and tell it you want **embedded
  output** (pass this in the Skill call's `args`, e.g. `embedded output for
  ux-wrapup — do not write component-assessment.md`). In embedded mode it does
  **not** write a standalone `component-assessment.md`; it hands back the report
  body already demoted to nest under `## Component confirmation`. Drop that
  content straight into `mock-definition.md`'s Component confirmation section
  (Phase 4). Don't re-derive the audit here, and don't also write a separate
  file — the whole point is one consolidated brief.
- **If the work is deliberately bespoke** — intentionally custom UI *not* meant
  to use the Vector design system — **skip** it and say so in that section. Note
  the trap: "no VWC tags yet" is **not** the same as "deliberately custom." A rough
  hand-rolled mock that was *supposed* to use Vector is exactly the case
  `audit-mock-vwc` exists to catch, so only skip on genuine intent to be
  bespoke.

### Phase 4 — Write `mock-definition.md`

Write it at the **feature root** (next to the loader `index.html`). Follow the
template in `references/mock-definition-template.md` exactly — read that file now
for the full structure. In brief: Summary · Reconciliation (Phase 2 — the
three-way analysis, or Potential-gaps-only when no PRD was provided) · Behavior
& data not visible in the mock · Component confirmation (Phase 3 — paste the
embedded audit body here, not a link to a separate file) · Open questions ·
Handoff notes (including the "do not ship the toolbox" warning).

Keep it the cross-cutting brief; push per-screen specifics into `DEV-NOTES.md`
(Phase 5) and reference it, rather than duplicating every element twice.

### Phase 5 — Refresh `DEV-NOTES.md` (the flow map's per-screen layer)

`DEV-NOTES.md` is **not just a document — it's a contract with the flow map.**
`flow-map.js` fetches a file named exactly `DEV-NOTES.md` from the mock's folder
and renders each **`## <node name>`** section as that screen's dev-notes drawer.
So:

- **Keep the filename `DEV-NOTES.md`** and the **`## <node name>`** section
  headings matching the flow-map node labels — renaming or restructuring breaks
  the drawer. (Format details: `designtoolbox/README.md`, "Dev notes file
  format".)
- For **every node/screen** in the flow map, write the developer annotations:
  what each element is, **the VWC/Vaadin component it maps to** (fold in Phase 3
  findings), states, per-screen edge cases, and — critically — **every place a
  change was made on the page that a developer needs to build.**
- **Annotations live ONLY inside the flow map's dev notes — never as elements
  added to the page.** The design stays clean; developers drill into the flow map
  for per-screen detail while still seeing the whole flow at once.
- Include the **"do not ship the toolbox" warning** (Phase 6) in `DEV-NOTES.md`
  too.

Derive these from the same analysis you did in Phase 2 so you're not doing the
reading twice.

### Phase 6 — Build `dev_handoff.html`

Copy the **chosen version's file** (`verN/index.html`) to **`dev_handoff.html`**
at the **feature root** — next to the loader `index.html`, NOT inside `verN/`.
That placement is required: `scripts/build-dashboards.js` only detects a dev
build named `dev_handoff.html` (or a custom name set via `meta.json`) sitting
beside the feature's `index.html`. Produce one per kept version, named per
Phase 0 (e.g. `dev_handoff_alpha.html`).

Because the copy moves **up one folder** (from `verN/` to the feature root),
**fix any repo-root-relative paths by removing one `../`** — most importantly the
toolbox include changes from `../../../../designtoolbox/toolbox.js` to
`../../../designtoolbox/toolbox.js`. Then, in the copy, **before the
`toolbox.js` include**, add:

```html
<script>window.TOOLBOX = { comments: false };</script>
```

This **hides the entire comment feature** (the pin-and-comment widget *and* the
flow map's 💬 comment-count chips) while **keeping the flow map on** so developers
still get the screens, live thumbnails, and dev-note annotations. Keep the mock's
`applyFlowState` / `bootFromHash` so the flow map and thumbnails work. **Do not
hand-rewrite the design** — the dev build is a byte copy of the chosen version,
only with comments off.

**The toolbox dock is NOT part of the product.** The bottom-center toolbox pill
and its 🗺 Flow Map button are review/handoff tooling only. State prominently in
`mock-definition.md` and `DEV-NOTES.md`: **developers must NOT ship the
`toolbox.js` include, the dock pill, or the flow map button** — strip that one
`<script src=".../toolbox.js">` line for production.

### Phase 7 — Dashboard (automatic)

No manual dashboard edit is needed. On push, `scripts/build-dashboards.js`
detects `dev_handoff.html` and flips the product-dashboard card to **Ready for
Dev**: the status pill updates to "Ready for Dev", the Dev Page + Dev HTML links
render first with a "View Dev Build" button, and the original design links
collapse into a "Designer file" drawer. For a non-default filename like
`dev_handoff_alpha.html`, set `devHandoff: "dev_handoff_alpha.html"` in the
mock's `meta.json` entry.

The dev-handoff file **drives the "Ready for Dev" status pill** — so either leave
the mock's `status` unset in `meta.json` (the file alone flips it) or set
`"status": "ready-for-dev"` explicitly. Don't leave a stale `status` like
`"in-progress"` pinned, or the pill won't update.

### Phase 8 — Commit and share

Commit the new files, then give the designer the dev build's **GitHub Pages URL**
(the "Dev Page" link).

## Common mistakes

| Mistake | Fix |
|---|---|
| Running against the feature-root loader `index.html` | It has no design — always use the chosen `verN/index.html` |
| Asking "which version?" when `versions.json` has only one entry | One version = the choice is already made; proceed silently (Phase 0) |
| Handing off a legacy flat mock as-is, or bolting a `dev_handoff.html` beside it | Fold it into a feature folder first — the dashboard can't flip a flat file (Phase 0.5) |
| Retrofitting versioning/toolbox onto an old mock mid-design | That only happens at wrap-up time, never while design iterates (Phase 0.5) |
| Only checking PRD → mock | Reconcile **both** directions plus Potential gaps when a PRD exists (Phase 2) |
| Running the full three-way reconciliation when no PRD was provided | Only run Potential gaps — there's nothing to reconcile Requirements-missed/In-mock-not-in-PRD against (Phase 1) |
| Renaming `DEV-NOTES.md` or its `## <node>` headings | The flow map parses that exact filename/format — keep the contract (Phase 5) |
| Skipping `audit-mock-vwc` because there are no VWC tags | "No tags yet" ≠ "deliberately bespoke" — skip only on true intent to be custom (Phase 3) |
| Editing the mock to "fix" findings | This skill reports only; the team decides what to change |
| Inventing requirements when no PRD exists | Say the PRD is missing; do mock-only definition + Potential gaps only |
| Putting `dev_handoff.html` inside `verN/` | It must sit at the feature root beside the loader, or the dashboard won't detect it |
