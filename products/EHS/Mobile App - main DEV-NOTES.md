# Dev Notes — EHS Mobile App, Main (current scope)

**Design source:** `products/EHS/Mobile App - main.html` (living designer file)
**Dev build:** `products/EHS/Mobile App - main dev_handoff.html` (frozen copy for this handoff, 2026-07-29)
**Component audit:** `products/EHS/Mobile App - main component-assessment.md`

---

## ⚠️ Prototype chrome is NOT part of the product

Everything **outside the phone frame** is review tooling and must not be built:

- The toolbar above the phone: **Offline**, **Slim badges**, **Submitted icon**, and
  **Inline badges** toggles, plus the **Screen** jump select. These exist so reviewers can
  flip states without walking the flow.
- Leftover prototype functions in the JS (e.g. `setCardVersion` — the V1/Original card
  comparison was dropped; **V2 is the sole card design** and the only one to build).
- This mock does not include the repo's Design Toolbox (`toolbox.js`); there is no dock
  pill or flow-map button here. If one ever gets added to the design file, do not ship it.

Everything **inside the phone frame** is the product design.

---

## Global patterns (read before any screen)

- **Platform.** This is a native mobile app design. The component assessment maps each
  pattern to its nearest Vector web component for consistency with web surfaces; on
  device, use the platform-native equivalent.
- **Color tokens.** The palette intentionally matches Vector theme tokens: primary
  `#0271ce` (= `--lumo-primary-color`), body text `rgba(0,0,0,0.87)`, secondary text
  `rgba(0,0,0,0.6)`, error text `#ca150c`, success text `#0a7637`. Two known drifts to
  correct when implementing: warning text should be `#995211` (mock has `#985211`) and
  success accents should be `#158444` (mock has `#168846`). See the component assessment
  for the full table.
- **Upload-status model.** A record is in exactly one of: **Pending Upload** (created on
  device, never uploaded), **Pending Update** (uploaded before, has local changes),
  **Uploaded** (server state, shown as a green check icon when the "Submitted icon"
  treatment is on — that treatment is the shipped design), plus an independent
  **Missing Fields** badge when required fields are empty. CTA labels follow the state:
  "Upload" for pending-upload, "Update" for pending-update. ("Submit" wording was
  retired.)
- **Record badges.** Record-type badge (JSA etc.) keeps its icon; status pills:
  Pending Upload / Pending Update / Missing Fields / Downloaded / Waiting to sync.
  Risk chips: High / Medium / Low / None. Form-status: Completed / In Progress /
  Incomplete / Overdue. Layout: submission status + downloaded icon sit bottom-left of
  the card (the single-row "inline badges" layout is the old design, off by default).
- **"Last synced" is page-level.** One info line under the Records header
  ("Last synced: just now"), not per card.
- **Sync is all-or-nothing this phase.** There is **no conflict/merge flow** in this
  scope: pending records upload as a batch on reconnect; downloaded records are refreshed
  from server. Do not build a conflict-resolution UI from older explorations.
- **Buttons.** Two variants only: primary filled (48px, `#0271ce`, pressed `#0261b4`,
  disabled `#c7d2dd`) and ghost outlined. Sticky bottom CTA bar with optional hint text
  under the button.
- **Toast.** Bottom-anchored dark toast (above the bottom nav) used for confirmations;
  the record-created toast carries an inline **Copy ID** action.

---

## Screens

### Core

**Home (`screen-home`)**
Landing screen: header with user context plus module entry points and recent activity.
Module tiles/badges follow the standing 3-bucket color model for record types (blue
informational, orange warning, red error). Bottom navigation with badge counts is the
persistent app chrome (see assessment: no VWC equivalent, native pattern).

**Records (`screen-records`)**
Filterable list of the user's records. Page-level "Last synced" line under the header.
Applied-filter chips row with removable chips (x). Filter bottom sheet (see below). FAB
bottom-right creates a new record (JSA wizard). Each row is a **V2 record card**: type
row with record-type badge, title, ID / Division / Facility meta, section rows, and the
description under a small "Description" label; status pills + downloaded indicator
bottom-left; footer CTA right-aligned (Upload / Update per state).
Filter sheet: bottom sheet with scrollable filter groups and a sticky footer (Reset /
Apply with result count).

**Record: Details (`screen-record-view`)**
Read-only view of an uploaded/downloaded record: sectioned content blocks matching the
wizard's steps. Entry point to Attachments.

**Record: Attachments (`screen-record-attachments`)**
Thumbnail grid of a record's attachments with add-attachment affordance (camera/library
on device).

### Read-only record (downloaded state)

`screen-ro-basic`, `screen-ro-additional`, `screen-ro-steps`, `screen-ro-step-detail`,
`screen-ro-signature`

Downloaded records open in a read-only rendering of the same structure as the wizard
(basic info, additional features, steps list, step detail, signature). **Exception per
the offline model: signatures and attachments remain editable on a downloaded record**;
all other fields are locked. Locked fields render as plain value rows, not disabled
inputs.

### JSA wizard (create/edit flow)

**JSA: Start (`screen-jsa-start`)** — entry screen; back button lives in the header.
**JSA: Select (`screen-jsa-select`)** — pick the JSA to work from; cards show ID /
Division / Facility meta (status badges were deliberately removed from these select
cards).
**JSA: Basic Info (`screen-jsa-basic`)** — form fields; required-field validation feeds
the Missing Fields badge rather than blocking save.
**JSA: Steps, empty (`screen-jsa-steps-empty`)** — empty state with guidance and the
step stepper (`.jsa-stepper`) for wizard progress.
**JSA: Add Step (`screen-jsa-add-step`)** — step form.
**JSA: Steps, filled (`screen-jsa-steps-filled`)** — step cards sectioned into
overview / attachments / corrective actions blocks; per-step attachment thumbnails;
drag handle top-center of each card for **drag-and-drop reordering**; Edit action
separated from the content sections.
**JSA: Additional Features (`screen-jsa-additional`)** — optional extras for the record.
**JSA: Corrective Action (`screen-jsa-ca`)** — inline corrective-action card(s) attached
to a step, with their own attachments; confirmation via the `.ca-toast`.
**JSA: Signature (`screen-jsa-signature`)** — draw-to-sign canvas (see assessment gap:
native signature control), clear/re-sign affordances, signer metadata.

### Offline

**Offline: Home (`screen-offline-home`)** — offline banner state of Home; entry points
reflect what works offline.
**Offline: Records (`screen-offline-records`)** — offline Records shows **downloaded
records only**, read-only except signatures & attachments; records created/edited
offline carry **Waiting to sync**. Offline sync summary line replaces "Last synced".
**Offline: Reconnecting (`screen-offline-syncing`)** — full-screen sync hero: spinner
ring (turns into a green check when done), headline + explanation, and a per-record
sync progress list. All-or-nothing batch; no conflict UI.

---

## Component mapping quick reference

Full audit with statuses: `Mobile App - main component-assessment.md`. Highlights for
web counterparts: cards → `vwc-card`; filter/action sheets → `vwc-drawer`
(`position="bottom"`, overlay); wizard progress → `vwc-stepper`; form fields →
outlined Vaadin fields; buttons → `vaadin-button` `primary`/`tertiary`; toasts →
`vaadin-notification`; toggles → `vwc-switch`. True gaps flagged for the design-system
team: status badge/chip, mobile bottom nav, signature capture.
