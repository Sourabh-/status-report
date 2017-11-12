const express = require('express');
const router = express.Router();
const fs = require('fs');
const authMiddleware = require('../utility/auth');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));
var ObjectID = require('mongodb').ObjectID;

//Add effort
router.post("/create", authMiddleware.auth, function(req, res) {
  if (!req.body.weekId || typeof req.body.noOfHours == 'undefined' || !req.body.appId) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else if (typeof req.body.noOfHours != 'number' || req.body.noOfHours > 168) {
    res.status(400).json({
      message: messages.invalidHours
    })
  } else if (!ObjectID.isValid(req.body.weekId)) {
    res.status(400).json({
      message: messages.invalidWeek
    })
  } else if (!ObjectID.isValid(req.body.appId)) {
    res.status(400).json({
      message: messages.invalidApp
    })
  } else {
    //Check if app exists
    req.app.db.collection("applications").findOne({ _id: ObjectID(req.body.appId) }, {}).then(function(app) {
      if (app) {
        //Check if week exists
        req.app.db.collection("weeks").findOne({ _id: ObjectID(req.body.weekId) }, {}).then(function(week) {
          if (week) {
            req.app.db.collection("effort").insertOne({ 
              appId: ObjectID(req.body.appId), 
              weekId: ObjectID(req.body.weekId), 
              noOfHours: req.body.noOfHours, 
              emailId: req.session.emailId,
              createdOn: new Date().getTime() 
            }).then(function(reslt) {
              res.status(201).json(req.body);
            }).catch(function(err) {
              (err.code == 11000) ? res.status(400).json({
                message: messages.effortExists
              }): res.status(500).json({
                message: messages.ise
              });
            })
          } else {
            res.status(400).json({
              message: messages.invalidWeek
            })
          }
        }).catch(function(err) {
          res.status(500).json({
            message: messages.ise
          });
        })
      } else {
        res.status(400).json({
          message: messages.invalidApp
        })
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      });
    })
  }
})

module.exports = router;
