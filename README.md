# Kraken

A Node.js web application framework.

[![Build Status](https://travis-ci.org/paypal/kraken-js.png)](https://travis-ci.org/paypal/kraken-js)
[![NPM version](https://badge.fury.io/js/kraken-js.png)](http://badge.fury.io/js/kraken-js)


## The Kraken Suite
KrakenJS is part of the Kraken Suite. If you'd like to find out more about the other modules, please visit [krakenjs.com](http://krakenjs.com)


## Getting Started

To create a new project:

1. Install Yeoman and the Kraken Generator:
`npm install -g generator-kraken`
2. Generate a Kraken project:
`yo kraken`
3. Go to your project directory and start your project. By default, it will listen on port 8000:
`npm start`


## Directory structure

- **/config** - Application and middleware configuration
- **/controllers** - Controllers
- **/lib** - Custom developer libraries and other code
- **/locales** - Local-based content
- **/models** - Models
- **/public** - Web resources that are publicly available
- **/public/templates** - Server and browser-side templates
- **/tests** - Unit and functional test cases



## Configuration

Configuration is stored in JSON format. Each settings file can be overridden in development mode by creating a `-development` version, e.g. app-development.json.

- **/config/app.json** - Application specific settings
- **/config/middleware.json** - Custom middleware specific settings

### Using custom configuration
If you'd like to add your own configuration to these files, simply include a new key.
To retrieve it in your application, you can do so during the [configuration step](#application-life-cycle-middleware)

### Default Values
*app.json values:*

- **host** - The application host. *Default: localhost*
- **port** - The application port to bind to. *Default: `8000`*
- **i18n**
  - **fallback** - Locale fallback to use if content files aren't found. *Default: `"en-US"`*
  - **contentPath** - Root path to content files. *Default: `"path:./locales"`*
- **routes**
  - **routePath** - The directory to scan for routes: *Default: `"path:./controllers"`*
- **express**
  - **trust proxy** Enables reverse proxy support, disabled by default
  - **jsonp callback** name Changes the default callback name of ?callback=
  - **json replacer** JSON replacer callback, null by default
  - **json spaces** JSON response spaces for formatting, defaults to 2 in development, 0 in production
  - **case sensitive** routing Enable case sensitivity, disabled by default, treating "/Foo" and "/foo" as the same
  - **strict routing** Enable strict routing, by default "/foo" and "/foo/" are treated the same by the router
  - **view cache** Enables view template compilation caching, enabled in production by default
  - **view engine** The default engine extension to use when omitted
  - **views** The view directory path, defaulting to "./views"
  - **route** The root URI prepended to all the routes	
- **view engines** - A map of view engines to register for the given app.
  - **{extension}** - View engine identifier for use by express.
     - **module** - The node module used to support this view engine.
     - **settings** - Any configuration settings needed by the identified module.
- **ssl** Also see tls.createServer http://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener
  - **pfx** - A string or Buffer containing the private key, certificate and CA certs of the server in PFX or PKCS12 format.
  - **key** - A string or Buffer containing the private key of the server in PEM format. (Required)
  - **passphrase** - A string of passphrase for the private key or pfx.
  - **cert** - A string or Buffer containing the certificate key of the server in PEM format. (Required)
  - **ca** - An array of strings or Buffers of trusted certificates in PEM format.
  - **crl** - Either a string or list of strings of PEM encoded CRLs (Certificate Revocation List)
  - **ciphers** - A string describing the ciphers to use or exclude. Default: ```AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH```.
  - **handshakeTimeout** - Abort the connection if the SSL/TLS handshake does not finish in this many milliseconds. The default is 120 seconds.
  - **honorCipherOrder** - When choosing a cipher, use the server's preferences instead of the client preferences.
  - **requestCert** - If true the server will request a certificate from clients that connect and attempt to verify that certificate. Default: ```false```.
  - **rejectUnauthorized** - If true the server will reject any connection which is not authorized with the list of supplied CAs. This option only has an effect if requestCert is true. Default: ```false```.
  - **NPNProtocols** - An array or Buffer of possible NPN protocols. (Protocols should be ordered by their priority).
  - **SNICallback** - A function that will be called if client supports SNI TLS extension. Only one argument will be passed to it: servername. Should return SecureContext instance.
  - **sessionIdContext** - A string containing a opaque identifier for session resumption.
  - **secureProtocol** - The SSL method to use.
  - **slabBufferSize** - Size of slab buffer used by all tls servers and clients. Default: ```10 * 1024 * 1024```. *Note: only change this if you know what you are doing.*
  - **clientRenegotiationLimit** - Renegotiation limit, default is 3. *Note: only change this if you know what you are doing.*
  - **clientRenegotiationWindow** - Renegotiation window in seconds, default is 10 minutes. *Note: only change this if you know what you are doing.*



*middleware.json values:*

- **middleware**
  - **appsec**
      - **csrf** - Should CSRF tokens be required. *Default: `true`*
      - **csp** - Should CSP headers be sent. *Default: `false`*
          - **reportOnly** - Report only enabled.
          - **report-uri** - URI the browser should send the report to.
          - **policy** - Key value object of the CSP policy.
      - **p3p** - Setting for P3P header. *Default: `false`*
      - **xframe** - Setting for XFRAME headers. *Default: `"SAMEORIGIN"`*

  - **compiler**
      - **dust** - Where the dev-time compiler should look for dust files. *Default: `"templates"`*
      - **less** - Where the dev-time compiler should look for LESS files. *Default: `"css"`*
      - **sass** - Where the dev-time compiler should look for SASS files. *Default: `"css"`*
          - note: you need to install node-sass for this to work. grunt-contrib-sass would also be of help. 

  - **errorPages** - Templates to load when the server returns specific HTTP error codes
      - **404** *Default: `undefined`*
      - **500** *Default: `undefined`*
      - **503** *Default: `undefined`*

  - **multipart**
      - **params** - Settings to pass to [formidable](https://github.com/felixge/node-formidable), which powers Kraken's multipart form support. *Default: `undefined`*

  - **session**
      - **module** - Connect-based module name to require for sessions. *Default: `false`*
      - **secret** - Secret used to hash your cookie. *Default: `"keyboard cat"`*
      - **cookie**
          - **path** - Path to set on the cookie. *Default: `"/"`*
          - **httpOnly** - HTTP only setting for the cookie. *Default: `true`*
          - **maxAge** - Maximum age the cookie should exist. *Default: `null`*

  - **static**
      - **srcRoot** - Where the compiler should look for files. *Default: `"path:./public"`*
      - **rootPath** - Where the compiler should put compiled files. *Default: `"path:./.build"`*



## Customization


### Application Life-cycle (Middleware)

You can customize your application's life-cycle by adding methods to the app delegate in the `index.js` file. This is the ideal place to apply any middleware you might want to use in your application.

- **app.configure(config, next)** - Run on startup. `next` must be called to continue. *Make any changes to your config here.*
- **app.requestStart(server)** -  Run before most middleware has been registered. *Logging and other middleware that need to see every single request should get applied here.* 
- **app.requestBeforeRoute(server)** - Run before the routes have been added. *Most of your middleware should be applied in this function.*
- **app.requestAfterRoute(server)** - Run after the routes have been added. *Useful for adding error handling middleware.*

*Example 1: Retrieving custom configuration*

```javascript
app.configure = function configure(nconf, next) {
    // Fired when an app configures itself
    // Retrieve a custom key from ./config/middleware.json or ./config/app.json
    console.log('My custom config is: ', nconf.get('myCustomKey'));
};
```

*Example 2: Using middleware*

```javascript
app.requestBeforeRoute = function (server) {
    // Register passport-js middleware
    server.use(passport.initialize());
    server.use(passport.session());
};
```

*Example 3: Setting Locals for dustjs*

```javascript
app.requestBeforeRoute = function (server) {
    // Set locals which can be accessed in  dust template
    server.use(function(req,res,next){
        res.locals.whatever = "whatever you need or from nconf";
        //use {whatever} in dust template
        next();
    });
};
```

For more information about where to apply your middleware you may want to review http://expressjs.com/guide.html#error-handling.

### Routes

To add a route you need to create a new file in `/controllers` that exports a function which accepts an express server. From there it's all [express](http://expressjs.com/)!

*Example:*

```
module.exports = function (server) {
    server.get('/path', function (req, res) {
    	// Awesome code!
    });
};
```



## Content


### Format

Content is in key value format. Named variables may be inserted into content strings with `{bracket}` syntax using the name of the value in your data model.

*Example:*

```
myPage.title=Welcome to my site!
myPage.greeting=Hello, {user}. How are you?
```


### File Structure

Content is loaded from country and language subdirectories inside `/locales` based on the user locale. Convention is used to automatically determine which content file to load: the base template file name and path are looked for in the locales folder.

*Example:*

```
content/
  US/
    en/
      index.properties
      myDir/
         page.properties

public/
  templates/
    index.dust
    myDir/
      page.dust
```



## Builds

A [Grunt](http://gruntjs.com/) task is used for builds. To prepare your code for production run `grunt build` which will create new files in the `.build` directory. This task must be done before running your app in production mode.

## File upload

Support for [multipart forms](http://en.wikipedia.org/wiki/File_select) is disabled by default. You can enable it by populating "multipart" in middleware.json and optionally pass parameters using [formidable's API](https://github.com/felixge/node-formidable).

All temporary files uploaded will be automatically removed when the request is completed if you do not remove them yourself.

# Contributing to the Kraken Suite

Bugs and new features should be submitted using [Github issues](https://github.com/PayPal/kraken-js/issues/new). Please include with a detailed description and the expected behaviour. If you would like to submit a change yourself do the following steps.

1. Fork it.
2. Create a branch (`git checkout -b fix-for-that-thing`)
3. Commit a failing test (`git commit -am "adds a failing test to demonstrate that thing"`)
3. Commit a fix that makes the test pass (`git commit -am "fixes that thing"`)
4. Push to the branch (`git push origin fix-for-that-thing`)
5. Open a [Pull Request](https://github.com/PayPal/kraken-js/pulls)

Please keep your branch up to date by rebasing upstream changes from master.


## FAQ

### Why use Kraken?
Kraken is the glue to your open source. It sits on top of grunt and express, but offers you a more robust feature set in a web application framework. The benefits include support for externalized content, localization, compile-on-the-fly editing, environment-based configuration, baked-in application security and more.

### How do I run in production mode?
Build your project first and then `export NODE_ENV=production` before running the app.

### How to opt out of view rendering
If your application does not require template rendering, you can disable it via your `./config/app.json` file by setting the following values to *null*:

```javascript
  "view engines": null,
  "express": {
    "view engine": null
  }
```
