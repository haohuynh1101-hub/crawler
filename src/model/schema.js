var mongoose = require('mongoose');
var schema = require('./schema/index');

module.exports = {
  users: mongoose.model('users', schema.users),
  userAgents: mongoose.model('userAgents', schema.userAgents)
}