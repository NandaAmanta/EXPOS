const CACHE_NAME = 'expos-cache-v10';

// Static App Shell core assets
const PRECACHE_URLS = [
  '/pos',
  '/',
  '/favicon.svg',
  '/favicon.ico',
  '/manifest.json',
  '/build/manifest.json'
];

/**
 * Fetch all compiled assets from Vite manifest.json and precache them
 */
async function precacheBuildAssets(cache) {
  try {
    const res = await fetch('/build/manifest.json');
    if (!res.ok) return;
    const manifest = await res.json();
    const urlsToCache = new Set();

    for (const key of Object.keys(manifest)) {
      const item = manifest[key];
      if (item.file) {
        urlsToCache.add('/build/' + item.file);
      }
      if (Array.isArray(item.css)) {
        item.css.forEach((cssFile) => urlsToCache.add('/build/' + cssFile));
      }
      if (Array.isArray(item.assets)) {
        item.assets.forEach((assetFile) => urlsToCache.add('/build/' + assetFile));
      }
    }

    const urlList = Array.from(urlsToCache);
    // Use allSettled so if any single optional asset fails, the rest are still safely cached
    await Promise.allSettled(urlList.map((url) => cache.add(url)));
  } catch (err) {
    console.warn('[SW] Could not precache Vite manifest assets:', err);
  }
}

// 1. Install event: Cache App Shell & all compiled Vite assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Precache static shell routes
      await cache.addAll(PRECACHE_URLS).catch((err) =>
        console.warn('[SW] Core precache partial fail:', err)
      );
      // Precache all compiled Vite chunks (CSS, JS, fonts)
      await precacheBuildAssets(cache);
      return self.skipWaiting();
    })()
  );
});

// 2. Activate event: Clean up previous caches & take immediate control of clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      return self.clients.claim();
    })()
  );
});

// 3. Fetch event: Local-First Caching Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. Skip non-GET requests (POST/PUT/DELETE handled locally or via syncWorker)
  if (event.request.method !== 'GET') {
    return;
  }

  // B. Skip API requests (Dexie IndexedDB & syncManager manage offline API state)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // C. Skip Vite HMR dev server requests if running in dev mode
  if (url.port === '5173' || url.pathname.includes('/@vite/')) {
    return;
  }

  // D. Static hashed build assets & fonts: Cache-First strategy
  // Hashed assets (/build/assets/*) are immutable. Return immediately from cache if available.
  if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // E. Navigation requests (Page reloads, visiting /pos or /): Network-First with Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/pos', clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed (offline or local server down): Serve cached /pos shell
          const cachedPos = await caches.match('/pos');
          if (cachedPos) {
            return cachedPos;
          }
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>EXPOS Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:40px;"><h2>Terminal EXPOS Offline</h2><p>Buka terminal saat terhubung minimal satu kali untuk menyimpan cache offline.</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // F. All other GET requests (images, icons): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
