/* ============================================================================
   scenario-v4-scopes.js — two-conversation prompt scoping for the v4 route
   ----------------------------------------------------------------------------
   POC V4 §2's strongest guarantee, brought to the preview player: a practice
   prompt never contains teaching_points, misconceptions, a debrief's
   key_points, or the closing ideal_response; a scene sees only its own thread
   plus explicitly granted carryover transcripts. Until now UX Universal
   compiled ONE prompt holding everything and relied on instructions — so an
   LXD previewing here signed off against a coach that structurally knew more
   than production's ever will.

   HOW THE SCOPES ARE BUILT — redaction-recompile, not new serializers.
   Every scope's prompt is the SAME shipped builder (v4-universal.compile →
   mix-arc.compile + rubric/floors) run over a REDACTED copy of the document:

     coach/debrief   the full document (teaching released — v4 debrief scope)
     coach/practice  teaching_points, misconceptions, key_points and the
                     closing ideal_response emptied; arc map intact (v4: the
                     coach knows the arc, not the answers)
     scene/<rung>    a single-phase subset: that phase + scene_world only —
                     no narrative (a scene's world is scene_world, §4.1/4.2),
                     no opening, no teaching, no other phases

   Because the scopes differ by INPUT rather than by prompt code, the engine's
   JSON-turn contract is identical in every scope by construction, and
   verification is presence/absence assertions per scope.

   HISTORY SCOPING — a scene turn's history is filtered to the scene's own
   rung slice plus the verbatim slices of carried-over phases (v4 §7.2.5:
   "the verbatim transcript, never a summary"). Coach turns keep the full
   history — v4's coach is "automatically briefed with the verbatim transcript
   of every finished attempt", which a full chronological history satisfies.
   Rung slice boundaries are recorded via sim-player's onRungEnter hook.

   DOCUMENTED DELTAS from full V4 fidelity (deliberate, v1):
     · The closing playbook (ideal_response) stays in the DEBRIEF scope only:
       v4 composes its close server-side with no model turn; our player's close
       is model-written on the final teach turn, so that one scope must see it.
       Practice and scene scopes never do.
     · A carryover slice for a delivery-only phase includes its fused
       close-teach (v4 grants the practice attempt only) — a slight over-grant.
     · Context addenda (the Section-1 coupler) append to COACH scopes only;
       scenes never carry the narrative register.
   ========================================================================== */

(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ScenarioV4Scopes = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const str = (x) => (typeof x === 'string' ? x : '');
  const arr = (x) => (Array.isArray(x) ? x : []);
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* Strip everything the practice scope must not see. The document stays
     runtime-compilable (the runtime compiler tolerates emptiness); only the
     validator would object, and it never sees these copies. */
  function redactTeaching(doc) {
    const d = clone(doc);
    const c = obj(d.content);
    delete c.teaching_points;
    delete c.misconceptions;
    arr(c.phases).forEach(function (p) {
      const debrief = obj(obj(p).debrief);
      debrief.key_points = [];
      delete debrief.probe;           // the locked probe is debrief-scope content
    });
    const ir = obj(obj(c.closing).ideal_response);
    delete ir.component_groups;
    delete ir.summary;
    return d;
  }

  /* A single-phase scene subset: that phase + the shared scene world. */
  function sceneSubset(doc, phaseId) {
    const d = redactTeaching(doc);
    const c = obj(d.content);
    delete c.narrative;               // a scene's world is scene_world, not the coach's ground truth
    delete c.opening;
    c.phases = arr(c.phases).filter(function (p) { return str(obj(p).id) === phaseId; });
    return d;
  }

  /* Empty the OTHER phases' answer keys for a debrief turn.
     ---------------------------------------------------------------------
     The debrief scope legitimately sees teaching content — that is v4 §2's
     own rule, and our close is model-written so it must also see the closing
     playbook. What it does NOT need is the expected answer for phases it is
     not debriefing. Leaving them in is the likeliest mechanism behind the
     dev team's largest measured defect (16 of 58 reviewer notes): a debrief
     narrating the learner as having done something they never did, and doing
     it in another phase's words — "assumes my answer involved confronting
     Ray" arrived in the EMERGENCY debrief, where confronting Ray is the
     neighbouring phase's expected move, not this one's.

     So: keep this phase's `exit.when.requirement` and `levels[].look_for` /
     `.response` (the coach grades and teaches against them), keep every
     phase's id, label, prompts and debrief key_points (the arc map and the
     teaching stay intact), and empty the expectation text everywhere else.

     The close is deliberately exempt: at completion there is no active rung,
     the scope is fetched un-narrowed, and a closing report that reflects the
     whole ladder needs the whole ladder. See systemFor(). */
  const WITHHELD = '(criteria withheld — this is not the phase being debriefed)';

  function narrowExpectations(doc, rungId) {
    /* A debrief rung's id is "<phaseId>.debrief" (runtime debriefRungFor) — the
       same notation the dev team's own trace names use (emergency.debrief). Map
       it back to the phase whose answer key this debrief is entitled to see. */
    const keepPhaseId = str(rungId).replace(/\.debrief$/, '');
    const d = clone(doc);
    arr(obj(d.content).phases).forEach(function (p) {
      const phase = obj(p);
      if (str(phase.id) === keepPhaseId) return;
      const practice = obj(phase.practice);
      const when = obj(obj(practice.exit).when);
      if ('requirement' in when) when.requirement = '';
      /* The answer key lives at practice.interaction.levels[tier] in v4 content;
         the probe's own levels sit under debrief. Both are cleared — a phase we
         are not debriefing contributes no expected answer. content.opening.levels
         is deliberately untouched: the warm-up is calibration, never graded. */
      const dbr = obj(phase.debrief);
      [obj(practice.interaction).levels, practice.levels,
       obj(dbr.probe).levels, dbr.levels].forEach(function (container) {
        const levels = obj(container);
        Object.keys(levels).forEach(function (k) {
          const lv = obj(levels[k]);
          if (!('look_for' in lv) && !('response' in lv)) return;
          /* Replaced, not emptied. The runtime derives the prompt's TIER FIELD
             vocabulary by unioning the tiers that have text (calibrationFromLevels
             drops a level with neither look_for nor response), so blanking these
             silently shrank the reportable tier list — a phase whose own levels
             skip a bucket would lose that tier from the whole prompt. A short
             uniform marker keeps every tier alive, carries no expected answer,
             and reads as deliberately out of scope rather than as criteria. */
          lv.look_for = WITHHELD;
          if ('response' in lv) lv.response = '';
          delete lv.example;          // a worked learner utterance at this tier
          delete lv.progression;      // how far a scene gets at this tier
        });
      });
    });
    return d;
  }

  const SCENE_MODES = { roleplay: true, observe_react: true };

  function create(doc, deps) {
    const compileFull = deps.compile;          // v4-universal's string compile (monolith)
    const toRuntime = deps.toRuntime;          // v4-universal's toRuntime
    const runtime = deps.runtime || toRuntime(doc);

    /* Which scope does each rung run in? Scene-mode PRACTICE rungs get their
       own scene scope; everything else — the opening warm-up, coach_inquiry
       practices (still teaching-redacted!), and all debrief rungs — is coach.
       A coach_inquiry practice shares the redacted coach prompt; only debrief
       rungs and the close see the full one. */
    const sceneRungs = {};
    const rungKind = {};               // rungId → 'scene' | 'coachPractice' | 'coachDebrief'
    const phaseById = {};
    arr(obj(obj(doc).content).phases).forEach(function (p) { phaseById[str(obj(p).id)] = p; });
    arr(runtime.phases).forEach(function (r) {
      const rung = obj(r);
      if (rung.isDebriefRung) { rungKind[rung.id] = 'coachDebrief'; return; }
      const mode = obj(obj(phaseById[rung.id]).practice).mode;
      if (SCENE_MODES[mode]) { rungKind[rung.id] = 'scene'; sceneRungs[rung.id] = true; }
      else rungKind[rung.id] = 'coachPractice';
    });

    /* Lazily compiled, cached per scope. Addenda invalidate the cache. */
    const cache = {};
    let addenda = '';
    /* v4 §2: teaching_points and misconceptions reach the coach prompt ON
       DEBRIEF TURNS. The monolith never carried the content-level topics (the
       per-rung label match is fragile by design and often misses), so the
       debrief scope appends them here, serialized the way POC V4's own
       serializer renders them: each topic as a heading with its points beneath.
       The closing ideal_response stays out of practice and scene scopes; the
       debrief scope keeps it because our close is model-written there (see the
       header's documented deltas). */
    function teachingBlock(d) {
      const c = obj(obj(d).content);
      const parts = [];
      const topics = arr(c.teaching_points).filter(function (t) { return obj(t).topic || arr(obj(t).points).length; });
      if (topics.length) {
        parts.push('TEACHING POINTS — the substantive things the learner must leave understanding. '
          + 'In scope NOW (a debrief/teach turn): land them against what the learner actually did.\n\n'
          + topics.map(function (t) {
            const topic = obj(t);
            return (str(topic.topic) ? str(topic.topic) + ':\n' : '')
              + arr(topic.points).map(function (pt) { return '- ' + str(pt); }).join('\n');
          }).join('\n\n'));
      }
      const mis = arr(c.misconceptions).filter(function (m) { return obj(m).misconception; });
      if (mis.length) {
        parts.push('MISCONCEPTIONS — wrong beliefs paired with their corrections; redirect when one surfaces:\n'
          + mis.map(function (m) { return '- ' + str(obj(m).misconception) + ' → ' + str(obj(m).redirect); }).join('\n'));
      }
      return parts.length ? '\n\n' + parts.join('\n\n') : '';
    }

    const promptFor = {
      coachDebrief: function (rungId) {
        /* rungId absent = the close (no active rung) — see narrowExpectations. */
        const d = rungId ? narrowExpectations(doc, rungId) : doc;
        return compileFull(d) + teachingBlock(d);
      },
      coachPractice: function () { return compileFull(redactTeaching(doc)); },
      scene: function (rungId) { return compileFull(sceneSubset(doc, rungId)); },
    };
    function get(scopeKey, rungId) {
      /* Only the scene and debrief scopes vary by rung — a scene sees its own
         thread, a debrief its own answer key. The practice scope is identical
         for every rung, so it stays a single cache entry. */
      if (scopeKey === 'coachPractice') rungId = null;
      const key = scopeKey + (rungId ? ':' + rungId : '');
      if (!(key in cache)) {
        cache[key] = scopeKey === 'scene' ? promptFor.scene(rungId) : promptFor[scopeKey](rungId);
        /* Context addenda are coach-register ground truth — coach scopes only. */
        if (scopeKey !== 'scene' && addenda) cache[key] += addenda;
      }
      return cache[key];
    }

    /* --- rung slice boundaries (fed by sim-player's onRungEnter hook) ---- */
    const bounds = [];                 // ordered [{id, start}]
    function onRungEnter(id, messageIndex) {
      bounds.push({ id: str(id), start: messageIndex });
    }
    function sliceOf(rungId, msgs) {
      for (let i = 0; i < bounds.length; i++) {
        if (bounds[i].id !== rungId) continue;
        const start = Math.min(bounds[i].start, msgs.length);
        const end = i + 1 < bounds.length ? Math.min(bounds[i + 1].start, msgs.length) : msgs.length;
        return msgs.slice(start, end);
      }
      return null;
    }

    function activeRung(state) {
      const idx = state && typeof state.phaseIdx === 'number' ? state.phaseIdx : -1;
      if (idx < 0 || idx >= arr(runtime.phases).length) return null;
      return runtime.phases[idx];
    }

    /* --- the two per-turn hooks the player wires in ----------------------- */
    function systemFor(state) {
      const rung = activeRung(state);
      if (!rung) {
        /* Warm-up (opening) and the completed tail both run in the coach
           conversation. The opening is ungraded, pre-teaching — practice scope. */
        return get(state && state.complete ? 'coachDebrief' : 'coachPractice');
      }
      const kind = rungKind[rung.id] || 'coachPractice';
      /* Debrief scopes are per-rung so each one sees only its OWN answer key
         (narrowExpectations). The practice scope ignores the rung id — its
         redaction is the same for every rung — but passing it costs one
         cache entry per rung and keeps the call site uniform. */
      return kind === 'scene' ? get('scene', rung.id) : get(kind, rung.id);
    }

    function filterHistory(msgs, state) {
      const rung = activeRung(state);
      if (!rung || rungKind[rung.id] !== 'scene') return msgs;   // coach scopes: full brief
      const own = sliceOf(rung.id, msgs);
      if (own === null) return msgs;   // no boundary recorded (first rung) — everything before it is nothing
      const granted = [];
      arr(rung.carryover).forEach(function (fromId) {
        const slice = sliceOf(str(fromId), msgs);
        if (slice) granted.push.apply(granted, slice);
      });
      return granted.concat(own);
    }

    function appendAddendum(t) {
      addenda += '\n\n' + str(t);
      Object.keys(cache).forEach(function (k) {
        if (k.indexOf('scene') !== 0) delete cache[k];   // coach scopes recompile with addenda
      });
    }

    /* --- the inspector's view: every scope, labeled, in play order -------- */
    function prompts() {
      const out = [
        { role: 'coach · practice scope', label: 'Coach — practice turns (teaching withheld)', text: get('coachPractice') },
        { role: 'coach · close scope', label: 'Coach — the closing report (whole ladder released)', text: get('coachDebrief') },
      ];
      /* One entry per debrief rung: each sees its own phase's answer key and
         not its neighbours'. The un-narrowed variant above is the close. */
      arr(runtime.phases).forEach(function (r) {
        if (rungKind[r.id] !== 'coachDebrief') return;
        out.push({
          role: 'coach · debrief · ' + r.id,
          label: 'Coach — debrief of "' + (str(r.label) || r.id) + '" (this phase\'s answer key only)',
          text: get('coachDebrief', r.id),
        });
      });
      arr(runtime.phases).forEach(function (r) {
        if (!sceneRungs[r.id]) return;
        out.push({
          role: 'scene · ' + r.id,
          label: 'Scene — "' + (str(r.label) || r.id) + '" (own thread'
            + (arr(r.carryover).length ? ' + carryover: ' + r.carryover.join(', ') : '') + ')',
          text: get('scene', r.id),
        });
      });
      return out;
    }

    return {
      systemFor: systemFor,
      filterHistory: filterHistory,
      appendAddendum: appendAddendum,
      onRungEnter: onRungEnter,
      prompts: prompts,
      _rungKind: rungKind,             // exposed for verification
    };
  }

  return { create: create, redactTeaching: redactTeaching, sceneSubset: sceneSubset };
}));
