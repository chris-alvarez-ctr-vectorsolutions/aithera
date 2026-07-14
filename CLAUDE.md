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
- **Component Reference**: The local `context/` directory caches CONTEXT.md files from the CDN. Check there first; if the version you need isn't present, fetch it directly from the CDN (see lookup pattern below).
- **CDN base**: `https://cdn.vsp-prod.com/web-components/@vector-web-components/`

## Vector Web Components

**CRITICAL: Always use Vector web components when designing UX or creating prototypes.**

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

#### 1. Resolve the component version and fetch context

**When working on an existing mock:**
1. Read the mock's `index.html` and extract the core and themes versions from its CDN `<script>` tags:
   ```html
   <script src="https://cdn.vsp-prod.com/web-components/@vector-web-components/core/<ver>/core.iife.js"></script>
   <script src="https://cdn.vsp-prod.com/web-components/@vector-web-components/themes/<ver>/styles.js"></script>
   ```
2. Check whether `context/core/<ver>/CONTEXT.md` and `context/themes/<ver>/CONTEXT.md` already exist locally. If they do, use them.
3. If not present locally, fetch them from the CDN:
   - `https://cdn.vsp-prod.com/web-components/@vector-web-components/core/<ver>/CONTEXT.md`
   - `https://cdn.vsp-prod.com/web-components/@vector-web-components/themes/<ver>/CONTEXT.md`

**When creating a new mock** (or when no mock exists yet), use the version from `base-template/index.html` the same way.

**Minimum version fallback:** CONTEXT.md files were not published before certain library versions. If the version in the mock is older than the minimum, fall back to the minimum and note it.

| Package | Minimum version with CONTEXT.md |
|---|---|
| `@vector-web-components/core` | `v1.22.1` |
| `@vector-web-components/themes` | `v1.9.3` |

**NEVER use component tag names, props, or token values from memory.** Always quote them from a fetched or locally-cached CONTEXT.md. Confidently wrong values are worse than admitting uncertainty.

#### 2. Component Integration
- Web components use **Vaadin** custom element tags (e.g., `<vaadin-text-area>`, `<vaadin-button>`)
- Components work directly in HTML without build tools
- Most Vector components use either `vaadin-` or `vwc-` prefix
- Set attributes and properties as documented in the fetched CONTEXT.md for the version in use

**IMPORTANT:**
- **Always verify component tag names against the fetched CONTEXT.md** — never fabricate or assume them
- If a tag or prop cannot be confirmed from the fetched CONTEXT.md, flag it as unverified rather than guessing
- Do NOT use placeholder names like `<vector-component>` or `<vsp-component>` in code

**Quick Component Tag Reference** (verify in CONTEXT.md before use):
- Form Controls: `vaadin-text-field`, `vaadin-text-area`, `vaadin-password-field`, `vaadin-number-field`, `vaadin-checkbox`, `vaadin-radio-button`, `vaadin-select`, `vaadin-date-picker`
- Buttons: `vaadin-button`
- Layout: `vwc-card`, `vaadin-details`, `vaadin-accordion`, `vaadin-tabs`
- Dialogs: `vaadin-dialog`, `vwc-drawer`, `vaadin-notification`
- Data Display: `vwc-icon`, `vwc-badge`, `vaadin-progress-bar`, `vwc-spinner`
- Other: `vwc-switch`, `vwc-divider`, `vwc-headline`

For the complete list with props and examples, fetch the CONTEXT.md for the version in use (see lookup pattern above).

#### 3. For a NEW mock

**Every feature is a versioned folder.** The feature's **root** `index.html` is never the design — it is a generic **version loader** that reads `versions.json` and renders the chosen version in a full-page iframe. The actual mock lives one level down in its own version folder as `verN/index.html`. You always start at `ver1` even for a single-version ticket; the loader stays invisible until a second version exists, so a one-version feature looks like a plain mock. This means you never "commit to versioning up front" — and adding a version later touches only new files, never the design.

> **Two files are named `index.html` — don't confuse them.** The one at the **feature root** is the loader (copied verbatim from `base-template/index.html`, never edited). The one at **`verN/index.html`** is the actual mock you design in. They are always one folder apart.

**Scaffold a new feature like this** (feature folder = the ticket/ask name; ask if not given):

```
products/<Product>/<feature>/
  index.html        <- the LOADER — COPY base-template/index.html VERBATIM, never edit it
  versions.json     <- [ { "id": "ver1", "label": "V1", "path": "ver1/index.html" } ]
  ver1/
    index.html      <- the actual mock — COPY base-template/version.html here, then WORK IN THIS FILE
```

1. Create `products/<Product>/<feature>/`.
2. Copy **`base-template/index.html`** (the loader) to the feature root as `index.html`. **Do not modify it** — it is identical across every feature; only `versions.json` differs.
3. Create **`versions.json`** with the single `ver1` entry shown above.
4. Create the **`ver1/`** folder and copy **`base-template/version.html`** (the blank Vector canvas) to `ver1/index.html`. **Do all design work here, not in the root loader `index.html`.**
5. If no mock description is given, scaffold these files and then ask where to start with the design in `ver1/index.html`.
6. **Always add the new prototype to the `PRODUCTS` array in `/index.html`** so it appears in the shareable index, pointing at the **feature folder** (the loader): `{ name: 'Display Name', href: 'products/ProductName/feature-folder/' }`. Add it under the correct product block; if it belongs in a sub-folder group, add it inside the matching `{ folder: '...', items: [...] }` entry, or create a new one.

**Adding another version later** (do NOT add a hide/unhide switcher inside a design file):

1. Copy the version folder you're branching from, e.g. `cp -r ver1 ver2`. The file inside is already `index.html`, so there's nothing to rename — you now have `ver2/index.html`.
2. Add an entry to `versions.json`: `{ "id": "ver2", "label": "V2", "path": "ver2/index.html" }`.
3. That's it — the loader **automatically shows the floating version-switcher pill** the moment there are 2+ versions. It's a dark **bottom-center** pill matching the Design Toolbox dock; when the loaded version runs the toolbox, the loader **merges the version buttons into that same dock** so they share one pill. It swaps versions in place via one iframe, deep-links each with `?v=<id>`, and needs no code changes. Order the manifest however you like; the first entry is what opens by default (put the newest first if you want it to open on the latest).

Sub-versions use a dotted folder, e.g. `ver2.x/index.html` with `{ "id": "ver2x", "label": "V2.x", "path": "ver2.x/index.html" }`.

**Paths inside a version file:** because every version file sits at `products/<Product>/<feature>/verN/index.html` (four levels below the repo root), any repo-root asset it references resolves at `../../../../` — e.g. the Design Toolbox include is `<script src="../../../../designtoolbox/toolbox.js"></script>`. Required Core/Themes/font/icon resources are already in `base-template/version.html`'s header (absolute CDN URLs).

## Dev Handoff Process

**This is the standardized process for every dev handoff — it is the same for every designer and every mock.** When a designer says any of *"this is ready for dev,"* *"ready for handoff,"* *"it's dev-handoff time,"* *"hand this off,"* or similar, run these steps in order. Do not improvise a different flow per request.

The mechanics live in the Design Toolbox — see `designtoolbox/README.md` ("Dev handoff build") for the toolbox/dashboard details referenced below.

### Step 0 — Pick the version FIRST (before anything else)

Feature folders are versioned: the design lives in separate **`verN/index.html`** files, listed in **`versions.json`**, behind the feature-root loader `index.html`. **Read `versions.json` to see which versions exist**, then — if there is **more than one** — **stop and ask the designer which version to hand off** (name them by their `label`, e.g. "V1 or V2?"). We almost always launch only one, so the handoff should not carry dead variants. (A legacy in-file `.version-switcher` V1/V2 pill counts as multiple versions too — same question applies.)

- If they keep **one** version, build the handoff from that version's file.
- If they intentionally keep **more than one** (e.g. an **alpha** and a **beta** both going to dev), **ask the designer what to name each**, then produce one dev build per kept version named accordingly (e.g. `dev_handoff_alpha.html`, `dev_handoff_beta.html`).
- Never guess which version to keep or what to call them.

### Step 1 — Component assessment

Run the **`assess-mock-components`** skill on the **chosen version's file** (`verN/index.html`) — not the feature-root loader `index.html`, which has no design in it. This audits every element against the Vector Web Components library (correct `vaadin-*` / `vwc-*` usage, `theme="outlined"` on inputs, button variants) and confirms theme-token usage. It produces `component-assessment.md` and never edits the mock.

### Step 2 — Write the dev notes (`DEV-NOTES.md`)

Author or refresh **`DEV-NOTES.md`** next to the mock (the flow map reads it — see the toolbox README's "Dev notes file format"). For **every node/screen** in the flow map, write the developer annotations: what each element is, **the VWC/Vaadin component it maps to** (fold in the Step 1 findings), states, edge cases, and — critically — **every place a change was made on the page that a developer needs to build.**

- **Annotations live ONLY inside the flow map's dev notes — never as added elements on the page.** The design stays clean and uncluttered; developers drill into the flow map to see every detail per screen, while still seeing the full picture (the whole flow) in one place.
- Include the **"do not ship the toolbox" warning** from Step 4 in `DEV-NOTES.md` too.

### Step 3 — Duplicate the HTML into a dev-handoff build

Copy the **chosen version's file** (`verN/index.html`) to **`dev_handoff.html`** at the **feature root** — next to the loader `index.html`, NOT inside the `verN/` folder. That placement is required: `scripts/build-dashboards.js` only detects a dev build named `dev_handoff.html` (or a custom name set via `meta.json`) sitting beside the feature's `index.html`. Produce one per kept version, named per Step 0 (e.g. `dev_handoff_alpha.html`).

Because the copy moves **up one folder** (from `verN/` to the feature root), **fix any repo-root-relative paths by removing one `../`** — most importantly the toolbox include changes from `../../../../designtoolbox/toolbox.js` to `../../../designtoolbox/toolbox.js`. Then, in the copy, **before the `toolbox.js` include**, add:

```html
<script>window.TOOLBOX = { comments: false };</script>
```

This **hides the entire comment feature** (the pin-and-comment widget *and* the flow map's 💬 comment-count chips) while **keeping the flow map on** so developers still get the screens, live thumbnails, and dev-note annotations. Keep the mock's `applyFlowState` / `bootFromHash` so the flow map and thumbnails work. **Do not hand-rewrite the design** — the dev build is a copy of the chosen version, only with comments off.

### Step 4 — The toolbox dock is NOT part of the product

The bottom-center **toolbox pill** and its **🗺 Flow Map button are review/handoff tooling only — they are not part of the actual product design.** State this prominently in `DEV-NOTES.md` (and anywhere a developer will look): **developers must NOT ship the `toolbox.js` include, the dock pill, or the flow map button** — strip that one `<script src=".../toolbox.js">` line for production.

### Step 5 — Dashboard (automatic)

No manual dashboard edit is needed. On push, `scripts/build-dashboards.js` detects `dev_handoff.html` and flips the product-dashboard card to **Ready for Dev**: the card's **status pill updates to "Ready for Dev"**, the **Dev Page + Dev HTML (GitHub) links render first** with a **"View Dev Build"** primary button, and the **original design links collapse into a "Designer file" drawer**. (For a non-default filename like `dev_handoff_alpha.html`, set `devHandoff: "dev_handoff_alpha.html"` in the mock's `meta.json` entry.)

The dev-handoff file **drives the "Ready for Dev" status pill** — so at handoff either leave the mock's `status` unset in `meta.json` (the file alone flips it) or set `"status": "ready-for-dev"` explicitly. Don't leave a stale `status` like `"in-progress"` pinned, or the pill won't update to Ready for Dev.

### Step 6 — Commit and share

Commit the new files, then give the designer the dev build's **GitHub Pages URL** (the "Dev Page" link).

### Style Guidelines

Use the themes CONTEXT.md for the version in use (see CDN lookup pattern above) as the reference for design tokens and theming. Always quote token values from the fetched file — never recall them from memory.

#### Colors (Styleguide/Colors)
- Use semantic color tokens from Vector theme rather than specific color hex values
- Token values live in the themes CONTEXT.md for the version in use — fetch it to look up exact values
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