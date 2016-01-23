//Requires
var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var multiparty = require('multiparty');
var http = require('http');
var util = require('util');
var cloudinary = require('cloudinary');
var nodemailer = require('nodemailer');
var _  = require("underscore");
var router = express.Router();
var smtpTransport = require('nodemailer-smtp-transport');

// Configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));
app.set('view engine', 'ejs');
cloudinary.config({ 
  cloud_name: 'thaispulliam-com', 
  api_key: process.env.apikeycloud, 
  api_secret: process.env.cloudkey 
});
app.use('/sayHello', router);

// Database
var db;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var mongoUrl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/spottygram';
MongoClient.connect(mongoUrl, function(err, database) {
  if (err) { throw err; }
  db = database;
  process.on('exit', db.close);
});

// Routes
app.get('/', function (req, res) {
    res.render('index') 
});

app.get('/all', function (req, res) {
    db.collection('posts').find().sort({lastmodified: -1}).toArray(function(err, results){
    console.log(results);
    res.render('grams', {posts: results}); //render first 10
    })
});

app.post('/all', multipartMiddleware, function (req, res) {
  var myfile = req.files["image"]["path"]
  var uploaded = cloudinary.uploader.upload(myfile, function(result) { 
    console.log(result["url"]) 
    db.collection('posts').insert({ 
      name: req.body.name, 
      image: result["url"], 
      description: req.body.description, 
      location: req.body.location,
      likes: 0,
      comments: [],
      lastmodified: new Date()
    },
    function(err, result){
      res.redirect('/all');
    })
  });
});

app.post('/api/comments', function(req, res) {
  var comment = req.body.comment;
  db.collection('posts').update(
    {"_id": ObjectId(req.body.id)},
    {"$push": { comments: comment }},
    function(err, result) {
      console.log('RESULT ', result);
      db.collection('posts').findOne({"_id": ObjectId(req.body.id)},
        function(err, data){
          res.json(data.comments);
        })
    })
});

app.post('/api/likes', function(req, res) {
  db.collection('posts').update(
    {"_id": ObjectId(req.body.id)},
    {"$inc": { likes: 1 }},
    function(err, result) {
      console.log('RESULT ', result);
      db.collection('posts').findOne({"_id": ObjectId(req.body.id)}, 
        function(err, data){
          res.json(data.likes);
        })
    })
});

app.get('/new', function (req, res) {
    res.render('create') 
});

app.get('/top', function (req, res) {
    db.collection('posts').find().sort({likes: -1}).limit(1).toArray(function(err, results){
    console.log(results);
    res.render('top', {posts: results}); //render first 10
    }) 
});

app.get('/search', function (req, res) {
    res.render('search')
});

app.get('/contact', function (req, res) {
    res.render('contact') 
});

app.post('/contact', function (req, res) {
  var transporter = nodemailer.createTransport(smtpTransport({
    service: 'Gmail',
    auth: {
      user: "spottygram@gmail.com",
      pass: process.env.spottygrampassword
    }
  }));

  var messagetext = 'Hello from: ' + req.body.name + '\n\n' + 'User e-mail: ' + req.body.email + '\n\n' + 'Message: \n' + req.body.message;

  var mailOptions = {
    from: 'spottygram@gmail.com', 
    to: 'spottygram@gmail.com', 
    subject: 'Contact from User', 
    text: messagetext
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
        res.json({yo: 'error'});
    }else{
        console.log('Message sent: ' + info.response);
        res.json({yo: info.response});
    };
  });
});

app.listen(process.env.PORT || 3000);