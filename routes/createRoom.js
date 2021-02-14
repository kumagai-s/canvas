var express = require('express');
var router = express.Router();

const {randomBytes} = require('crypto');

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
router.get('/', async function(req, res, next) {
  var roomId = randomBytes(10).reduce((p, i) => p + (i % 36).toString(36), '');
  var client;
  try {
    client = await MongoClient.connect(url, connectOption);
    const db = client.db("canvas");
    const collection = db.collection("rooms");
    await collection.insertOne({ roomId: roomId, createdAt: new Date() });
  } catch (err) {
    console.log(err);
  } finally {
    if (client) client.close();
    res.redirect('/rooms/' + roomId);
  }
});

module.exports = router;
