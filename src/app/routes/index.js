var router = require('express').Router();
var { checkPermission } = require('services/checkPermission');
var { IS_USER } = require('config/constants')

router.use('/login', require('./login'));

router.use('/', checkPermission(IS_USER), require('./adminpage'));
router.use('/setup',require('./setup'));

module.exports = router;
