var router = require('express').Router();
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var { setSchedule } = require('services/setSchedule')
var { strDocAgents } = require('config/listAgents');
var { success } = require('services/returnToUser')
var { randomAgent } = require('services/randomAgent');

router.get("/", async (req, res, next) => {
  let newRole = {
    name: 'Admin',
    canSuggest: false,
    canBacklink: false,
    canClickAD: false,
    canManageUser: true
  }
  let adminGroup = await mongoose.model('role').create(newRole)

  let adminAccount = {
    username: "admin",
    password: "123",
    fullname: "Admin",
    role: adminGroup._id
  }
  const saltRounds = 10;
  bcrypt.hash(adminAccount.password, saltRounds, async (err, hash) => {
    adminAccount.password = hash;
    await mongoose.model('users').create(adminAccount)

  });
  return success(res, "Done")
})
//add agent
router.get("/UserAgents", async (req, res, next) => {
  try {
    let arrDoc = strDocAgents.trim().split(`\n`);
    arrDoc.forEach(async item => {
      await mongoose.model('userAgents').create({ document: item });
    })
    let userAgents = await mongoose.model('userAgents').find();
    return success(res, "Done", userAgents);
  } catch (error) {
    next(error);
  }
})
//reset role
router.get("/resetRole", async (req, res, next) => {
  await mongoose.model('role').deleteMany({});
  res.send('done')
})

//drop table users
router.get("/dropUsers", async (req, res, next) => {
  await mongoose.model('users').deleteMany({});
  res.send('done')
})


module.exports = router