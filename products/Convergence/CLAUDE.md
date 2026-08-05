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

## Review comments (Design Toolbox) — every prototype must be commentable

Every Convergence prototype carries the Design Toolbox so reviewers can drop pins, comments, and threads on it. The widget is documented in `designtoolbox/FEEDBACK-WIDGET.md`; the shared bottom-center dock and flow map are in `designtoolbox/README.md`. One line before `</body>` turns it on:

```html
<script src="../../../designtoolbox/toolbox.js"></script>
```

- **The path is depth-relative.** Count the folders between the file and the repo root: `products/Convergence/<mock>.html` uses `../../`, `products/Convergence/<feature>/<page>.html` uses `../../../`, a versioned design at `products/Convergence/<feature>/verN/index.html` uses `../../../../`, and a nested page such as `Report Redesigns/Report Redesign/V1/<page>.html` uses `../../../../../`. A wrong depth is a silent 404: no console error you'll notice, just no comment widget.
- **New mocks get it for free.** `base-template/version.html` now ships the include, so anything scaffolded from the template is commentable the moment it exists. Only hand-written or older files need it added.
- **Put it last, after the shared chrome.** On a chrome-based page the order is `chrome.js`, then the page logic, then the toolbox include, immediately before `</body>` — the chrome relocates page content, so the toolbox should mount after that has happened.
- **Do NOT add it to**: the feature-root loader `index.html` (copied verbatim from `base-template/index.html`; it merges the loaded version's dock by itself), generated `dashboard/` pages, shared partials (`Convergence Small UI Improvements/ver1/shared/head.html`), redirect stubs (`Qualification-Builder/index.html`), or the legacy `_shell/` pages.
- **Never hand-roll commenting into a mock**, and don't leave annotation callouts on the page. Reviewer detail belongs in pins; developer detail belongs in `DEV-NOTES.md`.
- **Opt-outs** (set `window.TOOLBOX` before the include): `{ comments: false }` = flow map only, which is what dev-handoff builds use; `{ flowMap: false }` = comment widget only, which is how the `Convergence Small UI Improvements` sibling pages are set up since `index.html` owns the flow map. `?toolbox=off` suppresses both for a clean screenshot.
- **Leave comments on the GitHub Pages URL.** Pins are keyed to the canonical Pages URL and stored in Cloudflare KV so everyone sees the same thread. Off Pages (localhost, preview server, `file://`) the widget stays dormant by design, so share the Pages link when you want feedback.

## Dev-ready snapshots (dated duplicate)

When a Convergence prototype is marked ready for dev ("ready for dev", "ready for handoff", "hand this off"), run the standard dev-handoff process in the root `CLAUDE.md`, then **also save a dated duplicate** of the dev build beside it. The dated copies are the record of exactly what a developer was given on a given day.

```
products/Convergence/<feature>/
  index.html                     the version loader
  dev_handoff.html               live dev build (drives the "Ready for Dev" pill)
  dev_handoff_2026-08-04.html    dated snapshot of what was handed off that day
  ver1/index.html                the design
```

Rules:

- **Name the copy `dev_handoff_YYYY-MM-DD.html`**, using the date the prototype was marked ready (today's date at handoff time), not its last-edit date.
- Create it **after** `dev_handoff.html` is finalized, as a plain byte copy so both files share the same comments-off toolbox config and the same relative paths: `cp dev_handoff.html dev_handoff_2026-08-04.html`.
- **`dev_handoff.html` must keep that exact name.** `scripts/build-dashboards.js` looks for it by name to flip the dashboard card to "Ready for Dev". The dated file is archive only: the dashboard never links it, so it can never steal the card's dev link.
- With per-version dev builds (Step 0's alpha/beta case), keep the date last: `dev_handoff_alpha_YYYY-MM-DD.html`, `dev_handoff_beta_YYYY-MM-DD.html`. One dated copy per kept version.
- **Re-handing off later:** leave every earlier dated file in place, refresh `dev_handoff.html` from the chosen version, and add a new dated copy. Never overwrite or delete a previous snapshot; the accumulated set is the handoff history.
- In `DEV-NOTES.md`, add a `Handed off YYYY-MM-DD → dev_handoff_YYYY-MM-DD.html` line (newest first) so a developer can tell which build they were pointed at.
- Commit the dated copy along with the rest of the handoff files in Step 6.
- **Convergence-specific path check:** the dev build sits one folder above the design, so the shared-chrome includes shift with it. Verify `_shell/chrome.css` / `_shell/chrome.js` (and any AG Grid CDN or toolbox include) still resolve from the copy's location before handing it off.

**Standalone-file prototypes** (the older Convergence layout, e.g. `Qualification-Builder/Manage-Qualifications.html`, where the mock is a single `.html` rather than a versioned feature folder): the dashboard's automatic dev detection only fires for folder-style mocks, so name the pair after the source file in the same folder — `Manage-Qualifications_dev_handoff.html` plus `Manage-Qualifications_dev_handoff_YYYY-MM-DD.html` — and set `"status": "ready-for-dev"` explicitly on that item in `products.json` so the card's pill still updates.
