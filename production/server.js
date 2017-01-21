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

const hostname = process.env.IP;
const port = process.env.PORT;


var userSession;
var filename = "client/uploadedPDF.pdf";
var url = "http://docdro.id/ySpgaPA";
var jsonpdf;
var stringpdf;
var t;
var n;
var app = apiai("8b3e3e69658e43b5af2b22c026c22bbd");

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

function downloadpdf() {
  request(url).pipe(fs.createWriteStream(filename)).on('close', function() {
  console.log(url, 'saved to', filename)
});
}

function parsepdf (callback) {
   scraper.scrapePDF(filename).then(
            function(sizeMap){
                jsonpdf = (sizeMap);
                stringpdf = JSON.stringify(jsonpdf)
                t = stringpdf.search(/\b\w{3}\b\s\d{4}/g);
	              n = stringpdf.substring(t, t+8);
	              callback(n)
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
  parsepdf(function(data){
    res.send(data);
  });
  // res.sendfile('client/login.html')
})

server.post('/pdfupload', function(req, res){
  // handle pdfs
})


server.listen(port, function() {
  console.log('Server is running!');
})



var requester = app.textRequest('Hello', {
    sessionId: 'b99a3e41-bd57-4722-b308-cb4dc60fddde'
});
 
requester.on('response', function(response) {
    console.log(response);
});
 
requester.on('error', function(error) {
    console.log(error);
});

 
requester.end();