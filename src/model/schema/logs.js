var mongoose = require('mongoose');

var logs = new mongoose.Schema({
 message:String,
 project:{
     type:mongoose.Schema.Types.ObjectId,
     ref:'project'
 }
})

module.exports = logs;