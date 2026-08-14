# `vwc-drawer` / `Drawer`

A panel that opens from a screen edge, either as a sidebar (pushes content) or an overlay (floats over content with a backdrop).

## Usage

```html
<vwc-drawer open position="start" overlay-breakpoint="640">
  <div slot="drawer-header">Drawer Title</div>
  <div slot="drawer-content">Drawer body content.</div>
  <main slot="content">Page content.</main>
</vwc-drawer>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | `false` | Whether the drawer is open. |
| `overlay` | `boolean` | `false` | `false` = sidebar (pushes content); `true` = overlay (backdrop). |
| `position` | `'start' \| 'end' \| 'top' \| 'bottom'` | `'start'` | Which edge the drawer appears from. |
| `closable` | `boolean` | `true` | Show the built-in close button. |
| `closeOnOverlayClick` | `boolean` | `true` | Close when clicking the backdrop. |
| `overlayBreakpoint` | `number \| undefined` | - | Automatically switch to overlay mode when the drawer's **own width** (px) is at or below this value. |
| `restoreFocusSelector` | `string \| undefined` | - | CSS selector. Element to focus when drawer closes. |
| `restoreFocusRoot` | `Document \| ShadowRoot \| undefined` | parent root node | Root to search for `restoreFocusSelector`. |
| `resizable` | `boolean` | `false` | Adds a drag handle to resize the drawer. |
| `theme` | `string` | - | Pass-through theme string. |

## Slots

| Slot | Purpose |
|---|---|
| `drawer-header` | Header area inside the drawer panel. |
| `drawer-content` | Main content inside the drawer panel. |
| `content` | Page content that exists **alongside** the drawer (e.g. main content area). |
| `closeIcon` | Override the default collapse/close icon. |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `open-changed` | `boolean` (new open state) | Fires when `open` changes. |
| `overlay-breakpoint-passed` | `boolean` (new overlay state) | Fires when `overlayBreakpoint` causes a mode switch. |

## Gotchas

- **Overlay mode makes `content` slot inert.** When `overlay: true` and `open: true`, all elements in the `content` slot become `inert` (non-interactive, non-focusable). This is by design—the backdrop prevents interaction with the page.
- **`overlayBreakpoint` compares the drawer's own rendered width**, not the viewport. This is valuable when the drawer sits within a layout that constrains its width (e.g., alongside another navigation panel).
- **`resizable: true` only adds a drag handle.** No built-in width constraints are applied—add your own via CSS if necessary.
- **Focus management:** When the drawer closes, focus returns to the element matching `restoreFocusSelector`—but only if focus was inside the drawer at close time. Set this selector to the button that opened the drawer for proper accessibility.
- The close button (`closable`) has `autofocus` enabled and receives focus automatically when the drawer opens.
