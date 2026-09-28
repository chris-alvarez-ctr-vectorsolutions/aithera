# Dev Notes — Course Recommendations (V3)

> **No flow map in this mock.** `DEV-NOTES.md` normally renders inside the flow
> map, one section per node. This feature has no flow-map config (by decision),
> so these notes are a **standalone reference** — read them alongside
> [`mock-definition.md`](mock-definition.md), which carries the reconciliation,
> the failure-state and date-validation callouts, and the full component
> confirmation.

> ⚠️ **Do not ship the toolbox.** The bottom-center dock pill and its 🗺 / 💬
> buttons come from `designtoolbox/toolbox.js` and are review tooling only.
> Strip that one `<script>` include for production. The **recommendations** bar
> is a different thing entirely and IS part of the product.

---

## The dock — `.rec-dock`

A `position: fixed` bottom dock: a persistent banner (`.rec-bar`) that expands
into a panel (`.rec-drawer`). **Hand-rolled on purpose, not `vwc-drawer`** —
that component hides its column completely when closed
(`:host(:not([open])) div.drawer-column { display: none }`), so it has no
persistent-bar state. Everything *inside* the dock is a real Vector component.

The dock pushes page content rather than overlaying it: its measured height is
published as `--rec-dock-h`, and the form's bottom padding derives from it.
Anything else pinned to the bottom edge must clear it — and must **cap** that
clearance (`min(var(--rec-dock-h), 220px)`), or a tall drawer pushes it behind
the sticky topbar where it is painted but unclickable.

### Two independent axes

| Attribute | Values | Meaning |
|---|---|---|
| `data-gate` | `closed` / `open` | Does the feature exist for this reviewer yet? |
| `data-state` | `ready` / `generating` / `results` | What is the visible banner saying? |

Both are recomputed from scratch on every render, so the bar, the drawer and the
gate can never disagree.

---

## Gate — banner hidden until the form is ready

The banner is **not visible** until `allRequiredAnswered()` is true. There is no
locked or disabled CTA: if the reviewer cannot use the feature, there is nothing
on screen to explain.

- Opening slides the dock up from below its own edge (260ms).
- **Removing a required answer re-closes the gate** — the dock slides out and any
  pending selection is dropped, because it was made against an evaluation that no
  longer stands.
- Hiding is a `transform`, not `display: none` (which cannot transition).
  `visibility` is deferred until the slide ends so the exit animation is visible
  while still removing the hidden banner from the tab order.
- First paint does not animate — a form that loads with the gate unmet shows no
  banner rather than one sliding away.
- `measureRecDock()` treats a closed gate as zero height, or the form reserves
  bottom padding for a banner nobody can see.

---

## Banner — `.rec-bar`

| Element | Build with | Notes |
|---|---|---|
| Container | plain element | Gradient surface; **opaque** background required (it is fixed, with content scrolling behind) |
| Icon badge | Font Awesome | Decorative |
| Title "Recommended Courses" | `<h2>` | Never shrinks below 760px — it ellipsizes on one line |
| Subhead | `<p>` | **Hidden below 760px** (biggest height cost, least load-bearing) |
| Container | — | **Full-bleed below 760px**: no side gutter, square top corners. The desktop dock overhangs the form column deliberately; at phone widths there is no column to overhang. |
| Generate CTA | plain `<button>` | Not `vaadin-button`: it sits on a saturated gradient and needs a white-on-gradient treatment the DS variants do not provide |
| Working state | `vwc-spinner` + text | See the spinner gotcha below |
| Drawer toggle | plain `<button>` | Chevron rotates; carries `aria-expanded` + `aria-controls` |

### Responsive — one row below 760px

The banner collapses to ~61px: 30px icon, ellipsized heading, description
hidden, one 36px icon-only CTA. The CTA's label is hidden **visually only**
(`clip-path`), never `display: none` — and the button carries an explicit
`aria-label` matching the visible text, so the control stays named and voice
control still works.

### ⚠️ `vwc-spinner` renders nothing without `loading`

`:host(:not([loading])) .spinner { display: none }` — verified in the v1.19.0
bundle. Always set the attribute. Size and colour go through
`--vwc-spinner-size` / `--vwc-spinner-color`; `width`/`height` on the host do
**not** reach the inner icon.

---

## Generate → working → results

1. Click **Generate recommendations**.
2. The **banner stays collapsed** and the CTA is replaced in place by a spinner
   and "Finding courses…" — progress appears where the click landed, and the
   control cannot be pressed twice. `role="status"` + `aria-live="polite"`.
3. After the search resolves, the drawer opens onto the results.

Opening the drawer immediately would show an empty panel with a spinner in it,
which reads as "results came back, and there are none."

**Latency is simulated** (`REC_SEARCH_MS = 1600`). Replace with the real call —
and see the **failure-state callout** in `mock-definition.md`: there is no error
path here yet, by design, pending Engineering input.

**Changing any answer after generating invalidates the run** — recommendations
clear, cart clears, the bar returns to `ready`. There is no Refresh; a new
generation is the only path to a new list.

---

## Drawer — `.rec-drawer`

### Sizing (there is no drag handle — removed deliberately)

The drawer **sizes itself to its content**: `naturalDrawerHeight()` measures the
rendered content plus the real chrome around it (toolbar, body padding, borders)
rather than using a hardcoded constant — an earlier constant went stale and left
~28px of unwanted scroll.

- **Ceiling**: 24px below the sticky form toolbar, measured live from the
  toolbar's real bottom edge.
- **Floor**: 220px normally; drops to 72px on very short viewports so the drawer
  still opens rather than refusing to.
- **Short viewports open and scroll.** At 400% zoom the panel is cramped but
  fully usable — `overflow-y: auto` with `overscroll-behavior: contain`, so the
  scroll gesture does not chain to the form behind it.
- The cards mount **asynchronously**, so the height is re-measured once they
  land; a single measurement at open time reads an empty container.
- When closed, the drawer takes `inert` — at height 0 its buttons and cards
  would otherwise stay in the tab order while invisible.

### Toolbar

**Select All** and **Configure Assignment** are re-hosted here and delegate to
the component's public API (`selectAll()`, `actionClick()`), so the component's
own behaviour is preserved. One row always: below 760px the optional half of
each label is hidden (`Select All` → `Select`, `Configure Assignment` →
`Configure`), visually only, so accessible names are unchanged.

---

## Course lists — `vwc-course-list` ×2

| | Licensed | Gated |
|---|---|---|
| Heading | "Recommended from your libraries" | "Available in other libraries" |
| Cap | 8 | 4 |
| Selection | on | `disableSelection` |
| Assign service | set | **not set** — nothing here is assignable |
| Extra action | — | one **Learn More** button for the whole group |

Both are data-driven: `courseListService.getCourses()` returns the batch and
`payload` must be a **new object reference** to trigger a refetch.

- `courseDefinition` drives the card face **and** the Details dialog —
  `hideInCard: true` means dialog-only. That array is the single place details
  content is configured.
- `cardI18n = { version_label: 'Variant' }` relabels the field on the card and in
  the dialog. This is a documented i18n key, **not** a library change.
- **Details opens the component's own read-only dialog.** It has no footer and no
  assign action — selection happens on the card checkbox. An earlier version
  intercepted this with a capture-phase listener on the shadow-root button; that
  override has been removed.

### Gated cards are an offer, not a broken control

They render at **full colour and opacity**, identical to the licensed cards.
Gating is carried by a **bare lock icon in the card's header stripe**, placed
exactly where the selection checkbox sits on an assignable card — same slot,
different affordance. No disc, no fill: the stripe is already a solid colour.

The lock is an **inline SVG, not a Font Awesome class**. It is the only marker
distinguishing these cards, and an unresolved icon font renders as an invisible
zero-width glyph with no error.

### ⚠️ Four shadow-DOM reaches — flagged for handoff

`shrinkCourseCards()` reaches into `list.shadowRoot` / `card.shadowRoot` to
compact the cards. These are **unsupported reaches into sealed internals**, not
APIs. They degrade safely — a renamed internal makes the selector miss and the
card keeps its default styling — but should not ship as-is. One of the four
(`card-grid` spacing) can move to the real exported part
`vwc-course-list::part(card-grid)`. See *Component confirmation* in
`mock-definition.md` for the library asks that retire the rest.

---

## Assignment modal

One schedule for the whole assignment — no per-course overrides. Three
`vaadin-date-picker` fields (Effective / Due / Expire), each with a `?` help icon
carrying the SafeLMS help text via `vaadin-tooltip`. Field names match SafeLMS
exactly, including **"Expire Date"**.

⚠️ **No date validation is implemented** — see the callout in
`mock-definition.md`. The rules must mirror the current SafeLMS implementation
rather than being derived fresh.

`commitAssignment()` marks every cart course assigned and pushes them into
`disabledCourseIds`, so committed cards return badged "Assigned" and cannot be
double-assigned.

---

## Learn More modal

One CTA for the entire gated group — access is an account-level fact, not a
per-course one — placed beside the heading rather than at the row's far edge.
Opens an informational modal (`tone: 'info'`, not the warning treatment).

The **"Request A Demo…"** text is a **non-navigable stub**: styled as a link but
deliberately not an `<a>`, because there is no destination in a prototype. At
build time it becomes a real link.

---

## Accessibility notes

Covered by a 400% zoom pass against WCAG 2.2 AA **1.4.10 Reflow** and
**2.5.8 Target Size**:

- **No horizontal overflow at 320px in any state**, including both modals and the
  Details dialog.
- Targets in the rec feature clear 24×24. Two exceptions are **in the component**
  and tracked as library asks: the card's 16×16 selection checkbox (mitigated in
  practice by a 264×82px slotted label covering the card face) and the fixed
  `repeat(auto-fill, 265px)` grid track. The grid now clears 320px by ~31px
  (the full-bleed dock widened the usable row to 296px) and would not overflow
  until ~289px — but the fixed track is still a library defect.
- The banner's icon-only CTA keeps its accessible name via a visually-hidden
  label plus a matching `aria-label`.
- Contrast, focus order and full keyboard navigation were **not** in scope for
  this pass.
