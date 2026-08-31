# Prioritization Settings — Functional Description & Redesign Brief

**For:** Claude Design, as input for exploring simple / advanced layout variants
**Prototype:** https://vectorlearning.github.io/ux-mockups/products/Keystone%20Department%20Hub/keystone-hub/ver1/prioritization-settings.html
**Product:** Readiness Hub (Vector Solutions) — the cross-product department landing for fire/EMS leaders
**Source files:** `products/Keystone Department Hub/keystone-hub/ver1/prioritization-settings.html` + `prioritization.js` (markup/logic), `data.js` (task registry), `keystone-shared.js` (band resolution shared with the task list)

> Note on files: an older React/JSX iteration of this same page also exists in the repo at
> `products/Keystone Department Hub/project/Prioritization Settings.html`. Ignore it. The URL above is
> canonical — it is rebuilt on Vector Web Components, defaults to four named bands instead of three, and
> shows band **names** rather than raw scores in the preview. Where the two disagree, the URL wins.

---

## 1. What this page is for

The Readiness Hub pulls open work out of five separate Vector products — **TargetSolutions** (training),
**Check It** (inspections), **Guardian Tracking** (documentation), **Vector Scheduling**, and
**Evaluations +** — and presents it as one task list. Because the items come from five systems with five
different notions of "urgent," the Hub computes its own **priority ranking** so a single sorted list is
meaningful.

This page is the admin surface for that ranking. It answers one question: *given everything on our plate,
what should the department look at first?*

Everything on it is **department-wide** — there is no per-station, per-shift, or per-role variant of the
configuration. Changes take effect immediately for every user in the department once saved.

### Where it sits
- Reached from a small **gear icon in the task-list header on the Hub dashboard**, visible only to roles
  flagged `admin` (in the prototype: **Chief** and **Training Officer**). Line firefighters and company
  officers never see it.
- Has a "Back to Hub" breadcrumb at the top; otherwise renders as an embedded settings surface with no
  nav chrome of its own.

### What the rest of the product does with the output
- Every task row and task card in the Hub shows a **coloured band pill** — "Critical," "High," etc. The
  band name is the *only* thing end users see. **The underlying numeric score is never surfaced outside
  this settings page.** That is deliberate: line staff should read a label, not do arithmetic.
- The task list's **default sort is by priority score** (descending), and priority is one of the
  filter facets.
- The band colour ramp is rank-based, so the top band is always the hottest colour and the floor is
  always the calmest, regardless of how many bands exist.

---

## 2. The scoring model (the thing being configured)

Every open task is scored 0–100 by a weighted blend of three signals:

```
score = W_time × time_weight + W_importance × type_importance + W_effort × effort
```

- All three signals are normalised **0–1**; the weights are **percentages that must total 100**, so the
  result lands in 0–100.
- The score is then mapped to a **named priority band** by cutoff.
- Defaults: `time 50% / importance 40% / effort 10%`.

**The three signals:**

| Signal | Where it comes from | Admin-configurable? |
|---|---|---|
| **Time pressure** | How far the task is from its due date, bucketed into tiers. Tasks with **no** due date (Guardian Tracking and Evaluations + items) fall through to an **SLA clock** based on how many days the item has been open. | Yes — tier thresholds and tier weights |
| **Type importance** | A baseline per **task type** (13 types across the 5 products), set as a **1–5 named level** and translated to the back end's 1–100 scale at 20-point steps | Yes — one slider per type |
| **Effort** | A per-task 0–1 value that ships with the task data | **No** — only its weight is adjustable |

⚠️ **"Effort" is undefined in the UI.** The page never says whether a high effort value means "big lift"
or "quick win," and the data is ambiguous (a PTO approval is 1.0; a daily apparatus check is 0.2 — which
reads as *higher = smaller lift, so nudge it up*, but long training courses sit at 0.6–0.8 and break the
pattern). An admin has a slider for a signal they cannot inspect, define, or change. Treat this as a
known problem, not a thing to preserve faithfully.

---

## 3. Complete control inventory

### 3.1 Layout as it stands today

Two columns:

- **Left (main):** page title "Prioritization" + intro paragraph → **Task-type importance** card (always
  visible) → **Advanced settings** disclosure (collapsed by default) containing three sub-cards.
- **Right (380px rail):** **Live preview** card that *floats* — a rAF loop eases its vertical position
  toward ~42% of the viewport height so it drifts alongside whatever the admin is editing. Collapses
  below the main column under 1100px.
- **Bottom:** sticky toolbar — dirty/saved status, "Reset to defaults," "Save changes."

So there *is* already a basic/advanced split. The feedback is that **the basic half is still too much**.

### 3.2 Basic (always visible) — Task-type importance

A table of **13 task types**, grouped into five sections by source product, each row being:
`[product-coloured icon] [type name] [1–5 slider with tick digits] [level + name readout] [timing-override button]`

The five levels are **1 Minimal · 2 Low · 3 Moderate · 4 High · 5 Critical**, stated once as a scale key
at the top of the card and repeated per row as tick digits beneath each slider.

| Source product | Task type | Default level | Back-end value |
|---|---|---|---|
| TargetSolutions | Mandatory Training | 5 Critical | 100 |
| TargetSolutions | Elective Course | 2 Low | 40 |
| TargetSolutions | Credential Renewal | 5 Critical | 100 |
| Check It | Vehicle Inspection | 5 Critical | 100 |
| Check It | Equipment Inspection | 4 High | 80 |
| Check It | PPE Inspection | 5 Critical | 100 |
| Check It | Outstanding Ticket | 4 High | 80 |
| Guardian Tracking | Document Approval | 3 Moderate | 60 |
| Guardian Tracking | Flag Review | 4 High | 80 |
| Vector Scheduling | Open Shift | 5 Critical | 100 |
| Vector Scheduling | PTO / Leave Request | 2 Low | 40 |
| Vector Scheduling | Shift Confirmation | 2 Low | 40 |
| Evaluations + | Evaluation Signature | 4 High | 80 |

- Slider is **1–5, step 1**, snapping to five detented stops; stored internally as 0–1 (level ÷ 5), which
  is the back end's 1–100 importance at 20-point steps. **The back end still supports the full 1–100
  range — this is a front-end simplification only.** Any value saved by the earlier 0–100 UI loads fine:
  it is rounded to the nearest stop on read, which is why the registry's old free-form defaults (95, 85,
  75, 70) now land on 100, 80, 80 and 80 above.
- Because the level is quantized on load as well as on change, two types shown at the same level always
  score identically — the readout never implies a difference the score doesn't have.
- Live: dragging updates the readout and re-sorts the preview rail with no page re-render.
- **Intent:** the one judgement call that is genuinely departmental policy. A mandatory NFPA training
  *is* more important than a shift confirmation, and only the department can say by how much.
- **The friction (largely addressed).** The original design used 13 sliders on a 0–100 scale with no
  anchors: no guidance on what 70 meant versus 85, no way to say "these two matter equally," and no
  notion of just ordering them — a small-town chief was being asked to produce 13 calibrated numbers as
  their *first* interaction with the page. User testing confirmed the cognitive load, and the scale was
  cut to five named levels. What remains open is that it is still **13 separate judgements**, and there
  is still no "these two are equal" or pure-ordering affordance — the levels just make ties easy to
  express, since two types set to *High* are now genuinely identical.

**Per-row timing override button** (the small icon at the end of each row). Opens an inline panel under
that row containing a *full copy* of the time-pressure tier table **plus** an SLA fall-through table,
scoped to that one task type. Buttons on rows with an active override are amber-tinted, and each panel
carries "Reset to department default."

The **SLA fall-through** table is what governs tasks with **no due date** (Guardian Tracking and
Evaluations + items), scored off days-open instead:

| State | After | Weight (0–1) |
|---|---|---|
| At risk | 3 days | 0.70 |
| Past SLA | 5 days | 1.00 |

Anything newer than the at-risk threshold gets a **hard-coded 0.30** that is not exposed anywhere in
the UI. And note: **SLA appears only inside these per-type panels.** There is no department-level SLA
control — a department that wants to change its baseline SLA has to open all 13 task types and override
each one individually.

- **Intent:** real exceptions exist — an ARFF check that is overdue by an hour is not the same kind of
  late as a PTO request overdue by an hour.
- **The friction:** this is the single most complex control on the page and it lives in the *basic*
  section, one click from every row — 14 additional numeric knobs per task type, ×13 types.

### 3.3 Advanced settings (collapsed disclosure; open/closed state persists per browser)

Summary line reads: *"Advanced settings — Score weights · Time-pressure tiers · Priority bands."*

**(a) Score weights** — three linked sliders (Time pressure / Type importance / Effort), 0–100 step 5.
Dragging one **proportionally rebalances the other two** so the total stays at 100; rounding drift is
absorbed into the last slider. A live formula chip below restates the equation with the current numbers
and a footnote clarifying that end users see the band name only. The rebalance math keeps the total
pinned at 100, and a validation rule blocks **Save** with an inline error if it ever isn't.

**(b) Time-pressure tiers** — the department default curve, as a 4-row table:

| Window | Threshold | Weight (0–1) |
|---|---|---|
| Overdue | *past due* (fixed) | 1.00 |
| Due within | 24 **hrs** ⇄ **days** toggle | 0.85 |
| Due within | 7 **days** ⇄ **hrs** toggle | 0.60 |
| Beyond | *everything else* (fixed) | 0.25 |

The hrs/days toggle **converts the stored value** on switch (24 hrs ⇄ 1 day) so toggling units never
silently changes the meaning. Weights are 0–1, step 0.05.

**(c) Priority bands** — **2 to 5** named buckets, each an editable name + a cutoff score. Rows are
sorted by cutoff descending and colour-mapped by *rank*. The lowest band is a fixed floor at 0 (shown as
"floor," no input). Each row shows its computed range ("70 – 84", "below 40"). Add/remove supported
within the 2–5 limit. Shipped default:

| Band | Cutoff |
|---|---|
| Critical | ≥ 85 |
| High | ≥ 70 |
| Medium | ≥ 40 |
| Low | floor (0) |

Validation: cutoffs must strictly decrease and the floor must be 0, otherwise an inline error shows and
**Save is blocked**.

- **Intent:** bands are the *only* part of this configuration end users actually see, so departments get
  to use their own vocabulary and their own number of tiers. Critical sits at 85 so it reads as a genuine
  exception tier rather than a synonym for High.

### 3.4 Live preview rail

- **Tab 1, "Task types"** (default, always available): all 13 types ranked by the score a *typical
  pending item* of that type would receive — the type's configured importance, its effective
  "due within a week" time weight, and a neutral 0.5 effort. Each row shows the type icon, name, its
  resolved **band pill**, and `importance N Name · N active` (e.g. `importance 4 High · 3 active`). Footer: *"N task types ranked. **X** sits
  highest under this scheme."* Reacts instantly to any edit on the left.
- **Tab 2, "Individual tasks"** (only present when the prototype's "Future functionality" flag is on):
  eight representative real tasks re-scored and re-ranked, each showing its band pill and its
  due/overdue/SLA state. Footer reports *"N active tasks would be reranked; **X** land in <top band>."*
- **Intent:** never make an admin save and go look. And deliberately lead with **types, not tickets** —
  a chief reasons in categories ("inspections before paperwork"), not individual rows.

### 3.5 Save model
- Sticky bottom toolbar. Status shows *"Last edited by Chief Smith · 12 days ago"* at rest, a pulsing
  *"Unsaved changes"* while dirty, and *"Saved 3:42 PM"* after a save.
- **Save changes** is disabled unless the config is both **dirty and valid** (weights = 100, bands
  well-formed). Saving fires a toast: *"Prioritization saved — every open task has been re-scored
  department-wide."*
- **Reset to defaults** restores the shipped configuration wholesale, with no confirmation step.
- Persisted to `localStorage` under one key; the Hub's task list reads the same key, so band names and
  colours change everywhere immediately.
- No preview-before-publish, no versioning, no audit trail, no undo beyond full reset.

### 3.6 Prototype-only chrome (not product)
A floating FAB in the corner switches demo role and toggles the "Future functionality" flag. It is
scaffolding for design review, not part of the design.

---

## 4. The problem to solve

**The complexity budget is roughly 215 discrete controls** — 13 importance sliders, 3 weight sliders,
8 tier controls, ~11 band controls, and up to 182 more inside the per-type override panels. Almost all
of them require the admin to have an opinion about a **decimal weight between 0 and 1** or an **arbitrary
integer between 0 and 100** — the 13 importance sliders being the exception, now that they ask for one of
**five named levels** instead.

The current split assumes the hard part is weights, tiers, and bands, and that per-type importance is
the easy, obvious part. **User feedback says that assumption is wrong.** Consider the intended user:

> The fire chief of a small-town department — possibly volunteer, possibly wearing four other hats. They
> have a few dozen people, a handful of apparatus, and about ten minutes of patience for a settings
> screen. They do not want to tune a scoring model. They want their inspections and mandatory training
> to come up first, and they want to trust the list.

For that person, even the "basic" view is a modelling exercise. Moving importance to five named levels
removes the worst of it — they no longer have to choose 85 over 70 — but they still have no reason to
believe their guesses beat the defaults, and no way to express what they actually think, which is usually
something closer to *"safety and compliance first, paperwork last"* or *"just don't let anything go past
due."*

Meanwhile the setting genuinely needs to stay deep for the other end of the market — a metro department
with a dedicated training officer, real SLAs, and a documented policy on what "Critical" means.

### What we want explored
Layout and progressive-disclosure variants for a **simple view and an advanced view**, thinking through:

1. **What belongs in simple at all?** Plausibly nothing numeric. Is the honest simple view a *choice
   among named presets* ("Compliance-first," "Deadline-driven," "Balanced") plus a preview? Is it a
   ranked drag-to-order list of task types with no numbers? Is it a handful of plain-language questions?
2. **Where do per-type overrides go?** They are almost certainly advanced, but the entry point currently
   sits on every basic row.
3. **How does someone move between the two views** without feeling punished, and what happens to their
   simple-view choices when they go advanced (and back)?
4. **Can the preview carry more of the load?** Today it confirms; it could *teach* — showing what
   changed, or letting the admin correct the preview directly and have the settings follow.
5. **Does the numeric model need to be visible at all in simple mode?** The formula chip, 0–1 weights,
   and 0–100 cutoffs are implementation truths, not user concepts.
6. **Is the two-column floating-preview layout right** for a short simple view, or does simple want a
   different shape entirely (single column, wizard, one card)?

### Constraints to respect
- The output must still resolve to **named bands**, because that is the contract with the task list.
- End users never see the numeric score. Whatever simple mode does, it must produce a valid band mapping.
- Configuration is **department-wide**; do not invent per-station or per-role scoping.
- Nothing may be saveable in an invalid state (weights totalling 100, cutoffs strictly decreasing,
  floor at 0), though simple mode could make invalid states unreachable by construction.
- Advanced must remain able to express **everything** the current page can express — this is a
  presentation problem, not a feature-reduction problem.
- Vector Web Components + the Readiness Hub's visual language (Open Sans, Arvo numerals, paper-textured
  surfaces, amber / coral / teal accents, Material-3 elevation).

### Known gaps worth fixing along the way
- **"Effort" is unexplained and unadjustable.** Either define it, expose it, or drop it from the
  admin-facing model.
- ~~**No anchors on the 0–100 importance scale.**~~ **Resolved** — importance is now a 1–5 scale with
  named levels (Minimal → Critical) and a scale key on the card. The original problem was that nothing
  told an admin what a number meant or how two types compared beyond reading them side by side.
- **"Reset to defaults" is instant and total**, with no confirmation and no undo.
- **No sense of blast radius before saving.** The type preview is abstract ("a typical pending item");
  the concrete "N tasks would be reranked" number is hidden behind a feature flag.
- **The per-type override panel duplicates the entire advanced tier table inline**, so the deepest
  control on the page is also the most repeated.
- **There is no department-level SLA setting**, only per-type overrides — so the most common SLA change
  is also the most laborious one (13 identical edits).
- **A magic 0.30 weight** is applied to no-due-date tasks inside their SLA window, invisibly and
  unconfigurably.
