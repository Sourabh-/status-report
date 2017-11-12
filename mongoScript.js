const MongoClient = require('mongodb').MongoClient;
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let mongoHost = '127.0.0.1';
let mongoPort = '27017';

rl.question('Enter Mongo Host: ', (host) => {
  mongoHost = host || mongoHost;

  rl.question('Enter Mongo Port: ', (port) => {
    mongoPort = port || mongoPort;
    MongoClient.connect('mongodb://' + mongoHost + ':' + mongoPort + '/Database', function(err, db) {
      if (!err) {
        db.collection("users").createIndex({ emailId: 1 }, { unique: true }, function(err, indexName) {
          if (err) {
            console.log("ERROR OCCURRED WHILE ADDING CONSTRAINT IN USERS! ABORTING!!!!!");
            process.exit();
          }
          db.collection("applications").createIndex({ applicationName: 1 }, { unique: true }, function(err, indexName) {
            if (err) {
              console.log("ERROR OCCURRED WHILE ADDING CONSTRAINT IN APPLICATIONS! ABORTING!!!!!");
              process.exit();
            }

            db.collection("effort").createIndex({ appId: 1, weekId: 1, emailId: 1 }, { unique: true }, function(err, indexName) {
              if (err) {
                console.log("ERROR OCCURRED WHILE ADDING CONSTRAINT IN EFFORT! ABORTING!!!!!");
                process.exit();
              }
              db.collection("holidays").createIndex({ date: 1 }, { unique: true }, function(err, indexName) {
                if (err) {
                  console.log("ERROR OCCURRED WHILE ADDING CONSTRAINT IN HOLIDAYS! ABORTING!!!!!");
                  process.exit();
                }
                db.collection("assignedUsers").createIndex({ appId: 1, emailId: 1 }, { unique: true }, function(err, indexName) {
                  if (err) {
                    console.log("ERROR OCCURRED WHILE ADDING CONSTRAINT IN ASSIGNEDUSERS! ABORTING!!!!!");
                    process.exit();
                  }

                  console.log("SUCCESS!!!!!");
                  rl.close();
                  process.exit();
                })
              })
            })
          })
        })
      } else {
        console.log("ERROR OCCURRED! ABORTING!!!!!");
      }
    })
  })
})
