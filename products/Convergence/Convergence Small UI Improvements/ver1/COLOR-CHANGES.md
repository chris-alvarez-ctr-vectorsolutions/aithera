# Convergence Small UI Improvements - colour changes for development

Final values from `ver1/shared/styles.css`, with what changed from the legacy UI and why.
Every value below was measured for WCAG 2.2 AA: text at 4.5:1 (3:1 for large text),
component boundaries at 3:1 (1.4.11). Hex values are what the prototype renders; the
right-hand column names the Vector theme token to prefer where one exists.

## 1. Page ground

| Use | Value | Change | Why |
|---|---|---|---|
| Canvas (behind panels and cards) | `#e8ebef` | was `#f5f9fd` | Panels blended into the page (1.06:1). `#e8ebef` is Vector `--lumo-contrast-10pct` composited on white; panels now separate at 1.20:1. Keep it opaque: the loading skeleton paints it over content. |
| Panel / card surface | `#ffffff` | unchanged | `--lumo-base-color` |

## 2. Text

| Use | Value | Change | Why |
|---|---|---|---|
| Titles (page, card, row names) | `#101828` | - | 16:1 on white |
| Body / row labels / requirement headers | `#344054` | - | 9.9:1 |
| Secondary / meta (durations, dates, captions, hints) | `#5b6779` | darkened from `#667085` | Needed 4.5:1 on the gray canvas and the tinted bands. Measures 5.25 on the activity tint, 4.80 on the canvas. |
| Primary text on WHITE (links, tab labels) | `#0271ce` | - | 4.93 on white. Vector `--lumo-primary-color`. |
| **Primary text on a TINT** (Beta tag, kind chips, selected nav row, selected filter item, "View all") | `#0266bb` | NEW token `--c-primary-ink` | `#0271ce` is only 4.36 on the soft blue fill and 4.13 on the canvas. `#0266bb` is 5.12 / 4.85. Buttons and icons keep `#0271ce`. |
| Decorative glyphs and input placeholders ONLY | `#98a2b3` | demoted | 2.6:1 on white: never use for text. Was used for empty-cell dashes, inert nav items, captions, "No description provided", the paperclip; all moved to `#5b6779`. |

## 3. Training plan accordion (list view)

| Use | Value | Change | Why |
|---|---|---|---|
| Group / qualification / requirement header rows | `#ffffff` | were tinted bands (`#e6ebf3` -> `#f2f5f9` tried) | Final direction: hierarchy by indent and weight, not fill. |
| Activity rows (the one tinted layer) | `#f2f5f9` | new | One shaded layer for leaf content. Meta text on it 5.25:1. |
| Header row hover | `#f3f6f9` | new | |
| Activity row hover | `#ecf0f5` | new | |
| Structural border (panel, header separators) | `#dbe0e8` | - | Separator, not a component boundary; 3:1 not required. |
| Row hairline | `#e9edf3` | - | Same. |
| Column header row | `#ffffff` | was `#f3f5f9` | |

The detail pages (qualification, requirement, activity) reuse exactly these row values.

## 4. Status badges (pills)

Text colour on fill, plus a 1px edge that measures at least 3:1 against white, the activity
tint and the canvas. The pale `-line` tints that used to be the borders were 1.1 to 1.4:1 and
have been removed from pills. The leading dot is `currentColor` at 85%.

| Status | Fill | Text | Edge (border) | Change |
|---|---|---|---|---|
| In progress / New | `#eff8ff` | `#175cd3` | `#3b82f6` | In progress was amber in legacy; design system says blue. |
| Incomplete | `#ffffff` | `#475467` | `#7d8798` | Fill was `#f2f4f7`, identical to the row tint (1.01:1): the badge disappeared. Now white with a gray edge. |
| Needs scheduling / Retiring | `#fffaeb` | `#b54708` | `#c4320a` | Replaces the legacy flashing yellow corner. |
| Overdue | `#fef3f2` | `#b42318` | `#f04438` | |
| Complete | `#ecfdf3` | `#067647` | `#079455` | |
| Assigned (catalog, solid) | `#067647` | `#ffffff` | `#067647` | |
| Elective "E" tag | `#101828` | `#ffffff` | - | Replaces the legacy maroon corner square. |

On card thumbnails the pill fill becomes `rgba(255,255,255,.94)` over the image; text ratios
stay 4.9 to 6.9 on the resulting plate.

## 5. Controls whose only boundary is a border

| Use | Value | Change | Why |
|---|---|---|---|
| Search field, segmented view toggles, bordered icon buttons, carousel arrows | `#7d8798` | was `#dbe0e8` | 1.4.11: outline must reach 3:1 against its ground. `#7d8798` is 3.63 on white, 3.03 on the canvas. |
| Selected nav row / filter item fill | `#e8f2fc` | - | Text on it uses `#0266bb` (see section 2). |
| Hover fill on light surfaces | `#f4f9fd` | - | |
| Primary button hover / pressed | `#015fae` / `#014e8f` | - | |

## 6. Banners

| Banner | Fill | Border | Text |
|---|---|---|---|
| Needs scheduling (warn) | `#fffaeb` | `#fedf89` | `#b54708` |
| Overdue (error) | `#fef3f2` | `#fecdca` | `#b42318` |
| Completion rule (info) | `#eff8ff` | `#b2ddff` | `#175cd3` |

Banner borders are decorative (the fill and icon carry the state), so they keep the pale tints.

## 7. Thumbnails (placeholders; real art comes from the LMS)

135-degree gradients per content type: video `#3f5f86 -> #233a58`, course `#43678f -> #2a4a6b`,
quiz `#5b6b95 -> #343f66`, tasklist `#4c7f8c -> #2c5460`, document `#7a6e93 -> #4a4064`,
class `#6d5a8c -> #453963`, qualification `#35548b -> #1d3560`, requirement `#4a6d8c -> #2b4a66`.
Duration badge on the thumbnail: `rgba(16,24,40,.78)` with white text.

## 8. Elevation (for completeness)

| Token | Value | Use |
|---|---|---|
| XS (design-system card shadow) | `0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)` | Cards; replaces the card outline |
| 1 | `0 1px 2px rgba(16,24,40,.06)` | Catalog category modules |
| 2 | `0 4px 12px rgba(16,24,40,.08)` | Card hover, View details pill |
| 3 | `0 14px 36px rgba(16,24,40,.16)` | Modals, off-canvas nav |

## Removed from the legacy UI

- Flashing yellow "needs scheduling" corner: replaced by the amber badge.
- Maroon elective corner square: replaced by the ink "E" tag.
- Dark red "No records to display" row: replaced by the neutral empty state. Red is reserved for errors and overdue.
- Dark navy expanded-parent nav treatment: one selection language (blue rail + soft fill) at every depth.
- Dark breadcrumb bar: replaced by the white page header.
