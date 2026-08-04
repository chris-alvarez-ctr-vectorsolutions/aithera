> author: Design

## nav - Chrome and side nav (Areas 1 + 2)
- Area 1: no row dividers. Separation is 40px rows + 2px gaps + 6px radius + hover fill, not borders.
- Area 1: ONE selection language at every depth: 3px blue left rail + `--c-primary-soft` fill + blue label + blue icon. Replaces the two unrelated treatments (bright blue Dashboard vs dark navy expanded parent).
- Area 1: expansion is communicated by the caret and the child group only. A parent holding the selected child gets the quieter "trail" state (darker label, blue icon, no fill).
- Area 1: expand/collapse carets are RIGHT-ALIGNED in the row (margin-left auto), per designer direction in round 3.
- Area 1: icons are one 15px Font Awesome glyph in a fixed 20px column. Children indent 24px behind a 1px guide line.
- Area 1 round 3: labels wrap to TWO lines instead of truncating (2-line clamp, rows grow from a 44px minimum). Do not restore single-line ellipsis.
- Area 1: the four section headers (Overview / Manage / Insights / Configuration) are a PROPOSAL: the current nav model has no section level. OUT OF SCOPE as CSS; drop them if the IA is fixed.
- Area 1: the collapse button is the FIRST child of .sn-head, before the search field, so it keeps exactly the same x and y whether the nav is open or collapsed (left 12px, centre 29px). Do not move it back to the right of the search field.
- Area 1: collapsed 58px icon-only state is preserved (labels, carets and children hidden, `title` tooltips kept). 58px is chosen so the collapse button and the row icons share the same centre line. Below 900px the nav goes off-canvas behind the burger.
- Area 1: the collapse animates `width` with `flex-basis: auto` (one property drives the size) and `overflow: hidden` stops labels spilling past the rail mid-animation.
- Area 2: the dark breadcrumb bar is replaced by a light page header on `--c-surface`: breadcrumb (12.5, blue links) above the page title (20/600), page actions right-aligned in the same bar.
- Area 2: tabs keep the blue label + underline active state, on even 20px padding with a hover fill.
- All of this chrome is injected by shared/chrome.js and styled by shared/styles.css. Every page in the folder loads the same two files, so change the chrome there once rather than per page.
- The bottom-centre toolbox dock and the flow map are review tooling. Do NOT ship the `designtoolbox/toolbox.js` include.

## loc - Location tree open (Area 2)
- This is the one structural change the brief allows: the bordered "Location" pin button moves out of the breadcrumb bar and becomes a top-nav dropdown.
- Reuse the existing nest/tree prototype in `products/Convergence/location-nav`: `vwc-tree-list`. Do not build new location logic.
- Trigger: 40px tall, vertically centred among the top-nav controls. Pin icon, name (13/600) over ancestor path (11.5/400), caret. States: default / hover / open (blue border, soft fill, caret rotated).
- The "Away" chip appears when the working location is not the user's home location. Needs the home location in the user model: OUT OF SCOPE as CSS; omit the chip if unavailable.
- Panel: 380px wide, 12px radius, `--e-3`, `vaadin-text-field theme="outlined"` search, tree body scrolls at `max-height: min(520px, 80vh)`, footer shows what you are viewing plus "Return to home".
- Opens with the organization and its regions already expanded; a search expands every matching branch.
- Implementation gotcha: `vwc-tree-list` only recomputes its visible rows from its own expand control. Assigning `expandedItems` sets the property but leaves the rendered rows collapsed: drive the expand control instead.
- Selecting a location updates the page-header breadcrumb.

## t-list - Accordion list (Area 3)
- Four explicit depth levels: indent 16 / 32 / 40 / 56px, bands `--c-surface-alt2` → `--c-surface-alt` → `#fbfcfe` → `--c-surface`, label weights 14/700 → 13.5/600 → 13/600 → 13.5/500.
- ONE column grid is declared once and reused by the header and every depth, so group, qualification, requirement and activity rows align their Completion / Duration / Time spent / Due / Actions values under the same headings.
- Dropping a column at a breakpoint must hide that cell at EVERY depth, or the deeper rows spill onto a second grid line.
- The empty completion capsule with the tiny caption is replaced by `.meter`: a 76px bar plus a single-line label, "**0 of 5** qualifications", vertically centred. Needs a completion ratio in the row model; if only the counts exist, derive the bar from them.
- Status pills are one 24px `.pill` with fixed semantics: in progress = amber, incomplete = gray, overdue = red, complete = green. Same component as the card badge and the catalog New pill.
- Row separation is one `--c-line-soft` hairline; structural `--c-line` only under the header and the group. Activity rows are 52px with a hover fill.
- The orange callout becomes `.notice`: amber bg + border, 6px radius, aligned icon, 12.5/600. It stays inline beside the requirement label while it fits, then wraps onto its own line rather than truncating either piece of text.
- Launch keeps its existing left-hand position (moving it would be a DOM change the brief rules out) but is a compact `vaadin-button theme="primary"` at a fixed size on every row. The row details action is a tertiary icon button in the Actions column.
- Text is left-aligned; durations, time spent and due dates are tabular numerics. Overdue due dates go red + 600.
- The content-type glyph needs the activity type in the row model: OUT OF SCOPE as CSS; drop the glyph if unavailable.
- The session-selection banner sits above the plan as the shared inline notice on the info tokens, with the action as a real button ("View classes"). The legacy version was a full-width bright blue bar whose entire surface was the link.
- The details action is a circle-info icon button (title "View details: <name>"), NOT a chat bubble: the bubble read as commenting. Rows with attachments get a second paperclip icon button beside it. The Actions column is 84px to hold both.
- Details opens the drill-in page for that row's level: activity, requirement or qualification. See the d-qual / d-req / d-act nodes.
- Round 2: badge semantics come from the system tokens: info blue = in progress + new, warn amber = needs scheduling + retiring, idle gray = incomplete, err red = overdue, ok green = complete + assigned. No ad hoc colours; badge text sits on the 12px small-label floor.
- Round 2: classes that need a session carry the amber "Needs scheduling" badge (row, card and detail hero) instead of the legacy flashing yellow corner, and the banner carries the same badge on the same warn tokens. Class actions are Details / Select a session, never Launch.
- Round 2: the accordion's collapsed-state set records USER TOGGLES (XOR with the default), otherwise default-collapsed groups can never be expanded.
- Round 4: up to THREE stacked banners above the plan, one construction (icon, text, optional action, dismiss X), severity from the status tokens (warn / err / info). Stack gap 12, margin below 16, all from the scale. Dismissal is per session in the prototype; persistence is server-side. After dismissing, keyboard focus moves to the next banner's dismiss control.
- Round 4: the circle-info details action is ALWAYS the leftmost icon in an action row; the paperclip follows it. Applies to list rows, both card sizes and catalog cards.

## t-filter - Filter panel open (Area 3)
- The funnel that opens the panel lives INSIDE the panel header, top-left, NOT in the page-header actions. The panel is always a column in the layout: closed it is a 58px rail holding just the funnel, open it is the full 244px panel with the funnel in exactly the same position. Do not move the funnel back to the right-hand page actions; the control and the surface it controls have to read as one column.
- Open and closed are a `filters-closed` class on the training view, animated on `width` with `overflow: hidden` - the same pattern as the side nav's collapse, so both collapsible columns behave identically.
- The funnel uses the shared icon-button pressed state (blue soft fill) when the panel is open, and its `title` flips between Show filters and Hide filters.
- The panel is part of the same system as the side nav: same rail-and-soft-fill selection state, same hover fill, same icon column width (18px).
- "View by" rows are 36px with a 6px radius and no dividers.
- Filters are `vaadin-combo-box theme="outlined"`: `theme="outlined"` is required on every Vector input or Vaadin renders the filled style.
- The view toggle is the shared `.segmented` control, identical to the one in the page header; the hierarchy and favourites toggles are the shared bordered icon buttons.
- "Set as default" is a full-width `vaadin-button theme="secondary"`.
- Below 900px the OPEN panel overlays the content instead of squeezing it; the closed funnel rail stays in flow.

## t-cards-s - Compact cards (Area 4)
- Same card component as the large size. The ONLY difference is the grid track size: `--card-min: 168px; --card-max: 208px`, plus slightly tighter body padding and a 13px title.
- Thumbnail ratio, badge placement, radius, shadow and controls must not change between densities.
- Round 4 worked example: the 12-activity requirement (RV - HSEML - Site Hazards) demonstrates the responsive grid. Measured: large cards 4 / 3 / 2 per row and small cards 5 / 4 / 2 per row at 1600 / 1180 / 820px, 16px gutters at every size. Auto-fill min-max tracks derive the count from the width; do not hardcode column counts.
- Round 2: cards carry the design-system XS shadow (`--e-xs`) as their ONLY elevation: no border. Type icons are centred with grid place-items + line-height 1 and one normalised size per thumbnail size.

## t-cards-l - Large cards (Area 4)
- `--card-min: 248px; --card-max: 300px`. Grid tracks are CAPPED so a partial row keeps the card size instead of stretching a few cards across the page. That plus moving the group progress meter into the Completion column removes the "cards clustered left, capsule floating right" gap.
- Fixed 16:9 thumbnail (`aspect-ratio`). Status badge top-left using the shared pill on a translucent white plate; duration badge bottom-right.
- The due date moved from the thumbnail corner to a meta line under the title (red when overdue) so it can never collide with the duration badge.
- Title is 13.5/600 clamped to two lines, content-type glyph aligned to the first line. Footer: tertiary details icon button left, primary Launch right: the same pills and buttons as the list view.
- Card hover: `--e-2` + blue border + 2px lift.
- Thumbnails here are CSS placeholders tinted per content type. Real course art comes from the LMS; only the frame, ratio and overlay positions are specified.

## catalog - Catalog table (Area 5)
- 24px left gutter on the first cell and 24px right on the last. The thumbnail no longer bleeds to the viewport edge.
- Thumbnail is 60×38 with a 4px radius and a hairline border, centred in the row.
- One 56px row rhythm, `--c-line-soft` hairlines, hover fill, sticky `--c-surface-alt` header at 12.5/600.
- Mobile column: `.glyph-yes` / `.glyph-no`: 20px circles on the shared ok / error tokens with `title` tooltips, centred.
- The New pill is the shared `.pill-new`; View Details is `vaadin-button theme="tertiary"` (repeated row action).
- Name gets priority width (36%) and carries the activity code as a second line. That second line needs the code in the cell model: OUT OF SCOPE as CSS; keep the single-line name if unavailable.
- Icons centred, text left-aligned, actions right-aligned. Meta columns never wrap, so every row stays exactly one row tall.
- Author and Status carry values here; both columns are empty in the current UI. CONFIRM the real values before building.
- Round 2: the table is category-aware. It is reached from a category's View all in the card view and titled with the category name and count; the segmented control in the page header switches between cards and table. Retiring uses the warn amber badge (attention), Enrolled the ok green.

## wz1 - Add content (Area 6, step 1)
- Round 3: the stepper is the Assign Training Wizard's construction, not vwc-stepper: 34px numbered circles joined by 1.5px connector lines, labels beneath. Idle = gray ring, active = solid primary blue, complete = solid ok green. Same on all four steps; labels hide below 760px.
- The skeuomorphic gray monitor / TV frame is gone. One centred `.panel`, max-width 780px, 12px radius, `--e-1`, with the same three regions on every step: stepper, body, footer. Constraining and centring the panel also removes the large dead space below.
- Import / Create / Copy are the same tile component as step 2, on an equal-width grid: 46px icon in a soft-blue rounded square, 13.5/600 label, 11.5 description.
- Tile states: default, hover (blue border + faint fill + 2px lift + `--e-1`), focus-visible (shared focus ring), selected (blue 2px border, soft fill, filled icon, check badge top-right).
- Start is `vaadin-button theme="primary"` with a genuinely distinct disabled state: it currently reads as permanently gray. It enables when a tile is selected; the footer hint line says why it is disabled.
- The step dots are replaced by `vwc-stepper` with labelled steps. That is new markup, not a restyle: OUT OF SCOPE as CSS. Fallback: keep the dots and give them the shared active / complete / idle tokens.

## wz2 - Content type (Area 6, step 2)
- Six tiles on the same grid and the same component as step 1. The selected state from the current UI (Quiz highlighted) is standardised here and carried back to step 1.
- The helper line under the tiles updates from the selection: "Create a Quiz. Multiple choice, true or false, information slides." Same 13.5 `--c-meta` treatment as every other step's helper line.
- Footer: Back (secondary) left, Next (primary) right. Next stays disabled until a type is selected.

## wz3 - Save location (Area 6, step 3)
- The sparse step and its bare "Select a Repository" link are replaced by a centred empty state: dashed border, folder icon, one line explaining what a repository controls, and a real `vaadin-button theme="secondary"` action.
- Once a repository is picked the empty state collapses to a confirmed selection row (green ok tokens) with a tertiary "Change repository" action, and Next enables.
- The content type name in the copy ("Where would you like to save this Quiz?") comes from step 2's selection.

## wz4 - Activity properties (Area 6, step 4)
- Vector form components throughout: `vaadin-text-field`, `vaadin-text-area`, `vaadin-number-field`, `vaadin-combo-box`, all with `theme="outlined"`.
- One label weight (13.5/600 `--c-body`), one input sizing, 20px rhythm between fields, max-width 480px so the form does not stretch across the panel.
- Required marker is a red `*` on `--c-err-ink`, with the "* Indicates a required field" note in the shared meta style.
- Hint text sits under the field it explains at 11.5 `--c-meta`.
- Next stays disabled until the required Display name is filled: same disabled treatment as steps 1 and 3.

## home - Home dashboard (Area 7)
- Added from the legacy Home page screenshot after the original six-area brief. The four cards, their order and what each shows are unchanged; this is a styling pass like the rest.
- Area 7 carries the side nav, COLLAPSED to the 58px icon rail by default. The legacy page only showed the hamburger, so the rail keeps the menu visible without spending a 250px column on a dashboard. The menu button expands it in place and keeps its position.
- Training and Catalog still have no side nav, matching the legacy pages. Only Home and the Administration pages carry it.
- Each route declares how wide the nav starts (`navCollapsed` in ROUTES). A manual toggle sticks until the next navigation.
- The side nav's Dashboard row IS this page, so it is the selected row here. The review guide (`dashboard.html`) is prototype scaffolding and deliberately has no nav row.
- Cards use the shared `.panel` surface plus `.card-head` / `.card-body` / `.card-foot`. The legacy gray header bars, square corners and heavy borders are gone.
- ONE ring geometry and ONE arc colour (`--c-primary`) for all three progress stats. The legacy pale green / pale blue / orange carried no meaning and made the three read as unrelated widgets. State is carried by the label and the counts.
- The empty ring is a DASHED neutral track with "None assigned" inside it. Never render an empty list as `100%` on a filled ring, and never in orange: the legacy card read as complete and alarming at the same time.
- Under each ring: the percentage inside, then `11 of 18 done, 7 to go`. Tabular numerals so the three columns line up. `.stat-hint` has a 2-line min-height so the three actions sit on one baseline.
- Launch is the shared `vaadin-button theme="primary"`, the same as the training list and cards. The legacy green matched nothing else and green is reserved for success and completion.
- Upcoming training uses the same header and row treatment as the catalog table (12.5/600 header on `--c-surface-alt`, 52px rows, hairlines, hover fill, content-type glyph).
- The empty class list uses the shared `.empty` state, NOT a red block. Red is reserved for overdue and errors everywhere else in the product; an empty list is not an error.
- Round 3: the progress and upcoming-training cards share the first grid row and both stretch to the row height, footers pinned, so they always match. The ring caption puts the count on line one ("11 of 18 done") and the BOLD remainder on line two ("7 to go").
- Card footers (`View all training`, `View all news`) are real footers outside the content. In the legacy page the View All button floated over the news text and overlapped it.
- News rows: date as a meta line with a calendar icon, full title at 13.5/600, excerpt clamped to two lines, hover fill with a blue title. The legacy feed excerpts were WordPress boilerplate ("The post ... appeared first on ...") - strip that server side.
- Layout is a 12-column grid, 24px gutters: progress 8 + upcoming 4, classes 4 + news 8, collapsing to 12 + 6/6 below 1180px and all-12 below 760px. Cards size to content (`align-items: start`), which removes the legacy dead space bottom right.
- The legacy second gray bar held nothing but a Help button. Help now sits in the page header with the other page actions.
- Counts are illustrative: the legacy screenshot is a fresh account (0% / 0% / no items). CONFIRM the real figures and the news excerpts before building.

## d-qual - Qualification details
- One drill-in surface replaces the three legacy Details pages; the level is stated by a kind chip (Qualification / Requirement / the activity type) at the top of the hero.
- The hero says what the qualification contains: requirement count, activity count, summed total duration and the progress meter. The legacy page gave only a bare duration line.
- Contents are listed as rows you can click into: requirement group rows (with their meter) and their activities indented beneath, every row with a chevron and hover fill. The legacy activity list was not clickable.
- Activity rows keep Launch, so drilling down never costs the primary action. Clicks on the button do not open the row.
- Completion-rule notices render under their requirement row using the shared .notice.
- Thumbnails are the shared .thumb placeholders (t-qual / t-req gradients); real artwork comes from the LMS.
- Going back up is always one click, two ways: a "Back to <parent>" control above the panel (arrow-left, primary colour, hover fill), and the page-header breadcrumb carrying the full hierarchy with every ancestor clickable (My training > qualification > requirement > title).
- The back control is STRUCTURAL, not history: a requirement always returns to its qualification, an activity to its requirement (or to its assignment group for individually assigned ones), a qualification to the My training list. Predictable no matter how the page was reached (row click, parent link, deep link).
- Page chrome: the item name is the page title and Close in the page actions returns to the list. Deep link: ?details=qual:q-nhs.

## d-req - Requirement details
- Same surface one level down: kind chip, activity count + total duration + meter in the hero, and "Part of <qualification>" as a working link to climb back up.
- The completion rule ("Complete any 2...") renders as the shared inline notice under the description, not lost in a corner of the accordion.
- Activities are rows that open activity details; Launch stays on every row. Deep link: ?details=req:r-loto.
- "Back to <qualification>" sits above the panel and the qualification also appears in the breadcrumb, so returning to the qualification this requirement belongs to is one click from anywhere on the page (the hero "Part of" link is the third route).

## d-act - Activity details
- Hero: type chip, title, status pill + duration + time spent + due (red when overdue), and the primary Launch. The legacy page buried Launch under a bare duration line.
- Provenance is explicit and clickable: "Part of <requirement> in <qualification>", or "Assigned individually" for direct assignments. The legacy line ("Activity from Individually Assigned Activities from an individual assignment") was unreadable.
- Attachments appear as a file row (icon, name, size, Download): this is where the paperclip in the list leads.
- Past completions is a 4-column table (Completed / Version / Time spent / Score). Empty is the shared neutral empty state, NOT the legacy red "No records to display" row: red stays reserved for errors and overdue. The legacy Expire/Ignore date columns are dropped unless populated: confirm whether they carry data before build.
- Deep link: ?details=act:a4.

## cat-cards - Catalog category carousels (Area 5, round 2)
- Additive card view, default for the catalog; the table stays intact behind the segmented toggle and behind every View all.
- Stacked category rows: an 18/600 header with the count, a View all link-button right, and a horizontally scrolling strip of cards (scroll-snap, thin scrollbar).
- Cards reuse the shared card surface: XS shadow only, no border, 16:9 thumbnail, type glyph + single-line 16px title beneath.
- The E elective corner tag is a 22px square on the ink neutral, top-right of the thumbnail (the legacy maroon is off-system). Assigned is the solid ok-green badge, top-left, matching the reference.
- Keyboard: each strip is a roving-focus list (role list / listitem). Focus the strip, then left/right arrows move card to card, Home/End jump, with the shared focus ring visible on the focused card and an aria-label that explains the keys.
- Round 3: strips DO NOT horizontally scroll by hand. Flanking 36px circular arrow buttons page each row by about one viewport (smooth scroll, disabled at either end); the keyboard arrows still walk card to card. No visible scrollbar.
- Round 3: card titles show two full lines (2-line clamp with a matching min-height) instead of one truncated line.
- Round 4: each category is its own grouped module (white surface, hairline border, 12px radius, --e-1, 20px padding) per the Top picks reference; the circular prev/next arrows sit TOP-RIGHT in the category header beside View all.
- Round 4: catalog cards ARE the small Training Plan card (.tcard): same structure, sizing, thumbnail ratio, badges and XS shadow, plus the E tag and Assigned badge, and an action row whose info button is leftmost. There is no separate catalog card style.
- View all sets the category and opens the table view; deep link the views with ?view=cards or ?view=table on catalog.html.
- Category data is illustrative (the reference's Driver Safety / Emergency Procedures / First Aid / Qualifications rows); the existing seven Safety items are unchanged and remain the Safety category.

## Accessibility (round 4 audit)
- Contrast: all text and badge pairings measure at or above 4.5:1. Fixed by moving --c-faint to --c-meta: side-nav section headers, filter-panel titles, the empty-ring None figure, attachment file sizes. --c-faint is reserved for placeholders, disabled states and decorative glyphs.
- Focus: the shared ring covers every control; drill-in detail rows add a visible inset ring on :focus-visible; carousel strips and cards keep their explicit ring.
- Names and roles: aria-labels on all icon-only buttons (top-nav trio, nav collapse, banner dismiss, carousel arrows, card info); aria-current=page on the active tab; strips are labelled role=list with the arrow-key hint in the label; Vaadin fields in the wizard need accessible-name because an external label's for= cannot reach the shadow-DOM input.
- Focus order follows DOM = visual order; per category: View all, prev, next, strip, cards.
- Needs logic (flagged): server-side banner dismissal persistence, live banner counts, Show overdue / View classes actions.
