# ux-mockups

Quick HTML/CSS/vanilla-JS prototypes built by the Vector UX team for design
review and dev handoff. No build step, no frameworks — every prototype is a
plain file you can open in a browser.

## Preview locally

The prototypes use ES modules and `fetch`, so they need to be *served*, not
opened with `file://`. From the repo root:

```bash
python3 -m http.server 4599
```

Then open <http://localhost:4599/> for the shareable index, or go straight to a
prototype, e.g. <http://localhost:4599/products/aithera/>.

If you use Claude Code, the same server is defined in
[`.claude/launch.json`](.claude/launch.json) (`static` serves the repo root on
4599) — start it with `preview_start`.

## Layout

```
index.html        Shareable index — links to every prototype
base-template/    Starting-point files to copy for a new mock
products/         One folder per product (aithera, EHS, Pathways, …)
commentwidget/    Feedback widget worker
scripts/          Maintenance helpers
context/          Cached Vector component & theme CONTEXT.md (from the CDN; see CLAUDE.md)
```

## Adding a new prototype

The full process — including the Vector web-component library and the design
tokens to use — is documented in [`CLAUDE.md`](CLAUDE.md). In short:

1. Copy `base-template/index.html` into a folder under the right `products/…`.
2. Build with Vector web components (`vaadin-*` / `vwc-*`) — resolve the
   component/theme reference from the [`context/`](context/) cache (or the CDN)
   using the lookup pattern in [`CLAUDE.md`](CLAUDE.md).
3. Register it in [`products.json`](products.json) so it shows in the index and
   the product dashboards.

## Working in the shared repo

Several people edit different products here at once. Two habits keep it smooth:

- **Commit and push your work promptly** — don't leave changes sitting
  uncommitted in the working tree. (Ask the team about the current branch
  convention before starting a larger piece of work.)
- **Keep personal config out of commits.** Shared Claude rules live in
  `.claude/settings.json`; put your own machine paths and permissions in
  `.claude/settings.local.json` (gitignored). Editor settings (`.vscode/`) are
  gitignored too.
