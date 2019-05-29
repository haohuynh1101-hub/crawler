var mongoose = require('mongoose');
var schema = require('./schema/index');

module.exports = {
  users: mongoose.model('users', schema.users),
  userAgents: mongoose.model('userAgents', schema.userAgents),
  projects:mongoose.model('projects',schema.project),
  logs:mongoose.model('logs',schema.logs)
}