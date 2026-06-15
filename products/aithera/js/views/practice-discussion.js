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

import * as ui from '../ui.js?v=scene-flow-42';

export function run({ root, sc, timer, onFinish, flowSteps = null, flowTitle = null, flowKicker = null, reviewHref = null, reviewPoster = null, showTimer = true }) {
  // When launched as the "Step 2 of 2" tail of the scene-watch flow, the
  // engine drops its big sticky keyframe hero in favour of a compact header
  // (kicker + title + 2-step phase bar) and a re-watch card. Otherwise it runs
  // the original sticky-hero conversation shell.
  const isFlow = !!flowSteps;
  const beats = Object.fromEntries((sc.beats || []).map((b) => [b.id, b]));
  const results = [];        // one entry per answered beat (for the debrief)
  const visited = [];        // beat ids in order, to score path quality
  let activeRec = null;      // live SpeechRecognition, so we can stop on advance

  // The router has no unmount hook (it just swaps the view's DOM), so a learner
  // who leaves mid-scenario would otherwise leave the mic hot and the timer
  // ticking. Stop both on the next real route change (ignore same-route query
  // rewrites like the profile-slug append).
  const myPath = location.hash.split('?')[0];
  function onRouteAway() {
    if (location.hash.split('?')[0] === myPath) return;
    if (activeRec) { try { activeRec.stop(); } catch (e) {} activeRec = null; }
    if (timer && timer.stop) { try { timer.stop(); } catch (e) {} }
    window.removeEventListener('hashchange', onRouteAway);
  }
  window.addEventListener('hashchange', onRouteAway);

  // ----- sticky keyframe hero (standard mode only) -----
  let heroImg = null, heroCaption = null, hero = null;
  const threadEl = ui.el('div', { class: 'scn-thread scn-discussion' });

  if (isFlow) {
    // Flow header: back + kicker + title + 2-step phase bar (current = step 2),
    // then a compact "review again" card linking back to the scene-watch flow.
    const top = ui.el('div', { class: 'dsc-flow-top' });
    const headRow = ui.el('div', { class: 'scene-head-row' });
    if (reviewHref) {
      const back = ui.el('button', { class: 'scene-back', 'aria-label': 'Back to scenes', on: { click: () => { location.hash = reviewHref; } } });
      back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>';
      headRow.appendChild(back);
    }
    if (flowKicker) headRow.appendChild(ui.el('div', { class: 'ch-kicker' }, ui.el('div', null, flowKicker)));
    const header = ui.el('header', { class: 'lesson-head scene-watch-head' },
      headRow,
      ui.el('h2', { class: 'ch-title' }, flowTitle || sc.title || 'Share what you observed'),
      ui.phaseBar({ steps: flowSteps, current: flowSteps.length - 1 }),
      // When the practice mode bar owns the timer (showTimer:false), don't
      // re-parent it here — that would steal the node out of the bar.
      showTimer ? ui.el('div', { class: 'scn-hero-timer dsc-flow-timer' }, timer) : null
    );
    top.appendChild(header);
    if (reviewHref) top.appendChild(reviewCard());
    root.replaceChildren(ui.el('div', { class: 'scn-flow scn-flow-chat' }, top, threadEl));
  } else {
    heroImg = ui.el('img', { class: 'scn-hero-photo', alt: '', decoding: 'async' });
    heroImg.addEventListener('error', () => heroImg.style.display = 'none');
    heroCaption = ui.el('div', { class: 'scn-kf-caption' });
    hero = ui.el('div', { class: 'scn-hero has-photo scn-kf', style: { height: '240px' } },
      heroImg,
      ui.el('span', { class: 'scn-hero-scrim', 'aria-hidden': 'true' }),
      heroCaption
    );
    const heroSticky = ui.el('div', { class: 'scn-hero-sticky' }, hero,
      showTimer ? ui.el('div', { class: 'scn-hero-timer' }, timer) : null);
    root.replaceChildren(ui.el('div', { class: 'scn-flow' }, heroSticky, threadEl));
  }

  // Entry: from the scene-watch flow we play a short "Coach Vic is setting up"
  // loader, then let the first beat arrive conversationally (Vic types the
  // question, then the composer slides in) — so the hand-off from "What would
  // you do?" reads as Vic asking live, not a form blinking into existence.
  // The standalone (non-flow) shell keeps its instant entry.
  if (isFlow) showEntryLoader(sc.startBeat || sc.beats[0].id);
  else appendBeat(sc.startBeat || sc.beats[0].id);

  // Brief loading beat between the previous page and the conversation.
  function showEntryLoader(beatId) {
    const loader = ui.el('div', { class: 'dsc-entry-loader' },
      ui.el('span', { class: 'dsc-loader-spinner', 'aria-hidden': 'true' }),
      ui.el('p', { class: 'dsc-loader-text' }, 'Coach Vic is reviewing the scene…')
    );
    threadEl.appendChild(loader);
    setTimeout(() => { loader.remove(); appendBeat(beatId, true); }, 1300);
  }

  // Re-watch card shown atop the chat when entered from the scene-watch flow.
  function reviewCard() {
    const thumb = ui.el('div', { class: 'dsc-review-thumb' });
    if (reviewPoster) {
      const img = ui.el('img', { class: 'dsc-review-img', src: reviewPoster, alt: '', decoding: 'async' });
      img.addEventListener('error', () => { img.style.display = 'none'; });
      thumb.appendChild(img);
    }
    thumb.appendChild(ui.el('span', { class: 'dsc-review-play' }, ui.icon('play')));
    const card = ui.el('button', { class: 'dsc-review-card', type: 'button', on: { click: () => { location.hash = reviewHref; } } },
      thumb,
      ui.el('p', { class: 'dsc-review-text' }, 'Need to review again? Tap the play button to re-visit all scenes.')
    );
    return card;
  }

  // ----- beat rendering -----
  function setKeyframe(kf) {
    if (!kf || !hero) return;   // flow mode has no keyframe hero
    // Brief fade so the still swap reads as a scene change, not a glitch.
    hero.classList.remove('kf-in');
    heroImg.src = kf.image || '';
    heroImg.style.display = '';
    heroCaption.textContent = kf.caption || '';
    requestAnimationFrame(() => hero.classList.add('kf-in'));
  }

  function appendBeat(beatId, animate = false) {
    const beat = beats[beatId];
    if (!beat) return finishScenario('good');
    visited.push(beatId);
    setKeyframe(beat.keyframe);

    const turn = ui.el('section', { class: 'scn-turn dsc-turn' });
    threadEl.appendChild(turn);

    // showPrompt drops Vic's question(s) and the learner's response affordance
    // into the turn. A beat's `prompt` may be a single string or an array of
    // messages — the array reads as Vic sending a few texts in a row. When
    // `animate` is set (the entry beat from the scene-watch flow), Vic "types"
    // each message in turn and the composer fades in just after the last one
    // lands, so the moment reads as a live ask rather than a form.
    function showPrompt() {
      const msgs = Array.isArray(beat.prompt) ? beat.prompt : [beat.prompt];

      // Mount the response affordance (or terminal CTA) once Vic has finished.
      function afterPrompt() {
        if (beat.terminal) {
          turn.appendChild(ui.el('div', { class: 'scn-cta-bar' },
            ui.el('button', { class: 'btn primary block cta-large', on: { click: () => finishScenario(beat.outcome || 'good') } },
              ui.el('span', null, 'See your debrief'), ui.icon('arrowRight'))));
          scrollToTurn(turn, beatId, animate);
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
            const reply = (beat.reply && (beat.reply[cls] || beat.reply.default)) || '';
            const nextId = beat.next && (beat.next[cls] || beat.next.default);
            // Keep the coaching reply with the result so the debrief can surface a
            // real per-decision insight (results key off beat ids, not sc.steps).
            results.push({ beatId, text, classification: cls, quality: qualityOf(cls), coaching: reply });

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

        if (animate) {
          input.el.classList.add('dsc-fade-in');
          // Hold the composer back a beat so it lands after the last message.
          setTimeout(() => { turn.appendChild(input.el); scrollToTurn(turn, beatId, true); }, 480);
        } else {
          turn.appendChild(input.el);
          scrollToTurn(turn, beatId);
        }
      }

      if (animate) {
        // Type each message in sequence: a typing beat, then the bubble.
        let i = 0;
        const step = () => {
          if (i >= msgs.length) return afterPrompt();
          const typing = vicTyping();
          turn.appendChild(typing);
          scrollToTurn(turn, beatId, true);
          setTimeout(() => {
            typing.remove();
            const b = vicBubble(msgs[i], i > 0);
            b.classList.add('dsc-fade-in');
            turn.appendChild(b);
            i++;
            setTimeout(step, 450);
          }, i === 0 ? 1100 : 700);
        };
        step();
      } else {
        msgs.forEach((m, idx) => turn.appendChild(vicBubble(m, idx > 0)));
        afterPrompt();
      }
    }

    showPrompt();
  }

  // First turn stays put (hero already tops the view); later turns scroll up
  // to just beneath the sticky hero (scroll-margin-top handles the offset).
  function scrollToTurn(turn, beatId, force) {
    if (visited.length <= 1 && !force) return;
    requestAnimationFrame(() => turn.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // ----- chat bubbles -----
  // grouped = a follow-on message from Vic in the same run (stacked text-style):
  // drops the avatar + "Coach Vic" label and tucks up under the prior bubble.
  function vicBubble(text, grouped = false) {
    const avatar = grouped
      ? ui.el('span', { class: 'dsc-avatar dsc-avatar-spacer', 'aria-hidden': 'true' })
      : ui.el('span', { class: 'dsc-avatar' }, 'V');
    const bubble = ui.el('div', { class: 'dsc-bubble' });
    if (!grouped) bubble.appendChild(ui.el('div', { class: 'dsc-author' }, 'Coach Vic'));
    bubble.appendChild(ui.el('p', null, text));
    return ui.el('div', { class: `dsc-msg vic${grouped ? ' is-grouped' : ''}` }, avatar, bubble);
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

    const mic = voiceButton(ta, () => { pendingCls = null; updateSend(); });
    const send = ui.el('button', { class: 'btn primary dsc-send', disabled: true, 'aria-label': 'Send response', on: { click: submit } },
      ui.el('span', { class: 'dsc-send-label' }, 'Respond'), ui.icon('send'));
    const composer = ui.el('div', { class: 'dsc-composer' },
      ui.el('div', { class: 'dsc-composer-field' }, ta, mic),
      send
    );
    wrap.appendChild(composer);

    // Tell the learner why Respond is greyed out, rather than leaving a dead button.
    const sendHint = ui.el('p', { class: 'dsc-send-hint', hidden: true }, 'A couple more words and you can respond.');
    wrap.appendChild(sendHint);

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

    function updateSend() {
      const words = ta.value.trim().split(/\s+/).filter(Boolean).length;
      send.disabled = words < 2;
      sendHint.hidden = words !== 1;   // show guidance once they've started typing
    }
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
    const btn = ui.el('button', { class: 'dsc-mic', type: 'button', 'aria-label': 'Speak your answer' }, ui.icon('mic'));
    // The composer dictates into whatever's already typed: createDictation owns
    // the Web Speech engine, we just append its transcript to `base`.
    let base = '';
    const dictation = ui.createDictation({
      onTranscript: (finalText, interimText) => {
        textarea.value = (base + finalText + (interimText ? ' ' + interimText : '')).trim();
        onUpdate();
      },
      onStop: () => { btn.classList.remove('listening'); if (activeRec === dictation) activeRec = null; },
    });
    if (!dictation) { btn.style.display = 'none'; return btn; }   // type-only fallback
    btn.addEventListener('click', () => {
      if (dictation.recording) { dictation.stop(); return; }
      base = textarea.value ? textarea.value.trim() + ' ' : '';
      dictation.reset();   // each take appends to `base`, not to the prior take
      activeRec = dictation;
      dictation.start();
      btn.classList.add('listening');
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
      // insight/indicator let summary.generateInsights build a debrief card for
      // discussion runs, whose ids never match sc.steps.
      insight: r.coaching || '',
      indicator: 'Judgment in the moment',
      assessment: { tone: r.quality >= 1 ? 'good' : 'warn', kicker: 'Your call', body: r.text }
    }));
    onFinish(score, stepResults);
  }
}
