var mongoose = require('mongoose');

var userAgents = new mongoose.Schema({
  document: {
      type: String
  }
})

module.exports = userAgents;