/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
'use strict';

var Q = require('q'),
    path = require('path'),
    http = require('http'),
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

    get app () {
        return this._app;
    },

    use: function (route, delegate) {
        var that = this, chain;

        if (typeof route !== 'string') {
            delegate = route;
            route = '/';
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
            that._app.use(route, app);
            that._app.set('x-powered-by', app.get('x-powered-by'));

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
            var deferred, server;

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

            server = http.createServer(app).listen(port, host);
            server.once('listening', resolve);
            server.once('error', reject);

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