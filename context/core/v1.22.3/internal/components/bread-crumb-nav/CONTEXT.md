# `vwc-bread-crumb-nav` / `BreadCrumbNav`

Breadcrumb navigation with overflow popover for long paths.

## Usage

```typescript
const nav = document.querySelector('vwc-bread-crumb-nav');
nav.links = [
  { text: 'Home', href: '/' },
  { text: 'Catalog', href: '/catalog' },
  { text: 'Safety Training' }   // current page, no href
];
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `links` | `VectorBreadCrumb[]` | `[]` | Ordered list of breadcrumbs. |
| `maxVisibleLinks` | `number` | `3` | Max links before overflow menu appears (minimum: 2). |
| `accesssibleName` | `string` | - | `aria-label` for the `<nav>` (note: 3 s's in prop name). |

### `VectorBreadCrumb`

```typescript
{ text: string; href?: string }
```

## Events

| Event | `detail` | Notes |
|---|---|---|
| `link-click` | `VectorBreadCrumb` | Fires when any breadcrumb link is clicked. |

## i18n

| Key | Default |
|---|---|
| `overflow_button_label` | `'More'` |

## Gotchas

- The last link is always rendered as non-interactive (current page indicator, `aria-current="page"`).
- When overflow occurs, middle links collapse into a `...` popover menu. The first link is always visible if `maxVisibleLinks >= 3`.
- The prop name has three `s`: `accesssibleName` (not `accessibleName`).
