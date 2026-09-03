# `vwc-course-card` / `CourseCard`

A rich card that displays course information and acts as a radio (single-select) or checkbox (multi-select) input. Includes a "Details" button that opens a `vaadin-dialog` with expanded course information.

## Usage

```html
<!-- Multi-select (checkbox) -->
<vwc-course-card></vwc-course-card>

<!-- Single-select (radio) - multiple cards sharing a formName form a radio group -->
<vwc-course-card form-name="courseGroup"></vwc-course-card>
```

```typescript
card.course = { id: 'c1', title: 'Safety Training', sku: 'SKU-001', version: '2.0', score: 0.92 };
card.courseDefinition = [
  { label: 'Description', propertyPath: 'description', maxLines: 2 },
  { label: 'Duration', propertyPath: 'meta.duration', converter: (v) => `${v} min` }
];
card.addEventListener('checked-change', (e) => {
  console.log(e.detail); // { course: Course, checked: boolean }
});
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `course` | `Course \| undefined` | `undefined` | The course data object to display. |
| `checked` | `boolean` | `false` | Whether this card is currently selected. |
| `disabled` | `boolean` | `false` | Renders the card with a "Assigned" badge and disables selection. |
| `disableSelection` | `boolean` | `false` | Hides the checkbox/radio input entirely. Card becomes display-only. |
| `multi` | `boolean` | `false` | `false` = radio behavior (one selected at a time); `true` = checkbox behavior. |
| `formName` | `string \| undefined` | auto-generated | HTML form name for the underlying input. Cards with the same `formName` form a radio group when `multi: false`. |
| `courseDefinition` | `VectorCourseCardDefinition[]` | `[]` | Array of field descriptors. See below. |
| `scoreThreshold` | `number` | `0.8` | `course.score` must exceed this to show the "Vector Choice" badge. |
| `headingLevel` | `number` | `0` | ARIA heading level (1–6) for the card title. `0` renders the title as plain text with no heading semantics. Attribute: `heading-level`. |
| `containerRole` | `string` | `''` | ARIA role applied to the rendered `.card-container` (e.g. `listitem`). When set, the `display: contents` host is made `role="presentation"`. Set automatically by `vwc-course-list`. Attribute: `container-role`. |
| `i18n` | `VectorCourseCardI18nMap \| undefined` | `undefined` | Per-instance translation strings (see project [CONTEXT.md](../../../../CONTEXT.md)). |

### `Course` type

```typescript
type Course = {
  id: string;
  title: string;
  sku?: string;
  version?: string;
  score?: number; // 0–1; used for Vector Choice badge
};
```

Additional properties may exist and are reached via `courseDefinition[].propertyPath`.

## `courseDefinition` Field Descriptor System

`courseDefinition` is the primary way to control which course properties render on the card and in the details dialog.

```typescript
type VectorCourseCardDefinition = {
  icon?: VectorIcon;          // Optional icon shown next to the field label
  label: string;              // Human-readable field label
  propertyPath: string;       // Dot-delimited path into the Course object (e.g. 'meta.duration')
  hideInCard?: boolean;       // true = only show this field in the details dialog, not on the card face
  isHTML?: boolean;           // true = render value as sanitized HTML (DOMPurify strips scripts/styles)
  maxLines?: number;          // Clamp the field body to this many lines on the card (CSS line-clamp)
  converter?: (value: any) => string; // Transform the raw property value before displaying
};
```

**How `propertyPath` works:** Dot-walked. `'meta.duration'` resolves `course.meta.duration`. Any path that resolves to `null`, `undefined`, or `''` hides that field entirely.

**`hideInCard`:** Fields with `hideInCard: true` only appear in the expanded details dialog. Use this for verbose fields like full descriptions.

**`maxLines`:** Each field body gets a CSS custom property `--vwc-course-card-{fieldName}-max-lines`. The `maxLines` value is the default.

```typescript
card.courseDefinition = [
  {
    label: 'Duration',
    propertyPath: 'duration',
    converter: (v) => `${v} minutes`,
    icon: { type: VectorIconType.svg, path: mdiClockOutline }
  },
  {
    label: 'Description',
    propertyPath: 'description',
    maxLines: 2,
    isHTML: true
  },
  {
    label: 'Category',
    propertyPath: 'category.name'   // nested path
  },
  {
    label: 'Full Objectives',
    propertyPath: 'objectives',
    isHTML: true,
    hideInCard: true                 // Only show in dialog
  }
];
```

## Selection Behavior

- **Radio (`multi: false`):** Checking a card automatically unchecks all other `vwc-course-card` elements on the page sharing the same `formName`. Unselecting the current selection is blocked. Once selected, a radio card stays selected until another is picked.
- **Checkbox (`multi: true`):** Each card toggles independently. No automatic deselection of siblings.
- **`disableSelection: true`:** Removes the hidden `<input>` entirely. The card renders content but fires no `checked-change` events.
- **`disabled: true`:** The card stays in the DOM but shows an "Assigned" badge and the input is disabled. The label text can be overridden via the `disabled-label` slot.

## Slots

| Slot | Purpose |
|---|---|
| `disabled-label` | Override the "Assigned" text shown on a `disabled` card header. |

## Events

| Event | `detail` | Notes |
|---|---|---|
| `checked-change` | `{ course: Course, checked: boolean }` | Fires when the card's selection state changes via user interaction (not on programmatic `checked` set). |

## CSS Parts

The card dynamically exports a CSS part for every rendered field section. Parts are derived from `propertyPath`'s terminal segment.

```css
vwc-course-card::part(description-body) {
  --vwc-course-card-description-max-lines: 4; /* override maxLines for this field */
}
```

Common parts: `<fieldName>-wrapper`, `<fieldName>-label`, `<fieldName>-body`.

## Vector Choice Badge

If `course.score > scoreThreshold` (default `0.8`) and the card is not `disabled`, a "Vector Choice" badge renders in the card header with the Vector Solutions logo. The logo loads from `{assetsURL}/icons/vector-icon.png`. Set `localStorage.setItem('vwc-config#assetsURL', '...')` before mounting.

## Accessibility

- **`headingLevel`** promotes the card title to an ARIA heading (`role="heading"` + `aria-level`) so screen-reader users can jump card to card. Defaults to `0` (plain text, original behavior). Match the value to the host outline.
- **`containerRole`** carries list semantics on the real `.card-container` rather than the `display: contents` host. When set, the title is wired up as the container's `aria-labelledby` target and the host becomes `role="presentation"`. `vwc-course-list` sets this to `listitem` automatically.
- The "Details" button has its own accessible name via the `details_button_aria_label` i18n key (default `'Details for {0}'`, where `{0}` is the course title), so multiple cards' Details buttons stay distinguishable.

## Gotchas

- **`formName` auto-generates** if not set. Each card gets its own unique name, so radio behavior will not work across cards without an explicit shared `formName`.
- **`checked` is controlled.** Setting `checked` programmatically does not fire `checked-change`. The event only fires on user interaction.
- **Hidden input in light DOM.** Each card injects a hidden `<input type="radio|checkbox">` into its own light DOM for form participation. Do not manually add an `<input>`.
- **CSS parts use the terminal segment of `propertyPath`.** A path of `meta.duration` produces parts named `duration-wrapper`, `duration-label`, `duration-body`.
