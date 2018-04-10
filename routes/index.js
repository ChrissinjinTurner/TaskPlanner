var express = require('express');
var session = require('express-session')

/* Session setup */
var app = express()
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

/* Setup for bcrypt hashing */
var bcrypt = require('bcrypt');
const saltRounds = 10;

/* Mysql server connection */
var mysql = require('mysql')
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'PlannerApp',
  port: 3306
});
connection.connect();

/* GET default page. */
app.get('/', function(req, res, next) {
  res.render('index', { title: 'MyTaskPlanner' });
})

/* GET home page */
app.get('/home', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    res.render('home', {title: 'MyTaskPlanner, Welcome ' + req.session.user});
  } else {
    res.redirect('/login')
  }
})

/* POST home page */
app.post('/home', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    res.render('studenthome', {title: 'MyTaskPlanner, Welcome ' + req.session.user});
  } else {
    res.redirect('/login')
  }
})

/* GET Student main page */
app.get('/studenthome', function(req, res, next) {
  return res.render('studenthome', {title: 'Student Home'});
})

/* GET Teacher login page */
app.get('/login', function(req, res, next) {
  return res.render('login', {title: 'Log In'});
})

/* POST teacher login page */
/* FIXME: Add checking if student and then redirect to studenthome.pug*/
app.post('/login', function(req, res, next) {
  if (req.body.username && req.body.password) {
    var values = [];
    var username = req.body.username;
    var password = req.body.password;
    var hash = connection.query('Select Password, RoleId from User where username = ?',
      username, function (error, rows) {
        if (error) {
          throw error;
        } else {
          if (rows.length > 0) {
            values = rows;
            console.log(rows);
            console.log(rows[1]);
            console.log(values[0]);
            bcrypt.compare(password, hash, function (error, result) {
              // GOOD PASSWORD
              // if (values[1] == 0) {
              //   req.session.user = username; 
              //   return res.redirect('/home');
              // } else {
              //   req.session.user = username; 
              //   return res.redirect('/studenthome');
              // }
              if (error) {
                return res.redirect('/login');
              } else {
                req.session.user = username; 
                return res.redirect('/home');
              }
              
              
            })
          }
        }
      })
  }
})

/* GET register page */
app.get('/register', function(req, res, next) {
  return res.render('register', {title: 'Register'});
})

/* POST register page */
app.post('/register', function(req, res, next) {
  if (req.body.firstname &&
    req.body.lastname &&
    req.body.username &&
    req.body.password &&
    req.body.email &&
    req.body.schoolname &&
    req.body.role) {

      if (req.body.password !== req.body.confirmpassword) {
        var err = new Error('Passwords don\'t match');
        err.status = 400;
        return next(err);
      }
      
      bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(req.body.password, salt, function(err, hash) {
          var post = {Firstname: req.body.firstname, 
            Lastname: req.body.lastname,
            Username: req.body.username,
            Password: hash,
            Email: req.body.email,
            School: req.body.schoolname,
            RoleId: req.body.role};
          var query = connection.query('Insert into User set ?', post, function(error, results, fields) {
            if (error) throw error;
          });
          console.log(query.sql);
          return res.redirect('/login');
        });
      });
    }
})

/* GET addhomework page. */
app.get('/addhomework', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    res.render('edithomework', { title: 'Edit Homework' });
  } else {
    res.redirect('/login')
  }
})

/* GET edithomework page. */
app.get('/edithomework', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    res.render('edithomework', { title: 'Edit Homework' });
  } else {
    res.redirect('/login')
  }
})

/* GET teacher course page */

/* GET student course page */

/* GET addcourse page*/

/* GET editcourse page */

/* GET profile page */

/* GET edit profile page */

module.exports = app;