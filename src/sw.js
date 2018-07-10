// import idb from 'idb';

// const dbPromise = idb.open('mws-restaurants', 1, upgradeDB => {
//   switch (upgradeDB.oldVersion) {
//     case 0:
//       upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
//   }
// });

const cacheVersion = 'static-cache-v3';
const contentImgsCache = 'static-content-imgs';

const allCaches = [cacheVersion, contentImgsCache];

const urlsToCache = [
  '/',
  'index.html',
  'restaurant.html',
  'css/styles.css',
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js',
  // 'http://localhost:1337/restaurants',
  // 'data/restaurants.json',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
];

// Install Event
addEventListener('install', event => {
  console.log('[Serviceworker] Installed');

  event.waitUntil(
    caches.open(cacheVersion).then(cache => {
      console.log('Caching Files');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate Event
addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('static') && !allCaches.includes(cacheName))
            .map(cacheName => caches.delete(cacheName))
        )
      )
  );
});

// Fetch Event
addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // console.log(event);

  // console.log(`Fetch ${requestUrl}`);

  if (requestUrl.pathname.includes('restaurant.html')) {
    // Grab ID if from restaurant.html
    // https://stackoverflow.com/questions/10003683/javascript-get-number-from-string

    const ID = parseInt(requestUrl.search.replace(/[^0-9]/g, ''));
    console.log(ID);
    serveRestaurantJSON(event, ID);
    return;
  }

  if (requestUrl.pathname.startsWith('/img/')) {
    event.respondWith(servePhoto(event.request));
    return;
  }

  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});

function servePhoto(request) {
  const storageUrl = request.url.replace(/\.jpg$/, '');

  return caches.open(contentImgsCache).then(cache =>
    cache.match(storageUrl).then(response => {
      if (response) return response;

      return fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    })
  );
}

function serveRestaurantJSON(event, ID) {
  console.log(event, ID);
}
