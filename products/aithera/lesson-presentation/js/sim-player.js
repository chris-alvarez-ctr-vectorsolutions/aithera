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
      const used = state.turnsInPhase;
      const ladder = phases.filter((x) => state.ladder[x.id])
        .map((x) => (x.label || x.id) + ' = ' + state.ladder[x.id]).join(', ');
      // OPTIONAL per-phase addendum — the perception (scene-sweep) layer injects
      // its COVERAGE line for a kind:'spot' phase here (js/sim-perception.js
      // passes ctx.coverageBlock). No hook → empty, so the conversational types
      // are byte-identical.
      const coverage = (typeof ctx.coverageBlock === 'function') ? (ctx.coverageBlock(p) || '') : '';
      return '\n\n[SYSTEM STATE — Phase ' + (state.phaseIdx + 1) + '/' + phases.length + ': ' + (p.label || p.id)
        + ' (' + (p.world === 'scene' ? 'SCENE' + (p.counterpart ? ' · ' + p.counterpart : '') : 'COACHING') + ').'
        + ' Learner turns used: ' + used + '/' + cap + '.'
        + coverage
        + (ladder ? ' THE LADDER so far: ' + ladder + '.' : '')
        + (vars ? ' Session state — ' + vars + '.' : '')
        + (used >= cap
            ? ' THE CAP IS REACHED — you MUST set "action":"teach" on this turn: resolve the moment, open with the verbatim talk-it-through line, debrief, and report the "tier". Do NOT continue.'
            : ' Set "action":"continue" to stay in the phase, or "action":"teach" (with a "tier") once the exit criteria are met.')
        + ']';
    }

    /* Decide stay-vs-advance from the model's turn (action / tier / cap), then
       close the phase if it's time. The app, not the model, owns advancement. */
    function runArcEngine(turn) {
      const phases = Array.isArray(scenario.phases) ? scenario.phases : [];
      if (!phases.length || state.complete) return;

      const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);

      if (state.phaseIdx < 0) {               // reflection warm-up
        if (turn.action === 'redirect') { turn.deliver = null; return; }
        // If the coach's turn ends on a QUESTION — a probe on a thin or
        // overconfident gut-read — STAY so the learner can answer it, ONCE,
        // instead of advancing over it and stacking Phase 1's hand-off
        // underneath (which reads as "the coach asked, then didn't wait").
        // Mirrors the working-phase dangling-probe guard; the one-probe cap
        // means the warm-up can't stall or loop.
        const cb = (turn.turn || []).filter((m) => m.speaker === 'coach' && String(m.text || '').trim());
        const last = cb[cb.length - 1];
        const dangling = !!last && /\?\s*$/.test(String(last.text).trim());
        if (dangling && !state.reflectionProbed) { state.reflectionProbed = true; turn.deliver = null; return; }
        closePhase(null, turn);                // calibration done → open Phase 1
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

      closePhase(p, turn);
    }

    /* Close a phase: record the tier, apply its authored transitions (state
       writes + routing), and cue the next entry. `p` is null for the
       reflection warm-up (no tier, no transitions — straight to phase 0). */
    function closePhase(p, turn) {
      const phases = scenario.phases || [];
      let nextIdx = 0;
      if (p) {
        const tier = turn.tier || null;
        state.ladder[p.id] = tier || '(unreported)';
        state.lastTier = tier;
        const trans = (p.transitions || []).find((t) => t.onTier && tier && t.onTier === tier)
          || (p.transitions || []).find((t) => !t.onTier)
          || null;
        if (trans && trans.set) Object.keys(trans.set).forEach((k) => {
          if (k in state.vars) state.vars[k] = trans.set[k];
        });
        const curIdx = phases.indexOf(p);
        nextIdx = (trans && trans.next)
          ? phases.findIndex((x) => x.id === trans.next)
          : curIdx + 1;
        if (nextIdx < 0 || nextIdx >= phases.length) {   // terminal — the model completes this same turn
          turn.deliver = null;
          state.phaseIdx = phases.length;
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
        const PREVIEW = /\b(put you in|into the (room|scene|moment)|step in(to)?|into practice|let'?s (practice|keep going|head in)|in the room|back (to|into) the scene|ready to (practice|go|step))\b/i;
        for (let i = turn.turn.length - 1; i >= 0 && turn.turn[i].speaker === 'coach'; i--) {
          turn.turn[i].text = String(turn.turn[i].text || '')
            .split(/(?<=[.!?])\s+/)
            .filter((s) => !PREVIEW.test(s))
            .join(' ').replace(/\s{2,}/g, ' ').trim();
        }
        turn.turn = turn.turn.filter((m) => String(m.text || '').trim().length);
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

  window.SimPlayer = { makeLadder };
})();
