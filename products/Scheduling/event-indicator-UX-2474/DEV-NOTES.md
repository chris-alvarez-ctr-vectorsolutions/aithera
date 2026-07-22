# Dev Notes — Event Indicator (UX-2474), Current UI

**Jira:** UX-2474
**Dev build:** `dev_handoff.html` (this folder) — a copy of `current-ui.html` with
the review comment widget turned off.
**Source design:** `current-ui.html` (the file these notes describe).
**Related exploration (NOT this handoff):** `index.html` in this folder is the
blue-sky "Rethinking Scheduling" redesign. **It is out of scope for this ticket.**
What ships is the incremental **event/credential indicator added to the current
production UI**, i.e. `current-ui.html`.

> ⚠️ **Do NOT ship the Design Toolbox.** The bottom-center toolbox pill and the
> `toolbox.js` include are **review/handoff tooling only — not part of the
> product.** Strip the single `<script src="../../../designtoolbox/toolbox.js">`
> line (near the end of `<body>`) for production. This mock has no flow map, so
> the flow-map button won't appear, but the include must still be removed.

---

## What this is

A faithful reproduction of the **current production** Vector Scheduling day view,
with the UX-2474 feature layered on: **credential/qualification status indicators**
on assigned people, a **concurrent-shift flag**, and the production **hover detail
card** carrying that status. The surrounding chrome (topnav, sidenav, toolbar,
date-nav, assignment cards, open slots) reproduces today's product and is **not
being rebuilt** — build the indicator feature into the existing Scheduling day
view. Component mappings below come from `component-assessment.md` (same folder).

---

## The feature — credential status indicator (the net-new work)

**This is the actual deliverable of UX-2474.** There is **no VWC badge/chip
component** — this is a genuine gap; see the "Credential Status Badge" spec in
`component-assessment.md`. Build it as a **single shared component**, not three
copies, because the same chip renders in three places (person row, open slot,
hover card).

**Anatomy** — a colored credential chip (`.pqc` / `.qbadge` / `.hc-cbadge`) =
credential color background + white label (FF, Capt, BC, PS, PM), with a **status
glyph embedded before the label**:

| Status | Glyph | Mock class | Production token to use |
|---|---|---|---|
| Valid | (none) | — | `--lumo-success-color` `#158444` |
| Expired | red circle, white ✕ | `.hc-ci.exp` / `.si-exp` | `--lumo-error-color` `#d83e38` |
| Expiring soon | yellow triangle ⚠ (dark outline) | `.hc-ci.warn` / `.si-warn` | `--lumo-warning-color` `#e0782e` / `#ffc700` |
| Missing | red **dashed** circle, ? | `.hc-ci.miss` / `.si-miss` | `--lumo-error-color` `#d83e38` |

- **Credential colors** in the mock are legacy hexes (FF `#44505c`, Capt `#c0392b`,
  BC `#6D28D9`, PM dashed-blue `#2b7fd0`). Confirm the authoritative credential
  color source before hardcoding.
- **Accessibility:** the glyph must not be color-only — give each an `aria-label`
  such as "FF — expired 11/11/2025" mirroring the hover-card text.
- **Layout:** qualifier chips **stack above** the person name. In the mock, JS
  reflows any `.prow` containing `.pqc` chips into a `.stacked` column (chips on
  their own `.pq-tags` row, name on the `.pname-row` below). Build this into the
  row template directly rather than post-hoc DOM surgery.

**Concurrent-shift flag** (`.cflag` / `.hc-cflag`) — orange circle (`#e0782e`,
= `--lumo-warning-color`) with a white flag icon, shown inline before the name and
in the hover card. Same status-indicator family as the badge — fold it in as a
variant of the shared component.

---

## Screens / regions and their component mappings

### 1. Top navigation (`.topnav`)
Legacy production topbar (logo, calendar title, right-side icons). Maps to
`vwc-topnav` in the real app. **Reproduction only — not rebuilt for this ticket.**

### 2. Left icon rail (`.sidenav`)
Icon-only nav (Calendar active, Schedule, etc.). Maps to `vwc-sidenav` collapsed
mode. Reproduction only.

### 3. Toolbar + date nav (`.toolbar`, `.datenav`)
- List/Calendar segmented toggle (`.tb-seg`) → `vwc-toggle-button-group`
  (single-select). Visual only in the mock.
- Prev / next / today + date label (`.datenav`, `.dn-center .dt`) → `vaadin-button
  theme="tertiary"` + `vaadin-date-picker theme="outlined"`. The center date label
  is the page's working date and is read by the shift modal for its title.

### 4. Assignment cards (`.acard`, variants `.understaffed`, `.green`, `.deploy`,
`.offcard`, `.misc-card`)
Shift/column cards: header (`.acard-hdr` = title + staffed count `.acount met/under`
+ ⋮ menu) and body of person rows / open slots. Map to `vwc-card` (header/content
slots). The **staffed count** (`0/1`, `2/4`) and its met/under color state are
existing production; keep. Card ⋮ menu (`.acard-menu`) → `vaadin-menu-bar` /
`vaadin-context-menu` (non-functional in the mock).

### 5. Person rows (`.prow`) and deployment rows (`.drow`) — **carry the feature**
Each assigned person. Renders: qualifier status chips (above name), optional
concurrent flag (inline), name, optional on-shift clock. Data attributes drive the
hover card and modal (see Interactions). This is where the status badge component
is consumed.

### 6. Open-slot tiles (`.oslot`)
Hatched "Open slot" tiles with required-qualifier badges (`.qbadge`, e.g. dashed
`PM (1)`). Production-specific; the qualifier badges reuse the status-badge
component (here in a "required" style, no status glyph).

### 7. Hover detail card (`.hovercard`) — **carries the feature**
Black, right-/left-flipping detail card shown on person-row hover. Three optional
sections joined by dividers: **(1)** credential qualifiers (badge + status glyph +
"Expired on / Expiring on / Missing" text), **(2)** concurrent-shift info (flag +
type + assignment + time), **(3)** admin metadata (work type, last modified by/on,
lists, phone). Maps to `vaadin-tooltip` (rich content) or `vaadin-popover`; the
bespoke black styling is a deliberate production match.

### 8. Shift-edit modal (`#shiftModal`)
Opens on person-row **click**. Title = `name — assignment — date`. Shows shift
hours, a **concurrent banner** (orange flag + type + assignment + time) when the
person has `data-cc-*`, then the (visual-only) edit form. `vaadin-dialog` in the
real build; form inputs → `vaadin-*` with `theme="outlined"`.

---

## Interactions & data model

Person/deploy rows opt into the hover card + modal via **`data-*` attributes** —
this is the contract to wire to real data:

| Attribute | Purpose | Example |
|---|---|---|
| `data-modby` / `data-on` | "Last modified by" / date (also gates hover+click: only rows with `data-modby` are interactive) | `Michael Fulton` / `05/08/2026 7:02am` |
| `data-worktype` | Work type row | `Regular [RT]` |
| `data-creds` | Credential list; `;`-separated, each `label\|color\|status\|date` | `FF\|#c0392b\|expired\|11/11/2025` |
| `data-cc-type` / `data-cc-assignment` / `data-cc-time` | Concurrent shift type / assignment / time | `TargetSolutions event` / `Station 3 — Engine 7` / `6:00am – 6:00pm (12h)` |
| `data-lists` / `data-phone` | Admin metadata rows | `All Employees, Firefighter` / `(555) 555-0142` |
| `data-covering` / `data-coveringcode` | "Covering For" rows (rendered even if empty) | — |

- **Hover:** `mouseenter` on `.prow[data-modby]` / `.drow[data-modby]` builds and
  positions the card (prefers left of the row; **flips to the right** if it would
  clip; clamps vertically to viewport). `mouseleave` hides it.
- **Click:** opens the shift modal (dismisses any open hover card first). Closes via
  the X (`#smClose`), **backdrop click**, or **Escape**.
- **`data-creds` status values:** `expired` → red ✕ + "Expired on: {date}";
  `expiring` → ⚠ + "Expiring on: {date}"; `missing` → dashed ? + "Missing"; anything
  else → "Valid" (no glyph).

**Edge cases to preserve**
- Rows **without `data-modby`** are non-interactive (no hover, no modal) — e.g.
  open slots and header-only rows.
- Hover card sections are **conditionally present**; dividers appear **only between
  present sections** (no leading/trailing/doubled dividers).
- Concurrent time line must **stay on one line** including the `(12h)` duration.
- Qualifier-tag stacking only triggers when a row actually has `.pqc` chips.

---

## Theme / build notes
- Reproduces the **legacy production palette**. When building for real, bind status
  colors to semantic tokens: expired/missing → `--lumo-error-color`, expiring →
  `--lumo-warning-color`, valid → `--lumo-success-color`. Warning orange `#e0782e`
  and success `#158444` already equal their tokens; reds/blue/grays are legacy (see
  the token table in `component-assessment.md`).
- Icons use Font Awesome (prototype default); production status glyphs → `vwc-icon`
  (MDI).
- No flow map exists for this mock — nothing flow-map-related to carry over.
