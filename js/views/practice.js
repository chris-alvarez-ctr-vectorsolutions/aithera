// views/practice.js — the SCENARIO ENGINE.
// Steps unfold one at a time, with a *running timeline* of decisions and
// inline coaching feedback. This is the page that has to feel meaningfully
// different from a quiz — three things drive that feeling:
//   1. Decisions reveal *consequences*, not just a "right/wrong" stamp
//   2. The timeline accumulates and persists in view (decisions matter)
//   3. Mixed input modes (choice + open text rubric)
import { store } from '../store.js';

export function render(scenarioId) {
  const sc = store.scenario(scenarioId);
  const root = document.createElement('section');
  if (!sc) { root.innerHTML = '<p class="muted">Scenario not found.</p>'; return root; }

  const stepResults = []; // { stepId, choiceId|text, outcome, points }
  let stepIdx = 0;

  root.innerHTML = `
    <div class="row between" style="margin:4px 4px 8px">
      <span class="tag accent">${store.state.industry.language.scenarioWord}</span>
      <span class="tiny muted">${sc.estMinutes} min</span>
    </div>
    <h2 style="margin:0 4px 6px">${sc.title}</h2>
    <p class="muted" style="margin:0 4px 12px">${sc.outcomeType}</p>

    <div class="card">
      <strong>Context</strong>
      <p style="margin-top:6px">${sc.context}</p>
    </div>

    <div class="section-h"><h2>Decisions</h2><span class="tiny muted" id="counter"></span></div>
    <div class="scenario-timeline" id="timeline"></div>

    <div id="step"></div>
  `;

  const timelineEl = root.querySelector('#timeline');
  const stepEl     = root.querySelector('#step');
  const counterEl  = root.querySelector('#counter');

  function renderStep() {
    counterEl.textContent = `Step ${Math.min(stepIdx + 1, sc.steps.length)} of ${sc.steps.length}`;
    if (stepIdx >= sc.steps.length) return finish();

    const step = sc.steps[stepIdx];
    if (step.input === 'text') return renderTextStep(step);
    return renderChoiceStep(step);
  }

  function renderChoiceStep(step) {
    stepEl.innerHTML = `
      <div class="card">
        <strong>${step.prompt}</strong>
        <div class="poll" style="margin-top:10px"></div>
        <p class="tiny muted feedback" style="display:none;margin-top:8px"></p>
        <div class="row" style="margin-top:10px;display:none" id="advanceRow">
          <button class="btn primary" id="advance" style="flex:1">Continue →</button>
        </div>
      </div>
    `;
    const poll = stepEl.querySelector('.poll');
    const fb   = stepEl.querySelector('.feedback');
    const adv  = stepEl.querySelector('#advance');
    const row  = stepEl.querySelector('#advanceRow');

    for (const o of step.options) {
      const b = document.createElement('button');
      b.textContent = o.label;
      b.onclick = () => {
        poll.querySelectorAll('button').forEach((x) => x.disabled = true);
        b.classList.add(o.outcome === 'good' ? 'right' : o.outcome === 'bad' ? 'wrong' : '');
        fb.style.display = 'block';
        fb.innerHTML = `<strong style="color:var(--${o.outcome === 'good' ? 'good' : o.outcome === 'bad' ? 'bad' : 'warn'})">Coach Vic:</strong> ${o.feedback}`;
        row.style.display = 'flex';

        const points = o.outcome === 'good' ? 1 : o.outcome === 'ok' ? 0.5 : 0;
        stepResults.push({ stepId: step.id, choice: o.id, outcome: o.outcome, points });
        appendTimeline(step.prompt, o.label, o.outcome);
      };
      poll.appendChild(b);
    }
    adv.onclick = () => { stepIdx++; renderStep(); };
  }

  function renderTextStep(step) {
    stepEl.innerHTML = `
      <div class="card">
        <strong>${step.prompt}</strong>
        <textarea id="ta" rows="4" placeholder="Type your response…" style="width:100%;margin-top:10px;border-radius:10px;padding:10px;background:var(--bg-elev);border:1px solid var(--line);color:var(--text);font:inherit"></textarea>
        <button class="btn primary block" id="grade" style="margin-top:8px">Submit response</button>
        <div id="rubric" style="display:none;margin-top:10px"></div>
        <div class="row" style="margin-top:10px;display:none" id="advanceRow">
          <button class="btn primary" id="advance" style="flex:1">Continue →</button>
        </div>
      </div>
    `;
    const ta = stepEl.querySelector('#ta');
    const rubricEl = stepEl.querySelector('#rubric');
    const advRow = stepEl.querySelector('#advanceRow');

    stepEl.querySelector('#grade').onclick = () => {
      const txt = (ta.value || '').toLowerCase();
      const hits = step.rubric.map((r) => ({ r, hit: matches(r, txt) }));
      const score = hits.filter((h) => h.hit).length / step.rubric.length;
      rubricEl.style.display = 'block';
      rubricEl.innerHTML = `
        <p class="tiny muted"><strong>Rubric (${Math.round(score*100)}%)</strong> — Coach Vic checked your answer against six anchor points:</p>
        <ul class="list-tight">
          ${hits.map((h) => `<li style="color:${h.hit ? 'var(--good)' : 'var(--bad)'}">${h.hit ? '✓' : '–'} ${h.r}</li>`).join('')}
        </ul>
        <div class="bubble coach"><strong>Model answer:</strong><br>${step.modelAnswer}</div>
      `;
      const outcome = score >= 0.7 ? 'good' : score >= 0.4 ? 'ok' : 'bad';
      stepResults.push({ stepId: step.id, text: ta.value, outcome, points: score });
      appendTimeline(step.prompt, ta.value || '(empty)', outcome);
      advRow.style.display = 'flex';
      stepEl.querySelector('#advance').onclick = () => { stepIdx++; renderStep(); };
    };
  }

  function appendTimeline(prompt, choice, outcome) {
    const el = document.createElement('div');
    el.className = `scenario-step ${outcome === 'good' ? 'good' : outcome === 'bad' ? 'bad' : ''}`;
    el.innerHTML = `<strong>${prompt}</strong><br><span class="muted">→ ${escape(choice)}</span>`;
    timelineEl.appendChild(el);
  }

  function finish() {
    const total = stepResults.reduce((s, r) => s + r.points, 0);
    const score = total / sc.steps.length;
    const result = {
      scenarioId: sc.id,
      courseId:   sc.courseId,
      concepts:   sc.concepts,
      score,
      stepResults,
      at: Date.now()
    };
    store.recordPractice(result);
    location.hash = '#/summary';
  }

  renderStep();
  return root;
}

// Cheap rubric "AI" — keyword groups per criterion. Stubbed; in production
// this is where a model + retrieval would live. The visible structure
// matters more than the matcher quality for the demo.
function matches(criterion, text) {
  const k = criterion.toLowerCase();
  const groups = [
    [/location|mile|sb|nb/, /location|mile|sb|nb|i-?\d+|miles? \d+/],
    [/un number|product/,   /un[- ]?\d+|1203|gasoline|product/],
    [/hazard|leak|vapor/,   /leak|vapor|fire|smoke|fume/],
    [/wind/,                /wind|sw|nw|se|ne|knots|mph/],
    [/isolation/,           /50 ?m|isolat|stand[ -]?off|perimeter/],
    [/resource/,            /hazmat|engine|pd|police|ems|requesting|backup/],
    [/lactate/,             /lactate/],
    [/cultures/,            /cultures?/],
    [/antibiotics/,         /antibiotic|broad[- ]?spectrum/],
    [/crystalloid|fluids/,  /fluids?|crystalloid|30 ?ml/],
    [/vasopressor|norepine/,/vasopressor|norepi/]
  ];
  for (const [hint, regex] of groups) {
    if (hint.test(k)) return regex.test(text);
  }
  return text.length > 30; // generic fallback
}

function escape(s) { return String(s).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
