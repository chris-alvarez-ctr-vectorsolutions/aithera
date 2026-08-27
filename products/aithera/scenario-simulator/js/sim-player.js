/* =========================================================================
   SIM PLAYER — the shared tier-ladder ENGINE core of the converged Scenario
   Simulator player (window.SimPlayer).
   -------------------------------------------------------------------------
   The runtime sibling of studio-shell.js: the app-owned decision/routing
   logic that drives a ladder scenario — build a phase's locked entry beats,
   emit the per-turn [SYSTEM STATE] line, decide stay-vs-advance from the
   model's turn, close a phase (record tier, apply transitions, route), and
   append the next locked hand-off. Extracted VERBATIM from the live pages
   (mix / branching / ensemble / scene-sweep carry byte-identical copies) so
   ONE engine drives every type.

   DOM-FREE by construction: it operates only on an explicit context
   { scenario, state, fillT } — the same three things every copy closed over
   (ACTIVE_SCENARIO, state, fillT). The DOM reveal (deliverTurn / revealScene /
   coachNode / sceneCardAll) still lives in the page; this is the engine, not
   the renderer. `scenario` and `state` are captured BY REFERENCE (mutated in
   place), so the returned functions always see live values.

   Usage (in a live page, after scenario/state/fillT exist):
     const L = SimPlayer.makeLadder({ scenario: ACTIVE_SCENARIO, state, fillT });
     const { entryBeatsFor, arcStateBlock, runArcEngine, closePhase, applyDeliver } = L;

   No framework, no build step. See scenario-simulator-player-convergence.html.
   ========================================================================= */
(function () {
  'use strict';

  function warn(msg) { try { console.warn('[SimPlayer] ' + msg); } catch (e) {} }

  // The most times the UNGRADED reflection warm-up may STAY (a clarifying probe or
  // a redirect re-ask) before the app force-opens the scene. ONE stay = one probe,
  // so the learner answers at most TWICE in the warm-up — the same one-probe rule
  // every phase gets. (Was 2, which let the coach probe twice and stretched the
  // warm-up to three learner turns — stakeholder-reported as blowing the cap.)
  // See runArcEngine's reflection branch; the force-open strips any question the
  // model leaves dangling, so the tighter cap never orphans one.
  var REFLECTION_STAY_CAP = 1;

  /* -----------------------------------------------------------------------
     lint(scenario) — a LOAD-TIME authoring check over the ladder graph. The
     engine trusts phases[]/transitions[] blindly at run time, so the mistakes
     below would otherwise fail SILENTLY mid-play; surfacing them once at boot
     turns a mystery into a console line. Checks:
       · a transition next→ that resolves to no phase id (would end the ladder
         early instead of advancing — see closePhase's terminal branch)
       · an onTier label outside the phase's calibration vocabulary (dead route)
       · a phase no path from the first rung can reach
       · a transition that routes a phase back to itself (loop risk)
       · per-tier routing with uncovered tiers AND no default (silent fall-through)
     Pure and DOM-free — safe to call at boot or from a test. Returns
     { errors:[…], warnings:[…] } of plain strings and logs nothing itself.
     NOT on the per-turn hot path.
     ----------------------------------------------------------------------- */
  function lint(scenario) {
    const errors = [];
    const warnings = [];
    const phases = Array.isArray(scenario && scenario.phases) ? scenario.phases : [];
    if (!phases.length) { errors.push('scenario has no phases[].'); return { errors, warnings }; }

    const idSet = new Set(phases.map((p) => p && p.id).filter(Boolean));
    const idxOf = {};
    phases.forEach((p, i) => { if (p && p.id) idxOf[p.id] = i; });
    // Session-state keys DECLARED at the top level. A transition may only write
    // these (closePhase drops any other key) — so an undeclared write is caught
    // here at load time, not left as a silent run-time no-op.
    const declaredState = new Set((Array.isArray(scenario.state) ? scenario.state : [])
      .map((v) => v && v.key).filter(Boolean));

    // successors[i] = the phase indices phase i can advance to (mirrors closePhase)
    const successors = phases.map(() => new Set());
    phases.forEach((p, i) => {
      const trans = Array.isArray(p.transitions) ? p.transitions : [];
      const vocab = (p.calibration || []).map((c) => c && c.tier).filter(Boolean);
      let hasDefaultNext = false;
      trans.forEach((t) => {
        if (!t) return;
        if (t.onTier && vocab.length && !vocab.includes(t.onTier)) {
          warnings.push('phase "' + p.id + '": transition onTier "' + t.onTier
            + '" is not in its calibration vocabulary [' + vocab.join(', ') + '] — it can never fire.');
        }
        if (t.set && typeof t.set === 'object') Object.keys(t.set).forEach((k) => {
          if (!declaredState.has(k)) warnings.push('phase "' + p.id
            + '": transition writes state key "' + k + '" not declared in scenario.state[] — it is ignored at run time.'
            + (declaredState.size ? ' Declared: [' + [...declaredState].join(', ') + '].' : ' (scenario.state[] is empty.)'));
        });
        if (t.next != null) {
          /* A BLANK next is absence, not a broken id. The v4 compiler writes
             next:'' on a terminal rung — the last debrief has no following
             practice (scenario-v4-runtime.js) — and the engine already reads a
             falsy next as "fall through to the end" (`trans.next ? findIndex :
             curIdx + 1`). Only this lint disagreed, so every v4 scenario booted
             with a red console error about a ladder that was in fact correct.
             That is worse than a missing lint: it trains the real ones into
             noise. The hasDefaultNext bookkeeping below is unchanged — a
             terminal rung with no onTier IS an unconditional exit. */
          const nextId = String(t.next).trim();
          if (!nextId) {
            /* terminal — nothing to resolve, nothing to report */
          } else if (!idSet.has(nextId)) {
            errors.push('phase "' + p.id + '": transition next→"' + t.next
              + '" is not a phase id — the ladder would TERMINATE here instead of advancing.');
          } else {
            if (nextId === p.id) warnings.push('phase "' + p.id + '": a transition routes the phase to itself — possible loop.');
            successors[i].add(idxOf[nextId]);
          }
          if (!t.onTier) hasDefaultNext = true;
        }
      });
      // Routes by tier but has no vocabulary to route by: the prompt's tier list
      // (derived from calibration) is empty and no reported tier can be validated.
      if (!vocab.length && trans.some((t) => t && t.onTier)) {
        warnings.push('phase "' + p.id + '": routes by onTier but declares no calibration[] — '
          + 'the compiled prompt\'s tier list is empty and no reported tier can be validated.');
      }
      // The implicit fall-through to i+1 fires UNLESS a default (no-onTier)
      // transition with a next always overrides it.
      if (!hasDefaultNext) {
        successors[i].add(i + 1);
        if (vocab.length && trans.some((t) => t && t.onTier)) {
          const covered = new Set(trans.filter((t) => t && t.onTier).map((t) => t.onTier));
          const gaps = vocab.filter((v) => !covered.has(v));
          if (gaps.length) warnings.push('phase "' + p.id + '": tiers [' + gaps.join(', ')
            + '] have no transition and no default — they fall through to the next phase in order.'
            + ' Add an onTier or a default transition if that is not intended.');
        }
      }
    });

    // reachability from the first phase
    const seen = new Set([0]);
    const queue = [0];
    while (queue.length) {
      const i = queue.shift();
      successors[i].forEach((j) => { if (j >= 0 && j < phases.length && !seen.has(j)) { seen.add(j); queue.push(j); } });
    }
    phases.forEach((p, i) => { if (!seen.has(i)) warnings.push('phase "' + p.id + '" is unreachable — no path from the first phase leads to it.'); });

    return { errors, warnings };
  }

  /* When the APP advances (a cap-forced close, a stay-cap reflection open, or
     any teach turn that delivers the next locked hand-off), the learner can no
     longer answer — so a coach bubble left hanging on a question is a promise
     the app is about to break ("it asked me a follow-up, then moved on without
     letting me respond"). Trim trailing question sentences off the tail
     coaching bubbles; drop a bubble that was ONLY the question. Scene beats
     and mid-bubble questions are never touched. */
  function stripDanglingQuestion(turn) {
    const msgs = turn.turn || [];
    const isParenAside = (m) => m && m.speaker === 'coach' && m.kind === 'coaching'
      && /^\(.*\)$/.test(String(m.text || '').trim());
    // Look past trailing parenthetical asides ("(No wrong answer here…)") —
    // they ride the question above them, shielding it from the walk-back and
    // reading as nonsense once it goes. Only if the bubble BEHIND them dangles
    // do the asides go too; a paren aside with no question stays untouched.
    let j = msgs.length - 1;
    while (j >= 0 && isParenAside(msgs[j])) j--;
    const tail = msgs[j];
    if (!tail || tail.speaker !== 'coach' || tail.kind !== 'coaching'
        || !/\?\s*$/.test(String(tail.text || '').trim())) return;
    msgs.splice(j + 1);   // drop the asides riding the dangling question
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (!m || m.speaker !== 'coach' || m.kind !== 'coaching') break;
      const t = String(m.text || '').trim();
      if (isParenAside(m)) { msgs.splice(i, 1); continue; }   // an aside uncovered mid-walk
      if (!/\?\s*$/.test(t)) break;
      const parts = t.split(/(?<=[.!?…])\s+/);
      while (parts.length && /\?\s*$/.test(parts[parts.length - 1].trim())) parts.pop();
      m.text = parts.join(' ').trim();
      if (m.text) break;
      msgs.splice(i, 1);   // the bubble was only the question — keep walking back
    }
    turn.turn = msgs;
  }

  function makeLadder(ctx) {
    const scenario = ctx.scenario;   // ACTIVE_SCENARIO — mutated in place, captured by ref
    const state = ctx.state;
    const fillT = ctx.fillT;

    /* Build the LOCKED (app-owned) entry beats for a phase, choosing the
       bridge variant the PREVIOUS phase's recorded tier calls for (authored
       branching). Observe phases also present the locked "clip" card. */
    function entryBeatsFor(phase, prevTier) {
      const e = phase.entry || {};
      const beats = [];
      const bridge = (prevTier && e.bridgesByTier && e.bridgesByTier[prevTier]) || e.bridge || '';
      if (String(bridge).trim()) beats.push({ speaker: 'coach', kind: 'coaching', text: fillT(bridge) });
      if (String(e.signpost || '').trim()) beats.push({ speaker: 'coach', kind: 'coaching', text: fillT(e.signpost) });
      // OBSERVE beats PRESENT the clip the learner reacts to — a locked "clip"
      // card (a real <video> when a src is authored, otherwise the described
      // moment). ANY beat may ALSO carry a locked STIMULUS ARTIFACT (a forwarded
      // message, a note) rendered the same way (variant:'message' → message card).
      // Shown right after the signpost so the coach never references something
      // the learner can't see.
      ((phase.media || {}).segments || [])
        .filter((sc) => sc && (String(sc.src || '').trim() || String(sc.caption || '').trim()))
        .forEach((sc) => beats.push({ speaker: 'coach', kind: 'clip',
          variant: sc.kind === 'message' ? 'message' : 'clip',
          text: fillT(sc.caption || ''), src: String(sc.src || '').trim(),
          label: fillT(sc.label || ''), from: fillT(sc.from || '') }));
      if (String(e.prompt || '').trim()) beats.push({ speaker: 'coach', kind: 'coaching', text: fillT(e.prompt) });
      (e.beats || []).forEach((b) => {
        const m = { speaker: b.speaker || 'character', kind: b.kind || 'narration', text: fillT(b.text) };
        if (b.name) m.name = fillT(b.name);
        beats.push(m);
      });
      return beats;
    }

    /* The per-turn [SYSTEM STATE] line: the app is the source of truth for
       WHICH phase is live, how many learner turns it has consumed vs. its cap,
       what the ladder recorded so far, and the session-state variables. */
    function arcStateBlock() {
      const phases = Array.isArray(scenario.phases) ? scenario.phases : [];
      if (!phases.length || state.complete) return '';
      const vars = (scenario.state || [])
        .map((v) => (v.label || v.key) + ': ' + (state.vars[v.key] || v.initial || '—')).join(' · ');
      if (state.phaseIdx < 0) {
        return '\n\n[SYSTEM STATE — Reflection warm-up. Calibrate only (do NOT evaluate, no tier); set "action":"teach". The app then opens Phase 1.]';
      }
      if (state.phaseIdx >= phases.length) {
        return '\n\n[SYSTEM STATE — the ladder is complete. You MUST set complete:true with the report on this turn (see COMPLETION).]';
      }
      const p = phases[state.phaseIdx];
      const cap = Math.max(1, p.maxTurns || 3);
      const min = Math.max(0, p.minTurns || 0);
      const used = state.turnsInPhase;
      const ladder = phases.filter((x) => state.ladder[x.id])
        .map((x) => (x.label || x.id) + ' = ' + state.ladder[x.id]).join(', ');
      // OPTIONAL per-phase addendum — the active render SURFACE folds its OUTCOME
      // line for the phase it owns in here (scene-sweep's COVERAGE, teach-back's
      // N-of-10). The page passes ctx.outcomeBlock = SURFACE.outcomeBlock, which
      // self-guards on phase.kind. No hook → empty, so the conversational types
      // are byte-identical.
      const coverage = (typeof ctx.outcomeBlock === 'function') ? (ctx.outcomeBlock(p) || '') : '';
      return '\n\n[SYSTEM STATE — Phase ' + (state.phaseIdx + 1) + '/' + phases.length + ': ' + (p.label || p.id)
        + ' (' + (p.world === 'scene' ? 'SCENE' + (p.counterpart ? ' · ' + p.counterpart : '') : 'COACHING') + ').'
        + ' Learner turns used: ' + used + '/' + cap + '.'
        + coverage
        + (ladder ? ' THE LADDER so far: ' + ladder + '.' : '')
        + (vars ? ' Session state — ' + vars + '.' : '')
        + (used >= cap
            ? ' THE CAP IS REACHED — you MUST set "action":"teach" on this turn: resolve the moment, open with the verbatim talk-it-through line, debrief, and report the "tier". Do NOT continue.'
            : (p.world === 'scene' && used < min)
              ? ' The scene is NOT over — the learner has ' + (min - used) + ' more action' + (min - used === 1 ? '' : 's')
                + ' to take. Do NOT debrief, do NOT coach, do NOT set "action":"teach" yet: reply with scene beats only and set "action":"continue".'
              : (used >= 1 && used === cap - 1
                  ? ' ONE TURN LEFT AFTER THIS — the learner gets exactly one more turn, then you MUST close the phase. Do not open anything you cannot land in that one turn: no new topic, no second question, nothing needing a follow-up. Set "action":"continue" to stay, or "action":"teach" (with a "tier") if the exit criteria are already met.'
                  : ' Set "action":"continue" to stay in the phase, or "action":"teach" (with a "tier") once the exit criteria are met.'))
        + ']'
        + rewoundBlock(p);
    }

    /* --- REWOUND-TURN BLOCK -------------------------------------------------
       "Try a different approach" rewinds the transcript AND the ladder to the
       moment before a learner's move, so the next call runs against a history
       that no longer contains what the model already said. Regenerating from an
       identical context makes near-identical text the LIKELY output, not a
       drift — which is exactly the defect the dev team's SME review measured as
       its three lowest-scoring notes ("repeat of what was said previously",
       "an exact repeat of the response when I was in the practice environment").

       So the page hands the superseded text forward on `state.rewound` — an
       array of { phaseId, said:[…] } pushed at rewind time — and it is quoted
       back here as something NOT to repeat. Bounded on both axes (last 2
       rewinds, 400 chars each) so a learner who retries repeatedly cannot grow
       the prompt without limit. No hook, no entries → empty string, so a page
       that never wires it up is byte-identical.
       --------------------------------------------------------------------- */
    function rewoundBlock(phase) {
      const all = Array.isArray(state.rewound) ? state.rewound : [];
      const mine = all.filter(function (r) { return r && r.phaseId === phase.id; }).slice(-2);
      const said = [];
      mine.forEach(function (r) {
        (Array.isArray(r.said) ? r.said : []).forEach(function (t) {
          const txt = String(t || '').trim();
          if (txt) said.push(txt.length > 400 ? txt.slice(0, 400) + '…' : txt);
        });
      });
      if (!said.length) return '';
      return '\n\n[ALREADY SAID, THEN REWOUND — the learner used "Try a different approach" and replaced their move, '
        + 'so your next reply REGENERATES this moment. You already said the following, and the learner has seen it:\n'
        + said.map(function (t) { return '"' + t + '"'; }).join('\n')
        + '\nDo NOT restate any of that near-verbatim. Respond to what is genuinely DIFFERENT in their new move. '
        + 'If nothing material changed, say that briefly in one line and move the moment forward — never repeat yourself as though it were new.]';
    }

    /* Decide stay-vs-advance from the model's turn (action / tier / cap), then
       close the phase if it's time. The app, not the model, owns advancement. */
    function runArcEngine(turn) {
      const phases = Array.isArray(scenario.phases) ? scenario.phases : [];
      if (!phases.length || state.complete) return;

      const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);

      if (state.phaseIdx < 0) {               // reflection warm-up (UNGRADED)
        // The warm-up is not graded, so it must NEVER hold the learner. BOTH a
        // "redirect" (a thin or off-script reply) and a coach turn left hanging on
        // a question mean "stay so they can respond" — but each only a BOUNDED
        // number of times. Once the cap is hit the app opens the scene no matter
        // what the model reports. Without this bound, a terse reply the coach's
        // completeness check never accepts ("yes", "not good") gets re-probed
        // forever: the reported stall where the coach keeps asking, the typing
        // dots keep cycling, and the scene never opens. (The redirect path used to
        // be uncapped, which is exactly how it looped.)
        const cb = (turn.turn || []).filter((m) => m.speaker === 'coach' && String(m.text || '').trim());
        const last = cb[cb.length - 1];
        const dangling = !!last && /\?\s*$/.test(String(last.text).trim());
        /* 'continue' counts here too. It used to be enough to test 'redirect',
           because every non-answer reported redirect. Now that refusal and
           gibberish report 'continue' (they cost a turn — SimCore.nonAnswerPolicy),
           testing only 'redirect' would CLOSE the ungraded warm-up on gibberish
           instead of staying to re-ask. 'continue' means the beat is still live,
           so staying is the correct reading regardless, and REFLECTION_STAY_CAP
           still bounds it. */
        const wantsStay = turn.action === 'redirect' || turn.action === 'continue' || dangling;
        state.reflectionStays = state.reflectionStays || 0;
        if (wantsStay && state.reflectionStays < REFLECTION_STAY_CAP) {
          state.reflectionStays++; state.reflectionProbed = true; turn.deliver = null; return;
        }
        // The stay cap is spent — the app opens Phase 1 no matter what the model
        // wrote. If its turn still ends on a question, that question can never be
        // answered: trim it before the locked hand-off lands on top of it.
        stripDanglingQuestion(turn);
        closePhase(null, turn);                // calibration done (or cap reached) → open the scene
        return;
      }
      if (state.phaseIdx >= phases.length) return;   // ladder done — the model owns COMPLETION

      const p = phases[state.phaseIdx];
      const cap = Math.max(1, p.maxTurns || 3);
      const coachBubbles = (turn.turn || []).filter((m) => m.speaker === 'coach' && String(m.text || '').trim());
      const opener = coachBubbles[0] ? norm(coachBubbles[0].text) : '';
      const tit = (p.debrief && p.debrief.talkItThrough) ? norm(fillT(p.debrief.talkItThrough)) : '';
      const teachOpener = !!(tit && opener && opener.startsWith(tit));
      let intent = turn.action;
      if (!intent) intent = (teachOpener || turn.tier || turn.complete) ? 'teach' : 'continue';

      if (intent === 'redirect') { turn.deliver = null; return; }
      const overCap = state.turnsInPhase >= cap + 1;   // the forced close was ignored once already
      if (intent !== 'teach' && !teachOpener && !overCap) { turn.deliver = null; return; }   // stay in the phase

      // SCENE MINIMUM — a scene phase may declare minTurns (Guided Arc's action
      // console authors "exactly TWO actions"). A model that grades the first
      // move as strong-or-hopeless and debriefs early ends the scene without
      // the learner's second turn — and its "across both actions" debrief then
      // narrates an exchange that never happened. If the model closes early and
      // its turn still carries scene beats, keep ONLY those beats and stay in
      // the scene; the real debrief comes after the final required action.
      const minTurns = Math.max(0, p.minTurns || 0);
      if (p.world === 'scene' && state.turnsInPhase < minTurns && !overCap) {
        const sceneBeats = (turn.turn || []).filter((m) => m && m.speaker === 'character'
          && (m.kind === 'dialogue' || m.kind === 'narration') && String(m.text || '').trim());
        if (sceneBeats.length) {
          turn.turn = sceneBeats;
          turn.action = 'continue'; turn.tier = null; turn.deliver = null;
          turn.complete = false; turn.report = null;
          turn.mode = 'scene'; turn.inputTarget = 'character';
          return;
        }
        // No scene beats to keep — flag it and stay put: the page gets ONE shot
        // to re-ask the model with a corrective note (send() handles the flag),
        // marking the retried turn __minTurnsFinal before running it back
        // through here. Only after that retry also fails does the close stand.
        if (!turn.__minTurnsFinal) {
          turn.__minTurnsViolation = true;
          turn.deliver = null;
          return;
        }
        // retried and still nothing in-world to keep — let the close stand rather than render nothing
      }

      // The app is advancing (or completing) on this turn — the learner cannot
      // answer anything the coach left hanging. Enforce the authored rule
      // "never ask a question AND advance in the same turn" app-side.
      stripDanglingQuestion(turn);
      closePhase(p, turn);
    }

    /* Close a phase: record the tier, apply its authored transitions (state
       writes + routing), and cue the next entry. `p` is null for the
       reflection warm-up (no tier, no transitions — straight to phase 0). */
    function closePhase(p, turn) {
      const phases = scenario.phases || [];
      let nextIdx = 0;
      if (p) {
        let tier = turn.tier || null;
        // GUARD — the model REPORTS the tier, so treat the label as untrusted:
        // an off-vocabulary value matches no authored `onTier` and would fall
        // silently through to the default route. Validate against THIS phase's
        // calibration vocabulary; on a miss, warn and record the rung as
        // unreported rather than routing on a phantom label.
        const vocab = (p.calibration || []).map((c) => c && c.tier).filter(Boolean);
        if (tier && vocab.length && !vocab.includes(tier)) {
          warn('phase "' + p.id + '" reported off-vocabulary tier ' + JSON.stringify(tier)
            + ' — expected one of [' + vocab.join(', ') + ']. Recording (unreported); routing on the default transition.');
          tier = null;
        }
        state.ladder[p.id] = tier || '(unreported)';
        state.lastTier = tier;
        const trans = (p.transitions || []).find((t) => t.onTier && tier && t.onTier === tier)
          || (p.transitions || []).find((t) => !t.onTier)
          || null;
        if (trans && trans.set) Object.keys(trans.set).forEach((k) => {
          // Only DECLARED session-state keys are writable. An undeclared key
          // (usually a typo — `dispositon` for `disposition`) is otherwise a
          // silent no-op; warn so the intended write isn't lost quietly.
          if (k in state.vars) state.vars[k] = trans.set[k];
          else warn('transition on phase "' + p.id + '" writes undeclared state key '
            + JSON.stringify(k) + ' — ignored. Declared keys: [' + Object.keys(state.vars).join(', ') + '].');
        });
        const curIdx = phases.indexOf(p);
        nextIdx = (trans && trans.next)
          ? phases.findIndex((x) => x.id === trans.next)
          : curIdx + 1;
        // A `next` that resolves to nothing is almost always an authoring typo,
        // not a deliberate ending — and the terminal branch below would end the
        // scenario early with no trace. Warn before it does.
        if (trans && trans.next && nextIdx < 0) {
          warn('transition on phase "' + p.id + '" points next→' + JSON.stringify(trans.next)
            + ' which is not a phase id — the ladder will TERMINATE here instead of advancing. Phase ids: ['
            + phases.map((x) => x.id).join(', ') + '].');
        }
        if (nextIdx < 0 || nextIdx >= phases.length) {   // terminal — the model completes this same turn
          turn.deliver = null;
          state.phaseIdx = phases.length;
          // A FORCED terminal close — the model never completed on this turn
          // (it kept the scene going past the cap and the app closed it) —
          // would strand the learner: the phase is over but no debrief or
          // report ever arrives and the composer just sits open. Flag it so
          // the page can immediately re-ask the model for the closing turn.
          if (!turn.complete) turn.__needsCompletion = true;
          return;
        }
      }
      turn.deliver = (phases[nextIdx] || {}).id || null;   // app-authoritative (overrides any model deliver)
      state.phaseIdx = nextIdx;
      state.turnsInPhase = 0;
    }

    /* Append the LOCKED (app-owned) entry the ladder engine cued via
       turn.deliver: the bridge variant the recorded tier selects, the signpost,
       the task prompt (coaching) or scene beats (scene). A scene-phase entry
       also flips the turn into scene mode. */
    function applyDeliver(turn) {
      if (!turn || !turn.deliver) return;
      const phases = scenario.phases || [];
      const p = phases.find((x) => x.id === turn.deliver);
      if (!p) return;
      // GUARDED HOOK (the outcomeBlock idiom): a page that scopes prompts and
      // history per rung (the v4 route's two-conversation model) needs to know
      // where each rung's slice of the message list begins. Recorded BEFORE the
      // locked entry beats append, so the slice includes them. Absent on every
      // native page — zero behavior change there.
      if (typeof ctx.onRungEnter === 'function') ctx.onRungEnter(p.id, (state.messages || []).length);
      const beat = entryBeatsFor(p, state.lastTier).map((m) => ({ ...m, locked: true }));

      // The model is told the locked text but sometimes reproduces it anyway;
      // drop any message it wrote that matches a locked beat so the app's copy
      // is the only one (prevents a duplicated bridge / scene open).
      const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
      const lockedKeys = new Set(beat.map((m) => norm(m.text)));
      turn.turn = (turn.turn || []).filter((m) => !lockedKeys.has(norm(m.text)));

      // A locked scene hand-off is the ONLY crossing into a scene phase. Models
      // sometimes tack a preview onto the debrief ("let's put you in the room"),
      // which then doubles the locked entry. Strip any preview SENTENCE from the
      // trailing coach bubbles, then drop a bubble left empty.
      if (p.world === 'scene') {
        const PREVIEW = /\b(put you in|into the (room|scene|moment)|step in(to)?|into practice|let'?s (practice|keep going|head in)|in the room|back (to|into) the scene|ready to (practice|go|step)|walk(ing)? into)\b/i;
        for (let i = turn.turn.length - 1; i >= 0 && turn.turn[i].speaker === 'coach'; i--) {
          turn.turn[i].text = String(turn.turn[i].text || '')
            .split(/(?<=[.!?])\s+/)
            .filter((s) => !PREVIEW.test(s))
            .join(' ').replace(/\s{2,}/g, ' ').trim();
        }
        turn.turn = turn.turn.filter((m) => String(m.text || '').trim().length);
      } else {
        // COACHING hand-offs get doubled the same way: the model tacks its own
        // transition onto the teach tail ("For now, let's name what's actually
        // happening here…") and the locked signpost then says the same thing
        // again right underneath. Strip trailing TRANSITION-SHAPED sentences —
        // sentence-initial "let's / time to / now we…" forms only, walking back
        // through the tail coach bubbles, so a substantive closing line
        // ("We'll come back to that.") survives and only the redundant
        // segue goes.
        const TRANSITION = /^\s*(?:(?:now|for now|next|alright|okay|so|first)[,—:-]?\s+)?(?:let'?s\b|let us\b|time to\b|now (?:we|you)\b|we'?re going to\b|on to\b)/i;
        for (let i = turn.turn.length - 1; i >= 0; i--) {
          const m = turn.turn[i];
          if (!m || m.speaker !== 'coach' || m.kind !== 'coaching' || m.locked) break;
          const parts = String(m.text || '').split(/(?<=[.!?…])\s+/);
          while (parts.length && TRANSITION.test(parts[parts.length - 1])) parts.pop();
          m.text = parts.join(' ').trim();
          if (m.text) break;
          turn.turn.splice(i, 1);   // the bubble was only the segue — keep walking back
        }
      }

      turn.turn = turn.turn.concat(beat);
      state.scenePlaceholder = fillT(p.inputPlaceholder || '');
      state.entryLabel = fillT((p.entry || {}).cta || '');
      if (p.world === 'scene') {
        turn.mode = 'scene';
        turn.inputTarget = 'character';
        turn.returnLabel = state.entryLabel || null;
        turn.sceneTarget = (p.counterpart && p.counterpart !== 'Narrator') ? fillT(p.counterpart) : null;
      } else {
        turn.mode = 'coaching';
        turn.inputTarget = 'coach';
      }
    }

    return { entryBeatsFor, arcStateBlock, runArcEngine, closePhase, applyDeliver };
  }

  window.SimPlayer = { makeLadder, lint };
})();
