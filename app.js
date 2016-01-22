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
    db.collection('posts').find().toArray(function(err, results){
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
      comments: []
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
      res.end();
    })
});

app.post('/api/likes', function(req, res) {
  db.collection('posts').update(
    {"_id": ObjectId(req.body.id)},
    {"$inc": { likes: 1 }},
    function(err, result) {
      console.log('RESULT ', result);
      res.end();
    })
});

app.get('/new', function (req, res) {
    res.render('create') 
});

app.get('/top', function (req, res) {
    res.render('top') 
});

app.get('/latest', function (req, res) {
    res.render('latest') 
});

app.get('/search', function (req, res) {
    res.render('search')
});

app.get('/contact', function (req, res) {
    res.render('contact') 
});

app.listen(process.env.PORT || 3000);