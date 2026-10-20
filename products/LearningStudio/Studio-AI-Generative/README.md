# Studio AI — Generative Authoring

A spin-off of [`../Studio-AI-Platform/`](../Studio-AI-Platform/README.md) that
replaces the per-modality **authoring surfaces** with a **brief → generate →
review → revise** loop. The author stops building content on a canvas and
starts directing it: set up a brief, get a generated artifact back, review it,
point at what's wrong, get the next generation.

The comparison the team already lives: a UX designer moving from a Figma canvas
to reviewing a live HTML prototype that Claude Code built — and steering the
next version by pointing at things and saying what should change.

**Status:** exploration. Passes 1–8 of the mock are built (`ver1/index.html`, opened
through the loader `index.html`). Started 2026-10-15.

Built as a versioned feature with the Design Toolbox and a flow map; the flow
map has a deep link to every state below. **Hand-rolled UI, no Vector
components** — this is exploration, and the components don't cover a generated
artifact, a change map or a dockable panel. Same call as the parent prototype.

---

## Session handoff — 2026-10-19

**Where it stands.** Four layers navigable from the rail (Info set, Brief,
Activities, Outputs); two review renderers (video, scenario); decisions G1–G17
in `MODEL.md`; 82 flow-map states, all rendering clean. Passes 1–5 are
committed as `6034cf33`, passes 6a and 7 as `bb924036`, Pass 8 (spec edits +
the Coverage tab) as `0b98453a`, Pass 9 stage 1 (Compose) as `5461be36`,
stage 2 (output rehearsal) as `40f28c08`, stage 3 (the preview follows the
edges) as `a97c46fe`, and Pass 10 (the Outputs layer at lower density) is
the commit after it.

**Known rough edges, deliberately left:**
- The scenario's Interaction phase is the densest screen (steps · rehearsal ·
  panel). Reads at 1440px; tight below.
- After one guideline edit, every point anchored to the changed step shows its
  SME confirmation as stale (G12, per point). Correct, but the Coverage table
  goes amber fast — may want a softer treatment.
- The brief's generation plan and the Activities list show near-identical rows
  with overlapping status. Kept on purpose (spec vs. artifact); if it grates,
  strip status from the plan.
- Activities without a renderer (podcast, check, job aid) use **simulated**
  Regenerate / Approve buttons (labelled "sim") so the gates can be exercised.
  Their spec edits queue into a `specQueue` on the row and land on sim
  Regenerate.
- The review panel now has four tabs. At the side docks the tab icons are
  hidden (labels only) so the five dock buttons still fit; below 1100px the
  tabs go icon-only with titles. The float panel grew to 380px for the same
  reason.
- A claim can stand with no carrier ("Claim anyway" in a points analysis).
  Coverage and the preview report show it as not reached, and the handoff
  review lists it under "left as is". Whether that should ever be allowed is
  a design call not yet made — see the note under G14 in `MODEL.md`.
- The spec editor's content effects are scripted stand-ins (a refresher
  treatment takes each line's shorter alt; an audience change swaps the truck
  and redraws scene 1; a goal change rewrites the overlays). What matters is
  that each stays inside its field's scope (G15) and recomposition still
  drifts (shorter lines move overlay windows).
- The composer (Pass 9) parses rules with three regexes and resolves
  activities by keyword (`ACT_WORDS`). It is a stand-in for a model; the
  design point is that an instruction it can't honour is surfaced as
  unmapped, never dropped. Scenario outcome edges are treated as alternatives
  in rule order (a learner can't be routed on both step 1 and step 2 in one
  run) — see G16.
- Path enumeration lets a node be visited twice, which admits exactly one
  retry loop. A second failure dead-ends in the enumeration (not a path), which
  is fine for the proof but is not how the product would bound retries.
- Seed deviation (Pass 9): the inspection card carries P1 at **Working** (was
  Awareness) so the composer has a lighter repair than the check.

**How the mock is verified** (no test framework; headless Chrome from the CLI):
- *Every flow state renders without console errors:* loop over the `state:`
  ids in the flow-map config, load `index.html#fm=<state>` with
  `--headless=new --dump-dom --enable-logging=stderr`, and grep the stderr
  for `CONSOLE` lines that aren't the toolbox's expected `file://` CORS noise.
- *Interaction paths:* copy `index.html` to a scratch file with the toolbox
  `<script>` stripped, append a `<script>` that drives the page with synthetic
  clicks (`dispatchEvent(new MouseEvent('click', {bubbles:true}))`) and logs
  to a `<pre id="RESULT">`, then `--dump-dom` and read it back. Use absolute
  paths — the shell cwd resets between tool calls.
- *Icons:* every `fa-*` class in the file must appear as a selector in
  `assets/fontawesome/css/all.min.css`; a missing one renders as an invisible
  zero-width glyph.

**Architecture notes for the next change:**
- Review state is **per activity**: `REV[id]` holds generations, Pending,
  locks, approval; `R` points at the open one. Shared shell state is `S`.
  Each modality is an `ADAPT[id]` with `elements / apply / fresh / carriers /
  claimed / specScope / coverKinds / jump`. A new modality = a seed, an
  adapter, a renderer, a player stand-in.
- **Coverage claims live on the generation** (Pass 8): `gen.claims` for the
  video (point → carrier element ids), `gen.doc.covers` for the scenario
  (point → depth + beat). `VIDEO_CLAIMS` is only the seed. The adapter's
  `carriers(pid, gen)` / `claimed(gen)` read them; `provOf` staleness, the
  Coverage tab and the preview report all go through the adapter.
- **Pending item types:** `annotate`, `region`, `restore`, `pin`, and since
  Pass 8 `spec` (`{ field, from, to }` — lands on the plan row in `apply`
  via `applySpecToRow`) and `cover` (`{ pid, depth }` — the adapter adds a
  carrier). The diff attributes a change to a `spec` item by **scope**
  (`ADAPT[id].specScope[field]` = element kinds × fields, G15), never by
  element id. Anything outside the scope is drift.
- A points edit never rides a task. `commitSpec` writes the claim to the row
  at once, then either `startOver(r, keep)` (scoped refresh) or
  `startAnalysis(..., { scope })` — the same `analyse` / `findingsHTML` /
  `applyFindings` path the brief uses, with `B.findings.scope` set. The
  `points` entry in `LIB` is the per-point analysis (`pointFindings`); a
  fourth verdict, `missing`, exists only there.
- `POINTS` is derived from the information set (`syncPoints()`); never edit it
  directly. Every claim pins a point version (`prov[pid].ptv`).
- The seed data for the six points, the library, the comments and the
  scenario is the parent's, extracted verbatim — don't retype it; re-extract.

- **Compose (Pass 9):** an output's `structure` is composed lazily by
  `structOf(o)` from `o.comp` (path, rules, completion) and `o.pins`:
  `{ nodes, edges, spine, notes, unmapped, shorts, collisions, version }`.
  Node ids are `n-<act>`; a repair inserts its own instance `n-<act>#rN`.
  `enumeratePaths` / `reachOf` drive the threshold, the gates and the map;
  `outSig` includes the structure version. Brief edits go to `o.draft` →
  `proposeStructure` → `acceptProposal`; pins call `togglePin` and recompose
  at once. The map is hand-rolled SVG (`layoutStructure`, `structMapSVG`),
  layered by longest path with back edges detected on the DFS stack.

- **Rehearsal (stage 2):** `o.reh.trace` is a list of edge ids; `rehNode`,
  `rehEdges`, `rehActs` derive the rest; `rehWalk(o, [on…])` seeds a walk
  (null = the default / otherwise connection). `pathReach(o, acts)` is the
  per-path threshold; `signedOff(o)` compares `o.signedSig` to `sigKey(o)`.
  Any structure change resets the trace.

- **Preview (stage 3):** in output mode `P` carries `node`, `trace` (edge
  ids), `items` (grows as the walk goes), `outcomes`, `runs` (the scenario's
  levels and beats per visit). `pItemDone(outcome)` picks the next
  connection with `nextEdge(st, node, outcome, scn)`; `seedExpPreview` is the
  flow-map seed.

- **Outputs UI (Pass 10):** `B.outOpen` + `B.outTab` select the detail and
  its tab; `B.outEdit` opens the brief drawer; `B.outInfo` is the open ⓘ
  note; `B.outReason` unfolds the reasoning. `outNext(o)` derives the single
  next step from the first open gate; `outStatusLine(o)` the status words.
  Rationale copy lives in `OUT_NOTES`.

**Next:** either carry the Pass 10 treatment (index + tabs + ⓘ rationale)
to Brief, Information Set and Activities, or the job-aid proof — a static
modality with no renderer, to show a new modality needs a review renderer,
not a surface.

## If you are picking this up cold

Read the parent platform's `MODEL.md` first — this folder **does not restate the
information layer**, it builds on it.

| File | What it holds |
|---|---|
| [`../Studio-AI-Platform/MODEL.md`](../Studio-AI-Platform/MODEL.md) | The knowledge library, information set, points, depth, coverage, goals. **All of it still holds.** |
| **`MODEL.md`** | The generative loop, the project brief, variations, element targeting, review tooling — and which parent decisions carry, change, or are superseded. |
| **`OPEN-QUESTIONS.md`** | What's unresolved, and what each answer would change. |

---

## The one-paragraph pitch

The parent platform's core claim is that the **information set is the primary
artifact** and everything beneath it is derivable. It then spent most of its
effort building hand-crafted authoring surfaces for that derivable layer — a
video canvas, a six-stage scenario editor — with four more modalities still
undesigned. This spin-off takes the core claim at its word: if activities are
derivable, author them by **directing the derivation**, not by assembling the
result. The information layer stays. The surfaces under it become a brief, a
generated artifact, and a review loop shared by every modality.

---

## What is kept, what is replaced

| Kept — the subject (above the line, D48) | Replaced — the delivery authoring (below it) |
|---|---|
| Knowledge library, information set, point documents — **ported into this mock as its own layer (Pass 5)** | The video canvas and timeline editing |
| Walled-off usage guidelines (D23) and assistant goal (D28) | The scenario six-stage form |
| Depth, coverage, goals, the threshold | Four undesigned modality surfaces — **never built** |
| Drift, approval staleness, locks, node addressing | Direct editing as the primary mode |
| Beats (D42), learner preview (D44) | |

## The loop

```
PROJECT BRIEF ─▶ ACTIVITY SPEC ─▶ GENERATION n ─▶ AUTHORING REVIEW ─▶ revision task ─┐
      ▲                                                │                             │
      │ (edit the brief / spec)                        │ satisfied                   │
      └────────────────────────────────────────────────┤                             │
                                                       ▼                             │
                                          LEARNER PREVIEW ─▶ APPROVE ─▶ publish       │
                                                                                     │
                                                   GENERATION n+1 ◀──────────────────┘
```

Details in `MODEL.md`.

---

## Settled at kickoff — 2026-10-15

From the planning conversation; reasoning in `MODEL.md`.

- **Two review modes.** Authoring review is the working loop; learner preview is
  a required gate before approval.
- **Variations are two axes** — format (refresher, microlearning, full course)
  and audience (fire, law, EMS, factory, construction site).
- **The brief is project-level** (G7): its own layer between Information Set
  and Activities. Mostly a form, since it's the key human-in-the-loop point;
  AI proposes where the work is heavy (e.g. assigning points to activities).
  Each activity is a spec inside it that inherits and overrides.
- **A brief edit asks the author what to do** (G10): start the affected
  activities over, or analyse existing content against the change and decide
  per finding (update, delete, leave as is).
- **Content approvals carry; the pipeline handoff doesn't** (G11, renamed by
  G12). Any change to an output clears its handoff approval.

## Settled 2026-10-16 — after the evaluative pass

- **Two roles, three approvals** (G12): the LED grants content approval and
  the pipeline handoff; the SME confirms depth per point, from the preview
  report. Whether the SME is required comes from the project goal (D17) — a
  content-team decision, not derived. Release is downstream, not ours.
- **The bar lives on the output's format** (G13): Full course / Refresher /
  Microlearning, held as data. No activity-level depth override; a refresher
  activity is a treatment instruction, a Refresher output is the configuration.
- **Spec edits split by field** (G14): treatment edits ride the next revision
  task; point changes get the G10 analyse/refresh choice scoped to one activity.
- **Locks apply immediately**; a revision task records them (G9 revised).
- **All-prompt editing, element-targeted.** No manual editor. Precision comes
  from targeting an element ("this sign"), not from a form field.
- **What changed is a list plus a change map** (G5); unrequested changes from
  recomposition are caught by comparison and shown louder (G6).
- **The AI panel is a dockable module** (G8): right, left, bottom, floating,
  or minimized.
- **Review edits batch into one revision task** (G9).

## What the mock shows — Pass 1, the review loop

- **A generated video built from addressable elements** — background image,
  objects (the forklift), signs, overlays, narration lines. Hover outlines them;
  click one to annotate it in place (G4).
- **Exact wording** — tick "use my wording exactly" and the text lands verbatim,
  then locks. The seeded case: the scene 3 sign reads *DEFECTS ONLY*, which
  contradicts the narration.
- **Region targeting** for flat images — the ⬚ tool draws a box on the
  background (G4 fallback).
- **Pending → one revision task** with an optional general instruction (G9).
  The task runs with visible steps; targeted elements shimmer.
- **Change list + change map** (G5) — requested changes glow blue, unrequested
  glow amber, with timeline markers. The list is the source of truth: Jump
  seeks to the change and pulses it even with the map off.
- **Unrequested drift is computed, not reported by the generator** (G6). The
  diff compares generations and attributes each change to a request or to
  nothing. Shortening narration line 1 in scene 2 shifts the callout's timing;
  re-lettering the sign changes its text size. Neither was asked for.
- **Accept / Restore / Annotate** per change. A restore queues into the next
  task. Open unrequested changes block "Ready for learner preview".
- **Generations** — switch to any earlier one, read-only.
- **Dockable panel** (G8) — right, left, bottom (frame shrinks so the timeline
  stays visible), floating (drag the header; moves aside from your selection),
  minimized pill.

## What the mock shows — Pass 2, the project brief

Open it from **Brief** in the left rail, or the brief chip in the activity's top
bar (which lands on that activity's row).

- **The brief is its own layer** (G7), between the information set and the
  activities. A form in three sections plus walled-off **standing constraints**
  (D23). Edited fields are marked, and a save bar says how many generated
  activities the edit reaches.
- **The AI proposes; you accept** (D16). Changing the audience drafts the rest
  of that section; **Suggest** proposes a constraint. Proposals are dashed blue.
- **Generation plan** — activities × variations, each row an activity spec
  that inherits the brief and shows what it overrides. **Variation** adds a
  refresher, a microlearning or an audience variant; the AI proposes the points
  and, for a format variation, lowered depth (G2). You accept, then Generate.
- **Saving asks what happens to existing content** (G10). It lists what
  changed, which activities it reaches, which are exempt because they override
  the field, and which aren't generated yet. **Refresh** names the locks it would
  throw away (keep or drop each) and the approvals that go stale. **Analyse**
  checks each activity and reports holds / out of date / wrong.
- **Findings get a decision each** — update, delete, leave as is, or start
  that activity over. A wrong finding blocks Apply until decided, and leaving
  one as is needs a reason. Updates for the video go into **its Pending** — the
  same revision task review uses (G9) — and the next generation shows them as
  requested changes.
- **Approvals** (G11) — content approvals carry until the queued updates
  regenerate the activity; the output's publish approval is cleared by the save.

The video's findings read its **live** state: fix the truck during review and
the analysis says that element holds.

## What the mock shows — Pass 3, the gates

- **Learner preview** (G1, D44) — **Learner preview** on the review screen opens
  a separate window with the learner's chrome and none of the authoring layer.
  You can scrub back but not past what you've watched; 1×/2×/4× is a preview
  convenience. It unlocks only once every unrequested change has a decision.
- **The preview report** says which points a learner actually reached, where
  and when — read from the elements the generation claims carry each point. A
  static video needs no beats (D42).
- **Content approval is granted from the preview**, pinned to that generation
  (D41). The next generation shows it as out of date.
- **Outputs layer** (left rail) — per output: each activity's content approval
  and brief currency, a **threshold** table (every point against its bar, from
  the best activity carrying it), and the **publish approval** with what it's
  pinned to. Forklift Competency starts approved; Forklift Safety Refresher
  misses its bar on P2 and P5.
- **Publish approval is computed against its pin** (G11) — a new video
  generation, a brief edit, or any activity regenerating clears it, and the card
  says exactly what changed. Four gates must pass: threshold met, every activity
  current with the brief, every content approval current, and an output preview
  since the last change.
- **Output preview** walks the activities in order; modalities without a player
  show a stand-in card.
- **Re-approval reviews the delta** — brief changes since the pin, every
  generation change (unrequested ones with their decisions), and anything left
  as is during brief analysis with its reason. Then **Send to publish pipeline**
  (D31).

Activities other than the main video have **simulated** Regenerate and Approve
buttons (labelled "sim") so the gates can be satisfied end to end.

## What the mock shows — Pass 9 · stage 1, Compose (2026-10-19)

**Outputs** now has a third output, *Forklift Operator Experience*, whose
traversal is generated. Open **Structure & reasons** on it (a Course has the
same view with one path and no rules).

- **A composition brief guides the composer** (G16): the default path as an
  ordered list, routing rules in prose, a completion rule. The AI proposes
  the map; the author accepts (D16). Three rule shapes are understood: *fails
  X → repeats Y, then retries*; *<level> on <scenario> step N → hears Y before
  Z*; *<level> on step N → skips Z*. Anything else is flagged **unmapped**,
  kept in the brief, and blocks the handoff gate until reworded.
- **Every connection carries its reason.** Click one: default path, the brief
  rule quoted, a repair naming the point it protects and the rule it modifies,
  a pin naming the rule whose skip now lands here, or the completion gate.
  The composer's reasoning sits beside the map in order — this plus the map is
  the QA record.
- **Repairs are honest.** Rule 3 lets a Strong learner skip the check, which
  leaves P1 short on that path. The composer inserts the inspection card as
  its own instance (the lightest activity carrying P1 at Working) and says
  so. P3 it cannot repair, because only the check reaches Mastery and that is
  exactly what the rule skips: it reports *short*, and Flags offers **Pin the
  check required** or **Drop rule 3**.
- **Pins apply at once** (D47). Pinning the check retargets rule 3's skip
  onto the check, the repair disappears, every point is guaranteed on every
  path, the structure is v2, and the handoff pin (which now records the
  structure version) clears.
- **The threshold reads reachability**: "every path" or "n of m paths" per
  point, with the missing paths named. The Paths list shows every route from
  entry to completion with the outcomes that select it.
- **Brief edits propose.** Add a rule or reorder the path and re-compose: the
  proposal lists the connections it would add or remove, each with its
  reason, plus the new reasoning. Accept bumps the version; discard restores
  the draft.
- Six flow-map states (lane I). The D38 collision check (two scenario
  warm-ups in a row) is wired but nothing in the seed triggers it.

## What the mock shows — Pass 9 · stage 2, output rehearsal (2026-10-19)

Below the map on an output's Structure view (G17).

- **Walk the structure.** Begin at the entry; at each activity pick what
  happened. Every outcome button names the connection it fires, where it
  leads and the reason it carries; the trace below reads as the QA record for
  that path, with the reason under each step. The map lights the walked
  route. **Change** at any step rerolls from there; **Restart** clears it.
- **Completion shows what the path reached**, point by point against the
  bar. A short path says so, and offers the pin right there: *Pin the check
  required · carries P3 at Mastery*. Pinning recomposes (structure v2) and
  resets the walk.
- **All paths** enumerates every route from entry to completion with the
  outcomes that select it and a chip per point. A red row names the path and
  the point it misses, and sign-off is blocked until the structure is fixed.
  **Sign off all paths** appears when every row is green; it is pinned to the
  structure version and the activities' generations, so a pin, an accepted
  proposal or a regeneration clears it. The Experience's handoff gate reads
  it.
- A Course gets the same card with one row and nothing to choose.
- Five more flow-map states on lane I.

## What the mock shows — Pass 10, the Outputs layer at lower density (2026-10-19)

The Outputs list and the structure view had grown to roughly forty data
points per card and nine stacked sections on one scroll. This pass reorganises
them around one question per screen, with the design rationale moved out of
body copy.

- **Outputs is an index.** One row per output: name, kind and format, a
  status line in words ("Handoff cleared by a change · 5 paths · P3 short · 2
  gates open"), and **one next step** derived from the first open gate ("Fix
  the structure", "Rehearse & sign off the paths", "Review & approve", "Send
  to publish pipeline"). No tables.
- **An output is one page with four tabs.** *Overview*: activities with
  their status, what the output is, the open gates in brief. *Structure*: a
  flag strip (short points, unmapped rules) with their fixes, the brief as
  one line with **Edit the brief**, the map with its why panel, and the
  composer's reasoning folded. *Rehearsal*: the map lighting the route, the
  walk, all paths, sign-off. *Readiness*: the gates, the threshold table
  (Point · Needs · Delivered with who judged it · Paths · ✓), the handoff pin
  and "changed since", preview / approve / send, structure versions.
- **The composition brief edits in a side drawer**, and proposals arrive in
  the same drawer; a strip on the Structure tab says a proposal is waiting.
- **Map density**: outcome labels only where a choice exists, the "on n of m
  paths" line only when a node is skippable, and a red **!** on the connection
  where a point goes short — clicking it opens the why panel with the short
  explained.
- **Copy**: every explanatory paragraph became one sentence in product voice.
  The G and D references live behind ⓘ buttons on each card heading; the
  note opens inline and closes again. The same treatment is not yet applied
  to Brief, Information Set or Activities.
- Flow-map states for outputs now open the right tab (readiness for the
  handoff states, structure or rehearsal for Compose).

## What the mock shows — Pass 9 · stage 3, the preview follows the edges (2026-10-19)

**Preview as learner** on any output now walks its structure instead of a
fixed list (D44 kept: none of the rehearsal's workings show while walking).

- The entry's connection picks the first activity. Each activity's **real
  outcome** picks the next connection: the video completing, the levels the
  scenario run actually landed (Unthoughtful on step 2 sends the learner to
  the podcast, rule 2), and on the check's stand-in card a **Pass / Fail**
  choice, since the real check would score it. Failing routes to the
  inspection card and back to the check (rule 1). The side list shows the
  path so far, each step's outcome, and what decided it; what comes next is
  "decided by what happens here" wherever more than one connection leaves
  the node.
- **The report is the path taken**: every connection with its reason, the
  points this path reached against the bar, the beats the scenario fired and
  the level each landed, and which of the n enumerated paths this was. It
  points at the rehearsal and the all-paths sign-off for the others.
- The Experience card gains a **Rehearse paths** button beside Structure.
- Two flow-map states; the output-preview gate (G1) is unchanged.

The Pass 9 plan is complete. Remaining open: Q16 (what else a rule may
condition on).

## What the mock shows — Pass 8, spec edits and the Coverage tab (2026-10-19)

Open a plan row in the **Brief** (or the brief chip on a review screen, which
now lands on that activity's row, expanded). The detail row is the activity
spec, split the way G14 draws it: **what** on the left (the points it claims),
**how** on the right (audience, treatment, assistant goal, activity
constraints).

- **Treatment fields ride the next revision task** (G14). Change the
  treatment, edit the goal, add a constraint: each queues at once as a
  `spec` item — the field shows *#n queued · was …* with a revert, the row
  shows *n spec edits queued*, and the review screen's Pending lists it beside
  the annotations. Nothing regenerates until the task is sent; the spec value
  lands with the generation it produces. Set a field back to its current
  value and the item disappears.
- **Attribution is by scope, not by element** (G15, new). A spec item names no
  element, so the diff asks the adapter which element kinds × fields the
  field is entitled to move. A refresher treatment shortens every narration
  line — requested, in scope — and the overlay windows that move with them are
  drift, caught by comparison (G6) and shown louder, exactly as for an
  annotation.
- **Points get the scoped G10 choice.** Adding or removing a point opens a
  dialog for *this one activity*: the claim change, its consequences
  (an SME confirmation cleared — reported, never repaired, D43; what each
  output's threshold does; the handoff that clears), and **Analyse** or
  **Refresh**. Refresh reuses the brief's cost dialog — the locks it would
  throw away, the approval that goes stale — scoped to the activity.
- **Analyse reads the live generation.** Adding P3 to the video: nothing
  carries it, so the finding is *Not covered* — **Cover it** queues a `cover`
  item (the next generation adds a carrier, and that new line is the requested
  change) or **Claim anyway** leaves the claim standing uncarried. Adding P2 to
  the scenario: step 3 already teaches the dismount, so the finding *holds*
  and applying registers step 3 as P2's beat. Removing P2 from the video names
  the narration line that carried it — remove it, or leave it (the content
  stays, unclaimed).
- **The generator re-proposes its claims against the spec.** A dropped point
  is no longer claimed by the next generation; on the scenario the coverage
  element loses that field, attributed to the spec rather than reported as
  drift.
- **Coverage tab** in the review panel (G1 promised it; the preview report was
  the only place claims showed). Per claimed point: the depth, the carriers in
  the viewed generation (video: each element with its timestamp, as a jump
  target; scenario: the beat step and whether it's unskippable), who judged
  the depth, the point version. A claim with no carrier is amber with
  **Cover it**; content the generation carries that the spec doesn't claim is
  listed separately. Approval and SME confirmation stay on the preview report
  (G12).
- Activities without a renderer take the same spec edits into a queue on the
  row; sim Regenerate applies them.

## What the mock shows — Pass 7, the scenario (2026-10-16)

The generated-at-runtime proof. The video was the easy case: static, so
watching it verifies coverage. A scenario's coach replies differ every run,
so a rendered artifact cannot stand in for the learner's experience — and
this is where the parent's deepest thinking (rehearsal, D33; beats, D42)
either survives the all-prompt model or doesn't. Open **Hazard walkthrough —
loading dock** from Activities.

- **The parent's scenario surface, ported as a review renderer.** The
  six-stage spine (Framing, World, Coverage, Interaction, Coach, Close) is now
  the *structure of the generated artifact*: every narrative line, canon fact,
  character, calibration guideline, pinned example, key point and closing
  component is a targetable element with a stable id. All three practice
  modes come across. Nothing is a form. The seed is the parent's, verbatim.
- **The shared shell is shared in code, not just in copy.** Review state
  (generations, Pending, locks, approval) is now **per activity** (`REV`), the
  panel reads whichever is open, and each modality supplies an adapter:
  elements, apply, fresh-start, coverage carriers, jump. Opening the scenario
  changes the body; the Changes / Pending / History tabs, the change map,
  locks, the verbatim rule and the revision task are the same code the video
  uses.
- **Rehearsal (D33), kept almost unchanged.** Read / Calibrate / Play beside
  the steps. Type a learner answer and see which level catches it; **reroll**
  to see the spread the guideline produces; the level tag jumps to the
  guideline element. **Keep a roll** queues a Pending `pin` — a known value,
  applied exactly by the next task and locked (G4/G5): the parent's "rehearsal
  is an authoring gesture", made consistent with G9.
- **Coverage with beats (D42).** The generator's claims are an element: point,
  depth, and the step that guarantees it. The reviewer checks the beat is
  unskippable. Provenance and point version sit beside each.
- **Unrequested drift, second form (G6).** Annotating the Strong guideline
  makes generation 5 regenerate the example drawn under it *and* move P3's
  beat to step 2 — both unrequested, both caught by comparing the
  generations, and the moved beat shows on the Coverage phase as a change
  like any other. Every carrier of a point whose beat step changed shows its
  SME confirmation as stale.
- **Learner preview = playing it.** One run of a conversation that differs
  every time; the report is about beats fired and the level each landed on,
  not the words. Content approval from the report, as for video.
- **Everything upstream now reaches the scenario**: brief analysis queues
  into *its* Pending (Marcus's hi-vis, the step-2 scene), the refresh dialog
  offers *its* locks (the SME-locked closing summary), Outputs shows its
  generation and approval, the Information Set's *Carried by* reads its
  claims.
- **Prompt-smell (D37)** now blocks a verbatim annotation that talks about
  the AI or the interface.

## What the mock shows — Pass 6a, the Activities layer (2026-10-16)

The rail's **Activities** used to drop straight into the one activity with a
review renderer, which hid the structure. It is now the project's **library of
activities**, grouped by modality — generation, approval, brief currency,
drift, points with provenance, which outputs each sits in — and the review
screen is one level **down**: Open drills in, a back link returns.

- **Open on the video** → the Pass 1 review screen.
- **Open on any other modality** → the **shared shell** with the body missing:
  generations, approval, coverage with provenance and point version, outputs
  — and a note that only the review renderer is unbuilt. This is the
  "common platform, unique body" principle shown rather than toasted.
- The plan's and Outputs' Open buttons drill in the same way; Generate works
  from here for rows whose points are accepted.

## What the mock shows — Pass 5, the Information Set layer (2026-10-16)

Chosen over a read-only stub because, with four layers, the one the model
turns on has to be visible. Ported from the parent — the six point documents,
the library and the two SME comment threads are the parent's seed data,
extracted verbatim rather than retyped.

- **The set** — six cards: required depth (met/unmet against the best any
  activity delivers), version, provenance (sourced vs. model knowledge),
  verified/awaiting SME, carried-by count, comments. A banner above the line
  explains why this layer is different from the three below it.
- **Point document** — the five sections, directly editable, with **usage
  guidelines walled off** beside them (D23). **Propose a rewrite** per section
  is a D16 proposal: accept or dismiss. Saving bumps the point **as a whole**
  (D24) and the save bar says how many claims will read as behind.
- **Drift, computed** (D19/D20) — every activity claim pins the point version
  it was judged against. After a save, those claims show *v3→v4 update
  available* in the plan and the point's **Carried by** table — advisory. *Mark
  reviewed* re-pins a claim and drops an SME confirmation to LED-set, because
  the SME hasn't re-looked. The podcast's P3 claim is seeded at v2 so drift is
  visible from the start.
- **Archive** is the hard case — every dependant becomes a no-deliver, and a
  new handoff gate ("no activity depends on an archived point") blocks.
- **The handoff pin now includes point versions and lifecycle** (G11): editing
  or archiving a point clears an output's handoff approval and the card says
  which point moved.
- **Library import** copies (D34) and reports the new point as carried by
  nothing (D43). **Remove** orphans the claims naming the point and reports
  them; *Clear them* prunes on request only.
- **Derive an activity** from a point adds a proposed row to the generation
  plan — the parent's points → activities operation, now wired to the brief.
- Point names in the Outputs threshold link to the point.

**Seed deviation, kept:** P6 requires Working here (parent: Mastery) so the
Competency output can pass — documented in the seed.

## What the mock shows — Pass 4, after the evaluative pass (2026-10-16)

- **Depth provenance is back** (D16, G12) — every claimed point carries
  *proposed / LED set / SME confirmed*, pinned to a generation. The threshold
  table has a **Judged by** column; the plan chips carry a provenance dot; the
  preview report shows the state per point. **Seeded, not editable** — the
  SME's confirm control is deliberately not built; the states are data.
- **Staleness is per point, not per activity.** A confirmation goes stale only
  when an element *carrying that point* changed since it was made. The
  `outputs-stale-sme` flow state shows it: a revision to the line carrying P2
  stales P2's confirmation while P1's holds.
- **The SME gate is driven by the project goal** (`GOAL.requiresConfirmation`,
  parent D17). Compliance here, so it appears; flip the flag and it's gone.
- **Format lives on the output** (G13) — `FORMATS` is a data table (Full course
  / Refresher / Microlearning → bar). The Outputs card names the format and
  goal it validated against. The plan's "Format" column became **Treatment**
  (a spec instruction), the depth-override badge is gone, and the variation
  menu offers audience variations only, pointing at Outputs for formats.
- **"Publish approval" is now "pipeline handoff"** everywhere (G12). Release is
  the pipeline's workflow.
- Small fixes: annotating an unrequested change counts as its decision; flow
  states no longer overwrite your dock preference; the brief chip computes its
  override count.

**Data changed for Pass 3:** scene 1 gained a narration line on three-point
contact so the video genuinely carries P2; the video's spec now claims P1 and
P2 only (what its content carries); P6's required depth is Working so the
Competency output can pass.

Everything is in-memory; reload resets.

## Next

1. ~~Close the blocking questions (Q1–Q3).~~ Done 2026-10-15.
2. ~~Prove the loop on **video**.~~ Pass 1, built 2026-10-15.
3. ~~**Pass 2 — the project brief layer**~~ — built 2026-10-15.
4. ~~**Pass 3 — gates**~~ — built 2026-10-15.
5. ~~**Pass 5 — the Information Set layer**~~ — built 2026-10-16.
6. ~~**Pass 6a — the Activities layer**~~ — built 2026-10-16.
7. ~~**Pass 7 — the scenario review renderer**~~ — built 2026-10-16.
8. ~~**Pass 8** — G14 spec edits and the Coverage tab~~ — built 2026-10-19.
9. **Pass 9 — Compose and the output walk-through.** ~~Stage 1: structure,
   composition brief, reasons, reachability, pins~~ — built 2026-10-19.
   ~~Stage 2: output rehearsal~~ — built 2026-10-19. ~~Stage 3: learner
   preview follows the edges~~ — built 2026-10-19.
10. ~~**Pass 10** — the Outputs layer at lower density: index, four tabs,
    rationale behind ⓘ~~ — built 2026-10-19. Candidate: the same treatment
    for Brief, Information Set and Activities.
11. Prove the loop again on **job aid** — now the *cheap* proof: a static modality with no renderer yet — an undesigned modality — to show a new
   modality needs a review renderer, not a surface.
