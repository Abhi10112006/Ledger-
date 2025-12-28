
const CACHE_NAME = 'abhi-ledger-v2-dynamic';

// 1. App Shell - The bare minimum to boot the app
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
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

  // STRATEGY 1: Navigation Requests (HTML) -> Network First, Fallback to Cache
  // This ensures we don't get 404s on refresh and supports SPA routing.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html').then(response => {
            return response || caches.match('./'); // Fallback to root
          });
        })
    );
    return;
  }

  // STRATEGY 2: External CDNs (React, Fonts, Icons) -> Cache First, Network Fallback
  // These are heavy and rarely change. Serving from cache makes the app load fast.
  if (
    url.hostname.includes('esm.sh') || 
    url.hostname.includes('tailwindcss.com') || 
    url.hostname.includes('googleapis.com') || 
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('flaticon.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // STRATEGY 3: Local App Files (.tsx, .ts, .js, .json) -> Stale-While-Revalidate
  // This caches your actual code. It serves the cached version immediately (FAST),
  // then updates the cache in the background for next time.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Only cache valid responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Swallow errors if offline, relies on cachedResponse
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});
