const CACHE_NAME = 'evidensia-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force installation immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Stratégie "Network First" (Réseau en priorité, puis Cache)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Met à jour le cache avec la nouvelle version
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si pas de réseau (hors-ligne), on utilise le cache
        return caches.match(event.request);
      })
  );
});
