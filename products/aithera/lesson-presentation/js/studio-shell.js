/* =========================================================================
   AITHERA WRITER STUDIO — SHELL APP LOGIC
   Extracted verbatim from writer-studio-v2.html (was an inline <script>).
   The type-agnostic authoring shell: renders the phase rail, drives the
   type contract (type.sections / renderFields / lints / compile / previewUrl
   / playtest / wizard), and wires publish/export/import + the wizard.
   Vanilla JS, no build step. See js/README.writer-studio.md.
   ========================================================================= */
  /* =======================================================================
     WRITER STUDIO — app logic (vanilla, no framework)
     ======================================================================= */
  'use strict';

  /* ---- which scenario type are we editing? ------------------------------
     The studio is generic: a scenario TYPE (registered into AitheraStudio by
     js/scenario.js, js/scenario-types/*.js) supplies the schema, the form
     sections, the compiler, the lints and the playtest. ?type= picks one;
     absent/unknown falls back to action-practice so old bookmarks keep
     working. Everything below talks to `type`, never to one pedagogy. */
  const TYPE_ID = new URLSearchParams(location.search).get('type');
  // [V2] defaults to Guided Arc — the mode the Learn/Practice split and the
  // start-from-scratch wizard are built for. ?type= still picks any mode.
  const type = window.AitheraStudio.get(TYPE_ID) || window.AitheraStudio.get('guided-arc');

  /* ---- draft state ------------------------------------------------------ */
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Merge a stored draft over the type's shipped default (the type owns the
  // rules; this is just a thin call so old call-sites read the same).
  function mergeScenario(draft) { return type.merge(draft); }

  let scenario = (() => {
    // ?example=<id> opens a curated example (e.g. the WPV FINAL "reading-the-warning-signs")
    // straight into the editor. Non-destructive: it becomes the working draft but
    // doesn't touch the saved draft until the author explicitly saves.
    const exId = new URLSearchParams(location.search).get('example');
    const ex = exId && type.EXAMPLES && type.EXAMPLES[exId];
    if (ex) return type.normalize(clone(ex));
    try { return mergeScenario(JSON.parse(localStorage.getItem(type.store.keys.draft))); }
    catch (e) { return type.normalize(clone(type.DEFAULT)); }
  })();

  /* ---- tiny helpers ------------------------------------------------------ */
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  function setByPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => o[k], obj);
    target[last] = value;
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* =======================================================================
     FORM DEFINITION lives in the TYPE now (type.sections + type.renderFields).
     The shell only provides the DOM field-builder helpers below and hands
     them to the type as `studioApi` so a type can render its inputs without
     re-implementing the plumbing.
     ======================================================================= */

  /* Per-section field renderers (generic — used by every type) ------------ */
  function tf(path, label, opts = {}) {
    const el = document.createElement(opts.area ? 'vaadin-text-area' : 'vaadin-text-field');
    el.setAttribute('theme', 'outlined');
    el.label = label;
    if (opts.helper) el.helperText = opts.helper;
    if (opts.placeholder) el.placeholder = opts.placeholder;
    if (opts.minRows) el.minRows = opts.minRows;
    el.value = String(getByPath(scenario, path) ?? '');
    el.dataset.path = path;
    el.addEventListener('input', onField);
    el.addEventListener('change', onField);
    return el;
  }

  /* Collapsed guidance disclosure — the READ layer. The summary line names
     what's inside; the body is a click away instead of pushing the fields
     down the page. */
  function guidance(summaryText, icon, bodyHTML) {
    const d = document.createElement('details');
    d.className = 'bridge';
    d.innerHTML = `<summary><i class="fa-solid ${esc(icon)}" aria-hidden="true"></i>${esc(summaryText)}</summary>
      <div class="bridge-body">${bodyHTML}</div>`;
    return d;
  }

  // makeItem() returns the blank row a type wants when "Add" is clicked, so
  // this helper no longer needs to know any type's list shapes.
  function rowsBlock(listPath, renderRow, addLabel, makeItem) {
    const wrap = document.createElement('div');
    wrap.className = 'rows';
    wrap.dataset.list = listPath;
    const render = () => {
      wrap.innerHTML = '';
      const list = getByPath(scenario, listPath);
      list.forEach((item, i) => wrap.appendChild(renderRow(item, i, () => {
        list.splice(i, 1);
        render();
        scheduleUpdate();
      })));
      const add = document.createElement('button');
      add.className = 'addrow';
      add.innerHTML = `<i class="fa-solid fa-plus"></i> ${esc(addLabel)}`;
      add.addEventListener('click', () => {
        list.push(makeItem ? makeItem() : {});
        render();
        scheduleUpdate();
      });
      wrap.appendChild(add);
    };
    render();
    return wrap;
  }

  function rowCard(title, onDelete, ...fields) {
    const card = document.createElement('div');
    card.className = 'rowcard';
    const head = document.createElement('div');
    head.className = 'rowhead';
    head.innerHTML = `<span>${esc(title)}</span>`;
    const del = document.createElement('button');
    del.className = 'del';
    del.title = 'Remove';
    del.setAttribute('aria-label', `Remove ${title}`);   // icon-only button needs a real name
    del.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>';
    del.addEventListener('click', onDelete);
    head.appendChild(del);
    card.appendChild(head);
    fields.forEach((f) => card.appendChild(f));
    return card;
  }

  /* The helper bundle handed to type.renderFields — DOM plumbing plus live
     access to the current draft. A type builds its inputs with these and
     never re-implements them. */
  const studioApi = {
    tf, rowsBlock, rowCard, guidance, esc,
    getScenario: () => scenario,
    scheduleUpdate,
  };

  /* ---- the three-section spine, presented as PHASES ----------------------
     Authors work one phase at a time (a stepper they can also jump around),
     so a phase-level decision (which context modality? which core
     interaction?) is presented at its own altitude instead of buried in one
     long scroll. Each section declares its `group`; groups map onto the three
     phases below. Basics (meta) rides in with Context; reference material and
     the locked engine ride out with the Debrief. */
  const groupOf = (sec) => sec.group || 'meta';

  /* The author's flow is a "Start" pre-flight (choose the interaction + the
     basics — the decisions that shape everything) followed by the three phases
     that mirror the LEARNER's experience. A phase only appears if the current
     mode actually uses it (Start always does), so e.g. Teach-Back — which has
     no intro modality — shows Start → ② Interaction → ③ Debrief, skipping ①. */
  /* [V2] The rail speaks Learn/Practice. A mode whose sections use the new
     groups (guided-arc, re-presented by js/studio-v2-guided-arc.js) gets
     ② Learn / ③ Practice / ④ Voice & Tone; a mode still on the generic
     'interaction' group keeps its single Interaction step. computePhases()
     filters to whichever groups the current mode actually uses, and badge
     numbers are POSITIONAL (phaseBadge below), not hardcoded. */
  const ALL_PHASES = [
    { id: 'start',       icon: 'fa-wand-magic-sparkles', title: 'Start',            rail: 'Interaction + basics',
      eyebrow: 'First — what are you building?',
      sub: 'Choose the core interaction, then the basics. This shapes every field that follows.',
      groups: ['meta'], isStart: true },
    { id: 'context',     title: 'Scenario Context', rail: 'How the scene is set',
      eyebrow: 'The learner’s opening',
      sub: 'How the scene is set before the coaching begins — the intro modality.',
      groups: ['context'] },
    { id: 'learn',       title: 'Learn',            rail: 'Warm-up + topic turns',
      eyebrow: 'The learner thinks it through',
      sub: 'The coached side of the arc: an optional gut-reaction warm-up, then topic turns — the learner commits to an answer, the coach lands the point.',
      groups: ['learn'] },
    { id: 'practice',    title: 'Practice',         rail: 'The live scene',
      eyebrow: 'The learner steps in',
      sub: 'The live moment the arc ends in — the learner acts, the scene reacts, the coach debriefs after.',
      groups: ['practice'] },
    { id: 'interaction', title: 'Interaction',      rail: 'The core loop',
      eyebrow: 'The learner’s core loop',
      sub: 'ENTER → (ENGAGE · REACT · COACH) ×N ↺ GATE → EXIT.',
      groups: ['interaction'] },
    { id: 'voicetone',   title: 'Voice & Tone',     rail: 'How the coach sounds',
      eyebrow: 'The coach, tuned',
      sub: 'Who the coach is and how it sounds — one stance carried through Learn and Practice. The detailed voice rules stay locked.',
      groups: ['voicetone'] },
    { id: 'debrief',     title: 'Debrief & Close',  rail: 'Results & takeaways',
      eyebrow: 'The learner’s close',
      sub: 'Results and the guaranteed takeaways — plus reference material and the locked engine.',
      groups: ['debrief', 'reference'] },
  ];
  // Badge by POSITION in the filtered list (Start shows its icon instead),
  // so hiding a step never leaves a numbering gap.
  const PHASE_NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];
  const phaseBadge = (i) => PHASE_NUMS[i - 1] || '•';
  // Platform-level context fields live on the scenario; the shell owns their
  // authoring UI (the Start step) and defaults them so every mode inherits them.
  function ensureCtx() {
    if (scenario.contextSource !== 'previous-lo') scenario.contextSource = 'in-scenario';
    if (!scenario.previousLO || typeof scenario.previousLO !== 'object') scenario.previousLO = { title: '', covered: '', handoff: '' };
  }

  // A phase shows only if this mode uses it (Start always shows). The Context
  // phase also drops out when the context is INHERITED from a previous LO —
  // there's nothing to author here, the handoff happens in Start.
  function computePhases() {
    return ALL_PHASES.filter((p) => {
      if (p.isStart) return true;
      if (p.id === 'context' && scenario.contextSource === 'previous-lo') return false;
      return type.sections.some((s) => p.groups.includes(groupOf(s)));
    });
  }
  let PHASES = computePhases();
  // Secondary groups inside a phase get a light labeled divider; the phase's
  // lead group does not (the phase header already names it).
  const SUBBANDS = { reference: 'Reference & guardrails' };
  // The one-line mode descriptor now lives on the type (type.blurb) so the
  // shell holds no per-type knowledge — a new type ships its own blurb.
  const PHASE_KEY = 'aithera.writerStudio.v2.phase';   // [V2] own key — V1's stored step ids don't all exist here

  // -1 when this section's phase isn't currently shown (e.g. a context section
  // while context is inherited) — such sections render in NO phase, rather than
  // falling back into Start.
  const phaseIndexOf = (sec) => PHASES.findIndex((p) => p.groups.includes(groupOf(sec)));
  const sectionsInPhase = (i) => type.sections.filter((sec) => phaseIndexOf(sec) === i);

  // Which phase opens first — restored across a mode switch (which reloads the
  // page), so choosing a new interaction lands the author back on Interaction.
  let activePhase = (() => {
    const idx = PHASES.findIndex((p) => p.id === sessionStorage.getItem(PHASE_KEY));
    return idx >= 0 ? idx : 0;
  })();

  function setPhase(i) {
    if (i < 0 || i >= PHASES.length) return;
    activePhase = i;
    sessionStorage.setItem(PHASE_KEY, PHASES[i].id);
    buildNav();
    buildForm();
    const form = $('#form');
    if (form) form.scrollTop = 0;
    renderLints();
  }

  /* ---- the Start step's core-interaction display -------------------------
     The interaction TYPE is picked ONCE, in the "Start from scratch" wizard —
     never switched one-click in the editor. A live swap reloads into a
     different type's structure and silently breaks the scenario, so here we
     only SHOW the current type, read-only, with a Change affordance. Changing
     it will open a guided restructure flow (not built yet); until then Change
     just explains where type selection lives. */
  function buildModeChooser() {
    const wrap = document.createElement('div');
    wrap.className = 'mode-choose';
    wrap.innerHTML = '<p class="mc-head">Core interaction</p>';

    const card = document.createElement('div');
    card.className = 'mode-card is-active mode-current';
    card.innerHTML =
      `<span class="mci"><i class="fa-solid ${esc(type.icon || 'fa-cube')}"></i></span>` +
      `<span class="mcb"><span class="mcn">${esc(type.label)}</span><span class="mcd">${esc(type.blurb || '')}</span></span>`;
    const change = document.createElement('button');
    change.type = 'button';
    change.className = 'mode-change';
    change.innerHTML = '<i class="fa-solid fa-arrow-right-arrow-left"></i> Change';
    change.addEventListener('click', () => {
      toast('Changing the core interaction opens a guided flow — coming soon. New scenarios pick their type in the “Start from scratch” wizard.');
    });
    card.appendChild(change);
    wrap.appendChild(card);

    const note = document.createElement('p');
    note.className = 'mode-current-note';
    note.textContent = 'Set when the scenario was created — it shapes every field below. Switching type restructures the scenario, so it’s a guided step, not a one-click change here.';
    wrap.appendChild(note);
    return wrap;
  }

  /* ---- the Start step's context-source control ---------------------------
     Universal, up-front decision: is the learner's context set inside this
     scenario (an intro modality) or inherited from the previous learning
     object? Choosing 'previous-lo' reveals the handoff metadata and drops the
     ① Scenario Context phase (there's nothing to author there). */
  function buildContextSource() {
    ensureCtx();
    const card = document.createElement('section');
    card.className = 'card';
    card.id = 'sec-contextsource';
    card.innerHTML =
      '<h2><i class="fa-solid fa-diagram-predecessor"></i> How is the context set?</h2>' +
      '<p class="lead">Where the learner’s context comes from before this scenario begins.</p>';
    const box = document.createElement('div');
    box.className = 'fields';
    const rg = document.createElement('vaadin-radio-group');
    rg.setAttribute('theme', 'vertical');
    [['in-scenario', 'Set it here — pick a video, audio, reading, or story intro next (or none)'],
     ['previous-lo', 'Use the previous learning object — inherit context from whatever ran before']]
      .forEach(([v, l]) => { const rb = document.createElement('vaadin-radio-button'); rb.value = v; rb.label = l; rg.appendChild(rb); });
    rg.value = scenario.contextSource || 'in-scenario';
    const detail = document.createElement('div');
    const renderDetail = () => {
      detail.innerHTML = '';
      if ((scenario.contextSource || 'in-scenario') === 'previous-lo') {
        const note = document.createElement('div');
        note.className = 'fieldnote';
        note.innerHTML = '<i class="fa-solid fa-diagram-project"></i><span>In production this is pulled in automatically. Enter it here so the AI can hand off cleanly — the <b>① Scenario Context</b> step is skipped.</span>';
        detail.append(note,
          tf('previousLO.title', 'Previous learning object', { helper: 'What the learner just completed, by name.' }),
          tf('previousLO.covered', 'What it covered', { area: true, minRows: 2, helper: 'What the learner arrives already knowing — so the coach doesn’t re-teach it.' }),
          tf('previousLO.handoff', 'How it hands off', { area: true, minRows: 2, helper: 'The state they land in — what they just did or produced, and the thread this scenario picks up.' }));
      } else {
        const note = document.createElement('div');
        note.className = 'fieldnote';
        note.innerHTML = '<i class="fa-solid fa-arrow-right"></i><span>Next step — <b>① Scenario Context</b> — is where you choose how the scene is set.</span>';
        detail.append(note);
      }
    };
    const onSrc = () => {
      const v = rg.value || 'in-scenario';
      if (v === scenario.contextSource) return;   // ignore no-op / spurious fires
      scenario.contextSource = v;
      renderDetail();             // swap the previousLO fields in place
      PHASES = computePhases();   // the ① Context phase appears/disappears
      buildNav();                 // refresh the stepper
      // Update the Next label WITHOUT calling buildForm() — rebuilding the form
      // would re-create THIS radio-group and set its .value, which re-fires
      // value-changed → onSrc → rebuild → infinite recursion (a Vaadin
      // _valueToNodeAttribute stack overflow). Patch the label in place instead.
      const nextBtn = $('.phase-foot .pf-btn.next');
      if (nextBtn && activePhase < PHASES.length - 1) {
        nextBtn.innerHTML = `Next: ${esc(PHASES[activePhase + 1].title)} <i class="fa-solid fa-arrow-right"></i>`;
      }
      scheduleUpdate();
    };
    rg.addEventListener('value-changed', onSrc);
    rg.addEventListener('change', onSrc);
    renderDetail();
    box.append(rg, detail);
    card.append(box);
    return card;
  }

  /* ---- build the form + nav (one phase at a time) ------------------------ */
  function buildForm() {
    const form = $('#form');
    form.innerHTML = '';
    if (typeof clearAside === 'function') clearAside();   // drop any pinned aside from the last phase
    ensureCtx();
    const p = PHASES[activePhase];

    const header = document.createElement('div');
    header.className = 'phase-header';
    header.innerHTML =
      `<p class="ph-eyebrow">${esc(p.eyebrow || '')}</p>` +
      `<h1><span class="badge">${p.isStart ? `<i class="fa-solid ${esc(p.icon || 'fa-play')}"></i>` : phaseBadge(activePhase)}</span> ${esc(p.title)}</h1>` +
      `<p>${esc(p.sub)}</p>`;
    form.appendChild(header);

    // The Start step leads with the core-interaction choice (it shapes the rest).
    if (p.isStart) form.appendChild(buildModeChooser());

    let lastGroup = null;
    sectionsInPhase(activePhase).forEach((sec) => {
      const g = groupOf(sec);
      if (g !== lastGroup && SUBBANDS[g]) {
        const sb = document.createElement('div');
        sb.className = 'sub-band';
        sb.textContent = SUBBANDS[g];
        form.appendChild(sb);
      }
      lastGroup = g;

      const card = document.createElement('section');
      card.className = 'card' + (sec.locked ? ' locked' : '');
      card.id = 'sec-' + sec.id;
      card.innerHTML = `
        <h2><i class="fa-solid ${esc(sec.icon)}"></i> ${esc(sec.title)}${sec.stage ? `<span class="stage">${esc(sec.stage)}</span>` : ''}</h2>
        <p class="lead">${esc(sec.lead)}</p>`;
      if (sec.bridge) {
        card.appendChild(guidance(sec.bridgeTitle || 'How this maps to your old craft', 'fa-graduation-cap', sec.bridge));
      }
      card.appendChild(type.renderFields(sec, studioApi));
      form.appendChild(card);
      spy.observe(card);
    });

    // The Start step closes with the context-source decision — it bridges into
    // the ① Context phase, or (for 'previous-lo') replaces it.
    if (p.isStart) form.appendChild(buildContextSource());

    // Back / Next footer — the natural forward path (jumping is via the rail).
    const foot = document.createElement('div');
    foot.className = 'phase-foot';
    const back = document.createElement('button');
    back.className = 'pf-btn';
    back.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Back';
    back.disabled = activePhase === 0;
    back.addEventListener('click', () => setPhase(activePhase - 1));
    const spacer = document.createElement('span');
    spacer.className = 'spacer';
    const next = document.createElement('button');
    next.className = 'pf-btn next';
    if (activePhase < PHASES.length - 1) {
      next.innerHTML = `Next: ${esc(PHASES[activePhase + 1].title)} <i class="fa-solid fa-arrow-right"></i>`;
      next.addEventListener('click', () => setPhase(activePhase + 1));
    } else {
      next.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Ready to publish';
      next.addEventListener('click', () => { const b = $('#publishBtn'); if (b) b.focus(); });
    }
    foot.append(back, spacer, next);
    form.appendChild(foot);

    refreshGuardrailText();
  }

  function buildNav() {
    const nav = $('#secNav');
    nav.innerHTML = '';
    const steps = document.createElement('div');
    steps.className = 'phase-steps';
    PHASES.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.className = 'phase-step' + (i === activePhase ? ' is-active' : '');
      btn.dataset.phase = String(i);
      btn.innerHTML =
        `<span class="pnum">${p.isStart ? `<i class="fa-solid ${esc(p.icon || 'fa-play')}"></i>` : phaseBadge(i)}</span>` +
        `<span class="pt"><span class="ptt">${esc(p.title)}</span><span class="pdesc">${esc(p.rail)}</span></span>` +
        `<span class="pstatus" data-phasedot="${p.id}"></span>`;
      btn.addEventListener('click', () => setPhase(i));
      steps.appendChild(btn);

      if (i === activePhase) {
        const sub = document.createElement('div');
        sub.className = 'phase-sections';
        sectionsInPhase(i).forEach((sec) => {
          const b = document.createElement('button');
          b.dataset.sec = sec.id;
          b.innerHTML = `<i class="fa-solid ${esc(sec.icon)}" style="width:16px;text-align:center;color:var(--ink-faint);font-size:11.5px"></i>
            <span>${esc(sec.title)}</span><span class="status" data-dot="${esc(sec.id)}"></span>`;
          b.addEventListener('click', () => {
            const el = $('#sec-' + sec.id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            $$('.phase-sections button').forEach((x) => x.classList.toggle('is-active', x === b));
          });
          sub.appendChild(b);
        });
        steps.appendChild(sub);
      }
    });
    nav.appendChild(steps);
  }

  function refreshGuardrailText() {
    (type.ENGINE_SECTIONS || []).forEach((g) => {
      const pre = $(`pre[data-guardrail="${g.id}"]`);
      if (pre) pre.textContent = g.text(scenario);
    });
  }

  /* ---- field change → debounced recompute -------------------------------- */
  let updateTimer;
  function onField(e) {
    const host = e.currentTarget;
    setByPath(scenario, host.dataset.path, host.value);
    scheduleUpdate();
  }
  function scheduleUpdate() {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(update, 350);
  }

  function saveDraft() {
    localStorage.setItem(type.store.keys.draft, JSON.stringify(scenario));
    const t = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    $('#saveStatus').innerHTML = `<i class="fa-solid fa-circle-check"></i> Draft saved ${esc(t)}`;
  }

  /* =======================================================================
     LINTS + prompt highlighting live in the TYPE now (type.lints /
     type.highlightStrings). The shell only renders what they return.
     ======================================================================= */

  /* ---- render lints + nav dots + publish state --------------------------- */
  const SEVERITY_ICON = { err: 'fa-circle-xmark', warn: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const SEVERITY_RANK = { err: 0, warn: 1, info: 2 };
  let currentLints = [];

  function renderLints() {
    currentLints = type.lints(scenario, studioApi).sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
    const errs = currentLints.filter((l) => l.severity === 'err').length;
    const warns = currentLints.filter((l) => l.severity === 'warn').length;
    const infos = currentLints.filter((l) => l.severity === 'info').length;

    // Tab label count
    $('#lintTab').innerHTML = `<i class="fa-solid fa-shield-halved" style="margin-right:7px"></i> Guardrails${errs + warns ? ` (${errs + warns})` : ''}`;

    // Panel
    const box = $('#tabLints');
    let html = '<div class="lintsummary">';
    html += errs ? `<span class="pill err"><i class="fa-solid fa-circle-xmark"></i> ${errs} blocking</span>` : '';
    html += warns ? `<span class="pill warn"><i class="fa-solid fa-triangle-exclamation"></i> ${warns} warnings</span>` : '';
    html += infos ? `<span class="pill info"><i class="fa-solid fa-circle-info"></i> ${infos} tips</span>` : '';
    html += !currentLints.length ? `<span class="pill ok"><i class="fa-solid fa-circle-check"></i> All checks pass</span>` : '';
    html += '</div>';
    if (!currentLints.length) {
      html += '<div class="lintclean"><i class="fa-solid fa-circle-check"></i>Nothing to flag. Publish when the playtest holds up.</div>';
    } else {
      html += currentLints.map((l, i) => {
        const sec = type.sections.find((x) => x.id === l.section);
        return `<div class="lint ${l.severity}" data-goto="${esc(l.section)}" role="button" tabindex="0">
          <i class="fa-solid ${SEVERITY_ICON[l.severity]} icon"></i>
          <div><div class="msg">${esc(l.msg)}</div>${l.why ? `<div class="why">${esc(l.why)}</div>` : ''}
          <div class="sec">${esc(sec ? sec.title : l.section)}</div></div>
        </div>`;
      }).join('');
    }
    box.innerHTML = html;
    $$('[data-goto]', box).forEach((n) => n.addEventListener('click', () => {
      $('#sec-' + n.dataset.goto).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    // Nav dots: worst severity per section
    type.sections.forEach((sec) => {
      const dot = $(`[data-dot="${sec.id}"]`);
      if (!dot) return;
      const worst = currentLints.filter((l) => l.section === sec.id)
        .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])[0];
      dot.className = 'status ' + (sec.locked ? '' : worst ? (worst.severity === 'err' ? 'err' : worst.severity === 'warn' ? 'warn' : '') : 'ok');
      dot.innerHTML = sec.locked ? '<i class="fa-solid fa-lock locknote"></i>'
        : worst && worst.severity !== 'info' ? '<i class="fa-solid fa-circle"></i>'
        : '<i class="fa-solid fa-circle-check"></i>';
    });

    // Phase-step aggregate dots: the worst non-info severity in each phase, so
    // a collapsed phase still signals it has a blocking issue or a warning.
    PHASES.forEach((p, i) => {
      const dot = $(`[data-phasedot="${p.id}"]`);
      if (!dot) return;
      const ids = sectionsInPhase(i).map((s) => s.id);
      const worst = currentLints.filter((l) => ids.includes(l.section))
        .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])[0];
      const sev = worst && worst.severity !== 'info' ? worst.severity : '';
      dot.className = 'pstatus ' + sev;
      dot.innerHTML = sev ? '<i class="fa-solid fa-circle"></i>' : '';
    });

    // Publish gating
    const btn = $('#publishBtn');
    btn.disabled = errs > 0;
    btn.title = errs ? `${errs} blocking issue${errs > 1 ? 's' : ''} — see Guardrails` : '';
  }

  /* ---- compiled prompt pane ----------------------------------------------
     type.compile(scenario) returns EITHER one prompt string or an ordered
     list of named prompts [{label, text}] (teach-back has three). When there
     is more than one, a small sub-tab strip lets the writer switch between
     them; a single prompt renders exactly as before with no strip. */
  let activePromptIdx = 0;
  let activePromptText = '';
  // Sentinels that can't appear in real prompt text — used to defer wrapping
  // highlighted spans until after all substring matches, so overlaps never
  // produce nested/broken tags.
  const WR_S = '', WR_E = '';

  function renderPrompt() {
    const out = type.compile(scenario);
    const prompts = (typeof out === 'string') ? [{ label: 'System prompt', text: out }] : (out || []);
    if (activePromptIdx >= prompts.length) activePromptIdx = 0;

    // Sub-tab strip — only when the type compiles to more than one prompt.
    let strip = $('#promptSubtabs');
    if (prompts.length > 1) {
      if (!strip) {
        strip = document.createElement('div');
        strip.id = 'promptSubtabs';
        strip.className = 'prompt-subtabs';
        strip.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap';
        $('#promptView').parentNode.insertBefore(strip, $('#promptView'));
      }
      strip.hidden = false;
      strip.innerHTML = prompts.map((p, i) => {
        const on = i === activePromptIdx;
        return `<button data-pi="${i}" style="padding:4px 11px;border:1px solid var(--line);border-radius:999px;cursor:pointer;font-size:12px;${on ? 'background:#2563eb;color:#fff;border-color:#2563eb' : 'background:transparent;color:var(--ink-faint)'}">${esc(p.label)}</button>`;
      }).join('');
      $$('[data-pi]', strip).forEach((b) => b.addEventListener('click', () => {
        activePromptIdx = Number(b.dataset.pi);
        renderPrompt();
      }));
    } else if (strip) {
      strip.hidden = true;
    }

    const prompt = (prompts[activePromptIdx] || { text: '' }).text || '';
    activePromptText = prompt;
    $('#promptChars').textContent = prompt.length.toLocaleString() + ' chars';
    $('#promptTokens').textContent = '~' + Math.round(prompt.length / 4).toLocaleString() + ' tokens';

    let html = esc(prompt);
    (type.highlightStrings ? type.highlightStrings(scenario) : []).forEach((t) => {
      const needle = esc(t);
      html = html.split(needle).join(WR_S + needle + WR_E);
    });
    // Resolve sentinels after all replacements so overlaps can't nest tags badly.
    html = html.split(WR_S).join('<span class="wr">').split(WR_E).join('</span>');
    $('#promptView').innerHTML = html;
  }

  /* ---- publish state strip ------------------------------------------------ */
  function renderPubState() {
    const strip = $('#pubStrip');
    const text = $('#pubText');
    const unpub = $('#unpublishBtn');
    const pub = type.store.loadPublished();
    strip.classList.remove('is-live', 'is-stale');
    if (!pub) {
      text.textContent = 'Not published — the learner prototype is running the shipped scenario.';
      unpub.hidden = true;
      return;
    }
    unpub.hidden = false;
    const when = pub.savedAt ? new Date(pub.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    if (JSON.stringify(pub.scenario) === JSON.stringify(scenario)) {
      strip.classList.add('is-live');
      text.textContent = `Published ${when} — the learner prototype (in this browser) is running this exact draft.`;
    } else {
      strip.classList.add('is-stale');
      text.textContent = `Published ${when}, but your draft has unpublished changes.`;
    }
  }

  /* ---- the one update pipeline ------------------------------------------- */
  function update() {
    saveDraft();
    renderPrompt();
    renderLints();
    renderPubState();
    refreshGuardrailText();
    if (playtestHandle) playtestHandle.refreshTarget();
    // The type decides which learner page the preview link points at.
    $('#previewLink').href = type.previewUrl(scenario);
  }

  /* =======================================================================
     PLAYTEST — the driver lives in the type (type.playtest). The shell builds
     it into the Playtest tab once and keeps a handle so update()/reset can
     poke it. A type with no playtest (playtest:null) simply skips this.
     ======================================================================= */
  let playtestHandle = null;
  function buildPlaytest() {
    if (!type.playtest) return;
    playtestHandle = type.playtest.build($('#tabPlaytest'), {
      $, $$, esc, toast,
      getScenario: () => scenario,
      compile: (s) => type.compile(s),
      fill: (t, s) => type.fill(t, s),
      workerUrlKey: type.store.keys.workerUrl,
    });
  }

  /* ---- Say/Do Split sandbox ----------------------------------------------
     A standalone tester for the scene-move splitter (js/say-do-split.js): type
     a move as a learner would and see it split into what they DO (an action
     line) and what they SAY (a bubble). Shows the instant deterministic pass
     and the fast-model AI pass side by side, so the split can be tuned in
     isolation without running a whole playtest conversation. Reuses the
     Playtest tab's worker URL for the AI call. */
  const SPLIT_DEFAULT_WORKER = 'https://aithera-action-proxy.vector-aithera.workers.dev';
  const SPLIT_SAMPLES = [
    "I'd punch Jake, tell him to shove off and then run away",
    'I step in beside them and say "knock it off"',
    "I'd tell him to drop it and then check on her after",
    'knock it off',
    'I look over at her',
    "I'd calmly ask him to please stop",
  ];
  function buildSplitSandbox() {
    const box = $('#tabSplit');
    if (!box) return;
    if (!window.AitheraSayDoSplit) { box.innerHTML = '<p class="split-intro">Split module not loaded.</p>'; return; }
    const SDS = window.AitheraSayDoSplit;
    box.innerHTML = `
      <div class="split-pad">
        <p class="split-intro">See how a learner's scene move splits into an ordered sequence of what they <b>do</b> (centered action lines) and what they <b>say</b> (amber bubbles) — multiple of each, kept in the order the learner meant, so "punch, tell him to shove off, then run" stays punch → "Shove off" → run. Same split the live page and playtest scene turns use. The <b>instant</b> pass is deterministic; the <b>AI</b> pass (the reliable one for free-form moves) uses the fast model via the Playtest worker.</p>
        <vaadin-text-area theme="outlined" id="splitInput" label="A move, the way a learner would type it" min-rows="2" placeholder="e.g. I step in beside them and say &quot;knock it off&quot;"></vaadin-text-area>
        <div class="split-actions">
          <vaadin-button theme="primary" id="splitRunBtn"><i class="fa-solid fa-scissors" style="margin-right:6px"></i> Split it</vaadin-button>
        </div>
        <div class="split-samples" id="splitSamples"><span class="label">Try:</span></div>
        <div class="split-results" id="splitResults"></div>
      </div>`;
    const input = $('#splitInput');
    const results = $('#splitResults');
    const beatsHtml = (beats) => (!beats || !beats.length)
      ? '<div class="split-empty">— nothing —</div>'
      : beats.map((b) => `<div class="split-beat ${b.kind === 'narration' ? 'do' : 'say'}"><span class="split-lbl">${b.kind === 'narration' ? 'DO' : 'SAY'}</span><span class="split-txt">${esc(b.text)}</span></div>`).join('');
    const card = (title, inner) => `<div class="split-card"><div class="split-card-h">${esc(title)}</div>${inner}</div>`;
    const run = async () => {
      const text = (input.value || '').trim();
      if (!text) { toast('Type a move to split'); return; }
      const det = SDS.splitSceneInput(text);
      results.innerHTML = card('Instant · deterministic', beatsHtml(det)) + card('AI · fast model', '<div class="split-loading"><span></span><span></span><span></span></div>');
      const workerUrl = (($('#ptWorkerUrl') && $('#ptWorkerUrl').value) || SPLIT_DEFAULT_WORKER).trim();
      let ai, failed = false;
      try { ai = await SDS.splitSceneInputAI(text, { workerUrl }); } catch (e) { failed = true; }
      const aiInner = failed
        ? '<div class="split-empty">AI split failed — check the Playtest worker URL. Deterministic pass still applies.</div>'
        : beatsHtml(ai || SDS.splitSceneInput(text));
      results.innerHTML = card('Instant · deterministic', beatsHtml(det)) + card('AI · fast model', aiInner);
    };
    $('#splitRunBtn').addEventListener('click', run);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); } });
    const samples = $('#splitSamples');
    SPLIT_SAMPLES.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'split-sample'; b.textContent = t;
      b.addEventListener('click', () => { input.value = t; input.focus(); });
      samples.appendChild(b);
    });
  }

  /* ---- inspector tabs ----------------------------------------------------
     A type with no playtest (playtest:null) drops the Playtest tab + body, so
     the body list is built from whatever survives. */
  // Tab <-> body mapping is DATA-DRIVEN (each vaadin-tab's data-body names its
  // body id), so tabs can be added/removed — the Playtest tab, or a type's
  // pinned "aside" panel (setAside below) — without any index math.
  const inspTabs = () => Array.from($('#inspectorTabs').querySelectorAll('vaadin-tab'));
  const INSP_BODIES = ['tabAside', 'tabPrompt', 'tabLints', 'tabPlaytest', 'tabSplit'];
  function activateInspBody(bodyId) {
    INSP_BODIES.forEach((id) => { const el = $('#' + id); if (el) el.classList.toggle('is-active', id === bodyId); });
  }
  function selectInspTab(tab) {
    const i = inspTabs().indexOf(tab);
    if (i >= 0) { $('#inspectorTabs').selected = i; activateInspBody(tab.dataset.body); }
  }
  if (!type.playtest) {
    const pt = inspTabs().find((t) => t.dataset.body === 'tabPlaytest');
    if (pt) pt.remove();
    const ptBody = $('#tabPlaytest');
    if (ptBody) ptBody.remove();
  }
  $('#inspectorTabs').addEventListener('selected-changed', (e) => {
    const tab = inspTabs()[e.detail.value];
    if (tab) activateInspBody(tab.dataset.body);
  });

  /* ---- pinned inspector "aside" (type-agnostic) --------------------------
     A type can pin a node into the inspector for the CURRENT phase via
     studioApi.setAside(node, {title, icon}) — e.g. Scene Sweep pins its photo
     canvas beside the hazard cards so drawing and editing sit side-by-side. The
     shell owns the tab lifecycle; the type just hands over a DOM node. Cleared
     at the top of every buildForm(), so it only lives on the phase that set it. */
  let asideTab = null, asideBody = null;
  function clearAside() {
    const wasActive = asideBody && asideBody.classList.contains('is-active');
    if (asideBody) { asideBody.remove(); asideBody = null; }
    if (asideTab) { asideTab.remove(); asideTab = null; }
    if (wasActive) { const first = inspTabs()[0]; if (first) selectInspTab(first); }
  }
  function setAside(node, opts) {
    clearAside();
    opts = opts || {};
    const tabsEl = $('#inspectorTabs');
    asideTab = document.createElement('vaadin-tab');
    asideTab.dataset.body = 'tabAside';
    asideTab.innerHTML = `<i class="fa-solid ${esc(opts.icon || 'fa-image')}" style="margin-right:7px"></i> ${esc(opts.title || 'Preview')}`;
    tabsEl.insertBefore(asideTab, tabsEl.firstElementChild);
    asideBody = document.createElement('div');
    asideBody.className = 'tabbody is-aside';
    asideBody.id = 'tabAside';
    asideBody.appendChild(node);
    tabsEl.parentNode.insertBefore(asideBody, tabsEl.nextSibling);
    selectInspTab(asideTab);
  }
  studioApi.setAside = setAside;

  /* ---- top bar actions ----------------------------------------------------- */
  $('#publishBtn').addEventListener('click', () => {
    renderLints();
    if (currentLints.some((l) => l.severity === 'err')) {
      toast('Fix the blocking issues first — see Guardrails');
      return;
    }
    type.store.publish(scenario);
    renderPubState();
    toast('Published — reload the learner preview to run it');
  });

  $('#unpublishBtn').addEventListener('click', () => {
    if (!confirm('Unpublish? The learner prototype goes back to the shipped scenario. Your draft here is untouched.')) return;
    type.store.clearPublished();
    renderPubState();
    toast('Unpublished — prototype reverted to the shipped scenario');
  });

  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Reset your draft to the shipped default? This discards your edits (published copies are not affected).')) return;
    scenario = type.normalize(clone(type.DEFAULT));
    if (playtestHandle) playtestHandle.reset();
    setPhase(0);
    update();
    toast('Draft reset to the shipped scenario');
  });

  /* Start fresh — a blank canvas for authoring a NEW scenario in this mode.
     Non-destructive: the published copy and the library are untouched (this
     only replaces the working draft), so it's the safe "author a new course"
     entry point. Each type supplies a blank template; older types fall back
     to an emptied default. */
  $('#freshBtn').addEventListener('click', () => {
    if (!confirm('Start a brand-new scenario in this mode?\n\nThis clears every field so you can author from scratch. Your published copy and saved library entries are untouched — Export first if you want to keep the current draft.')) return;
    scenario = type.normalize(type.blank ? type.blank() : clone(type.DEFAULT));
    if (playtestHandle) playtestHandle.reset();
    setPhase(0);
    update();
    toast('Fresh scenario — fill it in from the top');
  });

  /* [V2] Start from scratch — the guided wizard (js/studio-wizard.js).
     Brief → interview → staged generation; the drafted scenario lands here
     as the working draft. Non-destructive: whatever was in the editor is
     snapshotted to the Library first. Modes without a wizard spec fall back
     to a pointer at Blank canvas. */
  function openWizard() {
    // The wizard now opens with its own type chooser — any registered type
    // with a wizard spec is buildable, whichever mode this page is on.
    const anyWizard = window.AitheraStudio.list().some((t) => t && t.wizard);
    if (!(window.AitheraStudioWizard && anyWizard)) {
      toast('Guided setup isn\'t available — Blank canvas is the manual path.');
      return;
    }
    window.AitheraStudioWizard.open({
      type, toast, esc,
      workerUrlKey: type.store.keys.workerUrl,
      getScenario: () => scenario,
      replaceScenario: (next) => {
        try {
          const pristine = JSON.stringify(type.normalize(clone(type.DEFAULT))) === JSON.stringify(scenario);
          if (!pristine) type.store.saveToLibrary(clone(scenario));   // never eat an in-progress draft
        } catch (e) { /* snapshot is best-effort */ }
        scenario = next;
        PHASES = computePhases();
        setPhase(0);
        update();
        if (playtestHandle) playtestHandle.reset();
      },
    });
  }
  $('#wizardBtn').addEventListener('click', openWizard);

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scenario.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('scenario.json downloaded');
  });

  /* Import JSON — load a scenario file a colleague sent you into the editor.
     Runs the parsed object through mergeScenario (which normalizes it), so
     partial or older-schema files still load. Replaces the draft after a
     confirm, exactly like loading from the library. */
  const importFile = $('#importFile');
  $('#importBtn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', () => {
    const file = importFile.files && importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let obj;
      try {
        obj = JSON.parse(reader.result);
      } catch (err) {
        toast('That file isn\'t valid JSON — nothing changed');
        importFile.value = '';
        return;
      }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        toast('That JSON isn\'t a scenario — nothing changed');
        importFile.value = '';
        return;
      }
      const incoming = mergeScenario(obj);
      if (!confirm(`Import "${incoming.title}" into the editor? Your current draft is replaced — save it to the library first if you want to keep it.`)) {
        importFile.value = '';
        return;
      }
      scenario = incoming;
      buildForm();
      update();
      if (playtestHandle) playtestHandle.reset();
      // allow re-importing the same filename twice in a row
      importFile.value = '';
      toast(`Imported "${scenario.title}"`);
    };
    reader.onerror = () => { toast('Couldn\'t read that file'); importFile.value = ''; };
    reader.readAsText(file);
  });

  $('#copyPromptBtn').addEventListener('click', async () => {
    await navigator.clipboard.writeText(activePromptText);
    toast('Compiled prompt copied');
  });

  /* ---- scenario library (topbar popover) ----------------------------------
     Named saved scenarios in this browser. "Save current" snapshots the
     draft under its title; loading an entry REPLACES the draft (after
     confirm). The published slot is separate and untouched by all of this. */
  const libBtn = $('#libraryBtn');
  const libPanel = $('#libPanel');

  function renderLibrary() {
    const entries = type.store.listLibrary();
    let html = '<div class="libhead">Saved scenarios (this browser)</div>';
    if (!entries.length) {
      html += '<div class="libempty">Nothing saved yet. "Save current" snapshots your draft so you can start another scenario without losing this one.</div>';
    } else {
      html += entries.map((e) => {
        const when = e.savedAt ? new Date(e.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
        return `<div class="librow">
          <button class="meta" data-load="${esc(e.id)}" title="Load into the editor"><span class="t">${esc(e.title)}</span><span class="d">Saved ${esc(when)}</span></button>
          <button class="rm" data-remove="${esc(e.id)}" aria-label="Delete ${esc(e.title)} from library"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>
        </div>`;
      }).join('');
    }
    html += `<button class="libsave" id="libSaveBtn"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Save current draft as a new entry</button>`;
    libPanel.innerHTML = html;

    $('#libSaveBtn', libPanel).addEventListener('click', () => {
      type.store.saveToLibrary(clone(scenario));
      renderLibrary();
      toast(`Saved "${scenario.title}" to the library`);
    });
    $$('[data-load]', libPanel).forEach((b) => b.addEventListener('click', () => {
      const s = type.store.loadFromLibrary(b.dataset.load);
      if (!s) { toast('That entry could not be loaded'); return; }
      if (!confirm(`Load "${s.title}" into the editor? Your current draft is replaced — save it to the library first if you want to keep it.`)) return;
      scenario = mergeScenario(s);
      buildForm();
      update();
      if (playtestHandle) playtestHandle.reset();
      closeLibrary();
      toast(`Loaded "${s.title}"`);
    }));
    $$('[data-remove]', libPanel).forEach((b) => b.addEventListener('click', () => {
      if (!confirm('Delete this saved scenario? This can\'t be undone.')) return;
      type.store.removeFromLibrary(b.dataset.remove);
      renderLibrary();
    }));
  }

  function openLibrary() {
    renderLibrary();
    libPanel.hidden = false;
    libBtn.setAttribute('aria-expanded', 'true');
  }
  function closeLibrary() {
    libPanel.hidden = true;
    libBtn.setAttribute('aria-expanded', 'false');
  }
  libBtn.addEventListener('click', () => (libPanel.hidden ? openLibrary() : closeLibrary()));
  document.addEventListener('click', (e) => {
    if (!libPanel.hidden && !e.composedPath().includes(libPanel) && !e.composedPath().includes(libBtn)) closeLibrary();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !libPanel.hidden) closeLibrary(); });

  /* ---- scroll spy: keep the nav highlighting the visible section ---------- */
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        $$('.phase-sections button').forEach((b) =>
          b.classList.toggle('is-active', b.dataset.sec === en.target.id.replace('sec-', '')));
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  /* ---- type label + switcher ----------------------------------------------
     The sub-title names the pedagogy being edited. When more than one type is
     registered, a small dropdown switches between them (each type has its own
     draft/published/library, so switching just reloads with ?type=). */
  (function initModeLabel() {
    // The sub-title just orients the author; the interactive mode CHOICE now
    // lives inside the Interaction phase (buildModeChooser), so a phase-level
    // decision sits with the other phase-level decisions.
    const sub = $('#subTitle');
    if (sub) sub.textContent = 'Scenario Simulator · ' + type.label;
  })();

  /* ---- inspector collapse ------------------------------------------------
     The prompt/guardrails/playtest panel is powerful but space-hungry, so it
     collapses to a slim rail. The choice is remembered across sessions. */
  (function initInspectorToggle() {
    const cols = $('.cols');
    const KEY = 'aithera.writerStudio.inspector';
    const setCollapsed = (collapsed) => {
      cols.classList.toggle('insp-collapsed', collapsed);
      const t = $('#inspToggle');
      if (t) t.setAttribute('aria-expanded', String(!collapsed));
      localStorage.setItem(KEY, collapsed ? 'collapsed' : 'open');
    };
    if (localStorage.getItem(KEY) === 'collapsed') setCollapsed(true);
    $('#inspToggle').addEventListener('click', () => setCollapsed(true));
    $('#inspRail').addEventListener('click', () => setCollapsed(false));
  })();

  /* ---- boot ---------------------------------------------------------------- */
  buildNav();
  buildForm();
  buildPlaytest();
  buildSplitSandbox();
  update();
  // [V2] deep link: ?wizard=1 opens the start-from-scratch wizard directly.
  if (new URLSearchParams(location.search).get('wizard') === '1') openWizard();
