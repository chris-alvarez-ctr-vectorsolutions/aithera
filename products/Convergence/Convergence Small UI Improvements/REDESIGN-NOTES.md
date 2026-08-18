# Convergence Small UI Improvements: redesign notes

The deliverable for the brief in [BRIEF.md](BRIEF.md). Before-state screenshots are in
[before-screenshots/](before-screenshots/); the target state is the prototype in
[ver1/index.html](ver1/index.html).

## Scope note (read first)

The brief is written for the **Convergence application repo**: locate the real components,
work in CSS/SCSS on a feature branch, report the file paths you touched. This repo is
`ux-mockups`, so there are no Convergence components here to edit. What is delivered instead
is the **target state as a single navigable prototype** covering all seven areas, plus the token
set and state styles a developer applies in the app. Every constraint in the brief that
survives the translation was honoured:

- No new features, no changed data, no changed behaviour of any control.
- Existing structure preserved. The one structural change the brief allows (moving the
  location picker into the top nav) is the only one made.
- The narrow / mobile nav state is preserved.
- One shared token set rather than scattered literals.
- Anything that needs new functionality is flagged **OUT OF SCOPE** below.

Because Areas 1 and 2 *are* the chrome, this prototype renders its own redesigned topnav and
side nav rather than including `products/Convergence/_shell/chrome.js` (which reproduces the
current, un-redesigned chrome). Every other Convergence prototype should keep using the shell.

## Files

Every area has its own file so it can be opened and shared on its own, and there is one
all-in-one file for reviewing the whole thing:

| File | What it holds |
|---|---|
| [ver1/index.html](ver1/index.html) | All six areas in one navigable file. Tabs and side-nav clicks swap views in place. This is the file the flow map drives. |
| [ver1/home.html](ver1/home.html) | Area 7: the Home dashboard |
| [ver1/dashboard.html](ver1/dashboard.html) | Areas 1 + 2: the redesigned side nav, the top-nav location picker, and the shared token reference |
| [ver1/training-plan.html](ver1/training-plan.html) | Areas 3 + 4: accordion list and both card densities. The funnel at the top left opens the filter panel. Deep-link a density with `?view=list`, `?view=dense`, `?view=large` |
| [ver1/catalog.html](ver1/catalog.html) | Area 5: catalog table |
| [ver1/content-wizard.html](ver1/content-wizard.html) | Area 6: all four wizard steps |

On the standalone pages, a top-nav or side-nav click is a real navigation to the sibling file,
so every page stays independently openable and shareable. They load the comment widget but not
the flow map, which belongs on the all-in-one file.

**Nothing is duplicated between them.** The shared design lives in `ver1/shared/`:

| File | What it holds |
|---|---|
| `shared/styles.css` | Every token and rule for all seven areas |
| `shared/chrome.js` | The app-shell markup (top nav, side nav, page header, location panel, view containers) |
| `shared/data.js` | The nav tree, location tree, training plan, catalog and wizard content |
| `shared/views.js` | The render functions for Areas 3 to 6 |
| `shared/app.js` | State, Areas 1 + 2 wiring, routing, boot |
| `shared/head.html` | Reference copy of the page `<head>`, for starting a new page |

A page file is only a `window.PAGE = { route, standalone }` declaration plus those includes, so a
design change is made once in `shared/` and every page picks it up. Change the chrome in
`shared/chrome.js` and `shared/styles.css`, not in the page files.

## How to review it

Open [ver1/index.html](ver1/index.html) and move between areas the way a user would: the
Administration tab lands on a review guide with the shared tokens laid out, Training shows
Areas 3 and 4 (the view toggle switches list / compact cards / large cards, the funnel button
opens the filter panel), Catalog shows Area 5, and Administration → Training Import And
Creation → Content Wizard shows Area 6. The bottom-centre 🗺 **Flow Map** button opens all
twelve screens side by side with live thumbnails and the per-screen dev notes from
[ver1/DEV-NOTES.md](ver1/DEV-NOTES.md).

> The bottom-centre toolbox dock and its flow-map button are review tooling, **not part of the
> product**. Developers must not ship the `designtoolbox/toolbox.js` include.

---

## Shared tokens (defined once, inherited by all seven areas)

All of these live in the `:root` block at the top of `shared/styles.css`, section 1.

| Group | Tokens |
|---|---|
| Action colour | `--c-primary` `#0271ce`, `--c-primary-hover`, `--c-primary-press`, `--c-primary-soft` (selected fill), `--c-primary-faint` (hover fill), `--c-primary-line` |
| Neutrals | 4 text levels (`--c-ink` `--c-body` `--c-meta` `--c-faint`), 2 line levels (`--c-line` `--c-line-soft`), 4 surfaces (`--c-surface` `--c-surface-alt` `--c-surface-alt2` `--c-canvas`) |
| Status semantics | Round 2 mapping: `info` blue = in progress, new · `warn` amber = needs scheduling, retiring · `idle` gray = incomplete · `err` red = overdue · `ok` green = complete, assigned. Each set carries `-bg` `-line` `-ink` `-dot` so pills, dots and badges never drift apart |
| Type scale | Round 2, with a 16px body floor: `--t-page` 22 / `--t-section` 18 / `--t-row` and `--t-body` 16 / `--t-meta` 14 / `--t-micro` 12 (badge text, captions, table meta only) |
| Spacing | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 |
| Radius | 4 · 6 · 8 · 12 · pill |
| Elevation | `--e-xs` (the design-system XS shadow, the only elevation on cards), `--e-1` row, `--e-2` hover, `--e-3` overlay |
| Focus | one `--focus-ring`, used by every interactive element |

**Shared primitives built from those tokens:** `.pill` (status), `.meter` (progress),
`.notice` (inline notice), `.tglyph` (content-type glyph), `.glyph-yes` / `.glyph-no`
(yes/no status), `.thumb` (thumbnail), `.panel` (card surface), `.segmented` (view toggle),
`.icon-btn` (compact icon action), `.empty` (empty state), and the `.card-head` / `.card-body` /
`.card-foot` card chrome.

**Buttons and inputs are the real Vector components**, not hand-rolled CSS:
`vaadin-button` with `theme="primary" | "secondary" | "tertiary"` (primary for the single most
important action, secondary for alternates, tertiary for repeated row actions), and
`theme="outlined"` on every input (`vaadin-text-field`, `vaadin-text-area`,
`vaadin-number-field`, `vaadin-combo-box`). Adopting the components *is* the button and input
modernisation the brief asks for. Two Vector components are also used structurally:
`vwc-tree-list` for the location nest view and `vwc-stepper` for the wizard steps.

---

## Area 1: Side navigation

*Before: [01-side-navigation.png](before-screenshots/01-side-navigation.png)*

| Before | After |
|---|---|
| Every row separated by a heavy full-width divider | No row dividers. Separation comes from 40px rows, 2px gaps, 6px radius and hover fill |
| ~54px rows with inconsistent vertical padding | One 40px row height for parents, 34px for children |
| Two unrelated active treatments (bright blue Dashboard vs dark navy expanded parent) | **One selection language at every depth**: 3px blue left rail + `--c-primary-soft` fill + blue label. Expansion is communicated only by the caret and the child group; a parent holding the selected child gets a quieter "trail" state (darker label, blue icon, no fill) so it is never confused with the selection itself |
| Heavy, inconsistently sized icons | One 15px Font Awesome icon in a fixed 20px column, aligned to the label baseline |
| Carets pinned far right, disconnected from labels | Round 3 (designer direction): carets are right-aligned in the row, and labels wrap to two lines instead of truncating |
| Levels told apart only by dividers | Section headers (11.5/600, `--c-faint`), parent rows, and children indented 22px behind a 1px guide line |
| Dark gray search band | Bordered `--c-surface-alt` input with the shared focus ring |
| Collapse button jumped from the right edge of the nav to the centre of the icon rail | The button is the first thing in the nav header, so it holds **exactly the same x and y in both states** (left 12px, centred on 29px). The collapsed rail is 58px so the button also lines up with the row icons below it |

**States added:** hover, selected, trail, inert (placeholder children), focus-visible, and the
collapsed 58px icon-only state (labels, carets and children hidden, `title` tooltips kept). The
collapse is animated on `width` with `flex-basis: auto`, so one property drives the size, and
`overflow: hidden` keeps the labels from spilling past the rail while it animates.

**Proposal, not a like-for-like restyle:** the four section headers (Overview, Manage,
Insights, Configuration) group the existing items; the current nav has no section level. Drop
them if the IA is not up for discussion: everything else in this area works without them.

## Area 2: Location picker in the top nav

*Before: [02-top-nav-location-picker.png](before-screenshots/02-top-nav-location-picker.png)*

The one structural change the brief allows. The bordered **Location** pin button leaves the
dark breadcrumb bar and becomes a top-nav dropdown that opens the nest / tree view, reusing the
`vwc-tree-list` pattern already prototyped in
[products/Convergence/location-nav](../location-nav/index.html).

- **Trigger** sits among the top-nav controls, 40px tall and vertically centred: pin icon,
  location name (13/600) over its ancestor path (11.5/400), caret. States: default, hover,
  open (blue border + soft fill + caret rotated). An **Away** chip appears when the working
  location is not the user's home location.
- **Panel**: 380px, 12px radius, `--e-3`, a `vaadin-text-field theme="outlined"` search, the
  tree in a scrolling body (`max-height: min(520px, 80vh)`), and a footer showing what you are
  viewing plus **Return to home**. It opens with the organization and its regions already
  expanded so the nest reads without a click; a search opens every matching branch.
- **The two stacked bars are reconciled.** The dark breadcrumb bar becomes a light page header
  on `--c-surface`: breadcrumb (12.5, blue links) above the page title (20/600), with the page
  actions right-aligned in the same bar. Changing location updates the breadcrumb.
- **Tabs** keep the blue label + underline active treatment, now on even 20px padding with a
  hover fill, and the Beta badge uses the shared pill.

*Note: `vwc-tree-list` only recomputes its visible rows from its own expand control, so the
prototype opens branches by driving that control rather than by assigning `expandedItems`
(which leaves the rendered rows collapsed). Worth knowing before wiring this in the app.*

## Area 3: Training plan accordion

*Before: [03-training-plan-accordion.png](before-screenshots/03-training-plan-accordion.png),
[04-training-plan-accordion-filter-panel.png](before-screenshots/04-training-plan-accordion-filter-panel.png)*

| Before | After |
|---|---|
| Nesting levels hard to tell apart | Four explicit depth levels, each with its own indent (16 / 32 / 40 / 56px), background band (`--c-surface-alt2` → `--c-surface-alt` → `#fbfcfe` → `--c-surface`) and label weight (14/700 → 13.5/600 → 13/600 → 13.5/500) |
| Empty completion capsule with a tiny caption beneath it | `.meter`: a 76px bar plus a single-line label, `**0 of 5** qualifications`, vertically centred in its row |
| Small, low-contrast status pills | One `.pill` size (24px, pill radius, dot + label) with fixed semantics: in progress = amber, incomplete = gray, overdue = red, complete = green |
| Loose column alignment | **One grid declared once and reused by the header and every depth**, so group, qualification, requirement and activity rows line their Completion / Duration / Time spent / Due / Actions values up under the same headings. Text left-aligned, numerics tabular, actions right |
| Heavy repeated full-width borders | Structural `--c-line` only under the header and the group; everything else is a `--c-line-soft` hairline. Activity rows are 52px with a hover fill |
| Raw orange callout block | `.notice`: amber bg + border, 6px radius, icon aligned, 12.5/600. It stays inline beside the requirement label while it fits and wraps onto its own line instead of truncating |
| Left filter panel misaligned with the rest of the system | Same selection language as the side nav (rail + soft fill), icons in a fixed 18px column, `vaadin-combo-box theme="outlined"` filters, the shared `.segmented` view control, and a full-width secondary **Set as default** |
| The funnel that opens the filter panel sat in the top-right page actions, across the page from the panel it controls | The funnel moved **into the panel**, top-left. The panel is always a column in the layout: closed it is a 58px rail holding just the funnel, open it is the full 244px panel with the funnel in exactly the same spot. Control and controlled surface are now one column, and the button never moves |

The filter panel uses the same open and closed pattern as the side nav, including the button holding
its position between states, so the two collapsible columns behave identically.

Launch stays in its existing left-hand position (moving it would be a DOM change the brief
rules out) but is now a compact primary button at a fixed size on every row. The row-level
details action is a tertiary icon button in the Actions column.

## Area 3 additions: banner, row actions and the detail pages

*Before: the legacy My Training banner and the Activity / Requirement / Qualification Details
screenshots supplied by the designer.*

| Before | After |
|---|---|
| Full-width bright blue bar, "Click here to view classes you need to select a session for.", the whole bar being the link | The shared inline notice on the info tokens above the plan: icon, "**2 classes** need a session selected before they can be scheduled.", and a real **View classes** action |
| Details opened from a chat-bubble icon that read as commenting | A **circle-info** icon button titled "View details: <name>"; rows with attachments show a second **paperclip** button beside it |
| Three near-identical Details pages: gray placeholder image, bare duration line, "No Description Provided", a flat activity list you could not click | **One drill-in surface** with the level stated by a kind chip. The hero says what the item contains (counts, summed total duration, progress); contents are rows that open their own details; parents are working links, so you can move qualification → requirement → activity and back |
| Launch only on the details page itself | Launch stays on every activity row at every level, so drilling down never costs the primary action |
| "No records to display" as a full-width alarm-red row | Past completions is a table when populated and the shared neutral empty state when not |
| Attachments only as a paperclip in the list | An Attachments section on the activity page: file icon, name, size, Download |

Going back up is always one click: a **Back to <parent>** control above every panel (structural,
so a requirement returns to its qualification and an activity to its requirement regardless of how
the page was reached), plus the full hierarchy in the page-header breadcrumb with every ancestor
clickable, plus the "Part of" links in the hero.

The pages live inside the training route (Close and the "My training" crumb return to the list)
and deep-link with `?details=qual:q-nhs`, `?details=req:r-loto` or `?details=act:a4` on
[ver1/training-plan.html](ver1/training-plan.html).

**Confirm before build:** the legacy completions table has Expire Date and Ignore Date columns,
dropped here as empty in every screenshot; and the banner count needs the real query behind it.

## Area 4: Training plan card view

*Before: [05a](before-screenshots/05a-training-plan-card-view-small.png) (compact),
[05b](before-screenshots/05b-training-plan-card-view-large.png) (large)*

**One card component; the only thing that changes between densities is the grid track size**
(`--card-min` / `--card-max`: 168–208px compact, 248–300px large). Thumbnail ratio, badge
placement, radius, shadow, title treatment and controls are identical.

- Responsive grid with consistent 16px gutters. Tracks are **capped**, so a partial row keeps
  the card size instead of stretching three cards across the page: that plus moving the group
  progress meter into the Completion column removes the "cards clustered left, capsule floating
  right" gap.
- Fixed 16:9 thumbnail. Status badge top-left (the shared pill on a translucent white plate),
  duration badge bottom-right. The due date moves to a meta line under the title, red when
  overdue, so it never collides with the duration.
- Title: 13.5/600, clamped to two lines, with the content-type glyph aligned to the first line.
  Footer: tertiary details icon button left, primary Launch right: the same pills and buttons
  as the list view.
- Card states: default, hover (`--e-2` + blue border + 2px lift).

**Thumbnails are CSS placeholders tinted per content type.** Real course art comes from the
LMS; only the frame, ratio and overlay positions are being specified here.

## Area 5: Catalog table

*Before: [06-catalog-table.png](before-screenshots/06-catalog-table.png)*

| Before | After |
|---|---|
| Thumbnail column bleeding to the viewport edge | 24px left gutter on the first cell (and 24px right on the last); 60×38 thumbnail with a 4px radius and a hairline border, centred in the row |
| Uneven row heights | One 56px row rhythm, `--c-line-soft` hairlines, hover fill, sticky header |
| Weak header row | Sticky, `--c-surface-alt`, 12.5/600 `--c-idle-ink` |
| Ad hoc green check / red X | `.glyph-yes` / `.glyph-no`: 20px circles on the shared ok / error tokens with `title` tooltips, centred in the Mobile column |
| Mismatched New pill and View Details buttons | Shared `.pill-new` and `vaadin-button theme="tertiary"` |
| Loose column widths and alignment | Name gets priority (36%) and carries the activity code as a second line; icons centred, text left, actions right; meta columns never wrap so rows stay level |

Author and Status carry values in the prototype (the before-state screenshot has both columns
empty, which cannot demonstrate alignment). **Confirm the real values** before building.

## Area 6: Content wizard

*Before: [07a](before-screenshots/07a-content-wizard-step1-add-content.png),
[07b](before-screenshots/07b-content-wizard-step2-content-type.png),
[07c](before-screenshots/07c-content-wizard-step3-save-location.png),
[07d](before-screenshots/07d-content-wizard-step4-activity-properties.png)*

One restyle applied identically to all four steps.

- **The skeuomorphic monitor / TV frame is gone**, replaced by one centred `.panel` (max-width
  780px, 12px radius, `--e-1`) with the same three regions on every step: stepper, body,
  footer. The large dead space below is gone because the panel is constrained and centred.
- **Selectable tiles** (steps 1 and 2) are one component on an equal-width grid: 46px icon in a
  soft-blue rounded square, 13.5/600 label, 11.5 description. States: default, hover (blue
  border + faint fill + 2px lift + `--e-1`), focus-visible (focus ring), **selected** (blue
  2px border, soft fill, filled icon, check badge top-right). The step-2 selected state from the
  before-state screenshot is standardised and carried to step 1's Import / Create / Copy tiles.
- **Heading and helper hierarchy** is unified: 22/600 title, 13.5 `--c-meta` helper line that
  updates from the current selection ("Create a Quiz. Multiple choice, true or false,
  information slides.").
- **Step 3** stops being a bare link. It is a centred empty state that says what a repository
  does, with a secondary **Select a repository** button; once picked it collapses to a
  confirmed selection row and Next enables.
- **Step 4** uses Vector form components: one label weight (13.5/600), consistent input sizing,
  a red `*` required marker, 20px field rhythm, and hint text under the fields that need it.
- **Footer controls** are standardised across steps: Back (secondary) left, Next / Start
  (primary) right, with a genuinely distinct disabled state and a hint line on step 1. Next
  stays disabled until the step's required input is satisfied.

**Change to flag:** the three step-progress dots are replaced by `vwc-stepper` with labelled
steps and completion checkmarks. That is new markup rather than a restyle. If the pass must
stay CSS-only, keep the dots and give them the shared active / complete / idle tokens; the
labelled stepper is the recommendation.

---

## Area 7: Home dashboard

*Before: the legacy Home page screenshot supplied by the designer (not in `before-screenshots/`,
which holds only the seven shots from the original handoff).*

Added after the original brief, from the legacy Home page screenshot. Same styling-pass rules:
the four cards, their order and what each one shows are unchanged.

| Before | After |
|---|---|
| Cards with gray header bars, square corners and heavy 1px borders | The shared `.panel` surface: white, 12px radius, hairline border, `--e-1`, with a real card header (14/600 sentence case, blue icon) and a card footer |
| Three donuts in a serif face, each a different arbitrary colour (pale green, pale blue, saturated orange) | One ring geometry and **one arc colour** for all three. Colour carried no meaning in the legacy cards and made them look unrelated; state is carried by the label and the counts instead |
| `100% No Items Found` on a full alarm-orange ring for an empty list | A dashed neutral track with **None assigned** in it. An empty list can no longer read as a completed one, and orange stays reserved for in progress |
| `0% Complete` with no sense of what is left | The percentage in the ring, plus `11 of 18 done, 7 to go` under it. Tabular numerals so the three columns line up |
| Unstyled gray `View Incomplete Items` button on two of the three rings, none on the third | A tertiary action under every ring, on one baseline (the empty ring offers **Browse the catalog** instead) |
| Green `Launch` button, matching nothing else in the product | The shared `vaadin-button theme="primary"`, identical to Launch in the training list and on the cards. Green is reserved for success and completion |
| Upcoming training as a bare mini table | The same header and row treatment as the catalog table: sticky-style `--c-surface-alt` header at 12.5/600, 52px rows, hairlines, hover fill, content-type glyph |
| Empty class list shown as a large dark red block with a warning triangle | The shared neutral empty state: a muted icon, `No upcoming classes`, one line of explanation and a **Find a class** action. Red is reserved for overdue and errors in every other area |
| `View All` floating over the news text, overlapping it | A real card footer on `--c-surface-alt`, outside the content, so it can never overlap |
| News titles hard-truncated mid-word, dates as gray pills, feed boilerplate excerpts (`The post ... appeared first on ...`) | Date as a meta line with a calendar icon, title at 13.5/600 in full, excerpt clamped to two lines, hairline rows with a hover fill and a blue title on hover |
| Two-column layout leaving a large empty area bottom right, and a tall half-empty Upcoming Training card | A 12-column grid with consistent 24px gutters: progress 8 + upcoming 4, classes 4 + news 8. Cards size to their content (`align-items: start`) |
| A second gray bar holding nothing but a Help button | Gone. Help sits in the page header with the other page actions, as on every other page |
| The side nav was reachable only from the hamburger in the dark bar | The side nav is present on Home, **collapsed to the 58px icon rail** by default, so the menu is visible without taking a 250px column. The menu button expands it in place and holds the same position, as everywhere else. Its Dashboard row is this page |

Training and Catalog still have no side nav, matching the legacy pages: only Home and the
Administration pages carry it. Each route sets how wide the nav starts (Home: rail, admin pages:
open) and a manual toggle sticks until the next navigation.

**States added:** row hover on the upcoming list and the news feed, hover on news titles, and the
ring fill animates from zero on load.

**Counts are illustrative.** The legacy screenshot is a fresh account showing 0% on two rings and
an empty third, which cannot demonstrate the ring treatment. Optional training keeps its real
empty state so the corrected treatment is visible next to two populated rings; All training is
modelled as mandatory plus individually assigned activities, which is how the training plan data
in this prototype is structured. **Confirm the real figures and the news excerpts before building.**

## Round 2 refinements

The follow-up brief is [BRIEF-ROUND2.md](BRIEF-ROUND2.md); the carousel reference is
[08-catalog-card-carousel-reference.png](before-screenshots/08-catalog-card-carousel-reference.png).
All eight items are applied on top of the round-1 work, in the same `ver1/shared/` files.

1. **Needs Scheduling badge.** The flashing yellow corner is replaced by a labelled amber
   `.pill-attn` badge on class rows (list), class cards, and the detail hero. The top banner
   expresses the same meaning: warn-amber surface carrying the same badge, with a real View
   classes action. Class actions read Details / Select a session, since an unscheduled class
   cannot be launched.
2. **Badge audit.** In progress is now the design-system blue (info tokens). Full mapping:
   info blue = in progress + new, warn amber = needs scheduling + retiring, idle gray =
   incomplete, err red = overdue, ok green = complete + assigned (solid, per the reference).
   The elective E corner tag keeps its top-right placement on the ink neutral: the legacy
   maroon is off-system. Identical in list, cards, catalog and detail pages.
3. **Card icons centred.** Thumbnails use grid `place-items: center` with `line-height: 1`
   and one normalised icon size per thumbnail size, so every card icon lands identically.
4. **XS shadow, no outline.** Cards drop their border; `--e-xs` is the only elevation, on
   both densities and the catalog cards, radius unchanged.
5. **`[BEYOND CSS]` Due-date spread.** Demo data only: dues added across upcoming, due soon
   and overdue on LOTO, PPE and class activities, so the Due column and card chips are
   populated in every state.
6. **`[BEYOND CSS]` Catalog category carousels.** An additive card view (default) beside the
   intact table: stacked category rows, horizontally scrolling strips of cards with the E tag
   and Assigned badge, roving-focus keyboard support (left/right arrows, Home/End, visible
   focus ring, list/listitem roles and labels), and View all opening the existing table
   filtered to that category with the category name and count as the page title. The
   segmented control in the page header switches views; `?view=cards|table` deep-links.
7. **Typography floor.** Body 16px minimum, small labels 12px minimum, via the shared type
   tokens (see the table above), so it holds across the side nav, both Training Plan views,
   both Catalog views, the wizard and the top nav. Hierarchy: 22/600 page title, 18/600
   section, 16/500-600 item label, 14 secondary, 12 badges and captions.
8. **Spacing audit.** Side-nav rows to 44px (children 38px) with the indent moved onto the
   scale (24px) and the wider 268px column; the filter panel to 256px with 40px rows; the
   page header to 72px; the plan grid, details grid and card tracks re-sized for the larger
   type. All from the existing 4px scale, no new one-off values.

### Round 3 designer iterations

- Home: the progress and upcoming-training cards share one height (both stretch to the grid
  row, footers pinned), and the ring caption is two lines with the remainder bolded:
  "11 of 18 done" over "**7 to go**".
- Content Wizard: the stepper is now the Assign Training Wizard's construction (numbered
  circles, connector lines, labels beneath; blue active, green complete) on the shared tokens.
- Catalog carousels: no hand scrolling: flanking circular arrow buttons page each row
  (disabled at the ends), keyboard arrows still walk cards, and titles show two full lines.
- Training cards: thumbnail icons centred with grid `place-content` (exact on both axes).
- Side nav: labels wrap to two lines instead of truncating, and the expand carets are
  right-aligned in the row.

**Fixed along the way:** default-collapsed accordion groups (Individually Assigned
Activities, Driving Safety) could never be expanded; the toggle set now records user
toggles instead of forcing closed.

## Round 4: accessibility audit, banners, card consistency, catalog containers

**Accessibility audit (WCAG AA).** Measured programmatically in the browser:

- Contrast: every badge, banner, header, meta and link pairing now measures at or above
  4.5:1 (badges 5.4 to 7.0, banners 5.2+, meta text 4.97, primary links 4.93). Four spots
  failed and were fixed by moving `--c-faint` label text to `--c-meta`: side-nav section
  headers, filter-panel group titles, the empty-ring "None" figure, and attachment file
  sizes. `--c-faint` remains only on placeholders, disabled states and decorative glyphs.
- Keyboard focus: the shared focus ring covers every control; the carousel strips and cards
  keep their explicit ring; drill-in detail rows gained a visible inset ring on
  focus-visible (hover fill alone was invisible to keyboard users).
- Names, roles, labels: icon-only top-nav buttons (language, account, sign out), the nav
  collapse button and banner dismiss buttons all carry aria-labels; the active top-nav tab
  announces `aria-current="page"`; carousel strips are labelled lists whose label explains
  the arrow keys; the wizard's Vaadin fields carry `accessible-name` (their external
  visual labels cannot reach the shadow-DOM input, so the name must be set on the field:
  the label-input association is otherwise broken for screen readers). A whole-page sweep
  finds zero unnamed interactive elements.
- Focus order: DOM order is visual order everywhere; per category the order is View all,
  previous, next, then the strip and its cards.
- Flagged for logic (not CSS): banner dismissal is per session only (persistence is
  server-side); the banner counts and Show overdue / View classes actions need wiring;
  moving keyboard focus after dismissal is handled in the prototype (focus goes to the
  next banner's dismiss control) and should be kept in the real build.

**Training Plan banners: up to three, stacked, dismissible.** One banner construction
(icon, text, optional action button, dismiss X), severity from the status tokens: warn =
needs scheduling, err = overdue, info = completion-rule reminder. Stack gap and padding on
the spacing scale (12 inside the stack, 16 below); every banner uses the same 34px
icon-button dismiss with an aria-label. Demo shows all three at once.

**Info icon leftmost.** The circle-info action is the first icon in every action row:
training list rows, both training card sizes, and catalog cards (which now carry the same
action row). The paperclip follows it when attachments exist.

**Responsive card grid, worked example.** A 12-activity requirement (RV - HSEML - Site
Hazards) demonstrates the reflow. Measured columns, from the auto-fill grid on the
180/224px (small) and 256/312px (large) tracks with 16px gutters:

| Viewport | Large cards | Small cards |
|---|---|---|
| 1600px | 4 per row | 5 per row |
| 1180px | 3 per row | 4 per row |
| 820px | 2 per row | 2 per row |

Auto-fill tracks between a min and max mean the count falls out of the available width at
every size, gutters stay 16px, and partial rows keep card size instead of stretching.

**Catalog card view adjustments.** Each category now sits in its own grouped module, per
the Top picks container reference supplied in review: white surface, hairline border, 12px
radius, `--e-1`, 20px padding, with the circular prev/next arrows top-right in the header
beside View all. Catalog cards ARE the small Training Plan card component now: same
structure, sizing, 16:9 thumbnail, badges and XS shadow, plus the E tag and the solid green
Assigned badge, with the info action leftmost in the card foot. No separate catalog card
style remains.

## Round 5: Fin (Vectoria) launcher

The Fin integration is included on every page via the shared rollout include,
`products/Convergence/ai-chat-widget/fin-widget.js` (launcher, unread badge, and the full
Vectoria chat window), loaded by `shared/chrome.js`. Only its presentation is overridden for
this prototype, per designer spec; the shared widget file is untouched, so other consumers
keep the corner FAB:

- Docked flush to the right screen edge: 30 x 30px with a 15px corner radius on the left
  corners (the right side is flush), unread badge top-left.
- Draggable up and down the edge: pointer drag, or Arrow Up/Down when focused. A drag never
  toggles the chat, and the position persists locally (server persistence is a logic item).
- The chat window opens beside the launcher, vertically near its current position, clamped to
  the viewport.
- The rollout's gutter contract is honoured: `--fin-gutter` (40px) pads the right of the main
  scroll areas so content never sits under the launcher.

Verified headlessly: 30x30 at radius 15/0/0/15 with a 0px edge gap, badge at top-left, a
120px drag that does not open the chat and persists, a plain click opening the window beside
the launcher, and the 40px gutter applied.

## Round 6: on-screen CSS spec strips

Every screen now ends with a collapsed **CSS spec for this screen** line: a native
`<details>` that is a single muted 12px line when closed (29px tall) and expands to a
key/value sheet of that screen's important CSS values, keys in gray, values in monospace,
with a pointer to the token block. One per view (guide, home, training, details, catalog,
wizard), aligned to the view's content width. The strips are a dev reference, not product
UI, and are labelled as such in the sheet; the values live in `SPECS` in `shared/chrome.js`
and mirror `shared/styles.css`, so a value change updates both.

## OUT OF SCOPE - needs functionality or logic

Each of these is a real improvement that cannot be done as a styling pass. The closest
CSS-only alternative is given.

1. **Location dropdown in the top nav** needs the picker to be mounted in the topnav template
   and its selection to drive the breadcrumb. *Explicitly allowed by the brief* and prototyped
   here, but it is not CSS. Reuse the `location-nav` prototype's tree, do not build new
   location logic.
2. **`vwc-stepper` replacing the wizard dots**: new markup (see Area 6). CSS-only fallback:
   restyle the existing dots with the shared tokens.
3. **Column drop at narrow widths** (Time spent below 1180px, Duration and Due below 900px) is
   CSS, but a real implementation wants a column-visibility control so users can get the hidden
   columns back. CSS-only alternative: horizontal scroll on the table region instead of hiding.
4. **Activity code as a second line in the catalog Name column** needs that field rendered in
   the cell. CSS-only alternative: keep the single-line name.
5. **Progress meter fill** needs a completion percentage available in the row model. If only
   "0 of 5" is available, the bar can render from that ratio; if neither is available, show the
   label alone rather than an empty capsule.
6. **Content-type glyph on activity rows and cards** needs the activity type in the row model.
   CSS-only alternative: drop the glyph, keep the title.
7. **Away-from-home chip on the location trigger** needs the user's home location. CSS-only
   alternative: omit the chip.
8. **Section headers in the side nav** need the nav model to carry a section level (see Area 1).

## Global consistency summary

One token set, four text levels, one 4px spacing scale, one radius scale, one focus ring, one
pill component, one progress meter, one notice, one thumbnail treatment, one segmented control,
one icon-button, and the real Vector button and input components: applied across all seven
areas. Concretely: the status pill in the accordion row, the badge on the card thumbnail and
the New pill in the catalog are the same component; the selection state in the side nav, the
filter panel and the wizard tiles are the same rail-and-soft-fill language; the Launch button
in the list and the Launch button on the card are the same `vaadin-button theme="primary"`; and
the accordion header, the catalog header and the wizard footer all sit on `--c-surface-alt`
with the same border and the same 12.5/600 label. Change a token, and all seven areas move
together.
