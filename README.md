# Kraken.js

Kraken builds upon [express](http://expressjs.com/) and enables environment-aware, dynamic configuration, advanced middleware capabilities, security, and app lifecycle events.


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
            fs.readFile(value 'utf8', callback)
        }
    }
};
```

#### `uncaughtException` (*Function*, optional)
Handler for `uncaughtException` errors. See the [endgame](https://github.com/totherik/endgame) module for defaults.


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




## Features


### Configuration


#### Environment-aware

Using environment suffixes, configuration files are applied and overridden according to the current environment as set
by `NODE_ENV`. The application looks for a `./config` directory relative to the basedir and looks for `config.json` as the baseline config specification. JSON files matching the current env are processed and loaded. Additionally, JSON configuration files may contain comments.

Valid `NODE_ENV` values are `undefined` or `dev[elopment]`, `test[ing]`, `stag[e|ing]`, `prod[uction]`. Simply
add a config file with the name, to have it read only in that environment, e.g. `config/development.json`.


### Middleware

Much like configuration, you shouldn't need to write a lot of code to determine what's in your middleware chain. [meddleware](https://github.com/paypal/meddleware) is used internally to read,
resolve, and register middleware with your express application. You can either specify the middleware in your config.json or {environment}.json, (or) import it from a separate json file using the import protocol mentioned above.


### Application Security

Kraken uses [lusca](https://github.com/paypal/lusca) to secure your applications, so that you don't need to think about it. Techniques like CSRF, XFRAMES, and CSP are enabled automatically while others can be opted into. All are customizeable through configuration.


### Lifecycle Events

Kraken adds support for additional events to your express app instance:  

* `start` - the application has safely started and is ready to accept requests
* `shutdown` - the application is shutting down, no longer accepting requests
* `stop` - the http server is no longer connected or the shutdown timeout has expired



### Configuration-based `express` Settings
Since express instances are themselves config objects, the convention is to set values on the app instance for use by
express internally as well as other code across the application. kraken-js allows you to configure express via JSON.
Any properties are supported, but kraken-js defaults include:
```json
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

```json
{
    "express": {
        "view": "path:./lib/MyCustomViewResolver"
    }
}
```


### View Engine Configuration
kraken-js looks to the `view engines` config property to understand how to load and initialize renderers. The value of the
`view engines` property is an object mapping the desired file extension to engine config settings. For example:
```json
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
                "arguments": [{ "cache": false }]
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
