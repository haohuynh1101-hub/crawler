var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var Infomation = require("./src/model/schema/infomation");
const crawlerService = require("./src/services/crawler");
const infomation = require("./src/model/schema/infomation");

require("dotenv").config();

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.post("/", async (req, res) => {
  let { EMAIL, PASSWORD } = req.body;
  let data = await crawlerService(EMAIL, PASSWORD);
  return res.send(data);
});
// app.post("/test", async (req, res) => {
//   let { EMAIL, PASSWORD } = req.body;
//   // await crawlerService(EMAIL, PASSWORD);
//   console.log("test");
//   return res.send("ok");
// });
app.get("/infomation", async (req, res) => {
  let data = await Infomation.find({});
  return res.send(data);
});

app.get("/infomation/:mssv", async (req, res) => {
  let mssv = req.params.mssv;
  let data = await Infomation.find({ Mssv: mssv });
  return res.send(data);
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.render("error");
});

// error handle
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err);

  res.render("error");
});
mongoose.connect("mongodb://localhost:27017/TKB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => {
  console.log("connected");
});
module.exports = app;
