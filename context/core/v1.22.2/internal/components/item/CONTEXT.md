# `vwc-item` / `Item`

An internal nav-item primitive used inside [`vwc-sidenav`](../sidenav/CONTEXT.md), [`vwc-app-switcher-menu`](../app-switcher-menu/CONTEXT.md), and similar list-style components. Renders either a `<a>` link or a `<button>` depending on `type`, with a managed tooltip.

## Usage

Generally not used directly â composed by higher-level components. If you need it standalone:

```html
<vwc-item type="link" href="/courses" accessible-label="Courses" tooltip-text="Go to courses">Courses</vwc-item>
<vwc-item type="button" item-role="menuitem" tooltip-text="More options">More</vwc-item>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | `VectorItemType` (`'button' \| 'link'`) | `'button'` | Render as `<a>` or `<button>`. Reflected as an attribute. |
| `href` | `string \| undefined` | `undefined` | Link destination when `type: 'link'`. |
| `target` | `string \| undefined` | `undefined` | Link target attribute. |
| `itemRole` | `string \| undefined` | `undefined` | ARIA `role` override. |
| `accessibleLabel` | `string \| undefined` | `undefined` | `aria-label` value. |
| `disableTooltip` | `boolean` | `false` | Disable the managed tooltip. |
| `tooltipText` | `string \| undefined` | `undefined` | Tooltip text. |
| `tooltipPosition` | `TooltipPosition` | `'end'` | Tooltip placement. |
| `hideTooltipDescription` | `boolean` | `false` | Hide the secondary tooltip description. |

See `VectorItemProps` and `VectorItemActions` exports for the full type definitions.

## Note

This component is considered internal. Prefer using `vwc-sidenav` data items or other higher-level wrappers rather than wiring `vwc-item` elements directly.
