var express = require('express');
var router = express.Router();

const {randomBytes} = require('crypto');
var filename = randomBytes(15).reduce((p, i) => p + (i % 36).toString(36), '');
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './public/images/')
  },
  filename: function(req, file, cb){
    cb(null, filename)
  }
});

var upload = multer({ storage: storage });

router.post('/', upload.single('file'), function(req, res, next) {
  res.json({ 'result': filename });
});

module.exports = router;