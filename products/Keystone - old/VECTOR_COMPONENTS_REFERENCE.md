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

## Form Controls

### Text Field
**Tag:** `<vaadin-text-field>`

**Common Attributes:**
- `label` (string) - Field label
- `value` (string) - Field value
- `required` (boolean) - Required field indicator
- `readonly` (boolean) - Read-only state
- `helperText` (string) - Helper text below field
- `clearButtonVisible` (boolean) - Show clear button
- `theme` (string) - `"outlined"`

**Usage:**
```html
<vaadin-text-field
  label="Email"
  helperText="Enter your email address"
  theme="outlined"
  required>
</vaadin-text-field>
```

---

### Text Area
**Tag:** `<vaadin-text-area>`

**Common Attributes:**
- `label` (string) - Field label
- `value` (string) - Field value
- `required` (boolean) - Required field indicator
- `readonly` (boolean) - Read-only state
- `helperText` (string) - Helper text below field
- `clearButtonVisible` (boolean) - Show clear button
- `theme` (string) - `"outlined"`

**Usage:**
```html
<vaadin-text-area
  label="Description"
  helperText="Enter a detailed description"
  theme="outlined"
  value="Multi-line text content">
</vaadin-text-area>
```

---

### Password Field
**Tag:** `<vaadin-password-field>`

**Common Attributes:**
- `label` (string) - Field label
- `value` (string) - Password value
- `theme` (string) - `"outlined"`

**Usage:**
```html
<vaadin-password-field
  label="Password"
  theme="outlined">
</vaadin-password-field>
```

---

### Number Field
**Tag:** `<vaadin-number-field>`

**Common Attributes:**
- `label` (string) - Field label
- `value` (string) - Field value
- `required` (boolean) - Required field indicator
- `readonly` (boolean) - Read-only state
- `helperText` (string) - Helper text
- `stepButtonsVisible` (boolean) - Show step buttons
- `min` (number) - Minimum value
- `max` (number) - Maximum value
- `step` (number) - Step increment
- `theme` (string) - `"outlined"`

**Usage:**
```html
<vaadin-number-field
  label="Quantity"
  min="1"
  max="100"
  step="1"
  value="1"
  stepButtonsVisible
  theme="outlined">
</vaadin-number-field>
```

---

### Select
**Tag:** `<vaadin-select>`

**Common Attributes:**
- `label` (string) - Field label
- `value` (string) - Selected value
- `required` (boolean) - Required field indicator
- `helperText` (string) - Helper text
- `theme` (string) - `"outlined"`

**Usage:**
```html
<vaadin-select id="CountrySelect" label="Country" theme="outlined"></vaadin-select>
```

Items in the select can be set using the items property on the component.

```js
  document.querySelector('#CountrySelect').items = [{label: 'Item 1', value: '1'}]
```

---

### Checkbox
**Tag:** `<vaadin-checkbox>`

**Common Attributes:**
- `label` (string) - Checkbox label
- `value` (string) - Form value
- `checked` (boolean) - Checked state
- `disabled` (boolean) - Disabled state
- `name` (string) - Form name

**Usage:**
```html
<vaadin-checkbox
  label="I agree to terms"
  value="agreed"
  checked>
</vaadin-checkbox>
```

---

## Radio Button
**Tag:** `<vaadin-radio-button>`

**Common Attributes:**
- `label` (string) - Radio group label
- `value` (string) - Form value
- `checked` (boolean) - Checked state
- `disabled` (boolean) - Disabled state

**Group Tag:** `<vaadin-radio-group>`

**Common Attributes:**
- `label` (string) - Radio group label
- `theme` (string) - `"horizontal"` or `"vertical"` - layout of radio buttons

**Usage:**
```html
<!-- Always use a radio group with vaadin-radio button -->
<vaadin-radio-group label="Example Group" theme="">
  <vaadin-radio-button label="One" value="1"></vaadin-radio-button>
</vaadin-radio-group>
```

---

### Switch
**Tag:** `<vwc-switch>`

**Common Attributes:**
- `checked` (boolean) - Checked state
- `disabled` (boolean) - Disabled state
- `name` (string) - Form name
- `accessibleName` (string) - Aria label
- `accessibleNameRef` (string) - Aria labelledby
- `inputId` (string) - Input ID

**Usage:**
```html
<vwc-switch
  accessibleName="Enable notifications"
  name="notifications"
  checked>
</vwc-switch>
```

---

### Date Picker
**Tag:** `<vaadin-date-picker>`

**Common Attributes:**
- `label` (string) - Field label
- `value` (string) - ISO date (YYYY-MM-DD)
- `required` (boolean) - Required field indicator
- `readonly` (boolean) - Read-only state
- `helperText` (string) - Helper text
- `theme` (string) - `"outlined"`

**Usage:**
```html
<vaadin-date-picker
  label="Birth Date"
  value="2025-07-09"
  theme="outlined"
  required>
</vaadin-date-picker>
```

---

### Datetime Picker
**Tag:** `<vaadin-date-time-picker>`

**Common Attributes:**
- `label` (string) - Field label
- `value` (string) - ISO datetime (YYYY-MM-DDTHH:mm)
- `required` (boolean) - Required field indicator
- `readonly` (boolean) - Read-only state
- `helperText` (string) - Helper text
- `theme` (string) - `"outlined"`

**Usage:**
```html
<vaadin-date-time-picker
  label="Appointment"
  value="2025-07-09T14:30"
  theme="outlined">
</vaadin-date-time-picker>
```

---

## Buttons

### Button
**Tag:** `<vaadin-button>`

**Common Theme Variants:**
- `"primary"` - Primary button style
- `"secondary"` - Secondary button style
- `"tertiary"` - Tertiary button style
- `"large"` - Large size
- `"small"` - Small size

**Usage:**
```html
<vaadin-button theme="primary large">
  Click Me
</vaadin-button>
```

---

## Layout Components

### Card
**Tag:** `<vwc-card>`

**Common Theme Variants:**
- `"padded"` - Adds padding
- `"elevated"` - Adds shadow elevation
- `"outlined"` - Adds border
- `"row"` - Horizontal layout

**Usage:**
```html
<vwc-card theme="padded elevated">
  <div slot="header">Card title</div>
  <div slot="content">
    Content here.
  </div>
  <div slot="actions">
    <vaadin-button theme="secondary">Secondary action</vaadin-button>
    <vaadin-button theme="primary">Primary action</vaadin-button>
  </div>
</vwc-card>
```

---

### Accordion
**Tag:** `<vaadin-accordion>`
**Panel Tag:** `<vaadin-accordion-panel>`

**Common Theme Variants:**
- `"filled"` - Filled background
- `"small"` - Smaller size
- `"reverse"` - Reverse icon position

**Usage:**
```html
<vaadin-accordion theme="filled">
  <vaadin-accordion-panel summary="Section 1">
    <div>Content for section 1</div>
  </vaadin-accordion-panel>
  <vaadin-accordion-panel summary="Section 2">
    <div>Content for section 2</div>
  </vaadin-accordion-panel>
</vaadin-accordion>
```

---

### Details
**Tag:** `<vaadin-details>`

**Common Theme Variants:**
- `"filled"` - Filled background
- `"small"` - Smaller size
- `"reverse"` - Reverse icon position

**Usage:**
```html
<vaadin-details summary="Click to expand" theme="filled">
  <p>Hidden content that expands when clicked.</p>
</vaadin-details>
```
or to slot in summary content
```html
<vaadin-details theme="">
  <vaadin-details-summary slot="summary">Details Panel</vaadin-details-summary>
  <div>Details Content</div>
</vaadin-details>
```

---

### Divider
**Tag:** `<vwc-divider>`

**Common Attributes:**
- `inset` (boolean) - Adds padding left and right
- `insetStart` (boolean) - Adds padding on left
- `insetEnd` (boolean) - Adds padding on right

**Usage:**
```html
<vwc-divider></vwc-divider>
<vwc-divider inset></vwc-divider>
```

---

## Dialogs & Overlays

### Dialog
**Tag:** `<vaadin-dialog>`

**Common Properties:**
- `opened` (boolean) - Controls visibility
- `headerTitle` (string) - Simple header title (alternative to headerRenderer)
- `renderer` (function) - Function that renders the main dialog content
- `headerRenderer` (function) - Function that renders custom header content
- `footerRenderer` (function) - Function that renders footer content (action buttons)

**Common Attributes:**
- `modeless` (boolean) - Non-modal dialog (allows page interaction)
- `no-close-on-esc` (boolean) - Prevents closing with Escape key
- `no-close-on-outside-click` (boolean) - Prevents closing when clicking backdrop
- `draggable` (boolean) - Makes dialog draggable
- `resizable` (boolean) - Makes dialog resizable

**Events:**
- `closed` - Fired when dialog is closed

---

**Vanilla JavaScript Usage:**

Unlike Lit-based implementations, vanilla JavaScript uses direct property assignment for renderers.

**Basic Example with Simple Header:**
```html
<vaadin-button id="openDialog">Open Dialog</vaadin-button>
<vaadin-dialog></vaadin-dialog>

<script>
  const dialog = document.querySelector('vaadin-dialog');
  const openButton = document.querySelector('#openDialog');

  // Simple header using headerTitle property
  dialog.headerTitle = 'Confirmation';

  // Main content renderer
  dialog.renderer = function(root, dialog) {
    // Check if already rendered to avoid recreation
    if (!root.firstElementChild) {
      const message = document.createElement('p');
      message.textContent = 'Are you sure you want to continue?';
      root.appendChild(message);
    }
  };

  // Footer renderer with action buttons
  dialog.footerRenderer = function(root, dialog) {
    if (!root.firstElementChild) {
      const cancelButton = document.createElement('vaadin-button');
      cancelButton.textContent = 'Cancel';
      cancelButton.addEventListener('click', () => {
        dialog.opened = false;
      });

      const confirmButton = document.createElement('vaadin-button');
      confirmButton.setAttribute('theme', 'primary');
      confirmButton.textContent = 'Confirm';
      confirmButton.addEventListener('click', () => {
        console.log('Confirmed!');
        dialog.opened = false;
      });

      root.appendChild(cancelButton);
      root.appendChild(confirmButton);
    }
  };

  // Open dialog
  openButton.addEventListener('click', () => {
    dialog.opened = true;
  });

  // Handle close event
  dialog.addEventListener('closed', () => {
    console.log('Dialog closed');
  });
</script>
```

---

**Custom Header Example:**
```javascript
// Custom header with close button
dialog.headerRenderer = function(root, dialog) {
  if (!root.firstElementChild) {
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.width = '100%';

    const title = document.createElement('h2');
    title.textContent = 'Custom Header';
    title.style.margin = '0';

    const closeButton = document.createElement('vaadin-button');
    closeButton.setAttribute('theme', 'tertiary');
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
      dialog.opened = false;
    });

    header.appendChild(title);
    header.appendChild(closeButton);
    root.appendChild(header);
  }
};
```

---

**Renderer Function Pattern:**

Each renderer receives two parameters:
- `root`: Container element where you append content
- `dialog`: Reference to the dialog component instance

**Important:** Always check `if (!root.firstElementChild)` to avoid recreating content on every render call.

⚠️ CRITICAL: Avoid Infinite Render Loops

 **Problem:** Calling `requestContentUpdate()` inside event listeners attached by the renderer can create infinite loops that freeze the page.

 **❌ WRONG - Causes Infinite Loop:**
 ```javascript
 dialog.renderer = function(root, dialog) {
   if (!root.firstElementChild) {
     const container = document.createElement('div');
     container.innerHTML = '<vaadin-button id="myBtn">Click</vaadin-button>';
     root.appendChild(container);
   }

   // ❌ BAD: Attaching listeners OUTSIDE the if check
   const btn = root.querySelector('#myBtn');
   btn.addEventListener('click', () => {
     dialog.requestContentUpdate(); // Creates infinite loop!
   });
 };

---

### Drawer
**Tag:** `<vwc-drawer>`

**Common Attributes:**
- `open` (boolean) - Controls visibility
- `position` (string) - `"start"` or `"end"`
- `overlay` (boolean) - Show backdrop
- `closable` (boolean) - Show close button (default: true)
- `closeOnOverlayClick` (boolean) - Close on backdrop click (default: true)

**Common Theme Variants:**
- `"no-padding"` - Remove padding
- `"rounded-top"` - Round top corners
- `"rounded-bottom"` - Round bottom corners

**Usage:**
```html
<vwc-drawer open position="start" overlay closable>
  <div slot="drawer-header">
    drawer header content
  </div>  
  <div slot="drawer-content">
    drawer content
  </div>
  <div slot="content">
    content drawer slides over
  </div>
</vwc-drawer>
```

---

### Notification
**Tag:** `<vaadin-notification>`

**Common Attributes:**
- `opened` (boolean) - Show notification
- `duration` (number) - Duration in ms (default: 5000)
- `position` (string) - Position on screen
- `theme` (string) - Color theme

**Position Options:**
- `"top-stretch"`, `"top-start"`, `"top-center"`, `"top-end"`
- `"middle"`
- `"bottom-start"`, `"bottom-center"`, `"bottom-end"`, `"bottom-stretch"`

**Theme Options:**
- `"success"`, `"warning"`, `"error"`, `"primary"`, `"contrast"`

**Usage:**
```html
<vaadin-notification
  opened
  position="bottom-start"
  theme="success"
  duration="3000">
  <div>Operation completed successfully!</div>
</vaadin-notification>
```

---

### Tooltip
**Tag:** `<vaadin-tooltip>`

**Common Attributes:**
- `text` (string) - Tooltip text
- `position` (string) - Tooltip position

**Position Options:**
- `"top-start"`, `"top"`, `"top-end"`
- `"bottom-start"`, `"bottom"`, `"bottom-end"`
- `"start-top"`, `"start"`, `"start-bottom"`
- `"end-top"`, `"end"`, `"end-bottom"`

**Usage:**
```html
<vaadin-button id="my-button">Hover me</vaadin-button>
<vaadin-tooltip for="my-button" text="This is a helpful tooltip" position="top"></vaadin-tooltip>
```

---

## Data Display

### Badge
**Tag:** `<vaadin-badge>`

**Common Theme Variants:**
- `"badge"` - Default badge
- `"badge primary"` - Primary color
- `"badge success"` - Success color
- `"badge error"` - Error color
- `"badge contrast"` - Contrast color
- Add `"primary"` to any theme for filled style

**Common Attributes:**
- `pill` (boolean) - Pill shape

**Usage:**
```html
<vaadin-badge theme="badge primary">New</vaadin-badge>
<vaadin-badge theme="badge success" pill>5</vaadin-badge>
```

---

### Icon

#### Font Awesome Icons (Recommended)

**Font Awesome 6 Free** is the default icon library for this project. Use Font Awesome for standard UI icons.

**Font Awesome Styles:**
- `fa-solid` - Solid filled icons (most commonly used)
- `fa-regular` - Regular outline icons
- `fa-brands` - Brand logos (GitHub, Twitter, Facebook, LinkedIn, etc.)

**Basic Usage:**
```html
<!-- Solid user icon -->
<i class="fa-solid fa-user"></i>

<!-- Regular home icon -->
<i class="fa-regular fa-home"></i>

<!-- GitHub brand icon -->
<i class="fa-brands fa-github"></i>

<!-- Custom size via CSS -->
<i class="fa-solid fa-envelope" style="font-size: 24px; color: #0271ce;"></i>
```

**Font Awesome Sizing Classes:**
```html
<!-- Relative sizes -->
<i class="fa-solid fa-heart fa-2xs"></i>  <!-- Extra extra small -->
<i class="fa-solid fa-heart fa-xs"></i>   <!-- Extra small -->
<i class="fa-solid fa-heart fa-sm"></i>   <!-- Small -->
<i class="fa-solid fa-heart"></i>         <!-- Default (1em) -->
<i class="fa-solid fa-heart fa-lg"></i>   <!-- Large (1.33x) -->
<i class="fa-solid fa-heart fa-xl"></i>   <!-- Extra large (1.5x) -->
<i class="fa-solid fa-heart fa-2x"></i>   <!-- 2x size -->
<i class="fa-solid fa-heart fa-3x"></i>   <!-- 3x size -->
<i class="fa-solid fa-heart fa-5x"></i>   <!-- 5x size -->
<i class="fa-solid fa-heart fa-10x"></i>  <!-- 10x size -->
```

**Utility Classes:**
```html
<!-- Fixed width (useful for aligning icons in lists) -->
<i class="fa-solid fa-user fa-fw"></i>

<!-- Spinning animation -->
<i class="fa-solid fa-spinner fa-spin"></i>

<!-- Pulse animation -->
<i class="fa-solid fa-circle-notch fa-pulse"></i>

<!-- Rotate icons -->
<i class="fa-solid fa-shield fa-rotate-90"></i>
<i class="fa-solid fa-shield fa-rotate-180"></i>
<i class="fa-solid fa-shield fa-rotate-270"></i>

<!-- Flip icons -->
<i class="fa-solid fa-shield fa-flip-horizontal"></i>
<i class="fa-solid fa-shield fa-flip-vertical"></i>
```

**Common Icon Examples:**
```html
<!-- Navigation -->
<i class="fa-solid fa-house"></i>          <!-- Home -->
<i class="fa-solid fa-magnifying-glass"></i> <!-- Search -->
<i class="fa-solid fa-bars"></i>           <!-- Menu -->
<i class="fa-solid fa-xmark"></i>          <!-- Close -->
<i class="fa-solid fa-chevron-left"></i>   <!-- Back -->
<i class="fa-solid fa-chevron-right"></i>  <!-- Forward -->

<!-- Actions -->
<i class="fa-solid fa-plus"></i>           <!-- Add -->
<i class="fa-solid fa-pen"></i>            <!-- Edit -->
<i class="fa-solid fa-trash"></i>          <!-- Delete -->
<i class="fa-solid fa-download"></i>       <!-- Download -->
<i class="fa-solid fa-upload"></i>         <!-- Upload -->
<i class="fa-solid fa-floppy-disk"></i>    <!-- Save -->

<!-- User & Account -->
<i class="fa-solid fa-user"></i>           <!-- User -->
<i class="fa-solid fa-users"></i>          <!-- Users/Team -->
<i class="fa-solid fa-gear"></i>           <!-- Settings -->
<i class="fa-solid fa-right-from-bracket"></i> <!-- Logout -->

<!-- Status & Feedback -->
<i class="fa-solid fa-circle-check"></i>   <!-- Success -->
<i class="fa-solid fa-triangle-exclamation"></i> <!-- Warning -->
<i class="fa-solid fa-circle-xmark"></i>   <!-- Error -->
<i class="fa-solid fa-circle-info"></i>    <!-- Info -->

<!-- Communication -->
<i class="fa-solid fa-envelope"></i>       <!-- Email -->
<i class="fa-solid fa-phone"></i>          <!-- Phone -->
<i class="fa-solid fa-bell"></i>           <!-- Notifications -->
<i class="fa-solid fa-message"></i>        <!-- Message -->

<!-- Social/Brands -->
<i class="fa-brands fa-github"></i>        <!-- GitHub -->
<i class="fa-brands fa-twitter"></i>       <!-- Twitter -->
<i class="fa-brands fa-facebook"></i>      <!-- Facebook -->
<i class="fa-brands fa-linkedin"></i>      <!-- LinkedIn -->
```

**Icon Catalog:**
Browse all available icons at https://fontawesome.com/icons (filter by "Free" to see available icons)

---

#### Vector Icon Component

**Tag:** `<vwc-icon>`

Use `vwc-icon` component when working with Vector component slots or custom SVG paths.

**Common Attributes:**
- `path` (string) - SVG path data (Material Design style icons)

**Usage with SVG Path:**
```html
<vwc-icon path="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"></vwc-icon>
```

**Usage in Component Slots:**
```html
<!-- Using vwc-icon in headline component -->
<vwc-headline headingLevel="1">
  <vwc-icon slot="icon" path="M12,2A10,10..."></vwc-icon>
  <span slot="header-text">Header Text</span>
</vwc-headline>
```

**CSS Variables:**
- `--vector-icon-size` - Icon size

---

#### When to Use Each

**Use Font Awesome `<i>` tags (Recommended):**
- Standard UI icons (navigation, actions, status indicators)
- Brand logos and social media icons
- General prototyping and design work
- When you need extensive icon variety with simple markup

**Use `<vwc-icon>` component:**
- When required by Vector component slots (e.g., headline icon slot)
- Custom SVG graphics or illustrations
- When you need Vector-specific icon functionality

---

### Spinner
**Tag:** `<vwc-spinner>`

**Usage:**
```html
<vwc-spinner></vwc-spinner>
```

**CSS Variables:**
- `--vwc-spinner-size` - Spinner size
- `--vwc-spinner-color` - Spinner color
- `--vwc-spinner-speed` - Animation speed

---

### Progress Bar
**Tag:** `<vaadin-progress-bar>`

**Common Attributes:**
- `value` (number) - Progress value (0-1)
- `indeterminate` (boolean) - Indeterminate state

**Usage:**
```html
<vaadin-progress-bar value="0.5"></vaadin-progress-bar>
<vaadin-progress-bar indeterminate></vaadin-progress-bar>
```

---

## Typography

### Headline
For use when a icon and subheading are grouped with headline.

**Tag:** `<vwc-headline>`

**Common Attributes:**
- `headingLevel` (number) - Heading level (1-6)

**Usage:**
```html
<vwc-headline headingLevel="1">
  <vwc-icon slot="icon" path="..."></vwc-icon>
  <span slot="header-text">Header Text</span>
  <span slot="subtext">Sub Text</span>
</vwc-headline>
```

---

## Interactive Components

### Stepper
**Tag:** `<vwc-stepper>`
**Step Tag:** `<vwc-stepper-step>`

**Usage:**
```html
<vwc-stepper>
  <vwc-stepper-step>Step 1</vwc-stepper-step>
  <vwc-stepper-step>Step 2</vwc-stepper-step>
  <vwc-stepper-step>Step 3</vwc-stepper-step>
</vwc-stepper>
```

---

## Navigation Components

### Topnav
**Tag:** `<vwc-topnav>`

Top navigation bar component for global navigation.

---

### Sidenav
**Tag:** `<vwc-sidenav>`

Side navigation component for application navigation.

---

### Bread Crumb Nav
**Tag:** `<vwc-bread-crumb-nav>`
**Link Tag:** `<vwc-bread-crumb>`

Breadcrumb navigation for showing current location hierarchy.

---

### Tabs
**Tag:** `<vaadin-tabs>`
**Tab Tag:** `<vaadin-tab>`

**Usage:**
```html
<vaadin-tabs>
  <vaadin-tab>Tab 1</vaadin-tab>
  <vaadin-tab>Tab 2</vaadin-tab>
  <vaadin-tab>Tab 3</vaadin-tab>
</vaadin-tabs>
```

---

## Theme System

### Common Theme Attributes

Most Vector components support theme attributes for styling:

**Form Controls:**
- `"outlined"` - Outlined variant should be always used unless otherwise specified

**Buttons:**
- `"primary"` - Primary action
- `"secondary"` - Secondary action
- `"tertiary"` - Tertiary action
- `"small"` - Small size
- `"large"` - Large size

**Cards:**
- `"padded"` - Add padding
- `"elevated"` - Add shadow
- `"outlined"` - Add border
- `"row"` - Horizontal layout

**Notifications:**
- `"success"` - Success color
- `"warning"` - Warning color
- `"error"` - Error color
- `"primary"` - Primary color
- `"contrast"` - Contrast color

---

## CSS Variables Reference

### Common CSS Variables

These colors are set and applied in styles.js bundle. Reference them using the variable names. Use variables when a relavent named var exists instead of specifying colors directly.

```css
  /* Colors */
  --lumo-base-color: #fff;
  /** primary color vars */
  --lumo-primary-color-10pct: #0271ce1a;
  --lumo-primary-color-50pct: #0271cec2;
  --lumo-primary-color: #0271ce;
  --lumo-primary-text-color: #0271ce;
  --lumo-primary-contrast-color: #fff;
  /** error color vars */
  --lumo-error-color-10pct: #e71d131a;
  --lumo-error-color-50pct: #e71d1380;
  --lumo-error-color: #d83e38;
  --lumo-error-text-color: #ca150c;
  --lumo-error-contrast-color: #fff;
  /** warning color vars */
  --lumo-warning-color-10pct: #ffcc001a;
  --lumo-warning-color: #e0782e;
  --lumo-warning-text-color: #995211;
  --lumo-warning-contrast-color: #182739f0;
  /** success color vars */
  --lumo-success-color-10pct: #1688461a;
  --lumo-success-color-50pct: #16884680;
  --lumo-success-color: #158444;
  --lumo-success-text-color: #0a7637;
  --lumo-success-contrast-color: #fff;
  /** text color vars */
  --lumo-header-text-color: #000000de;
  --lumo-body-text-color: #000000de;
  --lumo-secondary-text-color: #00000099;
  --lumo-tertiary-text-color: #1c304a85;
  --lumo-disabled-text-color: #00000061;
  /** grayscale color vars */
  --lumo-contrast: #192434;
  /* available on theme as 5 and 10,20...90 values */
  --lumo-contrast-*pct

  --vwc-primary-inverse-color: #a5c8ff;
  --vwc-primary-hover-color: #f5f9fd;
  --vwc-contrast-text-color: #eff0f9;
  --vwc-base-contrast-5pct: #f4f5f7;
  /** notification color vars */
  --vwc-notification-color-10pct: #ffc7001a;
  --vwc-notification-color-50pct: #ffc70080;
  --vwc-notification-color: #ffc700;
  --vwc-notification-text-color: #a66900;
  --vwc-notification-contrast-color: #fff;
  /** user color vars each is available in 50, then 100,200-900 variant with 50 being lightest */
  --vwc-color-conifer-900: #445928;
  --vwc-color-puerto-rico-900: #195049;
  --vwc-color-picton-blue-900: #1a4c61;
  --vwc-color-vivid-violet-900: #4a2253;
  --vwc-color-ecstacy-900: #693c12;
  --vwc-color-cinnabar-900: #612018;

/* Typography */
--lumo-font-family
--lumo-font-size-*

/* Spacing */
--lumo-space-*

/* Sizing */
--lumo-size-*

/* Icon sizing */
--lumo-icon-size-*

/* Elevations */
--lumo-box-shadow-*

```

---

## Additional Resources

- **Storybook**: [https://cdn.staging.vsp-nonprod.com/web-components/@vector-web-components/storybook/latest/](https://cdn.staging.vsp-nonprod.com/web-components/@vector-web-components/storybook/latest/)
- **Vaadin Components**: [https://vaadin.com/docs/latest/components](https://vaadin.com/docs/latest/components)
- **Icons**: Check Storybook Styleguide/Icons in Storybook for complete icon catalog
- **Typography**: See Storybook Styleguide/Typography for font system
- **Colors**: See Storybook Styleguide/Colors for color palette
- **Elevations**: See Storybook Styleguide/Elevations for shadow system

---

**Last Updated:** 2025-11-11
**Vector Version:** v1.5.1
**CDN URL:** https://cdn.vsp-prod.com/web-components/@vector-web-components/core/v1.5.1/