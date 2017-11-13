var express = require('express');
var app = express();
app.set('view engine', 'hbs');
var pgp = require('pg-promise')({
  //set any initialization options
});
var db = pgp({database: 'restaurant'});
const body_parser = require('body-parser');

app.use(body_parser.urlencoded({extended: false}));
app.use('/static', express.static('public'));

app.get('/', function(req, res) {
  //Should contain 'Google-like' search box
  res.render('search.hbs');
});

app.get('/search', function(req, res) {
  //Display results from root url query
  let search = req.query.searchTerm;
  console.log('Term:', search);
  db.any(`
    select * from restaurant
    where restaurant.name ilike '%${search}%'
  `)
    .then(function(resultsArray) {
      console.log('results', resultsArray);
      res.render('results.hbs', {results: resultsArray});
    })
});

app.get('/restaurant/:id', function(req, res, next) {
  //Display a page for each restaurant
  let id = req.params.id;
  db.any(`
    select
      restaurant.id,
      restaurant.name as restaurant_name,
      restaurant.address,
      restaurant.category,
      reviewer.name as reviewer_name,
      review.title,
      review.stars,
      review.review
    from
      restaurant
    left outer join
      review on review.restaurant_id = restaurant.id
    left outer join
      reviewer on review.reviewer_id = reviewer.id
    where restaurant.id = ${id}
  `)
    .then(function(reviews) {
      console.log('reviews', reviews);
      res.render('restaurants.hbs', {
        restaurant: reviews[0],
        reviews: reviews,
        hasReviews: reviews[0].reviewer_name
      });
    })
    .catch(next);
});

app.post('/submit_review/:id', function(req, res, next) {
  //Post from review form into review database table
  var restaurantId = req.params.id;
  console.log('Restaurant ID: ', restaurantId);
  console.log('Column to Insert: ', req.body);
  //db.none when not expecting a return value
  db.none(`
    insert into review
    values (default, ${req.body.stars}, '${req.body.title}', '${req.body.review}', NULL, ${restaurantId})
  `)
    .then(function() {
      res.redirect('/restaurant/' + restaurantId);
    })
    .catch(next);
});

app.listen(8000, function() {
  console.log('Listening on port 8000');
});
