var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require("passport");
var session = require('express-session');
var cluster = require('cluster');
var os = require('os');
var { PORT } = require('./src/config');

var config = require("config");

require('dotenv').config();
require('model/connect');
require('model/schema');


if (cluster.isMaster) {
  // we create a HTTP server, but we do not use listen
  // that way, we have a socket.io server that doesn't accept connections
  var server = require('http').createServer();
  var io = require('socket.io').listen(server);
  var redis = require('socket.io-redis');

  io.adapter(redis({ host: 'localhost', port: PORT }));

  setInterval(function() {
    // all workers will receive this in Redis, and emit
    io.emit('data', 'payload');
  }, 1000);

  for (var i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });
}

if (cluster.isWorker) {
  var http = require('http');
  var app = express();
  var server = http.createServer(app);
  var io = require('socket.io').listen(server);
  var redis = require('socket.io-redis');

  io.adapter(redis({ host: 'localhost', port: PORT }));
  io.on('connection', function(socket) {
    socket.emit('data', 'connected to worker: ' + cluster.worker.id);
  });
  
  app.set("topSecretKey", config.SECRET);
  // view engine setup
  app.set('views', path.join(__dirname, 'src', 'app', 'views'));
  app.set('view engine', 'ejs');
  
  app.use(logger('dev'));
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
  
  if(process.env.IS_DEV != 'DEV' || process.env.IS_DEV == 'undefined'){
    app.disable('/setup');
  }
  else {
    app.use('/setup', require('app/routes/setup'));
  }
  
  app.use('/', require('app/routes'));
  
    // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    res.render('error')
  });
  
  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    console.log(err);
    
    res.render('error');
  });
}