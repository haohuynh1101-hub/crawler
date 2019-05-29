var mongoose = require('mongoose');

var projects = new mongoose.Schema({
  keyword:[
      {
          type:String
      }
  ],
  domain:String,
  delay:Number,
  amount:Number,
  log:[
      {
          type:mongoose.Schema.Types.ObjectId,
          ref:'log'
      }
  ],
  belongTo:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'users'
  }
})

module.exports = projects;