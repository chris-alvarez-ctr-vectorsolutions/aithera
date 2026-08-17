# `vwc-user-menu` / `UserMenu`

A popover user-account menu showing the signed-in user's identity plus a list of menu items (profile, settings, sign out, etc.). Designed to live in the `user-menu` slot of [`vwc-topnav`](../topnav/CONTEXT.md).

## Usage

```typescript
const menu = document.querySelector('vwc-user-menu');
menu.user = { name: 'Jane Doe', email: 'jane@example.com' };
menu.menuItems = [
  { id: 'settings', label: 'Settings' }
];
menu.showMyProfile = true;
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `user` | `VectorUser \| undefined` | `undefined` | Signed-in user identity (name, email). Shows a generic account icon when not set. |
| `accounts` | `VectorAccountSwitcherAccount[]` | `[]` | When 2+ accounts are provided, shows an account switcher and switches the popover to modal mode. |
| `selectedAccountId` | `string \| undefined` | `undefined` | Currently selected account id for the switcher. |
| `accountSwitcherLabel` | `string` | - | Label for the account switcher dropdown. |
| `accountSwitcherAccessibleName` | `string` | - | `aria-label` for the account switcher. |
| `menuItems` | `VectorUserMenuItem[]` | `[]` | Custom menu items rendered between My Profile and Language Selector. |
| `showMyProfile` | `boolean` | `false` | Toggle the My Profile button. |
| `showHelp` | `boolean` | `false` | Toggle the Help button. |

## Slots

| Slot | Purpose |
|---|---|
| `language-selector` | Accepts a `vwc-language-selector-dialog` element to enable language switching within the menu. |

## Events

The component fires events for: `logout`, `profile`, `help`, custom item clicks, `account-change`, and popover state changes. These actions automatically close the menu.

## Rendered item order

User header → account switcher (2+ accounts) → My Profile → custom items → language selector → Help → Logout.

## Gotchas

- When 2 or more accounts are provided, the popover switches to modal mode, preventing dismissal by clicking outside.
- Shows a generic account icon when no `user` is set.
- The i18n map can override default strings like "Logout" and "Open user menu."
