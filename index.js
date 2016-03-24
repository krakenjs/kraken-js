/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2014 eBay Software Foundation                                │
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

function createKrakenOptions(options){
    var krakenOptions = (typeof options === 'string') ?
                            createKrakenOptions({ basedir: options }) :
                            options || {};

    krakenOptions.protocols    = krakenOptions.protocols || {};
    krakenOptions.onconfig     = krakenOptions.onconfig || noop;
    krakenOptions.mountpath    = null;
    krakenOptions.inheritViews = !!krakenOptions.inheritViews;

    return krakenOptions;
}

module.exports = function (options) {
    var app;
    var krakenOptions = createKrakenOptions(options);

    krakenOptions.basedir = krakenOptions.basedir || path.dirname(caller());

    debug('kraken options\n', krakenOptions);

    app = express();
    app.once('mount', function onmount(parent) {
        var start, error, promise;

        // Remove sacrificial express app
        parent._router.stack.pop();

        // Since this particular `app` instance is
        // subsequently deleted, the `mountpath` is
        // moved to `kraken options` for use later.
        krakenOptions.mountpath = app.mountpath;

        start = parent.emit.bind(parent, 'start');
        error = parent.emit.bind(parent, 'error');

        // Kick off server and add middleware which will block until
        // server is ready. This way we don't have to block standard
        // `listen` behavior, but failures will occur immediately.
        promise = bootstrap(parent, krakenOptions);
        promise.then(start, error);


        parent.use(function startup(req, res, next) {
            var headers = krakenOptions.startupHeaders;
            
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
