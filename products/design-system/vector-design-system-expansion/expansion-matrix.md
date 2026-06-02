# Design System Expansion Matrix

**Purpose.** This matrix translates the gap analysis ([gap-analysis.md](gap-analysis.md)) into atomic, executable rows for the Vector design-system team. Each row is a single variant, slot, prop, or composition that the system needs to support designs of the fidelity exercised in the v4 prototype.

**Framing.** The CheckIt v4 prototype is used as evidence — it's a real-world UI surface that exposed where Vector lacks depth. Rows are justified by the variant being a reasonable pattern, not by CheckIt requiring it. The matrix output is **horizontal expansion of the design system**, not a product backlog.

**Status.** This document contains a proof-of-concept slice covering the Badge / status pill family. Once the format is validated with a design-system stakeholder, the remaining ~50 rows will be added.

---

## Column schema

| Column | What it captures |
|---|---|
| **ID** | Stable identifier (e.g., `BADGE-V01`). Format: `<FAMILY>-<TYPE><number>` where TYPE is `V`ariant, `S`lot, `P`rop, `C`omposition, or `T`oken. |
| **Component family** | The primitive being extended (e.g., Badge, Drawer, Card). |
| **Capability** | The atomic addition. One row = one shippable thing. |
| **Class** | `A` misused existing · `B` missing variant · `C` genuinely missing. |
| **Effort** | T-shirt: **XS** (token/docs) · **S** (theme variant) · **M** (new slot/prop) · **L** (new sub-component) · **XL** (new composite). |
| **Evidence** | Concrete usages in the v4 prototype that exposed this gap. File paths + class names. |
| **Vector today** | What's currently available and what it falls short of. Cites Storybook directly. |
| **Acceptance criteria** | What "done" looks like. Pre-drafted starting point — the design-system team will refine. |
| **Dependencies** | Other matrix rows or decisions that block this one (or that this one unblocks). |
| **Verification** | Where the gap was confirmed (Storybook chunk path, reference doc, or "needs DS review"). |

---

## Family: Badge / status pill

The single highest-reuse family in the audit. `vaadin-badge` ships 8 theme variants and is applied attribute-style on a host element (`<span theme="badge ...">`). The prototype distinguishes ~13 semantic states and uses leading icons + dot indicators that don't ship today.

### Summary table

| ID | Capability | Class | Effort | One-line |
|---|---|---|---|---|
| [BADGE-V01](#badge-v01) | Semantic theme: `in-progress` | B | S | Active workflows, in-flight checks, ongoing transfers |
| [BADGE-V02](#badge-v02) | Semantic theme: `draft` | B | S | Draft/unpublished content distinct from `neutral` |
| [BADGE-V03](#badge-v03) | Semantic theme: `info` | B | S | Distinct from `primary` — informational rather than promotional |
| [BADGE-V04](#badge-v04) | Semantic theme: `warning` (filled + soft) | B | S | Aligns with `vaadin-button` warning theme; currently no warning badge |
| [BADGE-V05](#badge-v05) | Semantic theme: `muted` / `archived` | B | S | Distinguishes inactive/archived from neutral default |
| [BADGE-S01](#badge-s01) | Leading icon slot | B | M | ~80% of prototype status pills lead with an icon |
| [BADGE-V06](#badge-v06) | Dot variant (small unread/status indicator) | B | S | `theme="dot"` — 8×8 colored circle, no text |
| [BADGE-C01](#badge-c01) | Anchor recipe (badge positioned on host element) | A | XS | Notification dot on bell icon — documented recipe, not a new feature |
| [BADGE-D01](#badge-d01) | Migration guide: existing 8 themes mapped to common semantic names | A | XS | Education — `.status-pill.ok` → `theme="badge success"` etc. |

---

### Row details

#### BADGE-V01 {#badge-v01}

| Field | Value |
|---|---|
| **ID** | `BADGE-V01` |
| **Family** | Badge |
| **Capability** | Semantic theme: `in-progress` (filled + soft variants, matching the `success`/`error`/`contrast` pattern) |
| **Class** | B — missing variant |
| **Effort** | S |
| **Evidence** | `_shell.css:704` `.status-pill.info`; ceremony-fire-rig-check.html ("Rig Check — In Progress"); checklists.html (active ceremonies); transfer-workspace.html (transfer in progress). Used in any UI surface that shows a process running. |
| **Vector today** | `theme="badge primary"` is closest but reads as a promotional/primary state, not a temporal "currently running" state. Verified in Storybook `Badge.stories` argTypes — only 8 themes documented; no `in-progress`. |
| **Acceptance criteria** | • `theme="badge in-progress"` (soft fill, blue family) and `theme="badge in-progress primary"` (saturated fill) ship • Default uses `--lumo-primary-color-10pct` background + `--lumo-primary-text-color` text • Dark-mode token coverage verified • WCAG 2.2 AA contrast in both themes • Tokens exposed as `--vwc-badge-in-progress-background-color` and `--vwc-badge-in-progress-text-color` for downstream override |
| **Dependencies** | None. Unblocks [BADGE-D01](#badge-d01) (migration guide). |
| **Verification** | Storybook chunk `/assets/Badge.stories-CmVhjJK1.js` argTypes; gap analysis row #1. |

#### BADGE-V02 {#badge-v02}

| Field | Value |
|---|---|
| **ID** | `BADGE-V02` |
| **Family** | Badge |
| **Capability** | Semantic theme: `draft` (distinct from `neutral` — implies in-progress authoring, not just absence of state) |
| **Class** | B |
| **Effort** | S |
| **Evidence** | `_shell.css` `.cl-status-pill.draft`, `.editor-status-pill.draft`; checklist-builder.html, template-builder.html, block-creator.html — every authoring UI distinguishes "Draft" from "Published" or "Active." |
| **Vector today** | `theme="badge"` (neutral) reads as absence of state; doesn't communicate "actively being edited." Currently teams style `.draft` with bespoke CSS. |
| **Acceptance criteria** | • `theme="badge draft"` ships with dashed or distinctly-styled border to communicate authoring state • Dark-mode + light-mode visual distinct from `theme="badge"` • Documented pairing convention: `draft` on author surfaces, `archived` on read-only history surfaces |
| **Dependencies** | None. |
| **Verification** | Storybook `Badge.stories` argTypes lacks `draft`. |

#### BADGE-V03 {#badge-v03}

| Field | Value |
|---|---|
| **ID** | `BADGE-V03` |
| **Family** | Badge |
| **Capability** | Semantic theme: `info` (distinct from `primary` — informational/advisory rather than promotional) |
| **Class** | B |
| **Effort** | S |
| **Evidence** | `_shell.css:705` `.status-pill.info`; 12+ usages across readiness.html, compliance.html, analytics.html. Used for advisory states like "Pending Review," "Awaiting Approval." |
| **Vector today** | `theme="badge primary"` is overloaded — same theme used for promotional CTAs and informational states. Splitting communicates intent. Mirrors `vaadin-notification`'s split between `primary` and other themes. |
| **Acceptance criteria** | • `theme="badge info"` + `theme="badge info primary"` ship • Distinct hue family from `primary` (typically blue→cyan or indigo shift) to be visually distinguishable when both appear on the same surface • Aligns with `vaadin-notification theme="primary"` vs `theme="contrast"` precedent |
| **Dependencies** | None. |
| **Verification** | Storybook `Badge.stories` argTypes; `Notification.stories` (which does have semantic themes that Badge could mirror). |

#### BADGE-V04 {#badge-v04}

| Field | Value |
|---|---|
| **ID** | `BADGE-V04` |
| **Family** | Badge |
| **Capability** | Semantic theme: `warning` (soft + filled), aligning with `vaadin-button`'s existing warning theme and `vaadin-notification theme="warning"` |
| **Class** | B |
| **Effort** | S |
| **Evidence** | `_shell.css:706` `.status-pill.warn`; high reuse in compliance.html, maintenance.html, readiness.html. Distinct from `error` — "attention needed" not "broken." |
| **Vector today** | **Notable inconsistency:** `vaadin-button` ships `theme="warning primary"`, `vaadin-notification` ships `theme="warning"`, but `vaadin-badge` does not document a warning theme. Closing this is also an internal-consistency fix for the design system, not just a CheckIt-driven add. |
| **Acceptance criteria** | • `theme="badge warning"` + `theme="badge warning primary"` ship • Uses existing `--lumo-warning-color*` tokens (no new tokens needed) • Visual parity with `vaadin-button theme="warning primary"` • Verified against existing dark/light theme matrix |
| **Dependencies** | None. Closes a cross-component consistency gap. |
| **Verification** | Storybook `Badge.stories` argTypes confirms absence; `Button.stories` confirms warning ships there. |

#### BADGE-V05 {#badge-v05}

| Field | Value |
|---|---|
| **ID** | `BADGE-V05` |
| **Family** | Badge |
| **Capability** | Semantic theme: `muted` / `archived` (visually de-emphasized, distinct from active neutral) |
| **Class** | B |
| **Effort** | S |
| **Evidence** | `_shell.css` `.status-pill.muted`; usage on archived items, retired assets (assets.html retired filter), past ceremonies. Communicates "this exists but is no longer live." |
| **Vector today** | `theme="badge"` is the closest but conflates "no status" with "deliberately archived." Reduces information density on list pages where both states co-exist. |
| **Acceptance criteria** | • `theme="badge muted"` ships with reduced contrast / lower opacity treatment • Documented pairing convention: `muted` for archived/retired, `theme="badge"` for unset/no-status |
| **Dependencies** | None. |
| **Verification** | Storybook `Badge.stories` argTypes. |

#### BADGE-S01 {#badge-s01}

| Field | Value |
|---|---|
| **ID** | `BADGE-S01` |
| **Family** | Badge |
| **Capability** | Leading icon slot — formal support for an icon (Font Awesome `<i>` or `<vwc-icon>`) inline before the badge text |
| **Class** | B — missing slot |
| **Effort** | M |
| **Evidence** | Estimated 80%+ of prototype status pills lead with an icon. Examples: `<span class="cl-status-pill active"><i class="fa-solid fa-circle" style="font-size:6px;"></i> Active</span>`. Used to encode redundant non-color information per a11y. Files: checklist-detail.html, ceremony-fire-rig-check.html, readiness.html, many others. |
| **Vector today** | Badge is attribute-only on a host element — there's no documented icon slot. Teams insert `<i>` tags manually and tune sizing/spacing per usage, leading to drift. |
| **Acceptance criteria** | • Documented recipe + canonical spacing tokens for leading icon inside `theme="badge"` host • Icon size auto-scales with badge size (no manual `style="font-size:..."`) • Works with both Font Awesome `<i>` and `<vwc-icon>` • Recipe shows how to communicate non-color information for a11y (icon + text + color) |
| **Dependencies** | None. Pairs naturally with [BADGE-V06](#badge-v06) (dot variant — icon slot replaces the manual `fa-circle 6px` hack). |
| **Verification** | Storybook `BadgeDocs` confirms no slot documentation; `Badge.stories` render template shows text-only. |

#### BADGE-V06 {#badge-v06}

| Field | Value |
|---|---|
| **ID** | `BADGE-V06` |
| **Family** | Badge |
| **Capability** | Dot variant: `theme="badge dot"` — small colored circle with no text or a single-character count |
| **Class** | B |
| **Effort** | S |
| **Evidence** | `.notif-badge`, `.widget-count-badge`, `.unprocessed-count-badge` across analytics.html, checklist-detail.html, personnel-detail.html. Notification bells, unread counts, status dots on icon-only buttons. |
| **Vector today** | `theme="badge"` + `pill` attribute gets close but doesn't support the 8×8-no-text indicator pattern. Teams build it with manual absolute positioning + CSS. |
| **Acceptance criteria** | • `theme="badge dot"` ships — 8×8 (or token-sized) colored circle, no padding • Combines with semantic themes: `theme="badge dot error"`, `theme="badge dot success"`, etc. • Supports single-character count overflow: `9+` for >9 |
| **Dependencies** | Often used with [BADGE-C01](#badge-c01) (anchor recipe). |
| **Verification** | Storybook `Badge.stories` argTypes lacks `dot`. |

#### BADGE-C01 {#badge-c01}

| Field | Value |
|---|---|
| **ID** | `BADGE-C01` |
| **Family** | Badge |
| **Capability** | **Composition recipe (documentation, not code):** anchoring a badge to a host element (e.g., a notification dot on an icon button) |
| **Class** | A — misused existing |
| **Effort** | XS |
| **Evidence** | `.notif-badge` pattern across many pages — `position: absolute; top: 2px; right: 2px;` on a parent button with `position: relative`. Each team rebuilds the positioning logic from scratch. |
| **Vector today** | All the parts exist (badge, CSS positioning), but there's no documented "badge-on-host" recipe. This is an education gap, not a missing primitive. |
| **Acceptance criteria** | • Storybook docs page with the canonical anchor recipe • Shows: dot anchor on icon button, count anchor on tab, count anchor on avatar • Code snippet with the `position: relative` parent + `position: absolute` badge convention • Probably documented as a Design Pattern in `Design Patterns/Examples/Badge Anchor` (paralleling Selection List) |
| **Dependencies** | Most useful after [BADGE-V06](#badge-v06) (dot variant) ships. |
| **Verification** | Storybook stories index — no anchor recipe exists today. |

#### BADGE-D01 {#badge-d01}

| Field | Value |
|---|---|
| **ID** | `BADGE-D01` |
| **Family** | Badge |
| **Capability** | **Migration guide:** map existing 8 themes to common product-vocabulary semantic names |
| **Class** | A |
| **Effort** | XS |
| **Evidence** | The Pass D audit revealed `vaadin-badge` already ships 8 themes but the prototype reinvents most of them. Misuse driven by the theme strings not being discoverable. Same finding led to ~6 reclassifications across the gap analysis. |
| **Vector today** | 8 themes ship and are documented in Storybook's `Badge.stories`. There's no "if you want X semantic, use Y theme string" lookup table. Teams reinvent. |
| **Acceptance criteria** | • Documented mapping table in `BadgeDocs.mdx`: `success` → "completed / valid / ok", `error` → "failed / critical / broken", `contrast` → "neutral / unset", `primary` → "promotional / featured" • Mapping covers the most common product semantics teams reach for • Cross-linked from the (eventual) status-pill cheat sheet for consuming products |
| **Dependencies** | Builds on [BADGE-V01](#badge-v01)–[BADGE-V05](#badge-v05) once those ship — the table grows to cover the new themes. |
| **Verification** | Storybook `BadgeDocs-CRKpjoPF.js`. |

---

## How this scales to the full matrix

If this slice format works, the remaining families fan out into approximately:

| Family | Atomic rows (est.) | Notes |
|---|---|---|
| **Button** (semantic icon variant docs, recipe for filled icon button) | 3-4 | Mostly (A) education; success/error/warning already ship per Pass D. |
| **Tab** (count-badge slot, mobile-bottom theme) | 2-3 | (B) variant work. |
| **Card** (KPI/metric composition, detail-header composition) | 2-3 | (B) compositions; primitives exist. |
| **Drawer** (handle slot for bottom-position sheets) | 1-2 | (B); position="bottom" already ships per Pass D. |
| **Sidenav** (token-discovery docs, accordion group docs) | 2 | (A) education — feature ships, just undiscoverable. |
| **Popover** (menu-recipe-docs, named composition with `vwc-item`) | 2 | (A) education. |
| **TextField** (prefix-slot search recipe, voice-input trailing slot) | 2-3 | (B); suffix-slot recipe ships, prefix doesn't. |
| **Empty State** (net-new primitive) | 1 (L) + acceptance bullets | (C) — only true net-new. |
| **Chip** (toggleable, dismissible, icon-leading) | 3-4 | (B) — could be theme on toggle-button or new primitive. |
| **Field** (label/value read-only display) | 1-2 | (A) `vaadin-form-item` covers it; documentation gap. |
| **Entity Panel composite** (slide-over with header + facts + alerts + related + lifecycle) | 7-9 sub-rows | (C) composite — biggest scope conversation; each sub-pattern is its own row. |
| **Theme** (glass aesthetic, role-color palette, dark-mode coverage) | 3-5 | (C) — additive Vector theme layer. |
| **Migration / discovery docs** (cross-component cheat sheet for product teams) | 3-4 | (A) — single output that resolves many education gaps at once. |

**Estimated total: 35-50 atomic rows**, with effort skewing heavily toward S (theme variants) and XS (docs).

---

## What to do with this slice

1. **Validate the column schema.** Anything missing? Anything redundant? The matrix has to be sortable and filterable for the design-system team to use it without re-reading the gap analysis.
2. **Validate the row granularity.** Is one row per theme too atomic, or just right? Should `BADGE-V01` through `V05` collapse to a single "Add 5 semantic themes" row, or stay split?
3. **Validate the acceptance-criteria depth.** Too detailed? Too vague? The design-system team will rewrite, but the starting depth should be calibrated for what's useful as a starting point vs. wasted ink.
4. **Validate the evidence citations.** Are file paths + class names the right level of proof, or should each row link to a screenshot / live render in the gallery?
5. **Pick the next family to atomize.** Likely candidates: Card (KPI + detail-header are widely reused) or Empty State (the only true (C) net-new in Tier 1).

Once two or three slices are validated, the rest of the matrix can be filled out in a single batched pass without re-litigating the format.
