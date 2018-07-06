const cacheVersion = 'static-cache-v2';

const urlsToCache = [
  '/',
  'dist/index.html',
  'dist/restaurant.html',
  'dist/css/styles.css',
  'dist/js/dbhelper.js',
  'dist/js/main.js',
  'dist/js/restaurant_info.js',
  'http://localhost:1337/restaurants',
  // 'data/restaurants.json',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
];

addEventListener('install', event => {
  console.log('[Serviceworker] installed');

  event.waitUntil(
    caches.open(cacheVersion).then(cache => {
      console.log('caching files');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event
addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('static') && cacheName != cacheVersion)
            .map(cacheName => caches.delete(cacheName))
        )
      )
  );
});

// Fetch event
addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
