// app.js — router + shell wiring.
// Hash-based router so this works on GitHub Pages without server config.
// Each view module exports a `render(params)` function that returns an
// HTMLElement. The router replaces #view contents and updates chrome.

import { store } from './store.js';
import * as launch   from './views/launch.js';
import * as home     from './views/home.js';
import * as course   from './views/course.js';
import * as chapter  from './views/chapter.js';
import * as practice from './views/practice.js';
import * as summary  from './views/summary.js';
import * as hub      from './views/hub.js';
import * as coachV   from './views/coach.js';
import * as profile  from './views/profile.js';

const ROUTES = [
  { re: /^#?\/?$/,                      view: launch,  shell: false },
  { re: /^#\/launch$/,                  view: launch,  shell: false },
  { re: /^#\/home$/,                    view: home,    shell: true  },
  { re: /^#\/course\/([^/]+)$/,         view: course,  shell: true  },
  { re: /^#\/course\/([^/]+)\/chapter\/([^/]+)$/, view: chapter, shell: true },
  { re: /^#\/practice\/([^/]+)$/,       view: practice,shell: true  },
  { re: /^#\/summary$/,                 view: summary, shell: true  },
  { re: /^#\/hub$/,                     view: hub,     shell: true  },
  { re: /^#\/coach$/,                   view: coachV,  shell: true  },
  { re: /^#\/profile$/,                 view: profile, shell: true  }
];

const els = {
  view:    document.getElementById('view'),
  appbar:  document.getElementById('appbar'),
  tabbar:  document.getElementById('tabbar'),
  back:    document.getElementById('backBtn'),
  profile: document.getElementById('profileBtn'),
  fab:     document.getElementById('coachFab'),
  brand:   document.querySelector('.brand-name')
};

els.back.addEventListener('click', () => history.back());
els.profile.addEventListener('click', () => location.hash = '#/profile');
els.fab.addEventListener('click', () => location.hash = '#/coach');

document.querySelectorAll('[data-route]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = el.dataset.route;
  });
});

window.addEventListener('hashchange', renderRoute);

(async function bootstrap() {
  await store.init();
  if (!location.hash) location.hash = store.state.learner ? '#/home' : '#/launch';
  else renderRoute();
})();

function renderRoute() {
  const hash = location.hash || '#/';
  // If learner not loaded but route demands shell → bounce to launch.
  const match = ROUTES.find((r) => r.re.test(hash));
  if (!match) { location.hash = '#/home'; return; }
  if (match.shell && !store.state.learner) { location.hash = '#/launch'; return; }

  const params = match.re.exec(hash)?.slice(1) ?? [];
  const node = match.view.render(...params);

  els.view.replaceChildren(node);
  toggleShell(match.shell);
  highlightTab(hash);

  // Update brand label with industry name when shelled.
  if (match.shell && store.state.industry) {
    els.brand.textContent = `Aithera · ${store.state.industry.label}`;
  } else {
    els.brand.textContent = 'Aithera';
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function toggleShell(show) {
  els.appbar.hidden = !show;
  els.tabbar.hidden = !show;
  els.fab.hidden = !show || location.hash === '#/coach';
}

function highlightTab(hash) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', hash.startsWith(t.dataset.route));
  });
}

// Re-render on store events so adaptive UI stays current.
store.subscribe(() => { if (location.hash) renderRoute(); });
