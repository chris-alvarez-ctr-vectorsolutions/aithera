# `vwc-stepper` / `Stepper`

A multi-step flow indicator with optional navigation. Parent container for `vwc-stepper-step` child elements.

## Usage

```html
<vwc-stepper active-step-id="step-2">
  <vwc-stepper-step slot="step" id="step-1" complete>Step 1</vwc-stepper-step>
  <vwc-stepper-step slot="step" id="step-2">Step 2</vwc-stepper-step>
  <vwc-stepper-step slot="step" id="step-3">Step 3</vwc-stepper-step>
</vwc-stepper>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `activeStepId` | `string \| undefined` | first step | ID of the currently active step. Defaults to the first step on initialization. |
| `linear` | `boolean` | `false` | Restricts users from skipping ahead to incomplete steps. |
| `static` | `boolean` | `false` | Disables all step interaction capabilities. |

## Events

| Event | Notes |
|---|---|
| `active-step-change` | Cancelable. Fires when navigation occurs. Call `event.preventDefault()` to prevent the step transition. Also fires on initialization. |

## Gotchas

- The component automatically assigns the first step as active on initialization and fires `active-step-change`.
- In linear mode, only complete steps, steps before the active one, or steps with an error message remain interactive.
- When steps are added dynamically after initial render, you must wait for the next render cycle before they function properly.

## Related

- [`vwc-stepper-step`](../stepper-step/CONTEXT.md) (child)
