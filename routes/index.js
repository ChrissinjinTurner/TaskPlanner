var express = require('express');
var router = express.Router();

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'MyTaskPlanner' });
});

/* GET home page */
router.get('/home', function(req, res, next) {
  res.render('home', {title: 'MyTaskPlanner Home'});
});

/* GET login page */
router.get('/login', function(req, res, next) {
  return res.render('login', {title: 'Log In'});
});

/* GET register page */
router.get('/register', function(req, res, next) {
  return res.render('register', {title: 'Register'});
});

module.exports = router;
