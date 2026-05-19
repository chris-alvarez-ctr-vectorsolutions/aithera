// views/iv-math.js — "IV Math" mini-game.
// Quick-fire IV-dose calculations. Each set holds 10 challenges that
// escalate in difficulty. Each round shows a patient card + drug order +
// supply, then asks the learner to dial in one or more values via
// sliders, multiple-choice chips, or numeric entry.
//
// Scoring: every input is graded against an answer + tolerance. A round
// is "correct" only when every input lands inside tolerance.

import { store } from '../store.js';
import * as ui from '../ui.js';

export function render(setId) {
  const root = document.createElement('section');
  const set = store.scenario(setId);
  if (!set || set.kind !== 'iv-math' || !Array.isArray(set.challenges)) {
    root.appendChild(ui.el('p', { class: 'muted' }, 'IV Math set not found.'));
    return root;
  }

  // courseLesson=<courseId>:<lessonId> carries lesson-credit context if
  // the mini-game was launched from inside a course.
  const hashIdx = location.hash.indexOf('?');
  const qs = hashIdx >= 0 ? location.hash.slice(hashIdx + 1) : '';
  const [fromCourseId, fromLessonId] = (new URLSearchParams(qs).get('courseLesson') || '').split(':');

  const results = []; // { roundId, perInput: {key: {value, ok}}, allCorrect }
  let idx = 0;
  let timer = null;

  function show(node) { root.replaceChildren(node); }

  // -------- WELCOME --------
  function renderWelcome() {
    const w = set.welcome || {};
    show(ui.scenarioWelcome({
      kicker: w.kicker || 'Mini-game',
      title: w.title || set.title,
      body: w.body || set.outcomeType,
      highlight: w.highlight,
      reassurance: w.reassurance,
      expectedOutcome: w.expectedOutcome,
      ctaLabel: 'Start round 1',
      onBegin: () => { idx = 0; renderRound(); }
    }));
  }

  // -------- ROUND --------
  function renderRound() {
    if (idx >= set.challenges.length) return finish();
    const ch = set.challenges[idx];
    if (!timer) timer = ui.scenarioTimer();

    const wrap = ui.el('section', { class: 'stack iv-round' });
    wrap.appendChild(ui.stepHeader({
      kicker: `${ch.kicker || ''} · ${idx + 1} of ${set.challenges.length}`,
      title: null,
      timerEl: timer
    }));

    // Patient + order card — the "brief"
    wrap.appendChild(briefCard(ch));

    // Inputs
    const inputState = {}; // key → { read(), node }
    const inputsHost = ui.el('div', { class: 'iv-inputs' });
    for (const inp of ch.inputs) {
      const ctl = makeInput(inp);
      inputState[inp.key] = ctl;
      inputsHost.appendChild(ctl.node);
    }
    wrap.appendChild(inputsHost);

    // Explanation card (hidden until submit)
    const explain = ui.el('div', { class: 'iv-explain', style: { display: 'none' } });

    // Submit / Continue
    const submitBtn = ui.el('button', {
      class: 'btn primary block cta-large',
      on: { click: onSubmit }
    }, ui.el('span', null, 'Check answer'), ui.icon('arrowRight'));

    const nextBtn = ui.el('button', {
      class: 'btn primary block', style: { display: 'none' },
      on: { click: () => { idx++; renderRound(); } }
    }, idx === set.challenges.length - 1 ? 'See results' : 'Next round');

    wrap.appendChild(explain);
    wrap.appendChild(ui.el('div', { class: 'iv-cta-bar' }, submitBtn, nextBtn));

    function onSubmit() {
      const perInput = {};
      let allOk = true;
      for (const inp of ch.inputs) {
        const value = inputState[inp.key].read();
        const ok = isCorrect(inp, value);
        if (!ok) allOk = false;
        perInput[inp.key] = { value, ok, answer: inp.answer };
        inputState[inp.key].lock(ok, inp.answer);
      }
      results.push({ roundId: ch.id, perInput, allCorrect: allOk });

      explain.className = `iv-explain ${allOk ? 't-good' : 't-bad'}`;
      explain.style.display = 'block';
      explain.replaceChildren(
        ui.el('div', { class: 'iv-explain-head' },
          ui.el('span', { class: 'iv-explain-avatar' }, ui.icon(allOk ? 'check' : 'lightbulb')),
          ui.el('span', { class: 'iv-explain-kicker' }, allOk ? 'Nice — clean math' : 'Work it through'),
        ),
        ui.el('p', { class: 'iv-explain-text' }, ch.rationale),
        verdictGrid(ch.inputs, perInput)
      );

      submitBtn.style.display = 'none';
      nextBtn.style.display = 'block';
      window.scrollTo({ top: explain.offsetTop - 40, behavior: 'smooth' });
    }

    show(wrap);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // -------- FINISH --------
  function finish() {
    if (timer?.stop) timer.stop();
    const correct = results.filter((r) => r.allCorrect).length;
    const score = correct / set.challenges.length;
    const elapsed = timer?.elapsed?.() ?? 0;

    store.recordPractice({
      scenarioId: set.id,
      courseId: set.courseId,
      concepts: set.concepts,
      score,
      stepResults: results.map((r) => ({
        stepId: r.roundId,
        outcome: r.allCorrect ? 'good' : 'bad',
        points: r.allCorrect ? 1 : 0
      })),
      elapsed,
      retryCount: 0,
      at: Date.now()
    });
    if (fromCourseId && fromLessonId) {
      store.markLessonComplete(fromCourseId, fromLessonId);
    }

    const passed = correct >= 8;
    const wrap = ui.el('section', { class: 'stack iv-results' });
    wrap.appendChild(ui.kickerPill({ icon: passed ? 'check' : 'retry', label: 'Mini-game complete' }));
    wrap.appendChild(ui.el('h2', { class: 'iv-results-title' }, `${correct} of ${set.challenges.length} correct`));
    wrap.appendChild(ui.el('p', { class: 'muted' },
      passed
        ? 'Set cleared. Your reps just got cheaper.'
        : 'Below the 8/10 bar — replay to lock the patterns in.'));

    const rows = ui.el('div', { class: 'iv-result-rows' });
    for (let i = 0; i < set.challenges.length; i++) {
      const ch = set.challenges[i];
      const r = results[i];
      rows.appendChild(ui.el('div', { class: `iv-result-row ${r.allCorrect ? 'ok' : 'miss'}` },
        ui.el('span', { class: 'iv-result-num' }, String(i + 1)),
        ui.el('span', { class: 'iv-result-title' }, ch.title),
        ui.el('span', { class: 'iv-result-mark' }, r.allCorrect ? '✓' : '✕')
      ));
    }
    wrap.appendChild(rows);

    wrap.appendChild(ui.el('div', { class: 'iv-cta-bar' },
      ui.el('a', { class: 'btn primary block', href: '#/iv-math/' + set.id }, 'Replay set'),
      ui.el('a', { class: 'btn block ghost', href: '#/practice' }, 'Back to Practice Hub')
    ));

    show(wrap);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  renderWelcome();
  return root;
}

// ---------------- pieces ----------------

function briefCard(ch) {
  const p = ch.patient || {};
  return ui.el('div', { class: 'iv-brief' },
    ui.el('div', { class: 'iv-brief-patient' },
      ui.el('div', { class: 'iv-brief-meta' },
        ui.el('span', { class: 'iv-pill age' }, p.age || ''),
        p.weight != null ? ui.el('span', { class: 'iv-pill weight' }, `${p.weight} kg`) : null
      ),
      p.notes ? ui.el('p', { class: 'iv-brief-notes' }, p.notes) : null
    ),
    ui.el('div', { class: 'iv-brief-order' },
      ui.el('small', { class: 'iv-brief-label' }, 'Order'),
      ui.el('p', { class: 'iv-brief-text' }, ch.order)
    ),
    ui.el('div', { class: 'iv-brief-supply' },
      ui.el('small', { class: 'iv-brief-label' }, 'Supply'),
      ui.el('p', { class: 'iv-brief-text' }, ch.supply)
    )
  );
}

function makeInput(inp) {
  if (inp.type === 'slider')  return sliderInput(inp);
  if (inp.type === 'choice')  return choiceInput(inp);
  return numericInput(inp);
}

function sliderInput(inp) {
  const node = ui.el('div', { class: 'iv-input iv-slider' });
  const head = ui.el('div', { class: 'iv-input-head' },
    ui.el('span', { class: 'iv-input-label' }, inp.label),
    ui.el('span', { class: 'iv-input-value' }, '—')
  );
  const valueEl = head.querySelector('.iv-input-value');
  const range = ui.el('input', {
    type: 'range',
    min: String(inp.min ?? 0),
    max: String(inp.max ?? 100),
    step: String(inp.step ?? 1),
    value: String(inp.min ?? 0)
  });
  let touched = false;
  function paint() {
    const v = parseFloat(range.value);
    valueEl.textContent = touched ? `${formatNum(v)} ${inp.unit || ''}` : 'Drag to set';
    const pct = ((v - (inp.min ?? 0)) / ((inp.max ?? 100) - (inp.min ?? 0))) * 100;
    range.style.setProperty('--fill', `${pct}%`);
  }
  range.addEventListener('input', () => { touched = true; paint(); });
  paint();
  node.append(head, range);
  return {
    node,
    read() { return touched ? parseFloat(range.value) : null; },
    lock(ok, answer) {
      range.disabled = true;
      node.classList.add('locked', ok ? 'ok' : 'miss');
      head.appendChild(ui.el('span', { class: 'iv-answer-tag' },
        ok ? '✓ in range' : `target ${formatNum(answer)} ${inp.unit || ''}`));
    }
  };
}

function choiceInput(inp) {
  const node = ui.el('div', { class: 'iv-input iv-choice' });
  node.appendChild(ui.el('div', { class: 'iv-input-head' },
    ui.el('span', { class: 'iv-input-label' }, inp.label),
    ui.el('span', { class: 'iv-input-unit muted' }, inp.unit || '')
  ));
  const grid = ui.el('div', { class: 'iv-choice-grid' });
  let pickedBtn = null;
  let pickedVal = null;
  for (const opt of inp.options) {
    const val = typeof opt === 'object' ? opt.value : opt;
    const label = typeof opt === 'object' ? opt.label : String(opt);
    const b = ui.el('button', { type: 'button', class: 'iv-choice-btn' }, label);
    b.addEventListener('click', () => {
      if (pickedBtn) pickedBtn.classList.remove('picked');
      pickedBtn = b; pickedVal = val;
      b.classList.add('picked');
    });
    grid.appendChild(b);
  }
  node.appendChild(grid);
  return {
    node,
    read() { return pickedVal; },
    lock(ok, answer) {
      [...grid.children].forEach((btn) => {
        btn.disabled = true;
        const v = parseFloat(btn.textContent);
        if (v === answer) btn.classList.add('correct');
        if (btn === pickedBtn && !ok) btn.classList.add('wrong');
      });
      node.classList.add('locked', ok ? 'ok' : 'miss');
    }
  };
}

function numericInput(inp) {
  const node = ui.el('div', { class: 'iv-input iv-numeric' });
  const head = ui.el('div', { class: 'iv-input-head' },
    ui.el('span', { class: 'iv-input-label' }, inp.label),
    ui.el('span', { class: 'iv-input-unit muted' }, inp.unit || '')
  );
  const field = ui.el('input', { type: 'number', inputmode: 'decimal', step: 'any', placeholder: '0', class: 'iv-numeric-field' });
  node.append(head, field);
  return {
    node,
    read() {
      const v = parseFloat(field.value);
      return Number.isFinite(v) ? v : null;
    },
    lock(ok, answer) {
      field.disabled = true;
      node.classList.add('locked', ok ? 'ok' : 'miss');
      head.appendChild(ui.el('span', { class: 'iv-answer-tag' },
        ok ? '✓' : `→ ${formatNum(answer)} ${inp.unit || ''}`));
    }
  };
}

function isCorrect(inp, value) {
  if (value == null || !Number.isFinite(value)) return false;
  if (inp.type === 'choice') return value === inp.answer;
  const tol = inp.tolerance ?? 0;
  return Math.abs(value - inp.answer) <= tol + 1e-9;
}

function verdictGrid(inputs, perInput) {
  const grid = ui.el('div', { class: 'iv-verdict-grid' });
  for (const inp of inputs) {
    const r = perInput[inp.key];
    const yourVal = r.value == null ? '—' : `${formatNum(r.value)} ${inp.unit || ''}`;
    const ans = `${formatNum(inp.answer)} ${inp.unit || ''}`;
    grid.appendChild(ui.el('div', { class: `iv-verdict ${r.ok ? 'ok' : 'miss'}` },
      ui.el('small', { class: 'iv-verdict-label' }, inp.label),
      ui.el('div', { class: 'iv-verdict-row' },
        ui.el('span', null, yourVal),
        ui.el('span', { class: 'muted' }, r.ok ? '✓' : `→ ${ans}`)
      )
    ));
  }
  return grid;
}

function formatNum(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 100) return String(Math.round(n));
  if (Math.abs(n) >= 10)  return n.toFixed(1).replace(/\.0$/, '');
  return n.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
}
