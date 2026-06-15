// views/practice.js — Scenario engine.
// Two phases:
//   1. Welcome — orientation card that frames the practice as
//      rehearsal, not assessment ("we aren't testing you…").
//   2. Steps — per-step header (kicker, title, timer), hero, tension
//      tag, context, coach micro-hint, input (choice OR formulation
//      text/voice), and a running situational-assessment trail of
//      previous decisions.
// Composed entirely from ui.js primitives.

import { store } from '../store.js';
import * as ui from '../ui.js?v=scene-flow-42';
import * as discussion from './practice-discussion.js?v=scene-flow-42';

export function render(scenarioId) {
  // Hash may carry a ?retry=N or ?from=ka suffix. The router strips the
  // query off `path` before regex-matching, so we re-read it from the
  // live hash here.
  const [pureId, qs = ''] = String(scenarioId).split('?');
  const hashIdx = location.hash.indexOf('?');
  const hashQs = hashIdx >= 0 ? location.hash.slice(hashIdx + 1) : qs;
  const params = new URLSearchParams(hashQs);
  const retryCount = parseInt(params.get('retry') || '0', 10) || 0;
  const fromKa = params.get('from') === 'ka';
  // from=watch means the learner just finished the lesson's scene-watch flow.
  // The discussion is then "Step 2 of 2 — Share observations": we skip the
  // welcome card and drop straight into the chat with a re-watch link.
  const fromWatch = params.get('from') === 'watch';
  // When a scenario is run *as* a course lesson (slot 2), the route carries
  // courseLesson=<courseId>:<lessonId> so completion can credit the lesson.
  const [fromCourseId, fromLessonId] = (params.get('courseLesson') || '').split(':');

  const baseScenario = store.scenario(pureId);
  const root = document.createElement('section');
  if (!baseScenario) { root.appendChild(ui.el('p', { class: 'muted' }, 'Scenario not found.')); return root; }

  // Stub scenarios in the catalog don't have full welcome/step content yet.
  // Render a polite "in development" notice rather than a broken flow.
  if (!baseScenario.steps || baseScenario.steps.length === 0) {
    root.appendChild(ui.kickerPill({ icon: 'sparkle', label: 'In development' }));
    root.appendChild(ui.el('h2', { style: { margin: '0 0 8px' } }, baseScenario.title));
    root.appendChild(ui.el('p', { class: 'muted' }, baseScenario.outcomeType || ''));
    root.appendChild(ui.el('div', { class: 'card coach', style: { marginTop: '14px' } },
      ui.el('p', null, 'This scenario is part of the catalog but isn\'t fully authored yet. The Practice Hub uses it to show how the catalog scales — pick another active scenario to rehearse.')));
    root.appendChild(ui.el('a', { class: 'btn primary block', href: '#/practice', style: { marginTop: '12px' } }, 'Back to Practice Hub'));
    return root;
  }

  // Retry semantics: don't reuse canned answer order. Deterministically
  // shuffle option labels per retry attempt so the learner can't memorize
  // "third option = good" — they have to re-read each time.
  const sc = retryCount > 0 ? variantOf(baseScenario, retryCount) : baseScenario;

  const stepResults = []; // { stepId, choice|text, outcome, points, lastAssessment }
  let stepIdx = 0;
  let timer = null;
  // Persistent vitals element — created on first step that needs one,
  // then re-appended into each subsequent step's wrap. Keeping it the
  // same DOM node preserves the heart/breath animation timing across
  // step transitions.
  let vitals = null;
  let curVitals = sc.vitalsStart ? { ...sc.vitalsStart } : null;
  let dispatchEl = null; // welcome dispatch player — cancel speech on unmount
  let threadEl = null;   // scrolling thread that accumulates each step turn

  // ---------- Persistent practice chrome ----------
  // The practice mode bar is the primary cue that separates this flow from a
  // lesson: a lesson never renders one. It sits above a content area that the
  // phases render into, and it carries the single timer for the whole session
  // (created here rather than lazily per-phase so it can live in the bar).
  // The bar is identical whether the practice is standalone or embedded in a
  // course lesson — course progress belongs to the lesson flow, not here.
  timer = ui.scenarioTimer();
  const content = ui.el('div', { class: 'practice-content' });
  const bar = ui.practiceModeBar({
    timer,
    // Reuse the shell's exit logic (routes to the practice hub) — the bar
    // replaces the floating × visually but defers to the same destination.
    onExit: () => document.getElementById('exitBtn')?.click()
  });
  root.append(bar, content);

  // Practice owns the top chrome, so suppress the shell's floating × and zero
  // the fullscreen view inset (handled in CSS). Cleared on the next real route
  // change — the router has no unmount hook.
  document.body.classList.add('practice-live');
  const myPath = location.hash.split('?')[0];
  function onPracticeRouteAway() {
    if (location.hash.split('?')[0] === myPath) return;
    document.body.classList.remove('practice-live', 'practice-intro');
    window.removeEventListener('hashchange', onPracticeRouteAway);
  }
  window.addEventListener('hashchange', onPracticeRouteAway);

  function show(node) { content.replaceChildren(node); }

  // --------------------- WELCOME PHASE ---------------------
  // The pre-brief renders as a full-screen sheet in the practice bar's color,
  // so the whole screen reads as "the practice bar, expanded". On Begin the
  // sheet slides up and tucks behind the bar — the bar that persists through
  // the run is visibly the residue of this intro, which is what makes the
  // device orienting rather than a skippable splash.
  let introSheet = null;
  function renderWelcome() {
    const w = sc.welcome || {};
    const retrySuffix = retryCount > 0
      ? ` This is take ${retryCount + 1} — the prompts are the same, but the option order has been shuffled to keep the rehearsal honest.`
      : '';
    const kaPrefix = fromKa
      ? "Picking up where you left off in AlcoholEdu. "
      : '';
    const kaKicker = fromKa ? 'Knowledge Assistant · Suggested practice' : null;
    // Commitment chips: how long, how many calls to make. Set expectations
    // before the timer starts so beginning feels informed, not ambushed.
    const decisions = sc.mode === 'discussion' && sc.beats?.length
      ? `${sc.beats.length} exchanges`
      : `${sc.steps.length} decision${sc.steps.length === 1 ? '' : 's'}`;
    const meta = [sc.estMinutes ? `~${sc.estMinutes} min` : null, decisions].filter(Boolean);
    const welcomeCard = ui.scenarioWelcome({
      // The pill is the only header now — it carries "Scenario overview"
      // (not the data kickers, which still say "Module orientation").
      kicker: retryCount > 0 ? `Scenario overview · take ${retryCount + 1}` : (kaKicker || w.title || 'Scenario overview'),
      title: w.title || 'Scenario overview',
      scenarioTitle: sc.title,
      meta,
      body: kaPrefix + (w.body || sc.context) + retrySuffix,
      highlight: w.highlight,
      expectedOutcome: w.expectedOutcome || sc.outcomeType,
      ctaLabel: retryCount > 0 ? 'Begin retry' : 'Begin practice',
      onBegin: () => {
        // The clock starts once the learner commits — "Begin practice" is the
        // start of the timed run. The first run screen (dispatch call when the
        // scenario has one, otherwise the scene) renders *beneath* the sheet,
        // then the sheet lifts to reveal it.
        if (timer?.start) timer.start();
        if (sc.dispatch && typeof ui.dispatchAudio === 'function') {
          renderDispatch();
        } else {
          beginScenario();
        }
        dismissIntro();
      }
    });
    introSheet = ui.el('div', { class: 'practice-intro-sheet' }, welcomeCard);
    // While the intro is up, the bar drops its shadow so bar + sheet read as
    // one continuous surface (the shadow returns as the sheet detaches).
    document.body.classList.add('practice-intro');
    root.appendChild(introSheet);
  }

  // Lift the intro sheet up into the practice bar. The run content is already
  // rendered underneath, so the slide is a reveal, not a swap.
  function dismissIntro() {
    const sheet = introSheet;
    introSheet = null;
    document.body.classList.remove('practice-intro');
    if (!sheet) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sheet.remove();
      return;
    }
    sheet.classList.add('is-rising');
    sheet.addEventListener('transitionend', () => sheet.remove(), { once: true });
    setTimeout(() => sheet.remove(), 800); // safety net if transitionend is missed
  }

  // --------------------- DISPATCH PAGE ---------------------
  // The incoming call, on its own screen between the pre-brief and the scene.
  // Reuses the welcome card's full-height frame (CTA pinned to the bottom) so
  // the two screens read as one flow.
  function renderDispatch() {
    // Incoming-call lockup: pulsing radio mark + title + channel subtitle
    // read as one unit (who's calling), followed by the transmission and
    // the action — instead of a quiet pill, a heading, and a card all
    // competing for the same job.
    const card = ui.el('div', { class: 'scn-welcome' },
      ui.el('div', { class: 'dispatch-head' },
        ui.el('span', { class: 'dh-mark', 'aria-hidden': 'true' }, ui.icon('radio')),
        ui.el('h2', { class: 'dh-title' }, 'Incoming dispatch'),
        sc.dispatch.tag ? ui.el('small', { class: 'dh-channel' }, sc.dispatch.tag) : null
      )
    );
    // The channel is named in the lockup, so the audio card skips its own tag row.
    dispatchEl = ui.dispatchAudio({ ...sc.dispatch, tag: null });
    card.appendChild(dispatchEl);
    card.appendChild(ui.el('p', { class: 'sw-dispatch-lead' }, 'Listen to the call, then continue when you’re ready.'));
    card.appendChild(ui.el('button', { class: 'btn primary block cta-large sw-cta', on: { click: () => beginScenario() } },
      ui.el('span', null, 'Continue'),
      ui.icon('arrowRight')));
    show(card);
  }

  // Leave the framing screens and enter the scenario proper.
  function beginScenario() {
    if (dispatchEl?.stop) dispatchEl.stop();
    // Discussion-mode scenarios hand off to the branching conversation
    // engine; everything else runs the multiple-choice step engine.
    if (sc.mode === 'discussion' && sc.beats?.length) {
      startDiscussion();
    } else {
      renderStepPhase();
    }
  }

  // --------------------- DISCUSSION PHASE ---------------------
  // Hand off to the branching-conversation engine. When the learner arrived
  // straight from the lesson's scene-watch flow (from=watch), pass the 2-step
  // phase framing and a re-watch link so the chat reads as "Step 2 of 2".
  function startDiscussion() {
    let reviewHref = null, reviewPoster = null, flowTitle = null, flowKicker = null;
    if (fromWatch && fromCourseId && fromLessonId) {
      reviewHref = `#/course/${fromCourseId}/lesson/${fromLessonId}`;
      const course = store.course(fromCourseId);
      const cIdx = course?.lessons?.findIndex((l) => l.id === fromLessonId) ?? -1;
      const cLesson = cIdx >= 0 ? course.lessons[cIdx] : null;
      const vb = cLesson?.blocks?.find((b) => b.type === 'video' && b.scenes?.length);
      reviewPoster = vb?.scenes?.[0]?.poster || vb?.image || sc.beats?.[0]?.keyframe?.image || null;
      // Title = the scene-watch CTA question ("What would you do?"); kicker =
      // the same "Lesson NN of MM · Section" locator the lesson header uses.
      flowTitle = vb?.cta?.question || sc.title;
      if (cLesson) {
        const num = `Lesson ${String(cIdx + 1).padStart(2, '0')} of ${String(course.lessons.length).padStart(2, '0')}`;
        const raw = cLesson.kicker || course.title || '';
        const section = raw.replace(/^\s*Lesson\s+\d+\s*[·:-]\s*/i, '').trim();
        flowKicker = section && section.toLowerCase() !== raw.toLowerCase() ? `${num} · ${section}` : num;
      }
    }
    discussion.run({
      // Render into the content area (below the persistent mode bar), and let
      // the bar own the timer — so the discussion engine doesn't re-mount it.
      root: content, sc, timer, showTimer: false,
      flowSteps: fromWatch ? ['Watch', 'Share observations'] : null,
      flowTitle, flowKicker, reviewHref, reviewPoster,
      onFinish: (score, results) => recordAndExit(score, results)
    });
  }

  // --------------------- STEP PHASE ---------------------
  // The scenario steps through one decision at a time. A sticky, edge-to-edge
  // hero ("the scene") is pinned at the top with the patient's vitals anchored
  // directly beneath it, so a heart/breathing-rate change is always visible.
  // Each step's question fully replaces the previous one — only one set of
  // options is ever on screen, so the learner always knows the single thing
  // to do right now. (The full decision history is reconstructed on the
  // completion screen from stepResults.)
  function renderStepPhase() {
    // The hero is the scene itself — no overlay label. The step kicker below
    // already locates the learner; a "<Cohort> · scene" pill on the image was
    // redundant chrome.
    const hero = ui.scenarioMedia({
      id: sc.id,
      accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff7a3d',
      image: sc.heroImage || `assets/scenarios/${sc.id}.jpg`,
      height: 240
    });
    // The timer lives in the persistent practice bar above, not on the hero.
    const heroSticky = ui.el('div', { class: 'scn-hero-sticky' }, hero);

    // Vitals are anchored just below the image as a fixed shelf — created
    // once and updated in place. Because they never move and the rest of the
    // page swaps beneath them, an answer that shifts HR/RR reads as a real
    // change to the same readout rather than a new floating card.
    if (curVitals) {
      vitals = ui.vitalsPanel(curVitals);
      heroSticky.appendChild(ui.el('div', { class: 'scn-vitals-anchor' }, vitals));
    }

    threadEl = ui.el('div', { class: 'scn-thread' });
    show(ui.el('div', { class: 'scn-flow' }, heroSticky, threadEl));
    showStep(0);
  }

  function showStep(i) {
    stepIdx = i;
    if (i >= sc.steps.length) return finish();
    const step = sc.steps[i];

    const turn = ui.el('section', { class: 'scn-turn' });
    turn.appendChild(ui.el('div', { class: 'scn-turn-kicker' },
      step.kicker || `${sc.kicker} · Step ${i + 1} of ${sc.steps.length}`));

    // The opening step carries the scene description directly under the step
    // kicker — no separate "The scene" label (two identical kickers stacked
    // read as noise). The dimmed narrative styling does the separating.
    // Articulate steps skip this: the audience card below already states what
    // to explain, so a scene line here would just repeat the concept.
    if (i === 0 && step.input !== 'articulate') {
      turn.appendChild(ui.el('p', { class: 'scn-scene-text' }, sc.context));
    }

    // Input mode. (Choice steps no longer carry a standalone coach hint — the
    // question title is the single, clear prompt; text/articulate steps fold
    // their hint into the input field.)
    if (step.input === 'text') {
      turn.appendChild(textInput(step, i));
    } else if (step.input === 'articulate') {
      turn.appendChild(articulateInput(step, i));
    } else {
      turn.appendChild(choiceInput(step, i));
    }

    // Replace the previous step entirely — one question at a time — and reset
    // the scroll so the new question sits right beneath the anchored hero.
    threadEl.replaceChildren(turn);
    requestAnimationFrame(() => {
      const view = root.closest('.view') || document.scrollingElement;
      if (view && 'scrollTop' in view) view.scrollTop = 0;
      window.scrollTo(0, 0);
    });
  }

  // --------------------- INPUT MODES ---------------------
  function choiceInput(step, i) {
    const card = ui.el('div', { class: 'scn-choice' });
    // The question itself heads the choice card so the prompt and the
    // answers read as one bonded unit. After a pick it swaps to a
    // compact review label.
    const heading = ui.el('h2', { class: 'scn-question' }, step.title || 'Choose a response');
    card.appendChild(heading);

    const poll = ui.el('div', { class: 'poll' });

    // Two-stage CTA: tapping an option only *selects* it (the learner can
    // change their mind); "Submit answer" commits it for grading, then the
    // same button becomes "Continue". The explicit commit keeps a stray tap
    // from instantly scoring + revealing — the flow was moving too fast.
    let graded = false;
    let selected = null; // { o, wrap }
    const ctaBar = ui.el('div', { class: 'scn-cta-bar' });
    const cta = ui.el('button', { class: 'btn primary block', disabled: true, on: { click: () => {
      if (!graded) { gradePick(); }
      else { showStep(i + 1); }   // swap in the next step — replaces this one
    }}}, 'Submit answer');
    ctaBar.appendChild(cta);

    // Each option is wrapped so we can drop a "Your answer" / "Best
    // answer" label above the button without disturbing button layout.
    const wrappers = step.options.map((o) => {
      const label = ui.el('div', { class: 'scn-option-label', style: { display: 'none' } });
      const btn = ui.el('button', { type: 'button', class: 'scn-option-btn', 'aria-pressed': 'false' }, o.label);
      const wrap = ui.el('div', { class: 'scn-option' }, label, btn);
      wrap._opt = o;
      wrap._label = label;
      wrap._btn = btn;
      btn.addEventListener('click', () => onSelect(o, wrap));
      poll.appendChild(wrap);
      return wrap;
    });

    function onSelect(o, wrap) {
      if (graded) return;
      selected = { o, wrap };
      wrappers.forEach((w) => {
        const on = w === wrap;
        w.classList.toggle('is-selected', on);
        w._btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      cta.disabled = false;
    }

    function gradePick() {
      graded = true;
      const { o, wrap: pickedWrap } = selected;
      // Lock everything in.
      wrappers.forEach((w) => { w._btn.disabled = true; w.classList.remove('is-selected'); });

      const tone = o.outcome === 'good' ? 'good' : o.outcome === 'bad' ? 'bad' : 'warn';
      const best = wrappers.find((w) => w._opt.outcome === 'good');
      const correct = o.outcome === 'good';
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // The graded state is a verdict column, not an annotated list: options
      // that are neither the pick nor the best answer fade out and collapse —
      // once graded they're noise. What remains reads top → bottom as
      // "what I chose → the right call and why".
      wrappers.forEach((w) => {
        if (w !== pickedWrap && w !== best) {
          w.classList.add('is-removed');
          if (reduceMotion) w.style.display = 'none';
          else setTimeout(() => { w.style.display = 'none'; }, 280);
        }
      });

      // Mark the learner's pick with an explicit icon verdict — ✓/✗ reads
      // instantly, before color does. The .reveal class staggers the
      // entrance (pick label → best answer → why) so the grading lands as
      // a sequence instead of one jump to the final state.
      const verdictLabel = correct ? 'Your answer · correct'
        : o.outcome === 'ok' ? 'Your answer · close' : 'Your answer';
      pickedWrap.classList.add('is-picked', `t-${tone}`, 'reveal', 'as-card');
      pickedWrap._label.style.display = 'flex';
      pickedWrap._label.replaceChildren(
        ui.icon(correct ? 'check' : 'close'),
        ui.el('span', null, verdictLabel));

      // The coach's rationale fuses into the winning card — the best
      // answer's on a miss, the learner's own on a correct pick — so the
      // answer and its "why" are one object, not a card plus a floating
      // explanation. (If a step has no authored 'good' option, the pick
      // hosts the rationale.)
      const target = (correct || !best) ? pickedWrap : best;
      if (target !== pickedWrap) {
        best.classList.add('is-best', 't-good', 'reveal', 'reveal-late', 'as-card');
        best._label.style.display = 'flex';
        best._label.replaceChildren(ui.icon('check'), ui.el('span', null, 'Best answer'));
      }
      const explainBody = correct ? o.feedback : (best?._opt.feedback || o.feedback);
      target.classList.add('has-why');
      target.appendChild(ui.el('div', { class: 'scn-option-why' },
        ui.el('div', { class: 'scn-explain-head' },
          ui.el('span', { class: 'scn-explain-avatar' }, ui.icon('lightbulb')),
          ui.el('span', { class: 'scn-explain-kicker' },
            correct ? 'Why this works' : 'Why this wins')
        ),
        ui.el('p', { class: 'scn-explain-text', html: escape(explainBody) })
      ));

      // Swap the CTA to its second role. It stays disabled until the reveal
      // sequence has landed so the learner reads the result before moving on.
      cta.textContent = 'Continue';
      cta.disabled = true;
      setTimeout(() => { cta.disabled = false; }, reduceMotion ? 0 : 900);

      // Bring the verdict column into view once the removed options have
      // collapsed and the layout has settled.
      setTimeout(() => {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }, reduceMotion ? 0 : 320);

      const points = o.outcome === 'good' ? 1 : o.outcome === 'ok' ? 0.5 : 0;
      stepResults.push({
        stepId: step.id, choice: o.id, outcome: o.outcome, points,
        assessment: assessmentFor(o, step)
      });

      // Apply the option's effect on the patient: vitals shift +
      // tension reshapes the next step. Vitals update immediately so
      // the learner can see (and feel) the consequence before pressing
      // Continue.
      if (curVitals && o.vitalsDelta) {
        if (typeof o.vitalsDelta.hr === 'number') curVitals.hr = curVitals.hr + o.vitalsDelta.hr;
        if (typeof o.vitalsDelta.rr === 'number') curVitals.rr = curVitals.rr + o.vitalsDelta.rr;
        if (vitals) vitals.update(curVitals);
      }
      if (o.nextTension && sc.steps[i + 1]) {
        sc.steps[i + 1].tension = o.nextTension;
      }
    }

    card.append(poll, ctaBar);
    return card;
  }

  function textInput(step, i) {
    const card = ui.el('div', { class: 'stack' });

    // The step's directive heads the card as the question — same pattern as
    // choice steps. The old layout stacked three boxed cards (task callout,
    // input card, hint card) that all competed for attention; now there's
    // one heading and one input card with the hint folded inside it.
    if (step.prompt) card.appendChild(ui.el('h2', { class: 'scn-question' }, step.prompt));

    const fm = ui.formulationField({
      label: step.inputLabel || 'Your formulation',
      placeholder: 'Type your response…',
      voicePrompt: step.voicePrompt,
      hint: step.coachHint
    });
    card.appendChild(fm);

    const rubricBlock = ui.el('div', { style: { display: 'none' } });
    card.appendChild(rubricBlock);

    const ctaBar = ui.el('div', { class: 'scn-cta-bar' });
    const continueBtn = ui.el('button', { class: 'btn primary block', style: { display: 'none' }, on: { click: () => {
      showStep(i + 1);
    }}}, 'Continue');

    // Disabled until the learner has actually written something — an empty
    // submission grading out at "Rubric (0%)" helps no one.
    const submit = ui.el('button', { class: 'btn primary block cta-large', disabled: true, on: { click: () => {
      const txt = (fm.value() || '').toLowerCase();
      const hits = step.rubric.map((r) => ({ r, hit: matches(r, txt) }));
      const score = hits.filter((h) => h.hit).length / step.rubric.length;
      const outcome = score >= 0.7 ? 'good' : score >= 0.4 ? 'ok' : 'bad';

      rubricBlock.style.display = 'block';
      rubricBlock.className = 'reveal-block';
      rubricBlock.replaceChildren(
        ui.el('div', { class: 'card' },
          ui.el('p', { class: 'tiny muted' },
            ui.el('strong', null, `Rubric (${Math.round(score*100)}%) — `),
            'Coach Vic checked your answer against six anchor points:'
          ),
          ui.el('ul', { class: 'list-tight' },
            ...hits.map((h) =>
              ui.el('li', { style: { color: h.hit ? 'var(--good)' : 'var(--bad)' } },
                `${h.hit ? '✓' : '–'} ${h.r}`)
            )
          ),
          ui.coachMessage({ title: 'Model answer', text: step.modelAnswer, footer: '— Coach Vic' })
        )
      );

      stepResults.push({
        stepId: step.id,
        text: fm.value(),
        outcome,
        points: score,
        assessment: { tone: outcome === 'good' ? 'good' : outcome === 'bad' ? 'warn' : 'info',
                      kicker: 'Situational assessment',
                      body: outcome === 'good'
                        ? 'Clean response. The receiving end has what it needs to act.'
                        : outcome === 'ok'
                          ? 'Workable, but missing anchor points. The receiving end will need to ask follow-ups.'
                          : 'Not enough signal. Re-anchor on the rubric points before the next handoff.' }
      });

      submit.style.display = 'none';
      continueBtn.style.display = 'block';
      requestAnimationFrame(() => {
        rubricBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }}}, ui.el('span', null, 'Submit formulation'), ui.icon('arrowRight'));

    fm.input.addEventListener('input', () => {
      submit.disabled = fm.value().trim().length === 0;
    });

    ctaBar.append(submit, continueBtn);
    card.appendChild(ctaBar);
    return card;
  }

  // articulate — explain a concept to a specific audience (expert /
  // beginner / outsider) using voice (preferred) or typing. We mock the
  // AI analysis with keyword + length heuristics keyed to the audience,
  // but the UX matches what a real model-backed flow would look like.
  function articulateInput(step, i) {
    const card = ui.el('div', { class: 'stack' });

    let captured = '';
    const mic = ui.articulationMic({
      audienceLabel: step.audience === 'expert' ? 'Listening — peer mode'
        : step.audience === 'beginner' ? 'Listening — trainee mode'
        : 'Listening — outsider mode',
      onChange: (t) => { captured = t; submit.disabled = (t.split(/\s+/).filter(Boolean).length < 4); }
      // No coach hint here — the audience header above carries the framing,
      // so the capture area stays a single clear instruction.
    });

    // Audience framing + voice capture read as one bonded unit: the audience
    // header sits flush at the top, a hairline divides it from the mic below.
    card.appendChild(ui.el('div', { class: 'articulate-unit' },
      ui.audienceCard({ audience: step.audience, concept: step.concept }),
      mic
    ));

    const feedbackSlot = ui.el('div');
    card.appendChild(feedbackSlot);

    const ctaBar = ui.el('div', { class: 'scn-cta-bar' });
    const continueBtn = ui.el('button', { class: 'btn primary block', style: { display: 'none' }, on: { click: () => {
      showStep(i + 1);
    }}}, 'Continue');

    const submit = ui.el('button', { class: 'btn primary block cta-large', disabled: true, on: { click: () => {
      mic.stop?.();
      const text = (mic.value?.() || captured || '').trim();
      const analysis = analyzeArticulation(text, step);
      feedbackSlot.replaceChildren(renderArticulationFeedback(text, analysis, step));

      stepResults.push({
        stepId: step.id,
        text,
        audience: step.audience,
        outcome: analysis.outcome,
        points: analysis.points,
        assessment: {
          tone: analysis.outcome === 'good' ? 'good' : analysis.outcome === 'bad' ? 'warn' : 'info',
          kicker: `Articulation · ${capitalize(step.audience)}`,
          body: analysis.summary
        }
      });

      submit.style.display = 'none';
      continueBtn.style.display = 'block';
      feedbackSlot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }}}, ui.el('span', null, 'Submit explanation'), ui.icon('arrowRight'));

    ctaBar.append(submit, continueBtn);
    card.appendChild(ctaBar);
    return card;
  }

  // --------------------- FINISH ---------------------
  // Shared exit used by both the step engine and the discussion engine:
  // stop timers, record the attempt, credit any owning lesson, and route to
  // the completion screen.
  function recordAndExit(score, results) {
    if (timer?.stop) timer.stop();
    if (vitals?.stop) vitals.stop();
    if (dispatchEl?.stop) dispatchEl.stop();
    store.recordPractice({
      scenarioId: sc.id,
      courseId:   sc.courseId,
      concepts:   sc.concepts,
      score,
      stepResults: results,
      elapsed:    timer?.elapsed?.() ?? 0,
      retryCount,
      at: Date.now()
    });
    if (fromCourseId && fromLessonId) {
      store.markLessonComplete(fromCourseId, fromLessonId);
    }
    location.hash = '#/practice-complete';
  }

  function finish() {
    const total = stepResults.reduce((s, r) => s + r.points, 0);
    recordAndExit(total / sc.steps.length, stepResults);
  }

  // Coming from the scene-watch flow, the welcome card is redundant — the
  // learner was just framed by the pre-roll — so drop straight into the chat.
  if (fromWatch && sc.mode === 'discussion' && sc.beats?.length) {
    if (timer?.start) timer.start();
    startDiscussion();
  } else {
    renderWelcome();
  }
  return root;
}

// --------------------- helpers ---------------------

function assessmentFor(option, step) {
  const tone = option.outcome === 'good' ? 'good' : option.outcome === 'bad' ? 'warn' : 'info';
  return {
    tone,
    kicker: 'Situational assessment',
    body: option.feedback
  };
}

// Cheap rubric matcher — keyword groups per criterion. Stubbed; in
// production a model + retrieval would live here. The visible structure
// of the rubric is what matters for the demo.
function matches(criterion, text) {
  const k = criterion.toLowerCase();
  const groups = [
    [/location|mile|sb|nb/, /location|mile|sb|nb|i-?\d+|miles? \d+|southbound|northbound/],
    [/un number|product/,   /un[- ]?\d+|1203|gasoline|product/],
    [/hazard|leak|vapor/,   /leak|vapor|fire|smoke|fume/],
    [/wind/,                /wind|sw|nw|se|ne|south[- ]?west|north[- ]?west|knots|mph|ten/],
    [/isolation/,           /50 ?m|fifty meter|isolat|stand[ -]?off|perimeter/],
    [/resource/,            /hazmat|engine|pd|police|ems|requesting|backup/],
    [/lactate/,             /lactate/],
    [/cultures/,            /cultures?/],
    [/antibiotics/,         /antibiotic|broad[- ]?spectrum/],
    [/crystalloid|fluids/,  /fluids?|crystalloid|30 ?ml|thirty/],
    [/vasopressor|norepine/,/vasopressor|norepi/]
  ];
  for (const [hint, regex] of groups) {
    if (hint.test(k)) return regex.test(text);
  }
  return text.length > 30;
}

function escape(s) { return String(s).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

function capitalize(s) { return String(s || '').replace(/^./, (c) => c.toUpperCase()); }

// analyzeArticulation — stand-in for a model-backed scoring pass. The
// authored step provides:
//   audience: 'expert' | 'beginner' | 'outsider'
//   jargon:   words that signal in-the-know terminology
//   keyPoints: must-hit anchor concepts (kept as plain strings; we match
//              with cheap regexes via matches() below)
// We score along three axes — depth, jargon load, and coverage — and
// map them to a verdict. The verdict copy is built per audience because
// "too advanced" means opposite things to a peer vs. an outsider.
function analyzeArticulation(text, step) {
  const t = (text || '').toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const wc = words.length;

  const jargonList = step.jargon || [];
  const jargonHits = jargonList.filter((w) => new RegExp(`\\b${w.toLowerCase()}\\b`).test(t));

  const keyPoints = step.keyPoints || [];
  const pointHits = keyPoints.map((p) => ({ point: p, hit: matches(p, t) }));
  const coverage = keyPoints.length ? pointHits.filter((p) => p.hit).length / keyPoints.length : 0.5;

  const jargonRate = jargonList.length ? jargonHits.length / jargonList.length : 0;

  let verdict, outcome, summary;
  const aud = step.audience;
  const missed = pointHits.filter((p) => !p.hit).map((p) => p.point);

  if (wc < 12) {
    verdict = 'too-thin';
    outcome = 'bad';
    summary = 'Too short to land the idea. Try again with a couple of complete sentences.';
  } else if (aud === 'expert') {
    if (coverage >= 0.6 && jargonRate >= 0.3) {
      verdict = 'on-target'; outcome = 'good';
      summary = 'Sharp. You spoke at peer level and hit the anchor points an expert listener expects.';
    } else if (jargonRate < 0.15) {
      verdict = 'too-simple'; outcome = 'ok';
      summary = 'A peer would tune out — you stayed on the surface. Use the precise terms and skip the basics.';
    } else if (coverage < 0.5) {
      verdict = 'missed-context'; outcome = 'ok';
      summary = `You sounded credible but skipped key anchors: ${missed.slice(0,2).join(', ')}.`;
    } else {
      verdict = 'on-target'; outcome = 'good';
      summary = 'Solid peer-level framing.';
    }
  } else if (aud === 'beginner') {
    if (jargonRate > 0.6) {
      verdict = 'too-advanced'; outcome = 'bad';
      summary = 'A new trainee would be lost — too much jargon. Swap acronyms for plain words.';
    } else if (coverage >= 0.5 && jargonRate <= 0.4 && wc >= 25) {
      verdict = 'on-target'; outcome = 'good';
      summary = 'Clean. Plain language, the right anchor points, and enough scaffolding for a beginner.';
    } else if (coverage < 0.4) {
      verdict = 'missed-context'; outcome = 'ok';
      summary = `You went easy on jargon but skipped the why: ${missed.slice(0,2).join(', ')}.`;
    } else {
      verdict = 'on-target'; outcome = 'good';
      summary = 'Workable explanation for a new trainee.';
    }
  } else { // outsider
    if (jargonRate > 0.35) {
      verdict = 'too-advanced'; outcome = 'bad';
      summary = 'Someone outside the field would bounce off the jargon. Translate every acronym.';
    } else if (wc < 25) {
      verdict = 'too-simple'; outcome = 'ok';
      summary = 'A friend would still ask "but why does it matter?" Add the stakes.';
    } else if (coverage >= 0.4 && jargonRate <= 0.2) {
      verdict = 'on-target'; outcome = 'good';
      summary = 'Nice — plain-language, and you named why this matters outside your industry.';
    } else if (coverage < 0.3) {
      verdict = 'missed-context'; outcome = 'ok';
      summary = `You kept it accessible but skipped the stakes: ${missed.slice(0,2).join(', ')}.`;
    } else {
      verdict = 'on-target'; outcome = 'good';
      summary = 'Lands for an outsider.';
    }
  }

  const points = outcome === 'good' ? 1 : outcome === 'ok' ? 0.6 : 0.2;
  return { verdict, outcome, summary, pointHits, jargonHits, wc, points };
}

function verdictLabel(v) {
  return {
    'too-simple':     'Too simple',
    'too-advanced':   'Too advanced',
    'missed-context': 'Missed key context',
    'too-thin':       'Too thin',
    'on-target':      'On target'
  }[v] || v;
}

function renderArticulationFeedback(text, analysis, step) {
  const tone = analysis.outcome === 'good' ? 'good' : analysis.outcome === 'bad' ? 'bad' : 'warn';
  const wrap = document.createElement('div');
  wrap.className = `art-feedback t-${tone}`;

  const head = document.createElement('div');
  head.className = 'af-head';
  const verdict = document.createElement('span');
  verdict.className = 'af-verdict';
  verdict.textContent = verdictLabel(analysis.verdict);
  head.appendChild(verdict);
  const title = document.createElement('p');
  title.className = 'af-title';
  title.textContent = analysis.outcome === 'good' ? 'Coach Vic — that landed' : 'Coach Vic heard the gaps';
  head.appendChild(title);
  wrap.appendChild(head);

  const body = document.createElement('p');
  body.className = 'af-body';
  body.textContent = analysis.summary;
  wrap.appendChild(body);

  if (analysis.pointHits && analysis.pointHits.length) {
    const ul = document.createElement('ul');
    ul.className = 'af-hits';
    analysis.pointHits.forEach((p) => {
      const li = document.createElement('li');
      li.className = p.hit ? 'hit' : 'miss';
      const mark = document.createElement('span');
      mark.className = 'af-mark';
      mark.textContent = p.hit ? '✓' : '·';
      const span = document.createElement('span');
      span.textContent = p.point;
      li.append(mark, span);
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
  }

  if (text) {
    const q = document.createElement('div');
    q.className = 'art-quote';
    q.textContent = '"' + text + '"';
    wrap.appendChild(q);
  }

  return wrap;
}

// variantOf — return a clone of the scenario with options reordered
// using a deterministic shuffle keyed on the retry count. The seed is
// per-step so different steps get different orders, but the same
// retry/scenario combo always reproduces. Prevents canned-answer
// memorization on retry without forcing an authoring rewrite.
function variantOf(scenario, attempt) {
  const clone = JSON.parse(JSON.stringify(scenario));
  for (let i = 0; i < clone.steps.length; i++) {
    const step = clone.steps[i];
    if (!step.options) continue;
    const seed = hash(`${scenario.id}:${step.id}:${attempt}`);
    step.options = shuffle(step.options.slice(), seed);
  }
  return clone;
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function shuffle(arr, seed) {
  // Mulberry32 PRNG seeded by hash, Fisher–Yates shuffle.
  let s = seed >>> 0;
  const rand = () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
