var config = require('./config');
var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  res.render('template', { some: 'Data' }); // render (HTML) template
  res.send('text'); // send text
  res.json(json); // send JSON object (as text...)
});

router.get('/test', function (req, res) {
  res.send('Hello, World!!' + '\n');
});


module.exports = router;
