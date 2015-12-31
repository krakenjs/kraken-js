![kraken-js](public/krakenLogo.png)


kraken.js
=========

Lead Maintainer: [Jean-Charles Sisk](https://github.com/jasisk)

[![Build Status](https://travis-ci.org/krakenjs/kraken-js.svg?branch=v1.0.x)](https://travis-ci.org/krakenjs/kraken-js)  

Kraken builds upon [express](http://expressjs.com/) and enables environment-aware, dynamic configuration, advanced middleware capabilities, security, and app lifecycle events.
For more information and examples check out [krakenjs.com](http://krakenjs.com)


## Basic Usage

```javascript
'use strict';

var express = require('express'),
    kraken = require('kraken-js');

var app = express();
app.use(kraken());
app.listen(8000);
```


## API

`kraken([options])`

kraken-js is used just like any normal middleware, however it does more than just return a function; it configures a
complete express 4 application. See below for a list of features, but to get started just use it like middleware.

```javascript
app.use(kraken());
// or to specify a mountpath for your application:
// app.use('/mypath', kraken());

// Note: mountpaths can also be configured using the
// `express:mountpath` config setting, but that setting
// will be overridden if specified in code.
```

### Options
Pass the following options to kraken via a config object such as this:

```javascript
var options = {
    onconfig: function (config, callback) {
        // do stuff
        callback(null, config);
    }
};

// ...

app.use(kraken(options));
```
Note: All kraken-js configuration settings are optional.

#### `basedir` (*String*, optional)
The working directory for kraken to use. kraken loads configuration files,
routes, and registers middleware so this directory is the path against all relative paths are resolved. The default value
is the directory of the file that uses kraken, which is generally `index.js` (or `server.js`).

#### `onconfig` (*Function*, optional)
Provides an asynchronous hook for loading additional configuration. When invoked, a
[confit](https://github.com/krakenjs/confit) configuration object containing all loaded configuration value passed
as the first argument, and a callback as the second. The signature of this handler is `function (config, callback)`
and the callback is a standard error-back which accepts an error as the first argument and the config object as the
second, e.g. `callback(null, config)`.

#### `protocols` (*Object*, optional)
Protocol handler implementations for use when processing configuration. For more information on protocols
see [shortstop](https://github.com/krakenjs/shortstop) and [shortstop-handlers](https://github.com/krakenjs/shortstop-handlers).
By default, kraken comes with a set of shortstop protocols which are described in the "Config Protocols" section below,
but you can add your own by providing an object with the protocol names as the keys and their implementations as
properties, for example:
```javascript
var options = {
    protocols: {
        file: function file(value, callback) {
            fs.readFile(value, 'utf8', callback);
        }
    }
};
```

#### `uncaughtException` (*Function*, optional)
Handler for `uncaughtException` errors outside of the middleware chain. See the [endgame](https://github.com/totherik/endgame) module for defaults.

For uncaught errors in the middleware chain, see `shutdown` middleware instead.

## Config Protocols
kraken comes with the following shortstop protocol handlers by default:
#### `import:`
Merge the contents of the specified file into configuration under a given key.
```json
{
    "foo": "import:./myjsonfile"
}
```

#### `config:`
Replace with the value at a given key. Note that the keys in this case are dot (.) delimited.
```json
{
    "foo": {
        "bar": true
    },
    "foobar": "config:foo.bar"
}
```

#### `path:`
The path handler is documented in the [shortstop-handlers](https://github.com/krakenjs/shortstop-handlers#handlerspathbasedir) repo.

#### `file:`
The file handler is documented in the [shortstop-handlers](https://github.com/krakenjs/shortstop-handlers#handlersfilebasedir-options) repo.

#### `base64:`
The base64 handler is documented in the [shortstop-handlers](https://github.com/krakenjs/shortstop-handlers#handlersbase64) repo.

#### `env:`
The env handler is documented in the [shortstop-handlers](https://github.com/krakenjs/shortstop-handlers#handlersenv) repo.

#### `require:`
The require handler is documented in the [shortstop-handlers](https://github.com/krakenjs/shortstop-handlers#handlersrequirebasedir) repo.

#### `exec:`
The exec handler is documented in the [shortstop-handlers](https://github.com/krakenjs/shortstop-handlers#handlersexecbasedir) repo.

#### `glob:`
The glob handler is documented in the [shortstop-handlers](https://github.com/krakenjs/shortstop-handlers#handlersglobbasediroptions) repo.

#### `resolve:`
The resolve handler is documented in the [shortstop-resolve](https://github.com/jasisk/shortstop-resolve) repo.




## Features


### Configuration


#### Environment-aware

Using environment suffixes, configuration files are applied and overridden according to the current environment as set
by `NODE_ENV`. The application looks for a `./config` directory relative to the basedir and looks for `config.json` as the baseline config specification. JSON files matching the current env are processed and loaded. Additionally, JSON configuration files may contain comments.

Valid `NODE_ENV` values are `undefined` or `dev[elopment]` (uses `development.json`), `test[ing]` (uses `test.json`), `stag[e|ing]` (uses `staging.json`), `prod[uction]` (uses `config.json`). Simply add a config file with the name, to have it read only in that environment, e.g. `config/development.json`.


### Middleware

Much like configuration, you shouldn't need to write a lot of code to determine what's in your middleware chain. [meddleware](https://github.com/paypal/meddleware) is used internally to read,
resolve, and register middleware with your express application. You can either specify the middleware in your `config.json` or `{environment}.json`, (or) import it from a separate json file using the import protocol mentioned above.

#### Included Middleware
Kraken comes with common middleware already included in its `config.json` file. The following is a list of the included middleware and their default configurations which can be overridden in your app's configuration:
* `"shutdown"` - internal middleware which handles graceful shutdowns in production environments
  - Priority - 0
  - Enabled - `true` if *not* in a development environment
  - Module - `"kraken-js/middleware/shutdown"`
    - Arguments (*Array*)
      - *Object*
        - `"timeout"` - milliseconds (default: `30000`)
        - `"template"` - template to render (default: `null`)
        - `"shutdownHeaders"` - custom headers to write while still disconnecting.
        - `"uncaughtException"` - custom handler - `function (error, req, res, next)` - for uncaught errors. Default behavior is to log the error and then trigger shutdown.
* `"compress"` - adds compression to server responses
  - Priority - 10
  - Enabled - `false` (disabled in all environments by default)
  - Module - `"compression"` ([npm](https://www.npmjs.org/package/compression))
* `"favicon"` - serves the site's favicon
  - Priority - 30
  - Module - `"serve-favicon"` ([npm](https://www.npmjs.org/package/serve-favicon))
    - Arguments (*Array*)
      - *String* - local path to the favicon file (default: `"path:./public/favicon.ico"`)
* `"static"` - serves static files from a specific folder
  - Priority - 40
  - Module - `"serve-static"` ([npm](https://www.npmjs.org/package/serve-static))
    - Arguments (*Array*)
      - *String* - local path to serve static files from (default: `"path:./public"`)
* `"logger"` - logs requests and responses
  - Priority - 50
  - Module - `"morgan"` ([npm](https://www.npmjs.org/package/morgan))
    - Arguments (*Array*)
      - *String* - log format type (default: `"combined"`)
* `"json"` - parses JSON request bodies
  - Priority - 60
  - Module - `"body-parser"` ([npm](https://www.npmjs.org/package/body-parser))
    - Method - `"json"`
* `"urlencoded"` - parses URL Encoded request bodies
  - Priority - 70
  - Module - `"body-parser"` ([npm](https://www.npmjs.org/package/body-parser))
    - Method - `"urlencoded"`
    - Arguments (*Array*)
      - *Object*
        - `"extended"` (*Boolean*) - parse extended syntax with the [qs](https://www.npmjs.org/package/qs) module (default: `true`)
* `"multipart"` - parses multipart FORM bodies
  - Priority - 80
  - Module - `"kraken-js/middleware/multipart"` (delegates to [formidable](https://www.npmjs.org/package/formidable))
* `"cookieParser"` - parses cookies in request headers
  - Priority - 90
  - Module - `"cookie-parser"` ([npm](https://www.npmjs.org/package/cookie-parser))
    - Arguments (*Array*)
      - *String* - secret used to sign cookies (default: `"keyboard cat"`)
* `"session"` - maintains session state
  - Priority - 100
  - Module - `"express-session"` ([npm](https://www.npmjs.org/package/express-session))
    - Arguments (*Array*)
      - *Object*
        - `"key"` (*String*) - cookie name (default: `"connect.sid"`)
        - `"secret"` (*String*) - secret used to sign session cookie (default: `"keyboard cat"`)
        - `"cookie"` (*Object*) - describing options for the session cookie
          - `"path"` (*String*) - base path to verify cookie (default: `"/"`)
          - `"httpOnly"` (*Boolean*) - value indicating inaccessibility of cookie in the browser (default: `true`)
          - `"maxAge"` (*Number*) - expiration of the session cookie (default: `null`)
        - `"resave"` (*Boolean*) - value indicating whether sessions should be saved even if unmodified (default: `true`)
        - `"saveUninitialized"` (*Boolean*) - value indicating whether to save uninitialized sessions (default: `true`)
        - `"proxy"` (*Boolean*) - value indicating whether to trust the reverse proxy (default: `null`, inherit from `express`)
* `"appsec"` - secures the application against common vulnerabilities (see Application Security below)
  - Priority - 110
  - Module - `"lusca"` ([github](https://github.com/paypal/lusca))
    - Arguments (*Array*)
      - *Object*
        - `"csrf"` (*Boolean*|*Object*) - value indicating whether to require CSRF tokens for non GET, HEAD, or OPTIONS requests, or an options object to configure CSRF protection (default: `true`)
        - `"xframe"` (*String*) - value for the `X-Frame-Options` header (default: `"SAMEORIGIN"`)
        - `"p3p"` (*String*|*Boolean*) - the Compact Privacy Policy value or `false` if not used (default: `false`)
        - `"csp"` (*Object*|*Boolean*) - options configuring Content Security Policy headers or `false` if not used (default: `false`)
* `"router"` - routes traffic to the applicable controller
  - Priority - 120
  - Module - `"express-enrouten"` ([npm](https://www.npmjs.org/package/express-enrouten))
    - Arguments (*Array*)
      - *Object*
        - `"index"` (*String*) - path to the single file to load (default: `"path:./routes"`)

Additional notes:
- The session middleware defaults to using the in-memory store. This is **not** recommended for production applications and the configuration should be updated to use a shared resource (such as Redis or Memcached) for session storage.
- You can change the routes which are affected by the middleware by providing a top-level option of `route`. In express deployments, it is common to re-route where static files are served which can be accomplished like so:

```json
// include this in your own config.json and this will merge with the Kraken defaults
// NB: if you use kraken-devtools you must re-route that as well in development.json!
{
    "static": {
        "route": "/static"
    }
}
```

#### Extending Default Middleware
In any non-trivial Kraken deployment you will likely need to extend the included middleware. Common middleware which need extension include cookie parsing and session handling. In those particular cases, the secrets used should be updated:

```js
{
    // include this in your own config.json and this will merge with the Kraken defaults
    "middleware": {

        "cookieParser": {
            "module": {
                "arguments": [ "your better secret value" ]
            }
        },

        "session": {
            "module": {
                // NB: arrays like 'arguments' are not merged but rather replaced, so you must
                //     include all required configuration options here.
                "arguments": [
                    {
                        "secret": "a much better secret",
                        "cookie": {
                            "path": "/",
                            "httpOnly": true,
                            "maxAge": null
                        },
                        "resave": true,
                        "saveUninitialized": true,
                        "proxy": null
                    }
                ]
            }
        }

    }
}
```

Another common update is to pass options to middleware which is configured only with the defaults, such as the compression middleware:

```js
{
    "middleware": {
        "compress": {
            "enabled": true,    // response compression is disabled by default
            "module": {
                "arguments": [
                    {
                        // 512 byte minimum before compressing output
                        "threshold": 512
                    }
                ]
            }
        }
    }
}
```

More complicated examples include configuring the session middleware to use a shared resource, such as [connect-redis](https://www.npmjs.org/package/connect-redis). This requires a few extra steps, most notably creating your own middleware to handle the registration (see [totherik/redis-example](https://github.com/totherik/redis-example) for a complete example):

  1. Overlay the existing session middleware in your configuration:

  ```js
  {
      // in your config.json
      "middleware": {
          "session": {
              "module": {
                  // use our own module instead
                  "name": "path:./lib/middleware/redis-session",
                  "arguments": [
                      // express-session configuration
                      {
                          "secret": "a much better secret",
                          "cookie": {
                              "path": "/",
                              "httpOnly": true,
                              "maxAge": null
                          },
                          "resave": true,
                          "saveUninitialized": true,
                          "store": null    // NB: this will be overlaid in our module
                      },
                      // connect-redis configuration
                      {
                          "host": "localhost",
                          "port": 6379,
                          "prefix": "session:"
                      }
                  ]
              }
          }
      }
  }
  ```

  2. Add your custom middleware for Kraken to configure:

  ```javascript
  // ./lib/middleware/redis-session.js
  'use strict';

  var session = require('express-session'),
      RedisStore = require('connect-redis')(session);

  /** Creates a REDIS-backed session store.
   *
   * @param {Object} [sessionConfig] Configuration options for express-session
   * @param {Object} [redisConfig] Configuration options for connect-redis
   * @returns {Object} Returns a session middleware which is backed by REDIS
   */
  module.exports = function (sessionConfig, redisConfig) {

      // add the 'store' property to our session configuration
      sessionConfig.store = new RedisStore(redisConfig);

      // create the actual middleware
      return session(sessionConfig);
  };
  ```


### Application Security

Kraken uses [lusca](https://github.com/paypal/lusca) to secure your applications, so that you don't need to think about it. Techniques like CSRF, XFRAMES, and CSP are enabled automatically while others can be opted into. All are customizable through configuration.


### Lifecycle Events

Kraken adds support for additional events to your express app instance:

* `start` - the application has safely started and is ready to accept requests
* `shutdown` - the application is shutting down, no longer accepting requests
* `stop` - the http server is no longer connected or the shutdown timeout has expired



### Configuration-based `express` Settings
Since express instances are themselves config objects, the convention is to set values on the app instance for use by
express internally as well as other code across the application. kraken-js allows you to configure express via JSON.
Any properties are supported, but kraken-js defaults include:
```js
{
    "express": {
        "env": "", // NOTE: `env` is managed by the framework. This value will be overwritten.
        "x-powered-by": false,
        "trust proxy": false,
        "jsonp callback name": null,
        "json replacer": null,
        "json spaces": 0,
        "case sensitive routing": false,
        "strict routing": false,
        "view cache": true,
        "view engine": null,
        "views": "path:./views",
        "route": "/"
    }
}
```

Additional notes:
- The `env` setting will be set to the environment value as derived by kraken-js, so what is put here will be overwritten
at runtime.
- Set the `view engine` property to the one of the `view engines` property names (see the section `View Engine Configuration`)
to enable it for template rendering.
- The optional `view` property is a special case in which you can set a path to a module which exports a constructor implementing
the view API as defined by the module `express/lib/view`. If set, kraken-js will attempt to load the specified module and
configure express to use it for resolving views.

For example:

```js
{
    "express": {
        "view": "path:./lib/MyCustomViewResolver"
    }
}
```


### View Engine Configuration
kraken-js looks to the `view engines` config property to understand how to load and initialize renderers. The value of the
`view engines` property is an object mapping the desired file extension to engine config settings. For example:
```js
{
    "view engines": {
        "jade": {
            "module": "consolidate"
        },
        "html": {
            "name": "ejs",
            "module": "ejs",
            "renderer": "renderFile"
        },
        "dust": {
            "module": "adaro",
            "renderer": {
                "method": "dust",
                "arguments": [{
                    "cache": false,
                    "helpers": ["dust-helpers-whatevermodule"]
                }]
            }
        },
        "js": {
            "module": "adaro",
            "renderer": {
                "method": "js",
                "arguments": [{ "cache": false }]
            }
        }
    }
}
```

The available engine configuration options are:

- `module` (*String*) - This is the node module that provides the renderer implementation. The value can be the name of a
module installed via npm, or it can be a module in your project referred to via file path, for example `"module": "path:./lib/renderer"`.
- `name` (*String*, optional) - Set this if the name of the rendering engine is different from the desired file extension.
For example, you chose to use ejs, but want to use the "html" file extension for your templates. Additionally, if the
renderer function exported by the module is not the file extension and a "renderer" property is not defined, this value will be used.
- `renderer` (*String|Object*, optional) - The renderer property allows you to explicitly identify the property or the
factory method exported by the module that should be used when settings the renderer. Set the value to a String to identify
that the renderer is exported by that name, or an object with the properties "method" and "arguments" to identify a factory method.
For example, using ejs you could set this property to "renderFile" or "__express" as the ejs module exports a renderer directly.

## Tests
```bash
$ npm test
```

## Coverage
````bash
$ npm run-script cover && open coverage/lcov-report/index.html
```

## Reading app configs from within the kraken app

There are two different ways. You can

* Read it in your `onconfig` handler as mentioned above.
```
function (config, callback) {
    var value = config.get('<key>');
    ...
    ...
    callback(null, config);
}
```
* Read it off the `req` object by doing `req.app.kraken.get('<config-key>')`. So it would look like:
```
router.get('/', function (req, res) {
    var value = req.app.kraken.get('<key>');
    ...
    ...
});

```
