// views/profile.js — Lightweight "Me" page that exposes the loaded
// JSON profile so a reviewer can SEE the data driving the experience.
// Includes a "switch profile" affordance to reset the demo.
import { store } from '../store.js';

export function render() {
  const { learner, industry, mastery } = store.state;
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

    <div class="card">
      <strong>Certifications</strong>
      ${learner.certifications.map((c) => `
        <div class="kv"><span>${c.label}</span><span class="${c.expiresInDays<=30?'tag warn':'muted tiny'}">${c.expiresInDays} days</span></div>
      `).join('')}
    </div>

    <div class="card">
      <strong>Concept mastery</strong>
      ${Object.entries(mastery.concepts).map(([cid, v]) => `
        <div class="kv"><span>${cid}</span><span>${(v*100|0)}%</span></div>
        <div class="progress"><span style="width:${v*100}%"></span></div>
      `).join('')}
    </div>

    <button class="btn block" id="reset">Switch profile</button>
  `;
  root.querySelector('#reset').onclick = () => { store.reset(); location.hash = '#/launch'; };
  return root;
}
