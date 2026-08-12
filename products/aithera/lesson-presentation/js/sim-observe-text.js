/* =========================================================================
   SIM OBSERVE-TEXT — the LOWER-COST sibling of js/sim-perception.js.

   Same scenario, same coach, same coverage/crossing contract — but instead of
   the photo/hotspot TAP canvas (polygon hit-testing, letterbox geometry, pin
   placement, SVG regions, keyboard region walk), the learner LOOKS at a plain
   image and TYPES what they see into a list. They jot freely; then the whole
   batch goes to the COACH, which does the real, generous grading.

   WHY THIS EXISTS: the perception grading was never the expensive part — the
   coach already grounds to a TEXT rubric and never sees the image. What dev
   balked at is the CANVAS: the geometry, hit-testing, pins, and the polygon
   authoring tool. This surface deletes all of that AND deletes the brittle
   client-side matcher, keeping only the intelligence we already have — so it is
   far cheaper to build for prod while playing the identical scenario and close.

   NO CLIENT-SIDE GRADING (decided with Chris, 2026-08-10). A substring/synonym
   matcher is too harsh — it rejects typos ("saftey data sheet"), abbreviations
   ("PPE"), and right-object/incomplete-framing ("safety data sheet", "barrel"),
   and repeating "— noted, but is that actually unsafe?" down a list reads as
   nagging. So typed observations get NO verdict here: they are neutral notes.
   The learner's whole list is handed to the coach, which credits generously
   (typos, intent, partial catches → a follow-up), reports `spotted[]`, and drives
   the coverage rail. The coach already handles the decoys conversationally too.
   Net effect: the coverage meter moves OUT of the typing phase (where it could
   only lie) and INTO the coach review (where grading is accurate).

   HOW IT PLUGS IN: a second render SURFACE for phase kind:'spot'
   (js/sim-surfaces.js). It only claims that kind when the URL says ?observe=text,
   so the canvas (V1) stays byte-identical; when the flag is present it registers
   AFTER sim-perception.js and "last registration wins".

   TWO INPUT SHAPES, an LXD choice (scenario.observe.inputMode):
     · 'sweep' (DEFAULT) — one open input; entries append to a running notes list.
     · 'slots'          — N labeled "find the N things" fields. More guided (and
       it reveals the count); offered for LXDs who want the training wheels.
   Both just collect text and hand the batch to the coach — same grader either way.
   ========================================================================= */
(function () {
  'use strict';

  /* GATE — only this version wants text observation. Absent the flag we don't
     register, so the perception canvas keeps kind:'spot' and V1 is untouched. */
  const WANT_TEXT = new URLSearchParams(location.search).get('observe') === 'text';
  if (!WANT_TEXT || !window.SimSurfaces) return;

  /* ---- stylesheet, injected once. Scoped to .obt-* and .app.observe-text. --- */
  const CSS = `
      /* Observe mode: the composer is meaningless — the learner types in the panel. */
      .app.observe-text[data-mode="scene"] .inputbar { display: none; }
      .app.observe-text .stage.is-frozen { filter: blur(6px) brightness(.7); }
      .app.observe-text .stage-inner { justify-content: center; }

      .obt-scene { position: absolute; inset: 0; }
      .obt-stage { position: absolute; inset: 0; background: #0b0d12; overflow: hidden;
        display: grid; grid-template-columns: minmax(0, 1fr) 400px; }
      /* The photo — a plain reference. No overlay, no tap targets, no geometry. */
      .obt-photo-wrap { position: relative; overflow: hidden; }
      .obt-photo { position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: contain; -webkit-user-select: none; user-select: none; }
      .obt-photo-wrap::after { content: ''; position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(180deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 60%, rgba(0,0,0,.38) 100%); }
      .obt-photo-cap { position: absolute; left: 14px; bottom: 12px; z-index: 2;
        display: inline-flex; align-items: center; gap: 8px; color: #fff;
        background: rgba(0,0,0,.55); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,.14); border-radius: 999px;
        padding: 6px 13px; font-size: 12.5px; font-weight: 600; }
      .obt-photo-cap i { color: #3cbfae; }

      /* The notes panel — a light inspector card on the dark stage. */
      .obt-panel { position: relative; display: flex; flex-direction: column;
        background: var(--c-surface-2); border-left: 1px solid var(--c-line); min-height: 0; }
      .obt-panel-head { padding: 18px 20px 14px; border-bottom: 1px solid var(--c-line); }
      .obt-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: .08em;
        text-transform: uppercase; color: var(--c-ink-faint); margin: 0 0 6px; }
      .obt-title { font-size: 18px; font-weight: 800; color: var(--c-ink); margin: 0; line-height: 1.3; }
      .obt-sub { font-size: 13px; line-height: 1.5; color: var(--c-ink-faint); margin: 8px 0 0; }
      .obt-count { display: inline-block; margin-top: 12px; font-size: 12px; font-weight: 700;
        color: var(--c-ink-faint); }
      .obt-count b { color: var(--c-ink); }
      /* Coach-graded coverage meter — how many of the fixed set have been found. */
      .obt-meter { display: flex; align-items: center; gap: 11px; margin-top: 13px; }
      .obt-meter-pips { display: flex; gap: 5px; }
      .obt-pip { width: 22px; height: 7px; border-radius: 4px; background: color-mix(in srgb, var(--c-ink-faint) 42%, var(--c-surface)); transition: background .3s var(--ease); }
      .obt-pip.on { background: #2ecc71; }
      .obt-meter-txt { font-size: 12.5px; font-weight: 700; color: var(--c-ink-faint); }
      .obt-meter-txt b { color: #1f9d57; font-size: 14px; }
      /* The coach hand-back uses ONLY the single "look again" CTA — hide the shared
         "Or answer your coach here" secondary that pairs with it on the canvas. */
      .app.observe-text #lookAgainType { display: none !important; }

      /* Body: input(s) + the running notes, scrolls within the panel. */
      .obt-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 20px; }

      /* Sweep-mode input row. */
      .obt-add { display: flex; gap: 8px; }
      .obt-input { flex: 1; min-width: 0; padding: 11px 13px; border-radius: 10px;
        border: 1px solid var(--c-line); background: var(--c-surface); color: var(--c-ink);
        font: inherit; font-size: 14px; }
      .obt-input:focus-visible { outline: none; border-color: var(--c-accent);
        box-shadow: 0 0 0 3px var(--c-accent-soft); }
      .obt-input::placeholder { color: var(--c-ink-faint); }
      .obt-add-btn { flex: none; padding: 0 16px; border-radius: 10px; border: 0;
        background: var(--c-accent); color: var(--c-on-accent); font: inherit; font-weight: 800;
        font-size: 13.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
      .obt-add-btn:hover { filter: brightness(1.12); }
      .obt-add-btn:active { transform: scale(.98); }
      .obt-add-hint { font-size: 12px; color: var(--c-ink-faint); margin: 8px 2px 0; line-height: 1.45; }

      /* Transient nudge banner (e.g. "look first" when React is tapped empty). */
      .obt-nudge { display: flex; align-items: flex-start; gap: 8px; margin: 0 0 14px; padding: 10px 12px;
        border-radius: 10px; font-size: 12.5px; line-height: 1.45; color: var(--c-ink);
        background: color-mix(in srgb, var(--s-you) 13%, transparent);
        border: 1px solid color-mix(in srgb, var(--s-you) 40%, var(--c-line));
        animation: obt-in .2s var(--ease) both; }
      .obt-nudge i { flex: none; margin-top: 1px; color: var(--s-you); }

      /* The notes list — neutral, NO verdicts. Grading is the coach's job. */
      .obt-notes { display: flex; flex-direction: column; gap: 7px; margin-top: 16px; list-style: none; padding: 0; }
      .obt-notes:empty { margin-top: 0; }
      .obt-note { display: flex; align-items: center; gap: 9px; padding: 10px 12px;
        border-radius: 10px; font-size: 13px; line-height: 1.45; color: var(--c-ink);
        border: 1px solid var(--c-line); background: var(--c-surface);
        animation: obt-in .24s var(--ease) both; }
      @keyframes obt-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      @media (prefers-reduced-motion: reduce) { .obt-note, .obt-nudge { animation: none; } }
      .obt-note i { flex: none; font-size: 11px; color: var(--c-ink-faint); }
      .obt-note-x { margin-left: auto; flex: none; border: 0; background: transparent; cursor: pointer;
        color: var(--c-ink-faint); font-size: 13px; padding: 0 2px; line-height: 1; }
      .obt-note-x:hover { color: var(--c-ink); }

      /* Slots mode — N labeled fields, no verdict; a filled field just reads as filled. */
      .obt-slots { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; list-style: none; padding: 0; }
      .obt-slot { display: flex; align-items: center; gap: 10px; }
      .obt-slot-n { flex: none; width: 26px; height: 26px; border-radius: 50%;
        background: var(--c-surface); border: 1px solid var(--c-line); color: var(--c-ink-faint);
        display: grid; place-items: center; font-size: 12px; font-weight: 800; }
      .obt-slot.filled .obt-slot-n { background: var(--c-ink); border-color: var(--c-ink); color: var(--c-surface-2); }
      .obt-slot .obt-input { flex: 1; min-width: 0; }

      /* Footer CTA. */
      .obt-foot { padding: 14px 20px; border-top: 1px solid var(--c-line);
        display: flex; flex-direction: column; gap: 9px; }
      .obt-cta { display: inline-flex; align-items: center; justify-content: center; gap: 10px;
        width: 100%; padding: 13px 20px; border: 0; border-radius: 12px;
        background: linear-gradient(135deg, var(--s-you), #e3a02f); color: var(--s-you-ink);
        font: inherit; font-size: 14.5px; font-weight: 800; cursor: pointer;
        box-shadow: 0 8px 22px rgba(241,179,74,.32); }
      .obt-cta:hover { filter: brightness(1.05); }
      .obt-cta:active { transform: scale(.99); }
      .obt-cta .arrow { transition: transform .15s var(--ease); }
      .obt-cta:hover .arrow { transform: translateX(3px); }
      .obt-foot-hint { font-size: 12.5px; color: var(--c-ink-faint); text-align: center; line-height: 1.45; }

      /* Briefing overlay. */
      .obt-brief { position: absolute; inset: 0; z-index: 6; display: grid; place-items: center; padding: 20px;
        background: rgba(8,10,14,.62); backdrop-filter: blur(6px); transition: opacity .3s var(--ease); }
      .obt-brief.is-out { opacity: 0; pointer-events: none; }
      .obt-brief-card { max-width: 430px; width: 100%; text-align: center;
        background: rgba(20,22,28,.92); border: 1px solid rgba(255,255,255,.1);
        border-radius: 18px; padding: 26px 24px 22px; box-shadow: var(--shadow-lg); }
      .obt-brief-eyebrow { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.55); margin-bottom: 8px; }
      .obt-brief-title { font-size: 21px; font-weight: 800; color: #fff; margin: 0 0 10px; line-height: 1.25; }
      .obt-brief-sub { font-size: 14px; line-height: 1.55; color: rgba(255,255,255,.8); margin: 0 auto 18px; max-width: 42ch; }
      .obt-brief-btn { display: inline-flex; align-items: center; gap: 10px; padding: 13px 24px; border: 0;
        border-radius: 999px; background: #fff; color: #111; font: inherit; font-size: 14.5px; font-weight: 800; cursor: pointer; }
      .obt-brief-btn:hover { background: #f0f0f0; }

      /* Coach-panel coverage rail — reused from the canvas version; filled by the
         coach's grading (state.covered), since there is no client grading now. */
      .obt-rail { border-bottom: 1px solid var(--c-line); background: var(--c-surface-2); padding: 10px 14px; margin: -16px -16px 6px; }
      .obt-rail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      .obt-rail-ttl { font-size: 11px; font-weight: 700; letter-spacing: .04em; color: var(--c-ink-faint); text-transform: uppercase; display: inline-flex; align-items: center; gap: 7px; }
      .obt-rail-count { font-size: 16px; font-weight: 800; color: var(--c-ink); }
      .obt-rail-count span { font-size: 12px; font-weight: 600; color: var(--c-ink-faint); }
      .obt-chips { display: flex; flex-wrap: wrap; gap: 7px; }
      .obt-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px;
        font-size: 12px; font-weight: 600; border: 1px solid var(--c-line); color: var(--c-ink-faint); background: var(--c-surface); transition: all .3s var(--ease); }
      .obt-chip i { font-size: 11px; opacity: .7; }
      .obt-chip.got { border-color: color-mix(in srgb, #2ecc71 55%, var(--c-line)); color: var(--c-ink); background: color-mix(in srgb, #2ecc71 16%, transparent); }
      .obt-chip.got i { color: #2ecc71; opacity: 1; }
      .obt-chip.missed { border-color: color-mix(in srgb, var(--s-you) 45%, var(--c-line)); color: var(--c-ink); background: color-mix(in srgb, var(--s-you) 12%, transparent); }
      .obt-chip.missed i { color: var(--s-you); opacity: 1; }

      /* Stacked layout on narrow screens: photo on top, panel below. */
      @media (max-width: 780px) {
        .obt-stage { grid-template-columns: 1fr; grid-template-rows: 38vh minmax(0, 1fr); }
        .obt-panel { border-left: 0; border-top: 1px solid var(--c-line); }
      }
  `;
  let cssInjected = false;
  function injectCSS() {
    if (cssInjected) return;
    cssInjected = true;
    const s = document.createElement('style');
    s.setAttribute('data-sim-observe-text', '');
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

    /* ---- config, derived from the scenario ---- */
    const HAZARDS = Array.isArray(scenario.hazards) ? scenario.hazards : [];
    const HAZARD_IDS = new Set(HAZARDS.map((h) => h.id));
    const SCENE_IMG = fillT((scenario.scene || {}).src || '');
    const SCENE_ALT = fillT((scenario.scene || {}).alt || 'The work area to inspect.');
    const COVERAGE = scenario.coverage || { required: Math.max(1, HAZARDS.length - 1), total: HAZARDS.length };
    const SPOT_PHASE_ID = ((scenario.phases || []).find((p) => p.kind === 'spot') || {}).id || '';
    const SPOT_PHASE_IDX = (scenario.phases || []).findIndex((p) => p.id === SPOT_PHASE_ID);
    const RAIL_TOTAL = (COVERAGE && COVERAGE.total) || HAZARDS.length;
    const REQUIRED = (COVERAGE && COVERAGE.required) || Math.max(1, HAZARDS.length - 1);

    const OBSERVE = (scenario.observe && typeof scenario.observe === 'object') ? scenario.observe : {};
    const URL_INPUT = new URLSearchParams(location.search).get('input');
    const MODE = (URL_INPUT === 'slots' || URL_INPUT === 'sweep')
      ? URL_INPUT
      : (OBSERVE.inputMode === 'slots' ? 'slots' : 'sweep');
    const SLOT_COUNT = (function () {
      const n = Number(OBSERVE.slotCount);
      return Number.isFinite(n) && n > 0 ? Math.min(n, HAZARDS.length) : RAIL_TOTAL;
    })();
    // The input placeholder MUST stay neutral — never name a hazard, or it hands
    // the learner an answer. LXD-overridable via observe.placeholder.
    const PLACEHOLDER = (typeof OBSERVE.placeholder === 'string' && OBSERVE.placeholder.trim())
      ? OBSERVE.placeholder
      : 'Describe what looks unsafe';

    function listJoin(items) {
      items = items.filter(Boolean);
      if (items.length <= 1) return items.join('');
      if (items.length === 2) return items[0] + ' and ' + items[1];
      return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
    }

    /* ---- the learner's raw observations (NO grading applied here) ----
       sweep: a growing list of strings. slots: N field values (some may be blank). */
    const notes = [];                                   // sweep
    const slots = MODE === 'slots' ? Array.from({ length: SLOT_COUNT }, () => '') : null;
    const sent = new Set();                             // observations already handed to the coach (lowercased)

    // Every non-blank observation the learner has entered, in order, de-duped.
    function collect() {
      const raw = MODE === 'slots' ? slots.slice() : notes.slice();
      const out = [], seen = new Set();
      raw.forEach((t) => {
        const v = String(t || '').trim();
        const k = v.toLowerCase();
        if (v && !seen.has(k)) { seen.add(k); out.push(v); }
      });
      return out;
    }
    function coveredCount() { return HAZARDS.filter((h) => state.covered.has(h.id)).length; }

    let panelEl = null;

    /* ---- transient nudge banner + the "look first" redirect ---- */
    let hintMsg = '';
    let hintTimer = 0;
    function flashHint(msg) {
      hintMsg = msg;
      renderPanel();
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => { hintMsg = ''; renderPanel(); }, 3600);
    }
    function nudgeFindFirst() {
      if (state.mode !== 'scene') { state.mode = 'scene'; state.inputTarget = 'coach'; state.marking = true; }
      announce('Add at least one observation before talking with your coach.');
      render();   // snap the toggle back to Observe + rebuild the panel
      flashHint('Jot down at least one thing you notice first — then talk it through with your coach.');
    }

    /* ---- sweep: add / remove a note ---- */
    function submitSweep(text) {
      const v = String(text || '').trim();
      if (!v) return;
      notes.push(v);
      state.markStarted = true;
      renderPanel();
      const inp = panelEl && panelEl.querySelector('#obtInput');
      if (inp) { inp.value = ''; inp.focus(); }
    }
    function removeNote(i) { notes.splice(i, 1); renderPanel(); }

    /* ---- slots: store a field value (no grading) ---- */
    function setSlot(i, val) {
      if (!slots) return;
      slots[i] = String(val || '');
      if (slots[i].trim()) state.markStarted = true;
      renderPanel();
    }

    /* ---- the stage: photo (plain) + notes panel ---- */
    function stageNode() {
      const wrap = el('div', 'obt-scene');
      wrap.innerHTML =
        `<div class="obt-stage">
           <div class="obt-photo-wrap">
             <img class="obt-photo" id="obtPhoto" src="${esc(SCENE_IMG)}" alt="${esc(SCENE_ALT)}" draggable="false" />
             <div class="obt-photo-cap"><i class="fa-solid fa-image"></i> The work area — look closely</div>
           </div>
           <div class="obt-panel" id="obtPanel"></div>
           <div class="obt-brief" id="obtBrief">
             <div class="obt-brief-card">
               <div class="obt-brief-eyebrow">Spot the hazard</div>
               <h2 class="obt-brief-title">Take a slow look around.</h2>
               <p class="obt-brief-sub">You just finished the training — now you’re on the floor. Jot down anything that looks unsafe. You’ll walk through it with your coach next, so don’t worry about getting the wording exactly right.</p>
               <button class="obt-brief-btn" id="obtBriefBtn"><i class="fa-solid fa-pen-to-square"></i> Start looking</button>
             </div>
           </div>
         </div>`;
      panelEl = wrap.querySelector('#obtPanel');
      wrap.querySelector('#obtBriefBtn').addEventListener('click', dismissBrief);
      renderPanel();
      return wrap;
    }

    function dismissBrief() {
      state.briefUp = false;
      state.markStarted = true;
      const b = panelEl && panelEl.closest('.obt-stage') && panelEl.closest('.obt-stage').querySelector('#obtBrief');
      if (b) b.classList.add('is-out');
      renderPanel();
      const inp = panelEl && panelEl.querySelector('#obtInput, #obtSlot0');
      if (inp) setTimeout(() => inp.focus(), 60);
    }

    /* Render the panel from state — head, input(s), the neutral notes list, footer. */
    function renderPanel() {
      if (!panelEl) return;
      const list = collect();
      const n = list.length;

      // The meter is COACH-GRADED coverage (state.covered), not a raw note count —
      // it climbs as the coach confirms catches across look-again passes, so it's
      // always honest. The title states the fixed target so the goal is explicit.
      const covered = coveredCount();
      const headTitle = MODE === 'slots'
        ? esc(OBSERVE.slotsPrompt || ('Find the ' + SLOT_COUNT + ' hazards in this scene'))
        : ('Find the ' + RAIL_TOTAL + ' hazards in this scene');
      const headSub = MODE === 'slots'
        ? 'Write one per line — spelling doesn’t matter. Your coach confirms each one when you review.'
        : 'Note anything that looks unsafe, then we’ll review.';
      const meterHtml =
        `<div class="obt-meter" aria-live="polite">
           <span class="obt-meter-pips">${Array.from({ length: RAIL_TOTAL }, (_, i) => `<span class="obt-pip ${i < covered ? 'on' : ''}"></span>`).join('')}</span>
           <span class="obt-meter-txt"><b>${covered}</b> of ${RAIL_TOTAL} found</span>
         </div>`;

      const nudgeHtml = hintMsg
        ? `<div class="obt-nudge"><i class="fa-solid fa-circle-info"></i> <span>${esc(hintMsg)}</span></div>`
        : '';

      let bodyHtml;
      if (MODE === 'slots') {
        bodyHtml = `<ol class="obt-slots">` + slots.map((v, i) => {
          const filled = String(v || '').trim();
          return `<li class="obt-slot${filled ? ' filled' : ''}">
              <span class="obt-slot-n">${filled ? '<i class="fa-solid fa-check"></i>' : (i + 1)}</span>
              <input class="obt-input" id="obtSlot${i}" type="text" autocomplete="off"
                value="${esc(v)}" placeholder="Observation ${i + 1}" aria-label="Observation ${i + 1}" />
            </li>`;
        }).join('') + `</ol>`;
      } else {
        const items = notes.map((t, i) =>
          `<li class="obt-note"><i class="fa-solid fa-eye"></i><span>${esc(t)}</span>
             <button class="obt-note-x" type="button" data-i="${i}" aria-label="Remove this note">✕</button></li>`).join('');
        bodyHtml =
          `<form class="obt-add" id="obtAddForm">
             <input class="obt-input" id="obtInput" type="text" autocomplete="off"
               placeholder="${esc(PLACEHOLDER)}" aria-label="Describe what looks unsafe" />
             <button class="obt-add-btn" type="submit"><i class="fa-solid fa-plus"></i> Add</button>
           </form>
           <ul class="obt-notes">${items}</ul>`;
      }

      const footHtml = n >= 1
        ? `<button class="obt-cta" id="obtCta"><i class="fa-solid fa-comments"></i> Review with your coach <i class="fa-solid fa-arrow-right arrow"></i></button>`
        : `<div class="obt-foot-hint">Add what you notice, then review it with your coach.</div>`;

      panelEl.innerHTML =
        `<div class="obt-panel-head">
           <p class="obt-eyebrow">Observe</p>
           <h2 class="obt-title">${headTitle}</h2>
           ${meterHtml}
           <p class="obt-sub">${headSub}</p>
         </div>
         <div class="obt-body">${nudgeHtml}${bodyHtml}</div>
         <div class="obt-foot">${footHtml}</div>`;

      // Wire the freshly-rendered controls.
      if (MODE === 'slots') {
        slots.forEach((v, i) => {
          const inp = panelEl.querySelector('#obtSlot' + i);
          if (!inp) return;
          inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); setSlot(i, inp.value); } });
          inp.addEventListener('blur', () => setSlot(i, inp.value));
        });
      } else {
        const form = panelEl.querySelector('#obtAddForm');
        if (form) form.addEventListener('submit', (ev) => { ev.preventDefault(); submitSweep(panelEl.querySelector('#obtInput').value); });
        panelEl.querySelectorAll('.obt-note-x').forEach((b) =>
          b.addEventListener('click', () => removeNote(Number(b.getAttribute('data-i')))));
      }
      const cta = panelEl.querySelector('#obtCta');
      if (cta) cta.addEventListener('click', () => crossToReact('review'));
    }

    /* ===================================================================
       THE OBSERVE → COACH CROSSING. Hands the coach the learner's RAW notes
       (only the ones not sent yet) and drives the shared turn engine; the coach
       grades them, reports spotted[] (fills the rail via creditSpotted), and
       nudges toward misses — the identical contract the canvas version used,
       minus the client pre-grading.
       =================================================================== */
    function observationTurn(reason) {
      const fresh = collect().filter((o) => !sent.has(o.toLowerCase()));
      fresh.forEach((o) => sent.add(o.toLowerCase()));
      if (fresh.length) {
        // Show the raw notes as an inline "you flagged" card (not spoken); the
        // sentence below is what the model actually grades.
        state.pendingMarkCard = { items: fresh.slice() };
        const lead = state.coachStarted ? 'A few more things I noticed: ' : 'Here’s what I noticed: ';
        return lead + listJoin(fresh) + '.';
      }
      if (reason === 'stuck') return 'I’ve looked around, but I’m not sure what else is unsafe here.';
      return 'I’ve taken another look — nothing else jumps out at me.';
    }
    async function crossToReact(reason) {
      if (state.sending || state.delivering) return;
      state.marking = false;
      state.mode = 'coaching'; state.inputTarget = 'coach';
      const fresh = collect().filter((o) => !sent.has(o.toLowerCase()));
      if (!state.coachStarted) {
        state.coachStarted = true;
        state.phaseIdx = SPOT_PHASE_IDX; state.turnsInPhase = 0;
        state.pendingOpening = [{ speaker: 'coach', kind: 'coaching',
          text: 'Good — you’ve had a look around. Let’s talk through what you noticed.' }];
        render();
        await deliverOpening();
        getComposer().value = observationTurn(reason);
        send();
        return;
      }
      if (fresh.length && state.phaseIdx === SPOT_PHASE_IDX && !state.complete) {
        render();
        getComposer().value = observationTurn(reason);
        send();
      } else {
        announce('Back with your coach.');
        render();
      }
    }

    function enterMarking() {
      state.started = true;
      state.marking = true;
      state.mode = 'scene'; state.inputTarget = 'coach';
      state.briefUp = true;
      announce('Take a slow look around the work area. Write down anything that looks unsafe.');
      render();
    }
    function enterObserve() {
      if (!state.started || state.sending || state.delivering) return;
      state.marking = true;
      state.lookAgainDismissed = false;
      state.mode = 'scene'; state.inputTarget = 'coach';
      announce('Back at the scene. Add anything you missed.');
      render();
    }

    /* ---- the per-turn COVERAGE state block for the spot phase. This is the
       authoritative [SYSTEM STATE] line the coach must obey, and it steers the
       TEXT version's whole Observe behavior: credit generously on the spot (no
       zone-hunting in chat), then HAND BACK to the activity until the target is
       met — never giving the misses away. Distinct from the canvas coverageBlock,
       which enumerates zones to nudge tapping. ---- */
    function coverageBlock(p) {
      if (!(p && p.kind === 'spot' && HAZARDS.length)) return '';
      const spotN = HAZARDS.filter((h) => state.covered.has(h.id)).length;
      const target = COVERAGE.required || HAZARDS.length;
      const base = ' [OBSERVE — TEXT MODE] The learner TYPED their observations. Credit GENEROUSLY:'
        + ' any clear reference to a rubric hazard counts — ignore spelling and typos, and do NOT'
        + ' require them to explain WHY it is dangerous yet. Set "spotted" to the cumulative ids.'
        + ' Spotted so far: ' + spotN + ' of ' + HAZARDS.length + ' (target ' + target + ').';
      if (spotN >= target) {
        return base + ' TARGET MET — stop looping and deliver the debrief now: "action":"teach".';
      }
      return base + ' MORE REMAIN. Do NOT name, describe, quote, or hint at any hazard they have'
        + ' NOT yet flagged, and do NOT say where to look. In 1–2 short bubbles: warmly credit what'
        + ' they just caught (a quick "ooh, close" if a note was near but not a clear hazard), tell'
        + ' them the count so far (' + spotN + ' of ' + HAZARDS.length + '), and send them back to'
        + ' take another look. End with "action":"continue" — the app returns them to the scene.'
        + ' Do NOT ask a question and do NOT debrief yet.';
    }

    /* ---- the coach-panel coverage rail — filled by the coach's grading ---- */
    function updateCoachRail() {
      const coachPanelBody = getCoachPanelBody();
      const coachUp = state.mode === 'coaching' && state.started;
      let rail = document.getElementById('obtRail');
      if (coachUp && state.coachStarted && coachPanelBody) {
        if (!rail) { rail = el('div', 'obt-rail'); rail.id = 'obtRail'; rail.setAttribute('aria-label', 'Hazards spotted'); }
        if (rail.parentNode !== coachPanelBody || coachPanelBody.firstChild !== rail) coachPanelBody.insertBefore(rail, coachPanelBody.firstChild);
        renderRailInto(rail);
      } else if (rail) {
        rail.remove();
      }
    }
    function renderRailInto(rail) {
      const spotN = coveredCount();
      const spotIdx = (scenario.phases || []).findIndex((p) => p.id === SPOT_PHASE_ID);
      const revealAll = state.phaseIdx > spotIdx || state.complete;
      const chips = HAZARDS.map((h) => {
        const got = state.covered.has(h.id);
        const label = (got || revealAll) ? esc(fillT(h.short)) : 'Not yet spotted';
        return `<div class="obt-chip${got ? ' got' : (revealAll ? ' missed' : '')}">
            <i class="fa-solid ${got ? 'fa-circle-check' : (revealAll ? 'fa-circle-exclamation' : 'fa-circle-question')}"></i>
            <span>${label}</span>
          </div>`;
      }).join('');
      rail.innerHTML =
        `<div class="obt-rail-head">
           <span class="obt-rail-ttl"><i class="fa-solid fa-magnifying-glass"></i> Hazards spotted</span>
           <span class="obt-rail-count">${spotN}<span>/${RAIL_TOTAL}</span></span>
         </div>
         <div class="obt-chips">${chips}</div>`;
    }

    return {
      isSweep: true,
      sceneImg: SCENE_IMG,
      hazardIds: HAZARD_IDS,
      spottedValidator: (id) => HAZARD_IDS.has(id),
      spotPhaseId: SPOT_PHASE_ID,
      spotPhaseIndex: SPOT_PHASE_IDX,
      coverageBlock,
      sceneNode: stageNode,
      updateHud: renderPanel,
      updateRail: updateCoachRail,
      reposition: () => {},
      layout: () => {},
      enterMarking,
      enterObserve,
      crossToReact,
      nudgeFindFirst,
      observationCount: () => collect().length,
      needsMore: () => coveredCount() < REQUIRED,   // target not yet met → coach hands back
      // The coach's credited catches (turn.spotted) — the ONLY thing that fills
      // state.covered now, since there is no client grading. Refresh both the coach
      // rail and the Observe meter so the count is live across look-again passes.
      creditSpotted: (ids) => {
        (ids || []).forEach((id) => { if (HAZARD_IDS.has(id)) state.covered.add(id); });
        updateCoachRail(); renderPanel();
      },
      unspottedCount: () => HAZARDS.filter((h) => !state.covered.has(h.id)).length,
      closeA11yPanel: () => {},
    };
  }

  window.SimObserveText = { install };

  /* ─────────────────────────────────────────────────────────────────────────
     REGISTER as the kind:'spot' SURFACE — overriding the perception canvas for
     this text-observation version only (the GATE above already ensured we only
     get here under ?observe=text). Same adapter shape as sim-perception.js: it
     HANDS INTO the ladder (drives its own crossing), so onStart/onTurn/mount/
     toggle but NOT ownsInput.
     ───────────────────────────────────────────────────────────────────────── */
  window.SimSurfaces.register({
    kind: 'spot',
    install: function (ctx) {
      const P = window.SimObserveText.install(ctx);
      if (!P) return null;
      const state = ctx.state;
      return {
        kind: 'spot',
        appClass: 'observe-text',
        noCharacterScene: true,
        mountsFullBleed: true,

        turnFields: { spotted: P.spottedValidator },
        outcomeBlock: P.coverageBlock,
        onTurn: (turn) => { if (Array.isArray(turn.spotted)) P.creditSpotted(turn.spotted); },

        onStart: () => { P.enterMarking(); return true; },

        shouldMount: () => state.started && P.sceneImg && !state.audioIntroPlaying,
        mountSelector: '.obt-scene',
        stageNode: () => P.sceneNode(),
        onStageRender: () => { P.updateHud(); },
        onCoachRender: () => P.updateRail(),

        modeToggle: (st, busy, mode) => {
          const coachDisabled = mode !== 'coaching' && (busy || !st.started);
          const sceneDisabled = mode !== 'scene' && (busy || !st.started);
          return {
            ariaLabel: 'Observe or react mode',
            coach: { label: 'React', icon: 'fa-comments', disabled: coachDisabled,
              tip: (mode !== 'coaching' && !coachDisabled)
                ? (st.coachStarted ? 'Back to your coach' : 'Talk it through with your coach') : '' },
            scene: { label: 'Observe', icon: 'fa-pen-to-square', disabled: sceneDisabled,
              tip: (mode !== 'scene' && !sceneDisabled) ? 'Look at the scene again' : '' },
          };
        },
        onToggle: (which) => {
          if (which === state.mode) return true;
          if (which === 'scene') { P.enterObserve(); return true; }
          // Crossing to the coach: never open an EMPTY conversation from the toggle.
          if (P.observationCount() === 0) { P.nudgeFindFirst(); return true; }
          P.crossToReact('toggle');
          return true;
        },

        // The coach HANDS BACK to the activity until the target is met: while
        // hazards remain, the composer is replaced by a single "look again" CTA
        // that returns the learner to the notes panel (the coverageBlock tells the
        // coach to make a hand-off statement, not ask a question). Once the target
        // is met, this hides → the normal composer returns and the coach debriefs.
        // We show ONLY this one CTA — the shared "Or answer your coach here"
        // secondary is hidden via CSS (.app.observe-text #lookAgainType), so the
        // dual-pill funk doesn't come back.
        cta: {
          lookAgain: (st) => st.coachStarted && st.mode === 'coaching'
            && !st.complete && !st.delivering && !st.sending && !st.analyzing
            && !st.awaitingDebrief && !st.awaitingResults && !st.awaitingReturn
            && st.phaseIdx === P.spotPhaseIndex && P.needsMore(),
          onLookAgain: () => P.enterObserve(),
        },
      };
    },
  });
})();
