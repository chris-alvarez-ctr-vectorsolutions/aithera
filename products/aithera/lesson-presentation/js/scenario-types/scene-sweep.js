/* =========================================================================
   WRITER-STUDIO SCENARIO TYPE — scene-sweep ("Scene Sweep") — V1 SCHEMA
   A PERCEPTION-GRADING experience: the learner is themselves — no character —
   looking at ONE persistent illustrated work area, and they free-write
   everything that looks wrong. An AI coach credits each catch against a fixed
   OBSERVABLE-HAZARD RUBRIC, tracks COVERAGE (spotted N of M), nudges spatially
   toward the misses ("look again near the bench, and the drum beside it"), and
   then works the scene through two beats — Observe (spot) → Diagnose &
   Remediate (fix it now) — before the guaranteed SME close. This is the schema behind the HazCom
   "Spot the Hazard" build (RVCT-479), run by scene-sweep-live.html.

   HOW IT DIFFERS FROM the other coach-only types:
     · Teach-Back grades RECALL of prior training — no media, no place. Scene
       Sweep grades PERCEPTION of a scene in front of the learner.
     · Observe/React walks the learner through authored VIDEO SEGMENTS, the
       coach advancing them and probing one rubric DIMENSION at a time. Scene
       Sweep is ONE persistent image the learner SWEEPS themselves, credit is
       PER-HAZARD (coverage), and every catch feeds a fix/prevent follow-up.
     · It is effectively Teach-Back's coverage contract (a `covered[]`/`spotted[]`
       set against a fixed rubric) composed with a single embedded scene.

   THE TWO NET-NEW CAPABILITIES this POC proves (per the framework comparison):
     1. Perception-grading against a visual rubric — crediting free text against
        a fixed set of observable hazards, tracking coverage, generating
        spatially-aware "look again" nudges.
     2. Media embedded inside a scenario — a persistent illustrated scene the
        model must GROUND to. Ratified decision: the model grounds to a TAGGED
        OBJECT LIST (the authored `scene.canonDescription` + the `hazards[]`
        rubric, which carry each hazard's ZONE), NOT an image input. The
        illustration is for the LEARNER's eyes; the model reasons over the text.

   compile(s) assembles ONE coaching system-prompt STRING (perception-grading in
   one dialogue model). The turn contract adds a `spotted` array of hazard ids
   (drives the coverage rail) alongside the shared action/tier fields. Exposes
   window.AitheraSceneSweep for the live page; registers into
   window.AitheraStudio when present.
   ========================================================================= */
(function () {
  'use strict';
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {};
  const arr = (x) => Array.isArray(x) ? x : [];

  function fill(text, s) {
    return String(text == null ? '' : text)
      .replace(/\{\{\s*learner\s*\}\}/gi, (s && s.learnerName) || 'you');
  }

  /* =======================================================================
     LOCKED ENGINE SECTIONS — reuse the shared output contract from
     js/scenario.js so the JSON shape matches the rest of the studio.
     ======================================================================= */
  const SHARED = (window.AitheraScenario && window.AitheraScenario.ENGINE_SECTIONS) || [];
  const ENGINE_SECTIONS = SHARED.length ? SHARED : [
    { id: 'contract', title: 'Output contract',
      text: () => 'OUTPUT CONTRACT — return ONLY a JSON object (no prose, no markdown fences). Start with { and end with }. Never emit a raw line break inside a JSON string — escape paragraph breaks as \\n\\n:\n' +
        '{"turn":[{"speaker":"coach","kind":"coaching","text":"..."}],"spotted":["hazardId"],"action":"continue"|"teach"|"redirect","complete":false}' },
  ];

  /* The locked GROUNDING FLOOR — scene-sweep's own addition. The scene and its
     hazards are FIXED canon; the model grades against them and never invents.
     Compiled into every scene-sweep prompt. */
  const GROUNDING_SECTION = {
    id: 'grounding', title: 'Scene-grounding floor',
    note: 'The scene and its hazards are fixed. The model grades against the rubric and never invents or grades hazards outside it.',
    text: () =>
`SCENE-GROUNDING FLOOR — LOCKED. The work area and the hazards in it are FIXED, authored canon:
- You reason over the SCENE description and the OBSERVABLE-HAZARD RUBRIC below (a tagged object list). You do NOT see the illustration the learner sees — never claim to, and never describe visual detail beyond the canon.
- The rubric hazards are the ONLY hazards that exist and the ONLY ones you credit. Never invent, add, or imply hazards that aren't in the rubric.
- If the learner names something that isn't a rubric hazard (e.g. "it's messy," "the lighting"), acknowledge briefly and steer back to what's actually unsafe — do NOT credit it as a red flag and do NOT manufacture a new hazard to match.
- Credit generously WITHIN the rubric: any clear phrasing that points at a listed hazard counts, in any words. When in doubt about intent, credit it.
- Never reveal a hazard the learner hasn't spotted before they've had their look — nudge toward WHERE to look (its zone), never name what's there. The full rubric is only revealed by the app at the Observe debrief.`,
  };

  const SS_ENGINE_SECTIONS = ENGINE_SECTIONS.concat([GROUNDING_SECTION]);

  /* The locked coach-voice block (a safety-trainer register; kept parallel to
     the other types' banned-phrase rules). */
  const VOICE_BLOCK =
`VOICE — talk like a knowledgeable safety trainer walking the floor with the learner, NOT like a quiz machine or an AI assistant.
- Be SHORT. Most coaching bubbles are one or two sentences. Cut every word that isn't pulling weight.
- Authority plus genuine concern. You want them to leave able to SEE hazards, not recite them.
- CREDIT before correcting: name what they caught in standard terms first, then point them on.
- NUDGE, don't give away: point to where to look, never to what's there.
- BANNED phrases and their kin — never use these or anything that pattern-matches them: "I appreciate you being straight/honest with me", "I hear you", "that's valid", "sit with that", "here's the thing", "let's unpack", "lean into", "great question", "does that resonate", "I want to gently push".
- Warm but plain. Contractions, everyday words. End every turn with a next move.
- Vary how you open bubbles; don't start consecutive bubbles the same way.`;

  /* =======================================================================
     THE DEFAULT SCENARIO — "Spot the Hazard" (Hazard Communication GHS,
     RVCT-479), authored from the HazCom POC deck: one illustrated finishing
     bench with four observable hazards, worked Observe → Diagnose & Remediate,
     with the SME 10-topic + protective-measures close held as-is.
     ======================================================================= */
  const OPENING_SITUATION = 'You’ve just finished your hazard communication training — and now you’re standing at the finishing bench on the floor, where product gets wiped down, touched up, and boxed.\n\nA coworker is working right next to you. There’s a chemical drum to your right, a jug and some parts on the bench, the usual clutter of a shift in progress.\n\nNothing’s on fire. Everybody’s just working. But you finished that training for a reason — take a slow look around, and see what your eye catches.';

  const DEFAULT = {
    v: 1,
    type: 'scene-sweep',
    title: 'Spot the Hazard',
    course: 'Hazard Communication GHS (RVCT-479)',
    learnerName: 'you',
    elevatedStakes: false,

    framing: 'a hands-on hazard-recognition exercise: applying a just-completed HazCom course to a real work area',
    learnerRole: 'THEMSELVES — a worker who just finished the HazCom course, looking at their own work area. There is no character to play and no one to talk to but you, the coach',

    establishing: {
      eyebrow: 'The scene',
      title: 'The finishing bench',
      sub: 'You just finished the training. Now you’re standing on the floor. Don’t recite it — spot what’s wrong.',
    },

    // THE PERSISTENT SCENE. `src` is the photo the LEARNER sees and taps;
    // `canonDescription` is what the MODEL grounds to (it never sees the image).
    scene: {
      src: 'assets/hazcom-scene.jpg',
      alt: 'A finishing area on a shop floor. On the metal bench in front of you, to the left, a half-full clear plastic jug with no label sits beside a row of metal parts. Your coworker stands at the bench in a short-sleeve shirt, wiping a part with a rag, bare-handed — no gloves and no eye protection. To your right stands a chemical drum: a Safety Data Sheet taped to it is dated decades ago, and the drum’s own hazard label is torn and peeling, so its pictogram and signal word can’t be read.',
      canonDescription: 'A finishing area on a shop floor, where product gets wiped down and boxed. A metal workbench sits in front of you: on it, to the left, a half-full clear plastic jug with no label — nothing written on it — beside a row of metal parts. Your coworker stands at the bench in a short-sleeve shirt, wiping a part with a rag, bare-handed — no gloves and no eye protection. To your right stands a chemical drum. Taped to the drum is a Safety Data Sheet whose printed date is years out of date, and the drum’s own hazard label is torn and peeling, so the pictogram and signal word can’t be read. Nothing is actively on fire or spilling — the hazards are the everyday, easy-to-walk-past kind.',
    },

    // CONTEXT MODALITY — the landing reads the scene in first person, alongside
    // the illustration.
    intro: {
      type: 'reading',
      audio: {
        eyebrow: 'The scene · read',
        title: 'On the floor',
        text: OPENING_SITUATION,
        continueLabel: 'Take a look around',
      },
    },

    voice: {
      persona: 'a knowledgeable, plain-spoken safety trainer with real floor time — authority and genuine concern, never a quiz machine',
      guidance: '',
    },

    // REFLECTION — a no-scoring first impression before the structured sweep.
    reflection: {
      prompt: 'Take a quick look around this work area. Before we start naming anything specific — what’s your first impression? Does anything here make you uneasy, or does it just look like a normal bench? No need to be exhaustive yet.',
      feedbackGuidance: 'CALIBRATION ONLY, do not evaluate or credit hazards yet. 2-3 short bubbles: read their confidence (wary vs. "looks fine to me") and acknowledge it without grading. END on that — do NOT list hazards or preview the walkthrough; the app opens the Observe beat next.',
    },

    // THE OBSERVABLE-HAZARD RUBRIC — the tagged object list. Each hazard's
    // `zone` powers the spatial nudges; `synonyms` widen the credit; `fix` and
    // `prevent` feed the later beats and the debriefs.
    coverage: { required: 3, total: 4 },

    // TEXT-OBSERVATION version only (scenario-live.html?type=scene-sweep&observe=text):
    // how the learner enters findings when there is no tap canvas. 'sweep' = one
    // open findings log (default — keeps the hazard COUNT hidden, so it stays a
    // real "is this unsafe?" judgment). 'slots' = N labeled "find the N items"
    // fields (more guided, but hands over the count). Ignored entirely by the
    // photo/hotspot canvas (V1), which reads hazards[]/coverage directly.
    observe: { inputMode: 'sweep', slotsPrompt: '', slotCount: 0 },

    hazards: [
      {
        id: 'jug', short: 'Unlabeled secondary container', zone: 'on the bench in front of you, to the left',
        alt: 'A half-full clear plastic jug with a carry handle at the left end of the bench; its sides are blank — nothing written on it.',
        spot: { points: [[0.243, 0.372], [0.283, 0.372], [0.300, 0.408], [0.322, 0.470], [0.322, 0.598], [0.300, 0.636], [0.212, 0.636], [0.203, 0.470], [0.222, 0.405]] },
        full: 'A jug decanted from a drum with nothing written on it — a secondary container that must be labeled. You can’t tell what chemical is in it.',
        synonyms: 'unlabeled jug, unmarked container, no label, blank label, unknown liquid, what’s in the jug, mystery bottle',
        source: 'RVCT-479 P017',
        fix: 'Stop and quarantine the jug — set it aside, don’t use or move an unknown — until it’s identified, then get a legible secondary-container label on it.',
        prevent: 'A secondary-container labeling standard: every container decanted from a drum gets labeled before it’s set down.',
      },
      {
        id: 'ppe', short: 'No PPE in use', zone: 'your coworker at the bench, wiping a part with his bare hands',
        alt: 'A coworker leaning over the bench, wiping a metal part with a rag using his bare hands — no gloves, short sleeves.',
        spot: { points: [[0.475, 0.470], [0.560, 0.450], [0.635, 0.475], [0.640, 0.535], [0.585, 0.575], [0.505, 0.560], [0.470, 0.515]] },
        full: 'A coworker handling chemical bare-handed — no gloves and no goggles the task and the label call for.',
        synonyms: 'no gloves, bare hands, no goggles, no eye protection, no PPE, not wearing protection, unprotected',
        source: 'RVCT-479 P015/P016',
        fix: 'Stop the unsafe work happening right now and get the right gloves and eye protection on before he takes another swipe.',
        prevent: 'Scheduled PPE checks so the right gear is stocked, available, and actually worn for each task.',
      },
      {
        id: 'sds', short: 'Out-of-date SDS', zone: 'the Safety Data Sheet taped to the drum on your right',
        alt: 'A printed “Safety Data Sheet” taped to the front of the drum on the right; the sheet’s printed date reads from years ago.',
        spot: { points: [[0.720, 0.600], [0.855, 0.598], [0.982, 0.615], [0.980, 0.900], [0.850, 0.910], [0.723, 0.895]] },
        full: 'The safety data sheet on hand is years out of date — a current SDS is required whenever the hazard information changes.',
        synonyms: 'old SDS, outdated safety data sheet, safety data sheet out of date, data sheet out of date, sds out of date, expired sheet, SDS from years ago, old MSDS, decades-old sheet',
        source: 'RVCT-479 P010',
        fix: 'Pull a current SDS for the chemical — the out-of-date one can’t be relied on for handling or first aid.',
        prevent: 'An SDS review cadence that keeps sheets current and accessible whenever the hazard information changes.',
      },
      {
        id: 'label', short: 'Unreadable drum label', zone: 'the drum on your right — its own label, torn and peeling near the top',
        alt: 'Near the top of the drum on the right, a paper label torn and peeling away — its printing and symbols no longer readable.',
        spot: { points: [[0.715, 0.180], [0.820, 0.165], [0.930, 0.190], [0.985, 0.250], [0.980, 0.360], [0.930, 0.445], [0.820, 0.455], [0.730, 0.410], [0.705, 0.300]] },
        full: 'A drum whose label is torn and peeling — you can’t read the pictogram or signal word to identify the hazard.',
        synonyms: 'torn label, faded label, smudged label, peeling label, can’t read the drum, unreadable label, ripped label',
        source: 'RVCT-479 P005/P006',
        fix: 'Get a legible, GHS-compliant label on the drum so anyone can identify the hazard at a glance.',
        prevent: 'A label-legibility standard: torn or faded labels get replaced so every container stays identifiable.',
      },
    ],

    // DECOY REGIONS — safe/neutral objects in the same scene. They count for
    // NOTHING; marking one just teaches "that's actually fine." They exist so the
    // keyboard / list / free-text paths are a real "which of these are unsafe?"
    // judgment (not a Tab→Enter walk down the answers), and so a pointer tap on a
    // safe object gets a teaching beat instead of a blank "nothing there." Each
    // `alt` states visual facts only; the verdict is the learner's to reach.
    decoys: [
      {
        id: 'parts', alt: 'A row of machined metal parts laid out across the middle of the bench, ready to be finished.',
        // `synonyms` — distinctive phrasings that name THIS safe object, used by the
        // text-observation version to route a typed guess to the "that's fine" note
        // instead of a blank miss. Keep them specific (never a lone domain word like
        // "safety") so they can't collide with a real hazard's phrasing.
        synonyms: 'the parts, metal parts, machined parts, parts on the bench, metal pieces, the pieces',
        note: 'Those are just the parts being worked — the job itself. Nothing unsafe about the parts sitting there.',
        spot: { points: [[0.340, 0.560], [0.460, 0.545], [0.600, 0.565], [0.610, 0.610], [0.470, 0.628], [0.350, 0.612]] },
      },
      {
        id: 'bollard', alt: 'A bright yellow safety post standing on the floor in the background, to the left.',
        synonyms: 'bollard, yellow post, yellow bollard, safety post, yellow pole, the yellow thing',
        note: 'That’s a safety bollard doing its job — protecting equipment and people from traffic. Good to see, not a hazard.',
        spot: { points: [[0.148, 0.318], [0.174, 0.322], [0.181, 0.602], [0.139, 0.602], [0.137, 0.360]] },
      },
      {
        id: 'equipment', alt: 'Other workstations and shop equipment further back on the floor, behind the bench.',
        synonyms: 'the equipment, other machines, workstations, shop equipment, machines in the background, the other stations',
        note: 'That’s the rest of the shop in the background — not part of the bench you’re inspecting right now.',
        spot: { points: [[0.210, 0.305], [0.330, 0.315], [0.335, 0.420], [0.208, 0.430]] },
      },
    ],

    // THE THREE BEATS — Practice⇄Learn phases, all coaching (no scene role-play).
    // `kind` tells the compiler how to frame each; the arc is fixed (convergent).
    phases: [
      {
        id: 'observe',
        kind: 'spot',
        label: 'Observe',
        level: 'Beat 1 · spot the hazards',
        maxTurns: 2,
        signpost: 'Let’s take a closer look and walk the area properly. Take your time.',
        prompt: 'Walk me through everything that looks wrong or unsafe to you — name as many as you can spot.',
        exitCriteria: 'the learner has named the majority of the observable hazards (the coverage target below) — or has had one look-again nudge',
        calibration: [
          { tier: 'UNTHOUGHTFUL', guidance: 'spots 0–1, or only names "it’s messy / chemicals are out" — vague, treats it as housekeeping rather than a HazCom problem. Credit any real catch, then cue a LOCATION without giving it away ("look again right on the bench — the jug, and that sheet — and the person working next to you"). Do not name the hazards.' },
          { tier: 'NEUTRAL', guidance: 'catches the obvious ones — the unlabeled jug, the missing PPE — but misses the less-visible ones (the out-of-date SDS, the unreadable drum label). Credit each catch in standard terms, then nudge spatially toward the misses (the sheet on the bench; the label on the drum).' },
          { tier: 'STRONG', guidance: 'names all four specifically and says why each is a hazard. Validate fully, read the catches back in standard terms, and move to fixing them.' },
        ],
        debrief: {
          talkItThrough: 'Good eyes. Let’s line up everything that’s actually here.',
          points: 'Deliver the full observable-hazard rubric so every learner leaves the beat seeing all four, in standard terms: an UNLABELED secondary container (you can’t identify the chemical), a coworker with NO PPE in use, an OUT-OF-DATE SDS (a current sheet is required when hazard info changes), and an UNREADABLE label on the drum (you can’t read the pictogram or signal word). Name any the learner missed without judgment. The point: recognizing a hazard in real time is the behavior HazCom is built to create — noticing beats reciting.',
        },
        transitions: [{ onTier: '', next: 'remediate', set: {} }],
      },
      {
        id: 'remediate',
        kind: 'act',
        label: 'Diagnose & Remediate',
        level: 'Beat 2 · fix it now',
        maxTurns: 2,
        signpost: 'Now let’s do something about it. Back to the scene.',
        prompt: 'For each hazard, what would you do right now, in the moment, before anyone keeps working? Be specific.',
        exitCriteria: 'the learner gives immediate, correct corrective action spanning stop-work / PPE and making the chemical identifiable (a current SDS, a legible label) — or has had one follow-up',
        calibration: [
          { tier: 'UNTHOUGHTFUL', guidance: 'defers — "clean it up later," "tell a supervisor," "put a note on it." Press the immediacy: the coworker is decanting bare-handed this second — what happens before he keeps going? Redirect to stop-work + PPE first.' },
          { tier: 'NEUTRAL', guidance: 'fixes one or two well (labels/quarantines the jug) but misses the stop-work/PPE piece, pulling a current SDS, or getting a legible label on the drum. Affirm the fix, then extend to the live risk and making the chemical identifiable.' },
          { tier: 'STRONG', guidance: 'stops unsafe work and gets PPE on; quarantines/identifies the unknown jug; pulls a current SDS; gets a legible label on the drum — all before work resumes. Validate and name the layers at work: PPE and safe handling are protective measures IN ACTION, not recitation.' },
        ],
        debrief: {
          talkItThrough: 'Let’s go over what to do right now.',
          points: 'The immediate corrective actions, mapped to the protective-measures layers: STOP the unsafe work before another exposure and get the right PPE on; CONTAIN the unknown — quarantine the unlabeled jug until it’s identified, and pull a CURRENT SDS (the out-of-date one can’t be trusted for handling or first aid); and MAKE IT LEGIBLE — a GHS-compliant label on the drum so anyone can identify the hazard at a glance. This is PPE and safe handling applied, not recited. Note the durable angle briefly — a quick record of the outdated SDS or the relabeled drum keeps the fix from quietly slipping back — but the systemic program is the close’s job, not this beat’s.',
        },
        transitions: [],
      },
    ],

    // THE GUARANTEED CLOSE — the SME/LED-validated ideal, shown to EVERY
    // learner on completion regardless of what they spotted.
    playbook: [
      { title: 'Noticing beats reciting',
        body: 'The four observable red flags here: an unlabeled secondary container, a coworker with no PPE, an out-of-date SDS, and an unreadable container label. Recognizing them in real time is the behavior HazCom is built to create.',
        source: 'RVCT-479 slides 41–44' },
      { title: 'Fix it now: stop, protect, identify',
        body: 'Stop unsafe work and get PPE on; quarantine an unknown container and pull a current SDS; get a legible, GHS-compliant label on anything that can’t be identified — all before work resumes.',
        source: 'RVCT-479 slides 41–44' },
      { title: 'Make it stick: build it into the program',
        body: 'A secondary-container labeling standard, an SDS review cadence, scheduled PPE checks, and a label-legibility standard — the work-practices layer, written into the employer’s HazCom program so it survives a busy shift.',
        source: 'RVCT-479 slides 41–44' },
      { title: 'Protective measures come in three layers',
        body: 'Work practices reduce risk at the source; emergency procedures define spill/exposure response and who to notify; PPE specifies what to wear, when, and how. A space that covers only PPE leaves workers without the full picture.',
        source: 'RVCT-479 protective measures' },
      { title: 'What a complete HazCom program covers',
        body: 'Ten elements: the HazCom Standard; the written program & how to access it; chemical locations; physical & health hazards; how to detect a release; employee protective measures; employer protective measures (work practices, emergency procedures, PPE); label explanation; SDS access; and who to contact. Understanding these ten isn’t just meeting a requirement — it’s what lets you recognize hazards, respond appropriately, and stay safe on the job.',
        source: 'RVCT-479 slide 43' },
    ],

    resources: {
      lead: 'When you spot a hazard like these on the floor, here’s where to turn and what backs you up.',
      items: [
        { title: 'Your employer’s written HazCom program',
          body: 'It defines your labeling, SDS, and PPE practices and how to access them — the work-practices layer that keeps a one-time fix from coming back. Know where it is before you need it.' },
        { title: 'The Safety Data Sheet (SDS) for the chemical',
          body: 'A current SDS tells you the hazards, safe handling, and first aid. You have a right to access it — pull the current one, never rely on an out-of-date sheet.' },
        { title: 'Your supervisor or safety contact',
          body: 'Report an unlabeled container, missing PPE, or an unreadable label so it’s corrected and logged — and so the systemic fix gets put in place, not just today’s patch.' },
      ],
    },
  };

  /* =======================================================================
     THE COMPILER — the scene + rubric + arc + guardrails → ONE coaching prompt.
     ======================================================================= */
  function tierLines(list, s) {
    return arr(list).filter((t) => t && String(t.tier || '').trim())
      .map((t) => `- ${String(t.tier).trim()} — ${fill(t.guidance || '', s).trim()}`).join('\n');
  }

  function compile(s) {
    const L = s.learnerName || 'you';
    // TEXT-OBSERVATION variant (scenario-live.html?observe=text): the learner
    // TYPES findings and is HANDED BACK to look again — there is no scene to tap —
    // so the coach must NOT nudge toward hazard zones in chat (that gives the
    // answers away). Flips the Observe-beat instructions to a credit-and-hand-back
    // model. The canvas build (no ?observe) keeps the zone-nudge behavior.
    const TEXT_MODE = (typeof location !== 'undefined' && location.search)
      ? new URLSearchParams(location.search).get('observe') === 'text' : false;
    const course = fill(s.course, s) || 'training';
    const voice = obj(s.voice);
    const refl = obj(s.reflection);
    const scene = obj(s.scene);
    const phases = arr(s.phases).filter((p) => p && p.id);
    const hazards = arr(s.hazards).filter((h) => h && h.id);
    const decoys = arr(s.decoys).filter((d) => d && d.id && (String(d.alt || '').trim() || String(d.note || '').trim()));
    const cov = obj(s.coverage);
    const total = Number.isFinite(cov.total) && cov.total > 0 ? cov.total : hazards.length;
    const required = Number.isFinite(cov.required) && cov.required > 0 ? Math.min(cov.required, total) : Math.max(1, total - 1);
    const situation = fill((obj(s.intro).audio || {}).text || '', s).trim();
    const parts = [];

    // 1) Framing.
    parts.push(
`You facilitate ${s.framing ? fill(s.framing, s) : 'a hazard-recognition exercise'}, inside a ${course} course. The learner is ${s.learnerRole ? fill(s.learnerRole, s) : `themselves, looking at a real work area (addressed as "${L}")`}.

You are ${voice.persona ? fill(voice.persona, s) : 'a knowledgeable, plain-spoken safety trainer — authority and genuine concern, never a quiz machine'}.${voice.guidance ? ' ' + fill(voice.guidance, s) : ''}

THE SHAPE — the learner looks at ONE illustrated work area (they can see it the whole time; you cannot) and works it through two beats: OBSERVE (spot what’s wrong) and DIAGNOSE & REMEDIATE (fix it right now, before anyone keeps working). Each beat is Practice then Learn: the learner works it themselves first, then you land the standard. There is no character and no role-play — it is just you and the learner, looking at the scene together.

PERCEPTION-GRADING — your core job in the Observe beat is to CREDIT what the learner actually spots against the fixed rubric below, track how many of the ${total} hazards they’ve named, and nudge them toward the misses by pointing WHERE to look — never naming what’s there. Credit generously in any phrasing; never credit or invent a hazard outside the rubric.

LOCKED vs DYNAMIC:
- The app OWNS the LOCKED beats (the reflection prompt and each beat’s hand-off + task prompt, listed below) and shows them VERBATIM. Never write, quote, or paraphrase a locked beat — in the history they are tagged "owner":"app".
- YOU write the DYNAMIC beats: all coaching, the credit-and-nudge, the verbatim "talk it through" opener of each debrief, and the closing recap + report.

FORMAT — every reply is the JSON object defined below and NOTHING else, on EVERY turn. The conversation so far is provided as prior assistant turns already in that JSON shape; continue the exact same format. Never reply as plain prose.`);

    // 1b) VOICE.
    parts.push(VOICE_BLOCK);

    // 2) Contract + spotted/action + coverage + state line.
    let contract = ENGINE_SECTIONS[0].text(s) + '\n\n' +
`SPOTTED FIELD — on every turn during the Observe beat, set "spotted" to the array of hazard IDS the learner has now CLEARLY named, CUMULATIVELY across the beat (include ones credited on earlier turns). Valid ids: ${hazards.map((h) => `"${h.id}"`).join(', ')}. Report only genuine catches; omit or empty the array when they’ve named none. Outside the Observe beat, omit "spotted".
ACTION FIELD — set "action" to your intent:
- "action":"continue" → the beat is still live (crediting + one nudge, or one probing follow-up). Stay in the beat.
- "action":"teach" → you are CLOSING the beat (Learn): the debrief lands now. The app advances to the next beat — you never choose or announce it.
- "action":"redirect" → the input is NOT an answer — a clarifying question, a first "I don't know", or off-script/gibberish/troll. Handle it per NON-ANSWERS below: re-ask gently, stay put, credit nothing, and do not advance.
TIER FIELD — whenever you "teach", also set "tier" to how the learner handled the beat overall: one of "UNTHOUGHTFUL", "NEUTRAL", "STRONG". Report it honestly; it feeds the debrief and the final report.
STATE LINE — every call ends with a "[SYSTEM STATE — …]" line: the live beat, learner turns used vs. the cap, and — during Observe — the coverage so far (which hazard ids are spotted, which REMAIN and their zones). Obey it: nudge toward the remaining hazards’ zones, and when the cap is reached (or coverage is met) you MUST "teach".

FOR THIS MODULE:
- Every message is {"speaker":"coach","kind":"coaching"}. There is no character and no scene beat — never emit dialogue/narration beats.
- BUBBLES — split every turn into 2-3 SHORT separate messages in turn[] (one thought per bubble — credit / nudge or sharpen / hand-off). The app reveals them one at a time.`;
    parts.push(contract);

    // 3) The scene (grounding).
    if (String(scene.canonDescription || '').trim()) {
      parts.push('THE SCENE (what you are grounded to — the learner sees an illustration of exactly this; you do not):\n' + fill(scene.canonDescription, s).trim());
    }

    // 4) The rubric (tagged object list).
    if (hazards.length) {
      parts.push('THE OBSERVABLE-HAZARD RUBRIC — the ONLY hazards in the scene and the ONLY ones you credit. For each: its id, what it is, ' + (TEXT_MODE ? '' : 'WHERE it is (use the zone for spatial nudges), ') + 'and phrasings to accept:\n\n' +
        hazards.map((h) => {
          // TEXT MODE omits the zone + the on-screen "Visible as" line: the coach
          // must not tell the learner WHERE a miss is, so it isn't given the
          // location strings it would otherwise parrot back.
          const lines = [`[${h.id}] ${fill(h.short, s)}` + (TEXT_MODE ? '' : ' — ' + fill(h.zone, s))];
          if (!TEXT_MODE && String(h.alt || '').trim()) lines.push(`  · Visible as (what's on screen): ${fill(h.alt, s)}`);
          if (String(h.full || '').trim()) lines.push(`  · What: ${fill(h.full, s)}`);
          if (String(h.synonyms || '').trim()) lines.push(`  · Credit phrasings like: ${fill(h.synonyms, s)}`);
          if (String(h.fix || '').trim()) lines.push(`  · Right-now fix (Diagnose & Remediate beat): ${fill(h.fix, s)}`);
          return lines.join('\n');
        }).join('\n\n') +
        `\n\nCOVERAGE TARGET (Observe): the learner should name at least ${required} of the ${total} before the beat closes; the app enforces a turn cap with one look-again nudge, then closes regardless.`);
    }

    // 4b) SAFE OBJECTS (decoys) — present on screen but NOT hazards. The learner
    // can mark these too; the coach must not credit them, and should be ready to
    // say "that one's fine" if asked. Never turn a safe object into a new hazard.
    if (decoys.length) {
      parts.push('ALSO IN THE SCENE — SAFE OBJECTS the learner can see (and may point at). These are NOT hazards: never credit them as catches, never add them to "spotted", and never invent a hazard to match. If the learner raises one, acknowledge it and say plainly it’s fine, then steer back:\n\n' +
        decoys.map((d) => {
          const lines = [`[${d.id}] ${fill(d.alt, s)}`];
          if (String(d.note || '').trim()) lines.push(`  · Why it's fine: ${fill(d.note, s)}`);
          return lines.join('\n');
        }).join('\n\n'));
    }

    // 5) Locked beats verbatim.
    const lockedBlocks = [];
    lockedBlocks.push(
`ALREADY DELIVERED before the conversation starts — the learner just read THE SCENE, then the app showed your reflection prompt. Ground your coaching in these details (don't repeat them back):
    THE SITUATION: "${situation}"
    Coach: "${fill(refl.prompt, s)}"`);
    phases.forEach((p, i) => {
      const lines = [];
      if (String(p.signpost || '').trim()) lines.push(`    Coach: "${fill(p.signpost, s)}"`);
      if (String(p.prompt || '').trim()) lines.push(`    Coach: "${fill(p.prompt, s)}"`);
      lockedBlocks.push(`BEAT ${i + 1} hand-off (app-owned; shown when the app advances to "${p.id}") →\n${lines.join('\n')}`);
    });
    parts.push('LOCKED BEATS (app-owned — shown to the learner VERBATIM; never write or repeat these yourself):\n\n' + lockedBlocks.join('\n\n'));

    // 6) The arc, beat by beat.
    const arcParts = [];
    arcParts.push(`THE ARC — reflection, then the ${phases.length} beats in order, then the close.`);
    arcParts.push(
`REFLECTION (no evaluation, no crediting):
- ${refl.feedbackGuidance ? fill(refl.feedbackGuidance, s) : 'Respond to the learner’s first impression with 2-3 short bubbles — calibration only; do not credit hazards yet.'} Set "action":"teach" (no tier, no spotted); the app opens the Observe beat. (Off-script → "action":"redirect" and re-ask.)`);
    phases.forEach((p, i) => {
      const isFinal = i === phases.length - 1;
      const cap = Math.max(1, p.maxTurns || 2);
      const d = obj(p.debrief);
      const teachTail = isFinal
        ? ' Set "action":"teach" with the tier, then COMPLETE this same turn: complete:true with the report (see COMPLETION).'
        : ' Set "action":"teach" with the tier — the app advances and shows the next locked hand-off; never preview it.';
      const spotNote = p.kind === 'spot'
        ? (TEXT_MODE
          ? ' Each turn, CREDIT GENEROUSLY every hazard the learner clearly names — ignore spelling/typos, and do NOT require them to say WHY it is dangerous yet — and set "spotted" to the cumulative ids. If hazards remain, do NOT name, describe, or point to where any UNspotted hazard is: give a brief hand-off (credit what they caught + the count so far, e.g. "that\'s 2 of 4"), set "action":"continue", and end WITHOUT a question — the app sends the learner back to look again. Close only once the coverage target is met.'
          : ' Each turn, CREDIT every real catch (name it in standard terms) and set "spotted" to the cumulative ids; if hazards remain and you have a nudge left, point to the ZONE of a miss without naming it, and set "action":"continue".')
        : '';
      arcParts.push(
`BEAT ${i + 1} · ${fill(p.label || p.id, s).toUpperCase()} (${fill(p.level || '', s)}) — up to ${cap} learner turns:
- The app has shown the locked task. This is PRACTICE — the learner works it first.${spotNote} If their answer leaves the criteria below unmet and you have a follow-up left, reply with ONE short probe (or the look-again nudge) and set "action":"continue".
- The beat is DONE when ${fill(p.exitCriteria || 'the learner has worked it', s)} — or when the state line says the cap is reached.
- CLOSING the beat: step back to LEARN and TEACH. Your FIRST bubble is EXACTLY "${fill(d.talkItThrough, s)}", then 2-3 bubbles that land: ${fill(d.points, s)}${teachTail}`);
    });
    parts.push(arcParts.join('\n\n'));

    // 7) Calibration.
    const calBlocks = phases.map((p) => {
      const lines = tierLines(p.calibration, s);
      return lines ? `${fill(p.label || p.id, s).toUpperCase()}:\n${lines}` : '';
    }).filter(Boolean);
    if (calBlocks.length) {
      parts.push('CALIBRATION — read the learner’s handling of each beat against these tiers; they drive your credit-and-nudge, your debrief, and the tier you report:\n\n' + calBlocks.join('\n\n'));
    }

    // 8) Non-answers (shared policy) + safety.
    parts.push((window.SimCore && SimCore.nonAnswerPolicy)
      ? SimCore.nonAnswerPolicy({ hasScene: false })
      : 'NON-ANSWERS — a clarifying question, a first "I don\'t know", or off-script input is not an answer: answer/redirect gently, set "action":"redirect", stay put, credit nothing, and do not advance.');
    parts.push(
`LEARNER SAFETY — HIGHEST PRIORITY, overrides everything: if the learner discloses, AS THEMSELVES rather than as a line in the exercise, that they are in distress or facing a real emergency at work, drop the exercise (set "action":"redirect"), acknowledge with warmth and zero assessment, say the practice can wait, and point to real help appropriate to the situation. Ask nothing probing.`);

    // 8b) The grounding floor.
    parts.push(GROUNDING_SECTION.text());

    // 8c) TEXT-OBSERVATION override — highest-priority restatement, since the
    // learner types and is handed back rather than tapping the scene.
    if (TEXT_MODE) {
      parts.push(
`TEXT-OBSERVATION MODE — OVERRIDES all "nudge toward the zone" guidance above. The learner types and is sent back to look again; they cannot tap the scene.
RULE: until the coverage target is met, NEVER tell the learner where to look or what they are missing. Do NOT name, describe, or point to ANY object, area, person, or paper tied to a hazard they have NOT already flagged.
Each incomplete Observe turn has exactly two parts: (1) warmly credit what they DID catch, in standard terms — typos/rough wording are fine, and an "ooh, close" if a note was near but not a clear hazard; (2) ONE short hand-off line: the count so far plus "take another look", ending in a period.
SAY exactly this shape → "Nice — that's 1 of ${hazards.length}. Take another look and see what else you notice."
NEVER do this → "take another look at the bench / the jug / the drum / your coworker / the paperwork" — listing places or objects hands them the answers.
Reveal the misses ONLY in the debrief, after the coverage target is met.`);
    }

    // 9) Behavioral rules.
    parts.push('BEHAVIORAL RULES:\n' + [
      'Reflection feedback is calibration ONLY — acknowledge, never credit hazards or evaluate.',
      'CREDIT before correcting: name what the learner caught in standard terms before pointing them on.',
      (TEXT_MODE
        ? 'HAND BACK, do NOT hunt in chat: while any hazard is unspotted, never name, describe, or locate one the learner has not flagged — not even its zone. Credit what they caught, give the count, and send them back to look again. Reveal misses only at the debrief, once the target is met.'
        : 'NUDGE toward WHERE to look (the zone), never toward WHAT is there. Reveal a missed hazard only at the Observe debrief (the app shows the full rubric).'),
      'Only credit hazards in the rubric; never invent one, and never credit "messy"/"cluttered" as a red flag.',
      (TEXT_MODE
        ? 'During Observe, a "continue" turn is a HAND-OFF STATEMENT (credit + count + go look again), NOT a question — the app returns the learner to the scene.'
        : 'A "continue" turn ends with a question or a clear look-again nudge that hands the turn back — never a bare statement.'),
      'NEVER ask/nudge AND close the beat in the same turn. A turn that ends open is "continue"; only a landing turn closes.',
      'Open each debrief with the exact "talk it through" line for that beat.',
      'Every "teach" carries an honest "tier"; during Observe every turn carries the cumulative "spotted" ids.',
      'Never write, quote, or paraphrase a LOCKED beat — the app owns those. Never preview the next hand-off.',
      'Split coaching into 2-3 short bubbles — never one wall of text.',
      `Address the learner only as "${L}".`,
    ].map((r) => '- ' + r).join('\n'));

    // 10) Completion + close.
    parts.push(
`COMPLETION — the practice ends when you close the FINAL beat: that same turn sets complete:true with "action":"teach", the tier, and a report:
"report":{"strengths":[{"title":"...","body":"..."}],"growthAreas":[{"title":"...","body":"..."}]}
- 2-3 strengths, 1-2 growth areas. Titles short; bodies 1-2 sentences grounded in what THIS learner actually spotted and proposed — quote or closely paraphrase (which hazards they caught unaided, which needed a nudge, how they fixed and prevented). Growth areas direct and non-shaming.
- Never invent something the learner didn’t do. If they missed a hazard until the debrief, reflect that honestly.`);
    const pb = arr(s.playbook).filter((p) => p && String(p.title || '').trim());
    if (pb.length) {
      parts.push(
`AFTER COMPLETION the learner is automatically shown the expert close (the ${pb.length} SME-validated components — the observable red flags, the fixes, and what a complete HazCom program covers) and a resources list — the PAGE guarantees this. Your closing bubbles stay short and personal — briefly RECAP 2-3 specific things THIS learner spotted and did, in their own words; do NOT recite the components or list resources yourself.`);
    }

    return parts.join('\n\n');
  }

  /* ---- prompt highlighter — every AUTHORED string, longest-first. -------- */
  function highlightStrings(s) {
    const out = [];
    const push = (v) => { const t = fill(String(v ?? ''), s).trim(); if (t.length > 2) out.push(t); };
    push(s.framing); push(s.learnerRole); push(s.course);
    push((obj(s.intro).audio || {}).text);
    push((obj(s.voice)).persona); push((obj(s.voice)).guidance);
    push((obj(s.reflection)).prompt); push((obj(s.reflection)).feedbackGuidance);
    push(obj(s.scene).canonDescription); push(obj(s.scene).alt);
    arr(s.hazards).forEach((h) => { if (h) { push(h.short); push(h.alt); push(h.full); push(h.synonyms); push(h.zone); push(h.fix); push(h.prevent); } });
    arr(s.decoys).forEach((d) => { if (d) { push(d.alt); push(d.note); } });
    arr(s.phases).forEach((p) => {
      if (!p) return;
      push(p.signpost); push(p.prompt); push(p.exitCriteria);
      arr(p.calibration).forEach((t) => push(t && t.guidance));
      push(obj(p.debrief).talkItThrough); push(obj(p.debrief).points);
    });
    arr(s.playbook).forEach((p) => { if (p) { push(p.title); push(p.body); } });
    push(obj(s.resources).lead);
    arr(obj(s.resources).items).forEach((r) => { if (r) { push(r.title); push(r.body); } });
    return out.sort((a, b) => b.length - a.length);
  }

  /* ---- normalize / validate / merge / blank — SPREAD-FIRST -------------- */
  const TIER = (t) => { t = obj(t); return { ...t, tier: typeof t.tier === 'string' ? t.tier : '', guidance: typeof t.guidance === 'string' ? t.guidance : '' }; };

  /* A HOTSPOT on the scene photo — normalized 0–1. Either a CIRCLE {x,y,r}
     (legacy) or a POLYGON {points:[[x,y],…]} (≥3 verts, the outline tool). null
     when unplaced. Shared by hazards AND decoys so every region uses the exact
     geometry the live page taps. Backward-compatible: an old {x,y,r} stays a
     circle; nothing to migrate. */
  const clamp01 = (n) => { n = +n; return Number.isFinite(n) ? (n < 0 ? 0 : n > 1 ? 1 : n) : 0; };
  const normSpot = (sp) => {
    if (!sp || typeof sp !== 'object') return null;
    if (Array.isArray(sp.points)) {
      const pts = sp.points
        .filter((p) => Array.isArray(p) && p.length >= 2)
        .map((p) => [clamp01(p[0]), clamp01(p[1])]);
      return pts.length >= 3 ? { points: pts } : null;
    }
    if (sp.x != null || sp.y != null || sp.r != null) {
      return { x: clamp01(sp.x), y: clamp01(sp.y), r: (+sp.r > 0 ? Math.min(0.5, +sp.r) : 0.12) };
    }
    return null;
  };

  const HAZ = (h) => {
    h = obj(h);
    return {
      ...h,
      id: (typeof h.id === 'string' && h.id.trim()) ? h.id.trim() : '',
      short: typeof h.short === 'string' ? h.short : '',
      // NEUTRAL visual description of what's here — NOT why it's a hazard. Triple
      // duty: the screen-reader name for the focusable region, the accessible
      // list/free-text scene, and the "what was shown on screen" reference fed to
      // the LLM. Authored separately from `full`/`zone` (which are hazard-framed).
      alt: typeof h.alt === 'string' ? h.alt : '',
      full: typeof h.full === 'string' ? h.full : '',
      zone: typeof h.zone === 'string' ? h.zone : '',
      synonyms: typeof h.synonyms === 'string' ? h.synonyms : '',
      source: typeof h.source === 'string' ? h.source : '',
      fix: typeof h.fix === 'string' ? h.fix : '',
      prevent: typeof h.prevent === 'string' ? h.prevent : '',
      // Tap-hotspot on the scene photo — circle {x,y,r} or polygon {points}.
      // null when unplaced. Powers the Observe/marking canvas hit-test.
      spot: normSpot(h.spot),
    };
  };

  /* A DECOY region — a safe/neutral object the learner can also mark. It is
     credited to NOTHING; marking it just teaches "that one's actually fine."
     Decoys make the keyboard / list / free-text paths a genuine "which of these
     are unsafe?" discrimination task instead of a Tab→Enter giveaway (and give
     the pointer version a richer miss than a blank "nothing there"). Kept in a
     SEPARATE decoys[] so coverage / spotted / HAZARD_IDS / the coach rail — all
     keyed off hazards[] — stay exactly as they were. */
  const REGION = (d) => {
    d = obj(d);
    return {
      ...d,
      id: (typeof d.id === 'string' && d.id.trim()) ? d.id.trim() : '',
      alt: typeof d.alt === 'string' ? d.alt : '',     // neutral description (SR name)
      synonyms: typeof d.synonyms === 'string' ? d.synonyms : '', // distinctive phrasings → route to `note` in the text version
      note: typeof d.note === 'string' ? d.note : '',  // the "that's actually fine" feedback
      spot: normSpot(d.spot),
    };
  };

  function normPhase(p) {
    p = obj(p);
    return {
      ...p,
      id: (typeof p.id === 'string' && p.id.trim()) ? p.id.trim() : '',
      kind: ['spot', 'act', 'prevent'].includes(p.kind) ? p.kind : 'spot',
      label: typeof p.label === 'string' ? p.label : '',
      level: typeof p.level === 'string' ? p.level : '',
      maxTurns: Number.isFinite(p.maxTurns) ? Math.max(1, p.maxTurns) : 2,
      signpost: typeof p.signpost === 'string' ? p.signpost : '',
      prompt: typeof p.prompt === 'string' ? p.prompt : '',
      exitCriteria: typeof p.exitCriteria === 'string' ? p.exitCriteria : '',
      calibration: arr(p.calibration).map(TIER),
      debrief: { talkItThrough: typeof obj(p.debrief).talkItThrough === 'string' ? p.debrief.talkItThrough : '', points: typeof obj(p.debrief).points === 'string' ? p.debrief.points : '' },
      transitions: arr(p.transitions).map((t) => { t = obj(t); return { ...t, onTier: typeof t.onTier === 'string' ? t.onTier : '', next: typeof t.next === 'string' ? t.next : '', set: obj(t.set) }; }),
    };
  }

  function normalize(s) {
    s = obj(s);
    const out = { ...s };
    out.v = 1;
    out.type = 'scene-sweep';
    out.title = typeof out.title === 'string' ? out.title : '';
    out.course = typeof out.course === 'string' ? out.course : '';
    out.learnerName = (typeof out.learnerName === 'string' && out.learnerName) ? out.learnerName : 'you';
    out.elevatedStakes = out.elevatedStakes === true;
    out.framing = typeof out.framing === 'string' ? out.framing : '';
    out.learnerRole = typeof out.learnerRole === 'string' ? out.learnerRole : '';
    out.establishing = { eyebrow: '', title: '', sub: '', ...obj(out.establishing) };
    out.scene = { src: '', alt: '', canonDescription: '', ...obj(out.scene) };

    const intro = obj(out.intro);
    intro.type = ['reading', 'audio', 'none'].includes(intro.type) ? intro.type : 'reading';
    intro.audio = { eyebrow: '', title: '', text: '', ...obj(intro.audio) };
    out.intro = intro;

    out.voice = { persona: '', guidance: '', ...obj(out.voice) };
    out.reflection = { prompt: '', feedbackGuidance: '', ...obj(out.reflection) };
    out.hazards = arr(out.hazards).map(HAZ);
    // Unique, non-empty ids across hazards AND decoys — the live region layer
    // unions them and keys marks/pins by id, so a collision would cross-wire two
    // regions. (The shipped default + the wizard already emit unique ids, so this
    // is a no-op there; it only guards hand-authored / imported drafts.)
    const idseen = {};
    const uniqId = (want, fallback) => { let id = String(want || fallback || '').trim() || fallback; while (idseen[id]) id += 'x'; idseen[id] = 1; return id; };
    out.hazards.forEach((h, i) => { h.id = uniqId(h.id, 'hazard' + (i + 1)); });
    out.decoys = arr(out.decoys).map(REGION);
    out.decoys.forEach((d, i) => { d.id = uniqId(d.id, 'decoy' + (i + 1)); });
    const cov = obj(out.coverage);
    const total = Number.isFinite(cov.total) && cov.total > 0 ? cov.total : out.hazards.length;
    out.coverage = { total, required: Number.isFinite(cov.required) && cov.required > 0 ? Math.min(cov.required, total) : Math.max(1, total - 1) };
    const ob = obj(out.observe);
    out.observe = {
      inputMode: ob.inputMode === 'slots' ? 'slots' : 'sweep',
      slotsPrompt: typeof ob.slotsPrompt === 'string' ? ob.slotsPrompt : '',
      slotCount: Number.isFinite(ob.slotCount) && ob.slotCount > 0 ? Math.floor(ob.slotCount) : 0,
      // Neutral input placeholder for the text version — must never name a hazard.
      placeholder: typeof ob.placeholder === 'string' ? ob.placeholder : '',
    };
    out.phases = arr(out.phases).map(normPhase);
    if (!out.phases.length) out.phases = [normPhase({})];
    const seen = {};
    out.phases.forEach((p, i) => { let id = p.id || ('beat' + (i + 1)); while (seen[id]) id = id + 'x'; seen[id] = 1; p.id = id; });

    out.playbook = arr(out.playbook).map((p) => ({ title: '', body: '', ...obj(p) }));
    const res = obj(out.resources);
    out.resources = { lead: typeof res.lead === 'string' ? res.lead : '', items: arr(res.items).map((r) => ({ title: '', body: '', ...obj(r) })) };
    return out;
  }

  function isValid(s) {
    return !!(s && s.type === 'scene-sweep' && s.title &&
      Array.isArray(s.hazards) && s.hazards.length &&
      Array.isArray(s.phases) && s.phases.length &&
      s.reflection && typeof s.reflection === 'object' && Array.isArray(s.playbook));
  }

  function blank() {
    return normalize({
      v: 1, type: 'scene-sweep',
      title: '', course: '', learnerName: 'you', elevatedStakes: false,
      framing: '', learnerRole: '',
      establishing: { eyebrow: '', title: '', sub: '' },
      scene: { src: '', alt: '', canonDescription: '' },
      intro: { type: 'reading', audio: { eyebrow: '', title: '', text: '' } },
      voice: { persona: '', guidance: '' },
      reflection: { prompt: '', feedbackGuidance: '' },
      hazards: [{ id: 'hazard1', short: '', alt: '', full: '', zone: '', synonyms: '', fix: '', prevent: '' }],
      decoys: [],
      coverage: { required: 1, total: 1 },
      phases: [{ id: 'observe', kind: 'spot', label: '', level: '', maxTurns: 2, signpost: '', prompt: '', exitCriteria: '', calibration: [], debrief: { talkItThrough: '', points: '' }, transitions: [] }],
      playbook: [], resources: { lead: '', items: [] },
    });
  }

  function merge(draft) {
    const base = clone(DEFAULT);
    if (!draft || typeof draft !== 'object') return normalize(base);
    const out = { ...base, ...draft };
    out.establishing = { ...base.establishing, ...obj(draft.establishing) };
    out.scene = { ...base.scene, ...obj(draft.scene) };
    out.observe = { ...base.observe, ...obj(draft.observe) };
    out.voice = { ...base.voice, ...obj(draft.voice) };
    out.reflection = { ...base.reflection, ...obj(draft.reflection) };
    out.intro = { ...base.intro, ...obj(draft.intro) };
    out.resources = { ...base.resources, ...obj(draft.resources) };
    return normalize(out);
  }

  /* =======================================================================
     toRuntime — the scene-sweep RUNTIME MODEL for the converged player
     (js/sim-player.js drives it via scenario-live.html?type=scene-sweep, with the
     perception layer js/sim-perception.js mounting the photo/hotspot Observe
     canvas). Extracted from fromPublishedSceneSweep() in scene-sweep-live.html,
     PLUS the one shape reconcile the shared engine needs: Scene Sweep authors its
     phases FLAT (signpost/prompt at the top level, kind:'spot'/'act'), while the
     shared entryBeatsFor reads phase.entry.{signpost,prompt}. So normalize each
     flat phase into the {entry:{…}} shape here — the engine stays single-shaped;
     the type adapts. hazards/decoys/coverage/scene stay on the scenario object,
     read straight off ACTIVE_SCENARIO by the perception layer. NOT a mix-arc
     round-trip: the spot/coverage subsystem has no mix-arc equivalent.
     ======================================================================= */
  function toRuntime(raw) {
    const g = normalize(raw);
    const phases = arr(g.phases).map((p) => Object.assign({}, p, {
      entry: { bridge: '', bridgesByTier: {}, signpost: p.signpost || '', prompt: p.prompt || '', beats: [], cta: '' },
    }));
    return Object.assign({}, g, {
      phases,
      opening: [(g.reflection || {}).prompt].filter((t) => String(t || '').trim()).map((t) => fill(t, g)),
      sceneLineCaption: 'You',
    });
  }

  /* =======================================================================
     SHARED HOTSPOT GEOMETRY — used by BOTH the live page (tap-to-mark) and
     the Studio editor (place-the-hotspot), so the "place it" and "tap it"
     math can never drift. All coords are normalized 0–1 against the DRAWN
     image (object-fit: contain, letterbox-aware). window.SceneSweepGeo.
     ======================================================================= */
  const GEO = {
    // The drawn image rect (offset + size) within an <img> element.
    drawRect(img) {
      if (!img) return null;
      const cw = img.clientWidth, ch = img.clientHeight;
      const nw = img.naturalWidth || 3, nh = img.naturalHeight || 2;
      if (!cw || !ch) return null;
      const nat = nw / nh, boxR = cw / ch;
      let w, h;
      if (boxR > nat) { h = ch; w = ch * nat; } else { w = cw; h = cw / nat; }
      return { left: (cw - w) / 2, top: (ch - h) / 2, width: w, height: h };
    },
    // A client (viewport) point → normalized {x,y} inside the drawn image, or
    // null if it landed in the letterbox (outside the picture).
    toNormalized(img, clientX, clientY) {
      const dr = GEO.drawRect(img); if (!dr) return null;
      const r = img.getBoundingClientRect();
      const px = clientX - r.left, py = clientY - r.top;
      if (px < dr.left || px > dr.left + dr.width || py < dr.top || py > dr.top + dr.height) return null;
      return { x: (px - dr.left) / dr.width, y: (py - dr.top) / dr.height };
    },
    // Pixel position (within the img element) for a normalized point.
    toPixels(img, nx, ny) {
      const dr = GEO.drawRect(img); if (!dr) return null;
      return { left: dr.left + nx * dr.width, top: dr.top + ny * dr.height };
    },
    // Pixel vertices (within the img element) for a polygon's normalized points.
    polyPixels(img, points) {
      const dr = GEO.drawRect(img); if (!dr) return null;
      return (points || []).map((p) => ({ left: dr.left + p[0] * dr.width, top: dr.top + p[1] * dr.height }));
    },
    // Centroid of a spot (normalized) — circle center, or a polygon's area-centroid
    // (falls back to the vertex mean for a degenerate/zero-area poly). Anchors the
    // numbered badge, the coverage rail, and the spatial nudge. null when unplaced.
    centroid(spot) {
      if (!spot) return null;
      if (Array.isArray(spot.points)) {
        const p = spot.points; let a = 0, cx = 0, cy = 0;
        for (let i = 0, n = p.length; i < n; i++) {
          const x0 = p[i][0], y0 = p[i][1], x1 = p[(i + 1) % n][0], y1 = p[(i + 1) % n][1];
          const cross = x0 * y1 - x1 * y0;
          a += cross; cx += (x0 + x1) * cross; cy += (y0 + y1) * cross;
        }
        if (Math.abs(a) > 1e-9) { a *= 0.5; return { x: cx / (6 * a), y: cy / (6 * a) }; }
        const m = p.reduce((s, q) => ({ x: s.x + q[0], y: s.y + q[1] }), { x: 0, y: 0 });
        return { x: m.x / p.length, y: m.y / p.length };
      }
      return { x: +spot.x || 0, y: +spot.y || 0 };
    },
    // Point-in-polygon (ray casting), normalized coords.
    inPoly(pts, nx, ny) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        if (((yi > ny) !== (yj > ny)) && (nx < (xj - xi) * (ny - yi) / ((yj - yi) || 1e-12) + xi)) inside = !inside;
      }
      return inside;
    },
    // Nearest region whose hotspot contains (nx,ny); skips ids already in `taken`.
    // Handles circle {x,y,r} AND polygon {points}. `regions` may be hazards alone
    // or the hazards+decoys union — same signature the live page + editor call.
    hitTest(regions, nx, ny, taken) {
      let best = null;
      (regions || []).forEach((h) => {
        if (!h || !h.spot) return;
        if (taken && taken.has && taken.has(h.id)) return;
        const sp = h.spot;
        if (Array.isArray(sp.points)) {
          if (!GEO.inPoly(sp.points, nx, ny)) return;
          const c = GEO.centroid(sp), d = Math.hypot(nx - c.x, ny - c.y);
          if (!best || d < best.d) best = { h, d };
        } else {
          const d = Math.hypot(nx - sp.x, ny - sp.y);
          if (d <= (sp.r || 0.12) && (!best || d < best.d)) best = { h, d };
        }
      });
      return best ? best.h : null;
    },
  };
  window.SceneSweepGeo = GEO;

  /* Downscale an uploaded image to a data: URL small enough to live inside the
     published draft (localStorage). Longest edge → maxDim, JPEG at `quality`. */
  function downscaleImage(file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('read failed'));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('decode failed'));
        img.onload = () => {
          let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
          const scale = Math.min(1, maxDim / Math.max(w, h));
          w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          try { resolve(c.toDataURL('image/jpeg', quality)); }
          catch (e) { resolve(fr.result); }   // tainted/odd format → keep the original data URL
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /* Studio-only styles for the photo/hotspot editor — injected once, on the
     Studio page only (renderFields never runs on the live page). */
  function injectStudioStyles() {
    if (document.getElementById('scene-sweep-studio-style')) return;
    const s = document.createElement('style');
    s.id = 'scene-sweep-studio-style';
    s.textContent = `
      .ss-imgpanel { display:flex; flex-direction:column; gap:10px; margin-bottom:6px; }
      .ss-uprow { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      .ss-upbtn, .ss-rm { display:inline-flex; align-items:center; gap:8px; border:1px solid var(--line,#d7dce6); background:#fff; color:#1a2030; border-radius:9px; padding:9px 14px; font:inherit; font-weight:600; font-size:13px; cursor:pointer; }
      .ss-upbtn { border-color:#4b63e6; color:#3a4fce; }
      .ss-upbtn:hover, .ss-rm:hover { filter:brightness(.98); }
      .ss-rm { color:#b42318; border-color:#f0c6c0; }
      .ss-canvas { margin:4px 0 12px; }
      .ss-empty { display:flex; align-items:center; justify-content:center; gap:10px; height:180px; border:1px dashed var(--line,#d7dce6); border-radius:12px; color:#67718a; font-size:14px; background:#f7f9fc; }
      .ss-status { display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:12.5px; font-weight:600; color:#5a6379; margin-bottom:8px; min-height:24px; }
      .ss-status .ss-drawhelp { font-weight:500; color:#8a5a00; }
      .ss-status .ss-drawbtn { margin-left:auto; display:inline-flex; align-items:center; gap:6px; border:1px solid var(--line,#d7dce6); background:#fff; color:#1a2030; border-radius:7px; padding:5px 10px; font:inherit; font-weight:600; font-size:12px; cursor:pointer; }
      .ss-stage { position:relative; width:100%; aspect-ratio:3/2; max-height:52vh; background:#0b0d12; border-radius:12px; overflow:hidden; border:1px solid var(--line,#d7dce6); }
      .ss-stage.is-arming { cursor:crosshair; outline:2px solid #f1b34a; }
      .ss-photo { width:100%; height:100%; object-fit:contain; display:block; -webkit-user-select:none; user-select:none; }
      /* the vector overlay — polygons + circles for every region */
      .ss-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:visible; }
      .ss-shape { fill:rgba(46,196,182,.16); stroke:#2ec4b6; stroke-width:2.5px; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
      .ss-shape.decoy { fill:rgba(120,130,150,.14); stroke:#8b93a7; stroke-dasharray:6 4; }
      .ss-shape.active { stroke-width:3.5px; fill-opacity:.26; }
      .ss-shape.draft { fill:rgba(241,179,74,.16); stroke:#f1b34a; stroke-dasharray:4 3; }
      .ss-draftline { fill:none; stroke:#f1b34a; stroke-width:2px; stroke-dasharray:4 3; vector-effect:non-scaling-stroke; }
      /* HTML overlay: numbered badges + vertex drag handles */
      .ss-pins { position:absolute; inset:0; pointer-events:none; }
      .ss-badge { position:absolute; transform:translate(-50%,-50%); min-width:22px; height:22px; padding:0 5px; border-radius:11px; background:#2ec4b6; color:#04312c; font-weight:800; font-size:12px; display:grid; place-items:center; box-shadow:0 1px 4px rgba(0,0,0,.35); }
      .ss-badge.decoy { background:#8b93a7; color:#141821; }
      .ss-badge.active { outline:2px solid #fff; }
      .ss-vtx { position:absolute; width:15px; height:15px; transform:translate(-50%,-50%); border-radius:50%; background:#fff; border:2px solid #2ec4b6; box-shadow:0 1px 3px rgba(0,0,0,.4); cursor:grab; pointer-events:auto; touch-action:none; }
      .ss-vtx:active { cursor:grabbing; }
      .ss-vtx.decoy { border-color:#8b93a7; }
      .ss-vtx.draft { border-color:#f1b34a; background:#fff7e8; }
      .ss-vtx.first { width:19px; height:19px; border-color:#f1b34a; background:#f1b34a; box-shadow:0 0 0 3px rgba(241,179,74,.35); }
      .ss-coverage { display:flex; flex-direction:column; gap:8px; margin:2px 0 14px; }
      .ss-cov-lbl { font-size:12px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:#67718a; }
      .ss-cov-row { display:flex; gap:12px; }
      .ss-cov-row vaadin-number-field { flex:1; }
      .ss-listhead { font-size:12px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; color:#67718a; margin:16px 0 2px; display:flex; align-items:center; gap:8px; }
      .ss-listhead.decoys { color:#7a8296; }
      .ss-listsub { font-size:12.5px; color:#6b7488; margin:-2px 0 8px; line-height:1.45; max-width:64ch; }
      .ss-hazlist { display:flex; flex-direction:column; gap:12px; }
      .ss-hazlist .rowcard.is-decoy { border-left:3px solid #b6bdca; }
      .ss-hotspot { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:10px; padding-top:10px; border-top:1px dashed var(--line,#e3e7f0); }
      .ss-place { display:inline-flex; align-items:center; gap:7px; border:1px solid #4b63e6; background:#eef1fe; color:#3a4fce; border-radius:8px; padding:7px 12px; font:inherit; font-weight:600; font-size:12.5px; cursor:pointer; }
      .ss-place.is-armed { border-color:#f1b34a; background:#fff4e0; color:#8a5a00; }
      .ss-mini { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--line,#d7dce6); background:#fff; color:#3a4353; border-radius:8px; padding:7px 10px; font:inherit; font-weight:600; font-size:12px; cursor:pointer; }
      .ss-mini.is-armed { border-color:#f1b34a; background:#fff4e0; color:#8a5a00; }
      .ss-shapekind { font-size:11.5px; font-weight:700; letter-spacing:.03em; text-transform:uppercase; color:#2a8f84; }
      .ss-shapekind.circle { color:#5a6379; }
      .ss-size { flex:1 1 110px; max-width:170px; accent-color:#2ec4b6; }
      .ss-clr { border:1px solid var(--line,#d7dce6); background:#fff; color:#b42318; border-radius:8px; width:30px; height:30px; cursor:pointer; }
      .ss-unplaced { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:#b54708; }
      @media (prefers-reduced-motion: reduce) { .ss-vtx, .ss-shape { transition:none; } }
      /* pinned-in-inspector layout: the image + canvas ride in the aside tab,
         the cards ride in the center form — edited side-by-side. */
      .ss-aside { display:flex; flex-direction:column; gap:10px; }
      .ss-aside .ss-canvas { margin:0; }
      .ss-aside .ss-stage { max-height:none; aspect-ratio:3/2; }
      .tabbody.is-aside.is-active { display:flex; flex-direction:column; padding:12px 12px 14px; }
      .ss-center .ss-coverage { margin-top:2px; }
    `;
    document.head.appendChild(s);
  }

  /* ---- form: sections (the three-section spine) ------------------------- */
  const sections = [
    { id: 'basics', group: 'meta', icon: 'fa-id-card', title: 'Basics',
      lead: 'What this exercise is called and the course it applies.' },

    { id: 'context', group: 'context', stage: 'ENTER', icon: 'fa-book-open', title: 'The scene, read',
      lead: 'The first-person reading that drops the learner on the floor before they look around.' },

    { id: 'scene', group: 'interaction', stage: 'ENGAGE', icon: 'fa-image', title: 'Photo & hazards',
      lead: 'The work-area photo the learner sweeps, the hazards (and decoys) they mark, and the outline of each on the photo.',
      bridgeTitle: 'From your old craft: a spot-the-hazard still',
      bridge: 'Upload the photo, list every observable hazard, then <b>outline each one</b> on the photo with the polygon tool. Add a few <b>decoys</b> — safe objects — so marking is a real judgment call and works for keyboard / screen-reader learners too. <b>short</b> labels the pin + coverage chip; the neutral <b>alt</b> names the region for accessible learners and feeds the coach the on-screen reference; <b>zone</b> is where the coach nudges; <b>full / synonyms / fix / prevent</b> feed the coaching. The coach never sees the image — it’s grounded to your text.' },

    { id: 'beats', group: 'interaction', stage: 'COACH', icon: 'fa-layer-group', title: 'The coaching beats',
      lead: 'After the sweep, the coach works the scene through Observe → Remediate → Prevent.',
      bridgeTitle: 'Practice, then Learn — one beat at a time',
      bridge: 'Each beat runs the learner first (they answer the <b>prompt</b>), then the coach lands the <b>debrief</b>. The <b>calibration</b> tiers tell the coach how to read a weak / middling / strong answer.' },

    { id: 'voice', group: 'interaction', stage: 'REACT', icon: 'fa-comment', title: 'Coach voice & first look',
      lead: 'Who the coach is, and the no-scoring first-impression prompt shown before the structured sweep.' },

    { id: 'close', group: 'debrief', stage: 'TAKEAWAYS', icon: 'fa-flag-checkered', title: 'Playbook & resources',
      lead: 'The expert close every learner sees on completion, and where to turn on the floor.' },

    { id: 'guardrails', group: 'reference', icon: 'fa-lock', title: 'System guardrails', locked: true,
      lead: 'The strict turn contract and the scene-grounding floor. Read-only.' },
  ];

  /* ---- the photo + hazards + hotspots editor (the one net-new surface) --- */
  function buildSceneSection(H, numField) {
    const { tf, rowCard, esc, getScenario, scheduleUpdate } = H;
    // Built as TWO nodes that share this one closure (so the draw state is one):
    //   center — the hazard/decoy cards + coverage + scene text (the editor form)
    //   aside  — the photo + the vector-overlay canvas (pinned in the inspector)
    // `center` is also the liveness anchor for the self-cleaning listeners.
    let center = null;
    const s = getScenario();
    if (!s.scene || typeof s.scene !== 'object') s.scene = { src: '', alt: '', canonDescription: '' };
    if (!Array.isArray(s.hazards)) s.hazards = [];
    if (!Array.isArray(s.decoys)) s.decoys = [];
    if (!s.coverage || typeof s.coverage !== 'object') s.coverage = { required: 1, total: s.hazards.length || 1 };

    // Interaction state, referencing regions by { list:'hazards'|'decoys', i }.
    //   draw   — an outline being drawn now: { list, i, mode:'poly'|'circle', pts:[[x,y]…] }
    //   active — the region whose vertices show as drag handles (for fine-tuning)
    let draw = null;
    let active = null;
    const region = (ref) => ref && s[ref.list] && s[ref.list][ref.i];
    const sameRef = (a, b) => !!(a && b && a.list === b.list && a.i === b.i);

    const imgPanel = document.createElement('div'); imgPanel.className = 'ss-imgpanel';
    const canvas   = document.createElement('div'); canvas.className = 'ss-canvas';
    const covPanel = document.createElement('div'); covPanel.className = 'ss-coverage';
    const listWrap = document.createElement('div'); listWrap.className = 'ss-hazlist';

    const hasImg = () => !!String(s.scene.src || '').trim();

    function setImage(src) { s.scene.src = src || ''; scheduleUpdate(); paintImage(); paintStage(); }

    function paintImage() {
      imgPanel.innerHTML = '';
      const up = document.createElement('div'); up.className = 'ss-uprow';
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ss-upbtn';
      btn.innerHTML = `<i class="fa-solid fa-image"></i> ${hasImg() ? 'Replace photo' : 'Upload photo'}`;
      const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/*'; file.style.display = 'none';
      file.addEventListener('change', () => {
        const f = file.files && file.files[0]; if (!f) return;
        downscaleImage(f, 1280, 0.82).then(setImage).catch(() => alert('Could not read that image — try another file, or paste a path instead.'));
      });
      btn.addEventListener('click', () => file.click());
      up.append(btn, file);
      if (hasImg()) {
        const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'ss-rm';
        rm.innerHTML = '<i class="fa-solid fa-trash-can"></i> Remove';
        rm.addEventListener('click', () => setImage(''));
        up.append(rm);
      }
      imgPanel.append(up);
      const path = tf('scene.src', 'or paste an image path / URL', {
        helper: 'A repo path (assets/…) or an https URL. Upload embeds the photo in the scenario; a path keeps it external (smaller, but you must commit the file).' });
      path.addEventListener('change', () => { paintImage(); paintStage(); });
      imgPanel.append(path);
    }

    // ---- the stage: photo + SVG shape overlay + badges/handles ----
    const SVGNS = 'http://www.w3.org/2000/svg';
    let stageImg = null, stageSvg = null, stagePins = null, stageStatus = null;

    function labelFor(ref) {
      const r = region(ref); if (!r) return ref.list === 'decoys' ? 'this decoy' : 'this hazard';
      const t = ref.list === 'decoys' ? (r.alt || 'this decoy') : (r.short || 'this hazard');
      return String(t).length > 40 ? String(t).slice(0, 40) + '…' : t;
    }

    function renderStatus() {
      if (!stageStatus) return;
      stageStatus.innerHTML = '';
      const txt = document.createElement('span');
      if (draw && draw.mode === 'poly') {
        txt.innerHTML = `<i class="fa-solid fa-draw-polygon"></i> Outlining <b>${esc(labelFor(draw))}</b> — `;
        const help = document.createElement('span'); help.className = 'ss-drawhelp';
        help.textContent = draw.pts.length < 3
          ? `click around the object (${draw.pts.length} point${draw.pts.length === 1 ? '' : 's'}; need 3+).`
          : 'click to add points; click the amber dot or press Enter to close. Backspace undoes, Esc cancels.';
        stageStatus.append(txt, help);
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'ss-drawbtn';
        cancel.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancel'; cancel.addEventListener('click', cancelDraw);
        stageStatus.append(cancel);
        if (draw.pts.length >= 3) {
          const done = document.createElement('button'); done.type = 'button'; done.className = 'ss-drawbtn';
          done.innerHTML = '<i class="fa-solid fa-check"></i> Close outline'; done.addEventListener('click', commitDraw);
          stageStatus.append(done);
        }
      } else if (draw && draw.mode === 'circle') {
        txt.innerHTML = `<i class="fa-solid fa-circle-dot"></i> Placing a circle for <b>${esc(labelFor(draw))}</b> — click the spot. Esc cancels.`;
        stageStatus.append(txt);
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'ss-drawbtn';
        cancel.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancel'; cancel.addEventListener('click', cancelDraw);
        stageStatus.append(cancel);
      } else {
        txt.innerHTML = 'Outline each hazard <b>and each decoy</b> on the photo — use <b>Outline on photo</b> beside a region below, then drag its dots to fine-tune. Learners tap, key, or list these to mark them.';
        stageStatus.append(txt);
      }
    }

    function paintStage() {
      canvas.innerHTML = '';
      stageImg = stageSvg = stagePins = stageStatus = null;
      if (!hasImg()) { canvas.innerHTML = '<div class="ss-empty"><i class="fa-solid fa-draw-polygon"></i> Upload a photo to outline hazards and decoys on it.</div>'; return; }
      const status = document.createElement('div'); status.className = 'ss-status';
      const stage = document.createElement('div'); stage.className = 'ss-stage' + (draw ? ' is-arming' : '');
      const img = document.createElement('img'); img.className = 'ss-photo'; img.src = s.scene.src; img.alt = ''; img.draggable = false;
      const svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('class', 'ss-svg');
      const pins = document.createElement('div'); pins.className = 'ss-pins';
      stage.append(img, svg, pins);
      stageImg = img; stageSvg = svg; stagePins = pins; stageStatus = status;
      img.addEventListener('load', renderShapes);
      stage.addEventListener('click', onStageClick);
      stage.addEventListener('dblclick', (e) => { e.preventDefault(); if (draw && draw.mode === 'poly') commitDraw(); });
      canvas.append(status, stage);
      renderStatus();
      requestAnimationFrame(renderShapes);   // covers a cached image (load may not fire)
    }

    // Draw every region's shape (polygon or circle) + its badge, and — for the
    // active region or the in-progress draft — the draggable vertex handles.
    function renderShapes() {
      if (!stageImg || !stageSvg || !stagePins) return;
      const dr = GEO.drawRect(stageImg); if (!dr) return;
      stageSvg.innerHTML = '';
      stagePins.innerHTML = '';

      const drawRegion = (list, r, i) => {
        if (!r || !r.spot) return;
        const isDecoy = list === 'decoys';
        const activeHere = !draw && sameRef(active, { list, i });
        const cls = 'ss-shape' + (isDecoy ? ' decoy' : '') + (activeHere ? ' active' : '');
        if (Array.isArray(r.spot.points)) {
          const px = GEO.polyPixels(stageImg, r.spot.points); if (!px) return;
          const poly = document.createElementNS(SVGNS, 'polygon');
          poly.setAttribute('points', px.map((p) => `${p.left.toFixed(1)},${p.top.toFixed(1)}`).join(' '));
          poly.setAttribute('class', cls);
          stageSvg.append(poly);
          if (activeHere) r.spot.points.forEach((pt, vi) => {
            const vpx = GEO.toPixels(stageImg, pt[0], pt[1]);
            const v = document.createElement('div'); v.className = 'ss-vtx' + (isDecoy ? ' decoy' : '');
            v.style.left = vpx.left + 'px'; v.style.top = vpx.top + 'px';
            attachVertexDrag(v, { list, i }, vi);
            stagePins.append(v);
          });
        } else {
          const cpx = GEO.toPixels(stageImg, r.spot.x, r.spot.y);
          const circ = document.createElementNS(SVGNS, 'circle');
          circ.setAttribute('cx', cpx.left); circ.setAttribute('cy', cpx.top);
          circ.setAttribute('r', Math.max(6, (r.spot.r || 0.12) * dr.width));
          circ.setAttribute('class', cls);
          stageSvg.append(circ);
        }
        const c = GEO.centroid(r.spot), cpx = GEO.toPixels(stageImg, c.x, c.y);
        const badge = document.createElement('div');
        badge.className = 'ss-badge' + (isDecoy ? ' decoy' : '') + (activeHere ? ' active' : '');
        badge.style.left = cpx.left + 'px'; badge.style.top = cpx.top + 'px';
        badge.textContent = isDecoy ? String.fromCharCode(65 + i) : String(i + 1);
        stagePins.append(badge);
      };

      s.hazards.forEach((r, i) => drawRegion('hazards', r, i));
      s.decoys.forEach((r, i) => drawRegion('decoys', r, i));

      // the in-progress polygon being drawn
      if (draw && draw.mode === 'poly' && draw.pts.length) {
        const px = draw.pts.map((p) => GEO.toPixels(stageImg, p[0], p[1]));
        if (px.length >= 2) {
          const pl = document.createElementNS(SVGNS, 'polyline');
          pl.setAttribute('points', px.map((p) => `${p.left.toFixed(1)},${p.top.toFixed(1)}`).join(' '));
          pl.setAttribute('class', 'ss-draftline');
          stageSvg.append(pl);
        }
        px.forEach((p, vi) => {
          const closeable = vi === 0 && draw.pts.length >= 3;
          const v = document.createElement('div'); v.className = 'ss-vtx draft' + (closeable ? ' first' : '');
          v.style.left = p.left + 'px'; v.style.top = p.top + 'px';
          v.style.pointerEvents = closeable ? 'auto' : 'none';
          if (closeable) { v.title = 'Click to close the outline'; v.addEventListener('click', (e) => { e.stopPropagation(); commitDraw(); }); }
          stagePins.append(v);
        });
      }
    }

    function attachVertexDrag(handle, ref, vi) {
      handle.addEventListener('pointerdown', (e) => {
        const r = region(ref); if (!r || !r.spot || !Array.isArray(r.spot.points)) return;
        e.preventDefault(); e.stopPropagation();
        try { handle.setPointerCapture(e.pointerId); } catch (_) {}
        const move = (ev) => {
          const n = GEO.toNormalized(stageImg, ev.clientX, ev.clientY); if (!n) return;
          r.spot.points[vi] = [+n.x.toFixed(4), +n.y.toFixed(4)];
          renderShapes();
        };
        const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); scheduleUpdate(); };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
      });
    }

    function onStageClick(e) {
      if (!draw || !stageImg) return;
      const n = GEO.toNormalized(stageImg, e.clientX, e.clientY); if (!n) return;
      const r = region(draw); if (!r) { cancelDraw(); return; }
      if (draw.mode === 'circle') {
        r.spot = { x: +n.x.toFixed(4), y: +n.y.toFixed(4), r: (r.spot && r.spot.r > 0 ? r.spot.r : 0.13) };
        active = { list: draw.list, i: draw.i }; draw = null;
        scheduleUpdate(); paintStage(); paintList();
        return;
      }
      // polygon: click near the first point (with 3+) closes it
      if (draw.pts.length >= 3) {
        const fp = GEO.toPixels(stageImg, draw.pts[0][0], draw.pts[0][1]);
        const cp = GEO.toPixels(stageImg, n.x, n.y);
        if (fp && cp && Math.hypot(fp.left - cp.left, fp.top - cp.top) <= 12) { commitDraw(); return; }
      }
      draw.pts.push([+n.x.toFixed(4), +n.y.toFixed(4)]);
      renderShapes(); renderStatus();
    }

    function armDraw(list, i, mode) {
      if (!hasImg()) { alert('Upload a photo first, then outline regions on it.'); return; }
      draw = { list, i, mode, pts: [] }; active = { list, i };
      paintStage(); paintList();
      canvas.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    function commitDraw() {
      if (!draw || draw.mode !== 'poly' || draw.pts.length < 3) return;
      const r = region(draw); if (r) r.spot = { points: draw.pts.slice() };
      active = { list: draw.list, i: draw.i }; draw = null;
      scheduleUpdate(); paintStage(); paintList();
    }
    function cancelDraw() { draw = null; paintStage(); paintList(); }

    // Keyboard while drawing (self-cleans once this section leaves the DOM).
    function onKey(e) {
      if (center && !center.isConnected) { document.removeEventListener('keydown', onKey); return; }
      if (!draw) return;
      if (e.key === 'Escape') { e.preventDefault(); cancelDraw(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (draw.mode === 'poly') commitDraw(); }
      else if (e.key === 'Backspace' && draw.mode === 'poly' && draw.pts.length) { e.preventDefault(); draw.pts.pop(); renderShapes(); renderStatus(); }
    }
    document.addEventListener('keydown', onKey);

    function paintCoverage() {
      covPanel.innerHTML = '';
      const lbl = document.createElement('div'); lbl.className = 'ss-cov-lbl'; lbl.textContent = 'Coverage target';
      const max = Math.max(1, s.hazards.length);
      const req = numField(s.coverage, 'required', 'Must find', { min: 1, max, helper: 'Hits before the “talk to your coach” CTA appears.' });
      const tot = numField(s.coverage, 'total', 'Out of', { min: 1, max, helper: 'Usually the hazard count.' });
      const row = document.createElement('div'); row.className = 'ss-cov-row'; row.append(req, tot);
      covPanel.append(lbl, row);
    }

    // The outline controls shared by hazard + decoy cards — the polygon tool,
    // the circle fallback, the shape readout, adjust/clear.
    function outlineControls(list, r, i) {
      const ref = { list, i };
      const isDecoy = list === 'decoys';
      const drawingHere = draw && sameRef(draw, ref);
      const hs = document.createElement('div'); hs.className = 'ss-hotspot';

      const outBtn = document.createElement('button'); outBtn.type = 'button';
      outBtn.className = 'ss-place' + (drawingHere && draw.mode === 'poly' ? ' is-armed' : '');
      outBtn.innerHTML = `<i class="fa-solid fa-draw-polygon"></i> ${drawingHere && draw.mode === 'poly' ? 'Click the photo…' : (r.spot ? 'Redraw outline' : 'Outline on photo')}`;
      outBtn.addEventListener('click', () => armDraw(list, i, 'poly'));
      hs.append(outBtn);

      const circBtn = document.createElement('button'); circBtn.type = 'button';
      circBtn.className = 'ss-mini' + (drawingHere && draw.mode === 'circle' ? ' is-armed' : '');
      circBtn.title = 'Place a simple circle instead of an outline';
      circBtn.innerHTML = `<i class="fa-solid fa-circle-dot"></i> Circle`;
      circBtn.addEventListener('click', () => armDraw(list, i, 'circle'));
      hs.append(circBtn);

      if (r.spot) {
        const isPoly = Array.isArray(r.spot.points);
        const kind = document.createElement('span'); kind.className = 'ss-shapekind' + (isPoly ? '' : ' circle');
        kind.textContent = isPoly ? `polygon · ${r.spot.points.length} pts` : 'circle';
        hs.append(kind);
        if (isPoly) {
          const adj = document.createElement('button'); adj.type = 'button';
          const adjusting = !draw && sameRef(active, ref);
          adj.className = 'ss-mini' + (adjusting ? ' is-armed' : '');
          adj.innerHTML = `<i class="fa-solid fa-arrows-up-down-left-right"></i> ${adjusting ? 'Adjusting…' : 'Adjust points'}`;
          adj.addEventListener('click', () => {
            active = adjusting ? null : ref; draw = null;
            paintStage(); paintList();
            canvas.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          });
          hs.append(adj);
        } else {
          const size = document.createElement('input'); size.type = 'range';
          size.min = '0.05'; size.max = '0.28'; size.step = '0.01'; size.value = String(r.spot.r || 0.13);
          size.className = 'ss-size'; size.title = 'Circle size';
          size.addEventListener('input', () => { r.spot.r = +size.value; renderShapes(); });
          size.addEventListener('change', scheduleUpdate);
          hs.append(size);
        }
        const clr = document.createElement('button'); clr.type = 'button'; clr.className = 'ss-clr';
        clr.title = 'Remove outline'; clr.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        clr.addEventListener('click', () => {
          r.spot = null;
          if (sameRef(active, ref)) active = null;
          if (draw && sameRef(draw, ref)) draw = null;
          scheduleUpdate(); paintStage(); paintList();
        });
        hs.append(clr);
      } else {
        const warn = document.createElement('span'); warn.className = 'ss-unplaced';
        warn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> no outline yet — can’t be ${isDecoy ? 'shown' : 'marked'}`;
        hs.append(warn);
      }
      return hs;
    }

    // Keep draw/active refs valid when a region is removed from a list.
    function reindexAfterRemove(list, removed) {
      const fix = (ref) => { if (!ref || ref.list !== list) return ref; if (ref.i === removed) return null; if (ref.i > removed) ref.i--; return ref; };
      draw = fix(draw); active = fix(active);
    }

    function hazardCard(h, i) {
      const onDel = () => {
        s.hazards.splice(i, 1); reindexAfterRemove('hazards', i);
        if (s.coverage.total > s.hazards.length) s.coverage.total = Math.max(1, s.hazards.length);
        if (s.coverage.required > s.coverage.total) s.coverage.required = s.coverage.total;
        scheduleUpdate(); paintList(); paintStage(); paintCoverage();
      };
      const card = rowCard(`Hazard ${i + 1}${h.short ? ' · ' + esc(h.short) : ''}`, onDel,
        tf(`hazards.${i}.short`, 'Short label (pin + coverage chip)', { placeholder: 'Unlabeled secondary container' }),
        tf(`hazards.${i}.alt`, 'What’s visibly here (neutral) — screen-reader name & on-screen reference', { area: true, minRows: 2, placeholder: 'A clear plastic jug on the left of the bench, nothing written on it', helper: 'Describe what a person SEES, not that it’s a hazard. Names the region for keyboard / screen-reader learners and feeds the coach the on-screen reference.' }),
        tf(`hazards.${i}.zone`, 'Where it is — the coach nudges toward this', { area: true, minRows: 2, placeholder: 'on the bench in front of you, to the left' }),
        tf(`hazards.${i}.full`, 'What it is — the coach grounds to this', { area: true, minRows: 2 }),
        tf(`hazards.${i}.synonyms`, 'Accepted phrasings', { area: true, minRows: 2, helper: 'Comma-separated ways a learner might name it — also credits the accessible free-text sweep.' }),
        tf(`hazards.${i}.fix`, 'Right-now fix (Remediate beat)', { area: true, minRows: 2 }),
        tf(`hazards.${i}.prevent`, 'Systemic fix (feeds the close)', { area: true, minRows: 2 }),
      );
      card.append(outlineControls('hazards', h, i));
      return card;
    }

    function decoyCard(d, i) {
      const onDel = () => { s.decoys.splice(i, 1); reindexAfterRemove('decoys', i); scheduleUpdate(); paintList(); paintStage(); };
      const card = rowCard(`Decoy ${String.fromCharCode(65 + i)}${d.alt ? ' · ' + esc(String(d.alt).slice(0, 28)) : ''}`, onDel,
        tf(`decoys.${i}.alt`, 'What’s visibly here (neutral)', { area: true, minRows: 2, placeholder: 'A yellow safety bollard on the floor in the background', helper: 'A safe / neutral object. Describe what’s seen — the learner has to judge that it’s NOT a hazard.' }),
        tf(`decoys.${i}.note`, 'Why it’s actually fine (shown if a learner marks it)', { area: true, minRows: 2, placeholder: 'That’s a safety bollard doing its job — good to see, not a hazard.' }),
      );
      card.classList.add('is-decoy');
      card.append(outlineControls('decoys', d, i));
      return card;
    }

    function paintList() {
      listWrap.innerHTML = '';

      const hHead = document.createElement('div'); hHead.className = 'ss-listhead';
      hHead.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Hazards — the observable red flags';
      listWrap.append(hHead);
      s.hazards.forEach((h, i) => listWrap.append(hazardCard(h, i)));
      const addH = document.createElement('button'); addH.type = 'button'; addH.className = 'addrow';
      addH.innerHTML = '<i class="fa-solid fa-plus"></i> Add hazard';
      addH.addEventListener('click', () => {
        s.hazards.push({ id: 'hazard' + (s.hazards.length + 1), short: '', alt: '', full: '', zone: '', synonyms: '', source: '', fix: '', prevent: '', spot: null });
        if (s.coverage.total < s.hazards.length) s.coverage.total = s.hazards.length;
        scheduleUpdate(); paintList(); paintStage(); paintCoverage();
      });
      listWrap.append(addH);

      const dHead = document.createElement('div'); dHead.className = 'ss-listhead decoys';
      dHead.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Decoys — safe objects (recommended)';
      const dSub = document.createElement('div'); dSub.className = 'ss-listsub';
      dSub.textContent = 'Safe / neutral objects the learner can also mark. They make the keyboard, list, and free-text paths a real “which of these are unsafe?” test instead of a walk down the answers — and turn a pointer tap on something safe into a teaching moment instead of a blank miss.';
      listWrap.append(dHead, dSub);
      s.decoys.forEach((d, i) => listWrap.append(decoyCard(d, i)));
      const addD = document.createElement('button'); addD.type = 'button'; addD.className = 'addrow';
      addD.innerHTML = '<i class="fa-solid fa-plus"></i> Add decoy';
      addD.addEventListener('click', () => {
        s.decoys.push({ id: 'decoy' + (s.decoys.length + 1), alt: '', note: '', spot: null });
        scheduleUpdate(); paintList(); paintStage();
      });
      listWrap.append(addD);
    }

    const sceneText = document.createElement('div'); sceneText.className = 'fields';
    sceneText.append(
      tf('scene.alt', 'Whole-photo alt text (accessibility fallback)', { area: true, minRows: 2,
        helper: 'A one-paragraph description of the whole scene for a screen-reader learner. The per-region descriptions above carry the detail; this is the overview.' }),
      tf('scene.canonDescription', 'What the coach is grounded to — it never sees the photo', { area: true, minRows: 4,
        helper: 'Describe the scene AND every hazard in words. The model reasons over this text, not the image.' }),
    );

    // ASIDE — the image + its vector canvas (upload lives with the image it acts on).
    const aside = document.createElement('div'); aside.className = 'ss-aside';
    aside.append(imgPanel, canvas);
    // CENTER — the cards the author fills while watching the pinned image.
    center = document.createElement('div'); center.className = 'fields ss-center';
    center.append(covPanel, listWrap, sceneText);

    paintImage(); paintStage(); paintCoverage(); paintList();

    // keep shapes aligned when the drawn photo rect moves (self-cleans on detach)
    const onResize = () => { if (center && !center.isConnected) { removeEventListener('resize', onResize); return; } renderShapes(); };
    addEventListener('resize', onResize);
    return { center, aside };
  }

  /* ---- form: field renderers -------------------------------------------- */
  function renderFields(sec, H) {
    injectStudioStyles();
    const { tf, rowsBlock, rowCard, guidance, esc, scheduleUpdate } = H;
    const box = document.createElement('div');
    box.className = 'fields';

    // a plain number field (the shell's helpers are text-only); mutates obj[key]
    const numField = (obj, key, label, opts = {}) => {
      const el = document.createElement('vaadin-number-field');
      el.setAttribute('theme', 'outlined');
      el.label = label;
      if (opts.helper) el.helperText = opts.helper;
      if (opts.min != null) el.min = opts.min;
      if (opts.max != null) el.max = opts.max;
      el.stepButtonsVisible = true;
      el.value = String(obj[key] ?? '');
      el.addEventListener('change', () => {
        let n = parseInt(el.value, 10);
        if (!Number.isFinite(n)) n = (opts.min != null ? opts.min : 0);
        if (opts.min != null) n = Math.max(opts.min, n);
        if (opts.max != null) n = Math.min(opts.max, n);
        obj[key] = n; el.value = String(n); scheduleUpdate();
      });
      return el;
    };

    if (sec.id === 'basics') {
      box.append(
        tf('title', 'Exercise title', { helper: 'Shown in the learner’s top bar.' }),
        tf('course', 'Course this applies', { placeholder: 'Hazard Communication GHS (RVCT-479)' }),
        tf('learnerName', 'What the coach calls the learner', { placeholder: 'you' }),
        tf('framing', 'One-line framing', { area: true, minRows: 2, helper: 'What kind of exercise this is, e.g. “a hands-on hazard-recognition exercise…”.' }),
        tf('learnerRole', 'Who the learner is', { area: true, minRows: 2, helper: 'For Scene Sweep, themselves — a worker looking at their own work area.' }),
      );
    }

    if (sec.id === 'context') {
      box.append(
        tf('establishing.eyebrow', 'Establishing eyebrow', { placeholder: 'The scene' }),
        tf('establishing.title', 'Establishing title', { placeholder: 'The finishing bench' }),
        tf('establishing.sub', 'Establishing subtitle', { area: true, minRows: 2 }),
        tf('intro.audio.eyebrow', 'Reading eyebrow', { placeholder: 'The scene · read' }),
        tf('intro.audio.title', 'Reading title', { placeholder: 'On the floor' }),
        tf('intro.audio.text', 'The reading (first person)', { area: true, minRows: 7,
          helper: 'What the learner reads before looking around — sets the floor, ends by inviting a slow look.' }),
        tf('intro.audio.continueLabel', 'Continue button label', { placeholder: 'Take a look around' }),
      );
    }

    if (sec.id === 'scene') {
      const parts = buildSceneSection(H, numField);
      box.append(parts.center);
      // Pin the photo canvas in the inspector (side-by-side with the cards) when
      // the shell supports it; otherwise fall back to inline (old single-column).
      if (typeof H.setAside === 'function') H.setAside(parts.aside, { title: 'Scene image', icon: 'fa-image' });
      else box.insertBefore(parts.aside, box.firstChild);
    }

    if (sec.id === 'beats') {
      box.append(rowsBlock('phases', (p, i, onDel) => rowCard(
        `Beat ${i + 1}${p.label ? ' · ' + esc(p.label) : ''}`, onDel,
        tf(`phases.${i}.label`, 'Beat label', { placeholder: 'Observe' }),
        tf(`phases.${i}.level`, 'Beat sub-label', { placeholder: 'Beat 1 · spot the hazards' }),
        tf(`phases.${i}.signpost`, 'Signpost (verbatim hand-off)', { area: true, minRows: 2 }),
        tf(`phases.${i}.prompt`, 'Task prompt (verbatim)', { area: true, minRows: 2 }),
        tf(`phases.${i}.exitCriteria`, 'Exit criteria', { area: true, minRows: 2, helper: 'When the beat is done — the coach reads this to decide when to teach.' }),
        numField(p, 'maxTurns', 'Max learner turns', { min: 1, max: 6 }),
        tf(`phases.${i}.debrief.talkItThrough`, 'Debrief opener (verbatim first line)', { area: true, minRows: 2 }),
        tf(`phases.${i}.debrief.points`, 'Debrief points', { area: true, minRows: 4 }),
        rowsBlock(`phases.${i}.calibration`, (t, j, onDelT) => rowCard(`Tier ${j + 1}`, onDelT,
          tf(`phases.${i}.calibration.${j}.tier`, 'Tier', { placeholder: 'STRONG' }),
          tf(`phases.${i}.calibration.${j}.guidance`, 'How the learner meets it (and how the coach responds)', { area: true, minRows: 3 }),
        ), 'Add tier', () => ({ tier: '', guidance: '' })),
      ), 'Add beat', () => ({ id: '', kind: 'spot', label: '', level: '', maxTurns: 2, signpost: '', prompt: '', exitCriteria: '', calibration: [], debrief: { talkItThrough: '', points: '' }, transitions: [] })));
    }

    if (sec.id === 'voice') {
      box.append(
        tf('voice.persona', 'Coach persona', { area: true, minRows: 2, helper: 'One or two lines — who the coach is.' }),
        tf('voice.guidance', 'Extra voice guidance (optional)', { area: true, minRows: 2 }),
        tf('reflection.prompt', 'First-impression prompt', { area: true, minRows: 3, helper: 'A no-scoring gut check before the structured sweep.' }),
        tf('reflection.feedbackGuidance', 'How the coach responds to it', { area: true, minRows: 3, helper: 'Calibration only — acknowledge, don’t grade or list hazards.' }),
      );
    }

    if (sec.id === 'close') {
      box.append(
        guidance('The close is guaranteed', 'fa-shield-halved', 'Every learner sees these on completion regardless of what they spotted — the app renders them; the coach never has to.'),
        rowsBlock('playbook', (p, i, onDel) => rowCard(`Playbook item ${i + 1}`, onDel,
          tf(`playbook.${i}.title`, 'Title'),
          tf(`playbook.${i}.body`, 'Body', { area: true, minRows: 3 }),
          tf(`playbook.${i}.source`, 'Source (optional)', { placeholder: 'RVCT-479 slides 41–44' }),
        ), 'Add playbook item', () => ({ title: '', body: '', source: '' })),
        tf('resources.lead', 'Resources lead-in', { area: true, minRows: 2 }),
        rowsBlock('resources.items', (r, i, onDel) => rowCard(`Resource ${i + 1}`, onDel,
          tf(`resources.items.${i}.title`, 'Title'),
          tf(`resources.items.${i}.body`, 'Body', { area: true, minRows: 3 }),
        ), 'Add resource', () => ({ title: '', body: '' })),
      );
    }

    if (sec.id === 'guardrails') {
      SS_ENGINE_SECTIONS.forEach((g) => {
        const card = document.createElement('div'); card.className = 'rowcard lockcard';
        card.innerHTML =
          `<div class="lockhead"><i class="fa-solid fa-lock"></i> ${esc(g.title)}</div>` +
          (g.note ? `<div class="note">${esc(g.note)}</div>` : '') +
          `<details><summary>Read the exact locked text</summary><pre data-guardrail="${esc(g.id)}"></pre></details>`;
        box.appendChild(card);
      });
      box.appendChild(guidance('Why these are locked', 'fa-shield-halved',
        'The page renders these exact shapes — the turn JSON and the scene-grounding floor. Your scene, hazards, and beats fill the prompt around them; they can’t change what the engine depends on.'));
    }

    return box;
  }

  /* ---- lints ------------------------------------------------------------ */
  function lints(s) {
    const L = [];
    const add = (severity, section, msg, why) => L.push({ severity, section, msg, why });
    const empty = (v) => !String(v ?? '').trim();

    if (empty(s.title)) add('err', 'basics', 'The exercise needs a title.', 'It appears in the learner’s top bar.');
    if (empty(s.course)) add('info', 'basics', 'No course named.', 'It grounds the coach’s framing.');

    const scene = s.scene || {};
    if (empty(scene.src)) add('err', 'scene', 'No photo set.', 'Scene Sweep is a spot-the-hazard on a photo — upload one or paste a path.');
    if (empty(scene.canonDescription)) add('err', 'scene', 'The coach has nothing to ground to.', 'The model never sees the photo — describe the scene + hazards in words.');

    const filled = (s.hazards || []).filter((h) => !empty(h.short) || !empty(h.full));
    if (!filled.length) add('err', 'scene', 'No hazards to spot.', 'Add at least one observable hazard.');
    (s.hazards || []).forEach((h, i) => {
      const label = h.short ? `“${h.short}”` : `#${i + 1}`;
      if (empty(h.short)) add('err', 'scene', `Hazard #${i + 1} has no short label.`, 'It labels the pin and the coverage chip.');
      if (empty(h.full)) add('warn', 'scene', `Hazard ${label} has no description.`, 'The coach grounds to this — without it, it can’t credit the catch.');
      if (empty(h.zone)) add('warn', 'scene', `Hazard ${label} has no zone.`, 'The coach nudges toward the zone without naming the hazard.');
      if (empty(h.alt)) add('warn', 'scene', `Hazard ${label} has no neutral description.`, 'It’s the screen-reader name for the keyboard/list path and the on-screen reference fed to the coach. Describe what’s visible, not why it’s a hazard.');
      if (!h.spot) add('err', 'scene', `Hazard ${label} has no outline on the photo.`, 'Without a placed hotspot the learner can’t tap or key to mark it — click “Outline on photo”.');
    });

    (s.decoys || []).forEach((d, i) => {
      const label = d.alt ? `“${String(d.alt).slice(0, 32)}…”` : `#${i + 1}`;
      if (empty(d.alt)) add('info', 'scene', `Decoy ${label} has no neutral description.`, 'It’s the region’s screen-reader/list name — without it the decoy can’t be presented.');
      if (empty(d.note)) add('info', 'scene', `Decoy ${label} has no “why it’s fine” note.`, 'Shown when a learner marks it — the teaching moment that it’s safe.');
      if (!d.spot) add('warn', 'scene', `Decoy ${label} has no outline on the photo.`, 'Without an outline the decoy can’t be tapped or keyed — outline it, or remove it.');
    });

    const cov = s.coverage || {};
    const nHaz = (s.hazards || []).length;
    if (cov.total > nHaz) add('warn', 'scene', 'Coverage “out of” exceeds the hazard count.', 'You can’t require more than exist.');
    if (cov.required > cov.total) add('warn', 'scene', 'Coverage “must find” is more than the total.', 'The CTA would never trigger.');

    (s.phases || []).forEach((p, i) => {
      const label = p.label ? `“${p.label}”` : `beat #${i + 1}`;
      if (empty(p.prompt)) add('warn', 'beats', `${label} has no task prompt.`, 'The learner is shown this verbatim when the beat opens.');
      if (empty((p.debrief || {}).talkItThrough)) add('info', 'beats', `${label} has no debrief opener.`, 'The coach opens the Learn turn with this exact line.');
    });

    if (!(s.playbook || []).some((p) => !empty(p.title))) add('warn', 'close', 'No playbook items.', 'The guaranteed expert close would be empty.');

    return L;
  }

  /* ---- the type object ---------------------------------------------------- */
  const TYPE = {
    id: 'scene-sweep',
    label: 'Scene Sweep',
    icon: 'fa-magnifying-glass-location',
    blurb: 'Spot hazards on a photo, then talk them through.',
    DEFAULT,
    ENGINE_SECTIONS: SS_ENGINE_SECTIONS,
    GROUNDING_SECTION,
    isValid,
    normalize,
    blank,
    merge,
    compile,
    fill,
    highlightStrings,
    toRuntime,
    // [Option B] the converged universal player (js/sim-player.js) + the opt-in
    // perception layer (js/sim-perception.js). Was the bespoke scene-sweep-live.html;
    // migrated onto the shared runtime with its OWN toRuntime + compile. The bespoke
    // page is frozen in archive/2026-08-04/.
    previewUrl: () => 'scenario-live.html?type=scene-sweep',
    sections,
    renderFields,
    lints,
    playtest: null,   // v1: no in-studio playtest — publish + open the live page
  };

  window.AitheraSceneSweep = TYPE;

  if (window.AitheraStudio) {
    const S = window.AitheraStudio;
    TYPE.store = S.makeStore(S.makeKeys(TYPE.id), { isValid, normalize });
    S.register(TYPE);
  }
})();
