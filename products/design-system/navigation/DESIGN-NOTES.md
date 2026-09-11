# Vector navigation shell · design notes

## Changelog · 2026-09-11, third pass (smoothness)

- **Tabs never move.** The left group keeps the open-nav width even when the nav is
  collapsed, so the tab row sits where the open nav will need it to be and nothing slides
  when the nav opens or closes.
- **No pin tab.** Docking a peeked nav is now: click the top-bar toggle while the overlay is
  open. To make that reachable, the overlay's stay-open zone is the nav's horizontal span all
  the way up to the top of the window, plus the toggle itself, so the pointer can travel up
  to the toggle without the overlay closing under it. Opening still needs the pointer beside
  the nav proper (within 16px, inside its vertical extent).
- **The overlay slides out.** It starts fully tucked behind the collapsed column (translated
  left by the extra width and clipped at the column's left edge, so it never shows over V3's
  rail) and eases out to full width over 280ms expo-out; back in over 200ms ease-in.
- **Docking does not re-slide.** Clicking the toggle from a peek adds `nav-snap` for two
  frames, which suspends the nav's width transition, so the real nav appears exactly where
  the copy was instead of animating open a second time.
- **V3's logo starts at the top**, like V1; `Logo: bottom` in the pill (or `?logopos=bottom`)
  still docks it.
- **Search is centred on the bar's centre line whenever the geometry allows.** A small layout
  routine clamps it so it never overlaps the tabs or the right-hand group, shrinking (to a
  220px floor) before it would, and re-runs on resize and on any shell state change. At
  1440px the tabs, which start at the content edge, reach past the bar's centre, so the
  search sits just clear of them; from about 1600px up it is dead centre. This is the honest
  behaviour: the alternative was a search that overlapped the tabs.

## Changelog · 2026-09-11, second pass (consolidation)

- **Down to two versions: V1 and V3.** V2a, V2b, V3b, V4, V5 and V6 are removed from the
  live set as bloat; the comparison that matters now is the switcher (launcher in the bar vs
  a full-height rail). They remain in git history (last present at commit `128f43bf`), so
  any of them can be brought back with `git show`.
- **One open/close control, in the top bar.** The side nav's own collapse control is gone
  from both versions. V3's placement toggle ("Collapse: nav / top") is gone too: the full-width
  bar above the nav is now V3's only layout, the rail alone runs the full height, and V3's
  tabs start at the nav edge like V1's.
- **Search is centred** in the run between the tabs and the right-hand group in both bars.
  It cannot sit at the bar's geometric centre because the tabs, starting at the content edge,
  reach past that point at 1440px; centring in the free run is the honest version.
- **Collapsed nav lights the active section.** When the active page is nested inside an
  accordion, that accordion's top-level icon takes the active state in the icon column, via
  `details.grp:has([aria-current="page"])>summary`.
- **Peek halo is 16px** (was 40px), for both opening and dismissing.
- **Peek overlay rebuilt as a copy.** The overlay is now a clone of the nav appended to
  `<body>`, so the collapsed icon column stays exactly where it is underneath and the panel
  slides over it. Nothing vanishes at the start of the open, nothing needs its footprint
  faked, and pinning simply removes the copy and expands the real nav in place on its own
  width transition. The clone is excluded from every collapsed-state rule with
  `.sidenav:not(.peek-clone)`. Motion is 220ms expo-out in, 160ms ease-in out. Focus
  entering the collapsed nav opens the copy and moves focus to the matching item in it.

## Changelog · 2026-09-11 round

- **Live side-nav peek, every version.** The static interaction frames are now real
  behaviour. With the nav collapsed, the pointer coming within **40px** of it for **100ms**
  opens the nav as an overlay; the overlay stays until the pointer has been outside that
  40px halo for **500ms**, then closes. A **pin tab on the overlay's right edge** docks it,
  which is the only moment content shifts. Motion is a 200ms ease-out slide-and-fade in, a
  150ms ease-in out, the pin tab arriving 80ms after the panel; `prefers-reduced-motion`
  gets instant states. Keyboard parity: focus entering the collapsed nav opens it, focus
  leaving closes it, Escape closes it. The halo tracks the visible pane's nav, so it is
  right in every mode. `?state=peek` opens the overlay on load for review links;
  `?state=collapsed` and `?state=pinned` are retired (they were `?nav=closed` and the
  default). V3/V3b keep `?state=bothclosed`.
- **Mode tabs start at the content edge** in the full-width-bar versions (V1, V4, V5, V6).
  The toggle, switcher and identity are grouped and sized to the side nav, so the tab row's
  left edge lands exactly on the nav's right edge and the active underline lines up with the
  content it switches. Collapsing the nav releases the group and the tabs follow the
  identity, on the same 180ms curve as the nav. Consequence, worth knowing: identity plus
  location did not fit inside the nav's width, so the **location picker moved to the
  top-right** beside the universal actions in those versions (the placement V3b already
  uses). With the wider EHS identity the tabs start about 70px past the edge, since the
  group cannot shrink below its content.
- **Invariant: the tab row never sits inside the side nav's column**, open or closed. V3b's
  "Collapse: top" mode was the one arrangement that broke it (the bar spans above the nav
  there, and the tabs followed the identity to ~294px against a nav edge at 336px). Its
  toggle + identity group is now held to the nav's width in that mode, so the tabs begin
  exactly at the edge and the nav's own border stands in for the separator. Checked by a
  harness across every version, both nav states and both collapse modes: 18 of 18 cases
  put the tab row at or right of the nav's edge.

## Changelog · 2026-09-09 round (logo)

- **The top-bar mark is now the OFFICIAL Vector Solutions logo**, replacing the placeholder
  geometric V. It is not redrawn here: every version loads the repo's shared copy at
  `assets/vector-solutions-logo.svg`, the same asset the Bridge, Check-It and Keystone mocks
  already use, referenced as `<img src="../../../assets/vector-solutions-logo.svg">` at 32px,
  which is the height those mocks use in a top bar. The placeholder `#i-vector` symbol is
  gone from all eight files.
- The mark is no longer boxed in a navy chip: the official artwork carries its own colour
  and clear space, so it sits unboxed beside the product name. The Dashboard entry is not a
  product, so it keeps its tiles glyph in a chip.
- **Still a placeholder:** the `--brand-*` colour tokens. The logo is real, the palette is
  not, and the token comment in each file now says exactly that.

## Changelog · 2026-09-09 round


- **New version: V3b, `v3b-tabs-left.html`.** V3's shell with the top bar's two ends
  swapped, so the pair isolates where each control belongs:
  - **Mode tabs move TOP-LEFT**, immediately after the product identity, so product and mode
    read as one group at the start of the scan rather than at opposite ends of the bar.
  - **The location picker moves TOP-RIGHT**, beside alerts, help and the avatar, treating
    context as a universal control rather than a navigation one. Its menu right-aligns to
    the control. V3 keeps tabs right and location in the side nav.
  - Search keeps the middle. Everything else is V3 verbatim: the full-height rail and side
    nav, the L-shaped inset bar, the licence-split launcher, the interaction frames and the
    collapse-placement toggle.
  - It is numbered **V3b**, not V4, because it varies one axis of V3, which is the same
    relationship V2a and V2b already have. The existing V4 to V6 hierarchy versions keep
    their numbers and their URLs.
  - **Finding worth noting:** with content at both ends AND V3's bar inset past the side nav,
    the bar is genuinely tight. Search has to shrink to about 190px before the avatar would
    be pushed off, which truncates its placeholder. That cost is real and belongs in the
    comparison: tabs-left buys grouping at the price of a cramped bar in this shell.

## Changelog · 2026-09-04 round

Two tenant-branding switches, both driven by what marketing needs to vary per customer:

- **Accent bar under the top nav** (all versions). `Bar` in the review pill turns it on;
  the COLOUR is chosen from the profile menu, under a new "Top nav accent" section with a
  row of swatches. Picking a swatch also turns the bar on, since that is the intent.
  It is one token and one class, `--brand-bar` and `body.tb-bar`, so a tenant's colour is a
  single custom-property write rather than a theme fork. Deep link `?bar` (default colour)
  or `?bar=7048e8` (any hex). In V3 the stripe spans only the inset top bar, which is
  correct for that shell, since the nav owns the left edge.
- **Customer logo at the top OR the bottom of the side nav** (all versions). `Logo: top` /
  `Logo: bottom` in the pill, or `?logopos=top|bottom`. At the bottom it gets its own sticky
  footer zone so the item list keeps scrolling independently above it. V3 already docked its
  logo at the bottom, so that is now expressed through this shared switch and V3 simply
  defaults to `bottom` rather than carrying its own rule.

Both are customization, not design decisions, so neither is a new version: every version
can show either state. Nothing is stored, so a reload is a fresh tenant.

## Changelog · 2026-09-01 round

- **Vector branding on the product identity.** The top-bar app name is now a "Vector
  <Product>" wordmark lockup: one shared mark (`#i-vector`, a PLACEHOLDER geometric V) plus
  the product name, with "Vector" set heavier as the constant half and the name behind a
  hairline. This follows how the suite actually brands, a unified wordmark system rather
  than a separate logo per product, so the mark is identical in every product and only the
  name changes. `--brand-navy` carries it. The identity is the ONLY branded surface: the
  rest of the shell stays neutral so the structure keeps the focus. Official artwork drops
  into that one symbol; official hex into that one token.
- **The collapse control is back to the side-nav panel icon** in every version (the double
  carets are gone, and so is the flip-when-collapsed rule the carets needed).
- **V3's side nav runs full height** alongside the rail: both left columns start at y=0 and
  the top bar is inset past both, spanning only the content area. The collapse control keeps
  the SAME top-right spot every other version uses, which now sits level with the top bar.
  The rail still persists when the nav closes, the logo stays sticky at the nav's bottom,
  and the hover-overlay / pin / close frames still work (the overlay is full height too,
  with the bar inset to its edge so the identity is never covered).
- **V3 swaps where search and location live.** Search is now V1's scoped global search in
  the TOP BAR, same styling and the same All / product scope control, and the LOCATION
  selector moved into the SIDE NAV (V2b's treatment, a full-width bordered control at the
  top). The product-scoped side-nav search that used to be V3's distinguishing feature is
  gone, so V3 is now a layout study: the L-shaped shell with V1's search and V2b's location
  placement. Because the nav is duplicated per mode pane, the location control is driven by
  class rather than by a single id, so every copy stays live and picking a location updates
  all of them.
- **V3: the collapse control's placement is a toggle.** In an L-shaped shell the two
  placements are not interchangeable decorations, they decide the geometry, so the switch
  moves both together:
  - **Collapse: nav** (default) - the control is part of the SIDE PANEL, top-right, and
    the panel runs full height beside the rail with the top bar inset past both columns.
  - **Collapse: top** - the control is a FIXED top-bar item. For it to sit over the nav's
    edge the bar has to span above the nav, so the side panel starts below the bar: the
    conventional shell every other version uses.
  Switch it with the pill button (its label names the current placement) or deep-link
  `?toggle=top` / `?toggle=nav`.
- **V2b's location selector moved into the side nav**, at the top above the Learning/Admin
  switch, so V2b holds both context controls in the nav and leaves the top bar as search
  plus universal actions. They stay distinct: a full-width bordered control over a segmented
  pair. Every other version keeps location in the top bar, so the two placements compare.

## Changelog · 2026-08-28 round

- **Tighter side-nav indentation.** Child groups indent 12px (was 18px) with an 8px
  gutter, and level 3 steps in 10px (was 14px). V5 and V6 carry their own hierarchy
  overrides, so their padding stepped down to match (35→29 / 33→27).
- **Nav rows WRAP instead of truncating.** Rows moved from a fixed height and
  `white-space:nowrap` to `min-height` + normal wrapping, so a long real label runs to a
  second line rather than being clipped. Two labels are deliberately long enough to show
  it: **Qualification and requirement assignments** (LMS Training Plan) and **Similar
  exposure group assessments** (EHS industrial hygiene). Collapsed icon rows are
  unaffected: they set their own square height.
- **Customer logo area matches EHS.** The lockup renders at **54px tall** in an ~80px
  slot, the same logo area the EHS sidebar gives a tenant mark, so customer branding
  reads as branding instead of a favicon.

## Changelog · 2026-08-27 round

- **Renamed the product back to Vector LMS** everywhere it was labeled Convergence
  (labels, switchers, search scopes, comments, these notes). The Convergence-style top-tab
  PATTERN is unchanged; only the name moved. Pattern references (Convergence-style tabs,
  Convergence NAV_TREE / Training Plan / location picker) keep the Convergence name.
- **Distinct Dashboard icon.** The cross-product Dashboard entry now uses a tiles /
  panels glyph (`i-dash`) everywhere (launcher row, Dashboard brand, V3 rail) so it never
  collides with a product Home icon. Still pinned above the switcher divider.
- **Two ways to close the side nav** (all versions): a control in the side nav's own
  top-right corner, plus the top-bar toggle. Either collapses the nav. (Round 4 note: this
  briefly used double carets; it is back to the side-nav panel icon.)
- **Shared side-nav interaction spec** (V3 + V4): collapsed → hover/peek overlay → pin →
  close, represented as labeled frames via `?state=collapsed|peek|pinned` (see below).
- **V2b**: the Learning/Admin switch moved INTO the side nav as a segmented control above
  the section list (V2a keeps the top-bar brand switcher, so the pair now also compares
  switch placement).
- **V3 restructured into an L-shaped shell**: the app rail is dominant and full-height
  (starts at y=0), the top bar is inset to its right, and the nav toggle tops the side-nav
  column instead of floating in the top bar. The rail now PERSISTS when the side nav
  closes, with an explicit minimal state (`?state=bothclosed` = launcher + current
  product). The customer logo docks to the BOTTOM of the nav in a sticky footer zone.
  The review pill is bottom-center in EVERY version now, stacked directly above the Design
  Toolbox comment dock, so the review tooling reads as one column instead of two corners.
- **V3's launcher** drops pinned / All products for **Your platforms** vs **Other Vector
  platforms**, where the second group's rows open each platform's sales page (see the
  section below).
- **V4**: accordions start CLOSED; Jira-like micro-interactions (quick restrained slide,
  clear active state, subtle hover); an open section stays open until click-away or an
  explicit collapse, never closing on mouse-leave.

Static, high-fidelity explorations of a unified navigation shell that could be shared
across multiple Vector Solutions products. Branding is deliberately neutral (grayscale
surfaces, one indigo accent, system font stack) so reviews focus on structure, not styling.
Open `index.html` for the browsable gallery with live thumbnails.

## The product suite

Real Vector products, each with a deliberately different internal structure so
app-switching visibly reconfigures the nav while the shell stays identical:

| Product | Internal shape |
|---|---|
| **Vector LMS** | Deep: modes (Home / Admin / Training Plan / Reporting & Insights), 3-level content tree |
| **Vector EHS Management** | Medium: EHS sidebar sections (Safety management / Training / Analytics), queue-style lists |
| **Vector Scheduling** | Shallow: pinned in switchers, no built pane |
| **Dashboard** | Cross-product overview, pinned above the switcher divider with its own tiles glyph |

The full catalog (Check-It, Evaluations, PD Tracking, Pathways, Guardian Tracking, Acadis,
Frontline Public Safety) sits under "All products"; **ArdentSky Compliance Suite** appears
unlicensed with a "Learn more" row to show the request-access state. **V3 models this
differently** (see below): its launcher drops pinning for a licence split.

## The shared shell contract (identical in all 7 versions)

- Top bar, left to right: **nav open/close** · **app switcher** · product identity, then
  the **mode tabs starting at the content edge** (full-width-bar versions) · scoped search
  · location · notifications · help · avatar.
  No + New action. In V3 the full-height rail sits left of the bar's start.
- One accent token (`--accent`) reserved for active/selection states; everything else grayscale.
- Same design tokens in every file (colors, spacing, radius, type scale) so versions differ
  in structure only. Dark theme (V4) changes token values, not component rules.
- Switching ≠ navigating: other products never appear inside the current product's nav tree.
- Menu items keep this exploration's own visual style, but borrow two things from the
  shipping products (see below): the trailing disclosure chevron and the menu vocabulary.
- Depth is carried by indentation and guide lines, never longer labels. Visible depth caps
  at 3. Children indent 12px with an 8px gutter; level 3 steps in a further 10px.
- Rows wrap to a second line rather than truncating, so a long real label stays readable.
- Landmarks (`banner` / `nav` / `main`), `aria-current`, visible `:focus-visible` rings,
  skip link, and no hover-only destinations (flyouts/tooltips also open on keyboard focus;
  every rail icon is itself a clickable landing-page link).

## What the menus borrow from Convergence + EHS

Per design review, the VISUAL style of menu rows is this exploration's own (rounded inset
rows, soft accent tint for the active item, indented accordion children with a 1px guide
line). Two things are deliberately taken from the shipping products:

1. **Trailing disclosure chevron** (Vector LMS `.sn-row .sn-chevron`, EHS `.sb-chevron`):
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

Shared shell in every version: real Vector products, cross-product Dashboard, location
TREE picker (org-hierarchy icon, level subtitle on the chip and on every node), scoped
search naming its scope, 3-level side nav, customer logo slot, collapse-to-icon-panel
nav toggle, profile-menu side-nav text sizing (compact / default / comfortable), and
review-pill toggles (Logo / Loc / Tabs where tabs exist).

| # | File | Differs from V1 by |
|---|---|---|
| V1 | `v1-launcher-tabs.html` | The reference shell: full-width top bar with the waffle launcher, location picker top-right |
| V3 | `v3-app-rail.html` | The product switcher is a persistent FULL-HEIGHT app rail beside the side nav (Dashboard on top, launcher at the bottom split into your vs other platforms); the location picker sits in the side nav; the customer logo docks to the nav's bottom; `?state=bothclosed` shows the rail's minimal state |

## Archived explorations

The original six-version exploration (placeholder products, two-pane nav, dense dark
flyout build, dedicated tab row, synthesis) moved to `archive/` when the brief was
updated. Their review pills still reference the old set; they are kept for history only.

## Tenant customization (what marketing can vary per customer)

Three things in the shell are customer-branding surfaces rather than design decisions, so
they are switches every version can show, not separate versions:

| Surface | Control | Deep link |
|---|---|---|
| Customer logo, shown or hidden | `Logo` in the review pill | `?logo=off` |
| Customer logo, top or bottom of the side nav | `Logo: top` / `Logo: bottom` in the pill | `?logopos=top\|bottom` |
| Accent bar under the top nav, and its colour | `Bar` in the pill; colour swatches under "Top nav accent" in the profile menu | `?bar`, `?bar=<hex>` |

The accent bar is one token and one class (`--brand-bar`, `body.tb-bar`), so setting a
tenant's colour is a single custom-property write. The colour picker lives in the profile
menu for now because that is the only per-user surface in the mock; in a real build it
would sit in an admin branding screen, not under the end user's avatar.

## Customer logo slot (platform customization)

Orgs can surface their own branding at the top of the side nav, above the menu items: a
customer logo image (here a placeholder "Northline Utilities" lockup) renders **54px tall**
in a bordered ~80px slot, matching the logo area the EHS sidebar gives a tenant mark. (V3 is
the exception: it docks the same slot to the BOTTOM of the nav.) It is customer CONTENT, not shell UI, so it is exempt from the
neutral token palette. Present in every current version (every nav, including the Dashboard pane). Toggle it
with the **Logo** button in the bottom-center review pill or deep-link the hidden state with
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
confirmed. The location selector is the Vector LMS nested tree picker: chevron toggles,
node name + level label (Organization / Region / Site), a check on the selected node, and
selection allowed at any level. The scope control reads "All" or the current
product's name (never the generic "This product"), and the placeholder mirrors it (Search
all products / Search Vector LMS). V3 carries the same top-bar search, and puts its location
selector in the side nav instead. Per review, the top bar carries no
+ New action.

- **Real Vector products.** Vector LMS and Vector EHS Management are fully built and
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
- **3-level side nav**: Vector LMS shows Curricula → Annual Compliance → OSHA 10 · 2024
  (the expandable Annual Compliance row is itself the active destination); Vector EHS
  shows Inspections → Scheduled inspections → Monthly fire extinguisher check. Depth is
  carried by indentation only and capped at 3.

## V3's launcher: your platforms vs other Vector platforms

V1's launcher separates **pinned** products from an **All products** expansion, which is a
personalization split. V3 replaces that with a **licence** split, so the panel answers a
commercial question instead of a preference one:

- **Your platforms** lists what this org actually licenses (Vector LMS, Vector EHS
  Management, Vector Scheduling, Vector Check-It, Vector Evaluations). Rows open the app,
  and the current one carries the "Current" tag.
- **Other Vector platforms** lists what the org could add (PD Tracking, Pathways, Guardian
  Tracking, Acadis, Frontline Public Safety, ArdentSky Compliance Suite). These rows do NOT
  open an app: each opens that platform's product/sales page, so the end slot reads
  "Learn more" and the section header says so outright. They stay quieter than licensed
  rows (muted chip and name) but hover in the accent, reading as an offer rather than a
  broken or locked app.
- No pinning and no All-products expansion: the two sections ARE the boundary, so nothing
  is hidden behind a disclosure. The cross-product Dashboard still sits above the divider.
- The panel search filters both sections and hides a section header once nothing under it
  matches.

This is a V3-only content model right now; the other versions keep the pinned + All-products
launcher so the two approaches can be compared directly.

## Product identity: the Vector wordmark lockup

Vector brands its suite as "Vector <Product>" lockups over ONE shared mark, not as a
separate logo per product, so the top-bar identity does the same: the mark is constant in
every product and only the name changes. "Vector" is set heavier than the product name,
with the name behind a hairline, so the shared half reads as the mark and the variable half
reads as the label. The Dashboard is not a product, so it keeps its tiles glyph.

**The mark is the official artwork; the colour is still a placeholder.** The mark loads from
the repo's shared `assets/vector-solutions-logo.svg`, so it is never redrawn or recoloured
here, and `--brand-navy` remains stand-in hex to be swapped for an official value. The identity is deliberately the only branded surface: surfaces, content and
active states stay neutral so the structure, not the palette, is what gets reviewed.

## Side-nav peek (live, every version)

A collapsed side nav is never a dead end: hovering near it opens a copy of it as an overlay,
and clicking the top-bar toggle while it is open docks it. This is engineered behaviour in both files, not a frame.

| Moment | Rule |
|---|---|
| Open | Pointer within **16px** of the collapsed nav (horizontally; within its vertical extent) for **100ms**. A COPY of the nav opens as a fixed overlay at full width; the collapsed column stays where it is underneath, so nothing vanishes or moves. |
| Stay | While the pointer is inside the overlay plus a 16px halo, or anywhere in the nav's horizontal span above it (the top bar, including the toggle), it stays. |
| Close | Pointer outside that halo for **500ms**, pointer leaving the window, or Escape. 150ms ease-in slide-and-fade out, then the nav returns to its collapsed column. |
| Dock | Click the top-bar toggle while the overlay is open. The copy is removed and the real nav snaps open in its place with no width transition, so it does not look like it slides out a second time. This is the only moment content shifts. |
| Keyboard | Focus entering the collapsed nav opens the copy and moves focus to the matching item in it; focus leaving the copy (and the toggle) closes it. |
| Motion | The copy slides out from behind the collapsed column: 280ms `cubic-bezier(.16,1,.3,1)` out, 200ms ease-in back, clipped at the column's left edge so it never shows over the rail. `prefers-reduced-motion` gets instant states. |
| Deep link | `?state=peek` opens the overlay on load. |

The overlay opens below the top bar in both versions (the bar is full width in both), at the
collapsed column's own left edge: x=0 in V1, x=56 in V3 beside the rail.

## Version switcher (review tooling, not part of the design)

Every version file carries a small dark pill at the **bottom center**, stacked just above the
Design Toolbox comment dock: `All` (back to the gallery) followed by V1 and V3, with the
current version highlighted and each button titled with its pattern. Its toggles are **Logo**
(customer logo on/off), **Loc** (location picker), **Bar** (the tenant accent bar), **Logo:
top / bottom** (where the customer logo sits) and **Tabs** where tabs exist. It exists so reviewers can flip between explorations in place instead of returning
to the gallery each time. The pill also carries review toggles: **Logo** (customer logo slot), **Loc** (location
picker) and **Tabs** (mode tabs), plus `?logo=off` / `?loc=off` / `?tabs=off` deep links. It is a single self-contained block at the end of each file
(one `<style>` plus one `<nav class="vswitch">`) marked `REVIEW TOOLING - NOT PART OF THE
PRODUCT DESIGN`; delete that block to remove it.

## Demo states (URL params)

Files are static mocks with just enough vanilla JS to demonstrate the defining interaction.
No storage, no frameworks, no build step; every file opens directly from disk.

| File | Params |
|---|---|
| V1 | `?app=comply\|dashboard` · `?mode=` · `?launcher` · `?search` · `?location` · `?profile` · `?density=compact\|comfortable` · `?nav=closed` (collapses to the icon panel) · `?state=peek` (opens the hover overlay) · `?logo=off` · `?loc=off` · `?tabs=off` |
| V3 | Same as V1 (location opens in the nav), plus `?state=peek\|bothclosed` (peek overlay open on load; the rail's minimal state); the rail persists under `?nav=closed` |

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
- Rows briefly adopted Vector LMS/EHS visual styling (full-bleed rows, left accent bar,
  tinted accordion band); review preferred the original open-accordion look, so the visuals
  reverted while keeping the trailing chevron and adopting the products' menu vocabulary.
- The exploration was consolidated: V1/V2 are the live shell pair, the original V3 to V6
  were archived, and three new versions (V3 flyout panels, V4 typography-only, V5 tinted
  open groups) isolate the side-nav hierarchy treatment on V1's shell.
- Count badges sit inline after the label on EVERY row (they were right-aligned on plain
  rows and inline on expandable ones, which read as two different patterns in one list;
  right-aligning them all was not an option because the right edge belongs to the chevron
  on expandable rows).

## Recommendation (from the original six-version round; version numbers refer to `archive/`)

Advance **V6**, pressure-tested against **V5**:

- The app rail is the only switcher that keeps the whole suite permanently visible while
  physically separating switching from navigating.
- Tabs as an opt-in, per-product layer let deep products (the Vector LMS pattern) and
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
navigation/
  index.html               gallery (live iframe thumbnails, rationale, links)
  v1-launcher-tabs.html    V1 · reference shell: waffle launcher in a full-width top bar
  v3-app-rail.html         V3 · full-height app rail beside the nav, location in the nav
  archive/                 the original six-version exploration
  DESIGN-NOTES.md          this file
```
