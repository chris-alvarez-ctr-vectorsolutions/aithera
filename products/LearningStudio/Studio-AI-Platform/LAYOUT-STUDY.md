# Bringing the card-list / detail pattern into the platform

> A study, not a decision. Records what the scenario-editor reference does,
> what our nesting makes different, and three options with their costs.
> Nothing here is built. **Visual styling and theming are explicitly out of
> scope** (user, 2026-09-29) — this is about layout structure only.

Reference: `products/LearningStudio/Studio-AI-Platform/scenario-editor/ver2/`
(V2 is the developed one; V1 is an earlier cut.)

---

## What the reference actually does

Three columns, and the middle one is the move:

```
┌──┬────────────────────┬──────────────────────────┬──────────────┐
│  │  LIST (339px)      │  DETAIL (880px)          │  REHEARSAL   │
│ic│  grouped cards     │  the selected item ONLY  │  (appears on │
│on│  · The world   1   │                          │   Interaction│
│  │  · Canon       1   │  one card, its fields    │   only)      │
│ra│  · Cast        3   │  grouped into sub-cards  │              │
│il│  · The coach   1   │                          │              │
└──┴────────────────────┴──────────────────────────┴──────────────┘
```

**Four properties worth naming, because they are separable — we could take
any subset:**

1. **The list is a summary, not an index.** A cast card carries name, role,
   a description line, and live counts: `3 guardrails · 0 known facts`. A step
   card carries `Roleplay · 2 turns · 3 levels`. You can audit the shape of the
   whole stage without opening anything.

2. **Selection SWAPS the detail pane.** Clicking Jake replaces the pane with
   Jake's fields. It does not scroll to him. Measured: `.surface-inner` is the
   same DOM node before and after, re-rendered.

3. **The lede follows the selection, the title does not.** The stage title
   stays `Situation & World`; the sub-line changes from *"The world — what the
   learner is shown before anything starts"* to *"Cast — everyone who can
   appear in a scene."* The reader always knows which **group** they are in
   without losing the stage.

4. **Semantic grouping inside the list.** Not a flat list of six things:
   four labelled groups with counts. The groups are content kinds, not
   pagination.

---

## Why it is not 1-to-1 for us

Their document is **flat**: a scenario has phases, and a phase has items.
Two levels, and the editor spends both on screen at once.

Ours is **nested four deep before a field**:

```
layer (information · activities · outputs)   ← icon rail
  └─ activity (this scenario)                ← opened from a card
       └─ stage (6: Framing … Close)         ← stage rail
            └─ step (3, on Interaction only) ← sub-list inside the stage rail
                 └─ fields
```

So a straight port would add a **fifth** column, or collapse a level we use.
That is the real design problem, and it is why this is a study rather than a
patch.

### What we already have, and what we don't

| | Reference | Ours today |
|---|---|---|
| Stage navigation | icon rail, 4 stages | stage rail, 6 stages ✅ |
| Item list per stage | **grouped summary cards** | ❌ — cards are the content itself |
| Item list metadata | counts, mode, status dot | ❌ |
| Selection behaviour | swaps the detail pane | ❌ — one long scroll |
| Step list | cards with mode/turns/levels | ⚠️ plain text rows, nested in the stage rail |
| Detail pane | one item, sub-grouped | ⚠️ all items stacked |
| Rehearsal | 4th column on one stage | ✅ same idea, already built |

**Measured, at a 1600px viewport:**

- Our stage pages run **555–1165px tall** as a single scroll (Coverage 1165,
  Close 1105, World 1071). 1–4 cards each.
- Their list column is **339px**; the detail pane **880px**; a list card
  **315×105px**.
- Our stage rail is **360px**, main column **755px**.

The Coverage and Close stages are the ones that hurt: a 1165px scroll where
every point's card is fully expanded, when what an author usually wants is
*which points are short* — exactly the question a summary list answers at a
glance.

---

## Three options

### A · List-detail inside the stage, replacing the long scroll

The direct port. The stage's cards become summary cards in a list column;
selecting one fills a detail pane beside it.

```
stage rail │ item list │ detail
   (360)   │   (300)   │  (~400 at 1600px)
```

**Cost:** three columns *inside* the activity, plus the icon rail and chat
rail outside it — five vertical zones. The layout pass that produced the
current widths was fought over exactly this (`MODALITIES.md`, *Layout —
measured, then fixed*): four zones was already too many, and the fix was to
collapse the stage rail. This adds one back.

**Where it breaks:** Interaction already spends its width on editor +
rehearsal side by side, which the user required stay side by side. There is
no room for a third column there, so Interaction would need a different rule
from every other stage — the inconsistency the collapsible-rail decision
explicitly rejected.

### B · Summary cards that expand in place (no new column)

Keep one content column. Cards render **collapsed** — title, summary line,
metadata chips, status dot — and expand inline when selected. One open at a
time, accordion-style.

```
stage rail │ content column
   (360)   │   (755)
           │  ┌─ Setting        · 1 line  ● ─┐  collapsed
           │  ├─ Cast           · 2 chars ● ─┤  collapsed
           │  ├─ Canon          · 6 facts ● ─┤  ← OPEN, fields visible
           │  └─ Misconceptions · 0       ○ ─┘  collapsed
```

**Gets:** properties 1 and 4 (summary cards, semantic grouping) and most of 2
(one thing open at a time). Loses property 3's spatial persistence — you
scroll rather than scan a fixed list.

**Cost:** nearly none structurally. No new zone, no per-stage exception,
Interaction unaffected. Coverage goes from 1165px to roughly one screen.

**Precedent:** the video surface already does exactly this — scene cards are
an accordion where the open card is the scene the canvas shows. So this is
consistent with a pattern the platform already uses, not a new one.

### C · Summary cards in the stage rail, detail in the content column

Push the list into the **existing** stage rail as a second level — which is
where the step list already lives (`.sai-ph-sec`). Upgrade those thin text
rows into real summary cards, and use the same mechanism for every stage's
items, not just Interaction's steps.

```
stage rail (360, wider when open) │ content column (755)
  1 Framing                        │  the selected item's fields
  2 Situation & world              │
      ▸ Setting      1 line    ●   │
      ▸ Cast         2 chars   ●   │
      ▸ Canon        6 facts   ●   │
  3 Coverage                       │
```

**Gets:** all four properties, with **no new column** — the rail already
exists and already nests one level.

**Cost:** the rail carries two jobs (stage nav + item nav) and gets busier;
its collapsed state needs a rule for what a selected item looks like as a
chip. Interaction's steps already work this way, so it is generalising an
existing pattern rather than inventing one.

**This is the one that fits our nesting**, because it uses the level we
already have instead of adding one.

---

## Recommendation

**B first, then C if the list proves worth a permanent home.**

B is cheap, uses a pattern the video surface already established, and fixes
the actual measured problem (1165px stages). It does not commit us to a
layout change we would have to undo.

C is the better end state and the honest answer to *"how does this fit our
nested architecture"* — but it touches the rail, which is the one piece of
this surface that has already been through a measured layout pass, and it
should not be done speculatively.

**A is not recommended.** It is the most faithful port and the worst fit: it
adds the fifth zone the last layout pass removed, and it cannot work on
Interaction without a per-stage exception.

---

## Trial result — Coverage, 2026-09-29

**B is built on the Coverage stage.** Held to the trial's terms: one stage, no
new column, no styling or theming change, reversible.

| | Before | After |
|---|---|---|
| Coverage stage height | 1165px | **607px** collapsed · 686px with a card open |
| Framing / World / Coach / Close | 769 / 1071 / 555 / 1105 | **unchanged** |
| Reading measures (note / field / inherit) | 60 / 57 / 67 | **unchanged** |

The collapsed summary reads:

```
info-6   Stay in the compartment during a tip-over              ●
         working · below mastery · adjusted · no beat
```

**What the trial confirmed:**

- The summary line is the whole value. Depth-against-bar, provenance, and the
  two states that are the actual reasons to open a card — a missing beat (D42)
  and a stale approval (D41). *"Which points are short?"* is now a glance.
- **The status dot cost nothing.** `scnPhaseBlockers()` already names specific
  items, so this was attribution of an existing signal, exactly as predicted.
- **The video accordion transferred cleanly.** No second expand model, and the
  precedent made the interaction obvious rather than novel.
- Locks (D32) still enforce through the new layout — fields freeze, adds
  disable — because the lock pass runs over the rendered DOM and did not care
  that the DOM changed shape.

**One thing the study did not anticipate:** Misconceptions had to collapse too.
Left as a full-height card beneath four summary cards, the stage read as two
different layouts stacked. A list has to be uniform to be scannable, so a
group with no per-item state still needs a summary row.

**Still open, deliberately.** Whether the other stages should follow. World and
Close (1071 / 1105px) are the next candidates and have the same shape — a few
groups, each a collection. Framing and Coach are short enough that collapsing
them would add a click for nothing, which is worth saying plainly: **this
pattern is for stages with enough items to scan, not a house style.**

---

## What a summary card needs to carry

Whichever option, the card is the real design object. From the reference,
and what our model already computes:

| Element | Source | Example |
|---|---|---|
| Title | the item | *Cast* · *Load capacity varies by attachment* |
| Summary line | first field, truncated | *"A busy loading dock, mid-shift…"* |
| Count chips | collection lengths | `2 characters` · `6 facts` · `3 levels` |
| Status dot | the stage blocker that names it | ● ok · ● outstanding |
| Lock state | `lockedFieldsIn()` (D32) | 🔒 when held |

The status dot is the part worth getting right: `scnPhaseBlockers()` already
computes per-stage blockers, and most of them name a specific item ("Step 2
has no exit gate", "*point* is below its required depth"). Attributing an
existing blocker to the card it belongs to is a display change, not new logic
— the same move the stage rail's warning dot already makes one level up.
