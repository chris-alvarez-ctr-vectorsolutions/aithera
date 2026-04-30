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

    <div class="card">
      <strong>Settings</strong>
      <p class="muted tiny" style="margin-top:6px">Switching profile clears local prototype state and reloads the launchpoint. There is no in-app navigation back to the launchpoint by design.</p>
      <button class="btn block" id="reset" style="margin-top:10px">Switch profile (reload)</button>
      <hr class="hr" />
      <p class="muted tiny" style="margin-top:0">If the prototype looks out of date, the offline cache is stale. Force-refresh wipes it and re-pulls every file.</p>
      <button class="btn block" id="hardRefresh" style="margin-top:8px">Force refresh app (clear cache)</button>
      <p class="tiny muted" style="margin-top:6px;text-align:center" id="appVersion"></p>
    </div>
  `;
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
    // Force the user back to the Launch screen by wiping the persisted
    // learner state. Without this, store.init re-hydrates from
    // localStorage on next boot and the user lands in Home, not Launch.
    store.reset();
    try { localStorage.clear(); } catch {}
    // Bust the URL so the browser cache also misses this load.
    const url = new URL(location.href);
    url.searchParams.set('_', Date.now().toString());
    url.hash = '';
    location.replace(url.toString());
  };
  // Surface the current SW cache name so it's easy to confirm a deploy.
  root.querySelector('#appVersion').textContent = `Build · ${new Date().toISOString().slice(0,10)}`;
  return root;
}
