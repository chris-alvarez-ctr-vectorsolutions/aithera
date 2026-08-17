# Mock Definition — Evaluation Form

**Mock**: `ver1/index.html`
**Version handed off**: V1
**PRD source**: none provided (see *Reconciliation* — two partial feature specs exist)
**Date**: 2026-08-17
**Components confirmed against**: core v1.19.0, themes v1.5.0 (loaded); assessed against vendored `context/` core v1.22.3, themes v1.9.3

> **Read this first.** This document captures what the visual mock cannot show on
> its own: which requirements it satisfies, where it diverges from the spec, the
> edge cases still to build, and the Vector components to use. Pair it with
> [`DEV-NOTES.md`](DEV-NOTES.md) for feature-by-feature detail.

---

## Summary

A single-page prototype of the Evaluations **evaluation form** — the form an
evaluator fills in against an educator. It is a complete visual catalog of all
**19 question/step types** plus the surrounding workflow: a top toolbar with save
and an actions menu, resizable video-review and attachments drawers, a
chat-style script step, a paired start/stop timer, a recoverable deleted state,
side-by-side form comparison in read-only mode, and five dialogs (Change Log,
Quick Search, Copy Form, Share, and signature confirmations).

**State represented**: a form mid-completion, with every type seeded so each
renders at least once. All data is hardcoded; there are no network calls and no
persistence — a reload loses everything.

**In scope for this handoff**: the visual design, interaction behavior, and
component mapping for all of the above. **Out of scope**: any backend, real
authentication or role enforcement, and the course-recommendations panel (a
prototype experiment, flagged below rather than specified).

⚠️ **Two things in the mock read as finished but are not.** The **locking
signature does not lock anything** (the lock is copy only), and the submit
validation path (`handleSubmit`) is **dead code that nothing calls**. Both are
called out in Open questions — don't infer either behavior from the mock.

## Reconciliation

**No PRD was provided for this mock.** The only PRD in the repo,
`../course-recs/PRD_Evaluation_Users_Redesign_1.md`, specifies the Evaluation
Users **list** page — a different mock — and was deliberately **not** reconciled
against. Per the wrap-up process, the two PRD-direction subsections are therefore
omitted and only **Potential gaps** applies.

Two **partial feature specs** do exist and are **authoritative for their
features**. Both are real backend field maps from
`VectorLearning/teachpoint-web` (branch `integration/ui-modernization-v2-pd-tracking`):

| Spec | Covers |
|---|---|
| [`../course-recs/form-change-log-value-map.md`](../course-recs/form-change-log-value-map.md) | Change Log dialog — `rubricdatalog` table, both tabs, all enums |
| [`../course-recs/quick-search-report-value-map.md`](../course-recs/quick-search-report-value-map.md) | Quick Search dialog — inputs, output columns, access rules |

Because these two are specified, the mock **was** checked against them. Both
track very closely — and the gaps that remain are all server-side:

| Spec item | In mock? | Notes |
|---|---|---|
| Change Log `SOURCE` enum (§5) | ✅ | Byte-exact, including `3` and `4` both → `RESTORE` |
| Change Log `ACT` verbs (§5) | ✅ | Added / Updated / Deleted / Opened / Rejected |
| Change Log legend format | ✅ | `{Verb} · {Date} · {SOURCE} · {Editor}` |
| All 4 Access types (18–21) | ✅ | Created / Opened / Viewed PDF / Viewed all seeded |
| Access completeness warnings | ✅ | Both strings implemented verbatim |
| Editor "X AS Y" + support-agent masking | ✅ | Implemented |
| Quick Search inputs (§2) | ✅ | All six, plus Select Forms and exclude-self-authored |
| Quick Search 5 output columns (§3) | ✅ | Exact match |
| Sortable columns = Tags, Date only | ✅ | Exact match |
| Quick Search empty state + footnote | ✅ | Real i18n strings |
| Quick Search loading state | ✅ | `.qs-loading` + indeterminate progress bar |
| Change Log row-level visibility (§6) | ❌ | Mock shows all seeded entries; rules are server-side |
| Change Log tab gating on district prefs | ❌ | Both tabs always render |
| Quick Search access rules (§6) | ❌ | No form-access checks, attachment filtering, conditional record link, archived-tag suppression, or question-type gate |
| Quick Search `(More)` past 500 chars | ✅ | Implemented (`~10573`) — corrected on re-verification |
| Quick Search server-side sort / pagination | ❌ | 6 fixed rows, client-side sort only |

### Potential gaps

Walked per screen against: empty · loading · error/failure · permission/role ·
validation · boundary · concurrency · offline · zero-results · destructive-action
confirmation.

| Area / screen | Edge case | Current handling | What's needed |
|---|---|---|---|
| **Everywhere** | Error / failure | **Essentially none.** Clipboard failure is silently swallowed *and still reports success*; no `onerror` on any image | Failure states for save, upload, search, sign, share; retry affordance |
| **Everywhere** | Permission / role | **Not modeled** — "permissions" is copy only, never logic | Real role gating; both field maps specify substantial rules (§6 of each) |
| **Everywhere** | Unsaved changes | **No `beforeunload` handler at all** — Back/Cancel/close discard silently | Dirty-state guard |
| Save / sign / share / copy / assign | Loading | None — assumes instant success | Pending state on the primary action; disable double-submit |
| Recommendations | Loading | **None, despite being presented as an AI action** with an "AI" pill | Thinking/streaming state |
| Signatures | Locking enforcement | 🔴 **"Sign and lock" does not lock** — copy only | Build the actual read-only lock |
| Signatures | Signer identity | **No gating** — any user can sign any block; names from a hardcoded map | Bind to identity; add signer-turn rules |
| Form submit | Submit validation | 🔴 **`handleSubmit()` is dead code** — unreachable | Decide if submit exists; if so, wire it |
| Attachments + video | Upload count / size limits | **Display-only hint text** ("10 files / 120 MB / 1,200 MB video") | Enforce count and both size ceilings client- and server-side, with a per-file error |
| Attachments + video | Upload in progress | None | Per-file progress + cancel |
| Attachments | Unpreviewable file type | ✅ Placeholder tile (filename + info + generic icon) | — |
| Quick Search | Zero results | ✅ *"No data found for report specification."* | — |
| Quick Search | No forms selected | ✅ *"Select at least one form to report on."* | — |
| Quick Search | Long answer text | ✅ 500-char truncation + `(More)` | — |
| Rating tiles | Long criteria text | **No clamp** on `.rubric-tile-body` — one long cell stretches the whole 4-col grid | Clamp or equalize tile heights |
| Form header | Truncated values | Ellipsis with **no `title` attribute** — a clipped email is unrecoverable | Add `title`/tooltip |
| Paired timer | Drift / reload mid-run | 1s `setInterval`, **drifts under tab throttling**; elapsed time never written to form data | Use `Date.now()` deltas (as the session timer does) and persist |
| Change Log | Empty / incomplete access log | ✅ Both warnings implemented | — |
| Change Log | Long form-name / description entries | Untested | Verify wrap/truncation |
| Form submit | Required-field validation | ✅ Itemized list: unrated count, evaluator sig, teacher sig | Confirm the rule set is complete for real forms |
| Destructive actions | Confirmation | ✅ 13 modals — clear all, delete, sign/lock, share, rec discards | — |
| Form | Concurrency | None | Two evaluators on one form; signing an already-signed form; stale-write detection |
| Form | Offline | None | Field map's `SOURCE` enum includes `SYNC` + `MOBILE API`, implying upstream offline capture — define conflict resolution |
| Deleted state | Re-delete / restore race | None | Guard restore on a record deleted again elsewhere |
| Paired timer | Clock drift / reload mid-run | Not modeled | Persist start timestamp; recompute on load rather than counting in-page |
| Script step | Very long message / many replies | Untested | Verify wrap and nesting depth |
| Signatures | Already-shared form | ✅ Checkbox is conditional on not-already-shared | — |
| Course recs panel | — | Prototype experiment | **Confirm whether this ships at all** (see Open questions) |

## Behavior & data (not visible in the mock)

- **Data sources**: everything is hardcoded seed data in `ver1/index.html` — form
  items, change-log entries, quick-search rows, tags, user names, recommendations.
  No network calls. For the two specified features, the real sources are named in
  their field maps: `rubricdatalog` (Change Log — one row per entry, loaded via
  `RubricdatalogDAO.list(userdataId, districtId)` ordered by `created`), and live
  `rubricdata` / `userdata` / attachment / `tag` records for Quick Search, which
  **stores nothing of its own** and is a pure read-only aggregation.
- **Validation rules**: live validation covers conditional rating requirements,
  empty-text refusal on script/annotation edits, and Quick Search's required-forms
  parameter. The submit gate (all components rated + both signatures) exists in
  `handleSubmit()` but is **unreachable** — see the ⚠️ note in Summary. Upload
  limits are **stated but unenforced** (10 files, 120 MB per file, 1,200 MB video).
- **States & transitions**: draft → signed (locking or non-locking), and active ⇄
  deleted via restore. There is deliberately **no submit** ("this is a living
  document"). Non-locking signature leaves the form editable — a **permission
  rule, not a visual difference** — and note the *locking* variant does not
  currently enforce a lock either. Deleted records stay visible and listed with a
  *deleted* status.
- **Sharing is irreversible by design**: "Once shared, access is permanent — it
  cannot be revoked." `setSharedState()` is idempotent and also locks the privacy
  toggle. The share opt-in on signature modals **defaults to checked**.
- **Interactions / navigation**: the toolbar **Back** button has no destination
  wired — hook it to the evaluations list. All dialogs are in-page. Compare mode
  renders a second form read-only beside the first.
- **Permissions / roles**: **nothing is enforced in the mock.** Both field maps
  specify real rules that must be built server-side — see the Reconciliation
  table and Open questions.

## Component confirmation

`audit-mock-vwc` ran embedded against `ver1/index.html`. The mock loads **core
v1.19.0 / themes v1.5.0**, both below the CONTEXT.md publication minimums
(core v1.22.1, themes v1.9.3), so it was assessed against the repo's vendored
`context/` at **core v1.22.3 / themes v1.9.3**. That version delta is itself the
source of the top open question below.

### Summary

| Category | Count |
|---|---|
| ✅ Covered | 22 |
| ⚠️ Partial | 6 |
| ❌ Gap | 0 |

**Key takeaways:**

- **Component adoption is strong and now consistent.** 26 distinct VWC/Vaadin
  element types across ~150 instances. Both repo-wide rules are clean: **0 of 34**
  form inputs missing `theme="outlined"`, and **0 of 51** `vaadin-button`s missing
  a variant.
- **All three previously-flagged ⚠️ Partials were converted and visually
  verified** this round: the Quick Search sort headers → `vwc-sortable-header`,
  the `choose-one` questions → `vaadin-radio-group` + `vaadin-radio-button`, and
  the Change Log tablist → `vaadin-tabs` + `vaadin-tab`.
- **`vaadin-popover` is the one real risk** — see Open questions. Note the honest
  count: **4 declarations**, not the ~17 an earlier grep suggested, because one
  sits inside a template literal (`addTagsBtn-${extrasId}`) and instantiates per
  question.
- **Three additional ⚠️ Partials surfaced on a full read** that a tag-level grep
  misses, because each hand-rolls a control the DS provides: the `choose-one`
  **dropdown** variant, the **privacy** segmented toggle, and the Quick Search
  **forms accordion**. All three are documented as deliberate — see the rows below
  and decide per-item whether to keep the departure.
- **No ❌ Gaps** — nothing here warrants a new shared component.

### Design Element Coverage

| Design Element | VWC Component | Status | Notes |
|---|---|---|---|
| Buttons (51) | `vaadin-button` | ✅ Covered | Every instance carries a variant (`primary` / `secondary` / `tertiary` / `icon`) |
| Tooltips (12) | `vaadin-tooltip` | ✅ Covered | Converted from native `title=` in the script step |
| Radio groups (6) / buttons (11) | `vaadin-radio-group`, `vaadin-radio-button` | ✅ Covered | `theme="vertical"`; converted this round |
| Checkboxes (8) | `vaadin-checkbox` | ✅ Covered | Includes the share-on-signature opt-in (no fill/border, per design) |
| Checkbox group (1) | `vaadin-checkbox-group` | ✅ Covered | The `choose-any` question; `theme="vertical"`, correctly no `outlined` |
| Number fields (7) | `vaadin-number-field` | ✅ Covered | All `outlined` |
| Date pickers (7) | `vaadin-date-picker` | ✅ Covered | All `outlined` |
| Text areas (6) | `vaadin-text-area` | ✅ Covered | All `outlined`; script composer + `text-entry` |
| Dividers (5) | `vwc-divider` | ✅ Covered | Copy Form dialog section breaks |
| Multi-select combos (5) | `vaadin-multi-select-combo-box` | ✅ Covered | Quick Search filters; all `outlined` |
| Text fields (4) | `vaadin-text-field` | ✅ Covered | Includes the tag-picker search input |
| Dialogs (4) | `vaadin-dialog` | ✅ Covered | Change Log, Copy, Quick Search, Share |
| Icons (3) | `vwc-icon` | ✅ Covered | Used where a component slot expects it |
| Selects (3) | `vaadin-select` | ✅ Covered | Incl. `#qsDateRange`; all `outlined` |
| `choose-one` **dropdown** variant | `vaadin-select` | ⚠️ Partial | Uses a **native `<select class="q-dropdown">`** with a hand-rolled CSS arrow, "styled to roughly match the Vaadin outlined treatment." A DS `vaadin-select` is used elsewhere in the same file, so this is inconsistent. **Recommend converting** — highest-value of the three new Partials. |
| Privacy On/Off toggle | `vwc-toggle-button-group` | ⚠️ Partial | Plain `<button role="radio">` in a `role="radiogroup"`. Documented reason: the DS group "behaves additively outside a form context" — matches known behavior. **Intentional; recommend keeping.** |
| Quick Search forms accordion | `vaadin-accordion` / `vaadin-details` | ⚠️ Partial | Native `<details class="qs-forms-acc">`. Wraps a bespoke dual-listbox, so DS chrome buys little. **Intentional; low priority.** |
| Sortable headers (2) | `vwc-sortable-header` | ✅ Covered | Tags + Date; needs a `::part(sort-button)` reset (below) |
| Drawers (2) | `vwc-drawer` | ✅ Covered | Video + attachments; resize via `--vwc-drawer-*` tokens |
| Tabs (1 + 2) | `vaadin-tabs`, `vaadin-tab` | ✅ Covered | Change Log Edits/Access; converted this round |
| Topnav (1) | `vwc-topnav` | ✅ Covered | — |
| User menu (1) | `vwc-user-menu` | ✅ Covered | — |
| Notifications menu (1) | `vwc-notifications-menu` | ✅ Covered | — |
| Time / datetime pickers (2) | `vaadin-time-picker`, `vaadin-date-time-picker` | ✅ Covered | Both `outlined` |
| Progress bar (1) | `vaadin-progress-bar` | ✅ Covered | Quick Search loading, `indeterminate` |
| Badges (6 of 9) | `theme="badge …"` on `<span>` | ✅ Covered | Correct pattern — badge is a **theme attribute**, not an element |
| Badge-like spans (3 of 9) | `theme="badge …"` | ⚠️ Partial | `pane-header-badge`, `qs-chip-label`, `q-tag-custom-chip` stay custom — each needs something the token can't do (panel-header layout; removable chips with an `×` target). **Intentional — recommend keeping.** |
| Icon-button tooltips (~15) | `vaadin-tooltip` | ⚠️ Partial | Native `title=` remains on plain `<button>`s outside the script step. All carry proper `aria-label`, so they're accessible. **Low value to convert — recommend keeping.** |
| Rating / rubric tiles (9) | — | ⚠️ Partial | Native `<button>`s; no VWC equivalent for this scoring-tile pattern. Deliberate bespoke UI, and load-bearing for the read-only guard (`user-select: text` is forced back on). **Recommend keeping.** |

### Design Token Usage

The deleted-state wash was the notable token fix this round:

| Color in Mock | Nearest Token | Status |
|---|---|---|
| Deleted-state wash | `--deleted-tint`, a `color-mix(in srgb, var(--lumo-error-color) 6%, transparent)` alias | ✅ Match — derived from the semantic token, not a hardcoded pink |
| Error / warning text + banners | `--lumo-error-color`, `--lumo-error-text-color` | ✅ Match |
| Brand / primary accents | `--lumo-primary-color` | ✅ Match |
| Neutral borders + surfaces | `--lumo-contrast-*pct` | ⚠️ Off (deliberate) — see below |

⚠️ **One token caveat worth carrying to dev**: `--lumo-contrast-Npct` tokens are
**translucent rgba overlays**, not opaque greys. Sticky bars and drawer chrome in
this mock therefore use solid hex equivalents (`#f4f6f8` ≈ contrast-5pct,
`#ebebeb` ≈ contrast-10pct) so scrolling content doesn't show through. That
substitution is intentional — don't "fix" it back to the token.

### Gap Component Requirements

None. No ❌ Gaps were found.

## Open questions

1. **`vaadin-popover` availability — highest risk, resolve before build starts.**
   It is present and working in the loaded **v1.19.0** bundle but is **absent from
   the v1.22.1+ documented Vaadin runtime**. Four distinct usages depend on it:
   the Compare Forms menu, the Actions (⋯) menu, the attachment tag picker, and
   the per-question tag picker. **Ask the DS team**: is popover still supported,
   renamed, or withdrawn? If withdrawn, all four dropdowns need re-homing.
2. **Role and permission model is entirely unbuilt.** Both field maps specify
   substantial rules (Change Log row-level visibility + district-pref tab gating;
   Quick Search form-access checks, attachment filtering, conditional record link,
   archived-tag suppression). Who owns defining these for the form itself?
3. **Does the course-recommendations panel ship?** It reads as a prototype
   experiment and has no spec. Confirm in or out before build.
4. **Upload limits need real enforcement.** The stated ceilings (10 files, 120 MB,
   1,200 MB video) are display-only. Confirm the real numbers and where they're
   enforced.
5. **Should the two near-duplicate type pairs be consolidated?** `computed` vs
   `computed-value` are genuinely different (this form's answers vs. an external
   workflow) — confirm both are needed. `signature-nonlocking` is visually
   identical to `signature` and differs only by permission rule.
6. **Does the "locking" signature need to actually lock?** The mock's copy promises
   it; the behavior isn't built. If yes, define the scope of the lock (whole form?
   answered questions only? can an admin unlock?).
7. **Is there a submit action at all?** The design says no ("living document"), but
   dead submit-validation code exists. Confirm, and if submit is real, confirm the
   rule set — note `TOTAL_COMPONENTS = 1` today because only one rubric component
   renders.
8. **Which name is correct?** The record is called three different things:
   "Performance Standards for Teacher Practice (Flat Form)" (`<title>`),
   "Evaluation Form" (topbar), "Teacher Observation" (form header).
9. **Should the `choose-one` dropdown variant become `vaadin-select`?** It's a
   native `<select>` today while `vaadin-select` is used elsewhere in the same file.
10. **Compare mode is a 2-item stub.** Confirm the intended real behavior — full
    second form, and whether field-level diff highlighting is expected.
11. **`text-entry` with `variant:'multi'` renders single-line** (the renderer reads
    only `item.multiline`). Bug or intended?
12. **Offline / sync conflict resolution.** The `SOURCE` enum includes `SYNC` and
    `MOBILE API`, so offline capture exists upstream — but no conflict behavior is
    specified or designed.
13. **Where does the toolbar Back button go?** Only one `?from=` destination is
    mapped today (`evaluation-users.html`); the tertiary Back has none.
14. **`vaadin-radio-button` is undocumented at v1.22.1** while its parent
    `vaadin-radio-group` is listed. It is real and works — likely an index
    omission, but worth a one-line confirmation from the DS team.
15. **Two unwired menu items need specs**: ⋯ → **Paragraph Bank** and ⋯ → **Export
    to PDF** (the latter also implies a print stylesheet, which doesn't exist).

## Handoff notes

- Feature-by-feature developer detail lives in **[`DEV-NOTES.md`](DEV-NOTES.md)**
  beside this file — including the shadow-DOM traps, theme-override gotchas, and
  the bugs that must not be re-introduced.
- **This mock has no flow map.** Flow-map node config was never added, so the dev
  build sets `window.TOOLBOX = { comments: false, flowMap: false }` and
  `DEV-NOTES.md` is organized by feature area rather than by node id.
- ⚠️ **The toolbox dock is review tooling — do not ship it.** For production,
  strip the single `<script src=".../designtoolbox/toolbox.js">` include from the
  page. The dock pill, comment widget, and flow map are not part of the product
  design.
- **V2 exists as an iteration branch** (`ver2/index.html`) and is currently a byte
  copy of V1. **V1 is the handoff target** — build from `ver1/index.html` or the
  `dev_handoff.html` build at this feature root.
