
const CACHE_NAME = 'abhi-ledger-v12-monochrome-file';

// EXACT MATCH URLs from index.html
// If these strings don't match index.html exactly, the browser treats them as different files.
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './monochrome.svg',
  // Local Code (The App Logic)
  './index.tsx',
  './App.tsx',
  './types.ts',
  './utils/calculations.ts',
  './utils/pdfGenerator.ts',
  './components/TransactionCard.tsx',
  './components/TrustScoreBadge.tsx',
  // External Libraries (Exact versions from ImportMap)
  'https://cdn.tailwindcss.com?v=3.4.1',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0',
  'https://esm.sh/lucide-react@0.263.1?deps=react@18.2.0',
  'https://esm.sh/jspdf@2.5.1',
  'https://esm.sh/jspdf-autotable@3.8.2',
  'https://cdn-icons-png.flaticon.com/512/2910/2910768.png'
];

self.addEventListener('install', (event) => {
  // FORCE WAIT: The browser will not consider the app "installed" 
  // until ALL these files are successfully downloaded.
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[[SW]] Downloading ALL assets for offline mode...');
      try {
        await cache.addAll(PRECACHE_ASSETS);
        console.log('[[SW]] All assets cached. App is now offline-ready.');
      } catch (err) {
        console.error('[[SW]] Failed to cache assets:', err);
      }
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
  // STRATEGY: Stale-While-Revalidate tailored for APK-like feel.
  // 1. Return cached version IMMEDIATELY (Speed/Offline).
  // 2. Check network in background to update cache for NEXT time.
  
  const url = new URL(event.request.url);

  // For navigation (opening the app), always serve index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((response) => {
        return response || fetch(event.request).catch(() => caches.match('./'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have it in cache, return it immediately.
      // This mimics an APK file sitting on the disk.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, go to network
      return fetch(event.request).then((networkResponse) => {
        // Cache new files automatically (e.g., if you add new files later)
        if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      });
    })
  );
});
