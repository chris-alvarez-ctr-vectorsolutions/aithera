/* ============================================================================
   scenario-v4-runtime.js — compile a Scenario CML v4 document into the runtime
   shape the UX Universal player already consumes.
   ----------------------------------------------------------------------------
   This is the piece that lets the AUTHORED SOURCE become v4 without rewriting
   the engine. v4 is typeless — a scenario is just phases picking a practice
   mode — so ONE compiler replaces every per-type toRuntime()/toMixArc():

       v4 content  ──▶  compile()  ──▶  runtime { phases[], … }  ──▶  sim-player

   WHAT THIS DELIBERATELY DOES NOT DO
   ----------------------------------
   Three of the four open calls in the spine-alignment note are engine changes,
   not data changes, and each would alter learner-visible behavior. None is
   bundled here, because none has been decided:

     · The debrief stays a pair of fields on its rung (debrief.talkItThrough /
       .points) rather than becoming its own turn-owning rung. Promoting it is a
       normalize-time transform we can make later; doing it here would change
       pacing for every shipped scenario in the same commit as the data move.
     · Prompt scoping stays as it is (one compiled prompt), not v4's two threaded
       conversations.
     · carryover is carried through as data but nothing consumes it yet; the
       runtime still has no verbatim-transcript channel.

   Keeping those out is what makes this cutover verifiable: the compiler's job is
   to produce the SAME runtime a native toRuntime() produced, from v4 input.
   ============================================================================ */

(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ScenarioV4Runtime = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const str = (x) => (typeof x === 'string' ? x : '');
  const arr = (x) => (Array.isArray(x) ? x : []);
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});

  /* v4 practice.mode → the UX Universal runtime beat `type` and ladder `world`. The world is
     what the player themes on: a scene gets the in-world chrome, coaching and
     observe both run in the coach surface. */
  const RUNTIME_BY_MODE = {
    coach_inquiry: { type: 'coach-led', world: 'coaching' },
    roleplay: { type: 'roleplay', world: 'scene' },
    observe_react: { type: 'observe', world: 'coaching' },
  };

  const LEVELS = ['unthoughtful', 'neutral', 'strong'];

  /* ------------------------------------------------------------------------
     levels → calibration
     Our prompt builder reads calibration[].guidance as one instruction per tier.
     v4 splits the same thing into look_for (how to recognise it) and response
     (what to do about it), so recombining them restores exactly what the prompt
     used to carry.
     --------------------------------------------------------------------- */
  function calibrationFromLevels(levels) {
    const out = [];
    LEVELS.forEach(function (key) {
      const level = obj(obj(levels)[key]);
      if (!level.look_for && !level.response) return;
      const parts = [];
      if (level.look_for) parts.push(str(level.look_for));
      if (level.response) parts.push(str(level.response));
      /* progression only exists on roleplay levels — it describes how far the
         scene gets at this tier, which our scene prompt wants alongside the
         reaction. */
      if (level.progression) parts.push(str(level.progression));
      out.push({ tier: key, guidance: parts.join(' ') });
    });
    return out;
  }

  /* ------------------------------------------------------------------------
     locked openers → entry
     A v4 practice always opens with locked content: opening_messages for coach
     and roleplay practices, `brief` for observe. Our runtime splits that into
     signpost (the first bubble) + beats[] (the rest).
     --------------------------------------------------------------------- */
  function entryFromInteraction(interaction, practice, sceneWorld) {
    const it = obj(interaction);
    const messages = (arr(it.opening_messages).length ? arr(it.opening_messages) : arr(it.brief))
      .filter(function (m) { return str(obj(m).text); });

    /* Attribution decides the split, not position. An unattributed leading line
       is the signpost (spoken by the coach, or the narrator in a scene); a line
       carrying character_id is a character bubble and belongs in beats[] with its
       speaker intact — which is how an ensemble scene opens on a character
       talking and leaves the signpost empty. */
    const first = obj(messages[0]);
    const leadIsSignpost = messages.length > 0 && !str(first.character_id);

    const toBeat = function (m) {
      const message = obj(m);
      const id = str(message.character_id);
      if (!id) return { speaker: 'narrator', kind: 'narration', name: '', text: str(message.text) };
      const card = arr(obj(sceneWorld).characters).find(function (c) { return obj(c).id === id; });
      return {
        speaker: 'character',
        kind: 'dialogue',
        name: str(obj(card).name) || id,
        text: str(message.text),
        emotion: str(message.emotion),
      };
    };

    return {
      bridgesByTier: {},
      bridge: '',
      signpost: leadIsSignpost ? str(first.text) : '',
      prompt: '',
      beats: (leadIsSignpost ? messages.slice(1) : messages).map(toBeat),
      cta: str(obj(obj(practice).transition).button_label),
    };
  }

  /* A roleplay practice names its counterpart by character_id; look the card up
     in the shared scene world. Null/omitted is narrator-driven roleplay, which
     is a real pattern rather than missing data. */
  function characterFor(interaction, sceneWorld) {
    const it = obj(interaction);
    const blank = { name: '', backstory: '', driver: '', reactions: [], styleNotes: '' };
    const id = it.character_id;
    if (typeof id !== 'string' || !id) {
      /* Keep the partner label so the header still reads "Narrator". */
      return Object.assign({}, blank, { name: '' });
    }
    const card = arr(obj(sceneWorld).characters).find(function (c) { return obj(c).id === id; });
    if (!card) return blank;
    const behavior = obj(card.behavior);
    return {
      name: str(card.name),
      /* v4 splits identity (role) from disposition (behavior.baseline); our
         single backstory field carried both. */
      backstory: [str(card.role), str(behavior.baseline)].filter(Boolean).join(' — '),
      driver: str(behavior.driver),
      reactions: [],           // v4 puts reactions in each practice's levels
      styleNotes: arr(behavior.guardrails).join(' '),
    };
  }

  /* An observe exhibit becomes our single-segment media list. */
  function mediaFromInteraction(interaction) {
    const it = obj(interaction);
    const media = { segments: [], affectiveBeat: false, openingReaction: '' };
    const exhibit = obj(it.exhibit).src ? obj(it.exhibit) : (obj(it.media).src ? obj(it.media) : null);
    if (exhibit) {
      media.segments = [{
        src: str(exhibit.src),
        label: str(exhibit.alt).slice(0, 60),
        caption: str(exhibit.alt),
      }];
    }
    return media;
  }

  /* ------------------------------------------------------------------------
     one v4 phase → one runtime rung
     --------------------------------------------------------------------- */
  function phaseToRung(phase, index, phases, sceneWorld, teachingByTopic) {
    const ph = obj(phase);
    const practice = obj(ph.practice);
    const debrief = obj(ph.debrief);
    const interaction = obj(practice.interaction);
    const map = RUNTIME_BY_MODE[practice.mode] || RUNTIME_BY_MODE.coach_inquiry;
    const when = obj(obj(practice.exit).when);

    /* v4 is forward-only: advancement is server-owned and there is no way back,
       so the ladder is a straight line. Tier no longer routes — the old
       transitions[].onTier fan-out collapses to one unconditional next. */
    const next = obj(phases[index + 1]).id || '';

    const keyPoints = arr(debrief.key_points).map(str).filter(Boolean);

    return {
      id: str(ph.id),
      label: str(ph.label),
      /* v4 renders "Phase N of M" from position, so no authored caption. */
      level: '',
      type: map.type,
      world: map.world,
      counterpart: str(interaction.partner_label),
      maxTurns: typeof when.turns === 'number' ? when.turns : 0,
      entry: entryFromInteraction(interaction, practice, sceneWorld),
      inputPlaceholder: str(interaction.input_placeholder || interaction.jot_placeholder),
      sayDoSplit: practice.mode === 'roleplay',
      exitCriteria: str(when.requirement),
      /* Reaction guidance used to be a free-standing instruction; in v4 the same
         direction lives inside each tier's response, which calibration carries. */
      reactionGuidance: '',
      /* Read from the answer_shape marker (a declared Vector extension — see
         EXTENSIONS in scenario-v4.js), NOT guessed from the exit requirement.
         Deriving it from "does this practice have a requirement" was wrong on 13
         of 14 beats, because plenty of open judgment practices still gate on the
         learner having engaged. A practice with no marker is treated as open,
         which is the safe default: an open beat deepens the learner's answer
         instead of delivering a verdict over it. */
      hasRightAnswer: practice.answer_shape === 'determinate',
      /* The conclusion a determinate practice must land.
         v4 keeps teaching content at CONTENT level in teaching_points, grouped by
         topic — deliberately not per phase. Our engine wants it per rung, so we
         match the topic back to this phase by label. That match is the one fragile
         seam here: if teaching_points get regrouped by subject (which the spec
         prefers), the match misses. The validator warns when a determinate
         practice ends up with no conclusion, so the failure is visible rather
         than a coach quietly hedging on a graded step.
         Note this is NOT the same text as debrief.points — key_points are the
         statements to land in the debrief; this is the conclusion itself. */
      throughLine: (teachingByTopic && teachingByTopic[str(ph.label)]) || '',
      character: characterFor(interaction, sceneWorld),
      media: mediaFromInteraction(interaction),
      calibration: calibrationFromLevels(interaction.levels),
      debrief: {
        /* A locked probe is the scripted coach question our debrief used to ask. */
        talkItThrough: str(obj(debrief.probe).text),
        points: keyPoints.join(' '),
      },
      transitions: [{ onTier: '', next: next, set: {} }],

      /* --- carried through, not yet consumed by the engine --------------- */
      exitFinalWord: str(obj(practice.exit).final_word),
      transitionText: str(obj(practice.transition).text),
      debriefFollowUpTurns: typeof debrief.follow_up_turns === 'number' ? debrief.follow_up_turns : 0,
      debriefFinalWord: str(debrief.final_word),
      debriefLabel: str(debrief.label),
      debriefTransition: obj(debrief.transition),
      helpTurns: typeof interaction.help_turns === 'number' ? interaction.help_turns : null,
      carryover: arr(interaction.carryover).map(function (c) { return str(obj(c).from); }).filter(Boolean),
      /* An observe rubric is the coverage contract sim-perception needs. */
      rubric: arr(interaction.rubric).map(function (r) {
        const item = obj(r);
        return {
          id: str(item.id),
          name: str(item.name),
          standardTerm: str(item.standard_term),
          nudge: str(item.nudge),
        };
      }),
      spotTarget: typeof interaction.spot_target === 'number' ? interaction.spot_target : null,
      exhibitFacts: arr(obj(interaction.exhibit).facts).map(str).filter(Boolean),
      purpose: str(ph.purpose),
      practicePurpose: str(practice.purpose),
    };
  }

  /* ------------------------------------------------------------------------
     the whole document
     --------------------------------------------------------------------- */
  function compile(doc) {
    const d = obj(doc);
    const content = obj(d.content);
    const sceneWorld = obj(content.scene_world);
    const phases = arr(content.phases);
    const opening = obj(content.opening);

    /* topic → joined points, so a phase can find its own teaching line by label. */
    const teachingByTopic = {};
    arr(content.teaching_points).forEach(function (t) {
      const topic = obj(t);
      const key = str(topic.topic);
      if (!key) return;
      teachingByTopic[key] = arr(topic.points).map(str).filter(Boolean).join(' ');
    });

    const runtimeSpot = {};   // hazards/coverage/scene/observe — filled below when a spot phase exists

    const rungs = phases.map(function (p, i) {
      return phaseToRung(p, i, phases, sceneWorld, teachingByTopic);
    });

    /* ---- the spot surface (observe_react with an exhibit + rubric) --------
       POC V4's observe_react contract — the learner jots findings, the model
       credits them against rubric ids — is exactly the shipped text-observation
       surface (js/sim-observe-text.js). That surface mounts for a kind:'spot'
       phase and reads a TOP-LEVEL contract (hazards/coverage/scene/observe), a
       shape scene-sweep established: one observed scene per scenario. So the
       FIRST qualifying observe practice becomes the spot phase; any later
       observe practice stays conversational (coach-voiced review of the
       exhibit), which is also what mix-arc's observe beat always was.

       Field mapping, kept name-compatible with scene-sweep's hazards so every
       existing reader (the surface, the rail, the grader) works unchanged:
         rubric[].id            → hazards[].id       (the crediting key)
         rubric[].name          → hazards[].short    (the scorecard chip)
         rubric[].standard_term → hazards[].full     (the creditable phrasing)
         rubric[].nudge         → hazards[].zone     (where to look, never the answer)
         exhibit.src / .alt     → scene.src / .alt
         exhibit.facts          → scene.canonDescription (the model's ground truth)
         spot_target            → coverage.required;  rubric length → coverage.total

       No geometry exists in POC V4 (a rubric item has no x/y), so the photo/
       hotspot canvas cannot hit-test — the preview URL must carry ?observe=text,
       which routes kind:'spot' to the text surface. v4-universal.previewUrl
       does exactly that. */
    let spotAssigned = false;
    phases.forEach(function (p, i) {
      if (spotAssigned) return;
      const practice = obj(obj(p).practice);
      if (practice.mode !== 'observe_react') return;
      const it = obj(practice.interaction);
      const exhibit = obj(it.exhibit);
      const rubric = arr(it.rubric).filter(function (r) { return obj(r).id; });
      if (!exhibit.src || !rubric.length) return;
      spotAssigned = true;
      rungs[i].kind = 'spot';
      runtimeSpot.hazards = rubric.map(function (r) {
        const item = obj(r);
        return {
          id: str(item.id),
          short: str(item.name),
          full: str(item.standard_term),
          zone: str(item.nudge),
          synonyms: '',
          alt: str(item.name),
        };
      });
      runtimeSpot.coverage = {
        total: rubric.length,
        required: typeof it.spot_target === 'number' ? it.spot_target : rubric.length,
      };
      runtimeSpot.scene = {
        src: str(exhibit.src),
        alt: str(exhibit.alt),
        canonDescription: arr(exhibit.facts).map(str).filter(Boolean).join(' ') || str(exhibit.alt),
      };
      runtimeSpot.observe = {
        surface: 'text',
        inputMode: 'sweep',
        slotsPrompt: '',
        slotCount: rubric.length,
        placeholder: str(it.jot_placeholder) || 'Describe what looks unsafe',
      };
    });

    /* v4's narrative is ONE text serving as both the coach's ground truth and
       what the learner is shown, so it fills both of our fields rather than us
       inventing a second, richer version for the prompt. */
    const narrative = str(content.narrative);

    const runtime = {
      v: 4,
      /* No scenario type exists in v4 — what this plays as emerges from its
         modes. The field is kept only because our chrome reads it for labels. */
      type: derivedTypeLabel(rungs),
      title: str(content.title),
      course: '',
      learnerName: 'you',
      characterName: firstCharacterName(sceneWorld),
      /* The content-safety triggers — UX Universal extension fields (see
         EXTENSIONS in scenario-v4.js). These are the whole reason the extensions
         exist: mix-arc's compile arms the 988 crisis floor off elevatedStakes and
         the locked threat-content section off threatContent. Hardcoding false
         here (as an earlier build did) meant an authored threat_content: true
         never armed anything — the exact silent regression the flags prevent. */
      elevatedStakes: content.elevated_stakes === true,
      involvesMinors: content.involves_minors === true,
      threatContent: content.threat_content === true,
      /* POC V4 §4.1 keeps ONE `narrative`, in the learner's register: second
         person, present tense, ending where the experience begins. It is the
         situation, not a description of the experience — so it belongs in the
         prompt's SITUATION channel, not spliced into "You facilitate …".

         Leaving `framing` empty is deliberate: the prompt builder's own fallback
         ("a scenario-based learning experience") keeps that sentence grammatical,
         and the narrative reaches the model as a labeled situation block — which
         is exactly how the POC V4 coach template renders it. Assigning narrative
         to framing produced "You facilitate You saw it happen." on every
         scenario. */
      framing: '',
      learnerRole: '',
      establishing: {
        eyebrow: '',
        title: str(content.title),
        sub: narrative,
      },
      openingImage: '',
      /* type 'none' — POC V4 has no cold-open modality (§4), so the player opens
         no intro scene. audio.text still carries the narrative, because that is
         the field the prompt builder reads for THE SITUATION. */
      intro: {
        type: 'none',
        video: { sound: false, scenes: [] },
        audio: { eyebrow: '', title: str(content.title), text: narrative },
      },
      voice: {
        persona: str(content.coach_persona),
        guidance: arr(content.tone_guidelines).map(str).filter(Boolean).join(' '),
      },
      reflection: {
        enabled: !!arr(opening.opening_messages).length,
        prompt: str(obj(arr(opening.opening_messages)[0]).text),
        feedbackGuidance: openingGuidance(opening),
      },
      state: [],
      playbook: arr(obj(content.closing).ideal_response
        ? obj(content.closing).ideal_response.component_groups : []).map(function (group) {
        const g = obj(group);
        return { title: str(g.title), body: arr(g.components).map(str).filter(Boolean).join(' ') };
      }),
      resources: {
        lead: '',
        items: arr(obj(obj(content.closing).ideal_response).source_references)
          .map(str).filter(Boolean).map(function (ref) { return { title: ref, body: '' }; }),
      },
      /* spot contract — present only when an observe practice qualifies */
      hazards: runtimeSpot.hazards || [],
      coverage: runtimeSpot.coverage || null,
      scene: runtimeSpot.scene || null,
      observe: runtimeSpot.observe || null,
      phases: rungs,
      beats: rungs,          // mix-arc surfaces read `beats`; same objects
      opening: arr(opening.opening_messages).map(function (m) { return str(obj(m).text); }).filter(Boolean),
      sceneLineCaption: '',

      /* --- v4-only, carried for later engine work ----------------------- */
      implementationId: str(d.implementation_id),
      schemaVersion: str(d.schema_version),
      teachingPoints: arr(content.teaching_points).map(function (t) {
        const topic = obj(t);
        return { topic: str(topic.topic), points: arr(topic.points).map(str).filter(Boolean) };
      }),
      misconceptions: arr(content.misconceptions).map(function (m) {
        const mc = obj(m);
        return { misconception: str(mc.misconception), redirect: str(mc.redirect) };
      }),
      sceneWorld: {
        setting: str(sceneWorld.setting),
        canon: arr(obj(sceneWorld.canon).facts).map(str).filter(Boolean),
        characters: arr(sceneWorld.characters),
      },
      closing: {
        partnerLabel: str(obj(content.closing).partner_label),
        summary: str(obj(obj(content.closing).ideal_response).summary),
      },
      landingCtaLabel: str(content.landing_cta_label),
      openingUnit: arr(opening.opening_messages).length ? {
        id: str(opening.id),
        label: str(opening.label),
        purpose: str(opening.purpose),
        turns: (function () {
          const t = obj(obj(opening.exit).when).turns;
          return typeof t === 'number' ? t : 0;
        }()),
        finalWord: str(obj(opening.exit).final_word),
        transition: obj(opening.transition),
        inputPlaceholder: str(opening.input_placeholder),
        conditionalProbes: arr(opening.conditional_probes),
      } : null,
    };
    return runtime;
  }

  /* The opening's levels are partial by design — as many tiers as the source
     grounds. Whichever are authored become the single guidance string our
     reflection surface expects. */
  function openingGuidance(opening) {
    const levels = obj(obj(opening).levels);
    return LEVELS.map(function (k) { return str(obj(levels[k]).response); })
      .filter(Boolean).join(' ');
  }

  function firstCharacterName(sceneWorld) {
    const first = arr(obj(sceneWorld).characters)[0];
    return str(obj(first).name);
  }

  /* Our chrome still wants a label for what kind of thing this is. v4 has no
     type field, so describe it from the modes actually used rather than
     resurrecting a declaration the format deliberately dropped. */
  function derivedTypeLabel(rungs) {
    const modes = {};
    rungs.forEach(function (r) { modes[r.type] = true; });
    const kinds = Object.keys(modes);
    if (kinds.length > 1) return 'mix-arc';
    if (kinds[0] === 'roleplay') return 'branching-arc';
    if (kinds[0] === 'observe') return 'scene-sweep';
    return 'guided-arc';
  }

  return {
    compile: compile,
    RUNTIME_BY_MODE: RUNTIME_BY_MODE,
    calibrationFromLevels: calibrationFromLevels,
  };
}));
