// views/courses.js — Courses tab.
// Two modes: "Mine" (industry/required/saved/in-progress) and "All"
// (full catalog with search). Tiles are produced by ui.courseTile so
// the look matches anywhere else a course is listed.

import { store } from '../store.js';
import * as ui from '../ui.js';
import { currentPhase, belongsToCurrentPersona } from '../phase.js';

let mode = 'mine';
let query = '';

export function render() {
  const root = document.createElement('section');
  root.appendChild(ui.el('h2', { style: { margin: '6px 4px 4px' } }, 'Courses'));
  root.appendChild(ui.el('p', { class: 'muted tiny', style: { margin: '0 4px 12px' } },
    'Your assigned and saved courses, plus the full library.'));

  const modes = ui.el('div', { class: 'utility-rail' },
    chip('mine', 'Assigned to me'),
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
    const phase = currentPhase();
    let items;
    const inProg = Object.keys(store.state.mastery.courseProgress);
    const saved  = store.state.mastery.saved;
    const stickySet = new Set([...inProg, ...saved]);
    // Scope the whole catalog to the current persona so we never surface
    // another persona's courses (cross-industry or same-industry phase-
    // tagged). Saved/in-progress always pass through.
    const scoped = all.filter((c) => stickySet.has(c.id) || belongsToCurrentPersona(c));
    if (mode === 'mine') {
      items = scoped;
    } else {
      items = query
        ? scoped.filter((c) => c.title.toLowerCase().includes(query) || c.summary.toLowerCase().includes(query))
        : scoped;
    }
    // Hide phase-gated content from earlier phases — e.g. don't show the
    // adaptive course in Phase 1. Saved/in-progress courses still show.
    const inProgIds = new Set(Object.keys(store.state.mastery.courseProgress));
    items = items.filter((c) => {
      if (inProgIds.has(c.id) || store.state.mastery.saved.includes(c.id)) return true;
      return !c.phaseHint || c.phaseHint <= phase;
    });
    // Sort adaptive course to the top when it's unlocked.
    items.sort((a, b) => (b.adaptive ? 1 : 0) - (a.adaptive ? 1 : 0));
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
