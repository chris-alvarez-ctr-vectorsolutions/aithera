# Writer Studio — architecture & contracts

The **Writer Studio** is the authoring tool behind the Scenario Simulator. A
content designer fills structured, plain-language fields (never raw prompt
text); a per-type **compiler** assembles the LLM system prompt around locked,
safety-critical sections the designer can see but not break; and the same draft
data drives the learner-facing **live pages**.

This document is the map a developer needs to extend or productionize the tool.
It is a **vanilla-JS prototype** — no framework, no build step, no backend
(persistence is `localStorage`). The seams below are where a real backend, auth,
and an LLM API would slot in.

---

## 1. The big picture

```
                    ┌─────────────────────────────┐
                    │  studio-engine.js           │  type registry + per-type
                    │  window.AitheraStudio       │  localStorage store
                    │  { register, get, list,     │
                    │    makeKeys, makeStore }     │
                    └───────────────┬─────────────┘
        registers into ▲            │ list()/get() read by
                        │           ▼
   ┌────────────────────┴──┐   ┌────────────────────────────────┐
   │ scenario TYPE modules │   │ studio-shell.js (the app)      │
   │ scenario.js           │   │ generic: renders the phase     │
   │ scenario-types/*.js   │   │ rail, drives the TYPE contract │
   │  → a TYPE object each │   │ (sections/renderFields/lints/  │
   └───────────┬───────────┘   │  compile/previewUrl/playtest/  │
               │ type.wizard    │  wizard). NO per-type branches.│
               ▼ attached by    └────────────────────────────────┘
   ┌───────────────────────────┐
   │ studio-wizard.js (engine) │  the start-from-scratch wizard:
   │ + studio-v2-*.js (specs)  │  brief → interview → staged LLM
   │ + studio-wizard-craft.js  │  generation. Specs share craft.
   └───────────────────────────┘
```

**The one idea that makes it a product and not a pile of pages:** the shell is
**type-agnostic**. It talks only to a TYPE's public surface — it never knows
which pedagogy it is editing. Adding a pedagogy is adding a TYPE module + an
include line; the shell does not change. (Grep `studio-shell.js` for `type.id
===` — there are zero such branches.)

---

## 2. Script load order (writer-studio-v2.html)

Order matters: the engine must exist before a TYPE registers; a TYPE must exist
before its wizard spec patches it; the shared craft must exist before the specs
compose their prompts.

| # | File | Role |
|---|------|------|
| 1 | `scene-context.js` | reusable narrated/reading context-setter (shared with live pages) |
| 2 | **`studio-engine.js`** | the type **registry** + per-type store. Must load first. |
| 3 | `say-do-split.js` | learner-move say/do splitter (playtest + sandbox) |
| 4 | **`scenario.js`** | the **action-practice** TYPE. Also exposes `window.AitheraScenario` — the shared base every other type reads (`ENGINE_SECTIONS`, `CRISIS_FLOOR`). Load before the other types. |
| 5 | `scenario-types/{guided-arc,teach-back,scene-sweep,ensemble-arc,mix-arc}.js` | the other TYPE modules. Registration order = mode-picker order. `observe-react.js` still exists but is **no longer loaded** — retired 2026-08-05, its one experience now a Mix & Match example. |
| 5b | `scenario-v4.js` · `scenario-v4-runtime.js` · `scenario-v4-scopes.js` · `scenario-v4-templates.js` | the POC V4 layer: schema + loader rules + content lint; the single V4→runtime compiler; per-scope prompt compilation; the seven V4 starting templates. |
| 5c | `scenario-types/v4-universal.js` | the **v4-universal** TYPE — authors Scenario CML v4 directly and owns the Dev handoff export. Reads all four V4 modules plus mix-arc's prompt builder, so it loads after them. |
| 6 | **`studio-wizard-craft.js`** | shared wizard helpers + the invariant coach-voice atoms. Before the wizard engine + specs. |
| 7 | `studio-wizard.js` | the wizard **engine** (`window.AitheraStudioWizard`). |
| 8 | `studio-v2-guided-arc.js` | guided-arc's V2 re-presentation (Learn/Practice rail) **and** its wizard spec. |
| 9 | `studio-v2-wizards.js` | wizard specs for action-practice, teach-back, observe-react (the observe-react spec is inert while the type is unloaded). |
| 10 | `studio-v2-ensemble-wizard.js` | the ensemble wizard spec (its own module — the richest schema). |
| 11 | `studio-v2-scene-sweep-wizard.js` | the scene-sweep wizard spec (its own module — a visual scene + perception rubric; photo/hotspots stay a manual editor step). |
| 11b | `studio-v2-mix-arc-wizard.js` | the Mix & Match wizard spec (composed beats, one interaction type per beat). |
| 12 | **`studio-shell.js`** | the studio app logic. Loads last (needs everything registered). |

`writer-studio.html` (V1) is **retired** — a thin redirect to
`writer-studio-v2.html` that preserves `?type=` / `?wizard=` deep-links. V2 is a
strict superset (the same engine/types/storage + the Learn/Practice rail + the
wizard). There is one shell; edit it, not two.

---

## 3. The TYPE contract

A "scenario type" is a plain object a module registers with
`AitheraStudio.register(TYPE)`. The shell + wizard read only this surface.

### 3a. Required fields (every registered type)

| Field | Shape | Who consumes it |
|-------|-------|-----------------|
| `id` | string, unique | registry key, `?type=`, storage namespace |
| `label` | string | mode picker, wizard chooser |
| `icon` | Font Awesome class (`fa-…`) | mode picker |
| `blurb` | one-line string | mode picker card (the type owns its own description — the shell holds no per-type copy) |
| `DEFAULT` | a complete exemplar scenario object | "Reset to shipped"; the live page's fallback when nothing is published |
| `ENGINE_SECTIONS` | array of locked prompt-section descriptors | the Guardrails inspector tab; the compiler |
| `isValid(scenario)` | → boolean | store: reject malformed published/library data |
| `normalize(scenario)` | → scenario | store + shell: fill defaults / migrate older drafts |
| `blank()` | → an EMPTY scenario | "Blank canvas" + the wizard's `start()` (never merge with DEFAULT — that leaks demo content) |
| `merge(draft)` | → scenario | shell: merge a stored draft over the type's defaults |
| `compile(scenario)` | → prompt string **or** ordered `[{role,label,text}]` | the Compiled-prompt tab; the live page's system prompt |
| `fill(template, …)` | → string | placeholder substitution (`{{learner}}` etc.); identity when a type has no placeholders |
| `highlightStrings(scenario)` | → string[] | shell: highlight designer text inside the compiled prompt |
| `previewUrl(scenario)` | → live-page URL | "Learner preview". Usually a constant; **may read the scenario** (action-practice routes story vs. roleplay). |
| `sections` | array of `{ id, title, group, … }` | the editor form. Empty ⇒ no in-studio editor. |
| `renderFields(section, studioApi)` | builds the section's inputs | the editor form. |
| `lints(scenario, studioApi)` | → `[{ severity, section, message, … }]` | the Lints panel. |
| `playtest` | `{ presets, build(el, ctx) }` **or** `null` | the Playtest tab. `null` ⇒ publish + open the live page instead. |
| `store` | set at registration (see 3c) | draft/published/library persistence |

### 3b. Optional / per-type extras (deliberate variation — NOT drift to "fix")

These exist because pedagogies genuinely differ. Leave them alone unless the
pedagogy changes.

- **Locked-section add-ons** folded into `ENGINE_SECTIONS` and/or surfaced as a
  field: `CONDUCT_SECTION` (branching-arc, ensemble-arc), `THREAT_SECTION`
  (branching-arc), `MINOR_SECTION` (ensemble-arc), `GROUNDING_SECTION`
  (scene-sweep).
- `CRISIS_FLOOR`, `REF_BUDGET` — action-practice's safety floor + reference
  budget, reused by guided-arc via `window.AitheraScenario`.
- `previewUrl` is a **function** on action-practice (story vs. roleplay live
  page) but a constant arrow on the rest. Same field name, contract is "may read
  the scenario."
- `fill` is a real substituter on most types but an **identity stub** on
  teach-back / observe-react (no placeholders). This is correct, not a bug.

### 3c. Registration + storage idiom

Standard type (namespaced keys, wired at registration):

```js
const TYPE = { id: 'my-type', label: 'My Type', icon: 'fa-…', blurb: '…',
               /* …contract fields… */ };
// Optional: expose a global if a live page consumes the type directly.
window.AitheraMyType = TYPE;
if (window.AitheraStudio) {
  const S = window.AitheraStudio;
  TYPE.store = S.makeStore(S.makeKeys(TYPE.id), { isValid, normalize });
  S.register(TYPE);
}
```

`makeKeys(id)` namespaces localStorage by type:
`aithera.writerStudio.draft.<id>.v1`, `aithera.scenario.published.<id>.v1`,
`aithera.writerStudio.library.<id>.v1`, plus a shared `workerUrl`. `makeStore`
gives every type identical draft/published/library persistence with quota-safe
writes.

> **Documented exception:** action-practice passes its *original,
> un-namespaced* keys instead of `makeKeys('action-practice')`, so its
> already-shipped live pages keep reading the same localStorage. Don't
> "normalize" this away — it would orphan existing published scenarios.

> **Known cosmetic inconsistency (safe to unify later, low value):** some types
> wire `store` inline in the object literal, others just after it; some guard
> `register()` with `if (window.AitheraStudio)`, others don't (every page that
> loads a type also loads `studio-engine.js`, so both are safe). Left as-is to
> avoid churn on shipped modules.

### 3d. `branching-arc` is special

Branching Arc is authored **by hand in its `DEFAULT`** and run by
`branching-arc-live.html` directly off `window.AitheraBranchingArc`. It is
**not** loaded by the studio and **not** registered into the type registry (the
registry only holds authorable types). It still wires `TYPE.store` so the live
page's publish→live handoff (`BA.store.loadPublished()`) keeps working. If it
ever gets a real editor, give it `sections`/`renderFields`/`lints` and add its
`register()` call + a studio include.

---

## 4. `studioApi` — what the shell hands to `renderFields`

A type builds its inputs with these helpers and never re-implements the
plumbing:

```js
studioApi = {
  tf(path, label, opts),      // a bound vaadin-text-field / -area
  rowsBlock(listPath, renderRow, addLabel, makeItem),  // add/remove list editor
  rowCard(...),               // a single list row
  guidance(summary, icon, bodyHTML),  // collapsed guidance disclosure
  esc(str),                   // HTML-escape
  getScenario(),              // the live draft
  scheduleUpdate(),           // debounced recompile + save
}
```

Fields carry a `data-path`; edits flow back into the draft by path. Sections
declare a `group` (`meta` · `context` · `interaction` · `learn` · `practice` ·
`voicetone` · `debrief` · `reference`); the shell maps groups onto the phase
rail. A type on the generic `interaction` group shows one **Interaction** phase;
guided-arc (re-presented by `studio-v2-guided-arc.js`) splits into **Learn /
Practice / Voice & Tone**.

---

## 5. The wizard contract

The **engine** (`studio-wizard.js`) owns the modal, the step rail, the LLM call,
JSON extraction/repair, and the generation loop. It centralizes **all** worker
plumbing — model id, the token ceiling, the retry nudges. A type opts in by
exposing `type.wizard`, a spec the engine consumes:

```js
type.wizard = {
  title, tagline, intro, describePlaceholder,   // front-door copy
  steps: [ { id, title, sub, fields: [FieldDef] } ],
  derive(intake),                 // optional: fill defaults derived from answers
  start(type),                    // → a COMPLETE blank draft to fill (uses type.blank())
  plan(intake, type) → [ Task ],  // the ordered generation calls
  landNote(intake),               // optional: toast when the draft lands
}

FieldDef = { key, kind: 'text'|'area'|'lines'|'chips'|'toggle'|'source',
             label, helper?|placeholder?|minRows?|options?|default?,
             required?, showIf(intake)?, noSeed? }   // label/helper may be fn(intake)

Task = { id, label, detail?,
         build(intake, acc, type) → { system, user, maxTokens },
         apply(json, draft, intake, acc),
         doneNote?(json) }
```

The spec is **implied, not enforced** — there is no validator; a malformed spec
fails at runtime inside the generation loop. `branching-arc` has **no** wizard
(it is live-only, not in the studio registry); the engine renders the chooser
card disabled ("Guided setup isn't ready for this type yet") for any registered
type that lacks a `wizard`. `scene-sweep`'s wizard leaves the photo and hotspots
unset — those are placed by hand in the editor (the wizard can't see pixels).

### 5a. Attachment: reach-in patching

Specs are attached from **outside** the type module:
`const T = AitheraStudio.get('<id>'); if (!T || T.wizard) return; T.wizard = {…}`.
This keeps the TYPE modules studio-agnostic (they stay V1/live-page-safe) while
the studio bolts authoring on top. Guard `if (!T.wizard)` prevents double-attach.

### 5b. Shared craft — `window.AitheraWizardCraft`

Every spec used to re-declare the same intake helpers and, dangerously, its own
copy of the coach **voice rules** (the banned-phrase list, the grounding rule,
the JSON-output contract). Those drifted across 3–4 files. They now live once in
`studio-wizard-craft.js`:

```js
const { lines, trim, depunct, str, sourceBlock,
        BANNED_PHRASES, GROUNDING_BASE, CITATION_RULE, OUTPUT_JSON_RULE }
  = window.AitheraWizardCraft;
```

A spec **composes its own craft spine** from these atoms — the two-register
framing (what counts as learner-facing vs. guidance) is tailored per pedagogy on
purpose, but the invariant voice/grounding/output rules interpolate the shared
constants. **Edit the coach's forbidden voice once, in that file.**

Each task hard-codes its own `maxTokens`; the engine clamps to a 2000-token
ceiling and retries with a terser nudge if the model truncates. Model id lives
only in the engine.

---

## 6. How to add a new scenario type

1. **Create `js/scenario-types/<type>.js`.** Build the TYPE object (§3a).
   Extend the base sections with
   `const SHARED = (window.AitheraScenario && window.AitheraScenario.ENGINE_SECTIONS) || []; const XX = SHARED.concat([MY_LOCKED_SECTION]);`
   Register with the idiom in §3c. Add a `blurb`. Expose a
   `window.AitheraXxx` global if the live page reads the type directly.
2. **Add the include** to `writer-studio-v2.html`, after the other
   `scenario-types/*.js` lines (registration order = picker order). Bump its
   `?v=` (see §7).
3. *(Optional)* **Give it an editor** — real `sections` + `renderFields` +
   `lints`. Omit (or stub) to make it a publish-and-open-the-live-page type.
4. *(Optional)* **Give it a wizard** — a new `js/studio-v2-<type>-wizard.js`
   (or another `attach*()` in `studio-v2-wizards.js`) that consumes
   `window.AitheraWizardCraft` and sets `T.wizard`. Include it after the type
   module.
5. **Build the live page** `<type>-live.html` (load `studio-engine.js` +
   `scenario.js` + your type module; read the type via its global or
   `AitheraStudio.get`; call `type.compile()` for the system prompt).
6. **Register it in `index.html`** `SIM_SCHEMAS` with `studioType: '<id>'` so the
   lesson index's "Edit in Writer Studio" deep-link (→ `writer-studio-v2.html?type=<id>`)
   appears.

---

## 7. Cache-busting (no build step)

Every `<script src>`/`<link>` carries `?v=N`. When you change a shared JS/CSS
file, **bump `?v=` everywhere that file is loaded** (the TYPE modules are loaded
by many live pages, not just the studio) and bump the service-worker `VERSION`
— otherwise browsers serve stale modules. There is no bundler to invalidate for
you.

---

## 8. Where a real product slots in

- **Auth** → gate `writer-studio-v2.html` and the live pages; scope the store
  keys per user/org.
- **LLM API** → today the wizard + playtest POST to a worker-proxy URL held in
  `localStorage` (`aithera.writerStudio.workerUrl`). Replace with a
  server-side, authenticated call; the engine already centralizes the call site
  (`studio-wizard.js`).
- **Persistence** → `makeStore` is the single seam. Swap `localStorage` for an
  API behind the same `{ loadPublished, publish, saveToLibrary, … }` surface and
  nothing else changes.
- **Publish → live** → today publishing writes a localStorage slot the live page
  reads on the same browser. A backend would make this a real, shareable
  publish.

---

_Last mapped: 2026-08-18. Seven registered types — action-practice, guided-arc,
teach-back, scene-sweep, ensemble-arc, mix-arc, and **v4-universal** (which
authors Scenario CML v4 directly). All but v4-universal are wizard-enabled
(start-from-scratch). `branching-arc` stays live-only and hand-authored;
`observe-react` was retired from the registry on 2026-08-05._

_This document maps the Studio's own architecture. It is deliberately silent on
the POC V4 alignment — what V4 changed, what is still open, and who owns each
open decision live in `docs/V4-ALIGNMENT-NOTES.md`._
