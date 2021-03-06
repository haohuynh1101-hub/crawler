var mongoose = require('mongoose');

var role = new mongoose.Schema({
    name: { type: String, require: true },
    canSuggest: { type: Boolean, default: false },
    canBacklink: { type: Boolean, default: false },
    canClickAD: { type: Boolean, default: false },
    canIndex: { type: Boolean, default: false },
    canManageUser: { type: Boolean, default: false },
    maxUsingDate: Number,
    maxProject:Number
})

module.exports = role;