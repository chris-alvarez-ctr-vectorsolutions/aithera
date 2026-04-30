// views/courses.js — Courses tab.
// Two modes: "Mine" (industry/required/saved/in-progress) and "All"
// (full catalog with search). Tiles are produced by ui.courseTile so
// the look matches anywhere else a course is listed.

import { store } from '../store.js';
import * as ui from '../ui.js';

let mode = 'mine';
let query = '';

export function render() {
  const root = document.createElement('section');
  root.appendChild(ui.el('h2', { style: { margin: '6px 4px 4px' } }, 'Courses'));
  root.appendChild(ui.el('p', { class: 'muted tiny', style: { margin: '0 4px 12px' } },
    'Your assigned and saved courses, plus the full library.'));

  const modes = ui.el('div', { class: 'utility-rail' },
    chip('mine', 'Mine'),
    chip('all',  'All courses')
  );
  root.appendChild(modes);

  const q = ui.el('input', {
    id: 'q', placeholder: 'Search courses…',
    style: { width: '100%', padding: '10px 12px', borderRadius: '10px',
             background: 'var(--bg-elev)', border: '1px solid var(--line)',
             color: 'var(--text)', font: 'inherit', marginBottom: '8px',
             display: mode === 'all' ? 'block' : 'none' }
  });
  q.addEventListener('input', () => { query = q.value.toLowerCase(); paint(); });
  root.appendChild(q);

  const list = ui.el('div', { class: 'stack' });
  root.appendChild(list);

  function chip(m, label) {
    return ui.el('button', {
      class: `chip${m === mode ? ' selected' : ''}`,
      'data-m': m,
      on: { click: () => {
        mode = m;
        modes.querySelectorAll('.chip').forEach((x) => x.classList.toggle('selected', x.dataset.m === mode));
        q.style.display = mode === 'all' ? 'block' : 'none';
        paint();
      } }
    }, label);
  }

  function paint() {
    list.replaceChildren();
    const all = store.state.courses;
    let items;
    if (mode === 'mine') {
      const ind = store.state.learner.industry;
      const inProg = Object.keys(store.state.mastery.courseProgress);
      const saved  = store.state.mastery.saved;
      const set = new Set([...inProg, ...saved]);
      items = all.filter((c) => c.industry === ind || set.has(c.id));
    } else {
      items = query
        ? all.filter((c) => c.title.toLowerCase().includes(query) || c.summary.toLowerCase().includes(query))
        : all;
    }
    if (!items.length) {
      list.appendChild(ui.el('p', { class: 'muted tiny', style: { padding: '8px 4px' } }, 'No matches.'));
      return;
    }
    for (const c of items) {
      const progress = store.state.mastery.courseProgress[c.id];
      list.appendChild(ui.courseTile(c, { progress }));
    }
  }
  paint();
  return root;
}
