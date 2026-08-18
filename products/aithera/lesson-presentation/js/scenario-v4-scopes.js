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
      coachDebrief: function () { return compileFull(doc) + teachingBlock(doc); },
      coachPractice: function () { return compileFull(redactTeaching(doc)); },
      scene: function (rungId) { return compileFull(sceneSubset(doc, rungId)); },
    };
    function get(scopeKey, rungId) {
      const key = scopeKey + (rungId ? ':' + rungId : '');
      if (!(key in cache)) {
        cache[key] = scopeKey === 'scene' ? promptFor.scene(rungId) : promptFor[scopeKey]();
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
      return kind === 'scene' ? get('scene', rung.id) : get(kind);
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
        { role: 'coach · debrief scope', label: 'Coach — debrief turns + close (teaching released)', text: get('coachDebrief') },
      ];
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
