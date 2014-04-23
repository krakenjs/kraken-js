'use strict';

var test = require('tape'),
    path = require('path'),
    kraken = require('../'),
    express = require('express'),
    request = require('supertest');


test('views', function (t) {


    t.test('renderer', function (t) {
        var basedir, app;

        function start() {
            var server;

            function done(err) {
                t.error(err);
                t.end();
            }

            server = request(app).get('/').expect(200, 'Hello, world!', done);
        }

        basedir = path.join(__dirname, 'fixtures', 'views');

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
            basedir: path.join(__dirname, 'fixtures', 'views'),
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
            basedir: path.join(__dirname, 'fixtures', 'views'),
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
            basedir: path.join(__dirname, 'fixtures', 'views'),
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
            basedir: path.join(__dirname, 'fixtures', 'views'),
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
            basedir: path.join(__dirname, 'fixtures', 'views'),
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
            basedir: path.join(__dirname, 'fixtures', 'views'),
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