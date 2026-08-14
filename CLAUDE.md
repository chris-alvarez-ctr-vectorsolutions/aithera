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
   - **Every new mock is scaffolded WITH the Design Toolbox (comments enabled) by default — but the toolbox, comments, and flow map are OPTIONAL, never enforced.** `base-template/version.html` already carries the `designtoolbox/toolbox.js` include; keep it so designers get comments + flow map for free, and don't add `window.TOOLBOX = { comments: false }` to a design file (that override belongs in `dev_handoff.html` builds). If a mock has multiple pages in its `verN/` folder, give each page the same include. This is the recommended default for all products — but a mock without the toolbox (or without versioning) is fine: nothing checks for it on commit, so it will **never block or nag**. `scripts/check-mock-structure.sh` still exists as a **manual, opt-in advisory** you can run by hand, but it is not wired into the commit flow. Removing or skipping the toolbox is a legitimate choice; the review/handoff tooling is opt-in.
   - **The flow map is scaffolded too — every new mock ships with version + flow map + comments.** `base-template/version.html` now carries a starter flow-map config (`window.TOOLBOX_CONFIG.flowMap` + `applyFlowState` + `#fm=` hash boot) with ONE entry node, so the 🗺 Flow Map button is live from the first commit. As you build: rename `flowMap.title` to `"<Feature> — Flow Map"`, and for each screen add a `node` (+ an `applyFlowState` case + an `edge`). Keep `applyFlowState` driving real screen states so the live thumbnails and `#fm=` deep links work.
   - **Notes are fetched relative to the page that renders them.** `flow-map.js` resolves `TOOLBOX_CONFIG.flowMap.devNotes || <folder of the current page> + 'DEV-NOTES.md'`, so `DEV-NOTES.md` must sit beside **whichever page will show it** — `verN/DEV-NOTES.md` for the design file, the **feature root** for `dev_handoff.html` (which lives one folder up). Since notes only actually render in the dev build, the feature root is the placement that matters at handoff; if one file must serve both, keep the single copy at the feature root and point the design file at it with `devNotes: '../DEV-NOTES.md'` in its `flowMap` config rather than duplicating the file. Format: one `## <node-id>` section per flow-map node, with `- bullet` notes under it; an optional `> date: YYYY-MM-DD` line (redeclarable partway down) stamps the notes below it, and a bullet may start with `(YYYY-MM-DD)` to override. A bullet may also lead with a **bold header ending in a colon inside the `** **`** — `- **Short header:** description follows.` — which renders the header as its own line above the description, an optional aid to keep a dev note skimmable (opt-in: the colon must sit *inside* the bold, so plain-prose bullets are unaffected). **Notes are a dev-ready affordance only.** While a mock is **in progress** the flow map shows **no notes** — the running "what changed" log for that phase is the **dashboard's recent-changes + the GitHub commit history** (write good commit messages and they become the changelog; nothing to hand-author in the flow map). Notes render **only in the `dev_handoff.html` build** (comments OFF), where they ARE the **Dev notes** developers read, and the GitHub link to `DEV-NOTES.md` appears. You can still author `DEV-NOTES.md` incrementally while in progress — jot down **client feedback and decisions as they land** so they surface as Dev notes at handoff — it just stays hidden until dev-ready. So: **in progress → commits tell the story; dev-ready → the flow map surfaces the dev notes.**
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

**Moving, renaming, or restructuring a mock (including moving pages into `verN/`):** the dashboards and landing page render links straight from `products.json`, so every affected `rel` (and any `versions.json` path) must follow the file. **When YOU (Claude) move or rename a mock, do the catalog update yourself in the same change — update the `rel`s and `versions.json` paths as part of the rename, don't leave it for the designer.** The team does not hand-edit `products.json`, so treat the catalog update as part of "renaming," not a separate step.

As a backstop, a rename now **self-heals automatically** — nobody's commit is blocked for forgetting it:
- **On commit** (local pre-commit hook, Guard A2, if `node` is present): `scripts/relink-catalog.js --staged` follows the staged rename, rewrites the `products.json` rel / `versions.json` path, and re-stages it INTO the commit being made. Then `scripts/check-catalog-links.js --warn-only` prints — but never blocks on — anything a rename can't explain (a hand-typed path, a deletion, a move across product folders).
- **On push** (CI, `.github/workflows/dashboards.yml`): the same `relink-catalog.js` runs over the pushed range and commits the fix back on the silent `[skip ci]` bot commit — this covers pushes from machines with no hook / no `node` (e.g. GitHub Desktop).
- Comments relink separately in CI on renames (`.github/workflows/relink-comments.yml`).

So a card link never stays dead. Two things automation still cannot do, so handle them yourself: a **cross-product move** (file goes to a different `products/<Product>/` folder) can't be auto-relinked — fix the `rel` by hand; and **previously shared URLs still 404 for whoever holds them** — after a move, re-share the new link (and mention the change if the old link went out in Slack/Jira).

## Dev Handoff / Wrap-Up

When a designer says the mock is done — *"wrap this up,"* *"this is ready for dev,"* *"ready for handoff,"* *"hand this off,"* *"reconcile against the PRD,"* or similar — use the **`ux-wrapup`** skill.

**`ux-wrapup` is the single source of truth for the entire completion phase.** It owns, in order: picking the version, sourcing the PRD, the three-way reconciliation, the conditional component confirmation, `mock-definition.md`, `DEV-NOTES.md`, `dev_handoff.html`, the dashboard flip, and the commit/share step. **Do not restate or improvise any of those steps here** — read them from the skill so there is exactly one copy of the procedure.

Two consequences worth knowing before the handoff starts, because they change what you do *during* design:

- **The component audit is not a separate step you run.** `ux-wrapup` invokes **`audit-mock-vwc`** itself, in embedded mode, and folds the report into `mock-definition.md`'s Component confirmation section. Run `audit-mock-vwc` **on its own only** when someone asks for a component audit outside a handoff — that standalone mode is the only one that writes `component-assessment.md`.
- **Legacy flat mocks stay flat until handoff.** Many older mocks predate the versioned-folder structure and live as loose `.html` files in the product folder, often without the Design Toolbox. **Leave them alone while design iterates — never retrofit versioning or the toolbox onto an old mock outside a handoff, and never flag a designer for it.** Folding one into a feature folder is a handoff-time step that `ux-wrapup` owns; it is not something to do (or suggest) mid-design.

## Style Guidelines

Use the themes CONTEXT.md for the version in use (see CDN lookup pattern above) as the reference for design tokens and theming. Always quote token values from the fetched file — never recall them from memory.

### Colors (Styleguide/Colors)
- Use semantic color tokens from Vector theme rather than specific color hex values
- Token values live in the themes CONTEXT.md for the version in use — fetch it to look up exact values
- Follow accessibility guidelines for contrast ratios

### Typography (Styleguide/Typography)
- Use Vector's typography scale for consistency
- Font families, sizes, and weights are defined in theme
- Follow heading hierarchy (h1-h6)

### Icons

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

### Elevations (Styleguide/Elevations)
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