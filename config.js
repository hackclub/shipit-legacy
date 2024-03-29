var dotenv = require('dotenv');
dotenv.load();

var config = {};

config.session = {
  secret: process.env.SESSION_SECRET
}

config.github = {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL
}

module.exports = config;
