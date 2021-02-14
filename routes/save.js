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

router.post('/:roomId', async function(req, res, next) {
  var roomId = req.params.roomId;
  var pathsData = req.body.pathsData;
  var imageName = req.body.imageName;
  var client;
  try {
    client = await MongoClient.connect(url, connectOption);
    const db = client.db("canvas");
    const collection = db.collection("rooms");
    var where = { roomId: roomId };
    var value = { $set: { pathsData: pathsData, imageName: imageName } };
    await collection.updateOne(where, value);
  } catch (err) {
    console.log(err);
  } finally {
    if (client) client.close();
  }
});

module.exports = router;
