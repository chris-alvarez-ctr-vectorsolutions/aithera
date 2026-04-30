// views/reference.js — Reference / Documents tab.
// Compliance-heavy industries need a place to find authoritative docs
// fast (mockup callout: "OSHA policy 1.2.3"). Loaded from data/reference.json.
// Items default to industry-filtered with a toggle for "All".
import { store } from '../store.js';
import * as ui from '../ui.js';

let onlyMine = true;
let query = '';
let cache = null;

export function render() {
  const root = document.createElement('section');
  root.innerHTML = `
    <h2 style="margin:6px 4px 4px">Reference</h2>
    <p class="muted tiny" style="margin:0 4px 12px">Authoritative documents, job aids, and checklists. Coach Vic cites these.</p>

    <input id="q" placeholder="Search reference…" style="width:100%;padding:10px 12px;border-radius:10px;background:var(--bg-elev);border:1px solid var(--line);color:var(--text);font:inherit;margin-bottom:8px" />
    <div class="utility-rail">
      <button class="chip" data-mode="mine">My industry</button>
      <button class="chip" data-mode="all">All</button>
    </div>

    <div id="list"></div>
  `;

  const qEl  = root.querySelector('#q');
  const list = root.querySelector('#list');
  const chips = root.querySelectorAll('[data-mode]');

  chips.forEach((c) => {
    c.classList.toggle('selected', (c.dataset.mode === 'mine') === onlyMine);
    c.onclick = () => {
      onlyMine = c.dataset.mode === 'mine';
      chips.forEach((x) => x.classList.toggle('selected', (x.dataset.mode === 'mine') === onlyMine));
      paint();
    };
  });
  qEl.addEventListener('input', () => { query = qEl.value.toLowerCase(); paint(); });

  async function paint() {
    if (!cache) {
      try { cache = (await (await fetch('data/reference.json')).json()).categories; }
      catch { cache = []; }
    }
    list.innerHTML = '';
    const ind = store.state.learner.industry;
    let any = false;
    for (const cat of cache) {
      const items = cat.items.filter((it) => {
        if (onlyMine && it.industry !== ind) return false;
        if (query && !(`${it.title} ${it.kind}`.toLowerCase().includes(query))) return false;
        return true;
      });
      if (!items.length) continue;
      any = true;
      const h = document.createElement('div');
      h.className = 'section-h';
      h.innerHTML = `<h2>${cat.label}</h2>`;
      list.appendChild(h);
      for (const it of items) list.appendChild(refRow(it));
    }
    if (!any) list.innerHTML = `<p class="muted tiny" style="padding:8px 4px">No matches.</p>`;
  }

  paint();
  return root;
}

function refRow(it) {
  return ui.rowCard({
    glyph: 'doc',
    title: it.title,
    sub: `${it.kind} · Updated ${it.lastUpdated}`,
    onClick: (e) => e.preventDefault() // stub: docs are not viewable yet
  });
}
