/* ============================================================================
   app.js — Scenario Editor, Wave 3 design prototype · V2 (collection panel)
   ----------------------------------------------------------------------------
   Renders four phases, a document-settings drawer and a chrome-level validation
   affordance over one hardcoded scenario document.

   V2 SPLITS THE PHASE. V1 renders a phase as one long form with every list
   member expanded inline. Here the phase's COLLECTIONS are panel cards and the
   content area holds one member at a time. The phase model below is what
   changed: each phase declares GROUPS, a group declares MEMBERS, and a member
   knows how to summarise itself (for its card) and how to render (for the
   content area). The shell reads only that — it holds no per-phase branches,
   the same discipline the reference tool's own shell keeps.

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
  /* Clicking the ACTIVE phase icon a second time collapses the panel — the
     same gesture objectManager's rail uses. Kept as state rather than a class
     read off the DOM so the rail can show which icons are in which mode. */
  let panelOpen = true;

  /* ---- authored lints ----------------------------------------------------
     Shaped like the reference tool's output ({severity, phase, msg, where}) so
     the affordances built against it stay honest, but authored rather than
     computed. `cleared` lets the Wave-4 question — what does reaching valid
     feel like? — be demonstrated on demand. */
  const LINTS = [
    { severity: 'err',  phase: 'interaction', member: 'step:2',
      msg: 'Step 3 has no exit requirement',
      where: 'Interaction · Step 3', cleared: false },
    { severity: 'warn', phase: 'world', member: 'char:0',
      msg: 'Jake has no reveal condition on his known fact',
      where: 'Situation & World · Jake', cleared: false },
    { severity: 'warn', phase: 'debrief', member: 'refs',
      msg: 'No source references on the expert answer',
      where: 'Debrief & Close · Source references', cleared: false },
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
        + '</div>';
    } else {
      h += live.map((l, i) =>
        `<div class="lint ${l.severity}" data-lint="${i}" role="button" tabindex="0">
           <i class="fa-solid ${l.severity === 'err' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}"></i>
           <div><div class="msg">${esc(l.msg)}</div><div class="where">${esc(l.where)}</div></div>
         </div>`).join('');
    }
    pop.innerHTML = h;

    // A lint navigates to the phase it belongs to.
    $$('[data-lint]', pop).forEach((n) => n.addEventListener('click', () => {
      const l = live[Number(n.dataset.lint)];
      const idx = PHASES.findIndex((p) => p.id === l.phase);
      if (idx >= 0) {
        /* A lint opens the MEMBER it belongs to, not just the phase — landing on
           the overview would leave the author to find which card it meant. */
        if (l.member) openMember[l.phase] = l.member;
        setPhase(idx);
      }
      closeVpop();
    }));

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
      b.className = 'rail-btn' + (i === active ? ' is-active' : '')
        + (i === active && !panelOpen ? ' is-collapsed' : '');
      b.innerHTML =
        `<span class="rail-num">${i + 1}</span>`
        + `<i class="fa-solid ${p.icon}"></i>`
        + `<span class="rail-dot ${worst ? worst.severity : 'ok'}"></span>`
        + (i === active && !panelOpen
            ? '<i class="fa-solid fa-chevron-right rail-chev" aria-hidden="true"></i>' : '')
        + `<span class="rail-tip">${esc(p.title)}`
        + (i === active ? (panelOpen ? ' — click to collapse' : ' — click to expand') : '')
        + `</span>`;
      /* Re-clicking the phase you are already on collapses the panel; clicking
         a different phase always opens it. */
      b.addEventListener('click', () => {
        if (i === active) { setPanelOpen(!panelOpen); return; }
        panelOpen = true;
        setPhase(i);
      });
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

  function setPanelOpen(open) {
    panelOpen = open;
    const panel = $('#panel');
    if (panel) panel.classList.toggle('is-collapsed', !open);
    renderRail();
  }

  function setPhase(i) {
    active = i;
    renderRail();
    renderPanel();
    renderContent();
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

  /* ---- REGISTER ----------------------------------------------------------
     What KIND of thing a field holds. Three, and the difference is not
     cosmetic — it decides how the field is written:

       setting    a configuration value the engine reads.          "2", "Continue"
       guidance   instruction to the model; the learner never      "Look for", "Purpose"
                  sees it, and it is paraphrased, not quoted.
       verbatim   shipped word-for-word to the learner. Authoring  "Final word",
                  rules attach to it ("a statement, never a         opening messages
                  question") precisely because it ships as typed.

     The reference editor declares this too — but only in prose, inside helper
     text, in four different phrasings, while every field renders identically.
     So an author has to READ to learn what a field is. It is declared here
     instead, and it cannot be derived: the compiler's own `highlightStrings`
     lumps guidance and verbatim into one list, because it only cares whether
     the author wrote the string, not what kind of string it is.

     The marking matches the rehearsal panel's, deliberately — a turn marked
     verbatim there comes from a field marked verbatim here. */
  const REGISTER = {
    setting:  { label: 'Setting',  title: 'A configuration value the engine reads. Not prose.' },
    guidance: { label: 'Guidance', title: 'Instruction to the AI. The learner never sees this text.' },
    verbatim: { label: 'Verbatim', title: 'Shipped to the learner word-for-word, exactly as typed.' },
  };

  function field(label, opts, get, set) {
    const id = rid();
    const o = opts || {};
    const tag = o.area ? 'vaadin-text-area' : 'vaadin-text-field';
    BINDINGS.push({ id, get, set });
    const inner = `<${tag} theme="outlined" id="${id}" label="${esc(label)}"`
      + (o.helper ? ` helper-text="${esc(o.helper)}"` : '')
      + (o.area ? ` min-rows="${o.rows || 2}"` : '')
      + (o.readonly ? ' readonly' : '')
      + `></${tag}>`;
    const r = o.reg && REGISTER[o.reg] ? o.reg : null;
    if (!r) return inner;
    return `<div class="fw reg-${r}">
        <span class="fw-tag" title="${esc(REGISTER[r].title)}">${esc(REGISTER[r].label)}</span>
        ${inner}
      </div>`;
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
  /* A real compartment, not a label. `.subband` was a small caption with a hair
     rule above it — enough to name a group, not enough to bound one, so a long
     step read as one undifferentiated scroll. A section OPENS and CLOSES, and
     sits on its own ground, so the eye can find the edges while scrolling. */
  const sec = (title, icon, note) =>
    `<section class="fsec"><div class="fsec-head">`
    + (icon ? `<i class="fa-solid ${icon}"></i>` : '')
    + `<span class="fsec-title">${esc(title)}</span>`
    + (note ? `<span class="fsec-note">${esc(note)}</span>` : '')
    + `</div><div class="fsec-body">`;
  const secEnd = '</div></section>';

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


  /* The three levels side by side. They STACK in the form — a three-column
     layout does not fit a column with a panel on either side of it — so the
     comparison gets its own full width when it is the actual question, which
     is whenever an author is calibrating strong against unthoughtful. */
  function openCompare(i) {
    const pr = obj(obj((C.phases || [])[i]).practice);
    const LV = obj(obj(pr.interaction).levels);
    const roleplay = pr.mode === 'roleplay';
    const ROWS = [['look_for', 'Look for'], ['response', 'Response']]
      .concat(roleplay ? [['progression', 'Progression']] : [])
      .concat([['example.learner', 'Example — learner'], ['example.reply', 'Example — reply']]);

    const read = (L, path) => path.split('.').reduce((a, k) => obj(a)[k], L);

    const el = document.createElement('div');
    el.className = 'cmp-scrim';
    el.innerHTML = `<div class="cmp-modal" role="dialog" aria-modal="true" aria-label="Compare quality levels">
        <div class="cmp-head">
          <h2>Quality levels</h2>
          <span class="cmp-sub">${esc(str(obj((C.phases || [])[i]).label) || 'Step ' + (i + 1))}</span>
          <button class="cmp-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="cmp-body"><div class="cmp-grid">
          ${Object.keys(LEVELS).map((k) => `<div class="cmp-col ${k}">
            <div class="cmp-col-head">${esc(LEVELS[k].title)}</div>
            ${ROWS.map(([path, label]) => {
              const v = str(read(obj(LV[k]), path)).trim();
              return `<div class="cmp-field"><span class="cmp-k">${esc(label)}</span>
                <div class="cmp-v${v ? '' : ' is-empty'}">${esc(v || 'Not authored')}</div></div>`;
            }).join('')}
          </div>`).join('')}
        </div></div>
      </div>`;
    document.body.appendChild(el);
    const close = () => el.remove();
    $('.cmp-close', el).addEventListener('click', close);
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    const esc2 = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc2); } };
    document.addEventListener('keydown', esc2);
  }

  /* =====================================================================
     REHEARSAL — the step preview
     ---------------------------------------------------------------------
     A scenario's artifact is a conversation that has not happened yet. There
     is no frame to look at, so rendering "the conversation" would mean drawing
     ONE fabricated path and presenting it as the artifact — confidently wrong
     in a way a form at least is not.

     What can honestly be shown is two different things at once, and the
     surface marks which is which on every turn:

       VERBATIM    opening messages, the final word, the handoff, the debrief's
                   key points. Authored text, shipped literally. Rendering it
                   is exact — this is a true preview.
       GENERATED   the coach's reply to a learner turn. Produced from the
                   level's `response` guidance, so it is SIMULATED here.

     And because generated output is probabilistic, ONE DRAW PROVES NOTHING.
     A guideline that reads well can still produce replies that wander. So a
     generated turn rerolls, and the spread across draws is the thing being
     judged rather than any single sample.

     Adapted from the rehearsal surface worked out in the Studio-AI-Platform
     prototype, including its "keep as example" gesture: a roll worth having
     is pinned back into the level's own `example.reply`, which makes rehearsal
     an authoring act rather than a viewer.

     SIMULATED, NOT LIVE. No model is called. Replies are composed from the
     authored guidance with varying framing, which demonstrates the mechanic
     and makes the three levels concrete — it does not evaluate the author's
     criteria. The surface says so rather than letting the chat imply it. */

  let reh = { step: null, mode: 'play', turns: [], rolls: 0 };
  /* Which quality level is open, per step. Remembered so moving away and back
     does not reset the author to Unthoughtful every time. */
  const openLevel = {};
  const REH_HINT = {
    read: 'Verbatim content only — no generation. The fastest way to check what the learner actually reads.',
    calibrate: 'Send an answer and see which level catches it. If it lands on the wrong one, the look-for is what to fix.',
    play: 'Free conversation. Reroll any coach turn to see the spread a guideline produces.',
  };

  const obj = (x) => (x && typeof x === 'object') ? x : {};
  const str = (x) => (x == null ? '' : String(x));
  const levelsOf = (pr) => Object.keys(LEVELS)
    .filter((k) => obj(obj(obj(pr).interaction).levels)[k]);

  /* Which level catches an answer. Scores the distinctive words of each
     level's look-for — crude on purpose: the point is that the AUTHORED text
     decides, so a look-for that catches the wrong answer is visibly the
     author's to fix. */
  function classifyAnswer(pr, text) {
    const t = String(text || '').toLowerCase();
    const LV = obj(obj(pr.interaction).levels);
    const keyed = levelsOf(pr).map((k) => {
      const lf = String(obj(LV[k]).look_for || '').toLowerCase();
      const words = lf.split(/[^a-z]+/).filter((w) => w.length > 4);
      return { k, hits: words.filter((w) => t.includes(w.slice(0, 6))).length };
    });
    const best = keyed.reduce((a, b) => (b.hits > a.hits ? b : a), keyed[0] || { k: null, hits: 0 });
    if (best && best.hits > 0) return best.k;
    // Nothing matched — the lowest calibrated level is the honest default.
    return levelsOf(pr)[0] || null;
  }

  /* One draw. Roll 0 shows the author's pinned example when there is one,
     because that is their own preferred reply; later draws vary the framing
     around the authored response so the SPREAD is visible. */
  function rollReply(pr, level, n) {
    const L = obj(obj(obj(pr.interaction).levels)[level]);
    const ex = String(obj(L.example).reply || '').trim();
    const guide = String(L.response || '').replace(/\s+/g, ' ').trim();
    if (!ex && !guide) return '(no response authored for this level)';

    /* Roll 0 is the author's own pinned example — their preferred reply, shown
       exactly. Later draws stand in for the model's variation around it.

       The authored `example.reply` is real coach DIALOGUE, which is what makes
       a plausible simulation possible at all; `response` is model-facing
       GUIDANCE ("acknowledge that they already have the analysis"), so echoing
       it as speech would have the coach reciting its own instructions. Draws
       therefore vary the EXAMPLE, and fall back to a marked paraphrase of the
       guidance only when no example exists.

       What varies is framing, not substance — which is the honest shape of the
       thing being judged. A guideline that produces the same substance in five
       different wrappers is consistent; the spread is what the author reads. */
    if (!ex) return '[no example authored — the coach would ' + lower(guide.replace(/[.]$/, '')) + ']';

    if (n === 0) return ex;

    const sentences = ex.split(/(?<=[.?!])\s+/).filter(Boolean);
    const head = sentences[0] || ex;
    const rest = sentences.slice(1).join(' ');
    const variants = [
      // Reordered: lead with the question, then the substance.
      () => (rest ? rest + ' ' + head : head),
      // Tightened: the first beat alone.
      () => head,
      // Softened opener, same substance.
      () => 'Okay — ' + lower(head) + (rest ? ' ' + rest : ''),
      // Handed back to the learner. Only when the example does not already end
      // in a question — appending one to a question reads as a stutter.
      () => (/[?]\s*$/.test(ex) ? ex + ' Take your time.'
                                : ex.replace(/[.!]\s*$/, '') + '. What makes you say that?'),
      // Front-loaded acknowledgement.
      () => 'That is worth sitting with. ' + ex,
    ];
    return variants[(n - 1) % variants.length]();
  }
  const lower = (s2) => String(s2).charAt(0).toLowerCase() + String(s2).slice(1);

  function turnHTML(t) {
    const foot = [];
    if (t.level) {
      /* Clickable: the reply came FROM this level's calibration, and with the
         levels collapsed into tabs that calibration may be two tabs away. If a
         draw reads wrong, the field that produced it is one click off. */
      foot.push(`<button class="rt-lvl ${esc(t.level)}" data-jumplvl="${esc(t.level)}"
        title="Open the ${esc(LEVELS[t.level].title)} calibration">${esc(LEVELS[t.level].title)}</button>`);
    }
    if (t.rollable) {
      foot.push('<button class="rt-act" data-reroll="1"><i class="fa-solid fa-dice"></i> Reroll</button>');
      foot.push(`<button class="rt-act${t.kept ? ' is-kept' : ''}" data-keep="1">`
        + `<i class="fa-solid fa-thumbtack"></i>${t.kept ? 'Pinned' : 'Keep as example'}</button>`);
      if (reh.rolls > 0) foot.push(`<span class="rt-draw">draw ${reh.rolls + 1}</span>`);
    }
    if (t.kind === 'verbatim') foot.push('<span class="rt-kind verbatim">verbatim</span>');
    if (t.kind === 'generated') foot.push('<span class="rt-kind generated">simulated</span>');
    return `<div class="rt ${t.side}">
        <div class="rt-inner">
          <div class="rt-who">${esc(t.who)}</div>
          <div class="rt-bubble ${esc(t.kind || '')}">${esc(t.text)}</div>
          ${foot.length ? `<div class="rt-foot">${foot.join('')}</div>` : ''}
        </div>
      </div>`;
  }

  function renderTurns(i) {
    const ph = obj((C.phases || [])[i]);
    const pr = obj(ph.practice);
    const IN = obj(pr.interaction);
    const out = [];

    // The locked opening — exact, because this text ships literally.
    (IN.opening_messages || []).forEach((m) => {
      const who = m.character_id
        ? (obj((SW().characters || []).find((c2) => c2.id === m.character_id)).name || m.character_id)
        : (IN.partner_label || 'Coach');
      out.push(turnHTML({ who, side: 'coach', kind: 'verbatim', text: m.text }));
    });

    reh.turns.forEach((t) => out.push(turnHTML(t)));

    if (reh.mode === 'read') {
      // Read mode skips generation entirely and shows what else is guaranteed.
      if (obj(pr.exit).final_word) {
        out.push(turnHTML({ who: 'Coach · final word', side: 'coach', kind: 'verbatim',
          text: obj(pr.exit).final_word }));
      }
      const db = obj(ph.debrief);
      (db.key_points || []).forEach((kp) => out.push(turnHTML({
        who: 'Coach · key point', side: 'coach', kind: 'verbatim', text: kp })));
      if (obj(db.exit).final_word) {
        out.push(turnHTML({ who: 'Coach · final word', side: 'coach', kind: 'verbatim',
          text: obj(db.exit).final_word }));
      }
    }
    return out.join('');
  }

  function rehearsalHTML(i) {
    const ph = obj((C.phases || [])[i]);
    const pr = obj(ph.practice);
    const turns = obj(obj(pr.exit).when).turns;
    return `<div class="reh" id="reh">
        <div class="reh-bar">
          <span class="reh-title">Rehearsal</span>
          <span class="reh-modes">
            ${['read', 'calibrate', 'play'].map((k) =>
              `<button class="reh-mode${reh.mode === k ? ' is-on' : ''}" data-rmode="${k}">`
              + k.charAt(0).toUpperCase() + k.slice(1) + '</button>').join('')}
          </span>
          <button class="reh-reset" data-rreset="1" title="Restart"><i class="fa-solid fa-rotate-left"></i></button>
        </div>
        <p class="reh-hint">${esc(REH_HINT[reh.mode])}</p>
        <p class="reh-sim"><i class="fa-solid fa-flask"></i>
          Verbatim turns are exact. Generated turns are <b>simulated from your guidance</b>,
          not produced by the model — reroll to see the spread, not to test the model itself.</p>
        <div class="reh-scroll" id="rehScroll">${renderTurns(i)}</div>
        ${reh.mode === 'read' ? '' : `
          <div class="reh-foot">
            <div class="reh-input">
              <input class="reh-box" id="rehBox" placeholder="Answer as the learner…" />
              <button class="reh-send" id="rehSend"><i class="fa-solid fa-paper-plane"></i> Send</button>
            </div>
            ${reh.mode === 'calibrate' ? `<div class="reh-try">
              <span class="reh-try-lbl">Try an answer that should land:</span>
              ${levelsOf(pr).map((k) =>
                `<button class="reh-try-btn ${k}" data-try="${k}">${LEVELS[k].title}</button>`).join('')}
            </div>` : ''}
          </div>`}
        <p class="reh-exits">Exits after ${esc(String(turns == null ? '—' : turns))} learner turns,
          or when the exit requirement is met.</p>
      </div>`;
  }

  /* Show the rehearsal for the open member, or hide the panel when the member
     has nothing to rehearse. Called on every content render. */
  function renderRehPanel() {
    const panel = $('#rehPanel');
    const body = $('#rehPanelBody');
    if (!panel || !body) return;

    const phase = PHASES[active];
    const mid = openMember[phase.id];
    const isStep = phase.id === 'interaction' && /^step:/.test(String(mid));

    if (!isStep) { panel.hidden = true; body.innerHTML = ''; return; }

    const i = Number(String(mid).split(':')[1]);
    // A transcript belongs to the step that produced it.
    if (reh.step !== i) { reh.step = i; reh.turns = []; reh.rolls = 0; }
    panel.hidden = false;
    body.innerHTML = rehearsalHTML(i);
    bindRehearsal(body, i);
  }

  function bindRehearsal(root, i) {
    const ph = obj((C.phases || [])[i]);
    const pr = obj(ph.practice);

    const repaint = () => {
      const body = $('#rehPanelBody');
      if (!body) return;
      body.innerHTML = rehearsalHTML(i);
      bindRehearsal(body, i);
      const sc = $('#rehScroll', body);
      if (sc) sc.scrollTop = sc.scrollHeight;
    };

    const answer = (text) => {
      if (!String(text || '').trim()) return;
      const level = classifyAnswer(pr, text);
      reh.turns.push({ who: 'Learner', side: 'learner', kind: '', text });
      reh.rolls = 0;
      reh.turns.push({ who: obj(pr.interaction).partner_label || 'Coach', side: 'coach',
        kind: 'generated', level, rollable: true, kept: false,
        text: rollReply(pr, level, 0) });
      repaint();
    };

    $$('[data-jumplvl]', root).forEach((el) => el.addEventListener('click', () => {
      openLevel[i] = el.dataset.jumplvl;
      renderContent();
      const t = $('.lvl-tab.is-on');
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));

    const box = $('#rehBox', root), send = $('#rehSend', root);
    if (send && box) send.addEventListener('click', () => { answer(box.value); box.value = ''; });
    if (box) box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); answer(box.value); box.value = ''; }
    });

    /* Send the answer the author's own example says should land on a level —
       the fastest check that a calibration catches what it should. */
    $$('[data-try]', root).forEach((el) => el.addEventListener('click', () => {
      const k = el.dataset.try;
      const L = obj(obj(obj(pr.interaction).levels)[k]);
      answer(obj(L.example).learner || `(an answer that should read as ${LEVELS[k].title.toLowerCase()})`);
    }));

    $$('[data-rmode]', root).forEach((el) => el.addEventListener('click', () => {
      reh.mode = el.dataset.rmode;
      reh.turns = []; reh.rolls = 0;     // the transcript was produced under the old mode
      repaint();
    }));
    const rst = $('[data-rreset]', root);
    if (rst) rst.addEventListener('click', () => {
      reh.turns = []; reh.rolls = 0; repaint();
    });

    /* Reroll — the whole point. One draw of a probabilistic output proves
       nothing, so what is shown is the spread rather than a lucky sample. */
    const rr = $('[data-reroll]', root);
    if (rr) rr.addEventListener('click', () => {
      const last = reh.turns[reh.turns.length - 1];
      if (!last || last.side !== 'coach') return;
      reh.rolls++;
      last.text = rollReply(pr, last.level, reh.rolls);
      last.kept = false;
      repaint();
    });

    /* Keep — a roll worth having is pinned into the level's own `example`,
       so rehearsal writes back into the document rather than being a viewer. */
    const kp = $('[data-keep]', root);
    if (kp) kp.addEventListener('click', () => {
      const last = reh.turns[reh.turns.length - 1];
      const learner = reh.turns[reh.turns.length - 2];
      if (!last || !last.level) return;
      const LV = (obj(pr.interaction).levels = obj(obj(pr.interaction).levels));
      const L = (LV[last.level] = obj(LV[last.level]));
      L.example = obj(L.example);
      L.example.reply = last.text;
      if (learner && learner.side === 'learner') L.example.learner = learner.text;
      last.kept = true;
      renderContent();
      toast('Pinned into the ' + LEVELS[last.level].title + ' example');
    });
  }

  /* =====================================================================
     THE PANEL MODEL
     ---------------------------------------------------------------------
     A phase is GROUPS; a group is MEMBERS; a member summarises itself for its
     card and renders itself into the content area. Everything the panel shows
     comes from here, so adding a collection is a data change, not a branch.

     Two rules this encodes, both from the evaluation:

     1. EVERY MEMBER IS A NAMED THING. There is no "details" or "misc" entry.
        The scenario's central prose (the situation, the expert answer) is a
        first-class member with its own name, because filing it under the least
        specific label in the list is how it stops being read.
     2. A GROUP MAY BE A SINGLETON. "The coach" is one member, not a list —
        it earns its own group rather than being folded in beside the world,
        which is the distinction AI-10 exists to make.
     ===================================================================== */

  const one = (id, name, icon, sub, render, meta) =>
    ({ id, name, icon, sub, render, meta, single: true });

  function groupsFor(phaseId) {
    if (phaseId === 'world') {
      const chars = SW().characters || [];
      return [
        { label: 'The world', desc: 'What the learner is shown before anything starts, and the ground every scene stands on.', members: [
          one('situation', 'The situation', 'fa-earth-americas',
            () => C.narrative, () => memberSituation(),
            () => [['fa-location-dot', (SW().setting ? 'setting set' : 'no setting')]]),
        ] },
        { label: 'Canon', desc: 'Background truths every scene shares — asserted as true in all of them, always.', members: [
          one('canon', 'Canon facts', 'fa-book',
            () => 'Background truths every scene shares.', () => memberCanon(),
            () => [['fa-list', ((CAN().facts || []).length) + ' facts']]),
        ] },
        { label: 'Cast', addLabel: 'Add character',
          desc: 'Everyone who can appear in a scene. Identity and disposition only — how a character reacts belongs in a step.',
          members: chars.map((ch, i) => ({
          id: 'char:' + i, name: ch.name || 'Unnamed character', icon: 'fa-user',
          sub: () => ch.role,
          meta: () => [['fa-shield', ((ch.behavior || {}).guardrails || []).length + ' guardrails'],
                       ['fa-key', ((ch.canon_facts || []).length) + ' known facts']],
          render: () => memberCharacter(i),
        })) },
        { label: 'The coach', desc: 'Who guides the learner, and how they sound. Universal coaching behavior is template-owned.', members: [
          one('coach', 'Persona & tone', 'fa-comment',
            () => C.coach_persona, () => memberCoach(),
            () => [['fa-list', ((C.tone_guidelines || []).length) + ' tone rules']]),
        ] },
      ];
    }

    if (phaseId === 'teaching') {
      const tp = C.teaching_points || [], mc = C.misconceptions || [];
      return [
        { label: 'Topics', addLabel: 'Add topic',
          desc: 'A subject heading and the points beneath it. Debrief-scoped: never shown mid-attempt.',
          members: tp.map((t, i) => ({
          id: 'topic:' + i, name: t.topic || 'Untitled topic', icon: 'fa-graduation-cap',
          sub: () => (t.points || [])[0],
          meta: () => [['fa-list', ((t.points || []).length) + ' points']],
          render: () => memberTopic(i),
        })) },
        { label: 'Misconceptions', addLabel: 'Add misconception',
          desc: 'The wrong beliefs worth correcting, and what replaces them.',
          members: mc.map((m, i) => ({
          id: 'misc:' + i, name: m.misconception || 'Untitled', icon: 'fa-circle-exclamation',
          sub: () => m.redirect,
          render: () => memberMisconception(i),
        })) },
      ];
    }

    if (phaseId === 'interaction') {
      const ps = C.phases || [];
      const g = [];
      if (C.opening) {
        g.push({ label: 'Opening',
          desc: 'One ungraded exchange before the phases. Optional — a scenario may open straight into its first practice.',
          members: [
          one('opening', C.opening.label || 'Opening reflection', 'fa-door-open',
            () => C.opening.purpose, () => memberOpening(),
            () => [['fa-comment-dots', ((C.opening.opening_messages || []).length) + ' messages']]),
        ] });
      }
      g.push({ label: 'Steps', addLabel: 'Add step',
        desc: 'Each step pairs a practice (the learner acts) with a debrief (the coach teaches against that attempt).',
        members: ps.map((ph, i) => {
        const m = MODES[(ph.practice || {}).mode] || MODES.coach_inquiry;
        return {
          id: 'step:' + i, name: ph.label || ('Step ' + (i + 1)), icon: m.icon,
          sub: () => ph.purpose,
          meta: () => [['fa-tag', m.label],
                       ['fa-clock', (((ph.practice || {}).exit || {}).when || {}).turns + ' turns'],
                       ['fa-gauge', '3 levels']],
          render: () => memberStep(i),
        };
      }) });
      return g;
    }

    if (phaseId === 'debrief') {
      const groups = IR().component_groups || [];
      return [
        { label: 'The close', desc: 'The audit-defensible close. Shipped verbatim to every learner on every path.', members: [
          one('close', 'Expert answer', 'fa-flag-checkered',
            () => IR().summary, () => memberClose(),
            () => [['fa-quote-left', 'shipped verbatim']]),
        ] },
        { label: 'Component groups', addLabel: 'Add group',
          desc: 'The parts of the expert answer, grouped as the source material groups them.',
          members: groups.map((gr, i) => ({
          id: 'group:' + i, name: gr.title || ('Group ' + (i + 1)), icon: 'fa-list-check',
          sub: () => (gr.components || [])[0],
          meta: () => [['fa-list', ((gr.components || []).length) + ' components']],
          render: () => memberGroup(i),
        })) },
        { label: 'References', addLabel: 'Add reference',
          desc: 'External authorities the close rests on — a regulation or standard, never an internal course id.',
          members: [
          one('refs', 'Source references', 'fa-scale-balanced',
            () => 'External authorities the close rests on.', () => memberRefs(),
            () => [['fa-list', ((IR().source_references || []).length) + ' authored']]),
        ] },
      ];
    }
    return [];
  }

  /* Which member is open, per phase. Remembered so returning to a phase lands
     where the author left it rather than resetting to the overview. */
  const openMember = {};
  const allMembers = (pid) => groupsFor(pid).reduce((a, g) => a.concat(g.members), []);
  /* Which GROUP a member sits in. The heading merges phase and group, so it
     needs to resolve one from the other. */
  const groupOfMember = (pid, mid) =>
    groupsFor(pid).find((g) => g.members.some((m) => m.id === mid)) || null;

  /* A lint belongs to a member when its `member` id matches. Dots on the cards
     are the thing V1's 64px rail had nowhere to put. */
  const lintFor = (mid) => liveLints().filter((l) => l.member === mid)
    .sort((a, b) => (a.severity === 'err' ? -1 : 1))[0];

  /* ===================================================================== */
  /* Panel                                                                  */
  /* ===================================================================== */

  function renderPanel() {
    const phase = PHASES[active];
    const groups = groupsFor(phase.id);
    const body = $('#panelBody');
    const total = groups.reduce((n, g) => n + g.members.length, 0);

    $('#panelTitle').textContent = phase.title;
    $('#panelCount').textContent = total + (total === 1 ? ' item' : ' items');

    /* Each group is its own <section> so its sticky label pins only while that
       group is on screen: a sticky element is bounded by its scroll ancestor,
       so without the wrapper the first label would pin for the whole panel and
       the next one would never push it off. Wrapping is what produces the
       hand-off the author actually wants. */
    body.innerHTML = groups.map((g) => {
      let h = `<section class="pgroup-sec"><div class="pgroup">${esc(g.label)}`
        + `<span class="pgroup-n">${g.members.length}</span></div>`;
      if (!g.members.length) {
        h += `<p style="font-size:12px;color:var(--ink-faint);margin:0 2px 8px">None yet.</p>`;
      }
      h += g.members.map((m) => {
        const isOpen = openMember[phase.id] === m.id;
        const lint = lintFor(m.id);
        const sub = typeof m.sub === 'function' ? m.sub() : m.sub;
        const meta = typeof m.meta === 'function' ? m.meta() : null;
        const numbered = !m.single && g.members.length > 1;
        return `<button class="pcard${isOpen ? ' is-active' : ''}" data-member="${esc(m.id)}">
            <span class="pcard-top">
              ${numbered ? `<span class="pcard-num">${g.members.indexOf(m) + 1}</span>` : ''}
              <span class="pcard-ico"><i class="fa-solid ${esc(m.icon)}"></i></span>
              <span class="pcard-name">${esc(m.name)}</span>
              <span class="pcard-dot ${lint ? lint.severity : 'ok'}"></span>
            </span>
            ${sub ? `<span class="pcard-sub">${esc(String(sub).slice(0, 150))}</span>` : ''}
            ${meta && meta.length ? `<span class="pcard-meta">${meta.map(([ic, tx]) =>
              `<span><i class="fa-solid ${esc(ic)}"></i> ${esc(tx)}</span>`).join('')}</span>` : ''}
          </button>`;
      }).join('');
      if (g.addLabel) {
        h += `<button class="padd" data-add="${esc(g.label)}"><i class="fa-solid fa-plus"></i> ${esc(g.addLabel)}</button>`;
      }
      return h + '</section>';
    }).join('');

    $$('[data-member]', body).forEach((b) => b.addEventListener('click', () => {
      openMember[phase.id] = b.dataset.member;
      renderPanel(); renderContent();
      $('#surface').scrollTop = 0;
    }));
    $$('[data-add]', body).forEach((b) => b.addEventListener('click', () =>
      toast('Not wired in this build')));
  }

  /* ===================================================================== */
  /* Content area                                                           */
  /* ===================================================================== */

  function renderContent() {
    const phase = PHASES[active];
    const inner = $('#surfaceInner');
    BINDINGS.length = 0;
    _rid = 0;

    const members = allMembers(phase.id);

    /* Auto-select. The overview was a LIST, and the panel beside it is the same
       list — two renderings of one thing, side by side. So a phase opens on a
       member instead, and the phase's own framing rides above the member form
       rather than living on a screen of its own.

       Position is remembered per phase: switching to Teaching to check a point
       and coming back should not lose your place in a step. A remembered id
       that no longer resolves (its member was removed) falls through to the
       first one rather than to an empty pane. */
    let m = members.find((x) => x.id === openMember[phase.id]);
    if (!m && members.length) {
      m = members[0];
      openMember[phase.id] = m.id;
    }

    /* The only remaining overview is the EMPTY case, which is real rather than
       hypothetical: a scenario may legitimately have no characters, no
       misconceptions, or — as this sample document does — no source references.
       objectManager never meets this because a Learning Object always has a
       scene. */
    if (!m) {
      inner.innerHTML = phaseLede(phase, null)
        + `<div class="empty-phase">
            <i class="fa-regular fa-folder-open"></i>
            <h3>Nothing here yet</h3>
            <p>${esc(phase.title)} has no entries. Add the first one from the panel.</p>
          </div>` + phaseFoot();
      bindFoot();
      renderRehPanel();      // nothing to rehearse — hides the panel
      return;
    }

    /* The member, with the phase's framing above it. No crumb: the panel beside
       this is always showing which member is active, and the phase name and the
       member name are both already on screen — in the lede and in the card
       heading. A third statement of the same two facts is not navigation. */
    inner.innerHTML = `
      ${phaseLede(phase, groupOfMember(phase.id, m.id))}
      ${m.render()}
      ${phaseFoot()}`;

    bindAll();
    bindFoot();

    $$('.modebtn', inner).forEach((b) => b.addEventListener('click', () => {
      const st = Number(b.dataset.step);
      C.phases[st].practice.mode = b.dataset.mode;
      renderPanel(); renderContent();
      toast('Step retyped — ' + MODES[b.dataset.mode].label);
    }));
    $$('.addrow, .rowdel, .subdel', inner).forEach((b) =>
      b.addEventListener('click', () => toast('Not wired in this build')));

    $$('[data-lvl]', inner).forEach((b) => b.addEventListener('click', () => {
      openLevel[Number(b.dataset.step)] = b.dataset.lvl;
      renderContent();
    }));
    $$('[data-compare]', inner).forEach((b) =>
      b.addEventListener('click', () => openCompare(Number(b.dataset.compare))));

    renderRehPanel();
  }

  /* The heading absorbs the group. Three things used to say roughly the same
     thing on one screen — the phase lede, the panel's group label, and the
     card's own descriptive lead. They collapse into one block:

       phase description   (the domain, repeated across every group in it)
       Phase · Group       (the heading)
       group description   (what you are actually editing — styled apart)

     So the domain line is constant across a phase and only the second half
     moves as you cross groups, which is what makes the repetition read as
     orientation rather than noise. */
  /* Two rows.

       Phase title  (?)          <- the phase's own description is behind the
       Group — its description      help icon; it is read once and then in the
                                    way, so it does not hold a line of its own

     The phase number is gone: the rail already carries position, and repeating
     it here named a place the author is already standing in. */
  const phaseLede = (phase, group) => `<div class="phase-lede">
      <div class="pl-row pl-row-phase">
        <h1>${esc(phase.title)}</h1>
        <button class="pl-help" id="phaseHelp" aria-label="About ${esc(phase.title)}">
          <i class="fa-regular fa-circle-question"></i>
        </button>
        <vaadin-tooltip for="phaseHelp" position="bottom-start"
          text="${esc(phase.sub)}"></vaadin-tooltip>
        <!-- Phase navigation, right-aligned in the heading. It sat at the
             FOOT of the content, which on a step means ~35 fields of scrolling
             before the way forward is even on screen. -->
        <div class="pl-nav">
          <button class="pl-navbtn" id="pfBack" ${active === 0 ? 'disabled' : ''}
            title="${active === 0 ? 'First phase' : 'Back to ' + esc(PHASES[active - 1].title)}">
            <i class="fa-solid fa-arrow-left"></i> Back</button>
          <button class="pl-navbtn next" id="pfNext"
            title="${active < PHASES.length - 1 ? 'On to ' + esc(PHASES[active + 1].title) : 'Preview as learner'}">
            ${active < PHASES.length - 1
              ? esc(PHASES[active + 1].title) + ' <i class="fa-solid fa-arrow-right"></i>'
              : '<i class="fa-solid fa-play"></i> Preview'}</button>
        </div>
      </div>
      ${group ? `<div class="pl-row pl-row-group">
        <span class="pl-group">${esc(group.label)}</span>
        ${group.desc ? `<span class="pl-groupdesc">${esc(group.desc)}</span>` : ''}
      </div>` : ''}
    </div>`;

  const phaseFoot = () => '';

  function bindFoot() {
    const back = $('#pfBack'), next = $('#pfNext');
    if (back) back.addEventListener('click', () => setPhase(active - 1));
    if (next) next.addEventListener('click', () => {
      if (active < PHASES.length - 1) setPhase(active + 1);
      else toast('Preview is out of scope for this wave');
    });
  }

  /* ===================================================================== */
  /* Members — each renders ONE thing into the content area                 */
  /* ===================================================================== */

  /* The member's card. It carries the member's NAME and its fields — the
     descriptive lead moved up into the merged heading, where it is stated once
     per group instead of once per member. `lead` is still accepted for the few
     members that carry something specific to themselves rather than to their
     group (a step's own purpose, for instance). */
  const card = (icon, title, lead, inner, stage) =>
    `<div class="card"><h2><i class="fa-solid ${icon}"></i> ${esc(title)}`
    + (stage ? `<span class="stage">${esc(stage)}</span>` : '') + `</h2>`
    + (lead ? `<p class="lead">${esc(lead)}</p>` : '')
    + `<div class="fields no-rule">${inner}</div></div>`;

  function memberSituation() {
    return card('fa-earth-americas', 'The situation', '',
      field('The situation', { reg: 'verbatim', area: true, rows: 6,
        helper: 'Second person, present tense, addressed to the learner, ending at the moment the experience begins.' },
        () => C.narrative, (v) => { C.narrative = v; })
      + field('Scene setting (one line)', { reg: 'guidance',
        helper: 'Where and when scenes take place. Rendered at the top of every scene prompt.' },
        () => SW().setting, (v) => { SW().setting = v; }));
  }

  function memberCanon() {
    const facts = CAN().facts || [];
    return card('fa-book', 'Canon facts', '',
      guidance('What belongs in canon — and what does not', 'fa-circle-info',
        '<p>Canon carries background truth the learner could already know — never plot, never answers.</p>'
        + '<ul><li>Happens later in the story → write it into the opener of the step where it happens.</li>'
        + '<li>Depends on how the learner played an earlier step → that is carryover, not canon.</li>'
        + '<li>A character would only reveal it once earned → put it on that character with a reveal condition.</li></ul>')
      + rows('Facts', facts.length + ' authored.',
        facts.map((_, i) => rowCard('Fact ' + (i + 1),
          field('Background truth', { reg: 'guidance', area: true, rows: 2 },
            () => (CAN().facts || [])[i], (v) => { CAN().facts[i] = v; }))).join(''),
        'Add canon fact'));
  }

  function memberCharacter(i) {
    const chars = SW().characters || [];
    const ch = chars[i] || {};
    const B = () => (chars[i].behavior = chars[i].behavior || {});
    let inner =
      field('Name', { reg: 'setting' }, () => chars[i].name, (v) => { chars[i].name = v; })
      + readout('Reference id', ch.id || '—', 'derived from the name')
      + field('Role', { reg: 'guidance', helper: 'Who they are in this world.' },
          () => chars[i].role, (v) => { chars[i].role = v; })
      + field('Baseline', { reg: 'guidance', area: true, rows: 2, helper: 'Who they are when a scene opens.' },
          () => B().baseline, (v) => { B().baseline = v; })
      + field('Driver', { reg: 'guidance', area: true, rows: 2,
          helper: 'What their behavior responds to — the hinge the learner can move.' },
          () => B().driver, (v) => { B().driver = v; })
      + `<div class="fsub">Guardrails</div>`
      + subRows('Guardrail', 'A line this character never crosses, however the learner behaves.',
          B().guardrails, (k) => (B().guardrails || [])[k], (k, v) => { B().guardrails[k] = v; },
          'Add guardrail');

    const cf = ch.canon_facts || [];
    inner += `<div class="fsub">What they know</div>`;
    inner += cf.length
      ? cf.map((_, k) => rowCard('Fact ' + (k + 1),
          field('What they know', { reg: 'guidance', area: true, rows: 2,
            helper: 'True for this character in every scene. Distinct from world canon, which everyone knows.' },
            () => (chars[i].canon_facts || [])[k].fact, (v) => { chars[i].canon_facts[k].fact = v; })
          + field('Reveal when (optional)', { reg: 'guidance', area: true, rows: 2,
            helper: 'The condition that earns it. Blank means they may say it freely.' },
            () => (chars[i].canon_facts || [])[k].reveal_when,
            (v) => { chars[i].canon_facts[k].reveal_when = v; }))).join('')
      : '<p class="subrows-help">None authored.</p>';
    inner += `<button class="addrow sm"><i class="fa-solid fa-plus"></i> Add known fact</button>`;

    return card('fa-user', ch.name || 'Character', '', inner);
  }

  function memberCoach() {
    const tone = C.tone_guidelines || [];
    return card('fa-comment', 'The coach', '',
      guidance('Do not author universal coaching behavior', 'fa-circle-info',
        '<p>“Affirm before correcting”, “never invent facts” and similar are owned by the engine template. '
        + 'Re-authoring them here is rejected by review.</p>')
      + field('Coach persona', { reg: 'guidance', area: true, rows: 3,
        helper: 'This scenario’s register and expertise, as a phrase.' },
        () => C.coach_persona, (v) => { C.coach_persona = v; })
      + rows('Tone rules', 'Scenario-specific only. Each renders as a bullet in the coach prompt.',
        tone.map((_, i) => rowCard('Tone rule ' + (i + 1),
          field('Rule', { reg: 'guidance', area: true, rows: 2 },
            () => (C.tone_guidelines || [])[i], (v) => { C.tone_guidelines[i] = v; }))).join(''),
        'Add tone rule'));
  }

  function memberTopic(i) {
    const t = (C.teaching_points || [])[i] || {};
    return card('fa-graduation-cap', t.topic || 'Topic', '',
      guidance('Grouping is structure, not decoration', 'fa-layer-group',
        '<p>Each topic renders as a heading with its points beneath it in the coach prompt. '
        + 'Group by <b>subject</b>, not by phase.</p>')
      + field('Topic', { reg: 'setting', helper: 'A subject heading, e.g. “The law”.' },
        () => (C.teaching_points || [])[i].topic, (v) => { C.teaching_points[i].topic = v; })
      + `<div class="fsub">Points</div>`
      + subRows('Point', 'A substantive thing the learner must leave understanding.',
        t.points, (k) => (C.teaching_points || [])[i].points[k],
        (k, v) => { C.teaching_points[i].points[k] = v; }, 'Add point'));
  }

  function memberMisconception(i) {
    return card('fa-circle-exclamation', 'Misconception', '',
      field('The wrong belief', { reg: 'guidance', area: true, rows: 3 },
        () => (C.misconceptions || [])[i].misconception,
        (v) => { C.misconceptions[i].misconception = v; })
      + field('The correction', { reg: 'guidance', area: true, rows: 3 },
        () => (C.misconceptions || [])[i].redirect,
        (v) => { C.misconceptions[i].redirect = v; }));
  }

  function memberOpening() {
    const O = () => (C.opening = C.opening || {});
    return card('fa-door-open', O().label || 'Opening reflection', '',
      field('Name of the exchange', { reg: 'verbatim', helper: 'Learner-facing.' },
        () => O().label, (v) => { O().label = v; })
      + field('Purpose', { reg: 'guidance', area: true, rows: 2, helper: 'Model-facing: what this exchange is for.' },
        () => O().purpose, (v) => { O().purpose = v; })
      + field('Composer placeholder', { reg: 'verbatim' },
        () => O().input_placeholder, (v) => { O().input_placeholder = v; })
      + `<div class="fsub">Opening messages</div>`
      + (O().opening_messages || []).map((m, i) => field('Message ' + (i + 1),
        { reg: 'verbatim', area: true, rows: 2, helper: 'Locked — delivered verbatim, in order, with no model call.' },
        () => (O().opening_messages || [])[i].text,
        (v) => { O().opening_messages[i].text = v; })).join(''),
      'ENTER');
  }

  function memberStep(i) {
    const P  = () => C.phases[i];
    const PR = () => (P().practice = P().practice || {});
    const EX = () => (PR().exit = PR().exit || {});
    const EW = () => (EX().when = EX().when || {});
    const TR = () => (PR().transition = PR().transition || {});
    const IN = () => (PR().interaction = PR().interaction || {});
    const DB = () => (P().debrief = P().debrief || {});
    const mode = MODES[PR().mode] || MODES.coach_inquiry;

    let body = '<div class="moderow">' + Object.keys(MODES).map((k) =>
      `<button class="modebtn${PR().mode === k ? ' is-on' : ''}" data-mode="${k}" data-step="${i}" title="${esc(MODES[k].hint)}">`
      + `<i class="fa-solid ${MODES[k].icon}"></i> ${esc(MODES[k].label)}</button>`).join('') + '</div>';

    body += sec('Identity', 'fa-id-card');
    body += field('Step name', { reg: 'verbatim', helper: 'Learner-facing. Use the source material’s own name.' },
      () => P().label, (v) => { P().label = v; });
    body += readout('Step id', P().id || '—', 'derived');
    body += field('Purpose of the step', { reg: 'guidance', area: true, rows: 2,
      helper: 'Model-facing: this step’s role in the coach’s map of the arc. Not shown to the learner.' },
      () => P().purpose, (v) => { P().purpose = v; });

    body += secEnd;    // close Identity

    body += sec('The practice', 'fa-hand-pointer', 'where the learner acts');
    body += guidance('How a practice starts and ends', 'fa-circle-info',
      '<p>A practice always opens with <b>locked</b> content, because it asks the learner for something. '
      + 'It ends when the exit requirement is met <b>or</b> the turn budget runs out, whichever comes first.</p>');
    body += field('Practice name (optional)', { reg: 'verbatim', helper: 'Blank uses the step name.' },
      () => PR().label, (v) => { PR().label = v; });
    body += field('Purpose of the practice', { reg: 'guidance', area: true, rows: 2, helper: 'Model-facing: the practice’s job.' },
      () => PR().purpose, (v) => { PR().purpose = v; });
    body += field('Turn budget', { reg: 'setting', helper: 'Learner turns before the practice must close.' },
      () => String(EW().turns == null ? '' : EW().turns), (v) => { EW().turns = parseInt(v, 10) || 1; });
    body += field('Exit requirement (optional)', { reg: 'guidance', area: true, rows: 2,
      helper: 'What the learner must observably demonstrate to end this early.' },
      () => EW().requirement, (v) => { EW().requirement = v; });
    body += field('Final word (optional)', { reg: 'verbatim', area: true, rows: 2,
      helper: 'The locked closing line, delivered verbatim by either route. Author it as a statement, never a question.' },
      () => EX().final_word, (v) => { EX().final_word = v; });
    body += field('Button into the debrief', { reg: 'verbatim' },
      () => TR().button_label, (v) => { TR().button_label = v; });
    body += field('Handoff line (optional)', { reg: 'verbatim', area: true, rows: 2,
      helper: 'Appended as a locked line once the step advances.' },
      () => TR().text, (v) => { TR().text = v; });

    if (PR().mode === 'roleplay') {
      body += `<div class="fsub">The scene</div>`;
      body += field('Scene setting', { reg: 'guidance', area: true, rows: 2, helper: 'Where this scene takes place.' },
        () => IN().setting, (v) => { IN().setting = v; });
      const cast = (SW().characters || []).map((c2) => c2.name + ' (' + c2.id + ')').join(' · ');
      body += readout('Counterpart', IN().character_id || '—', cast ? 'cast: ' + cast : '');
      body += field('Emotion hint', { reg: 'guidance', helper: 'How the counterpart carries themselves as the scene opens.' },
        () => IN().emotion_hint, (v) => { IN().emotion_hint = v; });
      body += field('Chat header name', { reg: 'setting' },
        () => IN().partner_label, (v) => { IN().partner_label = v; });
    }
    body += `<div class="fsub">Opening messages</div>`;
    (IN().opening_messages || []).forEach((m, k) => {
      body += field('Message ' + (k + 1), { reg: 'verbatim', area: true, rows: 2,
        helper: k === 0 ? 'The coach’s locked opener, delivered verbatim in order.' : '' },
        () => (IN().opening_messages || [])[k].text, (v) => { IN().opening_messages[k].text = v; });
    });
    body += field('Composer placeholder', { reg: 'verbatim' },
      () => IN().input_placeholder, (v) => { IN().input_placeholder = v; });

    body += secEnd;    // close The practice

    body += sec('Quality levels', 'fa-gauge', 'how the AI reads the attempt');
    body += guidance('Fixed at three', 'fa-circle-info',
      '<p>The vocabulary is set by the engine, not the author: <b>unthoughtful</b>, <b>neutral</b>, <b>strong</b>. '
      + 'A level is never shown to the learner and never gates progress — it selects what happens next.</p>');
    /* A FIXED container, not a list: the vocabulary is the engine's, so there
       are always exactly these three and never a fourth. Saying so in the
       header is the honest difference from a list the author extends — and it
       is why there is no add or remove here.

       The three SHARE space rather than stacking, which removes roughly a
       third of the step's length. The cost is that two are always hidden, and
       all three are REQUIRED — an author who fills Strong, sees a complete
       looking panel and moves on has shipped a step whose calibration is
       two-thirds empty. Stacking at least made that visible.

       So the tab carries the completion state: a level missing a required
       field says so ON THE TAB, before it is opened, and the container header
       reports the count. Hiding is only safe when what is hidden announces
       itself. */
    const LV = () => (IN().levels = IN().levels || {});
    const reqOf = () => ['look_for', 'response'].concat(PR().mode === 'roleplay' ? ['progression'] : []);
    const missingIn = (k) => reqOf().filter((f) => !str(obj(LV()[k])[f]).trim());
    const incomplete = Object.keys(LEVELS).filter((k) => missingIn(k).length);
    const cur = openLevel[i] && LEVELS[openLevel[i]] ? openLevel[i] : 'unthoughtful';

    body += `<div class="rows rows-fixed lvls">
      <div class="rows-head">
        <span class="rows-title">Quality levels</span>
        <span class="rows-lock"><i class="fa-solid fa-lock"></i> Fixed set of 3</span>
        ${incomplete.length
          ? `<span class="lvl-warn"><i class="fa-solid fa-triangle-exclamation"></i>
               ${incomplete.length} of 3 incomplete</span>`
          : `<span class="lvl-ok"><i class="fa-solid fa-circle-check"></i> All three authored</span>`}
        <button class="rows-compare" data-compare="${i}">
          <i class="fa-solid fa-table-columns"></i> Compare all three</button>
      </div>
      <div class="lvl-tabs" role="tablist">
        ${Object.keys(LEVELS).map((k) => {
          const miss = missingIn(k).length;
          return `<button class="lvl-tab ${k}${k === cur ? ' is-on' : ''}${miss ? ' is-missing' : ''}"
              role="tab" aria-selected="${k === cur}" data-lvl="${k}" data-step="${i}"
              title="${miss ? miss + ' required field' + (miss > 1 ? 's' : '') + ' still empty'
                            : 'Authored'}">
            <span class="lvl-dot"></span>
            <span class="lvl-name">${esc(LEVELS[k].title)}</span>
            ${miss ? `<span class="lvl-miss">${miss}</span>`
                   : '<i class="fa-solid fa-check lvl-check"></i>'}
          </button>`;
        }).join('')}
      </div>
      <p class="lvl-hint">${esc(LEVELS[cur].hint)}</p>`;

    body += [cur].map((k) => {
      const L = () => (LV()[k] = LV()[k] || {});
      let inner = field('Look for', { reg: 'guidance', area: true, rows: 3, helper: LEVELS[k].hint },
        () => L().look_for, (v) => { L().look_for = v; });
      inner += field('Response', { reg: 'guidance', area: true, rows: 3,
        helper: PR().mode === 'roleplay'
          ? 'What the world or counterpart does. The character never coaches.'
          : 'Coach-voiced — a probe or acknowledgement at this level.' },
        () => L().response, (v) => { L().response = v; });
      if (PR().mode === 'roleplay') {
        inner += field('Progression', { reg: 'guidance', area: true, rows: 2,
          helper: 'How far the scene gets and how it resolves at this level. Legal only on a roleplay step.' },
          () => L().progression, (v) => { L().progression = v; });
      }
      const E = () => (L().example = L().example || {});
      inner += field('Example — what the learner says', { reg: 'guidance', area: true, rows: 2,
        helper: 'Optional. One short worked exchange calibrating the register.' },
        () => E().learner, (v) => { E().learner = v; });
      inner += field('Example — the reply', { reg: 'guidance', area: true, rows: 2 },
        () => E().reply, (v) => { E().reply = v; });
      return `<div class="lvl-panel" role="tabpanel">${inner}</div>`;
    }).join('') + '</div>';

    body += secEnd;    // close Quality levels

    body += sec('The debrief', 'fa-comment-dots', 'where the coach teaches');
    body += guidance('No locked opener', 'fa-circle-info',
      '<p>It reacts to the attempt, so it has <b>no locked opener</b>. Key points are delivered whether or not '
      + 'the learner got there. <b>Delivery-only is the default posture.</b></p>');
    body += field('Debrief name', { reg: 'verbatim', helper: 'Learner-facing.' },
      () => DB().label, (v) => { DB().label = v; });
    body += field('Purpose (optional)', { reg: 'guidance', area: true, rows: 2 },
      () => DB().purpose, (v) => { DB().purpose = v; });
    body += field('Chat header name (optional)', { reg: 'setting', helper: 'Defaults to the coach label.' },
      () => DB().partner_label, (v) => { DB().partner_label = v; });
    body += subRows('Key point', 'Delivered whether or not the learner got there.',
      DB().key_points, (k) => (DB().key_points || [])[k],
      (k, v) => { DB().key_points[k] = v; }, 'Add key point');
    const DE = () => (DB().exit = DB().exit || {});
    const DW = () => (DE().when = DE().when || {});
    body += field('Follow-up turns', { reg: 'setting', helper: '0 means delivery-only: the debrief speaks and opens no composer.' },
      () => String(DW().turns == null ? '0' : DW().turns), (v) => { DW().turns = parseInt(v, 10) || 0; });
    body += field('Final word', { reg: 'verbatim', area: true, rows: 2,
      helper: 'The locked closing line, delivered verbatim when the debrief ends.' },
      () => DE().final_word, (v) => { DE().final_word = v; });

    /* The rehearsal is NOT part of this card — it renders into the right-hand
       panel (see renderRehPanel), because it is not part of the document. It is
       what the document produces, and keeping it beside the form lets an author
       change a level's guidance and draw against it without scrolling. */
    body += secEnd;    // close The debrief

    return card(mode.icon, P().label || ('Step ' + (i + 1)), P().purpose || '', body, mode.label);
  }

  function memberClose() {
    return card('fa-flag-checkered', 'Expert answer', '',
      field('Summation', { reg: 'verbatim', area: true, rows: 6,
        helper: 'The expert answer in one paragraph. Shipped verbatim, on every path.' },
        () => IR().summary, (v) => { IR().summary = v; })
      + field('Display name on the closing screen', { reg: 'setting', helper: 'Optional.' },
        () => CL().partner_label, (v) => { CL().partner_label = v; }), 'CLOSE');
  }

  function memberGroup(i) {
    const g = (IR().component_groups || [])[i] || {};
    return card('fa-list-check', g.title || ('Group ' + (i + 1)), '',
      field('Group title', { reg: 'verbatim', helper: 'Optional.' },
        () => (IR().component_groups || [])[i].title,
        (v) => { IR().component_groups[i].title = v; })
      + `<div class="fsub">Components</div>`
      + subRows('Component', 'One part of the expert answer.',
        g.components, (k) => (IR().component_groups || [])[i].components[k],
        (k, v) => { IR().component_groups[i].components[k] = v; }, 'Add component'));
  }

  function memberRefs() {
    const refs = IR().source_references || [];
    return card('fa-scale-balanced', 'Source references', '',
      guidance('External authorities only', 'fa-circle-info',
        '<p>A regulation or standard (an OSHA clause, Title VII) — never an internal course or slide id, '
        + 'which means nothing outside the course.</p>')
      + (refs.length
          ? rows('References', refs.length + ' authored.',
              refs.map((_, i) => rowCard('Reference ' + (i + 1),
                field('External authority', { reg: 'verbatim' },
                  () => (IR().source_references || [])[i],
                  (v) => { IR().source_references[i] = v; }))).join(''),
              'Add reference')
          : `<p class="subrows-help">None authored.</p>
             <button class="addrow sm"><i class="fa-solid fa-plus"></i> Add reference</button>`));
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

          <p class="setting-note"><i class="fa-solid fa-circle-info"></i>
            Reaches the coach only. Nothing here is shown to the learner.</p>
        </div>
      </div>`;

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
  renderPanel();
  renderContent();
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

  /* Rehearsal panel resize. Mirrors the left panel's grip; drags from the
     panel's LEFT edge, so the delta is inverted. */
  (function initRehResize() {
    const grip = $('#rehGrip'), panel = $('#rehPanel');
    if (!grip || !panel) return;
    let startX = 0, startW = 0, dragging = false;
    grip.addEventListener('mousedown', (e) => {
      dragging = true; startX = e.clientX; startW = panel.offsetWidth;
      grip.classList.add('is-dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      // 340 is the floor at which a two-sided transcript still reads.
      const w = Math.max(340, Math.min(620, startW - (e.clientX - startX)));
      panel.style.setProperty('--rehp-w', w + 'px');
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      grip.classList.remove('is-dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  })();

  /* Panel resize. Inherited from objectManager's own .slide-panel handle,
     because the width tradeoff — panel vs. a form that needs room — is one an
     author should be able to settle rather than have decided for them. */
  (function initPanelResize() {
    const grip = $('#panelGrip'), panel = $('#panel');
    if (!grip || !panel) return;
    let startX = 0, startW = 0, dragging = false;
    grip.addEventListener('mousedown', (e) => {
      dragging = true; startX = e.clientX; startW = panel.offsetWidth;
      grip.classList.add('is-dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      // Floor and ceiling: below 260 the cards stop being readable, above 520
      // the form loses the width the quality-levels comparison will need.
      const w = Math.max(260, Math.min(520, startW + (e.clientX - startX)));
      panel.style.setProperty('--panel-w', w + 'px');
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      grip.classList.remove('is-dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  })();
})();
