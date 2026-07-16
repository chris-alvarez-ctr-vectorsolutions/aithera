/* =====================================================================
   say-do-split.js — the learner's scene MOVE, split into what they DO
   (an action → narration) and what they SAY (speech → a bubble), for
   DISPLAY only. The raw text always still goes to the reaction model
   verbatim; this never rewrites intent, only how the move is shown.

   Extracted from the shipped Guided Arc live page so the Writer Studio
   playtest (and its Say/Do Split sandbox) render the beat with the same
   fidelity as the learner sees. The live page still carries its own
   inline copy for now; this module is the shared home going forward.

   window.AitheraSayDoSplit = {
     toSecondPerson(text)        -> string
     splitSceneInput(raw)        -> [{kind:'narration'|'dialogue', text}]   (instant, deterministic)
     splitSceneInputAI(text,opt) -> Promise<beats|null>                      (fast-model, needs opt.workerUrl or opt.callModel)
     splitMove(text, opt)        -> Promise<beats>                           (AI-first, deterministic fallback, never loses input)
     SPLIT_SYSTEM, FAST_MODEL
   }
   ===================================================================== */
(function () {
  'use strict';

  // The fast splitter model — matches SimCore.MODELS.FAST. Kept cheap; the
  // split is a display refinement, not the reaction turn.
  const FAST_MODEL = 'claude-haiku-4-5';

  /* Restage a first-person action into the second-person cinematic voice
     ("I step in beside Marshall" -> "You step in beside Marshall"). Pure
     pronoun/verb transform — it never rewrites content, so there's no
     distortion (and no LLM round-trip). Applied ONLY to the learner's action
     narration; their spoken words are always kept verbatim. */
  function toSecondPerson(text) {
    let s = String(text || '').trim();
    const rules = [
      [/\bI['’]m\b/gi, "you're"],
      [/\bI am\b/g, 'you are'],
      [/\bI was\b/g, 'you were'],
      [/\bI['’]d\b/gi, "you'd"],
      [/\bI['’]ll\b/gi, "you'll"],
      [/\bI['’]ve\b/gi, "you've"],
      [/\bI\b/g, 'you'],
      [/\bmyself\b/gi, 'yourself'],
      [/\bmine\b/gi, 'yours'],
      [/\bMy\b/g, 'Your'], [/\bmy\b/g, 'your'],
      [/\bMe\b/g, 'You'], [/\bme\b/g, 'you'],
    ];
    rules.forEach(([re, rep]) => { s = s.replace(re, rep); });
    // capitalize the first letter of each sentence (e.g. "you step" -> "You step")
    return s.replace(/(^|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
  }

  /* Deterministic split. The rule the placeholder teaches: anything in
     "quotes" is spoken aloud; a line starting with "I …" is an action;
     otherwise a bare line is treated as speech. */
  function splitSceneInput(raw) {
    const t = String(raw || '').trim();
    const quoteRe = /[“”][^“”]*[“”]|"[^"]*"|'[^']*'/g;
    const found = t.match(quoteRe);
    if (found && found.length) {
      const speech = found.map((q) => q.replace(/^[\s"'“”]+|[\s"'“”]+$/g, '').trim()).filter(Boolean);
      let action = t.replace(quoteRe, ' ').replace(/\s{2,}/g, ' ').trim();
      // drop a dangling speech connector ("… and say", "… tells him:", "…:")
      action = action.replace(/[,:—-]*\s*(and|then|,)?\s*(says?|said|yells?|shouts?|adds?|tells?\s+\w+)\s*[:,]?\s*$/i, '').replace(/[\s,:—-]+$/, '').trim();
      const beats = [];
      if (action && /[a-z0-9]/i.test(action)) beats.push({ kind: 'narration', text: toSecondPerson(action) });
      speech.forEach((s) => beats.push({ kind: 'dialogue', text: s }));
      return beats.length ? beats : [{ kind: 'dialogue', text: t }];
    }
    if (/^(i |i'd |i would |i'll |i'm |i am |i just )/i.test(t)) return [{ kind: 'narration', text: toSecondPerson(t) }];
    return [{ kind: 'dialogue', text: t }];
  }

  /* The say/do split system prompt — scenario-NEUTRAL (the splitter needs no
     scenario detail). Kept static so the FAST-model call stays cache-friendly. */
  const SPLIT_SYSTEM = 'You split a person\'s move in a live role-play scene into what they DO and what they SAY, for display. ALWAYS return ONLY a JSON object — start with { and end with } — never ask a question, never explain, never refuse, even if the move is short or ambiguous. Shape: {"action":"...","speech":"..."}.\n- "action": what they physically do (step, look, turn, stand, move toward someone), rewritten in SECOND person ("You step in beside them"). Use "" if they only speak.\n- "speech": the words they say out loud. If they already quoted themselves, use those words VERBATIM. If they only DESCRIBED what they would say ("I\'d tell him to knock it off", "ask her to stop"), TRANSPOSE it into the plainest first-person line they would actually speak in the moment — keep their exact tone, directness, and content.\n- TRANSPOSE, NEVER IMPROVE: do not soften, sharpen, add courtesy or tact, clean up, or make them sound more articulate than they wrote. Match their register — blunt stays blunt, rude stays rude. Never invent words for a purely physical action, and never add content they did not express. Use "" if they only act.\n- A speech verb (tell/say/ask/warn/snap/yell) signals SAY → transpose it to speech. Only truly physical, non-verbal moves are action.\nExamples:\n"step between them" -> {"action":"You step between them","speech":""}\n"knock it off" -> {"action":"","speech":"Knock it off"}\n"I\'d tell him to shut up" -> {"action":"","speech":"Shut up"}\n"tell him to drop it and then check on her after" -> {"action":"You turn to check on her after","speech":"Drop it"}\n"I\'d calmly ask him to please stop" -> {"action":"","speech":"Please stop"}\n"I look over and say cut it out" -> {"action":"You look over","speech":"Cut it out"}';

  function parseJson(raw) {
    try { return JSON.parse(String(raw || '').replace(/```json|```/g, '').trim()); } catch (_) { return null; }
  }

  // POST to the same worker proxy the playtest/live page uses and return the
  // joined text content. Kept self-contained so this module has no hard
  // dependency on SimCore (the playtest drivers don't load it).
  async function callWorker(workerUrl, body) {
    const res = await fetch(workerUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('worker HTTP ' + res.status);
    const data = await res.json();
    return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  }

  /* AI split — the reliable path for free-form input (no quotes needed). Pass
     either opt.callModel (SimCore.callModel-shaped) or opt.workerUrl. Returns
     beats, or null if the model gave nothing usable (caller falls back). */
  async function splitSceneInputAI(text, opt) {
    opt = opt || {};
    const model = opt.model || FAST_MODEL;
    let raw;
    if (typeof opt.callModel === 'function') {
      raw = await opt.callModel({ model, maxTokens: 200, system: SPLIT_SYSTEM, messages: [{ role: 'user', content: String(text || '') }] });
    } else if (opt.workerUrl) {
      raw = await callWorker(opt.workerUrl, { model, max_tokens: 200, system: SPLIT_SYSTEM, messages: [{ role: 'user', content: String(text || '') }] });
    } else {
      throw new Error('splitSceneInputAI: pass opt.workerUrl or opt.callModel');
    }
    const obj = parseJson(raw) || {};
    const action = String(obj.action || '').trim();
    const speech = String(obj.speech || '').trim();
    const beats = [];
    if (action) beats.push({ kind: 'narration', text: action });
    if (speech) beats.push({ kind: 'dialogue', text: speech });
    return beats.length ? beats : null;
  }

  /* The one call a consumer wants: AI-first, deterministic fallback, and the
     raw line as a last resort so the learner's words are NEVER lost. */
  async function splitMove(text, opt) {
    let beats = null;
    try { beats = await splitSceneInputAI(text, opt); } catch (_) { /* fall through */ }
    if (!beats || !beats.length) beats = splitSceneInput(text);
    return (beats && beats.length) ? beats : [{ kind: 'dialogue', text: String(text || '') }];
  }

  window.AitheraSayDoSplit = {
    toSecondPerson, splitSceneInput, splitSceneInputAI, splitMove, SPLIT_SYSTEM, FAST_MODEL,
  };
})();
