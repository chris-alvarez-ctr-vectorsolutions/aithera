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
    accent: '#3ec8ff', accent2: '#7ee0ff',
    options: [
      { id: 'ems',    label: 'EMS',    profile: 'ems' },
      { id: 'fire',   label: 'Fire',   soon: true },
      { id: 'police', label: 'Police', soon: true }
    ]
  },
  {
    id: 'education',
    label: 'Education',
    accent: '#3ec8ff', accent2: '#7ee0ff',
    options: [
      { id: 'hied-student',  label: 'HiEd Student',  profile: 'hied-student' },
      { id: 'k12-student',   label: 'K-12 Student',  profile: 'k12-student' },
      { id: 'k12-employee',  label: 'K-12 Employee', profile: 'k12-employee' },
      { id: 'hied-faculty',  label: 'HiEd Faculty',  soon: true }
    ]
  },
  {
    id: 'commercial',
    label: 'Commercial',
    accent: '#3ec8ff', accent2: '#7ee0ff',
    options: [
      { id: 'industrial', label: 'Industrial', profile: 'industrial' }
    ]
  }
];

// Experiments — standalone prototype pages outside the main app shell.
// Each opens its own HTML page; add new entries here to surface them on
// the launch screen.
const EXPERIMENTS = [
  {
    id: 'pano-tanker-spill',
    label: 'Tanker spill panorama',
    desc: 'Pan & zoom an immersive 360° scene',
    href: 'immersive.html?scene=tanker-spill',
    icon: '🌐'
  },
  {
    id: 'pano-tanker-response',
    label: 'Highway spill response',
    desc: 'Aftermath with emergency responders on scene',
    href: 'immersive.html?scene=tanker-response',
    icon: '🚒'
  },
  {
    id: 'voice-tanker-sizeup',
    label: 'Voice size-up — highway spill',
    desc: 'Narrate what you see; Coach Vic listens for key observations',
    href: 'voice-scene.html',
    icon: '🎙'
  },
  {
    id: 'staging-2alarm',
    label: 'Fireground staging — 2-alarm',
    desc: 'Place apparatus on a live map; get a scored critique',
    href: 'staging.html',
    icon: '🗺'
  },
  {
    id: 'scenario-marshall',
    label: 'Scenario simulator — The Marshall scenario',
    desc: '3-phase AI chat: sex-based harassment, empathy, bystander intervention',
    href: 'scenario-marshall.html',
    icon: '💬'
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
        <span class="brand-mark brand-mark-cyan" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="aith-launch-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#3ec8ff"/>
                <stop offset="1" stop-color="#7ee0ff"/>
              </linearGradient>
            </defs>
            <path d="M16 3.5c-1.4 0-2.6.8-3.2 2L4.6 22.7c-.7 1.5.4 3.3 2.1 3.3h3.1c1 0 1.9-.6 2.2-1.5l.6-1.7h7l.6 1.7c.3.9 1.2 1.5 2.2 1.5h3.1c1.7 0 2.8-1.8 2.1-3.3L19.2 5.5c-.6-1.2-1.8-2-3.2-2zM13.7 18.4L16 12.2l2.3 6.2h-4.6z" fill="url(#aith-launch-g)"/>
          </svg>
        </span><span class="brand-name" style="font-weight:700">Aithera</span>
      </div>
      <h1>A Vector Labs exploration</h1>
      <p>Pick a profile to launch the prototype. Every screen below adapts to your choice.</p>
      <div id="cats"></div>
    </div>

    <div class="launch-cta">
      <button class="btn primary block" id="go" disabled>Launch experience</button>
      <p class="muted tiny center" style="margin-top:10px">No sign-in. Profile is loaded from local JSON.</p>
      <a class="launch-guide-link" href="#/guide">📘 User testing guide ›</a>

      <section class="launch-experiments" id="experiments">
        <div class="launch-experiments-head">Experiments</div>
        <ul class="launch-experiments-list" id="experimentsList"></ul>
      </section>
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

  const expList = root.querySelector('#experimentsList');
  for (const exp of EXPERIMENTS) {
    const li = document.createElement('li');
    li.className = 'launch-experiment';
    li.innerHTML = `
      <a class="launch-experiment-link" href="${exp.href}">
        <span class="launch-experiment-icon" aria-hidden="true">${exp.icon || '▶'}</span>
        <span class="launch-experiment-text">
          <span class="launch-experiment-label">${exp.label}</span>
          <span class="launch-experiment-desc">${exp.desc}</span>
        </span>
        <span class="launch-experiment-arrow" aria-hidden="true">›</span>
      </a>
    `;
    expList.appendChild(li);
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
