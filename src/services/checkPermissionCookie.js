var _ = require("lodash");
const mongoose = require("mongoose");

var { redirectLogin } = require('./returnToUser');

const isExistUser = async (userid) => {

  let count = await mongoose.model('users').findById(userid).count();

  if (count == 0) return false;

  return true;
}

module.exports = {
  checkPermission: (...allowed) => {
    const isAllowed = (usersRole = []) => {
      // Check permission of user is allow in action Role
      // If actionRole is * return true
      if (_.intersection(...allowed, ["*"]).length > 0) {
        return true;
      } else {
        // If it content, 2 array is greater than 0
        if (_.intersection(usersRole, ...allowed).length > 0) {
          return true;
        }
        return false;
      }
    };

    // return a middleware
    return async (req, res, next) => {

      if (req.signedCookies.user && await isExistUser(req.signedCookies.user)) {

        let user = await mongoose.model('users').findById(req.signedCookies.user);

        if (isAllowed(user.role)) {

          next();
        } else {
          
          // role is allowed, so continue on the next middleware
          return res.status(403).json({ message: "Forbidden" }); // user is forbidden
        }

      } else {

        await res.clearCookie("user", { path: "/" });
        return redirectLogin(res);
      }
    };
  }
};