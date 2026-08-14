# `vwc-paginator` / `Paginator`

Pagination controls with page-size selector, navigation buttons, and optional jump-to-page input.

## Usage

```html
<vwc-paginator
  total="200"
  page="0"
  page-size="25"
  .pageSizeOptions=${[10, 25, 50, 100]}
  jump-to-page-toggle
></vwc-paginator>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `total` | `number` | `0` | Total number of items. |
| `page` | `number` | `0` | Current page index (0-based). |
| `pageSize` | `number` | `10` | Items per page. |
| `pageSizeOptions` | `number[]` | `[10,25,50,100]` | Available page-size choices. |
| `firstLastPageButtonToggle` | `boolean` | `true` | Show first/last page buttons. |
| `jumpToPageToggle` | `boolean` | `false` | Show a jump-to-page input. |
| `displayRangeToggle` | `boolean` | `true` | Show the "X–Y of Z" range text. |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `page-change` | `{ page: number, pageSize: number, sort: Record<string, 'asc' \| 'desc'> }` | Fires whenever page or pageSize changes, including on initial render. |

## Gotchas

- `page` is 0-based internally but displayed as 1-based to users.
- The `page-change` event fires during `willUpdate`. It fires on initial render, not just on user interaction.
- If `pageSize` is not in `pageSizeOptions`, it is automatically reset to the first option.
