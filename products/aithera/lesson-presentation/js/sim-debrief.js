/* =========================================================================
   SIM DEBRIEF — Section 3, built once: analyze → results → takeaways → exit
   =========================================================================

   Every mode converges on the same close (spec: "highly structured, also not
   where the difficulty lives"):

     1. ANALYZE   — a short closing stepper ("Analyzing… Determining…") while
                    the results are prepared (or merely staged, if they
                    already rode the final turn).
     2. RESULTS   — a linear, paged modal. Page KINDS cover every mode:
                      • list  — strengths / growth areas / playbook cards
                      • score — the N-of-M ring (+ headline & feedback)
     3. TAKEAWAYS — the writer-authored, GUARANTEED playbook (never model-
                    generated) and a resources coach-message, with the locked
                    crisis floor appended on elevated-stakes scenarios.
     4. EXIT      — Continue → a settled "complete" state.

   WHERE THE RESULTS COME FROM — the three sources, standardized:
     'final-turn' — the report rode the model's complete:true turn
                    (Roleplay, Guided Arc). No extra call.
     'call'       — one dedicated closing call on the strong model, fired IN
                    PARALLEL with the stepper so the animation absorbs the
                    latency (Teach-Back). Use SimDebrief.fetchClose().
     'static'     — authored lists, no model involvement (Observe/React).

   TWO LAYERS:
     • Builders + injected styles — pure functions every page uses, so the
       stepper, report cards, ring, resources and modal LOOK identical
       everywhere (theme colors still come from each page's CSS variables).
     • makeFlow(cfg) — the full close choreography for the render-by-state
       shells (Roleplay / Guided Arc / Observe-React). Teach-back's phase
       machine composes the builders directly instead.

   Load order: js/sim-core.js must load BEFORE this file.
   ========================================================================= */
(function () {
  'use strict';
  const Core = window.SimCore;

  /* ---- tiny local helpers -------------------------------------------- */
  const esc = (s) => String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ---- house copy + icon pools ---------------------------------------- */
  // The default analyze beat. A mode may reword (teach-back reviews teaching,
  // not conversation) but keeps three steps so the close FEELS the same.
  const STEPS = ['Analyzing conversation…', 'Determining strengths…', 'Determining growth areas…'];

  // Icons are assigned page-side (cycled from pools) so the model only ever
  // writes titles + bodies — it never picks Font Awesome class names.
  const ICONS = {
    strengths: ['fa-ear-listen', 'fa-share-nodes', 'fa-handshake'],
    growth: ['fa-clock', 'fa-shield-heart'],
    playbook: ['fa-heart', 'fa-cloud-rain', 'fa-eye', 'fa-map-location-dot', 'fa-people-arrows', 'fa-hand-holding-heart', 'fa-triangle-exclamation'],
    resources: ['fa-user-nurse', 'fa-building-shield', 'fa-hand-holding-heart', 'fa-people-group'],
  };
  const withIcons = (items, icons) => items.map((it, i) => ({ ...it, icon: it.icon || icons[i % icons.length] }));

  /* ---- one canonical stylesheet ---------------------------------------
     Injected once, after the page's own <style>, so these rules are the
     single source of truth for how Section 3 renders. Colors/radii resolve
     from each page's CSS variables — theming stays a page decision. */
  const CSS = `
  /* —— closing stepper —— */
  .closing-stepper { display: flex; flex-direction: column; gap: 14px; padding: 8px 2px; }
  .closing-step { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 600; color: var(--c-ink-faint); transition: color .25s var(--ease); }
  .closing-step .mark { flex: 0 0 auto; width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--c-line); display: grid; place-items: center; font-size: 10px; color: transparent; transition: border-color .25s var(--ease), background .25s var(--ease), color .25s var(--ease); }
  .closing-step.is-active { color: var(--c-ink); }
  .closing-step.is-active .mark { border-color: var(--c-accent); animation: simStepPulse 1.1s ease-in-out infinite; }
  @keyframes simStepPulse { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
  .closing-step.is-done { color: var(--c-ink-soft); }
  .closing-step.is-done .mark { border-color: var(--c-accent); background: var(--c-accent); color: #fff; }
  /* —— report sections (inside the results modal) —— */
  .report-section h3 { margin: 0 0 12px; font-size: 16px; display: flex; align-items: center; gap: 9px; color: var(--c-ink); }
  .report-section h3 i { color: var(--accent-color, #16a34a); }
  .report-section.growth { --accent-color: #d97706; }
  .report-section.playbook { --accent-color: #2563eb; }
  /* —— resources / report item lists —— */
  .coach-msg.wide-msg { max-width: 92%; }
  .resources-bubble { white-space: normal; }
  .resources-lead { margin: 0 0 12px; }
  .res-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .res-list li { display: flex; gap: 11px; align-items: flex-start; font-size: 14px; line-height: 1.5; color: var(--c-ink); }
  .res-list li i { flex: 0 0 auto; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 8px; background: var(--c-accent-soft); color: var(--c-accent-strong); font-size: 13px; margin-top: 1px; }
  .res-list li b { display: block; }
  .res-list li span { color: var(--c-ink-soft); font-size: 13px; }
  /* —— results modal (linear: Next → Back/Continue, no stray dismiss) —— */
  .results-modal { position: fixed; inset: 0; z-index: 90; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,.55); }
  .results-modal[hidden] { display: none; }
  .results-modal-card { width: 100%; max-width: 560px; max-height: 85vh; display: flex; flex-direction: column; background: var(--c-bg); border: 1px solid var(--c-line); border-radius: var(--radius); box-shadow: var(--shadow-lg); overflow: hidden; }
  .results-modal-head { flex: 0 0 auto; padding: 16px 20px 13px; border-bottom: 1px solid var(--c-line); display: flex; align-items: center; justify-content: space-between; }
  .results-modal-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--c-ink-faint); }
  .results-modal-dots { display: flex; gap: 6px; }
  .results-modal-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--c-line); transition: background .2s var(--ease); }
  .results-modal-dots span.is-active { background: var(--c-accent); }
  .results-modal-body { flex: 1 1 auto; overflow-y: auto; padding: 20px; }
  .results-modal-body.is-centered { padding: 26px 24px; text-align: center; }
  .results-modal-foot { flex: 0 0 auto; padding: 14px 20px 18px; border-top: 1px solid var(--c-line); display: flex; justify-content: space-between; gap: 10px; }
  .results-nav-btn { display: inline-flex; align-items: center; gap: 9px; padding: 10px 16px; border-radius: 10px; border: 1px solid var(--c-line); background: var(--c-surface); color: var(--c-ink); font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .15s var(--ease), border-color .15s var(--ease); }
  .results-nav-btn:hover { border-color: var(--c-accent); }
  .results-nav-btn.primary { margin-left: auto; background: var(--c-accent); border-color: transparent; color: var(--c-on-accent); }
  .results-nav-btn.primary:hover { background: var(--c-accent-strong); }
  /* —— score ring (the 'score' page kind) —— */
  .score-ring { position: relative; width: 168px; height: 168px; margin: 0 auto 20px; }
  .score-ring svg { transform: rotate(-90deg); }
  .score-ring .track { fill: none; stroke: var(--c-line); stroke-width: 12; }
  .score-ring .fill { fill: none; stroke: url(#simScoreGrad); stroke-width: 12; stroke-linecap: round; transition: stroke-dashoffset 1.1s var(--ease); }
  .score-ring .num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .score-ring .num b { font-size: 46px; font-weight: 800; line-height: 1; }
  .score-ring .num span { font-size: 13px; color: var(--c-ink-soft); font-weight: 700; margin-top: 4px; }
  .score-headline { margin: 0 0 10px; font-size: 22px; font-weight: 800; }
  /* multi-line prose stays LEFT-aligned inside the centered score layout */
  .score-feedback { margin: 0 auto; max-width: 44ch; text-align: left; color: var(--c-ink-soft); font-size: 15px; line-height: 1.6; }
  `;
  function injectStyles() {
    if (document.getElementById('sim-debrief-style')) return;
    const s = document.createElement('style');
    s.id = 'sim-debrief-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---- builders --------------------------------------------------------- */
  function stepperNode(steps) {
    return el('div', 'closing-stepper', (steps || STEPS)
      .map((label) => `<div class="closing-step"><span class="mark"><i class="fa-solid fa-check"></i></span>${esc(label)}</div>`)
      .join(''));
  }

  // Animate the steps inside `container` (the coach sheet body). `dead` lets
  // a restart cancel mid-run; `parallel` is an optional promise (the 'call'
  // source) the stepper awaits after its last step so results are ready.
  async function runStepper({ container, steps, dead, parallel, stepMs }) {
    const count = (steps || STEPS).length;
    const isDead = dead || (() => false);
    const beat = Core.reducedMotion() ? 150 : (stepMs || 900);
    const nodes = () => [...container.querySelectorAll('.closing-step')];
    for (let i = 0; i < count; i++) {
      if (isDead()) return;
      const els = nodes();
      if (els[i]) els[i].classList.add('is-active');
      await Core.wait(beat);
      if (isDead()) return;
      if (els[i]) { els[i].classList.remove('is-active'); els[i].classList.add('is-done'); }
    }
    if (parallel) await parallel;
    await Core.wait(Core.reducedMotion() ? 0 : 350);
  }

  function reportListNode(cls, icon, heading, items) {
    return el('div', `report-section ${cls}`, `
      <h3><i class="fa-solid ${icon}"></i> ${esc(heading)}</h3>
      <ul class="res-list">
        ${items.map((it) => `<li><i class="fa-solid ${it.icon}"></i><div><b>${esc(it.title)}</b><span>${esc(it.body)}</span></div></li>`).join('')}
      </ul>`);
  }

  /* The resources coach-message: writer-authored items + the LOCKED crisis
     floor on elevated-stakes scenarios — the floor is appended HERE so no
     page can forget it. Rendered as a normal coach message (avatar + label +
     bubble), because it's the coach sharing something, not a widget. */
  function resourcesNode({ lead, items, crisisFloor, fill, coachLabel }) {
    const f = fill || ((t) => t);
    const wrap = el('div', 'coach-msg wide-msg');
    wrap.appendChild(el('div', 'coach-avatar', '<i class="fa-solid fa-chalkboard-user"></i>'));
    const body = el('div', 'coach-body');
    body.appendChild(el('div', 'coach-label', coachLabel || 'AI Coach'));
    const list = withIcons(
      (items || []).filter((r) => r && (r.title || r.body))
        .map((r) => ({ title: f(r.title), body: f(r.body), icon: r.icon })),
      ICONS.resources
    );
    if (crisisFloor) list.push({ icon: 'fa-phone-volume', ...crisisFloor });
    body.appendChild(el('div', 'coach-bubble resources-bubble', `
      <p class="resources-lead">${esc(f(lead || 'Here are some resources for situations like this.'))}</p>
      <ul class="res-list">
        ${list.map((r) => `<li><i class="fa-solid ${r.icon}"></i><div><b>${esc(r.title)}</b><span>${esc(r.body)}</span></div></li>`).join('')}
      </ul>`));
    wrap.appendChild(body);
    return wrap;
  }

  /* ---- results pages ----------------------------------------------------
     A page = { heading, announce, centered?, node() }. Compose freely; the
     helpers below cover the shipped modes. */

  // The narrative report: strengths → growth areas → (optional) playbook.
  // `report` is read AT OPEN TIME (a fn), so a final-turn report that landed
  // late is still picked up; fallbacks keep the demo path presentable.
  function reportPages({ report, fallbackStrengths, fallbackGrowth, playbook, playbookHeading }) {
    const rep = typeof report === 'function' ? report : () => report;
    const pages = [
      {
        heading: 'Strengths', announce: 'Your results: strengths.',
        node: () => {
          const r = rep();
          return reportListNode('strengths', 'fa-star', 'Strengths',
            (r && r.strengths && r.strengths.length) ? withIcons(r.strengths, ICONS.strengths) : (fallbackStrengths || []));
        },
      },
      {
        heading: 'Growth areas', announce: 'Your results: growth areas.',
        node: () => {
          const r = rep();
          return reportListNode('growth', 'fa-seedling', 'Growth areas',
            (r && r.growthAreas && r.growthAreas.length) ? withIcons(r.growthAreas, ICONS.growth) : (fallbackGrowth || []));
        },
      },
    ];
    // The playbook — the expert-validated toolkit every learner leaves with,
    // IDENTICAL for everyone regardless of how their practice went. Content
    // is writer-authored; the GUARANTEE is ours: it renders on completion,
    // never model-generated. A scenario without one has a two-page report.
    const pb = withIcons((playbook || []).filter((p) => p && (p.title || p.body)), ICONS.playbook);
    if (pb.length) {
      const heading = playbookHeading || 'The approach that works';
      pages.push({
        heading, announce: `Your results: ${heading.toLowerCase()}.`,
        node: () => reportListNode('playbook', 'fa-list-check', heading, pb),
      });
    }
    return pages;
  }

  // The score page: the N-of-M ring + generated headline & feedback.
  // `data` is read at open time: () => ({ n, of, unit, headline, feedback }).
  function scorePage(data) {
    const get = typeof data === 'function' ? data : () => data;
    return {
      heading: 'Your score', centered: true,
      get announce() { const d = get(); return `You scored ${d.n} out of ${d.of}. ${d.feedback || ''}`; },
      node: () => {
        const d = get();
        const node = el('div', 'score-page', `
          <div class="score-ring">
            <svg viewBox="0 0 168 168" width="168" height="168" aria-hidden="true">
              <defs><linearGradient id="simScoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="var(--c-accent)"/><stop offset="100%" stop-color="#1f9d63"/>
              </linearGradient></defs>
              <circle class="track" cx="84" cy="84" r="72"/>
              <circle class="fill" cx="84" cy="84" r="72"/>
            </svg>
            <div class="num"><b>0</b><span>of ${esc(String(d.of))} ${esc(d.unit || 'topics')}</span></div>
          </div>
          <h2 class="score-headline">${esc(d.headline || 'Nice work.')}</h2>
          <p class="score-feedback">${esc(d.feedback || '')}</p>`);
        // Animate once mounted: ring sweep + count-up.
        requestAnimationFrame(() => {
          const C = 2 * Math.PI * 72;
          const fill = node.querySelector('.fill');
          if (fill) {
            fill.style.strokeDasharray = C;
            fill.style.strokeDashoffset = C;
            requestAnimationFrame(() => { fill.style.strokeDashoffset = C * (1 - (d.of ? d.n / d.of : 0)); });
          }
          const numEl = node.querySelector('.num b');
          let cur = 0;
          const iv = setInterval(() => {
            cur++;
            if (cur >= d.n) { cur = d.n; clearInterval(iv); }
            numEl.textContent = cur;
            if (cur >= d.n) clearInterval(iv);
          }, 90);
          if (d.n === 0) numEl.textContent = '0';
        });
        return node;
      },
    };
  }

  /* ---- the modal --------------------------------------------------------
     One dialog, injected (or adopted) so its structure can't drift. */
  function ensureModal({ eyebrow } = {}) {
    let modal = document.getElementById('resultsModal');
    if (!modal) {
      modal = el('div', 'results-modal');
      modal.id = 'resultsModal';
      modal.hidden = true;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', eyebrow || 'Your results');
      modal.innerHTML = `
        <div class="results-modal-card" tabindex="-1">
          <div class="results-modal-head">
            <span class="results-modal-eyebrow">${esc(eyebrow || 'Your results')}</span>
            <div class="results-modal-dots" id="resultsDots"></div>
          </div>
          <div class="results-modal-body" id="resultsModalBody"><!-- built by JS --></div>
          <div class="results-modal-foot" id="resultsModalFoot"><!-- built by JS --></div>
        </div>`;
      document.body.appendChild(modal);
    }
    return {
      modal,
      card: modal.querySelector('.results-modal-card'),
      body: modal.querySelector('.results-modal-body') || modal.querySelector('#resultsModalBody'),
      foot: modal.querySelector('.results-modal-foot') || modal.querySelector('#resultsModalFoot'),
      dots: modal.querySelector('.results-modal-dots') || modal.querySelector('#resultsDots'),
    };
  }

  // Paint the modal for the current page index — the ONE renderer every page
  // uses, so nav labels, dots and the linear Next → Continue path never drift.
  function renderModal({ refs, pages, page, open, appEl }) {
    refs.modal.hidden = !open;
    if (appEl) appEl.toggleAttribute('inert', open);
    if (!open) return;
    const p = pages[page];
    refs.body.innerHTML = '';
    refs.body.classList.toggle('is-centered', !!p.centered);
    refs.body.appendChild(p.node());
    refs.body.scrollTop = 0;
    if (refs.dots) {
      refs.dots.innerHTML = pages.map((_, i) => `<span${i === page ? ' class="is-active"' : ''}></span>`).join('');
      refs.dots.style.display = pages.length > 1 ? '' : 'none';
    }
    const backBtn = page > 0
      ? `<button class="results-nav-btn" id="resultsBackBtn"><i class="fa-solid fa-arrow-left"></i> Back</button>` : `<span></span>`;
    const fwdBtn = page < pages.length - 1
      ? `<button class="results-nav-btn primary" id="resultsNextBtn">Next: ${esc(pages[page + 1].heading)} <i class="fa-solid fa-arrow-right"></i></button>`
      : `<button class="results-nav-btn primary" id="resultsContinueBtn">Continue <i class="fa-solid fa-arrow-right"></i></button>`;
    refs.foot.innerHTML = backBtn + fwdBtn;
  }

  /* ---- the 'call' source -------------------------------------------------
     One dedicated closing call on the strong model (fire it in parallel with
     the stepper — the animation absorbs the latency). Repairs + parses the
     JSON reply and falls back to authored copy on ANY failure, so the close
     never blocks on a bad call. */
  async function fetchClose({ system, user, model, maxTokens, fallback, live }) {
    try {
      if (live === false) throw new Error('offline');
      const raw = await Core.callModel({
        model: model || Core.MODELS.DIALOGUE,
        maxTokens: maxTokens || 400,
        system,
        messages: [{ role: 'user', content: user }],
      });
      const obj = Core.parseJson(raw);
      const out = {};
      for (const k of Object.keys(fallback || obj)) {
        out[k] = String((obj[k] != null ? obj[k] : (fallback || {})[k]) || '').trim();
      }
      return out;
    } catch (e) {
      return fallback;
    }
  }

  /* ---- makeFlow: the close choreography for render-by-state shells ------
     Owns the shared state flags + the exact sequence every learner sees:

       complete turn lands → [awaitingResults CTA] → openClosing():
         sheet rises → stepper (+ parallel close call if source:'call')
         → recap stays in the sheet → "View full results"
       openResults(): modal page 0 … next/back … Continue
       closeResults(): coach types the resources intro → resources message
       finish(): settled "Practice complete" state.

     The page supplies its own render()/announce()/typing hooks and keeps
     ownership of its state object — the flow just mutates the same flags the
     page's render already reads (closingStepperActive, awaitingResults,
     resultsModalOpen, resultsPage, resultsViewed, continued). */
  function makeFlow(cfg) {
    const c = cfg;
    const refs = c.refs;                    // from ensureModal()
    const pages = () => (typeof c.pages === 'function' ? c.pages() : c.pages);
    let returnFocus = null;

    function openResults() {
      if (!c.state.awaitingResults) return;
      c.state.resultsPage = 0;
      c.state.resultsModalOpen = true;
      returnFocus = document.activeElement;
      c.ui.announce(pages()[0].announce);
      c.ui.render();
      refs.card.focus();
    }

    async function closeResults() {
      if (!c.state.resultsModalOpen) return;
      const dead = c.seq ? c.seq.guard() : (() => false);
      c.state.resultsModalOpen = false;
      c.state.awaitingResults = false;
      c.state.delivering = true;
      c.ui.announce('Back to your AI coach.');
      c.ui.render();
      // The coach "introduces" the resources — typed in like any other line,
      // never dumped.
      c.ui.showTyping(); await Core.wait(Core.reducedMotion() ? 250 : 900); c.ui.hideTyping();
      if (dead()) return;
      c.ui.pushCoachLine(c.resourcesIntro
        || 'Great work! Here are some resources for dealing with situations just like this.');
      c.ui.render();
      await Core.wait(Core.reducedMotion() ? 80 : 500);
      if (dead()) return;
      c.ui.showTyping(); await Core.wait(Core.reducedMotion() ? 250 : 900); c.ui.hideTyping();
      if (dead()) return;
      c.state.resultsViewed = true;   // reveals the resources message — see the page's render()
      c.state.delivering = false;
      c.ui.announce('Here are some resources.');
      c.ui.render();
      // Restore focus out of the closed dialog — back to its opener if that
      // control still exists, otherwise to the CTA that replaced it.
      const rf = returnFocus;
      returnFocus = null;
      if (rf && rf.isConnected && rf.offsetParent !== null) rf.focus();
      else if (c.ui.focusFallback) c.ui.focusFallback();
    }

    // The FINAL debrief gets a build-up instead of an instant reveal: the
    // sheet rises into the stepper, THEN the recap (+ report availability).
    async function openClosing(pendingMessages) {
      const dead = c.seq ? c.seq.guard() : (() => false);
      const pending = pendingMessages || [];
      c.state.closingStepperActive = true;
      c.ui.announce('Analyzing the conversation.');
      c.ui.render();   // the coach sheet rises, showing the stepper
      // source:'call' — fire the closing call now; the stepper absorbs it.
      const parallel = (c.results && c.results.source === 'call' && c.results.fetch)
        ? c.results.fetch().then((r) => { if (c.results.store) c.results.store(r); })
        : null;
      await runStepper({ container: c.ui.stepperContainer(), steps: c.steps, dead, parallel });
      if (dead()) return;
      c.state.closingStepperActive = false;
      pending.forEach((m) => c.ui.pushMessage(m));
      c.state.awaitingResults = true;   // footer offers "View full results"
      c.ui.announce('Your AI coach has a recap. View your full results when ready.');
      c.ui.render();
    }

    function next() {
      const ps = pages();
      c.state.resultsPage = Math.min(c.state.resultsPage + 1, ps.length - 1);
      c.ui.announce(ps[c.state.resultsPage].announce);
      c.ui.render();
    }
    function back() {
      const ps = pages();
      c.state.resultsPage = Math.max(c.state.resultsPage - 1, 0);
      c.ui.announce(ps[c.state.resultsPage].announce);
      c.ui.render();
    }

    // "Continue" — the close's actual last step: settle, don't navigate.
    function finish() {
      if (!c.state.resultsViewed || c.state.continued) return;
      c.state.continued = true;
      c.ui.announce('Practice complete.');
      c.ui.render();
    }

    // The page's render() calls this instead of painting the modal itself.
    function render() {
      renderModal({
        refs, pages: pages(), page: c.state.resultsPage,
        open: c.state.resultsModalOpen, appEl: c.appEl,
      });
    }

    // Delegated modal-footer nav (the buttons are rebuilt every render).
    refs.foot.addEventListener('click', (e) => {
      if (e.target.closest('#resultsNextBtn')) next();
      else if (e.target.closest('#resultsBackBtn')) back();
      else if (e.target.closest('#resultsContinueBtn')) closeResults();
    });

    return { openClosing, openResults, closeResults, next, back, finish, render, stepperNode: () => stepperNode(c.steps) };
  }

  injectStyles();

  window.SimDebrief = {
    STEPS,
    ICONS,
    withIcons,
    stepperNode,
    runStepper,
    reportListNode,
    resourcesNode,
    reportPages,
    scorePage,
    ensureModal,
    renderModal,
    fetchClose,
    makeFlow,
  };
})();
