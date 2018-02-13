const express = require('express');
const router = express.Router();
const fs = require('fs');
const authMiddleware = require('../../utility/auth');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));

//Add new designation
router.post("/create", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    })
  } else if (!req.body.designation) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else {
    var desig = {
      designation: req.body.designation.trim(),
      createdOn: new Date().getTime()
    };
    req.app.collection("designations").insertOne(desig).then(function(reslt) {
      res.status(201).json(desig);
    }).catch(function(err) {
      (err.code == 11000) ? res.status(400).json({
        message: messages.desigExists
      }): res.status(500).json({
        message: messages.ise
      });
    })
  }
})

//Get all designations
router.get("/search", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    })
  } else {
    req.app.collection("designations").find({}).toArray().then(function(desigs) {
      if (desigs.length == 0)
        res.status(204).json();
      else {
        for (let i = 0; i < desigs.length; i++) {
          desigs[i].designationId = desigs[i]._id;
          delete desigs[i]._id;
        }

        res.status(200).json(desigs);
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      })
    })
  }
})

module.exports = router;
