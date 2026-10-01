/* ============================================================================
   app.js — Scenario Editor, Wave 3 design prototype
   ----------------------------------------------------------------------------
   Renders four phases, a document-settings drawer and a chrome-level validation
   affordance over one hardcoded scenario document.

   DELIBERATELY NOT HERE, and not by omission:
     - prompt compilation      the reference tool's compiler is ~200KB and
                               nothing in a structural design pass reads it
     - model calls             every generate/preview affordance is faked
     - schema validation       the lint list below is authored, so the states a
                               design has to handle can be triggered on demand
     - export                  Wave 3 changes no data contract

   The lint list being FAKE is a feature, not a shortcut: AI-14 (acknowledging a
   newly-valid state) needs errors that can be cleared on cue, which a real
   validator would not give us until the document was genuinely editable.
   ========================================================================== */
(function () {
  'use strict';

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---- the document ------------------------------------------------------
     One scenario, held in memory. Edits are not persisted anywhere: a design
     prototype that survives reload would start hiding its own starting state. */
  const doc = JSON.parse(JSON.stringify(window.SCENARIO_DATA || {}));
  const C = doc.content || (doc.content = {});

  /* AI-01 — prior context is now a SETTING. The reference tool stores three
     prose fields the author writes; here the upstream content is resolved by
     the tool and the author only chooses whether the coach may read it. The
     resolved block below stands in for what the platform would supply. */
  const upstream = {
    title: 'Recognizing Workplace Harassment',
    kind: 'Video · 6 min',
    covered: 'Defines harassment under Title VII, distinguishes it from ordinary '
           + 'workplace friction, and covers the employer’s duty to act once a '
           + 'report is made.',
    handoff: 'The learner has just seen three short dramatized clips and been asked '
           + 'to notice which crossed a line.',
  };
  let contextMode = 'use';          // 'use' | 'ignore'

  /* ---- phases (AI-04 · AI-10) -------------------------------------------
     Four, not six. Start is gone — its contents were a read-only type card, a
     title, a derived id and a prose block that is now a setting, none of which
     is a step in the work. Voice & Tone is gone as a separate phase because
     nothing downstream of the coach's voice feeds back into it: the reference
     tool's own AI wizard authors coach voice in its FIRST task, alongside the
     narrative, while the editor put it fourth. */
  const PHASES = [
    { id: 'world', icon: 'fa-earth-americas', title: 'Situation & World',
      eyebrow: 'Where this happens — and who is in it',
      sub: 'The world the scenario plays out in: the situation the learner is shown, the facts every scene shares, the people who can appear, and the coach who guides them.' },
    { id: 'teaching', icon: 'fa-graduation-cap', title: 'Teaching',
      eyebrow: 'The point of the whole thing',
      sub: 'What the learner must leave understanding, grouped by subject — plus the wrong beliefs worth correcting. Released when the coach teaches, never mid-attempt.' },
    { id: 'interaction', icon: 'fa-list-ol', title: 'Interaction',
      eyebrow: 'What the learner actually does',
      sub: 'The arc, step by step: each one gives the learner something to do, then has the coach teach against how they did it.' },
    { id: 'debrief', icon: 'fa-flag-checkered', title: 'Debrief & Close',
      eyebrow: 'The learner’s close',
      sub: 'Results and the guaranteed takeaways — the audit-defensible expert answer every learner sees, on every path.' },
  ];
  let active = 0;

  /* ---- authored lints ----------------------------------------------------
     Shaped like the reference tool's output ({severity, phase, msg, where}) so
     the affordances built against it stay honest, but authored rather than
     computed. `cleared` lets the Wave-4 question — what does reaching valid
     feel like? — be demonstrated on demand. */
  const LINTS = [
    { severity: 'err',  phase: 'interaction', msg: 'Step 3 has no exit requirement',
      where: 'Interaction · Step 3 — Speak Up', cleared: false },
    { severity: 'warn', phase: 'world', msg: 'Jake has no guardrails authored',
      where: 'Situation & World · Characters', cleared: false },
    { severity: 'warn', phase: 'debrief', msg: 'No source references on the expert answer',
      where: 'Debrief & Close · Expert answer', cleared: false },
  ];
  const liveLints = () => LINTS.filter((l) => !l.cleared);

  /* ===================================================================== */
  /* Header                                                                 */
  /* ===================================================================== */

  function renderTitle() {
    const el = $('#docTitle');
    const t = String(C.title || '').trim();
    el.textContent = t || 'Untitled scenario';
    el.classList.toggle('is-empty', !t);
  }

  /* The title is a button until it is clicked, so the header reads as a heading
     rather than as a form field sitting in the chrome. */
  function initTitle() {
    const el = $('#docTitle');
    el.addEventListener('click', () => {
      const input = document.createElement('input');
      input.className = 'ph-title';
      input.value = String(C.title || '');
      input.style.width = Math.max(260, Math.min(620, (input.value.length + 2) * 8)) + 'px';
      el.replaceWith(input);
      input.focus(); input.select();
      const commit = () => {
        C.title = input.value.trim();
        input.replaceWith(el);
        renderTitle();
        renderSettings();          // the derived id follows the title
      };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { input.value = String(C.title || ''); input.blur(); }
      });
    });

    /* AI-02 — generation is available wherever the title is, rather than only
       at draft time. Canned here; a real one would read the narrative. */
    $('#genTitle').addEventListener('click', () => {
      C.title = 'Bystander Intervention: Speaking Up for a Colleague';
      renderTitle(); renderSettings();
      toast('Title suggested from the situation');
    });
  }

  /* AI-02 — an implementation id is DERIVED, never typed. Shown as a read-out
     so its provenance is visible without offering an edit nobody should make. */
  const slug = (s) => String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const derivedId = () => 'scn-' + (slug(C.title) || 'untitled');

  /* ===================================================================== */
  /* Validation — chrome affordance + popover (AI-13)                       */
  /* ===================================================================== */

  function renderValidity() {
    const live = liveLints();
    const errs  = live.filter((l) => l.severity === 'err').length;
    const warns = live.filter((l) => l.severity === 'warn').length;

    const btn = $('#validityBtn');
    btn.classList.remove('has-err', 'has-warn', 'is-clean');
    if (errs)        { btn.classList.add('has-err');  $('#validityTxt').textContent = errs + ' blocking'; }
    else if (warns)  { btn.classList.add('has-warn'); $('#validityTxt').textContent = warns + ' to review'; }
    else             { btn.classList.add('is-clean'); $('#validityTxt').textContent = 'Ready'; }

    // Popover body
    const pop = $('#vpop');
    let h = '<div class="vpop-head"><h3>Validation</h3>';
    if (errs)  h += `<span class="vpill err"><i class="fa-solid fa-circle-xmark"></i> ${errs} blocking</span>`;
    if (warns) h += `<span class="vpill warn"><i class="fa-solid fa-triangle-exclamation"></i> ${warns}</span>`;
    if (!live.length) h += '<span class="vpill ok"><i class="fa-solid fa-circle-check"></i> All clear</span>';
    h += '</div>';

    if (!live.length) {
      h += '<div class="vclean">'
        + '<div class="big"><i class="fa-solid fa-circle-check"></i></div>'
        + '<h4>Everything checks out</h4>'
        + '<p>Nothing is blocking this scenario. Preview it, then publish when the playtest holds up.</p>'
        + '<div class="w4">Wave 4 designs what this moment actually feels like — the counter '
        + 'falling, the phase resolving, the scenario becoming publishable.</div>'
        + '</div>';
    } else {
      h += live.map((l, i) =>
        `<div class="lint ${l.severity}" data-lint="${i}" role="button" tabindex="0">
           <i class="fa-solid ${l.severity === 'err' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}"></i>
           <div><div class="msg">${esc(l.msg)}</div><div class="where">${esc(l.where)}</div></div>
         </div>`).join('');
      /* Demo control. Present because the interesting design question here is
         the TRANSITION to valid, which needs to be triggerable. */
      h += '<div style="padding:10px 12px 6px;border-top:1px dashed var(--line);margin-top:6px">'
         + '<button id="clearLints" style="background:none;border:1px solid var(--line);border-radius:6px;'
         + 'padding:6px 11px;font:600 11.5px \'Open Sans\',sans-serif;color:var(--ink-soft);cursor:pointer">'
         + '<i class="fa-solid fa-play" style="margin-right:6px"></i>Demo: resolve everything</button></div>';
    }
    pop.innerHTML = h;

    // A lint navigates to the phase it belongs to.
    $$('[data-lint]', pop).forEach((n) => n.addEventListener('click', () => {
      const l = live[Number(n.dataset.lint)];
      const idx = PHASES.findIndex((p) => p.id === l.phase);
      if (idx >= 0) setPhase(idx);
      closeVpop();
    }));
    const clr = $('#clearLints', pop);
    if (clr) clr.addEventListener('click', () => {
      LINTS.forEach((l) => { l.cleared = true; });
      renderValidity(); renderRail();
      toast('All checks pass — Wave 4 makes this a moment');
    });

    renderRail();
  }

  const closeVpop = () => {
    $('#vpop').classList.remove('is-open');
    $('#validityBtn').classList.remove('is-open');
  };

  /* ===================================================================== */
  /* Rail — the phase navigation (AI-04)                                    */
  /* ===================================================================== */

  function renderRail() {
    const rail = $('#rail');
    const live = liveLints();
    rail.innerHTML = '';

    PHASES.forEach((p, i) => {
      const worst = live.filter((l) => l.phase === p.id)
        .sort((a, b) => (a.severity === 'err' ? -1 : 1))[0];
      const b = document.createElement('button');
      b.className = 'rail-btn' + (i === active ? ' is-active' : '');
      b.innerHTML =
        `<span class="rail-num">${i + 1}</span>`
        + `<i class="fa-solid ${p.icon}"></i>`
        + `<span class="rail-dot ${worst ? worst.severity : 'ok'}"></span>`
        + `<span class="rail-tip">${esc(p.title)}</span>`;
      b.addEventListener('click', () => setPhase(i));
      rail.appendChild(b);
    });

    rail.appendChild(Object.assign(document.createElement('div'), { className: 'rail-spacer' }));
    rail.appendChild(Object.assign(document.createElement('div'), { className: 'rail-sep' }));

    /* Settings sits at the FOOT and below a divider on purpose: it is not a
       fifth phase, it is what the document is. */
    const s = document.createElement('button');
    s.className = 'rail-btn';
    s.innerHTML = '<i class="fa-solid fa-sliders"></i><span class="rail-tip">Scenario settings</span>';
    s.addEventListener('click', openDrawer);
    rail.appendChild(s);
  }

  function setPhase(i) {
    active = i;
    renderRail();
    renderPhase();
    $('#surface').scrollTop = 0;
  }

  /* ===================================================================== */
  /* The authoring surface                                                  */
  /* ===================================================================== */

  /* ---- field builders ----------------------------------------------------
     Small helpers so a section reads as a list of fields rather than a wall of
     template strings. Every input is a real Vector component bound to the live
     document; `rid` hands each one a stable id so bindAll can find it again
     after a re-render. */
  let _rid = 0;
  const rid = () => 'f' + (++_rid);
  const BINDINGS = [];        // {id, get, set} — re-applied after every paint

  function field(label, opts, get, set) {
    const id = rid();
    const o = opts || {};
    const tag = o.area ? 'vaadin-text-area' : 'vaadin-text-field';
    BINDINGS.push({ id, get, set });
    return `<${tag} theme="outlined" id="${id}" label="${esc(label)}"`
      + (o.helper ? ` helper-text="${esc(o.helper)}"` : '')
      + (o.area ? ` min-rows="${o.rows || 2}"` : '')
      + (o.readonly ? ' readonly' : '')
      + `></${tag}>`;
  }

  /* A list row. The reference tool renders every member of every list fully
     expanded, always — which is the density AI-05 is about. This prototype
     reproduces that faithfully on purpose: Waves 1-2 redesign it, and you
     cannot judge the redesign against a version that never had the problem. */
  function rowCard(title, inner, badge) {
    return `<div class="rowcard"><div class="rowhead">${esc(title)}`
      + (badge ? `<span class="rowbadge">${esc(badge)}</span>` : '')
      + `<button class="rowdel" title="Remove"><i class="fa-solid fa-trash-can"></i></button>`
      + `</div>${inner}</div>`;
  }
  const rows = (title, lead, inner, addLabel) =>
    `<div class="rows"><div class="rows-head"><span class="rows-title">${esc(title)}</span>`
    + (lead ? `<span class="rows-lead">${esc(lead)}</span>` : '') + '</div>'
    + inner
    + `<button class="addrow"><i class="fa-solid fa-plus"></i> ${esc(addLabel)}</button></div>`;

  /* A nested list of plain strings (a character's guardrails, a topic's points).
     Deliberately borderless: a card inside a card reads as a peer of its parent,
     which is the opposite of what nesting means. */
  function subRows(label, help, arr, get, set, addLabel) {
    const items = (arr || []).map((_, i) =>
      `<div class="subrow">${field(label + ' ' + (i + 1), { area: true, rows: 2 },
        () => get(i), (v) => set(i, v))}`
      + `<button class="subdel" title="Remove"><i class="fa-solid fa-xmark"></i></button></div>`).join('');
    return `<div class="subrows">`
      + (help ? `<p class="subrows-help">${esc(help)}</p>` : '')
      + items
      + `<button class="addrow sm"><i class="fa-solid fa-plus"></i> ${esc(addLabel)}</button></div>`;
  }

  const guidance = (summary, icon, body) =>
    `<details class="guide"><summary><i class="fa-solid ${icon}"></i> ${esc(summary)}</summary>`
    + `<div class="guide-body">${body}</div></details>`;

  /* A locked value the engine owns and the author reads but cannot set. */
  const readout = (k, v, note) =>
    `<div class="readout"><span class="rk">${esc(k)}</span><span class="rv">${esc(v)}</span>`
    + (note ? `<span class="rnote">${esc(note)}</span>` : '') + '</div>';

  const MODES = {
    coach_inquiry:  { label: 'Coach',    icon: 'fa-comments',       hint: 'The learner reasons it through with the coach. No scene.' },
    roleplay:       { label: 'Roleplay', icon: 'fa-masks-theater',  hint: 'The learner acts in a scene. The coach never interrupts mid-scene.' },
    observe_react:  { label: 'Observe',  icon: 'fa-eye',            hint: 'The learner studies an exhibit and is credited for what they spot.' },
  };
  const LEVELS = {
    unthoughtful: { title: 'Unthoughtful', hint: 'Misses the point, minimises, or actively goes wrong.' },
    neutral:      { title: 'Neutral',      hint: 'Well-intentioned and partly right; thin, or missing something important.' },
    strong:       { title: 'Strong',       hint: 'What an expert would recognise as handling it well.' },
  };

  const SW  = () => (C.scene_world = C.scene_world || {});
  const CAN = () => (SW().canon = SW().canon || {});
  const CL  = () => (C.closing = C.closing || {});
  const IR  = () => (CL().ideal_response = CL().ideal_response || {});

  /* ===================================================================== */
  /* Phase bodies                                                           */
  /* ===================================================================== */

  function phaseWorld() {
    let h = `<div class="card">
      <h2><i class="fa-solid fa-earth-americas"></i> The situation</h2>
      <p class="lead">What the learner is shown before anything starts, and the ground every scene stands on.</p>
      <div class="fields">
        ${field('The situation', { area: true, rows: 5,
          helper: 'Second person, present tense, addressed to the learner, ending at the moment the experience begins.' },
          () => C.narrative, (v) => { C.narrative = v; })}
        ${field('Scene setting (one line)', {
          helper: 'Where and when scenes take place. Rendered at the top of every scene prompt.' },
          () => SW().setting, (v) => { SW().setting = v; })}
      </div></div>`;

    // Canon facts
    const facts = CAN().facts || [];
    h += `<div class="card">
      <h2><i class="fa-solid fa-book"></i> Canon</h2>
      <p class="lead">Background truths every scene shares — asserted as true in all of them, always.</p>
      ${guidance('What belongs in canon — and what does not', 'fa-circle-info',
        '<p>Canon carries background truth the learner could already know — never plot, never answers.</p>'
        + '<ul><li>Happens later in the story → write it into the opener of the step where it happens.</li>'
        + '<li>Depends on how the learner played an earlier step → that is carryover, not canon.</li>'
        + '<li>A character would only reveal it once earned → put it on that character with a reveal condition.</li></ul>')}
      <div class="fields">
        ${rows('Canon facts', 'Background truths every scene shares.',
          facts.map((_, i) => rowCard('Fact ' + (i + 1),
            field('Background truth', { area: true, rows: 2 },
              () => (CAN().facts || [])[i], (v) => { CAN().facts[i] = v; }))).join(''),
          'Add canon fact')}
      </div></div>`;

    // Characters — the four-level case AI-05 is about
    const chars = SW().characters || [];
    h += `<div class="card">
      <h2><i class="fa-solid fa-users"></i> Characters</h2>
      <p class="lead">Everyone who can appear in a scene, coached or acted opposite.</p>
      <div class="fields">
        ${rows('Cast', 'Identity and disposition only — how a character reacts belongs in a step.',
          chars.map((ch, i) => {
            const B = () => (chars[i].behavior = chars[i].behavior || {});
            let inner =
              field('Name', {}, () => chars[i].name, (v) => { chars[i].name = v; })
              + readout('Reference id', chars[i].id || '—', 'derived')
              + field('Role', { helper: 'Who they are in this world.' },
                  () => chars[i].role, (v) => { chars[i].role = v; })
              + field('Baseline', { area: true, rows: 2, helper: 'Who they are when a scene opens.' },
                  () => B().baseline, (v) => { B().baseline = v; })
              + field('Driver', { area: true, rows: 2, helper: 'What their behavior responds to — the hinge the learner can move.' },
                  () => B().driver, (v) => { B().driver = v; })
              + subRows('Guardrail', 'A line this character never crosses, however the learner behaves.',
                  B().guardrails, (k) => (B().guardrails || [])[k], (k, v) => { B().guardrails[k] = v; },
                  'Add guardrail');
            const cf = chars[i].canon_facts || [];
            if (cf.length) {
              inner += `<div class="subrows"><p class="subrows-help">Facts this character holds, optionally gated on when they will part with them.</p>`
                + cf.map((_, k) => rowCard('Fact ' + (k + 1),
                    field('What they know', { area: true, rows: 2 },
                      () => (chars[i].canon_facts || [])[k].fact,
                      (v) => { chars[i].canon_facts[k].fact = v; })
                    + field('Reveal when (optional)', { area: true, rows: 2,
                        helper: 'The condition that earns it. Blank means they may say it freely.' },
                      () => (chars[i].canon_facts || [])[k].reveal_when,
                      (v) => { chars[i].canon_facts[k].reveal_when = v; }))).join('')
                + `<button class="addrow sm"><i class="fa-solid fa-plus"></i> Add known fact</button></div>`;
            } else {
              inner += `<div class="subrows"><button class="addrow sm"><i class="fa-solid fa-plus"></i> Add known fact</button></div>`;
            }
            return rowCard('Character ' + (i + 1), inner, chars[i].name || '');
          }).join(''),
          'Add character')}
      </div></div>`;

    // AI-10 — the coach, authored here rather than three phases later
    const tone = C.tone_guidelines || [];
    h += `<div class="card">
      <h2><i class="fa-solid fa-comment"></i> The coach</h2>
      <p class="lead">Who guides the learner, and how they sound. Universal coaching behavior is
        template-owned — this is only what is particular to this scenario.</p>
      ${guidance('Do not author universal coaching behavior', 'fa-circle-info',
        '<p>“Affirm before correcting”, “never invent facts” and similar are owned by the engine template. '
        + 'Re-authoring them here is rejected by review.</p>')}
      <div class="fields">
        ${field('Coach persona', { area: true, rows: 3,
          helper: 'This scenario’s register and expertise, as a phrase — e.g. “grounded in employment law”.' },
          () => C.coach_persona, (v) => { C.coach_persona = v; })}
        ${rows('Tone rules', 'Scenario-specific only. Each renders as a bullet in the coach prompt.',
          tone.map((_, i) => rowCard('Tone rule ' + (i + 1),
            field('Rule', { area: true, rows: 2 },
              () => (C.tone_guidelines || [])[i], (v) => { C.tone_guidelines[i] = v; }))).join(''),
          'Add tone rule')}
      </div></div>`;

    h += waveNote('AI-10', 'Coach voice moved here from its own phase.', [
      'Nothing in Teaching or Interaction feeds back into the coach’s voice — the dependency runs one way.',
      'The reference tool’s AI wizard already authors coach voice in its <b>first</b> task, beside the narrative, while its editor placed it fourth.',
      'Open question: the coach is arguably a member of the cast. Worth testing whether it should render as a character card rather than its own section.',
    ]);
    return h;
  }

  function phaseTeaching() {
    const tp = C.teaching_points || [];
    const mc = C.misconceptions || [];
    let h = `<div class="card">
      <h2><i class="fa-solid fa-graduation-cap"></i> Teaching points</h2>
      <p class="lead">What the learner must leave understanding, grouped by topic. Debrief-scoped: never shown mid-attempt.</p>
      ${guidance('Grouping is structure, not decoration', 'fa-layer-group',
        '<p>Each topic renders as a heading with its points beneath it in the coach prompt. '
        + 'Group by <b>subject</b>, not by phase.</p>')}
      <div class="fields">
        ${rows('Topics', tp.length + ' topics in this scenario.',
          tp.map((t, i) => rowCard('Topic ' + (i + 1),
            field('Topic', { helper: 'A subject heading, e.g. “The law”.' },
              () => (C.teaching_points || [])[i].topic, (v) => { C.teaching_points[i].topic = v; })
            + subRows('Point', 'A substantive thing the learner must leave understanding.',
              t.points, (k) => (C.teaching_points || [])[i].points[k],
              (k, v) => { C.teaching_points[i].points[k] = v; }, 'Add point'),
            (t.points || []).length + ' points')).join(''),
          'Add topic')}
      </div></div>`;

    h += `<div class="card">
      <h2><i class="fa-solid fa-circle-exclamation"></i> Misconceptions</h2>
      <p class="lead">The wrong beliefs worth correcting, and what replaces them.</p>
      <div class="fields">
        ${rows('Misconceptions', mc.length + ' authored.',
          mc.map((_, i) => rowCard('Misconception ' + (i + 1),
            field('The wrong belief', { area: true, rows: 2 },
              () => (C.misconceptions || [])[i].misconception,
              (v) => { C.misconceptions[i].misconception = v; })
            + field('The correction', { area: true, rows: 2 },
              () => (C.misconceptions || [])[i].redirect,
              (v) => { C.misconceptions[i].redirect = v; }))).join(''),
          'Add misconception')}
      </div></div>`;
    return h;
  }

  function phaseInteraction() {
    let h = '';

    // The optional opening exchange
    if (C.opening) {
      const O = () => (C.opening = C.opening || {});
      h += `<div class="card">
        <h2><i class="fa-solid fa-door-open"></i> Opening reflection <span class="stage">ENTER</span></h2>
        <p class="lead">One ungraded exchange before the phases. Optional — a scenario may open straight into its first practice.</p>
        <div class="fields">
          ${field('Name of the exchange', { helper: 'Learner-facing.' },
            () => O().label, (v) => { O().label = v; })}
          ${field('Purpose', { area: true, rows: 2, helper: 'Model-facing: what this exchange is for.' },
            () => O().purpose, (v) => { O().purpose = v; })}
          ${field('Composer placeholder', {},
            () => O().input_placeholder, (v) => { O().input_placeholder = v; })}
          ${(O().opening_messages || []).map((m, i) => field('Opening message ' + (i + 1),
            { area: true, rows: 2, helper: 'Locked — delivered verbatim, in order, with no model call.' },
            () => (O().opening_messages || [])[i].text,
            (v) => { O().opening_messages[i].text = v; })).join('')}
        </div></div>`;
    }

    // Every step, inline and expanded — the reference tool's own treatment
    (C.phases || []).forEach((ph, i) => {
      const P  = () => C.phases[i];
      const PR = () => (P().practice = P().practice || {});
      const EX = () => (PR().exit = PR().exit || {});
      const EW = () => (EX().when = EX().when || {});
      const TR = () => (PR().transition = PR().transition || {});
      const IN = () => (PR().interaction = PR().interaction || {});
      const DB = () => (P().debrief = P().debrief || {});
      const mode = MODES[PR().mode] || MODES.coach_inquiry;

      let body = '';

      // Mode selector — retypes the step
      body += '<div class="moderow">' + Object.keys(MODES).map((k) =>
        `<button class="modebtn${PR().mode === k ? ' is-on' : ''}" data-mode="${k}" data-step="${i}" title="${esc(MODES[k].hint)}">`
        + `<i class="fa-solid ${MODES[k].icon}"></i> ${esc(MODES[k].label)}</button>`).join('') + '</div>';

      body += field('Step name', { helper: 'Learner-facing. Use the source material’s own name.' },
        () => P().label, (v) => { P().label = v; });
      body += readout('Step id', P().id || '—', 'derived');
      body += field('Purpose of the step', { area: true, rows: 2,
        helper: 'Model-facing: this step’s role in the coach’s map of the arc. Not shown to the learner.' },
        () => P().purpose, (v) => { P().purpose = v; });

      body += guidance('The practice — where the learner acts', 'fa-hand-pointer',
        '<p>A practice always opens with <b>locked</b> content, because it asks the learner for something. '
        + 'It ends when the exit requirement is met <b>or</b> the turn budget runs out, whichever comes first.</p>');

      body += field('Practice name (optional)', { helper: 'Blank uses the step name.' },
        () => PR().label, (v) => { PR().label = v; });
      body += field('Purpose of the practice', { area: true, rows: 2, helper: 'Model-facing: the practice’s job.' },
        () => PR().purpose, (v) => { PR().purpose = v; });
      body += field('Turn budget', { helper: 'Learner turns before the practice must close.' },
        () => String(EW().turns == null ? '' : EW().turns), (v) => { EW().turns = parseInt(v, 10) || 1; });
      body += field('Exit requirement (optional)', { area: true, rows: 2,
        helper: 'What the learner must observably demonstrate to end this early.' },
        () => EW().requirement, (v) => { EW().requirement = v; });
      body += field('Final word (optional)', { area: true, rows: 2,
        helper: 'The locked closing line, delivered verbatim by either route. Author it as a statement, never a question.' },
        () => EX().final_word, (v) => { EX().final_word = v; });
      body += field('Button into the debrief', {},
        () => TR().button_label, (v) => { TR().button_label = v; });
      body += field('Handoff line (optional)', { area: true, rows: 2,
        helper: 'Appended as a locked line once the step advances.' },
        () => TR().text, (v) => { TR().text = v; });

      // Mode-specific interaction fields
      if (PR().mode === 'roleplay') {
        body += `<div class="subband">The scene</div>`;
        body += field('Scene setting', { area: true, rows: 2, helper: 'Where this scene takes place.' },
          () => IN().setting, (v) => { IN().setting = v; });
        const cast = (SW().characters || []).map((c2) => c2.name + ' (' + c2.id + ')').join(' · ');
        body += readout('Counterpart', IN().character_id || '—', cast ? 'cast: ' + cast : '');
        body += field('Emotion hint', { helper: 'How the counterpart carries themselves as the scene opens.' },
          () => IN().emotion_hint, (v) => { IN().emotion_hint = v; });
        body += field('Chat header name', {},
          () => IN().partner_label, (v) => { IN().partner_label = v; });
      }
      (IN().opening_messages || []).forEach((m, k) => {
        body += field('Opening message ' + (k + 1), { area: true, rows: 2,
          helper: k === 0 ? 'The coach’s locked opener, delivered verbatim in order.' : '' },
          () => (IN().opening_messages || [])[k].text, (v) => { IN().opening_messages[k].text = v; });
      });
      body += field('Composer placeholder', {},
        () => IN().input_placeholder, (v) => { IN().input_placeholder = v; });

      // Quality levels — the fixed, engine-owned set of three
      body += guidance('Quality levels — fixed at three', 'fa-gauge',
        '<p>The vocabulary is set by the engine, not the author: <b>unthoughtful</b>, <b>neutral</b>, <b>strong</b>. '
        + 'You write each level’s criteria. A level is never shown to the learner and never gates progress — '
        + 'it selects what happens next.</p>');
      const LV = () => (IN().levels = IN().levels || {});
      body += '<div class="rows">' + Object.keys(LEVELS).map((k) => {
        const L = () => (LV()[k] = LV()[k] || {});
        let inner = field('Look for', { area: true, rows: 3, helper: LEVELS[k].hint },
          () => L().look_for, (v) => { L().look_for = v; });
        inner += field('Response', { area: true, rows: 3,
          helper: PR().mode === 'roleplay'
            ? 'What the world or counterpart does. The character never coaches.'
            : 'Coach-voiced — a probe or acknowledgement at this level.' },
          () => L().response, (v) => { L().response = v; });
        if (PR().mode === 'roleplay') {
          inner += field('Progression', { area: true, rows: 2,
            helper: 'How far the scene gets and how it resolves at this level. Legal only on a roleplay step.' },
            () => L().progression, (v) => { L().progression = v; });
        }
        const E = () => (L().example = L().example || {});
        inner += field('Example — what the learner says', { area: true, rows: 2,
          helper: 'Optional. One short worked exchange calibrating the register.' },
          () => E().learner, (v) => { E().learner = v; });
        inner += field('Example — the reply', { area: true, rows: 2 },
          () => E().reply, (v) => { E().reply = v; });
        return `<div class="rowcard level"><div class="rowhead">${esc(LEVELS[k].title)}</div>${inner}</div>`;
      }).join('') + '</div>';

      // The debrief
      body += guidance('The debrief — where the coach teaches', 'fa-comment-dots',
        '<p>It reacts to the attempt, so it has <b>no locked opener</b>. Key points are delivered whether or not '
        + 'the learner got there. <b>Delivery-only is the default posture.</b></p>');
      body += field('Debrief name', { helper: 'Learner-facing.' },
        () => DB().label, (v) => { DB().label = v; });
      body += field('Purpose (optional)', { area: true, rows: 2 },
        () => DB().purpose, (v) => { DB().purpose = v; });
      body += field('Chat header name (optional)', { helper: 'Defaults to the coach label.' },
        () => DB().partner_label, (v) => { DB().partner_label = v; });
      body += subRows('Key point', 'Delivered whether or not the learner got there.',
        DB().key_points, (k) => (DB().key_points || [])[k],
        (k, v) => { DB().key_points[k] = v; }, 'Add key point');
      const DE = () => (DB().exit = DB().exit || {});
      const DW = () => (DE().when = DE().when || {});
      body += field('Follow-up turns', { helper: '0 means delivery-only: the debrief speaks and opens no composer.' },
        () => String(DW().turns == null ? '0' : DW().turns), (v) => { DW().turns = parseInt(v, 10) || 0; });
      body += field('Final word', { area: true, rows: 2,
        helper: 'The locked closing line, delivered verbatim when the debrief ends.' },
        () => DE().final_word, (v) => { DE().final_word = v; });

      h += `<div class="card step">
        <h2><i class="fa-solid ${mode.icon}"></i> Step ${i + 1} — ${esc(P().label || 'Untitled')}
          <span class="stage">${esc(mode.label)}</span></h2>
        <p class="lead">${esc(P().purpose || '')}</p>
        <div class="fields">${body}</div>
      </div>`;
    });

    h += `<button class="addrow big"><i class="fa-solid fa-plus"></i> Add step</button>`;
    h += waveNote('AI-08 · Waves 1–2', 'This is the density the redesign is about.', [
      'Every step renders fully expanded, one after another — ' + (C.phases || []).length
        + ' steps here, and each carries a mode, a practice spine, three quality levels and a debrief.',
      'Wave 1 types these inputs by register — setting vs. AI guidance vs. verbatim learner text (AI-06) — and groups the three quality levels as a real container (AI-07).',
      'Wave 2 gives each step a summary row and its own surface (AI-05); Wave 4 reworks how adding a step and moving between the arc and one step feels (AI-08).',
    ]);
    return h;
  }

  function phaseDebrief() {
    const groups = IR().component_groups || [];
    const refs   = IR().source_references || [];
    let h = `<div class="card">
      <h2><i class="fa-solid fa-flag-checkered"></i> Expert answer <span class="stage">CLOSE</span></h2>
      <p class="lead">The audit-defensible close. Shipped verbatim to every learner on every path.</p>
      ${guidance('External authorities only', 'fa-scale-balanced',
        '<p><b>Source references</b> take a regulation or standard (an OSHA clause, Title VII) — '
        + 'never an internal course or slide id, which means nothing outside the course.</p>')}
      <div class="fields">
        ${field('Summation', { area: true, rows: 5,
          helper: 'The expert answer in one paragraph. Shipped verbatim, on every path.' },
          () => IR().summary, (v) => { IR().summary = v; })}
        ${field('Display name on the closing screen', { helper: 'Optional.' },
          () => CL().partner_label, (v) => { CL().partner_label = v; })}
      </div></div>`;

    h += `<div class="card">
      <h2><i class="fa-solid fa-list-check"></i> Component groups</h2>
      <p class="lead">The parts of the expert answer, grouped as the source material groups them.</p>
      <div class="fields">
        ${rows('Groups', groups.length + ' groups · '
            + groups.reduce((n, g) => n + ((g.components || []).length), 0) + ' components.',
          groups.map((g, i) => rowCard('Group ' + (i + 1),
            field('Group title', { helper: 'Optional.' },
              () => (IR().component_groups || [])[i].title,
              (v) => { IR().component_groups[i].title = v; })
            + subRows('Component', 'One part of the expert answer.',
              g.components, (k) => (IR().component_groups || [])[i].components[k],
              (k, v) => { IR().component_groups[i].components[k] = v; }, 'Add component'),
            (g.components || []).length + ' parts')).join(''),
          'Add group')}
      </div></div>`;

    h += `<div class="card">
      <h2><i class="fa-solid fa-scale-balanced"></i> Source references</h2>
      <p class="lead">External authorities the close rests on.</p>
      <div class="fields">
        ${rows('References', refs.length ? refs.length + ' authored.' : 'None authored yet.',
          refs.map((_, i) => rowCard('Reference ' + (i + 1),
            field('External authority', {
              helper: 'A regulation, standard or statute — e.g. “29 CFR 1910.1200” or “Title VII”.' },
              () => (IR().source_references || [])[i],
              (v) => { IR().source_references[i] = v; }))).join(''),
          'Add reference')}
      </div></div>`;

    h += waveNote('AI-11', 'This is the strongest case for a review mode.', [
      'Production documents reach <b>37 groups and 98 components</b> here, all expanded inline.',
      'A one-line citation gets the same full-width card as a multi-part group, though they hold completely different things (AI-07).',
      'The expert answer is <i>audit-defensible</i> and shipped verbatim — it is read by SMEs and compliance far more often than it is typed.',
    ]);
    return h;
  }

  const waveNote = (tag, title, lines) =>
    `<div class="wavenote"><i class="fa-solid fa-flask"></i><div>`
    + `<span class="tag">${esc(tag)}</span><b>${esc(title)}</b>`
    + `<ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul></div></div>`;

  function renderPhase() {
    const p = PHASES[active];
    const inner = $('#surfaceInner');
    BINDINGS.length = 0;
    _rid = 0;

    let h = `<div class="phase-head">
        <p class="phase-eyebrow">${esc(p.eyebrow)}</p>
        <h1><span class="pbadge">${active + 1}</span> ${esc(p.title)}</h1>
        <p>${esc(p.sub)}</p>
      </div>`;

    if (p.id === 'world')       h += phaseWorld();
    if (p.id === 'teaching')    h += phaseTeaching();
    if (p.id === 'interaction') h += phaseInteraction();
    if (p.id === 'debrief')     h += phaseDebrief();

    h += `<div class="phase-foot">
        <button class="pf-btn" id="pfBack" ${active === 0 ? 'disabled' : ''}>
          <i class="fa-solid fa-arrow-left"></i> Back</button>
        <span style="flex:1 1 auto"></span>
        <button class="pf-btn next" id="pfNext">${
          active < PHASES.length - 1
            ? 'Next: ' + esc(PHASES[active + 1].title) + ' <i class="fa-solid fa-arrow-right"></i>'
            : '<i class="fa-solid fa-play"></i> Preview as learner'
        }</button>
      </div>`;

    inner.innerHTML = h;
    bindAll();

    const back = $('#pfBack'), next = $('#pfNext');
    if (back) back.addEventListener('click', () => setPhase(active - 1));
    if (next) next.addEventListener('click', () => {
      if (active < PHASES.length - 1) setPhase(active + 1);
      else toast('Preview is out of scope for this wave');
    });

    // Retyping a step swaps which interaction shape is authored.
    $$('.modebtn', inner).forEach((b) => b.addEventListener('click', () => {
      const s = Number(b.dataset.step);
      C.phases[s].practice.mode = b.dataset.mode;
      renderPhase();
      toast('Step retyped — ' + MODES[b.dataset.mode].label);
    }));

    // List affordances are present but inert this wave: adding and removing is
    // what Wave 2 redesigns, and a half-built version would prejudge it.
    $$('.addrow, .rowdel, .subdel', inner).forEach((b) =>
      b.addEventListener('click', () => toast('Add / remove is redesigned in Wave 2 (AI-05)')));
  }

  /* Vaadin fields take their value as a property, and their events differ by
     component, so both are wired. Bindings are re-applied after every paint
     because the whole surface is rebuilt rather than patched. */
  function bindAll() {
    BINDINGS.forEach((b) => {
      const el = document.getElementById(b.id);
      if (!el) return;
      el.value = String(b.get() == null ? '' : b.get());
      const on = () => b.set(el.value);
      el.addEventListener('input', on);
      el.addEventListener('value-changed', on);
    });
  }

  /* ===================================================================== */
  /* Settings drawer — what Start used to be (AI-01 · AI-02 · AI-03 · AI-04) */
  /* ===================================================================== */

  function renderSettings() {
    const body = $('#drawerBody');
    if (!body) return;

    body.innerHTML = `
      <div class="card">
        <h2><i class="fa-solid fa-id-card"></i> Identity</h2>
        <p class="lead">What this scenario is called, and how the production engine addresses it.</p>
        <div class="fields">
          <vaadin-text-field theme="outlined" label="Scenario title" id="sTitle"
            helper-text="Also editable from the header, at any time."></vaadin-text-field>
          <div class="readout">
            <span class="rk">Implementation id</span>
            <span class="rv" id="sId"></span>
            <span class="rnote">derived</span>
          </div>
          <div class="readout">
            <span class="rk">Format</span>
            <span class="rv">Scenario CML v4 · ai-conversational</span>
            <span class="rnote">set at creation</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2><i class="fa-solid fa-diagram-predecessor"></i> Preceding content</h2>
        <p class="lead">The learner arrives from something else. Decide whether the coach takes it into account.</p>
        <div class="fields">
          <div class="opt-set">
            <label class="opt ${contextMode === 'use' ? 'is-on' : ''}">
              <input type="radio" name="ctx" value="use" ${contextMode === 'use' ? 'checked' : ''}>
              <span class="opt-txt">
                <span class="opt-name">Build on what came before</span>
                <span class="opt-desc">The coach knows what the learner already saw and will not re-teach it.</span>
              </span>
            </label>
            <label class="opt ${contextMode === 'ignore' ? 'is-on' : ''}">
              <input type="radio" name="ctx" value="ignore" ${contextMode === 'ignore' ? 'checked' : ''}>
              <span class="opt-txt">
                <span class="opt-name">Start fresh</span>
                <span class="opt-desc">Treat the learner as arriving cold, whatever ran before this.</span>
              </span>
            </label>
          </div>

          <div class="resolved ${contextMode === 'use' ? '' : 'is-off'}" id="resolved">
            <div class="resolved-head">
              <i class="fa-solid fa-link"></i> What precedes this scenario
              <span class="auto">from the course</span>
            </div>
            <div class="resolved-body">
              <span class="rl">Preceding object</span>
              ${esc(upstream.title)} — ${esc(upstream.kind)}
              <span class="rl">What it covered</span>
              ${esc(upstream.covered)}
              <span class="rl">Where it leaves them</span>
              ${esc(upstream.handoff)}
            </div>
          </div>

          <div class="stub"><i class="fa-solid fa-circle-info"></i><div>
            <span class="tag">AI-01</span><b>This was three prose fields the author wrote by hand.</b>
            <ul class="stub-list">
              <li>The reference tool already admits the endgame in its own help text — <i>“in production this is pulled in automatically.”</i></li>
              <li>Once the authoring tool owns the preceding content, the only thing left is the decision, so that is all this asks for.</li>
              <li>Reaches the coach only. Nothing here is shown to the learner.</li>
            </ul></div></div>
        </div>
      </div>

      <div class="stub"><i class="fa-solid fa-scissors"></i><div>
        <span class="tag">AI-03</span><b>The landing button label is gone.</b>
        <ul class="stub-list">
          <li>It was an optional free-text field whose blank value already fell back to the player default.</li>
          <li>Same reasoning the team used when five id fields were removed: not a decision an author makes.</li>
          <li>Open question for the LXD team — does anyone actually customize it?</li>
        </ul></div></div>`;

    const sT = $('#sTitle');
    if (sT) {
      sT.value = String(C.title || '');
      const onT = () => {
        C.title = sT.value;
        renderTitle();
        const e2 = $('#sId'); if (e2) e2.textContent = derivedId();
      };
      sT.addEventListener('input', onT);
      sT.addEventListener('value-changed', onT);
    }
    const idEl = $('#sId'); if (idEl) idEl.textContent = derivedId();

    $$('input[name="ctx"]', body).forEach((r) => r.addEventListener('change', () => {
      contextMode = r.value;
      renderSettings();
      toast(contextMode === 'use'
        ? 'The coach will build on the preceding content'
        : 'The coach will treat the learner as arriving cold');
    }));
  }

  const openDrawer  = () => { renderSettings(); $('#drawer').classList.add('is-open'); $('#drawerScrim').classList.add('is-open'); };
  const closeDrawer = () => { $('#drawer').classList.remove('is-open'); $('#drawerScrim').classList.remove('is-open'); };

  /* ===================================================================== */

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  /* ---- boot -------------------------------------------------------------- */
  renderTitle();
  initTitle();
  renderRail();
  renderPhase();
  renderValidity();
  renderSettings();

  $('#validityBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const pop = $('#vpop');
    const open = pop.classList.toggle('is-open');
    $('#validityBtn').classList.toggle('is-open', open);
  });
  document.addEventListener('click', (e) => {
    if (!$('#vpop').contains(e.target) && e.target !== $('#validityBtn')) closeVpop();
  });
  $('#vpop').addEventListener('click', (e) => e.stopPropagation());

  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#drawerScrim').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeDrawer(); closeVpop(); }
  });

  // Affordances this wave deliberately does not build.
  [['#btnComments', 'Comments are out of scope for this wave'],
   ['#btnHelp', 'Support Center is out of scope for this wave'],
   ['#btnMore', 'Overflow menu — where the compiled prompt now lives (AI-12)'],
   ['#btnPreview', 'Preview is out of scope for this wave']]
    .forEach(([sel, msg]) => { const el = $(sel); if (el) el.addEventListener('click', () => toast(msg)); });

  $('#wavebarBtn').addEventListener('click', () => {
    openDrawer();
    toast('Start dissolved into these settings — AI-04');
  });
})();
