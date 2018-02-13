const express = require('express');
const router = express.Router();
const fs = require('fs');
const authMiddleware = require('../../utility/auth');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));
var ObjectID = require('mongodb').ObjectID;


returnApps = (req, res, query) => {
  req.app.db.collection("applications").find(query).toArray().then(function(apps) {
    if (apps.length) {
      for(let i=0; i<apps.length; i++) {
        apps[i].appId = apps[i]._id;
        delete apps[i]._id;
      }
      res.status(200).json(apps);
    } else {
      res.status(204).json();
    }
  }).catch(function(err) {
    res.status(500).json({
      message: messages.ise
    });
  })
};

//Add new application
router.post("/create", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    });
  } else if (!req.body.applicationName || !req.body.ownerEmailId) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else {

    req.app.db.collection("users").findOne({ emailId: req.body.ownerEmailId }, { fields: { _id: 1 } }).then(function(user) {
      if (user) {
        var app = {
          applicationName: req.body.applicationName,
          description: req.body.description || "",
          ownerEmailId: req.body.ownerEmailId,
          createdOn: new Date().getTime()
        };
        req.app.db.collection("applications").insertOne(app).then(function(reslt) {
          res.status(201).json(app);
        }).catch(function(err) {
          (err.code == 11000) ? res.status(400).json({
            message: messages.appExists
          }): res.status(500).json({
            message: messages.ise
          });
        })
      } else {
        return res.status(400).json({
          message: messages.invalidOwner
        })
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      });
    })
  }
})

//Update existing application
router.put("/update/:appId", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    });
  } else if (!ObjectID.isValid(req.params.appId)) {
    res.status(400).json({
      message: messages.invalidApp
    })
  } else if (!req.body.ownerEmailId) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else {
    //Check if owner exists
    req.app.db.findOne({ emailId: req.body.ownerEmailId }, { fields: { _id: 1 } }).then(function(user) {
      if (user) {
        req.app.db.updateOne({ _id: ObjectID(req.body.appId) }, { $set: { "ownerEmailId": req.body.ownerEmailId } }).then(function(res) {
          if (res.modifiedCount == 1) {
            res.status(204).json();
          } else {
            res.status(400).json({
              message: messages.invalidApp
            })
          }
        }).catch(function(err) {

        })
      } else {
        res.status(400).json({
          message: messages.invalidOwner
        })
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      });
    })
  }
})

//Search application
router.get("/search", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin || req.query.assigneeEmailId) {
    req.app.db.collection("assignedUsers").find({
      emailId: !req.session.isAdmin ? req.session.emailId : req.query.assigneeEmailId
    }).toArray().then(function(docs) {
      if (docs.length == 0) {
        res.status(204).json();
      } else {
        var appIds = docs.map((v) => {
          return v.appId;
        });

        returnApps(req, res, {
          _id: { $in: appIds } 
        });
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      })
    })
  } else {
    var query = {};
    if (req.query.ownerEmailId) query["ownerEmailId"] = req.query.ownerEmailId;
    if (req.query.applicationName) query["applicationName"] = new RegExp("^" + req.query.applicationName + "$", 'i');
    returnApps(req, res, query);
  }
})

router.post("/message", authMiddleware.auth, function(req, res) {
  if (!req.body.ownerEmailId || !req.body.appId || !req.body.message) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else if (!ObjectID.isValid(req.body.appId)) {
    res.status(400).json({
      message: messages.invalidApp
    })
  } else {
    req.app.db.collection("applications").findOne({
      _id: ObjectID(req.body.appId),
      ownerEmailId: req.body.ownerEmailId
    }, { fields: { _id: 1 } }).then(function(app) {
      if (app) {
        let mailOptions = {
          to: req.body.ownerEmailId,
          subject: 'Report- Message Received',
          html: `<b>Hi,</b>
                 <br/><br/>
                 Following message is sent to you from 
                 <i><b>${req.session.emailId}</b></i>:
                 <br/><br/>
                 <i><b>${req.body.message}</b></i>
                 <br/><br/>
                 Best regards!
                 <br/>
                 Report Team
                 ` // html body
        };

        req.app.mailer.sendMail(mailOptions, function(err, response) {
          if (err) {
            res.status(500).json({
              message: messages.ise
            })
          } else {
            res.status(204).json();
          }
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
