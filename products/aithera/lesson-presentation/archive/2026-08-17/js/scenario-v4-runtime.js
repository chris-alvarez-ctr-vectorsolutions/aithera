/* ============================================================================
   scenario-v4-runtime.js — compile a Scenario CML v4 document into the runtime
   shape our player already consumes.
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

  /* v4 practice.mode → our runtime beat `type` and ladder `world`. The world is
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
  function entryFromInteraction(interaction, practice) {
    const it = obj(interaction);
    const messages = arr(it.opening_messages).length ? arr(it.opening_messages) : arr(it.brief);
    const texts = messages.map(function (m) { return str(obj(m).text); }).filter(Boolean);
    return {
      bridgesByTier: {},
      bridge: '',
      signpost: texts[0] || '',
      prompt: '',
      beats: texts.slice(1),
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
  function phaseToRung(phase, index, phases, sceneWorld) {
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
      entry: entryFromInteraction(interaction, practice),
      inputPlaceholder: str(interaction.input_placeholder || interaction.jot_placeholder),
      sayDoSplit: practice.mode === 'roleplay',
      exitCriteria: str(when.requirement),
      /* Reaction guidance used to be a free-standing instruction; in v4 the same
         direction lives inside each tier's response, which calibration carries. */
      reactionGuidance: '',
      hasRightAnswer: !!str(when.requirement),
      /* The statements this rung must land — v4's debrief key_points. */
      throughLine: keyPoints.join(' '),
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

    const rungs = phases.map(function (p, i) {
      return phaseToRung(p, i, phases, sceneWorld);
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
      elevatedStakes: false,
      involvesMinors: false,
      threatContent: false,
      framing: narrative,
      learnerRole: '',
      establishing: {
        eyebrow: '',
        title: str(content.title),
        sub: narrative,
      },
      openingImage: '',
      intro: { type: 'none', video: { sound: false, scenes: [] }, audio: { eyebrow: '', title: '', text: '' } },
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
