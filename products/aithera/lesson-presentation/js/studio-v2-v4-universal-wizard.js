/* =========================================================================
   WRITER STUDIO V2 — WIZARD SPEC FOR THE UNIVERSAL SCENARIO (Scenario CML v4)
   Loaded ONLY by writer-studio-v2.html, AFTER js/scenario-types/v4-universal.js
   (and after the shared craft + the wizard engine). Attaches
   `v4-universal.wizard` so the go-forward format is buildable from scratch
   rather than dropping the author into an all-fields editor.

   WHY THIS SPEC LOOKS LIKE THE MIX & MATCH ONE
   v4 has no scenario type: a scenario is an ordered list of STEPS (`phases`),
   each picking one practice `mode` (coach_inquiry | roleplay | observe_react).
   That is the same authoring shape as a composed beat list, so the interview's
   key field is a STEP OUTLINE — one line per step, prefixed with its mode — and
   generation is one task per step, which also keeps each call inside the
   worker's ~2000-token cap.

   WHAT IS v4-SPECIFIC, AND WHY THE TASK ORDER IS WHAT IT IS
     · The scene WORLD is generated before the steps, because §9.1 rule 4 says a
       roleplay's `character_id` must name a character declared in
       `scene_world.characters`. Generating the cast first is what lets a
       roleplay step reference a real id instead of inventing one.
     · TEACHING POINTS are generated AFTER the steps, because v4 keeps teaching
       at content level grouped by subject, and the runtime finds a graded step's
       conclusion by matching a `teaching_points.topic` to the phase LABEL
       (scenario-v4-runtime.js `teachingByTopic`). Labels only exist once the
       steps are drafted — so this task is handed them and told to emit one topic
       named EXACTLY for each determinate step. That closes the validator's
       "determinate practice with no conclusion" warning by construction.
     · The three SAFETY FLAGS (elevated_stakes / involves_minors /
       threat_content) are declared Vector extensions and the only way the
       engine's floors arm on a v4 document, so the interview asks for them
       outright. They are written only when true — a false flag would add a
       stripped-extension warning that buys nothing.
     · An observe step's `exhibit.src` is left EMPTY on purpose: the wizard
       cannot see pixels (same call scene-sweep's spec makes). The alt text and
       the exhibit's ground-truth facts ARE drafted, so the step becomes valid
       the moment an author points it at a file.
   ========================================================================= */
(function () {
  'use strict';
  if (!window.AitheraStudio) return;
  const T = window.AitheraStudio.get('v4-universal');
  if (!T || T.wizard) return;

  const craft = window.AitheraWizardCraft;
  if (!craft) return;
  const { lines, str, depunct, sourceBlock,
          BANNED_PHRASES, GROUNDING_BASE, CITATION_RULE, OUTPUT_JSON_RULE } = craft;
  const TPL = () => window.ScenarioV4Templates || null;

  const clampInt = (v, d, min) => {
    const lo = typeof min === 'number' ? min : 1;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= lo ? n : d;
  };
  const slug = (s) => str(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const strArr = (v) => Array.isArray(v) ? v.map((x) => str(x).trim()).filter(Boolean) : [];
  const oneLine = (s) => str(s).replace(/\s+/g, ' ').trim();

  /* ---- step-line parsing: "<mode>: <what happens>" -----------------------
     Only a COLON separates the mode from the description, with a spaced dash as
     a fallback. That distinction matters: a bare hyphen would split "coach-led:
     did this cross the line?" at the hyphen and swallow "led" into the mode. */
  const MODE_WORDS = {
    coach: 'coach_inquiry', coachled: 'coach_inquiry', coachinquiry: 'coach_inquiry',
    inquiry: 'coach_inquiry', reason: 'coach_inquiry', reflect: 'coach_inquiry',
    decide: 'coach_inquiry', plan: 'coach_inquiry', think: 'coach_inquiry',
    recognize: 'coach_inquiry', recognise: 'coach_inquiry', judge: 'coach_inquiry',
    roleplay: 'roleplay', scene: 'roleplay', talk: 'roleplay', say: 'roleplay',
    speak: 'roleplay', character: 'roleplay', conversation: 'roleplay',
    practice: 'roleplay', confront: 'roleplay', respond: 'roleplay',
    observe: 'observe_react', observereact: 'observe_react', watch: 'observe_react',
    video: 'observe_react', clip: 'observe_react', react: 'observe_react',
    spot: 'observe_react', photo: 'observe_react', image: 'observe_react',
    scan: 'observe_react', look: 'observe_react',
  };
  const MODE_LABEL = { coach_inquiry: 'Coach inquiry', roleplay: 'Roleplay', observe_react: 'Observe & react' };
  const MODE_TURNS = { coach_inquiry: 2, roleplay: 5, observe_react: 3 };
  const normKey = (s) => str(s).toLowerCase().replace(/[\s_-]+/g, '');

  function parseStepLine(line) {
    const raw = str(line).trim();
    const tryMatch = (re) => {
      const m = raw.match(re);
      if (!m) return null;
      const mode = MODE_WORDS[normKey(m[1])];
      return mode ? { mode, desc: m[2].trim() } : null;
    };
    return tryMatch(/^([a-z][a-z0-9/_ -]*?)\s*:\s*(.+)$/i)
        || tryMatch(/^([a-z][a-z0-9/_ -]*?)\s+[–—-]\s+(.+)$/i)
        || { mode: 'coach_inquiry', desc: raw };
  }
  /* A clip/video step gets a video exhibit; everything else a still. */
  const exhibitType = (desc) => /\b(video|clip|footage|watch|recording)\b/i.test(str(desc)) ? 'video' : 'image';

  /* ---- the shared craft spine, in v4's two registers --------------------- */
  const CRAFT_COMMON =
`You write TWO registers, and keeping them apart is everything:
- LEARNER-FACING TEXT (the narrative, every opening_messages line, an observe brief, a probe, a debrief's final word, the expert answer): short, warm, plain, real. A character's lines are emotional and consequential; the coach is a sharp colleague, never an AI assistant. Contractions. BANNED for the COACH (and anything pattern-matching them): ${BANNED_PHRASES}.
- MODEL-FACING GUIDANCE (every purpose, the exit requirement, each tier's look_for / response / progression, the debrief key points, a rubric nudge): dense INSTRUCTIONS a model reads mid-conversation. Imperative, specific; name the misconception to counter and the exact bar to hold.

${GROUNDING_BASE} ${CITATION_RULE}

${OUTPUT_JSON_RULE}`;

  /* The four rules that are LOAD ERRORS in v4 rather than style preferences.
     Rule 1 is §9.2's prompt-smell lint, rule 3 is the POC V4 content check. */
  const V4_RULES =
`SCENARIO CML v4 — HARD RULES. Break one and the document fails the production loader, so these are not style notes:
1. NO PROMPT OR INTERFACE TEXT ANYWHERE IN THE CONTENT. Never refer to the software running the scenario, the screen, the chat window, or the model reading the text. Never use double square brackets. Describe the SITUATION and the TEACHING only.
2. THE THREE TIER NAMES ARE FIXED: exactly "unthoughtful", "neutral", "strong". Never rename one, never add a fourth, never omit one where all three are asked for.
3. A STEP LABEL MUST NOT RESTATE ITS OWN POSITION. Never "Phase 1", "Step 2 — ...", "Part 3:". The player already renders "Phase N of M". Use the story's own name for the segment ("The Report", "The Parking Lot", "The Group Chat").
4. WRITE NAMES AND DETAILS LITERALLY. No placeholders, no template braces, no "[insert name]".`;

  const SYS = `You are an expert learning-experience designer and prompt engineer authoring directly in SCENARIO CML v4 — the content format Aithera's production Scenario Simulator engine loads.

v4 HAS NO SCENARIO TYPE FIELD. A scenario is an ordered list of STEPS. Each step pairs a PRACTICE (the learner acts) with a DEBRIEF (the coach teaches against that specific attempt). Every practice picks exactly one mode:
- coach_inquiry — the learner reasons, decides or plans with the coach. No character in the room.
- roleplay — the learner speaks to a character, in a live scene that reacts.
- observe_react — the learner studies one exhibit (a photo or a clip), logs what they notice, and is credited against a fixed rubric.
What the scenario IS emerges from the modes its steps use. A designer has answered a plain-language interview; you translate it into v4 fields with shipped-quality craft.

${CRAFT_COMMON}

${V4_RULES}`;

  const NO_COPY =
`DO NOT COPY THE EXEMPLAR'S CONTENT: it is a different, shipped scenario with its own people, setting and facts. Match its density, structure and register — never its names, its topic, or its claims. Write THIS scenario's world.`;

  /* ---- exemplars pulled LIVE from the shipped v4 templates ---------------
     Craft reference only. Per mode, prefer the template that shape came from,
     then fall back through the rest so a task always has something real. */
  const TPL_FOR_MODE = { coach_inquiry: 'guided-arc', roleplay: 'ensemble-arc', observe_react: 'observe-react' };
  const TPL_ORDER = ['mix-arc', 'guided-arc', 'ensemble-arc', 'scene-sweep', 'observe-react', 'branching-arc', 'teach-back'];

  function tplDoc(id) {
    const t = TPL();
    const d = t && t.get(id);
    return (d && d.content) ? d.content : null;
  }
  function phaseExemplar(mode) {
    const ids = [TPL_FOR_MODE[mode]].concat(TPL_ORDER);
    for (let i = 0; i < ids.length; i += 1) {
      const c = tplDoc(ids[i]);
      const ph = c && (c.phases || []).find((p) => ((p || {}).practice || {}).mode === mode);
      if (ph) return JSON.stringify(ph, null, 1);
    }
    return '(no exemplar available)';
  }
  function contentExemplar(keys) {
    for (let i = 0; i < TPL_ORDER.length; i += 1) {
      const c = tplDoc(TPL_ORDER[i]);
      if (!c) continue;
      const out = {};
      keys.forEach((k) => { if (c[k] !== undefined) out[k] = c[k]; });
      if (Object.keys(out).length === keys.length) return JSON.stringify(out, null, 1);
    }
    return '(no exemplar available)';
  }

  /* ---- interview → prompt blocks ---------------------------------------- */
  function briefBlock(ik) {
    return `THE BRIEF
- Topic: ${ik.topic || '(unspecified)'}
- Working title: ${str(ik.title).trim() || '(none — propose one)'}
- Training it lives inside: ${ik.course || '(unspecified)'}
- The learner plays: ${ik.learnerRole || '(unspecified)'}
- The steps, in order (mode: what happens):
${stepOutline(ik) || '  (unspecified)'}`;
  }
  function stepOutline(ik, hi) {
    return lines(ik.stepsList).map(parseStepLine)
      .map((p, i) => `  ${i + 1}. [${MODE_LABEL[p.mode]}] ${p.desc}${i === hi ? '   <-- THIS STEP' : ''}`)
      .join('\n');
  }
  function interviewBlock(ik) {
    return `THE INTERVIEW
- What's true as the scenario opens: ${ik.situation || '(unspecified)'}
- Where it takes place: ${ik.setting || '(left to you — infer a concrete setting)'}
- Who else is in it:
${lines(ik.castList).map((x) => '  · ' + x).join('\n') || '  (left to you — cast whoever the steps require)'}
- Strong handling vs. weak: ${ik.goodVsWeak || '(left to you — infer from the steps)'}
- Must-knows every learner leaves with:
${lines(ik.mustKnows).map((x) => '  · ' + x).join('\n') || '  (unspecified)'}
- How the coach should come across: ${ik.coachVibe || '(a warm, level peer coach; affirms before redirecting; never preachy)'}
- Content flags: ${[ik.elevatedStakes && 'crisis-adjacent', ik.involvesMinors && 'involves a minor', ik.threatContent && 'threat/violence content'].filter(Boolean).join(', ') || 'none'}`;
  }
  function castBlock(acc) {
    const cast = (acc && acc.cast) || [];
    if (!cast.length) return 'THE DECLARED CAST: none — a roleplay step here must be narrator-driven (character_id null).';
    return 'THE DECLARED CAST — a roleplay step may only name one of these ids:\n'
      + cast.map((c) => `  · id "${c.id}" — ${c.name}${c.role ? ', ' + c.role : ''}`).join('\n');
  }

  /* ---- levels ------------------------------------------------------------
     A partial block is kept rather than dropped: the validator names the exact
     missing tier, which is more useful to an author than silently losing two
     good tiers because the third came back short. */
  function buildLevels(raw, allowProgression) {
    const src = (raw && typeof raw === 'object') ? raw : {};
    const out = {};
    ['unthoughtful', 'neutral', 'strong'].forEach((k) => {
      const l = src[k] || {};
      const look = str(l.look_for).trim();
      const res = str(l.response).trim();
      if (!look || !res) return;
      out[k] = { look_for: look, response: res };
      if (allowProgression && str(l.progression).trim()) out[k].progression = str(l.progression);
    });
    return Object.keys(out).length ? out : null;
  }

  T.wizard = {
    title: 'Start from scratch — Universal Scenario',
    tagline: 'Author straight into POC V4 — compose any arc from coach-inquiry, roleplay and observe steps.',
    intro: 'Sketch the steps in order, answer a few questions, and a complete POC V4 document lands in the editor — validated live against the production loader’s own rules.',
    describePlaceholder: 'e.g. A shift supervisor notices a twelve-year veteran spiraling after being passed over for a lead role — first judge whether the signs add up, then talk to him before it escalates.',

    steps: [
      { id: 'brief', title: 'The brief', sub: 'The shape of the scenario. You can change any of this later in the editor.',
        fields: [
          { key: 'topic', kind: 'text', required: true, label: 'What is this scenario about?',
            placeholder: 'e.g. Recognizing and acting on early warning signs at work',
            helper: 'One line. Everything else builds on this.' },
          { key: 'title', kind: 'text', label: 'Working title (optional)',
            helper: 'Leave blank and the draft proposes one.' },
          { key: 'course', kind: 'text', label: 'The training it lives inside (optional)',
            placeholder: 'e.g. a workplace-violence prevention program for supervisors',
            helper: 'Sets the register. Start with "a …".' },
          { key: 'learnerRole', kind: 'text', required: true, label: 'Who does the learner play?',
            placeholder: 'e.g. a shift supervisor — the person positioned to notice and escalate' },
          { key: 'stepsList', kind: 'lines', required: true, minRows: 5,
            label: 'The steps — one per line, in order, each starting with its mode',
            helper: 'Prefix each line with coach:, roleplay:, or observe:. e.g. "coach: do these three signs add up?"; "observe: study the group-chat screenshot"; "roleplay: talk to Ray before shift". An unprefixed line becomes a coach step.' },
          { key: 'sourceText', kind: 'source', minRows: 7, label: 'Source material — paste anything (optional)',
            placeholder: 'A slide outline, the static scenario this replaces, a policy excerpt, SME notes…',
            helper: 'We’ll pull specifics from this instead of inventing them.' },
        ] },

      { id: 'world', title: 'The situation & the world', sub: 'Answer like you’re briefing a colleague. Plain language — no prompt-writing.',
        fields: [
          { key: 'situation', kind: 'area', required: true, minRows: 5,
            label: 'What’s true as the scenario opens?',
            helper: 'Second person, written TO the learner. v4 keeps one narrative, and it is also the coach’s only picture of the setup — so the coach can never know a richer version than the learner was shown.' },
          { key: 'setting', kind: 'text', label: 'Where does this take place? (optional)',
            placeholder: 'e.g. a public-sector agency, kept deliberately neutral — agency, shift, unit',
            helper: 'The scene world every scene shares. Scene-only — the coach never sees it.' },
          { key: 'castList', kind: 'lines', minRows: 3, label: 'Who else is in it? (optional)',
            helper: 'One per line: "Name — their role — what’s really driving them". Anyone the learner speaks to in a roleplay step has to be here.' },
          { key: 'goodVsWeak', kind: 'area', minRows: 3,
            label: 'What does strong handling look like — and what do weak moves look like? (optional)',
            helper: 'What separates a strong pass from a thin one. Feeds the three grading tiers on every step.' },
          { key: 'mustKnows', kind: 'lines', required: true, minRows: 4,
            label: 'What must every learner walk away knowing?',
            helper: 'One per line, 3-6. These become the teaching points and the expert answer.' },
          { key: 'coachVibe', kind: 'text', label: 'How should the coach come across? (optional)',
            placeholder: 'e.g. a warm, level peer who has supervised real crews — affirms before redirecting' },
          { key: 'warmUp', kind: 'toggle', default: true,
            label: 'Open with one ungraded gut-reaction question before the first step' },
          { key: 'elevatedStakes', kind: 'toggle', default: false,
            label: 'Crisis-adjacent topic — arm the crisis support floor' },
          { key: 'involvesMinors', kind: 'toggle', default: false,
            label: 'A minor is involved — arm the minor-protection floor' },
          { key: 'threatContent', kind: 'toggle', default: false,
            label: 'Carries threat or violence content — arm the threat floor' },
        ] },
    ],

    /* A COMPLETE blank v4 document with every authored container emptied — the
       tasks below fill them in order. blank() already scaffolds the shapes; this
       just clears the one placeholder phase and the placeholder rows so nothing
       half-empty survives into the draft. */
    start(type) {
      const d = type.blank();
      const c = d.content;
      c.phases = [];
      c.teaching_points = [];
      c.misconceptions = [];
      c.tone_guidelines = [];
      c.closing.ideal_response.component_groups = [];
      c.closing.ideal_response.summary = '';
      c.opening.opening_messages = [];   // prune drops the block entirely if the warm-up is off
      return d;
    },

    plan(intake) {
      const parsed = lines(intake.stepsList).map(parseStepLine);
      const N = Math.max(1, parsed.length);
      const tasks = [];

      /* ---- 1. foundation: identity, the landing, the coach ---------------- */
      tasks.push({ id: 'foundation', label: 'Foundation — title, narrative & coach voice',
        detail: 'The scenario’s identity, the landing the learner reads, and the coaching register.',
        build(ik) {
          return { maxTokens: 1700,
            system: SYS + `

YOUR TASK — the FOUNDATION. Return this exact JSON shape:
{
 "implementation_id": "kebab-case id, 3-6 words, no spaces — the production engine's routing key for this scenario",
 "title": "the learner-facing title, short and concrete",
 "narrative": "120-220 words, SECOND PERSON present tense — the landing the learner reads before anything happens. This is v4's ONE narrative and also the coach's only picture of the setup, so put everything the coach needs here and nothing the learner shouldn't see. Escape paragraph breaks as \\n\\n.",
 "coach_persona": "one line naming the coach's stance — who they are and how they carry this particular topic. In v4 this is the coach's whole identity, so make it carry weight. No trailing period.",
 "tone_guidelines": [ "3-5 imperative register rules for the coach in THIS scenario, one per entry" ],
 "landing_cta_label": "the button label that starts the scenario (e.g. 'Begin', 'Start the shift')"
}

${NO_COPY}

CRAFT EXEMPLAR (a shipped v4 narrative, persona and tone set):
${contentExemplar(['narrative', 'coach_persona'])}`,
            user: `${briefBlock(ik)}\n\n${interviewBlock(ik)}\n\n${sourceBlock(ik, 6000)}\n\nWrite the foundation JSON now.` };
        },
        apply(json, draft, ik) {
          const c = draft.content;
          draft.implementation_id = slug(json.implementation_id) || slug(ik.title) || slug(json.title) || 'untitled-scenario';
          c.title = str(ik.title).trim() || str(json.title);
          c.narrative = str(json.narrative);
          c.coach_persona = depunct(json.coach_persona);
          c.tone_guidelines = strArr(json.tone_guidelines);
          if (str(json.landing_cta_label).trim()) c.landing_cta_label = str(json.landing_cta_label).trim();
          /* Declared Vector extensions — the only way the engine's floors arm on
             a v4 document. Written only when ON, so an unset flag never adds a
             stripped-extension warning for nothing. */
          if (ik.elevatedStakes) c.elevated_stakes = true;
          if (ik.involvesMinors) c.involves_minors = true;
          if (ik.threatContent) c.threat_content = true;
        },
        doneNote(json) { return `“${str(json.title) || 'untitled'}” · ${slug(json.implementation_id) || 'no id'}`; } });

      /* ---- 2. scene world: setting, canon, cast --------------------------
         Before the steps, so a roleplay step can reference a declared id
         (§9.1 rule 4) instead of inventing one. */
      tasks.push({ id: 'world', label: 'The scene world — setting & cast',
        detail: 'The shared ground truth the scenes draw on. The coach never sees it.',
        build(ik, acc) {
          const f = acc.results.foundation || {};
          return { maxTokens: 1700,
            system: SYS + `

YOUR TASK — the SCENE WORLD: scene-only ground truth, deliberately separate from the narrative the learner read. Return this exact JSON shape:
{
 "setting": "one line fixing where this happens, concrete enough that every scene agrees",
 "canon_facts": [ "4-8 entries. Each is ONE thing that is simply true in this world — the history, the specific incidents, what has and has not happened yet. These are what stop two scenes contradicting each other." ],
 "characters": [ {
   "id": "kebab-case id",
   "name": "how the learner would address them",
   "role": "their role relative to the learner, one short phrase",
   "driver": "what is really going on for them — shapes every reaction, never announced out loud",
   "baseline": "how they present before the learner does anything",
   "guardrails": [ "1-3 hard limits on how this character may be played — what they never do" ]
 } ]
}
Cast every person the learner SPEAKS TO in a roleplay step, plus anyone the canon facts turn on. A character here is identity and disposition ONLY — how they react to being handled well or badly belongs to each step's grading tiers, not here.

${NO_COPY}

CRAFT EXEMPLAR (a shipped v4 scene world):
${contentExemplar(['scene_world'])}`,
            user: `THE SCENARIO\n- Title: ${f.title || ''}\n- Learner plays: ${ik.learnerRole || ''}\n- The steps:\n${stepOutline(ik)}\n\nNARRATIVE (already written — stay consistent with it):\n"""\n${str(f.narrative)}\n"""\n\n${interviewBlock(ik)}\n\n${sourceBlock(ik, 4000)}\n\nWrite the scene world JSON now.` };
        },
        apply(json, draft, ik, acc) {
          const cast = Array.isArray(json.characters) ? json.characters : [];
          const seen = Object.create(null);
          const characters = cast.map((chIn, i) => {
            const o = chIn || {};
            let id = slug(o.id) || slug(o.name) || ('character-' + (i + 1));
            while (seen[id]) id = id + '-' + (i + 1);
            seen[id] = true;
            const out = { id: id, name: str(o.name), role: str(o.role) };
            const beh = {};
            if (str(o.driver).trim()) beh.driver = str(o.driver);
            if (str(o.baseline).trim()) beh.baseline = str(o.baseline);
            const g = strArr(o.guardrails);
            if (g.length) beh.guardrails = g;
            if (Object.keys(beh).length) out.behavior = beh;
            return out;
          }).filter((ch) => ch.name || ch.id);

          draft.content.scene_world = {
            setting: str(json.setting) || str(ik.setting),
            canon: { facts: strArr(json.canon_facts) },
            characters: characters,
          };
          /* The ids the roleplay steps must choose from — carried on `acc` after
             slugifying, so a step never references an id we rewrote. */
          acc.cast = characters.map((ch) => ({ id: ch.id, name: ch.name, role: ch.role }));
        },
        doneNote(json) { return `${strArr(json.canon_facts).length} canon facts, ${(json.characters || []).length} characters`; } });

      /* ---- 3. the optional warm-up --------------------------------------
         `!== false` rather than a truthiness test, so this agrees with the
         field's own `default: true`. The engine seeds a toggle's intake the first
         time the field RENDERS, and the step rail lets an author jump straight to
         Generate — so an untouched warm-up can still be `undefined` here, and
         reading that as "off" would silently contradict a checkbox the author
         can see is ticked. */
      if (intake.warmUp !== false) {
        tasks.push({ id: 'opening', label: 'The warm-up — an ungraded gut read',
          detail: 'One exchange before the first step. Calibrated, never graded.',
          build(ik, acc) {
            const f = acc.results.foundation || {};
            return { maxTokens: 1100,
              system: SYS + `

YOUR TASK — the OPENING REFLECTION: one ungraded exchange before the first step. It exists to surface what the learner already believes, so the coach can calibrate rather than assess. Return this exact JSON shape:
{
 "label": "short name for this opening, 2-4 words",
 "purpose": "one line, model-facing: what this exchange is for",
 "opening_message": "the verbatim question the coach opens with — a gut read on what the learner just read, ending in a question mark",
 "input_placeholder": "the composer placeholder while they answer",
 "turns": 1 or 2,
 "button_label": "the label on the button that leaves the warm-up and starts the first step",
 "calibration_look_for": "model-facing: what a typical first answer contains, including the misconception to expect",
 "calibration_response": "model-facing: how to acknowledge it in 2-3 short bubbles and gently note any misconception. CALIBRATE ONLY — never grade, score, or evaluate the answer, and never preview what comes next; the next step is delivered on its own."
}

${NO_COPY}

CRAFT EXEMPLAR (a shipped v4 opening reflection):
${JSON.stringify((tplDoc('guided-arc') || {}).opening || {}, null, 1)}`,
              user: `THE SCENARIO\n- Title: ${f.title || ''}\n- Learner plays: ${ik.learnerRole || ''}\n- First step: ${(lines(ik.stepsList)[0] || '(unspecified)')}\n\nNARRATIVE the learner has just read:\n"""\n${str(f.narrative)}\n"""\n\nMUST-KNOWS (do NOT give these away here):\n${lines(ik.mustKnows).map((x) => '- ' + x).join('\n') || '(unspecified)'}\n\nWrite the opening JSON now.` };
          },
          apply(json, draft) {
            const op = draft.content.opening;
            op.id = 'opening_reflection';
            op.label = str(json.label) || 'Opening reflection';
            op.purpose = str(json.purpose);
            op.opening_messages = [{ text: str(json.opening_message) }];
            if (str(json.input_placeholder).trim()) op.input_placeholder = str(json.input_placeholder).trim();
            op.exit = { when: { turns: clampInt(json.turns, 2) } };
            op.transition = { button_label: str(json.button_label).trim() || 'Begin practicing' };
            const look = str(json.calibration_look_for).trim();
            const res = str(json.calibration_response).trim();
            /* The opening's levels are a restricted partial type — one authored
               tier is legal and enough. Both halves or neither: a tier with only
               a response fails the loader. */
            if (look && res) op.levels = { neutral: { look_for: look, response: res } };
            else delete op.levels;
          },
          doneNote(json) { return oneLine(json.label) || 'warm-up drafted'; } });
      }

      /* ---- 4. one task per step, branching on its mode ------------------- */
      parsed.forEach((ps, i) => {
        const mode = ps.mode;
        const isLast = i === N - 1;
        const isRoleplay = mode === 'roleplay';

        /* the mode's own interaction fields */
        const modeSchema = isRoleplay
          ? ` "setting": "one line placing THIS scene — where the learner and the character are, right now",
 "character_id": "the id of the character the learner speaks to, chosen from the declared cast below — or null for a narrator-driven scene about what the learner DOES rather than says",
 "partner_label": "how that character is labelled on screen (usually their name)",
 "emotion_hint": "the character's emotional starting state as this scene opens — not a per-tier reaction",
 "opening_messages": [ {"text": "a short narration beat placing the learner in the scene — no character_id on this one"}, {"text": "the character's verbatim first line", "character_id": "their id"} ],
 "input_placeholder": "e.g. 'Respond to Ray…'",
 "help_turns": 0, 1 or 2,`
          : mode === 'observe_react'
          ? ` "brief": [ {"text": "the locked briefing over the exhibit — what the learner is looking at and what they are being asked to find. Plain text only, no speaker."} ],
 "exhibit_alt": "a full visual description of the photo or clip — it must describe the exhibit well enough that the step works even before an image file is attached",
 "exhibit_facts": [ "3-6 ground-truth facts about what is actually IN the exhibit" ],
 "rubric": [ {"id": "kebab-case crediting key", "name": "what a learner would call this finding", "standard_term": "the formal or standards term for it", "nudge": "model-facing: a hint toward it that never names the answer"} ],
 "spot_target": "integer — how many rubric items the learner must find to complete the step. NEVER more than the number of rubric items you wrote.",
 "jot_placeholder": "the placeholder while the learner logs what they notice",`
          : ` "opening_messages": [ {"text": "the verbatim line the coach opens this practice with — the task, in the coach's voice, ending on the question the learner answers"} ],
 "input_placeholder": "the composer placeholder while the learner answers",`;

        const tierSchema = isRoleplay
          ? `{"look_for": "model-facing: how to recognise a pass at this tier", "response": "model-facing: how the character responds AND what the debrief must add", "progression": "model-facing: how far the scene moves at this tier — this is the ONLY mode where progression is legal"}`
          : `{"look_for": "model-facing: how to recognise a pass at this tier", "response": "model-facing: how the coach responds AND what the debrief must add"}`;

        tasks.push({
          id: 'step' + (i + 1),
          label: `Step ${i + 1} — ${MODE_LABEL[mode]}`,
          detail: ps.desc.slice(0, 60),
          build(ik, acc) {
            const f = acc.results.foundation || {};
            return { maxTokens: 2000,
              system: SYS + `

YOUR TASK — author STEP ${i + 1} of ${N}, a ${MODE_LABEL[mode].toUpperCase()} step: "${ps.desc}".${isLast ? ' This is the FINAL step — it resolves the scenario, and the expert answer follows it.' : ''} Return this exact JSON shape:
{
 "id": "kebab-case step id, 1-3 words, no dots",
 "label": "the story's own name for this segment, 2-5 words — see hard rule 3",
 "purpose": "one line, model-facing: what this segment of the story covers",
 "practice_purpose": "one line, model-facing: what the learner is being asked to do here, and why now",
 "answer_shape": "determinate" or "open" — "determinate" when there IS a right answer the coach must state plainly; "open" when it is judgment and the coach should deepen the learner's own answer instead of delivering a verdict,
 "exit_turns": integer — how many learner turns this practice gets,
 "exit_requirement": "model-facing: what the learner must have done for this practice to be complete",
 "practice_button_label": "the button that starts this practice — diegetic where it fits",
${modeSchema}
 "levels": { "unthoughtful": ${tierSchema}, "neutral": ${tierSchema}, "strong": ${tierSchema} },
 "debrief_label": "short name for this debrief, 2-4 words",
 "debrief_key_points": [ "2-4 entries — what this debrief lands for EVERY learner, however the attempt went" ],
 "debrief_follow_up": true or false — true only if there is a real question worth asking after the attempt,
 "debrief_probe": "if debrief_follow_up is true: the verbatim question the coach opens the debrief with. Empty string otherwise.",
 "debrief_final_word": "the coach's closing line for this step, learner-facing. REQUIRED when debrief_follow_up is false, where it is the debrief's entire remaining content after the key points.",
 "debrief_button_label": "the button leading out of this debrief — a story label beats 'Continue'"
}
All three tiers, named exactly as given. Never re-narrate what the learner just said back to them.${isRoleplay ? ' ON-STAGE RULE: the character the learner faces here must already have been established — named in the narrative or an earlier step. Never introduce a confrontation cold.' : ''}${mode === 'observe_react' ? ' The rubric IS the crediting contract: ids must be unique, and spot_target can never exceed the number of items.' : ''}

${NO_COPY}

CRAFT EXEMPLAR (a shipped v4 ${MODE_LABEL[mode]} step):
${phaseExemplar(mode)}`,
              user: `THE SCENARIO
- Title: ${f.title || ''}
- Learner plays: ${ik.learnerRole || ''}
- The full arc (this is step ${i + 1}):
${stepOutline(ik, i)}

NARRATIVE (for grounding — stay consistent with it):
"""
${str(f.narrative)}
"""

${castBlock(acc)}

THIS STEP: ${ps.desc}

STRONG vs WEAK: ${ik.goodVsWeak || '(infer from this moment)'}

MUST-KNOWS this step should move toward:
${lines(ik.mustKnows).map((x) => '- ' + x).join('\n') || '(unspecified)'}

Write the step JSON now.` };
          },
          apply(json, draft, ik, acc) {
            const c = draft.content;

            /* practice ------------------------------------------------------ */
            const practice = {
              mode: mode,
              purpose: str(json.practice_purpose),
              exit: { when: { turns: clampInt(json.exit_turns, MODE_TURNS[mode]) } },
              transition: { button_label: str(json.practice_button_label).trim() || 'Talk it through' },
              /* declared extension: no marker reads as "open", the safe default */
              answer_shape: str(json.answer_shape).toLowerCase() === 'determinate' ? 'determinate' : 'open',
              interaction: {},
            };
            if (str(json.exit_requirement).trim()) practice.exit.when.requirement = str(json.exit_requirement).trim();

            const it = practice.interaction;
            const levels = buildLevels(json.levels, isRoleplay);
            if (levels) it.levels = levels;

            const msgs = Array.isArray(json.opening_messages) ? json.opening_messages : [];
            const castIds = ((acc && acc.cast) || []).map((x) => x.id);
            const mapMsg = (m) => {
              const o = { text: str((m || {}).text) };
              const cid = slug((m || {}).character_id);
              if (cid && castIds.indexOf(cid) >= 0) o.character_id = cid;
              return o;
            };

            if (isRoleplay) {
              it.setting = str(json.setting);
              const cid = slug(json.character_id);
              /* null (or an id we cannot vouch for) = narrator-driven, a
                 first-class v4 pattern — better than emitting an id §9.1 rule 4
                 would reject. */
              if (cid && castIds.indexOf(cid) >= 0) it.character_id = cid;
              else it.character_id = null;
              const named = ((acc && acc.cast) || []).find((x) => x.id === it.character_id);
              it.partner_label = str(json.partner_label).trim() || (named ? named.name : '');
              if (str(json.emotion_hint).trim()) it.emotion_hint = str(json.emotion_hint).trim();
              it.opening_messages = msgs.map(mapMsg);
              if (str(json.input_placeholder).trim()) it.input_placeholder = str(json.input_placeholder).trim();
              const help = parseInt(json.help_turns, 10);
              if (Number.isFinite(help) && help >= 0) it.help_turns = help;
            } else if (mode === 'observe_react') {
              const rubric = (Array.isArray(json.rubric) ? json.rubric : []).map((r, k) => {
                const o = r || {};
                return {
                  id: slug(o.id) || ('finding-' + (k + 1)),
                  name: str(o.name),
                  standard_term: str(o.standard_term),
                  nudge: str(o.nudge),
                };
              }).filter((r) => r.name || r.id);
              /* dedupe: rubric ids are the engine's crediting keys */
              const usedIds = Object.create(null);
              rubric.forEach((r, k) => {
                while (usedIds[r.id]) r.id = r.id + '-' + (k + 1);
                usedIds[r.id] = true;
              });
              it.rubric = rubric;
              it.spot_target = Math.min(
                clampInt(json.spot_target, Math.max(1, Math.ceil(rubric.length / 2))),
                Math.max(1, rubric.length)
              );
              it.brief = (Array.isArray(json.brief) ? json.brief : []).map((m) => ({ text: str((m || {}).text) }));
              /* src stays EMPTY — the wizard cannot see pixels. alt + facts are
                 drafted so the step is one file away from valid; until then the
                 lints name exhibit.src, which is the honest state. */
              it.exhibit = { type: exhibitType(ps.desc), src: '', alt: str(json.exhibit_alt), facts: strArr(json.exhibit_facts) };
              if (str(json.jot_placeholder).trim()) it.jot_placeholder = str(json.jot_placeholder).trim();
            } else {
              it.opening_messages = msgs.map((m) => ({ text: str((m || {}).text) }));
              if (str(json.input_placeholder).trim()) it.input_placeholder = str(json.input_placeholder).trim();
            }

            /* debrief ------------------------------------------------------- */
            const debrief = {
              label: str(json.debrief_label) || 'Coach Debrief',
              key_points: strArr(json.debrief_key_points),
              transition: { button_label: str(json.debrief_button_label).trim() || 'Continue' },
            };
            const probe = str(json.debrief_probe).trim();
            const finalWord = str(json.debrief_final_word).trim();
            if (json.debrief_follow_up === true && probe) {
              debrief.follow_up_turns = 1;
              debrief.probe = { text: probe };
              if (finalWord) debrief.final_word = finalWord;
            } else {
              /* delivery-only: final_word is required, and probe /
                 input_placeholder / requirement are forbidden outright — so they
                 are never written here rather than written and pruned. */
              debrief.follow_up_turns = 0;
              debrief.final_word = finalWord;
            }

            /* the phase ----------------------------------------------------- */
            const used = c.phases.map((p) => str((p || {}).id));
            let id = slug(json.id) || ('step-' + (i + 1));
            while (used.indexOf(id) >= 0) id = id + '-' + (i + 1);
            const label = str(json.label) || ps.desc.slice(0, 40);
            c.phases.push({ id: id, label: label, purpose: str(json.purpose), practice: practice, debrief: debrief });

            /* what the teaching task needs: the labels of the graded steps */
            acc.steps = acc.steps || [];
            acc.steps.push({ label: label, mode: mode, shape: practice.answer_shape, desc: ps.desc });
          },
          doneNote(json) {
            const tiers = buildLevels(json.levels, isRoleplay);
            return `${oneLine(json.label) || 'step'} · ${MODE_LABEL[mode]} · ${tiers ? Object.keys(tiers).length : 0}/3 tiers`;
          },
        });
      });

      /* ---- 5. teaching points — AFTER the steps, so topics can match the
         graded steps' labels (the runtime finds a determinate step's conclusion
         by that exact string). ---------------------------------------------- */
      tasks.push({ id: 'teaching', label: 'Teaching points — grouped by subject',
        detail: 'What every learner leaves understanding, plus the misconceptions to counter.',
        build(ik, acc) {
          const steps = acc.steps || [];
          const graded = steps.filter((s) => s.shape === 'determinate');
          return { maxTokens: 1700,
            system: SYS + `

YOUR TASK — the TEACHING POINTS and the MISCONCEPTIONS. These are debrief-scoped: they are never shown mid-attempt. Return this exact JSON shape:
{
 "topics": [ {"topic": "the subject heading", "points": ["2-4 statements the coach must land under this heading"]} ],
 "misconceptions": [ {"misconception": "the wrong belief a learner brings in, in their own words", "redirect": "how the coach corrects it without shaming"} ]
}
Each topic renders as a heading with its points beneath it. Group by SUBJECT, not by step.
${graded.length
  ? `ONE EXCEPTION, AND IT MATTERS: the steps below are graded, and each needs a conclusion the coach can state plainly. Emit one topic for each, whose "topic" string is EXACTLY the label given, character for character:\n${graded.map((s) => '  · "' + s.label + '"').join('\n')}\nGroup any remaining teaching into further subject topics after those.`
  : 'No step in this scenario is graded, so group purely by subject.'}
3-6 topics total, 2-4 misconceptions.

${NO_COPY}

CRAFT EXEMPLAR (shipped v4 teaching points and misconceptions):
${contentExemplar(['teaching_points'])}`,
            user: `THE SCENARIO\n- Title: ${(acc.results.foundation || {}).title || ''}\n- About: ${ik.topic || ''}\n\nTHE STEPS AS DRAFTED:\n${(acc.steps || []).map((s, k) => `  ${k + 1}. "${s.label}" [${MODE_LABEL[s.mode]}, ${s.shape}] — ${s.desc}`).join('\n') || '(none)'}\n\nMUST-KNOWS:\n${lines(ik.mustKnows).map((x) => '- ' + x).join('\n') || '(unspecified)'}\n\n${sourceBlock(ik, 3000)}\n\nWrite the teaching JSON now.` };
        },
        apply(json, draft) {
          const c = draft.content;
          /* A topic with no points is a stub, not authoring work worth keeping:
             it carries only a heading, it would fail `points` minItems, and even
             a label-matched one contributes no conclusion (the runtime joins the
             points, so an empty list resolves to nothing). Dropped, exactly like
             an empty component group in the close. */
          c.teaching_points = (Array.isArray(json.topics) ? json.topics : []).map((t) => ({
            topic: str((t || {}).topic),
            points: strArr((t || {}).points),
          })).filter((t) => t.points.length);
          c.misconceptions = (Array.isArray(json.misconceptions) ? json.misconceptions : []).map((m) => ({
            misconception: str((m || {}).misconception),
            redirect: str((m || {}).redirect),
          })).filter((m) => m.misconception.trim() || m.redirect.trim());
        },
        doneNote(json) { return `${(json.topics || []).length} topics, ${(json.misconceptions || []).length} misconceptions`; } });

      /* ---- 6. the expert answer ----------------------------------------- */
      tasks.push({ id: 'close', label: 'The expert answer — the audit-defensible close',
        detail: 'Shipped verbatim to every learner, on every path.',
        build(ik, acc) {
          const f = acc.results.foundation || {};
          return { maxTokens: 1600,
            system: SYS + `

YOUR TASK — the EXPERT ANSWER. This ships verbatim to every learner on every path, so it is the audit record of what the training taught. Return this exact JSON shape:
{
 "component_groups": [ {"title": "the grouping heading", "components": ["the individual statements a complete expert answer contains — each one checkable"]} ],
 "summary": "2-4 sentences tying the components together — the last thing the learner reads",
 "source_references": [ "EXTERNAL authorities ONLY — a regulation or a standard (e.g. an OSHA clause, Title VII). NEVER an internal course, module or slide id, which means nothing outside the course. Empty array if nothing specific grounds this." ]
}
2-4 groups covering every must-know.${ik.elevatedStakes ? ' This scenario runs at elevated stakes; the crisis support line is appended by the engine, so do NOT list it yourself.' : ''} Never invent a regulation, a statistic, or an organization.

${NO_COPY}

CRAFT EXEMPLAR (a shipped v4 ideal response):
${contentExemplar(['closing'])}`,
            user: `THE SCENARIO\n- Title: ${f.title || ''}\n- About: ${ik.topic || ''}\n\nTHE STEPS AS DRAFTED:\n${(acc.steps || []).map((s, k) => `  ${k + 1}. "${s.label}" — ${s.desc}`).join('\n') || '(none)'}\n\nMUST-KNOWS (every one must be covered):\n${lines(ik.mustKnows).map((x) => '- ' + x).join('\n') || '(unspecified)'}\n\n${sourceBlock(ik, 3000)}\n\nWrite the expert answer JSON now.` };
        },
        apply(json, draft) {
          const ir = draft.content.closing.ideal_response;
          ir.component_groups = (Array.isArray(json.component_groups) ? json.component_groups : []).map((g) => {
            const o = g || {};
            const out = { components: strArr(o.components) };
            if (str(o.title).trim()) out.title = str(o.title).trim();
            return out;
          }).filter((g) => g.components.length);
          ir.summary = str(json.summary);
          ir.source_references = strArr(json.source_references);
        },
        doneNote(json) {
          const n = (json.component_groups || []).reduce((a, g) => a + strArr((g || {}).components).length, 0);
          return `${(json.component_groups || []).length} groups, ${n} components`;
        } });

      return tasks;
    },

    landNote(intake) {
      const hasObserve = lines(intake.stepsList).map(parseStepLine).some((p) => p.mode === 'observe_react');
      return 'Universal Scenario drafted in POC V4 — the lints panel lists every field the format still needs'
        + (hasObserve ? ', starting with the exhibit file for the observe step' : '')
        + '. Export from Dev handoff once it reads clean.';
    },
  };
})();
