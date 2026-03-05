const CACHE_NAME = 'myradio-v18';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  // ASCII art cached for offline
  'https://i.ibb.co.com/p6Z6GqB2/ascii-art.png',
  'https://i.ibb.co.com/FbCYM72m/image.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => {
      // Cache local assets strictly; images best-effort (CORS may block)
      const local  = ASSETS.filter(u => !u.startsWith('http'));
      const remote = ASSETS.filter(u =>  u.startsWith('http'));
      return c.addAll(local).then(() =>
        Promise.allSettled(remote.map(u =>
          fetch(u, { mode: 'cors' })
            .then(r => { if (r.ok) c.put(u, r); })
            .catch(() => {})
        ))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never intercept audio streams / API calls
  if (url.includes('r-a-d.io') || url.includes('listen.moe') ||
      url.includes('relay')    || url.includes('fonts.g')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).catch(() => {
        // Offline fallback — serve index.html for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
