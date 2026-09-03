# `vwc-course-assign-dialog` / `CourseAssignDialog`

A `vaadin-dialog` wrapping the assignment confirmation flow. Used internally by [`vwc-course-list`](../course-list/CONTEXT.md). Can also be used standalone if needed.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `opened` | `boolean` | `false` | Controls dialog open/close state. |
| `courseAssignee` | `CourseAssignee` | - | **Required.** Used in the dialog body copy. |
| `selectedCourses` | `Course[]` | `[]` | Courses to confirm. Rendered as a `<ul>` in the dialog body. |
| `courseAssignmentService` | `CourseAssignmentService` | - | **Required.** Called on confirmation. |
| `i18n` | `VectorCourseAssignDialogI18nMap \| undefined` | `undefined` | Per-instance translation strings. |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `assignment-success` | service response | Fires after successful assignment. |
| `assignment-error` | error | Fires if assignment rejects. |

## i18n

`VectorCourseAssignDialogI18nMap` keys (English defaults). `{0}` in `body_msg` is replaced with `courseAssignee.name`.

| Key | Default |
|---|---|
| `cancel_label` | `'Cancel'` |
| `confirm_label` | `'Confirm'` |
| `close_label` | `'Close'` |
| `dialog_header_title` | `'Assign Training'` |
| `submitting_msg` | `'Submitting assignment'` |
| `body_msg` | `'You are about to assign the following courses to {0}'` |

## Gotchas

- The dialog uses `no-close-on-outside-click` and `no-close-on-esc`. Users cannot dismiss it during submission.
- While submission is in progress (`submitting: true`), the close button is replaced with a blank spacer and the footer shows only a spinner. Cancel/Confirm buttons reappear when the request resolves.

## Related

- [`vwc-course-list`](../course-list/CONTEXT.md) - the parent component that opens this dialog internally.
