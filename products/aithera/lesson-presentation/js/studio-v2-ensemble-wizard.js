/* =========================================================================
   WRITER STUDIO V2 — WIZARD SPEC FOR THE ENSEMBLE TYPE
   Loaded ONLY by writer-studio-v2.html, AFTER the ensemble-arc type module
   and after js/studio-v2-wizards.js. Attaches `ensemble-arc.wizard` so the
   wizard's "What are you building?" chooser can generate an Ensemble arc from
   scratch, exactly like the other studio-authorable types.

   Ensemble is the RICHEST schema (locked canon · a cast with earned-disclosure
   ledgers · cross-phase state · a multi-phase Practice⇄Learn arc whose
   transitions WRITE that state · a guaranteed playbook close), so generation is
   split per-section to fit the worker's ~2000-token/call cap, mirroring the
   guided-arc / roleplay wizards:

     foundation → world (canon + generic state) → cast (+ disclosures) →
     ONE call per phase (entry beats · calibration · debrief · state writes) →
     close (playbook + resources).

   Design rules are identical to the other specs: interviews ask SME questions
   in plain language (never prompt-writing); craft exemplars are pulled LIVE
   from the shipped Bullying DEFAULT so "what good looks like" can't drift; the
   prompts FORBID copying the exemplar's people/place/topic; provenance is never
   fabricated; every learner-facing line follows the banned-phrase voice rules;
   and start() builds a COMPLETE blank skeleton — never a merge with DEFAULT.

   The one ensemble-specific craft rule the prompts enforce hard: STATE KEYS ARE
   GENERIC ("parentTrust", not "reyesTrust") — so a generated scenario about
   different people carries forward through generic session variables, not
   names baked into the runtime.
   ========================================================================= */
(function () {
  'use strict';
  if (!window.AitheraStudio) return;
  const T = window.AitheraStudio.get('ensemble-arc');
  if (!T || T.wizard) return;
  const D = T.DEFAULT;

  // Shared intake helpers + coach-voice atoms live in js/studio-wizard-craft.js.
  const craft = window.AitheraWizardCraft;
  if (!craft) return;
  const { lines, trim, depunct, str, sourceBlock,
          BANNED_PHRASES, GROUNDING_BASE, CITATION_RULE, OUTPUT_JSON_RULE } = craft;
  const clampInt = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 1 ? n : d; };
  const camelKey = (v) => String(v || '').trim().replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/)
    .map((w, i) => i === 0 ? w.toLowerCase() : (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join('').slice(0, 40);
  const TIERS = ['UNTHOUGHTFUL', 'NEUTRAL', 'STRONG'];

  /* ---- the shared craft spine (same rules the other specs bake in) ------- */
  const CRAFT_COMMON =
`You write TWO registers, and keeping them apart is everything:
- LEARNER-FACING LINES (a character's spoken beats, the coach's scripted openers, narration): short, warm, plain, real. In-character lines are emotional and consequential; coach lines are a sharp colleague, never an AI assistant. Contractions. BANNED for the COACH (and anything pattern-matching them): ${BANNED_PHRASES}.
- GUIDANCE TO THE AI (reaction maps, disclosure ledgers, exit criteria, calibration tiers, debrief points): dense INSTRUCTIONS a model reads mid-conversation. Imperative, specific, semicolon-packed; name the misconceptions to counter and the exact bar to hold.

${GROUNDING_BASE} ${CITATION_RULE}

DO NOT COPY THE EXEMPLARS' CONTENT: the shipped build is about a parent (Ms. Reyes), a student (Bianca), and a bullied child (Sofia) at Pleasant Street Middle School. Those names, that place, and that topic are a CRAFT reference only — match their density and structure, never their people or facts. Write THIS scenario's world.

${OUTPUT_JSON_RULE}`;

  const SYS = `You are an expert learning-experience designer and prompt engineer for Aithera's ENSEMBLE engine: a summative, multi-phase role-play where the learner faces MORE THAN ONE distinct character across a connected arc — each character has their own behavior model and their own EARNED-DISCLOSURE ledger, and how the learner treated someone earlier is REMEMBERED and shapes a later beat. The path is CONVERGENT (every learner works all phases in order), but the SESSION STATE carries forward. A designer has answered a plain-language interview; you translate it into scenario fields with shipped-quality craft.

${CRAFT_COMMON}

ENSEMBLE-SPECIFIC CRAFT:
- PROGRESSIVE DISCLOSURE is the point: each character holds parts of their story back and reveals a piece ONLY when the learner earns it — never volunteered in an opening line, never dumped all at once.
- CHARACTERS REACT IN STEPS: never capitulate in one line, never melt down theatrically; a window closes and reopens slowly; flawed and human, never a caricature or a stereotype of any group.
- STATE KEYS ARE GENERIC: a session variable's "key" is a short camelCase handle for the RELATIONSHIP or COMMITMENT it tracks — e.g. "parentTrust", "employeeRapport", "commitmentMade" — NEVER a character's proper name (a key like "reyesTrust" is WRONG).`;

  function briefBlock(ik) {
    return `THE BRIEF
- Topic: ${ik.topic || '(unspecified)'}
- Working title: ${str(ik.title).trim() || '(none — propose one)'}
- Course it lives in: ${ik.course || '(unspecified)'}
- The learner plays (through-line role across every phase): ${ik.learnerRole || '(unspecified)'}
- Involves minors: ${ik.involvesMinors ? 'YES — portray any minor age-appropriately; never voice the target of harm; no peer mediation' : 'no — the characters are adults'}
- The connected moments (each becomes one phase, in order):
${lines(ik.phasesList).map((p, i) => `  ${i + 1}. ${p}`).join('\n') || '  (unspecified)'}`;
  }
  function interviewBlock(ik) {
    return `THE INTERVIEW
- What's true as the scenario opens (the landing the learner reads): ${ik.situation || '(unspecified)'}
- The people the learner faces, and how each acts / reacts handled well vs. badly: ${ik.cast || '(unspecified)'}
- What each character HOLDS BACK, and what the learner must do to earn it: ${ik.disclosures || '(unspecified)'}
- What should carry forward — how an earlier choice should change a later beat: ${ik.carriesForward || '(unspecified)'}
- What strong handling looks like across the arc vs. weak: ${ik.goodVsWeak || '(left to you — infer from the moments)'}
- Must-knows every learner leaves with:\n${lines(ik.mustKnows).map((x) => '  · ' + x).join('\n') || '  (unspecified)'}
- How the coach should come across: ${ik.coachVibe || '(warm, steady peer coach; affirms before redirecting; never preachy)'}`;
  }

  /* Exemplars pulled LIVE from the shipped Bullying DEFAULT — structure/craft
     reference ONLY (the prompts forbid copying their content). State is shown
     as a HAND-WRITTEN generic example on purpose, so the model never learns the
     name-specific "reyesTrust" key from the real default. */
  const EX = {
    canon: JSON.stringify((D.canon || []).slice(0, 3), null, 1),
    stateGeneric: JSON.stringify([
      { key: 'parentTrust', label: "The parent's trust", initial: 'guarded — they have tried the normal channels and half-expect to be brushed off again' },
      { key: 'commitmentMade', label: 'What you committed to', initial: 'nothing yet — the first conversation has not happened' },
    ], null, 1),
    castOne: JSON.stringify((D.cast || []).slice(0, 1), null, 1),
    phaseOne: (() => {
      const p = (D.phases || [])[0] || {};
      return JSON.stringify({
        label: p.label, level: p.level, world: p.world, counterpart: p.counterpart, maxTurns: p.maxTurns,
        signpost: (p.entry || {}).signpost, beats: (p.entry || {}).beats, cta: (p.entry || {}).cta,
        exitCriteria: p.exitCriteria, reactionGuidance: p.reactionGuidance,
        calibration: p.calibration, debrief: p.debrief,
      }, null, 1);
    })(),
    playbook: JSON.stringify((D.playbook || []).slice(0, 3), null, 1),
  };

  T.wizard = {
    title: 'Start from scratch — Ensemble',
    tagline: 'A summative role-play across several characters, where an earlier conversation shapes a later one.',
    intro: 'A few questions about the arc, the cast, and what carries forward, then an AI-drafted Ensemble scenario lands in the editor.',
    describePlaceholder: 'e.g. A new manager handles one harassment situation end-to-end — first the employee who reports it, then the coworker who did it, then closing the loop — and how they treat the reporter early should shape how she trusts them at the end.',

    steps: [
      { id: 'brief', title: 'The brief', sub: 'The shape of the arc. You can change any of this later in the editor.',
        fields: [
          { key: 'topic', kind: 'text', required: true, label: 'What is this scenario about?',
            placeholder: 'e.g. Responding to a harassment report end-to-end', helper: 'One line. Everything else builds on this.' },
          { key: 'title', kind: 'text', label: 'Working title (optional)', helper: 'Leave blank and the draft proposes one.' },
          { key: 'course', kind: 'text', label: 'The training it lives inside (optional)',
            placeholder: 'e.g. a workplace harassment prevention program for managers', helper: 'Sets the tone. Start with "a …".' },
          { key: 'learnerRole', kind: 'text', required: true, label: 'Who does the learner play — the same person across every phase?',
            placeholder: 'e.g. the team\'s manager — the one adult who has to carry this from report to resolution' },
          { key: 'phasesList', kind: 'lines', required: true, minRows: 4, label: 'The connected moments — one per line, in order',
            helper: 'Each becomes a phase. e.g. "The employee reports it — believe and gather"; "You witness it yourself — intervene"; "Sit with the coworker who did it"; "Close the loop".' },
          { key: 'involvesMinors', kind: 'toggle', default: false,
            label: 'This scenario involves minors — add the locked safeguarding floor (age-appropriate portrayal, no peer mediation, the target is never voiced)' },
          { key: 'sourceText', kind: 'source', minRows: 7, label: 'Source material — paste anything (optional)',
            placeholder: 'An outline, the static scenarios this replaces, a policy excerpt, SME notes…',
            helper: 'We\'ll pull specifics from this instead of inventing them.' },
        ] },
      { id: 'interview', title: 'The cast & what carries', sub: 'Answer like you\'re briefing a colleague. Plain language — no prompt-writing.',
        fields: [
          { key: 'situation', kind: 'area', required: true, minRows: 5, label: 'What\'s true as the scenario opens?',
            helper: 'The landing the learner reads before anyone speaks — who they are, what they\'ve noticed, what\'s about to happen.' },
          { key: 'cast', kind: 'area', required: true, minRows: 5, label: 'Who does the learner face across the arc — and how does each react handled well vs. badly?',
            helper: 'One short paragraph per person: who they are, their baseline, what\'s really driving them, and how they respond to good vs. poor handling.' },
          { key: 'disclosures', kind: 'area', required: true, minRows: 4, label: 'What does each character HOLD BACK — and what does the learner have to do to earn it?',
            helper: 'The heart of this type. A fact each person reveals only when treated a certain way (e.g. "she names the times she was ignored only when she feels doubted").' },
          { key: 'carriesForward', kind: 'area', required: true, minRows: 3, label: 'What should carry from one conversation into a later one?',
            helper: 'How an earlier choice should change a later beat — e.g. "how the manager treats the reporter decides how much she trusts them when they close the loop". This becomes the session memory.' },
          { key: 'goodVsWeak', kind: 'area', minRows: 3, label: 'Across the arc, what does strong handling look like — and what do weak moves look like? (optional)',
            helper: 'What separates a strong pass from a weak one, phase to phase. Feeds the calibration the coach reads against.' },
          { key: 'mustKnows', kind: 'lines', required: true, minRows: 4, label: 'What must every learner walk away knowing?',
            helper: 'One per line, 4-6. These become the guaranteed playbook.' },
          { key: 'coachVibe', kind: 'text', label: 'How should the coach come across? (optional)',
            placeholder: 'e.g. warm, steady peer who has handled these before — affirms before redirecting' },
          { key: 'elevatedStakes', kind: 'toggle', default: false,
            label: 'Crisis-adjacent topic — append the locked 988 support floor to the resources' },
        ] },
    ],

    start(type) {
      const d = type.blank();
      d.canon = [];
      d.state = [];
      d.cast = [];
      d.phases = [];        // the per-phase tasks fill these in order
      d.playbook = [];
      return d;
    },

    plan(intake) {
      const phaseLines = lines(intake.phasesList);
      const N = Math.max(1, phaseLines.length);

      const tasks = [
        { id: 'foundation', label: 'Foundation — the premise, the landing & the coach',
          detail: 'Title, framing, the situation the learner reads, coach voice, warm-up.',
          build(ik) {
            return { maxTokens: 1900,
              system: SYS + `

YOUR TASK — the ensemble's FOUNDATION. Return this exact JSON shape:
{
 "title": "learner-facing title, short",
 "framing": "lowercase phrase completing 'You facilitate <this>' — e.g. 'a summative role-play on responding to a harassment report end-to-end, one situation unfolding over about a week'",
 "learnerRole": "who the learner plays across every phase, one line",
 "courseContext": "lowercase phrase starting 'a …' naming the course register",
 "establishingTitle": "3-6 words for the pre-entry card — the scenario's name",
 "establishingSub": "1-2 short sentences under it: what's at stake and that how the learner treats each person decides how much they get — second person",
 "introEyebrow": "small label over the situation card (e.g. 'The situation · read')",
 "introTitle": "3-6 human words",
 "situationText": "150-260 words, SECOND PERSON present tense — the landing the learner reads before anyone speaks: who they are, what they've noticed, and that a first conversation is about to begin. This grounds the coach. Escape paragraph breaks as \\n\\n.",
 "coachPersona": "one line: the coach's stance",
 "reflectionPrompt": "an optional light warm-up question in the coach's voice, ending in a question mark — a gut-read before the first character (the app hands straight into Phase 1 after it). Return an empty string to open straight on the first character instead.",
 "reflectionFeedback": "brief TO the coach: calibrate the gut read in 2-3 short bubbles, never grade it, and END without previewing the scene"
}

CRAFT EXEMPLAR (shipped build — match craft and density, NOT the topic or the people):
- situationText (theirs): """${str((D.intro || {}).audio ? D.intro.audio.text : '')}"""`,
              user: `${briefBlock(ik)}\n\n${interviewBlock(ik)}\n\n${sourceBlock(ik, 6000)}\n\nWrite the foundation JSON now.` };
          },
          apply(json, draft, ik) {
            draft.title = str(ik.title).trim() || str(json.title);
            draft.framing = depunct(json.framing);
            draft.learnerRole = str(ik.learnerRole).trim() || str(json.learnerRole);
            draft.course = str(ik.course).trim() || str(json.courseContext);
            draft.elevatedStakes = !!ik.elevatedStakes;
            draft.involvesMinors = !!ik.involvesMinors;
            draft.establishing = { eyebrow: 'The scenario', title: depunct(json.establishingTitle), sub: str(json.establishingSub) };
            draft.voice = { persona: depunct(json.coachPersona), guidance: '' };
            // Reflection is authored-optional: enable the warm-up only if the
            // model actually wrote a prompt (an empty prompt = open straight on
            // the first character, the in-medias-res default the deck used).
            draft.reflection = { enabled: !!str(json.reflectionPrompt).trim(), prompt: str(json.reflectionPrompt), feedbackGuidance: str(json.reflectionFeedback) };
            // Reading-modality context by default (the ensemble landing is a read).
            draft.intro = {
              type: 'reading',
              video: { sound: true, scenes: [] },
              audio: { eyebrow: str(json.introEyebrow) || 'The situation · read', title: str(json.introTitle), text: str(json.situationText), continueLabel: 'Continue' },
            };
          },
          doneNote(json) { return `“${json.title || 'untitled'}”`; } },

        { id: 'world', label: 'The world — locked canon & cross-phase state',
          detail: 'The do-not-generate facts, and the session variables that carry forward.',
          build(ik, acc) {
            const f = acc.results.foundation || {};
            return { maxTokens: 1900,
              system: SYS + `

YOUR TASK — the LOCKED CANON and the CROSS-PHASE STATE. Return this exact JSON shape:
{
 "canon": ["do-not-generate facts, one idea each: the cast (names, ages if minors, who they are), the setting (keep it fictional; name no real state/district if that matters), the pattern or history, what each person knows and what they've already tried. The characters DRAW from these and never invent beyond them."],
 "state": [ {"key": "GENERIC camelCase handle — a relationship or commitment, NEVER a person's name", "label": "how it reads on the state line", "initial": "its starting value in plain words"} ]
}
CANON: 8-14 facts, enough that the characters never have to make things up. STATE: 1-3 variables — exactly the things the designer said should CARRY FORWARD (how much someone trusts the learner, what the learner promised). Keys MUST be generic ("parentTrust", "commitmentMade"), never "<name>Trust".

CRAFT EXEMPLARS (shipped build — match craft, NOT content):
- canon (first 3 of theirs): ${EX.canon}
- state (a GENERIC example — copy this KEY STYLE, not names): ${EX.stateGeneric}`,
              user: `THE SCENARIO SO FAR\n- Title: ${f.title || ''}\n- Situation: ${str(f.situationText).slice(0, 700)}\n\n${briefBlock(ik)}\n\nWHAT SHOULD CARRY FORWARD: ${ik.carriesForward || '(unspecified)'}\n\nTHE CAST (for the canon): ${ik.cast || '(unspecified)'}\n\n${sourceBlock(ik, 4000)}\n\nWrite the world JSON now.` };
          },
          apply(json, draft) {
            draft.canon = Array.isArray(json.canon) ? json.canon.map(str).filter((c) => c.trim()) : [];
            draft.state = Array.isArray(json.state) ? json.state.map((v) => ({
              key: camelKey((v || {}).key), label: str((v || {}).label), initial: str((v || {}).initial),
            })).filter((v) => v.key) : [];
          },
          doneNote(json) { return `${(json.canon || []).length} canon facts, ${(json.state || []).length} state vars`; } },

        { id: 'cast', label: 'The cast — behavior models & earned disclosures',
          detail: 'Each character\'s baseline, driver, reactions, and what they hold back.',
          build(ik, acc) {
            const w = acc.results.world || {};
            return { maxTokens: 2000,
              system: SYS + `

YOUR TASK — THE CAST: the characters the learner actually faces, each a full behavior model plus an EARNED-DISCLOSURE ledger. Return this exact JSON shape:
{
 "cast": [ {
   "name": "the character's name",
   "baseline": "how they start, before the learner does anything",
   "driver": "what's really going on for them — shapes every reaction; they never announce it",
   "reactions": [ {"when": "the learner-move pattern", "then": "how they respond — in believable steps, recoverable, human"} ],
   "styleNotes": "how they talk; hard limits — what they never do; never a caricature",
   "disclosures": [ {"fact": "a piece of their story they HOLD BACK", "earnedBy": "exactly what the learner must do for it to come out — and what keeps it shut"} ]
 } ]
}
Only the people the learner directly talks to are full cast members (bystanders live in the canon). 3 reactions per character spanning handled-well / half-handled / mishandled. 1-3 disclosures each — this is the headline capability; make the "earnedBy" specific and behavior-gated.

CRAFT EXEMPLAR (ONE shipped character — match the structure and density, NOT the person or topic):\n${EX.castOne}`,
              user: `THE CAST, IN THE DESIGNER'S WORDS: ${ik.cast || '(unspecified)'}\n\nWHAT EACH HOLDS BACK: ${ik.disclosures || '(unspecified)'}\n\nTHE CANON (stay consistent):\n${(w.canon || []).map((c) => '- ' + c).join('\n') || '(none)'}\n\n${sourceBlock(ik, 3000)}\n\nWrite the cast JSON now.` };
          },
          apply(json, draft) {
            draft.cast = Array.isArray(json.cast) ? json.cast.map((c) => ({
              name: str((c || {}).name),
              baseline: str((c || {}).baseline),
              driver: str((c || {}).driver),
              reactions: Array.isArray((c || {}).reactions) ? c.reactions.map((r) => ({ when: str((r || {}).when), then: str((r || {}).then) })) : [],
              styleNotes: str((c || {}).styleNotes),
              disclosures: Array.isArray((c || {}).disclosures) ? c.disclosures.map((d) => ({ fact: str((d || {}).fact), earnedBy: str((d || {}).earnedBy) })) : [],
            })) : [];
          },
          doneNote(json) { return `${(json.cast || []).length} characters, ${(json.cast || []).reduce((n, c) => n + ((c || {}).disclosures || []).length, 0)} disclosures`; } },
      ];

      // ---- ONE generation task per phase (state writes make the arc carry) --
      phaseLines.forEach((line, i) => {
        const isLast = i === N - 1;
        tasks.push({
          id: 'phase' + (i + 1),
          label: `Phase ${i + 1} — ${line.slice(0, 42)}`,
          detail: isLast ? 'The closing phase — resolve and hand to the report.' : 'Entry beats, calibration, debrief, and the state it writes.',
          build(ik, acc) {
            const f = acc.results.foundation || {};
            const w = acc.results.world || {};
            const cast = (acc.results.cast || {}).cast || [];
            const stateList = (w.state || []).map((v) => `"${v.key}" (${v.label}) — starts: ${v.initial}`).join('; ') || '(none declared)';
            const priorPhases = (ik._phaseLines || phaseLines);
            return { maxTokens: 1950,
              system: SYS + `

YOUR TASK — author PHASE ${i + 1} of ${N}${isLast ? ' (the FINAL phase — it resolves the arc)' : ''}: "${line}". A phase lives in a WORLD — a live SCENE opposite one character (the learner acts; you never coach mid-scene), or a COACHING turn (the learner works a task with the coach). It runs to a turn cap, then the coach steps back and lands the debrief for EVERY learner. Return this exact JSON shape:
{
 "label": "short phase name",
 "level": "sub-label, e.g. 'Phase ${i + 1} · believe, recognize, commit'",
 "world": "scene" | "coaching",
 "counterpart": "the character the learner faces in a scene (a cast name), or 'Narrator' for a narrated moment, or '' for a coaching phase",
 "maxTurns": ${isLast ? 4 : 5},
 "bridge": "${i === 0 ? 'leave empty — the app hands in from the warm-up' : 'a short verbatim line that advances the story into this phase (time passing, the next room)'}",
 "signpost": "the verbatim on-screen line framing what the learner does now (a task line for coaching; a scene-setter for a scene)",
 "prompt": "${i === 0 ? '' : 'for a COACHING phase, the verbatim task question; empty for a scene'}",
 "beats": [ {"kind": "narration" | "dialogue", "name": "speaker for dialogue only", "text": "verbatim locked opening beat — for a scene, usually a narration beat then the character's first line"} ],
 "cta": "the continue-button label into this phase (e.g. 'Talk to <name>')",
 "inputPlaceholder": "the composer placeholder while the learner is in this phase",
 "exitCriteria": "what 'done' means — the coach probes toward this and reports the tier against it",
 "reactionGuidance": "how the scene/character plays turn to turn — for a narrated scene, how it escalates on hesitation vs. resolves on a strong move; keep it recoverable and never graphic",
 "calibration": {"UNTHOUGHTFUL": "how a weak pass looks + what the debrief must add", "NEUTRAL": "a middling pass + what to add", "STRONG": "a strong pass + what to affirm"},
 "talkItThrough": "the verbatim line the coach opens the debrief with",
 "debriefPoints": "what the debrief LANDS for every learner, however the role-play went (the compliance point of this phase)",
 "stateWrites": ${isLast ? '{}' : `{ "UNTHOUGHTFUL": {"<stateKey>": "its new value if this pass was weak"}, "NEUTRAL": {"<stateKey>": "..."}, "STRONG": {"<stateKey>": "..."} }`}
}
${isLast ? 'This is the FINAL phase: it resolves the arc; "stateWrites" is {} (the app completes after it).' : `STATE WRITES: this phase RECORDS how it went into the session state so a later phase feels it. Write ONLY these declared variables, per tier: ${stateList}. If this phase changes nothing that carries, return "stateWrites": {}.`}
Use EXACTLY the tier names UNTHOUGHTFUL / NEUTRAL / STRONG. Never re-narrate the learner. Split spoken words (dialogue) from events (narration) in beats.

CRAFT EXEMPLAR (a shipped phase — match structure/craft, NOT its people or topic):\n${EX.phaseOne}`,
              user: `THE SCENARIO\n- Title: ${f.title || ''}\n- Learner plays: ${ik.learnerRole || ''}\n- The full arc (this is phase ${i + 1}):\n${priorPhases.map((p, k) => `  ${k + 1}. ${p}${k === i ? '   ← THIS PHASE' : ''}`).join('\n')}\n\nTHIS PHASE: ${line}\n\nTHE CAST:\n${cast.map((c) => `- ${c.name}: ${c.baseline}`).join('\n') || '(none)'}\n\nWHAT CARRIES FORWARD: ${ik.carriesForward || '(unspecified)'}\nSTRONG vs WEAK, ARC-WIDE: ${ik.goodVsWeak || '(infer from this moment)'}\n\nSITUATION (for grounding): ${str(f.situationText).slice(0, 600)}\n\nWrite the phase JSON now.` };
          },
          apply(json, draft) {
            const stateKeys = (draft.state || []).map((v) => v.key).filter(Boolean);
            const pickKeys = (o) => {
              const out = {}; const src = (o && typeof o === 'object') ? o : {};
              stateKeys.forEach((k) => { if (str(src[k]).trim()) out[k] = str(src[k]); });
              return out;
            };
            const sw = json.stateWrites || {};
            let transitions = [];
            if (!isLast) {
              const perTier = TIERS.map((t) => ({ onTier: t, next: '', set: pickKeys(sw[t]) }));
              const anyWrite = perTier.some((tr) => Object.keys(tr.set).length);
              transitions = anyWrite ? perTier : [{ onTier: '', next: '', set: {} }];
            }
            const cal = json.calibration || {};
            const calArr = Array.isArray(cal)
              ? cal.map((c) => ({ tier: str((c || {}).tier).toUpperCase(), guidance: str((c || {}).guidance) }))
              : TIERS.map((t) => ({ tier: t, guidance: str(cal[t]) }));
            draft.phases.push({
              id: 'phase' + (i + 1),
              label: str(json.label) || line.slice(0, 40),
              level: str(json.level),
              world: json.world === 'coaching' ? 'coaching' : 'scene',
              counterpart: str(json.counterpart),
              maxTurns: clampInt(json.maxTurns, isLast ? 4 : 5),
              entry: {
                bridge: str(json.bridge), bridgesByTier: {},
                signpost: str(json.signpost), prompt: str(json.prompt),
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
              calibration: calArr,
              debrief: { talkItThrough: str(json.talkItThrough), points: str(json.debriefPoints) },
              transitions,
            });
          },
          doneNote(json) { return `${str(json.label) || 'phase'} · ${json.world === 'coaching' ? 'coaching' : 'scene'}${json.counterpart ? ' · ' + json.counterpart : ''}`; },
        });
      });

      // ---- the guaranteed close -------------------------------------------
      tasks.push({ id: 'close', label: 'The close — playbook & resources',
        detail: 'The SME-validated points every learner leaves with, and where to turn.',
        build(ik, acc) {
          const f = acc.results.foundation || {};
          return { maxTokens: 1600,
            system: SYS + `

YOUR TASK — the guaranteed CLOSE, shown identically to EVERY learner after the arc (the role-plays personalize; this standardizes, so one summative scenario carries the load of the static checks it replaces). Return this exact JSON shape:
{
 "playbook": [ {"title": "short imperative point", "body": "1-2 sentences", "source": "AUDIT TRAIL — the source line or interview answer this traces to; empty string if general craft"} ],
 "resources": {"lead": "one coach sentence introducing where to turn", "items": [ {"title": "the place/person/policy", "body": "what it offers / how to use it"} ]}
}
5-8 playbook components covering every must-know; 2-4 REAL resources for this scenario's world.${ik.elevatedStakes ? ' The 988 crisis line is appended automatically — do NOT list it yourself.' : ''} Never invent URLs or organizations.

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

    landNote() { return 'Ensemble drafted — check the cast\'s earned disclosures and the state each phase writes, then run the guardrails and publish to test on the live page.'; },
  };
})();
