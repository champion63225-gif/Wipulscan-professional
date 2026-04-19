/* WIPULSCAN PRO — Service Worker v6.0
   © Cobra Dynamics 2026 · Dennis Stein & Christoph Frick · Langen Germany
   Offline-first caching · PWA / Play Store compliant */

const CACHE = 'wipulscan-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './jingle-intro.wav'
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return Promise.allSettled(ASSETS.map(function(u) {
        return c.add(u).catch(function(){});
      }));
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) {
        return k !== CACHE;
      }).map(function(k) {
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  /* Network-first for fonts/external, cache-first for app assets */
  if (e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(e.request).then(function(r) {
        var clone = r.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return r;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request).then(function(nr) {
        var clone = nr.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return nr;
      });
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});
