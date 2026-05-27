const CACHE_NAME = 'photobooth-io-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './dashboard.html',
  './reports.html',
  './bugs.html',
  './archive.html',
  './settings.html',
  './manifest.json',
  './assets/css/variables.css',
  './assets/css/global.css',
  './assets/css/layout.css',
  './assets/css/utilities.css',
  './assets/css/components.css',
  './assets/css/responsive.css',
  './assets/css/pages/login.css',
  './assets/css/pages/dashboard.css',
  './assets/css/pages/archive.css',
  './assets/css/pages/bugs.css',
  './assets/css/pages/reports.css',
  './assets/js/storage.js',
  './assets/js/ui.js',
  './assets/js/markdown.js',
  './assets/js/search.js',
  './assets/js/notifications.js',
  './assets/js/auth.js',
  './assets/js/dashboard.js',
  './assets/js/reports.js',
  './assets/js/bugs.js',
  './assets/js/archive.js',
  './assets/js/app.js',
  './assets/icons/photobooth-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return caches.match('./index.html');
      })
  );
});