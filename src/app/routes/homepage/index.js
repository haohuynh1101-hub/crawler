var router = require('express').Router();
var mongoose = require('mongoose');

router.get('/', async (req, res, next) => {
  res.render('homepage');
});

module.exports = router;
