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
- Menu items keep this exploration's own visual style, but borrow two things from the
  shipping products (see below): the trailing disclosure chevron and the menu vocabulary.
- Depth is carried by indentation and guide lines, never longer labels. Visible depth caps at 3.
- Landmarks (`banner` / `nav` / `main`), `aria-current`, visible `:focus-visible` rings,
  skip link, and no hover-only destinations (flyouts/tooltips also open on keyboard focus;
  every rail icon is itself a clickable landing-page link).

## What the menus borrow from Convergence + EHS

Per design review, the VISUAL style of menu rows is this exploration's own (rounded inset
rows, soft accent tint for the active item, indented accordion children with a 1px guide
line). Two things are deliberately taken from the shipping products:

1. **Trailing disclosure chevron** (Convergence `.sn-row .sn-chevron`, EHS `.sb-chevron`):
   the expand/collapse chevron sits at the row's right edge and flips 180° when open. With a
   leading caret, an expandable row's label sits further right than a plain row's, so plain
   items read as living at a higher level; trailing chevrons put every same-level item on one
   icon x and one label x. Count badges sit inline after the label on every row, so plain
   rows and expandable rows read the same and the right edge belongs to the chevron alone.
2. **Menu vocabulary and structure**: nav content echoes the real products' IA rather than
   invented labels.
   - **Learn = Convergence.** V1's Admin mode carries the full Convergence admin NAV_TREE
     as accordions with their actual children: Dashboard · Organization (Users / Teams /
     Departments / Sites / Regions / Groups) · Training import and creation (Content wizard /
     Quizzes / Surveys / Tasklists / Signatures / Classes) · Files · Activities ·
     Qualifications · Reports (My recents / Frequently used / All reports / Activity /
     Qualification / User / Organizational / Scheduled) · Assets · Security (Roles / Copy
     roles / Assign roles / Role assignments) · System (Jobs / Configuration / Notifications /
     User connections). The Training Plan and Reporting modes use the same vocabulary;
     V2 to V5 share V1's menus outright.
   - **Comply = EHS.** V1's Comply pane is the real EHS sidebar structure: Safety management
     is a SECTION header whose items are plain links except where EHS itself nests them, so
     Inspections (Summary / Scheduled), Observations (Summary / Scheduled), Risk management
     (Claims / Payments) and Industrial hygiene (Sampling / Exposure assessments / Exposure
     groups / Agents) are accordions while Incidents, Hazards, Corrective actions, JSA, SDS,
     Tasks, Events, Document library, Supporting documents and Customer service stay flat;
     Training and Analytics are further sections with their EHS children. V2 to V5 share
     V1's EHS pane.

## Version matrix (current set)

All five versions share the same shell: real Vector products, waffle/rail switcher with a
cross-product Dashboard, Convergence-style location tree picker, scoped search, in-bar
mode tabs, 3-level side nav, customer logo slot, and review toggles (Logo / Loc / Tabs)
in the bottom-left pill.

| # | File | Differs from V1 by |
|---|---|---|
| V1 | `v1-launcher-tabs.html` | The reference shell (nothing) |
| V2 | `v2-rail-twopane.html` | Switcher is a persistent left app rail (Dashboard on top, waffle at bottom for the catalog); search moves into the side nav, scoped to the current product, live-filtering the menu |
| V3 | `v3-flyout-hierarchy.html` | Side-nav hierarchy only: children open in a flyout panel to the RIGHT of the nav; L3 nests inside the panel; one panel at a time |
| V4 | `v4-text-hierarchy.html` | Side-nav hierarchy only: no guide lines; depth carried by typography (weight 650 → 500 → 400, ink → ink-2 → ink-3, 13 → 12.5 → 12px) |
| V5 | `v5-color-hierarchy.html` | Side-nav hierarchy only: no guide lines, no containers; the OPEN accordion headers take color (soft accent tint at level 1, stronger tint at level 2), children simply indent |

## Archived explorations

The original six-version exploration (placeholder products, two-pane nav, dense dark
flyout build, dedicated tab row, synthesis) moved to `archive/` when the brief was
updated. Their review pills still reference the old set; they are kept for history only.

## Customer logo slot (platform customization)

Orgs can surface their own branding at the top of the side nav, above the menu items: a
customer logo image (here a placeholder "Northline Utilities" lockup) renders in a bordered
slot at the top of the nav. It is customer CONTENT, not shell UI, so it is exempt from the
neutral token palette. Present in every current version (every nav, including the Dashboard pane). Toggle it
with the **Logo** button in the bottom-left review pill or deep-link the hidden state with
`?logo=off`.

## App switcher, matched to the design system

The launcher popover in V1 and V4 follows the anatomy of `vwc-app-switcher-menu` from
@vector-web-components/core (extracted from the v1.19.0 bundle):

- Trigger: the MDI "apps" **waffle icon (3×3 squares)**, exactly the component's toggle icon;
  every version's switcher affordance now uses it.
- Popover: 360px wide, anchored under the trigger, with a backdrop scrim.
- Content: a products title ("Your Atlas products", standing in for the component's "Your
  Vector Solutions Products"), then full-bleed product rows at the component's `vwc-item`
  metrics (48px min-height, 16px gaps, 12px/16px padding): product logo at start, name as the
  headline, end slot + the component's **open-in-new icon**.
- A divider, then **unlicensed products** on a tinted ground with a "Learn more" end slot
  (Insights plays this role), matching the component's licensed/unlicensed split.
- The current product carries a small "Current" tag in the end slot (mock-only affordance so
  reviewers can see state; the real component treats all rows as external product links).

## V1 + V2 pilot the updated shell spec (real products, Dashboard, location, scoped search)

Per the updated brief, V1 carries the revised shell and V2 is the same shell with the app
rail as its only difference; V3 to V6 still show the earlier spec until the direction is
confirmed. The location selector is the Convergence nested tree picker: chevron toggles,
node name + level label (Organization / Region / Site), a check on the selected node, and
selection allowed at any level. The scope control reads "All" or the current
product's name (never the generic "This product"), and the placeholder mirrors it (Search
all products / Search Convergence). In V2, search moves into the side nav and is scoped to
the current product only, typing live-filters the menu. Per review, the top bar carries no
+ New action.

- **Real Vector products.** Convergence and Vector EHS Management are fully built and
  switchable; Vector Scheduling is pinned; Vector Check-It, Vector Evaluations, Vector PD
  Tracking, Vector Pathways, Guardian Tracking, Acadis, Frontline Public Safety and
  ArdentSky Compliance Suite (unlicensed, "Learn more") sit under an "All products"
  expansion. The switcher scales: in-panel product search, pinned first.
- **Cross-product Dashboard.** A distinct entry pinned above the switcher divider; not a
  product. Selecting it swaps in cross-product side-nav groupings (My work / Reports /
  Admin) and an overview aggregating KPIs across products (training completion, open
  incidents, coverage gaps, overdue inspections, evaluations due, compliance status) plus
  two simple charts.
- **Location selector** (Convergence-style) in the top bar, replacing the static org text:
  current location with a searchable dropdown of sites ("Showing 6 of 23").
- **Scoped global search**: the field carries an explicit scope control, All products /
  This product. Results are grouped by product under the all-products scope, with a note
  that the other scope limits results to the current app.
- **3-level side nav**: Convergence shows Curricula → Annual Compliance → OSHA 10 · 2024
  (the expandable Annual Compliance row is itself the active destination); Vector EHS
  shows Inspections → Scheduled inspections → Monthly fire extinguisher check. Depth is
  carried by indentation only and capped at 3.

## Version switcher (review tooling, not part of the design)

Every version file carries a small dark pill in the **bottom-left corner**: `All` (back to the
gallery) followed by V1 to V6, with the current version highlighted and each button titled with
its pattern. It exists so reviewers can flip between explorations in place instead of returning
to the gallery each time. The pill also carries review toggles: **Logo** (customer logo slot), **Loc** (location
picker) and **Tabs** (mode tabs), plus `?logo=off` / `?loc=off` / `?tabs=off` deep links. It is a single self-contained block at the end of each file
(one `<style>` plus one `<nav class="vswitch">`) marked `REVIEW TOOLING - NOT PART OF THE
PRODUCT DESIGN`; delete that block to remove it.

## Demo states (URL params)

Files are static mocks with just enough vanilla JS to demonstrate the defining interaction.
No storage, no frameworks, no build step; every file opens directly from disk.

| File | Params |
|---|---|
| V1, V3, V4, V5 | `?app=comply\|dashboard` · `?mode=home\|admin\|trainplan\|reporting` · `?launcher` · `?search` · `?location` (opens the picker) · `?nav=closed` · `?logo=off` · `?loc=off` (hides the picker) · `?tabs=off` (hides the mode tabs) |
| V2 | Same minus `?search` (search is the side-nav filter) |

## Review feedback incorporated

- V1 originally had a separate tab row; reworked so the mode tabs live in the top-right of
  the single top bar. V5 keeps the dedicated row on purpose so both tab placements can be
  compared directly.
- Open/close for the side nav is now a shell feature: hide/show toggle in V1 and V5,
  collapse-to-icon-rail in V4 and V6.
- V1's tabs are live and reconfigure the side nav per mode, making "tabs switch mode, side
  nav navigates within the mode" observable rather than described.
- Per review, V1 drops the global search field and the + New action from its top bar; the
  other versions keep the full slot set for comparison.
- Rows briefly adopted Convergence/EHS visual styling (full-bleed rows, left accent bar,
  tinted accordion band); review preferred the original open-accordion look, so the visuals
  reverted while keeping the trailing chevron and adopting the products' menu vocabulary.
- The exploration was consolidated: V1/V2 are the live shell pair, the original V3 to V6
  were archived, and three new versions (V3 flyout panels, V4 typography-only, V5 tinted
  open groups) isolate the side-nav hierarchy treatment on V1's shell.
- Count badges sit inline after the label on EVERY row (they were right-aligned on plain
  rows and inline on expandable ones, which read as two different patterns in one list;
  right-aligning them all was not an option because the right edge belongs to the chevron
  on expandable rows).

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
