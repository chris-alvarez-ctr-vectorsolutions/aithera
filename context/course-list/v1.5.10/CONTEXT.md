# @vector-web-components/course-list - AI Component Guide

> This file is an AI-readable index of components in this package. For implementation details on a specific component, follow its link in the table below.

A complete course assignment UI. Fetches courses from a backend via `CourseListService`, renders them as `vwc-course-card` elements (from `@vector-web-components/lms`), manages selection state, and submits assignments via `CourseAssignmentService` after a confirmation dialog. Services are provided by the consuming app.

## Component Index

| Component | Custom Element | React Wrapper | Path |
|---|---|---|---|
| Course List | `vwc-course-list` | `CourseList` | internal/components/course-list/CONTEXT.md |
| Course Assign Dialog | `vwc-course-assign-dialog` | `CourseAssignDialog` | internal/components/course-assign-dialog/CONTEXT.md |

> The Path column is the relative location of each component's CONTEXT.md inside the installed `@vector-web-components/course-list` package (under `node_modules/`) and at the same path under the versioned CDN URL.

## Cross-Cutting Concerns

### Services

The package defines two service contracts that the consuming app must implement (or use the built-in `RecommendationsEngineService` for course fetching).

#### `CourseListService` interface

```typescript
interface CourseListService {
  getCourses?(payload: unknown): Promise<Course[]>;
  getCoursesPaged?(payload: unknown, page: number, pageSize: number): Promise<CourseListResponse>;
}

type Course = {
  id: string;
  title: string;
  sku?: string;
  version?: string;
  score?: number; // 0–1, used for Vector Choice badge threshold
};

type CourseListResponse = {
  courses: Course[];
  total: number; // total across all pages
};
```

Implement either `getCourses` (non-paginated) or `getCoursesPaged` (paginated). If `enablePagination: true` is set on the component but only `getCourses` is implemented, the component logs an error and renders nothing.

#### `RecommendationsEngineService` (built-in)

A concrete `CourseListService` that calls a recommendations API. Available as a named export and on `window.VwcRecommendationsEngineService` when loaded as an IIFE.

```typescript
// Module
import { RecommendationsEngineService } from '@vector-web-components/course-list';
const service = new RecommendationsEngineService(apiURL, token);

// IIFE
const service = new window.VwcRecommendationsEngineService(
  'https://api.example.com',
  'bearer-token'
);
courseList.courseListService = service;
```

POSTs to `{apiURL}/recommendations` with the component's `payload` as the request body. The response is expected to be `{ data: Course[] }`. Maps `learning_activity_id` → `course.id` and `recommendation.relevance_score` → `course.score` automatically.

#### `CourseAssignmentService` interface

```typescript
interface CourseAssignmentService {
  assignCourses(assignee: CourseAssignee, courses: Course[]): Promise<unknown>;
  validateCourses?(assignee: CourseAssignee, courses: Course[]): Promise<unknown | null>;
}

type CourseAssignee = { name: string; };
```

- `assignCourses` - called when the user confirms in the assignment dialog. Resolve on success, reject on failure.
- `validateCourses` - optional pre-assignment validation hook. Return `null` to proceed, any non-null value to block assignment and fire `pre-assign-validation-error`.

### i18n

The course list component reads its own `i18n` plus optional `cardI18n` (forwarded to each card) and `dialogI18n` (forwarded to the assign dialog).

`VectorCourseListI18nMap` keys with English defaults:

| Key | Default |
|---|---|
| `loading_msg` | `'Loading Courses'` |
| `no_courses_msg` | `'No courses were found.'` |
| `courses_loaded_msg` | `'{0} courses loaded'` |
| `all_selected_msg` | `'All {0} courses selected'` |
| `select_all_label` | `'Select All'` |
| `assign_label` | `'Assign'` |
| `unknown_error_msg` | `'An unknown error occurred'` |
| `close_label` | `'close'` |
| `no_selection_msg` | `'Please make a course selection'` |

See each per-component CONTEXT.md for component-specific i18n maps.
