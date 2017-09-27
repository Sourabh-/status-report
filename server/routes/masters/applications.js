const express = require('express');
const router = express.Router();
const fs = require('fs');
const authMiddleware = require('../../utility/auth');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));
var ObjectID = require('mongodb').ObjectID;

//Add new application
router.post("/create", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    });
  } else if (!req.body.applicationName || !req.body.ownerId) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else {
    //Check if valid owner Id
    if (!ObjectID.isValid(req.body.ownerId)) {
      return res.status(400).json({
        message: messages.invalidOwner
      })
    }

    req.app.db.findOne({ _id: ObjectID(req.body.ownerId) }, { fields: { _id: 1 } }).then(function(user) {
      if (user) {
        var app = {
          applicationName: req.body.applicationName,
          description: req.body.description || "",
          ownerId: user._id,
          createdOn: new Date().getTime()
        };
        req.app.db.collection("applications").insertOne(app).then(function(res) {
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
  } else if (!req.body.ownerId) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else if (!ObjectID.isValid(req.body.ownerId)) {
    res.status(400).json({
      message: messages.invalidOwner
    })
  } else {
    //Check if owner exists
    req.app.db.findOne({ _id: ObjectID(req.body.ownerId) }, { fields: { _id: 1 } }).then(function(user) {
      if (user) {
        req.app.db.updateOne({ _id: ObjectID(req.body.appId) }, { $set: { "ownerId": ObjectID(req.body.ownerId) } }).then(function(res) {
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
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    });
  } else if (req.query.ownerId && !ObjectID.isValid(req.query.ownerId)) {
    res.status(400).json({
      message: messages.invalidOwner
    })
  } else {
    var query = {};
    if (req.query.ownerId) query.ownerId = ObjectID(req.query.ownerId);
    if (req.query.applicationName) query.applicationName = new RegExp(req.query.applicationName, "i");
    req.app.db.find(query).toArray().then(function(apps) {
      if (apps.length == 0) {
        res.status(204).json();
      } else {
        for (var i = 0; i < apps.length; i++) {
          apps[i].appId = apps[i]._id;
          delete apps[i]._id;
        }

        res.status(200).json(apps);
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      });
    })
  }
})

module.exports = router;
