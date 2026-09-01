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
     ("I step in beside Marshall" -> "You step in beside Marshall"). A pronoun
     transform that ALSO normalizes future/conditional intent to present tense
     ("I'd punch Jake" -> "You punch Jake"), so the action reads as a stage
     direction the learner does NOW. It never changes WHAT they do, only how the
     move is staged (and no LLM round-trip). Applied ONLY to the learner's action
     narration; their spoken words are always kept verbatim. */
  function toSecondPerson(text) {
    let s = String(text || '').trim();
    const rules = [
      // Future/conditional → present: drop the modal so "I'd/I'll/I would/I will
      // punch" -> "You punch". would/will/'d/'ll are modal + bare verb, so always
      // safe. "going to"/"gonna" is dropped ONLY before a verb — never before a
      // determiner, so "I'm going to the door" stays a destination.
      [/\bI\s+am\s+going\s+to\s+(?!(?:the|a|an|my|your|his|her|their|our|its|this|that|these|those|some|any)\b)/gi, 'you '],
      [/\bI['’]m\s+going\s+to\s+(?!(?:the|a|an|my|your|his|her|their|our|its|this|that|these|those|some|any)\b)/gi, 'you '],
      [/\bI\s+am\s+gonna\s+/gi, 'you '],
      [/\bI['’]m\s+gonna\s+/gi, 'you '],
      [/\bI\s+would\b/gi, 'you'],
      [/\bI\s+will\b/gi, 'you'],
      [/\bI['’]d\b/gi, 'you'],
      [/\bI['’]ll\b/gi, 'you'],
      [/\bI['’]m\b/gi, "you're"],
      [/\bI am\b/g, 'you are'],
      [/\bI was\b/g, 'you were'],
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

  /* Deterministic split — ORDER-PRESERVING. The rule the placeholder teaches:
     anything in "quotes" is spoken aloud; the words around them are actions.
     We walk the move left→right and emit a beat for each segment IN THE ORDER
     it appears, so `do "say" do` renders do → say → do (never all-actions-then-
     all-speech). Multiple quotes and multiple action chunks each get their own
     beat. Un-quoted free text (no way to tell described-speech from action
     without the model) falls back to the coarse "I …" = action rule. */
  function pushAction(beats, chunk) {
    // A between-quotes chunk is an action fragment; strip the connective glue
    // that introduced/followed the quote ("… and say", "then", "tells him:").
    let a = String(chunk || '')
      .replace(/[,:;—-]*\s*(and|then|,|but|so)?\s*(says?|said|yells?|shouts?|adds?|snaps?|asks?|tells?\s+\w+)\s*[:,]?\s*$/i, '')
      .replace(/^\s*(and|then|but|so)\b[\s,]*/i, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s,:;—-]+|[\s,:;—-]+$/g, '')
      .trim();
    // Drop a chunk that stripped down to just a subject ("I", "I'd", "you") —
    // that's a leftover speech introducer ("I say", "and I tell him"), not an action.
    if (a && /[a-z0-9]/i.test(a) && !/^(i|he|she|they|we|it|you)(['’]?(d|ll|m|ve|re|s))?$/i.test(a)) {
      beats.push({ kind: 'narration', text: toSecondPerson(a) });
    }
  }
  function splitSceneInput(raw) {
    const t = String(raw || '').trim();
    if (!t) return [];
    // Single quotes count as QUOTE MARKS only at word boundaries — an opener
    // can't follow a letter and a closer can't precede one — so contraction
    // apostrophes (It's, don't, Jake's) never pair up and shred the move.
    const quoteRe = /[“”][^“”]*[“”]|"[^"]*"|(?<!\w)'(?:.{2,}?)'(?!\w)/g;
    const beats = [];
    let last = 0, m;
    while ((m = quoteRe.exec(t)) !== null) {
      pushAction(beats, t.slice(last, m.index));         // action before this quote
      const spoken = m[0].replace(/^[\s"'“”]+|[\s"'“”]+$/g, '').trim();
      if (spoken) beats.push({ kind: 'dialogue', text: spoken });
      last = quoteRe.lastIndex;
    }
    if (last === 0) {   // no quotes at all — coarse single-beat fallback
      if (/^(i |i'd |i would |i'll |i'm |i am |i just |you )/i.test(t)) return [{ kind: 'narration', text: toSecondPerson(t) }];
      return [{ kind: 'dialogue', text: t }];
    }
    pushAction(beats, t.slice(last));                     // action after the last quote
    return beats.length ? beats : [{ kind: 'dialogue', text: t }];
  }

  /* The say/do split system prompt — scenario-NEUTRAL (the splitter needs no
     scenario detail). Kept static so the FAST-model call stays cache-friendly. */
  const SPLIT_SYSTEM = 'You split a person\'s move in a live role-play scene into an ORDERED list of beats — the things they DO and the things they SAY — for display. ALWAYS return ONLY a JSON object — start with { and end with } — never ask a question, never explain, never refuse, even if the move is short or ambiguous. Shape: {"beats":[{"kind":"do"|"say","text":"..."}]}.\n- Walk the move from START to FINISH and emit ONE beat per distinct thing they do or say, IN THE ORDER THEY EXPRESSED IT. A move can be several beats and can alternate — do, say, do — keep that exact sequence. NEVER reorder. NEVER merge two separate actions into one beat, and NEVER merge two separate spoken lines into one beat.\n- "kind":"do" — one physical thing they do (step, look, turn, stand, move toward someone, punch, walk away), rewritten in SECOND person ("You step in beside them"). Never invent words for a physical action.\n- "kind":"say" — one thing they say out loud. If they quoted themselves, use those words VERBATIM. If they only DESCRIBED what they would say ("tell him to knock it off", "ask her to stop"), TRANSPOSE it into the plainest first-person line they would actually speak in the moment — keep their exact tone, directness, and content.\n- TRANSPOSE, NEVER IMPROVE: do not soften, sharpen, add courtesy or tact, clean up, or make them sound more articulate than they wrote. Match their register — blunt stays blunt, rude stays rude. Never add content they did not express.\n- A speech verb (tell/say/ask/warn/snap/yell) signals SAY. Only truly physical, non-verbal moves are DO. Return an empty beats array only if there is genuinely nothing to show.\nExamples:\n"step between them" -> {"beats":[{"kind":"do","text":"You step between them"}]}\n"knock it off" -> {"beats":[{"kind":"say","text":"Knock it off"}]}\n"I\'d tell him to shut up" -> {"beats":[{"kind":"say","text":"Shut up"}]}\n"I\'d punch Jake, tell him to shove off and then run away" -> {"beats":[{"kind":"do","text":"You punch Jake"},{"kind":"say","text":"Shove off"},{"kind":"do","text":"You run away"}]}\n"tell him to drop it and then check on her after" -> {"beats":[{"kind":"say","text":"Drop it"},{"kind":"do","text":"You check on her after"}]}\n"I look over and say cut it out" -> {"beats":[{"kind":"do","text":"You look over"},{"kind":"say","text":"Cut it out"}]}\n"I\'d calmly ask him to please stop" -> {"beats":[{"kind":"say","text":"Please stop"}]}';

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
      raw = await opt.callModel({ model, maxTokens: 400, system: SPLIT_SYSTEM, messages: [{ role: 'user', content: String(text || '') }] });
    } else if (opt.workerUrl) {
      raw = await callWorker(opt.workerUrl, { model, max_tokens: 400, system: SPLIT_SYSTEM, messages: [{ role: 'user', content: String(text || '') }] });
    } else {
      throw new Error('splitSceneInputAI: pass opt.workerUrl or opt.callModel');
    }
    return beatsFromSplit(parseJson(raw));
  }

  /* Map the splitter's JSON into ordered display beats. Primary shape is an
     ordered {beats:[{kind:"do"|"say", text}]} list — kept IN ORDER so a move
     that alternates (do, say, do) renders in the sequence the learner meant.
     Falls back to the legacy {action, speech} shape (action first) so a stale
     cache or an older model reply still resolves. Returns null when empty. */
  function beatsFromSplit(obj) {
    obj = obj || {};
    const out = [];
    if (Array.isArray(obj.beats)) {
      obj.beats.forEach((b) => {
        if (!b) return;
        const text = String(b.text || '').trim();
        if (!text) return;
        const kind = /^(do|act|narr)/i.test(String(b.kind || '')) ? 'narration' : 'dialogue';
        out.push({ kind, text });
      });
    }
    if (!out.length) {   // legacy {action, speech} shape
      const action = String(obj.action || '').trim();
      const speech = String(obj.speech || '').trim();
      if (action) out.push({ kind: 'narration', text: action });
      if (speech) out.push({ kind: 'dialogue', text: speech });
    }
    return out.length ? out : null;
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
