// app.js — router + shell wiring.
// Hash-based router so this works on GitHub Pages without server config.
// Each view module exports a `render(params)` function that returns an
// HTMLElement. The router replaces #view contents and updates chrome.

import { store, profiles } from './store.js';
import * as launch    from './views/launch.js';
import * as guide     from './views/guide.js';
import * as home      from './views/home.js';
import * as course    from './views/course.js';
import * as courseStart from './views/course-start.js';
import * as lesson    from './views/lesson.js';
import * as practice  from './views/practice.js';
import * as ivMath    from './views/iv-math.js';
import * as summary   from './views/summary.js';
import * as celebrate from './views/celebrate.js';
import * as hub       from './views/hub.js';
import * as coachV    from './views/coach.js';
import * as coachHist from './views/coach-history.js';
import * as coachFab  from './views/coach-fab.js';
import * as profile   from './views/profile.js';
import * as courses   from './views/courses.js';
import * as reference from './views/reference.js';

// Each route declares whether it's a top-level tab (no back button) and
// what its logical parent is (so back navigates *within* the prototype
// rather than escaping to the launch page).
const ROUTES = [
  { re: /^#?\/?$/,                                view: launch,   shell: false, top: true  },
  { re: /^#\/launch$/,                            view: launch,   shell: false, top: true  },
  { re: /^#\/guide$/,                             view: guide,    shell: false, top: true  },
  { re: /^#\/home$/,                              view: home,      shell: true,  top: true  },
  { re: /^#\/courses$/,                           view: courses,   shell: true,  top: true  },
  { re: /^#\/coach$/,                             view: coachV,    shell: true,  top: true  },
  { re: /^#\/coach\/history$/,                    view: coachHist, shell: true,  parent: '#/coach' },
  { re: /^#\/practice$/,                          view: hub,       shell: true,  top: true  },
  { re: /^#\/reference$/,                         view: reference, shell: true,  top: true  },
  { re: /^#\/profile$/,                           view: profile,   shell: true,  parent: '#/home' },
  { re: /^#\/course\/([^/]+)$/,                   view: course,    shell: true,  hideTabbar: true, parent: '#/courses' },
  { re: /^#\/course\/([^/]+)\/start$/,            view: courseStart, shell: true, hideTabbar: true, parent: (m) => `#/course/${m[1]}` },
  { re: /^#\/course\/([^/]+)\/lesson\/([^/]+)$/,  view: lesson,    shell: true,  fullscreen: true, parent: (m) => `#/course/${m[1]}` },
  { re: /^#\/practice\/([^/?]+)$/,                view: practice,  shell: true,  fullscreen: true, parent: '#/practice' },
  { re: /^#\/iv-math\/([^/?]+)$/,                 view: ivMath,    shell: true,  fullscreen: true, parent: '#/practice' },
  { re: /^#\/practice-complete$/,                 view: celebrate, shell: true,  parent: '#/home' },
  { re: /^#\/summary$/,                           view: summary,   shell: true,  hideTabbar: true, parent: '#/home' }
];

const els = {
  view:    document.getElementById('view'),
  appbar:  document.getElementById('appbar'),
  tabbar:  document.getElementById('tabbar'),
  back:    document.getElementById('backBtn'),
  profile: document.getElementById('profileBtn'),
  brand:   document.querySelector('.brand-name'),
  exit:    document.getElementById('exitBtn'),
  app:     document.getElementById('app'),
  fab:     document.getElementById('coachFab')
};

// Mount the persistent Coach Vic FAB once. It manages its own popover
// internally; the router only controls when it's visible.
coachFab.mount(els.fab);

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
    query.set('p', store.state.profileSlug);
    const enriched = `${path}?${query.toString()}`;
    history.replaceState(null, '', `${location.pathname}${location.search}${enriched}`);
  }

  const params = match.re.exec(path)?.slice(1) ?? [];
  // Scenario-type lessons render the practice engine directly — no
  // intermediate empty lesson view, no second renderRoute pass.
  let view = match.view;
  if (view === lesson && params.length === 2) {
    const c = store.course(params[0]);
    const l = c?.lessons.find((x) => x.id === params[1]);
    if (l?.type === 'scenario' && l.scenarioId) {
      const enriched = `#/practice/${l.scenarioId}?courseLesson=${c.id}:${l.id}${store.state.profileSlug ? `&p=${store.state.profileSlug}` : ''}`;
      history.replaceState(null, '', `${location.pathname}${location.search}${enriched}`);
      view = practice;
      params.length = 0;
      params.push(l.scenarioId);
    }
  }
  const node = view.render(...params);

  els.view.replaceChildren(node);
  const isHome = path === '#/home';
  const isCoach = path === '#/coach';
  document.body.classList.toggle('coach-mode', isCoach);
  toggleShell(match.shell, !!match.fullscreen, isHome, !!match.hideTabbar);
  // FAB: visible on every shelled, non-fullscreen page except Coach Vic
  // itself (and the chat history list, which lives under /coach).
  const fabVisible = !!match.shell && !match.fullscreen && !path.startsWith('#/coach');
  coachFab.setVisible(fabVisible);
  // Back is a floating button on shelled non-home, non-fullscreen routes.
  els.back.hidden = !match.shell || !!match.top || !!match.fullscreen;
  highlightTab(path);

  els.brand.textContent = 'Aithera';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function toggleShell(show, fullscreen = false, isHome = false, hideTabbar = false) {
  // Fullscreen routes (e.g. Practice) sit *over* the prototype shell:
  // light theme stays on, but appbar/tabbar are hidden in favour of an
  // unobtrusive × exit button in the top-right corner.
  // Appbar is reserved for Home (brand + profile); other shelled pages
  // use a floating back button instead.
  // hideTabbar: shelled route that swaps the tab bar for a page-owned
  // sticky CTA (e.g. course details).
  els.appbar.hidden = !show || fullscreen || !isHome;
  els.tabbar.hidden = !show || fullscreen || hideTabbar;
  els.exit.hidden = !fullscreen;
  els.app.classList.toggle('fullscreen', fullscreen);
  document.body.classList.toggle('no-tabbar', show && !fullscreen && hideTabbar);
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

// Track the on-screen keyboard via the visual viewport so coach-mode can
// keep the chat composer pinned just above it on mobile.
if (window.visualViewport) {
  const vv = window.visualViewport;
  const update = () => {
    const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb-offset', `${offset}px`);
  };
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  update();
}
