var mongoose = require('mongoose');

var projectAds = new mongoose.Schema({
    name: String,
    domain:String,
    adURL: [
        {
            type: String
        }
    ],
    delay: Number,
    amount: Number,
    log: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'logAds'
        }
    ],
    status: String,

    belongTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },

    isForceStop:{
    type:Boolean,
    default:false
  }
})

module.exports = projectAds;