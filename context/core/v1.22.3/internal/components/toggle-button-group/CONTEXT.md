# `vwc-toggle-button-group` / `ToggleButtonGroup`

A group of [`vwc-toggle-button`](../toggle-button/CONTEXT.md) elements that behave as radio (single-select) or checkbox (multi-select) inputs.

## Usage

```html
<!-- Single select (radio behavior) -->
<vwc-toggle-button-group selected="b">
  <vwc-toggle-button value="a">Option A</vwc-toggle-button>
  <vwc-toggle-button value="b">Option B</vwc-toggle-button>
  <vwc-toggle-button value="c">Option C</vwc-toggle-button>
</vwc-toggle-button-group>

<!-- Multi select (checkbox behavior) -->
<vwc-toggle-button-group multiple selected='["a","c"]'>
  <vwc-toggle-button value="a">A</vwc-toggle-button>
  <vwc-toggle-button value="b">B</vwc-toggle-button>
  <vwc-toggle-button value="c">C</vwc-toggle-button>
</vwc-toggle-button-group>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `multiple` | `boolean` | `false` | `false` = radio (single); `true` = checkbox (multi). |
| `selected` | `string \| string[]` | - | Currently selected value(s). |
| `displayCheck` | `boolean` | `false` | Show checkmark icon on selected buttons (propagates to children). |
| `name` | `string` | - | HTML form `name` for the underlying inputs. |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `selection-change` | `string` (single mode) or `string[]` (multi) | Fires when selection changes. |

## Gotchas

- Only `vwc-toggle-button` elements are valid children. The group throws an error for any other element type.
- In single-select mode (`multiple: false`), the group suppresses `selection-change` when a user tries to deselect the current selection. A radio-style group always has one selected item.
- When passing `selected` as an attribute in HTML (not via JS property), multi-select values must be JSON: `selected='["a","b"]'`.

## Related

- [`vwc-toggle-button`](../toggle-button/CONTEXT.md) (child)
