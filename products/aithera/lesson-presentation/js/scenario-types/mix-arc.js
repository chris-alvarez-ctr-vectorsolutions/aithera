/* =========================================================================
   MIX & MATCH  ·  the composed-beat scenario type  (window.AitheraMixArc)
   -------------------------------------------------------------------------
   A scenario is an ORDERED LIST OF BEATS. Each beat carries exactly ONE
   interaction type — the content team's three:

     · coach-led  — reason WITH the coach (no character)          → world 'coaching'
     · roleplay   — speak to an in-scene character                → world 'scene'
     · observe    — watch a clip, then react with the coach       → world 'coaching' + media

   This is the STAKEHOLDER-CONFIRMED "mix & match": author sets the number of
   beats, ONE type per beat, and the turns-per-beat cap. It is deliberately a
   GENERALIZATION of ensemble-arc's phase model — a beat IS a phase, its `type`
   picks the ladder `world`, and it RIDES THE SAME LADDER RUNNER the branching /
   ensemble live pages already use (mix-arc-live.html). Nothing about the other
   seven types changes; this is purely additive.

   v1 scope: the three beat types above. The perception "Spot the hazard"
   coverage beat (scene-sweep) is a deliberate v1.1 follow-on — it needs a
   third world + the coverage runtime; not here yet.
   ========================================================================= */
(function () {
  'use strict';
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {};
  const arr = (x) => Array.isArray(x) ? x : [];
  const str = (x) => typeof x === 'string' ? x : '';

  /* ---- placeholder substitution ({{learner}} / {{character}}) ------------ */
  function fill(text, s) {
    return String(text == null ? '' : text)
      .replace(/\{\{\s*learner\s*\}\}/gi, (s && s.learnerName) || 'you')
      .replace(/\{\{\s*character\s*\}\}/gi, (s && s.characterName) || 'the character');
  }

  /* =======================================================================
     LOCKED ENGINE SECTIONS — reuse the shared safety engine from scenario.js
     so the JSON output contract matches the rest of the studio.
     ======================================================================= */
  const SHARED = (window.AitheraScenario && window.AitheraScenario.ENGINE_SECTIONS) || [];
  const ENGINE_SECTIONS = SHARED.length ? SHARED : [
    { id: 'contract', title: 'Output contract',
      text: () => 'OUTPUT CONTRACT — return ONLY a JSON object (no prose, no markdown fences). Start with { and end with }. Never emit a raw line break inside a JSON string — escape paragraph breaks in text values as \\n\\n:\n' +
        '{"turn":[{"speaker":"coach"|"character","kind":"coaching"|"dialogue"|"narration","text":"...","name":"..."}],"mode":"coaching"|"scene","inputTarget":"coach"|"character","complete":false}' },
  ];

  /* The locked CHARACTER CONDUCT FLOOR — same hard limits every in-scene
     character carries across the studio (mirrors guided / branching / ensemble).
     Compiled only when the scenario actually contains a roleplay beat. */
  const CONDUCT_SECTION = {
    id: 'conduct', title: 'Character conduct floor',
    note: 'Hard limits on every in-scene character — they hold whatever the author writes and however the learner behaves.',
    text: () =>
`CHARACTER CONDUCT FLOOR — LOCKED, applies to every character you voice, over and above any authored guidance:
- Characters may deflect, push back, or double down — but they are NEVER abusive, threatening beyond what the authored scenario itself establishes, sexually explicit, or demeaning, and always appropriate for a professional or educational learning audience.
- Keep every moment RECOVERABLE: however badly the learner plays a beat, a better next move can still land. Never write a character into an irreversible blow-up unless the authored arc calls for it.
- Characters stay human and specific — flawed, not villains, never a caricature or a stereotype of any group.
- If the learner's input drags a character toward any of these lines, de-escalate IN-WORLD (the character disengages, deflects, moves on) and keep the scene playable.`,
  };

  const MIX_ENGINE_SECTIONS = ENGINE_SECTIONS.concat([CONDUCT_SECTION]);

  /* The locked coach-voice block (kept in sync with the other types'). */
  const VOICE_BLOCK =
`VOICE — talk like a sharp, experienced human colleague who has run this training a hundred times, NOT like an AI assistant. This matters as much as the content.
- Be SHORT. Most coaching bubbles are one or two sentences. Cut every word that isn't pulling weight.
- Get to the point. No throat-clearing, no windup, no meta-narration of what you're about to do.
- BANNED phrases and their kin — never use these or anything that pattern-matches them: "I appreciate you being straight/honest with me", "I hear you", "that's valid", "sit with that", "sit with this", "here's the thing", "here's what I want you to notice", "let's pressure-test", "let's unpack", "lean into", "hold space", "a lot of people land right where you are", "great question", "you're not alone in that", "does that resonate", "I want to gently push".
- Don't over-affirm or flatter. One genuine, specific acknowledgment is plenty; then move.
- Warm but plain. Contractions, everyday words. Direct and a little blunt when the point matters.
- Vary how you open bubbles; don't start consecutive bubbles the same way.`;

  /* ---- the beat-type registry (one type per beat) ------------------------ */
  const BEAT_TYPES = [
    { id: 'coach-led', label: 'Coach-Led Inquiry', icon: 'fa-comments', world: 'coaching', accent: '#4FB3A3',
      hint: 'The learner reasons, decides, or plans WITH the coach. No character.' },
    { id: 'roleplay', label: 'Roleplay', icon: 'fa-masks-theater', world: 'scene', accent: '#A99BE0',
      hint: 'The learner steps into a live scene and speaks to a character you voice.' },
    { id: 'observe', label: 'Observe / React', icon: 'fa-film', world: 'coaching', accent: '#E0A53D',
      hint: 'The learner watches a clip, then reacts to what they saw with the coach.' },
  ];
  const TYPE_IDS = BEAT_TYPES.map((t) => t.id);
  const beatType = (id) => BEAT_TYPES.find((t) => t.id === id) || BEAT_TYPES[0];
  const worldFor = (id) => beatType(id).world;
  // Which beats are expanded in the editor — object refs, module-scoped so the
  // state survives the shell re-invoking renderFields. Collapsed by default so a
  // large scenario reads as a scannable outline.
  const BEAT_EXPANDED = new Set();

  /* =======================================================================
     THE DEFAULT SCENARIO — a compact three-beat exemplar that exercises ALL
     THREE beat types (coach-led → observe → roleplay). It is deliberately
     generic (a respectful-workplace situation, no course code) so it reads as
     a template, not a shipped course. "Reset to shipped" restores this, and the
     live page plays it when nothing is published.
     ======================================================================= */
  const SITUATION = 'You lead a small team. In this morning\'s stand-up, Dana — one of your senior engineers — cut off Priya twice while she was walking through her design, then re-explained her own point back to the room as if it were his. Priya went quiet for the rest of the meeting. A couple of people noticed; nobody said anything. Now the room is clearing out, and Dana is still at the table, packing up his laptop.';

  const DEFAULT = {
    v: 1,
    type: 'mix-arc',
    title: 'Speaking Up in the Moment',
    course: 'Respectful Workplace — a composed practice',
    learnerName: 'you',
    characterName: 'Dana',
    elevatedStakes: false,
    involvesMinors: false,
    framing: 'a short composed scenario on noticing and addressing disrespect at work — reason it through, watch it happen, then step in',
    learnerRole: 'the team lead — the person in the room with the standing to say something',

    establishing: {
      eyebrow: 'The scenario',
      title: 'Speaking Up in the Moment',
      sub: 'You saw it happen. Now decide what it was, watch it again, and step in before the room forgets.',
    },
    openingImage: 'Your team room after stand-up, most people gone, Dana still packing up at the table.',

    intro: { type: 'reading', video: { sound: true, scenes: [] },
             audio: { eyebrow: 'The scenario', title: 'Speaking Up in the Moment', text: SITUATION } },

    voice: { persona: 'a warm, steady peer coach — non-judgmental, affirming before redirecting, framing gaps as growth', guidance: '' },
    reflection: { enabled: true,
      prompt: 'Before we break this down — gut read: what just happened in that stand-up, and does it need anything from you?',
      feedbackGuidance: 'Whatever they say, take it as a calibration read, not an answer. Reflect it back in a line, name that we\'ll test it against what respect actually requires, and hand into the first beat. Never grade this.' },

    state: [],

    beats: [
      {
        id: 'name-it', label: 'Name what happened', level: 'Beat 1 · recognize', type: 'coach-led',
        maxTurns: 2,
        entry: { bridge: '', signpost: 'First, let\'s get precise. Dana talked over Priya twice, then took her point as his own. Is that just a rough meeting — or is it disrespect worth addressing? Make the call and say why.', prompt: '', beats: [], cta: 'Think it through' },
        inputPlaceholder: 'Make the call…',
        exitCriteria: 'the learner names the pattern (interrupting + taking credit) as disrespect worth addressing, not "just how meetings go", and can say why it matters (it silenced Priya and the room let it stand)',
        reactionGuidance: 'If they minimize it, don\'t lecture — ask one question that makes them look at Priya going quiet, or at who has to carry the cost if nobody names it.',
        hasRightAnswer: true,
        throughLine: 'Interrupting someone twice and re-voicing their idea as your own is a respect problem, not a style quirk — and the person with standing in the room owns addressing it.',
        character: { name: '', backstory: '', driver: '', reactions: [], styleNotes: '' },
        media: { segments: [], affectiveBeat: false, openingReaction: '' },
        calibration: [
          { tier: 'MINIMIZES', guidance: 'Calls it a personality clash or normal meeting friction. Draw out the cost to Priya and the room before teaching.' },
          { tier: 'NAMES-IT', guidance: 'Names it as disrespect and can say why. Affirm the read and move.' },
        ],
        debrief: { talkItThrough: 'Okay — say more about why that one lands as disrespect and not just a bad day.',
          points: 'Land that the pattern (interrupt + take credit) is the issue, that it had a target and a cost, and that noticing without acting is a choice too.' },
        transitions: [{ onTier: '', next: 'watch-it', set: {} }],
      },
      {
        id: 'watch-it', label: 'Watch it again', level: 'Beat 2 · observe', type: 'observe',
        maxTurns: 2,
        entry: { bridge: '', signpost: 'Here\'s the moment on tape. Watch it, then tell me what you notice this time — not just Dana, the whole room.', prompt: '', beats: [], cta: 'Watch the clip' },
        inputPlaceholder: 'What did you notice…',
        exitCriteria: 'the learner reads the WHOLE room, not just Dana — Priya\'s withdrawal, the bystanders who noticed and stayed quiet, and what the silence teaches the team',
        reactionGuidance: 'Probe one beat at a time toward whatever their read misses — usually the bystanders and what the silence signals.',
        hasRightAnswer: false, throughLine: '',
        character: { name: '', backstory: '', driver: '', reactions: [], styleNotes: '' },
        media: {
          segments: [
            { src: '', label: 'Stand-up, replayed', caption: 'The stand-up, replayed: Priya starts walking through her design; Dana cuts in twice, then restates her idea to the room as his. Priya stops talking. Two teammates glance at each other and look down.' },
          ],
          affectiveBeat: true,
          openingReaction: 'Sit with that for a second before we analyze it — watching it back, what stood out that you missed live?',
        },
        calibration: [
          { tier: 'DANA-ONLY', guidance: 'Only sees Dana. Point them at Priya and the two who noticed and said nothing.' },
          { tier: 'WHOLE-ROOM', guidance: 'Reads the room — Priya\'s withdrawal and the bystanders. Affirm and move to the step-in.' },
        ],
        debrief: { talkItThrough: 'So watching it back — what was the room actually teaching itself by letting that stand?',
          points: 'Land that the harm isn\'t only the interruption — it\'s the silence that follows and normalizes it, and that the room reads whether the lead responds.' },
        transitions: [{ onTier: '', next: 'step-in', set: {} }],
      },
      {
        id: 'step-in', label: 'Step in', level: 'Beat 3 · practice', type: 'roleplay',
        maxTurns: 5,
        entry: { bridge: '', signpost: '', prompt: '',
          beats: [
            { speaker: 'character', kind: 'narration', text: 'The room\'s empty now. Dana zips his bag, half-glancing at you like he\'s about to head out.' },
            { speaker: 'character', kind: 'dialogue', name: 'Dana', text: 'Good stand-up. I think we finally landed that design direction.' },
          ], cta: 'Say something to Dana' },
        inputPlaceholder: 'Say something to Dana…',
        exitCriteria: 'the learner names the specific behavior to Dana directly, keeps it about impact not character, and holds the line if he deflects — without humiliating him',
        reactionGuidance: 'Dana isn\'t a villain — he genuinely thinks it went well. If named directly and fairly, he gets a little defensive, then can hear it. If the learner is vague or accusatory, he brushes it off or gets prickly. Keep it recoverable.',
        hasRightAnswer: false, throughLine: '',
        character: {
          name: 'Dana', backstory: 'A strong senior engineer who\'s used to being the smartest voice in the room and doesn\'t track how much space he takes.',
          driver: 'He wants to be seen as the one who drives good outcomes — being told he stepped on someone reads, at first, as being told he\'s a bad guy.',
          reactions: [
            { when: 'named specifically and fairly, about impact', then: 'gets briefly defensive, then actually hears it' },
            { when: 'accused, labeled, or handled vaguely', then: 'deflects — "I was just trying to move us forward" — or gets prickly' },
          ],
          styleNotes: 'Confident, quick, a little blunt. Not cruel.',
        },
        media: { segments: [], affectiveBeat: false, openingReaction: '' },
        calibration: [
          { tier: 'AVOIDS', guidance: 'Softens it into nothing or doesn\'t address it. Debrief: the kind way is the clear way; name the behavior.' },
          { tier: 'ACCUSES', guidance: 'Leads with character ("you always"). Debrief: separate the behavior from the person so he can hear it.' },
          { tier: 'ADDRESSES', guidance: 'Names the specific behavior and its impact, stays steady if he deflects. Affirm — this is the move.' },
        ],
        debrief: { talkItThrough: 'Alright — walk me through what you were going for with Dana there.',
          points: 'Land the pattern that works: name the specific behavior, tie it to impact not identity, and hold the line calmly if he deflects — that\'s how you correct without making an enemy.' },
        transitions: [{ onTier: '', next: '', set: {} }],
      },
    ],

    playbook: [
      { title: 'Name the behavior, not the person', body: 'Address what was done ("you talked over Priya and restated her point") — not who they are ("you\'re dismissive"). Specific and behavioral is what someone can actually act on.' },
      { title: 'Silence is a message too', body: 'When disrespect goes unaddressed, the room learns it\'s allowed. The person with standing responding is what resets the norm.' },
      { title: 'Kind and clear are the same thing', body: 'Softening a correction into vagueness isn\'t kindness — it just leaves the problem in place. Clear, calm, and specific is the respectful move.' },
    ],
    resources: { lead: '', items: [] },
  };

  /* =======================================================================
     COMPILE — one system-prompt STRING, mirroring the ensemble/branching
     ladder contract so the live runner drives it unchanged. Beats compile in
     order; each branches on its type.
     ======================================================================= */
  function SBEAT_TXT(beats, s) {
    return arr(beats).filter((b) => b && str(b.text).trim()).map((b) => {
      const kind = b.kind === 'dialogue' ? 'dialogue' : 'narration';
      const who = kind === 'dialogue' ? (str(b.name).trim() || 'the character') : '';
      return `      · ${kind}${who ? ` (${who})` : ''}: "${fill(b.text, s)}"`;
    }).join('\n');
  }

  function compile(s) {
    s = normalize(s);
    const L = s.learnerName || 'you';
    const course = fill(s.course, s) || 'training';
    const voice = obj(s.voice);
    const refl = obj(s.reflection);
    const hasRefl = refl.enabled !== false && !!String(fill(refl.prompt, s)).trim();
    const beats = arr(s.beats).filter((b) => b && b.id);
    const situation = fill((obj(s.intro).audio || {}).text || s.openingImage || '', s).trim();
    const stateVars = arr(s.state).filter((v) => str(v.key).trim());
    const hasScene = beats.some((b) => worldFor(b.type) === 'scene');
    const parts = [];

    // 1) Framing + the two-world spine + the composed-beat premise.
    parts.push(
`You facilitate ${s.framing ? fill(s.framing, s) : 'a scenario-based learning experience'}, inside a ${course} course. The learner plays ${s.learnerRole ? fill(s.learnerRole, s) : `the role described below (addressed as "${L}")`}.

You are ${voice.persona ? fill(voice.persona, s) : 'a warm, steady peer coach — non-judgmental, affirming before redirecting, framing gaps as growth'}.${voice.guidance ? ' ' + fill(voice.guidance, s) : ''}

A COMPOSED SCENARIO — this experience is an ORDERED SET OF BEATS and each beat is exactly ONE kind of practice: a COACHING beat (the learner reasons with you), a SCENE beat (the learner acts opposite a character you voice), or an OBSERVE beat (the learner watches a clip, then reacts with you). The beats and their order are fixed and listed below; you run the live one.

TWO WORLDS — each beat lives in one:
- COACHING beats (coach-led and observe): you are the COACH, talking with the learner. Hold your teaching while they work the moment (Practice), then land the point (Learn).
- SCENE beats (roleplay): the learner steps into a LIVE moment and ACTS, opposite a character you voice. You never coach mid-scene; the learner acts, the scene reacts. Every scene beat still ENDS in coaching: when it closes, step back out and debrief.

THE RHYTHM (Practice ⇄ Learn): every beat alternates the learner WORKING the moment and you TEACHING. In Practice you HOLD your teaching — the value is that the learner commits before they hear the standard. When a beat closes, land its point completely; every learner must leave each beat with the same recognition even if their own play didn't surface it.

CONSEQUENCES CARRY FORWARD: how the learner handled an earlier beat is RECORDED (the tier you report) and written into the session STATE. Read the [SYSTEM STATE] line and let it shape later beats; never contradict it.

LOCKED vs DYNAMIC:
- The app OWNS the LOCKED beats (the reflection prompt, each beat's hand-off / scene open — listed below) and shows them VERBATIM. Do NOT write, quote, or paraphrase a locked beat — in the history they are tagged "owner":"app"; never repeat or rework an app-owned bubble.
- YOU write the DYNAMIC beats: all coaching, every character reaction, the verbatim "talk it through" opener of each debrief, and the closing recap + report.

FORMAT — every reply is the JSON object defined below and NOTHING else, on EVERY turn. The conversation so far is provided as prior assistant turns already in that JSON shape; continue the exact same format. Never reply as plain prose.`);

    // 1b) VOICE.
    parts.push(VOICE_BLOCK);

    // 2) Contract + action/tier + state line + scene/observe rules.
    const tierVocab = [...new Set(beats.flatMap((b) => arr(b.calibration).map((t) => String(t.tier || '').trim()).filter(Boolean)))];
    let contract = ENGINE_SECTIONS[0].text(s) + '\n\n' +
`ACTION FIELD — on every turn set a top-level "action" that states your INTENT:
- "action":"continue" → the beat is still live: a character reaction, or ONE short probing follow-up in a coaching/observe beat. Stay in the beat.
- "action":"teach" → you are CLOSING the beat (Learn): the debrief lands now. The app then advances — you never choose or announce what comes next.
- "action":"redirect" → the input was off-script/gibberish/a troll; re-ask gently, stay put.
TIER FIELD — whenever you set "action":"teach", ALSO set "tier" to the calibration tier that best matches the learner's handling of THIS beat${tierVocab.length ? ' — exactly one of: ' + tierVocab.map((t) => `"${t}"`).join(', ') : ''}. The app records it; report it honestly, never inflate, never invent other labels.
STATE LINE — every call ends with a "[SYSTEM STATE — …]" line: the live beat (its world and any counterpart), learner turns used vs. this beat's cap, tiers recorded so far${stateVars.length ? ', and the session state (' + stateVars.map((v) => v.label || v.key).join(' · ') + ')' : ''}. It is the source of truth — obey it. When it says the cap is reached, you MUST set "action":"teach" this turn.

SCENE BEATS (roleplay beats only) — when the learner is acting, your reply is made of scene-world beats, and you MUST keep two channels SEPARATE:
- SPOKEN WORDS → a "dialogue" beat: {"speaker":"character","kind":"dialogue","name":"<who>"}. One speaker per beat; only what is said.
- EVERYTHING ELSE (what happens, the room, what a move sets in motion) → a "narration" beat: {"speaker":"character","kind":"narration"}. No name.
Never merge a spoken line into narration. DO NOT RE-NARRATE THE LEARNER: the app already shows what they did and said — your beats REACT, starting from the moment AFTER their move.

OBSERVE BEATS — the app SHOWS the learner the clip on screen as a card in the thread (a video, or the moment written out) right before this beat opens. React to what is on that card; never invent footage that isn't there, and NEVER tell the learner to go watch a video elsewhere — it is already in front of them. Probe their read one beat at a time.

FOR THIS MODULE:
- Coaching / observe messages are {"speaker":"coach","kind":"coaching"}. Never emit "you" beats — the learner's own action is shown by the app.
- "emotionalState" is NEVER shown — omit it.

BUBBLES — split every COACHING turn into 2-3 SHORT separate messages in turn[] (one thought per bubble — acknowledge / sharpen / land). The app reveals them one at a time.`;
    parts.push(contract);

    // 3) Locked beats verbatim (situation + reflection + per-beat hand-off).
    const lockedBlocks = [];
    const groundLines = [`    THE SITUATION: "${situation}"`];
    if (hasRefl) groundLines.push(`    Coach: "${fill(refl.prompt, s)}"`);
    lockedBlocks.push(
`ALREADY DELIVERED before the conversation starts — the learner just read THE SITUATION${hasRefl ? ', then the app showed your reflection prompt' : ' and the app is opening the first beat now'}. Ground your coaching in these details (don't repeat them back):
${groundLines.join('\n')}`);
    beats.forEach((b, i) => {
      const e = obj(b.entry);
      const lines = [];
      if (str(e.bridge).trim()) lines.push(`    Coach: "${fill(e.bridge, s)}"`);
      if (str(e.signpost).trim()) lines.push(`    Coach: "${fill(e.signpost, s)}"`);
      if (str(e.prompt).trim()) lines.push(`    Coach: "${fill(e.prompt, s)}"`);
      if (arr(e.beats).length) lines.push(SBEAT_TXT(e.beats, s));
      lockedBlocks.push(`BEAT ${i + 1} hand-off (app-owned; shown when the app advances to "${b.id}") →\n${lines.join('\n') || '    (no locked hand-off — the app opens straight into the beat)'}`);
    });
    parts.push('LOCKED BEATS (app-owned — shown to the learner VERBATIM; never write or repeat these yourself):\n\n' + lockedBlocks.join('\n\n'));

    // 4) The arc, beat by beat.
    const arcParts = [];
    arcParts.push(`THE ARC — ${hasRefl ? 'reflection, then ' : ''}${beats.length} composed beats in order, then the close.`);
    if (hasRefl) arcParts.push(
`REFLECTION (Learn, no evaluation):
- ${refl.feedbackGuidance ? fill(refl.feedbackGuidance, s) : 'Respond to the learner\'s gut read with 2-3 short bubbles — calibration only, never evaluation.'} Set "action":"teach" (no tier — nothing is graded here); the app then opens Beat 1. (If the input is off-script, set "action":"redirect" and re-ask instead.)`);
    beats.forEach((b, i) => {
      const t = b.type;
      const isFinal = i === beats.length - 1;
      const cap = Math.max(1, b.maxTurns || 3);
      const d = obj(b.debrief);
      const label = fill(b.label || b.id, s).toUpperCase();
      const teachTail = isFinal
        ? ' Set "action":"teach" with the tier, then COMPLETE this same turn: complete:true with the closing recap (see COMPLETION).'
        : ' Set "action":"teach" with the tier — the app then advances and shows the next locked hand-off; never preview or announce it.';
      const closer = `- CLOSING the beat: your FIRST coaching bubble is EXACTLY "${fill(d.talkItThrough, s)}", then 2-3 bubbles that land: ${fill(d.points, s)}${teachTail}`;

      if (t === 'roleplay') {
        const c = obj(b.character);
        const who = fill(c.name || b.counterpart || '', s) || 'the character';
        arcParts.push(
`BEAT ${i + 1} · ${label} (${fill(b.level || '', s)}) — LIVE SCENE, opposite ${who}, up to ${cap} learner actions:
- The app has already shown the locked scene open. On each learner move that leaves the beat unfinished, reply with SCENE beats only (mode:"scene") and set "action":"continue". ${fill(b.reactionGuidance || 'React in-world to what they actually did; keep the moment recoverable.', s)}
- The beat is DONE when ${fill(b.exitCriteria || 'the learner has handled the moment', s)} — or when the state line says the cap is reached.
${closer.replace('FIRST coaching bubble', 'FIRST — emit 1-2 scene beats that settle the moment, THEN step back to coaching (mode:"coaching"). Your first coaching bubble')}`);
      } else if (t === 'observe') {
        const m = obj(b.media);
        const segs = arr(m.segments).filter((sc) => sc && (str(sc.src).trim() || str(sc.caption).trim() || str(sc.label).trim()));
        const footage = segs.length
          ? '\n  THE FOOTAGE (react only to what is here):\n' + segs.map((sc, k) => `  ${k + 1}. ${str(sc.label).trim() || 'Clip ' + (k + 1)}${str(sc.caption).trim() ? ' — ' + fill(sc.caption, s) : ''}`).join('\n')
          : '';
        const affective = m.affectiveBeat
          ? ` Open by validating the gut reaction${str(m.openingReaction).trim() ? ' — deliver this line first, close to verbatim: "' + fill(m.openingReaction, s) + '"' : ' ("what stood out watching it back?")'} BEFORE any analysis.`
          : '';
        arcParts.push(
`BEAT ${i + 1} · ${label} (${fill(b.level || '', s)}) — OBSERVE / REACT, up to ${cap} learner turns:
- The clip is on screen in front of the learner (a card in the thread — do not describe it back or send them to watch it elsewhere).${affective} This is PRACTICE — probe their read one beat at a time; if it leaves the criteria below unmet, ask ONE short question that ENDS IN A CLEAR QUESTION and set "action":"continue"; do NOT teach yet.${footage}
- The beat is DONE when ${fill(b.exitCriteria || 'the learner has read the moment fully', s)} — or when the state line says the cap is reached.
${closer}`);
      } else { // coach-led
        const right = b.hasRightAnswer && str(b.throughLine).trim()
          ? ` There IS a correct answer here — ${fill(b.throughLine, s)} Hold it during Practice; state it plainly when you teach.`
          : '';
        arcParts.push(
`BEAT ${i + 1} · ${label} (${fill(b.level || '', s)}) — COACHING practice, up to ${cap} learner turns:
- The app hands the learner the locked task. This is PRACTICE — the learner works it first. If their answer leaves the criteria below unmet, reply with ONE short probing follow-up that ENDS IN A CLEAR QUESTION and set "action":"continue" — draw out what's missing; do NOT teach yet.${right}
- The beat is DONE when ${fill(b.exitCriteria || 'the learner has committed to a real answer', s)} — or when the state line says the cap is reached.
${closer}`);
      }
    });
    parts.push(arcParts.join('\n\n'));

    // 5) Characters (collected from roleplay beats).
    const chars = beats.filter((b) => b.type === 'roleplay' && str(obj(b.character).name).trim())
      .map((b) => ({ ...obj(b.character), beat: b.label || b.id }));
    if (chars.length) {
      parts.push('THE CHARACTERS — play each from their model. Reactions are DRIVEN by how the learner treats them — never random, never scripted regardless of input:\n\n' +
        chars.map((c) => {
          const lines = [`${fill(c.name, s)} (in "${fill(c.beat, s)}"):`];
          if (str(c.backstory).trim()) lines.push(`- Who they are: ${fill(c.backstory, s)}`);
          if (str(c.driver).trim()) lines.push(`- Underlying driver: ${fill(c.driver, s)} — let it shape every reaction; they never announce it.`);
          arr(c.reactions).filter((r) => r && (str(r.when).trim() || str(r.then).trim()))
            .forEach((r) => lines.push(`- ${fill(r.when, s)} → ${fill(r.then, s)}`));
          if (str(c.styleNotes).trim()) lines.push(`- Style: ${fill(c.styleNotes, s)}`);
          return lines.join('\n');
        }).join('\n\n'));
    }

    // 6) Calibration.
    const calBlocks = beats.map((b, i) => {
      const tiers = arr(b.calibration).filter((t) => str(t.tier).trim());
      if (!tiers.length) return '';
      return `BEAT ${i + 1} · ${fill(b.label || b.id, s)}:\n` + tiers.map((t) => `- ${String(t.tier).trim()}: ${fill(t.guidance, s)}`).join('\n');
    }).filter(Boolean);
    if (calBlocks.length) parts.push('CALIBRATION — read the learner\'s handling of each beat against these tiers; they drive your within-beat reactions, your debrief, and the tier you report:\n\n' + calBlocks.join('\n\n'));

    // 7) Locked floors.
    if (hasScene) parts.push(CONDUCT_SECTION.text());
    const CRISIS_FLOOR = (window.AitheraScenario && window.AitheraScenario.CRISIS_FLOOR) || null;
    if (s.elevatedStakes && CRISIS_FLOOR) parts.push(CRISIS_FLOOR.body);

    // 8) Completion / playbook.
    const pb = arr(s.playbook).filter((p) => p && (str(p.title).trim() || str(p.body).trim()));
    parts.push(
`COMPLETION — when the FINAL beat closes, set complete:true on that same teach turn and add a short, personal closing recap in the coach voice: name what the learner actually did well across the beats and the one thing to carry forward. Keep it to a few sentences.${pb.length ? ' The results screen then shows the authored playbook — do NOT recite it here.' : ''}`);

    return parts.join('\n\n');
  }

  /* =======================================================================
     NORMALIZE / VALIDATE / BLANK / MERGE
     ======================================================================= */
  const TIER = (t) => { t = obj(t); return { tier: str(t.tier), guidance: str(t.guidance) }; };
  const TRANS = (t) => { t = obj(t); return { onTier: str(t.onTier), next: str(t.next), set: obj(t.set) }; };
  const SBEAT = (b) => { b = obj(b); return { speaker: 'character', kind: b.kind === 'dialogue' ? 'dialogue' : 'narration', name: str(b.name), text: str(b.text) }; };
  const SEG = (sc) => { sc = obj(sc); return { src: str(sc.src), label: str(sc.label), caption: str(sc.caption) }; };
  const REACT = (r) => { r = obj(r); return { when: str(r.when), then: str(r.then) }; };
  const SVAR = (v) => { v = obj(v); return { key: str(v.key).trim(), label: str(v.label), initial: str(v.initial) }; };

  function normBeat(b) {
    b = obj(b);
    const e = obj(b.entry);
    const type = TYPE_IDS.includes(b.type) ? b.type : 'coach-led';
    const c = obj(b.character);
    const m = obj(b.media);
    return {
      id: str(b.id).trim(),
      label: str(b.label),
      level: str(b.level),
      type,
      maxTurns: Number.isFinite(b.maxTurns) ? Math.max(1, b.maxTurns) : 3,
      entry: {
        bridge: str(e.bridge), signpost: str(e.signpost), prompt: str(e.prompt),
        beats: arr(e.beats).map(SBEAT), cta: str(e.cta),
      },
      inputPlaceholder: str(b.inputPlaceholder),
      exitCriteria: str(b.exitCriteria),
      reactionGuidance: str(b.reactionGuidance),
      hasRightAnswer: b.hasRightAnswer === true,
      throughLine: str(b.throughLine),
      character: { name: str(c.name), backstory: str(c.backstory), driver: str(c.driver), reactions: arr(c.reactions).map(REACT), styleNotes: str(c.styleNotes) },
      media: { segments: arr(m.segments).map(SEG), affectiveBeat: m.affectiveBeat === true, openingReaction: str(m.openingReaction) },
      calibration: arr(b.calibration).map(TIER),
      debrief: { talkItThrough: str(obj(b.debrief).talkItThrough), points: str(obj(b.debrief).points) },
      transitions: arr(b.transitions).map(TRANS),
    };
  }

  function normalize(s) {
    s = obj(s);
    const out = { ...s };
    out.v = 1;
    out.type = 'mix-arc';
    out.title = str(out.title);
    out.course = str(out.course);
    out.characterName = str(out.characterName);
    out.learnerName = (str(out.learnerName)) ? out.learnerName : 'you';
    out.elevatedStakes = out.elevatedStakes === true;
    out.involvesMinors = out.involvesMinors === true;
    out.framing = str(out.framing);
    out.learnerRole = str(out.learnerRole);
    out.establishing = { eyebrow: '', title: '', sub: '', ...obj(out.establishing) };
    out.openingImage = str(out.openingImage);

    const intro = obj(out.intro);
    intro.type = ['video', 'audio', 'reading', 'none'].includes(intro.type) ? intro.type : 'none';
    const vid = obj(intro.video);
    intro.video = { sound: vid.sound !== false, scenes: arr(vid.scenes).map((sc) => ({ src: '', caption: '', ...obj(sc) })) };
    intro.audio = { eyebrow: '', title: '', text: '', ...obj(intro.audio) };
    out.intro = intro;

    out.voice = { persona: '', guidance: '', ...obj(out.voice) };
    out.reflection = { prompt: '', feedbackGuidance: '', ...obj(out.reflection), enabled: obj(out.reflection).enabled !== false };
    out.state = arr(out.state).map(SVAR).filter((v) => v.key);
    out.beats = arr(out.beats).map(normBeat);
    if (!out.beats.length) out.beats = [normBeat({ type: 'coach-led' })];
    const seen = {};
    out.beats.forEach((b, i) => { let id = b.id || ('beat' + (i + 1)); while (seen[id]) id = id + 'x'; seen[id] = 1; b.id = id; });

    out.playbook = arr(out.playbook).map((p) => ({ title: '', body: '', ...obj(p) }));
    const res = obj(out.resources);
    out.resources = { lead: str(res.lead), items: arr(res.items).map((r) => ({ title: '', body: '', ...obj(r) })) };
    return out;
  }

  function isValid(s) {
    return !!(s && s.type === 'mix-arc' && s.title &&
      Array.isArray(s.beats) && s.beats.length &&
      s.beats.every((b) => b && typeof b.id === 'string' && TYPE_IDS.includes(b.type)) &&
      s.reflection && typeof s.reflection === 'object' && Array.isArray(s.playbook));
  }

  function blankBeat(type) {
    return normBeat({ id: '', label: '', level: '', type: type || 'coach-led', maxTurns: 3,
      entry: { bridge: '', signpost: '', prompt: '', beats: [], cta: '' },
      inputPlaceholder: '', exitCriteria: '', reactionGuidance: '',
      calibration: [], debrief: { talkItThrough: '', points: '' }, transitions: [] });
  }

  function blank() {
    return normalize({
      v: 1, type: 'mix-arc',
      title: '', course: '', characterName: '', learnerName: 'you',
      elevatedStakes: false, involvesMinors: false, framing: '', learnerRole: '',
      establishing: { eyebrow: '', title: '', sub: '' }, openingImage: '',
      intro: { type: 'none', video: { sound: true, scenes: [] }, audio: { eyebrow: '', title: '', text: '' } },
      voice: { persona: '', guidance: '' },
      reflection: { enabled: true, prompt: '', feedbackGuidance: '' },
      state: [], beats: [blankBeat('coach-led')],
      playbook: [], resources: { lead: '', items: [] },
    });
  }

  function merge(draft) {
    const base = clone(DEFAULT);
    return normalize({ ...base, ...obj(draft) });
  }

  /* =======================================================================
     toRuntime — the mix-arc RUNTIME MODEL: map the authored beats onto the
     tier-ladder `phases[]` the shared player (js/sim-player.js) drives. A beat
     IS a phase; its `type` picks the ladder `world`; a roleplay beat's
     character becomes the scene counterpart. Because every curated recipe funnels
     through toMixArc() into a mix-arc scenario, this is THE runtime mapping the
     converged player uses for all types (scenario-live.html). Pairs with
     compile(): the type owns both its prompt AND its runtime shape.
     ======================================================================= */
  function toRuntime(rawScenario) {
    const g = normalize(rawScenario);
    const worldForType = (t) => (t === 'roleplay' ? 'scene' : 'coaching');
    const phases = arr(g.beats).map((b) => Object.assign({}, b, {
      world: worldForType(b.type),
      counterpart: b.type === 'roleplay' ? (obj(b.character).name || '') : '',
      entry: Object.assign({ bridgesByTier: {} }, b.entry),
    }));
    return Object.assign({}, g, {
      phases,
      opening: [obj(g.reflection).prompt].filter((t) => String(t || '').trim()).map((t) => fill(t, g)),
      sceneLineCaption: 'You',
    });
  }

  /* ---- highlightStrings — every authored string, for prompt highlighting -- */
  function highlightStrings(s) {
    s = normalize(s);
    const out = [];
    const push = (x) => { const v = String(x == null ? '' : x).trim(); if (v) out.push(v); };
    push(s.framing); push(s.learnerRole); push((s.voice || {}).persona); push((s.voice || {}).guidance);
    push((s.intro.audio || {}).text); push(s.openingImage); push((s.reflection || {}).prompt); push((s.reflection || {}).feedbackGuidance);
    arr(s.beats).forEach((b) => {
      push(b.label); push(b.level); push(b.exitCriteria); push(b.reactionGuidance); push(b.throughLine);
      push(b.entry.bridge); push(b.entry.signpost); push(b.entry.prompt); push(b.entry.cta);
      arr(b.entry.beats).forEach((x) => push(x.text));
      push(b.debrief.talkItThrough); push(b.debrief.points);
      arr(b.calibration).forEach((t) => { push(t.tier); push(t.guidance); });
      const c = b.character; push(c.name); push(c.backstory); push(c.driver); push(c.styleNotes);
      arr(c.reactions).forEach((r) => { push(r.when); push(r.then); });
      arr(b.media.segments).forEach((sc) => { push(sc.label); push(sc.caption); });
      push(b.media.openingReaction);
    });
    arr(s.playbook).forEach((p) => { push(p.title); push(p.body); });
    return out;
  }

  /* =======================================================================
     LINTS
     ======================================================================= */
  const empty = (x) => !String(x == null ? '' : x).trim();
  function lints(s) {
    s = normalize(s);
    const out = [];
    const add = (severity, section, message, why) => out.push({ severity, section, message, why });

    if (empty(s.title)) add('warn', 'basics', 'No title.', 'The scenario needs a name for the picker and the results screen.');
    if (empty(s.framing)) add('info', 'basics', 'No framing.', 'One line on what this scenario is about — it opens the coach\'s system prompt.');

    const refl = s.reflection || {};
    if (refl.enabled !== false && empty(refl.prompt)) add('info', 'reflection', 'Warm-up is on but has no prompt.', 'Write the opening gut-read line, or turn the warm-up off to open straight on the first beat.');

    const beats = arr(s.beats);
    if (!beats.length) add('err', 'beats', 'The scenario has no beats.', 'A composed scenario needs at least one beat.');
    const ids = beats.map((b) => b.id);
    beats.forEach((b, i) => {
      const n = i + 1;
      const nm = b.label || b.id;
      if (empty(b.exitCriteria)) add('warn', 'beats', `Beat ${n} (${nm}) has no exit criteria.`, 'What "done" means — it drives the coach\'s probing and the tier it reports.');
      if (empty((b.debrief || {}).talkItThrough)) add('warn', 'beats', `Beat ${n} (${nm}) has no "talk it through" line.`, 'The coach opens the debrief with this word-for-word.');
      if (!arr(b.calibration).filter((t) => !empty(t.tier)).length) add('info', 'beats', `Beat ${n} (${nm}) has no calibration tiers.`, 'Tiers tell the coach how to read a weak / strong pass and which tier to report.');
      if (b.type === 'roleplay' && empty(obj(b.character).name)) add('warn', 'beats', `Beat ${n} (${nm}) is a roleplay with no character.`, 'Name and sketch the character the learner speaks to — a roleplay beat needs someone to face.');
      if (b.type === 'observe' && !arr(obj(b.media).segments).filter((sc) => !empty(sc.caption) || !empty(sc.src)).length) add('warn', 'beats', `Beat ${n} (${nm}) is an observe beat with no clip.`, 'Add at least one segment (a video src or a described caption) for the learner to watch.');
      arr(b.transitions).forEach((t) => {
        if (!empty(t.next) && !ids.includes(t.next)) add('warn', 'beats', `Beat ${n} routes to "${t.next}", which isn\'t a beat id.`, 'A transition\'s "next" must match another beat\'s id (blank = the next beat in order).');
      });
    });

    // CONSISTENCY — a character the learner is sent to face in a roleplay beat
    // should have been ESTABLISHED (named in the situation or an earlier beat),
    // not appear cold. Mirrors the on-stage guardrail on guided / ensemble.
    const situationText = fill((obj(s.intro).audio || {}).text || s.openingImage || '', s).toLowerCase();
    beats.forEach((b, i) => {
      if (b.type !== 'roleplay') return;
      const name = str(obj(b.character).name).trim();
      if (!name) return;
      const earlier = situationText.includes(name.toLowerCase()) ||
        beats.slice(0, i).some((q) => JSON.stringify(q).toLowerCase().includes(name.toLowerCase()));
      if (!earlier) add('info', 'beats', `${name} appears cold in beat ${i + 1}.`, 'The learner meets this character for the first time in a live scene. Consider naming them in the situation or an earlier beat so the confrontation isn\'t out of nowhere.');
    });

    if (!arr(s.playbook).filter((p) => !empty(p.title) || !empty(p.body)).length) add('info', 'playbook', 'No playbook.', 'The guaranteed takeaways every learner leaves with — the compliance close that pairs with the personalized practice.');
    return out;
  }

  /* =======================================================================
     THE EDITOR — sections + renderFields. Reuses the studio spine; the BEATS
     section is a bespoke reorderable composer (the shared rowsBlock is
     add/remove only).
     ======================================================================= */
  const sections = [
    { id: 'basics', group: 'meta', icon: 'fa-id-card', title: 'Basics',
      lead: 'What this scenario is called, the course and premise it lives in, and the role the learner plays across the beats.' },
    { id: 'intro', group: 'context', stage: 'ENTER', icon: 'fa-book-open', title: 'Intro & situation',
      lead: 'How the scene is set before the beats begin — the modality (reading, audio, video, or none), the establishing card, and the situation the coach grounds on.',
      bridgeTitle: 'One door in, and the coach\'s only window',
      bridge: 'The intro modality is swappable. The <b>situation text</b> doubles as the read-along/narration script AND the coach\'s grounding — it never sees a video, so write there what it needs to know.' },
    { id: 'reflection', group: 'interaction', stage: 'ENTER', icon: 'fa-comment', title: 'Reflection',
      lead: 'An optional non-evaluated gut-read before the first beat. Its prompt is delivered VERBATIM; the coach calibrates it and hands straight into Beat 1 — it never grades it.' },
    { id: 'beats', group: 'interaction', stage: 'ENGAGE', icon: 'fa-layer-group', title: 'The beats',
      lead: 'The ordered mix of practice beats. Each beat is ONE type — coach-led, roleplay, or observe — runs to a turn cap, and ends in a debrief that lands its point for every learner. Add, reorder, and retype beats freely.',
      bridgeTitle: 'One type per beat, in the order you set',
      bridge: 'Pick the <b>type</b>, set the <b>turn cap</b>, write the verbatim <b>hand-off</b> and the <b>debrief</b>. A <b>roleplay</b> beat carries a character; an <b>observe</b> beat carries a clip; a <b>coach-led</b> beat can carry a right answer. This is the mix & match.' },
    { id: 'state', group: 'interaction', icon: 'fa-diagram-project', title: 'Cross-beat state (optional)',
      lead: 'Optional session memory that carries forward — a beat\'s transitions write it, later beats read it. Leave empty for a straight-through scenario.' },
    { id: 'voice', group: 'voicetone', stage: 'COACH', icon: 'fa-comment-dots', title: 'Coach voice',
      lead: 'A short persona and working style for the coach. The detailed voice rules (short bubbles, banned phrases) are locked; this tunes the stance.' },
    { id: 'playbook', group: 'debrief', stage: 'TAKEAWAYS', icon: 'fa-list-check', title: 'The playbook',
      lead: 'The expert-validated points every learner leaves with, identically, however the beats went. Shown after the personal results — never AI-generated.' },
    { id: 'resources', group: 'debrief', stage: 'TAKEAWAYS', icon: 'fa-hand-holding-medical', title: 'Resources',
      lead: 'Where the learner can really turn. Make these real for the scenario\'s world.',
      bridgeTitle: 'The locked crisis floor',
      bridge: 'When a scenario is flagged <b>elevated stakes</b>, the 988 crisis line is appended after your resources automatically.' },
    { id: 'guardrails', group: 'reference', icon: 'fa-lock', title: 'System guardrails', locked: true,
      lead: 'The strict JSON output contract and the character-conduct floor (applied whenever a roleplay beat is present). You can read them; you can\'t break them.' },
  ];

  function renderFields(sec, H) {
    const { tf, rowsBlock, rowCard, guidance, esc, scheduleUpdate } = H;
    const s = H.getScenario();
    const box = document.createElement('div');
    box.className = 'fields';

    const numField = (label, get, set, opts = {}) => {
      const nf = document.createElement('vaadin-number-field');
      nf.setAttribute('theme', 'outlined');
      nf.label = label;
      if (opts.helper) nf.helperText = opts.helper;
      nf.min = opts.min != null ? opts.min : 1; nf.step = 1;
      nf.value = String(get());
      const on = () => { const n = parseInt(nf.value, 10); set(Number.isFinite(n) && n >= nf.min ? n : nf.min); scheduleUpdate(); };
      nf.addEventListener('input', on); nf.addEventListener('change', on);
      return nf;
    };
    const row2 = (...kids) => { const r = document.createElement('div'); r.className = 'row2'; r.append(...kids); return r; };

    if (sec.id === 'basics') {
      const stakes = document.createElement('vaadin-checkbox');
      stakes.label = 'Elevated stakes — a wellbeing/crisis-adjacent scenario (adds the 988 crisis floor)';
      stakes.checked = !!s.elevatedStakes;
      const onStakes = () => { s.elevatedStakes = stakes.checked; scheduleUpdate(); };
      stakes.addEventListener('change', onStakes); stakes.addEventListener('checked-changed', onStakes);
      box.append(
        tf('title', 'Scenario title', { placeholder: 'Speaking Up in the Moment' }),
        tf('course', 'Course / context it lives in', { placeholder: 'Respectful Workplace' }),
        row2(
          tf('learnerName', 'Learner is addressed as', { placeholder: 'you' }),
          tf('characterName', 'Default character name (a {{character}} fallback)', { placeholder: 'Dana' }),
        ),
        tf('framing', 'Framing — what this scenario is about (opens the system prompt)', { area: true, minRows: 2, placeholder: 'a short composed scenario on noticing and addressing disrespect at work' }),
        tf('learnerRole', 'The role the learner plays across the beats', { area: true, minRows: 2, placeholder: 'the team lead — the person with the standing to say something' }),
        stakes,
      );
    }

    if (sec.id === 'intro') {
      box.append(
        guidance('The establishing card + the situation', 'fa-book-open',
          'The <b>situation</b> is the read-along/narration text AND the coach\'s grounding — write there what the coach needs to know, since it never sees a video. The establishing card is the title screen the learner lands on.'),
        tf('establishing.eyebrow', 'Card eyebrow', { placeholder: 'The scenario' }),
        tf('establishing.title', 'Card title', { placeholder: 'Speaking Up in the Moment' }),
        tf('establishing.sub', 'Card subtitle', { area: true, minRows: 2 }),
        tf('intro.audio.text', 'The situation (read-along / narration / coach grounding)', { area: true, minRows: 6, placeholder: 'You lead a small team. In this morning\'s stand-up…' }),
        tf('openingImage', 'Opening image note (what the learner sees on entry)', { area: true, minRows: 2 }),
      );
    }

    if (sec.id === 'reflection') {
      const on = document.createElement('vaadin-checkbox');
      on.label = 'Open with a non-evaluated reflection';
      on.checked = s.reflection.enabled !== false;
      const onCh = () => { s.reflection.enabled = on.checked; scheduleUpdate(); };
      on.addEventListener('change', onCh); on.addEventListener('checked-changed', onCh);
      box.append(on,
        tf('reflection.prompt', 'Reflection prompt (shown VERBATIM)', { area: true, minRows: 2 }),
        tf('reflection.feedbackGuidance', 'How the coach responds (calibration only, never graded)', { area: true, minRows: 3 }),
      );
    }

    if (sec.id === 'state') {
      box.append(guidance('Optional — memory that carries between beats', 'fa-diagram-project',
        'Declare a variable, give it a starting value, then write it in a beat\'s transitions. The [SYSTEM STATE] line carries the current value into every later beat. Most composed scenarios don\'t need this — leave it empty.'));
      box.append(rowsBlock('state', (v, i, onDel) => rowCard(`State variable ${i + 1}${v.label ? ' · ' + esc(v.label) : ''}`, onDel,
        tf(`state.${i}.key`, 'Key (a short handle transitions write)', { placeholder: 'danaTrust' }),
        tf(`state.${i}.label`, 'Label (how it reads on the state line)', { placeholder: 'Dana\'s openness' }),
        tf(`state.${i}.initial`, 'Starting value', { area: true, minRows: 2 }),
      ), 'Add state variable', () => ({ key: '', label: '', initial: '' })));
    }

    if (sec.id === 'beats') {
      box.append(guidance('One type per beat — click to open, drag order with ▲ ▼', 'fa-layer-group',
        'Each beat is <b>coach-led</b> (reason with the coach), <b>roleplay</b> (a live character scene), or <b>observe</b> (watch a clip, then react). Beats start collapsed so the whole scenario reads as an outline — click one to edit it. An amber dot flags a beat that\'s still missing something.'));

      // toolbar — count + expand/collapse all
      const toolbar = document.createElement('div');
      toolbar.style.cssText = 'display:flex;align-items:center;gap:10px;margin:4px 0 10px';
      const count = document.createElement('span');
      count.style.cssText = 'font:600 12px/1 var(--mono,ui-monospace,monospace);color:var(--ink-soft)';
      const flexSp = document.createElement('span'); flexSp.style.flex = '1';
      const txtBtn = (label, fn) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = label;
        b.style.cssText = 'background:none;border:1px solid var(--line);color:var(--ink-soft);font:600 12px inherit;padding:5px 10px;border-radius:7px;cursor:pointer';
        b.addEventListener('mouseenter', () => { b.style.color = 'var(--accent)'; b.style.borderColor = 'var(--accent)'; });
        b.addEventListener('mouseleave', () => { b.style.color = 'var(--ink-soft)'; b.style.borderColor = 'var(--line)'; });
        b.addEventListener('click', fn);
        return b;
      };
      toolbar.append(count, flexSp,
        txtBtn('Expand all', () => { arr(s.beats).forEach((x) => BEAT_EXPANDED.add(x)); paint(); }),
        txtBtn('Collapse all', () => { BEAT_EXPANDED.clear(); paint(); }));
      box.append(toolbar);

      const list = document.createElement('div');
      list.className = 'beat-list';
      box.append(list);

      // what a beat still needs to actually run — surfaced as the amber dot
      const beatGaps = (b) => {
        const g = [];
        if (!String(b.exitCriteria || '').trim()) g.push('exit criteria');
        if (!String((b.debrief || {}).talkItThrough || '').trim()) g.push('debrief opener');
        if (b.type === 'roleplay' && !String((b.character || {}).name || '').trim()) g.push('character');
        if (b.type === 'observe' && !arr((b.media || {}).segments).some((sc) => String(sc.caption || '').trim() || String(sc.src || '').trim())) g.push('a clip');
        return g;
      };

      const iconBtn = (icon, title, fn, disabled) => {
        const b = document.createElement('button');
        b.type = 'button'; b.title = title;
        b.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        b.style.cssText = 'flex:0 0 auto;background:none;border:0;color:var(--ink-faint);cursor:pointer;padding:7px;border-radius:6px;font-size:13px;line-height:1';
        if (disabled) { b.disabled = true; b.style.opacity = '.35'; b.style.cursor = 'default'; }
        else {
          b.addEventListener('mouseenter', () => { b.style.color = 'var(--ink)'; b.style.background = 'var(--surface-2)'; });
          b.addEventListener('mouseleave', () => { b.style.color = 'var(--ink-faint)'; b.style.background = 'none'; });
          b.addEventListener('click', fn);
        }
        return b;
      };

      // the header row — shared by collapsed + expanded; the left region toggles
      const beatHead = (b, i, beats, expanded) => {
        const bt = beatType(b.type);
        const head = document.createElement('div');
        head.style.cssText = 'display:flex;align-items:center;gap:10px;padding:11px 13px';

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.style.cssText = 'flex:1;min-width:0;display:flex;align-items:center;gap:10px;background:none;border:0;cursor:pointer;text-align:left;padding:0;color:inherit;font:inherit';
        const chev = document.createElement('i');
        chev.className = `fa-solid ${expanded ? 'fa-chevron-down' : 'fa-chevron-right'}`;
        chev.style.cssText = 'flex:0 0 auto;color:var(--ink-faint);font-size:12px;width:12px';
        const chip = document.createElement('span');
        chip.style.cssText = `flex:0 0 auto;font:600 11px/1 var(--mono,ui-monospace,monospace);color:${bt.accent};background:${bt.accent}1f;border:1px solid ${bt.accent}59;border-radius:99px;padding:4px 9px;white-space:nowrap`;
        chip.innerHTML = `<i class="fa-solid ${bt.icon}" style="margin-right:6px"></i>${i + 1} · ${esc(bt.label)}`;
        const hasLabel = !!String(b.label || '').trim();
        const label = document.createElement('span');
        label.style.cssText = `flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:${hasLabel ? 'var(--ink)' : 'var(--ink-faint)'}`;
        label.textContent = hasLabel ? b.label : '(untitled beat)';
        const meta = document.createElement('span');
        meta.style.cssText = 'flex:0 0 auto;color:var(--ink-soft);font-size:12px;white-space:nowrap';
        const cap = Math.max(1, b.maxTurns || 1);
        meta.textContent = `${cap} turn${cap > 1 ? 's' : ''}`;
        toggle.append(chev, chip, label, meta);
        const gaps = beatGaps(b);
        if (gaps.length) {
          const dot = document.createElement('span');
          dot.title = 'Still needs: ' + gaps.join(', ');
          dot.style.cssText = 'flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:var(--warn,#e0a53d)';
          toggle.append(dot);
        }
        toggle.addEventListener('click', () => { if (expanded) BEAT_EXPANDED.delete(b); else BEAT_EXPANDED.add(b); paint(); });
        head.append(toggle);

        head.append(
          iconBtn('fa-arrow-up', 'Move up', () => { if (i > 0) { const t = beats[i - 1]; beats[i - 1] = beats[i]; beats[i] = t; scheduleUpdate(); paint(); } }, i === 0),
          iconBtn('fa-arrow-down', 'Move down', () => { if (i < beats.length - 1) { const t = beats[i + 1]; beats[i + 1] = beats[i]; beats[i] = t; scheduleUpdate(); paint(); } }, i === beats.length - 1),
          iconBtn('fa-trash', 'Delete beat', () => { beats.splice(i, 1); BEAT_EXPANDED.delete(b); scheduleUpdate(); paint(); }, beats.length <= 1),
        );
        return head;
      };

      // the expanded body — the type selector + all authored fields
      const beatBody = (b, i) => {
        const body = document.createElement('div');
        body.style.cssText = 'padding:2px 14px 16px;border-top:1px solid var(--line)';

        // type selector — segmented (retype the beat)
        const typeRow = document.createElement('div');
        typeRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:14px 0';
        BEAT_TYPES.forEach((t) => {
          const active = b.type === t.id;
          const btn = document.createElement('button');
          btn.type = 'button'; btn.title = t.hint;
          btn.innerHTML = `<i class="fa-solid ${t.icon}" style="margin-right:6px;${active ? '' : 'color:' + t.accent}"></i>${t.label}`;
          btn.style.cssText = 'display:inline-flex;align-items:center;padding:7px 13px;border-radius:8px;font:600 13px inherit;cursor:' + (active ? 'default' : 'pointer') + ';' +
            (active ? 'background:var(--accent);color:var(--on-accent);border:1px solid var(--accent)' : 'background:var(--surface-2);color:var(--ink-soft);border:1px solid var(--line)');
          if (!active) btn.addEventListener('click', () => { b.type = t.id; scheduleUpdate(); paint(); });
          typeRow.append(btn);
        });
        body.append(typeRow);

        // shared fields
        body.append(
          row2(
            tf(`beats.${i}.label`, 'Beat label', { placeholder: 'Name what happened' }),
            tf(`beats.${i}.id`, 'Beat id (transitions point here)', { placeholder: 'name-it', helper: 'Auto-filled if blank.' }),
          ),
          tf(`beats.${i}.level`, 'Sub-label (optional)', { placeholder: 'Beat 1 · recognize' }),
          numField('Turn cap (learner turns before the coach must close the beat)', () => Math.max(1, b.maxTurns || 3), (n) => { b.maxTurns = n; }, { min: 1 }),
        );

        // hand-off (verbatim entry)
        body.append(guidance('The hand-off INTO this beat (app-owned, shown verbatim)', 'fa-right-to-bracket',
          'What the learner sees entering the beat. <b>Signpost</b> frames the task; a <b>bridge</b> advances time; for a roleplay, add the locked <b>opening beats</b> (a narration beat, then the character\'s first line).'));
        body.append(
          tf(`beats.${i}.entry.bridge`, 'Bridge (advance-the-story line, optional)', { area: true, minRows: 2 }),
          tf(`beats.${i}.entry.signpost`, 'Signpost / task line (shown on screen)', { area: true, minRows: 2 }),
        );
        if (b.type === 'roleplay') {
          body.append(rowsBlock(`beats.${i}.entry.beats`, (x, k, onDelX) => rowCard(`Opening beat ${k + 1}`, onDelX,
            tf(`beats.${i}.entry.beats.${k}.kind`, 'Kind (narration / dialogue)', { placeholder: 'narration' }),
            tf(`beats.${i}.entry.beats.${k}.name`, 'Speaker name (dialogue only)', { placeholder: 'Dana' }),
            tf(`beats.${i}.entry.beats.${k}.text`, 'The beat (verbatim)', { area: true, minRows: 2 }),
          ), 'Add opening scene beat', () => ({ speaker: 'character', kind: 'narration', text: '' })));
        }
        body.append(
          tf(`beats.${i}.entry.cta`, 'Continue-button label', { placeholder: b.type === 'observe' ? 'Watch the clip' : b.type === 'roleplay' ? 'Say something' : 'Think it through' }),
          tf(`beats.${i}.inputPlaceholder`, 'Composer placeholder', { placeholder: 'Respond…' }),
        );

        // TYPE-SPECIFIC block
        if (b.type === 'roleplay') {
          const c = b.character || (b.character = { name: '', backstory: '', driver: '', reactions: [], styleNotes: '' });
          body.append(guidance('The character', 'fa-user',
            'Who the learner faces. Reactions are driven by how they\'re treated — never random. The locked conduct floor applies on top, whatever you write.'));
          body.append(
            tf(`beats.${i}.character.name`, 'Character name', { placeholder: 'Dana' }),
            tf(`beats.${i}.character.backstory`, 'Who they are', { area: true, minRows: 2 }),
            tf(`beats.${i}.character.driver`, 'Underlying driver (shapes reactions; never announced)', { area: true, minRows: 2 }),
            rowsBlock(`beats.${i}.character.reactions`, (r, k, onDelR) => rowCard(`Reaction ${k + 1}`, onDelR,
              tf(`beats.${i}.character.reactions.${k}.when`, 'When the learner…', { placeholder: 'names it specifically and fairly' }),
              tf(`beats.${i}.character.reactions.${k}.then`, '…the character', { placeholder: 'gets briefly defensive, then hears it' }),
            ), 'Add reaction', () => ({ when: '', then: '' })),
            tf(`beats.${i}.character.styleNotes`, 'Voice / style notes', { placeholder: 'confident, quick, a little blunt' }),
          );
        } else if (b.type === 'observe') {
          const m = b.media || (b.media = { segments: [], affectiveBeat: false, openingReaction: '' });
          body.append(guidance('The clip', 'fa-film',
            'The clip the learner watches, then reacts to. The player SHOWS it on screen as a card right before the coach asks — a real <b>video</b> if you give a src, otherwise the <b>described moment</b> from the caption. Write the caption as the moment the learner sees. The affective beat validates the gut reaction before analysis.'));
          body.append(rowsBlock(`beats.${i}.media.segments`, (sc, k, onDelS) => rowCard(`Segment ${k + 1}`, onDelS,
            tf(`beats.${i}.media.segments.${k}.label`, 'Segment label', { placeholder: 'Stand-up, replayed' }),
            tf(`beats.${i}.media.segments.${k}.src`, 'Video src (optional — leave blank for a described clip)', { placeholder: '../assets/videos/clip.mp4' }),
            tf(`beats.${i}.media.segments.${k}.caption`, 'The moment, described — shown to the learner on screen (and what the coach reacts to)', { area: true, minRows: 3 }),
          ), 'Add segment', () => ({ src: '', label: '', caption: '' })));
          const aff = document.createElement('vaadin-checkbox');
          aff.label = 'Open with an affective beat ("how did that land?") before analysis';
          aff.checked = !!m.affectiveBeat;
          const onAff = () => { m.affectiveBeat = aff.checked; scheduleUpdate(); };
          aff.addEventListener('change', onAff); aff.addEventListener('checked-changed', onAff);
          body.append(aff, tf(`beats.${i}.media.openingReaction`, 'Opening reaction line (near-verbatim, if affective beat is on)', { area: true, minRows: 2 }));
        } else { // coach-led
          const hra = document.createElement('vaadin-checkbox');
          hra.label = 'This beat has a correct answer the coach states plainly when teaching';
          hra.checked = !!b.hasRightAnswer;
          const onHra = () => { b.hasRightAnswer = hra.checked; scheduleUpdate(); };
          hra.addEventListener('change', onHra); hra.addEventListener('checked-changed', onHra);
          body.append(hra, tf(`beats.${i}.throughLine`, 'The correct answer / through-line (held during practice, taught at close)', { area: true, minRows: 2 }));
        }

        // exit + reaction + calibration + debrief + transitions
        body.append(
          tf(`beats.${i}.exitCriteria`, 'Exit criteria — what "done" means', { area: true, minRows: 3 }),
        );
        if (b.type === 'roleplay' || b.type === 'observe') {
          body.append(tf(`beats.${i}.reactionGuidance`, b.type === 'roleplay' ? 'How the scene / character reacts turn to turn' : 'What to probe toward as they react', { area: true, minRows: 3 }));
        }
        body.append(guidance('Calibration — how the coach reads the pass', 'fa-gauge',
          'Per tier, what a weak / strong handling looks like. Drives the within-beat reactions, the debrief, and the tier the coach reports.'));
        body.append(rowsBlock(`beats.${i}.calibration`, (t, k, onDelT) => rowCard(`Tier ${k + 1}`, onDelT,
          tf(`beats.${i}.calibration.${k}.tier`, 'Tier name', { placeholder: 'MINIMIZES / NAMES-IT' }),
          tf(`beats.${i}.calibration.${k}.guidance`, 'How to read it + what the debrief must add', { area: true, minRows: 2 }),
        ), 'Add tier', () => ({ tier: '', guidance: '' })));
        body.append(
          tf(`beats.${i}.debrief.talkItThrough`, '"Talk it through" line (coach opens the debrief with this, verbatim)', { area: true, minRows: 2 }),
          tf(`beats.${i}.debrief.points`, 'What the debrief lands (every learner leaves with this)', { area: true, minRows: 3 }),
        );

        const idList = arr(s.beats).map((x) => x.id).filter(Boolean).join(', ') || '—';
        const stateVars = arr(s.state).filter((v) => String(v.key || '').trim());
        body.append(guidance('Transitions — where it goes next (optional)', 'fa-diagram-project',
          'Leave empty to advance straight to the next beat. Add a transition to branch on tier, or to write cross-beat state.'));
        body.append(rowsBlock(`beats.${i}.transitions`, (t, k, onDelT) => {
          if (!obj(t.set) || typeof t.set !== 'object') t.set = {};
          const kids = [
            tf(`beats.${i}.transitions.${k}.onTier`, 'On tier (blank = every path)', { placeholder: 'STRONG / NEUTRAL' }),
            tf(`beats.${i}.transitions.${k}.next`, 'Then go to beat id', { helper: 'Blank advances to the next beat in order. Ids: ' + idList }),
          ];
          stateVars.forEach((v) => kids.push(
            tf(`beats.${i}.transitions.${k}.set.${v.key}`, `Write "${v.label || v.key}"`, { area: true, minRows: 2, helper: 'What this state becomes on this path. Blank leaves it.' })));
          return rowCard(`Transition ${k + 1}`, onDelT, ...kids);
        }, 'Add transition', () => ({ onTier: '', next: '', set: {} })));

        return body;
      };

      const paint = () => {
        list.textContent = '';
        const beats = arr(s.beats);
        count.textContent = `${beats.length} beat${beats.length === 1 ? '' : 's'}`;
        beats.forEach((b, i) => {
          const bt = beatType(b.type);
          const card = document.createElement('div');
          card.style.cssText = `border:1px solid var(--line);border-left:3px solid ${bt.accent};border-radius:10px;background:var(--surface);margin-bottom:10px;overflow:hidden`;
          const expanded = BEAT_EXPANDED.has(b);
          card.append(beatHead(b, i, beats, expanded));
          if (expanded) card.append(beatBody(b, i));
          list.append(card);
        });
        const addRow = document.createElement('div');
        addRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:14px';
        BEAT_TYPES.forEach((bt) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.innerHTML = `<i class="fa-solid ${bt.icon}" style="margin-right:6px;color:${bt.accent}"></i>Add ${bt.label}`;
          btn.style.cssText = 'display:inline-flex;align-items:center;padding:8px 13px;border-radius:8px;font:600 13px inherit;cursor:pointer;background:var(--surface-2);color:var(--ink);border:1px dashed var(--line)';
          btn.addEventListener('mouseenter', () => { btn.style.borderColor = bt.accent; });
          btn.addEventListener('mouseleave', () => { btn.style.borderColor = 'var(--line)'; });
          btn.addEventListener('click', () => { const nb = blankBeat(bt.id); s.beats.push(nb); BEAT_EXPANDED.add(nb); scheduleUpdate(); paint(); });
          addRow.append(btn);
        });
        list.append(addRow);
      };

      paint();
    }

    if (sec.id === 'voice') {
      box.append(
        tf('voice.persona', 'Coach persona', { area: true, minRows: 2, placeholder: 'a warm, steady peer coach — affirming before redirecting' }),
        tf('voice.guidance', 'Extra working-style notes (optional)', { area: true, minRows: 2 }),
      );
    }

    if (sec.id === 'playbook') {
      box.append(guidance('The guaranteed takeaways', 'fa-list-check',
        'Every learner leaves with these, identically, however the beats went. Authored, never AI-generated — the compliance close.'));
      box.append(rowsBlock('playbook', (p, i, onDel) => rowCard(`Point ${i + 1}${p.title ? ' · ' + esc(p.title) : ''}`, onDel,
        tf(`playbook.${i}.title`, 'Title', { placeholder: 'Name the behavior, not the person' }),
        tf(`playbook.${i}.body`, 'Body', { area: true, minRows: 3 }),
      ), 'Add playbook point', () => ({ title: '', body: '' })));
    }

    if (sec.id === 'resources') {
      box.append(tf('resources.lead', 'Resources lead-in (optional)', { area: true, minRows: 2 }));
      box.append(rowsBlock('resources.items', (r, i, onDel) => rowCard(`Resource ${i + 1}${r.title ? ' · ' + esc(r.title) : ''}`, onDel,
        tf(`resources.items.${i}.title`, 'Title', { placeholder: 'HR / People team' }),
        tf(`resources.items.${i}.body`, 'Detail', { area: true, minRows: 2 }),
      ), 'Add resource', () => ({ title: '', body: '' })));
    }

    if (sec.id === 'guardrails') {
      MIX_ENGINE_SECTIONS.forEach((g) => {
        const d = document.createElement('div');
        d.className = 'rowcard lockcard';
        d.innerHTML = `<details><summary>${esc(g.title)}</summary><pre data-guardrail="${esc(g.id)}">${esc(g.text ? g.text(s) : '')}</pre></details>`;
        box.append(d);
      });
    }

    return box;
  }

  /* ---- the type object ---------------------------------------------------- */
  const TYPE = {
    id: 'mix-arc',
    label: 'Mix & Match',
    icon: 'fa-shapes',
    blurb: 'Compose a scenario beat by beat — coach-led, roleplay, and observe in any order.',
    DEFAULT,
    ENGINE_SECTIONS: MIX_ENGINE_SECTIONS,
    CONDUCT_SECTION,
    BEAT_TYPES,
    isValid,
    normalize,
    blank,
    merge,
    compile,
    toRuntime,
    fill,
    highlightStrings,
    previewUrl: () => 'scenario-live.html?type=mix-arc',   // [Option B] the converged generic player (stable URL; survives the sim-player extraction)
    sections,
    renderFields,
    lints,
    playtest: null,
  };

  // Live pages consume this global directly (the branching-arc pattern).
  window.AitheraMixArc = TYPE;

  if (window.AitheraStudio) {
    const S = window.AitheraStudio;
    TYPE.store = S.makeStore(S.makeKeys(TYPE.id), { isValid, normalize });
    S.register(TYPE);
  }
})();
