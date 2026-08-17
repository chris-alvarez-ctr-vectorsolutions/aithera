# `vwc-toggle-button` / `ToggleButton`

An individual toggle button that must be nested within a [`vwc-toggle-button-group`](../toggle-button-group/CONTEXT.md) container. Renders its own `<input>` in the light DOM for form participation.

## Usage

```html
<vwc-toggle-button-group selected="b">
  <vwc-toggle-button value="a">Option A</vwc-toggle-button>
  <vwc-toggle-button value="b">Option B</vwc-toggle-button>
</vwc-toggle-button-group>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | - | Value matched against the parent group's selection. |
| `checked` | `boolean` | `false` | Controlled by parent group — do not set directly. |
| `accessibleName` | `string` | - | `aria-label` for the button. |
| `accessibleNameRef` | `string` | - | `aria-labelledby` for the button. |
| `displayCheck` | `boolean` | `false` | Display a checkmark on the selected button. Propagated from parent group. |

## Slots

| Slot | Purpose |
|---|---|
| _(default)_ | Button label content. |
| `input` | Replace the managed input element (advanced use). |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `checked-change` | `boolean` | Fires when selection state updates. |

## Gotchas

- The button creates its own `<input>` element in the light DOM. Do not manually add an `<input>` unless replacing the managed one via `slot="input"`.
- Use `theme="icon"` to make the button a compact icon-only variant.

## Related

- [`vwc-toggle-button-group`](../toggle-button-group/CONTEXT.md) (parent)
