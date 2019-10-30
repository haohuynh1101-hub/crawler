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

//get all youtuber
router.get('/digger', async (req, res) => {

  let mainURL_backlink = await mongoose.model('projectBacklinks').find({ 'mainURL': /youtube/ })
    .select(['belongTo'])
    .populate('belongTo');
  let backlink = await mongoose.model('projectBacklinks').find({ 'urlBacklink': /youtube/ })
    .select(['belongTo'])
    .populate('belongTo');

  let suggest = await mongoose.model('projects').find({ 'domain': /youtube/ })
    .select(['belongTo'])
    .populate('belongTo');

  let domain_ad = await mongoose.model('projectAds').find({ 'domain': /youtube/ })
    .select(['belongTo'])
    .populate('belongTo');

  let adurl = await mongoose.model('projectAds').find({ 'adURL': /youtube/ })
    .select(['belongTo'])
    .populate('belongTo');


  return success(res, 'success', { mainURL_backlink, backlink, suggest, domain_ad, adurl });
})

//reset traffic
router.get('/monthlyTraffic',async(req,res)=>{

  await mongoose.model('users').updateMany({ monthlyTraffic: 20000 });
  res.send('ok')
})

//drop table users
router.get("/dropAgent", async (req, res, next) => {
  await mongoose.model('userAgents').deleteMany({});
  res.send('done');
})
module.exports = router