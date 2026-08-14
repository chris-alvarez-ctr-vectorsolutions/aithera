# `vwc-sidenav` / `Sidenav`

Data-driven side navigation with collapsible groups, footer items, and collapsed (icon-only) mode.

## Usage

```typescript
const sidenav = document.querySelector('vwc-sidenav');
sidenav.items = [
  { type: 'link', id: 'home', text: 'Home', href: '/', icon: homeIcon },
  {
    type: 'group',
    id: 'admin',
    text: 'Admin',
    icon: adminIcon,
    children: [
      { type: 'link', id: 'users', text: 'Users', href: '/admin/users' }
    ]
  },
  { type: 'divider' },
  { type: 'button', id: 'logout', text: 'Logout' }
];
sidenav.activeItemId = 'home';
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `VectorSidenavItem[]` | `[]` | Navigation items. |
| `footerItems` | `(VectorSidenavLink \| VectorSidenavButton)[]` | `[]` | Sticky footer items. |
| `collapsed` | `boolean` | `false` | Icon-only mode. |
| `expandedGroupIds` | `string[]` | `[]` | IDs of currently expanded groups. |
| `activeItemId` | `string \| null` | `null` | ID of the currently active item (highlighted). |
| `accessibleName` | `string` | `'Side Navigation'` | `aria-label` for the nav element. |
| `accessibleNameRef` | `string` | - | `aria-labelledby` for the nav element. |

## Item types (`VectorSidenavItem`)

```typescript
// Link item - navigates on click
{ type: 'link', id: string, text: string, href: string, icon?: VectorIcon, target?: string, theme?: 'dark' | 'light' }

// Button item - emits item-click event
{ type: 'button', id: string, text: string, icon?: VectorIcon, theme?: 'dark' | 'light' }

// Group item - collapsible, contains children
{ type: 'group', id: string, text: string, icon?: VectorIcon, children: VectorSidenavItem[], stayOpen?: boolean }

// Divider
{ type: 'divider', theme?: 'dark' | 'light' }
```

## Slots

| Slot | Purpose |
|---|---|
| `topFixed` | Content pinned to the top of the sidenav (renders a blank `div` if empty). |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `item-click` | `VectorSidenavButton` | Fires when a `button`-type item is clicked. |

## Public Methods

| Method | Description |
|---|---|
| `toggleCollapsed()` | Toggles `collapsed` state and manages focus. |

## VectorIcon — How to Specify Icons

`VectorIcon` is a **discriminated union** — the `type` field is always required. Omitting it causes the icon to silently not render (the renderer falls through to the font path with no matching source).

### SVG icons

```typescript
// TypeScript / React
import { VectorIconType } from '@vector-web-components/utils';

const homeIcon = '...'

icon: { type: VectorIconType.svg, path: homeIcon }

// Vanilla JS — use the string literal instead of the enum
icon: { type: 'svg', path: homeIcon }
```

> `path` is the SVG `d` attribute, **not** a file path. Do not pass a URL or file path here.

### Material Symbols font icons

```typescript
icon: { type: VectorIconType.font, src: 'home' }       // TypeScript
icon: { type: 'font', src: 'home' }                    // Vanilla JS
```

`src` is the Material Symbols icon name (lowercase, underscore-separated), e.g. `'assignment'`, `'settings'`, `'history'`.

### Image URL icons

```typescript
icon: { type: VectorIconType.img, src: '/assets/my-icon.svg' }   // TypeScript
icon: { type: 'img', src: '/assets/my-icon.svg' }               // Vanilla JS
```

`src` is any URL (PNG, JPG, or SVG file). Renders as an `<img>` tag.

### Font Awesome (slotted icons)

For Font Awesome or any custom icon library, use `type: 'slotted'`. The icon element is placed as a direct child of `<vwc-sidenav>` using a named slot; the item's `icon.name` must match that slot name. Use the `icon-` prefix convention to avoid slot collisions.

**Item data:**

```typescript
// TypeScript / React
icon: { type: VectorIconType.slotted, name: 'icon-fa-home' }

// Vanilla JS
icon: { type: 'slotted', name: 'icon-fa-home' }
```

**Corresponding HTML** (slotted into `<vwc-sidenav>`):

```html
<vwc-sidenav>
  <span aria-hidden="true" slot="icon-fa-home" class="fa-solid fa-house vwc-icon"></span>
</vwc-sidenav>
```

> Add the `vwc-icon` class to make the icon 24×24px, matching the size of built-in icons. Use `aria-hidden="true"` since the nav item's text label is already the accessible name.

One `<span slot="...">` per unique icon — each item with a different icon needs its own named slot element in the DOM.

See [`VectorIcon` in utils CONTEXT.md](../../../../utils/CONTEXT.md) for the full type definition.

## Gotchas

- Only `button` type items emit `item-click`. `link` items navigate natively via `href`.
- `group.stayOpen = true` keeps children visible even when the sidenav is `collapsed`. Use for groups that should always show their children icons.
- When a group item's children contain `activeItemId` but the group is collapsed, the group header itself renders as active. This propagates the active state upward.
- `vwc-topnav` calls `sidenavEl.toggleCollapsed()` directly. Wire them together using the topnav's `sidenavId` prop.
