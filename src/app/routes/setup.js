var router = require('express').Router();
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var {setSchedule} = require('services/setSchedule')
var {strDocAgents} = require('config/listAgents');
var { success } = require('services/returnToUser')
var { randomAgent } = require('services/randomAgent');

router.get("/", async (req, res, next) => {
    let insert = {
        username: "admin",
        password: "123",
        fullname: "Admin",
      }
      const saltRounds = 10;
          bcrypt.hash(insert.password, saltRounds, async (err, hash) => {
            insert.password = hash;
            let usersInfo = await mongoose.model('users').create(insert)
            console.log(usersInfo)
          });
      return success(res, "Done")
})
//add agent
router.get("/UserAgents", async (req, res, next) => {
    try {
      let arrDoc = strDocAgents.trim().split(`\n`);
      arrDoc.forEach(async item => {
        await mongoose.model('userAgents').create({document: item});
      })
      let userAgents = await mongoose.model('userAgents').find();
      return success(res, "Done", userAgents);
    } catch (error) {
      next(error);
    }
})
//test set schedule
router.get("/schedule", async (req, res, next) => {
  let d = new Date();
  let start = new Date(d + 5000)
  setSchedule(start, function(){
    console.log("test set schedule.............")
  })
  res.send('test')
})


module.exports = router