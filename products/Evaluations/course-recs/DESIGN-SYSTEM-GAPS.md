# Design System — component gaps found while converting flat-form modals/drawers

While moving every modal and drawer in `flat-form.html` onto Vector Web
Components (`vaadin-dialog` for centered modals, `vwc-drawer` for side panels),
these gaps required custom workarounds. Each is a candidate request for the
design-system team. Nothing below is a blocker — all are worked around in the
prototype — but they are places the component made us leave the "happy path."

_Last updated: 2026-07-22 · file: `products/Evaluations/course-recs/flat-form.html`_

---

## `vwc-drawer` (used by the Video review panel and Attachment edit panel)

The biggest gaps. `vwc-drawer` is built primarily as a **layout wrapper** that
sits *around* page content (its `content` slot) and pushes the panel to one
side. Using it as a **standalone floating overlay** (the common "open a side
drawer over the current page" pattern) hits several rough edges:

1. **No self-anchoring in overlay-only use.**
   With `overlay` set but the `content` slot left empty, the internal
   `drawer-container` renders `position: static` and flows in normal document
   layout — it does **not** pin to the chosen edge. It ended up overflowing the
   viewport (right edge past 100vw).
   **Workaround:** host the drawer in a `position: fixed; inset: 0` layer and
   force `#drawer::part(drawer-container){ position: fixed; top:0; right:0; bottom:0 }`.
   **Ask:** an "overlay drawer" mode (or docs) where `overlay` + empty content
   anchors the panel to `position` against the viewport.

2. **No backdrop / scrim painted in overlay-only use.**
   Even with `overlay=true`, no dimming backdrop appeared and page content was
   not visually de-emphasized when the content slot was empty.
   **Workaround:** the fixed host layer paints its own `rgba(15,23,42,.4)` scrim,
   and we added our own backdrop-click-to-close + Esc handlers.
   **Ask:** guarantee the scrim + backdrop-click/Esc close in overlay mode
   regardless of whether the `content` slot is populated.

3. **No width property.**
   Panel width can only be set via `::part(drawer-container)` CSS; there's no
   `width`/`size` prop or documented CSS custom property.
   **Workaround:** `#drawer::part(drawer-container){ width: 480px; ... }`.
   **Ask:** a `width` prop (or `--vwc-drawer-width` custom property).

4. **`open-changed` event detail shape is undocumented / inconsistent with Vaadin.**
   `vwc-drawer` emits `open-changed` with the **boolean directly** as
   `event.detail` (e.g. `detail === true`), whereas Vaadin components use
   `event.detail.value`. Mixing the two silently broke our open logic (reading
   `.value` gave `undefined` → treated as "closed" → panel re-hid itself on open).
   **Workaround:** `typeof e.detail === 'boolean' ? e.detail : el.open`.
   **Ask:** align on `detail.value` (or document the boolean-detail shape).

5. **Slotted content isn't stretched to panel height (and is slotted at an offset).**
   `drawer-content` content is not sized to the drawer's height, and the host
   places it at a vertical offset — so a flex column with `height:100%` collapses
   (its scroll region never engages) and `height:100vh` overshoots past the
   viewport bottom. Result: the panel's own content overflowed below the viewport
   instead of scrolling internally.
   **Workaround:** pin the slotted panel itself with `position: fixed; top:0;
   right:0; bottom:0` (moving width + shadow onto it), so its `flex:1;
   overflow-y:auto` body scrolls and header/footer stay fixed.
   **Ask:** stretch `drawer-content` to fill the drawer panel (no offset), so a
   normal `height:100%` flex column with an internal scroll area just works.

6. **Built-in close (collapse-button) vs. custom header.**
   The drawer renders its own collapse/close button; we needed a custom title
   row + close affordance, so we set `closable="false"` and supplied our own.
   Minor — works fine — but worth noting there's no "header slot with a built-in
   close on the right" preset.

**Net:** `vwc-drawer` is usable for a floating overlay drawer, but only with a
fixed host + `::part` anchoring + our own scrim/close. An official overlay-drawer
mode would remove all of workarounds 1–3.

---

## `vaadin-dialog` (used by Copy, Share, Assign, Validation, Signature-pad)

Worked well overall. Minor friction:

1. **Renderer-only content (no slotted children).**
   `vaadin-dialog` ignores light-DOM children; header/body/footer must be built
   in `renderer` / `headerRenderer` / `footerRenderer` functions. For content-
   heavy dialogs we kept the markup in `<template>` elements and cloned them into
   the renderer roots, re-wiring events each render. Works, but it's more
   ceremony than a slot-based dialog and means event listeners must be (re)bound
   inside the renderer.
   **Ask:** an optional slotted-content mode for static dialogs.

2. **Overlay sizing via `::part(overlay)`.**
   Dialog width is set with `vaadin-dialog-overlay::part(overlay){ width: … }`
   (or a `theme` attribute to scope it). Fine once known; not obvious.

3. **Header/footer layout is caller's job.**
   The header/footer renderer roots have no default flex layout, so an
   icon+title row or a right-aligned button row needs `::part(header)` /
   `::part(footer)` flex rules per dialog. We scoped these via `theme="…"`.

---

## Cross-cutting: background scroll-lock

Neither `vaadin-dialog` nor `vwc-drawer` freezes background page scroll on their
own — the page (and, in this mock, the compare split-panes) can still scroll
behind an open surface via wheel/trackpad. We added a small reference-counted
`ModalScrollLock` (`body.modal-open { overflow: hidden }` + the same on the split
panes) and push/pop it on every open/close.
**Ask:** a documented "lock background scroll while open" behavior/flag on modal
surfaces (dialog + overlay drawer).
