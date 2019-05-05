var router = require('express').Router();



router.use('/', require('./homepage'));
router.use('/admin', require('./adminpage'));
module.exports = router;
