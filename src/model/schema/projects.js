var mongoose = require('mongoose');

var projects = new mongoose.Schema({
  name:String,
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
          ref:'logs'
      }
  ],
  status:String,
  belongTo:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'users'
  }
})

module.exports = projects;