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

var Q = require('q'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    appcore = require('./lib/appcore'),
    pathutil = require('./lib/util/pathutil'),
    EventEmitter = require('events').EventEmitter;


function resolveRoot() {
    var current, root;

    current = module;
    while (!root && (current = current.parent)) {
        if (exports.isKraken(current.exports)) {
            root = path.dirname(current.filename);
        }
    }

    return root || process.cwd();
}


var kraken = {

    get app() {
        return this._app;
    },

    use: function (route, delegate) {
        var that = this, chain;

        if (typeof route !== 'string') {
            delegate = route;
            route = undefined;
        }

        function create(delegate) {
            return appcore.create(delegate, pathutil.create(resolveRoot));
        }

        function assign(app) {
            // Keep a handle to the provided app. If app wasn't defined, this will get an
            // express app. If it WAS defined it's a noop. Then, if a kraken instance was provided
            // pass along its express app, otherwise pass the delegate/express.
            that._app = app;
            return exports.isKraken(delegate) ? delegate._promise : delegate;
        }

        function mount(app) {
            // Mount an app, optionally grabbing its port/host.
            that._app.use(route || app.get('route') || '/', app);
            that._app.set('x-powered-by', app.get('x-powered-by'));
            that._app.set('ssl', app.get('ssl'));

            if (!that.port) {
                // First app to declare `port` wins. `host` is gravy.
                that.port = app.get('port');
                that.host = app.get('host');
            }

            return that._app;
        }

        chain = create(this._app)
            .then(assign)
            .then(create)
            .then(mount);

        this._promise = this._promise ? this._promise.then(chain) : chain;
        return this;
    },

    listen: function (port, host, callback) {
        var that = this;

        // All args are optional, so see if callback is the first arg...
        if (typeof port === 'function') {
            callback = port;
            port = host = undefined;
        }

        // .. then see if it's the second arg.
        if (typeof host === 'function') {
            callback = host;
            host = undefined;
        }

        function bind(app) {
            var deferred, server, ssl, httpServer;

            if (port === undefined) {
                port = that.port;
                if (host === undefined) {
                    host = that.host;
                }
            }

            if (typeof port === 'string') {
                host = undefined;
            }

            deferred = Q.defer();

            function resolve() {
                server.removeListener('error', reject);
                deferred.resolve(server);
            }

            function reject(err) {
                server.removeListener('listening', resolve);
                deferred.reject(err);
            }

            ssl = app.get('ssl');

            server = ssl ? https.createServer(ssl, app) : http.createServer(app);
            server.once('listening', resolve);
            server.once('error', reject);
            httpServer = server.listen(port, host);
            app.set('kraken:server', httpServer);

            return deferred.promise;
        }

        function handleErrors(app) {
            if (!EventEmitter.listenerCount(process, 'uncaughtException')) {
                process.on('uncaughtException', function (err) {
                    console.error(new Date().toUTCString(), 'uncaughtException', err.message);
                    console.error(err.stack);
                    process.exit(1);
                });
            }
            return app;
        }

        function print(server) {
            var socket = server.address();
            console.log('Listening on %s', typeof socket === 'string' ? socket : String(socket.port));
            return server;
        }

        return this._promise
            .then(handleErrors)
            .then(bind)
            .then(print)
            .nodeify(callback);
    }

};


function create() {
    return Object.create(kraken, {
        _app: {
            enumerable: true,
            writable: true,
            value: null
        },
        _promise: {
            enumerable: true,
            writable: true,
            value: null
        },
        host: {
            enumerable: true,
            writable: true,
            value: undefined
        },
        port: {
            enumerable: true,
            writable: true,
            value: undefined
        },
        '☯': {
            // This is silly, but since a require-d app may be using
            // kraken, but the proto isn't a reference to the same
            // object, we need to have a unique identifier for the
            // `isKraken` check. (Non-enumerable.)
            value: '☯'
        }
    });
}


exports.create = function (route, delegate) {
    return create().use(route, delegate);
};


exports.isKraken = function (obj) {
    return obj && (Object.getPrototypeOf(obj) === kraken || '☯' in obj);
};



/**
 * LEGACY SUPPORT - Hey people in the future! Remove this!
 */

var SERVER;

exports.start = function (delegate, callback) {
    console.warn('`kraken.start()` is deprecated and will be removed in future versions. Use `kraken.create().listen()` instead.');

    exports.create(delegate).listen().then(function (server) {
        SERVER = server;
        callback(null, server.address().port);
    }, callback);
};


exports.stop = function (callback) {
    console.warn('`kraken.stop()` is deprecated and will be removed in future versions. Use `kraken.close()` instead.');
    SERVER && SERVER.close(function () {
        SERVER = undefined;
        callback.apply(null, arguments);
    });
};

/**
 * END LEGACY SUPPORT
 */
