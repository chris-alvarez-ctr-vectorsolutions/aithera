# Dev Notes — Evaluation Form

**Handoff version:** V1 (`ver1/index.html`) · frozen 2026-08-14
**Dev build:** `dev_handoff.html` (byte copy of V1, comments off, flow map on)
**Design iteration continues in:** V2 (`ver2/index.html`) — **do not build from V2**

> ## ⚠️ Do not ship the Design Toolbox
> The bottom-center **toolbox pill** and its **🗺 Flow Map** button are
> review/handoff tooling — **they are not part of the product design.** Strip this
> one line for production:
>
> ```html
> <script src="../../../designtoolbox/toolbox.js"></script>
> ```
>
> Also drop the `window.TOOLBOX = { comments: false }` line above it. Keep
> everything else, including `applyFlowState` / `bootFromHash` if present.

---

## Library versions

The mock loads **core v1.19.0** and **themes v1.5.0** from the Vector CDN. Build
against the version your app ships; two known gaps are recorded under
"Design-system gaps" below.

---

## Component mapping

A full audit lives in
[`../course-recs/component-assessment.md`](../course-recs/component-assessment.md)
(20 ✅ covered / 9 ⚠️ partial / 3 ❌ gap). Summary of what maps to what:

| Region | Components |
|---|---|
| Topbar | `vaadin-button` (`primary` Save, `tertiary` Back, `icon secondary` ⋯), `vaadin-popover` (actions + compare menus) |
| Form action cluster | `vaadin-button theme="secondary"` (Pass all / Clear all), plain buttons for Privacy (see gap note), `vwc-divider` |
| Question types | `vaadin-text-field` / `-text-area` / `-number-field` / `-select` / `-date-picker` / `-time-picker` / `-date-time-picker` / `-checkbox` / `-radio-group` — **all text inputs carry `theme="outlined"`** |
| Rating rubric | Custom tiles (`<button role="radio">`) — no DS equivalent |
| Script step | `vaadin-text-area` ×3, `vaadin-button theme="icon tertiary small"` row actions, `vaadin-tooltip`, `vaadin-text-field` search |
| Attachments / video panels | `vwc-drawer` (`position="end" overlay resizable theme="no-padding"`) |
| Dialogs | `vaadin-dialog` via `renderer` / `headerRenderer` / `footerRenderer` **function properties** — slotted children are ignored by this component |
| Status pills / badges | `theme="badge …"` attribute spans (this repo has no badge element) |

---

## Screens & behaviors

### Topbar
- **Back** (`tertiary` + left chevron) routes to the resolved `?from=` destination,
  falling back to the evaluation users list.
- **Save** is the permanent primary CTA. There is no "submit" — this is a living
  document; **Share** (in the action cluster) is what releases it.
- Title block is `align-items: center` so the button, title, and status pills all
  center in the toolbar row.

### Form action cluster
- Pass all / Clear all are bulk scoring actions (no label — removed deliberately).
- **Privacy** uses plain buttons, **not** `vwc-toggle-button-group` — that component
  behaves additively outside a form context (see gaps).
- **Share** is irreversible. Confirmation states: *"This will grant access to all
  users with the appropriate permissions."* No user list is fetched at share time.

### Paired timer (Start … questions … End)
- **Two steps, one clock.** Both halves share a `timerId`; state lives in a single
  `formTimers[timerId]` record and `paintTimer()` repaints every half. Starting on
  either half starts both; stopping stops both. **They cannot drift** — they are two
  views of one clock, not two synchronized timers.
- Questions between the halves are the point: start, work through them, stop.
- **Edit time** is on both halves — sets a custom `hh:mm:ss` result on the shared
  clock. Only one editor opens at a time.
- Enabled states: Start disabled while running; Stop disabled while stopped; Edit
  disabled while running or before a value exists.
- No Reset — zeroing is Edit → `00:00:00`.

### Signature steps (3 variants)
1. **Locking** — "Sign and lock?" confirmation; locks the form from further edits.
2. **Non-locking (type)** — "Add your signature?" confirmation; clearable, does not lock.
3. **Non-locking (drawn)** — canvas pad; exports a trimmed PNG data URL.

**All three offer share-on-signature** when the form isn't already shared: a
checkbox (default checked) plus the shared irreversibility banner, which shows only
while checked. Confirming applies both the signature and the share.

> **Implementation note:** both modals close *before* their callback fires, and
> closing tears down the dialog DOM. The body root is captured first and passed to
> the callback (`onConfirm(bodyRoot)` / `onApply(ink, bodyRoot)`) so the checkbox can
> be read. Preserve that ordering.

### Script step (comment/chat transcript)
- Speaker shortcuts: typing `T ` or `S ` at the start collapses into a speaker pill
  rendered in the text area's **`prefix` slot**.
  > `vaadin-text-area` skips `_forwardInputValue()` while its internal `__userInput`
  > flag is set, so the prefix-strip write is **deferred one microtask** — a
  > synchronous write updates the property but leaves the typed text on screen.
- **Message tags** — tag icon opens a searchable multi-select list; tags are appended
  to the message as metadata, never inserted into its text. Also available when
  editing a message (staged on the row: Cancel discards, Save commits).
- **Comments** — nested under a parent message, indented, each in its own container.
  **No timestamp and no speaker attribution** — they belong to the parent and sit
  outside the transcript's chronological order.
- Message rows keep their white fill on hover (the log background is grey; a grey
  hover made the card dissolve).

### Video step
- Upload menu → attachment tile (standardized on the file-attachment card pattern:
  the tile is inert, actions are sibling buttons).
- Annotations are timestamped, seekable, **editable**, and deletable. Editing swaps
  the note text for a textarea; the timestamp is the anchor and is not editable.
- Review panel and attachment panel both cap drag-resize at **50% of the viewport**
  on desktop; full-screen takeover below 760px.

### Deleted state
- Deleting is **recoverable**: the record stays viewable and read-only. It remains
  visible in the evaluation list with a **Deleted** status.
- Indicators: sticky red banner, topbar "Deleted" pill, light-red wash on the form
  backdrop (`.split-pane-primary`, not the form card).
- **Restore is the only action.** Topbar actions, the form action cluster, and the
  per-question Add tags / Add attachment rows are all hidden. Existing tag chips and
  attachment cards stay — they're content.
- Read-only is enforced by intercepting mutating events in the **capture phase**, not
  `inert` or `pointer-events: none` — text must stay selectable and copyable.
  Blocked: click, keydown/keypress, input, change, beforeinput, paste, cut, drop.
  Allowed: `mousedown`/`copy`, Ctrl/Cmd+C and +A, navigation keys.

### Compare mode
- The compared form is **read-only but selectable/copyable** — same capture-phase
  approach as the deleted state, for the same reason.
- Rating tiles are `<button>`s, whose text browsers make unselectable by default;
  `user-select: text` is forced so the rubric prose can be quoted.

---

## Design-system gaps (unresolved — confirm before building)

1. **`vaadin-popover` version status.** Used 17× (actions menu, compare menu, tag
   pickers). Present in the **v1.19.0** bundle this mock loads, but **absent from the
   v1.22.1 documented Vaadin runtime**. Either undocumented or dropped. **Confirm with
   the DS team** — if dropped, these menus need a different component.
2. **`theme~=icon` does not reset the tertiary label underline.** The Vector theme sets
   `vaadin-button[theme~=tertiary]::part(label){text-decoration:underline}`, which
   strikes through icon-only buttons. Worked around locally with a higher-specificity
   override (`themes.js` injects via `adoptedStyleSheets`, which applies *after* all
   `<style>` elements, so the override must out-specify rather than follow).
3. **`vwc-toggle-button-group` behaves additively** in dialog renderers / outside a form
   context — selection doesn't clear. Privacy and the speaker chips use plain buttons
   with an `.active` class as the documented workaround.
4. **No DS equivalent** for: comment/message threads (`vaadin-message-*` absent), chips
   (hand-rolled in 4 places), avatars (`vaadin-avatar` absent).

Longer-form gap notes: [`../course-recs/DESIGN-SYSTEM-GAPS.md`](../course-recs/DESIGN-SYSTEM-GAPS.md)

---

## Known prototype-only scaffolding

- The floating **prototype widget** (Fill all / Clear all / Toggle deleted state) is
  review tooling — not product. Remove with the toolbox.
- All data is mock: `DOMAINS`, `COURSES`, change-log entries, seeded attachments and
  annotations. Named users (Vincent Martinez, Austin Smith, Dana Whitfield) are
  fixtures.
- The Quick Search report queries an in-memory `ROWS` array; see
  [`../course-recs/quick-search-report-value-map.md`](../course-recs/quick-search-report-value-map.md)
  for the real field/parameter mapping.
- Icons are **Font Awesome Free 6.7.2** via CDN. Several Pro-only glyphs render as
  invisible zero-width characters on Free — verify any icon you add:
  ```js
  [...document.querySelectorAll('i[class*="fa-"]')].filter(e => !e.getBoundingClientRect().width).map(e => e.className)
  ```
