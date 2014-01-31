'use strict';

var test = require('tape'),
    kraken = require('../'),
    nconf = require('nconf'),
    express = require('express'),
    request = require('supertest');



test('kraken', function (t) {

    function reset() {
        nconf.stores  = {};
        nconf.sources = [];
    }

    t.test('startup without options', function (t) {
        var app;

        t.plan(1);
        t.on('end', reset);

        function start() {
            t.pass('server started');
        }

        function error(err) {
            t.error(err, 'server startup failed');
        }

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken());
    });


    t.test('startup with basedir', function (t) {
        var app;

        t.plan(1);
        t.on('end', reset);

        function start() {
            t.pass('server started');
        }

        function error(err) {
            t.error(err, 'server startup failed');
        }

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken(__dirname));
    });


    t.test('startup with options', function (t) {
        var app;

        t.plan(1);
        t.on('end', reset);

        function start() {
            t.pass('server started');
        }

        function error(err) {
            t.error(err, 'server startup failed');
        }

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken({ basedir: __dirname }));
    });


    t.test('startup delay', function (t) {
        var options, app;

        t.plan(1);
        t.on('end', reset);

        function start() {
            t.pass('server started');
            t.end();
        }

        function error(err) {
            t.error(err, 'server startup failed');
            t.end();
        }

        options = {
            onconfig: function (settings, cb) {
                setTimeout(cb.bind(null, null, settings), 1000);
            }
        };

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken(options));
    });


    t.test('server 503 until started', function (t) {
        var options, app, server;

        t.plan(3);
        t.on('end', reset);

        function start() {
            t.pass('server started');
            server = request(app).get('/').expect(404, function (err) {
                t.error(err, 'server is accepting requests');
                server.app.close(t.end.bind(t));
            });
        }

        function error(err) {
            t.error(err, 'server startup failed');
            t.end();
        }

        options = {
            onconfig: function (settings, cb) {
                setTimeout(cb.bind(null, null, settings), 1000);
            }
        };

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken(options));

        server = request(app).get('/').expect(503, function (err) {
            t.error(err, 'server starting');
            server.app.close();
        });
    });


    t.test('startup error', function (t) {
        var options, app;

        t.plan(1);
        t.on('end', reset);

        function start() {
            t.fail('server started');
            t.end();
        }

        function error(err) {
            t.ok(err, 'server startup failed');
            t.end();
        }

        options = {
            onconfig: function (settings, cb) {
                var error = new Error('fail');
                setImmediate(cb.bind(null, error));
            }
        };

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken(options));
    });


    t.test('shutdown', function (t) {
        var exit, expected, app, server;

        t.plan(4);
        t.on('end', reset);

        exit = process.exit;
        expected = 0;

        process.exit = function (code) {
            t.equals(code, expected, 'correct exit code');
            expected += 1;

            if (expected === 2) {
                process.exit = exit;
                t.end();
            }
        };

        app = express();
        app.use(kraken());
        app.on('start', function () {
            app.emit('shutdown', server, 1000);
        });

        app.on('stop', function () {
            // Will fire twice because we never
            // really exit the process
            t.ok(1, 'server stopped');
        });

        server = app.listen(8000);
        server.timeout = 0;
    });

});