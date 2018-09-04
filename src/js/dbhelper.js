/* eslint-disable */

import idb from "idb";

const dbPromise = idb.open('mws-restaurants', 3, upgradeDb => {
  switch (upgradeDb.oldVersion) {
    case 0:
      upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    case 1:
      const reviewStore = upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
      reviewStore.createIndex('restaurant_id', 'restaurant_id');
    case 2:
      upgradeDb.createObjectStore("pending", {keyPath: "id", autoIncrement: true});
  }
});


// Common database helper functions.
class DBHelper {

  // Database URL.
  // Change this to restaurants.json file location on your server.
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  // Fetch all restaurants.
  static fetchRestaurants(callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants`)
      .then(res => {
        return res.json()
      })
      .then(json => {
        dbPromise
          .then(db => {
            const tx = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
            json.forEach(restaurant => {
              tx.put(restaurant);
            })
          })
        callback(null, json);
      })
      .catch(error => {
        dbPromise
        .then(db => {
          const tx = db
          .transaction('restaurants', 'readwrite')
          .objectStore('restaurants'); 

          tx.getAll()
          .then(restaurants => {
            if(!restaurants) {
              callback(error, null);
            }
            callback(null, restaurants);
          })
        });
      });
  }

  // Fetch a restaurant by its ID.
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  // Fetch restaurants by a cuisine type with proper error handling.
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  // Fetch restaurants by a neighborhood with proper error handling.
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  // Fetch restaurants by a cuisine and a neighborhood with proper error handling.
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  // Fetch all neighborhoods with proper error handling.
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  // Fetch all cuisines with proper error handling.
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  // Restaurant page URL.
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  // Restaurant image URL. 
  static imageUrlForRestaurant(restaurant) {
    return (`img/${restaurant.photograph || restaurant.id }`);
  }

  // Map marker for a restaurant.
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  // Update JSON and DB with use Favorite Status
  static updateFavouriteStatus(restaurant, isFav) {
    const restaurantID = restaurant.id;

    fetch(`http://localhost:1337/restaurants/${restaurantID}/?is_favorite=${isFav}`, {
      method: 'PUT',
    })
    .then(() => {
      dbPromise
      .then(db => {
        const tx = db
        .transaction('restaurants', 'readwrite')
        .objectStore('restaurants');
        tx.get(restaurantID)
        .then(restaurant => {
          restaurant.is_favorite = isFav;
          tx.put(restaurant);
        })
      });
    })
  }

  static addRestaurantReview(event, formData, id) {
    const name = formData.get('name')
    const rating = formData.get('rating')
    const review = formData.get('review')
    const fullReview = {
      name,
      restaurant_id: parseInt(id),
      rating: parseInt(rating),
      comments: review
    }

    // https://developers.google.com/web/updates/2011/06/navigator-onLine-in-Chrome-Dev-channel
    if(!navigator.onLine) {
      // Save data once online
      DBHelper.SavePendingReview(fullReview)
      
      // Online -> Try sending to server
      window.addEventListener('online', function(e) {
        DBHelper.retryPendingReviews();
      }, false);
      return;
    }

    const url = `${DBHelper.DATABASE_URL}/reviews`;
    fetch(url, 
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        body: JSON.stringify(fullReview)
      })
      .then(res => {
        return res.status;
      })
  }

  static retryPendingReviews() {
    dbPromise
      .then((db) => {
        if (!db) return;
        const tx = db
          .transaction('pending')
          .objectStore('pending')
   
        const pendingStore = tx.getAll();
        return pendingStore;
      })
      .then((reviews) => {
        reviews.forEach((review) => {

          // https://stackoverflow.com/questions/208105/how-do-i-remove-a-property-from-a-javascript-object
          const id = review.id;
          const url = `${DBHelper.DATABASE_URL}/reviews`;
          delete review.id;
          
          fetch(url,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
              body: JSON.stringify(review)
            })
            .then(res => {
              if (res.status === 201) {
                DBHelper.removePendingReview(id)
                return;
              }
            })
        })
      }) 
      .catch(error => {
        console.log(`error ${error}`);
      })
  }

  static removePendingReview(id) {
    dbPromise
    .then((db) => {
      if (!db) return;
      const tx = db
      .transaction('pending','readwrite')
      .objectStore('pending')
      .delete(id);
    })
    .catch(error => {
      console.log(`error ${error}`);
    })
  }

  static SavePendingReview(review) {
    dbPromise
    .then((db) => {
      if (!db) return;
      const tx = db
      .transaction('pending','readwrite')
      .objectStore('pending')
      .put(review);
    })
    .catch(error => {
      console.log(`error ${error}`);
    })
  }
  
  static getRestaurantReviewByID(id, callback) {
    const url = `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`;

    fetch(url)
    .then(response => {
      return response.json();
    })
    // Cache JSON to IDB
    .then(json => {
      dbPromise
      .then((db) => {
        if (!db) return;
        const tx = db
          .transaction('reviews','readwrite')
          .objectStore('reviews');
        json.forEach((review) => {
          tx.put(review);
        });
      });
      callback(json);
    })
    // Return Any Previously Cached JSON When Offline
    .catch(error => {
      dbPromise
      .then(db => {
        
        const tx = db
        .transaction('reviews')
        .objectStore('reviews');
        const reviewStore = tx.index('restaurant_id');

        id = parseInt(id);
        return reviewStore.getAll(id);
      })
      .then(reviews => {
        if(!reviews) {
          callback(error);
        }
        callback(reviews);
      })
    });
  }

  static removeRestaurantReview(id) {

    const url = `${DBHelper.DATABASE_URL}/reviews/${id}`;

    fetch(url, { method: 'DELETE' })
      .then(res => {
        return res.status;
      })
      .catch(err => {
        console.log(`Error ${err}`);
      })

    // https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
    const myNode = document.getElementById(`review-${id}`);
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }

    dbPromise
    .then((db) => {
      if (!db) return;
      const tx = db
      .transaction('reviews','readwrite')
      .objectStore('reviews');
      
      const DBreview = tx.delete(id);
      return DBreview;
    })
    .catch(error => {
      console.log(`error ${error}`);
    })
  }

  
}

window.DBHelper = DBHelper;
