var router = require('express').Router();
var passport = require("passport");


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

router.post("/", passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: false
}), (req, res) => {
    try {
        if (req.body.remember) {
            req.session.cookie.maxAge = new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ); // Cookie expires after 30 days
        } else {
            req.session.cookie.expires = false; // Cookie expires at end of session
        }
        res.redirect("/");
    } catch (error) {
        next(error)
    }
}
);
module.exports = router