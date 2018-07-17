import idb from 'idb';

const dbPromise = idb.open('mws-restaurants', 1, upgradeDb => {
  // switch (upgradeDB.oldVersion) {
  //   case 0:
  upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
  // }
});

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
  let ID;
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.includes('restaurant.html')) {
    // Grab ID if from restaurant.html
    // https://stackoverflow.com/questions/10003683/javascript-get-number-from-string
    ID = parseInt(requestUrl.search.replace(/[^0-9]/g, ''));
  }

  if (requestUrl.port === '1337') {
    console.log(`ABOUT TO DO SERVERESJSON`);
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
  event.respondWith(
    dbPromise
      .then(db => {
        if (!db) return;

        return db
          .transaction('restaurants')
          .objectStore('restaurants')
          .get(ID);
      })
      .then(
        data =>
          (data && data.data) ||
          fetch(event.request)
            .then(res => res.json())
            .then(json =>
              dbPromise.then(db => {
                const tx = db.transaction('restaurants', 'readwrite');
                tx.objectStore('restaurants').put({ ID, data: json });
                return json;
              })
            )
      )
  );
}
