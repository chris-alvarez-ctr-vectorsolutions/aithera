# `vwc-course-list` / `CourseList`

The full course-selection widget. Fetches courses via `courseListService`, renders them as `vwc-course-card` elements, manages selection state, and submits assignments through `courseAssignmentService` after the confirmation dialog.

## Usage

```typescript
const el = document.querySelector('vwc-course-list');
el.courseListService = new RecommendationsEngineService(apiURL, token);
el.courseAssignmentService = myAssignmentService;
el.courseAssignee = { name: 'John Smith' };
el.payload = { userId: '123', context: 'onboarding' };
el.courseDefinition = [
  { label: 'Duration', propertyPath: 'duration', converter: v => `${v} min` }
];
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `payload` | `unknown` | `undefined` | Passed as-is to `courseListService.getCourses(payload)`. **Set this to trigger a fetch.** The component renders nothing until `payload` is set. |
| `courseListService` | `CourseListService` | - | **Required.** Fetches courses. Set as a JS property (not attribute). |
| `courseAssignmentService` | `CourseAssignmentService` | - | **Required for assignment.** Submits the assignment. |
| `courseAssignee` | `CourseAssignee` | `{ name: '' }` | The person being assigned. Displayed in the confirmation dialog body. |
| `courseDefinition` | `VectorCourseCardDefinition[]` | `[]` | Forwarded to each `vwc-course-card`. See [`@vector-web-components/lms` course-card CONTEXT.md](../../../../../lms/src/internal/components/course-card/CONTEXT.md). |
| `multi` | `boolean` | `true` | `true` = checkbox multi-select; `false` = radio single-select. |
| `disableSelection` | `boolean` | `false` | Hides all checkboxes/radios. Cards become display-only with no Assign button. |
| `selectedCourseIds` | `string[]` | `[]` | Setter pre-selects by ID; getter returns current selection IDs. **With pagination**, prefer `selectedCourses` because courses on other pages can't be resolved by ID. |
| `selectedCourses` | `Course[]` | `[]` | Direct programmatic control of selected course objects. Use for pagination scenarios. |
| `disabledCourseIds` | `string[]` | `[]` | Course IDs rendered as disabled (already assigned). |
| `scoreThreshold` | `number` | `0.8` | Forwarded to each card for Vector Choice badge logic. |
| `cardHeadingLevel` | `number` | `0` | ARIA heading level (1–6) forwarded to each card's `headingLevel`. `0` leaves card titles as plain text. Attribute: `card-heading-level`. |
| `loadingCardCount` | `number` | `6` | Number of skeleton cards shown while fetching. |
| `enablePagination` | `boolean` | `false` | Enable paginated mode. Requires `getCoursesPaged` on service. |
| `pageSize` | `number` | `6` | Items per page (pagination mode). |
| `pageSizeOptions` | `number[]` | `[6]` | Page-size selector options. |
| `jumpToPageToggle` | `boolean` | `true` | Show jump-to-page input in the paginator. |
| `cardI18n` | `VectorCourseCardI18nMap \| undefined` | `undefined` | Translations forwarded to each `vwc-course-card`. |
| `dialogI18n` | `VectorCourseAssignDialogI18nMap \| undefined` | `undefined` | Translations forwarded to the assign dialog. |
| `i18n` | `VectorCourseListI18nMap \| undefined` | `undefined` | Translations for the list component itself. |

## Events

| Event | `detail` | Cancelable | Notes |
|---|---|---|---|
| `course-load-error` | `unknown` (service error) | no | Fires when `getCourses` / `getCoursesPaged` rejects. |
| `pre-assign` | `{ selectedCourses: Course[], courseAssignee: CourseAssignee }` | **yes** | Fires when user clicks Assign, before the confirmation dialog opens. `event.preventDefault()` blocks the dialog. |
| `pre-assign-validation-error` | `unknown` (returned by `validateCourses`) | no | Fires if `validateCourses` returns a non-null value. |
| `post-assign` | `unknown` (service response) | no | Fires after `assignCourses` resolves. |
| `post-assign-error` | `unknown` (service rejection) | no | Fires if `assignCourses` rejects. |

## Slots

| Slot | Purpose |
|---|---|
| `no-courses-error` | Override the "No courses were found" empty-state message. |
| `error-{code}` | Override error messages by service error code (e.g. `slot="error-not-found"`). |
| `disabled-label` | Forwarded to each `vwc-course-card` as the "Assigned" badge label. |

## Public Methods

| Method | Description |
|---|---|
| `selectAll()` | Selects every course on the current page that isn't already selected. |

## Accessibility

- Cards render as an ARIA list: the grid is `role="list"` and each card is given `containerRole="listitem"`. Loading skeletons and the disabled toolbar placeholders are `aria-hidden` so they stay out of the a11y tree.
- A single visually-hidden `role="status"` live region announces load lifecycle (loading, loaded count, empty, error) and Select All results. The announced copy comes from the `loading_msg`, `courses_loaded_msg`, `no_courses_msg`, `unknown_error_msg`, and `all_selected_msg` i18n keys. The card grid container reflects `aria-busy` while fetching.
- **`cardHeadingLevel`** forwards an ARIA heading level to every card title so screen-reader users can navigate card to card. Defaults to `0` (plain text). Set it to match the host app's outline.

## Gotchas

- **`payload` is the fetch trigger.** Nothing fetches until `payload` is set. Setting `payload` to the same reference does not re-trigger; create a new object to force a refresh.
- **`selectedCourseIds` setter logs a warning** if an ID isn't found in the current task data or `selectedCourses`. With pagination, courses on other pages aren't in the current task. Use `selectedCourses` with `{ id, title }` stubs to track cross-page selections without warnings.
- **`pre-assign` is cancelable.** Call `e.preventDefault()` to intercept before the dialog opens (useful for custom pre-validation UI).
- **Error slot fallback uses the error `code` field** from the service rejection. Implement `ServiceError = { code?: string; message?: string }` in your service throws for targeted error messages.
- **`enablePagination: true` requires `getCoursesPaged`.** If only `getCourses` is implemented, the component logs an error and renders nothing.

## Related

- [`vwc-course-assign-dialog`](../course-assign-dialog/CONTEXT.md) - used internally by this component for the confirmation flow.
