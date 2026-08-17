# `vwc-form-control-wrapper` / `FormControlWrapper`

A thin layout wrapper around a form control (label + helper + error message + slot for the control itself). Use to attach a consistent error state to non-Vaadin inputs.

## Usage

```html
<vwc-form-control-wrapper error-message="Required field">
  <input type="text" name="something" />
</vwc-form-control-wrapper>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `errorMessage` | `string \| undefined` | `undefined` | Error text shown below the slotted control. |

See `VectorFormControlWrapperProps` export for the full prop type.

## Slots

| Slot | Purpose |
|---|---|
| _(default)_ | The form control to wrap. |
