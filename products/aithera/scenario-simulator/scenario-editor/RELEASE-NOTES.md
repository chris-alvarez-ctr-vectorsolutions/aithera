# Scenario Editor — stable and sandbox

Two builds of one tool.

| | URL | What it is |
| --- | --- | --- |
| **Stable** | `scenario-editor/` | The editor LXDs rely on to create and edit real scenarios. The dev team builds their own authoring environment against this one. |
| **Sandbox** | `scenario-editor/?v=2` | Quick UI and flow experiments, for testing ideas with the LXD team. Nothing here is a commitment. |

The bare folder URL is always stable — that is the whole reason the editor moved
into a folder. `?v=2` hands off to the sandbox and forwards every other
parameter, so a shared `?type=…&example=…` link survives the hop. The old
`writer-studio-v2.html` path still redirects, because links to it are already out
in Slack, Jira and the docs.

## What isolation you actually get

**Drafts and libraries are separate.** `localStorage` is per origin, not per
page, so without this the sandbox and the stable editor would share every key —
and since the browser library is the only copy an authored scenario has, a
half-finished draft written by an experiment would land on someone's real work.
The sandbox declares `window.STUDIO_CHANNEL = 'sandbox'` before the engine
loads and gets its own draft and library keys. Stable keeps the original keys
untouched, so nobody lost a library when the sandbox appeared.

The publish→live buffer stays **shared** on purpose: it is how a playtest reaches
the player, and channelizing it would mean a sandbox playtest publishing
somewhere no player looks. A sandbox publish costs a re-publish. A sandbox
library write would have cost the work.

**Code is not automatically separate**, and this is the part worth internalising:
the editor page is a thin shell over about twenty modules in `../js/`, and most
of them are shared with the player. So:

- An experiment that only touches files under `scenario-editor/sandbox/` is
  **free** — change whatever you like.
- An experiment that needs a shared module (`studio-shell.js`, a wizard, a
  scenario type, `scenario-v4.js`) **changes stable too**. To keep it in the
  sandbox, copy that one file into `scenario-editor/sandbox/js/` and point the
  sandbox page at it — note that because the page carries `<base href="../../">`,
  a forked copy is referenced as `scenario-editor/sandbox/js/<file>.js`, since
  plain `js/<file>.js` would load the shared one.

That line is not bureaucracy — it is exactly the boundary the dev team asked
for. Anything that reaches stable is something they may have to build.

## Promoting a change to stable

Stable is a **place, not a version number**: promoting means the change lands in
`scenario-editor/index.html` and its modules, so the stable URL never moves.
Versions accumulate here as notes, not as folders.

Before anything is promoted, it gets a conversation with the dev team so it can
go on their roadmap. Two things make that conversation short:

1. **Say whether the JSON contract moved.** Not an opinion — run the check:
   `node tools/roundtrip-check.js`. It replays the real export chain over the
   dev team's live scenario documents and fails on any difference. A change that
   keeps it green is a UI change; one that turns it red is a contract change and
   needs to be discussed as one.
2. **Say what prompted it.** The sandbox exists to gather LXD input for an
   authoring environment the dev team will eventually build themselves, so the
   durable output is the evidence, not the diff.

## Log

Newest first. `Contract` = what `tools/roundtrip-check.js` said.

| Date | Build | Change | Why | Contract | State |
| --- | --- | --- | --- | --- | --- |
| 2026-08-25 | stable | **Every leaf a production scenario carries now has a field.** Coverage went 50 → 0. New editors: the quality levels on a **debrief**, on a **debrief's probe** and on the **opening**; a character's **guardrails** and **known facts with reveal conditions**; the opening's **id / composer placeholder / handoff line / conditional probes**; a **practice name**; a debrief's **chat header** and **handoff line**; opener **emotion**; and the **exhibit / ambient-reference kind** | The coverage check found them, and three mattered: `debrief.levels` is authored in 9 of the 11 production documents, `behavior.guardrails` in 8 (the closest thing the format has to a per-character safety constraint), and `canon_facts.reveal_when` is earned disclosure — the mechanic our own ensemble scenarios pioneered, with nowhere to author it. The opening's card had been telling authors its levels were "partial on purpose" above no levels editor at all | green (11/11) | shipped |
| 2026-08-25 | stable | The quality-levels editor is now ONE shared block (`levelsBlock`) used by all four sites, and it no longer pre-creates absent tiers | It was written once inline for a practice, which is exactly why the other three sites had none. Pre-creating `{}` for a missing tier mutates the draft just by looking at it — harmless where every document has all three, but on the opening (whose schema requires none) it would invent tiers the document never had and break an edit-free round trip | green (11/11) | shipped |
| 2026-08-25 | stable | `rowCard` renders no delete control when given no handler | The three quality levels are the engine's vocabulary, not a list an author adds to, so their cards were passing `null` — and `addEventListener('click', null)` is legal, so twelve cards showed a bin that silently did nothing | green (11/11) | shipped |
| 2026-08-25 | stable | **The step editor renders its inputs again.** A numeric field's change handler now returns when nothing actually changed | `value-changed` is a PROPERTY event, not a user event: Vaadin emits it asynchronously after upgrade, so the programmatic `f.value` set at build time arrived back in the handler after its listeners attached. "Follow-up turns" repaints the debrief on change (0 restructures it), so it rebuilt the field, whose value was set again, which fired again — twenty nested repaints, a `Maximum call stack size exceeded` from inside the component bundle, and every field built before it marked failed. On screen: a step card with no inputs at all, 138 fields where 38 belong. It never fired while the tag was `vaadin-integer-field`, which the library does not register — making it a real field woke the loop up. A dead control can hide a live bug | green (11/11) | shipped |
| 2026-08-25 | both | Components bumped to **core v1.22.3 / themes v1.9.3** | The editor was three minors behind the component library the dev team will build against, and behind this repo's own base template. Verified: 16/16 fields upgrade on Situation & World, nothing regressed | green (11/11) | shipped |
| 2026-08-25 | stable | Numeric inputs use `vaadin-number-field` with `theme="outlined"` | They used `vaadin-integer-field`, which the Vector core bundle does not register at ANY version and which is absent from the CONTEXT element list — so five inputs (practice turn budget, debrief follow-up turns, both help budgets, spot target) were undefined custom elements: 0px, no shadow root, label and value living as properties on an inert node. `practice.exit.when.turns` is required, so Validation demanded a field with no way to fill it. Silent, because an unknown tag is not an error | green (11/11) | shipped |
| 2026-08-25 | stable | `answer_shape` is written **only when determinate** — 16 redundant `"open"` markers dropped from the templates, and the toggle/wizard/`newPhase` no longer record it | Absent already reads as open (`scenario-v4-runtime` tests `=== 'determinate'`), so recording 'open' declared an extension, earned a stripped-extension warning and made the export lossy — all to say what saying nothing says. The 2 genuine `determinate` markers stay, and still warn, because there the field carries meaning | green (11/11) | shipped |
| 2026-08-25 | both | The compiled-prompt legend stops claiming *"this exact text is what the AI runs on"* | True of the preview, false of production: this prompt is assembled by our compiler and the production service assembles its own from the same document. Two builders, and neither side would notice them drifting. Not a fix — it stops the tool asserting something untrue | green (11/11) | shipped |
| 2026-08-25 | stable | Every download is named `<scenario>-[draft-]<date-time>` by one shared scheme (`exportName`), and the export copy says the LMS owns versioning rather than claiming the file stem is the scenario id | The working draft was called `scenario.json` — every scenario, every time — so two exports landed in Downloads as `scenario.json` and `scenario (1).json` with nothing on either saying which scenario it held or which was newer, and a re-export after an edit silently replaced the previous one. The scenario's identity travels inside the document in `implementation_id`, so the filename is free to be for people | green (11/11) | shipped |
| 2026-08-25 | stable | Template gallery down to six: **Branching Arc renamed Escalating Situation**, **Teach Back retired** (object kept, out of `ORDER`) | Neither was redundant — both promised a mechanic Scenario CML v4 cannot express. v4 has no branching construct at all (no `branch`/`next`/`condition`/`goto`/`target` in the schema, `transition` is a button label, a phase has no successor), so "Branching Arc" emitted a straight `C→R→R→R` ladder; "Teach Back" emitted one `coach_inquiry` step under a blurb promising credited coverage, which only `observe_react` has. `observe-react` is also one step and stays, because its blurb describes what it produces — the test is honesty, not step count | green (11/11) | shipped |
| 2026-08-25 | stable | The **Guardrails** inspector tab is now **Validation**; the rail keeps *System guardrails* for the locked prompt sections | Two different things wore one word on the same screen. "Validation" is also what the production service's authoring API calls the same output (`failures[]`, and its own inspector tab), so both tools now name it the same | green (11/11) | shipped |
| 2026-08-25 | stable | Validation rows name the field the author sees, repeated rows collapse into one that lists the steps, and the per-row "POC V4 rejects the document" refrain is gone | Twelve rows carried raw schema paths (`practice.interaction.opening_messages`) and the same sentence underneath each, with six of them being two messages said three times. The panel's job is telling an LXD which field to fill | green (11/11) | shipped |
| 2026-08-25 | stable | Guided Arc's vocabulary is out of the rail: the **Learn** step is **Teaching**, the dead **Practice** step is deleted, and Interaction/Voice & Tone lose their engine-jargon ledes | The Learn step held nothing but the teaching points — which the card on it calls debrief-scoped and never shown mid-attempt — under a heading promising a gut-reaction warm-up and topic turns. Guided Arc has not been authored here since it left the load list | green (11/11) | shipped |
| 2026-08-25 | stable | **Nested lists are editable.** A teaching topic's points and an expert-answer group's components were each bound to index 0 — one field, first entry, rest hidden. Both are repeaters now (`subRows` in the shell) | Every one of the 36 teaching topics in the eleven production documents carries more than one point (up to 10), and 24 of 37 component groups carry more than one component: 152 authored fields an LXD could not see or edit. The hidden entries survived export, so nothing failed — `roundtrip-check.js` stayed green while the editor was showing a quarter of the document | green (11/11) | shipped |
| 2026-08-25 | stable | The dev-handoff export reports the prior-scenario context it drops, and the lints flag it at authoring time | The shell keys were stripped BEFORE `stripExtensions` ran, so the removal never entered the report — and the panel then said "Nothing else is changed" while the one thing the 2026-08-18 meeting approved went out with the rubbish | green (11/11) | shipped |
| 2026-08-25 | stable | First visit opens the New scenario panel instead of an empty form, and no longer parks a phantom "(untitled)" snapshot in Local drafts | `JSON.parse(null)` returns null without throwing, so the boot's `catch → DEFAULT` fallback was dead code and a first-time author got a blank three-column form with a red dot on every section. The pristine check then measured that blank against DEFAULT alone, counted it as work, and snapshotted it | green (11/11) | shipped |
| 2026-08-24 | stable | Every `window.confirm()` replaced with an in-page dialog — deleting and opening a local draft, clearing the draft from the player, and three wizard guards. Snapshots also list under their real name instead of "(untitled)" | A native dialog is suppressed in an embedded browser: it returns false without ever prompting, so delete/open did nothing and the wizard guards refused to let go. `listLibrary` read `scenario.title`, which POC V4 keeps under `content` | green (11/11) | shipped |
| 2026-08-24 | stable | The Steps card stops repeating the rail: the step list is replaced by the arc as one line plus the derived conversation cap | The rail already lists the steps, on the same screen — the same list twice is a second thing to keep in sync. The cap (every turn budget added up) is the one thing the rail cannot show | green (11/11) | shipped |
| 2026-08-24 | stable | Delete asks in the menu, not with `window.confirm()`; the rail widened to 292px; an open ⋯ menu no longer paints under the rows below it, and no longer vanishes when the debounced save repaints the rail | A native dialog is suppressed in an embedded browser — it returns false without ever prompting, which made Delete a button that silently did nothing | green (11/11) | shipped |
| 2026-08-24 | stable | **The steps are their own rail entries.** Each step opens alone in the editing pane; the Steps card became an arc overview; drag or the per-step ⋯ menu moves, duplicates and deletes them; deleting prunes carryover references and a reorder that breaks one says so | Four steps stacked as accordions in one card meant editing step 4 was a scroll past the other three, and the arc had no reorder at all. The rail is where an ordered spine belongs | green (11/11) | shipped |
| 2026-08-20 | stable | Context is never set in-scenario: the choice is gone, the Start step just asks what ran before (coach-facing only) | The product will not set learner context inside a scenario — the surrounding learning object owns the run-up | green (11/11) | shipped |
| 2026-08-20 | stable | The world step no longer disappears with inherited context, and is retitled **Situation & World** | Latent defect: that step also carries setting, canon and characters, so "inherited" made the scene world unauthorable — and "always inherited" would have hidden it for good | green (11/11) | shipped |
| 2026-08-20 | stable | `help_turns` compiles to 2 when absent, matching the production loader (was `null`) | The two engines disagreed about an absent field. Note the affordance itself is not built in our player — this aligns the number, not the behaviour | green (11/11) | shipped |
| 2026-08-20 | both | Header names the build: **Current** vs **Prototype**, with a notice in the prototype saying its changes are not in the everyday editor until released | An author had no way to tell which build they were in, and the old "V2" tag collided with `?v=2` meaning "prototype" | green (11/11) | shipped |
| 2026-08-20 | stable | Editor moved to `scenario-editor/`; sandbox build added at `?v=2` with isolated drafts | Stable had to be the tool of record with a URL that never moves, and an experimental build must not be able to overwrite an author's only copy of a scenario | green (11/11) | shipped |
| 2026-08-20 | stable | An edit-free export no longer drops `closing.ideal_response.source_references` | Six of the dev team's eleven live documents lost the field on a round trip; their schema permits an empty array there and ours deleted it | green (11/11), was 5/11 | shipped |
