var router = require('express').Router();
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var {setSchedule} = require('services/setSchedule')
var {strDocAgents} = require('config/listAgents');
var { success } = require('services/returnToUser')
var { randomAgent } = require('services/randomAgent');

router.get("/", async (req, res, next) => {
    let newRole = {
      name: 'Admin',
    canSuggest: true,
    canBacklink: true,
    canClickAD: true,
    canManageUser: true
    }
    let newRole_2 = {
      name: 'Suggest',
    canSuggest: true,
    canBacklink: false,
    canClickAD: false,
    canManageUser: false
    }
    let newRole_3 = {
      name: 'BackLink & Click AD',
    canSuggest: false,
    canBacklink: true,
    canClickAD: true,
    canManageUser: false
    }
    let role_1 = await mongoose.model('role').create(newRole)
    let role_2 = await mongoose.model('role').create(newRole_2)
    let role_3 = await mongoose.model('role').create(newRole_3)
    
    let insert_1 = {
        username: "admin",
        password: "123",
        fullname: "Admin",
        role : role_1._id
      }
    let insert_2 = {
        username: "suggest",
        password: "123",
        fullname: "suggest",
        role : role_2._id
      }
    let insert_3 = {
        username: "backlink",
        password: "123",
        fullname: "backlink",
        role : role_3._id
      }
      const saltRounds = 10;
          bcrypt.hash(insert_1.password, saltRounds, async (err, hash) => {
            insert_1.password = hash;
            let usersInfo1 = await mongoose.model('users').create(insert_1)
            console.log(usersInfo1)
          });
          bcrypt.hash(insert_2.password, saltRounds, async (err, hash) => {
            insert_2.password = hash;
            let usersInfo2 = await mongoose.model('users').create(insert_2)
            console.log(usersInfo2)
          });
          bcrypt.hash(insert_3.password, saltRounds, async (err, hash) => {
            insert_3.password = hash;
            let usersInfo3 = await mongoose.model('users').create(insert_3)
            console.log(usersInfo3)
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