# `vwc-color-picker` / `ColorPicker`

A button-triggered popover swatch picker. Users open the popover and select a color from a configurable palette.

## Usage

```typescript
const cp = document.querySelector('vwc-color-picker');
cp.colors = [
  { label: 'Red',  value: '#e74c39' },
  { label: 'Blue', value: '#0271ce' }
];
cp.defaultColor = cp.colors[0];
cp.tooltipText = 'Choose color';
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string \| undefined` | `undefined` | HTML form name. |
| `colors` | `VectorColorPickerColor[]` | `[]` | Palette options. |
| `selectedColor` | `VectorColorPickerColor \| undefined` | `undefined` | Currently chosen color. |
| `defaultColor` | `VectorColorPickerColor \| undefined` | `undefined` | Pre-selected fallback. |
| `defaultColorLabel` | `string \| undefined` | `undefined` | Accessible label for the default color. |
| `popoverPosition` | `PopoverPosition` | `'bottom'` | Position of the popover relative to the trigger button. |
| `tooltipPosition` | `TooltipPosition` | `'end'` | Position of the tooltip on the trigger. |
| `tooltipText` | `string` | `'Open color picker'` | Tooltip text on the trigger. |
| `buttonTheme` | `string` | `'secondary'` | Pass-through `theme` for the trigger `vaadin-button`. |

See `VectorColorPickerProps` and `VectorColorPickerActions` exports for the full prop/action types.
