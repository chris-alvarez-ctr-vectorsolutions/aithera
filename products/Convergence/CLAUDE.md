# Convergence — Prototyping Notes

## Default shell for Convergence prototypes

Every Convergence prototype is contained inside the **Convergence LMS shell** at
`products/Convergence/_shell/` (vendored from the `ct-lms-demo-site` repo). This shell provides
the production-accurate topnav, admin sidenav, and breadcrumb bar. It is a temporary stand-in
to show what new prototypes look like in the existing code, and will be replaced with a better
UI later. **Always wrap new Convergence prototypes in this shell unless the user says otherwise.**

How it works:
- The shell (`_shell/index.html`) mounts each prototype as an **iframe** in its `.content-slot`,
  keyed by route. Prototypes can talk back to the shell via `postMessage`
  (e.g. `{type:'shell:builder-active', active:true}`).
- To add a prototype: (1) add a child to the `qualifications` (or relevant) node in `NAV_TREE`,
  (2) add an `else if (activeRoute === 'your-route')` branch in `renderContent()` pointing an
  `<iframe>` at your prototype file, and (3) optionally set it as the default `activeRoute`.
- Build the prototype as **content only** — do NOT give it its own topnav/sidenav/breadcrumb;
  the shell supplies that chrome. If a prototype already has its own chrome, hide it when embedded:
  `if (window.self !== window.top) document.documentElement.classList.add('embedded')`, then
  hide the chrome and zero out header-dependent fixed offsets under `.embedded` (see how
  `Qualification-Builder/index.html` does it).
- The root index entry for a Convergence prototype should point at the shell (`_shell/`), not the
  bare prototype file, so it always renders inside the chrome.

## AI / Smart Recommendations rule

When building any AI-powered or "smart" recommendation surface in Convergence prototypes:

- **Do not** add a "Vector AI" badge, pill, or other AI branding to the UI.
- **Do not** add overtly AI-themed styling such as multi-color gradient stripes, "Powered by AI" labels, sparkle-icon chrome, or purple/violet brand accents that read as an "AI module."
- The module should look like a normal recommendation / suggestion surface that happens to be intelligent — title it for the function (e.g. "Recommended Actions", "Suggestions", "Recommended Training") rather than for the technology.
- Functional behavior (data-driven triggers, dismissibility, replacement on dismiss, etc.) is unaffected — only the branding/styling is restricted.

This rule applies to every AI feature added to Convergence prototypes from this point forward, unless the user explicitly says otherwise.
