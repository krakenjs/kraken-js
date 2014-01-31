'use strict';

var Q = require('q'),
    path = require('path'),
    caller = require('caller'),
    express = require('express'),
    bootstrap = require('./lib/bootstrap'),
    debug = require('debuglog')('kraken');


function noop(obj, cb) {
    cb(null, obj);
}


module.exports = function (options) {
    var app;

    if (typeof options === 'string') {
        options = { basedir: options };
    }

    options = options || {};
    options.protocols = options.protocols || {};
    options.onconfig  = options.onconfig || noop;
    options.basedir   = options.basedir || path.dirname(caller());

    debug('kraken options\n', options);

    app = express();
    app.once('mount', function onmount(parent) {
        var deferred, complete, start, error;

        // Remove sacrificial express app
        parent.stack.pop();

        deferred = Q.defer();
        complete = deferred.resolve.bind(deferred);
        start = parent.emit.bind(parent, 'start');
        error = parent.emit.bind(parent, 'error');

        // Kick off server and add middleware which will block until
        // server is ready. This way we don't have to block standard
        // `listen` behavior, but failures will occur immediately.
        bootstrap(parent, options)
            .then(complete)
            .then(start)
            .catch(error)
            .done();

        parent.use(function startup(req, res, next) {
            if (deferred.promise.isFulfilled()) {
                next();
                return;
            }
            res.send(503, 'Server is starting.');
        });
    });

    return app;
};