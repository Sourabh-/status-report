const express = require('express');
const router = express.Router();
const fs = require('fs');
const authMiddleware = require('../utility/auth');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));
var ObjectID = require('mongodb').ObjectID;

//Fetch recent (given) apps and number of hours worked on them in last number of days (given)
router.get("/apps/hours", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    });
  } else {
    let noOfDays = req.query.noOfDays || 7;
    let createdOn = new Date().getTime() - (noOfDays * 24 * 60 * 60 * 1000);
    //Get appIds where I am the owner
    //For those appIds get effort and choose recent apps
    //For those apps get hours and then their names
    req.app.db.collection("applications").find({ ownerEmailId: req.session.emailId })
      .project({ _id: 1, applicationName: 1 })
      .toArray()
      .then(function(apps) {
        if (apps.length) {
          let appIds = [];
          for (let i = 0; i < apps.length; i++) {
            appIds.push(apps[i]._id);
          }

          req.app.db.collection("effort").find({ appId: { $in: appIds }, createdOn: { $gt: createdOn } })
            .sort({ createdOn: -1 })
            .project({ appId: 1, noOfHours: 1 })
            .toArray()
            .then(function(docs) {
              if (docs.length) {
                let noOfApps = req.query.noOfApps || 6;
                let recentAppIds = [];
                let totalNoOfHours = {};
                for (let i = 0; i < docs.length; i++) {
                  let flag = 0;
                  for (let j = 0; j < recentAppIds.length; j++) {
                    if (recentAppIds[j].equals(docs[i].appId)) {
                      flag = 1;
                      break;
                    }
                  }
                  if (flag == 0 && recentAppIds.length !== noOfApps) {
                    recentAppIds.push(docs[i].appId);
                    totalNoOfHours[docs[i].appId + ""] = {
                      totalNoOfHours: docs[i].noOfHours
                    }
                  }

                  if (flag == 1) {
                    totalNoOfHours[docs[i].appId + ""].totalNoOfHours = totalNoOfHours[docs[i].appId + ""].totalNoOfHours + docs[i].noOfHours;
                  }
                }

                for (let i = 0; i < apps.length; i++) {
                  if (totalNoOfHours[apps[i]._id + ""]) {
                    totalNoOfHours[apps[i]._id + ""].applicationName = apps[i].applicationName;
                  }
                }

                res.status(200).json(totalNoOfHours);

              } else {
                res.status(204).json();
              }
            }).catch(function(err) {
              res.status(500).json({
                message: messages.ise
              })
            })
        } else {
          res.status(204).json();
        }
      })
  }
})

router.get("/users/days", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    });
  } else {
    let noOfDays = req.query.noOfDays || 30;
    let createdOn = new Date().getTime() - (noOfDays * 24 * 60 * 60 * 1000);
    //Get users data
    req.app.db.collection("users").find({ createdOn: { $gt: createdOn } })
      .project({ name: 1, createdOn: 1 })
      .toArray()
      .then(function(users) {
      	if(users.length) {
      		res.status(200).json(users);
      	} else {
      		res.status(204).json();
      	}
      })
      .catch(function(err) {
        res.status(500).json({
          message: messages.ise
        })
      })
  }
})

module.exports = router;