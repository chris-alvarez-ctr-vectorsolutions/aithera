/* =========================================================================
   SIM TEACH-BACK — surface #2 of the converged Scenario Simulator player
   (window.SimTeachback). Registers the 'teach' SURFACE (js/sim-surfaces.js).
   -------------------------------------------------------------------------
   The RETRIEVAL surface: the learner has just finished a course and teaches
   the required topics back from memory; a fast side model (Haiku) grades
   coverage live and the tiles fill in as topics land. The coach only bookends
   — a short calibration chat to frame it, and a warm N-of-N close.

   Unlike scene-sweep (which HANDS INTO the ladder), teach-back OWNS ITS PHASE
   LOOP: the main turn engine never runs. The player is pure shell — the header,
   the coach sheet, the stage, the composer. This surface drives the whole thing
   through the uniform interface:

     · onStart()            → begin FRAMING (raise coach, ask the opening question)
     · ownsInput(phase)     → true while framing/teaching (send() hands us the text)
     · onInput(text)        → route: framing = calibration reply; teaching = an
                              utterance graded against the rubric
     · stageNode/shouldMount/onStageRender → the 10-tile board on the stage
     · hideModeToggle       → the flow is linear; no two-world toggle
     · noCharacterScene     → closes on complete, no scene to step out of

   It reuses the teach-back TYPE's prompt builders (calibratePrompt / gradePrompt
   / closePrompt) via window.AitheraStudio.get('teach-back'), exactly as the
   standalone teach-back.html does — the type owns the prompts, the surface owns
   the runtime. The three JSON contracts are unchanged:
     calibrate → {text, ready}   grade → {covered, nudge}   close → {headline, feedback}

   Ported from teach-back.html (its render-by-state controller) onto the player's
   DOM helpers. v1 is typing-only (the standalone page's speech input is a later
   add); every model call has an offline fallback so the demo degrades cleanly.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- the board stylesheet, injected once on first install ------------- */
  const CSS = `
  .tb-board{max-width:760px;margin:0 auto;padding:26px 20px 40px;color:#e7ecf3;}
  .tb-head h2{font-size:20px;font-weight:800;margin:0 0 4px;color:#f3f6fb;}
  .tb-head p{margin:0 0 18px;color:#9aa6b6;font-size:14px;max-width:60ch;}
  .tb-meter{display:flex;align-items:center;gap:10px;margin:0 0 18px;font-size:13px;color:#9aa6b6;font-weight:600;}
  .tb-meter .bar{flex:1 1 auto;height:8px;border-radius:999px;background:#1c2430;overflow:hidden;}
  .tb-meter .fill{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#3ba776,#5cc98d);transition:width .5s cubic-bezier(.16,1,.3,1);}
  .tb-meter b{color:#e7ecf3;}
  .tb-slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
  @media (max-width:620px){.tb-slots{grid-template-columns:1fr;}}
  .tb-slot{position:relative;display:flex;align-items:center;gap:11px;padding:12px 14px;border:1.5px dashed #2a3644;border-radius:12px;background:#141b24;min-height:46px;transition:all .35s cubic-bezier(.16,1,.3,1);}
  .tb-slot .num{flex:0 0 auto;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;background:#1f2937;color:#7d8a9b;border:1px solid #2a3644;}
  .tb-slot .ph{flex:1 1 auto;height:9px;border-radius:999px;background:linear-gradient(90deg,#2a3644,transparent);opacity:.55;}
  .tb-slot .lbl{display:none;flex:1 1 auto;font-weight:600;font-size:14px;color:#eef2f7;line-height:1.3;}
  .tb-slot .check{position:absolute;top:11px;right:13px;color:#5cc98d;opacity:0;transform:scale(.5);transition:all .4s cubic-bezier(.16,1,.3,1);}
  .tb-slot.covered{border-style:solid;border-color:#3ba776;background:rgba(59,167,118,.12);animation:tbpop .5s cubic-bezier(.16,1,.3,1);}
  .tb-slot.covered .num{background:#3ba776;color:#0c1710;border-color:#3ba776;}
  .tb-slot.covered .ph{display:none;}
  .tb-slot.covered .lbl{display:block;}
  .tb-slot.covered .check{opacity:1;transform:scale(1);}
  @keyframes tbpop{0%{transform:scale(1);}40%{transform:scale(1.035);}100%{transform:scale(1);}}
  .tb-transcript{margin:16px 0 0;font-size:13px;color:#8a96a6;min-height:18px;font-style:italic;}
  .tb-actions{margin:22px 0 0;display:flex;justify-content:center;}
  .tb-done{appearance:none;border:1px solid #3a4756;background:#1b232e;color:#cdd6e2;font:inherit;font-weight:600;font-size:14px;padding:10px 20px;border-radius:999px;cursor:pointer;transition:all .2s;}
  .tb-done:hover{background:#232d3a;border-color:#4a5867;}
  .tb-nudge{margin:10px 0 0;font-size:13px;color:#c7a86a;text-align:center;min-height:16px;}
  `;
  let cssInjected = false;
  function injectCSS() {
    if (cssInjected) return;
    cssInjected = true;
    const s = document.createElement('style');
    s.setAttribute('data-sim-teachback', '');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function install(ctx) {
    injectCSS();
    const scenario = ctx.scenario;   // runtime scenario (carries topics/calibrate/grade/close)
    const state = ctx.state;
    const el = ctx.el, esc = ctx.esc, announce = ctx.announce, render = ctx.render;

    const TB = window.AitheraStudio && window.AitheraStudio.get('teach-back');
    if (!TB) return null;            // type module must be loaded (it owns the prompts)

    const TOPICS = Array.isArray(scenario.topics) ? scenario.topics : [];
    const TOTAL = TOPICS.length;
    const CHAT_SYSTEM = TB.calibratePrompt(scenario);
    const gradeSystem = () => TB.gradePrompt(scenario);
    const closeSystem = () => TB.closePrompt(scenario);
    const MODEL = (window.SimCore && SimCore.MODELS && SimCore.MODELS.DIALOGUE) || 'claude-opus-4-8';
    const FAST  = (window.SimCore && SimCore.MODELS && SimCore.MODELS.FAST) || 'claude-haiku-4-5';
    const IS_LIVE = !!(window.SimCore && SimCore.WORKER_URL);

    /* ---- surface-owned state (seeded on the shared bag; inert elsewhere) --- */
    state.tbPhase = 'framing';          // framing | teaching | closing | done
    state.tbCovered = new Set();        // 1-based topic numbers credited (monotonic)
    state.tbUtterances = [];            // everything the learner has taught (typed)
    state.tbChat = [];                  // calibration transcript for the model {role,content}
    state.tbNudge = '';
    state.tbBusy = false;               // a model call is in flight
    state.tbClose = null;

    /* ---- coach-thread helpers (reuse the player's coach rendering) -------- */
    function coachSay(text) {
      state.messages.push({ speaker: 'coach', kind: 'coaching', text: String(text || ''), _enter: true });
      render();
    }
    function youSay(text) {
      state.messages.push({ speaker: 'you', kind: 'coaching', text: String(text || ''), _enter: true });
      render();
    }

    async function callLLM(system, messages, maxTokens, model) {
      return window.SimCore.callModel({ system, messages, maxTokens: maxTokens || 600, model: model || MODEL });
    }
    function parse(raw) { return window.SimCore.parseJson(raw); }   // throws on failure

    /* ======================= FRAMING (calibration) ======================= */
    function onStart() {
      state.started = true;
      state.mode = 'coaching';
      state.inputTarget = 'coach';
      state.tbPhase = 'framing';
      const opening = (scenario.calibrate && scenario.calibrate.openingQuestion)
        || 'You just finished the course. In your own words, what stuck with you most?';
      announce('Your coach is here.');
      coachSay(opening);
      return true;      // took over startSession
    }

    async function sendFraming(text) {
      youSay(text);
      state.tbChat.push({ role: 'user', content: text });
      state.tbBusy = true; render();
      let reply;
      try {
        const raw = await callLLM(CHAT_SYSTEM, state.tbChat.slice(), 500, MODEL);
        reply = parse(raw);
      } catch (e) {
        reply = { text: "Good — that's the right instinct. Let's put it to the test: teach the topics back and watch them fill in.", ready: true };
      }
      state.tbBusy = false;
      const ready = reply.ready !== false;
      state.tbChat.push({ role: 'assistant', content: reply.text || '' });
      coachSay(reply.text || 'Ready when you are.');
      if (ready) {
        announce('Starting the teach-back.');
        setTimeout(startTeaching, 650);
      }
    }

    /* ======================= TEACHING (the board) ======================== */
    function startTeaching() {
      if (state.tbPhase !== 'framing') return;
      state.tbPhase = 'teaching';
      state.mode = 'scene';               // lower the coach sheet, show the board on the stage
      state.inputTarget = 'coach';        // keep the plain composer styling ("Type your response…")
      state.scenePlaceholder = 'Teach a topic in your own words…';
      render();
    }

    function onInput(text) {
      if (state.tbPhase === 'framing') { sendFraming(text); return; }
      if (state.tbPhase === 'teaching') {
        state.tbUtterances.push(text);
        const tn = document.querySelector('.tb-transcript');
        if (tn) tn.textContent = '“' + text + '”';
        runGrade();
      }
    }

    // Offline / failure fallback — keyword overlap against each topic's synonyms.
    function fallbackGrade() {
      const tl = state.tbUtterances.join(' ').toLowerCase();
      const covered = [];
      TOPICS.forEach((t, i) => {
        const keys = String((t.synonyms || '') + ' ' + (t.short || '')).toLowerCase()
          .split(/[^a-z]+/).filter((w) => w.length > 4);
        const hits = keys.filter((k) => tl.includes(k)).length;
        if (hits >= 2) covered.push(i + 1);
      });
      return { covered, nudge: covered.length < TOTAL ? 'Keep going — think about the whole picture a new worker would need.' : '' };
    }

    async function runGrade() {
      if (state.tbBusy) return;                 // one grade at a time; the next send re-grades
      state.tbBusy = true;
      const transcript = state.tbUtterances.join('\n');
      let result;
      try {
        if (!IS_LIVE) throw new Error('offline');
        const raw = await window.SimCore.callModel({
          system: gradeSystem(),
          messages: [{ role: 'user', content: 'Here is everything the learner has said so far:\n\n' + transcript }],
          maxTokens: 300, model: FAST,
        });
        result = parse(raw);
      } catch (e) {
        result = fallbackGrade();
      }
      state.tbBusy = false;
      const before = state.tbCovered.size;
      (result.covered || []).forEach((n) => { if (n >= 1 && n <= TOTAL) state.tbCovered.add(n); });
      state.tbNudge = String(result.nudge || '');
      const gained = state.tbCovered.size - before;
      revealCovered();
      const nudgeEl = document.querySelector('.tb-nudge');
      if (gained > 0) {
        if (nudgeEl) nudgeEl.textContent = '';
        announce(gained + ' more covered. ' + state.tbCovered.size + ' of ' + TOTAL + '.');
      } else if (nudgeEl && state.tbCovered.size < TOTAL) {
        nudgeEl.textContent = state.tbNudge;
      }
      if (state.tbCovered.size >= TOTAL && state.tbPhase === 'teaching') finishTeaching();
    }

    /* ---- the board DOM --------------------------------------------------- */
    function boardHTML() {
      const tiles = TOPICS.map((t, i) => {
        const n = i + 1;
        return `<div class="tb-slot" data-n="${n}">
          <span class="num">${n}</span>
          <span class="ph"></span>
          <span class="lbl">${esc(t.short || ('Topic ' + n))}</span>
          <span class="check"><i class="fa-solid fa-circle-check"></i></span>
        </div>`;
      }).join('');
      return `<div class="tb-head"><h2>${TOTAL} required topics</h2>
          <p>Teach each one in your own words — in any order. They fill in as you go.</p></div>
        <div class="tb-meter"><span><b class="tb-n">0</b> / ${TOTAL} taught</span>
          <span class="bar"><span class="fill"></span></span></div>
        <div class="tb-slots">${tiles}</div>
        <div class="tb-nudge"></div>
        <div class="tb-transcript"></div>
        <div class="tb-actions"><button class="tb-done" type="button">I'm done — score me</button></div>`;
    }
    function stageNode() {
      const wrap = el('div', 'tb-board', boardHTML());
      const done = wrap.querySelector('.tb-done');
      if (done) done.addEventListener('click', () => { if (state.tbPhase === 'teaching') finishTeaching(); });
      // reflect any coverage already credited before the first mount
      setTimeout(() => { revealCovered(); }, 0);
      return wrap;
    }
    function revealCovered() {
      document.querySelectorAll('.tb-slot').forEach((slot) => {
        const n = Number(slot.dataset.n);
        if (state.tbCovered.has(n) && !slot.classList.contains('covered')) {
          slot.classList.add('covered');
          slot.querySelector('.num').innerHTML = '<i class="fa-solid fa-check"></i>';
        }
      });
      const nEl = document.querySelector('.tb-meter .tb-n');
      const fill = document.querySelector('.tb-meter .fill');
      if (nEl) nEl.textContent = state.tbCovered.size;
      if (fill) fill.style.width = (TOTAL ? (state.tbCovered.size / TOTAL) * 100 : 0) + '%';
    }

    /* ======================= CLOSE (N-of-N) ============================== */
    async function finishTeaching() {
      if (state.tbPhase !== 'teaching') return;
      state.tbPhase = 'closing';
      const score = state.tbCovered.size;
      state.mode = 'coaching';            // raise the coach for the close
      state.inputTarget = 'coach';
      coachSay('Let me see how you did…');
      const missed = TOPICS.map((t, i) => i + 1).filter((n) => !state.tbCovered.has(n));
      const missedLabels = missed.map((n) => TOPICS[n - 1].short);
      let close;
      try {
        if (!IS_LIVE) throw new Error('offline');
        const raw = await window.SimCore.callModel({
          system: closeSystem(),
          messages: [{ role: 'user', content:
            `Final score: ${score} of ${TOTAL}.\nCovered: ${[...state.tbCovered].sort((a, b) => a - b).join(', ') || 'none'}.\n` +
            `Missed: ${missed.join(', ') || 'none'} (${missedLabels.join('; ') || 'none'}).` }],
          maxTokens: 400, model: MODEL,
        });
        close = parse(raw);
      } catch (e) {
        close = {
          headline: score >= TOTAL ? 'All the way through' : 'Solid work',
          feedback: score >= TOTAL
            ? `You named all ${TOTAL} — that's a complete picture of what the training covers.`
            : `You named ${score} of ${TOTAL}. Strong on what you covered; hold onto ${missedLabels[0] ? '“' + missedLabels[0] + '”' : 'the gaps'} for next time.`,
        };
      }
      state.tbClose = close;
      coachSay((close.headline ? close.headline + ' — ' : '') + close.feedback +
        `\n\nYou taught ${score} of ${TOTAL} back.`);
      state.tbPhase = 'done';
      state.complete = true;              // finalize the shell (composer disables; no ladder close runs)
      state.continued = true;
      announce(`Teach-back complete. You taught ${score} of ${TOTAL} back.`);
      render();
    }

    /* ---- the uniform Surface interface ---------------------------------- */
    return {
      kind: 'teach',
      noCharacterScene: true,       // no character scene to step out of
      hideModeToggle: true,         // linear flow — no two-world toggle

      onStart: onStart,
      ownsInput: () => state.tbPhase === 'framing' || state.tbPhase === 'teaching',
      onInput: onInput,

      // the board mounts on the stage once teaching begins and stays through the close
      shouldMount: () => state.tbPhase === 'teaching' || state.tbPhase === 'closing' || state.tbPhase === 'done',
      mountSelector: '.tb-board',
      stageNode: stageNode,
      onStageRender: revealCovered,
    };
  }

  window.SimTeachback = { install };

  if (window.SimSurfaces) {
    window.SimSurfaces.register({ kind: 'teach', install });
  }
})();
