# Vector EHS — Prototyping Notes

## Layout & spacing defaults

Default spacing and canvas values for this product. Keep these consistent across screens; variation in padding between cards at the same hierarchy level is a common mistake to avoid.

- **Page padding:** content is inset **24px** from the screen edges (24px by 24px, all sides).
- **Card padding:** content inside a card defaults to **24px by 24px**. Cards at the same hierarchy level must use the same padding.
- **Canvas background:** cards and content sit on a **`#f5f9fd`** background.

## Section titles & text hierarchy

Give section / sub-section titles a clear, modern hierarchy. Do NOT default to ALL CAPS at the same size and color as the body content underneath it (a common mistake to avoid).

- A section title should read as a heading: sentence case, slightly larger or bolder than the body, and a darker heading color. Avoid uppercase + letter-spacing for content section titles.
- Reference treatment: title ~13px, weight 600, color `#1a1a2e`; body content ~12.5px, weight 400, color `#374151`.
- Keep it subtle, not obtrusive: the title should be distinguishable from the body without shouting.

## Labels & casing

All label-like text uses **sentence case** — never all caps. This covers form field labels, section / sub-section labels, step indicators, and the small inline tag/status chips.

- Do **not** apply `text-transform: uppercase` (or `letter-spacing`-driven caps) to any label, field title, step indicator, or tag chip. This styling has been removed across the EHS mobile prototypes (`Mobile App - main.html`, `Mobile App - blue sky.html`).
- Author the text the way it should read: "Search users", "Report type", "Step 1" — not "SEARCH USERS" / "STEP 1". Don't reintroduce caps in the markup either.
- Genuine acronyms (JSA, EHS, PPE, ID) stay uppercase because that is their correct spelling, not a styling choice.

## AI / Smart Recommendations rule

When building any AI-powered or "smart" recommendation surface in EHS prototypes:

- **Do not** add a "Vector AI" badge, pill, or other AI branding to the UI.
- **Do not** add overtly AI-themed styling such as multi-color gradient stripes, "Powered by AI" labels, sparkle-icon chrome, or purple/violet brand accents that read as an "AI module."
- The module should look like a normal recommendation / suggestion surface that happens to be intelligent — title it for the function (e.g. "Recommended Actions", "Suggestions") rather than for the technology.
- Functional behavior (data-driven triggers, dismissibility, replacement on dismiss, etc.) is unaffected — only the branding/styling is restricted.

This rule applies to every AI feature added to EHS prototypes from this point forward, unless the user explicitly says otherwise.

## Review comments (Design Toolbox) — every prototype must be commentable

Every EHS prototype carries the Design Toolbox so reviewers can drop pins, comments, and threads on it. The widget is documented in `designtoolbox/FEEDBACK-WIDGET.md`; the shared bottom-center dock and flow map are in `designtoolbox/README.md`. One line before `</body>` turns it on:

```html
<script src="../../../../designtoolbox/toolbox.js"></script>
```

- **The path is depth-relative.** Count the folders between the file and the repo root: `products/EHS/<mock>.html` uses `../../`, `products/EHS/Web/<page>.html` or `products/EHS/<feature>/index.html` uses `../../../`, and a versioned design at `products/EHS/<feature>/verN/index.html` uses `../../../../`. A wrong depth is a silent 404: no console error you'll notice, just no comment widget.
- **New mocks get it for free.** `base-template/version.html` now ships the include, so anything scaffolded from the template is commentable the moment it exists. Only hand-written or older files need it added.
- **Do NOT add it to**: the feature-root loader `index.html` (copied verbatim from `base-template/index.html`; it merges the loaded version's dock by itself), generated `dashboard/` pages, shared partials, or redirect stubs.
- **Never hand-roll commenting into a mock**, and don't leave annotation callouts on the page. Reviewer detail belongs in pins; developer detail belongs in `DEV-NOTES.md`.
- **Opt-outs** (set `window.TOOLBOX` before the include): `{ comments: false }` = flow map only, which is what dev-handoff builds use; `{ flowMap: false }` = comment widget only, for sibling sub-pages when one hub page owns the flow map. `?toolbox=off` suppresses both for a clean screenshot.
- **Leave comments on the GitHub Pages URL.** Pins are keyed to the canonical Pages URL and stored in Cloudflare KV so everyone sees the same thread. Off Pages (localhost, preview server, `file://`) the widget stays dormant by design, so share the Pages link when you want feedback.

## Dev-ready snapshots (dated duplicate)

When an EHS mock is marked ready for dev ("ready for dev", "ready for handoff", "hand this off"), run the standard dev-handoff process in the root `CLAUDE.md`, then **also save a dated duplicate** of the dev build beside it. EHS mocks get handed off more than once, and the dated copies are the record of exactly what a developer was given on a given day.

```
products/EHS/<feature>/
  index.html                     the version loader
  dev_handoff.html               live dev build (drives the "Ready for Dev" pill)
  dev_handoff_2026-08-04.html    dated snapshot of what was handed off that day
  ver1/index.html                the design
```

Rules:

- **Name the copy `dev_handoff_YYYY-MM-DD.html`**, using the date the mock was marked ready (today's date at handoff time), not the mock's last-edit date.
- Create it **after** `dev_handoff.html` is finalized, as a plain byte copy so both files share the same comments-off toolbox config and the same relative paths: `cp dev_handoff.html dev_handoff_2026-08-04.html`.
- **`dev_handoff.html` must keep that exact name.** `scripts/build-dashboards.js` looks for it by name to flip the dashboard card to "Ready for Dev". The dated file is archive only: the dashboard never links it, so it can never steal the card's dev link.
- With per-version dev builds (Step 0's alpha/beta case), keep the date last: `dev_handoff_alpha_YYYY-MM-DD.html`, `dev_handoff_beta_YYYY-MM-DD.html`. One dated copy per kept version.
- **Re-handing off later:** leave every earlier dated file in place, refresh `dev_handoff.html` from the chosen version, and add a new dated copy. Never overwrite or delete a previous snapshot; the accumulated set is the handoff history.
- In `DEV-NOTES.md`, add a `Handed off YYYY-MM-DD → dev_handoff_YYYY-MM-DD.html` line (newest first) so a developer can tell which build they were pointed at.
- Commit the dated copy along with the rest of the handoff files in Step 6.
