var mongodb = require('mongodb');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("config.json", "utf8"));
var uri = config.mongo.url;

function connect(cb) {
  mongodb.connect(uri, function(err, db) {
    if (err) {
      cb(err);
      return;
    }

    exports.db = db; 
    cb(null);
  });
};

exports.connect = connect;