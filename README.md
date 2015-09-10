# Ship It :shipit: [![Circle CI](https://circleci.com/gh/hackedu/shipit.svg?style=svg)](https://circleci.com/gh/hackedu/shipit)

Ship It is a utility for generating pull requests to submit projects to
https://shipped.hackedu.us.

![](http://i.imgur.com/NJmlsS6.jpg)

## Getting Started

Requirements

* Node

After cloning the repo, install all dependencies:

    $ npm install

Create a file called `.env` and put the following in it (replace TODO with real
values):

```
SESSION_SECRET=TODO
GITHUB_CLIENT_ID=TODO
GITHUB_CLIENT_SECRET=TODO
GITHUB_CALLBACK_URL=TODO
```

* Session Secret: secret used to encrypt the session
* GitHub Client ID: client id for the application on GitHub
* GitHub Client Secret: client secret for the application on GitHub
* GitHub Callback URL: callback url for the application on GitHub

Start the server:

    $ npm start

## License

This repository is distributed under the MIT license found in the
[LICENSE](./LICENSE) file.
