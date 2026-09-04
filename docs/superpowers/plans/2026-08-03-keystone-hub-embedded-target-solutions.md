# Keystone Hub Embedded in Target Solutions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a demo-ready mock showing the Keystone-Department-Hub embedded in the Target Solutions shell, with a recreated Target Solutions homepage you can click back and forth from.

**Architecture:** One HTML file (`ver1/index.html`) containing persistent Target Solutions chrome — accent bar, top nav, left sidebar — wrapping two sibling views. A `data-view` attribute on the root element decides which view shows; CSS does the hiding, so nothing re-renders and the chrome never flickers. The `home` view is a hand-built recreation of the current Target Solutions homepage. The `hub` view is a single `<iframe>` pointing at the real, unmodified `keystone-hub/index.html`.

**Tech Stack:** Semantic HTML5, vanilla CSS, vanilla JS. Vector Web Components (core v1.19.0 + themes v1.5.0, loaded from CDN) for the *new* elements only. Font Awesome 6.7.2 for icons. No build step — the file opens directly in a browser.

**Spec:** `docs/superpowers/specs/2026-08-03-keystone-hub-embedded-target-solutions-design.md`

## Global Constraints

- **Never modify `products/Keystone-Department-Hub/keystone-hub/`.** It is embedded by reference. Any change to it is out of scope and a plan violation.
- **Never edit the feature-root `index.html`.** It is a verbatim copy of `base-template/index.html` (the generic version loader). Only `ver1/index.html` is designed in.
- All work happens in `products/Keystone-Department-Hub/embedded-target-solutions/`.
- **Vector components and theme tokens are for NEW elements only** — the announcement banner, its CTA button, and the nav link's NEW pill. The recreated legacy Target Solutions chrome (top nav, sidebar, Frequent Activities tiles, To Do rows, Bulletin Board) is plain HTML/CSS, because the real page predates the component library and rebuilding it in VWC would misrepresent what exists today.
- Department name is exactly `Springfield Fire Department`. Avatar initials are exactly `JL`.
- Frequent Activities ships **one** row of nine solid-color tiles. The pastel "Field-based Trainings" row from the source screenshot is deliberately omitted.
- Only `Home` and `Keystone Hub` are clickable in the sidebar. Every item in the black Administration block is decorative.
- Banner dismissal is **session-only** — no `localStorage`, no `sessionStorage`. A reload restores it.
- CDN URLs, copied verbatim:
  - `https://cdn.vsp-prod.com/web-components/@vector-web-components/core/v1.19.0/core.iife.js`
  - `https://cdn.vsp-prod.com/web-components/@vector-web-components/themes/v1.5.0/styles.js`
  - `https://cdn.vsp-prod.com/web-components/@vector-web-components/assets/v1.0.0/fonts/open-sans/v43/open-sans.css`
  - `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css`

## Verification Model — read this before Task 1

**This repo has no test framework.** There is no pytest, no jest, no `npm test`. Prototypes are verified *visually in a real browser*. So every task below replaces the usual write-test / run-test cycle with:

1. Build the increment.
2. Load the page in Playwright and take a screenshot.
3. Compare against the explicit, itemized expectations written into that task.
4. Commit.

**Start the local server once, before Task 1, and leave it running.** `file://` iframes and the Design Toolbox both misbehave without a real origin.

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups" && python3 -m http.server 8123
```

Run it in the background. The feature's URL for the whole plan is:

```
http://localhost:8123/products/Keystone-Department-Hub/embedded-target-solutions/
```

Playwright MCP tools are available for this: `mcp__playwright__browser_navigate`,
`mcp__playwright__browser_resize`, `mcp__playwright__browser_take_screenshot`,
`mcp__playwright__browser_click`, `mcp__playwright__browser_snapshot`,
`mcp__playwright__browser_console_messages`. Load their schemas with
`ToolSearch` before first use. **Resize to 1500×1000 before every screenshot** so
shots are comparable across tasks and match the source screenshot's proportions.

**"Expected" lists are the gate.** A task is not done until every itemized
expectation is confirmed in the screenshot. If one fails, fix it before committing.

## File Structure

| File | Responsibility |
| --- | --- |
| `embedded-target-solutions/index.html` | Generic version loader. Verbatim copy of `base-template/index.html`. Never edited. |
| `embedded-target-solutions/versions.json` | Version manifest. One entry, `ver1`. |
| `embedded-target-solutions/ver1/index.html` | **The entire design.** Shell, both views, all CSS, all JS. Self-contained. |
| `products.json` (repo root) | Registers the feature on the landing index and product dashboard. |

`ver1/index.html` is a single self-contained file rather than split HTML/CSS/JS,
matching the `base-template/version.html` scaffold and how most features in this
repo are built. It stays readable because the CSS is grouped into commented
sections that mirror the page structure.

**Relative paths from `ver1/index.html` (four levels below the repo root):**

| Target | Path |
| --- | --- |
| The hub, for the iframe | `../../keystone-hub/index.html` |
| Design Toolbox | `../../../../designtoolbox/toolbox.js` |

---

## Task 1: Scaffold the feature and register it

Creates the versioned folder, the loader, the manifest, a blank canvas, and the
`products.json` entry. Delivers a working (empty) feature URL and a dashboard card.

**Files:**
- Create: `products/Keystone-Department-Hub/embedded-target-solutions/index.html`
- Create: `products/Keystone-Department-Hub/embedded-target-solutions/versions.json`
- Create: `products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html`
- Modify: `products.json` — the `Keystone-Department-Hub` product's `items` array

**Interfaces:**
- Consumes: nothing.
- Produces: the file `ver1/index.html` with a `<body>` containing a single empty
  `<div class="ts-app" data-view="home">` and a `<style id="ts-styles">` block in
  `<head>`. Every later task appends to those two.

- [ ] **Step 1: Create the folder and copy the loader verbatim**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone-Department-Hub"
mkdir -p embedded-target-solutions/ver1
cp ../../base-template/index.html embedded-target-solutions/index.html
```

Do **not** open or edit `embedded-target-solutions/index.html` after copying. It is
identical across every feature in the repo; only `versions.json` differs.

- [ ] **Step 2: Write `versions.json`**

Create `embedded-target-solutions/versions.json`:

```json
[
  { "id": "ver1", "label": "V1", "path": "ver1/index.html", "title": "Keystone-Department-Hub embedded in the Target Solutions shell, with a recreated TS homepage" }
]
```

With only one entry the loader's version-switcher pill stays hidden, so the feature
looks like a plain mock. It appears automatically if a `ver2` is added later.

- [ ] **Step 3: Write the `ver1/index.html` skeleton**

Create `embedded-target-solutions/ver1/index.html` with exactly this content. It is
`base-template/version.html` plus the toolbox include, the style block later tasks
append to, and the root element.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Keystone-Department-Hub — in Target Solutions</title>

<!--
  Keystone-Department-Hub, wearing the Target Solutions shell.

  The hub will be published inside several Vector Solutions applications. This is
  the first of three bake-outs showing what that looks like (Target Solutions, then
  Check It, then Scheduling).

  Structure: persistent TS chrome (accent bar / top nav / sidebar) wrapping two
  sibling views. `data-view` on .ts-app picks one; CSS hides the other. Nothing
  re-renders on a switch, so the chrome never flickers mid-demo.

    data-view="home"  -> #view-home, a recreation of today's TS homepage
    data-view="hub"   -> #view-hub, an iframe of the REAL keystone-hub/index.html

  The hub is embedded by reference, never copied. Edits to the hub show up here for
  free, and all of its interactivity survives because it gets its own document.

  The legacy TS chrome is plain HTML/CSS on purpose — the real page predates the
  Vector component library. Only genuinely NEW elements (the announcement banner,
  its CTA, the nav link's NEW pill) are built with Vector components, because those
  are the parts a developer would actually build.
-->

<script
type="module"
src="https://cdn.vsp-prod.com/web-components/@vector-web-components/core/v1.19.0/core.iife.js">
</script>

<!-- Vector Web Components JavaScript -->
<!-- Important! This should always be imported as script -->
<script
src="https://cdn.vsp-prod.com/web-components/@vector-web-components/themes/v1.5.0/styles.js">
</script>

<!-- Our Standard font face - Open Sans -->
<link
rel="stylesheet"
href="https://cdn.vsp-prod.com/web-components/@vector-web-components/assets/v1.0.0/fonts/open-sans/v43/open-sans.css"
/>

<!-- Font Awesome 6 Icons (Default Icon Library) -->
<link
rel="stylesheet"
href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
/>

<style id="ts-styles">
  /* ====================================================================
     TOKENS — sampled from the current Target Solutions product
     ==================================================================== */
  :root {
    --ts-accent:      #b4155e;  /* the crimson rule above the top nav */
    --ts-page-bg:     #f2f5fa;
    --ts-surface:     #ffffff;
    --ts-nav-dark:    #14202e;  /* the black Administration block */
    --ts-nav-active:  #22303f;
    --ts-nav-rule:    rgba(255,255,255,.16);
    --ts-ink-900:     #1f2933;
    --ts-ink-700:     #3f4a56;
    --ts-ink-500:     #5b6673;
    --ts-ink-300:     #98a2ae;
    --ts-hairline:    #e2e8f0;
    --ts-link:        #1668c9;
    --ts-sidebar-w:   267px;
    --ts-topnav-h:    80px;
  }

  * { box-sizing: border-box; }
  html, body {
    margin: 0; height: 100%;
    font-family: "Open Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: var(--ts-ink-900);
    background: var(--ts-page-bg);
  }
  :focus-visible { outline: 2px solid var(--ts-link); outline-offset: 2px; }
</style>
</head>
<body>

<div class="ts-app" data-view="home"></div>

<!-- Design Toolbox — review/handoff tooling, NOT part of the product design -->
<script src="../../../../designtoolbox/toolbox.js"></script>

</body>
</html>
```

- [ ] **Step 4: Register the feature in `products.json`**

Open `products.json` at the repo root and find the `Keystone-Department-Hub`
product (search for `"slug": "keystone-department-hub"`). Its `items` array
currently holds three entries: `Department Hub`, `Prioritization Settings`, and
`Agency Intelligence Dashboard`.

Leave those three exactly where they are, and **append** this folder group as a
fourth element of the same `items` array:

```json
{
  "folder": "Embedded App Views",
  "items": [
    {
      "name": "In Target Solutions",
      "rel": "embedded-target-solutions",
      "modified": "2026-08-03",
      "desc": "The Department Hub embedded in the Target Solutions shell, with a recreated TS homepage you can click between.",
      "status": "in-progress"
    }
  ]
}
```

`rel` points at the **feature folder** (the loader), not at `ver1/index.html`.

The folder wrapper is created now, holding one child, so the upcoming
`embedded-check-it` and `embedded-scheduling` features drop in beside it with no
restructuring.

- [ ] **Step 5: Verify the JSON is valid**

Run:

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups" \
  && python3 -c "import json;d=json.load(open('products.json'));print('products.json OK')" \
  && python3 -c "import json;d=json.load(open('products/Keystone-Department-Hub/embedded-target-solutions/versions.json'));print('versions.json OK, entries:',len(d))"
```

Expected output:

```
products.json OK
versions.json OK, entries: 1
```

If either raises `json.decoder.JSONDecodeError`, a comma or brace is wrong — fix it
before continuing.

- [ ] **Step 6: Verify the loader resolves the version**

Start the server if it is not already running, then navigate Playwright to:

```
http://localhost:8123/products/Keystone-Department-Hub/embedded-target-solutions/
```

Resize to 1500×1000 and take a screenshot.

Expected:
- The page loads without a "could not load" message from the loader.
- The viewport is empty and light blue-gray (`#f2f5fa`) — this is correct; the shell
  is built in Task 2.
- **No** version-switcher pill (correct with a single version).
- `mcp__playwright__browser_console_messages` shows no 404 for `versions.json` and no
  404 for `toolbox.js`.

- [ ] **Step 7: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone-Department-Hub/embedded-target-solutions" products.json
git commit -m "Keystone embedded views: scaffold the Target Solutions feature

Loader + single-version manifest + blank Vector canvas, registered under a
new Embedded App Views folder so Check It and Scheduling drop in beside it."
```

---

## Task 2: The persistent Target Solutions chrome

Builds the accent bar, top nav, and left sidebar — everything that stays put across
a view switch. Includes the bento button's forward-looking hook.

**Files:**
- Modify: `products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html`

**Interfaces:**
- Consumes: the `<style id="ts-styles">` block and the `<div class="ts-app" data-view="home">` element from Task 1.
- Produces:
  - `.ts-app` gains children `.ts-accentbar`, `.ts-topnav`, `.ts-body`.
  - `.ts-body` gains children `.ts-sidebar` and `.ts-content`. **`.ts-content` is left empty** — Task 3 fills it with the two view containers.
  - Two nav buttons with the exact ids `nav-home` and `nav-hub`, each carrying a `data-target` attribute (`"home"` / `"hub"`). Task 3 binds to these.
  - `#ts-apps-btn` (the bento button) and an empty, hidden `#ts-app-switcher` container.

- [ ] **Step 1: Append the chrome CSS**

Append inside the existing `<style id="ts-styles">` block, after the `:focus-visible`
rule:

```css
  /* ====================================================================
     APP FRAME
     Fixed full-viewport layout so only the content column scrolls — which
     is what lets the hub iframe below size itself to 100% height.
     ==================================================================== */
  .ts-app {
    position: fixed; inset: 0;
    display: flex; flex-direction: column;
    background: var(--ts-page-bg);
  }
  .ts-accentbar { height: 4px; background: var(--ts-accent); flex-shrink: 0; }

  /* ====================================================================
     TOP NAV
     ==================================================================== */
  .ts-topnav {
    height: var(--ts-topnav-h); flex-shrink: 0;
    background: var(--ts-surface);
    border-bottom: 1px solid var(--ts-hairline);
    display: flex; align-items: center; gap: 28px;
    padding: 0 26px;
  }
  .ts-logo { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
  .ts-logo-mark { width: 40px; height: 34px; flex-shrink: 0; }
  .ts-logo-text {
    font-size: 21px; font-weight: 700; letter-spacing: -.3px;
    color: #2b3947; white-space: nowrap;
  }
  .ts-logo-text em { font-style: normal; font-weight: 400; }
  .ts-dept {
    font-size: 17px; color: var(--ts-ink-700); font-weight: 400;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ts-topnav-right {
    margin-left: auto; display: flex; align-items: center; gap: 4px; flex-shrink: 0;
  }
  .ts-icon-btn {
    width: 40px; height: 40px; border: 0; border-radius: 50%;
    background: transparent; color: var(--ts-ink-500); font-size: 19px;
    display: grid; place-items: center; cursor: pointer;
    transition: background .15s ease, color .15s ease;
  }
  .ts-icon-btn:hover { background: #eef2f7; color: var(--ts-ink-900); }
  .ts-avatar {
    width: 38px; height: 38px; margin-left: 6px; border-radius: 50%;
    background: #eef2f7; color: var(--ts-ink-700);
    font-size: 13px; font-weight: 700; letter-spacing: .3px;
    display: grid; place-items: center; cursor: pointer;
  }

  /* The app switcher panel arrives later — this is its mount point.
     Hidden and empty for now; the button is already a real, focusable control. */
  .ts-apps-wrap { position: relative; }
  #ts-app-switcher[hidden] { display: none; }

  /* ====================================================================
     BODY + SIDEBAR
     ==================================================================== */
  .ts-body { flex: 1; display: flex; min-height: 0; }
  .ts-sidebar {
    width: var(--ts-sidebar-w); flex-shrink: 0;
    background: var(--ts-surface);
    border-right: 1px solid var(--ts-hairline);
    display: flex; flex-direction: column;
    overflow-y: auto; position: relative;
  }

  /* Department badge, with the collapse chevron pinned to the sidebar edge */
  .ts-badge { padding: 22px 0 18px; display: grid; place-items: center; }
  .ts-collapse {
    position: absolute; top: 96px; right: -11px; z-index: 2;
    width: 22px; height: 22px; border-radius: 50%;
    border: 1px solid var(--ts-hairline); background: var(--ts-surface);
    color: var(--ts-ink-500); font-size: 10px;
    display: grid; place-items: center; cursor: default;
  }

  .ts-nav { display: flex; flex-direction: column; flex: 1; }

  /* --- White block: the only interactive nav items --------------------- */
  .ts-nav-light { background: var(--ts-surface); }
  .ts-nav-item {
    width: 100%; border: 0; background: transparent;
    display: flex; align-items: center; gap: 14px;
    padding: 14px 22px; font: inherit; font-size: 15px;
    color: var(--ts-ink-900); text-align: left; cursor: pointer;
    border-left: 4px solid transparent;
    transition: background .12s ease;
  }
  .ts-nav-item .ts-nav-icon { width: 20px; font-size: 17px; text-align: center; flex-shrink: 0; }
  .ts-nav-item .ts-nav-label { flex: 1; }
  .ts-nav-light .ts-nav-item:hover { background: #f4f7fb; }
  .ts-nav-light .ts-nav-item[aria-current="page"] {
    background: #eaf1fa; border-left-color: var(--ts-link); font-weight: 600;
  }

  /* NEW pill on the Keystone Hub link — one of the genuinely new elements,
     so it uses a Vector theme token rather than a hand-picked hex. */
  .ts-new-pill {
    font-size: 10px; font-weight: 700; letter-spacing: .6px;
    padding: 2px 7px; border-radius: 999px;
    background: var(--lumo-primary-color, #0271ce);
    color: var(--lumo-primary-contrast-color, #fff);
    flex-shrink: 0;
  }

  /* --- Black block: decorative, for fidelity only ---------------------- */
  .ts-nav-dark { background: var(--ts-nav-dark); flex: 1; padding-bottom: 24px; }
  .ts-nav-dark .ts-nav-item { color: #fff; cursor: default; }
  .ts-nav-dark .ts-nav-item.is-active { background: var(--ts-nav-active); }
  .ts-nav-dark .ts-nav-item .ts-nav-caret { font-size: 12px; color: #cbd3dc; flex-shrink: 0; }
  .ts-nav-rule { height: 1px; background: var(--ts-nav-rule); margin: 8px 22px; }

  /* ====================================================================
     CONTENT COLUMN — filled in Task 3
     ==================================================================== */
  .ts-content { flex: 1; min-width: 0; overflow-y: auto; position: relative; }
```

- [ ] **Step 2: Replace the empty `.ts-app` with the chrome markup**

Replace this line in `<body>`:

```html
<div class="ts-app" data-view="home"></div>
```

with:

```html
<div class="ts-app" data-view="home">

  <div class="ts-accentbar"></div>

  <!-- ============================ TOP NAV ============================ -->
  <header class="ts-topnav">
    <div class="ts-logo">
      <svg class="ts-logo-mark" viewBox="0 0 40 34" aria-hidden="true">
        <path d="M2 22 L13 3 L20 15 L15 24 Z"  fill="#2f9e4f"/>
        <path d="M13 3 L24 3 L38 26 L27 26 Z"  fill="#1668c9"/>
        <path d="M2 22 L11 22 L17 32 L8 32 Z"  fill="#123a6b"/>
      </svg>
      <span class="ts-logo-text">Vector<em>Solutions</em></span>
    </div>

    <div class="ts-dept">Springfield Fire Department</div>

    <div class="ts-topnav-right">
      <!-- The bento button is a REAL control on purpose. The app-switcher panel
           it opens is being designed separately; when that UI arrives it drops
           into #ts-app-switcher and this handler stops being a no-op. -->
      <span class="ts-apps-wrap">
        <button class="ts-icon-btn" id="ts-apps-btn" type="button"
                aria-label="Switch application" aria-expanded="false"
                aria-controls="ts-app-switcher">
          <i class="fa-solid fa-table-cells-large" aria-hidden="true"></i>
        </button>
        <div id="ts-app-switcher" role="menu" aria-label="Vector applications" hidden></div>
      </span>

      <span class="ts-icon-btn" aria-hidden="true"><i class="fa-regular fa-circle-question"></i></span>
      <span class="ts-icon-btn" aria-hidden="true"><i class="fa-regular fa-bell"></i></span>
      <span class="ts-avatar" aria-hidden="true">JL</span>
    </div>
  </header>

  <div class="ts-body">

    <!-- ============================ SIDEBAR ============================ -->
    <aside class="ts-sidebar">
      <div class="ts-badge">
        <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label="Springfield Fire Department">
          <!-- Maltese cross -->
          <path d="M75 8 L96 34 L122 13 L114 46 L142 75 L114 104 L122 137 L96 116 L75 142
                   L54 116 L28 137 L36 104 L8 75 L36 46 L28 13 L54 34 Z"
                fill="#8f1414"/>
          <path d="M75 20 L92 42 L113 26 L107 51 L129 75 L107 99 L113 124 L92 108 L75 130
                   L58 108 L37 124 L43 99 L21 75 L43 51 L37 26 L58 42 Z"
                fill="#c92626"/>
          <circle cx="75" cy="75" r="29" fill="#2b3947" stroke="#8f1414" stroke-width="4"/>
          <circle cx="75" cy="75" r="21" fill="none" stroke="#c92626" stroke-width="3"/>
          <circle cx="75" cy="75" r="11" fill="#8f1414"/>
        </svg>
      </div>
      <span class="ts-collapse" aria-hidden="true"><i class="fa-solid fa-chevron-left"></i></span>

      <nav class="ts-nav" aria-label="Main">

        <!-- White block — the only clickable items on this page -->
        <div class="ts-nav-light">
          <button class="ts-nav-item" id="nav-home" type="button"
                  data-target="home" aria-current="page">
            <i class="fa-solid fa-house ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Home</span>
          </button>

          <button class="ts-nav-item" id="nav-hub" type="button" data-target="hub">
            <i class="fa-solid fa-fire-flame-curved ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Keystone Hub</span>
            <span class="ts-new-pill">NEW</span>
          </button>
        </div>

        <!-- Black block — decorative. Reproduces the current admin section so the
             demo reads as the real application. Rendered as <span> rather than
             <button> so nothing here is focusable or looks clickable. -->
        <div class="ts-nav-dark">
          <span class="ts-nav-item">
            <i class="fa-solid fa-user-shield ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Administration</span>
            <i class="fa-solid fa-chevron-up ts-nav-caret" aria-hidden="true"></i>
          </span>
          <span class="ts-nav-item">
            <i class="fa-solid fa-chart-column ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Dashboard</span>
          </span>
          <span class="ts-nav-item">
            <i class="fa-solid fa-database ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Generate Reports</span>
          </span>

          <div class="ts-nav-rule"></div>

          <span class="ts-nav-item">
            <i class="fa-solid fa-square-check ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Completions</span>
            <i class="fa-solid fa-chevron-down ts-nav-caret" aria-hidden="true"></i>
          </span>
          <span class="ts-nav-item">
            <i class="fa-solid fa-pen-to-square ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Assignments</span>
            <i class="fa-solid fa-chevron-down ts-nav-caret" aria-hidden="true"></i>
          </span>
          <span class="ts-nav-item">
            <i class="fa-solid fa-users ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Manage Users</span>
            <i class="fa-solid fa-chevron-down ts-nav-caret" aria-hidden="true"></i>
          </span>
          <span class="ts-nav-item">
            <i class="fa-solid fa-id-badge ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Manage Credentials</span>
          </span>
          <span class="ts-nav-item">
            <i class="fa-solid fa-calendar-days ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Manage Events</span>
          </span>

          <div class="ts-nav-rule"></div>

          <span class="ts-nav-item">
            <i class="fa-solid fa-book-open ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Course Library</span>
          </span>
          <span class="ts-nav-item">
            <i class="fa-solid fa-diagram-project ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Activities Builder</span>
          </span>
          <span class="ts-nav-item is-active">
            <i class="fa-solid fa-sitemap ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Test Builder</span>
          </span>
          <span class="ts-nav-item">
            <i class="fa-solid fa-folder ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">File Center</span>
          </span>

          <div class="ts-nav-rule"></div>

          <span class="ts-nav-item">
            <i class="fa-solid fa-circle-user ts-nav-icon" aria-hidden="true"></i>
            <span class="ts-nav-label">Account</span>
          </span>
        </div>
      </nav>
    </aside>

    <!-- ============================ CONTENT ============================ -->
    <main class="ts-content" id="ts-content"></main>

  </div>
</div>
```

- [ ] **Step 3: Add the bento button's forward-looking handler**

Add this `<script>` immediately **before** the toolbox include at the bottom of
`<body>`:

```html
<script>
/* ======================================================================
   TOP NAV — app switcher hook

   The bento icon will open a panel for launching other Vector apps in new
   tabs. That UI is being designed separately. Wiring it now means dropping
   it in later is a content swap, not a rewire: fill #ts-app-switcher, and
   this toggle already manages hidden + aria-expanded correctly.
   ====================================================================== */
(function () {
  var btn   = document.getElementById('ts-apps-btn');
  var panel = document.getElementById('ts-app-switcher');

  btn.addEventListener('click', function () {
    var willOpen = panel.hidden;
    // No content yet, so opening would show an empty box. Keep it closed
    // until the panel markup lands; the state plumbing is what matters here.
    if (!panel.children.length) return;
    panel.hidden = !willOpen;
    btn.setAttribute('aria-expanded', String(willOpen));
  });
})();
</script>
```

- [ ] **Step 4: Verify the chrome**

Navigate to the feature URL, resize to 1500×1000, screenshot.

Expected:
- A thin crimson rule runs across the very top.
- The top nav is white with the Vector Solutions logo at left, `Springfield Fire
  Department` beside it, and — at the far right — bento, help, bell, and a circular
  `JL` avatar.
- The sidebar is 267px wide and white, with a red Maltese-cross badge at the top and
  a small circular left-chevron on its right edge, roughly level with the badge.
- Below the badge: `Home` and `Keystone Hub` on **white**, with a blue **NEW** pill
  on Keystone Hub. `Home` shows the selected treatment (light blue fill, blue left
  bar).
- Everything from `Administration` down to `Account` is on a **near-black** block
  with white text, with three inset divider lines, and `Test Builder` visibly
  lighter than its neighbors.
- The content area to the right is empty light blue-gray. This is correct.

Then run `mcp__playwright__browser_snapshot` and confirm:
- The bento control appears as a **button** named `Switch application`.
- `Home` and `Keystone Hub` appear as **buttons**.
- No item in the Administration block appears as a button or link.

- [ ] **Step 5: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html"
git commit -m "Keystone embedded views: Target Solutions top nav and sidebar

Persistent chrome: crimson rule, top nav with a real focusable bento button
plus an empty app-switcher mount for the panel still to come, and the sidebar
with Home + a new Keystone Hub link on white above the decorative black
Administration block."
```

---

## Task 3: View switching and the embedded hub

The demo-critical increment. After this task the presenter can click between Home
and the live hub, even though the homepage is still empty.

**Files:**
- Modify: `products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html`

**Interfaces:**
- Consumes: `#ts-content` (empty), `#nav-home`, `#nav-hub`, and their `data-target`
  attributes, all from Task 2.
- Produces:
  - `#view-home` — an empty `<div>` that Tasks 4–6 fill, in source order:
    announcement banner, Frequent Activities, then the To Do / Bulletin Board row.
  - `#view-hub` — contains the hub iframe. Final; no later task touches it.
  - A global function `window.tsSetView(name)` where `name` is `"home"` or `"hub"`.
    It sets `data-view` on `.ts-app`, moves `aria-current="page"` to the matching
    nav button, and scrolls `#ts-content` to the top. **Task 6's banner CTA calls
    this exact function** — do not rename it.

- [ ] **Step 1: Append the view CSS**

Append inside `<style id="ts-styles">`:

```css
  /* ====================================================================
     VIEWS
     Two siblings in the content column; `data-view` on .ts-app shows one.
     Attribute-driven rather than two pages, so the chrome never reloads and
     the switch is instant mid-demo.
     ==================================================================== */
  .ts-view { display: none; }
  .ts-app[data-view="home"] #view-home { display: block; }
  .ts-app[data-view="hub"]  #view-hub  { display: block; }

  /* The homepage column */
  #view-home { padding: 22px 26px 40px; max-width: 1400px; }

  /* The hub fills the content area edge to edge and scrolls inside it — which
     is how an embedded product page actually behaves. .ts-content is a fixed
     flex child, so 100% height here is a real pixel height. */
  #view-hub { height: 100%; }
  #view-hub iframe { display: block; width: 100%; height: 100%; border: 0; }
  .ts-app[data-view="hub"] .ts-content { overflow: hidden; }
```

- [ ] **Step 2: Add the two view containers**

Replace this line from Task 2:

```html
    <main class="ts-content" id="ts-content"></main>
```

with:

```html
    <main class="ts-content" id="ts-content">

      <!-- ---------- VIEW: the recreated Target Solutions homepage ---------- -->
      <div class="ts-view" id="view-home"></div>

      <!-- ---------- VIEW: the real Keystone-Department-Hub ----------------
           Embedded by reference, never copied. Hub edits appear here for free,
           and its own stylesheet and #root get a clean document instead of
           fighting the Target Solutions shell. -->
      <div class="ts-view" id="view-hub">
        <!-- Eagerly loaded on purpose: `loading="lazy"` inside a display:none
             parent defers the fetch until the first click, which would put a
             visible stall in the middle of the demo. -->
        <iframe src="../../keystone-hub/index.html"
                title="Keystone-Department-Hub"></iframe>
      </div>

    </main>
```

- [ ] **Step 3: Add the view-switching script**

Add this `<script>` after the app-switcher script from Task 2, still before the
toolbox include:

```html
<script>
/* ======================================================================
   VIEW SWITCHING

   One attribute on .ts-app drives which view is visible. The shell itself
   never re-renders, so the sidebar and top nav hold perfectly still while
   the content swaps — the thing that makes the demo click feel native.
   ====================================================================== */
(function () {
  var app     = document.querySelector('.ts-app');
  var content = document.getElementById('ts-content');
  var navBtns = document.querySelectorAll('.ts-nav-light .ts-nav-item');

  window.tsSetView = function (name) {
    app.setAttribute('data-view', name);

    // Exactly one nav item reads as selected at a time.
    navBtns.forEach(function (b) {
      if (b.dataset.target === name) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });

    content.scrollTop = 0;
  };

  navBtns.forEach(function (b) {
    b.addEventListener('click', function () { window.tsSetView(b.dataset.target); });
  });
})();
</script>
```

- [ ] **Step 4: Verify the switch and the embed**

Navigate to the feature URL, resize to 1500×1000.

1. Click `Keystone Hub` in the sidebar. Screenshot.

   Expected:
   - The Target Solutions accent bar, top nav, and sidebar are **unchanged and still
     visible** — the switch affects only the content column.
   - `Keystone Hub` now shows the selected treatment; `Home` no longer does.
   - The content area renders the Keystone-Department-Hub: its greeting header, the
     published dashboard, the filter bar, and the task table.

2. Confirm the embed is genuinely interactive — click a status bucket in the hub's
   filter bar, then screenshot. Expected: the task list updates. (Playwright's
   snapshot reaches into same-origin iframes; the local server makes the frames
   same-origin, which is another reason not to use `file://`.)

3. Click `Home` in the sidebar. Screenshot.

   Expected:
   - The content area is empty light blue-gray again. **This is correct** — the
     homepage is built in Tasks 4–6.
   - `Home` shows the selected treatment; `Keystone Hub` does not.

4. Run `mcp__playwright__browser_console_messages`. Expected: no 404 for
   `../../keystone-hub/index.html` and no uncaught errors.

- [ ] **Step 5: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html"
git commit -m "Keystone embedded views: click between Home and the live hub

data-view on the shell swaps two sibling views without re-rendering the
chrome. The hub view iframes the real keystone-hub by reference, so it stays
in sync and keeps all its interactivity."
```

---

## Task 4: Frequent Activities card

**Files:**
- Modify: `products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html`

**Interfaces:**
- Consumes: `#view-home` (empty) from Task 3.
- Produces: a `.ts-card` block appended to `#view-home`. Establishes the reusable
  `.ts-card` / `.ts-card-head` / `.ts-card-title` classes that Task 5 also uses.

- [ ] **Step 1: Append the card and tile CSS**

Append inside `<style id="ts-styles">`:

```css
  /* ====================================================================
     SHARED CARD — also used by To Do and Bulletin Board in Task 5
     ==================================================================== */
  .ts-card {
    background: var(--ts-surface); border-radius: 4px;
    box-shadow: 0 1px 3px rgba(16,24,40,.10);
    margin-bottom: 20px; overflow: hidden;
  }
  .ts-card--accent { border-top: 4px solid var(--ts-accent); }
  .ts-card-head {
    display: flex; align-items: center; gap: 12px;
    padding: 18px 22px 10px;
  }
  .ts-card-title {
    margin: 0; font-size: 22px; font-weight: 400; color: #4a5a6b;
  }
  .ts-card-head-actions { margin-left: auto; display: flex; align-items: center; gap: 2px; }
  .ts-card-body { padding: 0 22px 20px; }

  /* ====================================================================
     FREQUENT ACTIVITIES
     One row of nine solid tiles. The source page also has a pastel
     "Field-based Trainings" row; it is deliberately omitted to save
     vertical space so To Do and the Bulletin Board sit higher.
     ==================================================================== */
  .ts-sublabel {
    font-size: 15px; color: var(--ts-link); font-weight: 400;
    margin: 4px 0 12px;
  }
  .ts-tiles { display: flex; gap: 12px; flex-wrap: wrap; }
  .ts-tile {
    width: 100px; height: 100px; border-radius: 8px; border: 0;
    padding: 12px 8px 10px; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    color: #fff; font: inherit; text-align: center;
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .ts-tile:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16,24,40,.20); }
  .ts-tile i { font-size: 26px; margin-top: 8px; }
  .ts-tile span { font-size: 11px; line-height: 1.25; font-weight: 600; }
  /* Two tiles are light enough to need dark ink */
  .ts-tile--dark { color: #1f2933; }
```

- [ ] **Step 2: Append the card markup**

Replace this line from Task 3:

```html
      <div class="ts-view" id="view-home"></div>
```

with:

```html
      <div class="ts-view" id="view-home">

        <!-- ================= FREQUENT ACTIVITIES ================= -->
        <section class="ts-card ts-card--accent">
          <div class="ts-card-head">
            <h2 class="ts-card-title">Frequent Activities</h2>
            <div class="ts-card-head-actions">
              <span class="ts-icon-btn" aria-hidden="true"><i class="fa-solid fa-chevron-up"></i></span>
            </div>
          </div>
          <div class="ts-card-body">
            <p class="ts-sublabel">Station-based Trainings</p>
            <div class="ts-tiles">
              <button class="ts-tile" type="button" style="background:#edb211">
                <i class="fa-solid fa-briefcase-medical" aria-hidden="true"></i><span>EMT Basics</span>
              </button>
              <button class="ts-tile" type="button" style="background:#c2306a">
                <i class="fa-solid fa-fire-extinguisher" aria-hidden="true"></i><span>Extinguisher Training</span>
              </button>
              <button class="ts-tile" type="button" style="background:#e8402a">
                <i class="fa-solid fa-fire" aria-hidden="true"></i><span>Fire Basics</span>
              </button>
              <button class="ts-tile" type="button" style="background:#6a2c91">
                <i class="fa-solid fa-shield-halved" aria-hidden="true"></i><span>Firewalls</span>
              </button>
              <button class="ts-tile" type="button" style="background:#3b3fa8">
                <i class="fa-solid fa-fire-hydrant" aria-hidden="true"></i><span>Hydrant Training</span>
              </button>
              <button class="ts-tile" type="button" style="background:#1668c9">
                <i class="fa-solid fa-shower" aria-hidden="true"></i><span>Sprinkler System Basics</span>
              </button>
              <button class="ts-tile" type="button" style="background:#0e7f9e">
                <i class="fa-solid fa-car-burst" aria-hidden="true"></i><span>Vehicle Stabilization</span>
              </button>
              <button class="ts-tile ts-tile--dark" type="button" style="background:#f2cf14">
                <i class="fa-solid fa-water" aria-hidden="true"></i><span>When Hoses Attack</span>
              </button>
              <button class="ts-tile ts-tile--dark" type="button" style="background:#d3e04f">
                <i class="fa-solid fa-water" aria-hidden="true"></i><span>When Hoses Attack</span>
              </button>
            </div>
          </div>
        </section>

      </div>
```

The repeated `When Hoses Attack` label is intentional — it appears twice in the
source page, in two different tile colors.

- [ ] **Step 3: Verify**

Navigate to the feature URL, resize to 1500×1000, make sure the `home` view is
showing, screenshot.

Expected:
- A white card sits at the top of the content column with a **crimson rule across
  its top edge**.
- The title reads `Frequent Activities` with a collapse chevron at the far right of
  the header row.
- `Station-based Trainings` appears in link blue beneath it.
- **Exactly nine** tiles in a **single row**, left to right: EMT Basics (gold),
  Extinguisher Training (raspberry), Fire Basics (red-orange), Firewalls (purple),
  Hydrant Training (indigo), Sprinkler System Basics (blue), Vehicle Stabilization
  (teal), When Hoses Attack (yellow), When Hoses Attack (yellow-green).
- The last two tiles have **dark** icons and labels; the first seven have white.
- No second row of pastel tiles.

- [ ] **Step 4: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html"
git commit -m "Keystone embedded views: Frequent Activities card

One row of nine station-based tiles. The source page's second pastel row is
omitted to keep To Do and the Bulletin Board high in the demo viewport."
```

---

## Task 5: To Do and Bulletin Board

**Files:**
- Modify: `products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html`

**Interfaces:**
- Consumes: `#view-home` and the `.ts-card` classes from Task 4.
- Produces: a `.ts-home-row` two-column grid appended to `#view-home`, after the
  Frequent Activities card. Task 6 inserts the banner *before* Frequent Activities,
  so it does not interact with this markup.

- [ ] **Step 1: Append the CSS**

Append inside `<style id="ts-styles">`:

```css
  /* ====================================================================
     HOMEPAGE TWO-COLUMN ROW
     ==================================================================== */
  .ts-home-row {
    display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: 20px; align-items: start;
  }
  @media (max-width: 1180px) { .ts-home-row { grid-template-columns: 1fr; } }

  /* ---- To Do --------------------------------------------------------- */
  .ts-tabs {
    display: flex; gap: 26px; padding: 0 22px;
    border-bottom: 1px solid var(--ts-hairline);
  }
  .ts-tab {
    border: 0; background: transparent; font: inherit; font-size: 15px;
    color: var(--ts-ink-500); padding: 8px 0 12px; cursor: pointer;
    border-bottom: 3px solid transparent; margin-bottom: -1px;
  }
  .ts-tab.is-active { color: var(--ts-ink-900); border-bottom-color: #d13438; }

  .ts-todo-list { padding: 16px 22px 20px; display: flex; flex-direction: column; gap: 12px; }
  .ts-todo {
    display: grid; grid-template-columns: 56px 1fr auto;
    gap: 14px; align-items: start;
    border: 1px solid var(--ts-hairline); border-radius: 4px; padding: 12px 14px;
  }
  .ts-todo-icon {
    width: 56px; height: 56px; border-radius: 4px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; color: #fff;
  }
  .ts-todo-icon i { font-size: 20px; }
  .ts-todo-icon span { font-size: 8.5px; font-weight: 700; letter-spacing: .2px; }
  .ts-todo-meta { font-size: 13px; color: var(--ts-ink-500); }
  .ts-todo-link {
    display: block; margin: 3px 0 5px; font-size: 15px;
    color: var(--ts-link); text-decoration: none;
  }
  .ts-todo-link:hover { text-decoration: underline; }
  .ts-todo-date { font-size: 13px; color: var(--ts-ink-500); }
  .ts-todo-right {
    display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
    justify-content: space-between; align-self: stretch;
  }
  .ts-todo-pin { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ts-ink-700); }
  .ts-todo-pin .fa-chevron-down { color: var(--ts-ink-300); font-size: 14px; }
  .ts-chip {
    font-size: 12.5px; padding: 3px 9px; border-radius: 3px;
    background: #eceff3; color: #4a5563; white-space: nowrap;
  }
  .ts-chip--rejected { background: #fde4e4; color: #b3261e; }

  /* ---- Bulletin Board ------------------------------------------------ */
  .ts-bulletin-body { padding: 4px 22px 22px; }
  .ts-bulletin-body h3 {
    margin: 0 0 14px; font-size: 27px; font-weight: 400; color: var(--ts-ink-900);
  }
  .ts-bulletin-body p {
    margin: 0 0 18px; font-size: 15.5px; line-height: 1.55; color: var(--ts-ink-700);
  }
  .ts-bulletin-rule { height: 1px; background: var(--ts-hairline); margin: 0 0 18px; }
  .ts-bulletin-figure {
    border: 8px solid #b8bec6; background: #fff; padding: 10px;
  }
```

As in Tasks 2–4, this goes **inside** the existing `<style id="ts-styles">` block,
before its closing `</style>` tag. Do not add a second `</style>`.

- [ ] **Step 2: Append the markup**

Insert this immediately **after** the closing `</section>` of the Frequent Activities
card, still inside `#view-home`:

```html
        <!-- ================= TO DO  +  BULLETIN BOARD ================= -->
        <div class="ts-home-row">

          <!-- ---------------- To Do ---------------- -->
          <section class="ts-card">
            <div class="ts-card-head">
              <h2 class="ts-card-title">To Do</h2>
              <div class="ts-card-head-actions">
                <span class="ts-icon-btn" aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>
                <span class="ts-icon-btn" aria-hidden="true"><i class="fa-solid fa-arrow-up-arrow-down"></i></span>
                <span class="ts-icon-btn" aria-hidden="true"><i class="fa-solid fa-filter"></i></span>
              </div>
            </div>

            <div class="ts-tabs">
              <button class="ts-tab is-active" type="button">All</button>
              <button class="ts-tab" type="button">Credentials</button>
              <button class="ts-tab" type="button">Assignments</button>
            </div>

            <div class="ts-todo-list">

              <article class="ts-todo">
                <div class="ts-todo-icon" style="background:#16a3a3">
                  <i class="fa-solid fa-certificate" aria-hidden="true"></i><span>Credential</span>
                </div>
                <div>
                  <div class="ts-todo-meta">ISO&nbsp; |&nbsp; 458468</div>
                  <a class="ts-todo-link" href="#">Wildfire Emergency Response Credential</a>
                  <div class="ts-todo-date">Exp Date: Mar 22, 2025</div>
                </div>
                <div class="ts-todo-right">
                  <div class="ts-todo-pin">
                    <i class="fa-solid fa-thumbtack" aria-hidden="true"></i> Pinned
                    <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                  </div>
                  <span class="ts-chip">Not Started</span>
                </div>
              </article>

              <article class="ts-todo">
                <div class="ts-todo-icon" style="background:#e8712a">
                  <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i><span>Activity</span>
                </div>
                <div>
                  <div class="ts-todo-meta">ISO&nbsp; |&nbsp; 458468</div>
                  <a class="ts-todo-link" href="#">Wildfire Emergency Response Credential</a>
                  <div class="ts-todo-date">Mar 22, 2025</div>
                </div>
                <div class="ts-todo-right">
                  <div class="ts-todo-pin">
                    <i class="fa-solid fa-thumbtack" aria-hidden="true"></i> Pinned
                    <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                  </div>
                  <span class="ts-chip">Not Started</span>
                </div>
              </article>

              <article class="ts-todo">
                <div class="ts-todo-icon" style="background:#2f7fd1">
                  <i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Course</span>
                </div>
                <div>
                  <div class="ts-todo-meta">ISO&nbsp; |&nbsp; 458468</div>
                  <a class="ts-todo-link" href="#">Wildfire Emergency Response Credential</a>
                  <div class="ts-todo-date">Exp Date: Mar 22, 2025</div>
                </div>
                <div class="ts-todo-right">
                  <div class="ts-todo-pin">
                    <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                  </div>
                  <span class="ts-chip ts-chip--rejected">Validation Rejected</span>
                </div>
              </article>

              <article class="ts-todo">
                <div class="ts-todo-icon" style="background:#7b4bd8">
                  <i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Course</span>
                </div>
                <div>
                  <div class="ts-todo-meta">ISO&nbsp; |&nbsp; 458468</div>
                  <a class="ts-todo-link" href="#">Wildfire Emergency Response Credential</a>
                  <div class="ts-todo-date">Exp Date: Mar 22, 2025</div>
                </div>
                <div class="ts-todo-right">
                  <div class="ts-todo-pin">
                    <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                  </div>
                  <span class="ts-chip">Not Started</span>
                </div>
              </article>

            </div>
          </section>

          <!-- ---------------- Bulletin Board ---------------- -->
          <section class="ts-card">
            <div class="ts-card-head">
              <h2 class="ts-card-title">Bulletin Board</h2>
              <div class="ts-card-head-actions">
                <span class="ts-icon-btn" aria-hidden="true"><i class="fa-solid fa-pencil"></i></span>
              </div>
            </div>
            <div class="ts-bulletin-body">
              <h3>Welcome</h3>
              <p>
                The Bulletin Board is visible from all user accounts and can be edited by
                any Administrator. This space can be used to communicate messages to your
                staff, save commonly used links, post a Google training calendar, embed
                videos or images, and more.
              </p>
              <div class="ts-bulletin-rule"></div>
              <div class="ts-bulletin-figure">
                <svg viewBox="0 0 400 190" width="100%" role="img" aria-label="Placeholder chart">
                  <rect width="400" height="190" fill="#fff"/>
                  <circle cx="200" cy="42" r="15" fill="#8d949c"/>
                  <path d="M10 180 L118 74 L200 140 L296 46 L390 180 Z" fill="#1668c9"/>
                </svg>
              </div>
            </div>
          </section>

        </div>
```

- [ ] **Step 3: Verify**

Navigate to the feature URL, resize to 1500×1000, `home` view showing, screenshot.

Expected:
- Two white cards sit side by side below Frequent Activities — To Do on the left
  (slightly wider), Bulletin Board on the right.
- To Do's header carries three icon buttons: search, sort arrows, filter funnel.
- The tab row reads `All  Credentials  Assignments`, with a **red underline under
  `All`** and `All` in darker ink than the other two.
- **Four** bordered task rows. Their left chips are, top to bottom: teal
  `Credential`, orange `Activity`, blue `Course`, purple `Course`.
- Every row shows `ISO | 458468`, a blue link title `Wildfire Emergency Response
  Credential`, and a date line.
- Rows 1 and 2 show a `📌 Pinned` marker; rows 3 and 4 show only a chevron.
- Status chips read `Not Started` (gray) on rows 1, 2, 4 and `Validation Rejected`
  (red on pink) on row 3.
- Bulletin Board shows an edit pencil, a `Welcome` heading, the paragraph, a
  hairline, and a thick gray-framed figure containing a blue mountain chart.

- [ ] **Step 4: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html"
git commit -m "Keystone embedded views: To Do and Bulletin Board cards

Completes the recreated Target Solutions homepage — tabbed To Do list with
type chips and status chips, alongside the Bulletin Board."
```

---

## Task 6: The announcement banner

The last piece, and the only genuinely new element on the homepage. Built with
Vector components and theme tokens.

**Files:**
- Modify: `products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html`

**Interfaces:**
- Consumes: `window.tsSetView(name)` from Task 3, and `#view-home` from Task 4.
- Produces: `#ts-announce`, inserted as the **first child** of `#view-home`, above
  the Frequent Activities card. Nothing consumes it.

- [ ] **Step 1: Append the banner CSS**

Insert this **before** the closing `</style>` tag of `<style id="ts-styles">`:

```css
  /* ====================================================================
     ANNOUNCEMENT BANNER — NEW
     The one genuinely new element on this page, so it is built from Vector
     components and theme tokens rather than the hand-matched legacy styles
     above. Dismissal is session-only, on purpose: no storage is written, so
     a reload always restores it and the demo resets to a known state.
     ==================================================================== */
  #ts-announce {
    display: flex; align-items: center; gap: 18px;
    background: var(--ts-surface);
    border: 1px solid var(--ts-hairline);
    border-left: 5px solid var(--lumo-primary-color, #0271ce);
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(16,24,40,.10);
    padding: 16px 18px; margin-bottom: 20px;
  }
  #ts-announce[hidden] { display: none; }
  .ts-announce-mark {
    width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
    display: grid; place-items: center; font-size: 19px;
    background: var(--lumo-primary-color-10pct, #0271ce1a);
    color: var(--lumo-primary-text-color, #0271ce);
  }
  .ts-announce-copy { flex: 1; min-width: 0; }
  .ts-announce-copy h3 {
    margin: 0 0 3px; font-size: 16px; font-weight: 700;
    color: var(--lumo-header-text-color, #1f2933);
    display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
  }
  .ts-announce-copy p {
    margin: 0; font-size: 14px; line-height: 1.5;
    color: var(--lumo-secondary-text-color, #5b6673);
  }
  .ts-announce-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
```

- [ ] **Step 2: Insert the banner markup**

Insert as the **first child** of `#view-home`, immediately before the
`<!-- ================= FREQUENT ACTIVITIES ================= -->` comment:

```html
        <!-- ================= ANNOUNCEMENT (NEW) ================= -->
        <section id="ts-announce" role="region"
                 aria-label="New feature announcement">
          <div class="ts-announce-mark">
            <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
          </div>
          <div class="ts-announce-copy">
            <h3>
              Introducing the Keystone-Department-Hub
              <span class="ts-new-pill">NEW</span>
            </h3>
            <p>
              Every open task across your Vector applications, prioritized in one place —
              with department readiness at a glance. Find it any time in the left
              navigation.
            </p>
          </div>
          <div class="ts-announce-actions">
            <vaadin-button theme="primary" id="ts-announce-cta">View the Department Hub</vaadin-button>
            <vaadin-button theme="tertiary" id="ts-announce-dismiss" aria-label="Dismiss announcement">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </vaadin-button>
          </div>
        </section>
```

- [ ] **Step 3: Wire the CTA and the dismiss**

Add this `<script>` after the view-switching script from Task 3, still before the
toolbox include:

```html
<script>
/* ======================================================================
   ANNOUNCEMENT BANNER

   The CTA calls the same tsSetView the nav buttons call, so both demo paths
   land in exactly the same state — including the sidebar selection moving to
   Keystone Hub.

   Dismissal deliberately writes no storage. Presenters reload between runs,
   and a banner that stays gone is a banner you cannot get back mid-demo.
   ====================================================================== */
(function () {
  var banner = document.getElementById('ts-announce');

  document.getElementById('ts-announce-cta')
    .addEventListener('click', function () { window.tsSetView('hub'); });

  document.getElementById('ts-announce-dismiss')
    .addEventListener('click', function () { banner.hidden = true; });
})();
</script>
```

- [ ] **Step 4: Verify**

Navigate to the feature URL, resize to 1500×1000, `home` view showing.

1. Screenshot. Expected:
   - A white banner sits **above** Frequent Activities with a blue left edge and a
     circular blue flame mark.
   - Heading `Introducing the Keystone-Department-Hub` with a blue **NEW** pill
     beside it, and the body copy below.
   - On the right: a **filled blue** `View the Department Hub` button and a subtle
     `×` button. Both are real `vaadin-button` elements — confirm they render as
     styled Vector buttons, not unstyled browser buttons. If they look unstyled, the
     `core.iife.js` module failed to load; check the console.

2. Click `View the Department Hub`. Screenshot. Expected:
   - The content area switches to the hub.
   - `Keystone Hub` in the sidebar now reads as selected and `Home` does not —
     identical to the state produced by clicking the nav link in Task 3.

3. Click `Home`, then click the banner's `×`. Screenshot. Expected: the banner
   disappears and Frequent Activities moves up to the top of the column.

4. Reload the page. Screenshot. Expected: **the banner is back** — dismissal did not
   persist.

- [ ] **Step 5: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html"
git commit -m "Keystone embedded views: homepage announcement banner

Promotes the new Department Hub with a CTA that lands in the same state as
the nav link. Built with Vector components and theme tokens since it is a
genuinely new element. Dismissal is session-only so the demo always resets."
```

---

## Task 7: Final pass — full demo walkthrough

No new features. This is the end-to-end gate against the spec's success criteria,
plus a responsive sanity check.

**Files:**
- Modify (only if a defect is found): `products/Keystone-Department-Hub/embedded-target-solutions/ver1/index.html`

**Interfaces:**
- Consumes: everything.
- Produces: nothing.

- [ ] **Step 1: Walk the full demo path**

Navigate to the feature URL at 1500×1000 and confirm, in order:

1. The homepage loads with banner, Frequent Activities, To Do, and Bulletin Board.
2. Clicking `Keystone Hub` swaps to the live hub with **no** shell reload; the
   sidebar selection moves.
3. Clicking `Home` returns to the homepage.
4. The banner CTA reaches the same state as the nav link.
5. Inside the embedded hub, filters, sorting, dialogs, and the role FAB all work.
6. The bento button is focusable via keyboard and exposes the accessible name
   `Switch application`.

Each of these is a spec success criterion. If any fails, fix it before Step 3.

- [ ] **Step 2: Check for console errors and a narrow viewport**

Run `mcp__playwright__browser_console_messages`. Expected: no uncaught errors, no
404s.

Then resize to 1200×900 and screenshot the `home` view. Expected: the To Do /
Bulletin Board row collapses to a single column (the `max-width: 1180px` media
query), the tiles wrap rather than overflowing, and the page does **not** scroll
horizontally.

- [ ] **Step 3: Confirm the dashboard card builds**

Run:

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups" && node scripts/build-dashboards.js
```

Expected: the script completes without error. Then `git status` — if it rewrote
dashboard output files, include them in the final commit.

Navigate to the Keystone-Department-Hub product dashboard and confirm an
**Embedded App Views** folder appears in the left Folders rail, containing
`In Target Solutions`.

- [ ] **Step 4: Commit anything outstanding**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add -A
git commit -m "Keystone embedded views: verify the Target Solutions demo end to end"
```

If nothing changed, `git commit` will report a clean tree — that is a pass, not a
failure. Skip the commit and finish.

---

## Not in this plan

- **Check It and Scheduling views.** Sibling features, built next. They reuse this
  file's structure: same two-view pattern, same hub iframe line, different chrome.
- **The app-switcher panel.** The bento button, its handler, and the empty
  `#ts-app-switcher` mount ship here; the panel UI is being designed separately and
  drops in without rewiring.
- **Dev handoff.** No `dev_handoff.html`, no `DEV-NOTES.md`, no component
  assessment. This is a demo artifact; `status` stays `in-progress` until the
  designer calls for handoff.
