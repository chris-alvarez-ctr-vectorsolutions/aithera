# Convergence UI Redesign — Round 2 Refinements

Follow-up to the initial redesign pass. Same repo, same feature branch. Apply these refinements on top of the work already done. Keep using the existing **design system** — pull badge colors, shadows, spacing, and type tokens from it rather than inventing values.

## Scope note (read first)

Most of these are still CSS/token changes. **Two items intentionally go beyond CSS** and are marked `[BEYOND CSS]`:
- the Catalog carousel behavior (keyboard nav + "View all" routing) needs JS,
- adding more due dates to the Training Plan examples is example/demo data, not styling.

Do those two only where noted; everything else stays CSS/markup-light.

---

## 1. "Needs Scheduling" badge for classes
Today, a class that needs to be scheduled is signaled by a **flashing yellow corner** — both on the top banner and on the class row itself. Replace that ambiguous flashing-corner indicator with a proper, labeled **badge** (e.g. "Needs Scheduling").
- Add the badge to the class **row** (accordion/list view) and the class **card** (card view), and reconcile the top-banner indicator so the same meaning is expressed as a badge, not a flashing corner.
- Use a design-system badge style. Yellow/amber is fine as the *attention* semantic, but it should be a static, legible badge — no flashing.
- Keep the badge consistent with the other status badges' sizing and placement.

## 2. Fix badge colors to match the design system
The **In Progress** badge on cards is the wrong color. Per the design system, **In Progress = blue**.
- Switch In Progress badges to the design-system **blue** badge.
- Audit all status/marker badges — Incomplete, Overdue, Complete, Needs Scheduling, **Assigned** (green, seen on Catalog cards), and the **"E" elective corner tag** — and map each to the correct design-system badge token/color and semantic. Stop using ad hoc colors — use the system's badge components/variables.
- Apply consistently across both the accordion/list view and the card view so a status looks identical everywhere.

## 3. Card icons not centered
The activity-type icons inside cards are still **off-center**. Properly center them (both axes) within their container/thumbnail, and normalize icon size so every card's icon aligns identically regardless of type.

## 4. Cards: drop shadow instead of outline
Replace the card **border/outline** with a **drop shadow from the design system — use the XS shadow token**. Remove the outline; the XS shadow should be the only elevation treatment. Apply to both small and large card sizes and keep the corner radius consistent.

## 5. `[BEYOND CSS]` More due dates in the Training Plan examples
In the Training Plan example/demo data, **populate more activities with due dates** so the "Due" column and the card due-date chips are well represented across states (upcoming, due soon, overdue). This is example data, not styling — adjust the mock/sample content only, don't change real data logic.

## 6. `[BEYOND CSS]` Catalog card view with category carousels
Give the **Catalog** an improved **card view** in addition to the existing table. Match the reference: `convergence-screenshots/08-catalog-card-carousel-reference.png` — stacked category rows (e.g. "Driver Safety - SM (6)", "Emergency Procedures - SM (6)"), each a horizontal row of large thumbnail cards with a **"View All >"** link on the right.
- Lay out catalog items as **horizontal category rows / carousels**, LinkedIn-style — the user scrolls through larger rows of cards within each category.
- Each card matches the reference: large thumbnail, activity-type icon + truncated title beneath, the small **"E"** corner tag (elective marker), and an **"Assigned"** badge where applicable (see the Qualifications row).
- Each carousel supports **keyboard controls: left/right arrow keys** move through the cards in the focused row (with visible focus states and accessible roles/labels).
- Each category row has a **"View All >"** action; clicking it takes the user to the **existing table view** for that category.
- Reuse the same card component and the design-system badges/shadow from items 2–4 so Catalog cards match Training Plan cards.
- Preserve all existing catalog data and the table view; the carousel is an additive view, not a replacement.

## 7. Typography floor + hierarchy
Enforce a type scale across all redesigned screens:
- **Body text: 16px minimum.** No body copy below 16px.
- **Small labels/meta: 12px minimum** (use 12px only for genuine small labels — captions, badge text, table meta — not body).
- Improve overall **text hierarchy**: distinct, consistent treatments for page title → section/group header → item label → secondary/meta, each defined by size + weight + color from the design system. Reduce reliance on bold-everything.
- Apply the scale via shared tokens so it holds across side nav, Training Plan (both views), Catalog (table + cards), Content Wizard, and top nav.

## 8. Padding / spacing audit across everything
Do a pass over **every** redesigned screen to make sure padding and spacing between elements is consistent and sensible — not too tight, not arbitrarily large.
- **Side nav especially:** check the vertical spacing between items, the padding inside each row (top/bottom and left/right), the gap between icon and label, and the indentation of nested/child items. Rows should have an even, comfortable rhythm — no cramped items and no inconsistent gaps between sections vs. items.
- Everywhere else (Training Plan list + cards, Catalog table + cards, Content Wizard, top nav): verify inner padding of rows/cards/cells and the gaps between items all come from the **design-system spacing scale**. Replace one-off pixel values with scale tokens so spacing is uniform.
- Confirm related elements share consistent spacing (e.g. all card interiors match, all table cells match, all nav rows match) and that section separation reads clearly through spacing rather than heavy dividers.

---

## Deliverable
For each item: files changed, the design-system tokens used (badge colors, XS shadow, type scale, spacing scale), and confirmation it's applied consistently across both Training Plan views and Catalog. Call out anything that had to touch JS or example data (items 5 and 6) separately from the CSS changes.
