var mongoose = require('mongoose');

var projectBacklinks = new mongoose.Schema({
  name:String,
  keyword:[
      {
          type:String
      }
  ],
  urlBacklink:String,
  mainURL:String,
  delay:Number,
  amount:Number,
  log:[
      {
          type:mongoose.Schema.Types.ObjectId,
          ref:'logBacklinks'
      }
  ],
  status:String,
  belongTo:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'users'
  }
})

module.exports = projectBacklinks;