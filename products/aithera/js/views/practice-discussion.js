// views/practice-discussion.js — Discussion-mode scenario engine.
//
// An alternative to the multiple-choice step engine (see practice.js). The
// scenario plays as a branching conversation with Coach Vic:
//   - A sticky keyframe hero swaps to a new still at each "beat", with a
//     one-line caption ("what's happening now").
//   - Vic poses a judgment question; the learner answers in their OWN words
//     by text or voice (real Web Speech API, with graceful fallback).
//   - Optional "things to consider" chips offer deliberately ambiguous
//     framings — aids, not answers.
//   - A lightweight keyword read of the response picks a branch. Poor or
//     passive answers don't dead-end: the scene advances to show the
//     consequence and re-opens a new chance to act (consequence + re-entry).
//
// This module is invoked by practice.js when a scenario has mode:'discussion'.
// It reuses the sticky-hero + scrolling-thread shell and CSS from the step
// engine, and reports back through onFinish(score, results).

import * as ui from '../ui.js?v=course-flow-1';

export function run({ root, sc, timer, onFinish }) {
  const beats = Object.fromEntries((sc.beats || []).map((b) => [b.id, b]));
  const results = [];        // one entry per answered beat (for the debrief)
  const visited = [];        // beat ids in order, to score path quality
  let activeRec = null;      // live SpeechRecognition, so we can stop on advance

  // ----- sticky keyframe hero + scrolling thread shell -----
  const heroImg = ui.el('img', { class: 'scn-hero-photo', alt: '', decoding: 'async' });
  heroImg.addEventListener('error', () => heroImg.style.display = 'none');
  const heroCaption = ui.el('div', { class: 'scn-kf-caption' });
  const hero = ui.el('div', { class: 'scn-hero has-photo scn-kf', style: { height: '240px' } },
    heroImg,
    ui.el('span', { class: 'scn-hero-scrim', 'aria-hidden': 'true' }),
    heroCaption
  );
  const heroSticky = ui.el('div', { class: 'scn-hero-sticky' }, hero, ui.el('div', { class: 'scn-hero-timer' }, timer));
  const threadEl = ui.el('div', { class: 'scn-thread scn-discussion' });
  root.replaceChildren(ui.el('div', { class: 'scn-flow' }, heroSticky, threadEl));

  appendBeat(sc.startBeat || sc.beats[0].id);

  // ----- beat rendering -----
  function setKeyframe(kf) {
    if (!kf) return;
    // Brief fade so the still swap reads as a scene change, not a glitch.
    hero.classList.remove('kf-in');
    heroImg.src = kf.image || '';
    heroImg.style.display = '';
    heroCaption.textContent = kf.caption || '';
    requestAnimationFrame(() => hero.classList.add('kf-in'));
  }

  function appendBeat(beatId) {
    const beat = beats[beatId];
    if (!beat) return finishScenario('good');
    visited.push(beatId);
    setKeyframe(beat.keyframe);

    const turn = ui.el('section', { class: 'scn-turn dsc-turn' });
    turn.appendChild(vicBubble(beat.prompt));

    if (beat.terminal) {
      turn.appendChild(ui.el('div', { class: 'scn-cta-bar' },
        ui.el('button', { class: 'btn primary block cta-large', on: { click: () => finishScenario(beat.outcome || 'good') } },
          ui.el('span', null, 'See your debrief'), ui.icon('arrowRight'))));
      threadEl.appendChild(turn);
      scrollToTurn(turn, beatId);
      return;
    }

    const input = discussionInput({
      consider: beat.consider,
      onSubmit: (text, forcedCls) => {
        if (activeRec) { try { activeRec.stop(); } catch (e) {} activeRec = null; }
        input.lock();
        turn.appendChild(youBubble(text));

        // A tapped "consider" chip carries its own branch (deterministic);
        // a freely-typed answer is read by keyword heuristic.
        const cls = forcedCls || classify(beat, text);
        results.push({ beatId, text, classification: cls, quality: qualityOf(cls) });
        const reply = (beat.reply && (beat.reply[cls] || beat.reply.default)) || '';
        const nextId = beat.next && (beat.next[cls] || beat.next.default);

        // Vic "types", replies, then the next beat appends below.
        const typing = vicTyping();
        turn.appendChild(typing);
        scrollToTurn(turn, beatId, true);
        setTimeout(() => {
          typing.remove();
          if (reply) turn.appendChild(vicBubble(reply));
          setTimeout(() => { if (nextId) appendBeat(nextId); else finishScenario('good'); }, 550);
        }, 900);
      }
    });
    turn.appendChild(input.el);

    threadEl.appendChild(turn);
    scrollToTurn(turn, beatId);
  }

  // First turn stays put (hero already tops the view); later turns scroll up
  // to just beneath the sticky hero (scroll-margin-top handles the offset).
  function scrollToTurn(turn, beatId, force) {
    if (visited.length <= 1 && !force) return;
    requestAnimationFrame(() => turn.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // ----- chat bubbles -----
  function vicBubble(text) {
    return ui.el('div', { class: 'dsc-msg vic' },
      ui.el('span', { class: 'dsc-avatar' }, 'V'),
      ui.el('div', { class: 'dsc-bubble' },
        ui.el('div', { class: 'dsc-author' }, 'Coach Vic'),
        ui.el('p', null, text)
      )
    );
  }
  function youBubble(text) {
    return ui.el('div', { class: 'dsc-msg me' },
      ui.el('div', { class: 'dsc-bubble' }, ui.el('p', null, text))
    );
  }
  function vicTyping() {
    return ui.el('div', { class: 'dsc-msg vic' },
      ui.el('span', { class: 'dsc-avatar' }, 'V'),
      ui.el('div', { class: 'dsc-bubble dsc-typing' },
        ui.el('span', { class: 'dot' }), ui.el('span', { class: 'dot' }), ui.el('span', { class: 'dot' }))
    );
  }

  // ----- voice + text input -----
  // Layout: the free-response box leads (it's the primary, expected way to
  // answer), with a clear "respond here" label. The optional "consider"
  // framings are demoted into a collapsed "Need a hint?" accordion below,
  // so they read as help rather than a multiple-choice menu.
  function discussionInput({ consider, onSubmit }) {
    const wrap = ui.el('div', { class: 'dsc-input' });
    let pendingCls = null;   // set when a consider chip seeds the answer

    const ta = ui.el('textarea', {
      class: 'dsc-textarea', rows: 3,
      placeholder: 'Type your response…',
      on: { input: () => { pendingCls = null; updateSend(); }, keydown: (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); }
      } }
    });

    // Prominent header so it's obvious this is where (and how) to respond.
    wrap.appendChild(ui.el('div', { class: 'dsc-input-head' },
      ui.el('span', { class: 'dsc-input-title' }, 'Your move — in your own words'),
      ui.el('span', { class: 'dsc-input-sub' }, 'Type it or tap the mic to talk. There’s no single right answer.')
    ));

    const mic = voiceButton(ta, () => { pendingCls = null; updateSend(); });
    const send = ui.el('button', { class: 'btn primary dsc-send', disabled: true, 'aria-label': 'Send response', on: { click: submit } },
      ui.el('span', { class: 'dsc-send-label' }, 'Respond'), ui.icon('send'));
    const composer = ui.el('div', { class: 'dsc-composer' },
      ui.el('div', { class: 'dsc-composer-field' }, ta, mic),
      send
    );
    wrap.appendChild(composer);

    // "Need a hint?" — collapsed accordion holding the ambiguous framings.
    if (consider && consider.length) {
      const acc = ui.el('details', { class: 'dsc-hint' });
      const sum = ui.el('summary', { class: 'dsc-hint-summary' },
        ui.icon('lightbulb'),
        ui.el('span', null, 'Stuck? A few ways to think about it'),
        ui.icon('chevron')
      );
      acc.appendChild(sum);
      const chips = ui.el('div', { class: 'dsc-consider' });
      for (const c of consider) {
        const label = typeof c === 'string' ? c : c.t;
        const cls = typeof c === 'string' ? null : c.cls;
        chips.appendChild(ui.el('button', { class: 'dsc-chip', type: 'button', on: { click: () => {
          if (ta.value.trim()) {
            ta.value = `${ta.value.trim()} ${label}`; pendingCls = null;   // appended → heuristic
          } else {
            ta.value = label; pendingCls = cls;                            // seeded → deterministic branch
          }
          acc.open = false;
          ta.focus(); updateSend();
        } } }, label));
      }
      acc.appendChild(chips);
      wrap.appendChild(acc);
    }

    function updateSend() { send.disabled = ta.value.trim().split(/\s+/).filter(Boolean).length < 2; }
    function submit() {
      const text = ta.value.trim();
      if (text.split(/\s+/).filter(Boolean).length < 2) return;
      onSubmit(text, pendingCls);
    }

    return {
      el: wrap,
      lock() {
        ta.disabled = true; send.disabled = true; mic.disabled = true;
        wrap.classList.add('is-locked');
        wrap.querySelectorAll('.dsc-chip').forEach((c) => c.disabled = true);
        wrap.querySelectorAll('.dsc-hint').forEach((d) => d.open = false);
      }
    };
  }

  // Real Web Speech API mic. Hidden entirely where unsupported (graceful
  // fallback to typing). Dictation appends to whatever's already typed.
  function voiceButton(textarea, onUpdate) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = ui.el('button', { class: 'dsc-mic', type: 'button', 'aria-label': 'Speak your answer' }, ui.icon('mic'));
    if (!SR) { btn.style.display = 'none'; return btn; }
    let listening = false, base = '';
    btn.addEventListener('click', () => {
      if (listening) { if (activeRec) { try { activeRec.stop(); } catch (e) {} } return; }
      const rec = new SR();
      activeRec = rec;
      rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
      base = textarea.value ? textarea.value.trim() + ' ' : '';
      rec.onresult = (e) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
        textarea.value = base + t;
        onUpdate();
      };
      const done = () => { listening = false; activeRec = null; btn.classList.remove('listening'); };
      rec.onend = done; rec.onerror = done;
      try { rec.start(); listening = true; btn.classList.add('listening'); } catch (e) { done(); }
    });
    return btn;
  }

  // ----- classification + scoring (mocked stand-in for a model) -----
  function classify(beat, text) {
    const t = (text || '').toLowerCase();
    let best = beat.default || 'default';
    let bestHits = 0;
    for (const [key, words] of Object.entries(beat.classify || {})) {
      let hits = 0;
      for (const w of words) if (t.includes(String(w).toLowerCase())) hits++;
      if (hits > bestHits) { bestHits = hits; best = key; }
    }
    return best;
  }

  // Good judgment / willingness to act scores high; deflecting scores low.
  function qualityOf(cls) {
    if (['act', 'direct', 'find', 'good'].includes(cls)) return 1;
    if (['confront'].includes(cls)) return 0.4;
    return 0; // defer / passive
  }

  function finishScenario(outcome) {
    if (activeRec) { try { activeRec.stop(); } catch (e) {} activeRec = null; }
    // Path quality: landing well early beats clawing back after consequences.
    const hitConsequence = visited.some((id) => ['b1b_escalate', 'b1c_worse', 'b2c_backfire'].includes(id));
    let score;
    if (outcome === 'bad') score = 0.3;
    else if (hitConsequence) score = 0.65;   // recovered, but acted late
    else score = 0.92;                       // read it right, acted early

    // Synthesize step-result entries so the completion screen stays happy.
    const stepResults = results.map((r) => ({
      stepId: r.beatId,
      text: r.text,
      outcome: r.quality >= 1 ? 'good' : r.quality > 0 ? 'ok' : 'bad',
      points: r.quality,
      assessment: { tone: r.quality >= 1 ? 'good' : 'warn', kicker: 'Your call', body: r.text }
    }));
    onFinish(score, stepResults);
  }
}
