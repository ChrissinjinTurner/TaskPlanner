/* Written by Chris Turner */
var express = require('express');
var session = require('express-session')
let date = require('date-and-time');

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
        res.render('home', {table: component, title: 'Home'});
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
        res.render('addhomework', {table: component, title: 'Add Homework'});
      });
  } else {
    res.redirect('/login')
  }
})

/* POST addhomework page */
app.post('/addhomework', function(req, res, next) {
  if (req.body.homeworkname &&
    req.body.courseid &&
    req.body.type &&
    req.body.duedate &&
    req.body.priority &&
    req.body.description) {
      var inputCourseId = parseInt(req.body.courseid);
      var inputDueDate = req.body.duedate;

      var post = { Taskname: req.body.homeworkname,
        CourseId:  inputCourseId,
        HomeworkType: req.body.type,
        DueDate: inputDueDate,
        Priority: req.body.priority,
        Description: req.body.description,
        UserId: req.session.userId

      };
      console.log(post);
      var query1 = connection.query('Insert into Task set ?', post, 
        function(err, rows, fields) {
          console.log(query1);
          if (err) throw err;

          console.log(rows)

          var query3 = connection.query('Insert into AssignedHomework (UserId, TaskId) select UserId, ' + rows.insertId + ' from Enrolled where CourseId = ' + inputCourseId + '',
            function (queryError, queryRows, queryFields) {
              console.log(query3);
              if (queryError) throw queryError;
              res.redirect('/home');
            })
          
        });
    }
})

/* GET edithomework page FIXME: add course table */
app.get('/edithomework', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
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
        res.render('edithomework', {table: component, title: 'Edit Homework'});
      });
  } else {
    res.redirect('/login')
  }
})

/* POST edithomework page FIXME: Need to create page*/
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
        res.render('course', {table: component, title: 'Courses'});
      });
  } else {
    res.redirect('/login')
  }
})

/* POST teacher course page FIXME: Add query */
app.post('/course', function(req, res, next) {
  
})

/* GET student course page */
app.get('/studentcourse', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    var component = [];
    var query = connection.query('select Course.Coursename, Course.CourseCode, Course.StartDate, Course.EndDate, Course.location, Course.Professor ' + 
      'from Course left join Enrolled on Course.CourseId = Enrolled.CourseId where Enrolled.UserId = ?',req.session.userId,
      function(err, rows, fields) {
        if (typeof rows !== 'undefined' && rows !== null && rows.length !== 0) {
          for (var i = 0; i < rows.length; i++) {
            var singleRow = {};
            singleRow.Coursename = rows[i].Coursename;
            singleRow.CourseCode = rows[i].CourseCode;
            singleRow.StartDate = rows[i].StartDate;
            singleRow.EndDate = rows[i].EndDate;
            singleRow.location = rows[i].location;
            singleRow.Professor = rows[i].Professor;
            component.push(singleRow);
          }
        }
        res.render('studentcourse', {table: component, title: 'Student Courses'});
      });
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

/* POST addcourse page FIXME: Add query */

/* GET editcourse page */
app.get('/editcourse', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
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
        res.render('editcourse', {table: component, title: 'Edit Course'});
      });
  } else {
    res.redirect('/login')
  }
})

/* POST editcourse page FIXME: add functionality */
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
app.get('/editprofile', function(req, res, next) {
  if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
    res.render('editprofile', { title: 'Edit Profile' });
  } else {
    res.redirect('/login')
  }
})

/* POST edit profile page FIXME: add functionality */
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