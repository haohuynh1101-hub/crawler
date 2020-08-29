var mongoose = require("mongoose");

var Infomation_Schema = new mongoose.Schema({
  Mssv: {
    type: String,
  },
  Full_Name: {
    type: String,
  },
  Birthday: {
    type: String,
  },
  Place: {
    type: String,
  },
  Email: {
    type: String,
  },
});

module.exports = mongoose.model("Infomation", Infomation_Schema);
