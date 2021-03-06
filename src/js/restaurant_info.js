/* eslint-disable */

let restaurant;
var map;

// Initialize Google map, called from HTML.
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

// Get current restaurant from page URL.
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

// Create restaurant HTML and add it to the webpage
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const imageUrl = `${DBHelper.imageUrlForRestaurant(restaurant)}`;
  const srcsetImgURL = `${imageUrl}.jpg 800w, ${imageUrl}-400px.jpg 400w, ${imageUrl}-280px.jpg 280w`

  const image = document.getElementById('restaurant-img');
  image.className = 'blur-up restaurant-img lazyload';
  image.src = `${imageUrl}-blur.jpg`;
  image.setAttribute('data-src', `${imageUrl}.jpg`);
  image.setAttribute('data-srcset', srcsetImgURL);
  image.setAttribute('data-sizes', `auto`);
  image.setAttribute('alt', `Image of ${restaurant.name}`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  
  // fill reviews
  const id = getParameterByName('id');
  DBHelper.getRestaurantReviewByID(id, fillReviewsHTML);
}

// Create restaurant operating hours HTML table and add it to the webpage.
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

// Create all reviews HTML and add them to the webpage.
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  const form = document.forms.namedItem("review-form");

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reset
    const formData = new FormData(form);
    const id = getParameterByName('id');

    const name = formData.get('name')
    const rating = formData.get('rating')
    const review = formData.get('review')

    const fullReview = {
      name,
      restaurant_id: parseInt(id),
      rating: parseInt(rating),
      comments: review
    }

    document.getElementById('review-form').reset();
    DBHelper.addRestaurantReview(fullReview)
    .then(res => {
      const ul = document.getElementById('reviews-list');
      ul.appendChild(createReviewHTML(res));
      container.appendChild(ul);
      document.getElementById('NoReview').remove();
    })  
  })

  if (reviews.length === 0) {
    const noReviews = document.createElement('p');
    noReviews.id = `NoReview`;
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

// Create review HTML and add it to the webpage.
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.id = `review-${review.id}`;
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
  date.innerHTML = new Date(review.createdAt).toLocaleDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  const removeBtn = document.createElement('button');
  removeBtn.innerHTML = `Delete`
  removeBtn.setAttribute('aria-label', 'Delete this review');
  removeBtn.addEventListener('click', function() {
    // Possible Button color #d80000
    DBHelper.removeRestaurantReview(review.id)
  })
  li.appendChild(removeBtn);

  return li;
}

// Add restaurant name to the breadcrumb navigation menu
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

// Get a parameter by name from page URL.
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
