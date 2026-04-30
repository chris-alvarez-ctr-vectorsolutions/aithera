// views/courses.js — Courses tab.
// Two modes: "Mine" (filtered to industry/required/saved/in-progress) and
// "All" (every course in the catalog, with a search box). The mockup
// calls this "filter mine / search all" — same idea.
import { store } from '../store.js';

let mode = 'mine';
let query = '';

export function render() {
  const root = document.createElement('section');
  root.innerHTML = `
    <h2 style="margin:6px 4px 4px">Courses</h2>
    <p class="muted tiny" style="margin:0 4px 12px">Your assigned and saved courses, plus the full library.</p>

    <div class="utility-rail" id="modes">
      <button class="chip" data-m="mine">Mine</button>
      <button class="chip" data-m="all">All courses</button>
    </div>

    <input id="q" placeholder="Search courses…" style="width:100%;padding:10px 12px;border-radius:10px;background:var(--bg-elev);border:1px solid var(--line);color:var(--text);font:inherit;margin-bottom:8px;display:none" />

    <div id="list" class="stack"></div>
  `;

  const list  = root.querySelector('#list');
  const qEl   = root.querySelector('#q');
  const modes = root.querySelector('#modes');

  modes.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('selected', c.dataset.m === mode);
    c.onclick = () => {
      mode = c.dataset.m;
      modes.querySelectorAll('.chip').forEach((x) => x.classList.toggle('selected', x.dataset.m === mode));
      qEl.style.display = mode === 'all' ? 'block' : 'none';
      paint();
    };
  });
  qEl.addEventListener('input', () => { query = qEl.value.toLowerCase(); paint(); });
  qEl.style.display = mode === 'all' ? 'block' : 'none';

  function paint() {
    list.innerHTML = '';
    const all = store.state.courses;
    let items;
    if (mode === 'mine') {
      const ind = store.state.learner.industry;
      const inProg = Object.keys(store.state.mastery.courseProgress);
      const saved  = store.state.mastery.saved;
      const set = new Set([...inProg, ...saved]);
      items = all.filter((c) => c.industry === ind || set.has(c.id));
    } else {
      items = query ? all.filter((c) =>
        c.title.toLowerCase().includes(query) || c.summary.toLowerCase().includes(query)
      ) : all;
    }

    if (!items.length) {
      list.innerHTML = `<p class="muted tiny" style="padding:8px 4px">No matches.</p>`;
      return;
    }
    for (const c of items) list.appendChild(courseCard(c));
  }

  paint();
  return root;
}

function courseCard(course) {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = `#/course/${course.id}`;
  const progress = store.state.mastery.courseProgress[course.id];
  const pct = progress ? Math.round(progress.percent * 100) : null;
  const tags = [
    course.mandated ? '<span class="tag accent">Required</span>' : '<span class="tag">Recommended</span>',
    `<span class="tag">${course.estMinutes} min</span>`,
    pct !== null ? `<span class="tag good">${pct}% complete</span>` : ''
  ].join(' ');
  a.innerHTML = `
    <h3>${course.title}</h3>
    <p>${course.summary}</p>
    <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap">${tags}</div>
    ${pct !== null ? `<div class="progress" style="margin-top:10px"><span style="width:${pct}%"></span></div>` : ''}
  `;
  return a;
}
