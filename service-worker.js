// Do You Love Me? — Service Worker
// Handles offline caching so the app can be installed and opened without internet.

const CACHE_NAME = 'love-prank-cache-v7';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/index2.html',
  '/index3.html',
  '/index4.html',
  '/index5.html',
  '/index6.html',
  '/index7.html',
  '/index8.html',
  '/index9.html',
  '/index10.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-32.png',
  '/favicon-192.png',
  '/logo.png'
];

// Install: pre-cache the core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML pages (so updates always show), cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests on our own origin; let ad/analytics/cross-origin requests pass through normally
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  const isHTMLNavigation = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (isHTMLNavigation) {
    // Network-first: always try to get the latest page from the server.
    // Only fall back to cache if the network is unavailable (offline).
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Static assets (images, manifest, etc.): cache-first for speed
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {});
    })
  );
});
