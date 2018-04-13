/* Written by Chris Turner */
var express = require('express');
var session = require('express-session')

/* Session setup */
var app = express()
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

/* Setup for bcrypt hashing of passwords */
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

/* ----------------------------------START HOME PAGE--------------------------------------------------- */
/* GET home page */
app.get('/home', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    /* Set component equal to all the homework for that user */ 
    var component = [];
    connection.query('select Task.TaskId, Task.Taskname, Task.HomeworkType, Task.DueDate, Task.Priority, Task.Description, Course.Coursename, Course.CourseCode, Course.Professor from Task LEFT JOIN Course on Task.CourseId = Course.CourseId where Course.UserId = ?;',req.session.userId,
      function(err, rows, fields) {
        if (typeof rows !== 'undefined' && rows !== null && rows.length !== 0) {
          for (var i = 0; i < rows.length; i++) {
            var singleRow = {};
            singleRow.TaskId = rows[i].TaskId;
            singleRow.Taskname = rows[i].Taskname;
            singleRow.HomeworkType = rows[i].HomeworkType;
            singleRow.DueDate = rows[i].DueDate;
            singleRow.Priority = rows[i].Priority;
            singleRow.Description = rows[i].Description;
            singleRow.Coursename = rows[i].Coursename;
            singleRow.CourseCode = rows[i].CourseCode;
            singleRow.Professor = rows[i].Professor;
            component.push(singleRow);
          }
        }
        res.render('home', {table: component});
      });
  } else {
    res.redirect('/login')
  }
})

/* GET Student home page */
app.get('/studenthome', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    /* Set component equal to all the homework for that user */ 
    var component = [];
    connection.query('select Task.TaskId, Task.Taskname, Task.HomeworkType, Task.DueDate, Task.Priority, Task.Description, Course.Coursename, Course.CourseCode, Course.Professor from AssignedHomework ' + 
      'LEFT JOIN Task on AssignedHomework.TaskId = Task.TaskId ' +  
      'LEFT JOIN Course on Task.CourseId = Course.CourseId ' + 
      'where AssignedHomework.UserId = ?;',req.session.userId,
      function(err, rows, fields) {
        if (typeof rows !== 'undefined' && rows !== null && rows.length !== 0) {
          for (var i = 0; i < rows.length; i++) {
            var singleRow = {};
            singleRow.TaskId = rows[i].TaskId;
            singleRow.Taskname = rows[i].Taskname;
            singleRow.HomeworkType = rows[i].HomeworkType;
            singleRow.DueDate = rows[i].DueDate;
            singleRow.Priority = rows[i].Priority;
            singleRow.Description = rows[i].Description;
            singleRow.Coursename = rows[i].Coursename;
            singleRow.CourseCode = rows[i].CourseCode;
            singleRow.Professor = rows[i].Professor;
            component.push(singleRow);
          }
        }
        res.render('studenthome', {table: component});
      });
  } else {
    res.redirect('/login')
  }
})

/* POST Student home page*/
app.post('/studenthome', function(req, res, next) {
  /* TODO: set up ability to delete homework from user */
})
/* ----------------------------------END HOME PAGE----------------------------------------------------- */

/* ----------------------------------START Login------------------------------------------------------- */
/* GET login page */
app.get('/login', function(req, res, next) {
  return res.render('login', {title: 'Log In'});
})

/* POST login page */
app.post('/login', function(req, res, next) {
  if (req.body.username && req.body.password) {
    var username = req.body.username;
    var password = req.body.password;
    var hash = connection.query('Select Password, UserId, RoleId from User where username = ?',
      username, function (err, rows, fields) {
        if (typeof rows !== 'undefined' && rows !== null && rows.length !== 0) {
          // console.log('Password ', rows[0].Password);
          // console.log('UserId ', rows[0].UserId);
          // console.log('RoleId ', rows[0].RoleId);
          bcrypt.compare(password, rows[0].Password, function (err, result) {
            if (result == false) {
              return res.redirect('/login');
            } else {
              if (rows[0].RoleId == 1) {
                console.log('Student logged in');
                req.session.userId = rows[0].UserId;
                req.session.roleId = rows[0].RoleId;
                req.session.user = username; 
                return res.redirect('/studenthome');
              } else if (rows[0].RoleId == 0) {
                console.log('Teacher logged in');
                req.session.userId = rows[0].UserId;
                req.session.roleId = rows[0].RoleId;
                req.session.user = username; 
                return res.redirect('/home');
              }
            }
          })
        } else {
          return res.redirect('/login');
        }
      })
  } else {
    return res.redirect('/login');
  }
})
/* ----------------------------------End Login--------------------------------------------------------- */

/* ----------------------------------START REGISTER---------------------------------------------------- */
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
          return res.redirect('/login');
        });
      });
    }
})
/* ----------------------------------END REGISTER------------------------------------------------------ */

/* ----------------------------------START ADD/EDIT HOMEWORK------------------------------------------- */
/* GET addhomework page. */
app.get('/addhomework', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    res.render('addhomework', { title: 'Add Homework' });
  } else {
    res.redirect('/login')
  }
})

/* POST addhomework page */
app.post('/addhomework', function(req, res, next) {
  if (req.body.homeworkname &&
    req.body.coursename &&
    req.body.type &&
    req.body.duedate &&
    req.body.priority &&
    req.body.description) {
      
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

/* POST edithomework page */
/* ----------------------------------END ADD/EDIT HOMEWORK--------------------------------------------- */

/* ----------------------------------START COURSE PAGE------------------------------------------------- */
/* GET teacher course page */
app.get('/course', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    /* Set component equal to all the courses for that user */ 
    var component = [];
    var query = connection.query('select * from Course where UserId = ?',req.session.userId,
      function(err, rows, fields) {
        if (typeof rows !== 'undefined' && rows !== null && rows.length !== 0) {
          for (var i = 0; i < rows.length; i++) {
            var singleRow = {};
            singleRow.CourseId = rows[i].CourseId;
            singleRow.Coursename = rows[i].Coursename;
            singleRow.CourseCode = rows[i].CourseCode;
            singleRow.StartDate = rows[i].StartDate;
            singleRow.EndDate = rows[i].EndDate;
            singleRow.location = rows[i].location;
            singleRow.Professor = rows[i].Professor;
            component.push(singleRow);
          }
        }
        res.render('course', {table: component});
      });
  } else {
    res.redirect('/login')
  }
})

/* POST teacher course page */
app.post('/course', function(req, res, next) {
  
})

/* GET student course page */
app.get('/studentcourse', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    res.render('studentcourse', { title: 'Student Course' });
  } else {
    res.redirect('/login')
  }
})
/* ----------------------------------END COURSE PAGE--------------------------------------------------- */

/* ----------------------------------START ADD/EDIT COURSE--------------------------------------------- */
/* GET addcourse page*/
app.get('/addcourse', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    res.render('addcourse', { title: 'Add Course' });
  } else {
    res.redirect('/login')
  }
})

/* POST addcourse page */

/* GET editcourse page */
app.get('/editcourse', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    res.render('editcourse', { title: 'Edit Course' });
  } else {
    res.redirect('/login')
  }
})

/* POST editcourse page */
/* ----------------------------------END ADD/EDIT COURSE----------------------------------------------- */

/* ----------------------------------START PROFILE----------------------------------------------------- */
/* GET profile page */
app.get('/profile', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    res.render('profile', { title: 'Profile' });
  } else {
    res.redirect('/login')
  }
})

/* GET edit profile page */

/* POST edit profile page*/
/* ----------------------------------END PROFILE------------------------------------------------------- */

/* ----------------------------------START LOGOUT------------------------------------------------------ */
app.get('/logout', function(req, res, next) {
  req.session.destroy(function(err) {  
    if (err) {  
        console.log(err);  
    } else {  
        res.redirect('/');  
    }  
  });  
})
/* ----------------------------------END LOGOUT-------------_------------------------------------------ */

module.exports = app;