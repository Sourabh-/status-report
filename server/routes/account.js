const express = require('express');
const router = express.Router();
var bcrypt = require('bcrypt');
const saltRounds = 10;
const fs = require('fs');
const uuid = require('uuid/v1');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));

//Login- Create session
router.post("/create", function(req, res) {
  //If email and password is sent
  if (req.body.emailId && req.body.password) {
    req.app.db.collection("users").find({ emailId: req.body.emailId }).limit(1).project({_id: 0}).toArray().then(function(docs) {
      if (docs.length == 0) {
        res.status(401).json({
          message: messages.noEmailMatch
        })
      } else {
        bcrypt.compare(req.body.password, docs[0].password).then(function(bool) {
          if(!bool) {
          	res.status(401).json({
          		message: messages.incorrectPassword
          	})
          } else {
          	delete docs[0].password;
          	req.session.sessionId = uuid();
            req.session.emailId = docs[0].emailId;
            req.session.isAdmin = docs[0].isAdmin;
          	res.cookie('sessionId', req.session.sessionId, { maxAge: (5 * 24 * 60 * 60 * 1000), httpOnly: true });
          	res.status(201).json(docs[0]);

          	//If pristine, update
          	if(docs[0].pristine) {
          		req.app.db.collection("users").updateOne({emailId: docs[0].emailId}, {$unset:{pristine: ""}}).then(function(res){}).catch(function(err){})
          	}
          }
        });
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      })
    })
  } else {
    res.status(400).json({
      message: messages.invalidParameters
    })
  }
})

//Logout- Delete session
router.delete("/destroy", function(req, res) {
  if (req.session) req.session.destroy();
  res.clearCookie("sessionId");
  res.status(200).json();
})

module.exports = router;
