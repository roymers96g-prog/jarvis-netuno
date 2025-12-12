const CACHE_NAME = 'netuno-jarvis-v11-network-first'; // V11
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Limpiando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

self.addEventListener('fetch', (event) => {
  // STRATEGY: Network First for HTML (Navigation), Cache First for Assets
  // This ensures the user always gets the latest version of the App logic/UI on reload.
  
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network works, update cache and return response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, fall back to cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For images, styles, scripts: Cache First for speed
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});