/* =========================================================================
   SIM CORE — the shared AI turn engine under every scenario-simulator mode
   =========================================================================

   Framework recap (see the Scenario Simulator spec docs):
     Section 1  Scenario Context  — a swappable intro modality  → js/sim-context.js
     Section 2  Interaction layer — ENTER → (ACT → REACT → COACH → GATE)… → EXIT
     Section 3  Debrief & close   — one structured close          → js/sim-debrief.js

   THIS file is the platform floor for Section 2 (and every model call the
   other two sections make). Every live page — Roleplay Coach (Kendra),
   Guided Arc (Marshall), Observe/React (HazMat), Teach-Back (HazCom) —
   talks to the model through the SAME plumbing:

     • one proxy Worker URL + one model registry (DIALOGUE strong / FAST cheap)
     • one JSON repair pass (fences + raw newlines inside strings)
     • one strict-parse-or-retry-once-or-fallback turn cycle
     • one JSON-history serializer (the model sees its own past turns as the
       same JSON it must produce — Opus 4.8 forbids assistant prefill, so this
       is what actually holds the output format)
     • one set of pacing constants (how long coaching beats feel) and gate
       constants (how many nudges before we advance anyway)

   A mode CUSTOMIZES by configuration, never by re-implementing:
     makeTurnParser(opts)  — which optional fields its turn contract carries
                             (report / deliver / observeNext / scene hints)
     makeTurnEngine(opts)  — its system prompt, model, budget, scripted
                             fallback, and parser

   No framework, no build step — a plain script exposing window.SimCore.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- THE PROXY + MODEL REGISTRY ----------------------------------- */
  // One Cloudflare Worker holds the API key, enforces a model allowlist, a
  // token cap and a CORS allowlist (see worker/README.md). Every page POSTs
  // the same { model, system, messages } shape to it.
  const WORKER_URL = 'https://aithera-action-proxy.vector-aithera.workers.dev';

  // The two tiers every mode chooses from. DIALOGUE voices the coach and any
  // character (quality); FAST is for high-frequency background judgments —
  // teach-back's live tile grading turns around in ~1s on it.
  const MODELS = {
    DIALOGUE: 'claude-opus-4-8',
    FAST: 'claude-haiku-4-5',
  };

  /* ---- HOUSE CONSTANTS: gates + report ------------------------------- */
  // GATE philosophy (spec §"Gating"): nudge-then-advance is the house
  // default — a weak answer draws at most NUDGE_CAP escalating nudges, then
  // the experience moves on. Only a mode's declared HARD gate (e.g. Kendra's
  // escalation gate) may hold longer, and even that falls back after the cap.
  const GATE = { NUDGE_CAP: 2 };

  // The debrief report every dialogue mode hands to Section 3: at most
  // 3 strengths and 2 growth areas, so the close stays scannable.
  const REPORT_CAPS = { strengths: 3, growthAreas: 2 };

  /* ---- PACING — how coaching feels, standardized ---------------------- */
  // One rhythm across all modes, so the coach "breathes" the same everywhere.
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // How long the coach "thinks" (typing dots) before a message. This is the
  // MAIN beat: the dots tell the learner more is coming, so they read the
  // message that's already on screen while the next one composes. We scale
  // the thinking time to the PREVIOUS message's length — that's what's being
  // read right now. The very first line gets a short opening beat.
  const thinkingTime = (prevText) =>
    reducedMotion() ? 250
    : prevText ? Math.min(3800, 1000 + String(prevText).length * 15)
               : 950;

  // Dots-before-a-message beat. The FIRST bubble in a burst appears FAST —
  // the model round-trip (or the closing stepper) already served as the
  // "thinking". Later bubbles get a beat scaled to THEIR OWN length, on a
  // tight range so it never swings.
  const typingTime = (text, isFirst) =>
    reducedMotion() ? (isFirst ? 120 : 220)
    : isFirst ? 450
    : Math.min(2600, Math.max(650, Math.round(300 + String(text || '').length * 13)));

  // Named beats used by the pages' deliver choreography (previously inline
  // magic numbers). Reduced-motion callers should collapse these themselves
  // (they already do, via reducedMotion()).
  const PACE = {
    COACH_LINE: 780,       // dots before a coach bubble
    COACH_SETTLE: 300,     // pause after a coach bubble lands
    CHARACTER_LINE: 850,   // beat before a character speaks in the scene
    NARRATION: 280,        // beat before a narration line
    SCENE_SETTLE: 340,     // pause after the scene reacts
    ANALYZING: 1600,       // the "Analyzing response…" bar beat
    DEMO_MIN: 600,         // scripted-engine fake round-trip: min…
    DEMO_JITTER: 500,      // …plus up to this much randomness
  };

  /* ---- JSON REPAIR + PARSE -------------------------------------------- */
  // Repair the two ways models most often break "JSON only" output:
  //  1. prose around the object → slice from the first '{' to the last '}'
  //  2. raw line breaks INSIDE string values (illegal JSON) → walk the chars
  //     tracking whether we're inside a string, and escape them there only.
  function repairJson(raw) {
    let s = String(raw).replace(/```json|```/g, '').trim();
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
    let out = '', inStr = false, escaped = false;
    for (const ch of s) {
      if (inStr && !escaped && (ch === '\n' || ch === '\r' || ch === '\t')) {
        out += ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : '\\t';
        continue;
      }
      out += ch;
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') inStr = !inStr;
    }
    return out;
  }

  // Repair-then-parse for single-object replies (teach-back's grade/close,
  // the debrief's close call). Throws on failure — callers decide fallback.
  function parseJson(raw) { return JSON.parse(repairJson(raw)); }

  // Validate one report list from the model: keep only well-shaped items.
  function cleanReportItems(items, max) {
    if (!Array.isArray(items)) return [];
    return items
      .filter((it) => it && typeof it.title === 'string' && typeof it.body === 'string')
      .slice(0, max)
      .map((it) => ({ title: it.title, body: it.body }));
  }

  /* ---- THE TURN PARSER (configurable, one implementation) ------------- */
  /* Every dialogue mode returns the same base contract:
       { turn:[{speaker,kind,text,…}], … }
     What ELSE a mode's contract carries is configuration:

     makeTurnParser({
       emotionalState: true,   // keep character emotionalState (roleplay)
       name: false,            // keep per-message character name (guided arc)
       modeTarget: true,       // parse mode/inputTarget with trailing-kind
                               // inference (roleplay + guided arc)
       report: REPORT_CAPS,    // accept a final {strengths,growthAreas} report
                               // (or false for modes that close differently)
       deliver: null,          // (id) => boolean — whitelist of LOCKED beat ids
                               // the model may cue (guided arc)
       sceneHints: false,      // returnLabel / sceneTarget / sceneSetup
                               // passthrough (guided arc scene transitions)
       observeNext: null,      // (bool) => bool — clamp for "go watch the next
                               // segment" (observe/react)
       fallbackText: '…',      // the safe coach line when all parsing fails
     }) → { strict(raw) → turn|null, safe(raw) → turn }
  */
  const FALLBACK_TEXT =
    "Sorry — that didn't come through cleanly on my end. Say that once more and we'll keep going.";

  function makeTurnParser(opts) {
    const o = Object.assign({
      emotionalState: true,
      name: false,
      modeTarget: true,
      complete: true,        // accept a final complete:true flag (all modes end somehow)
      report: REPORT_CAPS,
      deliver: null,
      action: false,         // accept "probe"|"teach" intent (guided arc phase engine)
      tier: null,            // (t) => t|null — accept a calibration-tier label on
                             // teach turns (branching arc records it as ladder state)
      spotted: null,         // (id) => bool — predicate; when set, parse obj.spotted
                             // as an array of rubric ids (scene sweep coverage rail)
      sceneHints: false,
      observeNext: null,
      fallbackText: FALLBACK_TEXT,
    }, opts || {});

    // STRICT parse: returns a normalized turn, or null if the model didn't
    // return a usable JSON object (so the engine can retry before giving up).
    function strict(raw) {
      try {
        const obj = JSON.parse(repairJson(raw));
        if (!obj || !Array.isArray(obj.turn)) return null;
        const turn = obj.turn
          .filter((m) => m && m.speaker && m.kind && typeof m.text === 'string' && m.text.trim())
          .map((m) => ({
            speaker: m.speaker, kind: m.kind, text: m.text,
            ...(o.name && m.speaker === 'character' && typeof m.name === 'string' && m.name.trim()
              ? { name: m.name.trim() } : {}),
            ...(o.emotionalState && m.speaker === 'character' && m.emotionalState
              ? { emotionalState: m.emotionalState } : {}),
          }));
        if (!turn.length) return null;

        const out = { turn };

        if (o.modeTarget) {
          // If the model omits mode/inputTarget (common on a stay-in-scene
          // character reply), infer from the turn's TRAILING content instead
          // of defaulting to coaching — otherwise a character-only reply
          // would wrongly pull the learner out of the scene.
          const lastKind = turn[turn.length - 1].kind;
          const trailingScene = lastKind === 'dialogue' || lastKind === 'narration';
          const mode = obj.mode === 'scene' ? 'scene'
            : obj.mode === 'coaching' ? 'coaching'
            : (trailingScene ? 'scene' : 'coaching');
          out.mode = mode;
          out.inputTarget = obj.inputTarget === 'character' ? 'character'
            : obj.inputTarget === 'coach' ? 'coach'
            : (mode === 'scene' ? 'character' : 'coach');
        }

        // Models occasionally misplace response-level flags onto the last
        // turn ITEM ({"speaker":"coach",…,"observeNext":true}) — hoist them,
        // since an item-level flag can only ever mean the response-level one.
        const itemFlag = (key) => obj.turn.some((m) => m && m[key] === true);

        if (o.complete) out.complete = obj.complete === true || itemFlag('complete');

        if (o.report) {
          const report = obj.report ? {
            strengths: cleanReportItems(obj.report.strengths, o.report.strengths),
            growthAreas: cleanReportItems(obj.report.growthAreas, o.report.growthAreas),
          } : null;
          if (report && (report.strengths.length || report.growthAreas.length)) out.report = report;
        }

        if (o.deliver) {
          // "deliver" names a LOCKED (app-owned) beat to append after the
          // model's dynamic message this turn. Whitelist to known ids.
          if (typeof obj.deliver === 'string' && o.deliver(obj.deliver)) out.deliver = obj.deliver;
        }

        if (o.action) {
          // "action" is the coach's INTENT for a coaching turn:
          //   "teach"    — land the point; the app then advances to the next hand-off
          //   "probe"    — ONE Socratic question; stay in the phase (burns the probe)
          //   "redirect" — off-script/troll input; stay and re-ask (does NOT burn it)
          // The app, not the model, owns WHEN to advance and WHICH locked beat to
          // show; action just tells it what the model meant. Item-level flags
          // hoist here too (a model sometimes puts it on the last bubble).
          // "continue" is the branching arc's stay-in-phase intent (a character
          // reaction or an in-phase probe — multi-turn phases, unlike the guided
          // arc's single probe); modes that never prompt for it never see it.
          const OK = { probe: 1, teach: 1, redirect: 1, continue: 1 };
          const itemAction = obj.turn.map((m) => m && m.action).find((a) => OK[a]);
          const a = OK[obj.action] ? obj.action : itemAction;
          if (a) out.action = a;
        }

        if (o.tier) {
          // A calibration-tier label the model reports when it closes a phase
          // ("teach"). The page supplies the validator — unknown labels drop to
          // null so authored transitions never key off a hallucinated tier.
          const rawTier = typeof obj.tier === 'string' ? obj.tier
            : obj.turn.map((m) => m && m.tier).find((t) => typeof t === 'string');
          const t = o.tier(rawTier || '');
          if (t) out.tier = t;
        }

        if (o.spotted) {
          // A cumulative set of rubric ids the learner has now clearly named
          // (scene sweep's perception-grading). The page supplies the validator
          // so a hallucinated id never lights a chip. Item-level arrays hoist too.
          const rawSpot = Array.isArray(obj.spotted) ? obj.spotted
            : obj.turn.map((m) => m && m.spotted).find(Array.isArray) || [];
          const ids = rawSpot
            .filter((x) => typeof x === 'string')
            .map((x) => x.trim())
            .filter((x) => o.spotted(x));
          if (ids.length) out.spotted = Array.from(new Set(ids));
        }

        if (o.sceneHints) {
          // A coach-led scene transition may relabel the return CTA, name who
          // the learner will speak to next, and paint the new sub-scene.
          if (typeof obj.returnLabel === 'string' && obj.returnLabel.trim()) out.returnLabel = obj.returnLabel.trim();
          if (typeof obj.sceneTarget === 'string' && obj.sceneTarget.trim()) out.sceneTarget = obj.sceneTarget.trim();
          if (typeof obj.sceneSetup === 'string' && obj.sceneSetup.trim()) out.sceneSetup = obj.sceneSetup.trim();
        }

        if (o.observeNext) {
          // Never let a live model send the learner to footage that doesn't
          // exist — the page supplies the clamp. Item-level flags hoist here
          // too (see itemFlag above).
          out.observeNext = o.observeNext(Boolean(obj.observeNext) || itemFlag('observeNext'));
        }

        return out;
      } catch (e) {
        return null;
      }
    }

    // Last-resort fallback so a bad turn never crashes the UI mid-conversation.
    function safe(raw) {
      return strict(raw) || {
        turn: [{ speaker: 'coach', kind: 'coaching', text: o.fallbackText }],
        ...(o.modeTarget ? { mode: 'coaching', inputTarget: 'coach' } : {}),
      };
    }

    return { strict, safe, opts: o };
  }

  /* ---- HISTORY SERIALIZERS -------------------------------------------- */
  // Map our multi-speaker history into a user/assistant transcript for the
  // API. We serialize each assistant run as the SAME JSON turn shape the
  // model must return ({"turn":[{speaker,kind,text,…}]}) rather than as
  // flattened "Coach:"/"Kendra:" prose. Opus 4.8 doesn't allow assistant
  // prefill to force JSON, so this is what keeps the model in format: it
  // sees its own history as JSON and keeps producing JSON. (App-injected
  // LOCKED beats sit in these turns too — they're part of what was said.)
  function turnHistory(opts) {
    const o = Object.assign({ emotionalState: true, name: false, owner: false }, opts || {});
    return function toApiMessages(msgs) {
      const out = [];
      let group = [];
      const flush = () => {
        if (!group.length) return;
        const turn = group.map((m) => ({
          speaker: m.speaker, kind: m.kind, text: m.text,
          ...(o.name && m.speaker === 'character' && m.name ? { name: m.name } : {}),
          ...(o.emotionalState && m.speaker === 'character' && m.emotionalState
            ? { emotionalState: m.emotionalState } : {}),
          // Tag app-injected (LOCKED, verbatim) beats so the model can tell its
          // own dynamic lines from the app-owned hand-offs in its history — and
          // so it never re-quotes or paraphrases them (see the prompt's note).
          ...(o.owner && m.locked ? { owner: 'app' } : {}),
        }));
        out.push({ role: 'assistant', content: JSON.stringify({ turn }) });
        group = [];
      };
      for (const m of msgs) {
        if (m.speaker === 'you') { flush(); out.push({ role: 'user', content: m.text }); }
        else group.push(m);
      }
      flush();
      if (out.length && out[0].role === 'assistant') out.unshift({ role: 'user', content: '(begin)' });
      return out;
    };
  }

  // Plain chat serializer for simple {text}-style exchanges (teach-back's
  // calibration chat): coalesces assistant lines, alternates roles.
  function chatHistory() {
    return function toChatMessages(msgs) {
      const out = [];
      let buf = [];
      const flush = () => { if (buf.length) { out.push({ role: 'assistant', content: buf.join('\n') }); buf = []; } };
      for (const m of msgs) {
        if (m.speaker === 'you') { flush(); out.push({ role: 'user', content: m.text }); }
        else buf.push(m.text);
      }
      flush();
      if (out.length && out[0].role === 'assistant') out.unshift({ role: 'user', content: '(begin)' });
      return out;
    };
  }

  /* ---- THE MODEL CALL --------------------------------------------------- */
  // One-shot call through the proxy Worker. Every generated moment in every
  // section goes through here — turn cycles, live grading, closing feedback.
  // Transient failures — a dropped connection, a cold Worker, a 429/5xx — are
  // retried with a short backoff BEFORE the error ever reaches the page. This is
  // what keeps a flaky moment from surfacing as a "hiccup" (and, on the ladder
  // pages, from silently burning a turn). Deterministic 4xx (bad request, model
  // not allowed) fail fast — retrying can't fix them. Backoff steps = attempts.
  const RETRY_BACKOFF = [400, 900];   // → up to 3 attempts total
  async function callModel({ workerUrl, model, maxTokens, system, messages }) {
    const url = workerUrl || WORKER_URL;
    const payload = JSON.stringify({
      model: model || MODELS.DIALOGUE,
      max_tokens: maxTokens || 1200,
      system,
      messages,
    });
    let lastErr = null;
    for (let attempt = 0; attempt <= RETRY_BACKOFF.length; attempt++) {
      if (attempt > 0) await wait(RETRY_BACKOFF[attempt - 1]);
      let res;
      try {
        res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
      } catch (e) {
        lastErr = e;                       // network / CORS / abort — transient, retry
        continue;
      }
      if (res.ok) {
        const data = await res.json();
        return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      }
      lastErr = new Error('Worker HTTP ' + res.status);
      if (res.status !== 429 && res.status < 500) break;   // deterministic 4xx — don't retry
    }
    throw lastErr || new Error('Worker call failed');
  }

  /* ---- THE TURN ENGINE --------------------------------------------------- */
  /* makeTurnEngine({
       system,             // string | () => string (evaluated per call, so a
                           // Section-1 context record can append to it later)
       model,              // default MODELS.DIALOGUE
       maxTokens,          // default 1600 (the dialogue budget)
       parser,             // from makeTurnParser
       history,            // from turnHistory / chatHistory
       scripted,           // (msgs) => turn — the page's demo/offline engine
       live,               // default true when a worker URL exists
       workerUrl,          // default WORKER_URL
     }) → { live, getTurn(msgs) }

     getTurn, in live mode:
       serialize history → call → STRICT parse →
       (on failure) retry ONCE, appending a JSON-only reminder to the
       learner's OWN last user message — roles stay alternating and we never
       introduce a plain-text assistant example to pattern-match against →
       (still failing) the parser's safe fallback line.
     In demo mode: the page's scripted responder behind a natural fake delay.
  */
  const RETRY_NUDGE =
    '\n\n[Reply with ONLY the JSON object defined in the OUTPUT CONTRACT — start with { and end with }, no other text.]';

  function makeTurnEngine(opts) {
    const o = Object.assign({
      system: '',
      model: MODELS.DIALOGUE,
      maxTokens: 1600,
      parser: null,
      history: turnHistory(),
      scripted: null,
      workerUrl: WORKER_URL,
      live: true,
    }, opts || {});
    if (!o.parser) throw new Error('SimCore.makeTurnEngine: a parser is required');
    const isLive = Boolean(o.live && o.workerUrl);
    const systemText = () => (typeof o.system === 'function' ? o.system() : o.system);

    async function liveTurn(msgs) {
      const messages = o.history(msgs);
      const call = (m) => callModel({
        workerUrl: o.workerUrl, model: o.model, maxTokens: o.maxTokens,
        system: systemText(), messages: m,
      });
      let raw = await call(messages);
      let parsed = o.parser.strict(raw);
      if (!parsed && messages.length) {
        const nudged = messages.slice();
        const last = nudged[nudged.length - 1];
        nudged[nudged.length - 1] = { ...last, content: last.content + RETRY_NUDGE };
        raw = await call(nudged);
        parsed = o.parser.strict(raw);
      }
      return parsed || o.parser.safe(raw);
    }

    // Unified responder (adds a natural delay in demo so it feels like a round-trip)
    function getTurn(msgs) {
      if (isLive) return liveTurn(msgs);
      return new Promise((resolve) => setTimeout(
        () => resolve(o.scripted ? o.scripted(msgs) : o.parser.safe('')),
        PACE.DEMO_MIN + Math.random() * PACE.DEMO_JITTER
      ));
    }

    return { live: isLive, getTurn };
  }

  /* ---- EXPORT ----------------------------------------------------------- */
  window.SimCore = {
    WORKER_URL,
    MODELS,
    GATE,
    REPORT_CAPS,
    PACE,
    wait,
    reducedMotion,
    thinkingTime,
    typingTime,
    repairJson,
    parseJson,
    cleanReportItems,
    makeTurnParser,
    turnHistory,
    chatHistory,
    callModel,
    makeTurnEngine,
  };
})();
