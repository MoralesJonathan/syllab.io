const http = require('http');
const express = require('express');
const server = express();
const parseurl = require('parseurl');
const session = require('express-session');
const mongoClient = require('mongodb').MongoClient;
const MongoStore = require('connect-mongo')(express);
const scraper = require('web-pdf-scraper');
const request = require('request');
const fs = require('fs');
const apiai = require('apiai');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const formidable = require('formidable');
const util = require('util');
const chrono = require('chrono-node');
const pathExists = require('path-exists');


const hostname = process.env.IP;
const port = process.env.PORT;


var userSession;
var url;
var jsonpdf;
var t;
var n;
var pdfCounter = 0;
var app = apiai("8b3e3e69658e43b5af2b22c026c22bbd");
var filenames = [];
var results = [];


server.use(express.static('client'))

server.use(session({
  secret: 'Orange and red keyboard fish',
  resave: false,
  store: new MongoStore({
    url: 'mongodb://localhost:27017/sessions'
  }),
  saveUninitialized: true
}))

var logger = function(req, res, next) {
  console.log('Page requested: ' + req.path);
  next();
}

server.use(logger)

function parsepdf() {
  var nextFileExsists;
  var x = 0;
  do {
    console.log("about to add filenamepath to array")
    filenames[x] = "uploads/uploadedPDF" + x + ".pdf"
    x++;
    nextFileExsists = pathExists.sync('uploads/uploadedPDF' + x + '.pdf');
  } while (nextFileExsists)

  var pdfPromises = filenames.map(function(name, index) {
    return scraper.scrapePDF(name);
  });

  return Promise.all(pdfPromises);

}

server.get('/', function(req, res) {
  userSession = req.session;
  if (!userSession.email) {
    res.redirect('/login');
  }
  else {
    res.sendfile('client/dashboard.html')
  }
})

server.get('/login', function(req, res) {
  res.sendfile('client/login.html')
})

server.post('/file-upload', function(req, res) {
  // create an incoming form object
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    res.writeHead(200, {
      'content-type': 'text/plain'
    });
    res.write('received upload:\n\n');
    res.end(util.inspect({
      fields: fields,
      files: files
    }));
  });

  form.encoding = 'utf-8';
  form.keepExtensions = true;
  form.uploadDir = 'uploads';

  form.on('file', function(field, file) {
    fs.rename(file.path, 'uploads/uploadedPDF' + pdfCounter + '.pdf');
    pdfCounter++
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');
  });
})

server.get('/parse-file', function(req, res) {
  parsepdf().then(
    function(results) {
      console.log("about to save map to json")
      var chronoDates = results.map(function(jsonpdfs) {
        var stringpdf = JSON.stringify(jsonpdfs)
        return chrono.parse(stringpdf);
      });
      console.log(chronoDates);
     res.send(chronoDates);
    }
  ).catch(
    function(reason) {
      console.log('Handle rejected promise (' + reason + ') here.');
    }
  );

}) 

server.get('/testAI', function(req, res) {


  var requester = app.textRequest(stringpdf, {
    sessionId: 'b99a3e41-bd57-4722-b308-cb4dc60fddde'
  });


  requester.on('response', function(response) {
    console.log(response);
  });

  requester.on('error', function(error) {
    console.log(error);
  });


  requester.end();
})

//Initating  Tokens for Calendar
function rungooglecal() {
  var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
  var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
  var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

  // Load client secrets from a local file.
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    authorize(JSON.parse(content), listEvents);
  });

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
      if (err) {
        getNewToken(oauth2Client, callback);
      }
      else {
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
      }
    });
  }

  function listEvents(auth) {
    var calendar = google.calendar('v3');
    calendar.events.list({
      auth: auth,
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      var events = response.items;
      if (events.length == 0) {
        console.log('No upcoming events found.');
      }
      else {
        console.log('Upcoming 10 events:');
        for (var i = 0; i < events.length; i++) {
          var event = events[i];
          var start = event.start.dateTime || event.start.date;
          console.log('%s - %s', start, event.summary);
        }
      }
    });
  }
}

server.listen(port, function() {
  console.log('Server is running on IP: ' + hostname + 'port: ' + port);
})
