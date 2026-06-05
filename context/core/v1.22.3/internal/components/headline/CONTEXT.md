# `vwc-headline` / `Headline`

A semantic heading with optional icon and subtext.

## Usage

```html
<vwc-headline heading-level="2">
  <vwc-icon slot="icon" path=${mdiInfo}></vwc-icon>
  <span slot="header-text">Section Title</span>
  <span slot="header-end">(optional inline content)</span>
  <span slot="subtext">Secondary description.</span>
</vwc-headline>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `headingLevel` | `1`–`6` | `2` | Semantic heading level (`h1`–`h6`). Throws for invalid values. |

## Slots

| Slot | Purpose |
|---|---|
| `icon` | Icon before the heading text. Renders an empty `vwc-icon` placeholder if absent. |
| `header-text` | Main heading text. |
| `header-end` | Content after heading text (inline, same row). |
| `subtext` | Secondary text below the heading. |

## Gotchas

- The `icon` slot renders an empty `vwc-icon` element as a placeholder when no icon is provided. This reserves space. Use `headingLevel` without an icon to avoid phantom spacing if undesired.
- Default heading font size is `24px` (fixed in component styles).
