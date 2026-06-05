# `vwc-divider` / `Divider`

A horizontal rule with optional inset on either or both ends. Used to visually separate content blocks.

## Usage

```html
<vwc-divider></vwc-divider>
<vwc-divider inset></vwc-divider>
<vwc-divider inset-start></vwc-divider>
<vwc-divider inset-end></vwc-divider>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `inset` | `boolean` | `false` | Apply standard inset on both ends. Reflected as an attribute. |
| `insetStart` | `boolean` | `false` | Inset only the start end. Reflected as an attribute. |
| `insetEnd` | `boolean` | `false` | Inset only the end end. Reflected as an attribute. |

No slots, events, or methods.
