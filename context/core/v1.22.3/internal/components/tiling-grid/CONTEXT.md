# `vwc-tiling-grid` / `TilingGrid`

A CSS-grid layout that auto-arranges [`vwc-tiling-grid-tile`](../tiling-grid-tile/CONTEXT.md) children with configurable sizing.

## Usage

```html
<vwc-tiling-grid>
  <vwc-tiling-grid-tile>Default 1×1</vwc-tiling-grid-tile>
  <vwc-tiling-grid-tile style="--vwc-tiling-grid-tile-col-span: 2;">Wide tile</vwc-tiling-grid-tile>
  <vwc-tiling-grid-tile style="--vwc-tiling-grid-tile-row-span: 2;">Tall tile</vwc-tiling-grid-tile>
</vwc-tiling-grid>
```

No props or events. All configuration is via CSS custom properties.

## CSS Custom Properties

Set on `vwc-tiling-grid`:

| Variable | Default | Description |
|---|---|---|
| `--vwc-tiling-grid-gap` | `16px` | Gap between tiles. |
| `--vwc-tiling-grid-cell-min-width` | `200px` | Minimum column width; controls how many columns fit. |
| `--vwc-tiling-grid-cell-min-height` | `200px` | Base row height. |

## Gotchas

- The grid uses `grid-auto-flow: dense`. Tiles may not render in DOM order visually - the grid may place later tiles in earlier gaps. Intentional for dense layouts.
- There is no `minWidth`/`maxWidth` constraint logic. Spanning tiles can overflow if `--vwc-tiling-grid-tile-col-span` exceeds available columns.

## Related

- [`vwc-tiling-grid-tile`](../tiling-grid-tile/CONTEXT.md) (child)
