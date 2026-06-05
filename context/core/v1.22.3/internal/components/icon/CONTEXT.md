# `vwc-icon` / `Icon`

An MDI icon renderer that accepts an SVG path string (typically from `@mdi/js`) and renders it inside a `<svg>` element.

## Usage

```html
<vwc-icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></vwc-icon>
```

```typescript
import { mdiHome } from '@mdi/js';
const icon = document.querySelector('vwc-icon');
icon.path = mdiHome;
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `path` | `string \| undefined` | `undefined` | The SVG `d` attribute string, typically sourced from the Material Design Icons library (`@mdi/js`). |

## CSS Custom Properties

| Variable | Default | Description |
|---|---|---|
| `--vwc-icon-size` | `24px` | Width and height of the icon. |
| `--vwc-icon-color` | `currentColor` | Fill color of the icon. |
