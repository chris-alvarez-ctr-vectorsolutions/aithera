/* =========================================================================
   SIM PERCEPTION — the OPT-IN spatial "spot the hazard" layer of the converged
   Scenario Simulator player (window.SimPerception).
   -------------------------------------------------------------------------
   The DOM-aware sibling of js/sim-player.js (the DOM-free tier engine). Where
   sim-player drives the coach-conversation ladder every type shares, THIS module
   carries the one thing the conversational player has no concept of: a full-bleed
   PHOTO the learner sweeps for hazards (the "Observe" world), with pins, a
   coverage rail, and a fully image-free accessibility path (keyboard SVG regions,
   a region list, and a free-text sweep) — so mouse, keyboard, and screen-reader
   learners all mark the same targets.

   It mounts ONLY for a scenario that has a kind:'spot' phase (scene-sweep). Every
   other type never loads or installs it, so the four conversational types
   (mix-arc, guided-arc, branching, ensemble) are untouched by construction.

   Extracted VERBATIM from scene-sweep-live.html so the arc plays byte-for-byte
   the same through the shared player as through its old bespoke page. The letterbox
   geometry + hit-test stay in the SHARED window.SceneSweepGeo module (defined in
   js/scenario-types/scene-sweep.js) so the learner's "tap it" math is identical to
   the Studio author's "place it" math — they can never drift.

   Usage (in scenario-live.html, once ACTIVE_SCENARIO + state exist, ONLY when the
   scenario has a kind:'spot' phase):
     const PERCEPTION = SimPerception.install({
       scenario, state, fillT,
       el, esc, announce,                 // shared DOM helpers
       getCoachPanelBody, getComposer,    // DOM refs (getters — resolved at runtime)
       send, deliverOpening, render,      // the page's turn-engine primitives
     });
   Then the page wires the hooks it returns (sceneNode / updateHud / updateRail /
   reposition / enterMarking / creditSpotted / coverageBlock / spottedValidator …).

   No framework, no build step. See SCENE-SWEEP-CONVERGENCE-PLAN.md.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- the sweep stylesheet, injected once on first install --------------
     Lifted verbatim from scene-sweep-live.html's <style>. Scoped to .sweep-*
     and .app.sweep so it can't touch the conversational types. */
  const CSS = `
      /* React mode: dim + blur the busy photo so the coach reads clearly over it. */
      .app.sweep.coach-up .scrim { opacity: 1; }
      .app.sweep .stage.is-frozen { filter: blur(6px) brightness(.7); }
      /* Observe mode: the composer is meaningless — the learner taps the scene. */
      .app.sweep[data-mode="scene"] .inputbar { display: none; }
      .app.sweep .stage-inner { justify-content: center; }
      .sweep-scene { position: absolute; inset: 0; }
      .sweep-stage { position: absolute; inset: 0; background: #0b0d12; overflow: hidden; }
      .sweep-photo {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: contain; -webkit-user-select: none; user-select: none;
      }
      .sweep-stage::after {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(180deg, rgba(0,0,0,.34) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 58%, rgba(0,0,0,.44) 100%);
      }
      .sweep-hits { position: absolute; inset: 0; cursor: crosshair; z-index: 2; }
      .sweep-pins { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
      .sweep-pin {
        position: absolute; transform: translate(-50%, -50%);
        display: flex; flex-direction: column; align-items: center; gap: 6px;
        animation: pin-drop .3s var(--ease) both;
      }
      @keyframes pin-drop { from { opacity: 0; transform: translate(-50%,-50%) scale(.5); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
      .sweep-pin-ring {
        width: 52px; height: 52px; border-radius: 50%;
        border: 3px solid #4adebe; display: grid; place-items: center;
        box-shadow: 0 0 0 4px rgba(74,222,190,.18), 0 0 22px rgba(74,222,190,.5);
        animation: pin-pulse 1.8s ease-in-out infinite;
      }
      @keyframes pin-pulse {
        0%,100% { box-shadow: 0 0 0 4px rgba(74,222,190,.18), 0 0 22px rgba(74,222,190,.5); }
        50%     { box-shadow: 0 0 0 8px rgba(74,222,190,.05), 0 0 30px rgba(74,222,190,.72); }
      }
      .sweep-pin-ring .n { width: 25px; height: 25px; border-radius: 50%; background: #4adebe; color: #07221c; display: grid; place-items: center; font-weight: 800; font-size: 13px; }
      .sweep-pin-label {
        padding: 3px 9px; border-radius: 7px; font-size: 11.5px; font-weight: 700;
        background: rgba(7,34,28,.92); border: 1px solid rgba(74,222,190,.5);
        color: #d9fff5; white-space: nowrap; max-width: 42vw; overflow: hidden; text-overflow: ellipsis;
      }
      @media (prefers-reduced-motion: reduce) { .sweep-pin, .sweep-pin-ring { animation: none; } }
      .sweep-svg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 3; pointer-events: none; overflow: visible; }
      .sweep-region { pointer-events: auto; cursor: crosshair; fill: rgba(0,0,0,.001); stroke: transparent; stroke-width: 2px; stroke-linejoin: round; vector-effect: non-scaling-stroke; outline: none; transition: fill .18s var(--ease), stroke .18s var(--ease); }
      .sweep-region:focus-visible { fill: rgba(74,222,190,.16); stroke: #fff; stroke-width: 3px; stroke-dasharray: 5 4; }
      .sweep-region.got { fill: rgba(74,222,190,.20); stroke: #4adebe; }
      .sweep-region.got:focus-visible { stroke: #fff; }
      .sweep-region.decoy.checked { fill: rgba(255,255,255,.08); stroke: rgba(255,255,255,.6); stroke-dasharray: 6 4; }
      .app.sweep:not([data-mode="scene"]) .sweep-svg { pointer-events: none; }
      @media (prefers-reduced-motion: reduce) { .sweep-region { transition: none; } }
      .sweep-a11y-toggle {
        position: absolute; top: 16px; right: 16px; z-index: 5;
        width: 42px; height: 42px; border-radius: 50%; cursor: pointer;
        display: grid; place-items: center; font-size: 17px; color: #fff;
        background: rgba(0,0,0,.55); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,.16);
      }
      .sweep-a11y-toggle:hover { background: rgba(0,0,0,.72); }
      .sweep-a11y-toggle[aria-expanded="true"] { background: #fff; color: #111; }
      .sweep-a11y-panel {
        position: absolute; top: 0; right: 0; bottom: 0; z-index: 7; width: min(360px, 88vw);
        background: rgba(17,19,24,.97); backdrop-filter: blur(12px);
        border-left: 1px solid rgba(255,255,255,.12); box-shadow: -12px 0 40px rgba(0,0,0,.5);
        padding: 20px 18px; overflow-y: auto; color: #fff;
        display: flex; flex-direction: column; gap: 14px;
        animation: a11y-in .22s var(--ease) both;
      }
      @keyframes a11y-in { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }
      @media (prefers-reduced-motion: reduce) { .sweep-a11y-panel { animation: none; } }
      .sweep-a11y-panel[hidden] { display: none; }
      .sweep-a11y-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .sweep-a11y-head h3 { margin: 0; font-size: 15px; font-weight: 800; }
      .sweep-a11y-head p { margin: 4px 0 0; font-size: 12.5px; line-height: 1.5; color: rgba(255,255,255,.72); }
      .sweep-a11y-close { flex: none; width: 30px; height: 30px; border-radius: 8px; border: 1px solid rgba(255,255,255,.16); background: transparent; color: #fff; cursor: pointer; }
      .sweep-a11y-sec-lbl { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,.5); }
      .sweep-ft-row { display: flex; gap: 8px; }
      .sweep-ft-input { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 9px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.06); color: #fff; font: inherit; font-size: 13.5px; }
      .sweep-ft-input::placeholder { color: rgba(255,255,255,.5); }
      .sweep-ft-btn, .sweep-region-btn { font: inherit; cursor: pointer; }
      .sweep-ft-btn { flex: none; padding: 0 15px; border-radius: 9px; border: 0; background: #4adebe; color: #06231d; font-weight: 800; font-size: 13px; }
      .sweep-ft-hint { font-size: 12px; color: rgba(255,255,255,.62); margin: 2px 0 0; line-height: 1.45; }
      .sweep-region-list { display: flex; flex-direction: column; gap: 8px; }
      .sweep-region-btn {
        display: flex; align-items: center; gap: 10px; text-align: left; width: 100%;
        padding: 11px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.05); color: #fff; font-size: 13px; line-height: 1.4;
      }
      .sweep-region-btn:hover { background: rgba(255,255,255,.1); }
      .sweep-region-btn:focus-visible { outline: 2px solid #4adebe; outline-offset: 2px; }
      .sweep-region-btn .ic { flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; background: rgba(255,255,255,.12); }
      .sweep-region-btn[aria-pressed="true"] { border-color: #4adebe; background: color-mix(in srgb, #4adebe 20%, transparent); }
      .sweep-region-btn[aria-pressed="true"] .ic { background: #4adebe; color: #06231d; }
      .sweep-region-btn.is-checked { border-color: rgba(255,255,255,.4); opacity: .82; }
      .sweep-toast {
        position: absolute; left: 50%; top: 76px; transform: translateX(-50%) translateY(-6px);
        z-index: 5; pointer-events: none; color: #fff;
        max-width: min(86vw, 460px); text-align: center; line-height: 1.4;
        background: rgba(0,0,0,.78); backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,.14);
        padding: 9px 17px; border-radius: 16px; font-size: 12.5px; font-weight: 600;
        opacity: 0; transition: opacity .2s var(--ease), transform .2s var(--ease);
      }
      .sweep-toast.on { opacity: 1; transform: translateX(-50%) translateY(0); }
      .app.sweep:not([data-mode="scene"]) .sweep-a11y-toggle,
      .app.sweep:not([data-mode="scene"]) .sweep-a11y-panel { display: none !important; }
      .sweep-progress {
        position: absolute; left: 50%; top: 16px; transform: translateX(-50%);
        z-index: 4; display: inline-flex; align-items: center; gap: 12px; color: #fff;
        background: rgba(0,0,0,.55); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,.14); border-radius: 999px; padding: 8px 16px;
      }
      .sweep-progress .lbl { font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; }
      .sweep-progress .lbl i { color: #4adebe; }
      .sweep-progress .dots { display: inline-flex; gap: 6px; }
      .sweep-progress .dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,.2); transition: background .3s var(--ease), transform .3s var(--ease); }
      .sweep-progress .dot.on { background: #4adebe; transform: scale(1.12); }
      .sweep-cta-wrap {
        position: absolute; left: 0; right: 0; bottom: 26px; z-index: 4;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        pointer-events: none;
      }
      .sweep-cta-wrap > * { pointer-events: auto; }
      .sweep-hint {
        background: rgba(0,0,0,.55); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.9);
        padding: 9px 16px; border-radius: 999px; font-size: 13px; font-weight: 600;
      }
      .sweep-react-cta {
        display: inline-flex; align-items: center; gap: 11px;
        padding: 13px 24px; border: 0; border-radius: 999px;
        background: linear-gradient(135deg, var(--s-you), #e3a02f); color: var(--s-you-ink);
        font: inherit; font-size: 15px; font-weight: 800; cursor: pointer;
        box-shadow: 0 10px 26px rgba(241,179,74,.4);
        animation: cta-rise .35s var(--ease) both;
      }
      @keyframes cta-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      .sweep-react-cta:hover { filter: brightness(1.05); }
      .sweep-react-cta:active { transform: scale(.97); }
      .sweep-react-cta .arrow { transition: transform .15s var(--ease); }
      .sweep-react-cta:hover .arrow { transform: translateX(3px); }
      .sweep-stuck {
        display: inline-flex; align-items: center; gap: 8px;
        border: 1px solid rgba(255,255,255,.1); background: rgba(0,0,0,.42);
        color: rgba(255,255,255,.82); font: inherit; font-size: 12.5px; font-weight: 600;
        cursor: pointer; padding: 7px 14px; border-radius: 999px; backdrop-filter: blur(8px);
      }
      .sweep-stuck:hover { color: #fff; background: rgba(0,0,0,.62); }
      .sweep-brief {
        position: absolute; inset: 0; z-index: 6; display: grid; place-items: center; padding: 20px;
        background: rgba(8,10,14,.6); backdrop-filter: blur(6px); transition: opacity .3s var(--ease);
      }
      .sweep-brief.is-out { opacity: 0; pointer-events: none; }
      .sweep-brief-card {
        max-width: 420px; width: 100%; text-align: center;
        background: rgba(20,22,28,.9); border: 1px solid rgba(255,255,255,.1);
        border-radius: 18px; padding: 26px 24px 22px; box-shadow: var(--shadow-lg);
      }
      .sweep-brief-eyebrow { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.55); margin-bottom: 8px; }
      .sweep-brief-title { font-size: 21px; font-weight: 800; color: #fff; margin: 0 0 10px; line-height: 1.25; }
      .sweep-brief-sub { font-size: 14px; line-height: 1.55; color: rgba(255,255,255,.8); margin: 0 0 18px; }
      .sweep-brief-btn {
        display: inline-flex; align-items: center; gap: 10px; padding: 13px 24px; border: 0;
        border-radius: 999px; background: #fff; color: #111; font: inherit; font-size: 14.5px; font-weight: 800; cursor: pointer;
      }
      .sweep-brief-btn:hover { background: #f0f0f0; }
      .sweep-rail { border-bottom: 1px solid var(--c-line); background: var(--c-surface-2); padding: 10px 14px; margin: -16px -16px 6px; }
      .sweep-rail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      .sweep-rail-ttl { font-size: 11px; font-weight: 700; letter-spacing: .04em; color: var(--c-ink-faint); text-transform: uppercase; display: inline-flex; align-items: center; gap: 7px; }
      .sweep-rail-count { font-size: 16px; font-weight: 800; color: var(--c-ink); }
      .sweep-rail-count span { font-size: 12px; font-weight: 600; color: var(--c-ink-faint); }
      .sweep-chips { display: flex; flex-wrap: wrap; gap: 7px; }
      .sweep-chip {
        display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px;
        font-size: 12px; font-weight: 600; border: 1px solid var(--c-line); color: var(--c-ink-faint);
        background: var(--c-surface); transition: all .3s var(--ease);
      }
      .sweep-chip i { font-size: 11px; opacity: .7; }
      .sweep-chip.got { border-color: color-mix(in srgb, #2ecc71 55%, var(--c-line)); color: var(--c-ink); background: color-mix(in srgb, #2ecc71 16%, transparent); }
      .sweep-chip.got i { color: #2ecc71; opacity: 1; }
      .sweep-chip.missed { border-color: color-mix(in srgb, var(--s-you) 45%, var(--c-line)); color: var(--c-ink); background: color-mix(in srgb, var(--s-you) 12%, transparent); }
      .sweep-chip.missed i { color: var(--s-you); opacity: 1; }
  `;
  let cssInjected = false;
  function injectCSS() {
    if (cssInjected) return;
    cssInjected = true;
    const s = document.createElement('style');
    s.setAttribute('data-sim-perception', '');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function install(ctx) {
    injectCSS();
    const scenario = ctx.scenario;
    const state = ctx.state;
    const fillT = ctx.fillT;
    const el = ctx.el, esc = ctx.esc, announce = ctx.announce;
    const render = ctx.render, send = ctx.send, deliverOpening = ctx.deliverOpening;
    const getCoachPanelBody = ctx.getCoachPanelBody, getComposer = ctx.getComposer;
    const GEO = window.SceneSweepGeo;

    /* ---- config, derived from the scenario (was inline in the page) ------- */
    const HAZARDS = Array.isArray(scenario.hazards) ? scenario.hazards : [];
    const HAZARD_IDS = new Set(HAZARDS.map((h) => h.id));
    const DECOYS = (Array.isArray(scenario.decoys) ? scenario.decoys : []).filter((d) => d && d.spot);
    const idHash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    const byHash = (list) => list.slice().sort((a, b) => idHash(String(a.r.id)) - idHash(String(b.r.id)));
    const _H = byHash(HAZARDS.filter((h) => h && h.spot).map((h) => ({ r: h, isHazard: true })));
    const _D = byHash(DECOYS.map((d) => ({ r: d, isHazard: false })));
    const REGION_SEQ = [];
    for (let i = 0, j = 0; i < _H.length || j < _D.length;) {
      if (i < _H.length) REGION_SEQ.push(_H[i++]);
      if (j < _D.length) REGION_SEQ.push(_D[j++]);
    }
    REGION_SEQ.forEach((e, i) => { e.label = String((e.r.alt || '').trim()) || ('Area ' + (i + 1) + ' of ' + REGION_SEQ.length); });
    const SCENE_IMG = fillT((scenario.scene || {}).src || '');
    const SCENE_ALT = fillT((scenario.scene || {}).alt || 'The work area to inspect.');
    const COVERAGE = scenario.coverage || { required: Math.max(1, HAZARDS.length - 1), total: HAZARDS.length };
    const SPOT_PHASE_ID = ((scenario.phases || []).find((p) => p.kind === 'spot') || {}).id || '';
    const SPOT_PHASE_IDX = (scenario.phases || []).findIndex((p) => p.id === SPOT_PHASE_ID);
    const SWEEP_REQUIRED = (COVERAGE && COVERAGE.required) || Math.max(1, HAZARDS.length - 1);
    const SWEEP_TOTAL = (COVERAGE && COVERAGE.total) || HAZARDS.length;
    const SWEEP_AUTHOR = new URLSearchParams(location.search).has('author');

    // A first-person phrase per hazard for the summary handed to the coach on
    // crossing (reads like the learner reporting, not a rubric dump).
    const MARK_PHRASE = {
      jug: 'the unlabeled jug on the bench',
      ppe: 'my coworker working with no gloves',
      sds: 'the out-of-date safety data sheet',
      label: 'the torn, unreadable label on the drum',
    };
    const markPhrase = (h) => MARK_PHRASE[h.id] || ('the ' + String(h.short || h.alt || 'hazard').toLowerCase().replace(/\.$/, ''));
    function listJoin(items) {
      items = items.filter(Boolean);
      if (items.length <= 1) return items.join('');
      if (items.length === 2) return items[0] + ' and ' + items[1];
      return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
    }

    let sweepPhotoEl = null;
    let sweepSvgEl = null;
    const sweepRegionEls = {};

    function sweepSceneNode() {
      const wrap = el('div', 'sweep-scene');
      wrap.innerHTML =
        `<div class="sweep-stage">
           <img class="sweep-photo" id="sweepPhoto" src="${esc(SCENE_IMG)}" alt="${esc(SCENE_ALT)}" draggable="false" />
           <div class="sweep-hits" id="sweepHits"></div>
           <svg class="sweep-svg" id="sweepSvg"></svg>
           <div class="sweep-pins" id="sweepPins"></div>
           <button class="sweep-a11y-toggle" id="sweepA11yToggle" type="button" aria-expanded="false" aria-controls="sweepA11yPanel" title="Other ways to mark — list the areas or type what you see"><i class="fa-solid fa-universal-access"></i></button>
           <div class="sweep-a11y-panel" id="sweepA11yPanel" role="dialog" aria-label="Other ways to mark hazards" hidden></div>
           <div class="sweep-toast" id="sweepToast">Nothing unsafe there</div>
           <div class="sweep-progress" id="sweepProgress" aria-live="polite"></div>
           <div class="sweep-cta-wrap" id="sweepCtaWrap"></div>
           <div class="sweep-brief" id="sweepBrief">
             <div class="sweep-brief-card">
               <div class="sweep-brief-eyebrow">Spot the hazard</div>
               <h2 class="sweep-brief-title">Take a slow look around.</h2>
               <p class="sweep-brief-sub">You just finished the training — now you’re on the floor. Mark anything that looks unsafe: tap it, use Tab + Enter, or open the ♿ menu to list the areas or type what you see. Find at least ${SWEEP_REQUIRED}, then talk it through with your coach.</p>
               <button class="sweep-brief-btn" id="sweepBriefBtn"><i class="fa-solid fa-magnifying-glass"></i> Start looking</button>
             </div>
           </div>
         </div>`;
      sweepPhotoEl = wrap.querySelector('#sweepPhoto');
      sweepSvgEl = wrap.querySelector('#sweepSvg');
      wrap.querySelector('#sweepHits').addEventListener('click', onSweepTap);
      wrap.querySelector('#sweepBriefBtn').addEventListener('click', dismissBrief);
      wrap.querySelector('#sweepA11yToggle').addEventListener('click', () => toggleA11yPanel());
      sweepPhotoEl.addEventListener('load', repositionPins);
      buildSweepRegions();
      requestAnimationFrame(() => requestAnimationFrame(layoutSweepRegions));
      return wrap;
    }

    function imgDrawRect() { return GEO.drawRect(sweepPhotoEl); }

    function onSweepTap(e) {
      if (state.mode !== 'scene' || state.briefUp) return;
      const img = sweepPhotoEl; if (!img) return;
      const n = GEO.toNormalized(img, e.clientX, e.clientY);
      if (!n) return;
      if (SWEEP_AUTHOR) { console.log(`[author] x:${n.x.toFixed(3)}, y:${n.y.toFixed(3)}`); showSweepMiss('x ' + n.x.toFixed(2) + ', y ' + n.y.toFixed(2)); return; }
      const hit = GEO.hitTest(HAZARDS, n.x, n.y, state.covered);
      if (hit) { markHazard(hit); return; }
      const decoy = GEO.hitTest(DECOYS, n.x, n.y, null);
      if (decoy) { checkDecoy(decoy); return; }
      showSweepMiss();
    }

    function buildSweepRegions() {
      const svg = sweepSvgEl || document.getElementById('sweepSvg'); if (!svg) return;
      svg.innerHTML = '';
      for (const k in sweepRegionEls) delete sweepRegionEls[k];
      REGION_SEQ.forEach((entry) => {
        const sp = entry.r.spot; const isPoly = Array.isArray(sp.points);
        const shape = document.createElementNS('http://www.w3.org/2000/svg', isPoly ? 'polygon' : 'circle');
        let cls = 'sweep-region' + (entry.isHazard ? '' : ' decoy');
        if (entry.isHazard && state.covered.has(entry.r.id)) cls += ' got';
        if (!entry.isHazard && state.decoysChecked && state.decoysChecked.has(entry.r.id)) cls += ' checked';
        shape.setAttribute('class', cls);
        shape.setAttribute('role', 'button');
        shape.setAttribute('tabindex', '0');
        shape.setAttribute('aria-label', entry.label);
        if (entry.isHazard) shape.setAttribute('aria-pressed', state.covered.has(entry.r.id) ? 'true' : 'false');
        const activate = (ev) => { ev.preventDefault(); ev.stopPropagation(); activateRegion(entry); };
        shape.addEventListener('click', activate);
        shape.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') activate(ev); });
        svg.appendChild(shape);
        sweepRegionEls[entry.r.id] = { shape, entry };
      });
      layoutSweepRegions();
    }
    function layoutSweepRegions() {
      const dr = imgDrawRect(); if (!dr || !sweepPhotoEl) return;
      const interactive = state.mode === 'scene' && !state.briefUp;
      REGION_SEQ.forEach((entry) => {
        const rec = sweepRegionEls[entry.r.id]; if (!rec) return;
        const sp = entry.r.spot;
        if (Array.isArray(sp.points)) {
          const px = GEO.polyPixels(sweepPhotoEl, sp.points);
          if (px) rec.shape.setAttribute('points', px.map((p) => `${p.left.toFixed(1)},${p.top.toFixed(1)}`).join(' '));
        } else {
          const c = GEO.toPixels(sweepPhotoEl, sp.x, sp.y);
          if (c) { rec.shape.setAttribute('cx', c.left); rec.shape.setAttribute('cy', c.top); rec.shape.setAttribute('r', Math.max(8, (sp.r || 0.12) * dr.width)); }
        }
        rec.shape.setAttribute('tabindex', interactive ? '0' : '-1');
      });
    }
    function activateRegion(entry) {
      if (state.mode !== 'scene' || state.briefUp) return;
      if (entry.isHazard) {
        if (state.covered.has(entry.r.id)) { announce('Already marked ' + (entry.r.short || entry.label) + '.'); return; }
        markHazard(entry.r);
      } else {
        checkDecoy(entry.r);
      }
    }
    function updateRegionMarked(h) {
      const rec = sweepRegionEls[h.id]; if (!rec) return;
      rec.shape.classList.add('got'); rec.shape.setAttribute('aria-pressed', 'true');
    }
    function checkDecoy(d) {
      if (!state.decoysChecked) state.decoysChecked = new Set();
      const firstTime = !state.decoysChecked.has(d.id);
      state.decoysChecked.add(d.id);
      const rec = sweepRegionEls[d.id]; if (rec) rec.shape.classList.add('checked');
      const msg = d.note || 'That one’s actually fine — not a hazard.';
      flashToast(msg); announce(msg);
      if (firstTime) refreshA11yList();
    }

    function markHazard(h, silent) {
      state.covered.add(h.id);
      state.markStarted = true;
      dropPin(h);
      updateRegionMarked(h);
      updateObserveHud();
      updateCoachRail();
      refreshA11yList();
      if (!silent) {
        const n = HAZARDS.filter((x) => state.covered.has(x.id)).length;
        announce('Marked ' + (h.short || 'it') + '. ' + n + ' of ' + SWEEP_TOTAL + ' found.');
      }
    }

    function dropPin(h) {
      const pins = document.getElementById('sweepPins'); if (!pins) return;
      const idx = HAZARDS.filter((x) => state.covered.has(x.id)).length;
      const pin = el('div', 'sweep-pin');
      pin.dataset.hz = h.id;
      pin.innerHTML = `<div class="sweep-pin-ring"><span class="n">${idx}</span></div><div class="sweep-pin-label">${esc(h.short)}</div>`;
      pins.appendChild(pin);
      positionPin(pin, h, imgDrawRect());
    }
    function positionPin(pin, h, dr) {
      dr = dr || imgDrawRect();
      if (!dr || !h.spot) return;
      const c = GEO.centroid(h.spot);
      pin.style.left = (dr.left + c.x * dr.width) + 'px';
      pin.style.top  = (dr.top + c.y * dr.height) + 'px';
    }
    function repositionPins() {
      layoutSweepRegions();
      const pins = document.getElementById('sweepPins'); if (!pins) return;
      const dr = imgDrawRect(); if (!dr) return;
      Array.from(pins.children).forEach((pin) => {
        const h = HAZARDS.find((x) => x.id === pin.dataset.hz);
        if (h) positionPin(pin, h, dr);
      });
    }

    function toggleA11yPanel(force) {
      const panel = document.getElementById('sweepA11yPanel');
      const toggle = document.getElementById('sweepA11yToggle');
      if (!panel || !toggle) return;
      const open = force != null ? force : panel.hasAttribute('hidden');
      if (open) {
        buildA11yPanel();
        panel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        const inp = panel.querySelector('.sweep-ft-input'); if (inp) setTimeout(() => inp.focus(), 40);
      } else {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    }
    function buildA11yPanel() {
      const panel = document.getElementById('sweepA11yPanel'); if (!panel) return;
      panel.innerHTML =
        `<div class="sweep-a11y-head">
           <div>
             <h3>Mark what looks unsafe</h3>
             <p>Type what you notice, or pick from the areas in the scene. (On the photo you can also press Tab to move between areas and Enter to mark one.)</p>
           </div>
           <button class="sweep-a11y-close" id="sweepA11yClose" type="button" aria-label="Close">✕</button>
         </div>
         <div>
           <div class="sweep-a11y-sec-lbl">Describe what you see</div>
           <form class="sweep-ft-row" id="sweepFtForm" style="margin-top:8px;">
             <input class="sweep-ft-input" id="sweepFtInput" type="text" autocomplete="off" placeholder="e.g. the jug has no label, no gloves…" aria-label="Describe what looks unsafe" />
             <button class="sweep-ft-btn" type="submit">Mark</button>
           </form>
           <p class="sweep-ft-hint">We’ll credit anything you name that matches a hazard.</p>
         </div>
         <div>
           <div class="sweep-a11y-sec-lbl">Or pick an area in the scene</div>
           <div class="sweep-region-list" id="sweepRegionList" style="margin-top:8px;"></div>
         </div>`;
      panel.querySelector('#sweepA11yClose').addEventListener('click', () => toggleA11yPanel(false));
      panel.querySelector('#sweepFtForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const inp = panel.querySelector('#sweepFtInput'); const v = (inp.value || '').trim();
        if (v) { matchFreeTextSweep(v); inp.value = ''; inp.focus(); }
      });
      refreshA11yList();
    }
    function refreshA11yList() {
      const list = document.getElementById('sweepRegionList'); if (!list) return;
      list.innerHTML = '';
      REGION_SEQ.forEach((entry) => {
        const got = entry.isHazard && state.covered.has(entry.r.id);
        const checked = !entry.isHazard && state.decoysChecked && state.decoysChecked.has(entry.r.id);
        const btn = el('button', 'sweep-region-btn'); btn.type = 'button';
        if (entry.isHazard) btn.setAttribute('aria-pressed', got ? 'true' : 'false');
        if (checked) btn.classList.add('is-checked');
        btn.innerHTML = `<span class="ic"><i class="fa-solid ${got ? 'fa-check' : (checked ? 'fa-shield-halved' : 'fa-magnifying-glass')}"></i></span><span>${esc(entry.label)}</span>`;
        btn.addEventListener('click', () => activateRegion(entry));
        list.appendChild(btn);
      });
    }
    function matchFreeTextSweep(text) {
      const hay = ' ' + text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
      const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'and', 'or', 'of', 'in', 'on', 'it', 'to', 'with', 'that', 'this', 'from', 'has', 'have', 'its', 'some']);
      const newly = [];
      HAZARDS.forEach((h) => {
        if (state.covered.has(h.id)) return;
        const phrases = String(h.synonyms || '').split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
        if (h.short) phrases.push(String(h.short).toLowerCase());
        const hit = phrases.some((p) => {
          const norm = p.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
          if (!norm) return false;
          if (hay.indexOf(norm) !== -1) return true;
          const words = norm.split(' ').filter((w) => w.length >= 2 && !STOP.has(w));
          return words.length >= 1 && words.every((w) => hay.indexOf(' ' + w + ' ') !== -1);
        });
        if (hit) newly.push(h);
      });
      if (!newly.length) {
        flashToast('Nothing there matched a hazard yet — try naming what looks wrong.');
        announce('Nothing matched yet. Try describing what looks unsafe.');
        state.misses = (state.misses || 0) + 1; updateObserveHud();
        return;
      }
      newly.forEach((h) => markHazard(h, true));
      const n = HAZARDS.filter((x) => state.covered.has(x.id)).length;
      announce('Marked ' + listJoin(newly.map((h) => (h.short || 'a hazard'))) + '. ' + n + ' of ' + SWEEP_TOTAL + ' found.');
    }

    let sweepToastTimer = 0;
    function flashToast(msg, ms) {
      const t = document.getElementById('sweepToast');
      if (!t) return;
      t.textContent = msg;
      t.classList.add('on');
      clearTimeout(sweepToastTimer);
      sweepToastTimer = setTimeout(() => t.classList.remove('on'), ms || (String(msg).length > 34 ? 2400 : 1400));
    }
    function showSweepMiss(msg) {
      if (!SWEEP_AUTHOR) state.misses = (state.misses || 0) + 1;
      flashToast(msg || 'Nothing unsafe there');
      updateObserveHud();
    }

    function dismissBrief() {
      state.briefUp = false;
      state.markStarted = true;
      const b = document.getElementById('sweepBrief'); if (b) b.classList.add('is-out');
      layoutSweepRegions();
      updateObserveHud();
    }

    function updateObserveHud() {
      const n = HAZARDS.filter((h) => state.covered.has(h.id)).length;
      const prog = document.getElementById('sweepProgress');
      if (prog) {
        const dots = HAZARDS.map((h) => `<span class="dot ${state.covered.has(h.id) ? 'on' : ''}"></span>`).join('');
        prog.innerHTML = `<span class="lbl"><i class="fa-solid fa-magnifying-glass"></i> Found ${n} of ${SWEEP_TOTAL}</span><span class="dots">${dots}</span>`;
      }
      const wrap = document.getElementById('sweepCtaWrap');
      if (wrap) {
        const met = n >= SWEEP_REQUIRED;
        const stuck = !met && (state.misses >= 2 || n >= 1);
        let html = '';
        if (!state.markStarted) {
          html = '';
        } else if (met) {
          html = `<button class="sweep-react-cta" id="sweepReactCta"><i class="fa-solid fa-comments"></i> Talk it through with your coach <i class="fa-solid fa-arrow-right arrow"></i></button>`;
        } else {
          html = `<div class="sweep-hint">Keep looking — tap anything unsafe</div>`;
          if (stuck) html += `<button class="sweep-stuck" id="sweepStuckBtn"><i class="fa-solid fa-comment"></i> Stuck? Talk it through with your coach</button>`;
        }
        wrap.innerHTML = html;
        const rc = wrap.querySelector('#sweepReactCta'); if (rc) rc.addEventListener('click', () => crossToReact('found'));
        const sc = wrap.querySelector('#sweepStuckBtn'); if (sc) sc.addEventListener('click', () => crossToReact('stuck'));
      }
    }

    function updateCoachRail() {
      const coachPanelBody = getCoachPanelBody();
      const coachUp = state.mode === 'coaching' && state.started;
      let rail = document.getElementById('sweepRail');
      if (coachUp && state.coachStarted) {
        if (!rail) { rail = el('div', 'sweep-rail'); rail.id = 'sweepRail'; rail.setAttribute('aria-label', 'Hazards spotted'); }
        if (rail.parentNode !== coachPanelBody || coachPanelBody.firstChild !== rail) coachPanelBody.insertBefore(rail, coachPanelBody.firstChild);
        renderRailInto(rail);
      } else if (rail) {
        rail.remove();
      }
    }
    function renderRailInto(rail) {
      const spotN = HAZARDS.filter((h) => state.covered.has(h.id)).length;
      const spotIdx = (scenario.phases || []).findIndex((p) => p.id === SPOT_PHASE_ID);
      const revealAll = state.phaseIdx > spotIdx || state.complete;
      const chips = HAZARDS.map((h) => {
        const got = state.covered.has(h.id);
        const label = (got || revealAll) ? esc(h.short) : 'Not yet spotted';
        return `<div class="sweep-chip${got ? ' got' : (revealAll ? ' missed' : '')}">
            <i class="fa-solid ${got ? 'fa-circle-check' : (revealAll ? 'fa-circle-exclamation' : 'fa-circle-question')}"></i>
            <span>${label}</span>
          </div>`;
      }).join('');
      rail.innerHTML =
        `<div class="sweep-rail-head">
           <span class="sweep-rail-ttl"><i class="fa-solid fa-magnifying-glass"></i> Hazards spotted</span>
           <span class="sweep-rail-count">${spotN}<span>/${SWEEP_TOTAL}</span></span>
         </div>
         <div class="sweep-chips">${chips}</div>`;
    }

    addEventListener('resize', () => repositionPins());

    /* =====================================================================
       The Observe (mark) ⇄ React (coach) crossings. These drive the page's
       turn engine (send / deliverOpening / render / the composer), supplied via
       ctx — the perception layer owns its own crossing into the shared player.
       ===================================================================== */
    function enterMarking() {
      state.started = true;
      state.marking = true;
      state.mode = 'scene'; state.inputTarget = 'coach';
      state.briefUp = true;
      announce('Take a slow look around the work area. Tap anything that looks unsafe.');
      render();
    }
    function enterObserve() {
      if (!state.started || state.sending || state.delivering) return;
      state.marking = true;
      state.lookAgainDismissed = false;
      state.mode = 'scene'; state.inputTarget = 'coach';
      announce('Back at the scene. Tap anything you missed.');
      render();
    }
    function freshMarkSummary(reason) {
      const fresh = HAZARDS.filter((h) => state.covered.has(h.id) && !state.reportedToCoach.has(h.id));
      fresh.forEach((h) => state.reportedToCoach.add(h.id));
      if (fresh.length) {
        // Hand the page the crisp hazard names so it renders the flagged items as
        // an inline "You flagged" card instead of spoken text (see youMarksNode in
        // scenario-live.html). The first-person sentence below still goes to the
        // model, so the coach grades exactly as before.
        state.pendingMarkCard = {
          items: fresh.map((h) => fillT(h.short || h.alt || 'A hazard').replace(/\.$/, '')),
        };
        return 'I marked ' + listJoin(fresh.map((h) => markPhrase(h))) + '.';
      }
      if (reason === 'stuck') return 'I’ve looked around, but I’m not sure what else is unsafe here.';
      return 'I’ve taken a look around the work area.';
    }
    async function crossToReact(reason) {
      if (state.sending || state.delivering) return;
      toggleA11yPanel(false);
      state.marking = false;
      state.mode = 'coaching'; state.inputTarget = 'coach';
      const fresh = HAZARDS.filter((h) => state.covered.has(h.id) && !state.reportedToCoach.has(h.id));

      if (!state.coachStarted) {
        state.coachStarted = true;
        state.phaseIdx = SPOT_PHASE_IDX; state.turnsInPhase = 0;
        state.pendingOpening = [{ speaker: 'coach', kind: 'coaching',
          text: 'Good — you’ve had a look around. Let’s talk through what you flagged.' }];
        render();
        await deliverOpening();
        getComposer().value = freshMarkSummary(reason);
        send();
        return;
      }
      if (fresh.length && state.phaseIdx === SPOT_PHASE_IDX && !state.complete) {
        render();
        getComposer().value = freshMarkSummary(reason);
        send();
      } else {
        announce('Back with your coach.');
        render();
      }
    }

    /* ---- the per-turn COVERAGE state block for a spot phase (was inline in
       the page's arcStateBlock). sim-player.js calls this via ctx.coverageBlock. */
    function coverageBlock(p) {
      if (!(p && p.kind === 'spot' && HAZARDS.length)) return '';
      const remaining = HAZARDS.filter((h) => !state.covered.has(h.id));
      const spotN = HAZARDS.length - remaining.length;
      return ' COVERAGE: ' + spotN + '/' + (COVERAGE.total || HAZARDS.length)
        + ' spotted (target ' + (COVERAGE.required || HAZARDS.length) + ').'
        + (remaining.length
            ? ' Still unspotted — nudge toward these ZONES without naming them: '
              + remaining.map((h) => '[' + h.id + '] ' + fillT(h.zone)).join('; ') + '.'
            : ' All hazards spotted — credit the last one and close the beat.');
    }

    return {
      isSweep: true,
      sceneImg: SCENE_IMG,
      hazardIds: HAZARD_IDS,
      spottedValidator: (id) => HAZARD_IDS.has(id),
      spotPhaseId: SPOT_PHASE_ID,
      spotPhaseIndex: SPOT_PHASE_IDX,
      coverageBlock,
      // DOM + per-render hooks the page's render() calls
      sceneNode: sweepSceneNode,
      updateHud: updateObserveHud,
      updateRail: updateCoachRail,
      reposition: repositionPins,
      layout: layoutSweepRegions,
      // crossings the page wires to startSession / the Observe⇄React toggle
      enterMarking,
      enterObserve,
      crossToReact,
      // the model's credited catches (turn.spotted) merged in send()
      creditSpotted: (ids) => {
        (ids || []).forEach((id) => { if (HAZARD_IDS.has(id)) state.covered.add(id); });
        updateObserveHud(); updateCoachRail();
      },
      unspottedCount: () => HAZARDS.filter((h) => !state.covered.has(h.id)).length,
      closeA11yPanel: () => toggleA11yPanel(false),
    };
  }

  window.SimPerception = { install };
})();
