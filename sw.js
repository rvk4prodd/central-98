const CACHE_NAME = 'central98-shell-v3';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/os98.css',
  './js/main.js',
  './js/state.js',
  './js/data/victims.js',
  './js/data/upgrades.js',
  './js/engine/ai-client.js',
  './js/engine/audio.js',
  './js/engine/sprites.js',
  './js/engine/game.js',
  './js/ui/windows.js',
  './js/ui/apps.js',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // External AI/TTS API requests stay network-only
    return;
  }

  // Network-first for shell assets so updates apply immediately, falling back to cache offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
