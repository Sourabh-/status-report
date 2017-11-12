const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var cookieParser = require('cookie-parser');
const config = JSON.parse(fs.readFileSync("./config.json"));
const nodemailer = require("nodemailer");

// Get our API routes
const account = require('./server/routes/account');
const users = require('./server/routes/masters/users');
const applications = require('./server/routes/masters/applications');
const weeks = require('./server/routes/masters/weeks');
const designations = require('./server/routes/masters/designations');
const effort = require('./server/routes/effort');
const graphs = require('./server/routes/graphs');

const app = express();

// Parsers for POST data
app.use(bodyParser.json());
//Parse cookie
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));

//Store sessions
app.use(session({
  store: new MongoStore({
    url: config.mongo.url
  }),
  secret: 'auth-report',
  resave: false,
  saveUninitialized: true,
  cookie: { path: '/', httpOnly: true, secure: false, maxAge: (5 * 24 * 60 * 60 * 1000) },
  rolling: true,
  ttl: (5 * 24 * 60 * 60 * 1000)
}));

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));

//ONLY IF CROSS ORIGIN REQUEST IS ALLOWED
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Set our api routes
app.use('/account', account);
app.use('/users', users);
app.use('/applications', applications);
app.use('/weeks', weeks);
app.use('/effort', effort);
app.use('/designations', designations);
app.use('/graphs', graphs);

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

//Connect to mongoDB
MongoClient.connect(config.mongo.url, function(err, db) {
  app.db = db;
})

var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: "",
        pass: ""
    }
});

app.mailer = smtpTransport;
/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '4000';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`App running on 127.0.0.1:${port}`));
