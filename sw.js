
const CACHE_NAME = 'abhi-ledger-v21-swr-active';

// Core assets required for the app shell to load offline
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-icon.svg',
  '/icon-v2.svg',
  '/icon-v3.svg',
  '/icon-v4.svg',
  '/monochrome.svg',
  // App Logic
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/utils/calculations.ts',
  '/utils/pdfGenerator.ts',
  '/utils/common.ts',
  '/hooks/useLedger.ts',
  '/data/sponsoredContent.ts',
  // Components
  '/components/TransactionCard.tsx',
  '/components/TrustScoreBadge.tsx',
  '/components/Navbar.tsx',
  '/components/DashboardStats.tsx',
  '/components/SettingsModal.tsx',
  '/components/DealModal.tsx',
  '/components/PaymentModal.tsx',
  '/components/EditDateModal.tsx',
  '/components/DeleteModal.tsx',
  '/components/TourOverlay.tsx',
  '/components/WelcomeScreen.tsx',
  '/components/SponsorModal.tsx',
  '/components/TutorialSelectionModal.tsx',
  '/components/VideoTutorialModal.tsx',
  // External Libraries (Pinned Versions)
  'https://cdn.tailwindcss.com?v=3.4.1',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0',
  'https://esm.sh/lucide-react@0.263.1?deps=react@18.2.0',
  'https://esm.sh/jspdf@2.5.1',
  'https://esm.sh/jspdf-autotable@3.8.2',
  'https://cdn-icons-png.flaticon.com/512/2910/2910768.png'
];

// Install Event: Cache core assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[[SW]] Installing... Pre-caching core assets.');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[[SW]] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all clients immediately
});

// Fetch Event: Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Navigation Requests (HTML) - Network First (for freshness), fall back to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2. All other assets - Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch((err) => {
          // console.warn('[[SW]] Background fetch failed:', err);
        });

      return cachedResponse || networkFetch;
    })
  );
});
