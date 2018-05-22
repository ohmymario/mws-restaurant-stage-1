var cacheVersion = 'static-cache-v1';

var urlsToCache = [
  '/',
  '../index.html',
  '../restaurant.html',
  '/css/styles.css',
  'dbhelper.js',
  'main.js',
  'restaurant_info.js',
  '/data/restaurants.json',
  'https://fonts.googleapis.com/css?family=Roboto:400,700'
];

addEventListener('install' , (event) => {
  console.log('[serviceworker] installed');

  event.waitUntil(
    caches.open(cacheVersion).then((cache) => {
      console.log('caching files')
      return cache.addAll(urlsToCache);
    })
  )
})


// activate event
// addEventListener('activate', function(event) {
//   event.waitUntil(
//     caches.keys().then(function(cacheNames) {
//       return Promise.all(
//         cacheNames.filter(function(cacheName) {
//           return cacheName.startsWith('static') &&
//                  cacheName != cacheVersion;
//         }).map(function(cacheName) {
//           return caches.delete(cacheName);
//         })
//       );
//     })
//   );
// });
  
  // fetch event
  // addEventListener('fetch', (event) => {
  //   console.log('[SERVICEWORKER] FETCH');
  
  //   event.respondWith(
  //     new Response("hello")
  //   );
  // })
  
