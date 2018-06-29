const cacheVersion = 'static-cache-v1';

const urlsToCache = [
  '/',
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
