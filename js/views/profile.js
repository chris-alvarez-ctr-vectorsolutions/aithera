// views/profile.js — Lightweight "Me" page that exposes the loaded
// JSON profile so a reviewer can SEE the data driving the experience.
// Also doubles as the prototype control panel — phase jumps live here.
import { store } from '../store.js';
import { triggerPolicyEventIfNeeded, personaScenarios } from '../phase.js';

export function render() {
  const { learner, industry, mastery, phase } = store.state;
  const root = document.createElement('section');
  root.innerHTML = `
    <h2 style="margin:6px 4px 4px">Profile</h2>
    <p class="muted" style="margin:0 4px 12px">This page is intentionally transparent — the JSON below is what's driving the rest of the app.</p>

    <div class="card">
      <div class="row between">
        <div>
          <h3 style="margin:0">${learner.name}</h3>
          <p class="muted" style="margin:2px 0 0">${learner.role} · ${learner.experienceLevel}</p>
        </div>
        <span class="tag accent">${industry.label}</span>
      </div>
      <hr class="hr" />
      <div class="kv"><span>Years in role</span><span>${learner.yearsInRole}</span></div>
      <div class="kv"><span>Coach tone</span><span>${learner.preferences.coachTone}</span></div>
      <div class="kv"><span>Media preference</span><span>${learner.preferences.mediaPreference.join(', ')}</span></div>
      <div class="kv"><span>Streak</span><span>${learner.stats.streakDays} days</span></div>
    </div>

    <div class="card" style="border:1px dashed var(--accent)">
      <div class="row between">
        <strong>Prototype controls</strong>
        <span class="tag accent">Phase ${phase}</span>
      </div>
      <p class="muted tiny" style="margin:6px 0 10px">Jump to any phase to test that part of the maturity journey. Jumping seeds matching state so the UI reads coherently.</p>
      <div class="row" style="gap:6px;flex-wrap:wrap">
        ${[1,2,3,4].map((n) => `
          <button class="btn sm${n===phase?' primary':''}" data-phase="${n}">Phase ${n}</button>
        `).join('')}
      </div>
      <p class="tiny muted" style="margin-top:10px">
        <strong>P1</strong> baseline · <strong>P2</strong> after course scenario · <strong>P3</strong> adaptive course · <strong>P4</strong> policy drop + proactive coach.
      </p>
      <hr class="hr" />
      <button class="btn block" id="resetProgress">Reset progress (keep profile)</button>
    </div>

    ${learner.certifications?.length ? `
    <div class="card">
      <strong>Certifications</strong>
      ${learner.certifications.map((c) => `
        <div class="kv"><span>${c.label}</span><span class="${c.expiresInDays<=30?'tag warn':'muted tiny'}">${c.expiresInDays} days</span></div>
      `).join('')}
    </div>` : ''}

    <div class="card">
      <strong>Concept mastery</strong>
      ${Object.entries(mastery.concepts).map(([cid, v]) => `
        <div class="kv"><span>${cid}</span><span>${(v*100|0)}%</span></div>
        <div class="progress"><span style="width:${v*100}%"></span></div>
      `).join('')}
    </div>

    <div class="card">
      <strong>Settings</strong>
      <p class="muted tiny" style="margin-top:6px">Switching profile clears local prototype state and reloads the launchpoint.</p>
      <button class="btn block" id="reset" style="margin-top:10px">Switch profile (reload)</button>
      <hr class="hr" />
      <p class="muted tiny" style="margin-top:0">If the prototype looks out of date, the offline cache is stale. Force-refresh wipes it and re-pulls every file.</p>
      <button class="btn block" id="hardRefresh" style="margin-top:8px">Force refresh app (clear cache)</button>
      <p class="tiny muted" style="margin-top:6px;text-align:center" id="appVersion"></p>
    </div>
  `;

  // Phase jump buttons
  root.querySelectorAll('button[data-phase]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const n = parseInt(btn.dataset.phase, 10);
      seedPhase(n);
    });
  });

  root.querySelector('#resetProgress').onclick = () => {
    const m = store.state.mastery;
    if (m) {
      m.recentPractice = [];
      m.courseProgress = {};
      m.completedChapters = {};
    }
    store.setPhase(1);
  };

  root.querySelector('#reset').onclick = () => {
    store.reset();
    const base = location.pathname;
    location.replace(base);
  };
  root.querySelector('#hardRefresh').onclick = async () => {
    const btn = root.querySelector('#hardRefresh');
    btn.disabled = true; btn.textContent = 'Clearing…';
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in self) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    store.reset();
    try { localStorage.clear(); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('_', Date.now().toString());
    url.hash = '';
    location.replace(url.toString());
  };
  root.querySelector('#appVersion').textContent = `Build · ${new Date().toISOString().slice(0,10)}`;
  return root;
}

// Seed mastery / practice state so a jumped-to phase reads coherently.
// We don't fully simulate a journey — just stamp enough that the UI
// shows the post-completion state for prior phases.
function seedPhase(n) {
  const s = store.state;
  if (!s.mastery) return;

  // Reset transient state first so jumping is deterministic.
  s.mastery.recentPractice = [];
  s.policyEvent = null;
  // Restore concept mastery to baseline so cumulative jumps don't drift.
  if (s._initialConcepts) {
    s.mastery.concepts = JSON.parse(JSON.stringify(s._initialConcepts));
  }

  // Find scenarios marked for the relevant phases for THIS persona.
  // (Two personas can share an industry, so filter by persona, not industry.)
  const ps = personaScenarios();
  const ofPhase = (p) => ps.find((x) => x.phaseHint === p);

  // Seed a "completed" record for each prior phase scenario so the
  // practice readiness card and home progress widgets reflect that the
  // learner has done the prior work.
  const seed = (sc, idx) => {
    if (!sc) return;
    const score = 0.82;
    s.mastery.recentPractice.unshift({
      scenarioId: sc.id,
      courseId: sc.courseId || null,
      concepts: sc.concepts || [],
      score,
      stepResults: [],
      elapsed: 240,
      retryCount: 0,
      at: Date.now() - (idx + 1) * 86400000,
      completedAt: Date.now() - (idx + 1) * 86400000,
      readinessBefore: 50 + idx * 5,
      readinessAfter:  55 + idx * 5,
      readinessDelta:  5
    });
    // bump concept mastery the same way recordPractice would
    for (const cid of sc.concepts || []) {
      const cur = s.mastery.concepts[cid] ?? 0.5;
      s.mastery.concepts[cid] = Math.min(1, cur + 0.08);
    }
  };

  if (n >= 2) seed(ofPhase(1), 0);
  if (n >= 3) seed(ofPhase(2), 1);
  if (n >= 4) seed(ofPhase(3), 2);

  store.setPhase(n);
  if (n === 4) triggerPolicyEventIfNeeded();
}
