/* eslint-disable */


let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

// ServiceWorker
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
  .then(() => {
    console.log('Registration Success');
  })
  .catch((error) => {
    console.log('Error', error)
  })
}

// Fetch all neighborhoods and set their HTML.
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

// Fetch neighborhoods and cuisines as soon as the page is loaded.
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

// Set neighborhoods HTML.
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

// Fetch all cuisines and set their HTML.
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

// Set cuisines HTML.
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

// Initialize Google map, called from HTML.
window.initMap = () => {
  updateRestaurants();
}

// Update page and map for current restaurants.
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

// Clear current restaurants, their HTML and remove their map markers.
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

// Create all restaurants HTML and add them to the webpage.
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();

  const mapIMG = document.getElementById("map-img");

  if(mapIMG) {
    mapIMG.addEventListener('click', loadMap);
  }
}

const loadMap = () => {
  updateRestaurants();

  if(document.getElementById("map-img")) {
    document.getElementById("map-img").remove()
  }
  
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
}

// Create restaurant HTML.
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img lazyload blur-up';
  
  const imageUrl = `${DBHelper.imageUrlForRestaurant(restaurant)}`;
  const srcsetImgURL = `${imageUrl}.jpg 800w, ${imageUrl}-400px.jpg 400w, ${imageUrl}-280px.jpg 280w`

  image.src = `${imageUrl}-blur.jpg`;
  image.setAttribute('data-src', `${imageUrl}.jpg`);
  image.setAttribute('data-srcset', srcsetImgURL);
  image.setAttribute('data-sizes', `auto`);
  image.setAttribute('alt', `Image of ${restaurant.name}`);
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const favorite = document.createElement('button');
  favorite.className = 'favBtn';

  // Change string values to boolean
  if (restaurant.is_favorite === 'false' || undefined) {
    restaurant.is_favorite = false;
  } else if (restaurant.is_favorite === 'true') {
    restaurant.is_favorite = true;
  }

  if(restaurant.is_favorite) {
    favorite.className = 'favBtn favBtnSelected';
  }

  favorite.id = `restaurant-${restaurant.id}`;
  favorite.innerHTML = `❤`;
  li.append(favorite);

  favorite.addEventListener('click', function() {
    favResBtn(event, restaurant);
  });

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `View Details about ${restaurant.name}`);
  li.append(more)

  return li
}

// Toggle favorite button class 
const favResBtn = (event, restaurant) => {
  const favorite = event.target;
  const isFav = !event.currentTarget.classList.contains(`favBtnSelected`);

  DBHelper.updateFavouriteStatus(restaurant, isFav);
  favorite.classList.toggle('favBtnSelected');
}

// Add markers for current restaurants to the map.
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
