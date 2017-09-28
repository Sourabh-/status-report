const express = require('express');
const router = express.Router();
const fs = require('fs');
const authMiddleware = require('../../utility/auth');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));

function findAndReturnWeeks(req, res, query) {
  req.app.db.collection("weeks").find(query).toArray(function(weeks) {
    if (weeks.length == 0)
      return res.status(204).json();

    for (let i = 0; i < weeks.length; i++) {
      weeks[i].weekId = weeks[i]._id;
      delete weeks[i]._id;
    }

    res.status(200).json(weeks);
  }).catch(function(err) {
    res.status(500).json({
      message: messages.ise
    });
  })
}

router.post("/create", authMiddleware.auth, function(req, res) {
  if (!req.session.isAdmin) {
    res.status(403).json({
      message: messages.notAuthorized
    })
  } else if (!req.body.fromDate || !req.body.toDate) {

  } else {
    let fDate = res.body.fromDate;
    let tDate = req.body.toDate;
    let today = new Date();
    let exactDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if ((fDate > tDate) || (tDate - fDate > (7 * 24 * 60 * 60 * 1000)) || (fDate < exactDate) || (tDate < exactDate)) {
      return res.status(400).json({
        message: messages.invalidWeek
      })
    }

    req.app.db.collection("weeks").findOneAndUpdate({ fromDate: fDate, toDate: tDate }, {
      $set: {
        fromDate: fDate,
        toDate: tDate,
        createdOn: new Date().getTime()
      }
    }, {
      upsert: true,
      returnOriginal: true
    }).then(function(week) {
      if (week) {
        week.weekId = week._id;
        delete week._id;
        res.status(201).json(week);
      } else {
        res.status(400).json({
          message: messages.weekAlreadyExists
        })
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      });
    })
  }
})


//Search weeks
router.get("/search", authMiddleware.auth, function(req, res) {
  if(req.query.forUser === true) {
    //For current user, get all the weekIds for which effort exist
    req.app.db.collection("effort").find({emailId: req.session.emailId}).project({weekId: 1}).toArray().then(function(efforts){
      var weekIds = [];
      for(let i=0; i<efforts.length; i++)
        weekIds.push(efforts[i].weekId);
      findAndReturnWeeks(req, res, {_id: {$nin: weekIds}});
    }).catch(function(err){
      res.status(500).json({
        message: messages.ise
      });
    })
  } else {
    findAndReturnWeeks(req, res, {});
  }
})
module.exports = router;
