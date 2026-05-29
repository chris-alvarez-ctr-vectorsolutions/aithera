# `vwc-notifications-menu` / `NotificationsMenu`

A popover menu showing the user's notifications, with optional tabs for filtering. Designed to live in the `notifications-menu` slot of [`vwc-topnav`](../topnav/CONTEXT.md).

## Usage

```typescript
const menu = document.querySelector('vwc-notifications-menu');
menu.notifications = [
  { id: '1', title: 'New assignment', body: 'Safety Basics due Friday', read: false }
];
menu.notificationTabs = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' }
];
menu.showUnreadNotificationsCount = true;
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `notifications` | `VectorNotification[]` | `[]` | Notifications to display. |
| `notificationTabs` | `VectorNotificationsTab[]` | `[]` | Optional tabs for filtering notifications. |
| `notificationsRenderer` | `Renderer<...> \| undefined` | `undefined` | Optional custom Lit renderer for each notification (advanced). Set as JS property only. |
| `notificationsMenuRole` | `string` | `'dialog'` | ARIA `role` for the popover. |
| `showUnreadNotificationsCount` | `boolean` | `false` | Show an unread badge on the trigger. |

See `VectorNotificationsMenuProps` and `VectorNotificationsMenuActions` exports for the full type definitions. Individual notification rendering is handled by [`vwc-notifications-menu-notification`](../notifications-menu-notification/CONTEXT.md).

## Related

- [`vwc-notifications-menu-notification`](../notifications-menu-notification/CONTEXT.md) - individual notification renderer.
- [`vwc-topnav`](../topnav/CONTEXT.md) - hosts this menu in its `notifications-menu` slot.
