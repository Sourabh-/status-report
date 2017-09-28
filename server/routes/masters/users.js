const express = require('express');
const router = express.Router();
var bcrypt = require('bcrypt');
const saltRounds = 10;
const fs = require('fs');
const authMiddleware = require('../../utility/auth');
var randomstring = require("randomstring");
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));


//=============COMMON FUNCTIONALITY=============//
function findUserAndReturn(req, res, query) {
  req.app.db.collection("users").find(query, {
    fields: { emailId: 1, name: 1, dob: 1, isAdmin: 1, thumbnail: 1, designation: 1, createdOn: 1 }
  }).then(function(docs) {
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

    req.app.db.collection("users").findOneAndUpdate({ emailId: req.params.emailId }, { $set: users }, {
      projection: { emailId: 1, name: 1, dob: 1, isAdmin: 1, thumbnail: 1, designation: 1 },
      returnOriginal: false
    }).then(function(res) {
      if (res.modifiedCount == 1) {
        res.status(204).json();
      } else {
        res.status(400).json({
          message: messages.noEmailMatch
        })
      }
    }).catch(function(err) {
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
        	if(appUsers.length) {
        		var uIds = [];
        		for(var i=0; i<appUsers.length; i++)
        			uIds.push(appUsers[i].userId);

            if(req.query.unassigned === true && req.query.name)
        		  findUserAndReturn({_id: {$nin: uIds}, name: new RegExp(req.query.name, 'i')});
            else
              findUserAndReturn({_id: uIds});
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

module.exports = router;
