# Dev Notes — Evaluation Form

Per-feature developer annotations for the V1 dev handoff. Read
[`mock-definition.md`](mock-definition.md) first — it carries the reconciliation,
the component confirmation, and the open questions. This file is the
feature-by-feature detail layer.

> **⚠️ Do not ship the Design Toolbox.** The dark pill at the bottom of the
> screen (and its 🗺 Flow Map button) is UX review tooling, not product UI. For
> production, strip the single `<script src=".../designtoolbox/toolbox.js">`
> include. Nothing else depends on it.

> **This mock has no flow map.** Flow-map node config was never added, so the
> dev build sets `window.TOOLBOX = { comments: false, flowMap: false }`. These
> notes are therefore organized by **feature area**, not by flow-map node. If a
> flow map is added later, re-key the headings below to the node ids.

**Mock**: `ver1/index.html` · **Components**: core v1.19.0, themes v1.5.0

---

## Read this first — the two authoritative field maps

Two features in this mock were built against **real backend field maps** derived
from `VectorLearning/teachpoint-web` (branch
`integration/ui-modernization-v2-pd-tracking`). These are authoritative — build
to them, not to the mock's seed data:

- **Change Log** → [`../course-recs/form-change-log-value-map.md`](../course-recs/form-change-log-value-map.md)
- **Quick Search** → [`../course-recs/quick-search-report-value-map.md`](../course-recs/quick-search-report-value-map.md)

Everything else in the mock is design intent without a backend spec.

---

## Top toolbar

- Title block is `.topbar-title-block`, vertically centered (`align-items: center`
  — it was `baseline`, which broke once the 30px Back button landed beside it).
- **Back** is a `vaadin-button theme="tertiary"` with a `fa-chevron-left`. No
  destination is wired — hook it to the evaluations list route.
- **Save** (`#saveFormBtn`) is `theme="primary"`; **Actions ⋯**
  (`#actionsMenuBtn`) is `theme="icon secondary"` and opens `#actionsPopover`.
- The `⋯` menu has **no "bulk actions" label** — removed deliberately; the menu
  items stand alone.
- ⚠️ **Tertiary underline gotcha.** The Vector theme sets
  `vaadin-button[theme~=tertiary]::part(label){text-decoration:underline}`, and
  `theme~=icon` does **not** reset it. `themes.js` injects via
  `document.adoptedStyleSheets`, which applies *after* all `<style>` elements, so
  an override must **out-specify** it, not merely follow it. The mock uses
  `vaadin-button.<class>[theme~="tertiary"]::part(label)` + `!important`. Keep
  that shape or the underline returns.

## Question renderer — 19 types

All types render through `renderQuestion()` (~`ver1/index.html:6507`), which has
**exactly 19 `item.type` branches**. Verify against that switch, not against a
grep for `type:` strings — several `type:` values elsewhere in the file belong to
other data structures entirely (see the traps below).

| Type | Renders as |
|---|---|
| `instruction` | Read-only title + rich-text body (`<p>`, `<a>`, `<img>`). No control. |
| `heading` | Title only, no body, no control. |
| `rating` | 4-tile rubric grid — native `<button role="radio">`, **not** a DS control. Per-level color bar from `RATING_COLORS`. Optional notes disclosure or `.cond-reqs` block. |
| `text-entry` | `vaadin-text-area theme="outlined"` when `multiline:true`, else `vaadin-text-field theme="outlined"`. |
| `choose-one` | `vaadin-radio-group theme="vertical"` + `vaadin-radio-button`. |
| `choose-one` + `variant:'dropdown'` | ⚠️ **Native `<select class="q-dropdown">`** with a hand-rolled CSS arrow — deliberately *not* `vaadin-select`. |
| `choose-any` | `vaadin-checkbox-group theme="vertical"` + `vaadin-checkbox`. |
| `date` / `time` / `datetime` | `vaadin-date-picker` / `vaadin-time-picker` / `vaadin-date-time-picker`. |
| `duration` | Three `vaadin-number-field` (H / M 0–59 / S 0–59). |
| `timer-start` / `timer-stop` | Paired clock — see **Paired timer** below. |
| `signature` | Locking variant: Sign button → cursive name + timestamp + `theme="badge warning"` "Locking" pill. No Clear. |
| `signature-nonlocking` | Same markup, `data-locking=false`; adds "(non-locking)" caption + Clear signature. |
| `signature-nonlocking` + `draw:true` | Canvas signature pad; signed state renders a trimmed PNG. |
| `computed` | Read-only `.q-computed-value` card. Derived from **other answers on this form**. |
| `computed-value` | The **same card**. Sourced from a **separate workflow outside this form**. `valueType:'text'` adds `.is-text`. |
| `passfail` | Two-button segmented toggle — plain `<button>`s, not `vwc-toggle-button-group`. |
| `script` | Chat transcript — see **Script step** below. |
| `video` | Two-column source menu + annotations — see **Video drawer** below. |

**Naming traps — four `type:` values are NOT question types:**

| Looks like a type | Actually is |
|---|---|
| `mandatory` | A training type in `getDefaultAssignDates()` (`'mandatory' \| 'suggested'`) — course assignment, not a question. |
| `text` | `qtype: 'text'` on **Quick Search result rows**, plus a filter option. The form's free-text type is `text-entry`. |
| `attachment` | `type: 'attachment'` on **Quick Search result rows** (vs. `'rubric'`). Attachments in the form are an *action bar*, not a question type. |
| `rubric` | The other **Quick Search row** kind. The form's scoring type is `rating`. |

**Other traps:**

- `computed` vs `computed-value` render **identically on purpose** (comment at
  ~6661: so the two steps "don't read as different components"). The difference is
  semantic only. Don't collapse them, and don't restyle one.
- `signature-nonlocking` vs `signature` differ in confirmation copy, the Locking
  badge, and the Clear button. The non-locking distinction is a **permission
  rule** — see the gap note below.
- ⚠️ **Likely bug**: the second `text-entry` seed item uses `variant:'multi'`, but
  the renderer only reads `item.multiline` — so it renders **single-line**.
  Confirm which was intended.

**Only one rubric component actually renders.** `TOTAL_COMPONENTS = 1`; the
`DOMAINS` constant carries the full 4-domain / 9-indicator / 26-component
Minnesota rubric (~385 lines) but exists mainly to feed recommendation matching.

## Paired timer (`timer-start` / `timer-stop`)

- Two separate steps sharing **one** clock. Starting either starts both; stopping
  either stops both. They must never drift.
- **Both** steps are editable after stop — you can type a custom elapsed result
  on either one.
- There is **no Reset** — removed deliberately. Edit replaces it.
- Change Log writes this as `ELAPSED_TIME` (type 2), `int_value` → `HH:MM:SS`.

## Script step (chat/comment model)

- Messages compose in a `vaadin-text-area`; send + tag icons are the same size.
- **Tags** attach via a `vaadin-popover` tag picker: searchable
  (`vaadin-text-field theme="outlined"`), **multi-select that stays open** on each
  pick, and selected tags render as chips **inside** the composer, at the bottom.
- **Replies** nest under a parent message and deliberately **do not** get their
  own timestamps — they inherit the parent's. Each reply is visually
  containerized so a reply reads differently from a line break.
- Replies carry **no tags** — tags are a parent-message concept only.
- Hover keeps a visibly distinct fill (it must not flatten to the row background).
- Reply/edit icons are a bare arrow + pencil — **no underline** (see the tertiary
  gotcha above).
- ⚠️ **`vaadin-text-area` shadow-DOM traps** (all hit during the build):
  - The `<textarea>` is in the **light DOM** via `<slot name="textarea">`.
    Selection APIs (`setRangeText`, `selectionStart`) live on `.inputElement`, not
    the host.
  - `focus`/`blur` **do not bubble** — use `focusin`/`focusout`.
  - Use `composedPath()` for keydown targeting.
  - `.value` is `undefined` before upgrade.
  - **Programmatic writes during user input are silently dropped**: `_onInput`
    sets `__userInput`, and `_valueChanged` skips `_forwardInputValue()` while
    it's set. Defer the write **one microtask** (this is what broke, then fixed,
    the T/S speaker tagging).

## Video drawer

- `vwc-drawer`, resize capped at **50% of viewport** on desktop; still a
  full-screen takeover at small widths.
- ⚠️ Resize is implemented by writing an inline width onto the internal
  `.drawer-column`. **`drawer-column` is not an exposed `::part`** — styling it
  that way silently does nothing. Clamp with `--vwc-drawer-min-width` /
  `--vwc-drawer-max-width`.
- Releasing a resize drag outside the panel used to close it (the scrim read it as
  an outside click). Fixed with a `pressedScrim` guard — **keep it**.
- Annotations have edit + delete icons side by side. "Review in panel" and the
  filename icon were both removed.
- Upload hint lives **inside the menu**, matching the attachments menu.
- Preview uses `fa-eye`, not a play glyph.

## Attachments drawer

- Same 50% resize cap and the same `pressedScrim` guard as the video drawer.
- Unpreviewable types (e.g. `.xlsx`) fall back to a **placeholder tile**:
  filename + info + generic icon.
- ⚠️ `fauxDoc` and `previewKind` must agree on which extensions are previewable.
  They disagreed on 7 extensions during the build; an allowlist fix broke
  video/bmp/heic. Verified at 0 mismatches across 25 extensions — **re-verify if
  you touch either.**

## Signatures + share-on-signature

Three confirmation modals, all dispatched from one handler (~`ver1/index.html:6417`)
reading `data-locking` and `data-draw`:

1. **Locking** (`signature`) — "Sign and lock?" Copy warns it "will lock the form
   from further edits."
2. **Non-locking type-to-sign** — "Add your signature?" Copy states it "does not
   lock the form." This confirmation exists **specifically so the share opt-in had
   somewhere to live** (comment ~6447).
3. **Drawn** — `showSignaturePad()` (~9438): DPR-scaled `<canvas>`, mouse + touch,
   baseline guide, Clear, and Apply disabled until `hasInk`. `trimCanvas()` exports
   only the inked bbox + 8px padding.

🔴 **The locking signature does not actually lock anything.** `applySignature`
touches only the block's own DOM — there is no read-only enforcement after
signing. The lock is **copy only** in this prototype and must be built.

**Share opt-in** (`shareOnSignHtml`, ~9918):

- `vaadin-checkbox#sigShareOptIn` — **default `checked`**, no fill/border.
- Returns `''` when `formShared` is already true, so the opt-in only appears when
  it can do something and callers can concatenate unconditionally.
- Appended to **all three** confirmations.
- ⚠️ Because it defaults to checked, the **warning banner is visible by default**
  and hides when the user opts *out*. One consistent banner, shown only when it
  applies (comment ~9921). Banner copy matches the Share dialog verbatim: *"**This
  can't be undone.** Once shared, access is permanent — it cannot be revoked."*
- `wireShareOnSign()` binds **both** `checked-changed` (the DS contract) and native
  `change`, and seeds `warn.hidden` from the **attribute**, not the property,
  because the element may not have upgraded yet.
- `applyShareOnSign(rootEl)` is called with the modal's **captured `bodyRoot`** and
  falls back to `hasAttribute('checked')` for the same upgrade-timing reason.

The share dialog lists **no users** — deliberately. Messaging carries the meaning:
*"This will grant access to all users with the appropriate permissions."*

⚠️ `signatures` pre-declares only `{ evaluator, teacher }`, but `applySignature`
writes arbitrary `data-signer` keys into it, and signer names come from a
hardcoded `nameMap`. **No identity binding and no signer-turn gating** — any user
can sign any block.

Change Log writes share as `SHARE` (type 1), `int_value==1` → "On".

## Deleted / restore state

- Entered from the ⋯ menu (`Delete this evaluation?` confirmation).
- The **grey form wrapper behind the sections** gets a light red wash —
  `--deleted-tint`, a `color-mix()` alias off `--lumo-error-color`. The form
  sections themselves are untouched. (An earlier striped watermark was removed.)
- **All actions are stripped** — both the per-section action clusters and the main
  toolbar actions. **Restore is the only available action.**
- The record stays **viewable and listed**; its status reads *deleted*. Do **not**
  add "hidden from list" messaging — that was explicitly removed as inaccurate.
- Change Log writes this as `ARCHIVED_STATE` (type 8): `int_value==1` → "Delete",
  else "Un-Delete".

## Compare mode (read-only enforcement)

- The compared form is read-only but **text stays selectable and copyable** — this
  was an explicit requirement.
- ⚠️ **Do not use `inert`** and do not do a per-control `disabled` pass. `inert`
  kills text selection and accessibility; the `disabled` pass leaked (it missed
  `vaadin-checkbox`, `vaadin-select`, `vwc-switch`, links, and `role="button"`).
- The mock uses a **capture-phase event guard** on `compareFormList`
  (~`ver1/index.html:11275`): it swallows `click`, `keydown`, `keypress`, `input`,
  `change`, `beforeinput`, `paste`, `cut`, `drop`.
  - `pointerdown`/`mousedown` are **intentionally not blocked** — they begin a
    text-selection drag.
  - Ctrl/Cmd combos and pure navigation keys (arrows, Home/End, PageUp/Down, Tab,
    Shift) pass through so keyboard copy works.
  - Rating tiles are `<button>`s, so `user-select: text` is forced back on.
- `.form-list.is-readonly` softens hover/cursor **without** touching
  `user-select`.

## Change Log dialog (`#changeLogDialog`)

**Build to the field map**, not the seed data.

- `vaadin-tabs` + `vaadin-tab` — **Edits** (index 0) and **Access** (index 1).
  The handler reads `selected-changed` and maps the index to a panel via each
  tab's `data-cl-tab`, so markup order drives the mapping.
- ⚠️ Three theme defaults are deliberately undone; keep them or the compact
  underline look breaks: `flex: 1 1 0` → `flex: 0 0 auto`; `min-width: 56px` →
  `0`; and `vaadin-tab[selected]::before/::after` → `display: none` (the theme's
  own indicator would double up with the 2px brand underline).
- `SOURCE` and `ACT` maps in the mock are **byte-exact to the spec's §5** —
  including both `3` and `4` mapping to `RESTORE`. Legend format is
  `{Verb} · {Date} · {SOURCE} · {Editor}`, with `SOURCE[e.source] ?? 'WEB'`.
- Editor resolution: `"X AS Y"` on account switch; root editors display as
  **"Vector Solutions Support Agent"** to non-root viewers.
- Both access-completeness warnings are implemented verbatim: *"No access log
  available for this record."* and *"Incomplete access log — the record's creation
  event was not captured."*
- **Row-level visibility is NOT implemented** — the mock shows every seeded entry.
  The real rules (spec §6: admin/root sees all; authors see their own; everyone
  sees signature + operation types; plus the extra Access-tab gate) must be built
  server-side.
- Tab gating on `districtPref.showFormEditLog` / `showFormAccessLog` is also not
  modeled — both tabs always render.

## Quick Search dialog (`#quickSearchDialog`)

**Build to the field map**, not the seed data.

- All spec §2 inputs are present: **Users, Author, Date Range, Tags, Data
  Elements, Question Types**, plus **Select Forms** and an **exclude self-authored**
  checkbox (`#qsExcludeSelf`).
- **Select Forms** is an accordion (`#qsFormsAcc`) with a dual-listbox add tool.
  All forms default to the **left "Forms" column** — available but *not yet added*
  to the report criteria.
  - ⚠️ Two bugs to avoid re-introducing: (1) the painter must **mutate** the
    marked-selection `Set`s in place, never reassign them — handlers close over
    the original objects, and reassigning silently breaks individual selection;
    (2) an empty forms list must produce the *"Select at least one form to report
    on."* prompt, not a silently empty result.
- Result table is **5 columns**, matching spec §3 exactly, with **exactly two**
  sortable headers: **Tags** and **Date** (`vwc-sortable-header`, cycling
  `null → asc → desc → null` via `sort-direction-change`).
  - ⚠️ `vwc-sortable-header`'s internal button hardcodes `height: 56px; width:
    100%`. Reset via `::part(sort-button)` — the mock uses
    `height: auto; width: auto; gap: 6px`.
- Empty state and footnote are the real i18n strings: *"No data found for report
  specification."* and *"Results display only tags selected from filters."*
- Has a genuine **loading state** (`.qs-loading` + `vaadin-progress-bar
  indeterminate`) — one of only two loading treatments in the whole mock.
- **Not implemented**: every access rule in spec §6 (form-answer access checks,
  attachment filtering, the conditional record link, suppression of archived /
  quick-search-excluded tags, and the question-type gate on attachments). All
  server-side.

## Copy Form dialog (`#copyDialog`)

- Sections are separated by `vwc-divider`, **not** boxed containers.
- Dividers sit **between sections only** — never between individual inputs.
- The notice renders at the **top** of the content, not the bottom.

## Course recommendations panel

- Prototype/experimental area. Refresh generates a new batch; discarding and
  refreshing both warn about pending recommendations
  (`Course recommendations will not be saved`, `Refreshing will discard pending
  recommendations`).
- The cart is a `Set`; `cart.size` guards are cart counts — **not** file sizes.

---

## Validation implemented

Genuinely wired:

- **Conditional rating requirements** (`refreshConditionalReqs`, ~7013) — shows only
  the fields the chosen answer requires, computes satisfaction, and flips the
  banner between "This rating requires extra information." (amber) and "Extra
  information complete." (green).
- Script edit and video-annotation edit both refuse empty text.
- Send/Save buttons disabled until text exists; signature pad Apply disabled until
  `hasInk`.
- Quick Search treats an empty forms list as a **required-parameter error**, not an
  empty result.
- 13 `showValidationModal` confirmations cover every destructive path (clear all,
  delete, sign/lock, share, recommendation discards) plus success toasts. Each call
  builds a **fresh** dialog so they can nest, and captures `bodyRoot` *before*
  close so `onConfirm` can still read embedded controls.

🔴 **`handleSubmit()` is dead code.** It assembles the "Cannot submit evaluation"
issue list (unrated count, evaluator signature, teacher signature) but **nothing
calls it** — `#saveFormBtn` is wired to `handleSaveDraft`. The design intends no
submit ("This is a living document — there is no 'submit'"). Decide whether real
submit validation is needed; if so, this path is a starting point, not a working
feature.

## Not implemented — build these

- **Error/failure states: essentially none.** No network/save-failure path, no
  retry. `navigator.clipboard.writeText().catch(() => {})` **silently swallows
  failure and still shows "Copied to clipboard."** No `onerror` on any image.
- **Loading: exactly one** — Quick Search's 800ms `vaadin-progress-bar`.
  Everything else is synchronous, including **Generate recommendations**, which is
  framed as an AI action with an "AI" pill but has **no thinking or streaming
  state**. Save, share, copy, assign, and both uploads have no pending state.
- **Permissions/roles: absent as a concept.** `CURRENT_USER_ID` is one hardcoded
  const used only by Quick Search's exclude-self filter. No role model, no
  per-field visibility, no signer gating. Both field maps specify substantial
  rules. **Largest build-side gap.**
- **Upload limits are display-only.** The hint text (10 files / 120 MB / 1,200 MB
  video) is shown *inside the source menu before the picker opens* — deliberate, so
  limits are read before rejection. But `pickFiles()` invents 1–4 filenames and
  **no size or count is ever checked.** The too-many / too-large / wrong-type
  rejection UI does not exist.
- **Concurrency: nothing.** No conflict detection, no version/etag, no "someone
  else edited this." The Change Log is a static array that never refreshes.
- **No unsaved-changes guard — there is no `beforeunload` handler at all.** Back,
  Cancel, and browser close all discard silently.
- **Offline**: none. All state is in-memory; a reload loses everything. No
  `localStorage`/`sessionStorage`. The `SOURCE` enum's `SYNC` / `MOBILE API` values
  imply upstream offline capture, so conflict resolution needs defining.
- **Timer gaps**: the *step* timers use a 1s `setInterval` and **drift under tab
  throttling** (the form session timer solved this with `Date.now()` math; the step
  timers did not). A running timer is never stopped by navigation, and step elapsed
  time is **never written into form data**. "Edit time" coerces garbage or ≤0
  silently to `00:00:00` with no feedback.
- **Long-text / overflow — partial.** Handled: title/name ellipsis, rec card
  clamps, Quick Search 500-char truncation with `(More)` (this *is* implemented —
  spec §3 satisfied). **Not handled:** `.rubric-tile-body` has no clamp, so one long
  criteria cell stretches the whole 4-col grid (the seed data's longest already runs
  ~500 chars); script/reply text has no clamp; `.q-computed-value.is-text` has no
  max-width; Change Log `.cl-value-box` has no clamp; truncated header values carry
  **no `title` attribute**, so a clipped email is unrecoverable.
- **No print stylesheet**, despite an "Export to PDF" action and a Change Log
  "Viewed PDF" event type.

## Unwired controls (present in UI, no behavior)

`#formHeaderEdit`; ⋯ → **Paragraph Bank**; ⋯ → **Export to PDF**;
`.attach-preview-open` ("Open original"); the video thumbnail play badge.
Also dead: `renderSelect()` (~10409, defined once, never called) and
`handleSubmit()`.

## Compare mode is a stub

`renderCompareList()` renders only **2 items** (a domain instruction + one rating,
hard-pinned to level 2 so it visibly differs) — **not** a full second form. So
field-by-field diffing / "changed since" highlighting doesn't exist yet. The
compare menu's 4 options are hardcoded.

## Strip before shipping

Beyond the toolbox include:

- `#protoWidget` (the draggable prototype helper) and all its handlers —
  `protoFillAll`, `protoClearAll`, `seedExtrasExamples`, `seedVideoExampleNotes`,
  `seedScriptExampleNotes`, `fillExampleQuestions`, `SAMPLE_*`, `#protoDeletedBtn`.
- The **"Question Type Examples"** section — a **type catalog, not a real form**.
  ~20 of the ~31 seeded items exist only to demo a type.
- All 6 `[Prototype]` modal bodies.

⚠️ **Three different names for the same record**: `<title>` says "Performance
Standards for Teacher Practice (Flat Form)", `.topbar-title` says "Evaluation
Form", `.form-header-title` says "Teacher Observation". Pick one.

## Data

Everything is hardcoded seed data — form items, change-log entries (12 edits, 5
access), quick-search rows (6), tags (8), users, and the 14-course catalog. No
persistence of any kind and no fetch. External network deps: the VWC CDN, the
**Font Awesome Free** CDN (note: *not* the repo's vendored Pro path — so Pro-only
icons would render as invisible zero-width glyphs), and **`picsum.photos`** for the
domain banner, all course art, and every attachment image preview.

The two field maps name the real tables for the two specified features
(`rubricdatalog`, `rubricdata`, `userdata`). Everything else needs a backend
defined: form-template schema, answer persistence, file storage, video hosting,
signature identity + storage, share/permission resolution, soft-delete, the real
audit log, cross-form query, clone, and the recommendation/assignment services.
