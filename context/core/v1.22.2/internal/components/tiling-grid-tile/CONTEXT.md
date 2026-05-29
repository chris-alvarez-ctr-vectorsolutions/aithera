# `vwc-tiling-grid-tile` / `TilingGridTile`

A single tile in a [`vwc-tiling-grid`](../tiling-grid/CONTEXT.md). Spanning is controlled per-tile via CSS custom properties on the element's inline `style`.

## Usage

```html
<vwc-tiling-grid-tile style="--vwc-tiling-grid-tile-col-span: 2; --vwc-tiling-grid-tile-row-span: 2;">
  Content
</vwc-tiling-grid-tile>
```

No props or events.

## CSS Custom Properties

Set on the tile via inline `style`:

| Variable | Default | Description |
|---|---|---|
| `--vwc-tiling-grid-tile-col-span` | `1` | How many columns this tile spans. |
| `--vwc-tiling-grid-tile-row-span` | `1` | How many rows this tile spans. |

## Related

- [`vwc-tiling-grid`](../tiling-grid/CONTEXT.md) (parent)
