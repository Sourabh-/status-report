const MongoClient = require('mongodb').MongoClient;
const readline = require('readline');
var bcrypt = require('bcrypt');
const saltRounds = 10;
var randomstring = require("randomstring");

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
    rl.question("Enter first user's name: ", (uname) => {
      rl.question("Enter first user's date of birth(DD/MM/YYYY): ", (dob) => {
        rl.question("Enter first user's email Id: ", (emailId) => {
          rl.question("Enter first user's designation: ", (designation) => {
            rl.question(`Is the following details correct? (Y/N)\n
              Mongo Host: ${mongoHost},
              Mongo Port: ${mongoPort},
              User's name: ${uname},
              User's email Id: ${emailId},
              User's date of birth: ${dob}
              User's designation: ${designation}\n
             `, (ans) => {
              if(ans && ans.toLowerCase() == "y") {
                console.log("Connecting to database...");
                MongoClient.connect('mongodb://' + mongoHost + ':' + mongoPort + '/Database', function(err, db) {
                  if (!err) {
                    console.log("Connected to database. Initializing indexes.");
                    console.log("Creating users index...");
                    db.collection("users").createIndex({ emailId: 1 }, { unique: true }, function(err, indexName) {
                      if (err) {
                        console.log("ERROR OCCURRED WHILE ADDING CONSTRAINT IN USERS! ABORTING!!!!!");
                        process.exit();
                      }
                      console.log("Users index created.");
                      console.log("Creating applications index...");
                      db.collection("applications").createIndex({ applicationName: 1 }, { unique: true }, function(err, indexName) {
                        if (err) {
                          console.log("ERROR OCCURRED WHILE ADDING CONSTRAINT IN APPLICATIONS! ABORTING!!!!!");
                          process.exit();
                        }
                        console.log("Applications index created.");
                        console.log("Creating effort index...");
                        db.collection("effort").createIndex({ appId: 1, weekId: 1, emailId: 1 }, { unique: true }, function(err, indexName) {
                          if (err) {
                            console.log("ERROR OCCURRED WHILE ADDING CONSTRAINT IN EFFORT! ABORTING!!!!!");
                            process.exit();
                          }
                          console.log("Effort index created.");
                          console.log("Creating holidays index...");
                          db.collection("holidays").createIndex({ date: 1 }, { unique: true }, function(err, indexName) {
                            if (err) {
                              console.log("ERROR OCCURRED WHILE ADDING CONSTRAINT IN HOLIDAYS! ABORTING!!!!!");
                              process.exit();
                            }
                            console.log("Holidays index created.");
                            console.log("Creating assignedUsers index...");
                            db.collection("assignedUsers").createIndex({ appId: 1, emailId: 1 }, { unique: true }, function(err, indexName) {
                              if (err) {
                                console.log("ERROR OCCURRED WHILE ADDING CONSTRAINT IN ASSIGNEDUSERS! ABORTING!!!!!");
                                process.exit();
                              }
                              console.log("AssignedUsers index created.");
                              console.log("Creating first user...");
                              let date = dob.split("/");
                              let pwd = randomstring.generate(7);
                              let salt = bcrypt.genSaltSync(saltRounds);
                              //Create first ADMIN USER
                              db.collection("users").insertOne({
                                "password" : bcrypt.hashSync(pwd, salt),
                                "name" : uname,
                                "emailId" : emailId,
                                "dob" : new Date(date[2], date[1]-1, date[0]).getTime(),
                                "designation" : designation,
                                "isAdmin" : true,
                                "pristine": true, //Never logged in
                                "createdOn" : new Date().getTime()
                              }).then(function(reslt) {
                                console.log("First user created. Generated password for first user: " + pwd);
                                console.log("Use your email Id and generated password to login.");
                                console.log("We suggest you to change your password after login.");
                                console.log("Exiting...");
                                rl.close();
                                process.exit();
                              }).catch(function() {
                                console.log("Error ocurred: " + err);
                                rl.close();
                                process.exit();
                              })
                            })
                          })
                        })
                      })
                    })
                  } else {
                    console.log("ERROR OCCURRED! ABORTING!!!!!");
                  }
                })
              } else {
                console.log("Incorrect info. Exiting.");
                rl.close();
                process.exit();
              }
            });
          })    
        })  
      })
    })
  })
})
