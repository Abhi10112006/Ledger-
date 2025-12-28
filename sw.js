
const CACHE_NAME = 'abhi-ledger-v1';

// Assets to cache immediately on install
// We focus on the shell and external static resources to speed up load times
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. External CDNs (React, Tailwind, Fonts): Cache First Strategy
  // These rarely change, so we serve from cache immediately for speed.
  if (
    url.hostname === 'esm.sh' || 
    url.hostname === 'cdn.tailwindcss.com' || 
    url.hostname === 'fonts.googleapis.com' || 
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdn-icons-png.flaticon.com'
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          // Verify response is valid before caching
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'cors' && fetchResponse.type !== 'basic' && fetchResponse.type !== 'opaque') {
            return fetchResponse;
          }
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // 2. Local App Files: Stale-While-Revalidate
  // Serve cached version immediately (fast), but fetch update in background for next time.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback or swallow error if offline
      });
      return cachedResponse || fetchPromise;
    })
  );
});
