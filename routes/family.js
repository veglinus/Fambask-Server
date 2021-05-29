var express = require('express');
var router = express.Router();
var mongoose = require('mongoose'),
bcrypt = require('bcrypt');
SALT_WORK_FACTOR = 10;
const { Int32, ObjectId, ObjectID, Timestamp } = require('mongodb');
var db = require('./db');

/* Schemas */
var userSchema = mongoose.Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
  familyID: [{type: ObjectID}]
});
const user = mongoose.model('User', userSchema)
var familySchema = mongoose.Schema({ // Schema for data
  familyName: String,
}); // No versionkeys needed
const family = mongoose.model('Familie', familySchema) // Converts "Familie" to "Families" when in DB
/* End of schemas */


// Routes
router.post('/register', function (req, res) {
  function addNewUser(data, callback) {
    try {
      bcrypt.hash(req.body.password, 10).then(function (hash) { // Hash password
        req.body.password = hash; // Set data.password to hashed password

        var newUser = new user({ // New user
          username: req.body.username,
          password: req.body.password,
          familyID: req.body.familyID
        });

        //console.log(data.username);
        newUser.save(function (err, result) { // save to DB
          if (err) {
            console.log(err);
            callback(err);
          } else { // If successful
            console.log("User added! " + req.body.username);
            callback("User added! " + req.body.username);
          }
        });

      });
    } catch (error) {
      console.log(error);
    }
  }

  if (req.session.family) {
    res.json("You're already logged in!")
  } else {

    // If we're sending a familycode:

    if (req.body.family) {
      addNewUser(req.body, function (response) {
        res.json(response);
        //login(req.body.username, req.body.password) // // Login is sent in frontend instead as POST-call
      });
    } else {
      addNewFamily(req.body, function(responseFam) {
        addNewUser(responseFam, function (response) {
          res.json(response);
          //login(req.body.username, req.body.password) // Login is sent in frontend instead as POST-call
        })
      })
    }
  }
});


// Send req.body.familyname
router.post('/new', function (req, res) {
  addNewFamily(req.body, function(response) {

    // response._id is new family ID
    req.params.id = response._id;

    join(req, function(response2) {
      //req.session.destroy(function(err, result) {
        res.json(response2);
      //});

    })
  })
});

function addNewFamily(data, callback) {
  try {
    var newfamily = new family({ // New family
      familyName: data.familyName,
      //shoppingList: [shoppingListSchema]
    });

    newfamily.save(function (err, result) { // Save new family
      if (err) {
        console.log(err);
        callback(err);
      } else {
        console.log("Family added! " + data.familyName + " " + result._id);
        callback(result);
        // change user family to result._id
      }
    });
  } catch (error) {
    return error;
  }
}


/*
Joining a family

Send ObjectID of the family in the url
Send current users ObjectID as userid
*/
function join(req, callback) {
  try {
    family.findById(req.params.id, function (err, res) {
      if (err) {
          console.log(err);
          callback(err);
      } else {
        console.log("Match, joining family: " + res._id);
        var newfamily = res._id;

        // Change your familyID to newfamilyID
        user.findByIdAndUpdate(req.session.userid, {$push: {familyID: newfamily}}, // The data to edit
          function (err) {
              if (err) {
                  console.log(err);
                  callback(err);
              } else {

                  console.log(req.session.userid + " is now a part of family " + newfamily);
                  req.session.destroy(function() {
                  callback(true);
                  });
              }
          });
      }
    });
  } catch (error) {
    console.log(error);
  }
}
router.get('/join/:id', function (req, res) {
  join(req, function(response) {
    res.json(response);
  })
});

router.get('/logout', function (req, res) {
  req.session.destroy(function(err, result) {
    res.json(result);
  });
});

router.get('/settings', function(req, res) {

  function find(req, callback) {
    try {
      user.findById(req.session.userid, function (err, res) {
            if (err) {
              console.log(err);
              callback(err);
            } else {
              callback(res);
            }
        });
    } catch (error) {
      console.log(error);
    }
  }


    find(req, function (result) {
      res.json(result);
    });
});

router.post('/familyname', function (req, res) {

  function findFamilyNamebyID(req, callback) {
    family.findById(req.body.familyID, function (err, res) {
      if (err) {
          console.log(err);
          callback(err);
      } else {
        //var keys = res.map(({familyName}) => [familyName])
        //console.log(res.familyName);
        callback(res.familyName);
      }
    });
  }

  findFamilyNamebyID(req, function (result) {
    res.json(result);
  });
})

router.post('/leave', function (req, res) {

  function leaveFamily(req, callback) {
    try {
      console.log(req.session.userid);
      console.log(req.body.familyID);
      user.findOneAndUpdate({_id: req.session.userid}, { $pullAll: { familyID: [req.body.familyID]}},  function (err, res) {
        if (err) {
            console.log("error: " + err);
            callback(err);
        } else {
          req.session.destroy(function() {
            console.log(res);
            callback(res);
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  leaveFamily(req, function (result) {
    res.json(result);
  });
})

router.post('/login', function (req, res) {
  var session = req.session;

  if (session.username && session.family) { // Check if already logged in
    res.json("You're already logged in!")
  } else {
    login(req.body.username, req.body.password, req, function (response) { // TODO: Replace req.params.id with session variable https://stackoverflow.com/questions/40755622/how-to-use-session-variable-with-nodejs
      //console.log("response is: " + response)
      //req.session.save(function() {
        res.send({login: response, familyID: session.family});
      //})

      // login: response, familyID: session.family

      //res.send(sess, {});
    });
  }
});

function login(username, password, req, callback) {
  user.findOne({ "username": username }, function (err, details) { // check if username exists
    if (err) {
      console.log("error: " + err);
      callback(err);
    } else if (details == null) { // If no username match
      console.log('No match for user ' + username);
      callback(false);
    } else { // username exists in db; verify password
      //console.log(`Comparing: ${details.password} with ${password}`);
      bcrypt.compare(password, details.password, function (err, match) {
        if (err) console.log("Error 2: " + error);
        //console.log(session);
        if (match) { // match
          console.log(`${username} logged in`);
          //console.log(details);


          
          req.session.save(function(err) {
            if (err) {
              console.log(err);
            } else {
              req.session.username = username;
              req.session.family = details.familyID;
              req.session.userid = details._id;
              req.session.initialised = true;
              console.log(req.session.family);
              callback(match);
            }

          });

        } else { // not match
          console.log(`${username} tried to log in, wrong password`);
          callback(match);
        }
      });

    }
  });
  //console.log("authenticating username: " + username + " - pass: " + password);
}


router.post('/test1', function (req, res) {
  var data = req.body.data;

  req.session.data = data;

  res.send(req.session.data);
});

router.post('/test2', function (req, res) {
  res.send(req.session.data);
});

module.exports = router;