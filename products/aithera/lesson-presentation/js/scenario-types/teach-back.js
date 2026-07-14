/* =========================================================================
   WRITER-STUDIO SCENARIO TYPE — teach-back
   A different pedagogy from action-practice: the learner explains a set of
   required topics from memory and an AI grades coverage live. There is no
   character roleplay and no hidden scoring — the score is the point.

   It compiles to THREE prompts (calibration chat / live grading / closing
   feedback), so type.compile() returns a named list instead of one string.

   Registers into window.AitheraStudio (the generic studio engine). Loaded by
   BOTH writer-studio.html (to author) and teach-back.html (to run) — the
   registration is harmless on the live page, which then reads its published
   scenario via AitheraStudio.get('teach-back').store.
   ========================================================================= */
(function () {
  'use strict';
  if (!window.AitheraStudio) return;   // engine must load first
  const S = window.AitheraStudio;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* =======================================================================
     THE DEFAULT SCENARIO — the shipped HazCom "Teach Me" exercise as data.
     Its three compiled prompts reproduce the strings teach-back.html shipped
     with (CHAT_SYSTEM / gradeSystem() / closeSystem()).
     ======================================================================= */
  const DEFAULT = {
    v: 1,
    type: 'teach-back',
    title: 'Applying HazCom: The Teach Me Exercise',

    // Named in the calibration prompt: "The learner has just finished {subject}."
    subject: 'a Hazard Communication (HazCom) course',

    // The required topics the learner must teach back. `short` labels the tile
    // and the closing list; `full` is what the grader matches on; `synonyms`
    // are the accepted plain-language phrasings.
    topics: [
      { short: 'Requirements of the HazCom Standard',
        full: 'The requirements of OSHA\'s Hazard Communication Standard itself — the regulatory foundation every training program must establish.',
        synonyms: 'the standard, OSHA rule, the regulation, HazCom law, why training is required' },
      { short: 'The written HazCom program & how to access it',
        full: 'The details of the employer\'s written HazCom program and how to access it — employees must know it exists, where it is, and how to use it.',
        synonyms: 'written plan, the paperwork, company program document, where the plan is kept' },
      { short: 'Where hazardous chemicals are in the work area',
        full: 'The locations of hazardous chemicals in the work area — where chemical hazards exist in the environment.',
        synonyms: 'where chemicals are stored, chemical locations, what\'s in my area' },
      { short: 'Physical & health hazards of the chemicals',
        full: 'The physical and health hazards of the chemicals employees may encounter — what the chemicals can actually do to you.',
        synonyms: 'dangers of the chemicals, flammable/toxic, health effects, what it does to you' },
      { short: 'How to detect a chemical\'s presence or release',
        full: 'How to detect the presence or release of hazardous chemicals — recognizing a hazard in real time (smell, monitors, alarms, visible signs).',
        synonyms: 'detection, spotting a leak, monitors, alarms, sensing a release, smell' },
      { short: 'Measures employees can take to protect themselves',
        full: 'Measures EMPLOYEES can use to protect themselves — employee-initiated protective actions (distinct from employer-provided systems).',
        synonyms: 'what workers can do, self-protection, personal safe habits, things I can do' },
      { short: 'Employer protective measures: work practices, emergency procedures & PPE',
        full: 'Protective measures the EMPLOYER has put into action — the three-component breakdown of work practices, emergency procedures, and PPE.',
        synonyms: 'work practices, emergency procedures, spill response, PPE program, employer controls, engineering controls' },
      { short: 'Labels on containers & the worksite labeling system',
        full: 'Explanation of labels on shipped containers and the worksite chemical labeling system — reading and interpreting hazard-communication labels (GHS).',
        synonyms: 'labels, GHS labels, pictograms, container markings, secondary labels' },
      { short: 'Where SDSs are & how to access them',
        full: 'Where Safety Data Sheets (SDSs) are located and how employees can access them — a right for ALL workers, not just safety officers.',
        synonyms: 'SDS, safety data sheets, MSDS, chemical info binder, where the sheets are' },
      { short: 'Who to contact if an issue arises',
        full: 'Who to contact if an issue arises — the appropriate point of contact for hazard-related concerns.',
        synonyms: 'who to call, point of contact, report a problem, supervisor to notify' },
    ],

    // The calibration chat before the tiles appear. openingQuestion is on
    // screen already; coachGuidance is the coach's brief for that chat.
    calibrate: {
      openingQuestion: 'How confident are you feeling, and what\'s the one thing you\'d want a brand-new coworker to walk away knowing?',
      coachGuidance: 'Your job RIGHT NOW is only a brief, encouraging calibration chat before that begins. You are NOT scoring anything yet. Keep every message to 2-3 short sentences, plain-spoken and human. The learner has already seen your opening message; read their reply, acknowledge it warmly WITHOUT evaluating it, and point them to tap "Start teaching."',
    },

    // The live grader's judgment rules (the topic list is added automatically).
    grade: {
      rules: '- Accept synonyms and plain language. Err toward crediting when intent is clear — don\'t require exact terminology.\n- Topics 6 and 7 are distinct: 6 = what the EMPLOYEE does to protect themselves; 7 = employer-implemented systems (work practices, emergency procedures, PPE). Credit the more specific one; credit both only if both are clearly present.\n- Don\'t credit topics they never gestured at.',
    },

    // How the coach writes the closing feedback.
    close: {
      guidance: 'You\'ll be told the learner\'s final score (how many of the 10 they taught back) and which they missed. Write brief, warm, NON-punitive closing feedback — say it like "you named X of 10" (never "you missed 3"). Reference one thing they did well, and name one area to hold onto (the general area of a missed topic) if any were missed. 2-3 sentences total.',
    },
  };

  /* =======================================================================
     LOCKED CONTRACTS — the strict JSON shapes each of the three model calls
     must return. Shown read-only in the Guardrails section; the writer edits
     tone/rules above but can never change these shapes.
     ======================================================================= */
  const ENGINE_SECTIONS = [
    { id: 'tb-calibrate', title: 'Calibration reply contract',
      note: 'What the calibration chat returns on every turn. "ready" flips the learner into the teaching phase.',
      text: () => 'Return STRICT JSON ONLY, no markdown, no code fences:\n{"text": "your reply (2-3 sentences)", "ready": true}' },
    { id: 'tb-grade', title: 'Live-grading contract',
      note: 'What the fast grader returns as the learner talks — which topics are covered, and one hint toward the most useful gap.',
      text: () => 'Return STRICT JSON ONLY, no markdown, no code fences:\n{"covered": [topic numbers addressed], "nudge": "one short category-level hint; empty string if all covered"}' },
    { id: 'tb-close', title: 'Closing-feedback contract',
      note: 'What the closing call returns — the headline and 2-3 warm sentences shown on the results screen.',
      text: () => 'Return STRICT JSON ONLY, no markdown, no code fences:\n{"headline": "a short 2-4 word encouraging headline", "feedback": "2-3 warm sentences"}' },
  ];

  /* =======================================================================
     THE THREE PROMPT BUILDERS — reproduce teach-back.html's shipped prompts
     when given the DEFAULT scenario.
     ======================================================================= */
  function calibratePrompt(s) {
    const n = (s.topics || []).length;
    // Context handoff — when the scene is inherited from a previous LO. The
    // calibration chat is Teach-Back's opening, so it bridges the seam here.
    const handoff = (window.AitheraScenario && window.AitheraScenario.contextHandoff) ? window.AitheraScenario.contextHandoff(s) : '';
    return `You are a warm, knowledgeable workplace-safety coach running a short "teach-back" exercise. The learner has just finished ${s.subject}. In a moment they'll be shown ${n} blurred topic tiles and asked to teach each one back — speaking or typing — and each tile comes into focus as they cover it.

${handoff ? handoff + '\n\n' : ''}${s.calibrate.coachGuidance}

Return STRICT JSON ONLY, no markdown, no code fences:
{"text": "your reply (2-3 sentences)", "ready": true}

Set "ready": true once you've acknowledged their reply (almost always after their first reply). Only set "ready": false if they asked a direct question you must answer first — then answer briefly and invite them to reply again.`;
  }

  function gradePrompt(s) {
    const n = (s.topics || []).length;
    const list = (s.topics || []).map((t, i) => `${i + 1}. ${t.full} (accept phrasing like: ${t.synonyms})`).join('\n');
    return `You grade a HazCom teach-back. The learner is explaining, from memory, the topics a COMPLETE HazCom employee-training program must cover. The ${n} required topics:

${list}

You will receive everything the learner has said so far (speech + typing, concatenated). Decide which of the ${n} they have CLEARLY addressed.

Rules:
${s.grade.rules}

Return STRICT JSON ONLY, no markdown, no code fences:
{"covered": [topic numbers 1-${n} addressed], "nudge": "one short, warm, category-level hint toward the single most useful topic NOT yet covered — do NOT name the topic outright; empty string if all ${n} covered"}`;
  }

  function closePrompt(s) {
    const n = (s.topics || []).length;
    const list = (s.topics || []).map((t, i) => `${i + 1}. ${t.short}`).join('\n');
    return `You are the safety coach closing out a HazCom teach-back. The ${n} required topics:

${list}

${s.close.guidance}

Return STRICT JSON ONLY, no markdown, no code fences:
{"headline": "a short 2-4 word encouraging headline", "feedback": "2-3 warm sentences"}`;
  }

  function compile(s) {
    return [
      { label: 'Calibration chat', text: calibratePrompt(s) },
      { label: 'Live grading',     text: gradePrompt(s) },
      { label: 'Closing feedback', text: closePrompt(s) },
    ];
  }

  /* ---- prompt highlighter ----------------------------------------------- */
  function highlightStrings(s) {
    const out = [];
    const push = (v) => { const t = String(v ?? '').trim(); if (t.length > 2) out.push(t); };
    push(s.subject);
    if ((s.contextSource || 'in-scenario') === 'previous-lo' && s.previousLO) {
      push(s.previousLO.title); push(s.previousLO.covered); push(s.previousLO.handoff);
    }
    push(s.calibrate.openingQuestion); push(s.calibrate.coachGuidance);
    push(s.grade.rules); push(s.close.guidance);
    (s.topics || []).forEach((t) => { push(t.full); push(t.synonyms); push(t.short); });
    return out.sort((a, b) => b.length - a.length);
  }

  /* ---- validation / normalize / merge ----------------------------------- */
  function isValid(s) {
    return !!(s && s.type === 'teach-back' && s.title &&
      Array.isArray(s.topics) && s.calibrate && s.grade && s.close);
  }
  function normalize(s) {
    const out = { ...s };
    out.v = 1;
    out.type = 'teach-back';
    if (typeof out.title !== 'string') out.title = DEFAULT.title;
    if (typeof out.subject !== 'string') out.subject = DEFAULT.subject;
    if (!Array.isArray(out.topics) || !out.topics.length) out.topics = clone(DEFAULT.topics);
    out.calibrate = { ...clone(DEFAULT.calibrate), ...(out.calibrate || {}) };
    out.grade = { ...clone(DEFAULT.grade), ...(out.grade || {}) };
    out.close = { ...clone(DEFAULT.close), ...(out.close || {}) };

    // Platform-level context handoff — preserve/default so a save/load round-trip
    // keeps the fields the shell authors (the shell owns the UI; we just persist).
    if (out.contextSource !== 'previous-lo') out.contextSource = 'in-scenario';
    if (!out.previousLO || typeof out.previousLO !== 'object') out.previousLO = { title: '', covered: '', handoff: '' };

    return out;
  }
  // Blank template for "Start fresh" — one empty topic row so normalize()
  // doesn't back-fill the shipped HazCom topics.
  function blank() {
    return {
      v: 1, type: 'teach-back', title: '', subject: '',
      topics: [{ short: '', full: '', synonyms: '' }],
      calibrate: { openingQuestion: '', coachGuidance: '' },
      grade: { rules: '' },
      close: { guidance: '' },
    };
  }
  function merge(draft) {
    const base = clone(DEFAULT);
    if (!draft || typeof draft !== 'object') return base;
    const out = { ...base, ...draft };
    out.calibrate = { ...base.calibrate, ...(draft.calibrate || {}) };
    out.grade = { ...base.grade, ...(draft.grade || {}) };
    out.close = { ...base.close, ...(draft.close || {}) };
    if (!Array.isArray(out.topics) || !out.topics.length) out.topics = clone(base.topics);
    return normalize(out);
  }

  /* ---- lints ------------------------------------------------------------ */
  function lints(s) {
    const L = [];
    const add = (severity, section, msg, why) => L.push({ severity, section, msg, why });
    const empty = (v) => !String(v ?? '').trim();

    if (empty(s.title)) add('err', 'basics', 'The exercise needs a title.', 'It appears in the learner\'s top bar.');
    if (empty(s.subject)) add('warn', 'basics', 'No course named.', 'The calibration prompt says "the learner just finished …" — name the course. Start with "a …".');

    const topics = (s.topics || []).filter((t) => !empty(t.short) || !empty(t.full) || !empty(t.synonyms));
    if (!topics.length) add('err', 'topics', 'There are no topics to teach back.', 'A teach-back needs at least one required topic.');
    if (topics.length > 14) add('warn', 'topics', `${topics.length} topics is a lot to teach back in one sitting.`, 'Past a dozen or so, the tile wall gets overwhelming.');
    topics.forEach((t, i) => {
      const label = t.short ? `"${t.short}"` : `#${i + 1}`;
      if (empty(t.short)) add('err', 'topics', `Topic #${i + 1} has no short label.`, 'It labels the tile and the closing list.');
      if (empty(t.full)) add('err', 'topics', `Topic ${label} has no full description.`, 'The grader matches on the full description — without it, this topic can\'t be credited.');
      if (empty(t.synonyms)) add('info', 'topics', `Topic ${label} has no accepted phrasings.`, 'Synonyms help the grader credit plain-language answers instead of demanding exact terms.');
    });

    if (empty(s.calibrate.openingQuestion)) add('err', 'calibrate', 'Write the coach\'s opening question.', 'It\'s on screen before the chat begins.');
    else if (!/\?\s*$/.test(s.calibrate.openingQuestion.trim())) add('info', 'calibrate', 'The opening line isn\'t a question.', 'A question invites the learner to reflect before teaching.');
    if (empty(s.calibrate.coachGuidance)) add('warn', 'calibrate', 'No brief for the calibration chat.', 'Without it the coach may start grading or over-talk before the tiles appear.');

    if (empty(s.grade.rules)) add('warn', 'grade', 'No grading rules.', 'The grader falls back to its own judgment — spell out what counts and what doesn\'t.');
    if (empty(s.close.guidance)) add('warn', 'close', 'No closing-feedback guidance.', 'Without it the closing message drifts generic or punitive.');

    return L;
  }

  /* ---- form: sections + field renderers --------------------------------- */
  /* Ordered on the three-section spine. Teach-Back has no Section-1 context
     modality — its calibration chat IS the ENTER of the loop — so it opens
     straight into ② Interaction. The `stage` chip names the loop step each
     section maps to; section `id`s are unchanged (the lints key off them). */
  const sections = [
    { id: 'basics', group: 'meta', icon: 'fa-id-card', title: 'Basics',
      lead: 'What this teach-back is called and the course it follows.' },

    // ② Interaction — the loop for Teach-Back: a warm-up (ENTER), the learner
    // teaches each topic from memory (ACT), and a live grader focuses tiles and
    // nudges toward gaps (REACT). The score IS the point here — no hidden rubric.
    { id: 'calibrate', group: 'interaction', stage: 'ENTER', icon: 'fa-comment-dots', title: 'Calibration chat',
      lead: 'The no-scoring warm-up before the tiles appear — how the learner enters the loop.' },
    { id: 'topics', group: 'interaction', stage: 'ACT', icon: 'fa-list-check', title: 'Required topics',
      lead: 'What the learner teaches back — each a tile that resolves as they cover it, and the answer key the grader credits against.',
      bridgeTitle: 'From your old craft: the checklist a complete program must cover',
      bridge: '<b>short</b> labels the tile. <b>full</b> is what the AI grades against. <b>synonyms</b> are the phrasings you\'ll accept, so a learner who says it their own way still gets credit.' },
    { id: 'grade', group: 'interaction', stage: 'REACT', icon: 'fa-scale-balanced', title: 'Grading rules',
      lead: 'How the grader decides a topic is covered and steers the nudge to the biggest gap. The topic list is added for you.' },

    // ③ Debrief & Close — the results message. Here the score is shown by design.
    { id: 'close', group: 'debrief', stage: 'RESULTS', icon: 'fa-medal', title: 'Closing feedback',
      lead: 'How the coach writes the results message — the score is shown by design; keep it warm and non-punitive.' },

    { id: 'guardrails', group: 'reference', icon: 'fa-lock', title: 'System guardrails', locked: true,
      lead: 'The strict JSON shapes each model call must return. You can read them; you can\'t break them.' },
  ];

  function renderFields(sec, H) {
    const { tf, rowsBlock, rowCard, guidance, esc } = H;
    const box = document.createElement('div');
    box.className = 'fields';

    if (sec.id === 'basics') {
      box.append(
        tf('title', 'Exercise title', { helper: 'Shown in the learner\'s top bar.' }),
        tf('subject', 'Course the learner just finished', { helper: 'Grounds the calibration chat, e.g. "a Hazard Communication (HazCom) course". Start with "a …".' }),
      );
    }

    if (sec.id === 'topics') {
      box.append(rowsBlock('topics', (t, i, onDel) => rowCard(
        `Topic ${i + 1}`, onDel,
        tf(`topics.${i}.short`, 'Short label (tile + results list)', { placeholder: 'e.g. Where SDSs are & how to access them' }),
        tf(`topics.${i}.full`, 'Full description (what the grader matches)', { area: true, minRows: 2,
          helper: 'The complete idea, in one or two sentences. This is what the AI checks the learner\'s words against.' }),
        tf(`topics.${i}.synonyms`, 'Accepted phrasings', { area: true, minRows: 2,
          helper: 'Comma-separated plain-language ways a learner might say it, so they get credit without exact terms.' }),
      ), 'Add topic', () => ({ short: '', full: '', synonyms: '' })));
    }

    if (sec.id === 'calibrate') {
      box.append(
        tf('calibrate.openingQuestion', 'The coach\'s opening question', { area: true, minRows: 2,
          helper: 'On screen before the chat. It calibrates confidence — it should invite reflection, not test.' }),
        tf('calibrate.coachGuidance', 'How the coach runs the calibration chat', { area: true, minRows: 5,
          helper: 'The brief for the warm-up: no scoring yet, short and human, then point them to "Start teaching".' }),
      );
    }

    if (sec.id === 'grade') {
      box.append(tf('grade.rules', 'Grading rules', { area: true, minRows: 6,
        helper: 'One rule per line. The topic list and the JSON contract are added for you — write only the judgment calls (what to credit, what not to).' }));
    }

    if (sec.id === 'close') {
      box.append(tf('close.guidance', 'How to write the closing feedback', { area: true, minRows: 5,
        helper: 'Tone and content of the results message — how to phrase the score, what to praise, what to flag.' }));
    }

    if (sec.id === 'guardrails') {
      ENGINE_SECTIONS.forEach((g) => {
        const card = document.createElement('div');
        card.className = 'rowcard lockcard';
        card.innerHTML = `
          <div class="lockhead"><i class="fa-solid fa-lock"></i> ${esc(g.title)}</div>
          <div class="note">${esc(g.note)}</div>
          <details><summary>Read the exact locked text</summary><pre data-guardrail="${esc(g.id)}"></pre></details>`;
        box.appendChild(card);
      });
      box.appendChild(guidance('Why these are locked', 'fa-shield-halved',
        'The page can only render these exact JSON shapes — the calibration reply, the live coverage grade, and the closing feedback. Your topics and guidance fill the prompts around them; they can\'t change the shapes the page depends on.'));
    }

    return box;
  }

  /* ---- the type object -------------------------------------------------- */
  const teachBackType = {
    id: 'teach-back',
    label: 'Teach-Back',
    icon: 'fa-chalkboard-user',
    DEFAULT,
    ENGINE_SECTIONS,
    fill: (t) => String(t == null ? '' : t),   // no placeholder substitution here
    normalize,
    isValid,
    merge,
    blank,
    compile,
    // exposed so the live page (teach-back.html) can build each prompt directly
    calibratePrompt,
    gradePrompt,
    closePrompt,
    sections,
    renderFields,
    lints,
    highlightStrings,
    previewUrl: () => 'teach-back.html',
    playtest: null,        // v1: no in-studio playtest — publish + open the live page
    store: S.makeStore(S.makeKeys('teach-back'), { isValid, normalize }),
  };

  S.register(teachBackType);
})();
