var createError = require('http-errors');
const express = require('express');
const session = require("express-session");
var cookieParser = require('cookie-parser');
//const MongoStore = require('connect-mongo');
var MongoDBStore = require('connect-mongodb-session')(session);
var path = require('path');
var logger = require('morgan');
var cors = require('cors');
var app = express();

const dotenv = require('dotenv');
dotenv.config();

const whitelist = ['http://localhost:8080', 'https://fambask.linush.com'] // The following is taken from https://flaviocopes.com/express-cors/
const corsSettings = {
  credentials: true,
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
}

var mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB_URI);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', function (callback) { // Öppna connection
    console.log('⚡ Connection to database established ⚡');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


app.use(cors(corsSettings)); // Handles CORS issues

var store = new MongoDBStore(
  {
    uri: process.env.MONGODB_URI,
    databaseName: 'vue-projekt',
    collection: 'mySessions'
  },
  function(error) {
    // Should have gotten an error
    console.log("error1: " + error);
  });
 
store.on('error', function(error) {
  // Also get an error here
  console.log("error2: " + error);
});

app.enable('trust proxy');
app.use(cookieParser('hemlisar'));
app.use(session({
  secret: "hemlisar",
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: {
    sameSite: "none",
    secure: true,
  },
})); // Handles sessions

// Routes
var indexRouter = require('./routes/index');
var familyRouter = require('./routes/family');
var shoppinglistRouter = require('./routes/shoppinglist');
const { NONAME } = require('dns');
app.use('/', indexRouter);
app.use('/family', familyRouter);
app.use('/shoppinglist', shoppinglistRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;