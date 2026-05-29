# `vwc-user-menu` / `UserMenu`

A popover user-account menu showing the signed-in user's identity plus a list of menu items (profile, settings, sign out, etc.). Designed to live in the `user-menu` slot of [`vwc-topnav`](../topnav/CONTEXT.md).

## Usage

```typescript
const menu = document.querySelector('vwc-user-menu');
menu.user = { name: 'Jane Doe', email: 'jane@example.com', avatarUrl: '/avatars/jane.png' };
menu.menuItems = [
  { id: 'profile', label: 'My profile', href: '/profile' },
  { id: 'signout', label: 'Sign out' }
];
menu.helpToggle = true;
menu.myProfileButtonToggle = true;
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `user` | `VectorUser \| null` | `null` | The signed-in user. |
| `helpToggle` | `boolean` | `false` | Show a Help button inside the menu. |
| `myProfileButtonToggle` | `boolean` | `true` | Show the "My profile" button row. |
| `menuItems` | `VectorUserMenuItem[]` | `[]` | Items rendered below the profile section. |
| `accountSwitcherLabel` | `string \| undefined` | `undefined` | Label for the embedded `vwc-account-switcher` (when accounts are passed). |
| `accountSwitcherAccessibleName` | `string \| undefined` | `undefined` | Accessible name for the embedded account switcher. |
| `helpAccessibleName` | `string \| undefined` | `'Open help'` | `aria-label` for the Help button. |

See `VectorUserMenuProps` and `VectorUserMenuActions` exports for the full type definitions.

## Related

- [`vwc-account-switcher`](../account-switcher/CONTEXT.md) - can be embedded inside the user menu.
- [`vwc-topnav`](../topnav/CONTEXT.md) - hosts this menu in its `user-menu` slot.
