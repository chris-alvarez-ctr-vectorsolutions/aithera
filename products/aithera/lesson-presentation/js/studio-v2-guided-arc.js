/* =========================================================================
   WRITER STUDIO V2 — GUIDED-ARC PRESENTATION + "FROM SCRATCH" WIZARD SPEC
   Loaded ONLY by writer-studio-v2.html, AFTER js/scenario-types/guided-arc.js.

   This module does NOT fork the guided-arc type — same schema, same
   compiler, same store (a draft made here opens fine in V1 and publishes to
   the same guided-arc-live.html). It re-presents the type for the V2 shell:

   1. RE-GROUPS the sections onto the V2 rail — Learn (reflection + topic
      turns) / Practice (the live scene) / Voice & Tone — instead of one
      "Interaction" bucket. The V2 shell's phase list knows these groups.
   2. RENAMES the author-facing language: "phases" become TOPIC TURNS —
      "a reflection (optional), then a few turns about specific topics with
      guidance on those topics" — matching how designers think about it.
   3. Attaches `type.wizard` — the start-from-scratch spec the generic
      wizard engine (js/studio-wizard.js) runs: a brief, an SME-style
      interview in plain language, then a staged generation pass that
      translates the answers into every field, INCLUDING the coach-facing
      guidance that used to need prompt-engineering craft.

   The generation prompts pull their exemplars from type.DEFAULT — the
   shipped Marshall scenario, the schema's reference oracle — so "what good
   looks like" always matches what actually ships and never drifts.
   ========================================================================= */
(function () {
  'use strict';
  if (!window.AitheraStudio) return;
  const T = window.AitheraStudio.get('guided-arc');
  if (!T) return;

  /* =======================================================================
     1) SECTION RE-GROUPING — the V2 rail: Learn / Practice / Voice & Tone
     ======================================================================= */
  const byId = (id) => T.sections.find((s) => s.id === id);

  Object.assign(byId('reflection'), {
    group: 'learn',
    title: 'Reflection — the warm-up',
    lead: 'OPTIONAL first coach turn: a non-evaluated gut check. Its prompt is delivered verbatim; the coach calibrates the reaction — it never grades it. Leave the prompt blank to open on the first topic turn instead.',
  });
  Object.assign(byId('phases'), {
    group: 'learn',
    title: 'Topic turns',
    lead: 'The coached turns of the Learn section, in order. Each turn hands the learner a topic to reason about, lets them commit, then the coach lands the point — steered by your guidance for that topic.',
    bridgeTitle: 'Each turn is a topic',
    bridge: 'The <b>signpost</b> and <b>task prompt</b> are delivered VERBATIM. While the learner works it, the coach holds its teaching to one probe; then it opens the teach turn with your exact <b>talk it through</b> line and lands the point. Flag <b>has a right answer</b> for a graded turn (like a legal one) and give its <b>through-line</b>.',
  });
  Object.assign(byId('scene'), {
    group: 'practice',
    title: 'The live scene',
    lead: 'The Practice section: an optional live action console the arc ends in. The learner steps in and decides what to DO; the coach voices the scene, narrates a calibrated consequence, then debriefs. Toggle it on to author it.',
  });
  Object.assign(byId('voice'), {
    group: 'voicetone',
    title: 'Voice and tone',
    lead: 'Who the coach is and how it sounds — one stance carried through every Learn turn and the Practice debrief. The detailed voice rules (short bubbles, banned phrases) are locked; this tunes the persona.',
  });

  /* =======================================================================
     2) TURN LANGUAGE — a V2 renderer for the topic-turns section, plus a
        lint-text pass, so the author never reads the internal word "phase".
        (The schema key stays `phases` — same data, same compiler, V1-safe.)
     ======================================================================= */
  const origRenderFields = T.renderFields;
  T.renderFields = function (sec, H) {
    if (sec.id === 'scene') return renderSceneV2(H);       // + the cast (character models)
    if (sec.id === 'playbook') return renderPlaybookV2(H); // + per-component source
    if (sec.id !== 'phases') {
      const box = origRenderFields.call(T, sec, H);
      // Sweep "phase" out of any labels/helpers the original renderers wrote
      // (e.g. the reflection helper's "…previewing the next phase").
      box.querySelectorAll('vaadin-text-field, vaadin-text-area').forEach((el) => {
        if (el.helperText) el.helperText = turnify(el.helperText);
        if (el.label) el.label = turnify(el.label);
      });
      return box;
    }
    const { tf, rowsBlock, rowCard, esc, scheduleUpdate } = H;
    const box = document.createElement('div');
    box.className = 'fields';
    box.append(rowsBlock('phases', (p, i, onDel) => {
      const ra = document.createElement('vaadin-checkbox');
      ra.label = 'This turn has a right answer (graded — the coach lands the conclusion, never hedges)';
      ra.checked = !!p.hasRightAnswer;
      const onRA = () => { p.hasRightAnswer = !!ra.checked; scheduleUpdate(); };
      ra.addEventListener('change', onRA);
      ra.addEventListener('checked-changed', onRA);
      return rowCard(`Turn ${i + 1}${p.label ? ' · ' + esc(p.label) : ''}`, onDel,
        tf(`phases.${i}.label`, 'Topic label', { placeholder: 'The Law' }),
        tf(`phases.${i}.signpost`, 'Signpost — the verbatim hand-off INTO this turn', { area: true, minRows: 2, helper: 'Shown word-for-word entering this turn.' }),
        tf(`phases.${i}.prompt`, 'Task prompt (delivered verbatim)', { area: true, minRows: 3, helper: 'What the learner reasons about.' }),
        ra,
        tf(`phases.${i}.talkItThrough`, '"Talk it through" line (coach speaks this verbatim to open its teaching)', { area: true, minRows: 2 }),
        tf(`phases.${i}.probeExample`, 'Example Socratic probe (optional)', { area: true, minRows: 2, helper: 'A model of the ONE probe the coach may use before it teaches.' }),
        tf(`phases.${i}.throughLine`, 'Through-line (right-answer turns — what every learner must hear)', { area: true, minRows: 2 }),
        tf(`phases.${i}.throughLineSource`, 'Through-line source (audit trail)', { helper: 'Where this ideal traces back to — a deck slide, policy §, or SME note. Never compiled into the prompt; carried in the JSON for compliance review.', placeholder: 'e.g. Deck slide 5 — OSHA 1910.147' }),
        tf(`phases.${i}.endNote`, 'Where the teaching lands (optional)', { area: true, minRows: 2, helper: 'A closing instruction for this turn\'s teaching — e.g. "END on the bystander bridge."' }),
        rowsBlock(`phases.${i}.calibration`, (t, j, onDelT) => rowCard(`Tier ${j + 1}`, onDelT,
          tf(`phases.${i}.calibration.${j}.tier`, 'Tier name', { placeholder: 'UNTHOUGHTFUL / NEUTRAL / STRONG' }),
          tf(`phases.${i}.calibration.${j}.guidance`, 'How to meet this answer', { area: true, minRows: 3 }),
        ), 'Add tier', () => ({ tier: '', guidance: '' })),
      );
    }, 'Add topic turn', () => ({ id: '', label: '', signpost: '', prompt: '', hasRightAnswer: false, talkItThrough: '', probeExample: '', calibration: [], throughLine: '', throughLineSource: '', endNote: '' })));
    return box;
  };

  /* V2 SCENE renderer — the original editor plus THE CAST: first-class
     character models (baseline / driver / when-then reactions / style),
     ported from the Roleplay type's reaction map. Fields compile via the
     type's shared compiler, so V1 and the live pages read the same prompt. */
  function renderSceneV2(H) {
    const { tf, rowsBlock, rowCard, guidance, esc, scheduleUpdate } = H;
    const s = H.getScenario();
    const arr2 = (x) => (Array.isArray(x) ? x : []);
    const box = document.createElement('div');
    box.className = 'fields';
    const on = document.createElement('vaadin-checkbox');
    on.label = 'This arc ends in a live practice scene';
    on.checked = !!(s.scene && typeof s.scene === 'object');
    const body = document.createElement('div');
    const renderScene = () => {
      body.innerHTML = '';
      if (!(s.scene && typeof s.scene === 'object')) return;
      // The toggle-on clone below bypasses normalize — make cast a real array.
      if (!Array.isArray(s.scene.cast)) s.scene.cast = [];

      const charField = document.createElement('vaadin-text-field');
      charField.setAttribute('theme', 'outlined');
      charField.label = 'Characters the coach voices (comma-separated)';
      charField.helperText = 'Who the coach speaks as in the scene — e.g. "Jake, Marshall". The first name is the default speaker. Leave blank for a scene with no named people.';
      charField.value = arr2(s.scene.characters).join(', ');
      const onChars = () => { s.scene.characters = String(charField.value || '').split(',').map((x) => x.trim()).filter(Boolean); scheduleUpdate(); };
      charField.addEventListener('input', onChars);
      charField.addEventListener('change', onChars);

      const countField = document.createElement('vaadin-number-field');
      countField.setAttribute('theme', 'outlined');
      countField.label = 'Learner actions before the debrief';
      countField.helperText = 'How many moves the learner makes (minimum 2): the first reacts to the scene, the last resolves it and hands to the debrief.';
      countField.min = 2; countField.step = 1;
      countField.value = String(Math.max(2, s.scene.actionCount || 2));
      const onCount = () => { const n = parseInt(countField.value, 10); s.scene.actionCount = (Number.isFinite(n) && n >= 2) ? n : 2; scheduleUpdate(); };
      countField.addEventListener('input', onCount);
      countField.addEventListener('change', onCount);

      const split = document.createElement('vaadin-checkbox');
      split.label = 'Split the learner\'s move into DO (narration) + SAY (spoken bubble)';
      split.checked = s.scene.sayDoSplit !== false;
      const onSplit = () => { s.scene.sayDoSplit = !!split.checked; scheduleUpdate(); };
      split.addEventListener('change', onSplit);
      split.addEventListener('checked-changed', onSplit);

      const composerRow = document.createElement('div');
      composerRow.className = 'row2';
      composerRow.append(
        tf('scene.inputPlaceholder', 'Composer placeholder', { placeholder: 'What do you do or say?', helper: 'The greyed prompt in the learner\'s input while they\'re in the scene.' }),
        tf('scene.lineCaption', 'Caption on the learner\'s move', { placeholder: 'You', helper: 'The small label over the learner\'s scene bubble.' }),
      );

      // THE CAST — v3.1 character models.
      const castBlock = rowsBlock('scene.cast', (c, i, onDel) => rowCard(
        `Character model ${i + 1}${c.name ? ' · ' + esc(c.name) : ''}`, onDel,
        tf(`scene.cast.${i}.name`, 'Name', { placeholder: 'Jake' }),
        tf(`scene.cast.${i}.baseline`, 'Baseline — who they are at rest', { area: true, minRows: 2, helper: 'Role, standing, how they carry themselves before anything happens.' }),
        tf(`scene.cast.${i}.driver`, 'Underlying driver', { area: true, minRows: 2, helper: 'The want or fear shaping every reaction. They never announce it.' }),
        rowsBlock(`scene.cast.${i}.reactions`, (r, j, onDelR) => rowCard(`Reaction ${j + 1}`, onDelR,
          tf(`scene.cast.${i}.reactions.${j}.when`, 'When the learner…', { placeholder: 'e.g. calls it out bluntly in front of the room' }),
          tf(`scene.cast.${i}.reactions.${j}.then`, '…they respond', { area: true, minRows: 2 }),
        ), 'Add reaction', () => ({ when: '', then: '' })),
        tf(`scene.cast.${i}.styleNotes`, 'Style notes & hard limits', { area: true, minRows: 2, helper: 'How they talk; what they never do — e.g. "short sentences, deflects with humor; never theatrical".' }),
      ), 'Add character model', () => ({ name: '', baseline: '', driver: '', reactions: [], styleNotes: '' }));

      body.append(
        guidance('The learner acts; the scene reacts', 'fa-masks-theater',
          'The composer asks "what do you do?" — input is split into a DO (narration) and SAY (bubble) channel. The coach voices the characters and narrates the calibrated consequence, then debriefs after the last action.'),
        tf('scene.place', 'Where the scene happens', { placeholder: 'break room' }),
        charField,
        guidance('The cast — character models the coach plays from', 'fa-id-badge',
          'Per named character: a <b>baseline</b>, the <b>underlying driver</b>, and a <b>when/then reaction map</b> — so reactions are driven by how the learner handles them, never random. Ported from the Roleplay type. The locked <b>character conduct floor</b> (see System guardrails) applies on top, whatever you write here.'),
        castBlock,
        tf('scene.pivot', 'Action pivot (verbatim coach line into the scene)', { area: true, minRows: 2 }),
        guidance('Setup beats — the moment the learner walks into', 'fa-clapperboard',
          'The locked beats shown as the learner steps in: usually a narration beat, the character\'s line, then the "what do you do?" ask. Speaker is <b>character</b>; kind is <b>narration</b> or <b>dialogue</b> (name the speaker for dialogue).'),
        rowsBlock('scene.setup', (b, i, onDel) => rowCard(`Beat ${i + 1}`, onDel,
          tf(`scene.setup.${i}.kind`, 'Kind (narration / dialogue)', { placeholder: 'narration' }),
          tf(`scene.setup.${i}.name`, 'Speaker name (dialogue only)', { placeholder: 'Jake' }),
          tf(`scene.setup.${i}.text`, 'The beat text (verbatim)', { area: true, minRows: 2 }),
        ), 'Add setup beat', () => ({ speaker: 'character', kind: 'narration', text: '' })),
        guidance('How the learner acts — the composer', 'fa-keyboard',
          'The learner types a free move each turn. Keep the DO/SAY <b>split</b> on for the signature v3 feel, or turn it off for a single verbatim bubble. Set how many moves the scene runs before it debriefs.'),
        composerRow,
        split,
        countField,
        tf('scene.escalationGuidance', 'What happens between the actions (the escalation)', { area: true, minRows: 3, helper: 'How the scene pushes back after the first action.' }),
        guidance('Outcomes — the calibrated consequence narration', 'fa-bolt',
          'Per tier, how the learner\'s action lands. This is the emphasized consequence beat that makes the choice feel real.'),
        rowsBlock('scene.outcomes', (o, i, onDel) => rowCard(`Outcome ${i + 1}`, onDel,
          tf(`scene.outcomes.${i}.tier`, 'Tier name', { placeholder: 'UNTHOUGHTFUL / NEUTRAL / STRONG' }),
          tf(`scene.outcomes.${i}.narration`, 'How it lands (narration)', { area: true, minRows: 2 }),
        ), 'Add outcome tier', () => ({ tier: '', narration: '' })),
        guidance('Action calibration — how the coach READS the first move', 'fa-gauge',
          'Per tier, what a weak / middling / strong first action looks like, so the coach picks the matching outcome above. Mirrors the topic-turn calibration tiers.'),
        rowsBlock('scene.actionCalibration', (t, i, onDel) => rowCard(`Tier ${i + 1}`, onDel,
          tf(`scene.actionCalibration.${i}.tier`, 'Tier name', { placeholder: 'UNTHOUGHTFUL / NEUTRAL / STRONG' }),
          tf(`scene.actionCalibration.${i}.guidance`, 'What this move looks like', { area: true, minRows: 2 }),
        ), 'Add action tier', () => ({ tier: '', guidance: '' })),
        tf('scene.silenceNote', 'Note on silence / non-action (optional)', { area: true, minRows: 2, helper: 'How to read a learner who does nothing — e.g. "Silence is never neutral." Folded into the action calibration.' }),
        tf('scene.beat2Guidance', 'Second-action guidance (under pressure)', { area: true, minRows: 2 }),
        tf('scene.debrief.talkItThrough', 'Debrief "talk it through" line (verbatim)', { area: true, minRows: 2 }),
        tf('scene.debrief.points', 'Debrief content', { area: true, minRows: 4, helper: 'What the post-scene coaching lands.' }),
      );
    };
    const onToggle = () => {
      if (on.checked && !(s.scene && typeof s.scene === 'object')) s.scene = JSON.parse(JSON.stringify(T.DEFAULT.scene));
      else if (!on.checked) s.scene = null;
      renderScene();
      scheduleUpdate();
    };
    on.addEventListener('change', onToggle);
    on.addEventListener('checked-changed', onToggle);
    renderScene();
    box.append(on, body);
    return box;
  }

  /* V2 PLAYBOOK renderer — the original two fields plus the audit-trail
     source per component (scenario-framework: "source references"). */
  function renderPlaybookV2(H) {
    const { tf, rowsBlock, rowCard } = H;
    const box = document.createElement('div');
    box.className = 'fields';
    box.append(rowsBlock('playbook', (p, i, onDel) => rowCard(`Component ${i + 1}`, onDel,
      tf(`playbook.${i}.title`, 'The point', { placeholder: 'e.g. Know what actually qualifies' }),
      tf(`playbook.${i}.body`, 'What it means / why it matters', { area: true, minRows: 2 }),
      tf(`playbook.${i}.source`, 'Source (audit trail)', { helper: 'Where this component traces back to — a deck slide, policy §, or SME note. Never compiled into the prompt.', placeholder: 'e.g. SME interview — must-know #2' }),
    ), 'Add component', () => ({ title: '', body: '', source: '' })));
    return box;
  }

  const turnify = (t) => String(t == null ? '' : t)
    .replace(/\bPhase (\d+)\b/g, 'Turn $1')
    .replace(/Practice→Learn phase\b/g, 'coached topic turn')
    .replace(/\bphases\b/g, 'topic turns')
    .replace(/\bphase\b/g, 'turn');
  const origLints = T.lints;
  T.lints = (s, api) => {
    const L = origLints.call(T, s, api).map((l) => ({ ...l, msg: turnify(l.msg), why: l.why ? turnify(l.why) : l.why }));
    /* V2-only checks — the framework's cast + provenance blocks. All info-
       tier: they guide toward the standard without blocking anyone. */
    const sc = s.scene;
    if (sc && typeof sc === 'object') {
      const named = arr(sc.characters).filter((c) => String(c || '').trim()).length;
      const modeled = arr(sc.cast).filter((c) => c && String(c.name || '').trim()).length;
      if (named && !modeled) L.push({ severity: 'info', section: 'scene',
        msg: 'The scene names characters but the cast has no character models.',
        why: 'A baseline, an underlying driver, and when/then reactions keep each person consistent turn to turn — the Roleplay reaction map, ported here.' });
    }
    arr(s.phases).forEach((p, i) => {
      if (p && p.hasRightAnswer && String(p.throughLine || '').trim() && !String(p.throughLineSource || '').trim()) {
        L.push({ severity: 'info', section: 'phases',
          msg: `Turn ${i + 1}'s through-line has no source reference.`,
          why: 'Audit trail — trace the graded ideal back to the course material or the SME who validated it.' });
      }
    });
    const pbs = arr(s.playbook).filter((p) => p && (String(p.title || '').trim() || String(p.body || '').trim()));
    const unsourced = pbs.filter((p) => !String(p.source || '').trim()).length;
    if (pbs.length && unsourced) L.push({ severity: 'info', section: 'playbook',
      msg: `${unsourced} of ${pbs.length} playbook components have no source reference.`,
      why: 'The close is the audit-defensible artifact — each component should trace to a deck slide, policy section, or SME note.' });
    return L;
  };

  /* =======================================================================
     3) THE WIZARD SPEC — brief → interview → staged generation.
     ======================================================================= */
  const arr = (x) => (Array.isArray(x) ? x : []);
  const lines = (v) => String(v || '').split('\n').map((x) => x.trim()).filter(Boolean);
  // The compiler drops these strings into sentences of its own ("You are
  // <persona>.", "a LIVE <place>") — strip trailing periods / leading
  // articles so template + generated text never collide.
  const depunct = (s) => String(s || '').trim().replace(/\.+$/, '');
  const noArticle = (s) => String(s || '').trim().replace(/^(the|a|an)\s+/i, '');
  const trim = (s, n) => { s = String(s || '').trim(); return s.length > n ? s.slice(0, n) + '\n[…source trimmed for length…]' : s; };
  const slug = (s, i) => (String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24) || ('turn' + (i + 1)));

  /* ---- exemplars, pulled live from the shipped Marshall DEFAULT ---------- */
  const D = T.DEFAULT;
  const EX = {
    establishing: JSON.stringify(D.establishing),
    reflection: JSON.stringify(D.reflection, null, 1),
    situation: (((D.intro || {}).audio || {}).text || '').split('\n\n').slice(0, 3).join('\n\n'),
    persona: (D.voice || {}).persona || '',
    turn: JSON.stringify(D.phases[0], null, 1),
    openTurn: JSON.stringify(D.phases[1], null, 1),
    scene: JSON.stringify((({ inputPlaceholder, lineCaption, sayDoSplit, actionCount, witnessed, ...rest }) => rest)(D.scene || {}), null, 1),
    playbook: JSON.stringify((D.playbook || []).slice(0, 3), null, 1),
    resources: JSON.stringify(D.resources, null, 1),
  };
  // Character-model craft exemplar comes from the ROLEPLAY type's shipped
  // build (Kendra) — its when/then reaction map is the pattern cast entries
  // port into Guided Arc. Loaded live, same never-drift rationale as above.
  const AP = window.AitheraStudio.get('action-practice');
  EX.reactionMap = AP ? JSON.stringify({ reactions: (AP.DEFAULT.reactions || []).slice(0, 3), styleNotes: AP.DEFAULT.styleNotes || '' }, null, 1) : '';

  /* ---- the shared system-prompt spine ------------------------------------
     This block IS the productized prompt-engineering: the craft rules that
     made the Marshall build work, stated once, applied to every generation
     call. Designers never see or write any of this. */
  const SYS_BASE =
`You are an expert learning-experience designer and prompt engineer for Aithera's GUIDED ARC engine — an AI-coached Learn/Practice scenario format. A learning designer has answered a plain-language interview; you translate their answers into scenario fields with shipped-quality craft.

You write TWO registers, and keeping them apart is everything:
- LEARNER-FACING LINES (signposts, task prompts, "talk it through" openers, scene beats, reflection prompt): the coach's SPOKEN voice. Short, warm, plain, direct — a sharp colleague who has run this training a hundred times, never an AI assistant. Contractions. No corporate-training diction. BANNED (and anything that pattern-matches them): "I hear you", "that's valid", "sit with that", "here's the thing", "let's unpack", "lean into", "hold space", "great question", "you're not alone in that", "does that resonate", "I want to gently push".
- GUIDANCE TO THE COACH (calibration tiers, feedback guidance, escalation, debrief points): dense INSTRUCTIONS a coach AI reads mid-conversation. Imperative, specific, semicolon-packed; name the misconceptions to counter head-on and the exact conclusion to land. Written ABOUT the learner, TO the coach.

Ground every field in the designer's interview answers and source material. Invent plausible texture (names, small details) when needed, but NEVER invent laws, statistics, or policy specifics that aren't in the source or common knowledge. Write names literally (no placeholders).

OUTPUT — return ONLY one JSON object matching the requested shape: no markdown fences, no commentary, start with { and end with }. Never emit a raw line break inside a JSON string — escape paragraph breaks as \\n\\n.`;

  /* ---- intake → user-message serialization ------------------------------- */
  function briefBlock(intake) {
    return `THE BRIEF
- Topic: ${intake.topic || '(unspecified)'}
- Working title: ${String(intake.title || '').trim() || '(none — propose one)'}
- Course it lives in: ${intake.course || '(unspecified)'}
- Target time on task: ~${intake.time || 10} minutes
- The learner is: ${intake.learnerRole || '(unspecified)'}
- Other people in the story (main person first): ${intake.characters || '(none named)'}`;
  }
  function interviewBlock(intake) {
    return `THE INTERVIEW
- The story the learner walks into: ${intake.story || '(unspecified)'}
- What every learner must walk away knowing:\n${lines(intake.mustKnows).map((x) => '  · ' + x).join('\n') || '  (unspecified)'}
- What people commonly get wrong or minimize: ${intake.misconceptions || '(unspecified)'}
- What a sharp, experienced person would say or do: ${intake.strongAnswer || '(unspecified)'}
- How the coach should come across: ${intake.coachVibe || '(designer left this to you — precise, warm peer)'}`;
  }
  function sourceBlock(intake, cap) {
    const s = trim(intake.sourceText, cap);
    return s ? `SOURCE MATERIAL (pasted by the designer — mine it for specifics, echo its facts, never contradict it):\n"""\n${s}\n"""` : 'SOURCE MATERIAL: none pasted — work from the interview alone.';
  }
  function foundationBlock(acc) {
    const f = acc.results.foundation || {};
    return `THE SCENARIO SO FAR (generated foundation — stay consistent with it)
- Title: ${f.title || ''}
- The learner plays: ${f.learnerRole || ''}
- Main character: ${f.characterName || '(none)'}
- THE SITUATION (all the coach knows): ${f.situationText || ''}`;
  }

  /* ---- task builders ------------------------------------------------------ */
  function foundationTask() {
    return {
      id: 'foundation',
      label: 'Foundation — story, framing & warm-up',
      detail: 'Title, situation narrative, establishing card, coach persona, reflection turn.',
      build(intake) {
        return {
          maxTokens: 1900,
          system: SYS_BASE + `

YOUR TASK — the scenario's FOUNDATION. Return this exact JSON shape:
{
 "title": "learner-facing scenario title, short",
 "framing": "lowercase phrase completing 'You facilitate …' — e.g. 'a scenario-based learning experience on workplace sex-based harassment and bystander intervention'",
 "characterName": "the main other person's first name, or empty string",
 "learnerRole": "who the learner plays, starting with the role in CAPS — e.g. 'a CO-WORKER who has witnessed …'",
 "establishing": {"eyebrow": "2-3 words", "title": "short human title", "sub": "one hook line under 20 words"},
 "openingImage": "one-line visual of the establishing moment",
 "introEyebrow": "small label over the situation card — e.g. 'The situation · listen or read along'",
 "introTitle": "the situation card's title, human, 3-6 words",
 "situationText": "250-400 words, SECOND PERSON ('You've been working alongside…'). The concrete history: who, what started, how it escalated, where it stands today — ending on the learner's uncertainty about their own role. This is EVERYTHING the coach will ever know about the setup, and it doubles as the narrated read-along script. Escape paragraph breaks as \\n\\n.",
 "voicePersona": "one sentence: the coach's stance, in the mold of the example below",
 "reflection": {"prompt": "the coach's verbatim opening line inviting a gut reaction — no right answer, no grading", "feedbackGuidance": "guidance TO the coach: calibration only, never evaluate; what to acknowledge, which misconception to gently note. MUST end by forbidding any hand-off/preview bubble — the app owns transitions."}
}

CRAFT EXEMPLAR (from the shipped gold-standard build — match its craft and density, NOT its topic):
- establishing: ${EX.establishing}
- situationText opening (note the concrete, escalating, second-person storytelling):\n"""${EX.situation}"""
- voicePersona: ${JSON.stringify(EX.persona)}
- reflection: ${EX.reflection}`,
          user: `${briefBlock(intake)}\n\n${interviewBlock(intake)}\n\n${sourceBlock(intake, 6000)}\n\nWrite the foundation JSON now.`,
        };
      },
      apply(json, draft, intake) {
        draft.title = String(intake.title || '').trim() || json.title || '';
        draft.course = String(intake.course || '').trim();
        draft.framing = depunct(json.framing);
        draft.characterName = json.characterName || '';
        draft.learnerRole = depunct(json.learnerRole);
        draft.learnerName = 'you';
        draft.elevatedStakes = !!intake.elevatedStakes;
        draft.establishing = { eyebrow: '', title: '', sub: '', ...(json.establishing || {}) };
        draft.openingImage = json.openingImage || '';
        // Context modality: default to the narrated-audio card (no asset needed);
        // the author can switch to video/reading in ① Scenario Context.
        draft.intro = {
          type: 'audio',
          video: { sound: true, scenes: [] },
          audio: { eyebrow: json.introEyebrow || 'The situation · listen or read along', title: json.introTitle || '', text: json.situationText || '' },
        };
        draft.voice = { persona: depunct(json.voicePersona), guidance: '' };
        draft.reflection = intake.includeReflection === false
          ? { prompt: '', feedbackGuidance: '' }
          : { prompt: (json.reflection || {}).prompt || '', feedbackGuidance: (json.reflection || {}).feedbackGuidance || '' };
      },
      doneNote(json) { return `“${json.title || 'untitled'}”`; },
    };
  }

  function turnTask(topic, i, topics, intake0) {
    return {
      id: 'turn' + (i + 1),
      label: `Topic turn ${i + 1} — “${topic}”`,
      detail: 'Signpost, task prompt, calibration tiers, through-line.',
      build(intake, acc) {
        const after = (i < topics.length - 1) ? `the next coached turn (“${topics[i + 1]}”)`
          : (intake.includeScene ? 'the LIVE PRACTICE SCENE — the learner will step in and act' : 'the close — this is the FINAL coached turn');
        const prev = topics.slice(0, i).map((t, j) => {
          const r = acc.results['turn' + (j + 1)] || {};
          return `- Turn ${j + 1} “${r.label || t}”: signpost ${JSON.stringify(r.signpost || '')}, talkItThrough ${JSON.stringify(r.talkItThrough || '')}`;
        }).join('\n');
        return {
          maxTokens: 1500,
          system: SYS_BASE + `

YOUR TASK — ONE coached TOPIC TURN of the Learn arc. The app hands the learner your signpost + task prompt verbatim; the learner commits to an answer; the coach may use ONE Socratic probe; then the coach teaches, opening with your verbatim "talk it through" line, steered by your calibration tiers. Return this exact JSON shape:
{
 "label": "2-4 word topic label",
 "signpost": "verbatim coach line handing INTO this turn — one sentence, varies from earlier signposts",
 "prompt": "the verbatim task: 2-3 sentences, second person, ends handing the learner a question to reason about",
 "hasRightAnswer": true|false,
 "talkItThrough": "verbatim one-sentence opener of the coach's teaching turn",
 "probeExample": "one model Socratic probe, ends in a question",
 "calibration": [ {"tier": "...", "guidance": "dense instructions to the coach for answers at this tier"}, ... ],
 "throughLine": "if hasRightAnswer: the compressed conclusion EVERY learner must hear; else empty string",
 "throughLineSource": "AUDIT TRAIL — a short pointer to what grounds the through-line: the exact source line ('Deck slide 5 — OSHA 1910.147 covers minor jam clearing') or the interview answer ('SME must-know #1'). NEVER invent a citation; empty string if nothing specific grounds it",
 "endNote": "optional: where the teaching lands / bridges (e.g. toward the practice scene) — else empty string"
}

TIER RULES:
- Decide hasRightAnswer from the topic: graded/factual/legal → true; personal/impact/judgment → false.
- Graded turns: exactly 3 tiers named UNTHOUGHTFUL / NEUTRAL / STRONG, plus a non-empty throughLine.
- Open turns: exactly 2 tiers named THIN / REAL, throughLine "".
- Tier guidance names the designer's real misconceptions and counters them head-on; each tier says where the coaching lands. Semicolon-packed, like the exemplar.

CRAFT EXEMPLARS (shipped gold standard — match craft and density, NOT topic):
A graded turn:\n${EX.turn}
An open turn:\n${EX.openTurn}`,
          user: `${foundationBlock(acc)}\n\nTHIS TURN — ${i + 1} of ${topics.length}: “${topic}”\nAfter this turn comes ${after}.\n${prev ? `\nEARLIER TURNS (do not reuse their openers or repeat their teaching):\n${prev}\n` : ''}\n${interviewBlock(intake)}\n\n${sourceBlock(intake, 3500)}\n\nWrite this turn's JSON now.`,
        };
      },
      apply(json, draft) {
        draft.phases.push({
          id: slug(json.label || topic, i),
          label: json.label || topic,
          signpost: json.signpost || '',
          prompt: json.prompt || '',
          hasRightAnswer: json.hasRightAnswer === true,
          talkItThrough: json.talkItThrough || '',
          probeExample: json.probeExample || '',
          calibration: Array.isArray(json.calibration) ? json.calibration.map((t) => ({ tier: String((t || {}).tier || ''), guidance: String((t || {}).guidance || '') })) : [],
          throughLine: json.throughLine || '',
          throughLineSource: json.throughLineSource || '',
          endNote: json.endNote || '',
        });
      },
      doneNote(json) { return `“${json.label || topic}” — ${json.hasRightAnswer ? 'graded, with a through-line' : 'open judgment turn'}`; },
    };
  }

  function sceneTask(topics) {
    return {
      id: 'scene',
      label: 'The live practice scene',
      detail: 'Setup beats, escalation, calibrated outcomes, debrief.',
      build(intake, acc) {
        const throughs = topics.map((t, j) => (acc.results['turn' + (j + 1)] || {}).throughLine).filter(Boolean).map((x) => '- ' + x).join('\n');
        return {
          maxTokens: 2000,
          system: SYS_BASE + `

YOUR TASK — the LIVE PRACTICE SCENE that ends the arc. The coach pivots the learner into a live moment; the app shows your setup beats verbatim; the learner ACTS (types what they do); the coach narrates a calibrated consequence, escalates once, takes a second action, then debriefs. Return this exact JSON shape:
{
 "place": "where it happens, 2-4 words",
 "pivot": "verbatim coach line handing the learner INTO the scene — tell them where they're stepping in and to step in when ready",
 "setup": [ {"speaker":"character","kind":"narration","text":"scene-setting beat"}, {"speaker":"character","kind":"dialogue","name":"FirstName","text":"only the spoken words"}, {"speaker":"character","kind":"narration","text":"beat that puts the learner on the spot and asks what they do — specifically"} ],
 "characters": ["main antagonist first", "others present"],
 "cast": [ {"name":"FirstName","baseline":"who they are at rest — role, standing, how they carry themselves","driver":"the underlying want or fear shaping every reaction (they never announce it)","reactions":[{"when":"a learner-move pattern","then":"how this person responds"}],"styleNotes":"how they talk; hard limits — what they never do"} ],
 "escalationGuidance": "instructions to the coach: how the antagonist pushes back after the learner's FIRST action — a dialogue beat plus a short hanging narration beat",
 "outcomes": [ {"tier":"UNTHOUGHTFUL","narration":"how a weak/no action lands"}, {"tier":"NEUTRAL","narration":"how a half-signal lands"}, {"tier":"STRONG","narration":"how a clear signal lands — the antagonist still pushes back"} ],
 "actionCalibration": [ {"tier":"UNTHOUGHTFUL","guidance":"what a weak first move looks like"}, {"tier":"NEUTRAL","guidance":"a middling move"}, {"tier":"STRONG","guidance":"a strong move"} ],
 "silenceNote": "how the coach should read doing nothing (never neutral) — one sentence",
 "beat2Guidance": "instructions to the coach: what a strong vs. weak SECOND action looks like under pressure",
 "debrief": {"talkItThrough": "verbatim opener of the post-scene debrief", "points": "instructions to the coach: an honest read of both actions (quote a word or two), the point that lands it, then the 2-4 named moves to carry forward"},
 "inputPlaceholder": "the composer's greyed prompt — e.g. 'What do you do or say?'"
}
RULES: setup is 2-4 beats and the LAST one ends on the ask; dialogue beats hold ONLY spoken words (actions go in narration beats); outcomes tiers mirror actionCalibration tiers.
CAST RULES: one model per named character (max 3) — INCLUDING the target/bystanders (how they react when defended, ignored, or spoken over matters as much as the antagonist's pushback). 2-3 when/then reactions each, spanning weak vs. strong learner handling; reactions in steps, never a one-line capitulation or a theatrical blow-up.
HARD LENGTH BUDGET — the reply is cut off if too long, so it MUST stay under 1500 tokens: every field ONE tight sentence (baseline/driver/styleNotes especially); when/then pairs under 25 words each; no field repeats another's content. Terse and dense beats complete-but-truncated.

CRAFT EXEMPLARS (shipped gold standard — match craft, NOT topic):
The scene:\n${EX.scene}
A character reaction map (from the shipped Roleplay build — the when/then pattern cast entries follow):\n${EX.reactionMap}`,
          user: `${foundationBlock(acc)}\n\nTHE COACHED TURNS ALREADY TAUGHT (the scene is where this knowledge gets USED; through-lines):\n${throughs || '(none captured)'}\n\nTHE DESIGNER'S SCENE INTENT
- Who the learner faces: ${intake.sceneWho || '(designer left it to you — use the main character)'}
- The moment they walk into: ${intake.sceneMoment || '(invent one consistent with the situation)'}
- How that person pushes back when challenged: ${intake.scenePushback || '(invent a realistic doubling-down)'}\n\n${sourceBlock(intake, 2500)}\n\nWrite the scene JSON now.`,
        };
      },
      apply(json, draft) {
        draft.scene = {
          place: noArticle(json.place) || 'scene',
          pivot: json.pivot || '',
          setup: Array.isArray(json.setup) ? json.setup.map((b) => {
            const o = { speaker: 'character', kind: (b && b.kind === 'dialogue') ? 'dialogue' : 'narration', text: String((b || {}).text || '') };
            if (b && b.name) o.name = String(b.name);
            return o;
          }) : [],
          inputPlaceholder: json.inputPlaceholder || 'What do you do or say?',
          lineCaption: 'You',
          sayDoSplit: true,
          actionCount: 2,
          characters: Array.isArray(json.characters) ? json.characters.map(String).filter(Boolean) : [],
          cast: Array.isArray(json.cast) ? json.cast.map((c) => ({
            name: String((c || {}).name || ''),
            baseline: String((c || {}).baseline || ''),
            driver: String((c || {}).driver || ''),
            reactions: Array.isArray((c || {}).reactions) ? c.reactions.map((r) => ({ when: String((r || {}).when || ''), then: String((r || {}).then || '') })) : [],
            styleNotes: String((c || {}).styleNotes || ''),
          })) : [],
          witnessed: true,
          escalationGuidance: json.escalationGuidance || '',
          outcomes: Array.isArray(json.outcomes) ? json.outcomes.map((o) => ({ tier: String((o || {}).tier || ''), narration: String((o || {}).narration || '') })) : [],
          actionCalibration: Array.isArray(json.actionCalibration) ? json.actionCalibration.map((t) => ({ tier: String((t || {}).tier || ''), guidance: String((t || {}).guidance || '') })) : [],
          silenceNote: json.silenceNote || '',
          beat2Guidance: json.beat2Guidance || '',
          debrief: { talkItThrough: (json.debrief || {}).talkItThrough || '', points: (json.debrief || {}).points || '' },
        };
      },
      doneNote(json) { return `${(json.characters || []).join(', ') || 'scene'} — ${(json.setup || []).length} setup beats, ${(json.cast || []).length} character models`; },
    };
  }

  function closeTask(topics) {
    return {
      id: 'close',
      label: 'The close — playbook & resources',
      detail: 'The guaranteed takeaways every learner leaves with.',
      build(intake, acc) {
        const throughs = topics.map((t, j) => (acc.results['turn' + (j + 1)] || {}).throughLine).filter(Boolean).map((x) => '- ' + x).join('\n');
        return {
          maxTokens: 1500,
          system: SYS_BASE + `

YOUR TASK — the guaranteed CLOSE, shown identically to EVERY learner after the conversation: the expert playbook and the resources list. The conversation personalizes; this standardizes. Return this exact JSON shape:
{
 "playbook": [ {"title": "short imperative point", "body": "1-2 sentences: what it means / why it matters", "source": "AUDIT TRAIL — where this traces back to: the source line ('Deck slide 6 — near-miss reporting is no-blame') or interview answer ('SME must-know #2'); empty string only if it is general craft with no specific source"} ],
 "resources": {"lead": "one coach sentence introducing where to turn", "items": [ {"title": "the place/person", "body": "what it offers and how to use it"} ]}
}
RULES: 5-8 playbook components — every must-know and through-line covered, plus the in-the-moment moves if there's a practice scene; titles short and imperative. 2-4 resources, REAL for this scenario's world (an internal role like HR or a safety officer, the org's own policy, a real public body). Never invent URLs or organizations, and NEVER fabricate a source citation — provenance is a compliance record.

CRAFT EXEMPLAR (shipped gold standard — match craft, NOT topic):
- playbook (first 3 of 9): ${EX.playbook}
- resources: ${EX.resources}`,
          user: `${foundationBlock(acc)}\n\nMUST-KNOWS (from the designer):\n${lines(intake.mustKnows).map((x) => '- ' + x).join('\n') || '(unspecified)'}\n\nTHROUGH-LINES TAUGHT IN THE TURNS:\n${throughs || '(none)'}\n\nPractice scene included: ${intake.includeScene ? 'YES — cover the in-the-moment moves' : 'no'}\n\n${sourceBlock(intake, 2500)}\n\nWrite the close JSON now.`,
        };
      },
      apply(json, draft) {
        draft.playbook = Array.isArray(json.playbook) ? json.playbook.map((p) => ({ title: String((p || {}).title || ''), body: String((p || {}).body || ''), source: String((p || {}).source || '') })) : [];
        const res = json.resources || {};
        draft.resources = { lead: String(res.lead || ''), items: Array.isArray(res.items) ? res.items.map((r) => ({ title: String((r || {}).title || ''), body: String((r || {}).body || '') })) : [] };
      },
      doneNote(json) { return `${(json.playbook || []).length} playbook components, ${((json.resources || {}).items || []).length} resources`; },
    };
  }

  /* ---- the spec ----------------------------------------------------------- */
  T.wizard = {
    title: 'Start from scratch — Guided Arc',
    intro: 'A short brief, an interview in your own words, then an AI-drafted scenario lands in the editor.',

    derive(intake) {
      if (!intake.time) intake.time = 10;
      intake._suggestTurns = intake.time >= 15 ? 3 : intake.time >= 10 ? 2 : 1;
    },

    steps: [
      {
        id: 'brief',
        title: 'The brief',
        sub: 'The high-level shape. Everything here can be changed in the editor afterwards.',
        fields: [
          { key: 'topic', kind: 'text', required: true, label: 'What is this scenario about?',
            placeholder: 'e.g. Bystander intervention in workplace harassment',
            helper: 'One line. This is the spine every generated field hangs on.' },
          { key: 'title', kind: 'text', label: 'Working title (optional)',
            helper: 'Leave blank and the draft proposes one.' },
          { key: 'course', kind: 'text', label: 'The course it lives inside (optional)',
            placeholder: 'e.g. Harassment Prevention for Employees', helper: 'Grounds the coach\'s register.' },
          { key: 'time', kind: 'chips', label: 'Target time on task', default: 10,
            options: [
              { value: 5, label: '~5 minutes', desc: 'Warm-up + 1 topic turn' },
              { value: 10, label: '~10 minutes', desc: 'Warm-up + 2 turns + live practice' },
              { value: 15, label: '~15 minutes', desc: 'Warm-up + 3 turns + live practice' },
            ] },
          { key: 'sourceText', kind: 'source', minRows: 7, label: 'Source material — paste anything (optional)',
            placeholder: 'An outline, slide text, a policy excerpt, SME notes, an old course script…',
            helper: 'The generator mines this for specifics instead of inventing them. More source = truer draft.' },
        ],
      },
      {
        id: 'interview',
        title: 'The interview',
        sub: 'Answer like you\'d brief a colleague — plain language, no prompt-writing. Your answers become the coaching guidance behind every turn.',
        fields: [
          { key: 'story', kind: 'area', required: true, minRows: 6, label: 'Tell the story the learner walks into',
            helper: 'Who\'s involved, what\'s been happening, how it\'s escalated. This becomes the situation the coach grounds every reply in.' },
          { key: 'learnerRole', kind: 'text', required: true, label: 'Who is the learner in this story?',
            placeholder: 'e.g. a co-worker who has watched it build for months' },
          { key: 'characters', kind: 'text', label: 'Who else is in the story? (comma-separated, main person first)',
            placeholder: 'e.g. Jake, Marshall' },
          { key: 'mustKnows', kind: 'lines', required: true, minRows: 4, label: 'What must every learner walk away knowing?',
            helper: 'One per line, 3–5. These become the through-lines the coach always lands and the closing playbook.' },
          { key: 'misconceptions', kind: 'area', required: true, minRows: 3, label: 'What do people commonly get wrong or minimize?',
            helper: 'The wrong takes you\'ve actually heard. These become the coaching guidance for weak answers.' },
          { key: 'strongAnswer', kind: 'area', minRows: 3, label: 'What would a sharp, experienced person say or do?',
            helper: 'The bar for a strong answer — the coach affirms and extends it.' },
          { key: 'topics', kind: 'lines', required: true, minRows: 3, label: 'The coached turns — what should the coach walk through, in order?',
            helper: (intake) => `One per line; each line becomes one coached turn (the learner works it, then the coach lands it). For ~${intake.time || 10} minutes we suggest ${intake._suggestTurns || 2} — e.g. “Does this legally qualify?”, “What is it doing to the person?”`,
          },
          { key: 'includeReflection', kind: 'toggle', default: true, label: 'Open with a gut-reaction warm-up (recommended)' },
          { key: 'includeScene', kind: 'toggle', default: (intake) => (intake.time || 10) >= 10,
            label: 'End in a live practice scene — the learner acts, the scene reacts' },
          { key: 'sceneWho', kind: 'text', showIf: (i) => !!i.includeScene, label: 'Who does the learner face in the scene?',
            placeholder: 'e.g. Jake — with Marshall present' },
          { key: 'sceneMoment', kind: 'area', minRows: 2, showIf: (i) => !!i.includeScene, label: 'The moment they walk into',
            helper: 'Where it happens and what\'s just been said or done.' },
          { key: 'scenePushback', kind: 'area', minRows: 2, showIf: (i) => !!i.includeScene, label: 'How does that person push back when challenged?',
            helper: 'The escalation between the learner\'s first and second move.' },
          { key: 'coachVibe', kind: 'text', label: 'How should the coach come across? (optional)',
            placeholder: 'e.g. warm but direct; knows employment law cold' },
          { key: 'elevatedStakes', kind: 'toggle', default: false,
            label: 'Crisis-adjacent topic — append the locked 988 support floor to the resources' },
        ],
      },
    ],

    /* A COMPLETE blank skeleton — the tasks fill it; nothing inherits from
       Marshall (merge-with-DEFAULT is exactly what we must avoid here). */
    start(type) {
      const d = type.blank();
      d.phases = [];
      d.scene = null;
      return d;
    },

    plan(intake) {
      const topics = lines(intake.topics).slice(0, 5);
      const tasks = [foundationTask()];
      topics.forEach((topic, i) => tasks.push(turnTask(topic, i, topics, intake)));
      if (intake.includeScene) tasks.push(sceneTask(topics));
      tasks.push(closeTask(topics));
      return tasks;
    },

    landNote() {
      return 'Draft generated — review Start → Learn → Practice, then run the guardrails and a playtest.';
    },
  };
})();
