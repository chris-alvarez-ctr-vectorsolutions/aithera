# Writer Studio — Dev Review Quick Reference

A speaking reference for reviewing the Writer Studio prototype with the dev team.
Covers **how it works**, **what it outputs**, and **how it's structured**. Anything
that is a scaffold of *this prototype* (the Cloudflare Worker, localStorage, no
build step) is quarantined in the last section — that's the part production
replaces.

> Deeper companion doc for developers: `js/README.writer-studio.md` (architecture
> + contracts). This brief is the 5-minute version.

---

## 1. What it is (one sentence)

The Writer Studio is the **authoring tool behind the Scenario Simulator**. A
content designer fills **structured, plain-language fields** — never raw prompt
text — and a per-type **compiler** assembles the LLM system prompt around locked,
safety-critical sections the designer can *see but not break*. **The same draft
data drives the learner-facing live pages.**

The talking point: *designers author meaning, the tool authors the prompt.*

---

## 2. How it works — the flow

```
  Pick a scenario type ─┬─► Fill structured fields (the editor)
                        └─► or "Start from scratch" (the wizard: brief → interview → staged generation)
                                    │
                                    ▼
                        Draft (a plain JSON scenario object)
                                    │
                        type.compile(draft)  ──►  the LLM system prompt
                                    │
                        Playtest (run the draft against the live model, no publish)
                                    │
                        Publish  ──►  live page reads the published draft and runs the scenario
```

Two ways in:
- **Editor** — structured form; every field maps to a `data-path` in the draft.
- **Wizard ("Start from scratch")** — a short brief + interview, then a sequence
  of model calls generate a complete first-draft scenario the designer then edits.

**The one architectural idea worth stating out loud:** the app shell is
**type-agnostic**. It never knows which pedagogy it's editing — it only talks to a
type's public surface. Adding a new scenario type is adding a module + one include
line; the shell doesn't change. (There are *zero* `if (type.id === …)` branches in
the shell.)

---

## 3. How it's structured — the layers

| Layer | File(s) | Role |
|---|---|---|
| **Engine / registry** | `js/studio-engine.js` | `window.AitheraStudio` — `register / get / list` the types, plus the per-type storage factory. Loads first. |
| **Scenario TYPE modules** | `js/scenario.js` + `js/scenario-types/*.js` | One plain object per pedagogy. Owns its fields, its locked sections, and its `compile()`. |
| **The app shell** | `js/studio-shell.js` | Renders the phase rail, the editor, and the inspector. Generic — drives the type contract, no per-type logic. |
| **The wizard** | `js/studio-wizard.js` (engine) + `studio-v2-*.js` (per-type specs) + `studio-wizard-craft.js` (shared voice/output rules) | Start-from-scratch generation. |
| **The page** | `scenario-editor/index.html` | The shell markup + script load order. Its bare folder URL is always the stable editor; `?v=2` hands off to `scenario-editor/sandbox/` for experiments, with isolated drafts. (`writer-studio.html` and `writer-studio-v2.html` are retired redirects.) |

**The scenario types** (the pedagogies you can author):

1. **Action Practice** — the original; roleplay or story.
2. **Guided Arc** — Learn → Practice arc (the flagship; splits the rail into Learn / Practice / Voice & Tone).
3. **Teach-Back**
4. **Scene Sweep** — "spot the hazard" visual perception grading.
5. **Ensemble Arc** — multi-character, richest schema.
6. **Mix & Match** — composed beats, one interaction type per beat.
7. **Universal Scenario (v4)** — authors **Scenario CML v4** directly and owns the Dev handoff export.

Two types are no longer in the registry: **Observe & React** (retired 2026-08-05 — its one
experience is now a Mix & Match example) and **Branching Arc** (*live-only, hand-authored*).

**What a "type" must provide** (the contract the shell relies on): an `id/label/icon/blurb`,
a shipped `DEFAULT` exemplar, the locked `ENGINE_SECTIONS`, validation/normalize/merge
helpers, `compile()`, the editor `sections` + `renderFields`, `lints()`, a `previewUrl`,
and optionally a `wizard` spec and a `playtest` block.

**The UI has three columns:**
- **Left — phase rail** that mirrors the *learner's* journey: Start → Scenario Context
  → Learn → Practice (or a single "Interaction" for simpler types) → Voice & Tone →
  Debrief & Close. A phase only appears if the type uses it.
- **Center — the editor form** for the selected phase.
- **Right — the inspector**, four tabs: **Compiled prompt**, **Guardrails** (the
  locked sections), **Playtest**, **Say/Do Split**.

---

## 4. What it outputs

The studio produces three things, all from the one draft object:

1. **The compiled system prompt** — the primary artifact. `type.compile(draft)`
   returns either a prompt string or an ordered `[{role, label, text}]` set. This
   is what the live page sends to the model. Designer-authored text is *interpolated
   into* locked, non-editable safety sections (crisis floors, grounding, output
   contract) — visible in the **Guardrails** tab, un-editable by design.
2. **A published scenario** — the draft JSON written to a "published" slot that the
   matching `*-live.html` page reads to run the actual learner experience.
3. **A saved library** — named same-browser drafts the designer can reload.

Supporting outputs in the inspector: live **Guardrails** view, a **Playtest**
transcript, **Lints** (authoring warnings), and the **Say/Do Split** preview of how
a learner's move is parsed into say-vs-do beats.

**Framing for devs:** the durable output is *structured scenario data + a
deterministic compiler*. The prompt is derived, not hand-written — so prompts stay
consistent and the safety sections can't be edited away.

---

## PROTOTYPE-SPECIFIC — scaffolding, not the product

Everything below exists because this is a **vanilla-JS prototype with no backend,
no framework, and no build step**. These are the seams a real product replaces.
Call this out early in the review so nobody mistakes scaffolding for architecture.

### The Cloudflare Worker (the LLM proxy)

- **What it is:** a thin Cloudflare Worker that proxies the browser's model calls.
  The prototype has no server, so the wizard and Playtest `POST` straight to it.
- **Default URL:** `https://aithera-action-proxy.vector-aithera.workers.dev`
  (overridable per-browser; stored in `localStorage` under
  `aithera.writerStudio.workerUrl`, shared across every type and the Playtest).
- **The call:** `POST` JSON `{ model, max_tokens, system, messages:[{role:'user',content}] }`;
  response parsed Anthropic-style (`data.content[].text`, `stop_reason`).
- **Model:** `claude-opus-4-8`, pinned in the engine (`studio-wizard.js`, one place).
- **Token ceiling:** each generation step requests its own `max_tokens`, **clamped to
  2000** — the Worker caps there. If a step truncates mid-JSON, the engine retries
  once with a "be terser" nudge; if the JSON is malformed, it retries once demanding
  JSON-only.
- **Why it matters for the review:** the call site is *already centralized*. Production
  swaps this Worker for a **server-side, authenticated** LLM call behind the same
  interface — no rewrite of the types or the shell.

### Persistence — `localStorage`

- Draft, published, and library slots are **browser localStorage**, namespaced per
  type (`aithera.writerStudio.draft.<id>.v1`, `aithera.scenario.published.<id>.v1`,
  `aithera.writerStudio.library.<id>.v1`).
- **Publish → live is a same-browser handoff:** publishing writes a localStorage
  slot that the live page reads *on the same machine*. There is no shared/remote
  publish yet.
- ~5 MB origin cap; writes are quota-guarded (an embedded photo can blow the budget,
  hence a friendly "image too large" message rather than a silent failure).
- **The seam:** all persistence goes through one factory (`makeStore`). Swap
  localStorage for an API behind the same `{ loadPublished, publish, saveToLibrary … }`
  surface and nothing else changes.

### No auth

- The studio and the live pages are **open** — no login, no per-user/org scoping.
  Production gates the pages and scopes the store keys per user/org.

### No build step / cache-busting

- Plain `<script>`/`<link>` tags, no bundler. Every include carries a `?v=N` query
  string; shared files must have `?v=` bumped everywhere they're loaded (plus the
  service-worker `VERSION`) or browsers serve stale modules. A real build pipeline
  makes this automatic.

### Review-only tooling (strip for production)

- The bottom-center **toolbox dock** and its **🗺 Flow Map** are review/handoff tools,
  **not part of the product** — the `toolbox.js` include is stripped for dev handoff.

---

## Where production slots in (the summary slide)

| Prototype today | Production replaces with |
|---|---|
| Cloudflare Worker proxy, model pinned client-side | Server-side, authenticated LLM call (same call site) |
| `localStorage` draft/published/library | API behind the same store interface |
| Same-browser publish→live | Real, shareable publish |
| Open pages | Auth + per-user/org scoping |
| `?v=` hand cache-busting | Build pipeline |

_Last updated: 2026-08-18. Source of truth: `js/README.writer-studio.md`. For the POC V4
alignment — what V4 changed, what is still open, and who owns each open decision — see
`docs/V4-ALIGNMENT-NOTES.md`._
