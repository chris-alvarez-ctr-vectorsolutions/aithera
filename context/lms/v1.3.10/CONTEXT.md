# @vector-web-components/lms - AI Component Guide

> This file is an AI-readable index of components in this package. For implementation details on a specific component, follow its link in the table below.

The LMS package contains components closely related to Vector's LMS applications: course cards, loading skeletons, and other learner-facing UI primitives.

## Component Index

| Component | Custom Element | React Wrapper | Path |
|---|---|---|---|
| Course Card | `vwc-course-card` | `CourseCard` | internal/components/course-card/CONTEXT.md |
| Course Card Loading Skeleton | `vwc-course-card-loading-skeleton` | `CourseCardLoadingSkeleton` | internal/components/course-card-loading-skeleton/CONTEXT.md |

> The Path column is the relative location of each component's CONTEXT.md inside the installed `@vector-web-components/lms` package (under `node_modules/`) and at the same path under the versioned CDN URL.

## Cross-Cutting Concerns

### Asset URL

Components that load images from the Vector CDN (e.g. `vwc-course-card` loads the Vector Choice logo) read the CDN base URL from `localStorage`:

```javascript
localStorage.setItem('vwc-config#assetsURL', 'https://cdn.example.com/assets');
```

Set this before any LMS components mount so they pick up the value via `WatchStorageMixin`.

### i18n

`VectorCourseCardI18nMap` keys with English defaults:

| Key | Default |
|---|---|
| `version_label` | `'Version'` |
| `sku_label` | `'SKU'` |
| `vector_choice_label` | `'Vector Choice'` |
| `details_button_label` | `'Details'` |
| `details_button_aria_label` | `'Details for {0}'` |
| `course_details_title` | `'Course Details'` |
| `close_label` | `'Close'` |
| `cancel_label` | `'Cancel'` |
| `select_label` | `'Select'` |
