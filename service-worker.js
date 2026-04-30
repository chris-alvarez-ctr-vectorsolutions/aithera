// Aithera service worker — network-first PWA shell.
// Strategy:
//   - Pre-cache the app shell + JSON data on install (for offline first run).
//   - Network-first for navigations and all app code (JS/CSS/HTML/JSON).
//     Every reload fetches fresh — no stale code, no version bumps required
//     to ship a fix to testers. Cache is only a fallback when offline.
//   - Cache-first for other GETs (images, fonts, etc.).
const VERSION = 'aithera-v19';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/store.js',
  './js/ui.js',
  './js/adaptive.js',
  './js/coach.js',
  './js/views/launch.js',
  './js/views/home.js',
  './js/views/course.js',
  './js/views/chapter.js',
  './js/views/practice.js',
  './js/views/summary.js',
  './js/views/hub.js',
  './js/views/coach.js',
  './js/views/profile.js',
  './js/views/courses.js',
  './js/views/reference.js',
  './data/learners/firefighter.json',
  './data/learners/nurse.json',
  './data/learners/ems.json',
  './data/learners/hied-student.json',
  './data/learners/industrial.json',
  './data/industries/public-safety.json',
  './data/industries/healthcare.json',
  './data/industries/education.json',
  './data/industries/commercial.json',
  './data/courses.json',
  './data/scenarios.json',
  './data/mastery.json',
  './data/reference.json',
  './data/coach-script.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

// The page can ask us to skip waiting via postMessage (see index.html).
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Strategy:
//   - Navigations + app code (JS/CSS/HTML/JSON): network-first. Every reload
//     pulls fresh bytes; cache is only a fallback when the network fails.
//   - Other GETs (images, fonts, etc.): cache-first.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  const url = new URL(req.url);
  const isAppCode = /\.(?:js|css|html|json|webmanifest)$/i.test(url.pathname);

  if (isAppCode) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
