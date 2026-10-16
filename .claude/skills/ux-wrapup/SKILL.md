---
name: ux-wrapup
description: >
  Use to REVIEW, WRAP UP, or hand off a mock in this ux-mockups repo, and to make
  a change to a mock that was already handed off. This is the single skill for
  the whole "the mock is nearly done / done" phase: In Review (reconcile the mock
  against its PRD — requirements the mock missed, things built that the PRD never
  specified, claims the mock makes that the PRD doesn't support, and edge cases
  missing from both — and write mock-definition.md, no dev build), Ready for Dev
  (all of that plus DEV-NOTES.md and the dev_handoff.html build), and post-handoff
  changes (nothing locks; changes are timestamped against the handoff). Trigger on
  "put this in review", "move this to review", "review stage", "check this against
  the PRD", "catch anything that doesn't match the PRD", "wrap up this mock", "the
  mockup is complete", "this is ready for dev", "ready for handoff", "it's
  dev-handoff time", "hand this off", "reconcile this against the PRD", "generate
  the mock definition", or any request to change a mock whose card is Ready for
  Dev. It reads and reports — it never rewrites the design. Do NOT use for building or editing a
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

## Three stages — nothing locks

| Stage | Dashboard pill | What puts the card there | What this skill does |
|---|---|---|---|
| In progress | In Progress | the default — nothing set | nothing; this is normal design work |
| In review | In Review | `"status": "in-review"` on the mock's item in `products.json` | **Review mode** — Phases 0–5, no dev build |
| Ready for dev | Ready for Dev | a `dev_handoff.html` at the feature root (the file flips the card) | **Handoff mode** — every phase |

**None of these stages locks the mock.** Designers keep iterating during review
and after handoff. What changes from stage to stage is how carefully a change is
written down. In review, findings land in `mock-definition.md`. After handoff,
every change is timestamped against the handoff date, and the dashboard card
lists them so developers can see what moved (see **After handoff** below).

## Review mode — "put this in review", "check it against the PRD"

The mock is close to done but not handed off. Review is the chance to catch
mistakes before developers see them. That includes anything Claude wrote into
the mock that sounds authoritative but the PRD never said: a threshold, a
formula, a rule in a tooltip, a filter quietly dropped in an earlier iteration.

Run Phases 0–5 below with these differences:

1. **Phase 0 (version).** With more than one version, ask which is the review
   candidate. If the versions differ only in demo data (a populated vs. empty
   state, say), don't ask: review the first and note the others in the Summary.
   Nothing is pruned at review; every version stays.
2. **Phase 0.5 (legacy fold): skip.** Flat mocks are folded only at handoff. For a
   flat mock, write the review doc beside the file as
   `<file-stem>.mock-definition.md`.
3. **Phase 2 (reconcile): run all four passes**, including **Claims to verify**.
   That pass is the main reason review exists.
4. **Phase 4 (`mock-definition.md`):** set `**Stage**: In review` and
   `**Reviewed**: <date>`; leave `**Handed off**: not yet`.
5. **Phase 5 (`DEV-NOTES.md`):** draft it at the feature root, where the dev
   build will read it. It stays hidden on the design build, so a draft is
   harmless and saves work at handoff.
6. **Skip Phase 6.** No dev build at review.
7. **Set the stage.** Add `"status": "in-review"` to the mock's item in
   `products.json` and bump its `modified` date. Commit and push (see Phase 8).
7a. **Design Jira ticket (Phase 7.5):** move it to In Review and bring its
   description up to date.
8. **Report in chat:** the count of findings per pass, the few that matter most
   (missed requirements and claims that contradict the PRD first), and the
   GitHub link to `mock-definition.md`. Say plainly that nothing is locked.

Review mode still never edits the design. If the designer then asks to fix
findings, that is normal design work. Afterwards, re-check the affected rows and
update `mock-definition.md` so it stays true.

## Handoff mode — "ready for dev"

Run every phase. **Before Phase 0**, if the item has a `designJira` key (Phase 7.5),
ask in one line: *"Flip <UX-key> to Done before I hand this off?"* Act on the
answer in Phase 7.5.

If the mock already went through review (a
`mock-definition.md` with `**Stage**: In review` exists), don't start over:

- Read it, then list what changed since the review date with
  `git log --since=<Reviewed date> --oneline -- <feature folder>`. Re-verify the
  rows those commits touch, plus every row still marked ❌ or ⚠️.
- Set `**Stage**: Ready for dev` and `**Handed off**: <date> from <version label>`,
  and add the first row of the **Handoff log**.
- Remove `"status": "in-review"` from the item in `products.json`. The dev build
  flips the card on its own. The dashboard also shows Ready for Dev when a dev
  build exists and `in-review` was left behind, but clean it up anyway.

## After handoff — changes are welcome, and they get timestamped

A handoff is a **timestamped checkpoint, not a lock**. The dashboard reads the
handoff date from git (the commit that added `dev_handoff.html`) and the version
from the build's `DEV-HANDOFF` marker (Phase 6). It then lists every later
commit to the mock under **Changed since handoff** on the card. When the
handed-off version file changes after the dev build was last re-synced, the card
also warns that the dev build is behind the design.

When a designer asks to change a mock whose card is Ready for Dev (a
`dev_handoff.html` sits at its feature root):

1. **Say so first, in one line**: "This was handed off to dev on <date> from
   <version>. I'll log this as a post-handoff change." Read the date from the
   Handoff log, or from `git log --diff-filter=A -1 --format=%ad --date=short -- <feature>/dev_handoff.html`.
2. **Pick the path.** Ask only when it's genuinely unclear.
   - **Small fix or polish** (copy, spacing, a missed empty state, a bug): edit
     the handed-off version, then **re-sync the dev build** by repeating Phase 6
     (re-copy; keep the marker). Devs see the fix on the same link.
   - **A real change in behavior or scope** (a requirement, a flow, a data rule):
     **spin off a new version** (`cp -r verN verN+1`, add it to `versions.json`)
     and change that. The handed-off version and its dev build stay as the
     reference devs are building against. Hand the new version off later with
     this skill.
3. **Log it.** Add a dated row to the Handoff log in `mock-definition.md`: what
   changed, which version, whether the dev build was re-synced, whether devs
   were told. If the change resolves or reopens a reconciliation row, update
   that row too.
4. **Write the commit subject as a changelog line.** It shows up verbatim under
   Changed since handoff on the card.
5. **Tell the designer to tell dev.** The card records the change but notifies
   nobody. End with a short ready-to-paste Slack/Jira note: what changed, the
   date, and the dev build link.

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

4. **Claims to verify (mistakes and hallucinations).** A mock built with Claude
   can state things that read as settled but were never in the PRD. List every
   factual claim the mock makes and check each one against the PRD text. Look in
   visible copy, tooltips, info callouts, empty states, code comments that
   describe a rule (thresholds, formulas, "per the PRD"), flow-map node
   descriptions, `DEV-NOTES.md`, and the item's `desc` in `products.json`.
   Mark each ✅ Matches (quote the PRD line), ❌ Contradicts (quote both), or
   ⚠️ Not in PRD. Then skim `git log --oneline -- <feature folder>` for anything
   the PRD requires that was **built and later removed** (a filter dropped after a
   review call, say) and list it under Requirements missed, naming the commit that
   removed it. *(No PRD: still list the claims, all as ⚠️, so the PM can confirm
   them.)*

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
for the full structure. In brief: header (Stage · Reviewed · Handed off) ·
Summary · Reconciliation (Phase 2 — all four passes, or Potential gaps + Claims
to verify when no PRD was provided) · Behavior
& data not visible in the mock · Component confirmation (Phase 3 — paste the
embedded audit body here, not a link to a separate file) · Open questions ·
Handoff notes (including the "do not ship the toolbox" warning) · Handoff log.

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

Also add this marker as the line right after `<!DOCTYPE html>`, using the
chosen version's folder name and label from `versions.json`:

```html
<!-- DEV-HANDOFF version="ver1" label="V1" -->
```

The dashboard reads it to name the handed-off version on the card and to tell
when that version's file has moved past the dev build. Keep the marker when you
re-sync the dev build after handoff.

The `comments: false` line **hides the entire comment feature** (the pin-and-comment widget *and* the
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

The card also shows when it was handed off (the date `dev_handoff.html` was
first committed), the version from the `DEV-HANDOFF` marker, a **Changed since
handoff** list of every later commit to the mock, and a warning when the
handed-off version changed after the dev build was last re-synced. A link to
`mock-definition.md` appears on In Review and Ready for Dev cards whenever the
file exists.

The dev-handoff file **drives the "Ready for Dev" status pill** — so either leave
the mock's `status` unset in `meta.json` (the file alone flips it) or set
`"status": "ready-for-dev"` explicitly. Remove an `"in-review"` pin at handoff.
Only `"archived"` still overrides a dev build.

### Phase 7.5 — Design Jira ticket (UX board)

The design ticket is the mock's UX Story on the User Experience board. Its key
(`UX-…`) is in the item's `designJira` in `products.json`, separate from `jira`
(the product ticket) and `prd`. How it's created, plus the CAPEX account and the
description layout, is in CLAUDE.md under **Designer Jira Ticket (new mocks)**.
Use the Atlassian (Rovo) tools; load them via ToolSearch if they aren't loaded.

**`"designJira": false`** (the designer already declined): skip this phase
silently. Don't ask again.

**The designer opted out of design tickets** (a memory says so; see CLAUDE.md
"Don't ask me"): skip this phase silently.

**No `designJira` field at all** (e.g. an older mock, or one made before this
existed):
1. **Look first.** Search the UX board for a ticket that already covers it:
   `project = UX AND summary ~ "<mock name>"`, plus anything linked to the
   product ticket in `jira`. If one turns up, ask: *"Found <UX-key>, '<summary>'.
   Is that this mock's design ticket?"* On a yes, set `designJira` and continue
   below.
2. **None found:** ask, *"This mock has no design Jira ticket. Want me to create
   one?"* Ask Deborah Kim too, because it's an older mock. On a yes, create it
   per CLAUDE.md and continue below. On a no, set `"designJira": false` and skip
   this phase. If they say not to ask again, record the opt-out (CLAUDE.md
   "Don't ask me").

**Review mode:**
1. **Status:** transition the ticket to **In Review**.
2. **Description:** read it against the design as it stands now: the
   `versions.json` labels, each version's screens, and the card's `desc`. Rewrite
   any sentence or version bullet that no longer matches (versions added, renamed
   or dropped; scope that moved). Keep the layout: summary line, `**Mock:**`,
   versions, `**PRD:**`. Don't add a changelog. The description should simply be
   true.
3. **Mock link:** it must be the feature folder's GitHub Pages URL (the loader,
   not a `verN/` file), and it must load. Check with
   `curl -s -o /dev/null -w "%{http_code}"` and expect `200`. Fix it if the mock
   moved.
4. **PRD:** if the card has a `prd` (or Phase 1 found one), put that link on the
   `**PRD:**` line.

**Handoff mode:** use the answer to the question asked before Phase 0. On a yes,
transition the ticket to **Done**. On a no, leave it alone. Either way, make sure
the `**PRD:**` line matches the card's `prd`.

Report what changed on the ticket in one line in the final chat message.

### Phase 8 — Commit and share

Commit and push the new files, then give the designer the links. At handoff
that is the dev build's **GitHub Pages URL** (the "Dev Page" link). At review it
is the mock's Pages URL and the GitHub link to `mock-definition.md`. The
dashboard picks up a `products.json` status change on push.

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
| Treating review or handoff as a lock, or refusing a post-handoff edit | Nothing locks. Make the change, log it in the Handoff log, re-sync or spin off a version |
| Editing a handed-off mock without saying so | Name the handoff date first, then log the change and give the designer a note for dev |
| Skipping Claims to verify because the mock "looks right" | Hallucinated rules look right by design; check each claim against the PRD text |
| Building `dev_handoff.html` during review | Review stops at Phase 5; the dev build is the handoff |
| Leaving `"status": "in-review"` pinned after handoff | Remove it in Handoff mode |
| Flipping the design ticket to Done without asking | Ask before handoff; transition only on a yes (Phase 7.5) |
| Moving the ticket to In Review but leaving an outdated description | Rewrite whatever no longer matches the design, and re-check the mock link and PRD (Phase 7.5) |
| Creating a design ticket for an older mock unprompted | Ask the designer first (Phase 7.5) |
| Asking again after a designer declined a design ticket | `"designJira": false` skips that mock; an opt-out memory skips the designer (Phase 7.5) |
| Offering to create a design ticket without searching first | Search the UX board; a ticket may already exist (Phase 7.5) |
| Putting the design ticket in `jira` | `jira` is the product ticket; the design ticket goes in `designJira` |
| Putting `dev_handoff.html` inside `verN/` | It must sit at the feature root beside the loader, or the dashboard won't detect it |
