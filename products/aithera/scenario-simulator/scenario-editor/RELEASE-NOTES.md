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
