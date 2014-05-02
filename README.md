# Kraken.js

Kraken builds upon [express](http://expressjs.com/) and enables environment-aware and dynamic configuration, advanced middleware capabilities, application security, and lifecycle events.


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

All kraken-js configuration settings are optional.

- `basedir` (*String*, optional) - specify the working directory for kraken-js to use.
- `onconfig` (*Function*, optional) - provides an asynchronous hook for loading additional configuration. Signature: `function (config, cb) { /* ... */ }`
- `protocols` (*Object*, optional) - protocol implementations for use when processing configuration. For more information on protocols see [shortstop](https://github.com/paypal/shortstop).
- `uncaughtException` (*Function*, optional) - Handler for `uncaughtException` errors. See the [endgame](https://github.com/totherik/endgame) module for defaults.


## Features


### Configuration


#### Environment-aware

Using environment suffixes, configuration files are applied and overridden according to the current environment as set
by `NODE_ENV`. The application looks for a `./config` directory relative to the basedir and looks for `config.json` as the baseline config specification. JSON files matching the current env are processed and loaded. Additionally, JSON configuration files may contain comments.

Valid `NODE_ENV` values are `undefined` or `dev[elopment]`, `test[ing]`, `stag[e|ing]`, `prod[uction]`. Simply
add a config file with the name, to have it read only in that environment, e.g. `config/development.json`.


#### Dynamic Values
Powered by [shortstop](https://github.com/paypal/shortstop), configuration files can contain values that are resolved at runtime.
Default shortstop protocol handlers include:
- `path:{path}` - resolves the provided value against the application `basedir`.
- `file:{path}` - loads the contents of the specified file.
- `base64:{data}` - converts the base64-encoded value to a buffer.
- `import:{path}` - imports a config file with the name eg. `import:./specialization.json`
- `config:{replace.with.key.value} - substitutes the config value from the root of the config residing in replace.with.key.value

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
