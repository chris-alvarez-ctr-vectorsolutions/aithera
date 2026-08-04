# Scene Sweep → Universal Player — deferred, with a concrete plan

**Status:** Scene Sweep is intentionally **left on its bespoke page** (`scene-sweep-live.html`)
in the Option B player convergence. Branching Arc and Ensemble Arc are migrated onto
the shared player (`scenario-live.html?type=…`, driven by `js/sim-player.js`); Scene
Sweep is not. This document is the recommendation for finishing the job later.

_Author: Option B convergence pass, 2026-08-04. Grounded in a full read of
`scene-sweep-live.html` (4359 lines), `js/scenario-types/scene-sweep.js` (1464 lines),
and `js/sim-player.js` (214 lines)._

---

## Why it was deferred (the honest reason)

Branching and Ensemble were **cheap** to converge because they are the same *conversational*
interaction the shared player already renders. Each needed only:

1. a trivial `type.toRuntime()` (extract `fromPublishedX` — `normalize()` + `opening` +
   `sceneLineCaption`), and
2. for Ensemble, a small ported `deliverFirstPhase()` for its no-warm-up boot.

Everything else — the coach thread, scene mode, say/do split, tier ladder, locked entry
beats — was already in `scenario-live.html` + `js/sim-player.js`, and the A/B against the
frozen archive came out **byte-identical**.

Scene Sweep is a **different interaction paradigm** bolted onto the same tier ladder. Its
conversational half (the Observe / Remediate coach beats) IS the shared player already, but
its perception half — **tap the hazards on a photo** — is ~575 net-new lines the
conversational player has no concept of, PLUS two structural changes to the shared engine
that every already-shipped type (mix-arc, guided-arc, branching, ensemble) depends on.
Landing that in the same pass would bloat and de-risk-regress the universal player. It is a
clean, well-scoped **follow-on**, not a "force it now."

`scene-sweep-live.html` currently carries its OWN inlined **fork** of the ladder engine
(`entryBeatsFor / arcStateBlock / runArcEngine / closePhase / applyDeliver`). `closePhase`
and `applyDeliver` are byte-identical to `sim-player.js`; the divergences are surgical and
enumerated below.

---

## What has to move (coupling summary)

### A. Trivial (same as branching)
- **`fromPublishedSceneSweep`** (`scene-sweep-live.html:1734-1741`) → `scene-sweep.toRuntime()`.
  Identical shape to branching's: `normalize()` + `opening` + `sceneLineCaption`. It does
  **not** map `hazards`/`decoys`/`coverage`/`scene` into a runtime shape — those are read
  straight off `ACTIVE_SCENARIO` by the page. Keep it that way; the perception render reads
  the same fields.

### B. Shared-engine extensions (`js/sim-player.js`) — the risky part
1. **`arcStateBlock` spot-coverage hook.** For a `kind:'spot'` phase the page appends a
   `COVERAGE: n/total spotted (target r). Still unspotted — nudge toward these ZONES without
   naming them: […]` line (`scene-sweep-live.html:1968-1978`). `sim-player.js` has no notion
   of coverage. Add it behind a `kind==='spot'` guard so the other types are untouched.
   (Cosmetic: scene-sweep labels the state line `Beat` vs sim-player's `Phase` — normalize or
   parameterize.)
2. **`entryBeatsFor` phase-shape mismatch — the biggest reconcile.** Scene-sweep phases are
   **flat** (`signpost`/`prompt` at the top level, `kind:'spot'`/`'act'`), so its
   `entryBeatsFor` opens with `const e = phase.entry || phase;` (`1784`). `sim-player.js`
   assumes `phase.entry || {}` **and** emits an observe `kind:'clip'` media card for
   `phase.type === 'observe'` (`sim-player.js:47-51`). These are structurally incompatible.
   Reconcile by either (a) having `scene-sweep.toRuntime()` normalize its flat phases into the
   `{entry:{…}}` shape sim-player expects, or (b) teaching `entryBeatsFor` a flat-phase
   fallback behind a guard. **(a) is preferred** — keep the engine's phase shape single and
   canonical; let the type adapt in `toRuntime`.
3. **Turn parser `spotted` field + `state.covered` accumulation.** Small. The parser gets a
   `spotted:(id)=>HAZARD_IDS.has(id)` option (`1940`); `send()` merges
   `turn.spotted.forEach(id => state.covered.add(id))` **before** `runArcEngine`
   (`3677`) so the rail and the next state line reflect the model's credited catches. Both
   are additive and gated (branching/ensemble simply omit `spotted`).

### C. The net-new perception render module (the bulk)
A self-contained spatial UI with **no conversational equivalent**. ~220 lines of `.sweep-*`
CSS (`scene-sweep-live.html:354-575`) + these builders/handlers (~2088-2443):

| Function | Role |
|---|---|
| `sweepSceneNode` | Builds the full-bleed stage: `<img.sweep-photo>` + `#sweepHits` tap surface + `#sweepSvg` focusable regions + `#sweepPins` + a11y toggle/panel + toast + progress pill + CTA wrap + briefing overlay. |
| `onSweepTap` / `buildSweepRegions` / `layoutSweepRegions` / `activateRegion` | Pointer + **keyboard/SVG-region** marking paths (accessibility parity). |
| `markHazard` / `dropPin` / `positionPin` / `repositionPins` / `checkDecoy` | Mark → `state.covered.add` → pin + rail + HUD + a11y-list + announce. |
| `toggleA11yPanel` / `buildA11yPanel` / `refreshA11yList` / `matchFreeTextSweep` | The image-free path: free-text synonym matcher + region-list buttons. |
| `updateObserveHud` / `updateCoachRail` / `renderRailInto` | Top "Found N of M" pill + bottom CTA cluster; the coverage chip rail in React mode. |
| `flashToast` / `showSweepMiss` / `dismissBrief` | Miss toast + briefing overlay. |

`render()` integration points to replicate: mount-once guard (`sweepShouldMount`/
`sweepAlreadyMounted`, ~2936-2945), per-render HUD/rail refresh (2966/2974), the `.app.sweep`
class toggle (2860), the Observe|React mode relabel (2876-2884), and the sweep-specific
`showLookAgain` CTA (3012-3017 + the `#inputLookAgain` slot markup 1631-1638).

### D. `SceneSweepGeo` — already a shared module (good news)
`js/scenario-types/scene-sweep.js:662-741`, exported as `window.SceneSweepGeo`. Pure
letterbox geometry + hit-testing (`drawRect / toNormalized / toPixels / polyPixels /
centroid / inPoly / hitTest`). Already consumed by BOTH the live page and the Studio hotspot
editor so tap-math and place-math can't drift. **No work here** beyond loading it in
`scenario-live.html`.

### E. The crossing glue (Observe → coach conversation)
The sweep IS phase 0 (`kind:'spot'`; `DEFAULT.phases = [observe(spot), remediate(act)]` —
prevention folds into the remediate debrief + the guaranteed playbook close). The glue:
- `startSession` diverts on `IS_SWEEP` (`4066`) into `enterMarking()` instead of raising the
  coach with a reflection prompt — the **photo marking replaces the free-text warm-up**.
- `crossToReact()` (`4112-4140`) is the hand-off: first cross seeds `phaseIdx=0` manually,
  delivers a short warm opener, then auto-fills the composer with `freshMarkSummary(reason)`
  (a first-person "I marked …" built from the marked set) and calls `send()` so the coach
  credits the catches through the normal turn engine. Re-cross reports only NEW finds
  (`reportedToCoach` diff).
- **Coach-only `deliverTurn` gate** (`intoDebrief`, `3782-3783`): scene-sweep never flips
  `hasEnteredScene` (no character scene), so the normal close route (`hasEnteredScene &&
  mode==='scene'`) would never fire; it adds a `state.complete ||` disjunct to route the
  final coach recap through the closing flow. This gate is safe to add to the shared player
  unconditionally (it only *adds* a completion route).

Once in React, the coach conversation reuses the **exact** branching/ensemble render
(`coachNode`, `youCoachNode`, `reconcileCoachBody`, `markActivePrompt`). `SCENE_SAYDO=false`;
character/say-do code is dead for this type.

---

## Recommended architecture: a shared, opt-in perception module

Do **not** inline the perception UI into `scenario-live.html`. Extract it once, mount it only
when a phase needs it. Target shape:

```
js/sim-perception.js   ← NEW. window.SimPerception.mount({ host, scenario, state,
                          fillT, onCross }) → the sweep stage + a11y paths + coverage rail,
                          driving state.covered / state.decoysChecked. Uses SceneSweepGeo.
                          DOM-aware sibling of sim-player.js (which stays DOM-free).
js/sim-player.js       ← EXTEND (guarded on kind==='spot'): the coverage state block; the
                          spotted parser field is wired by the page, not the engine.
scenario-live.html     ← WIRE: load scene-sweep.js + sim-perception.js; when the runtime has
                          a kind:'spot' phase, mount SimPerception in the scene anchor and
                          route its onCross → the existing crossToReact/deliverFirstPhase
                          path. Everything else is the shared conversational player.
scene-sweep.js         ← ADD toRuntime() (normalize flat phases into the engine's {entry}
                          shape per B2); flip previewUrl to scenario-live.html?type=scene-sweep.
```

This keeps `sim-player.js` DOM-free and lean, keeps the perception UI out of the four
conversational types' code path entirely (it only loads/mounts for `kind:'spot'`), and
achieves true convergence for the conversational half (which is already shared).

---

## Staged implementation (each stage independently verifiable, A/B vs the frozen archive)

1. **Extract `SimPerception`.** Move the `.sweep-*` CSS + the §C functions verbatim into
   `js/sim-perception.js` behind a `mount()` API, driving `state.covered`/`decoysChecked` and
   emitting an `onCross(reason)` callback. Prove it in **`scene-sweep-live.html`** first
   (page calls `SimPerception.mount` instead of its inline copy) — the bespoke page must stay
   byte-identical. This de-risks the extraction before the shared player is involved.
2. **Extend `sim-player.js`** with the coverage state block (guarded `kind==='spot'`). Prove
   mix/guided/branching/ensemble are unchanged (they have no spot phase → no new output).
3. **`scene-sweep.toRuntime()`** — normalize flat phases into the `{entry:{…}}` shape (B2),
   plus `opening` + `sceneLineCaption`. Register the type in `scenario-live.html`'s
   `TYPE_GLOBALS`/resolver (scene-sweep IS registered in the Studio, so `AitheraStudio.get`
   already resolves it; just load the module).
4. **Wire `scenario-live.html`:** load `scene-sweep.js` + `sim-perception.js`; on a
   `kind:'spot'` runtime, mount `SimPerception`, add the `spotted` parser option, the
   `state.covered` accumulation in `send()`, the coach-only `intoDebrief` disjunct, and the
   `showLookAgain` CTA. Reuse the ported `deliverFirstPhase`/`crossToReact` path.
5. **A/B end-to-end** at `scenario-live.html?type=scene-sweep` vs
   `archive/2026-08-04/scene-sweep-live.html`: mark hazards (pointer + keyboard + free-text),
   cross to the coach, confirm the coverage rail, per-hazard Observe/Remediate beats, the
   guaranteed playbook close, and reduced-motion + screen-reader parity.
6. **Flip** the index card + `scene-sweep.js` `previewUrl` to
   `scenario-live.html?type=scene-sweep`; bump `?v` everywhere `scene-sweep.js` /
   `sim-player.js` / the new `sim-perception.js` load (scene-sweep-live.html [frozen],
   writer-studio-v2.html, a11y-audit.html, scenario-live.html); commit + FF-push. Freeze the
   bespoke page in the archive.

---

## Risks & watch-items

- **`entryBeatsFor` reconcile (B2)** is the one change that touches a code path all four
  shipped types use. Prefer adapting in `toRuntime` (normalize flat → `{entry}`) over editing
  the engine's beat builder, so the engine's phase shape stays single. Re-run the byte-identical
  A/B on branching + ensemble after this stage.
- **Accessibility parity is a first-class requirement, not a nice-to-have.** The a11y audit
  (`a11y-audit.html:386`) specifically credits Scene Sweep's shared `SceneSweepGeo` hit layer
  and focusable SVG regions as the fix for the pointer-only blocker. Any extraction MUST carry
  the keyboard / region-list / free-text marking paths intact, and keep the "coverage announced
  twice" residual (announce() + `#sweepProgress`) in mind (collapse to one).
- **Studio coupling:** `SceneSweepGeo` is shared with the Studio hotspot editor. Moving the
  *module* is safe (it already lives in `scene-sweep.js`); do not fork it.
- **The perception module is DOM-aware** — keep it OUT of `sim-player.js` (which is DOM-free by
  construction and is the runtime sibling of `studio-shell.js`). `sim-perception.js` is the
  right home.

## Acceptance (when this is done)
`scenario-live.html?type=scene-sweep` plays the full HazCom "Spot the Hazard" arc — photo
sweep (pointer + keyboard + free-text) → coverage grading → per-hazard Observe/Remediate coach
beats → guaranteed playbook close — **byte-identical to the frozen archive**, with the four
already-migrated types unchanged. Card + `previewUrl` flipped; bespoke page frozen.
