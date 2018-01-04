const express = require('express');
const router = express.Router();
const fs = require('fs');
const authMiddleware = require('../utility/auth');
const messages = JSON.parse(fs.readFileSync('./server/utility/messages.json'));
const mongoWrapper = require('../utility/mongoWrapper');
var Q = require('q');
var ObjectID = require('mongodb').ObjectID;

const MONTHS = {
  1: 'January',
  2: 'Febuary',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December'
};

function getAppEffort(req, res, isAll, appIds) {
  let noOfDays = req.query.noOfDays || 30;
  let createdOnAfter = new Date().getTime() - (noOfDays * 24 * 60 * 60 * 1000);
  let noOfApps = req.query.noOfApps || 99;
  let appQuery = {};

  if (isAll) appQuery.ownerEmailId = req.session.emailId;
  else appQuery._id = { $in: appIds };
  req.app.db.collection("applications").find(appQuery).limit(Number(noOfApps)).toArray().then(function(apps) {
    if (apps.length) {
      let appsObj = {};
      let _appIds = apps.map((v) => {
        appsObj[v._id] = v.applicationName;
        return v._id;
      });
      let effQuery = { appId: { $in: _appIds } };
      if (!isAll) effQuery.emailId = req.session.emailId;

      req.app.db.collection("weeks").find({
        fromDate: { $gt: createdOnAfter }
      }).toArray().then(function(weeks) {
        if (weeks.length) {
          let weekIds = weeks.map((v) => v._id);
          effQuery.weekId = { $in: weekIds };
          req.app.db.collection("effort").find(effQuery).toArray().then(function(eff) {
            if (eff.length) {
              let totNoOfHrs = {};

              for (let i = 0; i < eff.length; i++) {
                if (!totNoOfHrs[eff[i].weekId + ""]) {
                  totNoOfHrs[eff[i].weekId + ""] = {};
                }

                if (!totNoOfHrs[eff[i].weekId + ""][appsObj[eff[i].appId]]) totNoOfHrs[eff[i].weekId + ""][appsObj[eff[i].appId]] = 0;
                totNoOfHrs[eff[i].weekId + ""][appsObj[eff[i].appId]] += eff[i].noOfHours;
              }


              let result = [];
              for (let key in totNoOfHrs) {
                for (let i = 0; i < weeks.length; i++) {
                  if ((weeks[i]._id + "") == key) {
                    let tmp = totNoOfHrs[key];
                    tmp.fromDate = weeks[i].fromDate;
                    tmp.toDate = weeks[i].toDate;
                    result.push(tmp);
                    break;
                  }
                }
              }

              res.status(200).json(result);


            } else {
              res.status(204).json();
            }
          }).catch(function(err) {
            res.status(500).json({
              message: messages.ise
            });
          })
        } else {
          res.status(204).json();
        }
      }).catch(function(err) {
        res.status(500).json({
          message: messages.ise
        });
      })
    } else {
      res.status(204).json();
    }
  }).catch(function(err) {
    res.status(500).json({
      message: messages.ise
    });
  })
}

//Fetch recent (given) apps and number of hours worked on them in last number of days (given)
router.get("/apps/hours", authMiddleware.auth, function(req, res) {
  let isAdmin = req.session.isAdmin;
  if (isAdmin && (!req.query.self || req.query.self == 'false')) {
    //Fetch recent noOfDays applications limit to noOfApps where you are the owner
    //Fetch recent effort for the above apps
    //Fetch weeks for those week Ids
    getAppEffort(req, res, true);
  } else {
    //Fetch applications assigned to me
    //Fetch recent noOfDays applications limit to noOfApps
    //Fetch recent effort for the above apps
    //Fetch weeks for those week Ids
    req.app.db.collection("assignedUsers").find({
      emailId: req.session.emailId
    }).toArray().then(function(asUs) {
      if (asUs.length) {
        let appIds = asUs.map((v) => v.appId);
        getAppEffort(req, res, false, appIds);
      } else {
        res.status(204).json();
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      });
    })
  }
})

function getUserEffort(req, res, isAll, appIds) {
  let noOfDays = req.query.noOfDays || 30;
  let createdOnAfter = new Date().getTime() - (noOfDays * 24 * 60 * 60 * 1000);
  let noOfApps = req.query.noOfApps || 99;
  let appQuery = {};

  if (isAll) appQuery.ownerEmailId = req.session.emailId;
  else appQuery._id = { $in: appIds };
  req.app.db.collection("applications").find(appQuery).limit(Number(noOfApps)).toArray().then(function(apps) {
    if (apps.length) {
      let _appIds = apps.map((v) => v._id);
      let effQuery = {
        appId: { $in: _appIds }
      };

      req.app.db.collection("weeks").find({
        fromDate: { $gt: createdOnAfter }
      }).toArray().then(function(weeks) {
        if (weeks.length) {
          let weekIds = weeks.map((v) => v._id);
          if (!isAll) effQuery.emailId = req.session.emailId;
          effQuery.weekId = { $in: weekIds };
          req.app.db.collection("effort").find(effQuery).toArray().then(function(eff) {
            if (eff.length) {
              let totNoOfHrs = {};
              let emailIds = [];
              for (let i = 0; i < eff.length; i++) {
                if (!totNoOfHrs[eff[i].weekId + ""]) {
                  totNoOfHrs[eff[i].weekId + ""] = {};
                }

                if (!totNoOfHrs[eff[i].weekId + ""][eff[i].emailId]) totNoOfHrs[eff[i].weekId + ""][eff[i].emailId] = 0;
                totNoOfHrs[eff[i].weekId + ""][eff[i].emailId] += eff[i].noOfHours;
                emailIds.push(eff[i].emailId);
              }

              Q.all([
                mongoWrapper.findAll(req.app.db, "users", { emailId: { $in: emailIds } })
              ]).then(function(resl) {
                let result = [];
                for (let key in totNoOfHrs) {
                  for (let i = 0; i < weeks.length; i++) {
                    if ((weeks[i]._id + '') == key) {
                      let tmp = {};
                      tmp.fromDate = weeks[i].fromDate;
                      tmp.toDate = weeks[i].toDate;
                      let users = {};
                      for (let key2 in totNoOfHrs[key]) {
                        for (let j = 0; j < resl[0].length; j++) {
                          if (key2 == resl[0][j].emailId) {
                            tmp[resl[0][j].name] = totNoOfHrs[key][key2];
                            break;
                          }
                        }
                      }
                      result.push(tmp);
                      break;
                    }
                  }
                }

                res.status(200).json(result);

              }).catch(function(err) {
                res.status(500).json({
                  message: messages.ise
                });
              })
            } else {
              res.status(204).json();
            }
          }).catch(function(err) {
            res.status(500).json({
              message: messages.ise
            });
          })
        }
      }).catch(function(err) {
        res.status(500).json({
          message: messages.ise
        });
      })
    } else {
      res.status(204).json();
    }
  }).catch(function(err) {
    res.status(500).json({
      message: messages.ise
    });
  })
}

router.get("/users/hours", authMiddleware.auth, function(req, res) {
  let isAdmin = req.session.isAdmin;
  if (isAdmin && (!req.query.self || req.query.self == 'false')) {
    //Fetch recent noOfDays applications limit to noOfApps where you are the owner
    //Fetch recent effort for the above apps/users
    //Fetch weeks for those week Ids
    //Fetch users for those effort/emailIds
    getUserEffort(req, res, true);
  } else {
    //Fetch applications assigned to me
    //Fetch recent noOfDays applications limit to noOfApps
    //Fetch recent effort for the above apps
    //Fetch weeks for those week Ids
    //Fetch users for those effort/emailIds
    req.app.db.collection("assignedUsers").find({
      emailId: req.session.emailId
    }).toArray().then(function(asUs) {
      if (asUs.length) {
        let appIds = asUs.map((v) => v.appId);
        getUserEffort(req, res, false, appIds);
      } else {
        res.status(204).json();
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      });
    })
  }
})

router.get("/apps/hours/:appName", authMiddleware.auth, function(req, res) {
  let isAll = req.session.isAdmin && (!req.query.self || req.query.self == 'false');
  let noOfDays = req.query.noOfDays || 30;
  let createdOnAfter = new Date().getTime() - (noOfDays * 24 * 60 * 60 * 1000);
  //For the given application and time period, find how much hours was spend by per user
  //Get the application
  //Get the weeks where from date is greater than time period
  //For each of the user, find the total effort(weekIds/appId/emailId) and return

  //For self, get the application
  //Get the weeks where from date is greater than time period
  //For my emailId, given weekIds and appId, get the total no of hours worked
  req.app.db.collection("applications").findOne({ applicationName: req.params.appName }, { fields: { applicationName: 1, _id: 1 } }).then(function(app) {
    if (app) {
      req.app.db.collection("weeks").find({ fromDate: { $gt: createdOnAfter } }).toArray().then(function(weeks) {
        if (weeks.length) {
          let weekIds = weeks.map((v) => v._id);
          let effQuery = {
            weekId: { $in: weekIds },
            appId: app._id
          };

          if (!isAll) effQuery.emailId = req.session.emailId;
          req.app.db.collection("effort").find(effQuery).toArray().then(function(effs) {
            if (effs.length) {
              let result = {
                applicationName: req.params.appName,
                effort: {}
              };
              let emailIds = effs.map((v) => v.emailId);
              req.app.db.collection("users").find({ emailId: { $in: emailIds } }).toArray().then(function(usrs) {
                let userObj = {};
                usrs.map((v) => {
                  userObj[v.emailId] = v.name;
                });

                for (let i = 0; i < effs.length; i++) {
                  if (!result.effort[userObj[effs[i].emailId]]) result.effort[userObj[effs[i].emailId]] = 0;
                  result.effort[userObj[effs[i].emailId]] += effs[i].noOfHours;
                }

                res.status(200).json(result);
              }).catch(function(err) {
                res.status(500).json({
                  message: messages.ise
                });
              })
            } else {
              res.status(204).json();
            }
          }).catch(function(err) {
            res.status(500).json({
              message: messages.ise
            });
          })
        } else {
          res.status(204).json();
        }
      }).catch(function(err) {
        res.status(500).json({
          message: messages.ise
        });
      })
    } else {
      res.status(404).json({
        message: messages.invalidApp
      })
    }
  }).catch(function(err) {
    res.status(500).json({
      message: messages.ise
    });
  })
})

function checkIfUserExists(req, res, isAll, cb) {
  if(!isAll) {
    cb(true, req.session.name);
  } else {
    req.app.db.collection("users").findOne({ emailId: req.params.emailId }, { fields: { name: 1 } }).then(function(usr) {
      if(usr) {
        cb(true, usr.name);
      } else {
        cb(false);
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      })
    })
  }
}

router.get("/users/hours/:emailId", authMiddleware.auth, function(req, res) {
  let isAll = req.session.isAdmin && (!req.query.self || req.query.self == 'false');
  let noOfDays = req.query.noOfDays || 30;
  let createdOnAfter = new Date().getTime() - (noOfDays * 24 * 60 * 60 * 1000);

  //For this user, in the given time period, get the effort/hours he/she spent in the assigned applications
  //Check if user exists
  //Get weeks where from date is greater than given time period
  //For those weeks and emailId, get total hours spent in the applications

  //For self user, 
  //Get weeks where from date is greater than given time period
  //For those weeks and self emailId, get total hours spent in the applications

  checkIfUserExists(req, res, isAll, function(bool, name) {
    if (!bool) {
      res.status(404).json({
        message: messages.noEmailMatch
      })
    } else {
      req.app.db.collection("weeks").find({ fromDate: { $gt: createdOnAfter } }).toArray().then(function(weeks) {
        if (weeks.length) {
          let weekIds = weeks.map((v) => v._id);
          let effQuery = {
            weekId: { $in: weekIds },
            emailId: isAll ? req.params.emailId : req.session.emailId
          };

          req.app.db.collection('effort').find(effQuery).toArray().then(function(effs) {
            if (effs.length) {
              let result = {
                name,
                emailId: effQuery.emailId,
                effort: {}
              };
              let appIds = effs.map((v) => v.appId);

              req.app.db.collection("applications").find({ _id: { $in: appIds } }).toArray().then(function(apps) {
                let appsObj = {};
                apps.map((v) => {
                  appsObj[v._id + ""] = v.applicationName;
                });

                for(let i=0; i<effs.length; i++) {
                  if(!result.effort[appsObj[effs[i].appId + ""]]) result.effort[appsObj[effs[i].appId + ""]] = 0;
                  result.effort[appsObj[effs[i].appId + ""]] += effs[i].noOfHours;
                }

                res.status(200).json(result);
              }).catch(function(err) {
                res.status(500).json({
                  message: messages.ise
                })
              })
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
        });
      })
    }
  })
})

function getAllMonths(query, currentMonth, currentYear, noOfMonths) {
  if (noOfMonths) {
    if ((currentMonth - noOfMonths) < 0) {
      query.push({ $and: [{ month: (13 + (currentMonth - noOfMonths)) }, { year: (currentYear - 1) }] });
    } else
      query.push({ $and: [{ month: (currentMonth - noOfMonths) + 1 }, { year: currentYear }] })
    noOfMonths--;
    getAllMonths(query, currentMonth, currentYear, noOfMonths);
  }
}

function getAppJiraTickets(req, res, isAll, appIds) {
  let noOfMonths = req.query.noOfMonths || 1;
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();
  let query = [];
  getAllMonths(query, currentMonth, currentYear, noOfMonths);

  let appQuery = {};
  if (isAll) appQuery.ownerEmailId = req.session.emailId;
  else appQuery._id = { $in: appIds };
  req.app.db.collection("applications").find(appQuery).toArray().then(function(apps) {
    if (apps.length) {
      let appsObj = {};
      let _appIds = apps.map((v) => {
        appsObj[v._id] = v.applicationName;
        return v._id;
      });

      let effQuery = {
        $or: query,
        appId: { $in: _appIds }
      };

      if (!isAll) effQuery.emailId = req.session.emailId;

      req.app.db.collection("jiraTickets").find(effQuery).toArray().then(function(tickets) {
        if (tickets.length) {
          let totalTickets = {};
          for (let i = 0; i < tickets.length; i++) {
            if (!totalTickets[tickets[i].year]) totalTickets[tickets[i].year] = {};
            if (!totalTickets[tickets[i].year][MONTHS[tickets[i].month]]) totalTickets[tickets[i].year][MONTHS[tickets[i].month]] = {};
            if (!totalTickets[tickets[i].year][MONTHS[tickets[i].month]][appsObj[tickets[i].appId]]) {
              totalTickets[tickets[i].year][MONTHS[tickets[i].month]][appsObj[tickets[i].appId]] = {
                totalTickets: 0,
                totalClosedTickets: 0
              };
            }

            totalTickets[tickets[i].year][MONTHS[tickets[i].month]][appsObj[tickets[i].appId]].totalTickets += tickets[i].totalJiraTickets;
            totalTickets[tickets[i].year][MONTHS[tickets[i].month]][appsObj[tickets[i].appId]].totalClosedTickets += tickets[i].closedJiraTickets;
          }

          res.status(200).json(totalTickets);
        } else {
          res.status(204).json();
        }
      }).catch(function(err) {
        res.status(500).json({
          message: messages.ise
        });
      })
    } else {
      res.status(204).json();
    }
  }).catch(function(err) {
    res.status(500).json({
      message: messages.ise
    });
  })
}

router.get("/apps/tickets", authMiddleware.auth, function(req, res) {
  let isAll = req.session.isAdmin && (!req.query.self || req.query.self == 'false');
  //FOR ADMIN
  //Get owned apps
  //For those apps go to jiraTickets collection and get all the tickets from that month
  //Align in JSON and return
  if (isAll)
    getAppJiraTickets(req, res, isAll);
  else {
    //FOR ME
    //Get assigned apps
    req.app.db.collection("assignedUsers").find({ emailId: req.session.emailId }).toArray().then(function(ausrs) {
      if (ausrs.length) {
        let appIds = ausrs.map((v) => v.appId);
        getAppJiraTickets(req, res, false, appIds);
      } else {
        res.status(204).json();
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      });
    })
  }
})

function getUserJiraEffort(req, res, isAll, appIds) {
  let noOfMonths = req.query.noOfMonths || 1;
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();
  let query = [];

  getAllMonths(query, currentMonth, currentYear, noOfMonths);
  let appQuery = {};
  if (isAll) appQuery.ownerEmailId = req.session.emailId;
  else appQuery._id = { $in: appIds };
  req.app.db.collection("applications").find(appQuery).toArray().then(function(apps) {
    if (apps.length) {
      let _appIds = apps.map((v) => {
        return v._id;
      });

      let effQuery = {
        $or: query,
        appId: { $in: _appIds }
      };

      if (!isAll) effQuery.emailId = req.session.emailId;
      req.app.db.collection("jiraTickets").find(effQuery).toArray().then(function(tickets) {
        if (tickets.length) {
          let totalTickets = {};
          let emailIds = [];
          for (let i = 0; i < tickets.length; i++) {
            emailIds.push(tickets[i].emailId);
          }

          req.app.db.collection("users").find({ emailId: { $in: emailIds } }).project({ emailId: 1, name: 1 }).toArray().then(function(usrs) {
            let usrObj = {};
            for (let i = 0; i < usrs.length; i++) {
              usrObj[usrs[i].emailId] = usrs[i].name;
            }

            for (let i = 0; i < tickets.length; i++) {
              if (!totalTickets[tickets[i].year]) totalTickets[tickets[i].year] = {};
              if (!totalTickets[tickets[i].year][MONTHS[tickets[i].month]]) totalTickets[tickets[i].year][MONTHS[tickets[i].month]] = {};
              if (!totalTickets[tickets[i].year][MONTHS[tickets[i].month]][usrObj[tickets[i].emailId]]) {
                totalTickets[tickets[i].year][MONTHS[tickets[i].month]][usrObj[tickets[i].emailId]] = {
                  totalTickets: 0,
                  totalClosedTickets: 0
                };
              }

              totalTickets[tickets[i].year][MONTHS[tickets[i].month]][usrObj[tickets[i].emailId]].totalTickets += tickets[i].totalJiraTickets;
              totalTickets[tickets[i].year][MONTHS[tickets[i].month]][usrObj[tickets[i].emailId]].totalClosedTickets += tickets[i].closedJiraTickets;
            }

            res.status(200).json(totalTickets);
          }).catch(function(err) {
            res.status(500).json({
              message: messages.ise
            });
          })
        } else {
          res.status(204).json();
        }
      }).catch(function(err) {
        res.status(500).json({
          message: messages.ise
        });
      })
    } else {
      res.status(204).json();
    }
  }).catch(function(err) {
    res.status(500).json({
      message: messages.ise
    });
  })
}

router.get("/users/tickets", authMiddleware.auth, function(req, res) {
  let isAll = req.session.isAdmin && (!req.query.self || req.query.self == 'false');
  if (isAll) {
    getUserJiraEffort(req, res, isAll);
  } else {
    req.app.db.collection("assignedUsers").find({ emailId: req.session.emailId }).toArray().then(function(ausrs) {
      if (ausrs.length) {
        let appIds = ausrs.map((v) => v.appId);
        getUserJiraEffort(req, res, false, appIds);
      } else {
        res.status(204).json();
      }
    }).catch(function(err) {
      res.status(500).json({
        message: messages.ise
      });
    })
  }
})

module.exports = router;
