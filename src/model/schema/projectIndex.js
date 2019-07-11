var mongoose = require('mongoose');

var projectIndex = new mongoose.Schema({

    name: String,

    links: [
        {
            type: String
        }
    ],

    belongTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    }

})

module.exports = projectIndex;