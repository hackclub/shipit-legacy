var config = require('./config.js');
var express = require('express');
var Github = require('github-api');
var GithubStrategy = require('passport-github').Strategy;
var http = require('http').Server(app);
var passport = require('passport');
var Q = require('q');
var session = require('express-session');

var app = express();
var port = process.env.PORT || 3000;

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new GithubStrategy({
  clientID: config.github.clientID,
  clientSecret: config.github.clientSecret,
  callbackURL: config.github.callbackURL
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    profile.accessToken = accessToken;
    return done(null, profile);
  });
}));

app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/github', passport.authenticate('github', { scope: 'public_repo' }), function (req, res) {
});

app.get('/auth/github/callback', passport.authenticate('github'),
        function (req, res) {
          res.redirect('/begin');
        });

function toSpinalCase(s) {
  return s.toLowerCase().split(' ').join('-');
}

app.get('/begin', function (req, res) {
  var github = new Github({
    token: req.session.passport.user.accessToken,
    auth: 'oauth'
  });
  var params = {
    club: 'super_sample_club',
    name: 'Yelp for Yelp Reviews',
    description: "It's like Yelp, but for Yelp Reviews",
    url: 'http://example.com',
    github_url: 'https://github.com/zachlatta/shipped',
    authors: ['Zaphod Beeblebrox', 'Arthur Dent', 'Trillian Astra']
  };

  var repo = github.getRepo('hackedu', 'shipped');
  var forkedRepo = github.getRepo(req.session.passport.user.username, 'shipped');

  Q.nfcall(repo.fork)
  .then(function () { // poll for creation of new repo
    var deferred = Q.defer();

    var timer = setTimeout(function () {
      forkedRepo.contents('gh-pages', '', function (err, contents) {
        if (err) {
          console.log('error', err);
          return
        }

        clearInterval(timer);
        deferred.resolve(contents);
      }, true);
    }, 500);

    return deferred.promise;
  })
  .then(function () {
    var deferred = Q.defer();
    forkedRepo.branch('gh-pages', toSpinalCase(params.name), function (err) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve();
      }
    });
    return deferred.promise;
  })
  .catch(function (err) {
    console.error(err);
  });
  res.send('Done!');
});

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.listen(port);
console.log('Ship It started on port ' + port);
