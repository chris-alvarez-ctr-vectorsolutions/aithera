# Atlas navigation shell · design notes

Static, high-fidelity explorations of a unified navigation shell that could be shared
across multiple Vector Solutions products. Branding is deliberately neutral (grayscale
surfaces, one indigo accent, system font stack) so reviews focus on structure, not styling.
Open `index.html` for the browsable gallery with live thumbnails.

## The placeholder suite

Three invented products stand in for real Vector products. Each has a deliberately
different internal structure so app-switching visibly reconfigures the nav while the
shell stays identical:

| Product | Stands in for | Internal shape |
|---|---|---|
| **Learn** | LMS / course + training management | Deep: modes (Home / Admin / Training Plan / Reporting & Insights), 3-level content tree |
| **Comply** | EHS / safety + compliance | Medium: modes (Home / Incidents / Inspections / Chemical safety / Reporting), queue-style lists |
| **Schedule** | Workforce scheduling | Shallow: no modes, one flat nav, board-centric |

A fourth tile, **Insights**, appears in switchers as a not-licensed app to show the
"request access" state.

## The shared shell contract (identical in all 6 versions)

- Top bar, left to right: **nav open/close** (always the far-left item, directly above the
  side nav's edge) · **app switcher** · product identity + org · global search (⌘K) ·
  **+ New** · notifications · help · avatar. V1, V5 and V6 carry the toggle; V4 ships
  permanently collapsed by design, so it has none.
- One accent token (`--accent`) reserved for active/selection states; everything else grayscale.
- Same design tokens in every file (colors, spacing, radius, type scale) so versions differ
  in structure only. Dark theme (V4) changes token values, not component rules.
- Switching ≠ navigating: other products never appear inside the current product's nav tree.
- Depth is carried by indentation and guide lines, never longer labels. Visible depth caps at 3.
- Landmarks (`banner` / `nav` / `main`), `aria-current`, visible `:focus-visible` rings,
  skip link, and no hover-only destinations (flyouts/tooltips also open on keyboard focus;
  every rail icon is itself a clickable landing-page link).

## Version matrix

| # | File | App switcher | Side-nav hierarchy | Top tabs | Theme / density | What it tests |
|---|---|---|---|---|---|---|
| V1 | `v1-launcher-tabs.html` | 9-dot grid launcher (top-left) | Nested accordion, 2 levels | **In the top bar**, top-right | Light / comfortable | Modes as tabs without a second chrome row; tabs live-swap the side nav; nav open/close toggle |
| V2 | `v2-rail-twopane.html` | Far-left icon rail, always visible | Two-pane: icon sections + items column | None | Light / comfortable | Physical separation of switch vs navigate; "one shell, many products" (rail click swaps everything) |
| V3 | `v3-sidebar-dropdown-tree.html` | Dropdown in the sidebar header | Nested tree, full 3 levels | None | Light / comfortable | The hierarchy requirement (Training → Compliance courses → OSHA 10 · 2024); chrome-minimal switcher |
| V4 | `v4-dense-dark-flyout.html` | 9-dot grid launcher | Collapsed 56px icon rail + flyout submenus | None | **Dark / compact** | Collapse as a designed state; density for data-heavy screens; token-only re-theming |
| V5 | `v5-topbar-switcher-tabs.html` | Named product dropdown in the top bar | Shallow flat list + saved views | **Dedicated row** under the top bar | Light / comfortable | The Convergence/Salesforce analog; contrast with V1 (same tab philosophy, two rows vs one) |
| V6 | `v6-synthesis.html` | Far-left icon rail | Flat list per mode, collapses to icon rail | **Per-product optional** (Learn/Comply yes, Schedule no) | Light / comfortable | The recommended synthesis; tabs as an opt-in layer; responsive auto-collapse below 1120px |

### Axis coverage

- **Switcher patterns:** grid launcher (V1, V4) · persistent rail (V2, V6) · sidebar-header
  dropdown (V3) · top-bar named dropdown (V5).
- **Hierarchy patterns:** accordion (V1, V3) · two-pane (V2) · flyout-from-rail (V4) ·
  shallow flat (V5, V6).
- **Tabs philosophy:** tabs-in-bar (V1) · tabs-own-row (V5) · no tabs (V2, V3, V4) ·
  optional per product (V6).
- **Density & collapse:** compact + dark (V4) · collapse-to-rail with tooltips (V4, V6) ·
  hide/show toggle (V1, V5) · responsive auto-collapse (V6).

## Version switcher (review tooling, not part of the design)

Every version file carries a small dark pill in the **bottom-left corner**: `All` (back to the
gallery) followed by V1 to V6, with the current version highlighted and each button titled with
its pattern. It exists so reviewers can flip between explorations in place instead of returning
to the gallery each time. It is a single self-contained block at the end of each file (one
`<style>` plus one `<nav class="vswitch">`) marked `REVIEW TOOLING - NOT PART OF THE PRODUCT
DESIGN`; delete that block to remove it.

## Demo states (URL params)

Files are static mocks with just enough vanilla JS to demonstrate the defining interaction.
No storage, no frameworks, no build step; every file opens directly from disk.

| File | Params |
|---|---|
| V1 | `?launcher` opens the app grid · `?mode=home\|admin\|trainplan\|reporting` selects a tab (side nav + content swap) · `?nav=closed` starts with the side nav closed |
| V2 | `?app=learn\|comply\|schedule` selects the rail product |
| V3 | `?switcher` opens the product menu |
| V4 | `?launcher` opens the app grid · `?fly` pins the Shifts flyout open (it otherwise opens on hover/keyboard focus) |
| V5 | `?switcher` opens the product menu · `?nav=closed` |
| V6 | `?app=…` selects the rail product · `?collapsed` collapses the side nav (also auto-collapses below 1120px) |

## Review feedback incorporated

- V1 originally had a separate tab row; reworked so the mode tabs live in the top-right of
  the single top bar. V5 keeps the dedicated row on purpose so both tab placements can be
  compared directly.
- Open/close for the side nav is now a shell feature: hide/show toggle in V1 and V5,
  collapse-to-icon-rail in V4 and V6.
- V1's tabs are live and reconfigure the side nav per mode, making "tabs switch mode, side
  nav navigates within the mode" observable rather than described.

## Recommendation

Advance **V6**, pressure-tested against **V5**:

- The app rail is the only switcher that keeps the whole suite permanently visible while
  physically separating switching from navigating.
- Tabs as an opt-in, per-product layer let deep products (the Convergence pattern) and
  shallow products share one shell without forcing empty chrome on simple products.
- Collapse-to-rail plus the 3-level cap keeps the side nav honest as products grow.
- If typical orgs license more than 5 or 6 products, the rail stops scaling; V5's named
  dropdown is the fallback switcher, which is why it stays in the set.

### Open questions for the Vector team

1. How many products does a typical org actually license? The rail is great at 3 and wrong
   at 10; this answer picks the switcher pattern.
2. Once tabs absorb the mode level, do any Vector products still need level-3 nav items
   (V3), or is 2 levels + tabs always enough?
3. Who owns the tab row per product: fixed platform contract or product-team freedom, and
   how is drift prevented if the latter?

## Files

```
vector-nav/
  index.html                     gallery (live iframe thumbnails, rationale, links)
  v1-launcher-tabs.html          V1 · grid launcher + in-bar mode tabs + accordion
  v2-rail-twopane.html           V2 · app rail + two-pane nav, no tabs
  v3-sidebar-dropdown-tree.html  V3 · sidebar product dropdown + 3-level tree
  v4-dense-dark-flyout.html      V4 · dense dark, collapsed rail + flyouts
  v5-topbar-switcher-tabs.html   V5 · top-bar switcher + dedicated tab row
  v6-synthesis.html              V6 · recommended synthesis
  DESIGN-NOTES.md                this file
```
