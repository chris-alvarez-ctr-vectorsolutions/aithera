// app.js — router + shell wiring.
// Hash-based router so this works on GitHub Pages without server config.
// Each view module exports a `render(params)` function that returns an
// HTMLElement. The router replaces #view contents and updates chrome.

import { store } from './store.js';
import * as launch    from './views/launch.js';
import * as home      from './views/home.js';
import * as course    from './views/course.js';
import * as chapter   from './views/chapter.js';
import * as practice  from './views/practice.js';
import * as summary   from './views/summary.js';
import * as hub       from './views/hub.js';
import * as coachV    from './views/coach.js';
import * as profile   from './views/profile.js';
import * as courses   from './views/courses.js';
import * as reference from './views/reference.js';

// Each route declares whether it's a top-level tab (no back button) and
// what its logical parent is (so back navigates *within* the prototype
// rather than escaping to the launch page).
const ROUTES = [
  { re: /^#?\/?$/,                                view: launch,   shell: false, top: true  },
  { re: /^#\/launch$/,                            view: launch,   shell: false, top: true  },
  { re: /^#\/home$/,                              view: home,      shell: true,  top: true  },
  { re: /^#\/courses$/,                           view: courses,   shell: true,  top: true  },
  { re: /^#\/coach$/,                             view: coachV,    shell: true,  top: true  },
  { re: /^#\/practice$/,                          view: hub,       shell: true,  top: true  },
  { re: /^#\/reference$/,                         view: reference, shell: true,  top: true  },
  { re: /^#\/profile$/,                           view: profile,   shell: true,  parent: '#/home' },
  { re: /^#\/course\/([^/]+)$/,                   view: course,    shell: true,  parent: '#/courses' },
  { re: /^#\/course\/([^/]+)\/chapter\/([^/]+)$/, view: chapter,   shell: true,  parent: (m) => `#/course/${m[1]}` },
  { re: /^#\/practice\/([^/?]+)(?:\?.*)?$/,       view: practice,  shell: true,  fullscreen: true, parent: '#/practice' },
  { re: /^#\/summary$/,                           view: summary,   shell: true,  parent: '#/home' }
];

const els = {
  view:    document.getElementById('view'),
  appbar:  document.getElementById('appbar'),
  tabbar:  document.getElementById('tabbar'),
  back:    document.getElementById('backBtn'),
  profile: document.getElementById('profileBtn'),
  brand:   document.querySelector('.brand-name'),
  exit:    document.getElementById('exitBtn'),
  app:     document.getElementById('app')
};

// Exit (×) on fullscreen routes navigates to the route's logical parent.
els.exit.addEventListener('click', () => {
  const hash = location.hash || '#/';
  const match = ROUTES.find((r) => r.re.test(hash));
  if (!match) { location.hash = '#/home'; return; }
  const m = match.re.exec(hash);
  const parent = typeof match.parent === 'function' ? match.parent(m) : match.parent;
  location.hash = parent || '#/home';
});

// Smart back: navigate to the route's logical parent rather than browser
// history. This prevents accidentally escaping back to the launch page.
els.back.addEventListener('click', () => {
  const hash = location.hash || '#/';
  const match = ROUTES.find((r) => r.re.test(hash));
  if (!match || match.top) return;
  const m = match.re.exec(hash);
  const parent = typeof match.parent === 'function' ? match.parent(m) : match.parent;
  location.hash = parent || '#/home';
});
els.profile.addEventListener('click', () => location.hash = '#/profile');

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
  toggleShell(match.shell, !!match.fullscreen);
  els.back.hidden = !!match.top || !match.shell;
  highlightTab(hash);

  // Update brand label with industry name when shelled.
  if (match.shell && store.state.industry) {
    els.brand.textContent = `Aithera · ${store.state.industry.label}`;
  } else {
    els.brand.textContent = 'Aithera';
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function toggleShell(show, fullscreen = false) {
  // Fullscreen routes (e.g. Practice) sit *over* the prototype shell:
  // light theme stays on, but appbar/tabbar are hidden in favour of an
  // unobtrusive × exit button in the top-right corner.
  els.appbar.hidden = !show || fullscreen;
  els.tabbar.hidden = !show || fullscreen;
  els.exit.hidden = !fullscreen;
  els.app.classList.toggle('fullscreen', fullscreen);
  // Light theme is reserved for the prototype shell. The Launch screen
  // stays dark by virtue of NOT having .light on body.
  document.body.classList.toggle('light', show);
  document.querySelector('meta[name=theme-color]')
    ?.setAttribute('content', show ? '#f4f5f9' : '#0b1220');
}

function highlightTab(hash) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', hash.startsWith(t.dataset.route));
  });
}

// Re-render on store events so adaptive UI stays current.
store.subscribe(() => { if (location.hash) renderRoute(); });
