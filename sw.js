const CACHE_NAME = 'irly-barra-pos-v3';
const ASSETS = [
  './',
  './index.html',
  './checklist.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Nunca interceptar llamadas a Google Apps Script / Drive
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(networkResp => {
          if (networkResp && networkResp.status === 200) {
            const copy = networkResp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return networkResp;
        })
        .catch(() => cached || caches.match('./index.html') || caches.match('./'));

      return cached || fetchPromise;
    })
  );
});
