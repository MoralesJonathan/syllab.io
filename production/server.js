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
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const formidable = require('formidable');
const util = require('util');
const chrono = require('chrono-node')
 var refinedResults =[];

const hostname = process.env.IP;
const port = process.env.PORT;


var userSession;
var filename = "uploads/uploadedPDF.pdf";
var jsonpdf;
var stringpdf;
var pdfCounter = 0;
var refineddata;
var classroom;
var recurrenceDays = ['MO','TU','WE','TH','FR'];
var byday = "";
var classroom = "";
var courseNumber = "";


server.use(express.static('client'))

server.use(session({
  secret: 'Orange and red keyboard fish',
  resave: false,
  store: new MongoStore({ url: 'mongodb://localhost:27017/sessions' }),
  saveUninitialized: true
}))

var logger = function(req, res, next) {
  console.log('Page requested: '+req.path);
  next();
}

server.use(logger)

function parsepdf (callback) {
   scraper.scrapePDF(filename).then(
            function(sizeMap){
                jsonpdf = (sizeMap);
                stringpdf = JSON.stringify(jsonpdf)
                var t = stringpdf.search(/\b\w{3}\b\s\d{4}/g);
	              courseNumber = stringpdf.substring(t, t+8);
	              var t = stringpdf.search(/\b\w{3}\b\s\d{3}/g);
	              classroom = stringpdf.substring(t, t+8);
	              var results = chrono.parse(stringpdf);
	              //callback(n) prints class
	              callback(results);
            }
        ).catch(
                function(reason) {
                    console.log('Handle rejected promise ('+reason+') here.');
                }
        ); 
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

server.post('/file-upload', function(req, res){
  // create an incoming form object
  var form = new formidable.IncomingForm();

form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end(util.inspect({fields: fields, files: files}));
    });
    
    form.encoding = 'utf-8';
    form.keepExtensions = true;
    form.uploadDir = 'uploads';
    
    form.on('file', function(field, file) {
    fs.rename(file.path, 'uploads/uploadedPDF'+pdfCounter+'.pdf');
    pdfCounter ++
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

function hasNumbers(t)
{
var regex = /\d/g;
return regex.test(t);
}


server.get('/parse-file', function(req, res) {
 
    parsepdf(function(data){
      var today = new Date();
      var dd = today.getDate();
      for(var x=0;x<data.length;x++){
        if(data[x].start.impliedValues.day < dd|| !hasNumbers(data[x].text)) {
          refineddata = data.splice(x,1);
          x--
        }
      }
      for(var t=0;t<data.length;t++){
        var firstIndex = data[t].index;
        firstIndex = firstIndex-25;
        var lastIndex = data[t].text.length +data[t].index;
        refinedResults[t] = stringpdf.substring(firstIndex,lastIndex);
      }
      res.send(refinedResults);
    });
});

var finalarrayz; 

function dayFinder(refinedResults)
{
  var keywords=["office","meeting","exam","quiz","test","midterm","final","class"];
  for(var x=0; x<refinedResults.size(); x++){
    var toBeChecked= refinedResults(x).toUpperCase();
    for(var y=0;y<days.size(); y++){
      if(toBeChecked.includes(reccurenceDay[]){
        byday = recurrenceDays[3];
      }
    }
      
    }
  }
  

//Initating  Tokens for Calendar
function rungooglecal () {
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
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
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

var event = {
  'summary': 'Class Calendar for'+courseNumber,
  'location': classroom,
  'description': 'Created by Syllab.io',
  'start': {
    'dateTime': yyyy+'-'+mm+'-28T09:00:00-07:00',
    'timeZone': 'America/NewYork'
  },
  'end': {
    'dateTime': yyyy+'-'+mm+'-28T17:00:00-07:00',
    'timeZone': 'America/NewYork',
  },
  'recurrence': [
    'RRULE:FREQ=WEEKLY;COUNT=28;WKST=SU;BYDAY='+byday,
  ],
  'attendees': [
  ],
  'reminders': {
    'useDefault': true,
    'overrides': [
    ],
  },
};

function listEvents(auth) {
  var calendar = google.calendar('v3');
  var today = new Date();
  var mm = today.getMonth();
  var yyyy = today.getFullYear;
  calendar.events.insert({
    auth: auth,
    calendarId: 'fmlmosf50bc2posl2aiv09u6j0@group.calendar.google.com',
    resource: event,
  }, function(err, response) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink)
  });
}
}

server.listen(port, function() {
  console.log('Server is running on IP: '+hostname+'port: '+port);
})

