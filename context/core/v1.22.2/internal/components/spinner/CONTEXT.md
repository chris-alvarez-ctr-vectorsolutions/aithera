# `vwc-spinner` / `Spinner`

An animated loading indicator. **The spinner is invisible by default** â it only renders when `loading` is `true`.

## Usage

```html
<vwc-spinner loading loading-message="Loading courses" load-complete-message="Courses loaded"></vwc-spinner>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `loading` | `boolean` | `false` | **Required to display.** `false` = `display: none`. `true` = spinning animation shown. |
| `loadingMessage` | `string` | â | Announced to screen readers (live region) when loading starts. |
| `loadCompleteMessage` | `string` | â | Announced to screen readers (live region) when loading ends. |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `load-start` | none | Fires when `loading` transitions from `false` â `true`. |
| `load-end` | none | Fires when `loading` transitions from `true` â `false`. |

## CSS Custom Properties

| Variable | Default | Description |
|---|---|---|
| `--vwc-spinner-size` | inherits from `--vwc-icon-size` | Size of the spinner icon. |
| `--vwc-spinner-color` | `--vwc-brand-color` / `--lumo-primary-color` | Spinner color. |
| `--vwc-spinner-speed` | `1s` | Duration of one full rotation. |

## Gotchas

- **`loading` must be `true` for the spinner to be visible.** Without it the component renders `display: none`. This is the most common implementation mistake. Always set `loading={true}` (React) or `loading` (HTML attribute) when you want the spinner to show.
- Events only fire on **transitions** (`falseâtrue` or `trueâfalse`), not on initial render.
- `loadingMessage` and `loadCompleteMessage` are only announced when set; they are not required.
