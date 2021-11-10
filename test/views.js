'use strict';

process.env.NODE_ENV='_krakendev';

var test = require('tape');
var path = require('path');
var { execSync } = require('child_process');
var express = require('express');
var request = require('supertest');
var kraken = require('../');


test('views', function (t) {

    const cwd = process.cwd();
    const basedir = path.join(__dirname, 'fixtures', 'views');
    process.chdir(basedir);
    execSync('npm install --package-lock=false', { cwd: basedir });
    test.onFinish(function finish() {
        process.chdir(cwd);
    });

    t.test('renderer', function (t) {
        var app;

        function start() {
            var server;

            function done(err) {
                t.error(err);
                t.end();
            }

            server = request(app).get('/').expect(200, 'Hello, world!', done);
        }

        app = express();
        app.use(kraken(basedir));
        app.on('start', start);
        app.on('error', t.error.bind(t));

    });


    t.test('renderer with consolidate', function (t) {
        var options, app;

        function start() {
            var server;

            function done(err) {
                t.error(err);
                t.end();
            }

            server = request(app).get('/').expect(200, 'Hello, world!', done);
        }

        options = {
            basedir,
            onconfig: function (settings, cb) {
                settings.set('express:view engine', 'ejs');
                cb(null, settings);
            }
        };

        app = express();
        app.use(kraken(options));
        app.on('start', start);
        app.on('error', t.error.bind(t));

    });


    t.test('alt renderer with consolidate', function (t) {
        var options, app;

        function start() {
            var server;

            function done(err) {
                t.error(err);
                t.end();
            }

            server = request(app).get('/').expect(200, 'Hello, world!', done);
        }

        options = {
            basedir,
            onconfig: function (settings, cb) {
                settings.set('express:view engine', 'jade');
                cb(null, settings);
            }
        };

        app = express();
        app.use(kraken(options));
        app.on('start', start);
        app.on('error', t.error.bind(t));

    });


    t.test('configured renderer function', function (t) {
        var options, app;

        function start() {
            var server;

            function done(err) {
                t.error(err);
                t.end();
            }

            server = request(app).get('/').expect(200, 'Hello, world!', done);
        }

        options = {
            basedir,
            onconfig: function (settings, cb) {
                settings.set('express:view engine', 'dust');
                cb(null, settings);
            }
        };

        app = express();
        app.use(kraken(options));
        app.on('start', start);
        app.on('error', t.error.bind(t));

    });


    t.test('configured renderer factory function', function (t) {
        var options, app;

        function start() {
            var server;

            function done(err) {
                t.error(err);
                t.end();
            }

            server = request(app).get('/').expect(200, 'Hello, world!', done);
        }

        options = {
            basedir,
            onconfig: function (settings, cb) {
                settings.set('express:view engine', 'htmlx');
                cb(null, settings);
            }
        };

        app = express();
        app.use(kraken(options));
        app.on('start', start);
        app.on('error', t.error.bind(t));

    });


    t.test('configured renderer exported function', function (t) {
        var options, app;

        function start() {
            var server;

            function done(err) {
                t.error(err);
                t.end();
            }

            server = request(app).get('/').expect(200, 'Hello, world!', done);
        }

        options = {
            basedir,
            onconfig: function (settings, cb) {
                settings.set('express:view engine', 'dustx');
                cb(null, settings);
            }
        };

        app = express();
        app.use(kraken(options));
        app.on('start', start);
        app.on('error', t.error.bind(t));
    });


    t.test('custom view implementation', function (t) {
        var options, app;

        function start() {
            var server;

            function done(err) {
                t.error(err);
                t.end();
            }

            server = request(app).get('/').expect(200, 'Hello, world!', done);
        }

        options = {
            basedir,
            onconfig: function (settings, cb) {
                settings.set('express:view engine', 'custom');
                cb(null, settings);
            }
        };

        app = express();
        app.use(kraken(options));
        app.on('start', start);
        app.on('error', t.error.bind(t));
    });


    t.test('custom renderer module implementation', function (t) {
        const app = express();

        function start() {

            function done(err) {
                t.error(err);
                t.end();
            }

            const server = request(app).get('/').expect(200, 'Hello, world! [Source: index.txt]', done);
        }

        const options = {
            basedir,
            onconfig: function (settings, cb) {
                const exCfg = settings.get('express');
                exCfg['view engine'] = 'txt';
                delete exCfg['view'];
                cb(null, settings);
            }
        };

        app.use(kraken(options));
        app.on('start', start);
        app.on('error', t.error.bind(t));
    });


    t.test('built-in shim', function (t) {
        var options, app;

        function start() {
            var server;

            function done(err) {
                t.error(err);
                t.end();
            }

            server = request(app).get('/').expect(200, 'Hello, world!', done);
        }

        options = {
            basedir: path.join(__dirname, 'fixtures', 'views'),
            onconfig: function (settings, cb) {
                settings.set('express:view engine', 'jsp');
                cb(null, settings);
            }
        };

        app = express();
        app.use(kraken(options));
        app.on('start', start);
        app.on('error', t.error.bind(t));
    });


    t.test('built-in shim with precompiled templates', function (t) {
        var options, app;

        function start() {
            var server;

            function done(err) {
                t.error(err);
                t.end();
            }

            server = request(app).get('/').expect(200, 'Hello, world!', done);
        }

        options = {
            basedir: path.join(__dirname, 'fixtures', 'views'),
            onconfig: function (settings, cb) {
                settings.set('express:view engine', 'class');
                cb(null, settings);
            }
        };

        app = express();
        app.use(kraken(options));
        app.on('start', start);
        app.on('error', t.error.bind(t));
    });

});
