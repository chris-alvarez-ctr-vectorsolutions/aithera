/* =========================================================================
   WRITER-STUDIO SCENARIO TYPE — observe-react ("Observe / React")
   The learner does NOT act a line and there is NO character to roleplay.
   Instead they REVIEW authored footage of a scene in N segments and, between
   segments, an AI COACH probes what they saw against a RUBRIC — asking before
   it validates, one beat at a time. Nudge-then-advance keeps any beat from
   trapping the learner. The run ends on a SYNTHESIS beat (the GATE) that sets
   complete, and the close is a STATIC, writer-authored playbook + resources.

   THE CANONICAL SCHEMA (studio-only module — its live page uses inline data,
   so there is no back-compat constraint):
     { v:1, type:'observe-react',
       title,                                        // required
       segments:   [{ src, label, caption }],        // media spine + narration, 1+
       openers:    [{ segment, line }],              // scripted return line, 0+
       dimensions: [{ name, strong, weak }],         // THE RUBRIC the coach probes, 1+
       openingQuestion,                              // first prompt after the cold open
       gate: { mode:'soft'|'hard', requirement, nudgeOpen, nudgeConcrete, fallback },
       completion: { condition, note },              // how the synthesis exits
       playbook:  [{ title, body }],                 // OPTIONAL authored close
       resources: { lead, items:[{ title, body }] }  // OPTIONAL authored close
     }
   There is NO character and NO per-segment `probe`: the coach's probing is
   driven by the `dimensions` rubric + the compiled prompt + the scripted
   `openers`. The affective beat ("how did that make you feel?") is expressed
   as an `opener` line, not a schema primitive.

   compile(s) returns ONE system-prompt string. compile(DEFAULT) reads
   faithfully to hazmat-scene-practice.html's shipped intent (the I-65 tanker
   size-up), which is ported into DEFAULT below.

   The Observe/React turn contract is coach-only turns plus a top-level
   observeNext / complete flag:
     {"turn":[{"speaker":"coach"|"you","kind":"coaching","text":"..."}],
      "observeNext":true|false,"complete":true|false}

   Registers into window.AitheraStudio (the generic studio engine).
   ========================================================================= */
(function () {
  'use strict';
  if (!window.AitheraStudio) return;   // engine must load first
  const S = window.AitheraStudio;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* The general framing preamble — fixed engine text (was the writer's
     `framing` field + `coachVoice.rules`, now baked in). Everything specific
     to a scenario rides in the footage list, the rubric, and the openers. */
  const FRAMING_PREAMBLE =
    'You run an AI scene-analysis coaching module built as a "review the footage" study. ' +
    'The learner ("you") is REVIEWING authored footage of a real scene in segments; between segments an AI COACH probes what they saw — ' +
    'one beat at a time, asking before it validates, never giving a verdict up front. ' +
    'Never shame the people in the footage — frame it as "this is how scenes actually go wrong, and your job is to notice." ' +
    'Never introduce a character or roleplay: this is always a two-person conversation between the learner and the coach about what they observed. ' +
    'Keep each coach message to 2-4 sentences.';

  /* =======================================================================
     THE DEFAULT SCENARIO — the shipped HazMat scene-size-up exercise as
     authorable data in the canonical schema. compile(DEFAULT) reads faithfully
     to hazmat-scene-practice.html's SYSTEM_PROMPT and shipped runtime data.
     ======================================================================= */
  const DEFAULT = {
    v: 1,
    type: 'observe-react',
    title: 'Hazmat Scene Size-Up: I-65 Tanker Rollover',

    // The pre-entry ESTABLISHING CARD — the beat shown before the first
    // segment plays. Authored content: the live page renders these fields
    // verbatim (title falls back to the practice title when blank).
    establishing: {
      eyebrow: 'Scene size-up',
      title: 'I-65 Tanker Rollover',
      sub: 'A tanker went over on the interstate — and the scene you\'re about to watch was not run by the book. Watch how it really unfolded, then tell your AI coach what you saw: what was right, what wasn\'t, and what you\'d do differently.',
    },

    // The coach's opening line — on screen the moment the first (cold-open)
    // segment ends. Segment 1 has no opener; this carries its return.
    openingQuestion: 'What you just watched is how this scene actually unfolded — and parts of it should bother you. We\'ll get to that. First, the basics: what did you see on the tank\'s placard?',

    // The OBSERVE footage the learner reviews, in order. `label` grounds the
    // coach (and accessibility) in what's on screen; `caption` is read over
    // the clip. Segment 1 is the cold open.
    segments: [
      { src: '../../../assets/videos/hazmat_tankerScene.mp4',
        label: 'Segment 1: drone overview of the overturned tanker on I-65, with traffic still moving on both sides',
        caption: 'A tanker\'s gone over on I-65. Look at the traffic — still moving on both sides, just feet from the tank. On the barrel: a red diamond — 1993, Class 3.' },
      { src: '../../../assets/videos/hazmat_firstPerson.mp4',
        label: 'Segment 2: helmet-cam footage from the first firefighter in, walking up close to the leaking tank',
        caption: 'Now ride along with the first crew in. This is his helmet cam. That\'s as close as it looks — close enough to touch it.' },
      { src: '../../../assets/videos/hazmat_scene_3.mp4',
        label: 'Segment 3: the same scene run correctly — traffic diverted and crews staged upwind at distance',
        caption: 'Now picture the same scene, run right. Traffic stopped and turned around a half-mile back. Crews staged upwind, uphill, behind the rigs. The ERG open on the dash, HazMat rolling, and nobody inside 150 feet.' },
    ],

    // Scripted coach lines, delivered VERBATIM the moment the learner returns
    // from the named segment (1-based) — before the coach starts probing.
    // Segment 1 has no opener (its return is the openingQuestion). The
    // affective beat ("how did it feel") lives here, as segment 2's opener;
    // segment 3's opener asks the synthesis question the GATE checks.
    openers: [
      { segment: 2, line: 'Sit with that one for a second before we analyze anything. How did that video make you feel — was that distance reasonable?' },
      { segment: 3, line: 'That\'s the version that keeps everyone breathing. So bring it home: tomorrow this call drops and YOU\'RE first on scene. Walk me through your first moves.' },
    ],

    // THE RUBRIC — the dimensions the coach silently probes the learner's read
    // against. `strong` = what a sound size-up names; `weak` = the read the
    // footage should disprove (the old distractor).
    dimensions: [
      { name: 'Hazard ID',
        strong: 'reads the placard first — UN 1993, Class 3 flammable liquid — and uses that number to open the ERG',
        weak: 'approaches or guesses at the product before identifying it' },
      { name: 'Isolation',
        strong: 'closes the road in both directions and clears traffic to at least ERG Guide 128\'s 150-foot initial isolation',
        weak: 'leaves traffic or bystanders inside the isolation zone; works the tank before the perimeter' },
      { name: 'Positioning',
        strong: 'stages upwind, uphill, and back behind the rigs, and reads the placard from distance with binoculars',
        weak: 'approaches close enough to touch the tank, in structural gear, not on air' },
      { name: 'Notifications',
        strong: 'gets HazMat, law enforcement, and incident command rolling in parallel with the size-up',
        weak: 'delays the calls until after sizing up, or leaves them out' },
    ],

    // THE GATE — the final synthesis beat. `mode:'soft'` lets the coach accept
    // the fallback after two nudges and complete anyway; `'hard'` keeps
    // probing until the requirement is met.
    gate: {
      mode: 'soft',
      requirement: 'the learner answers the synthesis — "tomorrow you\'re first on scene, walk me through your first moves" — naming their own positioning at distance (upwind/uphill/back), closing the road both directions, opening the ERG, and the notifications (HazMat, law enforcement, incident command)',
      nudgeOpen: 'Think sequence — what do you do before you ever leave the rig?',
      nudgeConcrete: 'Placard through the windshield or binoculars. Stage upwind, uphill, at distance. Shut the road down both ways. Open the ERG for your isolation line. And get HazMat, law enforcement, and command rolling. Give me your version.',
      fallback: 'any partial size-up that names at least positioning and one other move',
    },

    // COMPLETION — what ends the run and how the coach closes it.
    completion: {
      condition: 'the learner has given their own first-arriving-officer moves (the gate)',
      note: 'Close with a short, personal affirmation of what the learner actually caught across the three segments — the placard, the uncleared traffic, the too-close approach, the corrected version — then set complete:true. Keep it to a few sentences; the results screen below is authored, not generated, so do not recite it.',
    },

    // ③ THE STATIC CLOSE — authored, never model-generated. Ported from
    // hazmat-scene-practice.html's corrected-scene takeaways (playbook) and
    // CHECKLIST (resources).
    playbook: [
      { title: 'Read the placard first', body: 'The UN number and hazard class — here, 1993 / Class 3 flammable liquid — is the one data point that unlocks the ERG and everything after it. Pull it before anything else pulls your attention.' },
      { title: 'Isolate before you approach', body: 'ERG Guide 128 calls for at least 150 feet of initial isolation in every direction. The first job on arrival isn\'t the tank — it\'s shutting the road down in both directions.' },
      { title: 'Trust the discomfort', body: '"Too close" isn\'t fear — it\'s your training trying to get your attention. When an approach feels wrong, fall back to the isolation line and read the placard from there with binoculars.' },
      { title: 'Stage upwind, uphill, and back', body: 'Position crews upwind, uphill, and behind the rigs at distance. Nobody goes near the product without chemical protection and air.' },
      { title: 'Make the calls in parallel', body: 'HazMat, law enforcement, and incident command roll while you size up — not after. They\'d rather stand down than arrive to a scene that\'s already gotten worse.' },
    ],
    resources: {
      lead: 'Reading the scene safely is the first job on any hazmat call — here\'s what to keep within reach for the next one:',
      items: [
        { title: 'The Emergency Response Guidebook (ERG)', body: 'Your fastest path from a placard number to a real isolation distance and initial response guide.' },
        { title: 'Placard & UN number reference', body: 'Hazard classes 1–9 at a glance, for when you can\'t get close enough to read small print.' },
        { title: 'Your regional HazMat team', body: 'Call early — they\'d rather roll and stand down than arrive to a scene that\'s already gotten worse.' },
      ],
    },
  };

  /* =======================================================================
     ENGINE SECTIONS — the locked contract shown read-only in Guardrails. The
     Observe/React output contract is coach-only turns plus TOP-LEVEL
     observeNext / complete flags. The shared off-script + learner-safety
     sections are borrowed from the action-practice engine so the writer sees
     they're handled; they're wrapped so their character-facing wording renders
     with a neutral token (this type has no character). Only the contract is
     compiled INTO the prompt from here — plus off-script/safety.
     ======================================================================= */
  const SHARED = (window.AitheraScenario && window.AitheraScenario.ENGINE_SECTIONS) || [];
  const sharedById = (id) => SHARED.find((g) => g.id === id);
  const wrapShared = (g) => g && {
    id: g.id, title: g.title, note: g.note,
    // Called by the shell as g.text(scenario); ignore the (character-less)
    // scenario and render with a neutral token so no "undefined" leaks in.
    text: () => g.text({ characterName: 'the person in the footage', learnerName: 'the learner' }),
  };

  const ENGINE_SECTIONS = [
    {
      id: 'or-contract',
      title: 'Output contract',
      note: 'The strict JSON shape every coach turn must return — coaching-only turns plus top-level observeNext / complete. The page can\'t render anything else.',
      text: () => 'Return ONLY JSON: {"turn":[{"speaker":"coach"|"you","kind":"coaching","text":"..."}],"observeNext":true|false,"complete":true|false}\n' +
        'observeNext and complete are TOP-LEVEL fields of the response object — never fields on turn[] items. Include BOTH on EVERY response (false when not applicable). observeNext:true belongs on exactly the response whose final coach message sends the learner to the next segment — never close a chapter in words without setting it, and never set it mid-beat.',
    },
  ].concat([wrapShared(sharedById('offscript')), wrapShared(sharedById('safety'))].filter(Boolean));

  /* =======================================================================
     THE COMPILER — writer fields + locked contract → the ONE system-prompt
     string. Reads faithfully to hazmat-scene-practice.html's SYSTEM_PROMPT
     when given DEFAULT: the general framing preamble + a footage list built
     from segments, the JSON contract, the rubric the coach probes against, a
     per-segment chapter structure (delivering the matching opener verbatim
     where present), the synthesis GATE with its soft/hard behavior, and the
     off-script + safety guardrails.
     ======================================================================= */
  function compile(s) {
    const segs = (s.segments || []).filter((sc) => sc && (sc.src || sc.caption || sc.label));
    const dims = (s.dimensions || []).filter((d) => d && (d.name || d.strong || d.weak));
    const gate = s.gate || {};
    const comp = s.completion || {};
    const handoff = (window.AitheraScenario && window.AitheraScenario.contextHandoff) ? window.AitheraScenario.contextHandoff(s) : '';

    // opener line keyed by the (1-based) segment it plays on return from.
    const openerFor = {};
    (s.openers || []).forEach((o) => {
      if (!o) return;
      const n = Number(o.segment);
      const line = String(o.line || '').trim();
      if (n >= 1 && line) openerFor[n] = line;
    });

    const parts = [];

    // 1. General framing preamble + the footage the coach is reacting to.
    parts.push(FRAMING_PREAMBLE);
    if (segs.length) {
      parts.push('THE FOOTAGE — the learner reviews these segments in order (react only to what is on screen; never invent footage that isn\'t here):\n' +
        segs.map((sc, i) => {
          const label = String(sc.label || '').trim() || `Segment ${i + 1}`;
          const cap = String(sc.caption || '').trim();
          return `${i + 1}. ${label}${cap ? ` — narration: "${cap}"` : ''}`;
        }).join('\n'));
    }

    // 2. Output contract.
    parts.push(ENGINE_SECTIONS[0].text(s));

    // 2b. Context handoff — when the scene is inherited from a previous LO.
    if (handoff) parts.push(handoff);

    // 3. The rubric the coach silently probes against.
    if (dims.length) {
      parts.push('WHAT TO PROBE FOR — as the learner describes what they saw, probe their read against these dimensions (never show them as scores or recite the list):\n' +
        dims.map((d, i) => `${i + 1}. ${String(d.name || `Dimension ${i + 1}`).toUpperCase()} — strong: ${String(d.strong || '').trim()}${d.weak ? `; weak: ${String(d.weak).trim()}` : ''}.`).join('\n') +
        '\nProbe one beat at a time and target whatever the learner\'s read is missing — never dump the whole rubric at once.');
    }

    // 4. Per-segment chapter structure.
    if (segs.length) {
      const bullets = segs.map((sc, i) => {
        const n = i + 1;
        const opener = openerFor[n];
        const isLast = i === segs.length - 1;
        if (i === 0) {
          return `- Segment 1 is the cold open — it has already played and the opening question is on screen. Probe the learner\'s first read against the rubric, validate/correct after they answer, then close the chapter (set observeNext:true) to play segment ${segs.length > 1 ? 2 : 1}.`;
        }
        let line = `- After segment ${n} plays,`;
        if (opener) line += ` open by delivering this line VERBATIM: "${opener}" Then`;
        else line += ' open by reacting to what just played. Then';
        if (isLast) {
          line += ' run THE GATE below (the synthesis beat).';
        } else {
          line += ` probe what they observed against the rubric, validate/correct after they answer, and close the chapter (set observeNext:true) to play segment ${n + 1}.`;
        }
        return line;
      }).join('\n');
      parts.push('CHAPTER STRUCTURE — set observeNext:true on the turn that CLOSES a chapter (never mid-beat); it tells the page to play the next segment:\n' + bullets);
    }

    // 5. The GATE — the synthesis beat + soft/hard behavior. The two-nudge cap
    // is a fixed engine floor (baked in as "AT MOST TWICE").
    const soft = gate.mode !== 'hard';
    let gateText = `THE GATE — the final beat, after the last segment, is the synthesis: ${String(gate.requirement || '').trim()}. ` +
      'If the answer is thin, nudge for the missing pieces AT MOST TWICE';
    const nudgeOpen = String(gate.nudgeOpen || '').trim();
    const nudgeConcrete = String(gate.nudgeConcrete || '').trim();
    if (nudgeOpen || nudgeConcrete) {
      gateText += ` (first open${nudgeOpen ? ` — "${nudgeOpen}"` : ''}; then concrete${nudgeConcrete ? ` — "${nudgeConcrete}"` : ''})`;
    }
    gateText += soft
      ? `, then accept even "${String(gate.fallback || 'a partial answer').trim()}" and complete anyway — never trap the learner in a loop.`
      : ', then keep probing the missing pieces until the requirement is met before completing.';
    gateText += ' The scenario is complete only when this beat lands: on that final validating turn set "complete":true (and observeNext false). Never set complete before the synthesis beat.';
    if (String(comp.note || '').trim()) gateText += '\n' + String(comp.note).trim();
    parts.push(gateText);

    // 6. Off-script handling + learner safety.
    if (ENGINE_SECTIONS[1]) parts.push(ENGINE_SECTIONS[1].text(s));
    if (ENGINE_SECTIONS[2]) parts.push(ENGINE_SECTIONS[2].text(s));

    // 7. The authored close — the page shows it; the coach must not recite it.
    const pb = (s.playbook || []).filter((p) => p && String(p.title || '').trim());
    if (pb.length) {
      parts.push(`AFTER COMPLETION the learner is automatically shown an authored playbook (${pb.map((p) => `"${String(p.title).trim()}"`).join(', ')}) and a resources list — the page guarantees this, and it is authored, not generated. Your closing message stays short and personal; do NOT recite the playbook or list resources yourself.`);
    }

    return parts.filter(Boolean).join('\n\n');
  }

  /* ---- prompt highlighter ----------------------------------------------- */
  function highlightStrings(s) {
    const out = [];
    const push = (v) => { const t = String(v ?? '').trim(); if (t.length > 2) out.push(t); };
    push(s.title); push(s.openingQuestion);
    if ((s.contextSource || 'in-scenario') === 'previous-lo' && s.previousLO) {
      push(s.previousLO.title); push(s.previousLO.covered); push(s.previousLO.handoff);
    }
    (s.segments || []).forEach((sc) => { push(sc.label); push(sc.caption); });
    (s.openers || []).forEach((o) => push(o && o.line));
    (s.dimensions || []).forEach((d) => { push(d.name); push(d.strong); push(d.weak); });
    const g = s.gate || {};
    push(g.requirement); push(g.nudgeOpen); push(g.nudgeConcrete); push(g.fallback);
    const c = s.completion || {};
    push(c.condition); push(c.note);
    (s.playbook || []).forEach((p) => { push(p.title); push(p.body); });
    push((s.resources || {}).lead);
    ((s.resources || {}).items || []).forEach((r) => { push(r.title); push(r.body); });
    return out.sort((a, b) => b.length - a.length);
  }

  /* ---- validation / normalize / merge -----------------------------------
     normalize is GENTLE — it coerces types and ensures the shape exists, but
     never back-fills DEFAULT content. This is what lets blank() survive
     normalize as a still-blank (but valid) scenario. merge() is where DEFAULT
     content is injected for partial drafts. */
  function isValid(s) {
    return !!(s && s.type === 'observe-react' && typeof s.title === 'string' &&
      Array.isArray(s.segments) && Array.isArray(s.dimensions) &&
      s.gate && Array.isArray(s.playbook) &&
      s.resources && Array.isArray(s.resources.items));
  }
  function normalize(s) {
    const out = { ...(s || {}) };
    out.v = 1;
    out.type = 'observe-react';
    if (typeof out.title !== 'string') out.title = '';
    if (typeof out.openingQuestion !== 'string') out.openingQuestion = '';
    // Neutral shape only — normalize never back-fills the shipped copy.
    out.establishing = { eyebrow: 'Scene size-up', title: '', sub: '', ...((out.establishing && typeof out.establishing === 'object') ? out.establishing : {}) };

    out.segments = (Array.isArray(out.segments) ? out.segments : [])
      .map((sc) => ({ src: '', label: '', caption: '', ...(sc || {}) }));
    out.openers = (Array.isArray(out.openers) ? out.openers : [])
      .map((o) => ({ segment: '', line: '', ...(o || {}) }));
    out.dimensions = (Array.isArray(out.dimensions) ? out.dimensions : [])
      .map((d) => ({ name: '', strong: '', weak: '', ...(d || {}) }));

    out.gate = { mode: 'soft', requirement: '', nudgeOpen: '', nudgeConcrete: '', fallback: '', ...(out.gate || {}) };
    if (out.gate.mode !== 'hard') out.gate.mode = 'soft';
    out.completion = { condition: '', note: '', ...(out.completion || {}) };

    if (!Array.isArray(out.playbook)) out.playbook = [];
    if (!out.resources || typeof out.resources !== 'object') out.resources = { lead: '', items: [] };
    if (typeof out.resources.lead !== 'string') out.resources.lead = '';
    if (!Array.isArray(out.resources.items)) out.resources.items = [];

    // Platform-level context handoff — preserve/default so a save/load round-trip
    // keeps the fields the shell authors (the shell owns the UI; we just persist).
    if (out.contextSource !== 'previous-lo') out.contextSource = 'in-scenario';
    if (!out.previousLO || typeof out.previousLO !== 'object') out.previousLO = { title: '', covered: '', handoff: '' };

    return out;
  }
  function blank() {
    return {
      v: 1,
      type: 'observe-react',
      title: '',
      establishing: { eyebrow: 'Scene size-up', title: '', sub: '' },
      openingQuestion: '',
      segments: [{ src: '', label: '', caption: '' }],
      openers: [],
      dimensions: [{ name: '', strong: '', weak: '' }],
      gate: { mode: 'soft', requirement: '', nudgeOpen: '', nudgeConcrete: '', fallback: '' },
      completion: { condition: '', note: '' },
      playbook: [],
      resources: { lead: '', items: [] },
    };
  }
  function merge(draft) {
    const base = clone(DEFAULT);
    if (!draft || typeof draft !== 'object') return base;
    const out = { ...base, ...draft };
    out.gate = { ...base.gate, ...(draft.gate || {}) };
    out.completion = { ...base.completion, ...(draft.completion || {}) };
    if (draft.resources) out.resources = { ...base.resources, ...draft.resources };
    if (!Array.isArray(out.segments) || !out.segments.length) out.segments = clone(base.segments);
    if (!Array.isArray(out.dimensions) || !out.dimensions.length) out.dimensions = clone(base.dimensions);
    if (!Array.isArray(out.openers)) out.openers = clone(base.openers);
    if (!Array.isArray(out.playbook) || !out.playbook.length) out.playbook = clone(base.playbook);
    return normalize(out);
  }

  /* ---- lints ------------------------------------------------------------ */
  function lints(s) {
    const L = [];
    const add = (severity, section, msg, why) => L.push({ severity, section, msg, why });
    const empty = (v) => !String(v ?? '').trim();

    // Basics
    if (empty(s.title)) add('err', 'basics', 'The practice needs a title.', 'It appears in the learner\'s top bar.');

    // Intro — opening question
    if (empty(s.openingQuestion)) add('err', 'intro', 'Write the coach\'s opening question.', 'It\'s on screen the moment the first (cold-open) segment ends.');
    if (empty((s.establishing || {}).sub)) add('info', 'intro', 'The establishing card has no teaser.', 'The pre-entry card falls back to the practice title alone — a line about what the footage shows sets the frame better.');
    else if (!/\?\s*$/.test(s.openingQuestion.trim())) add('info', 'intro', 'The opening line isn\'t a question.', 'A question invites the learner to give a first read before the coach reacts.');

    // Segments
    const segs = (s.segments || []).filter((sc) => !empty(sc.src) || !empty(sc.caption) || !empty(sc.label));
    if (!segs.length) add('err', 'segments', 'There are no segments to observe.', 'An Observe/React practice needs at least one clip for the learner to review.');
    else if (segs.length < 2) add('warn', 'segments', 'Only one segment.', 'The pedagogy is the back-and-forth between segments — one clip leaves no React beat before the synthesis.');
    segs.forEach((sc, i) => {
      if (empty(sc.caption)) add('warn', 'segments', `Segment #${i + 1} has no caption.`, 'The clip plays with nothing read over it — the caption sets what the learner is looking at.');
      if (empty(sc.label)) add('info', 'segments', `Segment #${i + 1} has no accessible label.`, 'The label grounds both accessibility and the coach in what\'s on screen.');
      if (empty(sc.src)) add('warn', 'segments', `Segment #${i + 1} has no video URL.`, 'The page falls back to a placeholder frame + the caption. Paste the clip\'s URL for real footage.');
      else if (!/^(https?:\/\/|\.{0,2}\/)/.test(sc.src.trim()) || /\s/.test(sc.src.trim()))
        add('warn', 'segments', `Segment #${i + 1}'s video URL doesn't look like a path or URL.`, 'Use a relative path like ../../../assets/videos/my-clip.mp4 or a full https:// URL.');
      else if (!/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(sc.src.trim()))
        add('info', 'segments', `Segment #${i + 1}'s URL doesn't end in a video extension.`, 'Direct file URLs (.mp4/.webm) work; page links (YouTube, SharePoint) won\'t.');
    });

    // Openers — optional, but each must name a real return boundary (segment
    // 2..N; segment 1 is the cold open whose return is the opening question).
    (s.openers || []).forEach((o, i) => {
      if (!o) return;
      const n = Number(o.segment);
      if (empty(o.line)) { add('info', 'openers', `Opener #${i + 1} has a segment but no line.`, 'An empty opener is ignored — the coach opens in its own words.'); return; }
      if (!(n >= 2) || n > segs.length)
        add('warn', 'openers', `Opener #${i + 1} points at segment ${o.segment || '(blank)'}, which has no return boundary.`, 'Openers play on return from segments 2 and up — segment 1 is the cold open (its return is the opening question), and there\'s no segment past the last one.');
    });

    // Dimensions — the rubric
    const dims = (s.dimensions || []).filter((d) => !empty(d.name) || !empty(d.strong) || !empty(d.weak));
    if (!dims.length) add('err', 'dimensions', 'The rubric is empty — the coach has nothing to probe against.', 'Define at least one dimension of a sound read (e.g. isolation, positioning, hazard ID).');
    if (dims.length > 4) add('warn', 'dimensions', `${dims.length} dimensions is a lot for a short review.`, 'The coach targets one gap at a time — more than 3-4 rarely all get airtime.');
    dims.forEach((d, i) => {
      const label = d.name ? `"${d.name}"` : `#${i + 1}`;
      if (empty(d.name)) add('err', 'dimensions', `Dimension #${i + 1} has no name.`);
      if (empty(d.strong)) add('err', 'dimensions', `Dimension ${label} doesn't describe what a strong read looks like.`);
      if (empty(d.weak)) add('warn', 'dimensions', `Dimension ${label} has no "weak looks like".`, 'This is the read the footage should disprove — without it the coach grades that dimension inconsistently.');
    });

    // Gate
    const g = s.gate || {};
    if (g.mode !== 'hard' && g.mode !== 'soft') add('warn', 'gate', 'The gate mode isn\'t set.', 'Choose soft (accept the fallback after two nudges) or hard (keep probing until met).');
    if (empty(g.requirement)) add('err', 'gate', 'The gate requirement is empty.', 'This is the synthesis — the final beat — and landing it is what completes the practice.');
    if (empty(g.nudgeOpen) || empty(g.nudgeConcrete)) add('warn', 'gate', 'Write both nudges.', 'A learner who stalls at the synthesis gets exactly two helps — these are them.');
    if (g.mode !== 'hard' && empty(g.fallback)) add('warn', 'gate', 'Set the fallback the soft gate accepts after two nudges.', 'This is the no-learner-left-trapped floor for a soft gate.');

    // Completion
    if (empty((s.completion || {}).condition)) add('warn', 'completion', 'No completion condition.', 'Say in one line what ends the run — usually landing the gate.');
    if (empty((s.completion || {}).note)) add('info', 'completion', 'No note on how the coach closes.', 'A sentence on the closing affirmation keeps endings personal instead of a checklist.');

    // Playbook (OPTIONAL close) — no error when empty.
    const pbs = (s.playbook || []).filter((p) => !empty(p.title) || !empty(p.body));
    pbs.forEach((p, i) => {
      if (empty(p.title) || empty(p.body)) add('warn', 'playbook', `Component #${i + 1} is missing its ${empty(p.title) ? 'title' : 'explanation'}.`);
    });
    if (pbs.length > 8) add('warn', 'playbook', `${pbs.length} playbook components is a lot to absorb at the end.`, 'Past 6-7 the closing screen reads as a wall. Merge or cut.');

    // Resources (OPTIONAL close)
    const resItems = ((s.resources || {}).items || []).filter((r) => !empty(r.title) || !empty(r.body));
    resItems.forEach((r, i) => {
      if (empty(r.title) || empty(r.body)) add('warn', 'resources', `Resource #${i + 1} is incomplete.`);
    });
    if (resItems.length && empty((s.resources || {}).lead)) add('warn', 'resources', 'No lead-in line for the resources list.');

    return L;
  }

  /* ---- form: sections + field renderers ---------------------------------
     Ordered on the three-section spine, matching scenario.js / teach-back.js.
     There's no roleplay here, so Interaction is: the footage the learner
     reviews (ENGAGE), the coach openers on return (REACT), the rubric the coach
     probes against (COACH), the synthesis gate (GATE), and completion (EXIT).
     Section `id`s are what the lints key off. */
  const sections = [
    { id: 'basics', group: 'meta', icon: 'fa-id-card', title: 'Basics',
      lead: 'What this Observe / React practice is called.' },

    // ① Context — Observe/React's context is minimal: just the opening prompt.
    { id: 'intro', group: 'context', icon: 'fa-clapperboard', title: 'The opening',
      lead: 'The coach\'s first question, on screen the moment the cold-open segment ends.',
      bridgeTitle: 'The first segment is the cold open (Enter)',
      bridge: 'Segment 1 plays before any coaching — the learner walks in on the scene, then this question opens the first React beat. There\'s no separate setup to write; the footage and the rubric carry the context.' },

    // ② Interaction — review a segment, the coach probes the rubric, the gate
    // holds, exit on completion. No character, no roleplay.
    { id: 'segments', group: 'interaction', stage: 'ENGAGE', icon: 'fa-film', title: 'The footage',
      lead: 'The segments the learner reviews, in order — each with a caption read over it.',
      bridgeTitle: 'One clip, one beat',
      bridge: 'Each segment is followed by a React chapter before the next plays — the scene keeps developing, so returning to Observe is new footage, not a rewatch. Videos are plain files in <code>products/aithera/assets/videos/</code>; paste a relative path or full URL.' },
    { id: 'openers', group: 'interaction', stage: 'REACT', icon: 'fa-comment-dots', title: 'Coach openers on return',
      lead: 'Optional lines the coach delivers verbatim on return from a segment, before it probes.' },
    { id: 'dimensions', group: 'interaction', stage: 'COACH', icon: 'fa-scale-balanced', title: 'The rubric',
      lead: 'The dimensions the coach silently probes the learner\'s read against — never shown as a score.',
      bridgeTitle: 'From your old craft: right answers and distractors',
      bridge: 'In multiple choice you wrote one right answer and three wrong ones. Here, <b>"what strong looks like"</b> is the sound read and <b>"what weak looks like"</b> is the read the footage should disprove — describe the tempting misreads and the coach recognizes them in anything a learner types.' },
    { id: 'gate', group: 'interaction', stage: 'GATE', icon: 'fa-flag-checkered', title: 'The synthesis gate',
      lead: 'The final beat and how strictly it holds — soft (nudge, then accept) or hard (keep probing).' },
    { id: 'completion', group: 'interaction', stage: 'EXIT', icon: 'fa-flag-checkered', title: 'Completion & close',
      lead: 'What ends the run and how the coach signs off.' },

    // ③ Debrief & Close — the read-only rubric echo, then STATIC authored lists.
    { id: 'evaluation', group: 'debrief', icon: 'fa-clipboard-check', title: 'How it\'s evaluated',
      lead: 'The rubric above, read-only, is how the run is scored into the learner\'s results.' },
    { id: 'playbook', group: 'debrief', stage: 'TAKEAWAYS', icon: 'fa-list-check', title: 'The playbook',
      lead: 'Optional expert takeaways EVERY learner leaves with, identically — authored, never AI-generated.',
      bridgeTitle: 'From your old craft: your SME-validated teaching points',
      bridge: 'The conversation personalizes; the playbook standardizes. In Observe / React the results screen is entirely authored, so this list is exactly what every learner sees at the end.' },
    { id: 'resources', group: 'debrief', stage: 'TAKEAWAYS', icon: 'fa-hand-holding-medical', title: 'Resources',
      lead: 'Optional references and contacts to keep within reach — shown after the takeaways.' },

    { id: 'guardrails', group: 'reference', icon: 'fa-lock', title: 'System guardrails', locked: true,
      lead: 'The locked engine: the JSON contract each coach turn returns, plus the off-script and learner-safety handling. Read them; you can\'t break them.' },
  ];

  function renderFields(sec, H) {
    const { tf, rowsBlock, rowCard, guidance, esc, scheduleUpdate } = H;
    const s = H.getScenario();
    const box = document.createElement('div');
    box.className = 'fields';

    if (sec.id === 'basics') {
      box.append(
        tf('title', 'Practice title', { helper: 'Shown in the learner\'s top bar.' }),
      );
    }

    if (sec.id === 'intro') {
      box.append(
        guidance('The cold open sets the scene', 'fa-clapperboard',
          'There\'s no separate backstory to write. Segment 1 plays first — the learner walks in on the scene — and this question opens the first React beat the moment it ends. The footage and the rubric carry the rest of the context.'),
        // The pre-entry establishing card — the last thing the learner sees
        // before pressing "Watch the scene".
        tf('establishing.title', 'Establishing card — the title', {
          placeholder: 'e.g. I-65 Tanker Rollover',
          helper: 'The big line on the pre-entry card. Leave blank to fall back to the practice title.' }),
        tf('establishing.sub', 'Establishing card — the teaser', { area: true, minRows: 2,
          helper: 'One or two short lines: what the footage shows and what the learner will do with it.' }),
        tf('establishing.eyebrow', 'Establishing card — eyebrow', { placeholder: 'Scene size-up',
          helper: 'The small label over the title.' }),
        tf('openingQuestion', 'The coach\'s opening question', { area: true, minRows: 2,
          helper: 'On screen the moment the first segment ends. It should invite a first read, not test.' }),
      );
    }

    if (sec.id === 'segments') {
      box.append(rowsBlock('segments', (sc, i, onDel) => rowCard(
        `Segment ${i + 1}`, onDel,
        tf(`segments.${i}.src`, 'Video URL', { placeholder: '../../../assets/videos/hazmat_tankerScene.mp4' }),
        tf(`segments.${i}.label`, 'Accessible label (what the clip shows)', { area: true, minRows: 2,
          helper: 'A plain description of the footage, used for accessibility and to ground the coach in what\'s on screen.' }),
        tf(`segments.${i}.caption`, 'Caption (read over the clip)', { area: true, minRows: 2,
          helper: 'Paced to the clip\'s runtime — around two short sentences. Write it to what\'s actually on screen.' }),
      ), 'Add segment', () => ({ src: '', label: '', caption: '' })));
    }

    if (sec.id === 'openers') {
      box.append(guidance('When these play', 'fa-comment-dots',
        'Each opener is delivered word-for-word the moment the learner comes back to the coach after watching that segment — a scripted reaction to what just played, before the coach starts probing. Point each one at a segment from 2 up (segment 1 is the cold open — its return is the opening question). This is where an affective beat like "how did that make you feel?" lives.'));
      box.append(rowsBlock('openers', (o, i, onDel) => rowCard(
        `Opener ${i + 1}`, onDel,
        tf(`openers.${i}.segment`, 'Plays on return from segment #', { placeholder: '2' }),
        tf(`openers.${i}.line`, 'The line (delivered verbatim)', { area: true, minRows: 3,
          helper: 'Spoken before the coach probes the beat.' }),
      ), 'Add opener', () => ({ segment: '', line: '' })));
    }

    if (sec.id === 'dimensions') {
      box.append(rowsBlock('dimensions', (d, i, onDel) => rowCard(
        `Dimension ${i + 1}`, onDel,
        tf(`dimensions.${i}.name`, 'Name', { helper: 'One word or short phrase — e.g. Isolation, Positioning, Hazard ID.' }),
        tf(`dimensions.${i}.strong`, 'What a strong read looks like', { area: true, minRows: 2,
          helper: 'The sound observation, with a concrete detail if you can.' }),
        tf(`dimensions.${i}.weak`, 'What a weak read looks like (your distractors)', { area: true, minRows: 2,
          helper: 'The tempting misread the footage should disprove. Be specific — the coach recognizes these in free text.' }),
      ), 'Add dimension', () => ({ name: '', strong: '', weak: '' })));
    }

    if (sec.id === 'gate') {
      // hard/soft radio bound to gate.mode.
      const rg = document.createElement('vaadin-radio-group');
      rg.label = 'How strictly the gate holds';
      [['soft', 'Soft — after two nudges, accept the fallback and move on'],
       ['hard', 'Hard — keep probing until the requirement is met']].forEach(([v, l]) => {
        const rb = document.createElement('vaadin-radio-button');
        rb.value = v; rb.label = l;
        rg.appendChild(rb);
      });
      rg.value = (s.gate && s.gate.mode) === 'hard' ? 'hard' : 'soft';
      const onMode = () => {
        const v = rg.value;
        if (!v || !s.gate || v === s.gate.mode) return;
        s.gate.mode = v;
        scheduleUpdate();
      };
      rg.addEventListener('value-changed', onMode);
      rg.addEventListener('change', onMode);

      const r = document.createElement('div'); r.className = 'row2';
      r.append(
        tf('gate.nudgeOpen', 'First nudge (open)', { helper: 'If the learner stalls at the synthesis, the coach asks this first.' }),
        tf('gate.nudgeConcrete', 'Second nudge (concrete)', { helper: 'If they still stall. After this, a soft gate accepts the fallback — no loops.' }),
      );
      box.append(
        rg,
        tf('gate.requirement', 'The synthesis — a strong final answer names…', { area: true, minRows: 3,
          helper: 'The final beat after the last segment, e.g. "walk me through your first moves" and the pieces a complete answer includes. Landing this completes the practice.' }),
        r,
        tf('gate.fallback', 'Fallback a soft gate accepts after two nudges', { area: true, minRows: 2,
          helper: 'The floor a soft gate will accept so no learner is trapped. Ignored when the gate is hard.' }),
      );
    }

    if (sec.id === 'completion') {
      box.append(
        tf('completion.condition', 'The practice is complete when…', { area: true, minRows: 2,
          helper: 'Completes the sentence "when …" — usually landing the gate.' }),
        tf('completion.note', 'How the coach closes', { area: true, minRows: 3,
          helper: 'A note on the closing affirmation — what the coach names about what the learner caught. It should stay personal, not recite the playbook.' }),
      );
    }

    if (sec.id === 'evaluation') {
      box.append(guidance('The results are grounded in the learner\'s own words', 'fa-clipboard-check',
        'The run is scored against the rubric you wrote in "The rubric" above — read-only here so you can see exactly what the coach evaluates. The learner\'s results are up to 3 strengths and up to 2 growth areas, each tied to what they actually said or missed across the segments.'));
      const dims = (s.dimensions || []).filter((d) => d && (d.name || d.strong || d.weak));
      if (!dims.length) {
        const note = document.createElement('div');
        note.className = 'fieldnote';
        note.innerHTML = '<i class="fa-solid fa-circle-info"></i><span>Add dimensions in <b>The rubric</b> above — they\'ll echo here as the scoring rubric.</span>';
        box.appendChild(note);
      }
      dims.forEach((d, i) => {
        const card = document.createElement('div');
        card.className = 'rowcard lockcard';
        card.innerHTML = `
          <div class="lockhead"><i class="fa-solid fa-lock"></i> ${esc(d.name || `Dimension ${i + 1}`)}</div>
          <div class="note"><b>Strong:</b> ${esc(String(d.strong || '').trim() || '—')}</div>
          <div class="note"><b>Weak:</b> ${esc(String(d.weak || '').trim() || '—')}</div>`;
        box.appendChild(card);
      });
    }

    if (sec.id === 'playbook') {
      box.append(guidance('This close is authored, not generated', 'fa-shield-halved',
        'Observe / React shows a STATIC results screen — these exact takeaways, every time (optional; leave empty for a lean close). The AI runs the conversation; the page guarantees the takeaways.'));
      box.append(rowsBlock('playbook', (p, i, onDel) => rowCard(
        `Component ${i + 1}`, onDel,
        tf(`playbook.${i}.title`, 'The takeaway', { placeholder: 'e.g. Read the placard first' }),
        tf(`playbook.${i}.body`, 'Why it matters / what it looks like', { area: true, minRows: 2,
          helper: 'One or two sentences. A concrete number or example lands better than theory.' }),
      ), 'Add component', () => ({ title: '', body: '' })));
    }

    if (sec.id === 'resources') {
      box.append(
        tf('resources.lead', 'Lead-in line', { area: true, minRows: 2,
          helper: 'The sentence introducing the list on the closing screen.' }),
        rowsBlock('resources.items', (r, i, onDel) => rowCard(
          `Resource ${i + 1}`, onDel,
          tf(`resources.items.${i}.title`, 'Resource', { placeholder: 'e.g. The Emergency Response Guidebook (ERG)' }),
          tf(`resources.items.${i}.body`, 'What it offers / how to reach it', { area: true, minRows: 2 }),
        ), 'Add resource', () => ({ title: '', body: '' })),
      );
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
      box.appendChild(guidance('Also locked beyond these sections', 'fa-shield-halved',
        'The JSON contract\'s enforcement, the observeNext clamp (the coach can never point at footage that doesn\'t exist), the two-nudge cap on every beat, and the rule that the closing playbook + resources are authored, not model-generated. Your fields plug into this machinery — they can\'t switch it off.'));
    }

    return box;
  }

  /* ---- the type object -------------------------------------------------- */
  const observeReactType = {
    id: 'observe-react',
    label: 'Observe / React',
    icon: 'fa-clapperboard',
    blurb: 'Review footage one beat at a time with a coach.',
    DEFAULT,
    ENGINE_SECTIONS,
    fill: (t) => String(t == null ? '' : t),   // no {{}} substitution in this mode
    normalize,
    isValid,
    blank,
    merge,
    compile,                                    // (s) => ONE system-prompt string
    sections,
    renderFields,
    lints,
    highlightStrings,
    previewUrl: () => 'hazmat-scene-practice.html',
    playtest: null,        // v1: no in-studio playtest — publish + open the live page
    store: S.makeStore(S.makeKeys('observe-react'), { isValid, normalize }),
  };

  S.register(observeReactType);
})();
