var express = require("express");
var logger = require("morgan");
const crawlerService = require("./src/services/crawler");

require("dotenv").config();

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  crawlerService();
  return res.send("It worked !!!");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.render("error");
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err);

  res.render("error");
});

module.exports = app;
