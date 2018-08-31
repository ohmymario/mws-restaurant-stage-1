/* eslint-disable */

import idb from "idb";

const dbPromise = idb.open('mws-restaurants', 1, upgradeDb => {
  switch (upgradeDb.oldVersion) {
    case 0:
      upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
  }
});


// Common database helper functions.
class DBHelper {

  // Database URL.
  // Change this to restaurants.json file location on your server.
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  // Fetch all restaurants.
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
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
        callback(error, null);
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
    console.log("addRestaurantReview Working :)")
    // console.log(formData);
    // console.log(formData.values);
    console.log(event);
    console.log(id);
    console.log(formData.get('name'));
    console.log(formData.get('rating'));
    console.log(formData.get('review'));

    if(!navigator.onLine) {
      // Function to send data once online
      console.log("Your review will be sent once youre back online :)")
    }
  }

  // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  static getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

}

window.DBHelper = DBHelper;
