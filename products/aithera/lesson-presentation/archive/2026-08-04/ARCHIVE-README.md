# Frozen snapshot — 2026-08-04

A **frozen, self-contained copy** of the Aithera lesson-presentation prototypes as
of 2026-08-04, captured immediately **before** the "Option B" Writer Studio
player-shell convergence refactor.

Everything a prototype loads at runtime — all `*.html` pages plus `js/ css/
assets/ thumbnails/ experiments/ docs/` — is duplicated here with **relative
paths only** (verified: zero `../` escapes), so these pages keep rendering their
as-of-Aug-4 behavior even after the live tree is refactored.

**Do not edit anything in this folder.** It is a reference / regression baseline.
When comparing a migrated live page against its original, open the original here.

- **Diffable git baseline:** tag `archive/pre-option-b-2026-08-04`
  (`git show archive/pre-option-b-2026-08-04:products/aithera/lesson-presentation/<file>`)
- **Browse the snapshot index:** `archive/2026-08-04/index.html`
- **Excluded on purpose:**
  - `worker/` — server-side Cloudflare Worker source. The live pages POST to the
    deployed worker URL, not to this folder, so it is browser-irrelevant here.
  - the service worker — none exists at this layer, so nothing caches under this
    path and the frozen assets always load from disk.

## Why this exists

The Option-B track extracts one universal player-shell (a runtime sibling of
`studio-shell.js`) + a shared `coachNode`, and re-points each migrated type's
`previewUrl()` at a single generic live page. That migration is *additive* — the
originals stay in place until each flip is proven — but this snapshot guarantees a
permanent, linkable "before" even after the originals are eventually retired.
