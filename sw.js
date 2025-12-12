const CACHE_NAME = 'netuno-jarvis-v12-reset'; // V12
// We deliberately keep this empty to force network usage for the fix
const ASSETS = [];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation immediately
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // DELETE ALL OLD CACHES
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Limpiando caché antigua:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

self.addEventListener('fetch', (event) => {
  // EMERGENCY MODE: NETWORK ONLY
  // To fix the 404 errors, we bypass the cache entirely for now.
  event.respondWith(fetch(event.request));
});