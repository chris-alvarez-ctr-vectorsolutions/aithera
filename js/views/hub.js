// views/hub.js — Practice Hub.
// Standalone practice surface: shows ALL scenarios for the industry,
// with a "Mastery exploration" toggle that re-orders by weakest concept.
import { store } from '../store.js';
import * as adaptive from '../adaptive.js';

let mode = 'suggested'; // | 'random' | 'mastery'

export function render() {
  const root = document.createElement('section');
  const ind = store.state.industry;
  const scenarios = store.state.scenarios.filter((s) => s.industry === store.state.learner.industry);

  root.innerHTML = `
    <h2 style="margin:6px 4px 4px">${ind.language.practiceWord.replace(/^\w/, (c) => c.toUpperCase())} hub</h2>
    <p class="muted" style="margin:0 4px 12px">Time spent here counts toward mastery — not just module completion.</p>

    <div class="utility-rail">
      <button class="chip" data-m="suggested">✦ Suggested</button>
      <button class="chip" data-m="mastery">⌖ Mastery exploration</button>
      <button class="chip" data-m="random">⇄ Random</button>
    </div>

    <div id="list" class="stack"></div>
  `;

  root.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('selected', c.dataset.m === mode);
    c.onclick = () => { mode = c.dataset.m; renderList(); root.querySelectorAll('.chip').forEach((x) => x.classList.toggle('selected', x.dataset.m === mode)); };
  });

  function renderList() {
    const list = root.querySelector('#list');
    list.innerHTML = '';
    let order = scenarios.slice();
    if (mode === 'random') order.sort(() => Math.random() - 0.5);
    else if (mode === 'mastery') {
      const sugg = adaptive.practiceSuggestions(99);
      order = sugg.map((s) => s.scenario);
      // Annotate with reason
      const reasons = new Map(sugg.map((s) => [s.scenario.id, s.reason]));
      for (const sc of order) list.appendChild(card(sc, reasons.get(sc.id)));
      return;
    } else {
      const sugg = adaptive.practiceSuggestions(99);
      order = sugg.map((s) => s.scenario);
      const reasons = new Map(sugg.map((s) => [s.scenario.id, s.reason]));
      for (const sc of order) list.appendChild(card(sc, reasons.get(sc.id)));
      return;
    }
    for (const sc of order) list.appendChild(card(sc));
  }

  function card(sc, reason) {
    const a = document.createElement('a');
    a.className = 'card'; a.href = `#/practice/${sc.id}`;
    a.innerHTML = `
      <div class="row between">
        <span class="tag accent">${ind.language.practiceWord}</span>
        <span class="tiny muted">${sc.estMinutes} min</span>
      </div>
      <h3>${sc.title}</h3>
      <p>${sc.outcomeType}</p>
      ${reason ? `<p class="tiny muted" style="margin-top:8px;border-top:1px solid var(--line);padding-top:8px"><strong>Why:</strong> ${reason}</p>` : ''}
    `;
    return a;
  }

  renderList();
  return root;
}
