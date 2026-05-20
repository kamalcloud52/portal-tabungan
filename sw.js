// Service Worker minimal untuk PWA
self.addEventListener('install', event => {
  self.skipWaiting(); // aktifkan service worker segera
});
self.addEventListener('fetch', () => {
  // tidak melakukan caching, biarkan request normal
});
