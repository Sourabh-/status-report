const express = require('express');
const router = express.Router();
var bcrypt = require('bcrypt');
const saltRounds = 10;
const fs = require('fs');
const uuid = require('uuid/v1');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));
const authMiddleware = require('../utility/auth');
var randomstring = require("randomstring");

//Login- Create session
router.post("/session/create", function(req, res) {
  //If email and password is sent
  if (req.body.emailId && req.body.password) {
    req.app.db.collection("users").find({ emailId: req.body.emailId, $or: [{ archived: { $exists: false } }, { archived: false }] }).limit(1).project({ _id: 0 }).toArray().then(function(docs) {
      if (docs.length == 0) {
        res.status(401).json({
          message: messages.noEmailMatch
        })
      } else {
        bcrypt.compare(req.body.password, docs[0].password).then(function(bool) {
          if (!bool) {
            res.status(401).json({
              message: messages.incorrectPassword
            })
          } else {
            delete docs[0].password;
            req.session.sessionId = uuid();
            req.session.emailId = docs[0].emailId;
            req.session.isAdmin = docs[0].isAdmin;
            req.session.name = docs[0].name;
            res.cookie('sessionId', req.session.sessionId, { maxAge: (5 * 24 * 60 * 60 * 1000), httpOnly: false });
            res.status(201).json(docs[0]);

            //If pristine, update
            if (docs[0].pristine) {
              req.app.db.collection("users").updateOne({ emailId: docs[0].emailId }, { $unset: { pristine: "" } }).then(function(res) {}).catch(function(err) {})
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
});

//Logout- Delete session
router.delete("/session/destroy", function(req, res) {
  if (req.session) req.session.destroy();
  res.clearCookie("sessionId");
  res.status(204).json();
});

//Change password
router.post("/password/update", authMiddleware.auth, function(req, res) {
  if (!req.body.password || !req.body.newPassword) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else {
    req.app.db.collection("users").find({ emailId: req.session.emailId }).limit(1).project({ password: 1 }).toArray().then(function(docs) {
      bcrypt.compare(req.body.password, docs[0].password).then(function(bool) {
        if (!bool) {
          res.status(400).json({
            message: messages.incorrectPassword
          })
        } else {
          var salt = bcrypt.genSaltSync(saltRounds);
          req.app.db.collection("users").updateOne({ emailId: req.session.emailId }, { $set: { password: bcrypt.hashSync(req.body.newPassword, salt) } }).then(function(reslt) {
            res.status(204).json();
          }).catch(function(err) {
            res.status(500).json({
              message: messages.ise
            })
          })
        }
      })
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      })
    })
  }
})

//Forgot passward
//Verify emailId & send a generated password to email
router.post("/password/forgot", function(req, res) {
  if (!req.body.emailId || !/\@/.test(req.body.emailId)) {
    res.status(400).json({
      message: messages.invalidParameters
    })
  } else {
    req.app.db.collection("users").findOne({ emailId: req.body.emailId }, { fields: { _id: 1 } }).then(function(user) {
      if (user) {
        let salt = bcrypt.genSaltSync(saltRounds);
        let newPwd = randomstring.generate(7);
        let mailOptions = {
          to: req.body.emailId,
          subject: 'Report- Password Change Requested',
          html: `<b>Hi,</b>
                 <br/><br/>
                 We received a password change request for your account.
                 <br/>
                 Following is your new auto generated password
                 <br/><br/>
                 <b>${newPwd}</b>
                 <br/><br/>
                 We suggest you to change your password after you login.
                 <br/><br/>
                 Best regards!
                 <br/>
                 Report Team` // html body
        };

        req.app.mailer.sendMail(mailOptions, function(err, response) {
          if (err) {
            res.status(500).json({
              message: messages.ise
            })
          } else {
            //Update password to new password & set pristine
            req.app.db.collection("users").updateOne({ emailId: req.body.emailId }, {
              $set: {
                pristine: true,
                password: bcrypt.hashSync(newPwd, salt)
              }
            }).then(function(rslt) {
              res.status(204).json();
            }).catch(function(err) {
              res.status(500).json({
                message: messages.ise
              })
            })
          }
        })
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

module.exports = router;
