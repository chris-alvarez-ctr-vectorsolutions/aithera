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
  const sc = store.scenario(scenarioId);
  const root = document.createElement('section');
  if (!sc) { root.appendChild(ui.el('p', { class: 'muted' }, 'Scenario not found.')); return root; }

  const stepResults = []; // { stepId, choice|text, outcome, points, lastAssessment }
  let stepIdx = 0;
  let timer = null;

  function show(node) { root.replaceChildren(node); }

  // --------------------- WELCOME PHASE ---------------------
  function renderWelcome() {
    const w = sc.welcome || {};
    show(ui.scenarioWelcome({
      kicker: w.kicker || sc.kicker || 'Module orientation',
      title: w.title || 'Scenario overview',
      body: w.body || sc.context,
      highlight: w.highlight,
      reassurance: w.reassurance,
      expectedOutcome: w.expectedOutcome || sc.outcomeType,
      ctaLabel: 'Begin practice',
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

    // Hero (only on first step — subsequent steps stay focused)
    if (stepIdx === 0) {
      wrap.appendChild(ui.scenarioMedia({
        id: sc.id,
        label: sc.industry === 'healthcare' ? 'Emergency Department · triage' : 'I-95 · scene',
        accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff7a3d'
      }));
    }

    // Tension chip
    if (step.tension) wrap.appendChild(ui.tensionTag(step.tension));

    // Situational assessment from the previous step
    const last = stepResults[stepResults.length - 1];
    if (last && last.assessment) {
      wrap.appendChild(ui.situationalAssessment(last.assessment));
    }

    // Context (only on first step) or prompt
    if (stepIdx === 0) {
      wrap.appendChild(ui.el('div', { class: 'card' },
        ui.el('strong', null, '"' + (step.prompt || 'What do you do first?') + '"'),
        ui.el('p', { class: 'muted', style: { marginTop: '8px' } }, sc.context)
      ));
    } else if (step.prompt) {
      wrap.appendChild(ui.el('div', { class: 'card' }, ui.el('p', null, step.prompt)));
    }

    // Coach micro-hint
    if (step.coachHint) wrap.appendChild(ui.coachHint({ text: step.coachHint }));

    // Input mode
    if (step.input === 'text') wrap.appendChild(textInput(step));
    else                       wrap.appendChild(choiceInput(step));

    show(wrap);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // --------------------- INPUT MODES ---------------------
  function choiceInput(step) {
    const card = ui.el('div', { class: 'card' });
    const poll = ui.el('div', { class: 'poll' });
    const fb   = ui.el('p', { class: 'tiny muted', style: { marginTop: '8px', display: 'none' } });
    const next = ui.el('div', { class: 'scn-submit-row', style: { display: 'none' } });

    for (const o of step.options) {
      const btn = ui.el('button', { type: 'button', on: { click: () => {
        poll.querySelectorAll('button').forEach((x) => x.disabled = true);
        btn.classList.add(o.outcome === 'good' ? 'right' : o.outcome === 'bad' ? 'wrong' : '');
        fb.style.display = 'block';
        fb.innerHTML = `<strong style="color:var(--${o.outcome === 'good' ? 'good' : o.outcome === 'bad' ? 'bad' : 'warn'})">Coach Vic:</strong> ${escape(o.feedback)}`;
        next.style.display = 'block';

        const points = o.outcome === 'good' ? 1 : o.outcome === 'ok' ? 0.5 : 0;
        stepResults.push({
          stepId: step.id, choice: o.id, outcome: o.outcome, points,
          assessment: assessmentFor(o, step)
        });
      }}}, o.label);
      poll.appendChild(btn);
    }

    const cta = ui.el('button', { class: 'btn primary block', on: { click: () => {
      stepIdx++; renderStep();
    }}}, 'Continue');
    next.appendChild(cta);

    card.append(poll, fb, next);
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

    const rubricBlock = ui.el('div', { style: { display: 'none' } });
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
        ),
        ui.el('button', { class: 'btn primary block', style: { marginTop: '8px' }, on: { click: () => {
          stepIdx++; renderStep();
        }}}, 'Continue')
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

      submit.disabled = true;
      submit.textContent = 'Submitted';
    }}}, ui.el('span', null, 'Submit formulation'), ui.icon('arrowRight'));

    card.appendChild(submit);
    card.appendChild(rubricBlock);
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
      at: Date.now()
    };
    store.recordPractice(result);
    location.hash = '#/summary';
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
