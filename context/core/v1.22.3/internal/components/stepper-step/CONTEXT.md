# `vwc-stepper-step` / `StepperStep`

A single step in a `vwc-stepper`. Placed in the parent's `step` slot.

## Usage

```html
<vwc-stepper-step slot="step" id="step-1" complete>Step 1</vwc-stepper-step>
<vwc-stepper-step slot="step" id="step-2" error-message="Missing fields">Step 2</vwc-stepper-step>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | - | **Required.** Unique id used by the parent to identify the step. |
| `complete` | `boolean` | `false` | Shows a checkmark icon. |
| `errorMessage` | `string` | - | Shows an error icon and announces error text. |
| `required` | `boolean` | `false` | Marks step as required. |
| `href` | `string` | `javascript:void(0)` | Override the step's link destination. |

## Slots

| Slot | Purpose |
|---|---|
| _(default)_ | Step label text. |
| `complete-icon` | Override the default checkmark icon. |
| `error-icon` | Override the default error icon. |

## Gotchas

- Must use `slot="step"` on the element itself when placed in the parent stepper.
- The component's `relativeData` (computed by the parent) controls whether the step renders. Until the parent runs its `slotchange` handler, the step renders nothing.

## Related

- [`vwc-stepper`](../stepper/CONTEXT.md) (parent)
