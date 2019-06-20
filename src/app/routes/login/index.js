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
        if (!user) {
            return res.redirect('/login');
        }
        //check password
        if (!bcrypt.compareSync(req.body.password, user.password)) {
            return res.redirect('login');
        }
        res.cookie('user', user._id, { signed: true });
        return res.redirect('/');
    } catch (error) {
        next(error)
    }
}
);
module.exports = router