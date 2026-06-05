# @vector-web-components/themes - AI Theme Guide

> This file provides CSS variable reference for AI coding assistants (Claude Code, Copilot, etc.) consuming this package. It covers design tokens for typography, color, elevation, spacing, shape, and component-level overrides - information not derivable from component TypeScript types alone.

---

## How the Theme Works

The theme is distributed as a compiled `styles.js` file that adopts a `CSSStyleSheet` onto `document.adoptedStyleSheets`, which automatically penetrates every VWC component's shadow DOM via `InheritStylesMixin`. The `styles.js` must be loaded (via a `<script>` tag or JS `import`) before any VWC components render; loading it after components mount will trigger a re-style, but doing so can cause a flash of unstyled content.

After the stylesheet is adopted, the `vwc#theme-added` custom event fires on `window` with `detail` set to the adopted `CSSStyleSheet`. Components listen for this event internally - consumer applications generally do not need to handle it.

---

## Global Brand Customization

Set these on `:root` to apply a custom brand color system-wide, replacing the default Vector blue.

| Variable | Description |
|---|---|
| `--vwc-brand-color` | Overrides the selection/focus color for Vaadin tabs (`--vaadin-selection-color`) and the topnav border stripe. Also serves as the fallback for focus rings when `--vwc-focus-ring-color-override` is unset. Does **not** override `--lumo-primary-color` globally. |
| `--vwc-brand-text-color` | Overrides `--vaadin-selection-color-text` for selected tab text. |
| `--vwc-focus-ring-color-override` | Highest-priority override for focus ring color across all VWC components. Takes precedence over `--vwc-brand-color`. |

---

## Typography

| Variable | Value | Description |
|---|---|---|
| `--lumo-font-family` | `'Open Sans', sans-serif` | Base font family applied to `html` |
| `--lumo-font-size-m` | `14px` | Base body/input font size |
| `--vaadin-input-field-label-font-weight` | `600` | Font weight for Vaadin form field labels |

---

## Color System - Semantic Tokens

### Primary

| Variable | Value | Usage |
|---|---|---|
| `--lumo-primary-color-10pct` | `#0271ce1a` | Hover backgrounds, subtle highlights |
| `--lumo-primary-color-50pct` | `#0271cec2` | Disabled / subdued primary states |
| `--lumo-primary-color` | `#0271ce` | Primary interactive elements, links, active states |
| `--lumo-primary-text-color` | `#0271ce` | Text in primary context |
| `--lumo-primary-contrast-color` | `#fff` | Text/icons on primary-colored surfaces |

### Error

| Variable | Value | Usage |
|---|---|---|
| `--lumo-error-color-10pct` | `#e71d131a` | Error background tints |
| `--lumo-error-color-50pct` | `#e71d1380` | Subdued error indicators |
| `--lumo-error-color` | `#d83e38` | Error icons, borders, badges |
| `--lumo-error-text-color` | `#ca150c` | Error message text |
| `--lumo-error-contrast-color` | `#fff` | Text/icons on error-colored surfaces |

### Success

| Variable | Value | Usage |
|---|---|---|
| `--lumo-success-color-10pct` | `#1688461a` | Success background tints |
| `--lumo-success-color-50pct` | `#16884680` | Subdued success indicators |
| `--lumo-success-color` | `#158444` | Success icons, borders |
| `--lumo-success-text-color` | `#0a7637` | Success message text |
| `--lumo-success-contrast-color` | `#fff` | Text/icons on success-colored surfaces |

### Warning

| Variable | Value | Usage |
|---|---|---|
| `--lumo-warning-color-10pct` | `#ffcc001a` | Warning background tints |
| `--lumo-warning-color` | `#e0782e` | Warning icons, borders |
| `--lumo-warning-text-color` | `#995211` | Warning message text |
| `--lumo-warning-contrast-color` | `#182739f0` | Text/icons on warning-colored surfaces (dark) |

### Notification (VWC-specific amber/gold)

| Variable | Value | Usage |
|---|---|---|
| `--vwc-notification-color-10pct` | `#ffc7001a` | Notification background tints |
| `--vwc-notification-color-50pct` | `#ffc70080` | Subdued notification indicators |
| `--vwc-notification-color` | `#ffc700` | Notification badges, icons |
| `--vwc-notification-text-color` | `#a66900` | Notification text on light backgrounds |
| `--vwc-notification-contrast-color` | `#fff` | Text/icons on notification-colored surfaces |

### Text

| Variable | Value | Usage |
|---|---|---|
| `--lumo-header-text-color` | `#000000de` | Headings |
| `--lumo-body-text-color` | `#000000de` | Body copy |
| `--lumo-secondary-text-color` | `#00000099` | Subdued labels, captions |
| `--lumo-tertiary-text-color` | `#1c304a85` | Placeholder text, de-emphasized content |
| `--lumo-disabled-text-color` | `#00000061` | Disabled input labels and text |

### Contrast Scale (neutral dark-on-light)

| Variable | Value | Typical Usage |
|---|---|---|
| `--lumo-contrast-5pct` | `#193b670d` | Zebra row backgrounds, hover backgrounds |
| `--lumo-contrast-10pct` | `#1a38601a` | Dividers, subtle borders |
| `--lumo-contrast-20pct` | `#1c375a29` | Input borders, separators |
| `--lumo-contrast-30pct` | `#1c345442` | Stronger borders |
| `--lumo-contrast-40pct` | `#1c324f61` | Secondary borders, select outlines |
| `--lumo-contrast-50pct` | `#1c304a85` | Table borders (default) |
| `--lumo-contrast-60pct` | `#1c2e4599` | Disabled surface borders |
| `--lumo-contrast-70pct` | `#1b2b41b0` | Heavy dividers |
| `--lumo-contrast-80pct` | `#1a293dd4` | Strong visual separators |
| `--lumo-contrast-90pct` | `#18273af0` | Near-black utility surfaces |
| `--lumo-contrast` | `#192434` | Full-contrast text/icons |

### Base

| Variable | Value | Usage |
|---|---|---|
| `--lumo-base-color` | `#fff` | Page and card backgrounds |

---

## Named Color Palettes

These are raw palette tokens - not semantic. Prefer semantic tokens (e.g. `--lumo-primary-color`) for component states. Use palette tokens for data visualization, charts, or custom UI surfaces.

### Conifer (green)

| Variable | Value |
|---|---|
| `--vwc-color-conifer-50` | `#f6fbef` |
| `--vwc-color-conifer-100` | `#e2f2cd` |
| `--vwc-color-conifer-200` | `#d5ecb5` |
| `--vwc-color-conifer-300` | `#c1e394` |
| `--vwc-color-conifer-400` | `#b5dd7f` |
| `--vwc-color-conifer-500` | `#a3d55f` |
| `--vwc-color-conifer-600` | `#94c256` |
| `--vwc-color-conifer-700` | `#749743` |
| `--vwc-color-conifer-800` | `#5a7534` |
| `--vwc-color-conifer-900` | `#445928` |

### Puerto Rico (teal)

| Variable | Value |
|---|---|
| `--vwc-color-puerto-rico-50` | `#ecf9f7` |
| `--vwc-color-puerto-rico-100` | `#c3ebe6` |
| `--vwc-color-puerto-rico-200` | `#a5e2da` |
| `--vwc-color-puerto-rico-300` | `#7cd4c9` |
| `--vwc-color-puerto-rico-400` | `#63ccbe` |
| `--vwc-color-puerto-rico-500` | `#3cbfae` |
| `--vwc-color-puerto-rico-600` | `#37ae9e` |
| `--vwc-color-puerto-rico-700` | `#2b887c` |
| `--vwc-color-puerto-rico-800` | `#216960` |
| `--vwc-color-puerto-rico-900` | `#195049` |

### Picton Blue (light blue)

| Variable | Value |
|---|---|
| `--vwc-color-picton-blue-50` | `#ecf8fd` |
| `--vwc-color-picton-blue-100` | `#c3e8f7` |
| `--vwc-color-picton-blue-200` | `#a6ddf4` |
| `--vwc-color-picton-blue-300` | `#7dcdee` |
| `--vwc-color-picton-blue-400` | `#64c4eb` |
| `--vwc-color-picton-blue-500` | `#3db5e6` |
| `--vwc-color-picton-blue-600` | `#38a5d1` |
| `--vwc-color-picton-blue-700` | `#2b81a3` |
| `--vwc-color-picton-blue-800` | `#22647f` |
| `--vwc-color-picton-blue-900` | `#1a4c61` |

### Vivid Violet (purple)

| Variable | Value |
|---|---|
| `--vwc-color-vivid-violet-50` | `#f7eef9` |
| `--vwc-color-vivid-violet-100` | `#e7c9ed` |
| `--vwc-color-vivid-violet-200` | `#dbafe4` |
| `--vwc-color-vivid-violet-300` | `#cb8ad8` |
| `--vwc-color-vivid-violet-400` | `#c173d1` |
| `--vwc-color-vivid-violet-500` | `#b150c5` |
| `--vwc-color-vivid-violet-600` | `#a149b3` |
| `--vwc-color-vivid-violet-700` | `#7e398c` |
| `--vwc-color-vivid-violet-800` | `#612c6c` |
| `--vwc-color-vivid-violet-900` | `#4a2253` |

### Ecstacy (orange)

| Variable | Value |
|---|---|
| `--vwc-color-ecstacy-50` | `#fef4ea` |
| `--vwc-color-ecstacy-100` | `#fddcbd` |
| `--vwc-color-ecstacy-200` | `#fccb9d` |
| `--vwc-color-ecstacy-300` | `#fbb371` |
| `--vwc-color-ecstacy-400` | `#faa555` |
| `--vwc-color-ecstacy-500` | `#f98e2b` |
| `--vwc-color-ecstacy-600` | `#e38127` |
| `--vwc-color-ecstacy-700` | `#b1651f` |
| `--vwc-color-ecstacy-800` | `#894e18` |
| `--vwc-color-ecstacy-900` | `#693c12` |

### Cinnabar (red)

| Variable | Value |
|---|---|
| `--vwc-color-cinnabar-50` | `#fdedeb` |
| `--vwc-color-cinnabar-100` | `#f8c8c2` |
| `--vwc-color-cinnabar-200` | `#f4ada4` |
| `--vwc-color-cinnabar-300` | `#ef877a` |
| `--vwc-color-cinnabar-400` | `#ec7061` |
| `--vwc-color-cinnabar-500` | `#e74c39` |
| `--vwc-color-cinnabar-600` | `#d24534` |
| `--vwc-color-cinnabar-700` | `#a43628` |
| `--vwc-color-cinnabar-800` | `#7f2a1f` |
| `--vwc-color-cinnabar-900` | `#612018` |

---

## Elevation (Box Shadows)

| Variable | Value |
|---|---|
| `--lumo-box-shadow-xs` | `0 1px 4px -1px #1c304a85` |
| `--lumo-box-shadow-s` | `0 2px 4px -1px #1c375a29, 0 3px 12px -1px #1c345442` |
| `--lumo-box-shadow-m` | `0 2px 6px -1px #1c375a29, 0 8px 24px -4px #1c324f61` |
| `--lumo-box-shadow-l` | `0 3px 18px -2px #1c375a29, 0 12px 48px -6px #1c324f61` |
| `--lumo-box-shadow-xl` | `0 4px 24px -3px #1c375a29, 0 18px 64px -8px #1c324f61` |

---

## Spacing & Sizing

### Spacing Scale

| Variable | Value |
|---|---|
| `--lumo-space-xs` | `0.25rem` |
| `--lumo-space-s` | `0.5rem` |
| `--lumo-space-m` | `1rem` |
| `--lumo-space-l` | `1.5rem` |
| `--lumo-space-xl` | `2.5rem` |

### Component Sizes (interactive element heights)

| Variable | Value |
|---|---|
| `--lumo-size-xs` | `1.625rem` |
| `--lumo-size-s` | `1.875rem` |
| `--lumo-size-m` | `2.75rem` |
| `--lumo-size-l` | `3.25rem` |
| `--lumo-size-xl` | `3.5rem` |

### Icon Sizes

| Variable | Value |
|---|---|
| `--lumo-icon-size-s` | `1.25rem` |
| `--lumo-icon-size-m` | `1.5rem` |
| `--lumo-icon-size-l` | `2.25rem` |

---

## Shape (Border Radius)

| Variable | Value | Usage |
|---|---|---|
| `--lumo-border-radius-s` | `0.25em` | Small corners (chips, tags) |
| `--lumo-border-radius-m` | `0.5em` | Standard corners (cards, panels) |
| `--lumo-border-radius-l` | `0.75em` | Large corners (dialogs, overlays) |
| `--vaadin-button-border-radius` | `4px` | All Vaadin/VWC buttons |
| `--vaadin-input-field-border-radius` | `4px` | All Vaadin input field borders |

---

## Component-Specific CSS Variables

### Topnav (set on `vwc-topnav` or `:root`)

| Variable | Default | Description |
|---|---|---|
| `--vwc-topnav-height` | `72px` | Height of the topnav bar; also consumed by `vwc-sidenav` and `vwc-drawer` for offset positioning |
| `--vwc-topnav-border-color` | `--vwc-brand-color` â†’ `--lumo-primary-color` | Color of the 8px accent stripe along the top edge |
| `--vwc-topnav-user-initials-background-color` | _(none)_ | Background of the user-initials avatar in the user menu popover |
| `--vwc-topnav-user-initials-text-color` | _(none)_ | Text color of the user-initials avatar |
| `--vwc-topnav-unread-notifications-background-color` | `--lumo-error-color` | Background of the unread-count badge on the notifications button |
| `--vwc-topnav-unread-notifications-text-color` | `--lumo-error-contrast-color` | Text color of the unread-count badge |

### Table (set on the `.vwc-table` wrapper element or an ancestor)

| Variable | Default | Description |
|---|---|---|
| `--vwc-table-box-shadow` | `--lumo-box-shadow-m` | Shadow around the table container |
| `--vwc-table-font-color` | `--lumo-body-text-color` | Text color for all table cells |
| `--vwc-table-header-background-color` | `--lumo-base-color` | Background of `<thead>` |
| `--vwc-table-border-color` | `--lumo-contrast-50pct` | Color of row-separator borders |
| `--vwc-table-row-hover-color` | `--lumo-contrast-10pct` | Row background on hover (requires `.vwc-table--hover-indication` modifier class) |
| `--vwc-table-max-height` | _(none - unconstrained)_ | Sets `max-height` on the table scroll container |

### Link (set on `.vwc-link` or an ancestor)

| Variable | Default | Description |
|---|---|---|
| `--vwc-link-color` | `--lumo-body-text-color` | Link text color |
| `--vwc-link-decoration-color` | `--lumo-secondary-text-color` | Underline decoration color |

### Loading Skeleton (set on the skeleton container or an ancestor)

| Variable | Default | Description |
|---|---|---|
| `--vwc-loading-skeleton-container-background-color` | `--lumo-contrast-5pct` | Background of the skeleton placeholder container |
| `--vwc-loading-skeleton-content-color-start` | `--lumo-contrast-5pct` | Start color of the shimmer gradient |
| `--vwc-loading-skeleton-content-color-end` | `--lumo-contrast-20pct` | End color of the shimmer gradient |
| `--vwc-loading-skeleton-anim-speed` | `2s` | Duration of one shimmer animation cycle |

### Color Picker (set on `vwc-color-picker`)

| Variable | Default | Description |
|---|---|---|
| `--vwc-color-picker-color-size` | `32px` | Width and height of each color swatch in the grid |
| `--vwc-color-picker-cols` | `4` | Number of columns in the color swatch grid |

### AI Assistant Overlay (set on `vwc-ai-assistant-overlay`)

| Variable | Default | Description |
|---|---|---|
| `--vwc-ai-assistant-overlay-max-width` | `300px` | Maximum width of the overlay panel |
| `--vwc-ai-assistant-overlay-max-height` | `400px` | Maximum height of the overlay content area |
| `--vwc-ai-assistant-overlay-separator-color` | `--lumo-contrast-20pct` | Color of the header/footer separator lines |
| `--vwc-ai-assistant-overlay-icon-size` | `32px` | Size of the assistant avatar icon |
| `--vwc-ai-assistant-overlay-response-background` | `--lumo-primary-color` | Background of assistant response bubbles |
| `--vwc-ai-assistant-overlay-response-text-color` | `--lumo-primary-contrast-color` | Text color of assistant response bubbles |
| `--vwc-ai-assistant-overlay-message-background` | `--lumo-primary-color` | Background of user message bubbles |
| `--vwc-ai-assistant-overlay-message-text-color` | `--lumo-primary-contrast-color` | Text color of user message bubbles |

---

## Third-Party Theme Integration

### AG Grid

Apply the `vwc-ag-grid` class to the AG Grid host element to activate Vector's AG Grid theme. Key variables it sets (do not override these independently - adjust `--lumo-primary-color` instead):

| Variable | Resolved value | Description |
|---|---|---|
| `--ag-accent-color` | `var(--lumo-primary-color)` | Selection highlight and accent color |
| `--ag-header-background-color` | `var(--lumo-base-color)` | Grid header row background |
| `--ag-border-color` | `none` | Grid outer border |
| `--ag-header-column-resize-handle-color` | `var(--lumo-contrast-20pct)` | Column resize drag handle |

### FullCalendar

Apply the `vwc-fullcalendar` class to the FullCalendar host element. Key variables:

| Variable | Resolved value | Description |
|---|---|---|
| `--fc-button-bg-color` | `var(--lumo-base-color)` | Default button background |
| `--fc-button-active-bg-color` | `var(--lumo-primary-color)` | Active/pressed button background |
| `--fc-button-active-border-color` | `var(--lumo-primary-color)` | Active button border |
| `--fc-border-color` | `var(--lumo-contrast-10pct)` | Calendar grid borders |
| `--fc-page-bg-color` | `var(--lumo-base-color)` | Calendar page background |
| `--fc-today-bg-color` | `var(--lumo-primary-color-10pct)` | Today cell background highlight |
| `--fc-highlight-color` | `var(--lumo-primary-color-10pct)` | Selection/drag highlight |
| `--fc-neutral-bg-color` | `var(--lumo-contrast-10pct)` | Neutral background cells |
| `--fc-button-disabled-opacity` | `0.2` | Opacity for disabled buttons |