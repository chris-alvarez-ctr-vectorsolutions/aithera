# Convergence UI Redesign — Claude Code Prompt

Paste everything below the line into Claude Code. The reference screenshots are in the `convergence-screenshots/` folder next to this file — each section names the exact file to open. Keep this repo open and let Claude Code locate the actual components before it edits.

## Reference screenshots (current state — the "before")

Open these before starting each area. They show what the UI looks like today; the direction notes below describe the target.

Some areas have multiple screenshots (a view can have more than one state, and a flow has more than one step). Files are named `NN` per area, with a letter suffix (`a`, `b`, …) when an area has several. Open all screenshots for an area before styling it.

| File(s) | Area |
|---|---|
| `convergence-screenshots/01-side-navigation.png` | Area 1 — Side navigation |
| `convergence-screenshots/02-top-nav-location-picker.png` | Area 2 — Top nav + location picker |
| `convergence-screenshots/03-training-plan-accordion.png` | Area 3 — Training Plan accordion (list view) |
| `convergence-screenshots/04-training-plan-accordion-filter-panel.png` | Area 3 — Training Plan accordion with left filter panel open |
| `convergence-screenshots/05a-training-plan-card-view-small.png` (small/compact cards), `05b-training-plan-card-view-large.png` (large cards) | Area 4 — Training Plan card view — both card sizes |
| `convergence-screenshots/06-catalog-table.png` | Area 5 — Catalog table |
| `convergence-screenshots/07a-content-wizard-step1-add-content.png`, `07b-content-wizard-step2-content-type.png`, `07c-content-wizard-step3-save-location.png`, `07d-content-wizard-step4-activity-properties.png` | Area 6 — Content Wizard — full flow |

---

## Mission

Refresh the visual design of six areas of **Convergence** (our LMS). This is a **styling pass**, not a rebuild. The goal is a more modern, legible, well-spaced UI achieved almost entirely through CSS/SCSS: type hierarchy, spacing/padding, alignment, color, borders, radius, shadows, and interaction states (hover / active / selected / focus / disabled).

## Hard constraints — read before touching anything

1. **CSS/SCSS only, with one exception.** Do not add features, change data, alter routing, or rewrite component logic. Do not change what any control does.
2. **Do not restructure the DOM** unless strictly required to apply a style, and even then keep it minimal and behavior-preserving. Prefer styling existing elements and classes over adding markup.
3. **The one allowed structural change:** moving the **location picker into the top nav as a dropdown with the nest/tree view**. A prototype of this already exists in the codebase — find it, reuse it, and wire the styling around it. Do not build new location logic.
4. **Stay inside the existing design system / framework.** Discover what's in use (CSS variables, SCSS partials, Bootstrap/other framework, utility classes) and extend it. Introduce new shared tokens only when a value repeats across screens, and centralize them rather than scattering literals.
5. **No regressions to responsive behavior.** The side nav has a narrow/mobile state (see screenshots) — preserve it.
6. If any requested improvement can't be done without new functionality or markup changes, **stop and flag it** as "OUT OF SCOPE — needs functionality/logic," and propose the closest CSS-only alternative.

## Working method

- First, **locate the real components** for each of the six areas and report the file paths before editing. Map each screenshot to its component(s).
- Identify existing tokens (colors, spacing scale, font sizes, radius). Propose a small shared set if inconsistencies exist.
- Work **one area at a time**, in the order listed. After each, summarize: files touched, what changed, and any assumptions.
- Preserve all class hooks other code/tests may depend on; add new classes rather than renaming existing ones where practical.
- Do the work on a feature branch and keep commits scoped per area.

## Global design direction (applies to all six)

- Establish a clear text hierarchy with defined levels: page title, group/section header, row/item label, secondary/meta text. Each level gets a specific size + weight + color — don't rely on bold-everything.
- Use a **consistent spacing scale** rather than ad hoc pixel values. Increase breathing room in dense areas; tighten oversized empty padding.
- Reduce visual noise from heavy full-width divider lines — prefer lighter dividers, subtle backgrounds, or spacing to separate items.
- Make interactive states unmistakable and consistent across screens (hover, active/selected, focus-visible, disabled).
- Modernize the button and status-pill styling once, centrally, so every screen inherits it.

---

## Area 1 — Side navigation
*Screenshot: `convergence-screenshots/01-side-navigation.png` — the tall blue nav with Dashboard active and "Training Import And Creation" expanded.*

Current issues to fix:
- Every row is separated by a heavy full-width divider; rows are very tall with inconsistent vertical padding. Tighten row height and lighten/collapse the dividers.
- Two different "active" treatments (bright blue Dashboard vs. dark navy expanded parent) feel inconsistent — unify the active/expanded state language.
- Icons are heavy and inconsistently weighted/sized; normalize icon size and alignment to labels.
- Expand/collapse carets sit far right, disconnected from labels; tighten the relationship and clarify expanded vs. collapsed affordance.
- Improve grouping: parent items, expanded children (Content Wizard, Quizzes, Surveys, etc.), and section headers should read as distinct levels through indentation, weight, and subtle background — not just dividers.

## Area 2 — Move location picker to top nav
*Screenshot: `convergence-screenshots/02-top-nav-location-picker.png` — top bar with Home/Training/Catalog/Insights/Administration and the dark secondary bar showing the "Location" pin button + "UAT Environment › …" breadcrumb. The Content Wizard screenshot (Area 6) shows the same Location pin in context.*

- Relocate the existing bordered **"Location" pin button** into the **top navigation** as a **dropdown that opens the nest/tree view** (reuse the existing prototype).
- Style the trigger to sit cleanly among the top-nav items (Home / Training / Catalog / Insights / Administration) with correct alignment, spacing, and vertical centering.
- Style the open dropdown: panel width, padding, the tree/nest rows, hover/selected states, and scroll behavior for long trees.
- Reconcile the two stacked bars (light top nav + dark breadcrumb bar). Ensure the breadcrumb ("UAT Environment › Administration Dashboard") still reads clearly once the location control moves up.
- Keep the active top-nav tab treatment (blue label + underline) but make spacing between tabs consistent.

## Area 3 — Training Plan accordion rows
*Screenshots: `convergence-screenshots/03-training-plan-accordion.png` ("My Training" list view with Name / Completion / Duration / Time Spent / Due / Actions columns, grouped by qualification/requirement) and `convergence-screenshots/04-training-plan-accordion-filter-panel.png` (same view with the left filter panel open).*

Current issues to fix:
- Three nesting levels (group → requirement → activity) are hard to tell apart. Give each level distinct indentation, label weight, and background so the hierarchy is scannable.
- The completion "capsule" with a tiny "0 of 5 Qualifications" caption beneath it has weak hierarchy and odd alignment — redesign as a clearer progress indicator with a legible label, vertically aligned to its row.
- Status pills (In Progress / Incomplete / Overdue) are small and low-contrast; standardize pill sizing, color semantics (yellow/gray/red), and text.
- Column alignment is loose (durations, due dates). Left-align text, and align meta columns consistently; give the header row clearer treatment.
- Row heights and full-width borders are heavy and repetitive — establish a consistent row rhythm with lighter separation.
- The orange "Complete any 2 of the Activities below" callout should read as an intentional inline notice (padding, radius, icon alignment), not a raw block.
- Left filter panel: align the "View By…" list icons and labels, tidy the filter dropdowns, view-toggle icons, and the "Set as Default" button; make it feel like part of the same system as the side nav.

## Area 4 — Training Plan card view
*Screenshots: `convergence-screenshots/05a-training-plan-card-view-small.png` (small/compact cards) and `convergence-screenshots/05b-training-plan-card-view-large.png` (large cards). Both are the "My Training" card/grid view — the two right-hand view-toggle icons switch between them. In the large view the duration badge ("15 mins") sits in the thumbnail corner; in the small view cards are denser. Style **both sizes from one shared card component** so density changes but the visual language (thumbnail ratio, badge placement, title, info icon, Launch button, radius, shadow) stays consistent.*

Current issues to fix:
- Cards are left-clustered while the group progress capsule floats far right, leaving awkward empty space — establish a proper responsive card grid with consistent gutters.
- Standardize card dimensions, thumbnail aspect ratio, corner radius, border/shadow, and internal padding.
- Restyle the status badge overlay (In Progress / Incomplete / Overdue) for consistent placement, contrast, and the "Due: 04-08-2026" chip.
- Improve card title treatment and truncation; align the info icon and Launch button consistently across cards.
- Match the status-pill and button styling to the accordion view so both Training Plan views feel like one feature.

## Area 5 — Catalog table
*Screenshot: `convergence-screenshots/06-catalog-table.png` — "Catalog › Safety (7)" with Type / Name / Update Status / Author / Mobile / Price / Duration / Status columns, thumbnails, "New" pill, View Details buttons.*

Current issues to fix:
- The thumbnail column bleeds to the very left edge with no padding — add proper left padding/gutter and align thumbnails to the row.
- Establish consistent row height and vertical rhythm; give the header row clearer hierarchy.
- The "Mobile" column uses a green check / red X — standardize these status glyphs (size, color, spacing, tooltip affordance).
- Restyle the "New" pill and the "View Details" buttons to match the shared button/pill system.
- Align columns cleanly (icons centered, text left-aligned, action buttons right-aligned) and balance column widths so Name gets priority.

## Area 6 — Content Wizard
*Screenshots — the full four-step flow:*
- *`07a-content-wizard-step1-add-content.png` — "How do you want to add content?" (Import / Create / Copy tiles; disabled Start button).*
- *`07b-content-wizard-step2-content-type.png` — "What type of content do you want to create?" (Quiz / Tasklist / Class / Event / Survey / Signature tiles; Quiz shown selected; helper text; Back/Next; step dots).*
- *`07c-content-wizard-step3-save-location.png` — "Please specify a save location" (sparse: "Select a Repository" link + icon; disabled Next).*
- *`07d-content-wizard-step4-activity-properties.png` — "Set Activity Properties" (form: Display Name, Description, Activity Duration, Make Public; required-field markers; disabled Next).*

Apply one consistent restyle across **all four steps** so the wizard reads as a single coherent flow:
- Restyle the dated gray **monitor/TV-frame wrapper** the same way on every step (flatten into a clean centered panel/card, or restyle the frame — but do it identically step to step).
- **Selectable tiles** (steps 1–2): consistent size, iconography, and clear default / hover / focus / **selected** states. Note the selected state already exists (Quiz is highlighted in step 2) — standardize it and carry it to step 1's Import/Create/Copy tiles.
- **Heading + helper-text hierarchy**: unify the big title and the supporting/description line across steps (e.g. "Create a Quiz. Use multiple choice…", "Where would you like to save this Quiz?", "Note: These properties can be easily edited later").
- **Form styling** (step 4): consistent label weight, input/textarea/select sizing and padding, required-field asterisk treatment, and vertical rhythm between fields. Step 3 is very sparse — improve its vertical centering and the "Select a Repository" link+icon affordance.
- **Footer controls**: standardize Back / Next / Start and their enabled vs. **disabled** states (steps 3 and 4 show grayed Next; step 1 shows grayed Start) plus the step-progress dots.

Current issues to fix:
- The skeuomorphic gray "monitor/TV frame" wrapper looks dated — restyle it into a clean centered card/panel (or flatten the frame) without changing the flow.
- The three choices (Import / Create / Copy) should be modern, equal-sized selectable tiles with clear hover, focus, and selected states, consistent iconography, and readable labels.
- Improve the heading and helper-text hierarchy ("How do you want to add content?" / "Select import, create, or copy to get started").
- Style the **Start** button's enabled vs. disabled states clearly (it currently reads as permanently gray/disabled).
- Reduce the large dead space below; center and constrain the content for balance.

---

## Deliverable

For each of the six areas, provide: the files changed, a short before→after description, the new/reused tokens, the state styles added, and any OUT OF SCOPE flags. End with a **global consistency summary** — the shared tokens (type scale, spacing, colors, radius, button + pill styles) now applied across all six areas so the redesign reads as one cohesive system.
