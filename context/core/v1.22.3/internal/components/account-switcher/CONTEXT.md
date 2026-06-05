# vwc-account-switcher / AccountSwitcher

A `vaadin-select` based switcher that displays a list of accounts (with optional icons or avatar images). When only one account is present it renders that account as plain text instead of a dropdown.

## Usage

```typescript
const sw = document.querySelector('vwc-account-switcher');
sw.accounts = [
  { id: 'acc-1', text: 'Acme Co', image: '/avatars/acme.png' },
  { id: 'acc-2', text: 'Globex',  icon: { type: 'svg', path: mdiBuilding } }
];
sw.selectedAccountId = 'acc-1';
sw.label = 'Account';
sw.addEventListener('account-change', (e) => {
  console.log(e.detail); // new account id
});
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | `''` | Label rendered on the underlying `vaadin-select`. |
| `accounts` | `VectorAccountSwitcherAccount[]` | `[]` | Accounts to choose from. |
| `selectedAccountId` | `string \| undefined` | `undefined` | Currently selected account id. |
| `accountDefaultIcon` | `VectorIcon \| undefined` | `undefined` | Fallback icon shown when an account has no `icon` or `image`. |
| `accountDefaultImage` | `string \| undefined` | `undefined` | Fallback image URL shown when an account has no `icon` or `image` and no `accountDefaultIcon` is set. |

### `VectorAccountSwitcherAccount`

```typescript
{
  id: string;
  text: string;
  icon?: VectorIcon;   // takes precedence over image
  image?: string;      // avatar URL
}
```

## CSS Parts

| Part | Description |
|---|---|
| `select` | The inner `vaadin-select`. Target this to style the dropdown trigger. |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `account-change` | `string` (new selected account id) | Fires when the user picks a different account. |

## Gotchas

- **Renders nothing when `accounts` is empty.**
- **Single-account mode**: when `accounts.length === 1` and that one matches `selectedAccountId`, the component renders the account as plain text (no dropdown). Useful for hiding the switcher UI when there is no real choice.
- Uses Vaadin's `theme="outlined"` on the select.
