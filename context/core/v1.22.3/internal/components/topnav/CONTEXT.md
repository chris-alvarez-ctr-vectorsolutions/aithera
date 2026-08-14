# `vwc-topnav` / `Topnav`

Top navigation bar with logo, sidenav toggle, and right-side action slots.

## Usage

```html
<vwc-topnav
  .logo=${{ src: '/logo.svg', alt: 'Vector', mobileSrc: '/logo-icon.svg' }}
  sidenav-id="main-sidenav"
  help-toggle
  help-accessible-name="Open help"
>
  <div slot="leftSide">...</div>
  <div slot="rightSide">...</div>
  <vwc-app-switcher-menu slot="app-switcher"></vwc-app-switcher-menu>
  <vwc-notifications-menu slot="notifications-menu"></vwc-notifications-menu>
  <vwc-user-menu slot="user-menu"></vwc-user-menu>
</vwc-topnav>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `logo` | `{ src: string; alt: string; mobileSrc?: string } \| null` | `null` | Product logo. `mobileSrc` renders a second `img` shown on mobile. |
| `sidenavId` | `string` | `''` | `id` of a `vwc-sidenav` element. Auto-shows a hamburger toggle button. |
| `sidenavEl` | `VectorSidenavComponent \| null` | `null` | Direct element reference alternative to `sidenavId`. |
| `mainContentId` | `string` | `'main'` | `id` of the main content element for "skip to main" link. |
| `helpToggle` | `boolean` | `false` | Show a help icon button. |
| `helpAccessibleName` | `string` | - | `aria-label` for the help button. |

## Slots

| Slot | Position | Notes |
|---|---|---|
| `leftSide` | Left, after logo | - |
| `rightSide` | Right, before icon buttons | - |
| `app-switcher` | Right side | Renders a blank `div` placeholder if empty — **takes up space**. |
| `notifications-menu` | Right side | Renders a blank `div` placeholder if empty — **takes up space**. |
| `user-menu` | Right side | Renders a blank `div` placeholder if empty — **takes up space**. |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `help-click` | none | Fires when the help button is clicked. Only when `helpToggle: true`. |

## Gotchas

- **`logo` is an object, not a string.** Do not pass a URL string directly.
- The hamburger toggle button only appears when `sidenavId` or `sidenavEl` is set. Without one, the button is hidden via CSS (still in the DOM).
- **Prefer `sidenavEl` over `sidenav-id` in plain HTML.**
  ```js
  document.getElementById('topnav').sidenavEl = document.getElementById('main-sidenav');
  ```
- The `app-switcher`, `notifications-menu`, and `user-menu` slots always render blank placeholder `div`s as fallbacks. These consume space in the layout. Always provide content for these slots, or the layout will have phantom gaps.
- `helpToggle` must be explicitly `true`; it does not default on.
