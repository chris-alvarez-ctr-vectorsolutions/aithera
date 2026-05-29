# `vwc-card` / `Card`

A general-purpose content card with stackable slots and theme variants.

## Usage

```html
<vwc-card theme="padded elevated">
  <span slot="header">Title</span>
  <p slot="content">Body content.</p>
  <vaadin-button slot="actions" theme="primary">Action</vaadin-button>
</vwc-card>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `theme` | `string` | â | Space-separated list. Valid values: `padded`, `elevated`, `outlined`, `row`. Combining is intentional (`theme="padded elevated"`). |

`row` wraps `header` + `content` in a flex row, which changes the visual order of those two slots relative to each other.

## Slots

| Slot | Purpose |
|---|---|
| `before` | Rendered before everything else (e.g. a colored stripe). |
| `image` | Hero image area. Always renders an empty `div` placeholder if empty. |
| `header` | Title / header content. |
| `content` | Body content. |
| `actions` | Footer action area (buttons, links). |
| `after` | Rendered after everything else. |

## Gotchas

- The `image` slot always renders. An empty `image` slot leaves a blank `div` that takes space.
- `row` only affects `header`/`content` layout. `before`, `image`, `actions`, and `after` are unaffected.
