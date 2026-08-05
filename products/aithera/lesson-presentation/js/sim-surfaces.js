/* =========================================================================
   SIM SURFACES — the runtime render-layer REGISTRY for the converged Scenario
   Simulator player (window.SimSurfaces).
   -------------------------------------------------------------------------
   The third registry in the system, symmetric with the other two:
     · AUTHOR types   — window.AitheraStudio.register  (js/studio-engine.js)
     · RUNTIME types  — the ?type= resolver             (scenario-live.html)
     · RENDER surfaces — THIS file                       (window.SimSurfaces)

   A "surface" is a custom, non-conversational interaction that OWNS a phase
   (keyed by that phase's `kind`) and reports its outcome up to the coach. The
   coach layer is overlaid on top; the surface makes it outcome-aware. Two
   surfaces exist today and they relate to the engine in DELIBERATELY different
   ways — factoring the interface from BOTH is what keeps it from over-fitting
   to either:

     · scene-sweep  (kind:'spot',  js/sim-perception.js) — a PERCEPTION canvas
       that HANDS INTO the ladder: after the sweep it crosses into a normal
       coach phase and the main model discusses/grades with a tier. It drives
       phaseIdx / pendingOpening / send() itself to enter the conversation.

     · teach-back   (kind:'teach', js/sim-teachback.js)  — a RETRIEVAL board
       that OWNS ITS PHASE LOOP: the learner fills topic tiles, a side model
       (Haiku) grades coverage, and the coach only bookends. The main turn
       engine never runs for that phase (ownsInput → onInput).

   BEFORE this registry the page was a switchboard: ~16 call sites hardcoded on
   `IS_SWEEP` / `PERCEPTION.*`. A second surface would have added a parallel
   `IS_TEACH` / `TEACH.*` set of the same branches — O(call-sites) cost per
   surface, and the shared renderer slowly filling with conditionals. The
   registry replaces that with ONE uniform interface the page calls
   polymorphically, so a new surface is ADDITIVE: register it here + drop in its
   module, with zero edits to the shared player. "Others stay byte-identical"
   stops being vigilance and becomes structural — no surface registered for a
   phase → no surface code runs, by construction.

   ── THE SURFACE INTERFACE ────────────────────────────────────────────────
   register({ kind, install }) — `kind` is the phase.kind this surface owns;
   `install(ctx)` returns the instance below (or null to decline). `ctx` is the
   same DOM-free-ish bag scene-sweep already took: { scenario, state, fillT,
   el, esc, announce, render, send, deliverOpening, getComposer,
   getCoachPanelBody }. The instance is a two-way `state` collaborator — it may
   read/write ladder-engine fields and drive render()/send() itself.

   Every member is OPTIONAL except `kind`; the page calls them with optional
   chaining, so a surface implements only the bands it needs.

     kind                     the phase kind this instance owns ('spot'|'teach')
     appClass                 CSS class toggled on `.app` while active ('sweep')

     ── outcome-aware coach (engine hooks) ──
     turnFields               { field: validator } merged into the turn parser
                              (scene-sweep: { spotted }). {} / omit for none.
     outcomeBlock(phase)      → string; the per-phase [SYSTEM STATE] addendum
                              folded into the coach prompt. MUST self-guard on
                              phase.kind and return '' for other phases. (This
                              is the one hook sim-player.js calls directly.)
     onTurn(turn)             consume the model turn's surface payload before the
                              ladder routes (scene-sweep: creditSpotted).

     ── lifecycle ──
     onStart()                → truthy to REPLACE the default startSession, i.e.
                              enter the surface's world instead of raising the
                              coach on a reflection prompt (scene-sweep:
                              enterMarking; teach-back: begin framing).
     ownsInput(phase)         → bool; the surface handles composer input for this
                              phase instead of the main turn engine (teach-back).
     onInput(text)            called with the learner's input when ownsInput.
     noCharacterScene         true when the surface never steps into a character
                              scene, so the close routes on state.complete
                              (both scene-sweep and teach-back set this).

     ── stage mount / render ──
     shouldMount()            → bool; mount the surface's full-bleed stage now
     mountSelector            querySelector that detects the stage is mounted
     stageNode()              build + return the stage DOM node (mounted once)
     onStageRender()          per-render sync while mounted (HUD/pins/board)
     onCoachRender()          per-render sync of coach-sheet extras (rail)

     ── two-world toggle (presentation) ──
     modeToggle               descriptor to relabel the toggle, or null to keep
                              the default Learn/Practice. Shape:
                              { ariaLabel, coach:{label,icon}, scene:{label,icon},
                                disabled(state,busy,mode), tip(seg,state,mode) }
     onToggle(which)          → truthy if the surface handled a toggle tap
                              (scene-sweep: enterObserve / crossToReact)

     ── surface-owned input-bar CTA (optional) ──
     cta                      { show(state) → bool, onClick() } for a bespoke
                              CTA that replaces the composer (scene-sweep:
                              "look again"). The page owns the element; the
                              surface owns when it shows + what it does.

   No framework, no build step. Loaded before the surface modules so they can
   register on load; scenario-live.html then calls SimSurfaces.install(ctx).
   See js/sim-perception.js (surface #1) and js/sim-teachback.js (surface #2).
   ========================================================================= */
(function () {
  'use strict';

  // kind → { kind, install } — the registered surface modules.
  const REGISTRY = Object.create(null);

  /* Register a surface module by the phase `kind` it owns. Idempotent per kind
     (last registration wins) so a module can be re-included without doubling. */
  function register(mod) {
    if (!mod || !mod.kind || typeof mod.install !== 'function') {
      throw new Error('SimSurfaces.register needs { kind, install }');
    }
    REGISTRY[mod.kind] = mod;
  }

  /* The registered module for a phase kind (or null). */
  function get(kind) {
    return (kind && REGISTRY[kind]) || null;
  }

  /* Which registered kinds a scenario uses — every phase.kind that has a
     registered surface, in phase order, de-duplicated. */
  function kindsFor(scenario) {
    const seen = Object.create(null);
    const out = [];
    ((scenario && scenario.phases) || []).forEach((p) => {
      const k = p && p.kind;
      if (k && REGISTRY[k] && !seen[k]) { seen[k] = 1; out.push(k); }
    });
    return out;
  }

  /* Resolve + install the ONE surface a scenario needs and return the instance
     (or null for the conversational types, which register no surface for their
     phase kinds). Per-phase resolution is honored two ways: install picks by the
     phase kind present, and the instance's per-phase hooks (outcomeBlock) self-
     guard on phase.kind. A scenario has exactly one surface today; the registry
     shape (kindsFor → many) leaves room for a mixed ladder later without a
     player edit. */
  function install(ctx) {
    const kinds = kindsFor(ctx && ctx.scenario);
    if (!kinds.length) return null;              // conversational → no surface code runs
    const mod = REGISTRY[kinds[0]];
    const inst = mod.install(ctx);
    if (!inst) return null;
    // Stamp the owning kind so per-phase dispatch can compare against phase.kind
    // even if the surface didn't set it.
    if (!inst.kind) inst.kind = mod.kind;
    return inst;
  }

  window.SimSurfaces = { register, get, install, kindsFor, _registry: REGISTRY };
})();
