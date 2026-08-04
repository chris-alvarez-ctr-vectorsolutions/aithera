/* =========================================================================
   SIM CONTEXT — Section 1 → Section 2: the universal coupler
   =========================================================================

   Section 1 (Scenario Context) can be set by any content type — a video
   cold-open, narrated audio, a reading card, a story the learner highlights,
   a custom interaction, or nothing at all. Section 2 (the interaction layer)
   must not care WHICH. This module is the coupler between them:

     • every context modality, however it's implemented, finishes by handing
       Section 2 ONE normalized ContextRecord;
     • Section 2 always starts the same way: startSession(record).

   THE CONTEXT RECORD — the output of Section 1, the input of Section 2:
     {
       modality:   'video' | 'audio' | 'reading' | 'story' | 'none' | <custom>,
       completed:  true,          // the learner finished (or skipped) the intro
       artifacts: {               // anything the LEARNER produced during the intro
         highlights?: [ …selections… ],   // e.g. story-highlight passages
         reflection?: '…',                // e.g. a written pre-scene answer
         …                                 // open — future custom interactions
       },
       seedMessages: [],          // transcript messages to seed BEFORE/with the
                                  // coach's opening (e.g. a {speaker:'you'}
                                  // recap of the learner's highlights)
       promptAddendum: '',        // appended ONCE to the system prompt when the
                                  // context must inform the model (e.g. the
                                  // story text + its key-moments answer key)
       autoFirstTurn: false,      // true → Section 2 fires a model turn
                                  // immediately (the coach must respond to the
                                  // artifacts) instead of waiting for input
     }

   Rule of thumb: an intro that the learner only WATCHES/HEARS produces an
   empty record (the model already knows the setup from its compiled prompt);
   an intro the learner ACTS IN produces artifacts + seeds — and that's the
   only difference Section 2 ever sees.

   WHO OWNS WHICH PLAYER (unchanged by this module):
     audio / reading  → the shared SceneContext player (js/scene-context.js)
     video cold-open  → the page's stage-integrated player (the frozen last
                        frame stays as the scene backdrop — that coupling to
                        the stage is the point, so it stays page-owned)
     story / custom   → the page's own interaction
   Whatever plays, it must exit through context.done(partialRecord).

   Usage (one controller per page):

     const context = SimContext.create({
       intro: ACTIVE_SCENARIO.intro,
       modalities: {
         video: { available: HAS_VIDEO_INTRO, enter: enterVideoIntro },
         audio: { available: HAS_AUDIO_INTRO, enter: enterAudioIntro },
         // 'reading' rides the audio entry (SceneContext handles both)
       },
       onDone: startSession,          // startSession(record) — the ONE way in
     });

     startCtaBtn.addEventListener('click', context.begin);
     // …and each modality's finisher calls, e.g.:
     //   context.done({ modality: 'video' });
     //   context.done({ modality: 'story',
     //                  artifacts: { highlights }, seedMessages: [recap],
     //                  autoFirstTurn: true });

   No framework, no build step — a plain script exposing window.SimContext.
   ========================================================================= */
(function () {
  'use strict';

  /* Normalize a partial record into the full ContextRecord shape, so
     Section 2 can rely on every field existing. */
  function record(partial) {
    const p = partial || {};
    return {
      modality: typeof p.modality === 'string' && p.modality ? p.modality : 'none',
      completed: true,
      artifacts: (p.artifacts && typeof p.artifacts === 'object') ? p.artifacts : {},
      seedMessages: Array.isArray(p.seedMessages) ? p.seedMessages : [],
      promptAddendum: typeof p.promptAddendum === 'string' ? p.promptAddendum : '',
      autoFirstTurn: p.autoFirstTurn === true,
    };
  }

  /* The per-page controller: owns the modality dispatch on "begin" and the
     single, fire-once exit into Section 2. */
  function create(cfg) {
    const c = cfg || {};
    const modalities = c.modalities || {};
    let finished = false;
    let outRecord = null;

    // The one exit. Every intro path — video finisher, SceneContext
    // onContinue, story continue, none — funnels through here exactly once.
    function done(partial) {
      if (finished) return outRecord;      // double-fire guard (skip + ended, etc.)
      finished = true;
      outRecord = record(partial);
      if (typeof c.onDone === 'function') c.onDone(outRecord);
      return outRecord;
    }

    // The one entry (the start CTA). Picks the first available modality in
    // house priority order — audio/reading (SceneContext) outranks video only
    // because a scenario carrying BOTH means the writer switched modalities
    // and the audio text is the fresher intent; a plain video scenario is
    // unaffected. No modality available → Section 2 starts immediately with
    // an empty 'none' record (the establishing card carried the setup).
    function begin() {
      if (finished) return;
      const audio = modalities.audio || {};
      const video = modalities.video || {};
      const custom = modalities.custom || {};
      if (custom.available && typeof custom.enter === 'function') { custom.enter(); return; }
      if (audio.available && typeof audio.enter === 'function') { audio.enter(); return; }
      if (video.available && typeof video.enter === 'function') { video.enter(); return; }
      done({ modality: 'none' });
    }

    // A page Restart re-arms the coupler so the learner can run the intro
    // (and the handoff) again from scratch.
    function reset() {
      finished = false;
      outRecord = null;
    }

    return {
      begin,
      done,
      reset,
      isDone: () => finished,
      get record() { return outRecord; },
    };
  }

  /* How Section 2 consumes a record, standardized. Pages call this at the
     top of startSession(record) with the hooks they actually have — it
     applies the three coupler effects in one, fixed order:
       1. promptAddendum  → appendSystem(text)   (inform the model once)
       2. seedMessages    → seed(messages)       (put artifacts on the transcript)
       3. autoFirstTurn   → returned as `fireFirstTurn` for the page to honor
     Keeping this here (not copy-pasted per page) is what makes the coupler
     universal: a new modality only has to produce a record — every mode
     already knows how to drink it. */
  function apply(rec, hooks) {
    const r = record(rec);
    const h = hooks || {};
    if (r.promptAddendum && typeof h.appendSystem === 'function') h.appendSystem(r.promptAddendum);
    if (r.seedMessages.length && typeof h.seed === 'function') h.seed(r.seedMessages);
    return { record: r, fireFirstTurn: r.autoFirstTurn };
  }

  window.SimContext = { record, create, apply };
})();
