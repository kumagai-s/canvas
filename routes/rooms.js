var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://mongo:27017/';

/**
 * MongoClient用オプション設定
 */
const connectOption = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

/* GET home page. */
router.get('/:roomId', async function(req, res, next) {
  var roomId = req.params.roomId;
  var client;
  try {
    client = await MongoClient.connect(url, connectOption);
    const db = client.db("canvas");
    var where = { roomId: roomId };
    const roomData = await db.collection("rooms").findOne(where);
    if (roomData != null) {
      var pathsData = 'pathsData' in roomData ? roomData["pathsData"] : undefined;
      var imageName = 'imageName' in roomData ? roomData["imageName"] : undefined;
      // console.log(imageName);
      res.render('rooms', { title: 'Canvas', roomId: roomId, pathsData: pathsData, imageName: imageName });
    } else {
      res.redirect('/');
    }
  } catch (err) {
    console.log(err);
  } finally {
    if (client) client.close();
  }
});

module.exports = router;
