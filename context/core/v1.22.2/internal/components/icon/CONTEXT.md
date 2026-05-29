# `vwc-icon` / `Icon`

An MDI icon renderer. Accepts an SVG path string (typically from `@mdi/js`) and renders it inside a `<svg>` element.

## Usage

```html
<vwc-icon path=${mdiInfo}></vwc-icon>
```

```typescript
import { mdiPlus } from '@mdi/js';
const el = document.querySelector('vwc-icon');
el.path = mdiPlus;
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `path` | `string \| undefined` | `undefined` | SVG `d` attribute string (typically an MDI export). |

See `VectorIconProps` export for the full prop type.

## CSS Custom Properties

| Variable | Default | Description |
|---|---|---|
| `--vwc-icon-size` | `24px` | Width and height of the icon. |
| `--vwc-icon-color` | `currentColor` | Fill color of the icon path. |
