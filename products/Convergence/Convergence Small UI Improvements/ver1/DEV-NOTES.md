> author: Design

## nav - Chrome and side nav (Areas 1 + 2)
> date: 2026-10-07
- **V4 shell applied to the side nav:** the side nav now follows the design system sidebar EHS already ships (the navigation exploration's V4, `products/design-system/navigation/v4-design-system.html`). This supersedes the earlier Area 1 bullets below on row height, width, the collapse button and the children's guide line.
- **Width:** 250px open, 56px collapsed (`--w-sidenav`, `--w-sidenav-min`).
- **Logo area:** 80px tenant-logo area at the top (32px mark + name, EHS's `.tenant-logo` pattern); only the mark shows when collapsed. Tenant branding source is a logic item.
- **Collapse control:** a 24px round chevron on the sidebar's right edge, vertically centred on the logo area (`.sn-collapse`, `right: -12px`), the only open/close control; it rotates 180 degrees when collapsed. The sidebar itself must not clip (`overflow: visible`); the list and the logo area clip their own contents.
- **Rows:** 13px / 500, padding 8 16, 10px gap, 18px icon column, no radius; selected = 3px left border `--c-primary` + `--c-primary-soft` fill + 600. Children: 13px / 400 at a 44px indent, no guide line, selected at 500. Section headers 11 / 600 with a hairline and 20px lead above (first one without).
- **Collapsed:** icons centred in 56px; the parent of the current page keeps the fill and the bar lit.
- **Kept from the Small UI rounds:** the nav search (now under the logo area, hidden when collapsed), two-line label wrap, right-aligned carets, the trail state, the off-canvas behaviour below 900px.
> date: 2026-07-30
- Area 1: no row dividers. Separation is 40px rows + 2px gaps + 6px radius + hover fill, not borders.
- Area 1: ONE selection language at every depth: 3px blue left rail + `--c-primary-soft` fill + blue label + blue icon. Replaces the two unrelated treatments (bright blue Dashboard vs dark navy expanded parent).
- Area 1: expansion is communicated by the caret and the child group only. A parent holding the selected child gets the quieter "trail" state (darker label, blue icon, no fill).
- Area 1: expand/collapse carets are RIGHT-ALIGNED in the row (margin-left auto), per designer direction in round 3.
- Area 1: icons are one 15px Font Awesome glyph in a fixed 20px column. Children indent 24px behind a 1px guide line.
- Area 1 round 3: labels wrap to TWO lines instead of truncating (2-line clamp, rows grow from a 44px minimum). Do not restore single-line ellipsis.
- Round 10: the page header Refresh and Help actions are icon-only buttons (36x32, `.btn-iconic`) with `aria-label` + `title` carrying the name; the text labels are gone. Applies to every screen's action row.
- Area 1: the four section headers (Overview / Manage / Insights / Configuration) are a PROPOSAL: the current nav model has no section level. OUT OF SCOPE as CSS; drop them if the IA is fixed.
- Area 1: the collapse button is the FIRST child of .sn-head, before the search field, so it keeps exactly the same x and y whether the nav is open or collapsed (left 12px, centre 29px). Do not move it back to the right of the search field.
- Area 1: collapsed 58px icon-only state is preserved (labels, carets and children hidden, `title` tooltips kept). 58px is chosen so the collapse button and the row icons share the same centre line. Below 900px the nav goes off-canvas behind the burger.
- Area 1: the collapse animates `width` with `flex-basis: auto` (one property drives the size) and `overflow: hidden` stops labels spilling past the rail mid-animation.
- Area 2: the dark breadcrumb bar is replaced by a light page header on `--c-surface`: breadcrumb (12.5, blue links) above the page title (20/600), page actions right-aligned in the same bar.
- Area 2: tabs keep the blue label + underline active state, on even 20px padding with a hover fill.
- All of this chrome is injected by shared/chrome.js and styled by shared/styles.css. Every page in the folder loads the same two files, so change the chrome there once rather than per page.
- Fin (Vectoria) launcher: the SHARED rollout include (`products/Convergence/ai-chat-widget/fin-widget.js`) is loaded by shared/chrome.js on every page; only its presentation is overridden here, per designer spec. The shared widget file is untouched.
- Fin presentation: 30 x 30px, border-radius 15px 0 0 15px, docked FLUSH to the right screen edge (right gap 0). The unread badge sits top-LEFT because the right side is off-screen.
- Fin drag: the launcher drags up and down the edge (pointer drag; Arrow Up/Down in 24px steps when focused). A drag never toggles the chat (a >4px move swallows the following click), and the position persists in localStorage (`fin-dock-top`). Server-side persistence is a logic item.
- Fin window: opens at right 12px, vertically beside wherever the launcher currently sits, clamped to the viewport.
- Fin gutter contract (rollout rule): `--fin-gutter: 40px` pads the right of every non-flush scroll area so content never sits under the launcher.
- CSS spec strips: every screen ends with a collapsed "CSS spec for this screen" line (a native <details>, 29px closed) that expands to a key/value sheet of that screen's important CSS values, with monospace values. Dev reference only, NOT product UI: do not ship. Content lives in SPECS in shared/chrome.js and mirrors shared/styles.css; when a value changes, update BOTH.
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
- Accordion tiers, FINAL (supersedes the earlier band schemes): every header level - the sticky column header included - on base `--c-surface` white; ONLY the activity rows and `.tp-cardwrap` take the `--tier-act` tint (#f2f5f9, hover `--tier-act-hover` #ecf0f5, borders `--c-line`). Hierarchy is structural: indents + weight, no accent bars, no shadows, no fills on headers.
- History: three shading versions (darkest-first bands / reversed white-to-dark / white headers + tinted activities) were compared behind a temporary V1/V2/V3 page segmented control; the third was chosen and BAKED IN, and the control, its state and the `.tier-reverse`/`.tier-flat`/`.is-deep-open` machinery were all removed. Do not resurrect the classes - the base rules ARE the design.
- Padding sits on the 4px grid everywhere: pills `0 8`, location chips `0 8`, notice `4 12`, duration badge `4 8`, kind chip `4 8`, spec summary `4 8`, segmented inset `4`, caret buttons 24px squares.
- Interactions: the WHOLE header row toggles on click - the handler ignores clicks on `button`, `a` and `vaadin-button` inside the row so the info action and caret keep their own behaviour. Rows have `cursor: pointer` and hover fills (headers `--tier-head-hover` #f3f6f9, activities `--tier-act-hover` #ecf0f5); the caret button stays the keyboard path (rotate transition on `aria-expanded`).
- Indents step 16 / 32 / 44 / 60px; hierarchy also carries through indent and weight (18/700 group, 16/600 qualification, 16/600 requirement), so it holds without colour.
- AA on the final surfaces: meta/meter text 5.25 on the activity tint, 5.01 on its hover, 5.7+ on white headers; titles are ink at 15+.
- Round 10: accordion type glyphs are plain icons (14px, `--c-primary`), no chip fill. The 24px `--c-primary-soft` chip remains only where an icon stands alone (detail hero, catalog type column, View-by list).
- Round 8: qualification rows use `fa-graduation-cap` (never the medal); requirements keep `fa-award`. Same cap in the side nav, View-by list, detail hero and catalog cards.
- Canvas (round 15): `--c-canvas` is `#e8ebef`, the Vector neutral `--lumo-contrast-10pct` (#1a3860 at 10%) composited on the base white, so the white plan panel separates from the page at 1.20:1 (it was 1.06:1 on the product default `#f5f9fd`, which the designer found blended). History: round 8 tried `#f0f2f5`, round 10 went back to `#f5f9fd`, round 15 settled on the design-system value. Keep it an opaque hex: the loading layer paints the canvas over content. The round 8 table retune stays: bands `#f3f5f9` / `#edf1f7`, borders `#dbe0e8`, hairlines `#e9edf3`, `--c-meta` `#5b6779`. AA of text that sits directly on the canvas: meta 4.80 (spec-strip summary, loading label); primary text would be 4.13, so the only primary control on the canvas, the detail pages' Back chip, sits on a white surface (4.72).
- The Actions column is 112px (was 84px) so it holds three 34px icon buttons; the 1400px breakpoint grid carries the same width. A third action would need another 34px.
- ONE column grid is declared once and reused by the header and every depth, so group, qualification, requirement and activity rows align their Completion / Duration / Time spent / Due / Actions values under the same headings.
- Dropping a column at a breakpoint must hide that cell at EVERY depth, or the deeper rows spill onto a second grid line.
- The empty completion capsule with the tiny caption is replaced by `.meter`: a 76px bar plus a single-line label, "**0 of 5** qualifications", vertically centred. Needs a completion ratio in the row model; if only the counts exist, derive the bar from them.
- Round 17: the pill dot is back on list rows (round 16 had removed it) and every pill carries a 1px `--c-*-edge` border that measures >= 3:1 against white, the row tint and the canvas (WCAG 1.4.11): the pale `-line` tints were 1.1-1.4:1, so badges had no perceptible boundary - worst was Incomplete, whose gray fill equalled the row tint (1.01). Incomplete now sits on white with a `#7d8798` edge. Text on every fill stays >= 5.2, dots >= 4.0.
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
- Round 4 placed the circle-info action leftmost; SUPERSEDED. Round 13 removed it from cards (details are the hover pill) and round 14 moved it to the RIGHT end of list rows, so it sits at a fixed x whether or not print / attachments precede it.

## t-filter - Filter panel open (Area 3)
- Two bordered icon-button toggles: chevrons collapse/expand all, square-star shows electives; both keep `title`/`aria-label` in sync with state.
- The funnel that opens the panel lives INSIDE the panel header, top-left, NOT in the page-header actions. The panel is always a column in the layout: closed it is a 58px rail holding just the funnel, open it is the full 244px panel with the funnel in exactly the same position. Do not move the funnel back to the right-hand page actions; the control and the surface it controls have to read as one column.
- Open and closed are a `filters-closed` class on the training view, animated on `width` with `overflow: hidden` - the same pattern as the side nav's collapse, so both collapsible columns behave identically.
- The funnel uses the shared icon-button pressed state (blue soft fill) when the panel is open, and its `title` flips between Show filters and Hide filters.
- The panel is part of the same system as the side nav: same rail-and-soft-fill selection state, same hover fill, same icon column width (18px).
- "View by" rows are 36px with a 6px radius and no dividers.
- Filters are `vaadin-combo-box theme="outlined"`: `theme="outlined"` is required on every Vector input or Vaadin renders the filled style.
- The view toggle is the shared `.segmented` control, identical to the one in the page header.
- Collapse/expand all: ONE bordered icon button whose icon and name follow its next action: `fa-chevrons-up` + "Collapse all", then `fa-chevrons-down` + "Expand all" after collapsing. It sets every accordion level at once, including default-collapsed groups, so expand-all can reveal more rows than the default view. aria-pressed tracks the collapsed state.
- Show electives: bordered icon button with `fa-square-star` (the legacy Electives glyph is a star in a box). Toggling reveals elective activities in the plan: hidden by default, marked with the inline 20px E tag from the catalog, excluded from the requirement's x-of-y counts. Detail pages ALWAYS show electives (marked); only the plan lists filter them. aria-pressed + title flip (Show/Hide electives).
- Both icons are Font Awesome PRO: this feature's pages link the self-hosted Pro kit (`../../../../assets/fontawesome/css/all.min.css`), not the Free CDN. A Pro icon on the Free CDN renders as an invisible zero-width glyph: run the icon check in the repo CLAUDE.md before adding icons.
- "Set as default" is a full-width `vaadin-button theme="secondary"`.
- Below 900px the OPEN panel overlays the content instead of squeezing it; the closed funnel rail stays in flow.

## t-cards-s - Compact cards (Area 4)
- Same card component as the large size. The ONLY difference is the grid track size: `--card-min: 168px; --card-max: 208px`, plus slightly tighter body padding and a 13px title.
- Thumbnail ratio, badge placement, radius, shadow and controls must not change between densities.
- Round 12/13: the small card track is 200-236 (was 184-224). With info moved to the hover pill a footer holds at most two icons, so the buttons stay the shared 34px; only Launch trims its side padding in the dense card (`padding-inline: 10px`). Fit at the 200px minimum: 70 icons + 8 gap + 80 Launch = 158 in 176. The footer's icon cluster is pulled left by the buttons' 10px inset (`margin-left: -10px`) so the first glyph aligns with the title edge and both sides read as evenly padded.
- Round 4 worked example: the 12-activity requirement (RV - HSEML - Site Hazards) demonstrates the responsive grid. Measured: large cards 4 / 3 / 2 per row and small cards 5 / 4 / 2 per row at 1600 / 1180 / 820px, 16px gutters at every size. Auto-fill min-max tracks derive the count from the width; do not hardcode column counts.
- Action order is fixed: print, then attachments, then info LAST (list rows only). The cluster is right-aligned, so info always renders at the same x regardless of how many optional icons precede it. `rowActs(a, { info })` in views.js builds the cluster once for rows and cards; cards pass `info: false` because details live on the thumbnail hover.
- Printable content is derived from the activity type (`doc`, `tasklist`) in the data.js enrichment IIFE. LOGIC ITEM: the real model needs a printable flag per activity; do not ship the type heuristic.
- Round 2: cards carry the design-system XS shadow (`--e-xs`) as their ONLY elevation: no border. Type icons are centred with grid place-items + line-height 1 and one normalised size per thumbnail size.
- Round 10 padding (dense): body `12 12 8`, footer `0 12 12` - the same model as the large card, one spacing step tighter.

## t-cards-l - Large cards (Area 4)
- `--card-min: 248px; --card-max: 300px`. Grid tracks are CAPPED so a partial row keeps the card size instead of stretching a few cards across the page. That plus moving the group progress meter into the Completion column removes the "cards clustered left, capsule floating right" gap.
- Fixed 16:9 thumbnail (`aspect-ratio`). Status badge top-left using the shared pill on a translucent white plate; duration badge bottom-right.
- The due date moved from the thumbnail corner to a meta line under the title (red when overdue) so it can never collide with the duration badge.
- Footer (round 13): print and attachments icon buttons left (only when the activity has them), primary Launch right. The info button is GONE from cards: details open from the View details pill that appears over the thumbnail on hover and on focus-within (a 35% ink scrim under a white pill, `--e-2`); on touch devices (`hover: none`) the pill is always visible. List rows keep the info button as their first action.
- Round 10 padding: body `16 16 12` with an 8px stack gap; footer `0 16 16` pinned to the card bottom (`margin-top: auto`). No reserved title slot - the due-date line follows the title at the flex gap.
- GOTCHA: `.tcard-title` is an `h3` and `.tcard-meta` a `p`; both zero their margins in CSS. Without that the UA default margins stack ~36px of phantom space onto the 8px gap. Keep `margin: 0` if the elements change.
- The card title carries NO type icon. The activity type is a meta line under the title, styled identically to the due-date line: `.tcard-metas` stacks `icon + type label` then `icon + due`, 12px `--c-meta`, 4px apart; `.tcard-meta i` sits in a fixed 14px centred column so both lines' text left-aligns.
- The 2-line clamp lives on `.tcard-title span:last-child`.
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
- Child rows share the Training Plan accordion colours, not a detail-only scheme: `.d-row.group` (requirements) on white like the plan's header rows, `.d-row` (activities) on `--tier-act` #f2f5f9 with `--c-line` borders; hovers are `--tier-head-hover` / `--tier-act-hover`. Change the plan tokens and these follow automatically - do not fork them.
- One drill-in surface replaces the three legacy Details pages; the level is stated by a kind chip (Qualification / Requirement / the activity type) at the top of the hero.
- The hero says what the qualification contains: requirement count, activity count, summed total duration and the progress meter. The legacy page gave only a bare duration line.
- Contents are a PLAIN, STATIC list (scaled down at designer direction, round 11): requirement header rows (name, completion rule inline, summed duration) with their activities indented beneath (type glyph, name, E tag, paperclip, duration). Nothing expands, launches or drills in - Launch and progress live on My training. Rows are plain divs: no role, tabindex, chevron or status pill. Colour styling is token-for-token the plan's `.tp-req` / `.tp-act` rows (surfaces, `--c-line` / `--c-line-soft` separators, 16/600 `--c-body` header titles, 16/500 `--c-ink` activity titles, `--tier-head-hover` / `--tier-act-hover` hover fills as a scanning aid, cursor default).
- Completion-rule notices render inline in the requirement header row using the shared .notice, exactly as on the plan.
- Thumbnails are the shared .thumb placeholders (t-qual / t-req gradients); real artwork comes from the LMS.
- Going back up is always one click, two ways: a "Back to <parent>" control above the panel (arrow-left, primary colour, hover fill), and the page-header breadcrumb carrying the full hierarchy with every ancestor clickable (My training > qualification > requirement > title).
- The back control is STRUCTURAL, not history: a requirement always returns to its qualification, an activity to its requirement (or to its assignment group for individually assigned ones), a qualification to the My training list. Predictable no matter how the page was reached (row click, parent link, deep link).
- Page chrome: the item name is the page title and Close in the page actions returns to the list. Deep link: ?details=qual:q-nhs.

## d-req - Requirement details
- Same surface one level down: kind chip, activity count + total duration + meter in the hero, and "Part of <qualification>" as a working link to climb back up.
- The completion rule ("Complete any 2...") renders as the shared inline notice under the description, not lost in a corner of the accordion.
- Activities are the same plain static list (type glyph, name, duration): no Launch, no drill-in. Deep link: ?details=req:r-loto.
- "Back to <qualification>" sits above the panel and the qualification also appears in the breadcrumb, so returning to the qualification this requirement belongs to is one click from anywhere on the page (the hero "Part of" link is the third route).

## d-act - Activity details
- Hero: type chip, title, status pill + duration + time spent + due (red when overdue), and the primary Launch. The legacy page buried Launch under a bare duration line.
- Round 13: the hero is only the activity itself - kind chip, title, status + duration + time spent + due, Launch - with `--s-3` between rows so it no longer reads as one squashed block. Provenance moved out of it.
- Assignment section (rounds 13-14), directly above Past completions: a `dl.d-kv` label/value grid (140px + 1fr) with exactly three rows - Qualification (link), Requirement (link; the row is omitted for individually assigned activities, which have no requirement), and "Assigned by <First Last> on <date>" as one line. Dates use the plan's MM-DD-YYYY format. Demo data: `qualification.assignment`. LOGIC ITEM: the activity model needs its assignment record (assigner + date).
- Attachments appear as a file row (icon, name, size, Download): this is where the paperclip in the list leads.
- Past completions is a 4-column table (Completed / Version / Time spent / Score). Empty is the shared neutral empty state, NOT the legacy red "No records to display" row: red stays reserved for errors and overdue. The legacy Expire/Ignore date columns are dropped unless populated: confirm whether they carry data before build.
- Deep link: ?details=act:a4.

## loading - Loading screen between states
- A skeleton layer (`#loading`) sits over the canvas; the topnav, side nav and page header stay put so the user keeps their bearings. Content: `vwc-spinner` (24px, `loading` set - it is invisible otherwise) + a "Loading <screen>" label, a banner-shaped block and a panel of six shimmering rows on `--c-surface-alt2`.
- Prototype timing: `flashLoading()` shows it for 500ms on every in-place route change and on page load; a standalone page also shows it the moment it leaves for a sibling file. In the product it stays until the next screen's data has arrived, then hides. LOGIC ITEM: tie show/hide to the real fetch.
- `aria-live=polite` + `aria-busy` on the layer; the spinner's `loading-message` / `load-complete-message` announce start and end. Shimmer honours `prefers-reduced-motion`.
- Flow map: the `loading` state holds the layer open for review; every other state hides it.

## load-modal - Loading content modal
- Every Launch on the page (list rows, both card sizes, the activity hero, the Home list) opens the same modal through one delegated click handler; the activity name is read from the row it sits in.
- Modal: 420px, `vwc-spinner` 40px, "Loading content", the activity name, one line of expectation ("opens in a new window as soon as it is ready"), and a tertiary Cancel. `role=dialog`, `aria-modal`, labelled by the title; focus lands on Cancel; Escape, the backdrop and Cancel dismiss it.
- Prototype auto-closes after 2.4s in place of the content window opening. LOGIC ITEM: close on the real window-open / content-ready event, and decide what Cancel does to an in-flight launch. Build with `vaadin-dialog` (renderer-based; see CONTEXT.md) rather than the hand-rolled overlay used here.

## cat-cards - Catalog category carousels (Area 5, round 2)
- Additive card view, default for the catalog; the table stays intact behind the segmented toggle and behind every View all.
- Stacked category rows: an 18/600 header with the count, a View all link-button right, and a horizontally scrolling strip of cards (scroll-snap, thin scrollbar).
- Cards reuse the shared card surface: XS shadow only, no border, 16:9 thumbnail, type glyph + single-line 16px title beneath.
- The E elective corner tag is a 22px square on the ink neutral, top-right of the thumbnail (the legacy maroon is off-system). Assigned is the solid ok-green badge, top-left, matching the reference.
- Keyboard: each strip is a roving-focus list (role list / listitem). Focus the strip, then left/right arrows move card to card, Home/End jump, with the shared focus ring visible on the focused card and an aria-label that explains the keys.
- Round 3: strips DO NOT horizontally scroll by hand. Flanking 36px circular arrow buttons page each row by about one viewport (smooth scroll, disabled at either end); the keyboard arrows still walk card to card. No visible scrollbar.
- Round 3: card titles show two full lines (2-line clamp with a matching min-height) instead of one truncated line.
- Round 4: each category is its own grouped module (white surface, hairline border, 12px radius, --e-1, 20px padding) per the Top picks reference; the circular prev/next arrows sit TOP-RIGHT in the category header beside View all.
- Round 5 (2026-09-30): the grouped module is gone. Each category is a plain row on the canvas, header + strip, separated from the next by 32px of white space (`--s-8`); the cards carry the only surface. Prev/next arrows and View all stay top-right of the row header.
- Round 4: catalog cards ARE the small Training Plan card (.tcard): same structure, sizing, thumbnail ratio, badges and XS shadow, plus the E tag and Assigned badge. Round 14: like the training cards they have no footer and no info button; View details is the hover pill over the thumbnail (a placeholder here, since catalog items have no drill-in page in this prototype). There is no separate catalog card style.
- View all sets the category and opens the table view; deep link the views with ?view=cards or ?view=table on catalog.html.
- Category data is illustrative (the reference's Driver Safety / Emergency Procedures / First Aid / Qualifications rows); the existing seven Safety items are unchanged and remain the Safety category.

## Colour reference for developers
- `ver1/COLOR-CHANGES.md` is the consolidated list of every colour value and what changed from legacy, grouped by surface, text, badges, controls, banners, thumbnails and elevation, each with its measured WCAG ratio and the Vector token to prefer. Hand that file to the developer; this section holds the audit history behind it.

## Accessibility (round 4 audit, re-run round 16)
- Round 16 full re-audit (every visible text node on all ten screens, backgrounds composited up the ancestor chain): 21 failures found and fixed, now 0. Two root causes: (1) `--c-primary` #0271ce on the soft fill `#e8f2fc` is 4.36 and on the canvas 4.13, so a new `--c-primary-ink` #0266bb (5.12 / 4.85) is used for primary TEXT on tinted grounds: Beta tag, kind chips, guide numbers, selected nav rows and children, selected View-by items, catalog View all. `--c-primary` is unchanged for buttons, icons and links on white (4.93). (2) `--c-faint` #98a2b3 was used for text in six places (empty-cell dashes, inert nav children, token-sheet captions, "No description provided", the attachment paperclip); all moved to `--c-meta`. `--c-faint` is now reserved for decorative glyphs and input placeholders.
- Round 17 non-text contrast: custom controls whose only boundary is a border (search fields, segmented toggles, bordered icon buttons, carousel arrows) use `--c-control-line` #7d8798, 3:1 on every ground. Table hairlines keep `--c-line`; they are separators, not component boundaries.
- Round 16 padding sweep: every padding on the 4px grid and symmetric left/right. Fixed-size icon buttons (`.icon-btn`, `.disc`, `.cat-nav`, `.segmented button`) had the UA default `1px 6px` leaking under their explicit width/height - now `padding: 0`. Side-nav rows `8 12` (were 6 8/12), the detail Back chip `8 12` (was 6 12/10). The one deliberate asymmetry left is `.sn-children` 24px left indent.
- Contrast: all text and badge pairings measure at or above 4.5:1. Fixed by moving --c-faint to --c-meta: side-nav section headers, filter-panel titles, the empty-ring None figure, attachment file sizes. --c-faint is reserved for placeholders, disabled states and decorative glyphs.
- Focus: the shared ring covers every control; drill-in detail rows add a visible inset ring on :focus-visible; carousel strips and cards keep their explicit ring.
- Names and roles: aria-labels on all icon-only buttons (top-nav trio, nav collapse, banner dismiss, carousel arrows, card info); aria-current=page on the active tab; strips are labelled role=list with the arrow-key hint in the label; Vaadin fields in the wizard need accessible-name because an external label's for= cannot reach the shadow-DOM input.
- Focus order follows DOM = visual order; per category: View all, prev, next, strip, cards.
- Needs logic (flagged): server-side banner dismissal persistence, live banner counts, Show overdue / View classes actions.
