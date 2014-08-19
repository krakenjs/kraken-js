'use strict';

process.env.NODE_ENV='_krakendev';

var test = require('tape');
var path = require('path');
var express = require('express');
var request = require('supertest');
var kraken = require('../');


test('kraken', function (t) {

    t.test('startup without options', function (t) {
        var app;

        t.plan(1);

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


    t.test('mount point', function (t) {
        var options, app, server;

        t.plan(2);

        function start() {
            t.pass('server started');
            server = request(app).get('/foo/').expect(200, 'ok', function (err) {
                t.error(err);
                t.end();
            });
        }

        function error(err) {
            t.error(err, 'server startup failed');
            t.end();
        }

        options = {
            basedir: path.join(__dirname, 'fixtures', 'mount')
        };

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use('/foo', kraken(options));
    });


    t.test('express route', function (t) {
        var options, app, server;

        t.plan(2);

        function start() {
            t.pass('server started');
            server = request(app).get('/foo/').expect(200, 'ok', function (err) {
                t.error(err);
                t.end();
            });
        }

        function error(err) {
            t.error(err, 'server startup failed');
            t.end();
        }

        options = {
            basedir: path.join(__dirname, 'fixtures', 'mount'),
            onconfig: function (settings, cb) {
                settings.set('express:mountpath', '/foo');
                cb(null, settings);
            }
        };

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken(options));
    });


    t.test('startup delay', function (t) {
        var options, app;

        t.plan(1);

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

        function start() {
            t.pass('server started');
            server = request(app).get('/').expect(404, function (err) {
                t.error(err, 'server is accepting requests');
                t.end();
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
        });
    });


    t.test('startup error', function (t) {
        var options, app;

        t.plan(1);

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
