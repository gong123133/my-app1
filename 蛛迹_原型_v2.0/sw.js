/* 蛛迹 Service Worker：离线缓存应用外壳 */
const CACHE = 'zhuji-v2.0.0';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './taxonomy-data.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 天气/海拔 API 不缓存

  event.respondWith(
    caches.match(req).then(cached => {
      const fetched = fetch(req).then(resp => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return resp;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || fetched;
    })
  );
});
