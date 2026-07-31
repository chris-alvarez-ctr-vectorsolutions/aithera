/* =========================================================================
   WRITER STUDIO V2 — WIZARD SPECS FOR THE OTHER THREE INTERACTION TYPES
   Loaded ONLY by writer-studio-v2.html, AFTER the type modules (and after
   js/studio-v2-guided-arc.js, which owns the guided-arc spec).

   The generic wizard engine (js/studio-wizard.js) runs whatever spec a type
   attaches as `type.wizard` — this module attaches one to each remaining
   type, so the wizard's "What are you building?" step offers all four,
   mirroring the editor's core-interaction templates:

     · action-practice ("Roleplay")   — brief → interview → 4 generation
       calls: foundation / assessment dimensions + misconceptions /
       character reaction map + gate / close.
     · teach-back                     — 2 calls: the required-topic list
       (expanded from the author's lines, or proposed from source material)
       / the three prompt briefs (calibration, grading rules, close).
     · observe-react                  — 3 calls: footage narration + scripted
       openers / the probing rubric + synthesis gate / close.

   Same design rules as the guided-arc spec: interviews ask SME questions in
   plain language (never prompt-writing); craft exemplars are pulled LIVE
   from each type's shipped DEFAULT (Kendra, HazMat) so "what good looks
   like" can't drift; provenance is never fabricated; every learner-facing
   line follows the banned-phrase voice rules. Each type's start() builds a
   COMPLETE blank skeleton — never merge with a DEFAULT, that's how shipped
   demo content leaks into a fresh scenario.
   ========================================================================= */
(function () {
  'use strict';
  if (!window.AitheraStudio) return;

  // Shared intake helpers + the invariant coach-voice atoms (banned phrases,
  // grounding, citation, JSON-output rule) live in js/studio-wizard-craft.js
  // so they can't drift across the wizard specs.
  const craft = window.AitheraWizardCraft;
  if (!craft) return;
  const { lines, trim, depunct, str, sourceBlock,
          BANNED_PHRASES, GROUNDING_BASE, CITATION_RULE, OUTPUT_JSON_RULE } = craft;

  /* ---- the craft spine: THIS pedagogy's two-register framing, composed from
     the shared atoms above. The framing (what counts as a learner-facing line
     vs. guidance) is Roleplay-specific; the voice rules are shared. */
  const CRAFT_COMMON =
`You write TWO registers, and keeping them apart is everything:
- LEARNER-FACING LINES (opening questions, scripted coach lines, narration captions): the coach's SPOKEN voice. Short, warm, plain, direct — a sharp colleague, never an AI assistant. Contractions. BANNED (and anything that pattern-matches them): ${BANNED_PHRASES}.
- GUIDANCE TO THE AI (rubric strong/weak lines, reaction maps, grading rules, gate nudges, feedback briefs): dense INSTRUCTIONS a model reads mid-conversation. Imperative, specific, semicolon-packed; name the misconceptions to counter and the exact bar to hold.

${GROUNDING_BASE} ${CITATION_RULE}

${OUTPUT_JSON_RULE}`;

  /* =======================================================================
     1) ACTION-PRACTICE ("Roleplay") — the Kendra format: the learner speaks
        actual lines to a simulated person; a silent rubric scores each line,
        the character's reactions ARE the feedback, and a gate decides when
        the scene may resolve.
     ======================================================================= */
  (function attachActionPractice() {
    const T = window.AitheraStudio.get('action-practice');
    if (!T || T.wizard) return;
    const D = T.DEFAULT;
    const EX = {
      setup: str(D.setup),
      establishing: JSON.stringify(D.establishing),
      openingQuestion: str(D.openingQuestion),
      coachVoice: JSON.stringify(D.coachVoice, null, 1),
      dimensions: JSON.stringify(D.dimensions, null, 1),
      misconceptions: JSON.stringify(D.misconceptions, null, 1),
      reactions: JSON.stringify(D.reactions, null, 1),
      styleNotes: str(D.styleNotes),
      gate: JSON.stringify(D.gate, null, 1),
      completion: JSON.stringify(D.completion, null, 1),
    };

    const SYS = `You are an expert learning-experience designer and prompt engineer for Aithera's ROLEPLAY engine (action-practice): the learner rehearses a hard conversation by speaking ACTUAL LINES to a simulated person. A silent rubric scores every line; the character's reaction IS the feedback (feedback-per-distractor, played out in-scene); a coach probes intent between lines; a GATE decides when the scene may resolve. A designer has answered a plain-language interview; you translate it into scenario fields with shipped-quality craft.

${CRAFT_COMMON}

CHARACTER REALISM RULES: the character never capitulates in one line and never melts down theatrically; reactions come in steps; windows close and reopen slowly; no therapy-speak; dialogue short and real.`;

    function briefBlock(intake) {
      return `THE BRIEF
- Topic: ${intake.topic || '(unspecified)'}
- Working title: ${str(intake.title).trim() || '(none — propose one)'}
- Course it lives in: ${intake.course || '(unspecified)'}
- Target time on task: ~${intake.time || 10} minutes (${(intake.pacing || {}).sceneLines || '4-6'} scene lines)
- The character: ${intake.characterName || '(propose a first name)'}
- The learner is: ${intake.learnerRel || '(unspecified)'} ${str(intake.learnerName).trim() ? `(called ${intake.learnerName})` : '(propose a fitting first name for the learner)'}`;
    }
    function interviewBlock(intake) {
      return `THE INTERVIEW
- The person and what's true when the scene opens: ${intake.story || '(unspecified)'}
- What a GOOD line does vs. a weak one: ${intake.goodVsWeak || '(unspecified)'}
- How they react handled well vs. mishandled: ${intake.reactions || '(unspecified)'}
- Wrong beliefs the scene should disprove: ${intake.misconceptions || '(unspecified)'}
- What MUST happen before it can end well: ${intake.gateMust || '(unspecified)'}
- How they talk / what they'd never do: ${intake.characterStyle || '(left to you — keep it human and specific)'}
- Must-knows every learner leaves with:\n${lines(intake.mustKnows).map((x) => '  · ' + x).join('\n') || '  (unspecified)'}
- How the coach should come across: ${intake.coachVibe || '(warm, curious, non-judgmental peer)'}`;
    }
    function foundBlock(acc) {
      const f = acc.results.foundation || {};
      return `THE SCENARIO SO FAR (generated foundation — stay consistent with it)
- Title: ${f.title || ''}
- Character: ${f.characterName || ''} · Learner: ${f.learnerName || ''}
- THE SETUP (canon): ${f.setupText || ''}`;
    }

    T.wizard = {
      title: 'Start from scratch — Roleplay',
      tagline: 'Rehearse a hard conversation with a simulated person. Their reactions are the feedback.',
      intro: 'A few quick questions, then an AI-drafted roleplay lands in the editor.',
      describePlaceholder: 'e.g. College students practice checking in on a friend whose drinking has changed — a warm peer coach, and it shouldn’t end until they make a real plan to connect.',

      derive(intake) {
        if (!intake.time) intake.time = 10;
        intake.pacing = intake.time >= 15 ? { sceneLines: '6-8', duration: '15-minute' }
          : intake.time >= 10 ? { sceneLines: '4-6', duration: '10-minute' }
          : { sceneLines: '3-4', duration: '5-minute' };
      },

      steps: [
        { id: 'brief', title: 'The brief', sub: 'The high-level shape. You can change any of this later in the editor.',
          fields: [
            { key: 'topic', kind: 'text', required: true, label: 'What is this conversation practice about?',
              placeholder: 'e.g. Checking in on a friend whose drinking has changed', helper: 'One line. Everything else builds on this.' },
            { key: 'title', kind: 'text', label: 'Working title (optional)', helper: 'Leave blank and the draft proposes one.' },
            { key: 'course', kind: 'text', label: 'The training it lives inside (optional)',
              placeholder: 'e.g. a college alcohol & substance education program', helper: 'Sets the tone. Start with "a …".' },
            { key: 'time', kind: 'chips', label: 'Target time on task', default: 10,
              options: [
                { value: 5, label: '~5 minutes', desc: '3-4 scene lines' },
                { value: 10, label: '~10 minutes', desc: '4-6 scene lines' },
                { value: 15, label: '~15 minutes', desc: '6-8 scene lines' },
              ] },
            { key: 'sourceText', kind: 'source', minRows: 7, label: 'Source material — paste anything (optional)',
              placeholder: 'An outline, slide text, a policy excerpt, SME notes…',
              helper: 'We’ll pull specifics from this instead of inventing them.' },
          ] },
        { id: 'interview', title: 'Scenario shape', sub: 'Answer like you\'re briefing a colleague. Plain language — no prompt-writing.',
          fields: [
            { key: 'story', kind: 'area', required: true, minRows: 6, label: 'Who is the person, and what\'s true when the scene opens?',
              helper: 'The situation as it stands — history, what\'s changed, why it matters now.' },
            { key: 'learnerRel', kind: 'text', required: true, label: 'Who is the learner to them?',
              placeholder: 'e.g. her roommate and closest friend' },
            { key: 'characterName', kind: 'text', label: 'The character\'s first name', placeholder: 'e.g. Kendra' },
            { key: 'learnerName', kind: 'text', label: 'The learner\'s name in the story (optional)',
              helper: 'Leave blank and the draft proposes one that fits.' },
            { key: 'goodVsWeak', kind: 'area', required: true, minRows: 3, label: 'What does a GOOD line from the learner do — and what do weak lines do instead?',
              helper: 'What separates a strong line from a weak one.' },
            { key: 'reactions', kind: 'area', required: true, minRows: 3, label: 'How do they react when handled well? When mishandled?',
              helper: 'This is the feedback the learner actually feels.' },
            { key: 'misconceptions', kind: 'area', required: true, minRows: 3, label: 'What wrong beliefs should the scene disprove by consequence?',
              helper: 'e.g. "confrontation motivates change — it actually triggers withdrawal".' },
            { key: 'gateMust', kind: 'area', required: true, minRows: 2, label: 'What MUST happen before this conversation can end well?',
              helper: 'Name the move that has to happen — a warm chat alone shouldn\'t count as success.' },
            { key: 'gateHard', kind: 'toggle', default: true, label: 'Hard gate — the scene can\'t end until it happens (off = nudge twice, then move on)' },
            { key: 'characterStyle', kind: 'area', minRows: 2, label: 'How do they talk? What would they never do?',
              helper: 'Keep them human, not a caricature.' },
            { key: 'mustKnows', kind: 'lines', required: true, minRows: 4, label: 'What must every learner walk away knowing?',
              helper: 'One per line, 3-5.' },
            { key: 'coachVibe', kind: 'text', label: 'How should the coach come across? (optional)',
              placeholder: 'e.g. warm, curious peer — not an instructor with the right answer' },
            { key: 'elevatedStakes', kind: 'toggle', default: false,
              label: 'Crisis-adjacent topic — append the locked 988 support floor to the resources' },
          ] },
      ],

      start(type) {
        const d = type.blank();
        d.learnerName = '';
        d.reflectionFocus = [];
        d.dimensions = [];
        d.reactions = [];
        d.misconceptions = [];
        return d;
      },

      plan(intake) {
        return [
          { id: 'foundation', label: 'Foundation — the person, the canon & the warm-up',
            detail: 'Title, setup canon, opening question, reflection focus, coach persona.',
            build(ik) {
              return { maxTokens: 1900,
                system: SYS + `

YOUR TASK — the roleplay's FOUNDATION. Return this exact JSON shape:
{
 "title": "learner-facing title, short",
 "learnerName": "the learner's first name in this story",
 "characterName": "the character's first name",
 "courseContext": "lowercase phrase starting 'a …' naming the course register",
 "setupText": "150-250 words, present tense, addressed to the AI as canon: who the character is, the history, what's changed, what's true when the scene opens, and why the LEARNER is the one standing there. This is the locked do-not-contradict canon. Escape paragraph breaks as \\n\\n.",
 "openingImage": "one line: what the learner sees walking in — the model's first narration beat paints this",
 "establishingTitle": "2-4 words: WHERE the learner is about to step in, shown big on the pre-entry card (e.g. 'Kendra's room')",
 "establishingSub": "1-2 short sentences under it: what's true + what the learner is about to do — second person, present tense",
 "openingQuestion": "the coach's prep question, on screen before the scene — invites reflection about approach, ends in a question mark",
 "reflectionFocus": ["2-3 short phrases — ideas the coach draws out pre-scene if the learner misses them"],
 "introEyebrow": "small label over the situation card", "introTitle": "3-6 human words",
 "situationText": "120-180 words, SECOND PERSON — the narrated read-along version of the setup for the learner. Escape breaks as \\n\\n.",
 "coachPersona": "one line: the coach's stance",
 "coachGuidance": "2-4 sentences TO the coach: probe intent before a line, reflect the reaction after, offer retries, never lecture — in the mold of the exemplar"
}

CRAFT EXEMPLARS (the shipped gold-standard build — match craft and density, NOT topic):
- setup: """${EX.setup}"""
- establishing card: ${EX.establishing}
- openingQuestion: ${JSON.stringify(EX.openingQuestion)}
- coachVoice: ${EX.coachVoice}`,
                user: `${briefBlock(ik)}\n\n${interviewBlock(ik)}\n\n${sourceBlock(ik, 6000)}\n\nWrite the foundation JSON now.` };
            },
            apply(json, draft, ik) {
              draft.title = str(ik.title).trim() || str(json.title);
              draft.learnerName = str(json.learnerName) || 'the learner';
              draft.characterName = str(ik.characterName).trim() || str(json.characterName);
              draft.courseContext = str(ik.course).trim() || depunct(json.courseContext);
              draft.setup = str(json.setupText);
              draft.openingImage = depunct(json.openingImage);
              draft.establishing = { eyebrow: 'The scene', title: depunct(json.establishingTitle), sub: str(json.establishingSub) };
              draft.openingQuestion = str(json.openingQuestion);
              draft.reflectionFocus = Array.isArray(json.reflectionFocus) ? json.reflectionFocus.map(str).filter(Boolean) : [];
              draft.pacing = { ...(ik.pacing || { sceneLines: '4-6', duration: '10-minute' }) };
              draft.elevatedStakes = !!ik.elevatedStakes;
              draft.coachVoice = { persona: depunct(json.coachPersona), guidance: str(json.coachGuidance) };
              // Narrated-audio context by default; empty-but-valid sub-blocks so
              // switching modality later never surfaces another scenario's text.
              draft.intro = {
                type: 'audio',
                video: { scenes: [] },
                story: { kicker: '', headline: '', instruction: '', paragraphs: [''], keyMoments: [] },
                audio: { eyebrow: str(json.introEyebrow) || 'The situation · listen or read along', title: str(json.introTitle), text: str(json.situationText) },
              };
            },
            doneNote(json) { return `“${json.title || 'untitled'}” — ${json.characterName || '?'} & ${json.learnerName || '?'}`; } },

          { id: 'assessment', label: 'Silent assessment — dimensions & misconceptions',
            detail: 'What every scene line is scored on; the beliefs the scene disproves.',
            build(ik, acc) {
              return { maxTokens: 1500,
                system: SYS + `

YOUR TASK — the SILENT ASSESSMENT. Every scene line the learner speaks is scored (never shown) on 2-4 dimensions; the character's reaction is DRIVEN by that score. Misconceptions are beliefs the scene disproves BY CONSEQUENCE, not lecture. Return this exact JSON shape:
{
 "dimensions": [ {"name": "1-2 words", "strong": "what a good line does", "weak": "what weak lines do — the old distractors, specific"} ],
 "misconceptions": [ {"belief": "the wrong take, stated plainly", "consequence": "what the scene shows happening instead"} ]
}
2-4 of each. Dimensions must be INDEPENDENT (a line can be strong on one and weak on another).

CRAFT EXEMPLARS (shipped build — match craft, NOT topic):
- dimensions: ${EX.dimensions}
- misconceptions: ${EX.misconceptions}`,
                user: `${foundBlock(acc)}\n\n${interviewBlock(ik)}\n\n${sourceBlock(ik, 3500)}\n\nWrite the assessment JSON now.` };
            },
            apply(json, draft) {
              draft.dimensions = Array.isArray(json.dimensions) ? json.dimensions.map((d) => ({ name: str((d || {}).name), strong: str((d || {}).strong), weak: str((d || {}).weak) })) : [];
              draft.misconceptions = Array.isArray(json.misconceptions) ? json.misconceptions.map((m) => ({ belief: str((m || {}).belief), consequence: str((m || {}).consequence) })) : [];
            },
            doneNote(json) { return `${(json.dimensions || []).length} dimensions, ${(json.misconceptions || []).length} misconceptions`; } },

          { id: 'character', label: 'The character — reaction map, style & the gate',
            detail: 'When/then reactions, hard limits, what must happen to resolve.',
            build(ik, acc) {
              return { maxTokens: 1800,
                system: SYS + `

YOUR TASK — the CHARACTER MODEL and the GATE. The reaction map is feedback-per-distractor played out in-scene; the gate is the required move before the scene may resolve${ik.gateHard === false ? ' (SOFT: after two nudges the coach accepts the fallback and moves on honestly)' : ' (HARD: no positive resolution until it happens)'}. Return this exact JSON shape:
{
 "reactions": [ {"when": "the learner-move pattern", "then": "how the character responds — in steps, recoverable, human"} ],
 "styleNotes": "how they talk; hard limits — what they never do (never theatrical, no therapy-speak)",
 "gate": {"requirement": "the required move, concrete", "notSuccess": "one line naming what does NOT count as success", "teach": "the 3-5 word arc the coach teaches (e.g. 'notice → reach out → listen → connect')", "nudgeOpen": "first nudge — open question", "nudgeConcrete": "second nudge — concrete", "fallback": "the minimum the coach accepts after two nudges"},
 "completion": {"condition": "when the practice ends", "resolutionExample": "ONE verbatim line the character might say as the scene resolves — earned, small, in-voice"}
}
3 reactions spanning mishandled / half-handled / handled well.

CRAFT EXEMPLARS (shipped build — match craft, NOT topic):
- reactions: ${EX.reactions}
- styleNotes: ${JSON.stringify(EX.styleNotes)}
- gate: ${EX.gate}
- completion: ${EX.completion}`,
                user: `${foundBlock(acc)}\n\n${interviewBlock(ik)}\n\n${sourceBlock(ik, 3000)}\n\nWrite the character JSON now.` };
            },
            apply(json, draft, ik) {
              draft.reactions = Array.isArray(json.reactions) ? json.reactions.map((r) => ({ when: str((r || {}).when), then: str((r || {}).then) })) : [];
              draft.styleNotes = str(json.styleNotes);
              const g = json.gate || {};
              draft.gate = { mode: ik.gateHard === false ? 'soft' : 'hard', requirement: str(g.requirement), notSuccess: str(g.notSuccess), teach: str(g.teach), nudgeOpen: str(g.nudgeOpen), nudgeConcrete: str(g.nudgeConcrete), fallback: str(g.fallback) };
              const c = json.completion || {};
              draft.completion = { condition: str(c.condition), resolutionExample: str(c.resolutionExample) };
            },
            doneNote(json) { return `${(json.reactions || []).length} reactions — ${(json.gate || {}).requirement ? 'gate set' : 'no gate'}`; } },

          { id: 'close', label: 'The close — playbook & resources',
            detail: 'The guaranteed takeaways every learner leaves with.',
            build(ik, acc) {
              return { maxTokens: 1500,
                system: SYS + `

YOUR TASK — the guaranteed CLOSE, shown identically to EVERY learner after the practice. Return this exact JSON shape:
{
 "playbook": [ {"title": "short imperative point", "body": "1-2 sentences", "source": "AUDIT TRAIL — the source line or interview answer this traces to; empty string if general craft"} ],
 "resources": {"lead": "one coach sentence introducing where the CHARACTER could really turn", "items": [ {"title": "the place/person", "body": "what it offers"} ]}
}
5-8 playbook components covering every must-know; 2-4 REAL resources for this scenario's world. Never invent URLs or organizations.`,
                user: `${foundBlock(acc)}\n\nMUST-KNOWS:\n${lines(ik.mustKnows).map((x) => '- ' + x).join('\n') || '(unspecified)'}\n\n${sourceBlock(ik, 2500)}\n\nWrite the close JSON now.` };
            },
            apply(json, draft) {
              draft.playbook = Array.isArray(json.playbook) ? json.playbook.map((p) => ({ title: str((p || {}).title), body: str((p || {}).body), source: str((p || {}).source) })) : [];
              const r = json.resources || {};
              draft.resources = { lead: str(r.lead), items: Array.isArray(r.items) ? r.items.map((i) => ({ title: str((i || {}).title), body: str((i || {}).body) })) : [] };
            },
            doneNote(json) { return `${(json.playbook || []).length} playbook components, ${((json.resources || {}).items || []).length} resources`; } },
        ];
      },

      landNote() { return 'Roleplay drafted — review the character card and gate, then run the guardrails and a playtest.'; },
    };
  })();

  /* =======================================================================
     2) TEACH-BACK — the learner explains required topics from memory; a live
        grader credits coverage. The wizard's job is mostly the TOPIC LIST:
        expand the author's lines into gradeable {short, full, synonyms}
        rows — or propose the list from source material.
     ======================================================================= */
  (function attachTeachBack() {
    const T = window.AitheraStudio.get('teach-back');
    if (!T || T.wizard) return;
    const D = T.DEFAULT;
    const EX = {
      topics: JSON.stringify((D.topics || []).slice(0, 3), null, 1),
      calibrate: JSON.stringify(D.calibrate, null, 1),
      rules: str((D.grade || {}).rules),
      close: str((D.close || {}).guidance),
    };

    const SYS = `You are an expert learning-experience designer for Aithera's TEACH-BACK engine: the learner has just finished a course and must teach its required topics back from memory — each topic is a blurred tile that resolves as a live AI grader credits it. No roleplay, no hidden rubric: the score IS the point, and the tone stays warm and non-punitive. A designer has answered a plain-language interview; you translate it into the exercise's fields.

${CRAFT_COMMON}`;

    T.wizard = {
      title: 'Start from scratch — Teach-Back',
      tagline: 'The learner teaches required topics back from memory while an AI grades coverage live.',
      intro: 'Name the training, list the required topics (or let the draft propose them), and the exercise lands in the editor.',
      describePlaceholder: 'e.g. Learners just finished our HazCom training — have them teach back the required elements (labels, SDS, routes of exposure…) from memory.',

      steps: [
        { id: 'brief', title: 'The brief', sub: 'What the learner just finished, and where the topic list comes from.',
          fields: [
            { key: 'topic', kind: 'text', required: true, label: 'What did the learner just finish learning?',
              placeholder: 'e.g. Hazard Communication (HazCom) employee training', helper: 'One line. They’ll teach this back.' },
            { key: 'title', kind: 'text', label: 'Working title (optional)', helper: 'Leave blank and the draft proposes one.' },
            { key: 'subject', kind: 'text', label: 'The training, as the coach should say it (optional)',
              placeholder: 'e.g. a Hazard Communication (HazCom) training', helper: 'Start with "a …". Leave blank and the draft phrases it.' },
            { key: 'sourceText', kind: 'source', minRows: 7, label: 'Source material — paste the training outline or standard (optional)',
              placeholder: 'The training outline, the regulation\'s required-elements list, slide text…',
              helper: 'The best topic lists come straight from here.' },
          ] },
        { id: 'interview', title: 'The topics', sub: 'The required list is the whole exercise. What must a complete answer cover?',
          fields: [
            { key: 'topicsList', kind: 'lines', minRows: 6, label: 'The required topics — one per line',
              helper: 'Leave blank to let the draft propose them from your source material.' },
            { key: 'leniency', kind: 'area', minRows: 3, label: 'How lenient should crediting be? Any topics easily confused with each other?',
              helper: 'Sets the grading rules — what counts, what doesn\'t.' },
            { key: 'coachVibe', kind: 'text', label: 'How should the coach come across? (optional)',
              placeholder: 'e.g. warm safety veteran; zero pop-quiz energy' },
          ] },
      ],

      start(type) {
        const d = type.blank();
        d.topics = [];
        return d;
      },

      plan(intake) {
        return [
          { id: 'topics', label: 'The required topics', detail: 'Tile labels, gradeable descriptions, accepted phrasings.',
            build(ik) {
              const authored = lines(ik.topicsList);
              return { maxTokens: 2000,
                system: SYS + `

YOUR TASK — the REQUIRED TOPIC LIST. Return this exact JSON shape:
{
 "title": "learner-facing exercise title, short",
 "subject": "lowercase phrase starting 'a …' naming the course",
 "topics": [ {"short": "tile label, 3-8 words", "full": "the complete idea in 1-2 sentences — what the grader matches the learner's words against", "synonyms": "comma-separated plain-language phrasings that earn credit"} ]
}
${authored.length ? `The designer supplied ${authored.length} topics — keep their ORDER and MEANING exactly; expand each into a gradeable row.` : 'The designer supplied NO list — derive the complete required-topic list from the source material (a regulation\'s own required elements beat your memory). 6-12 topics.'}
HARD LENGTH BUDGET — stay under 1500 tokens: every string tight; synonyms 4-8 phrases.

CRAFT EXEMPLAR (shipped build — first 3 of 10; match craft, NOT topic):\n${EX.topics}`,
                user: `THE BRIEF\n- Learner just finished: ${ik.topic || '(unspecified)'}\n- Working title: ${str(ik.title).trim() || '(none — propose one)'}\n- Course phrasing: ${str(ik.subject).trim() || '(propose, starting "a …")'}\n\n${authored.length ? 'THE DESIGNER\'S TOPICS (one per line, keep order):\n' + authored.map((t, i) => `${i + 1}. ${t}`).join('\n') + '\n\n' : ''}${sourceBlock(ik, 6000)}\n\nWrite the topics JSON now.` };
            },
            apply(json, draft, ik) {
              draft.title = str(ik.title).trim() || str(json.title);
              draft.subject = str(ik.subject).trim() || depunct(json.subject);
              draft.topics = Array.isArray(json.topics) ? json.topics.map((t) => ({ short: str((t || {}).short), full: str((t || {}).full), synonyms: str((t || {}).synonyms) })) : [];
            },
            doneNote(json) { return `${(json.topics || []).length} topics — “${json.title || 'untitled'}”`; } },

          { id: 'framing', label: 'The three briefs — calibration, grading, close',
            detail: 'The warm-up chat, the crediting rules, the results tone.',
            build(ik, acc) {
              const t = acc.results.topics || {};
              return { maxTokens: 1400,
                system: SYS + `

YOUR TASK — the exercise's THREE BRIEFS. Return this exact JSON shape:
{
 "calibrate": {"openingQuestion": "the coach's on-screen opening — confidence check ending in a question mark", "coachGuidance": "brief TO the coach for the warm-up chat: no scoring yet, 2-3 short sentences per message, then point them to 'Start teaching'"},
 "grade": {"rules": "the grader's judgment calls, one rule per line (\\n-separated): crediting leniency, which near-neighbor topics stay distinct, what never gets credit"},
 "close": {"guidance": "brief for the results message: how to phrase the score ('you named X of N', never 'you missed'), what to praise, how to name one area to hold onto — 2-3 sentences total"}
}

CRAFT EXEMPLARS (shipped build — match craft, NOT topic):
- calibrate: ${EX.calibrate}
- grade.rules: ${JSON.stringify(EX.rules)}
- close.guidance: ${JSON.stringify(EX.close)}`,
                user: `THE EXERCISE SO FAR\n- Title: ${t.title || ''} · Course: ${t.subject || ''}\n- Topics (${(t.topics || []).length}):\n${(t.topics || []).map((x, i) => `  ${i + 1}. ${(x || {}).short}`).join('\n')}\n\nDESIGNER NOTES\n- Crediting leniency / confusable topics: ${ik.leniency || '(default: credit plain language generously; never credit topics they never gestured at)'}\n- Coach vibe: ${ik.coachVibe || '(warm, encouraging, zero pop-quiz energy)'}\n\nWrite the briefs JSON now.` };
            },
            apply(json, draft) {
              const c = json.calibrate || {};
              draft.calibrate = { openingQuestion: str(c.openingQuestion), coachGuidance: str(c.coachGuidance) };
              draft.grade = { rules: str((json.grade || {}).rules) };
              draft.close = { guidance: str((json.close || {}).guidance) };
            },
            doneNote() { return 'calibration chat, grading rules & closing tone set'; } },
        ];
      },

      landNote() { return 'Teach-back drafted — check the topic list against your standard, then publish and run the live page.'; },
    };
  })();

  /* =======================================================================
     3) OBSERVE-REACT — the learner reviews footage in segments; the coach
        probes what they caught against a rubric, ending on a synthesis gate.
     ======================================================================= */
  (function attachObserveReact() {
    const T = window.AitheraStudio.get('observe-react');
    if (!T || T.wizard) return;
    const D = T.DEFAULT;
    const EX = {
      segments: JSON.stringify((D.segments || []).map((s) => ({ label: s.label, caption: s.caption })), null, 1),
      establishing: JSON.stringify(D.establishing),
      openers: JSON.stringify(D.openers, null, 1),
      dimensions: JSON.stringify((D.dimensions || []).slice(0, 2), null, 1),
      gate: JSON.stringify(D.gate, null, 1),
      completion: JSON.stringify(D.completion, null, 1),
      openingQuestion: str(D.openingQuestion),
    };

    const SYS = `You are an expert learning-experience designer for Aithera's OBSERVE/REACT engine: the learner REVIEWS authored footage of a real scene in segments; between segments an AI coach probes what they saw against a rubric — one beat at a time, asking before it validates — and the run ends on a SYNTHESIS gate ("now it's yours — walk me through it"). No characters, no roleplay; the coach reacts ONLY to what the footage shows. A designer has answered a plain-language interview; you translate it into the module's fields.

${CRAFT_COMMON}`;

    T.wizard = {
      title: 'Start from scratch — Observe / React',
      tagline: 'The learner reviews footage segment by segment while a coach probes what they caught.',
      intro: 'Describe the footage and what a trained eye should catch. The rest lands in the editor.',
      describePlaceholder: 'e.g. New firefighters review footage of a hazmat tanker rollover size-up, segment by segment, and get probed on what a first-arriving officer should catch.',

      steps: [
        { id: 'brief', title: 'The brief', sub: 'What the footage shows, at the highest level.',
          fields: [
            { key: 'topic', kind: 'text', required: true, label: 'What is this review about?',
              placeholder: 'e.g. First-arriving size-up of a hazmat tanker rollover', helper: 'One line. The skill the footage teaches.' },
            { key: 'title', kind: 'text', label: 'Working title (optional)', helper: 'Leave blank and the draft proposes one.' },
            { key: 'sourceText', kind: 'source', minRows: 6, label: 'Source material — paste anything (optional)',
              placeholder: 'The procedure, the standard, incident-report notes…' },
          ] },
        { id: 'interview', title: 'The footage & the eye', sub: 'What the viewer sees, and what a trained eye should catch in it.',
          fields: [
            { key: 'segmentsList', kind: 'lines', required: true, minRows: 4, label: 'The footage — one segment per line, in viewing order',
              helper: 'What\'s on screen in each segment. No clips yet? The page shows placeholder frames until you add URLs.' },
            { key: 'videoUrls', kind: 'lines', minRows: 2, noSeed: true, label: 'Video URLs in the same order (optional)',
              helper: 'e.g. ../assets/videos/my-clip.mp4 — leave blank lines for segments without footage yet.' },
            { key: 'expertEye', kind: 'area', required: true, minRows: 4, label: 'What should a trained eye catch — and what does a weak read miss?',
              helper: 'This is what the coach quietly probes against.' },
            { key: 'synthesisAsk', kind: 'area', required: true, minRows: 2, label: 'The final ask — what should the learner walk through at the end?',
              placeholder: 'e.g. tomorrow this call drops and YOU\'RE first on scene — your first moves', helper: 'The final question that ends the run.' },
            { key: 'gateHard', kind: 'toggle', default: false, label: 'Hard gate — keep probing until the synthesis is complete (off = nudge twice, then accept a partial answer)' },
            { key: 'mustKnows', kind: 'lines', required: true, minRows: 3, label: 'What must every learner walk away knowing?',
              helper: 'One per line.' },
            { key: 'coachVibe', kind: 'text', label: 'How should the coach come across? (optional)',
              placeholder: 'e.g. veteran officer reviewing tape — direct, never shaming the crew on screen' },
          ] },
      ],

      start(type) {
        const d = type.blank();
        d.segments = [];
        d.dimensions = [];
        d.openers = [];
        return d;
      },

      plan(intake) {
        return [
          { id: 'footage', label: 'The footage — narration & scripted openers',
            detail: 'Per-segment captions, the opening question, the return lines.',
            build(ik) {
              const segs = lines(ik.segmentsList);
              return { maxTokens: 1700,
                system: SYS + `

YOUR TASK — the FOOTAGE SPINE. Return this exact JSON shape:
{
 "title": "learner-facing title, short",
 "establishingTitle": "2-4 words for the pre-entry card: the incident/scene name (e.g. 'I-65 Tanker Rollover')",
 "establishingSub": "1-2 short sentences under it: what the footage shows and what the learner will do with it — second person",
 "openingQuestion": "the coach's first on-screen line after the cold-open segment — set the stakes plainly, then ask the first concrete observation question",
 "segments": [ {"label": "Segment N: what is literally on screen (grounds the coach — it reacts ONLY to this)", "caption": "the narration read over the clip — the coach's spoken voice, 1-2 sentences"} ],
 "openers": [ {"segment": 2, "line": "verbatim coach line on returning from that segment"} ]
}
One segments[] entry per designer segment, SAME order and count. Openers: one for each segment AFTER the first (the first's return is the openingQuestion) — make one of them an affective beat ("how did that feel to watch?") and the LAST one deliver the synthesis ask verbatim-ish from the designer's final ask.

CRAFT EXEMPLARS (shipped build — match craft, NOT topic; it predates the voice rules, so do NOT copy its "Sit with that" opener — the banned list wins):
- establishing card: ${EX.establishing}
- openingQuestion: ${JSON.stringify(EX.openingQuestion)}
- segments: ${EX.segments}
- openers: ${EX.openers}`,
                user: `THE BRIEF\n- Review is about: ${ik.topic || '(unspecified)'}\n- Working title: ${str(ik.title).trim() || '(none — propose one)'}\n\nTHE DESIGNER'S SEGMENTS (one per line, keep order and count):\n${segs.map((s, i) => `${i + 1}. ${s}`).join('\n') || '(none)'}\n\nTHE FINAL ASK: ${ik.synthesisAsk || '(unspecified)'}\n\n${sourceBlock(ik, 4000)}\n\nWrite the footage JSON now.` };
            },
            apply(json, draft, ik) {
              const urls = lines(ik.videoUrls);
              draft.title = str(ik.title).trim() || str(json.title);
              draft.establishing = { eyebrow: 'Scene size-up', title: depunct(json.establishingTitle), sub: str(json.establishingSub) };
              draft.openingQuestion = str(json.openingQuestion);
              draft.segments = Array.isArray(json.segments) ? json.segments.map((s, i) => ({ src: urls[i] || '', label: str((s || {}).label), caption: str((s || {}).caption) })) : [];
              draft.openers = Array.isArray(json.openers) ? json.openers.map((o) => ({ segment: Number((o || {}).segment) || 0, line: str((o || {}).line) })).filter((o) => o.segment >= 2 && o.line) : [];
            },
            doneNote(json) { return `${(json.segments || []).length} segments, ${(json.openers || []).length} scripted openers`; } },

          { id: 'rubric', label: 'The rubric & the synthesis gate',
            detail: 'What the coach probes for; how the run ends.',
            build(ik, acc) {
              const f = acc.results.footage || {};
              return { maxTokens: 1500,
                system: SYS + `

YOUR TASK — the PROBING RUBRIC and the GATE${ik.gateHard ? ' (HARD: keep probing until the requirement is met)' : ' (SOFT: two nudges, then accept the fallback honestly)'}. Return this exact JSON shape:
{
 "dimensions": [ {"name": "1-2 words", "strong": "what a sound read names", "weak": "the read the footage should disprove"} ],
 "gate": {"requirement": "what the learner's synthesis must name, concretely", "nudgeOpen": "first nudge — open question", "nudgeConcrete": "second nudge — concrete, almost gives it away", "fallback": "the minimum accepted after two nudges"},
 "completion": {"condition": "what ends the run", "note": "brief TO the coach for the closing message: affirm what THIS learner actually caught across the segments, few sentences, never recite the authored results screen"}
}
3-4 dimensions, grounded in what the FOOTAGE actually shows.

CRAFT EXEMPLARS (shipped build — match craft, NOT topic):
- dimensions (first 2 of 4): ${EX.dimensions}
- gate: ${EX.gate}
- completion: ${EX.completion}`,
                user: `THE MODULE SO FAR\n- Title: ${f.title || ''}\n- Segments:\n${(f.segments || []).map((s, i) => `  ${i + 1}. ${(s || {}).label}`).join('\n')}\n\nDESIGNER NOTES\n- What a trained eye catches vs. a weak read: ${ik.expertEye || '(unspecified)'}\n- The final ask: ${ik.synthesisAsk || '(unspecified)'}\n\n${sourceBlock(ik, 3000)}\n\nWrite the rubric JSON now.` };
            },
            apply(json, draft, ik) {
              draft.dimensions = Array.isArray(json.dimensions) ? json.dimensions.map((d) => ({ name: str((d || {}).name), strong: str((d || {}).strong), weak: str((d || {}).weak) })) : [];
              const g = json.gate || {};
              draft.gate = { mode: ik.gateHard ? 'hard' : 'soft', requirement: str(g.requirement), nudgeOpen: str(g.nudgeOpen), nudgeConcrete: str(g.nudgeConcrete), fallback: str(g.fallback) };
              const c = json.completion || {};
              draft.completion = { condition: str(c.condition), note: str(c.note) };
            },
            doneNote(json) { return `${(json.dimensions || []).length} rubric dimensions — ${(json.gate || {}).requirement ? 'gate set' : 'no gate'}`; } },

          { id: 'close', label: 'The close — playbook & resources',
            detail: 'The guaranteed takeaways every learner leaves with.',
            build(ik, acc) {
              const f = acc.results.footage || {};
              return { maxTokens: 1400,
                system: SYS + `

YOUR TASK — the guaranteed CLOSE, shown identically to EVERY learner. Return this exact JSON shape:
{
 "playbook": [ {"title": "short imperative point", "body": "1-2 sentences", "source": "AUDIT TRAIL — the source line or interview answer this traces to; empty string if general craft"} ],
 "resources": {"lead": "one sentence introducing what to keep within reach", "items": [ {"title": "the reference/tool/team", "body": "what it's for"} ]}
}
4-6 playbook components covering every must-know; 2-4 REAL resources. Never invent URLs or organizations.`,
                user: `THE MODULE\n- Title: ${f.title || ''}\n\nMUST-KNOWS:\n${lines(ik.mustKnows).map((x) => '- ' + x).join('\n') || '(unspecified)'}\n\n${sourceBlock(ik, 2500)}\n\nWrite the close JSON now.` };
            },
            apply(json, draft) {
              draft.playbook = Array.isArray(json.playbook) ? json.playbook.map((p) => ({ title: str((p || {}).title), body: str((p || {}).body), source: str((p || {}).source) })) : [];
              const r = json.resources || {};
              draft.resources = { lead: str(r.lead), items: Array.isArray(r.items) ? r.items.map((i) => ({ title: str((i || {}).title), body: str((i || {}).body) })) : [] };
            },
            doneNote(json) { return `${(json.playbook || []).length} playbook components, ${((json.resources || {}).items || []).length} resources`; } },
        ];
      },

      landNote() { return 'Observe/React drafted — drop in the video URLs when you have them; placeholder frames show until then.'; },
    };
  })();
})();
