
const CACHE_NAME = 'abhi-ledger-v37-clean';

// Core assets required for the app shell
// We only cache the strict list of files we know exist.
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
      // We use addAllSettled logic manually to prevent one missing file from breaking the entire install
      const promises = PRECACHE_ASSETS.map(url => 
        cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
      );
      return Promise.all(promises);
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

  // 1. ASSET LINKS: Network Only (Critical for TWA Verification)
  // This ensures Android verification always hits the live server.
  if (url.pathname.includes('assetlinks.json')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. MANIFEST: Network First (Critical for PWA validation updates)
  if (url.pathname === '/manifest.json') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Navigation: Network First -> Cache -> Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html')
            .then(response => response || fetch('/')); // Last resort fallback
        })
    );
    return;
  }

  // 4. Static Assets: Stale-While-Revalidate
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
