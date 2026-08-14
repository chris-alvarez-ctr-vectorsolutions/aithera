# `vwc-sortable-header` / `SortableHeader`

A sortable table column header button. Designed to be placed inside a `<th>` within a `<tr>`.

## Usage

```html
<table>
  <tr>
    <th><vwc-sortable-header accessible-name="Sort by name">Name</vwc-sortable-header></th>
    <th><vwc-sortable-header accessible-name="Sort by date">Date</vwc-sortable-header></th>
  </tr>
</table>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `sortDirection` | `'asc' \| 'desc' \| null` | `null` | Current sort direction. |
| `accessibleName` | `string` | - | `aria-label` for the sort button. |
| `allowMultiSort` | `boolean` | `false` | When `false`, clicking this header clears sort on sibling headers in the same row. |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `sort-direction-change` | `{ direction: 'asc' \| 'desc' \| null }` | Fires (and bubbles) when clicked. Cycles: `null → 'asc' → 'desc' → null`. |

## Gotchas

- **Not for use with `vaadin-grid`.** `vwc-sortable-header` is designed for native HTML `<table>` elements only. For Vaadin Grid, use `<vaadin-grid-sort-column>` instead.
- Automatically sets `aria-sort` on the containing `<th>` element (walks up to find it). Must be placed inside `<th>` for this to work.
- `allowMultiSort: false` queries siblings via `parentRow.querySelectorAll('th vwc-sortable-header')`. Only works if all sortable headers share the same `<tr>`.
