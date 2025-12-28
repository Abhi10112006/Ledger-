
const CACHE_NAME = 'abhi-ledger-v3-offline-permanent';

// CRITICAL: All external libraries must be listed here to work offline.
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap',
  'https://esm.sh/react@^19.2.3',
  'https://esm.sh/react-dom@^19.2.3',
  'https://esm.sh/lucide-react@^0.562.0',
  'https://esm.sh/jspdf@^2.5.1',
  'https://esm.sh/jspdf-autotable@^3.8.2',
  'https://cdn-icons-png.flaticon.com/512/2910/2910768.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache, downloading all assets for offline use...');
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
            console.log('Deleting old cache:', cacheName);
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

  // STRATEGY 1: Navigation (HTML) -> CACHE FIRST, then Network
  // This is the key to "Offline Permanently". We try to serve index.html from cache first.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((response) => {
        return response || fetch(event.request).catch(() => {
          // If both cache and network fail, try the root
          return caches.match('./');
        });
      })
    );
    return;
  }

  // STRATEGY 2: External Assets & Local Files -> CACHE FIRST
  // If we have it, serve it. Do not ask network. This makes it fast and offline-proof.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache it for next time
      return fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'cors' && networkResponse.type !== 'basic' && networkResponse.type !== 'opaque') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
         // If offline and not in cache, we just fail gracefully (assets might be missing)
         // But since we pre-cached everything in install, this shouldn't happen for core files.
      });
    })
  );
});
