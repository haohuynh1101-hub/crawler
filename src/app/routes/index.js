var router = require('express').Router();
var { checkPermission } = require('services/checkPermissionCookie');
var { IS_USER } = require('config/constants')

router.use('/login', require('./login'));

router.use('/setup',require('./setup'));
router.use('/', checkPermission(IS_USER), require('./adminpage'));

module.exports = router;
