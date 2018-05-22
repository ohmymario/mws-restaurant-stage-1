var cacheVersion = 'static-cache-v1';

var urlsToCache = ['/',
  'index.html',
  'restaurant.html',
  'css/styles.css',
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js',
  'data/restaurants.json',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'img/1.jpg',
  'img/2.jpg',
  'img/3.jpg',
  'img/4.jpg',
  'img/5.jpg',
  'img/6.jpg',
  'img/7.jpg',
  'img/8.jpg',
  'img/9.jpg',
  'img/10.jpg',
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