// Do You Love Me? — Service Worker
// Handles offline caching so the app can be installed and opened without internet.

const CACHE_NAME = 'love-prank-cache-v4';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/index2.html',
  '/index3.html',
  '/index4.html',
  '/index5.html',
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

// Fetch: cache-first for same-origin requests, network for everything else (ads, fonts, etc.)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests on our own origin; let ad/analytics/cross-origin requests pass through normally
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache a copy of successfully fetched same-origin assets
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to the main page if offline and page isn't cached
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
