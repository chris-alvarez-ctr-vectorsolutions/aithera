// views/launch.js — Launch screen / profile selector.
// Four top-level categories, each with role pills. Only roles without
// `soon: true` are selectable; soon-flagged roles render dimmed for
// visible roadmap. Selecting an active role enables the Launch CTA.
//
// Each active role declares the (learner, industry) JSON pair it
// loads — content, theme, and language follow from there.

import { store } from '../store.js';

const CATEGORIES = [
  {
    id: 'public-service',
    label: 'Public Service',
    options: [
      { id: 'ems',    label: 'EMS',    learner: 'ems',    industry: 'public-safety' },
      { id: 'fire',   label: 'Fire',   soon: true },
      { id: 'police', label: 'Police', soon: true }
    ]
  },
  {
    id: 'education',
    label: 'Education',
    options: [
      { id: 'hied-student',  label: 'HiEd Student',  learner: 'hied-student', industry: 'education' },
      { id: 'k12',           label: 'K-12',          soon: true },
      { id: 'hied-faculty',  label: 'HiEd Faculty',  soon: true }
    ]
  },
  {
    id: 'commercial',
    label: 'Commercial',
    options: [
      { id: 'industrial', label: 'Industrial', learner: 'industrial', industry: 'commercial' }
    ]
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    options: [
      { id: 'training',   label: 'Training',   soon: true },
      { id: 'upskilling', label: 'Upskilling', soon: true }
    ]
  }
];

let selected = null;

export function render() {
  selected = null;

  const root = document.createElement('section');
  root.className = 'launch';
  root.innerHTML = `
    <div class="hero">
      <div class="brand">
        <span class="brand-mark"></span><span class="brand-name" style="font-weight:700">Aithera</span>
      </div>
      <h1>An adaptive learning layer that proves mastery, not completion.</h1>
      <p>Pick a profile to launch the prototype. Every screen below adapts to your choice.</p>
      <div id="cats"></div>
    </div>

    <div>
      <button class="btn primary block" id="go" disabled>Launch experience</button>
      <p class="muted tiny center" style="margin-top:10px">No sign-in. Profile is loaded from local JSON.</p>
    </div>
  `;

  const cats = root.querySelector('#cats');
  const goBtn = root.querySelector('#go');

  for (const cat of CATEGORIES) {
    const label = document.createElement('div');
    label.className = 'field-label';
    label.textContent = cat.label;
    cats.appendChild(label);

    const row = document.createElement('div');
    row.className = 'role-row';
    cats.appendChild(row);

    for (const opt of cat.options) {
      const btn = document.createElement('button');
      btn.className = 'role-pill' + (opt.soon ? ' soon' : '');
      btn.disabled = !!opt.soon;
      btn.innerHTML = opt.soon
        ? `<span>${opt.label}</span><small>Coming soon</small>`
        : `<span>${opt.label}</span>`;
      if (!opt.soon) {
        btn.onclick = () => {
          selected = opt;
          // clear other selections
          cats.querySelectorAll('.role-pill').forEach((b) => b.classList.toggle('selected', b === btn));
          goBtn.disabled = false;
        };
      }
      row.appendChild(btn);
    }
  }

  goBtn.onclick = async () => {
    if (!selected) return;
    goBtn.textContent = 'Loading…'; goBtn.disabled = true;
    try {
      await store.loadLearner(selected.learner, selected.industry);
      // Replace, not push — the launchpoint shouldn't be in history.
      location.replace(location.pathname + '#/home');
    } catch {
      goBtn.textContent = 'Failed to load — retry';
      goBtn.disabled = false;
    }
  };

  return root;
}
