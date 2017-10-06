const express = require('express');
const router = express.Router();
const fs = require('fs');
const authMiddleware = require('../../utility/auth');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));

//Add holidays
router.post("/create", authMiddleware.auth, function(req, res) {
  if (!req.session.admin) {
    res.status(403).json({
      message: messages.notAuthorized
    });
  } else if (!req.body.date || [12, 13].indexOf(req.body.date + "").length == -1) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else {
    req.app.db.collection("holidays").insertOne({
      date: req.body.date,
      name: req.body.holidayName || ""
    }).then(function(reslt) {
      res.status(201).json(reslt);
    }).catch(function(err) {
      (err.code == 11000) ? res.status(400).json({
        message: messages.appExists
      }): res.status(500).json({
        message: messages.ise
      });
    })
  }
})

//Fetch holidays
router.get("/search", authMiddleware.auth, function(req, res) {
  if (!req.session.admin) {
    res.status(403).json({
      message: messages.notAuthorized
    });
  } else {
    var query = {};
    if (req.query.date) query.date = req.query.date.replace(/ /g, "").split(",");
    if (req.query.name) query.name = new RegExp(req.query.name, 'i');

    req.app.db.collection("holidays").find(query, { fields: { _id: 0 } }).toArray().then(function(holidays) {
      holidays.length ? res.status(200).json(holidays) : res.status(204).json();
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      });
    })
  }
})
