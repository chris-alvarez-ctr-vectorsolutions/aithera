// views/launch.js — Profile selector / prototype launch screen.
// Decision: industry choice drives the rest of the demo, so this is a
// guided 3-step pick (industry → role → experience) rather than a form.
// Selections map directly to JSON files in /data — that mapping is
// intentionally explicit so a reviewer can see how content extends.

import { store } from '../store.js';

const INDUSTRIES = [
  { id: 'public-safety', label: 'Public Safety',  hint: 'Fire, EMS, LE',          learner: 'firefighter' },
  { id: 'healthcare',    label: 'Healthcare',     hint: 'Nursing, allied health', learner: 'nurse'       },
  { id: 'education',     label: 'Education',      hint: 'K-12, higher-ed',        disabled: true },
  { id: 'manufacturing', label: 'Manufacturing',  hint: 'Plant, EHS',             disabled: true }
];

const ROLES = {
  'public-safety': ['Firefighter', 'EMT', 'Officer'],
  'healthcare':    ['Registered Nurse', 'Tech', 'Therapist']
};

const LEVELS = ['New', 'Intermediate', 'Advanced'];

const choice = { industry: null, role: null, level: null };

export function render() {
  const root = document.createElement('section');
  root.className = 'launch';
  root.innerHTML = `
    <div class="hero">
      <div class="brand">
        <span class="brand-mark"></span><span class="brand-name" style="font-weight:700">Aithera</span>
      </div>
      <h1>An adaptive learning layer that proves mastery, not completion.</h1>
      <p>Pick a profile to launch the prototype. Every screen below adapts to your choice.</p>

      <div class="field-label">Industry</div>
      <div class="pill-grid" id="ind"></div>

      <div class="field-label">Role</div>
      <div class="pill-grid" id="role"></div>

      <div class="field-label">Experience</div>
      <div class="pill-grid" id="lvl"></div>
    </div>

    <div>
      <button class="btn primary block" id="go" disabled>Launch experience</button>
      <p class="muted tiny center" style="margin-top:10px">No sign-in. Profile is loaded from local JSON.</p>
    </div>
  `;

  const indEl  = root.querySelector('#ind');
  const roleEl = root.querySelector('#role');
  const lvlEl  = root.querySelector('#lvl');
  const goBtn  = root.querySelector('#go');

  for (const i of INDUSTRIES) {
    const b = document.createElement('button');
    b.className = 'pill';
    b.disabled = !!i.disabled;
    if (i.disabled) b.style.opacity = 0.45;
    b.innerHTML = `<strong>${i.label}</strong><small>${i.hint}${i.disabled ? ' · soon' : ''}</small>`;
    b.onclick = () => {
      choice.industry = i.id; choice.role = null; choice.level = null;
      renderRoles(); renderLevels(); update();
      [...indEl.children].forEach((c) => c.classList.toggle('selected', c === b));
    };
    indEl.appendChild(b);
  }

  function renderRoles() {
    roleEl.innerHTML = '';
    const list = ROLES[choice.industry] ?? [];
    for (const r of list) {
      const b = document.createElement('button');
      b.className = 'pill';
      b.innerHTML = `<strong>${r}</strong><small>${choice.industry === 'public-safety' ? 'Operational' : 'Clinical'}</small>`;
      b.onclick = () => {
        choice.role = r; update();
        [...roleEl.children].forEach((c) => c.classList.toggle('selected', c === b));
      };
      roleEl.appendChild(b);
    }
  }

  function renderLevels() {
    lvlEl.innerHTML = '';
    for (const lv of LEVELS) {
      const b = document.createElement('button');
      b.className = 'pill';
      b.innerHTML = `<strong>${lv}</strong><small>Self-rated</small>`;
      b.onclick = () => {
        choice.level = lv; update();
        [...lvlEl.children].forEach((c) => c.classList.toggle('selected', c === b));
      };
      lvlEl.appendChild(b);
    }
  }

  function update() { goBtn.disabled = !(choice.industry && choice.role && choice.level); }

  goBtn.onclick = async () => {
    const industryDef = INDUSTRIES.find((i) => i.id === choice.industry);
    goBtn.textContent = 'Loading…'; goBtn.disabled = true;
    try {
      await store.loadLearner(industryDef.learner, choice.industry);
      // Replace, not push — the launchpoint shouldn't be in history.
      location.replace(location.pathname + '#/home');
    } catch (e) {
      goBtn.textContent = 'Failed to load — retry';
      goBtn.disabled = false;
    }
  };

  return root;
}
