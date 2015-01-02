var bodyParser = require('body-parser');
var config = require('./config.js');
var express = require('express');
var ejs = require('ejs');
var form = require('express-form');
var field = form.field;
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

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/auth/github', passport.authenticate('github', { scope: 'public_repo' }), function (req, res) {
});

app.get('/auth/github/callback', passport.authenticate('github'),
        function (req, res) {
          res.redirect('/projects/new');
        });

app.get('/projects/new', function (req, res) {
  res.render('new_project');
});

app.post(
  '/projects',
  urlencodedParser,
  form(
    field('name').trim().required(),
    field('description').trim().required(),
    field('url').trim().required(),
    field('github_url').trim().required(),
    field('authors').required() // require at least one author
  ),
  function (req, res) {
    if (!req.form.isValid) {
      console.log(req.form.errors);
      res.send('foo');
      return
    }

    console.log(req.body);
    res.send('foo');
  }
);

var projectTemplate = 'name: <%- name %>\n\
description: <%- description %>\n\
url: <%- url %>\n\
github_url: <%- githubURL %>\n\
authors:\n\
<% authors.forEach(function (author) { %>\
  - <%- author %>\n\
<% }) %>';

var pullRequestTemplate = 'Project details:\n\
\n\
* Club: <%- club %>\n\
* Name: <%- name %>\n\
* Description: <%- description %>\n\
* URL: <%- url %>\n\
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
// If the current branches are ['gh-pages', 'yelp-for-yelp-reviews',
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

app.get('/begin', function (req, res) {
  var github = new Github({
    token: req.session.passport.user.accessToken,
    auth: 'oauth'
  });
  var params = {
    club: 'Super Sample Club',
    name: 'Yelp for Yelp Reviews',
    description: "It's like Yelp, but for Yelp Reviews",
    url: 'http://example.com',
    githubURL: 'https://github.com/zachlatta/shipped',
    authors: ['Zaphod Beeblebrox', 'Arthur Dent', 'Trillian Astra']
  };

  var repo = github.getRepo('hackedu', 'shipped');
  var forkedRepo =
    github.getRepo(req.session.passport.user.username, 'shipped');
  var prBranch;

  Q.nfcall(repo.fork)
  .then(function () { // poll for creation of new repo
    var deferred = Q.defer();

    var timer = setTimeout(function () {
      forkedRepo.contents('gh-pages', '', function (err, contents) {
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
    forkedRepo.branch('gh-pages', prBranch, function (err) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve();
      }
    });
    return deferred.promise;
  })
  .then(function () { // create the project's .yml file
    var path = '_data/projects/' + toSnakeCase(params.club) + '/' + 
      toSnakeCase(params.name) + '.yml';
    var contents = ejs.render(projectTemplate, params);
    var commitMsg = 'projects: add ' + params.name;
    return Q.nfcall(forkedRepo.write, prBranch, path, contents, commitMsg);
  })
  .then(function () { // create the pull request
    var pull = {
      title: 'Add ' + params.name,
      body: ejs.render(pullRequestTemplate, params),
      base: 'gh-pages',
      head: req.session.passport.user.username + ':' + prBranch
    };
    return Q.nfcall(repo.createPullRequest, pull);
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
