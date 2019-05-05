var router = require('express').Router();
var mongoose = require('mongoose');

router.get('/', async function(req, res, next) {
  res.render('adminpage');
});

module.exports = router;
