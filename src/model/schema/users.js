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
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'role'
  },
  fullname: {
    required: true,
    type: String
  },
  currentSocketID: String,
  traffic: Number
})

module.exports = users;