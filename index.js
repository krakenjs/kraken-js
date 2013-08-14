'use strict';

var Q = require('q'),
    appcore = require('./lib/appcore'),
    EventEmitter = require('events').EventEmitter;


var webcore = {

    get app () {
        return this._app;
    },

    use: function (route, delegate) {
        var that = this, chain;

        if (typeof route !== 'string') {
            delegate = route;
            route = '/';
        }

        function assign(app) {
            // Keep a handle to the provided app. If app wasn't defined, this will get an
            // express app. If it WAS defined it's a noop. Then, if a webcore instance was provided
            // pass along its express app, otherwise pass the delegate/express.
            that._app = app;
            return exports.isWebcore(delegate) ? delegate.app : delegate;
        }

        function mount(app) {
            // Mount an app, optionally grabbing its port/host.
            that._app.use(route, app);

            if (!that.port) {
                // First app to declare `port` wins. `host` is gravy.
                that.port = app.get('port');
                that.host = app.get('host');
            }

            return that._app;
        }

        chain = appcore.create(this._app)
            .then(assign)
            .then(appcore.create)
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

            server = app.listen(port, host);
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

        return this._promise
            .then(handleErrors)
            .then(bind)
            .nodeify(callback);
    }

};


function create() {
    return Object.create(webcore, {
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
        }
    });
}


exports.create = function (route, delegate) {
    return create().use(route, delegate);
};


exports.isWebcore = function (obj) {
    return obj && Object.getPrototypeOf(obj) === webcore;
};



/**
 * LEGACY SUPPORT - Hey people in the future! Remove this!
 */

var SERVER;

exports.start = function (delegate, callback) {
    console.warn('`webcore.start()` is deprecated and will be removed in future versions. Use `webcore.create().listen()` instead.');

    exports.create(delegate).listen().then(function (server) {
        SERVER = server;
        callback(null, server.address().port);
    }, callback);
};


exports.stop = function (callback) {
    console.warn('`webcore.stop()` is deprecated and will be removed in future versions. Use `server.close()` instead.');
    SERVER && SERVER.close(function () {
        SERVER = undefined;
        callback.apply(null, arguments);
    });
};

/**
 * END LEGACY SUPPORT
 */