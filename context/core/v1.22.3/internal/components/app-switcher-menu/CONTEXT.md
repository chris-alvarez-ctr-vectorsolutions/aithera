# `vwc-app-switcher-menu` / `AppSwitcherMenu`

A popover menu that lists Vector product apps the user can switch between, with separate sections for licensed and unlicensed products. Designed to live in the `app-switcher` slot of [`vwc-topnav`](../topnav/CONTEXT.md).

## Usage

```typescript
const sw = document.querySelector('vwc-app-switcher-menu');
sw.products = [
  { id: 'lms', label: 'LMS', url: 'https://lms.example.com', icon: { type: 'svg', path: mdiSchool } }
];
sw.unlicensedProducts = [
  { id: 'safety', label: 'Safety Suite', url: '#' }
];
sw.addEventListener('product-click', (e) => {
  console.log(e.detail); // VectorProduct
});
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `products` | `VectorProduct[]` | `[]` | Licensed products shown in the primary list. |
| `unlicensedProducts` | `VectorProduct[]` | `[]` | Unlicensed products shown in a secondary section. |

See `VectorAppSwitcherMenuProps` and `VectorAppSwitcherMenuActions` exports for the full prop/action types.

## Events

The component dispatches `CustomEvent` instances when products are clicked, with `detail` set to the clicked `VectorProduct`. The action name comes from `VectorAppSwitcherMenuActions`.
