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

**Every feature is a versioned folder.** The feature's **root** `index.html` is never the design — it is a generic **version loader** that reads `versions.json` and renders the chosen version in a full-page iframe. The actual mock lives one level down in its own version folder as `verN/index.html`. You always start at `ver1` even for a single-version ticket; the loader stays invisible until a second version exists, so a one-version feature looks like a plain mock. This means you never "commit to versioning up front" — and adding a version later touches only new files, never the design.

> **Two files are named `index.html` — don't confuse them.** The one at the **feature root** is the loader (copied verbatim from `base-template/index.html`, never edited). The one at **`verN/index.html`** is the actual mock you design in. They are always one folder apart.

> **🚫 A third `index.html` is off-limits: the one at the REPO ROOT.** `/index.html` is the GitHub Pages **landing page** for the whole site (<https://vectorlearning.github.io/ux-mockups/>) — it lists every product and links to each dashboard. It is never a mock, never a loader, and never where design work goes. A mock once got written there and the live site served that single prototype to everyone until someone noticed. Three guards now block it: a Claude Code `PreToolUse` hook, the `scripts/git-hooks/pre-commit` hook, and a GitHub Actions job that auto-restores the file on push. All three key off the `GUARD:PAGES-LANDING-PAGE` marker comment at the top of the file — **keep that comment.** To change the landing page on purpose, see `scripts/git-hooks/README.md`: `touch .claude/.allow-landing-edit` to unlock the write, and commit with `LANDING=1 git commit …`.

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
   - **Every new mock, in every product, gets the Design Toolbox with comments ENABLED — no exceptions.** `base-template/version.html` already carries the `designtoolbox/toolbox.js` include; keep it, and never add `window.TOOLBOX = { comments: false }` to a design file (that override belongs ONLY in `dev_handoff.html` builds). If a mock has multiple pages in its `verN/` folder, every page gets the same toolbox include. This applies to all products — not just SafeLMS/Scheduling.
5. If no mock description is given, scaffold these files and then ask where to start with the design in `ver1/index.html`.
6. **Always add the new prototype to `products.json`** (repo root) — the single curated source for BOTH the landing index and every product dashboard. Add an item under the correct product's `items`, pointing `rel` at the **feature folder** (the loader), relative to `products/<Product>/`:

   ```json
   { "name": "Display Name", "rel": "feature-folder", "modified": "YYYY-MM-DD",
     "desc": "One tight sentence (~150 chars max): what the design shows + its key interaction.",
     "jira": "TICKET-123", "status": "in-progress" }
   ```

   `jira` and `status` are optional. Valid statuses: `ready-for-dev`, `in-progress` (the default), `archived`.

   **Folder groups are a first-class dashboard experience — use them deliberately.** Wrapping items in `{ "folder": "Group Name", "items": [ … ] }` makes that group render as a real **folder in the product dashboard**: an entry in the left "Folders" rail with per-status pill counts, selectable as a scope, and **favoritable** (designers can star folders to pin them; saved per browser). **Folders nest to any depth** — a `folder` group's `items` may contain further `folder` groups, rendered as a collapsible tree in the rail; selecting a parent scopes to its whole subtree and the content column shows a breadcrumb of the active path. To put a mock in a nested folder, just nest the groups in `products.json` — nothing else to wire up:

   ```json
   { "folder": "Phase 2", "items": [
     { "folder": "Content Workflow", "items": [
       { "folder": "Experiments", "items": [
         { "name": "Deep Mock", "rel": "Phase2/content-workflow/experiments/deep-mock", "modified": "YYYY-MM-DD", "desc": "…" }
       ] },
       { "name": "Nested Mock", "rel": "Phase2/content-workflow", "modified": "YYYY-MM-DD", "desc": "…" }
     ] },
     { "name": "Top-of-group Mock", "rel": "Phase2/foo.html", "modified": "YYYY-MM-DD", "desc": "…" }
   ] }
   ```

   A group's placement in `products.json` is what creates the dashboard folder — the `rel` paths don't have to mirror the folder names (though keeping the disk layout parallel, e.g. `Phase2/content-workflow/…`, is good practice). Folder display names may even contain `" / "` (e.g. "AI Chat Widget (Vectoria / Fin)") — that renders as ONE folder, never fake nesting, because the build pipeline carries paths as arrays. Group a workstream's related mocks into a folder (e.g. "Content Portal", "Qualifications"); leave one-off mocks at the top level — they show under the dashboard's "Main" entry. Always give every item a `desc`, including items inside folders.

**Adding another version later** (do NOT add a hide/unhide switcher inside a design file):

1. Copy the version folder you're branching from, e.g. `cp -r ver1 ver2`. The file inside is already `index.html`, so there's nothing to rename — you now have `ver2/index.html`.
2. Add an entry to `versions.json`: `{ "id": "ver2", "label": "V2", "path": "ver2/index.html" }`.
3. That's it — the loader **automatically shows the floating version-switcher pill** the moment there are 2+ versions. It's a dark **bottom-center** pill matching the Design Toolbox dock; when the loaded version runs the toolbox, the loader **merges the version buttons into that same dock** so they share one pill. It swaps versions in place via one iframe, deep-links each with `?v=<id>`, and needs no code changes. **Version order is fixed: the loader sorts versions ascending (V1, V2, V2.x, V10…) no matter how the manifest is ordered, and always opens V1 (the lowest) by default.** Use a `?v=<id>` deep link to share a later version directly.

Sub-versions use a dotted folder, e.g. `ver2.x/index.html` with `{ "id": "ver2x", "label": "V2.x", "path": "ver2.x/index.html" }`.

**Paths inside a version file:** because every version file sits at `products/<Product>/<feature>/verN/index.html` (four levels below the repo root), any repo-root asset it references resolves at `../../../../` — e.g. the Design Toolbox include is `<script src="../../../../designtoolbox/toolbox.js"></script>`. Required Core/Themes/font/icon resources are already in `base-template/version.html`'s header (absolute CDN URLs).

**Moving, renaming, or restructuring a mock (including moving pages into `verN/`):** the dashboards and landing page render links straight from `products.json`, so **update every affected `rel` (and any `versions.json` path) in the SAME commit** — otherwise the card's link 404s on the live site while the card itself still renders. `scripts/check-catalog-links.js` enforces this (pre-commit Guard A2 + the check-mock-structure CI workflow): it fails on any `products.json` rel or `versions.json` path that doesn't resolve to a real file. Comments relink automatically in CI on renames (`.github/workflows/relink-comments.yml`). One thing no guard can fix: **previously shared URLs still 404 for whoever holds them** — after a move, re-share the new link (and mention the change if the old link went out in Slack/Jira).

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

**Default Icon Library: Font Awesome 6 PRO — self-hosted**

We have a Font Awesome **Pro** license. Pro 6.7.2 is vendored into this repo at
`assets/fontawesome/` (CSS + woff2 webfonts). New mocks link it with a
**depth-relative** path, the same convention as the Design Toolbox include:

```html
<link rel="stylesheet" href="../../../../assets/fontawesome/css/all.min.css" />
```

Four levels up, because every mock lives at
`products/<Product>/<feature>/verN/index.html`. This is already in
`base-template/version.html`, so anything scaffolded from the template gets it
automatically — don't hand-write the CDN URL into a new mock.

**Why self-hosted and not a Kit or the Pro CDN:** both are domain-locked, and a
domain lock breaks `file://`. Designers must be able to double-click an HTML file
and still see icons. Self-hosting works on `file://`, localhost, and GitHub Pages
identically, with no network dependency.

**Font Awesome Usage:**
- Use standard Font Awesome HTML syntax: `<i class="fa-solid fa-icon-name"></i>`
- Available styles (Pro — all of these work):
  - `fa-solid` - Solid filled icons (most common)
  - `fa-regular` - Regular outline icons
  - `fa-light` / `fa-thin` - Lighter weights, good for large or decorative icons
  - `fa-duotone` - Two-tone icons (`--fa-primary-color` / `--fa-secondary-color`)
  - `fa-sharp` - Squared-off variants; combines with a weight, e.g. `fa-sharp fa-solid`
  - `fa-brands` - Brand logos (GitHub, Twitter, Facebook, etc.)
- Size icons with CSS `font-size`, or use Font Awesome size classes: `fa-xs`, `fa-sm`, `fa-lg`, `fa-2x`, `fa-3x`, etc.
- Complete icon catalog: https://fontawesome.com/search (no need to filter to Free)

**⚠️ Verify icons actually render — silent failure is the trap here.**
An icon class that isn't in the loaded set renders as a **zero-width invisible
glyph**: no console error, no broken-image marker, just a blank gap nobody notices
until it's on a projector. This bit three separate icons in one feature while the
repo was still on the Free CDN. Before committing a mock, run this in the console
and require an empty array:

```js
[...document.querySelectorAll('i[class*="fa-"]')].filter(e => !e.getBoundingClientRect().width).map(e => e.className)
```

**Legacy mocks:** ~168 existing files still link the Font Awesome **Free** CDN and
are intentionally left alone. Pro 6 is a superset of Free 6, so they render exactly
as before. Swap one to the self-hosted Pro path only if that mock needs a Pro icon.

**Basic Examples:**
```html
<!-- Solid user icon -->
<i class="fa-solid fa-user"></i>

<!-- Regular/outline home icon -->
<i class="fa-regular fa-house"></i>

<!-- Pro-only styles -->
<i class="fa-light fa-bell"></i>
<i class="fa-thin fa-gauge"></i>
<i class="fa-sharp fa-solid fa-fire-hydrant"></i>
<i class="fa-duotone fa-truck-medical" style="--fa-primary-color:#c92626;--fa-secondary-color:#8f1414"></i>
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