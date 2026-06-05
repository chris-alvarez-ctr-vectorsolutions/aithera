# `vwc-language-selector-dialog` / `LanguageSelectorDialog`

A `vaadin-dialog` for choosing the application language from a list of supported locales.

## Usage

```typescript
const dialog = document.querySelector('vwc-language-selector-dialog');
dialog.languages = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' }
];
dialog.selectedLanguageId = 'en';
dialog.opened = true;
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `opened` | `boolean` | `false` | Controls dialog open/close state. |
| `languages` | `VectorLanguage[]` | `[]` | Available languages. |
| `selectedLanguageId` | `string \| undefined` | `undefined` | Currently selected language id. |

See `VectorLanguageSelectorDialogProps` and `VectorLanguageSelectorDialogActions` exports for the full type definitions.
