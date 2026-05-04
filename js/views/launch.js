// views/launch.js — Launch screen / profile selector.
// Four top-level categories, each with role pills. Only roles without
// `soon: true` are selectable; soon-flagged roles render dimmed for
// visible roadmap. Selecting an active role enables the Launch CTA.
//
// Each active role declares the (learner, industry) JSON pair it
// loads — content, theme, and language follow from there.

import { store } from '../store.js';

// Per-category accent colors give the launchpoint a hint of the brand
// theme that will load once a profile is picked. The active-industry
// JSONs drive these in the rest of the app; we mirror them here so the
// transition into the prototype feels continuous.
const CATEGORIES = [
  {
    id: 'public-service',
    label: 'Public Service',
    accent: '#ff7a3d', accent2: '#ffb27a',
    options: [
      { id: 'ems',    label: 'EMS',    profile: 'ems' },
      { id: 'fire',   label: 'Fire',   soon: true },
      { id: 'police', label: 'Police', soon: true }
    ]
  },
  {
    id: 'education',
    label: 'Education',
    accent: '#a78bfa', accent2: '#c4b5fd',
    options: [
      { id: 'hied-student',  label: 'HiEd Student',  profile: 'hied-student' },
      { id: 'k12',           label: 'K-12',          soon: true },
      { id: 'hied-faculty',  label: 'HiEd Faculty',  soon: true }
    ]
  },
  {
    id: 'commercial',
    label: 'Commercial',
    accent: '#fbbf24', accent2: '#fcd34d',
    options: [
      { id: 'industrial', label: 'Industrial', profile: 'industrial' }
    ]
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    accent: '#3ec8ff', accent2: '#7ee0ff',
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
          selected = { ...opt, accent: cat.accent, accent2: cat.accent2 };
          // Clear other selections, then mark this one.
          cats.querySelectorAll('.role-pill').forEach((b) => b.classList.toggle('selected', b === btn));
          // Tint the launchpoint with the category's color so the
          // selected pill and primary CTA both preview the brand.
          root.style.setProperty('--accent', cat.accent);
          root.style.setProperty('--accent-2', cat.accent2);
          goBtn.disabled = false;
        };
      }
      row.appendChild(btn);
    }
  }

  goBtn.onclick = async () => {
    if (!selected) return;
    // Snapshot the selected profile: store.loadProfile triggers store.emit,
    // which re-renders the launch view and clears `selected` mid-flight.
    const profileSlug = selected.profile;
    goBtn.disabled = true;
    showLoadingOverlay(selected);
    // Fire the data load and a minimum-display timer in parallel so the
    // overlay always feels deliberate, even on a fast local fetch.
    const minDelay = new Promise((r) => setTimeout(r, 1100));
    try {
      await Promise.all([store.loadProfile(profileSlug), minDelay]);
      // Replace, not push — the launchpoint shouldn't be in history.
      const next = `${location.pathname}${location.search}#/home?p=${encodeURIComponent(profileSlug)}`;
      location.replace(next);
      // Fade the overlay out once the home view has had a paint cycle.
      requestAnimationFrame(() => requestAnimationFrame(() => hideLoadingOverlay()));
    } catch {
      hideLoadingOverlay();
      goBtn.textContent = 'Failed to load — retry';
      goBtn.disabled = false;
    }
  };

  return root;
}

// Fullscreen "preparing your experience" overlay. Tinted with the
// selected category's accent so the handoff to the prototype feels
// continuous instead of a hard cut.
function showLoadingOverlay(sel) {
  const ov = document.createElement('div');
  ov.className = 'launch-loading';
  ov.id = 'launchLoading';
  ov.style.setProperty('--accent', sel.accent);
  ov.style.setProperty('--accent-2', sel.accent2);
  ov.innerHTML = `
    <div class="ll-stack">
      <span class="ll-mark"></span>
      <div class="ll-name">Aithera</div>
      <div class="ll-spinner"></div>
      <div class="ll-msg">Preparing your experience…</div>
    </div>
  `;
  document.body.appendChild(ov);
  // Force a reflow so the fade-in transition runs.
  // eslint-disable-next-line no-unused-expressions
  ov.offsetHeight;
  ov.classList.add('on');
}

function hideLoadingOverlay() {
  const ov = document.getElementById('launchLoading');
  if (!ov) return;
  ov.classList.remove('on');
  setTimeout(() => ov.remove(), 280);
}
