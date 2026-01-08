
const CACHE_NAME = 'abhi-ledger-v23-swr-active';

// Core assets required for the app shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  'https://cdn.tailwindcss.com?v=3.4.1',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0',
  'https://esm.sh/lucide-react@0.263.1?deps=react@18.2.0',
  'https://cdn-icons-png.flaticon.com/512/2910/2910768.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // console.log('[[SW]] Installing v23...');
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('Precache failed for some assets', err);
      });
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
            // console.log('[[SW]] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
           const responseClone = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => {
             try {
                cache.put(event.request, responseClone);
             } catch (e) {}
           });
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
