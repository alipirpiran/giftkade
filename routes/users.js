var express = require('express');
var router = express.Router();

const joi = require('joi')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signUp', (req, res) => {
  
})

module.exports = router;
