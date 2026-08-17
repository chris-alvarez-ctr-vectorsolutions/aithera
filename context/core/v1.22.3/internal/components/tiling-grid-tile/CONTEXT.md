# `vwc-tiling-grid-tile` / `TilingGridTile`

A single tile component within a `vwc-tiling-grid` parent. The tile's span across columns and rows is configured using CSS custom properties applied directly to the element's inline style attribute.

## Usage

```html
<vwc-tiling-grid-tile style="--vwc-tiling-grid-tile-col-span: 2; --vwc-tiling-grid-tile-row-span: 2;">
  Content
</vwc-tiling-grid-tile>
```

This component has no props or events.

## CSS Custom Properties

Configure these variables via inline styling on the tile:

| Variable | Default | Purpose |
|---|---|---|
| `--vwc-tiling-grid-tile-col-span` | `1` | Number of columns the tile occupies |
| `--vwc-tiling-grid-tile-row-span` | `1` | Number of rows the tile occupies |

## Related

- [`vwc-tiling-grid`](../tiling-grid/CONTEXT.md) (parent container)
