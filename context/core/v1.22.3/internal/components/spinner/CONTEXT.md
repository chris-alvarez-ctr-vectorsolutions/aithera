# `vwc-spinner` / `Spinner`

An animated loading indicator. Hidden by default — only renders when `loading` is `true`.

## Usage

```html
<vwc-spinner loading loading-message="Loading content..."></vwc-spinner>
```

```typescript
const spinner = document.querySelector('vwc-spinner');
spinner.loading = true;
spinner.loadingMessage = 'Loading...';
spinner.loadCompleteMessage = 'Done';
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `loading` | `boolean` | `false` | Controls visibility and animation state. **The spinner is invisible by default** — always set this to `true` when you want it to show. |
| `loadingMessage` | `string` | - | Accessibility announcement when loading begins. |
| `loadCompleteMessage` | `string` | - | Accessibility announcement when loading ends. |

## Events

| Event | Notes |
|---|---|
| `load-start` | Fires on transition to `loading: true`. |
| `load-end` | Fires on transition to `loading: false`. |

## CSS Custom Properties

| Variable | Default | Description |
|---|---|---|
| `--vwc-spinner-size` | - | Width and height of the spinner. |
| `--vwc-spinner-color` | brand color | Color of the spinner animation. |
| `--vwc-spinner-speed` | `1s` | Duration of one rotation. |

## Gotchas

- **The spinner is invisible by default.** The most frequent mistake is forgetting to set `loading` to `true`.
- `load-start` and `load-end` events fire only on state transitions, not during initial render.
