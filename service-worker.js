// Aithera service worker — minimal cache-first PWA shell.
// Strategy:
//   - Pre-cache the app shell + JSON data on install.
//   - Network-first for navigation requests (so updates show up).
//   - Cache-first for everything else, with runtime fallback to cache.
const VERSION = 'aithera-v2';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/store.js',
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
  './data/industries/public-safety.json',
  './data/industries/healthcare.json',
  './data/courses.json',
  './data/scenarios.json',
  './data/mastery.json',
  './data/reference.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
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
