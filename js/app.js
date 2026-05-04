// app.js — router + shell wiring.
// Hash-based router so this works on GitHub Pages without server config.
// Each view module exports a `render(params)` function that returns an
// HTMLElement. The router replaces #view contents and updates chrome.

import { store, profiles } from './store.js';
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
  { re: /^#\/practice\/([^/?]+)$/,                view: practice,  shell: true,  fullscreen: true, parent: '#/practice' },
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

// Split the hash into its route path and query string. Profile selection
// rides on `?p=<slug>` so a shared link can boot the app into the right
// learner context without depending on localStorage.
function parseHash() {
  const raw = location.hash || '#/';
  const i = raw.indexOf('?');
  const path = i >= 0 ? raw.slice(0, i) : raw;
  const query = new URLSearchParams(i >= 0 ? raw.slice(i + 1) : '');
  return { path, query };
}

// True for routes that represent app content (anything inside the shell).
// The launchpoint itself doesn't need a profile in the URL.
function isShelledPath(path) {
  const m = ROUTES.find((r) => r.re.test(path));
  return !!(m && m.shell);
}

// Set the next hash, preserving the current profile slug as `?p=<slug>`
// on shelled routes so links remain shareable.
function setHash(path) {
  const slug = store.state.profileSlug;
  if (slug && isShelledPath(path)) {
    location.hash = `${path}?p=${encodeURIComponent(slug)}`;
  } else {
    location.hash = path;
  }
}

// Exit (×) on fullscreen routes navigates to the route's logical parent.
els.exit.addEventListener('click', () => {
  const { path } = parseHash();
  const match = ROUTES.find((r) => r.re.test(path));
  if (!match) { setHash('#/home'); return; }
  const m = match.re.exec(path);
  const parent = typeof match.parent === 'function' ? match.parent(m) : match.parent;
  setHash(parent || '#/home');
});

// Smart back: navigate to the route's logical parent rather than browser
// history. This prevents accidentally escaping back to the launch page.
els.back.addEventListener('click', () => {
  const { path } = parseHash();
  const match = ROUTES.find((r) => r.re.test(path));
  if (!match || match.top) return;
  const m = match.re.exec(path);
  const parent = typeof match.parent === 'function' ? match.parent(m) : match.parent;
  setHash(parent || '#/home');
});
els.profile.addEventListener('click', () => setHash('#/profile'));

document.querySelectorAll('[data-route]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    setHash(el.dataset.route);
  });
});

window.addEventListener('hashchange', renderRoute);

(async function bootstrap() {
  await store.init();
  // If the URL carries a profile slug, honour it before rendering — this
  // is what makes a private-window paste-in resolve to the right context.
  const { path, query } = parseHash();
  const wanted = query.get('p');
  if (wanted && profiles.has(wanted) && store.state.profileSlug !== wanted) {
    try { await store.loadProfile(wanted); } catch {}
  }
  // Direct link to a shelled route with no profile available (no LS, no
  // ?p=) → load the default profile instead of bouncing to the launchpoint.
  if (!store.state.learner && path !== '#/' && path !== '#/launch' && isShelledPath(path)) {
    try { await store.loadProfile(profiles.default); } catch {}
  }
  if (!location.hash) {
    setHash(store.state.learner ? '#/home' : '#/launch');
  } else {
    renderRoute();
  }
})();

function renderRoute() {
  const { path, query } = parseHash();
  // If learner not loaded but route demands shell → load the default
  // profile rather than redirect away. This keeps deep links working.
  const match = ROUTES.find((r) => r.re.test(path));
  if (!match) { setHash('#/home'); return; }
  if (match.shell && !store.state.learner) {
    store.loadProfile(profiles.default).then(() => renderRoute()).catch(() => {
      location.hash = '#/launch';
    });
    return;
  }

  // If the URL is missing the profile slug for a shelled route, rewrite
  // it in place so what the user copies from the address bar is shareable.
  if (store.state.profileSlug && match.shell && !query.get('p')) {
    const enriched = `${path}?p=${encodeURIComponent(store.state.profileSlug)}`;
    history.replaceState(null, '', `${location.pathname}${location.search}${enriched}`);
  }

  const params = match.re.exec(path)?.slice(1) ?? [];
  const node = match.view.render(...params);

  els.view.replaceChildren(node);
  const isHome = path === '#/home';
  toggleShell(match.shell, !!match.fullscreen, isHome);
  // Back is a floating button on shelled non-home, non-fullscreen routes.
  els.back.hidden = !match.shell || !!match.top || !!match.fullscreen;
  highlightTab(path);

  if (isHome && store.state.industry) {
    els.brand.textContent = `Aithera · ${store.state.industry.label}`;
  } else {
    els.brand.textContent = 'Aithera';
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function toggleShell(show, fullscreen = false, isHome = false) {
  // Fullscreen routes (e.g. Practice) sit *over* the prototype shell:
  // light theme stays on, but appbar/tabbar are hidden in favour of an
  // unobtrusive × exit button in the top-right corner.
  // Appbar is reserved for Home (brand + profile); other shelled pages
  // use a floating back button instead.
  els.appbar.hidden = !show || fullscreen || !isHome;
  els.tabbar.hidden = !show || fullscreen;
  els.exit.hidden = !fullscreen;
  els.app.classList.toggle('fullscreen', fullscreen);
  // Light theme is reserved for the prototype shell. The Launch screen
  // stays dark by virtue of NOT having .light on body.
  document.body.classList.toggle('light', show);
  document.querySelector('meta[name=theme-color]')
    ?.setAttribute('content', show ? '#f4f5f9' : '#0b1220');
}

function highlightTab(path) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', path.startsWith(t.dataset.route));
  });
}

// Re-render on store events so adaptive UI stays current.
store.subscribe(() => { if (location.hash) renderRoute(); });
