var mongoose = require('mongoose');

var logAds = new mongoose.Schema({
 message:String,
 project:{
     type:mongoose.Schema.Types.ObjectId,
     ref:'projectAds'
 }
})

module.exports = logAds;