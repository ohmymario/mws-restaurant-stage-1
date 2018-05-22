var cacheVersion = 'static-cache-v3';

var urlsToCache = ['/',
  'index.html',
  'restaurant.html',
  'css/styles.css',
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js',
  'img/6.jpg',
];

addEventListener('install', (event) => {
  console.log('[serviceworker] installed');

  event.waitUntil(
    caches.open(cacheVersion).then((cache) => {
      console.log('caching files')
      return cache.addAll(urlsToCache);
    })
  )
})


// activate event
addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName.startsWith('static') &&
            cacheName != cacheVersion;
        }).map(function (cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// fetch event
addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});