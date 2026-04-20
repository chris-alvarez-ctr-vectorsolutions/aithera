# EV+ Reports UI — Design Requirements

> Defines the visual design patterns, layout conventions, and component specifications for all Reports UI prototypes in this product. Follow these patterns in every new mock for consistency.
>
> Source: https://violin-amused-38298671.figma.site/

---

## 1. Overall Page Layout

- **Two-panel layout**: scrollable main content area (left) + fixed filter sidebar (right)
  - Main content: fluid width, takes remaining space
  - Filter sidebar: fixed ~400px wide, full viewport height
- **Top navigation**: standard Vector SOLUTIONS topnav; active section indicated with a bottom-border underline on the nav item
- Page background: white (`#ffffff`); sidebar background: light gray (`#f9fafb`)

---

## 2. Page Header

Located at the top of the main content area, above all report content sections.

```
[Report Title — h1]
Last updated: [date] at [time]

[Primary action]  [Secondary action]          [Tertiary action]  [Tertiary action]
```

- **Report title**: `<h1>`, large (~28–32px), semi-bold, left-aligned
- **Last updated**: small secondary-color text directly below the title
- **Left action group**: primary and secondary action buttons (e.g. email, export)
- **Right action group**: tertiary/outlined action buttons, right-aligned
- No divider below the header — report content cards follow directly with spacing

---

## 3. Report Filters Sidebar

### Structure
- Header row: panel label (left) + `›` collapse chevron button (right)
- Scrollable filter content fills the space between header and footer
- Sticky footer: full-width **"Apply Filters"** primary button — always visible at bottom
- Thin horizontal dividers (`vwc-divider`) separate each filter group
- Each filter group: small uppercase-spaced gray label above its control(s)

### Filter Control Types

| Control | When to use |
|---|---|
| **Date range** | Any time-bounded filter; displays as a single range input field with calendar icon |
| **Select button** | Large or hierarchical datasets requiring modal-based selection (e.g. users, forms, activities) |
| **Checkbox group** | Multi-select from a known, short list of enum values |
| **Radio group** | Single-select from a known, short list of mutually exclusive values |
| **Boolean checkbox** | Standalone on/off toggle for a single option |

### Behavior
- Filters are **not applied automatically** — the user explicitly submits via "Apply Filters"
- The `›` chevron collapses the sidebar; the chevron flips to `‹` when collapsed; main content expands to fill freed space
- Required filters should be visually distinguishable from optional ones (e.g. label weight or indicator)
- When one filter selection affects the available options in another, notify the user rather than silently resetting

---

## 4. Select [Item] Modal

Triggered by a "Select [X]" button in the filter sidebar. Used for any filter that involves browsing or searching a large dataset.

### Layout
Three-column dialog:

```
┌──────────────────────────────────────────────────────────────┐
│ Select [Items]                                            [X] │
│ [Descriptive subtitle]                                        │
├──────────────────────┬───────────────────────┬───────────────┤
│ Group By [dropdown]  │ Search [input]        │ Selected Items│
│                      │                       │               │
│ ▼ [Category tree]    │ [Browsable results    │ [Live list of │
│   [tree items]       │  table with columns]  │  selections]  │
│                      │                       │               │
├──────────────────────┴───────────────────────┴───────────────┤
│                               [Cancel]  [Confirm (N items)]  │
└──────────────────────────────────────────────────────────────┘
```

- **Left column**: "Group By" dropdown + collapsible category/location tree for narrowing results
- **Center column**: search input + scrollable results table
- **Right column**: "Selected Items" heading; live-updates as user selects; empty state = centered icon + message
- **Footer**: Cancel (secondary, left), Confirm with live count (primary dark, right)
- Dark overlay backdrop; dialog content scrolls internally

---

## 5. Data Visualization Cards

### Card anatomy
- **Card title**: left-aligned, medium weight
- **Date range badge**: light blue pill chip — calendar icon + date range text; shown below the title
- **Chart type toggle** (optional): segmented button group — active state = white background + border; inactive = transparent

### Chart types
- **Pie chart**: colored segments; percentage labels as colored text callouts positioned near segments; legend row below (colored dot + label)
- **Horizontal bar chart**: bars in primary blue; category labels on the left y-axis; numeric axis on the bottom
- **Side-by-side**: pie (left) + bar (right) within one card — use when showing distribution alongside a top-N ranking

### Card styling
- Outlined border, ~8px border-radius
- ~24px internal padding
- White background, no drop shadow (flat outlined style)
- Cards stack vertically in the main content area with consistent gap spacing

---

## 6. Data Tables

### Section header pattern
```
[Section Title]                              [Customize Columns ⚙]
[Optional one-line description]
[Date range badge]
[Optional toolbar: Sort chip  |  Search input]
```

- Section title: ~18px, medium weight
- **Customize Columns**: outlined button with settings/columns icon, right-aligned
- Toolbar controls (sort chip, inline search) sit below the title row, above the table

### Table structure
- Column headers: sortable header pattern — column name + `↑↓` sort icon; clicking cycles asc → desc → unsorted
- Row dividers: thin horizontal lines only — no background striping
- Row hover: subtle light highlight
- Content rows: ~14px body text

### Status indicator chips (in cells)
- Outlined pill style: 1px colored border, matching colored text, transparent fill, ~4px border-radius
- Non-interactive / display-only
- Use semantic color consistently across all reports:

| Semantic state | Color family |
|---|---|
| Positive / complete | Green |
| Active / in progress | Blue |
| Neutral / incomplete | Gray |
| Warning / overdue | Red–orange |

---

## 7. Saved Views — Library Page

A dedicated page (not a modal) for browsing and managing all saved report configurations.

### Structure
```
[Page Title]
[Page subtitle]

[Search input — full width]    [Type filter dropdown]    [+ Primary action btn]

[Sortable table]
  Name (with secondary ID text below) | Type ↑↓ | Created By ↑↓ | Last Updated ↑↓ | Description | Actions

[Showing X of Y — footer count]
```

- Search spans the majority of the toolbar width
- Type filter: dropdown for scoping results to a category
- Primary action: create/add button, right-aligned
- Each row: primary text (name) + small secondary metadata text below it
- **Row-level actions** (icon buttons, right-aligned): view, edit, duplicate, delete (delete uses a danger/red icon)

---

## 8. Apply Saved View Modal

Triggered from the page header. Allows the user to select and preview a saved report configuration before applying it.

### Layout
Two-panel modal:

```
┌──────────────────────────────────────────────────────────────┐
│ Select Saved View                                        [X]  │
│ [Subtitle]                                                    │
│ [Search input]  [Sort dropdown]                               │
├──────────────────────────────┬───────────────────────────────┤
│  [Scrollable card list]      │  [Preview panel]              │
│                              │                               │
│  ┌────────────────────────┐  │  Selected view name           │
│  │ View Name           ☆  │  │  Description                  │
│  │ Description...         │  │                               │
│  │ [chip] [chip] [chip]   │  │  [Filter detail sections]     │
│  └────────────────────────┘  │                               │
│  ...                         │  — or —                       │
│                              │  [Empty state: icon + text]   │
├──────────────────────────────┴───────────────────────────────┤
│                          [Cancel]   [✓ Apply Saved View]     │
└──────────────────────────────────────────────────────────────┘
```

### Card list (left panel)
- Each card: name (becomes blue + outlined border when selected), description, filter summary chips
- **Filter summary chips**: small colored pills summarizing the view's key parameters (date range, user scope, item scope); each chip type uses a distinct muted color
- **Favorite/star icon** (☆ / ★): top-right of card; favorited views float to the top of the list
- Selected card: blue border + name in primary blue

### Preview panel (right)
- Shows the selected view's name, description, and each filter parameter in labeled sub-sections
- Sub-sections use outlined inner cards
- Empty state: centered icon + "Select a saved view to preview"

### Footer
- Cancel (secondary), Apply (primary with checkmark icon) — right-aligned

---

## 9. Color & Typography

### Colors
| Role | Value |
|---|---|
| Primary (buttons, links, active states) | `var(--lumo-primary-color)` (~`#1a56db`) |
| Page background | `#ffffff` |
| Sidebar / panel background | `#f9fafb` |
| Dividers | `#e5e7eb` |
| Secondary / metadata text | `#6b7280` |
| Danger actions (delete) | Red — `var(--lumo-error-color)` |

Status indicator colors follow semantic conventions (green = positive, blue = active, gray = neutral, red–orange = warning) — exact hues should use the Vector theme tokens rather than hardcoded hex values.

Filter summary chip colors use muted tinted backgrounds (light blue, light purple, light green) paired with matching text — each chip type uses one consistent color across all reports.

### Typography scale
| Element | Size | Weight |
|---|---|---|
| Page title (h1) | ~28–32px | Semi-bold |
| Section titles | ~18px | Medium |
| Filter group labels | ~12–13px | Regular, gray, slightly letter-spaced |
| Body / table content | ~14px | Regular |
| Secondary / metadata | ~12–13px | Regular, gray |

---

## 10. Interaction Patterns

### Filter sidebar collapse
- `›` chevron collapses the sidebar; chevron flips to `‹` when collapsed
- Main content area smoothly expands to fill the vacated width
- Collapsed state: icon-only rail (no filter labels visible)

### Dirty state — unsaved filter changes
- A banner appears below the page header when the active filters differ from the applied/saved state
- Banner offers Quick Save, Save As New, and Discard actions inline
- A confirmation dialog appears if the user attempts to switch saved views with unsaved changes

### Loading / report generation
- "Apply Filters" button is disabled while a report is generating
- A meaningful progress indicator (not a generic spinner alone) communicates that work is happening
- Clear error state with an actionable message if generation fails

### Chart type toggle
- Segmented `vwc-toggle-button-group` with one option active at a time
- Active button: white background + visible border; inactive: transparent background
- Switching re-renders the chart in-place within the same card

### Status chips
- Display-only — not interactive
- Outlined pill: 1px border, colored text, transparent fill, ~4px radius, ~4px vertical / 8px horizontal padding

---

## 11. Component Mapping (Vector Web Components)

| UI Element | Component |
|---|---|
| Top navigation | `vwc-topnav` |
| Filter sidebar | `vwc-drawer` (`overlay: false`, `position: end`, `closable: false`) |
| Primary button | `vaadin-button theme="primary"` |
| Secondary button | `vaadin-button theme="secondary"` |
| Tertiary / outlined button | `vaadin-button theme="tertiary"` |
| Date range fields | Pair of `vaadin-date-picker theme="outlined"` |
| Checkbox group | `vaadin-checkbox-group` + `vaadin-checkbox` |
| Radio group | `vaadin-radio-group` + `vaadin-radio-button` |
| Boolean toggle | `vaadin-checkbox` (standalone) |
| Chart type toggle | `vwc-toggle-button-group` + `vwc-toggle-button` |
| Select [Item] modal | `vaadin-dialog` with JS renderer functions |
| Category tree (in modal) | `vwc-tree-list` |
| Data table | HTML `<table>` + `vwc-sortable-header` in `<th>` |
| Status / chip badges | Custom CSS `<span>` (no Vector component) |
| Content cards | `vwc-card theme="outlined padded"` |
| Search inputs | `vaadin-text-field theme="outlined"` |
| Section dividers | `vwc-divider` |
| Loading indicator | `vwc-spinner` |
| Notifications / banners | `vaadin-notification` |
