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
var YouTube = require('youtube-node');
const cheerio = require('cheerio');
var bodyParser = require('body-parser')
var refinedResults = [];

const hostname = process.env.IP;
const port = process.env.PORT;
var youTube = new YouTube();
youTube.setKey('AIzaSyB5YzeLLXCsc9xbUzy-klix6ENDHlSQNe4');

var userSession;
var savior;
var filename = "uploads/uploadedPDF.pdf";
var jsonpdf;
var stringpdf;
var gEvents = [null];
var dates = [];
var pdfCounter = 0;
var refineddata;
var classroom;
var byday = [""];
var classroom = "";
var courseNumber = "";
var youtubeResults;
var bookNameInd;
var bookName;
var days = ["mo", "t", "w", "th", "f"]
var keywords = ["office", "meeting", "exam", "quiz", "test", "midterm", "final", "class"];
var gday;


server.use(express.static('client'))
server.use(bodyParser.urlencoded({
  extended: false
}))

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

function parsepdf(callback) {
  scraper.scrapePDF(filename).then(
    function(sizeMap) {
      jsonpdf = (sizeMap);
      stringpdf = JSON.stringify(jsonpdf)
      var t = stringpdf.search(/\b\w{3}\b\s\d{4}/g);
      courseNumber = stringpdf.substring(t, t + 8);
      var t = stringpdf.search(/\b\w{3}\b\s\d{3}/g);
      classroom = stringpdf.substring(t, t + 8);
      var results = chrono.parse(stringpdf);
      bookNameInd = stringpdf.search("Textbook");
      bookName = stringpdf.substring(bookNameInd + 12, bookNameInd + 40);
      //callback(n) prints class
      callback(results);
    }
  ).catch(
    function(reason) {
      console.log('Handle rejected promise (' + reason + ') here.');
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

server.post('/signin', function(req, res) {
  userSession = req.session;
  userSession.email = req.body.email;
  res.redirect('/')
})

server.get('/logout', function(req, res) {
  req.session.destroy();
  res.sendfile('client/login.html')
})

server.get('/getresults', function(req, res) {
  res.send({
    video1: 'Hello',
    video2: 'World'
  })
})

server.post('/file-upload', function(req, res) {
  // create an incoming form object
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    res.writeHead(200, {
      'content-type': 'text/plain'
    });
    res.end(util.inspect({
      fields: fields,
      files: files
    }));
  });

  form.encoding = 'utf-8';
  form.keepExtensions = true;
  form.uploadDir = 'uploads';

  form.on('file', function(field, file) {
    fs.rename(file.path, 'uploads/uploadedPDF.pdf');
    pdfCounter++
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    // res.redirect('/parse-file');
    res.end('success');
  });
})

function hasNumbers(t) {
  var regex = /\d/g;
  return regex.test(t);
}


server.get('/parse-file', function(req, res) {

  parsepdf(function(data) {
    var today = new Date();
    var dd = today.getDate();
    for (var x = 0; x < data.length; x++) {
      if (data[x].start.impliedValues.day < dd || !hasNumbers(data[x].text)) {
        refineddata = data.splice(x, 1);
        x--
      }
    }
    for (var t = 0; t < data.length; t++) {
      var firstIndex = data[t].index;
      firstIndex = firstIndex - 25;
      var lastIndex = data[t].text.length + data[t].index;
      refinedResults[t] = stringpdf.substring(firstIndex, lastIndex);
    }
    // scrapeSlugBooks();
    // searchyoutube(courseNumber);
    // dayFinder(refinedResults)
    savior = refinedResults;
    //   tester(refinedResults);
    res.send("hey");
    dayFinder(savior);
  });
});



function dayFinder(savior) {

  var days = ["mo", "th", "tu", "w", "f"];
  var daysFinal = ["MO", "TH", "TU", "WE", "FR"];
  var keywords = ["lecture", "meeting", "class", "exam", "quiz", "test", "midterm", "final"];
  for (var x = 0; x < savior.length; x++) {
    console.log(savior);
    var toBeChecked = savior[x].toLowerCase();
    console.log(toBeChecked)
    for (var y = 0; y < keywords.length; y++) {
      if (toBeChecked.includes(keywords[y])) {
        gEvents[x] = keywords[y];
      }
    }
    for (var z = 0; z < days.length; z++) {
      if (toBeChecked.includes(days[z])) {
        dates[x] += daysFinal[z]+",";
      }
    }
  }
  console.log(gEvents)
};

function getGcalstartDate(){
  substingedDate = dates[getfirstclassdate()].substring(0,2)
  nextDay(substingedDate);

function getfirstclassdate () {
   for(var x=0;x<dates.length;x++){
      if(dates[x] != null){
        return x;
      }
    }
}


function nextDay(dayinquestion) {
  for (var x = 0; x < 8; x++) {
    var d = new Date();
    var weekday = new Array(7);
    weekday[0] = "Su";
    weekday[1] = "Mo";
    weekday[2] = "Tu";
    weekday[3] = "We";
    weekday[4] = "Th";
    weekday[5] = "Fr";
    weekday[6] = "Sa";
    d.setDate(d.getDate() + (x + (7 - d.getDay())) % 7);
    if (weekday[d.getDay()] == dayinquestion) {
      var today = new Date();
      var future = x+today.getDate()
      gday = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+future;
      console.log(future)
      x = 8;
    }
  }
}




function searchyoutube(coursenumber) {
  console.log("Searching for youtube vids")
  youTube.search(coursenumber, 3, function(error, result) {
    if (error) {
      console.log(error);
    }
    else {
      youtubeResults = JSON.stringify(result, null, 2);
      console.log(youtubeResults)
    }
  });
}
//Initating  Tokens for Calendar
function rungooglecal() {
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

  var event = {
    'summary': 'Class Calendar for' + courseNumber,
    'location': classroom,
    'description': 'Created by Syllab.io',
    'start': {
      'dateTime': gday+'T09:00:00-07:00',
      'timeZone': 'America/NewYork'
    },
    'end': {
      'dateTime': gday+'T11:00:00-07:00',
      'timeZone': 'America/NewYork',
    },
    'recurrence': [
      'RRULE:FREQ=WEEKLY;COUNT=28;WKST=SU;BYDAY=' + dates[1],
    ],
    'attendees': [],
    'reminders': {
      'useDefault': true,
      'overrides': [],
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


function scrapeSlugBooks() {
  console.log("about to start scraping for books" + bookName)

  request.get('http://www.slugbooks.com/search' + "/lee" + ".html", function(error, response, html) {
    if (!error && response.statusCode == 200) {
      console.log(html)
      var $ = cheerio.load(html);
      $('span.comhead').each(function(i, element) {
        var a = $(this).prev();
        console.log(a.text());
      });
    }
    else if (error) {
      console.log(error)
    }
    else console.log(response.statusCode)
  });
}

server.listen(port, function() {
  console.log('Server is running on IP: ' + hostname + 'port: ' + port);
})
