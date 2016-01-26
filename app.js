//Requires
var express = require('express');
var app = express();
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient; 
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var multipart = require('connect-multiparty');  
var multipartMiddleware = multipart();
var multiparty = require('multiparty');
var request = require('request');
var http = require('http');
var util = require('util');
var cloudinary = require('cloudinary');   
var nodemailer = require('nodemailer');
var _ = require("underscore");
var router = express.Router();
var smtpTransport = require('nodemailer-smtp-transport');     
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var methodOverride = require('method-override');
var bcrypt = require('bcrypt');
var MongoStore = require('connect-mongo')(session);
var mongoUrl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/spottygram';

// Configuration of Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));
app.set('view engine', 'ejs');
cloudinary.config({ 
  cloud_name: 'thaispulliam-com', 
  api_key: process.env.apikeycloud, 
  api_secret: process.env.cloudkey 
});
app.use('/sayHello', router);
app.use(cookieParser('spottysecret'));
app.use(session({
  cookie: { maxAge: 60 * 60 * 24 * 365 * 10 },
  secret: 'secret',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({url: mongoUrl})
}));
app.use(flash());
app.use(methodOverride('_method'));

// Database
var db;
MongoClient.connect(mongoUrl, function(err, database) {
  if (err) { throw err; }
  db = database;
  process.on('exit', function() {
    db.close();
  });
});

//Sessions Authentication
var authenticate = function(username, password, callback) {
  db.collection('sessions').findOne({ "username": username }, 
    function(err, data) { 
      if (err) { throw err; }
      if (!data) { 
        console.log('No Data');
        callback(false); 
      } else {
        bcrypt.compare(password, data.password, function(err, isMatch) {
          if (isMatch) {
            callback(data);
          } else {
            console.log('Didnt match database: ' + err);
            console.log(data.password + password);
            callback(false);
          }
        });
      }
  });
};

// Routes
app.get('/', function (req, res) {
  var currentuser = req.session.username;
  if (currentuser){
    res.render('index', {user: currentuser});
  } else {
    res.render('index', {user: 0});
  }
});

app.get('/login', function (req, res) {
  var currentuser = req.session.username;
  if (currentuser){
    res.render('alreadylogged', {user: currentuser});
  } else {
    res.render('login', {user: 0, messagesignup: req.query.wrongpass, messagelogin: req.query.cantlog});
  }
});

app.post('/login', function(req, res) {
  console.log('username: ' + req.body.username);
  console.log('password: ' + req.body.password);

  authenticate(req.body.username, req.body.password, function(user){
      if (user) {
          req.session.username = user.username;
          req.session.userID = user._id;
          req.session.photo = user.image;
          res.redirect('/userprofile');
      } else {
          res.redirect('/login?cantlog=wrong+password+try+again+or+sign+up');
      }
    });
});

app.post('/user', multipartMiddleware, function (req, res) {
  if (req.body.password === req.body.password_confirm) {
    var password = bcrypt.hashSync(req.body.password, 8);
    var username = req.body.username;
    var myfile = req.files.image.path;
    cloudinary.uploader.upload(myfile, function(result) {  
      db.collection('sessions').insert({
        username: username, 
        password: password, 
        image: result.url
      },function(err, result){
          console.log('this was added in the database: \n' + JSON.stringify(result));
      });
    });
    res.render('confirm_signup');    
  } else {
    res.redirect('/login?wrongpass=wrong+password+confirmation');
    console.log('Wrong password confirmation');
  }
});

app.get('/confirm_signup', function(req, res) {
  var currentuser = req.session.username;
  if (currentuser){
      res.render('confirm_signup', {user: currentuser});
    } else {
      res.redirect('/');
    }
});

app.get('/userprofile', function(req, res) {
  var currentuser = req.session.username;
  var currentphoto = req.session.photo;
  db.collection('posts').find({"byuser": currentuser}).sort({lastmodified: -1}).toArray(function(err, results){
    if (currentuser){
       res.render('user', {user: currentuser, image: currentphoto, posts: results});
    } else {
       res.redirect('/');
    }
  });
});

app.get('/logout', function(req, res) {
  req.session.username = null;
  req.session.userId = null;
  res.redirect('/login');
});

app.get('/all', function (req, res) {
  var currentuser = req.session.username;
  db.collection('posts').find().sort({lastmodified: -1}).toArray(function(err, results){
    if (currentuser){
       res.render('grams', {posts: results, user: currentuser});
    } else {
       res.render('grams', {posts: results, user: 0});
    }
  });
});

app.post('/all', multipartMiddleware, function (req, res) {
  var currentuser = req.session.username;
  var currentphoto = req.session.photo;
  var myfile = req.files.image.path;
  var uploaded = cloudinary.uploader.upload(myfile, function(result) { 
    console.log(result.url); 
    db.collection('posts').insert({ 
      name: req.body.name, 
      image: result.url, 
      description: req.body.description, 
      location: req.body.location,
      likes: 0,
      comments: [],
      lastmodified: new Date(),
      byuser: currentuser,
      avatar: currentphoto
    },
    function(err, result){
      res.redirect('/all');
    });
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
        });
    });
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
        });
    });
});

app.get('/new', function (req, res) {
  var currentuser = req.session.username;
  if (currentuser){
     res.render('create', {user: currentuser});
  } else {
     res.render('needtologin', {user: 0});
  }
});

app.get('/top', function (req, res) {
  var currentuser = req.session.username;
  db.collection('posts').find().sort({likes: -1}).limit(1).toArray(function(err, results){
    if (currentuser){
      res.render('top', {posts: results, user: currentuser}); 
    } else {
      res.render('top', {posts: results, user: 0});
    }
  }); 
});

app.get('/contact', function (req, res) {
  var currentuser = req.session.username;
  if (currentuser){
    res.render('contact', { messageOfEmail: 0, messageOfSubscription: 0, user: currentuser });
  } else {
    res.render('contact', { messageOfEmail: 0, messageOfSubscription: 0, user: 0 });
  }
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
      var currentuser = req.session.username;
      if (currentuser){
        console.log('Message sent: ' + info.response);
        res.render('contact', { messageOfEmail: 'Your message was sent!', messageOfSubscription: 0, user: currentuser });
      } else {
        console.log('Message sent: ' + info.response);
        res.render('contact', { messageOfEmail: 'Your message was sent!', messageOfSubscription: 0, user: 0 });
      }  
    }
  });
});


app.listen(process.env.PORT || 3000);
