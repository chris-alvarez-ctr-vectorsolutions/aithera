# Convergence — Prototyping Notes

## Layout & spacing defaults

Default spacing and canvas values for this product. Keep these consistent across screens; variation in padding between cards at the same hierarchy level is a common mistake to avoid.

- **Page padding:** content is inset **24px** from the screen edges (24px by 24px, all sides).
- **Card padding:** content inside a card defaults to **24px by 24px**. Cards at the same hierarchy level must use the same padding.
- **Canvas background:** cards and content sit on a **`#f5f9fd`** background.

## Section titles & text hierarchy

Give section / sub-section titles a clear, modern hierarchy. Do NOT default to ALL CAPS at the same size and color as the body content underneath it (a common mistake to avoid).

- A section title should read as a heading: sentence case, slightly larger or bolder than the body, and a darker heading color. Avoid uppercase + letter-spacing for content section titles.
- Reference treatment (e.g. the settings-accordion group labels): title ~13px, weight 600, color `#1a1a2e`; body content ~12.5px, weight 400, color `#374151`.
- Keep it subtle, not obtrusive: the title should be distinguishable from the body without shouting.

## Shared Convergence chrome (topnav + admin sidenav + breadcrumb)

Convergence prototypes render the production-accurate Convergence chrome (topnav, admin sidenav,
breadcrumb bar) **in-file** by including the shared chrome from `products/Convergence/_shell/`.
Each prototype is a standalone file: open it directly and it shows the chrome around its own
content. There is **no iframe and no redirect** — the chrome is injected into the page itself.
The chrome is a temporary stand-in (calibrated to the live Convergence admin) and may be replaced
later. **Give new Convergence prototypes this chrome unless the user says otherwise.**

How it works (the include contract):
- `_shell/chrome.css` styles the chrome; `_shell/chrome.js` injects the `.app` (topnav + sidenav +
  breadcrumb) and **relocates your page content into the content area**.
- A prototype's body is just `<div id="cv-page"> ...your content... </div>`. Before loading
  chrome.js, set a config object; then load chrome.js; then your page logic:
  ```html
  <head> ... <link rel="stylesheet" href="../_shell/chrome.css"/> ... </head>
  <body>
    <div id="cv-page"> ...content... </div>
    <script>window.SHELL_CONFIG = { active:'qual-quals', parent:'Qualifications', title:'Qualifications', fullBleed:false };</script>
    <script src="../_shell/chrome.js"></script>
    <script> ...page logic (runs after the chrome is built)... </script>
  </body>
  ```
- `SHELL_CONFIG`: `active` = sidenav route id to highlight; `parent`/`title` = breadcrumb labels;
  `fullBleed:true` removes content padding (use for full-screen builders; omit for padded list pages).
- The sidenav is data-driven by `NAV_TREE` in `chrome.js`. **To add a prototype:** give a NAV_TREE
  child an `href` (relative to the prototype files' folder, e.g. `Manage-Activities.html`) and set
  that prototype's `SHELL_CONFIG.active` to the child's id. Sidenav items navigate via real `<a href>`
  to the sibling files, so every page stays openable on its own.
- Build the prototype as **content only** — do NOT give it its own topnav/sidenav/breadcrumb.
- Root index (`/index.html`) entries point at the actual prototype files (not at a shell wrapper).

The current Qualification-Builder suite (all in `products/Convergence/Qualification-Builder/`):
`Manage-Qualifications.html`, `Manage-Requirements.html`, `Manage-Activities.html` (AG Grid lists),
`AI-Qualification-Builder.html` (builder + conversational AI side panel),
`Manual-Qualification-Builder.html` (same builder, no AI), and
`Manual-Requirement-Builder.html` (requirement → activities). The builders accept `?qual=<name>`
(or `?req=<name>`) to open an existing item for editing; the AG Grid lists are the single entry
point and link names to the builders. `_shell/index.html` (the old iframe shell) is **legacy/deprecated**.

When a prototype has heavy AG Grid tables, load AG Grid Community from the CDN (this is an explicit
exception to the "no JS libraries" rule, used because the user asked for AG Grid):
`https://cdn.jsdelivr.net/npm/ag-grid-community@31.3.4/...` (see `Manage-Qualifications.html`).

## AI / Smart Recommendations rule

When building any AI-powered or "smart" recommendation surface in Convergence prototypes:

- **Do not** add a "Vector AI" badge, pill, or other AI branding to the UI.
- **Do not** add overtly AI-themed styling such as multi-color gradient stripes, "Powered by AI" labels, sparkle-icon chrome, or purple/violet brand accents that read as an "AI module."
- The module should look like a normal recommendation / suggestion surface that happens to be intelligent — title it for the function (e.g. "Recommended Actions", "Suggestions", "Recommended Training") rather than for the technology.
- Functional behavior (data-driven triggers, dismissibility, replacement on dismiss, etc.) is unaffected — only the branding/styling is restricted.

This rule applies to every AI feature added to Convergence prototypes from this point forward, unless the user explicitly says otherwise.
