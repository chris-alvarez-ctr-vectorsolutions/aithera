# `vwc-toggle-button` / `ToggleButton`

A single toggle button inside a [`vwc-toggle-button-group`](../toggle-button-group/CONTEXT.md). Renders its own `<input>` in the light DOM for form participation.

## Usage

Always nest inside a `vwc-toggle-button-group`:

```html
<vwc-toggle-button-group selected="b">
  <vwc-toggle-button value="a">A</vwc-toggle-button>
  <vwc-toggle-button value="b">B</vwc-toggle-button>
</vwc-toggle-button-group>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | `''` | Value matched against the group's `selected`. |
| `checked` | `boolean` | `false` | Whether this button is selected (controlled by the parent group). |
| `accessibleName` | `string \| null` | â | Sets `aria-label` on the underlying input. |
| `accessibleNameRef` | `string \| null` | â | Sets `aria-labelledby` on the underlying input. |
| `displayCheck` | `boolean` | `false` | Show checkmark (propagated from the parent group). |

## Slots

| Slot | Purpose |
|---|---|
| _(default)_ | Button label content. |
| `input` | Replace the managed `<input>` element (advanced use). |

## Themes

`theme="icon"` renders the button as a compact icon-only button.

## Events

| Event | `detail` | Notes |
|---|---|---|
| `checked-change` | `boolean` | Fires when this button's checked state changes. |

## Gotchas

- The button creates its own `<input>` element in the light DOM. Do not manually add an `<input>` unless replacing the managed one via `slot="input"`.

## Related

- [`vwc-toggle-button-group`](../toggle-button-group/CONTEXT.md) (parent)
