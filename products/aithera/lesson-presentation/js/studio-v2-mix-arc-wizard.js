/* =========================================================================
   WRITER STUDIO V2 — WIZARD SPEC FOR THE MIX & MATCH TYPE
   Loaded ONLY by scenario-editor/index.html, AFTER the mix-arc type module.
   Attaches `mix-arc.wizard` so the "What are you building?" chooser can
   generate a composed scenario from scratch.

   Mix & Match is an ORDERED LIST OF BEATS, one interaction type each. The
   interview's key field is a BEAT OUTLINE — one line per beat, each prefixed
   with its type ("coach-led:", "roleplay:", "observe:"). Generation is one
   task per beat (so each fits the worker's ~2000-token cap), and the JSON shape
   asked for BRANCHES on the beat's type. Craft rules mirror the other specs:
   plain-language SME questions (never prompt-writing); exemplars pulled LIVE
   from the shipped DEFAULT; the prompts forbid copying the exemplar's
   people/topic; banned-phrase voice rules; start() builds a COMPLETE blank.
   ========================================================================= */
(function () {
  'use strict';
  if (!window.AitheraStudio) return;
  const T = window.AitheraStudio.get('mix-arc');
  if (!T || T.wizard) return;
  const D = T.DEFAULT;

  const craft = window.AitheraWizardCraft;
  if (!craft) return;
  const { lines, trim, depunct, str, sourceBlock,
          BANNED_PHRASES, GROUNDING_BASE, CITATION_RULE, OUTPUT_JSON_RULE } = craft;
  const clampInt = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 1 ? n : d; };

  /* ---- beat-line parsing: "<type>: <what happens>" ----------------------- */
  const TYPE_WORDS = {
    'coach-led': 'coach-led', 'coachled': 'coach-led', 'coach': 'coach-led', 'reason': 'coach-led', 'inquiry': 'coach-led', 'decide': 'coach-led', 'plan': 'coach-led',
    'roleplay': 'roleplay', 'role-play': 'roleplay', 'scene': 'roleplay', 'talk': 'roleplay', 'character': 'roleplay',
    'observe': 'observe', 'observe/react': 'observe', 'observereact': 'observe', 'watch': 'observe', 'video': 'observe', 'clip': 'observe', 'react': 'observe',
  };
  const TYPE_LABEL = { 'coach-led': 'Coach-Led Inquiry', 'roleplay': 'Roleplay', 'observe': 'Observe / React' };
  function parseBeatLine(line) {
    const m = String(line || '').match(/^\s*([a-z][a-z/\- ]*?)\s*[:–—\-]\s*(.+)$/i);
    if (m) {
      const key = m[1].toLowerCase().replace(/\s+/g, '');
      if (TYPE_WORDS[key]) return { type: TYPE_WORDS[key], desc: m[2].trim() };
    }
    return { type: 'coach-led', desc: String(line || '').trim() };
  }

  /* ---- the shared craft spine (same rules the other specs bake in) ------- */
  const CRAFT_COMMON =
`You write TWO registers, and keeping them apart is everything:
- LEARNER-FACING LINES (a character's spoken beats, the coach's scripted openers, narration, an observe clip's caption): short, warm, plain, real. In-character lines are emotional and consequential; coach lines are a sharp colleague, never an AI assistant. Contractions. BANNED for the COACH (and anything pattern-matching them): ${BANNED_PHRASES}.
- GUIDANCE TO THE AI (reaction maps, exit criteria, calibration tiers, debrief points): dense INSTRUCTIONS a model reads mid-conversation. Imperative, specific; name the misconceptions to counter and the exact bar to hold.

${GROUNDING_BASE} ${CITATION_RULE}

DO NOT COPY THE EXEMPLARS' CONTENT: the shipped build is about a team lead, a senior engineer (Dana), and a coworker (Priya) at a stand-up. Those names and that topic are a CRAFT reference only — match their density and structure, never their people or facts. Write THIS scenario's world.

${OUTPUT_JSON_RULE}`;

  const SYS = `You are an expert learning-experience designer and prompt engineer for Aithera's MIX & MATCH engine: a scenario is an ORDERED LIST OF BEATS, and each beat is exactly ONE kind of practice — COACH-LED (the learner reasons/decides/plans with the coach; no character), ROLEPLAY (the learner speaks to a character you voice, in a live scene), or OBSERVE (the learner watches a short clip, then reacts with the coach). Every beat is Practice → Learn: the learner works it, then the coach lands the point for everyone. A designer has answered a plain-language interview; you translate it into scenario fields with shipped-quality craft.

${CRAFT_COMMON}

MIX-ARC CRAFT:
- ONE TYPE PER BEAT: never blend a character scene into a coaching beat; each beat is exactly its declared type.
- CALIBRATION TIERS: 2-3 per beat, named for THIS beat (e.g. "MINIMIZES" / "NAMES-IT", or "AVOIDS" / "ACCUSES" / "ADDRESSES"). The coach reads the pass against them and reports one.
- ROLEPLAY characters are flawed and RECOVERABLE, never caricatures; reactions come in believable steps and are driven by how they're treated.
- OBSERVE clips: the learner reacts to what they SAW — write the caption as what actually plays on screen; probe the whole picture, not one detail.`;

  function briefBlock(ik) {
    return `THE BRIEF
- Topic: ${ik.topic || '(unspecified)'}
- Working title: ${str(ik.title).trim() || '(none — propose one)'}
- Course it lives in: ${ik.course || '(unspecified)'}
- The learner plays: ${ik.learnerRole || '(unspecified)'}
- The beats, in order (type: what happens):
${lines(ik.beatsList).map((p, i) => `  ${i + 1}. ${p}`).join('\n') || '  (unspecified)'}`;
  }
  function interviewBlock(ik) {
    return `THE INTERVIEW
- What's true as the scenario opens (the landing the learner reads): ${ik.situation || '(unspecified)'}
- What strong handling looks like across the beats vs. weak: ${ik.goodVsWeak || '(left to you — infer from the beats)'}
- Must-knows every learner leaves with:\n${lines(ik.mustKnows).map((x) => '  · ' + x).join('\n') || '  (unspecified)'}
- How the coach should come across: ${ik.coachVibe || '(warm, steady peer coach; affirms before redirecting; never preachy)'}`;
  }

  /* Exemplars pulled LIVE from the shipped DEFAULT — craft reference only. */
  const beatEx = (type) => {
    const b = (D.beats || []).find((x) => x.type === type) || {};
    const base = { label: b.label, level: b.level, signpost: (b.entry || {}).signpost, cta: (b.entry || {}).cta,
      exitCriteria: b.exitCriteria, calibration: b.calibration, talkItThrough: (b.debrief || {}).talkItThrough, debriefPoints: (b.debrief || {}).points, maxTurns: b.maxTurns };
    if (type === 'roleplay') { base.beats = (b.entry || {}).beats; base.character = b.character; base.reactionGuidance = b.reactionGuidance; }
    if (type === 'observe') { base.media = b.media; base.reactionGuidance = b.reactionGuidance; }
    if (type === 'coach-led') { base.hasRightAnswer = b.hasRightAnswer; base.throughLine = b.throughLine; }
    return JSON.stringify(base, null, 1);
  };
  const EX = {
    situation: str((D.intro || {}).audio ? D.intro.audio.text : ''),
    playbook: JSON.stringify((D.playbook || []).slice(0, 3), null, 1),
  };

  T.wizard = {
    title: 'Start from scratch — Mix & Match',
    tagline: 'Compose a scenario beat by beat — coach-led reasoning, live roleplay, and watch-then-react, in any order.',
    intro: 'Sketch the beats in order (one per line, each with its type), answer a few questions, and an AI-drafted composed scenario lands in the editor — every beat fully editable.',
    describePlaceholder: 'e.g. A new team lead handles disrespect in a meeting: first reason through whether it crossed a line, then watch the moment back, then step in and address the coworker who did it.',

    steps: [
      { id: 'brief', title: 'The brief', sub: 'The shape of the scenario. You can change any of this later in the editor.',
        fields: [
          { key: 'topic', kind: 'text', required: true, label: 'What is this scenario about?',
            placeholder: 'e.g. Addressing disrespect in a team meeting', helper: 'One line. Everything else builds on this.' },
          { key: 'title', kind: 'text', label: 'Working title (optional)', helper: 'Leave blank and the draft proposes one.' },
          { key: 'course', kind: 'text', label: 'The training it lives inside (optional)',
            placeholder: 'e.g. a respectful-workplace program for new managers', helper: 'Sets the tone. Start with "a …".' },
          { key: 'learnerRole', kind: 'text', required: true, label: 'Who does the learner play?',
            placeholder: 'e.g. the team lead — the person with the standing to say something' },
          { key: 'beatsList', kind: 'lines', required: true, minRows: 5, label: 'The beats — one per line, in order, each starting with its type',
            helper: 'Prefix each line with coach-led:, roleplay:, or observe:. e.g. "coach-led: did this cross the line?"; "observe: watch the moment back"; "roleplay: step in and address the coworker". Unprefixed lines default to coach-led.' },
          { key: 'sourceText', kind: 'source', minRows: 7, label: 'Source material — paste anything (optional)',
            placeholder: 'An outline, the static scenario this replaces, a policy excerpt, SME notes…',
            helper: 'We\'ll pull specifics from this instead of inventing them.' },
        ] },
      { id: 'interview', title: 'The situation & the bar', sub: 'Answer like you\'re briefing a colleague. Plain language — no prompt-writing.',
        fields: [
          { key: 'situation', kind: 'area', required: true, minRows: 5, label: 'What\'s true as the scenario opens?',
            helper: 'The landing the learner reads before anything happens — who they are, what they\'ve just seen, what\'s about to be asked of them.' },
          { key: 'goodVsWeak', kind: 'area', minRows: 3, label: 'What does strong handling look like across the beats — and what do weak moves look like? (optional)',
            helper: 'What separates a strong pass from a weak one. Feeds the calibration the coach reads against.' },
          { key: 'mustKnows', kind: 'lines', required: true, minRows: 4, label: 'What must every learner walk away knowing?',
            helper: 'One per line, 3-6. These become the guaranteed playbook.' },
          { key: 'coachVibe', kind: 'text', label: 'How should the coach come across? (optional)',
            placeholder: 'e.g. warm, steady peer who has handled these before — affirms before redirecting' },
          { key: 'elevatedStakes', kind: 'toggle', default: false,
            label: 'Crisis-adjacent topic — append the locked 988 support floor to the resources' },
        ] },
    ],

    start(type) {
      const d = type.blank();
      d.beats = [];       // the per-beat tasks fill these in order
      d.playbook = [];
      return d;
    },

    plan(intake) {
      const beatLines = lines(intake.beatsList);
      const parsed = beatLines.map(parseBeatLine);
      const N = Math.max(1, parsed.length);

      const tasks = [
        { id: 'foundation', label: 'Foundation — premise, landing & coach',
          detail: 'Title, framing, the situation the learner reads, coach voice, warm-up.',
          build(ik) {
            return { maxTokens: 1800,
              system: SYS + `

YOUR TASK — the FOUNDATION. Return this exact JSON shape:
{
 "title": "learner-facing title, short",
 "framing": "lowercase phrase completing 'You facilitate <this>' — e.g. 'a short composed scenario on noticing and addressing disrespect at work'",
 "learnerRole": "who the learner plays, one line",
 "courseContext": "lowercase phrase starting 'a …' naming the course register",
 "establishingTitle": "3-6 words for the pre-entry card — the scenario's name",
 "establishingSub": "1-2 short sentences under it: what's at stake — second person",
 "introEyebrow": "small label over the situation card (e.g. 'The scenario')",
 "situationText": "120-220 words, SECOND PERSON present tense — the landing the learner reads before anything happens. This grounds the coach. Escape paragraph breaks as \\n\\n.",
 "coachPersona": "one line: the coach's stance",
 "reflectionPrompt": "an optional light warm-up question in the coach's voice, ending in a question mark — a gut-read before the first beat. Return an empty string to open straight on the first beat.",
 "reflectionFeedback": "brief TO the coach: calibrate the gut read in 2-3 short bubbles, never grade it"
}

CRAFT EXEMPLAR (shipped build — match craft and density, NOT the topic or people):
- situationText (theirs): """${EX.situation}"""`,
              user: `${briefBlock(ik)}\n\n${interviewBlock(ik)}\n\n${sourceBlock(ik, 6000)}\n\nWrite the foundation JSON now.` };
          },
          apply(json, draft, ik) {
            draft.title = str(ik.title).trim() || str(json.title);
            draft.framing = depunct(json.framing);
            draft.learnerRole = str(ik.learnerRole).trim() || str(json.learnerRole);
            draft.course = str(ik.course).trim() || str(json.courseContext);
            draft.elevatedStakes = !!ik.elevatedStakes;
            draft.establishing = { eyebrow: str(json.introEyebrow) || 'The scenario', title: depunct(json.establishingTitle), sub: str(json.establishingSub) };
            draft.voice = { persona: depunct(json.coachPersona), guidance: '' };
            draft.reflection = { enabled: !!str(json.reflectionPrompt).trim(), prompt: str(json.reflectionPrompt), feedbackGuidance: str(json.reflectionFeedback) };
            draft.intro = {
              type: 'reading',
              video: { sound: true, scenes: [] },
              audio: { eyebrow: str(json.introEyebrow) || 'The scenario', title: str(json.establishingTitle), text: str(json.situationText), continueLabel: 'Continue' },
            };
          },
          doneNote(json) { return `“${json.title || 'untitled'}”`; } },
      ];

      // ---- ONE generation task per beat, branching on its type ------------
      parsed.forEach((pb, i) => {
        const isLast = i === N - 1;
        const type = pb.type;
        // per-type JSON extension + apply builder
        const typeSchema = type === 'roleplay'
          ? ` "counterpart": "the character's name (the person the learner speaks to)",
 "beats": [ {"kind": "narration"|"dialogue", "name": "speaker for dialogue only", "text": "verbatim locked opening beat — usually a narration beat, then the character's first line"} ],
 "reactionGuidance": "how the character plays turn to turn — recoverable, human, driven by how they're treated; never graphic",
 "character": { "name": "", "backstory": "who they are", "driver": "what's really going on — shapes reactions, never announced", "reactions": [ {"when": "the learner-move pattern", "then": "how they respond, in steps"} ], "styleNotes": "how they talk; hard limits" },`
          : type === 'observe'
          ? ` "segments": [ {"label": "short clip label", "caption": "the moment written out as the learner will SEE it on screen — vivid, concrete, present tense (the app shows this as a card; no video file needed). Describe what happens; do not tell the learner to 'watch a video'."} ],
 "affectiveBeat": true,
 "openingReaction": "the near-verbatim line the coach opens with, validating the gut reaction before analysis",
 "reactionGuidance": "what to probe the learner's read toward — the whole picture, not one detail",`
          : ` "prompt": "the verbatim task question the learner reasons about",
 "hasRightAnswer": true or false,
 "throughLine": "if hasRightAnswer, the correct answer the coach states plainly when teaching; else empty",`;

        tasks.push({
          id: 'beat' + (i + 1),
          label: `Beat ${i + 1} — ${TYPE_LABEL[type]}`,
          detail: pb.desc.slice(0, 60),
          build(ik, acc) {
            const f = acc.results.foundation || {};
            const arcList = parsed.map((p, k) => `  ${k + 1}. [${TYPE_LABEL[p.type]}] ${p.desc}${k === i ? '   ← THIS BEAT' : ''}`).join('\n');
            return { maxTokens: 2000,
              system: SYS + `

YOUR TASK — author BEAT ${i + 1} of ${N}, a ${TYPE_LABEL[type].toUpperCase()} beat: "${pb.desc}".${isLast ? ' This is the FINAL beat — it resolves the scenario; the app completes after it.' : ''} Return this exact JSON shape:
{
 "label": "short beat name",
 "level": "sub-label, e.g. 'Beat ${i + 1} · ${type === 'observe' ? 'observe' : type === 'roleplay' ? 'practice' : 'recognize'}'",
 "bridge": "${i === 0 ? 'leave empty — the app hands in from the opening' : 'a short verbatim line advancing into this beat (optional)'}",
 "signpost": "the verbatim on-screen line framing what the learner does now",
 "cta": "the continue-button label (e.g. '${type === 'observe' ? 'Watch the clip' : type === 'roleplay' ? 'Say something' : 'Think it through'}')",
 "inputPlaceholder": "the composer placeholder while the learner is in this beat",
 "maxTurns": ${type === 'roleplay' ? 5 : 2},
${typeSchema}
 "exitCriteria": "what 'done' means — the coach probes toward this and reports the tier against it",
 "calibration": [ {"tier": "SHORT-CAPS-NAME", "guidance": "how a pass at this tier looks + what the debrief must add"} ],
 "talkItThrough": "the verbatim line the coach opens the debrief with",
 "debriefPoints": "what the debrief LANDS for every learner, however the beat went"
}
2-3 calibration tiers, named for THIS beat. Never re-narrate the learner.${type === 'roleplay' ? ' ON-STAGE RULE: the character the learner faces here must have been established (named in the situation or an earlier beat) — do not introduce a confrontation cold.' : ''}

CRAFT EXEMPLAR (a shipped ${TYPE_LABEL[type]} beat — match structure/craft, NOT its people or topic):\n${beatEx(type)}`,
              user: `THE SCENARIO\n- Title: ${f.title || ''}\n- Learner plays: ${ik.learnerRole || ''}\n- The full arc (this is beat ${i + 1}):\n${arcList}\n\nTHIS BEAT: ${pb.desc}\n\nSTRONG vs WEAK: ${ik.goodVsWeak || '(infer from this moment)'}\n\nSITUATION (for grounding): ${str(f.situationText).slice(0, 600)}\n\nWrite the beat JSON now.` };
          },
          apply(json, draft) {
            const cal = Array.isArray(json.calibration)
              ? json.calibration.map((c) => ({ tier: str((c || {}).tier).toUpperCase(), guidance: str((c || {}).guidance) })).filter((c) => c.tier)
              : [];
            const beat = {
              id: 'beat' + (i + 1),
              label: str(json.label) || pb.desc.slice(0, 40),
              level: str(json.level),
              type,
              maxTurns: clampInt(json.maxTurns, type === 'roleplay' ? 5 : 2),
              entry: {
                bridge: str(json.bridge), signpost: str(json.signpost), prompt: str(json.prompt),
                beats: Array.isArray(json.beats) ? json.beats.map((b) => {
                  const o = { speaker: 'character', kind: (b || {}).kind === 'dialogue' ? 'dialogue' : 'narration', text: str((b || {}).text) };
                  if ((b || {}).name) o.name = str(b.name);
                  return o;
                }) : [],
                cta: str(json.cta),
              },
              inputPlaceholder: str(json.inputPlaceholder),
              exitCriteria: str(json.exitCriteria),
              reactionGuidance: str(json.reactionGuidance),
              hasRightAnswer: json.hasRightAnswer === true,
              throughLine: str(json.throughLine),
              character: type === 'roleplay' ? {
                name: str((json.character || {}).name) || str(json.counterpart),
                backstory: str((json.character || {}).backstory),
                driver: str((json.character || {}).driver),
                reactions: Array.isArray((json.character || {}).reactions) ? json.character.reactions.map((r) => ({ when: str((r || {}).when), then: str((r || {}).then) })) : [],
                styleNotes: str((json.character || {}).styleNotes),
              } : { name: '', backstory: '', driver: '', reactions: [], styleNotes: '' },
              media: type === 'observe' ? {
                segments: Array.isArray(json.segments) ? json.segments.map((sc) => ({ src: '', label: str((sc || {}).label), caption: str((sc || {}).caption) })) : [],
                affectiveBeat: json.affectiveBeat !== false,
                openingReaction: str(json.openingReaction),
              } : { segments: [], affectiveBeat: false, openingReaction: '' },
              calibration: cal,
              debrief: { talkItThrough: str(json.talkItThrough), points: str(json.debriefPoints) },
              transitions: [{ onTier: '', next: '', set: {} }],
            };
            draft.beats.push(beat);
          },
          doneNote(json) { return `${str(json.label) || 'beat'} · ${TYPE_LABEL[type]}`; },
        });
      });

      // ---- the guaranteed close -------------------------------------------
      tasks.push({ id: 'close', label: 'The close — playbook & resources',
        detail: 'The SME-validated points every learner leaves with, and where to turn.',
        build(ik, acc) {
          const f = acc.results.foundation || {};
          return { maxTokens: 1500,
            system: SYS + `

YOUR TASK — the guaranteed CLOSE, shown identically to EVERY learner after the beats. Return this exact JSON shape:
{
 "playbook": [ {"title": "short imperative point", "body": "1-2 sentences", "source": "AUDIT TRAIL — the source line or interview answer this traces to; empty string if general craft"} ],
 "resources": {"lead": "one coach sentence introducing where to turn", "items": [ {"title": "the place/person/policy", "body": "what it offers / how to use it"} ]}
}
3-6 playbook components covering every must-know; 1-3 REAL resources for this scenario's world.${ik.elevatedStakes ? ' The 988 crisis line is appended automatically — do NOT list it yourself.' : ''} Never invent URLs or organizations.

CRAFT EXEMPLAR (first 3 of the shipped playbook — match craft, NOT topic):\n${EX.playbook}`,
            user: `THE SCENARIO\n- Title: ${f.title || ''}\n- About: ${ik.topic || ''}\n\nMUST-KNOWS:\n${lines(ik.mustKnows).map((x) => '- ' + x).join('\n') || '(unspecified)'}\n\n${sourceBlock(ik, 2500)}\n\nWrite the close JSON now.` };
        },
        apply(json, draft) {
          draft.playbook = Array.isArray(json.playbook) ? json.playbook.map((p) => ({ title: str((p || {}).title), body: str((p || {}).body), source: str((p || {}).source) })) : [];
          const r = json.resources || {};
          draft.resources = { lead: str(r.lead), items: Array.isArray(r.items) ? r.items.map((it) => ({ title: str((it || {}).title), body: str((it || {}).body) })) : [] };
        },
        doneNote(json) { return `${(json.playbook || []).length} playbook components, ${((json.resources || {}).items || []).length} resources`; } });

      return tasks;
    },

    landNote() { return 'Mix & Match drafted — review the beats in order (reorder or retype any of them), then run the guardrails and publish to test on the live page.'; },
  };
})();
