 UX Prototyping Project

## Project Overview
This project is used by the **UX team** to generate quick HTML/CSS prototypes for creating end-to-end designs. These prototypes are used for:
- Design review and validation
- Handoff to the development team for frontend implementation

## Team Context
- **Primary Users**: UX designers with HTML/CSS knowledge
- **Technical Scope**: HTML, CSS, and vanilla JavaScript (no frameworks)
- **Skill Level**: Team understands HTML/CSS but may not be familiar with advanced build tools or modern JavaScript frameworks

## Quick Reference
- **Component Reference**: See @CORE-CONTEXT.md for complete list of Vector components with HTML tags, props, and usage examples
- **Component Lookup**: Use the reference file for quick offline access to component tags and attributes

Claude will:
1. Fetch the latest component list from Storybook
2. Extract current component tags from the CDN
3. Query component props and attributes
4. Update the reference file with new information

**Last Updated:** The reference file shows its last update date at the bottom

## Vector Web Components

**CRITICAL: Always use Vector web components from Storybook when designing UX or creating prototypes.**

This project has access to the Vector Web Components library via Storybook MCP server:
- **Storybook URL**: https://cdn.staging.vsp-nonprod.com/web-components/@vector-web-components/storybook/latest/index.html
- The MCP connection always uses the latest version automatically

### Available Packages

#### Core Components (@vector-web-components/core)
Comprehensive UI component library including:
- **Form Controls**: Text Field, Text Area, Password Field, Number Field, Select, Checkbox, Radio Button, Switch, Upload, Date Picker, Datetime Picker, Color Picker, Multi Select Combo Box
- **Buttons**: Primary, secondary, tertiary button variants
- **Navigation**: Topnav, Sidenav, BreadCrumbNav, Tabs, App Switcher Menu, User Menu
- **Layout**: Card, Accordion, Divider, TilingGrid, Details
- **Dialogs & Overlays**: Dialog, Drawer, Popover, Tooltip, Notification, Notifications Menu
- **Data Display**: Badge, List Box, Paginator, Progress Bar, Spinner, Item, TreeList, Sortable Header
- **Interactive**: Toggle Button Group, Stepper, Language Selector Dialog
- **Typography**: Headline component

#### Themes (@vector-web-components/themes)
Complete theming system including:
- **CSS Variables**: Custom properties for colors, spacing, typography
- **Colors**: Predefined color palettes and semantic color tokens
- **Typography**: Font families, sizes, weights, line heights
- **Elevations**: Shadow and depth system
- **Animations**: Transition and animation utilities
- **Tables**: Standard HTML table styling and utilities

#### Assets (@vector-web-components/assets)
Design assets including:
- **Fonts**: Web font definitions
- **Favicon**: Brand favicon assets

#### Specialized Components
- **AI Assistant Overlay** (@vector-web-components/ai)
- **Course Cards & Course List** (@vector-web-components/lms)
- **Calendar Components** (@vector-web-components/calendar)
- **Drag & Drop** (@vector-web-components/dnd): DndList, DndListItem

### Using Vector Components

#### 1. Check Component Reference First
**Quick Lookup Process:**
1. Check `CORE-CONTEXT.md` for component HTML tags and common props
2. Use Storybook MCP tools for detailed component information if needed:
   - `mcp__storybook__getComponentList` - List all available components
   - `mcp__storybook__getComponentsProps` - Get props/attributes for specific components

The reference file provides faster lookup for common components and usage patterns.

#### 2. Component Integration
- Web components use **Vaadin** custom element tags (e.g., `<vaadin-text-area>`, `<vaadin-button>`)
- Components work directly in HTML without build tools
- Most Vector components use either `vaadin-` or `vwc-` prefix
- Set attributes and properties as documented in `CORE-CONTEXT.md`

**IMPORTANT:**
- **Always refer to `CORE-CONTEXT.md`** for correct component tag names
- **NEVER fabricate or assume component tag names**
- If a component is not in the reference file, check Storybook or ask the user
- Do NOT use placeholder names like `<vector-component>` or `<vsp-component>` in code

**Quick Component Tag Reference:**
- Form Controls: `vaadin-text-field`, `vaadin-text-area`, `vaadin-password-field`, `vaadin-number-field`, `vaadin-checkbox`, `vaadin-radio-button`, `vaadin-select`, `vaadin-date-picker`
- Buttons: `vaadin-button`
- Layout: `vwc-card`, `vaadin-details`, `vaadin-accordion`, `vaadin-tabs`
- Dialogs: `vaadin-dialog`, `vwc-drawer`, `vaadin-notification`
- Data Display: `vwc-icon`, `vwc-badge`, `vaadin-progress-bar`, `vwc-spinner`
- Other: `vwc-switch`, `vwc-divider`, `vwc-headline`

For the complete list with props and examples, see `CORE-CONTEXT.md`

#### 3. For a NEW mock

1. Create a new directory under the product directory specified. If no mock name is given, ask and use that for the directory name.
2. Copy the index.html from /base-template as your starting point.
3. If no details about the mock description are given, simply copy the index.html and then ask about where to start with the new mock.

Required resources are provided in the header to load Core and Themes bundles from the CDN plus the main font and icon set.

### Style Guidelines

Use THEMES-CONTEXT.md as the reference for design tokens and themeing provided from the themes bundle in styles.js.

#### Colors (Styleguide/Colors)
- Use semantic color tokens from Vector theme rather than specific color hex values
- Check Storybook for primary, secondary, accent, neutral colors
- Follow accessibility guidelines for contrast ratios

#### Typography (Styleguide/Typography)
- Use Vector's typography scale for consistency
- Font families, sizes, and weights are defined in theme
- Follow heading hierarchy (h1-h6)

#### Icons

**Default Icon Library: Font Awesome 6**

This project uses **Font Awesome 6 Free** as the default icon library. Font Awesome provides a comprehensive set of icons for common UI needs.

**Font Awesome Usage:**
- Use standard Font Awesome HTML syntax: `<i class="fa-solid fa-icon-name"></i>`
- Available styles in Font Awesome 6 Free:
  - `fa-solid` - Solid filled icons (most common)
  - `fa-regular` - Regular outline icons
  - `fa-brands` - Brand logos (GitHub, Twitter, Facebook, etc.)
- Size icons with CSS `font-size`, or use Font Awesome size classes: `fa-xs`, `fa-sm`, `fa-lg`, `fa-2x`, `fa-3x`, etc.
- Complete icon catalog: https://fontawesome.com/search?ic=free-collection

**Basic Examples:**
```html
<!-- Solid user icon -->
<i class="fa-solid fa-user"></i>

<!-- Regular/outline home icon -->
<i class="fa-regular fa-home"></i>

```

**Vector Icons (vwc-icon):**
- For Vector-specific icons or custom SVG paths, use the `<vwc-icon>` component

**When to Use Each:**
- **Font Awesome** (recommended): Use for standard UI icons (user, home, search, settings, etc.)
- **vwc-icon**: Use when required by Vector component slots or for custom SVG graphics

#### Elevations (Styleguide/Elevations)
- Use predefined shadow levels for depth
- Consistent elevation creates visual hierarchy

### Why Use Vector Components?
- **Consistency**: Ensures design consistency across the organization
- **Maintained**: Components are professionally maintained and tested
- **Accessibility**: Built with accessibility standards (WCAG 2.2 AA)
- **Efficiency**: Faster prototyping with pre-built, production-ready components
- **Theming**: Complete design system with CSS variables
- **No Build Required**: Works directly in HTML without compilation

## Guidelines for Code Generation

### Use Simple, Accessible Technologies
- Write clean, semantic HTML5
- Use vanilla CSS (CSS3 features are fine)
- Use vanilla JavaScript when needed for interactivity (see JavaScript Guidelines below)
- Avoid build tools, preprocessors, or complex tooling
- Keep file structure simple and flat when possible

### Code Style
- Use clear, descriptive class names
- Add comments to explain layout structure
- Keep CSS organized (group related styles together)
- Make responsive designs using media queries
- Use modern CSS features like Flexbox and Grid when appropriate

### File Organization
- Keep related HTML and CSS together
- Use inline styles sparingly (prefer external CSS files)
- Name files descriptively (e.g., `homepage.html`, `styles.css`)

### Prototyping Best Practices
- Focus on visual design and user flow
- Create pixel-perfect layouts when specified
- Include placeholder content that demonstrates the design intent
- Make interactive elements visually distinct (even if non-functional)
- Leverage Vector components for buttons, forms, cards, navigation, and other common UI elements

### JavaScript Guidelines

**When to Use JavaScript:**
- Adding interactivity to prototypes (clicks, toggles, form interactions)
- Manipulating DOM elements (show/hide, add/remove classes)
- Working with Vector web component events and properties
- Creating simple animations or transitions
- Form validation and user feedback

**JavaScript Best Practices:**
- Use vanilla JavaScript only (no frameworks or libraries)
- Keep JavaScript simple and well-commented
- Use modern ES6+ features (const, let, arrow functions, template literals)
- Use `addEventListener` for event handling
- Query elements with `querySelector` and `querySelectorAll`
- Keep scripts in `<script>` tags at the end of `<body>` or use `defer`

**Common JavaScript Patterns:**

```javascript
// Working with Vector components
const button = document.querySelector('vaadin-button');
const drawer = document.querySelector('vwc-drawer');

button.addEventListener('click', () => {
  drawer.setAttribute('open', 'true');
});

// Toggling classes
const card = document.querySelector('.card');
card.classList.toggle('active');

// Form handling
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('Form submitted');
});

// Working with component properties
const textField = document.querySelector('vaadin-text-field');
textField.value = 'New value';
console.log(textField.value);
```

**What to Avoid in JavaScript:**
- External JavaScript libraries (jQuery, Lodash, etc.)
- JavaScript frameworks (React, Vue, Angular)
- Complex state management
- API calls to real backends (use mock data)
- Build processes or transpilation

## What to Avoid
- JavaScript frameworks (React, Vue, Angular, etc.)
- JavaScript libraries (jQuery, Lodash, etc.)
- Build tools (Webpack, Vite, etc.)
- Package managers unless absolutely necessary
- Complex tooling that requires technical setup
- Backend code or server-side logic
- TypeScript or any transpilation steps

## Deliverables
All prototypes should be:
- Viewable by simply opening HTML files in a browser
- Easy to modify by team members with basic HTML/CSS knowledge
- Well-commented to explain design decisions
- Responsive and accessible where applicable