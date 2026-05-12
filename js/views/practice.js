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
import * as ui from '../ui.js';

export function render(scenarioId) {
  // Hash may carry a ?retry=N suffix. Parse it off the id.
  const [pureId, qs = ''] = String(scenarioId).split('?');
  const retryCount = parseInt(new URLSearchParams(qs).get('retry') || '0', 10) || 0;

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

  function show(node) { root.replaceChildren(node); }

  // --------------------- WELCOME PHASE ---------------------
  function renderWelcome() {
    const w = sc.welcome || {};
    const retrySuffix = retryCount > 0
      ? ` This is take ${retryCount + 1} — the prompts are the same, but the option order has been shuffled to keep the rehearsal honest.`
      : '';
    show(ui.scenarioWelcome({
      kicker: retryCount > 0 ? `Module orientation · take ${retryCount + 1}` : (w.kicker || sc.kicker || 'Module orientation'),
      title: w.title || 'Scenario overview',
      body: (w.body || sc.context) + retrySuffix,
      highlight: w.highlight,
      reassurance: w.reassurance,
      expectedOutcome: w.expectedOutcome || sc.outcomeType,
      ctaLabel: retryCount > 0 ? 'Begin retry' : 'Begin practice',
      onBegin: () => { stepIdx = 0; renderStep(); }
    }));
  }

  // --------------------- STEP PHASE ---------------------
  function renderStep() {
    if (stepIdx >= sc.steps.length) return finish();
    const step = sc.steps[stepIdx];

    // First step: spin up the timer
    if (stepIdx === 0 && !timer) timer = ui.scenarioTimer();

    const wrap = ui.el('section', { class: 'stack' });

    // Step header (kicker + title + timer)
    wrap.appendChild(ui.stepHeader({
      kicker: step.kicker || `${sc.kicker} · Step ${stepIdx + 1} of ${sc.steps.length}`,
      title: step.title || `Step ${stepIdx + 1}`,
      timerEl: timer
    }));

    // Briefing block — unifies hero image, tension chip, and "The scene"
    // text into a single card on the first step. Subsequent steps stay
    // focused: just tension + assessment.
    if (stepIdx === 0) {
      const briefing = ui.el('div', { class: 'scn-briefing' });
      briefing.appendChild(ui.scenarioMedia({
        id: sc.id,
        label: sc.industry === 'healthcare' ? 'Emergency Department · triage' : 'I-95 · scene',
        accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff7a3d',
        image: sc.heroImage || `assets/scenarios/${sc.id}.jpg`
      }));
      const body = ui.el('div', { class: 'scn-briefing-body' });
      if (step.tension) body.appendChild(ui.tensionTag(step.tension));
      body.appendChild(ui.el('div', { class: 'scn-scene-kicker' }, 'The scene'));
      body.appendChild(ui.el('p', { class: 'scn-scene-text' }, sc.context));
      // Tip sits at the bottom of the briefing — closes out the scene
      // with what the learner should be aiming for.
      if (step.coachHint) {
        body.appendChild(ui.el('div', { class: 'scn-task-hint scn-briefing-hint' },
          ui.el('span', { class: 'scn-task-hint-avatar' }, ui.icon('lightbulb')),
          ui.el('p', null, step.coachHint)));
      }
      briefing.appendChild(body);
      wrap.appendChild(briefing);
    } else {
      if (step.tension) wrap.appendChild(ui.tensionTag(step.tension));
    }

    // On non-first steps the hint isn't part of a briefing, so it
    // rides above the choices as a standalone element.
    if (stepIdx > 0 && step.coachHint && step.input !== 'text') {
      wrap.appendChild(ui.el('div', { class: 'scn-task-hint scn-standalone-hint' },
        ui.el('span', { class: 'scn-task-hint-avatar' }, ui.icon('lightbulb')),
        ui.el('p', null, step.coachHint)));
    }

    // Input mode — for choice questions, the coach hint is folded into the
    // answer card so they read as one unit. For text input, the prompt sits
    // above and the coach hint moves under the formulation field as
    // contextual help for the answer entry.
    if (step.input === 'text') {
      if (step.prompt) wrap.appendChild(ui.scenarioPrompt({ text: step.prompt }));
      wrap.appendChild(textInput(step));
    } else {
      wrap.appendChild(choiceInput(step));
    }

    show(wrap);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // --------------------- INPUT MODES ---------------------
  function choiceInput(step) {
    const card = ui.el('div', { class: 'scn-choice' });
    const kicker = ui.el('div', { class: 'scn-task-kicker' }, 'Choose a response');
    card.appendChild(kicker);

    const poll = ui.el('div', { class: 'poll' });

    // Explanation card — appears after a pick. More prominent than the
    // old single-line feedback: full-width, larger type, has room to
    // breathe.
    const explain = ui.el('div', { class: 'scn-explain', style: { display: 'none' } });

    const cta = ui.el('button', { class: 'btn primary block', disabled: true, on: { click: () => {
      stepIdx++; renderStep();
    }}}, 'Continue');
    const ctaBar = ui.el('div', { class: 'scn-cta-bar' }, cta);

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

      // Tighten the section header now that we're in review mode.
      kicker.textContent = correct ? 'Nice work' : 'Review';

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
    }

    card.append(poll, explain, ctaBar);
    return card;
  }

  function textInput(step) {
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

    const continueBtn = ui.el('button', { class: 'btn primary block', style: { display: 'none' }, on: { click: () => {
      stepIdx++; renderStep();
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

    card.appendChild(ui.el('div', { class: 'scn-cta-bar' }, submit, continueBtn));
    return card;
  }

  // --------------------- FINISH ---------------------
  function finish() {
    if (timer?.stop) timer.stop();
    const total = stepResults.reduce((s, r) => s + r.points, 0);
    const score = total / sc.steps.length;
    const result = {
      scenarioId: sc.id,
      courseId:   sc.courseId,
      concepts:   sc.concepts,
      score,
      stepResults,
      elapsed:    timer?.elapsed?.() ?? 0,
      retryCount,
      at: Date.now()
    };
    store.recordPractice(result);
    location.hash = '#/practice-complete';
  }

  renderWelcome();
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
