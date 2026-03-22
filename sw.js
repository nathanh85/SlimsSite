// Slim's site service worker
// Bump this version string every time you deploy a new version.
// The app will auto-refresh on the user's phone when this changes.
const VERSION = 'v1.0';
const CACHE = 'slims-site-' + VERSION;

// Files to cache on install
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  // Activate immediately, don't wait for old tabs to close
  self.skipWaiting();
});

// Activate — delete old caches from previous versions
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Fetch — network first for HTML, cache first for everything else
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  if (e.request.headers.get('accept')?.includes('text/html')) {
    // HTML: always try network first so updates land immediately
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Cache the fresh response
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // offline fallback
    );
  } else {
    // Other assets: cache first, network fallback
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});

// Message from the page — force refresh
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
