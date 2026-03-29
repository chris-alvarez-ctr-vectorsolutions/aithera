# @vector-web-components/core — AI Component Guide

> This file provides implementation context for AI coding assistants (Claude Code, Copilot, etc.) consuming this package. It covers slot composition patterns, parent-child relationships, common gotchas, and when to use one component over another — information not derivable from TypeScript types alone.

---

## Component Index

| Custom Element | React Wrapper | Category |
|---|---|---|
| `vwc-app-switcher-menu` | `AppSwitcherMenu` | Menu |
| `vwc-bread-crumb-nav` | `BreadCrumbNav` | Navigation |
| `vwc-card` | `Card` | Display |
| `vwc-color-picker` | `ColorPicker` | Form / Input |
| `vwc-divider` | `Divider` | Display |
| `vwc-drawer` | `Drawer` | Layout |
| `vwc-form-control-wrapper` | `FormControlWrapper` | Form / Input |
| `vwc-headline` | `Headline` | Display |
| `vwc-icon` | `Icon` | Display |
| `vwc-item` | `Item` | Internal |
| `vwc-language-selector-dialog` | `LanguageSelectorDialog` | Dialog |
| `vwc-notifications-menu` | `NotificationsMenu` | Menu |
| `vwc-notifications-menu-notification` | `NotificationsMenuNotification` | Menu |
| `vwc-paginator` | `Paginator` | Data |
| `vwc-sidenav` | `Sidenav` | Layout / Navigation |
| `vwc-sortable-header` | `SortableHeader` | Data |
| `vwc-spinner` | `Spinner` | Display |
| `vwc-stepper` | `Stepper` | Composite (parent) |
| `vwc-stepper-step` | `StepperStep` | Composite (child) |
| `vwc-switch` | `Switch` | Form / Input |
| `vwc-tiling-grid` | `TilingGrid` | Composite (parent) |
| `vwc-tiling-grid-tile` | `TilingGridTile` | Composite (child) |
| `vwc-toggle-button` | `ToggleButton` | Composite (child) |
| `vwc-toggle-button-group` | `ToggleButtonGroup` | Composite (parent) |
| `vwc-topnav` | `Topnav` | Layout / Navigation |
| `vwc-tree-list` | `TreeList` | Data |
| `vwc-user-menu` | `UserMenu` | Menu |

Vaadin components (`vaadin-button`, `vaadin-grid`, etc.) are re-exported from `@vaadin` packages at version 24.9.6. See [Vaadin docs](https://vaadin.com/docs) for their API.

> **Vaadin theme requirements:** Two rules apply to all Vaadin components (see Vaadin Wrappers section below for details):
> - **Form inputs** (`vaadin-text-field`, `vaadin-text-area`, etc.) require `theme="outlined"` — without it Vaadin renders "filled" style, which is not the Vector default.
> - **`vaadin-button`** requires a style variant (`theme="primary"`, `"secondary"`, or `"tertiary"`) — without one the button renders unstyled.

---

## Component Details

---

### `vwc-card` / `Card`

A general-purpose content card.

**Slots:**

| Slot | Purpose |
|---|---|
| `before` | Content rendered before everything else (e.g. a colored stripe) |
| `image` | Hero image area; renders a blank `div` placeholder if empty |
| `header` | Card title / header content |
| `content` | Card body |
| `actions` | Footer action area (buttons, links) |
| `after` | Content rendered after everything else |

**Props:**

- `theme` — space-separated string; valid values: `padded`, `elevated`, `outlined`, `row`
  - Combining is intentional: `theme="padded elevated"` applies both
  - `row` wraps `header` + `content` in a flex row — this changes the visual order of those two slots relative to each other

**Gotchas:**
- The `image` slot always renders — if you leave it empty you get a blank `div` that takes up space. Provide content or be aware of the spacing.
- `row` only affects the `header`/`content` layout. `before`, `image`, `actions`, and `after` are unaffected.

---

### `vwc-stepper` / `Stepper` + `vwc-stepper-step` / `StepperStep`

A multi-step flow indicator with optional navigation.

**Relationship:** `vwc-stepper` is the parent; `vwc-stepper-step` elements are its children, placed in the `step` slot.

**Basic usage:**
```html
<vwc-stepper active-step-id="step-1">
  <vwc-stepper-step slot="step" id="step-1">Step 1</vwc-stepper-step>
  <vwc-stepper-step slot="step" id="step-2">Step 2</vwc-stepper-step>
  <vwc-stepper-step slot="step" id="step-3">Step 3</vwc-stepper-step>
</vwc-stepper>
```

**Parent (`vwc-stepper`) props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `activeStepId` | `string` | first step's id | Which step is currently active |
| `linear` | `boolean` | `false` | Prevent clicking future steps until previous is complete |
| `static` | `boolean` | `false` | Disable all step navigation |

**Child (`vwc-stepper-step`) props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | — | **Required.** Unique id; used by parent to identify steps |
| `complete` | `boolean` | `false` | Shows a checkmark icon |
| `errorMessage` | `string` | — | Shows an error icon and announces error text |
| `required` | `boolean` | `false` | Marks step as required |
| `href` | `string` | `javascript:void(0)` | Override the step's link destination |

**Stepper-step slots:**

| Slot | Purpose |
|---|---|
| _(default)_ | Step label text |
| `complete-icon` | Override the default checkmark icon |
| `error-icon` | Override the default error icon |

**Events:**

- `active-step-change` (on `vwc-stepper`) — fires when the active step changes. `detail: { step: VectorStepperStepComponent }`. **Cancelable** — call `event.preventDefault()` to block the navigation.

**Critical gotchas:**
- Steps render **nothing** until `relativeData` is set on them by the parent via `slotchange`. This is automatic — but if you dynamically add steps after render you must wait for the next render cycle.
- `activeStepId` automatically defaults to the first step's `id` on initialization, emitting an `active-step-change` event. If you need to control the initial step explicitly, set `activeStepId` before connecting to the DOM.
- In `linear` mode, a step is only clickable if it is: already `complete`, `beforeActive` (i.e. a previous step), or has an `errorMessage`. Future incomplete steps without errors are unclickable.
- Each `vwc-stepper-step` must use `slot="step"` on the element itself.

---

### `vwc-tiling-grid` / `TilingGrid` + `vwc-tiling-grid-tile` / `TilingGridTile`

A CSS-grid layout that auto-arranges tiles with configurable sizing.

**Relationship:** `vwc-tiling-grid` is the parent grid; `vwc-tiling-grid-tile` elements are placed directly inside it (no named slot needed).

**Basic usage:**
```html
<vwc-tiling-grid>
  <vwc-tiling-grid-tile>Default 1×1</vwc-tiling-grid-tile>
  <vwc-tiling-grid-tile style="--vwc-tiling-grid-tile-col-span: 2;">Wide tile</vwc-tiling-grid-tile>
  <vwc-tiling-grid-tile style="--vwc-tiling-grid-tile-row-span: 2;">Tall tile</vwc-tiling-grid-tile>
</vwc-tiling-grid>
```

**No props or events** — all configuration is via CSS custom properties.

**Grid CSS variables (set on `vwc-tiling-grid`):**

| Variable | Default | Description |
|---|---|---|
| `--vwc-tiling-grid-gap` | `16px` | Gap between tiles |
| `--vwc-tiling-grid-cell-min-width` | `200px` | Minimum column width; controls how many columns fit |
| `--vwc-tiling-grid-cell-min-height` | `200px` | Base row height |

**Tile CSS variables (set on `vwc-tiling-grid-tile` via inline `style`):**

| Variable | Default | Description |
|---|---|---|
| `--vwc-tiling-grid-tile-col-span` | `1` | How many columns this tile spans |
| `--vwc-tiling-grid-tile-row-span` | `1` | How many rows this tile spans |

**Gotchas:**
- The grid uses `grid-auto-flow: dense`, so tiles may **not** render in DOM order visually — the grid may place later tiles in earlier gaps. This is intentional for dense layouts.
- There is no `minWidth` / `maxWidth` constraint logic — spanning tiles can overflow if `--vwc-tiling-grid-tile-col-span` exceeds available columns.

---

### `vwc-topnav` / `Topnav`

Top navigation bar with logo, sidenav toggle, and right-side action slots.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `logo` | `{ src: string; alt: string; mobileSrc?: string } \| null` | `null` | Product logo. `mobileSrc` renders a second `img` that is shown on mobile |
| `sidenavId` | `string` | `''` | `id` of the `vwc-sidenav` element; auto-shows a hamburger toggle button |
| `sidenavEl` | `VectorSidenavComponent \| null` | `null` | Direct element reference alternative to `sidenavId` |
| `mainContentId` | `string` | `'main'` | `id` of the main content element for "skip to main" link |
| `helpToggle` | `boolean` | `false` | Show a help icon button |
| `helpAccessibleName` | `string` | — | `aria-label` for the help button |

**Slots:**

| Slot | Position | Gotcha |
|---|---|---|
| `leftSide` | Left side, after logo | — |
| `rightSide` | Right side, before icon buttons | — |
| `app-switcher` | Right side | Renders a blank `div` placeholder if empty — **takes up space** |
| `notifications-menu` | Right side | Renders a blank `div` placeholder if empty — **takes up space** |
| `user-menu` | Right side | Renders a blank `div` placeholder if empty — **takes up space** |

**Events:**

- `help-click` — fires when the help button is clicked (only when `helpToggle: true`)

**Gotchas:**
- `logo` is an **object**, not a string. Do not pass a URL string directly.
- The hamburger toggle button only appears when `sidenavId` or `sidenavEl` is set. Without this, the button is hidden via CSS (still in the DOM).
- The `app-switcher`, `notifications-menu`, and `user-menu` slots always render blank placeholder `div`s as fallbacks — these consume space in the layout. Always provide content for these slots or the layout will have phantom gaps.
- `helpToggle` must be explicitly `true`; it does not default on.

---

### `vwc-drawer` / `Drawer`

A panel that opens from a screen edge, either as a sidebar (pushes content) or an overlay (floats over content with a backdrop).

**Slots:**

| Slot | Purpose |
|---|---|
| `drawer-header` | Header area inside the drawer panel |
| `drawer-content` | Main content inside the drawer panel |
| `content` | Page content that exists **alongside** the drawer (e.g. main content area) |
| `closeIcon` | Override the default collapse/close icon |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | `false` | Whether the drawer is open |
| `overlay` | `boolean` | `false` | `false` = sidebar (pushes content), `true` = overlay (backdrop) |
| `position` | `'start' \| 'end' \| 'top' \| 'bottom'` | `'start'` | Which edge the drawer appears from |
| `closable` | `boolean` | `true` | Show the built-in close button |
| `closeOnOverlayClick` | `boolean` | `true` | Close when clicking the backdrop |
| `overlayBreakpoint` | `number \| undefined` | — | Automatically switch to overlay mode when drawer's **own width** (px) is at or below this value |
| `restoreFocusSelector` | `string \| undefined` | — | CSS selector; element to focus when drawer closes |
| `restoreFocusRoot` | `Document \| ShadowRoot \| undefined` | parent root node | Root to search for `restoreFocusSelector` |
| `resizable` | `boolean` | `false` | Adds a drag handle to resize the drawer |
| `theme` | `string` | — | Pass-through theme string |

**Events:**

- `open-changed` — fires when `open` changes. `detail: boolean` (new open state)
- `overlay-breakpoint-passed` — fires when `overlayBreakpoint` causes a mode switch. `detail: boolean` (new overlay state)

**Gotchas:**
- **Overlay mode makes `content` slot inert.** When `overlay: true` and `open: true`, all elements in the `content` slot become `inert` (non-interactive, not keyboard-focusable). This is intentional — the backdrop blocks interaction with page content.
- **`overlayBreakpoint` compares the drawer's own rendered width**, not the viewport width. This is useful when the drawer is inside a layout that constrains its width (e.g. alongside a sidenav).
- **`resizable: true` only adds a drag handle.** There are no built-in `minWidth`/`maxWidth` constraints — you must apply those yourself via CSS if needed.
- **Focus management:** When the drawer closes, focus returns to the element matching `restoreFocusSelector` — but only if focus was inside the drawer at close time. Set `restoreFocusSelector` to the button that opened the drawer for proper accessibility.
- The close button (`closable`) has `autofocus`, so it receives focus when the drawer opens.

---

### `vwc-toggle-button-group` / `ToggleButtonGroup` + `vwc-toggle-button` / `ToggleButton`

A group of toggle buttons that behave as radio (single-select) or checkbox (multi-select) inputs.

**Relationship:** `vwc-toggle-button-group` manages selection state; `vwc-toggle-button` elements are its slotted children. Only `vwc-toggle-button` elements are valid children — the group throws an error for any other element type.

**Basic usage:**
```html
<!-- Single select (radio behavior) -->
<vwc-toggle-button-group selected="b">
  <vwc-toggle-button value="a">Option A</vwc-toggle-button>
  <vwc-toggle-button value="b">Option B</vwc-toggle-button>
  <vwc-toggle-button value="c">Option C</vwc-toggle-button>
</vwc-toggle-button-group>

<!-- Multi select (checkbox behavior) -->
<vwc-toggle-button-group multiple selected='["a","c"]'>
  <vwc-toggle-button value="a">A</vwc-toggle-button>
  <vwc-toggle-button value="b">B</vwc-toggle-button>
  <vwc-toggle-button value="c">C</vwc-toggle-button>
</vwc-toggle-button-group>
```

**Parent (`vwc-toggle-button-group`) props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `multiple` | `boolean` | `false` | `false` = radio (single), `true` = checkbox (multi) |
| `selected` | `string \| string[]` | — | Currently selected value(s) |
| `displayCheck` | `boolean` | `false` | Show checkmark icon on selected buttons |
| `name` | `string` | — | HTML form `name` for the underlying inputs |

**Child (`vwc-toggle-button`) props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | `''` | Value matched against the group's `selected` |
| `checked` | `boolean` | `false` | Whether this button is selected (controlled by parent) |
| `accessibleName` | `string \| null` | — | Sets `aria-label` on the underlying input |
| `accessibleNameRef` | `string \| null` | — | Sets `aria-labelledby` on the underlying input |
| `displayCheck` | `boolean` | `false` | Show checkmark (propagated from parent) |

**Events:**

- `selection-change` (on `vwc-toggle-button-group`) — `detail` is the current selected value (`string` in single mode, `string[]` in multi mode)
- `checked-change` (on `vwc-toggle-button`) — fires when an individual button's checked state changes

**Gotchas:**
- In single-select mode (`multiple: false`), the group suppresses `selection-change` when a user tries to deselect the current selection. A radio-style group always has one selected item.
- When passing `selected` as an attribute in HTML (not via JS property), multi-select values must be JSON: `selected='["a","b"]'`.
- The `vwc-toggle-button` creates its own `<input>` element in the light DOM. Do not manually add an `<input>` unless you are replacing the managed input via `slot="input"`.
- Adding `theme="icon"` attribute to `vwc-toggle-button` renders it as a compact icon-only button.

---

### `vwc-sidenav` / `Sidenav`

Data-driven side navigation with collapsible groups, footer items, and collapsed (icon-only) mode.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `VectorSidenavItem[]` | `[]` | Navigation items |
| `footerItems` | `(VectorSidenavLink \| VectorSidenavButton)[]` | `[]` | Sticky footer items |
| `collapsed` | `boolean` | `false` | Icon-only mode |
| `expandedGroupIds` | `string[]` | `[]` | IDs of currently expanded groups |
| `activeItemId` | `string \| null` | `null` | ID of the currently active item (highlighted) |
| `accessibleName` | `string` | `'Side Navigation'` | `aria-label` for the nav element |
| `accessibleNameRef` | `string` | — | `aria-labelledby` for the nav element |

**Item types (`VectorSidenavItem`):**

```typescript
// Link item — navigates on click
{ type: 'link', id: string, text: string, href: string, icon?: VectorIcon, target?: string, theme?: 'dark' | 'light' }

// Button item — emits item-click event
{ type: 'button', id: string, text: string, icon?: VectorIcon, theme?: 'dark' | 'light' }

// Group item — collapsible, contains children
{ type: 'group', id: string, text: string, icon?: VectorIcon, children: VectorSidenavItem[], stayOpen?: boolean }

// Divider
{ type: 'divider', theme?: 'dark' | 'light' }
```

**Slots:**

| Slot | Purpose |
|---|---|
| `topFixed` | Content pinned to the top of the sidenav (renders a blank `div` if empty) |

**Events:**

- `item-click` — fires when a `button`-type item is clicked. `detail: VectorSidenavButton`

**Public methods:**

- `toggleCollapsed()` — toggles `collapsed` state and manages focus

**Gotchas:**
- Only `button` type items emit `item-click`. `link` items navigate natively via `href`.
- `group.stayOpen = true` keeps children visible even when the sidenav is `collapsed`. Use for groups that should always show their children icons.
- When a group item's children contain the `activeItemId` but the group is collapsed, the group header itself renders as active. This propagates the active state upward.
- `vwc-topnav` calls `sidenavEl.toggleCollapsed()` directly — wire them together using the topnav's `sidenavId` prop.

---

### `vwc-tree-list` / `TreeList`

A keyboard-navigable tree widget. Data-driven (not slot-based).

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `VectorTreeListItem[]` | `[]` | Tree data (supports recursive `children`) |
| `value` | `string \| string[] \| null` | `null` | Selected item ID(s) |
| `multi` | `boolean` | `false` | Allow multiple selection |
| `accessibleName` | `string` | — | `aria-label` for the tree |
| `accessibleNameRef` | `string` | — | `aria-labelledby` for the tree |

**Item type (`VectorTreeListItem`):**

```typescript
{
  id: string;        // unique identifier
  text: string;      // display label
  icon?: VectorIcon; // optional icon
  subtitle?: string; // optional secondary text
  children?: VectorTreeListItem[]; // makes this item a parent node
}
```

**Events:**

- `value-change` — fires when selection changes. `detail: string | string[] | null` (current value)

**Gotchas:**
- Switching `multi` from `true` to `false` when multiple items are selected auto-selects only the first selected item.
- Items without `children` are leaf nodes (no expand/collapse). Items with `children` show an expand button.
- Keyboard navigation follows ARIA tree pattern (arrow keys, Home/End, Enter/Space) via `TreeListKeyboardMixin`.
- `value` can be a JSON string when set as an HTML attribute: `value='"item-id"'` or `value='["id1","id2"]'`.

---

### `vwc-headline` / `Headline`

A semantic heading with optional icon and subtext.

**Slots:**

| Slot | Purpose |
|---|---|
| `icon` | Icon before the heading text (renders an empty `vwc-icon` placeholder if absent) |
| `header-text` | Main heading text |
| `header-end` | Content after heading text (inline, same row) |
| `subtext` | Secondary text below the heading |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `headingLevel` | `1–6` | `2` | Semantic heading level (`h1`–`h6`). Throws for invalid values. |

**Gotchas:**
- The `icon` slot renders an empty `vwc-icon` element as a placeholder when no icon is provided. This reserves space — use `headingLevel` without an icon to avoid phantom spacing if undesired.
- Default heading font size is `24px` (fixed in component styles).

---

### `vwc-paginator` / `Paginator`

Pagination controls with page-size selector, navigation buttons, and optional jump-to-page input.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `total` | `number` | `0` | Total number of items |
| `page` | `number` | `0` | Current page index (0-based) |
| `pageSize` | `number` | `10` | Items per page |
| `pageSizeOptions` | `number[]` | `[10,25,50,100]` | Available page-size choices |
| `firstLastPageButtonToggle` | `boolean` | `true` | Show first/last page buttons |
| `jumpToPageToggle` | `boolean` | `false` | Show a jump-to-page input |
| `displayRangeToggle` | `boolean` | `true` | Show the "X–Y of Z" range text |

**Events:**

- `page-change` — fires whenever page or pageSize changes (including on initial render). `detail: { page: number, pageSize: number, sort: Record<string, 'asc' | 'desc'> }`

**Gotchas:**
- `page` is **0-based** internally but displayed as 1-based to the user.
- The `page-change` event fires during `willUpdate` — it fires on initial render, not just on user interaction.
- If `pageSize` is not in `pageSizeOptions`, it is automatically reset to the first option.

---

### `vwc-sortable-header` / `SortableHeader`

A sortable table column header button. Designed to be placed inside a `<th>` within a `<tr>`.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `sortDirection` | `'asc' \| 'desc' \| null` | `null` | Current sort direction |
| `accessibleName` | `string` | — | `aria-label` for the sort button |
| `allowMultiSort` | `boolean` | `false` | When `false`, clicking this header clears sort on sibling headers in the same row |

**Events:**

- `sort-direction-change` — fires and bubbles when clicked. `detail: { direction: 'asc' | 'desc' | null }`. Cycles: `null → 'asc' → 'desc' → null`.

**Gotchas:**
- Automatically sets `aria-sort` on the containing `<th>` element (walks up to find it). Must be placed inside `<th>` for this to work.
- `allowMultiSort: false` queries siblings via `parentRow.querySelectorAll('th vwc-sortable-header')` — only works if all sortable headers share the same `<tr>`.

---

### `vwc-bread-crumb-nav` / `BreadCrumbNav`

Breadcrumb navigation with overflow popover for long paths.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `links` | `VectorBreadCrumb[]` | `[]` | Ordered list of breadcrumbs |
| `maxVisibleLinks` | `number` | `3` | Max links before overflow menu appears (minimum: 2) |
| `accesssibleName` | `string` | — | `aria-label` for the `<nav>` (note: 3 s's in prop name) |

**Item type (`VectorBreadCrumb`):**

```typescript
{ text: string; href?: string }
```

**Events:**

- `link-click` — fires when any breadcrumb link is clicked. `detail: VectorBreadCrumb`

**Gotchas:**
- The last link is always rendered as non-interactive (current page indicator, `aria-current="page"`).
- When overflow occurs, middle links collapse into a `...` popover menu. The first link is always visible if `maxVisibleLinks >= 3`.
- Note the prop name has three `s`: `accesssibleName` (not `accessibleName`).

---

### `vaadin-dialog`

A modal or modeless dialog with header, content, and footer regions.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `opened` | `boolean` | `false` | Whether the dialog is open |
| `headerTitle` | `string` | — | Text rendered in the dialog header |
| `modeless` | `boolean` | `false` | When `true`, the dialog is non-modal (no backdrop, page remains interactive) |
| `draggable` | `boolean` | `false` | Allow the dialog to be dragged |
| `resizable` | `boolean` | `false` | Allow the dialog to be resized |
| `noCloseOnEsc` | `boolean` | `false` | Prevent closing on Escape key |
| `noCloseOnOutsideClick` | `boolean` | `false` | Prevent closing when clicking outside |

**Renderer properties (assign functions):**

| Property | Purpose |
|---|---|
| `renderer` | Renders the main dialog body |
| `headerRenderer` | Renders custom header content (overrides `headerTitle`) |
| `footerRenderer` | Renders the footer (e.g. action buttons) |

**Events:**

- `opened-changed` — fires when `opened` changes. `detail: { value: boolean }`

**Gotchas:**
- **Slot-based content does not work.** Unlike most web components, `vaadin-dialog` ignores slotted children for body/header/footer. You must use the renderer function properties.
- Footer buttons are **right-aligned by default**.

> **Vanilla JS note:** In vanilla JS, assign functions directly to `dialog.renderer`, `dialog.headerRenderer`, and `dialog.footerRenderer`. Each function receives a `root` DOM element — append your content into it. Use an `if (root.firstChild) return` guard to avoid duplicating content on re-renders.
>
> ```html
> <vaadin-dialog id="my-dialog" header-title="Confirm"></vaadin-dialog>
>
> <script>
>   const dialog = document.getElementById('my-dialog');
>
>   dialog.renderer = (root) => {
>     if (root.firstChild) return;
>     const p = document.createElement('p');
>     p.textContent = 'Are you sure?';
>     root.appendChild(p);
>   };
>
>   dialog.footerRenderer = (root) => {
>     if (root.firstChild) return;
>
>     const cancelBtn = document.createElement('vaadin-button');
>     cancelBtn.setAttribute('theme', 'secondary');
>     cancelBtn.textContent = 'Cancel';
>     cancelBtn.addEventListener('click', () => { dialog.opened = false; });
>
>     const okBtn = document.createElement('vaadin-button');
>     okBtn.setAttribute('theme', 'primary');
>     okBtn.textContent = 'Ok';
>     okBtn.addEventListener('click', () => { dialog.opened = false; });
>
>     root.appendChild(cancelBtn);
>     root.appendChild(okBtn);
>   };
> </script>
> ```

---

## Stubs — expand as needed

The following components have straightforward APIs derivable from their TypeScript types. Reference the exported interfaces directly for full prop/event details.

| Component | Custom Element | React Wrapper | Key exports |
|---|---|---|---|
| App Switcher Menu | `vwc-app-switcher-menu` | `AppSwitcherMenu` | `VectorAppSwitcherMenuProps`, `VectorAppSwitcherMenuActions` |
| Color Picker | `vwc-color-picker` | `ColorPicker` | `VectorColorPickerProps`, `VectorColorPickerActions` |
| Divider | `vwc-divider` | `Divider` | `VectorDividerProps` |
| Form Control Wrapper | `vwc-form-control-wrapper` | `FormControlWrapper` | `VectorFormControlWrapperProps` |
| Icon | `vwc-icon` | `Icon` | `VectorIconProps` — accepts MDI icon path strings |
| Item | `vwc-item` | `Item` | `VectorItemProps`, `VectorItemActions` — internal nav item used by sidenav |
| Language Selector Dialog | `vwc-language-selector-dialog` | `LanguageSelectorDialog` | `VectorLanguageSelectorDialogProps`, `VectorLanguageSelectorDialogActions` |
| Notifications Menu | `vwc-notifications-menu` | `NotificationsMenu` | `VectorNotificationsMenuProps`, `VectorNotificationsMenuActions` |
| Notifications Menu Notification | `vwc-notifications-menu-notification` | `NotificationsMenuNotification` | `VectorNotificationsMenuNotificationProps` |
| Spinner | `vwc-spinner` | `Spinner` | `VectorSpinnerProps` |
| Switch | `vwc-switch` | `Switch` | `VectorSwitchProps`, `VectorSwitchActions` |
| User Menu | `vwc-user-menu` | `UserMenu` | `VectorUserMenuProps`, `VectorUserMenuActions` |

---

## Vaadin Wrappers

All Vaadin components are re-exported from `@vector-web-components/core` at **Vaadin 24.9.6** and use Vector's theme layer (via `@vector-web-components/themes`). They follow Vaadin's API exactly — refer to [Vaadin 24 documentation](https://vaadin.com/docs/v24/components) for props, slots, and events.

### Critical: `theme="outlined"` on all form inputs

All text-input-style Vaadin components **must** have `theme="outlined"` set explicitly. Vaadin's built-in default (no theme attribute) renders the **filled** style — a gray background with no visible border — which is **not** the Vector design system standard. Always include the attribute on every form input:

```html
<vaadin-text-field theme="outlined" label="Name"></vaadin-text-field>
<vaadin-text-area theme="outlined" label="Description"></vaadin-text-area>
<vaadin-number-field theme="outlined" label="Amount"></vaadin-number-field>
<vaadin-password-field theme="outlined" label="Password"></vaadin-password-field>
<vaadin-select theme="outlined" label="Status"></vaadin-select>
<vaadin-combo-box theme="outlined" label="Country"></vaadin-combo-box>
<vaadin-multi-select-combo-box theme="outlined" label="Tags"></vaadin-multi-select-combo-box>
<vaadin-date-picker theme="outlined" label="Date"></vaadin-date-picker>
<vaadin-date-time-picker theme="outlined" label="Date & Time"></vaadin-date-time-picker>
```

`vaadin-checkbox`, `vaadin-checkbox-group`, `vaadin-radio-group`, `vaadin-button`, and `vaadin-upload` do **not** require `theme="outlined"` — that attribute only affects text-input-style components. See `vaadin-button` guidance below.

---

### `vaadin-button` — always set a style variant

Every `vaadin-button` must have a style variant in its `theme` attribute. Without one, Vaadin renders an unstyled button that does not match the Vector design system. Choose the variant based on the action's importance:

| Variant | When to use |
|---|---|
| `primary` | The single most-important action in a view or dialog (e.g., Save, Submit). Use at most one per context. |
| `secondary` | The default for most actions; alternate or negative-closure actions (e.g., Cancel, Edit). |
| `tertiary` | Lower-importance or repeated actions in constrained spaces (cards, table rows, etc.). |

```html
<vaadin-button theme="primary">Save</vaadin-button>
<vaadin-button theme="secondary">Cancel</vaadin-button>
<vaadin-button theme="tertiary">Details</vaadin-button>
```

**Color modifiers** (`success`, `warning`, `error`) are prepended to the style variant with a space:

```html
<vaadin-button theme="success primary">Confirm</vaadin-button>
<vaadin-button theme="warning secondary">Proceed Anyway</vaadin-button>
<vaadin-button theme="error primary">Delete</vaadin-button>
```

**Icon-only buttons** add `icon` before the variant:

```html
<vaadin-button theme="icon primary" aria-label="Add"><vwc-icon path=${mdiPlus}></vwc-icon></vaadin-button>
<vaadin-button theme="icon secondary" aria-label="Edit"><vwc-icon path=${mdiPencil}></vwc-icon></vaadin-button>
<!-- icon alone (no primary/secondary) renders a borderless/backgroundless icon button -->
<vaadin-button theme="icon" aria-label="More"><vwc-icon path=${mdiDotsVertical}></vwc-icon></vaadin-button>
```

**Usage guidelines:**
- Right-align button groups.
- Place the primary button furthest to the right in a group.
- Prefer notifications or modals over disabling a button when an action is blocked.

---

Re-exported Vaadin elements include:

- Form inputs: `vaadin-text-field`, `vaadin-text-area`, `vaadin-number-field`, `vaadin-password-field`, `vaadin-checkbox`, `vaadin-checkbox-group`, `vaadin-radio-group`, `vaadin-select`, `vaadin-combo-box`, `vaadin-multi-select-combo-box`, `vaadin-date-picker`, `vaadin-date-time-picker`
- Layout/display: `vaadin-accordion`, `vaadin-details`, `vaadin-dialog`, `vaadin-tabs`, `vaadin-tabsheet`, `vaadin-popover`, `vaadin-tooltip`
- Data: `vaadin-grid` (with column/sorter/filter sub-components), `vaadin-virtual-list`, `vaadin-list-box`, `vaadin-item`
- Misc: `vaadin-button`, `vaadin-upload`, `vaadin-progress-bar`, `vaadin-notification`

React wrappers for Vaadin components are exported from `@vector-web-components/core` via `@vaadin/react-components`.
