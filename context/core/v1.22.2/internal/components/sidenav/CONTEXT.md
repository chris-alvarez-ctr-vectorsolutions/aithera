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
| `accessibleNameRef` | `string` | â | `aria-labelledby` for the nav element. |

## Item types (`VectorSidenavItem`)

```typescript
// Link item â navigates on click
{ type: 'link', id: string, text: string, href: string, icon?: VectorIcon, target?: string, theme?: 'dark' | 'light' }

// Button item â emits item-click event
{ type: 'button', id: string, text: string, icon?: VectorIcon, theme?: 'dark' | 'light' }

// Group item â collapsible, contains children
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

## Gotchas

- Only `button` type items emit `item-click`. `link` items navigate natively via `href`.
- `group.stayOpen = true` keeps children visible even when the sidenav is `collapsed`. Use for groups that should always show their children icons.
- When a group item's children contain `activeItemId` but the group is collapsed, the group header itself renders as active. This propagates the active state upward.
- `vwc-topnav` calls `sidenavEl.toggleCollapsed()` directly. Wire them together using the topnav's `sidenavId` prop.
