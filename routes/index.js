var express = require('express');
var router = express.Router();

/* INDEX */
router.get('/', function(req, res, next) { // Detta är vanliga index av ExpressJS, behöll detta
  res.render('index', { title: 'Express' });
});


module.exports = router;