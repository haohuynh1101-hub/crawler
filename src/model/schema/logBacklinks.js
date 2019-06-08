var mongoose = require('mongoose');

var logBacklinks = new mongoose.Schema({
 message:String,
 project:{
     type:mongoose.Schema.Types.ObjectId,
     ref:'projectBacklinks'
 }
})

module.exports = logBacklinks;