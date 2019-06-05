var mongoose = require('mongoose');

var users = new mongoose.Schema({
  username: {
    required: true,
    type: String,
  },
  password: {
    required: true,
    type: String,
  },
  roles: [{
    type: String
  }],
  fullname: {
    required: true,
    type: String
  },
  currentSocketID:String
})

module.exports = users;