var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');
var rfs = require('rotating-file-stream');
var logDirectory = path.join(__dirname, 'log');
var passport = require("passport");
var session = require('express-session');

var config = require("config");

require('model/connect');
require('model/schema');

var app = express();
app.set("topSecretKey", config.SECRET);
// view engine setup
app.set('views', path.join(__dirname, 'src', 'app', 'views'));
app.set('view engine', 'ejs');


// setup the logger
//// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
//// create a rotating write stream
var accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory
});
app.use(logger('common', { stream: accessLogStream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser("marketing-secret-via-signedCookie"));
app.use(express.static(path.join(__dirname, 'src', 'app', 'public'), { maxAge: '30 days', dotfiles: 'allow' }));
app.set('Cache-Control', 'max-age=3000');

app.use(
  session(
    config.SESSION
  )
);


//PassportJS middleware
app.use(passport.initialize());
app.use(passport.session()); //persistent login sessions

require('config/passport')(passport);

if (process.env.IS_DEV != 'DEV' || process.env.IS_DEV == 'undefined') {
  app.disable('/setup');
}
else {
  app.use('/setup', require('app/routes/setup'));
}

app.use('/', require('app/routes'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.render('error')
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err);

  res.render('error');
});

module.exports = app;
