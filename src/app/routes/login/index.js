var router = require('express').Router();
var passport = require("passport");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")

//dang nhap
router.get('/', async (req, res, next) => {
    try {
        if (!req.user) {
            return res.render('login');
        }
        return res.redirect("/")
    } catch (error) {
        next(error)
    }
});

router.post("/", async (req, res, next) => {

    try {

        let user = await mongoose.model("users").findOne({ username: req.body.username });

        //check wrong username
        if (!user) {
            
            return res.json({error: "Sai tài khoản"});
        }

        //check wrong password
        if (!bcrypt.compareSync(req.body.password, user.password)) {
            return res.json({error: "Sai mật khẩu"});
        }

        res.cookie('user', user._id, { signed: true });
        res.json(user);
        return res.redirect('/');

    } catch (error) {

        console.log('err in login router: '+error);
        next(error)
    }
}
);
module.exports = router