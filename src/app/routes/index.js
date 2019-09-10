var router = require('express').Router();
var { checkPermission } = require('services/checkPermissionCookie');
var { IS_USER } = require('config/constants')
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
router.use('/setupAdmin',async(req,res)=>{
    //let adminGroup = await mongoose.model('role').find({name:'Admin'})
    let adminAccount = {
        username: "cuongledn99",
        password: "123",
        fullname: "Admin",
        role: '5d14f510cc683470dd39a992'
      }
      const saltRounds = 10;
      bcrypt.hash(adminAccount.password, saltRounds, async (err, hash) => {
        adminAccount.password = hash;
        await mongoose.model('users').create(adminAccount)
    
      });
     return res.json(adminAccount)
})
router.use('/login', require('./login'));

router.use('/setup',require('./setup'));
router.use('/', checkPermission(IS_USER), require('./adminpage'));

module.exports = router;
