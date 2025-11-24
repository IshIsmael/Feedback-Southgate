var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { 
    title: 'Southgate Leisure Centre | Feedback',
    error: null,
    success: null
  });
});

router.get('/privacy', function(req, res, next) {
  res.render('privacy', {
    title: 'Privacy Policy | Southgate Leisure Centre'
  });
});

module.exports = router;