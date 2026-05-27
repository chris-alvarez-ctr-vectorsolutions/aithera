# Vector Web Components Reference

Complete reference guide for Vector Web Components v1.5.1

## Quick Reference Table

| Component Name | HTML Tag | Category |
|---------------|----------|----------|
| **Form Controls** |
| Text Field | `<vaadin-text-field>` | Forms |
| Text Area | `<vaadin-text-area>` | Forms |
| Password Field | `<vaadin-password-field>` | Forms |
| Number Field | `<vaadin-number-field>` | Forms |
| Select | `<vaadin-select>` | Forms |
| Checkbox | `<vaadin-checkbox>` | Forms |
| Radio Button | `<vaadin-radio-button>` | Forms |
| Switch | `<vwc-switch>` | Forms |
| Date Picker | `<vaadin-date-picker>` | Forms |
| Datetime Picker | `<vaadin-date-time-picker>` | Forms |
| Time Picker | `<vaadin-time-picker>` | Forms |
| Color Picker | `<vwc-color-picker>` | Forms |
| Multi Select Combo Box | `<vaadin-multi-select-combo-box>` | Forms |
| Upload | `<vaadin-upload>` | Forms |
| **Buttons** |
| Button | `<vaadin-button>` | Buttons |
| Toggle Button | `<vwc-toggle-button>` | Buttons |
| Toggle Button Group | `<vwc-toggle-button-group>` | Buttons |
| **Layout** |
| Card | `<vwc-card>` | Layout |
| Accordion | `<vaadin-accordion>` | Layout |
| Accordion Panel | `<vaadin-accordion-panel>` | Layout |
| Details | `<vaadin-details>` | Layout |
| Divider | `<vwc-divider>` | Layout |
| Tiling Grid | `<vwc-tiling-grid>` | Layout |
| **Navigation** |
| Topnav | `<vwc-topnav>` | Navigation |
| Sidenav | `<vwc-sidenav>` | Navigation |
| Bread Crumb Nav | `<vwc-bread-crumb-nav>` | Navigation |
| Tabs | `<vaadin-tabs>` | Navigation |
| Tab | `<vaadin-tab>` | Navigation |
| App Switcher Menu | `<vwc-app-switcher-menu>` | Navigation |
| User Menu | `<vwc-user-menu>` | Navigation |
| **Dialogs & Overlays** |
| Dialog | `<vaadin-dialog>` | Dialogs |
| Drawer | `<vwc-drawer>` | Dialogs |
| Popover | `<vaadin-popover>` | Dialogs |
| Tooltip | `<vaadin-tooltip>` | Dialogs |
| Notification | `<vaadin-notification>` | Dialogs |
| Notifications Menu | `<vwc-notifications-menu>` | Dialogs |
| **Data Display** |
| Badge | `<vaadin-badge>` | Display |
| List Box | `<vaadin-list-box>` | Display |
| Item | `<vwc-item>` | Display |
| Paginator | `<vwc-paginator>` | Display |
| Progress Bar | `<vaadin-progress-bar>` | Display |
| Spinner | `<vwc-spinner>` | Display |
| Tree List | `<vwc-tree-list>` | Display |
| Sortable Header | `<vwc-sortable-header>` | Display |
| **Typography & Media** |
| Headline | `<vwc-headline>` | Typography |
| Icon | `<vwc-icon>` | Media |
| **Interactive** |
| Stepper | `<vwc-stepper>` | Interactive |
| Stepper Step | `<vwc-stepper-step>` | Interactive |
| Language Selector Dialog | `<vwc-language-selector-dialog>` | Interactive |
| Form Control Wrapper | `<vwc-form-control-wrapper>` | Interactive |

---

## Theme System

### Common Theme Attributes

**Form Controls:** `"outlined"` (default)

**Buttons:** `"primary"`, `"secondary"`, `"tertiary"`, `"small"`, `"large"`

**Cards:** `"padded"`, `"elevated"`, `"outlined"`, `"row"`

**Notifications:** `"success"`, `"warning"`, `"error"`, `"primary"`, `"contrast"`

**Badges:** `"badge"`, `"badge primary"`, `"badge success"`, `"badge error"`, `"badge contrast"`, with optional `pill` attribute

---

## CSS Variables Reference

```css
/* Colors — set in styles.js bundle */
--lumo-base-color: #fff;

/* Primary */
--lumo-primary-color: #0271ce;
--lumo-primary-color-10pct: #0271ce1a;
--lumo-primary-color-50pct: #0271cec2;
--lumo-primary-text-color: #0271ce;
--lumo-primary-contrast-color: #fff;

/* Error */
--lumo-error-color: #d83e38;
--lumo-error-color-10pct: #e71d131a;
--lumo-error-color-50pct: #e71d1380;
--lumo-error-text-color: #ca150c;
--lumo-error-contrast-color: #fff;

/* Warning */
--lumo-warning-color: #e0782e;
--lumo-warning-color-10pct: #ffcc001a;
--lumo-warning-text-color: #995211;
--lumo-warning-contrast-color: #182739f0;

/* Success */
--lumo-success-color: #158444;
--lumo-success-color-10pct: #1688461a;
--lumo-success-color-50pct: #16884680;
--lumo-success-text-color: #0a7637;
--lumo-success-contrast-color: #fff;

/* Text */
--lumo-header-text-color: #000000de;
--lumo-body-text-color: #000000de;
--lumo-secondary-text-color: #00000099;
--lumo-tertiary-text-color: #1c304a85;
--lumo-disabled-text-color: #00000061;

/* Grayscale (5,10,20...90 variants) */
--lumo-contrast: #192434;
--lumo-contrast-*pct

/* Vector-specific */
--vwc-primary-inverse-color: #a5c8ff;
--vwc-primary-hover-color: #f5f9fd;
--vwc-contrast-text-color: #eff0f9;
--vwc-base-contrast-5pct: #f4f5f7;

/* Notification */
--vwc-notification-color: #ffc700;
--vwc-notification-color-10pct: #ffc7001a;
--vwc-notification-color-50pct: #ffc70080;
--vwc-notification-text-color: #a66900;
--vwc-notification-contrast-color: #fff;

/* User color palette — each available in 50, 100-900 (50 lightest) */
--vwc-color-conifer-900: #445928;
--vwc-color-puerto-rico-900: #195049;
--vwc-color-picton-blue-900: #1a4c61;
--vwc-color-vivid-violet-900: #4a2253;
--vwc-color-ecstacy-900: #693c12;
--vwc-color-cinnabar-900: #612018;

/* Typography / Spacing / Sizing tokens */
--lumo-font-family
--lumo-font-size-*
--lumo-space-*
--lumo-size-*
--lumo-icon-size-*
--lumo-box-shadow-*
```

---

## Additional Resources

- **Storybook**: https://cdn.staging.vsp-nonprod.com/web-components/@vector-web-components/storybook/latest/
- **Vaadin Components**: https://vaadin.com/docs/latest/components
- **CDN URL**: https://cdn.vsp-prod.com/web-components/@vector-web-components/core/v1.5.1/

**Vector Version:** v1.5.1
**Last Updated:** 2025-11-11

---

> **Note:** This file contains the high-signal quick reference. For full per-component props/slots/themes (Text Field, Card, Dialog renderer patterns, Drawer slots, etc.), see the full reference saved alongside this doc or query the Storybook URL above.
