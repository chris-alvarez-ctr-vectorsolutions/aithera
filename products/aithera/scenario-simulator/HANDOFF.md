# Scenario Simulator — handoff to the dev team

This folder holds the **Scenario Editor** (an authoring tool for scenario
documents) and the **prototype player** that runs them. Both are plain HTML, CSS
and vanilla JavaScript — no build step, no package manager, no framework. Open
any page in a browser and it works, including over `file://`.

The editor is being integrated into Learning Studio in an iframe. This file is
the orientation for that work.

> **Not to be confused with `products/aithera/editor/`** — that is an unrelated
> Vite/TypeScript app called "Aithera Content Editor" from June. Wrong tool.
> Everything relevant is under `products/aithera/scenario-simulator/`.

---

## Read this first

The **integration guide** is the design record for the Learning Studio work:
what the wrapper owns, what the editor owns, the step-by-step flows, and the
open questions.

<https://vectorlearning.github.io/ux-mockups/products/aithera/scenario-simulator/docs/scenario-simulator-studio-integration.html>

---

## You can read all of this without repo access

The repo is private, but **GitHub Pages serves the whole folder publicly,
including source files.** So you can read the code and run the editor today,
before any access is granted:

```
https://vectorlearning.github.io/ux-mockups/products/aithera/scenario-simulator/
```

Append any path — `js/studio-shell.js`, `css/writer-studio.css`, whatever — and
you get the file. What Pages does **not** give you is git history or a way to
push. For that you need to be added to the `VectorLearning/ux-mockups` repo,
which is an ask for whoever administers the org.

Repo path once you have access:

```
products/aithera/scenario-simulator/
```

Branch is `main`.

---

## The editor, three ways to open it

| URL | What it is |
| --- | --- |
| `scenario-editor/` | **Stable.** The build authors use. This is the one to integrate. |
| `scenario-editor/?embed=1` | **Stable, embedded.** Same build with both chrome bars hidden. |
| `scenario-editor/?v=2` | **Sandbox.** UI experiments. Nothing here is a commitment; it has its own draft storage. |

Useful parameters, which combine: `?type=v4-universal` picks the scenario type,
`?example=<id>` loads a sample document, `?wizard=1` opens the new-scenario
wizard directly.

`?embed=1` and `?v=2` are **independent switches on different axes**, not two
names for the same choice. `?embed=1` changes the presentation — it hides two
bars, in CSS. `?v=2` changes the page — a separate `index.html` with its own
draft storage. The build being integrated is stable with `?embed=1`; the
standalone one is stable with no parameters. **They are the same code.**

> **The sandbox isolates less than its name suggests.** `scenario-editor/sandbox/js/`
> is empty: the sandbox page carries `<base href="../../">` and loads every module
> from the shared `js/`. So it forks the page and the `localStorage` keys, and
> nothing else — a change to any shared module lands in stable, and therefore in
> the embedded build, immediately. That is deliberate. To genuinely isolate one
> module, copy it into `scenario-editor/sandbox/js/` and point the sandbox page at
> that copy, which creates a fork to reconcile later. What protects the integrated
> build is not a switch but the two checks below plus a `RELEASE-NOTES.md` row.
>
> The sandbox does not currently honour `?embed=1`. One line to add if it is ever
> wanted.

---

## What `?embed=1` does

It adds `.embed` to `<html>`, and `css/writer-studio.css` hides two bars:

- **the top bar** — Local drafts, New scenario, Export JSON
- **the published-state strip** — Preview as learner, clear-draft

That is the entire change. It exists because Learning Studio's own window will
own Save, Publish and Preview, so the editor's bars would put a second,
competing set of the same actions on screen.

### What it deliberately does not do

- **Nothing is disabled and nothing is removed.** The buttons keep their click
  handlers and stay in the DOM. Two reasons: thirteen places in the shell read these
  elements by id, so deleting them trades a duplicated button for a null
  dereference — and you may prefer to drive the existing export and preview code
  paths from your own controls rather than reimplement them. Which of those you
  call, and how, is yours to define.
- **It is opt-in by parameter, never inferred from being in a frame.** This
  repo's own dashboards and version loader render pages in iframes, and the
  standalone editor is heading for customer-facing delivery, so it has to keep
  its chrome wherever it is displayed.
- **The class is set by an inline script before paint**, so the bars never render
  and then disappear.

### One consequence to plan for

**`New scenario` was in the bar that is now hidden**, and it is the only route to
the template gallery, the AI draft, and open-an-existing-scenario. The panel
still opens itself when the editor boots with an empty document, but after that
there is no way back to it — so no changing template and no starting over.

The function already exists (`openNewScenario()` in `js/studio-shell.js`); it is
simply not reachable from outside the page. It was left that way on purpose
rather than guessing at an API. You will want a way in.

---

## Files that matter

| Path | What it is |
| --- | --- |
| `scenario-editor/index.html` | The page. Channel router, `?embed=1` detection, script tags. |
| `scenario-editor/RELEASE-NOTES.md` | Every change to the editor, with why, and what the contract check said. Read this before changing behaviour. |
| `js/studio-shell.js` | The app: boot, the rail, field rendering, export, import, preview wiring. |
| `js/studio-engine.js` | Storage. The draft / library / published slots in `localStorage`, and the per-build key namespacing. |
| `js/scenario-v4.js` | A validator mirroring the production v4 schema. Runs before the editor hands out a document. |
| `js/scenario-types/v4-universal.js` | The scenario type: fields, templates, export projection, the strip-extensions step. |
| `js/README.writer-studio.md` | The authoring contract — the type registry, and §7a's propagation list. |
| `css/writer-studio.css` | Styles, including the `.embed` rules. |
| `tools/` | The two checks below. |
| `docs/` | Architecture notes, including the integration guide. |

---

## Before you change anything shared

Two checks, both of which also run in CI on every push:

```bash
node tools/roundtrip-check.js
```

Replays the real export chain over 11 pinned production scenario documents and
fails on any byte difference. A change that keeps it green is a UI change; one
that turns it red is a change to the JSON contract and needs discussing as one.

```bash
node tools/surface-check.js
```

Answers what the contract check structurally cannot: do the pages still point at
the files they claim to? Catches a dead local `src`/`href` and a file loaded at
two different `?v=`. Run it after moving or renaming anything.

**Cache-busting is not optional.** Every shared file is loaded with a `?v=<n>`,
and every page that loads it must carry the same number. Bump it when you change
the file, or browsers serve a stale module and the fix looks like it did not
work. `surface-check.js` fails if two pages disagree.

`js/README.writer-studio.md` §7a is the written propagation list — what moves
with what — so it does not have to be rediscovered.

---

## Things that are already true, and worth not re-solving

- **No native browser dialogs.** Every `confirm()` was replaced with an in-page
  dialog, because a native one is suppressed inside an embedded browser: it
  returns `false` without ever prompting, which silently turned Delete into a
  button that did nothing. One `alert()` survives, in the storage-quota path in
  `js/studio-engine.js`, and should get the same treatment.
- **The document carries its own identity** in `implementation_id`. Filenames are
  for people; nothing downstream should parse them.
- **The v4 schema refuses unknown fields** — `additionalProperties: false` at the
  top level and in 37 places below it. An unrecognised field is a hard load
  failure, not a warning. This is why the editor validates before it hands a
  document over.
- **The editor holds no credentials** and talks to no Learning Studio API. Keeping
  it that way is what lets it stay a throwaway tool.

---

## Open questions

These are in the integration guide with more context. The first two are the ones
worth settling before either side builds:

1. **The event contract.** Which messages exist, who initiates each, and what
   happens when the editor does not answer. The dangerous failure is a Save that
   appears to succeed while storing a stale document.
2. **Draft durability.** With no server-side draft, the only copy outside one
   browser profile is a published one — so storing work durably and making it
   live to learners are currently the same action.
3. Who owns undo/redo, and whether re-pushing a whole document into the iframe
   costs the author their scroll position and open step.
4. How a document reaches the preview engine.
5. Whether S3 asset URLs resolve without a Learning Studio session — this decides
   whether images render in the editor and in previews.
6. Whether a course's reference to a scenario pins to a version or follows the
   latest.
