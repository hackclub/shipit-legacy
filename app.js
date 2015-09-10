var bodyParser = require('body-parser');
var config = require('./config.js');
var express = require('express');
var ejs = require('ejs');
var form = require('express-form');
var field = form.field;
var flash = require('connect-flash');
var Github = require('github-api');
var GithubStrategy = require('passport-github').Strategy;
var http = require('http').Server(app);
var passport = require('passport');
var path = require('path');
var Q = require('q');
var session = require('express-session');

var app = express();
var port = process.env.PORT || 3000;

var urlencodedParser = bodyParser.urlencoded({ extended: true });

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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/auth/github', passport.authenticate('github', { scope: 'public_repo' }), function (req, res) {
});

app.get('/auth/github/callback', passport.authenticate('github'),
        function (req, res) {
          res.redirect('/projects/new');
        });

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
  else
    res.redirect('/');
}

app.get('/projects/new', ensureAuthenticated, function (req, res) {
  res.render('new_project', {messages: req.flash().error});
});

app.post(
  '/projects',
  urlencodedParser,
  form(
    field('name', 'Name').trim().required(),
    field('description', 'Description').trim().custom(function (desc) {
      // remove newline characters and join all words by spaces
      return desc.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ').trim();
    }).required(),
    field('url', 'URL').trim(),
    field('githubURL', 'GitHub Repo URL').trim().required(),
    field('club', 'Club').trim().required(),
    field('authors', 'Authors').array().notEmpty().required()
  ),
  function (req, res) {
    if (!req.form.isValid) {
      res.redirect('/projects/new');
      return
    }

    createProjectPR(req, req.form)
    .then(function (pullRequest) {
      res.redirect(pullRequest[0].html_url);
    })
    .catch(function (err) {
      console.error(err);
      res.send('error!');
    });
  }
);

var projectTemplate = 'name: <%- name %>\n\
description: <%- description %>\n\
<% if (url) { %>\
url: <%- url %>\n\
<% } %>\
github_url: <%- githubURL %>\n\
clubs:\n\
<% clubs.forEach(function (club) { %>\
  - <%- club %>\n\
<% }) %>
authors:\n\
<% authors.forEach(function (author) { %>\
  - <%- author %>\n\
<% }) %>';

var pullRequestTemplate = 'Project details:\n\
\n\
* Clubs:\n\
<% clubs.forEach(function (club) { %>\
  * <%- club %>\n\
<% }) %>\n\
* Name: <%- name %>\n\
* Description: <%- description %>\n\
<% if (url) { %>\
* URL: <%- url %>\n\
<% } %>\
* GitHub: <%- githubURL %>\n\
* Authors:\n\
<% authors.forEach(function (author) { %>\
  * <%- author %>\n\
<% }) %>\n\
\n\
:shipit:';

function toSpinalCase(s) {
  return s.toLowerCase().split(' ').join('-');
}

function toSnakeCase(s) {
  return s.toLowerCase().split(' ').join('_');
}

// Generates a name for the branch for the project.
//
// If the spinal case version of the project is already taken, it then appends
// incrementing numbers to it until it figures out a branch name that isn't
// already taken.
//
// If the current branches are ['master', 'yelp-for-yelp-reviews',
// 'yelp-for-yelp-reviews-1'] and the // project name is 'Yelp for Yelp
// Reviews', then the generated branch name will be 'yelp-for-yelp-reviews-2'.
function branchName(projectName, branches) {
  var baseBranch = toSpinalCase(projectName);
  var branch = baseBranch;

  for (var i = 1; branches.indexOf(branch) > -1; i++) {
    branch = baseBranch + '-' + i;
  }

  return branch;
}

function createProjectPR(req, params) {
  var github = new Github({
    token: req.session.passport.user.accessToken,
    auth: 'oauth'
  });

  var repo = github.getRepo('hackedu', 'shipped');
  var forkedRepo =
    github.getRepo(req.session.passport.user.username, 'shipped');
  var prBranch;

  return Q.nfcall(repo.fork)
    .then(function () { // poll for creation of new repo
      var deferred = Q.defer();

      var timer = setTimeout(function () {
        forkedRepo.contents('master', '', function (err, contents) {
          if (err) {
            console.log('polling and got error', err);
            return
          }

          clearInterval(timer);
          deferred.resolve(contents);
        }, true);
      }, 500);

      return deferred.promise;
    })
    .then(function () {
      return Q.nfcall(forkedRepo.listBranches);
    })
    .then(function (branches) { // create branch for pull request
      var deferred = Q.defer();
      prBranch = branchName(params.name, branches);
      forkedRepo.branch('master', prBranch, function (err) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });
      return deferred.promise;
    })
    .then(function () { // create the project's .yml file
      var path = '_data/projects/' + toSnakeCase(params.name) + '.yml';
      var contents = ejs.render(projectTemplate, params);
      var commitMsg = 'projects: add ' + params.name;
      return Q.nfcall(forkedRepo.write, prBranch, path, contents, commitMsg);
    })
    .then(function () { // create the pull request
      var pull = {
        title: 'Add ' + params.name,
        body: ejs.render(pullRequestTemplate, params),
        base: 'master',
        head: req.session.passport.user.username + ':' + prBranch
      };
      return Q.nfcall(repo.createPullRequest, pull);
    });
};

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.listen(port);
console.log('Ship It started on port ' + port);
