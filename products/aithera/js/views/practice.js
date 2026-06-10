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
import * as ui from '../ui.js?v=scene-flow-1';
import * as discussion from './practice-discussion.js?v=scene-flow-1';

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

  function show(node) { root.replaceChildren(node); }

  // --------------------- WELCOME PHASE ---------------------
  function renderWelcome() {
    const w = sc.welcome || {};
    const retrySuffix = retryCount > 0
      ? ` This is take ${retryCount + 1} — the prompts are the same, but the option order has been shuffled to keep the rehearsal honest.`
      : '';
    const kaPrefix = fromKa
      ? "Picking up where you left off in AlcoholEdu. "
      : '';
    const kaKicker = fromKa ? 'Knowledge Assistant · Suggested practice' : null;
    const welcomeCard = ui.scenarioWelcome({
      kicker: retryCount > 0 ? `Module orientation · take ${retryCount + 1}` : (kaKicker || w.kicker || sc.kicker || 'Module orientation'),
      title: w.title || 'Scenario overview',
      body: kaPrefix + (w.body || sc.context) + retrySuffix,
      highlight: w.highlight,
      reassurance: w.reassurance,
      expectedOutcome: w.expectedOutcome || sc.outcomeType,
      ctaLabel: retryCount > 0 ? 'Begin retry' : 'Begin practice',
      onBegin: () => {
        if (dispatchEl?.stop) dispatchEl.stop();
        // Discussion-mode scenarios hand off to the branching conversation
        // engine; everything else runs the multiple-choice step engine.
        if (sc.mode === 'discussion' && sc.beats?.length) {
          startDiscussion();
        } else {
          renderStepPhase();
        }
      }
    });
    // Dispatch audio sits inside the welcome card, just above the CTA,
    // so the learner hears the call before committing to the scene.
    if (sc.dispatch && typeof ui.dispatchAudio === 'function') {
      dispatchEl = ui.dispatchAudio(sc.dispatch);
      const cta = welcomeCard.querySelector('.sw-cta');
      if (cta) welcomeCard.insertBefore(dispatchEl, cta);
      else welcomeCard.appendChild(dispatchEl);
    }
    show(welcomeCard);
  }

  // --------------------- DISCUSSION PHASE ---------------------
  // Hand off to the branching-conversation engine. When the learner arrived
  // straight from the lesson's scene-watch flow (from=watch), pass the 2-step
  // phase framing and a re-watch link so the chat reads as "Step 2 of 2".
  function startDiscussion() {
    if (!timer) timer = ui.scenarioTimer();
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
      root, sc, timer,
      flowSteps: fromWatch ? ['Watch', 'Share observations'] : null,
      flowTitle, flowKicker, reviewHref, reviewPoster,
      onFinish: (score, results) => recordAndExit(score, results)
    });
  }

  // --------------------- STEP PHASE ---------------------
  // The scenario plays out as a scrolling thread: a sticky, edge-to-edge
  // hero ("the scene") is pinned at the top, and each step is appended
  // below it as a "turn". Answering a step locks it in place and reveals
  // the next turn underneath — so the full history stays scrollable rather
  // than being replaced on every Continue.
  function renderStepPhase() {
    if (!timer) timer = ui.scenarioTimer();
    const hero = ui.scenarioMedia({
      id: sc.id,
      label: sc.industry === 'healthcare' ? 'Emergency Department · triage' : 'I-95 · scene',
      accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff7a3d',
      image: sc.heroImage || `assets/scenarios/${sc.id}.jpg`,
      height: 240
    });
    const heroSticky = ui.el('div', { class: 'scn-hero-sticky' },
      hero,
      ui.el('div', { class: 'scn-hero-timer' }, timer)
    );
    threadEl = ui.el('div', { class: 'scn-thread' });
    show(ui.el('div', { class: 'scn-flow' }, heroSticky, threadEl));
    appendStep(0);
  }

  function appendStep(i) {
    stepIdx = i;
    if (i >= sc.steps.length) return finish();
    const step = sc.steps[i];

    const turn = ui.el('section', { class: 'scn-turn' });
    turn.appendChild(ui.el('div', { class: 'scn-turn-kicker' },
      step.kicker || `${sc.kicker} · Step ${i + 1} of ${sc.steps.length}`));

    // The opening turn carries the scene description. The hero image that
    // used to live here now sits in the persistent sticky header above.
    if (i === 0) {
      turn.appendChild(ui.el('div', { class: 'scn-scene-kicker' }, 'The scene'));
      turn.appendChild(ui.el('p', { class: 'scn-scene-text' }, sc.context));
    }

    // Live vitals — same persistent node re-attached so it tracks the
    // active turn (healthcare scenarios only).
    if (curVitals) {
      if (!vitals) vitals = ui.vitalsPanel(curVitals);
      else vitals.update(curVitals);
      turn.appendChild(vitals);
    }

    // Coach micro-hint for choice steps (text/articulate fold it into the
    // input field themselves).
    if (step.coachHint && step.input !== 'text' && step.input !== 'articulate') {
      turn.appendChild(ui.el('div', { class: 'scn-task-hint scn-standalone-hint' },
        ui.el('span', { class: 'scn-task-hint-avatar' }, ui.icon('lightbulb')),
        ui.el('p', null, step.coachHint)));
    }

    // Input mode.
    if (step.input === 'text') {
      if (step.prompt) turn.appendChild(ui.scenarioPrompt({ text: step.prompt }));
      turn.appendChild(textInput(step, i));
    } else if (step.input === 'articulate') {
      turn.appendChild(articulateInput(step, i));
    } else {
      turn.appendChild(choiceInput(step, i));
    }

    threadEl.appendChild(turn);
    // Bring each new turn up to just beneath the sticky hero. The opening
    // turn stays put (the hero is already at the top).
    if (i > 0) {
      requestAnimationFrame(() => turn.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
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

    // Explanation card — appears after a pick. More prominent than the
    // old single-line feedback: full-width, larger type, has room to
    // breathe.
    const explain = ui.el('div', { class: 'scn-explain', style: { display: 'none' } });

    const ctaBar = ui.el('div', { class: 'scn-cta-bar' });
    const cta = ui.el('button', { class: 'btn primary block', disabled: true, on: { click: () => {
      ctaBar.remove();        // drop the Continue bar; the next turn appends below
      appendStep(i + 1);
    }}}, 'Continue');
    ctaBar.appendChild(cta);

    // Each option is wrapped so we can drop a "Your answer" / "Best
    // answer" label above the button without disturbing button layout.
    const wrappers = step.options.map((o) => {
      const label = ui.el('div', { class: 'scn-option-label', style: { display: 'none' } });
      const btn = ui.el('button', { type: 'button', class: 'scn-option-btn' }, o.label);
      const wrap = ui.el('div', { class: 'scn-option' }, label, btn);
      wrap._opt = o;
      wrap._label = label;
      wrap._btn = btn;
      btn.addEventListener('click', () => onPick(o, wrap));
      poll.appendChild(wrap);
      return wrap;
    });

    function onPick(o, pickedWrap) {
      // Lock everything in.
      wrappers.forEach((w) => { w._btn.disabled = true; });

      const tone = o.outcome === 'good' ? 'good' : o.outcome === 'bad' ? 'bad' : 'warn';
      const best = wrappers.find((w) => w._opt.outcome === 'good');
      const correct = o.outcome === 'good';

      // Mark the learner's pick.
      pickedWrap.classList.add('is-picked', `t-${tone}`);
      pickedWrap._label.style.display = 'block';
      pickedWrap._label.textContent = correct ? 'Your answer · correct' : 'Your answer';

      // Reveal the best answer if they didn't pick it.
      if (!correct && best && best !== pickedWrap) {
        best.classList.add('is-best', 't-good');
        best._label.style.display = 'block';
        best._label.textContent = 'Best answer';
      }

      // Collapse the others.
      wrappers.forEach((w) => {
        if (w !== pickedWrap && !(w.classList.contains('is-best'))) {
          w.classList.add('is-hidden');
        }
      });

      // Move the learner's pick to the top so the comparison reads
      // "Your answer" → "Best answer" top-to-bottom.
      if (!correct && best && best !== pickedWrap) {
        poll.insertBefore(pickedWrap, poll.firstChild);
      }

      // Tighten the section header now that we're in review mode — the
      // question heading shrinks to a compact review kicker.
      heading.textContent = correct ? 'Nice work' : 'Review';
      heading.classList.add('is-review');

      // Render the explanation card.
      explain.className = `scn-explain t-${tone}`;
      explain.style.display = 'block';
      explain.replaceChildren(
        ui.el('div', { class: 'scn-explain-head' },
          ui.el('span', { class: 'scn-explain-avatar' }, ui.icon('lightbulb')),
          ui.el('span', { class: 'scn-explain-kicker' },
            correct ? 'Why this works' : 'Why the best answer wins')
        ),
        ui.el('p', { class: 'scn-explain-text', html: escape(o.feedback) })
      );
      if (!correct && best && best !== pickedWrap && best._opt.feedback) {
        explain.appendChild(ui.el('p', { class: 'scn-explain-best' },
          ui.el('strong', null, 'Best answer: '),
          ui.el('span', { html: escape(best._opt.feedback) })
        ));
      }

      cta.disabled = false;

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

    card.append(poll, explain, ctaBar);
    return card;
  }

  function textInput(step, i) {
    const card = ui.el('div', { class: 'stack' });
    const fm = ui.formulationField({
      label: step.inputLabel || 'Your formulation',
      placeholder: 'Type your response…',
      voicePrompt: step.voicePrompt
    });
    card.appendChild(fm);

    if (step.coachHint) card.appendChild(ui.coachHint({ text: step.coachHint }));

    const rubricBlock = ui.el('div', { style: { display: 'none' } });
    card.appendChild(rubricBlock);

    const ctaBar = ui.el('div', { class: 'scn-cta-bar' });
    const continueBtn = ui.el('button', { class: 'btn primary block', style: { display: 'none' }, on: { click: () => {
      ctaBar.remove(); appendStep(i + 1);
    }}}, 'Continue');

    const submit = ui.el('button', { class: 'btn primary block cta-large', on: { click: () => {
      const txt = (fm.value() || '').toLowerCase();
      const hits = step.rubric.map((r) => ({ r, hit: matches(r, txt) }));
      const score = hits.filter((h) => h.hit).length / step.rubric.length;
      const outcome = score >= 0.7 ? 'good' : score >= 0.4 ? 'ok' : 'bad';

      rubricBlock.style.display = 'block';
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
    }}}, ui.el('span', null, 'Submit formulation'), ui.icon('arrowRight'));

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

    card.appendChild(ui.audienceCard({ audience: step.audience, concept: step.concept }));

    let captured = '';
    const mic = ui.articulationMic({
      audienceLabel: step.audience === 'expert' ? 'Listening — peer mode'
        : step.audience === 'beginner' ? 'Listening — trainee mode'
        : 'Listening — outsider mode',
      onChange: (t) => { captured = t; submit.disabled = (t.split(/\s+/).filter(Boolean).length < 4); }
    });
    card.appendChild(mic);

    if (step.coachHint) {
      card.appendChild(ui.el('div', { class: 'scn-task-hint scn-standalone-hint' },
        ui.el('span', { class: 'scn-task-hint-avatar' }, ui.icon('lightbulb')),
        ui.el('p', null, step.coachHint)));
    }

    const feedbackSlot = ui.el('div');
    card.appendChild(feedbackSlot);

    const ctaBar = ui.el('div', { class: 'scn-cta-bar' });
    const continueBtn = ui.el('button', { class: 'btn primary block', style: { display: 'none' }, on: { click: () => {
      ctaBar.remove(); appendStep(i + 1);
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
