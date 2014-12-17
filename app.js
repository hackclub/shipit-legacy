var config = require('./config.js');
var express = require('express');
var http = require('http').Server(app);
var passport = require('passport');
var GithubStrategy = require('passport-github').Strategy;

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
    return done(null, profile);
  });
}));

app.use(express.static(__dirname + '/public'));

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/github', passport.authenticate('github'), function (req, res) {
});

app.get('/auth/github/callback', passport.authenticate('github'),
        function (req, res) {
          res.redirect('/account');
        });

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.listen(port);
console.log('Ship It started on port ' + port);
