# `vwc-stepper` / `Stepper`

A multi-step flow indicator with optional navigation. Parent of [`vwc-stepper-step`](../stepper-step/CONTEXT.md) children.

## Usage

```html
<vwc-stepper active-step-id="step-1">
  <vwc-stepper-step slot="step" id="step-1">Step 1</vwc-stepper-step>
  <vwc-stepper-step slot="step" id="step-2">Step 2</vwc-stepper-step>
  <vwc-stepper-step slot="step" id="step-3">Step 3</vwc-stepper-step>
</vwc-stepper>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `activeStepId` | `string` | first step's id | Which step is currently active. |
| `linear` | `boolean` | `false` | Prevent clicking future steps until previous is complete. |
| `static` | `boolean` | `false` | Disable all step navigation. |

## Slots

| Slot | Purpose |
|---|---|
| `step` | Slot for `vwc-stepper-step` children. All children must use `slot="step"`. |

## Events

| Event | `detail` | Cancelable | Notes |
|---|---|---|---|
| `active-step-change` | `{ step: VectorStepperStepComponent }` | **yes** | Fires when the active step changes. `event.preventDefault()` blocks the navigation. |

## Gotchas

- Steps render nothing until `relativeData` is set on them by the parent via `slotchange`. This is automatic, but if you dynamically add steps after render you must wait for the next render cycle.
- `activeStepId` automatically defaults to the first step's `id` on initialization, emitting an `active-step-change` event. Set `activeStepId` before connecting to the DOM to control the initial step explicitly.
- In `linear` mode, a step is only clickable if it is already `complete`, `beforeActive` (a previous step), or has an `errorMessage`. Future incomplete steps without errors are unclickable.

## Related

- [`vwc-stepper-step`](../stepper-step/CONTEXT.md) (child)
