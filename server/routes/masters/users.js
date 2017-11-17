const express = require('express');
const router = express.Router();
var bcrypt = require('bcrypt');
const saltRounds = 10;
const fs = require('fs');
const authMiddleware = require('../../utility/auth');
var randomstring = require("randomstring");
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));
var ObjectID = require('mongodb').ObjectID;
const config = JSON.parse(fs.readFileSync("./config.json"));

//=============COMMON FUNCTIONALITY=============//
function findUserAndReturn(req, res, query) {
  query['$or'] = [{ archived: { $exists: false } }, { archived: false }];
  req.app.db.collection("users").find(query, {
    fields: { emailId: 1, name: 1, dob: 1, isAdmin: 1, thumbnail: 1, designation: 1, createdOn: 1 }
  }).toArray().then(function(docs) {
    if (docs.length == 0) {
      res.status(204).json();
    } else {
      res.status(200).json(docs);
    }
  }).catch(function(err) {
    res.status(500).json({
      message: messages.ise
    })
  })
}

//==============================================//
//Create new user
router.post("/create", authMiddleware.auth, function(req, res) {
  if (!req.body.name || !req.body.emailId || !req.body.dob || !req.body.designation) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else {
    var pwd = randomstring.generate(7);
    var salt = bcrypt.genSaltSync(saltRounds);
    var user = {
      "name": req.body.name,
      "emailId": req.body.emailId,
      "dob": req.body.dob,
      "designation": req.body.designation,
      "thumbnail": "",
      "isAdmin": req.body.isAdmin === true,
      "pristine": true, //Never logged in
      "password": bcrypt.hashSync(pwd, salt),
      "createdOn": new Date().getTime()
    };

    req.app.db.collection("users").insertOne(user).then(function(reslt) {
      res.status(201).json(user);
      //Send email here
      let mailOptions = {
        to: req.body.emailId,
        subject: 'Welcome to Report Application!',
        html: `<b>Hi ${req.body.name},</b>
               <br/>
               You have been added to the report application. Following are your login credentials:
               <br/><br/>
               EmailId: <b>${req.body.emailId}</b>
               <br/>
               Password: <b>${pwd}</b>
               <br/><br/>
               We suggest you to change your password after login. Please login <a href="${config.server.externalUrl}">here.</a>
               <br/><br/>
               Best regards!
               <br/>
               Report Team` // html body
      };

      req.app.mailer.sendMail(mailOptions, function(err, response) {
        if (err) {
          console.log(err);
        }
      })

    }).catch(function(err) {
      (err.code == 11000) ? res.status(400).json({
        message: messages.emailIdExists
      }): res.status(500).json({
        message: messages.ise
      });
    })
  }
})

//Update existing user
router.put("/update/:emailId", authMiddleware.auth, function(req, res) {
  if (!req.body.name && !req.body.dob && !req.body.designation && !req.body.thumbnail) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else if (!req.session.isAdmin && (req.body.name || req.body.dob || req.body.designation)) {
    res.status(403).json({
      message: messages.notAuthorized
    })
  } else if (req.session.isAdmin && req.body.thumbnail) {
    res.status(403).json({
      message: messages.notAuthorized
    })
  } else {
    var user = {};
    if (req.body.name) user.name = req.body.name;
    if (req.body.dob) user.dob = req.body.dob;
    if (req.body.designation) user.designation = req.body.designation;
    if (req.body.thumbnail) user.thumbnail = req.body.thumbnail;

    req.app.db.collection("users").findOneAndUpdate({ emailId: req.params.emailId, $or: [{ archived: { $exists: false } }, { archived: false }] }, { $set: user }, {
      projection: { emailId: 1, name: 1, dob: 1, isAdmin: 1, thumbnail: 1, designation: 1 },
      returnOriginal: false
    }).then(function(reslt) {
      if (reslt.value) {
        res.status(204).json();
      } else {
        res.status(400).json({
          message: messages.noEmailMatch
        })
      }
    }).catch(function(err) {
      console.log(err);
      res.status(500).json({
        message: messages.ise
      })
    })
  }
})

//Search user(s)
router.get("/search", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    findUserAndReturn(req, res, { emailId: req.session.emailId });
  } else if (req.query.applicationName) {
    req.app.db.collection("applications").find({ applicationName: req.query.applicationName }).toArray().then(function(apps) {
      if (apps.length) {
        req.app.db.collection("applicationUsers").find({ appId: apps[0]._id }).toArray().then(function(appUsers) {
          if (appUsers.length) {
            var uIds = [];
            for (var i = 0; i < appUsers.length; i++)
              uIds.push(appUsers[i].userId);

            if (req.query.unassigned === true && req.query.name)
              findUserAndReturn({ _id: { $nin: uIds }, name: new RegExp(req.query.name, 'i') });
            else
              findUserAndReturn({ _id: uIds });
          } else
            res.status(204).json();
        }).catch(function(err) {
          res.status(500).json({
            message: messages.ise
          })
        })
      } else {
        res.status(204).json();
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      })
    })
  } else {
    var query = {};
    if (req.query.name) query.name = new RegExp(req.query.name, 'i');
    if (req.query.designation) query.designation = req.query.designation;
    if (req.query.dob) query.dob = req.query.dob;
    if (req.query.emailId) query.emailId = req.query.emailId;
    findUserAndReturn(req, res, query);
  }
})

router.post("/assign", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    });
  } else if (!req.body.emailId || !req.body.appId || !/\@/.test(req.body.emailId)) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else if (!ObjectID.isValid(req.body.appId)) {
    res.status(400).json({
      message: messages.invalidApp
    })
  } else {
    req.app.db.collection("users").findOne({ emailId: req.body.emailId }, { fields: { _id: 1 } }).then(function(user) {
      if (user) {
        req.app.db.collection("applications").findOne({ _id: ObjectID(req.body.appId) }, { fields: { _id: 1 } }).then(function(app) {
          if (app) {
            req.app.db.collection("assignedUsers").insertOne({
              appId: ObjectID(req.body.appId),
              emailId: req.body.emailId
            }).then(function(reslt) {
              res.status(201).json(reslt);
            }).catch(function(err) {
              (err.code == 11000) ? res.status(400).json({
                message: messages.userAlreadyAssigned
              }): res.status(500).json({
                message: messages.ise
              });
            })
          } else
            res.status(400).json({
              message: messages.invalidApp
            })
        }).catch(function(err) {
          res.status(500).json({
            message: messages.ise
          })
        })
      } else
        res.status(400).json({
          message: messages.noEmailMatch
        })
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      })
    })
  }
})

router.delete("/delete/:emailId", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    });
  } else if(req.session.emailId == req.params.emailId) {
    res.status(403).json({
      message: messages.cannotDelSelf
    })
  } else {
    req.app.db.collection("users").findOneAndUpdate({ 
      emailId: req.params.emailId
    }, {
      $set: { archived: true }
    }, {
      projection: { emailId: 1 },
      returnOriginal: false
    }).then(function(reslt) {
      if (reslt.value) {
        res.status(204).json();
      } else {
        res.status(400).json({
          message: messages.noEmailMatch
        })
      }
    }).catch(function(err) {
      console.log(err);
      res.status(500).json({
        message: messages.ise
      })
    })
  }
})

router.put("/image", authMiddleware.auth, function(req, res) {
  if(!req.body.image) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else {
    req.app.db.collection("users").updateOne({emailId: req.session.emailId}, {
      $set: {
        image: req.body.image
      }
    }).then(function(rslt) {
      res.status(204).json();
    }).catch(function(err) {
      console.log(err);
      res.status(500).json({
        message: messages.ise
      })
    })
  }
})

module.exports = router;
