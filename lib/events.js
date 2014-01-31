'use strict';

var debug = require('debuglog')('kraken/events');

module.exports = function events(app) {

    var timer;

    app.on('shutdown', function onshutdown(server, timeout) {
        var stop, ok, err;

        stop = function (code) {
            app.emit('stop');
            process.exit(code);
        };

        ok = stop.bind(null, 0);
        err = stop.bind(null, 1);

        debug('process shutting down');
        server.close(ok);
        clearTimeout(timer);
        timer = setTimeout(err, timeout);
    });

    return app;
};