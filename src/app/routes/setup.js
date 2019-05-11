var router = require('express').Router();
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var { success } = require('services/returnToUser')

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

module.exports = router