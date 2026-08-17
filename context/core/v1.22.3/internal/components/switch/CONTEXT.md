# `vwc-switch` / `Switch`

A binary on/off switch input. Renders a hidden `<input type="checkbox">` for form participation under a styled switch UI.

## Usage

```html
<vwc-switch name="notifications" accessible-name="Enable notifications"></vwc-switch>
```

```typescript
const sw = document.querySelector('vwc-switch');
sw.checked = true;
sw.addEventListener('checked-change', (e) => console.log(e.detail));
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `checked` | `boolean` | `false` | Whether the switch is in the on position. Reflected as an attribute. |
| `name` | `string` | - | HTML form `name`. |
| `accessibleName` | `string \| null` | - | `aria-label` for the input. |
| `accessibleNameRef` | `string \| null` | - | `aria-labelledby` for the input. |
| `inputId` | `string` | - | `id` set on the underlying input. |
| `disabled` | `boolean` | `false` | Disable the switch. Reflected as an attribute. |

See `VectorSwitchProps` and `VectorSwitchActions` exports for the full type definitions.
