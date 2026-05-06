/* WIPULSCAN PRO — Service Worker v7.0
   © Cobra Dynamics 2026 · Dennis Stein & Christoph Frick · Langen Germany
   Network-first for HTML · Cache-first for assets · PWA compliant */

const CACHE = 'wipulscan-v7';
const ASSETS = [
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
  var url = e.request.url;

  // Fonts: network-first with cache fallback
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
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

  // index.html: ALWAYS network-first — ensures latest version is served
  if (url.endsWith('/') || url.includes('index.html') || url.split('?')[0].endsWith('/Wipulscan-professional/')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(function(r) {
        var clone = r.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return r;
      }).catch(function() {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Everything else: cache-first
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
