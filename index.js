/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright 2016 PayPal                                                      │
 │                                                                             │
 │hh ,'""`.                                                                    │
 │  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
 │  |(@)(@)|  you may not use this file except in compliance with the License. │
 │  )  __  (  You may obtain a copy of the License at                          │
 │ /,'))((`.\                                                                  │
 │(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
 │ `\ `)(' /'                                                                  │
 │                                                                             │
 │   Unless required by applicable law or agreed to in writing, software       │
 │   distributed under the License is distributed on an "AS IS" BASIS,         │
 │   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
 │   See the License for the specific language governing permissions and       │
 │   limitations under the License.                                            │
 \*───────────────────────────────────────────────────────────────────────────*/
'use strict';

var path = require('path');
var caller = require('caller');
var express = require('express');
var bootstrap = require('./lib/bootstrap');
var debug = require('debuglog')('kraken');


function noop(obj, cb) {
    cb(null, obj);
}


module.exports = function (options) {
    var app;

    if (typeof options === 'string') {
        options = { basedir: options };
    }

    options = options || {};
    options.protocols    = options.protocols || {};
    options.onconfig     = options.onconfig || noop;
    options.basedir      = options.basedir || path.dirname(caller());
    options.mountpath    = null;
    options.inheritViews = !!options.inheritViews;

    debug('kraken options\n', options);

    app = express();
    app.once('mount', function onmount(parent) {
        var start, error, promise;

        // Remove sacrificial express app
        parent._router.stack.pop();

        // Since this particular `app` instance is
        // subsequently deleted, the `mountpath` is
        // moved to `options` for use later.
        options.mountpath = app.mountpath;

        start = parent.emit.bind(parent, 'start');
        error = parent.emit.bind(parent, 'error');

        // Kick off server and add middleware which will block until
        // server is ready. This way we don't have to block standard
        // `listen` behavior, but failures will occur immediately.
        promise = bootstrap(parent, options);
        promise.then(start, error);


        parent.use(function startup(req, res, next) {
            var headers = options.startupHeaders;
            
            if (promise.isPending()) {
                res.status(503);
                if (headers) {
                    res.header(headers);
                }
                res.send('Server is starting.');
                return;
            }

            if (promise.isRejected()) {
                res.status(503);
                res.send('The application failed to start.');
                return;
            }

            next();
        });
    });

    return app;
};
