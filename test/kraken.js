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

    t.test('server 503 until started with custom headers', function (t) {
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
            },
            startupHeaders: {
                "Custom-Header1": "Header1",
                "Custom-Header2": "Header2"
            }
        };

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken(options));

        server = request(app).get('/')
            .expect('Custom-Header1', "Header1")
            .expect('Custom-Header2', "Header2")
            .expect(503, function (err) {
                t.error(err, 'server starting');
            });
    });


    t.test('startup error', function (t) {
        var options, app;

        t.plan(3);

        function start() {
            t.fail('server started');
            t.end();
        }

        function error(err) {
            t.ok(err, 'server startup failed');
            request(app).get('/').expect(503, 'The application failed to start.', function (err) {
                t.error(err, 'server is accepting requests');
                t.end();
            });
        }

        options = {
            onconfig: function (settings, cb) {
                setTimeout(cb.bind(null, new Error('fail')), 1000);
            }
        };

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken(options));

        request(app).get('/').expect(503, 'Server is starting.', function (err) {
            t.error(err, 'server starting');
        });
    });


    t.test('shutdown', function (t) {
        var exit, expected, app, server;

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
        app.use(kraken({ basedir: __dirname }));
        app.on('start', function () {
            app.emit('shutdown', server, 1000);
        });

        app.on('stop', function () {
            // Will fire twice because we never
            // really exit the process
            t.ok(1, 'server stopped');
        });

        // This listens on any random port the OS assigns.
        // since we don't actually connect to it for this test, we don't care which.
        //
        // See https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
        // for more information
        server = app.listen(0);
        server.timeout = 0;
    });

    t.test('shutdown headers', function (t) {
        var app, server;

        process.removeAllListeners('SIGTERM');

        app = express();
        app.use(kraken({ basedir: __dirname }));

        app.on('start', function () {

            app.removeAllListeners('shutdown');

            app.once('shutdown', function () {
                request(app).get('/').end(function (error, response) {
                    t.error(error);
                    t.equals(response.statusCode, 503, 'correct status code.');
                    t.ok(response.header['custom-header1'], 'has custom header 1.');
                    t.ok(response.headers['custom-header2'], 'has custom header 1.');
                    t.end();
                });
            });

            //need one request
            request(app).get('/').end(function (error, response) {
                t.error(error);
                t.equals(response.statusCode, 404, 'correct status code.');

                process.emit('SIGTERM');
            });
        });
    });

});
