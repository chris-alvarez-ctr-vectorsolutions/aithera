# @vector-web-components/core - AI Component Guide

> This file is an AI-readable index of components in this package. For implementation details on a specific component, follow its link in the table below.

`@vector-web-components/core` ships the primary UI components for the Vector design system: cards, buttons, dialogs, navigation, data presentation, and form controls. It also re-exports a curated set of Vaadin components at a pinned version (see the **Vaadin Runtime** section below).

## Component Index

| Component | Custom Element | React Wrapper | Path |
|---|---|---|---|
| Account Switcher | `vwc-account-switcher` | `AccountSwitcher` | [internal/components/account-switcher/CONTEXT.md](internal/components/account-switcher/CONTEXT.md) |
| App Switcher Menu | `vwc-app-switcher-menu` | `AppSwitcherMenu` | [internal/components/app-switcher-menu/CONTEXT.md](internal/components/app-switcher-menu/CONTEXT.md) |
| Bread Crumb Nav | `vwc-bread-crumb-nav` | `BreadCrumbNav` | [internal/components/bread-crumb-nav/CONTEXT.md](internal/components/bread-crumb-nav/CONTEXT.md) |
| Card | `vwc-card` | `Card` | [internal/components/card/CONTEXT.md](internal/components/card/CONTEXT.md) |
| Color Picker | `vwc-color-picker` | `ColorPicker` | [internal/components/color-picker/CONTEXT.md](internal/components/color-picker/CONTEXT.md) |
| Divider | `vwc-divider` | `Divider` | [internal/components/divider/CONTEXT.md](internal/components/divider/CONTEXT.md) |
| Drawer | `vwc-drawer` | `Drawer` | [internal/components/drawer/CONTEXT.md](internal/components/drawer/CONTEXT.md) |
| Form Control Wrapper | `vwc-form-control-wrapper` | `FormControlWrapper` | [internal/components/form-control-wrapper/CONTEXT.md](internal/components/form-control-wrapper/CONTEXT.md) |
| Headline | `vwc-headline` | `Headline` | [internal/components/headline/CONTEXT.md](internal/components/headline/CONTEXT.md) |
| Icon | `vwc-icon` | `Icon` | [internal/components/icon/CONTEXT.md](internal/components/icon/CONTEXT.md) |
| Item | `vwc-item` | `Item` | [internal/components/item/CONTEXT.md](internal/components/item/CONTEXT.md) |
| Language Selector Dialog | `vwc-language-selector-dialog` | `LanguageSelectorDialog` | [internal/components/language-selector-dialog/CONTEXT.md](internal/components/language-selector-dialog/CONTEXT.md) |
| Notifications Menu | `vwc-notifications-menu` | `NotificationsMenu` | [internal/components/notifications-menu/CONTEXT.md](internal/components/notifications-menu/CONTEXT.md) |
| Notifications Menu Notification | `vwc-notifications-menu-notification` | `NotificationsMenuNotification` | [internal/components/notifications-menu-notification/CONTEXT.md](internal/components/notifications-menu-notification/CONTEXT.md) |
| Paginator | `vwc-paginator` | `Paginator` | [internal/components/paginator/CONTEXT.md](internal/components/paginator/CONTEXT.md) |
| Sidenav | `vwc-sidenav` | `Sidenav` | [internal/components/sidenav/CONTEXT.md](internal/components/sidenav/CONTEXT.md) |
| Sortable Header | `vwc-sortable-header` | `SortableHeader` | [internal/components/sortable-header/CONTEXT.md](internal/components/sortable-header/CONTEXT.md) |
| Spinner | `vwc-spinner` | `Spinner` | [internal/components/spinner/CONTEXT.md](internal/components/spinner/CONTEXT.md) |
| Stepper | `vwc-stepper` | `Stepper` | [internal/components/stepper/CONTEXT.md](internal/components/stepper/CONTEXT.md) |
| Stepper Step | `vwc-stepper-step` | `StepperStep` | [internal/components/stepper-step/CONTEXT.md](internal/components/stepper-step/CONTEXT.md) |
| Switch | `vwc-switch` | `Switch` | [internal/components/switch/CONTEXT.md](internal/components/switch/CONTEXT.md) |
| Tiling Grid | `vwc-tiling-grid` | `TilingGrid` | [internal/components/tiling-grid/CONTEXT.md](internal/components/tiling-grid/CONTEXT.md) |
| Tiling Grid Tile | `vwc-tiling-grid-tile` | `TilingGridTile` | [internal/components/tiling-grid-tile/CONTEXT.md](internal/components/tiling-grid-tile/CONTEXT.md) |
| Toggle Button | `vwc-toggle-button` | `ToggleButton` | [internal/components/toggle-button/CONTEXT.md](internal/components/toggle-button/CONTEXT.md) |
| Toggle Button Group | `vwc-toggle-button-group` | `ToggleButtonGroup` | [internal/components/toggle-button-group/CONTEXT.md](internal/components/toggle-button-group/CONTEXT.md) |
| Topnav | `vwc-topnav` | `Topnav` | [internal/components/topnav/CONTEXT.md](internal/components/topnav/CONTEXT.md) |
| Tree List | `vwc-tree-list` | `TreeList` | [internal/components/tree-list/CONTEXT.md](internal/components/tree-list/CONTEXT.md) |
| User Menu | `vwc-user-menu` | `UserMenu` | [internal/components/user-menu/CONTEXT.md](internal/components/user-menu/CONTEXT.md) |

> The Path column is the relative location of each component's CONTEXT.md inside the installed `@vector-web-components/core` package (under `node_modules/`) and at the same path under the versioned CDN URL.

## Cross-Cutting Concerns

### i18n

VWC components support runtime localization via a global `window.vwcI18n` manager. Most components have no user-facing text; those that do expose an `i18n` prop and document their keys in their per-component CONTEXT.md.

```typescript
import { registerI18nManager } from '@vector-web-components/utils';

// Call once at app startup
registerI18nManager();

// Set translations keyed by component tag name
window.vwcI18n.setLocale('es', {
  'vwc-bread-crumb-nav': { overflow_button_label: 'Más' }
});
```

Mounted components automatically re-render when `setLocale` is called. Per-instance overrides are available via setting the `i18n` property directly on an element.

---

## Vaadin Runtime

`@vector-web-components/core` registers and re-exports a curated set of Vaadin custom elements at **Vaadin v24.9.6**. These are not VWC components. Refer to the [Vaadin 24 docs](https://vaadin.com/docs/v24/components) for their props, slots, events, and theming.

### Available elements

- **Form inputs**: `vaadin-checkbox`, `vaadin-checkbox-group`, `vaadin-combo-box`, `vaadin-date-picker`, `vaadin-date-time-picker`, `vaadin-multi-select-combo-box`, `vaadin-number-field`, `vaadin-password-field`, `vaadin-radio-button`, `vaadin-radio-group`, `vaadin-select`, `vaadin-text-area`, `vaadin-text-field`, `vaadin-time-picker`
- **Layout & display**: `vaadin-accordion`, `vaadin-accordion-heading`, `vaadin-accordion-panel`, `vaadin-details`, `vaadin-details-summary`, `vaadin-dialog`, `vaadin-popover`, `vaadin-tab`, `vaadin-tabs`, `vaadin-tabsheet`, `vaadin-tooltip`
- **Data**: `vaadin-grid` (+ `-column`, `-column-group`, `-filter`, `-filter-column`, `-selection-column`, `-sort-column`, `-sorter`, `-tree-column`, `-tree-toggle`), `vaadin-item`, `vaadin-list-box`, `vaadin-virtual-list`
- **Feedback & misc**: `vaadin-button`, `vaadin-notification`, `vaadin-progress-bar`, `vaadin-upload`

### React wrappers

React wrappers for the above are re-exported from `@vector-web-components/core` via `@vaadin/react-components` at the same Vaadin version. Import them as named exports:

```tsx
import { Button, TextField, Grid } from '@vector-web-components/core';
```

### Lit renderer helpers

`vaadin-popover`, `vaadin-dialog`, and `vaadin-select` use renderer functions instead of static slot content. Import these from their `/lit` entry points:

```typescript
import { popoverRenderer } from '@vaadin/popover/lit';
import { dialogRenderer, dialogHeaderRenderer, dialogFooterRenderer } from '@vaadin/dialog/lit';
import { selectRenderer } from '@vaadin/select/lit.js';
```

Use them as Lit directives inside a template:

```typescript
html`
  <vaadin-popover .target=${this.anchorRef} ${popoverRenderer(this.renderContent.bind(this), [])}></vaadin-popover>
  <vaadin-dialog ${dialogRenderer(this.renderBody.bind(this), [])}
                 ${dialogHeaderRenderer(this.renderHeader.bind(this), [])}
                 ${dialogFooterRenderer(this.renderFooter.bind(this), [])}></vaadin-dialog>
  <vaadin-select ${selectRenderer(this.renderOptions.bind(this), [])}></vaadin-select>
`
```

The second argument to each renderer is a dependencies array — list any reactive values read inside the renderer so it re-renders when they change.

---

### Theme requirements

Two rules apply globally to Vaadin elements re-exported from this package.

#### Text-input form fields require `theme="outlined"`

All input-style Vaadin form fields (`vaadin-text-field`, `vaadin-text-area`, `vaadin-number-field`, `vaadin-password-field`, `vaadin-select`, `vaadin-combo-box`, `vaadin-multi-select-combo-box`, `vaadin-date-picker`, `vaadin-date-time-picker`, `vaadin-time-picker`) **must** include `theme="outlined"`. Without it, Vaadin's default "filled" style renders, which is **not** the Vector design system standard.

```html
<vaadin-text-field theme="outlined" label="Name"></vaadin-text-field>
<vaadin-combo-box theme="outlined" label="Country"></vaadin-combo-box>
```

#### `vaadin-button` requires a style variant

Every `vaadin-button` needs a style variant in its `theme` attribute, or it renders unstyled.

| Variant | When to use |
|---|---|
| `primary` | The single most-important action in a view or dialog. At most one per context. |
| `secondary` | Default for most actions; alternate or negative-closure actions (Cancel, Edit). |
| `tertiary` | Lower-importance or repeated actions in constrained spaces. |

```html
<vaadin-button theme="primary">Save</vaadin-button>
<vaadin-button theme="secondary">Cancel</vaadin-button>
<vaadin-button theme="tertiary">Details</vaadin-button>
```

**Color modifiers** (`success`, `warning`, `error`) prepend to the variant:

```html
<vaadin-button theme="success primary">Confirm</vaadin-button>
<vaadin-button theme="error primary">Delete</vaadin-button>
```

**Icon-only buttons** add `icon` before the variant; `theme="icon"` alone renders a borderless icon button:

```html
<vaadin-button theme="icon primary" aria-label="Add"><vwc-icon path=${mdiPlus}></vwc-icon></vaadin-button>
<vaadin-button theme="icon" aria-label="More"><vwc-icon path=${mdiDotsVertical}></vwc-icon></vaadin-button>
```

**Layout guidelines:**
- Right-align button groups.
- Place the primary button furthest right in a group.
- Prefer notifications or modals over disabling a button when an action is blocked.

`vaadin-checkbox`, `vaadin-checkbox-group`, `vaadin-radio-group`, and `vaadin-upload` do **not** require `theme="outlined"` - that attribute affects only text-input-style components.

---

### Badge

Vaadin Lumo ships badge styles that are loaded automatically when any VWC component from this package is imported. Apply them via the `theme` attribute on any HTML element — most commonly `<span>`.

```html
<span theme="badge">Default</span>
<span theme="badge primary">Primary</span>
<span theme="badge success">Success</span>
<span theme="badge success primary">Success filled</span>
<span theme="badge error">Error</span>
<span theme="badge error primary">Error filled</span>
<span theme="badge contrast">Contrast</span>
<span theme="badge contrast primary">Contrast filled</span>
```

Add `pill` to any theme value for rounded pill-shaped badges:

```html
<span theme="badge primary pill">New</span>
```

**React:** Native HTML elements don't accept `theme` as a prop — use the spread operator workaround:

```tsx
<span {...{ theme: 'badge primary' }}>New</span>
<span {...{ theme: 'badge success pill' }}>Active</span>
```
