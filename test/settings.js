'use strict';

var fs = require('fs'),
    test = require('tape'),
    path = require('path'),
    util = require('util'),
    kraken = require('../'),
    nconf = require('nconf'),
    express = require('express');

test('settings', function (t) {

    function reset() {
        nconf.stores  = {};
        nconf.sources = [];
    }

    t.test('absolute path', function (t) {
        var basedir, settings, data, orig, app;

        t.on('end', reset);

        function undo() {
            fs.writeFileSync(settings, orig);
        }

        function start() {
            undo();
            t.end();
        }

        function error(err) {
            undo();
            t.error(err);
        }

        basedir = path.join(__dirname, 'fixtures', 'settings');
        settings = path.join(basedir, 'config', 'settings.json');

        data = require(settings);
        orig = JSON.stringify(data, undefined, 4);

        data.path = 'path:' + path.join(basedir, data.path.replace('path:', ''));
        fs.writeFileSync(settings, JSON.stringify(data, undefined, 4));

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken(basedir));
    });


    t.test('file', function (t) {
        var basedir, app;

        function start() {
            var file;

            //oh noes ... this sucks that it's not a buffer
            file = app.kraken.get('file');
            file = new Buffer(file);

            t.ok(Buffer.isBuffer(file));
            t.equal(file.toString('utf8'), 'Hello, world!');
            t.end();
        }

        basedir = path.join(__dirname, 'fixtures', 'settings');

        app = express();
        app.on('start', start);
        app.on('error', t.error.bind(t));
        app.use(kraken(basedir));
    });


    t.test('base64', function (t) {
        var basedir, app;

        t.on('end', reset);

        function start() {
            var base64;

            //oh noes ... this sucks that it's not a buffer
            base64 = app.kraken.get('base64');
            base64 = new Buffer(base64);

            t.ok(Buffer.isBuffer(base64));
            t.equal(base64.toString('utf8'), 'Hello, world!');
            t.end();
        }

        basedir = path.join(__dirname, 'fixtures', 'settings');

        app = express();
        app.on('start', start);
        app.on('error', t.error.bind(t));
        app.use(kraken(basedir));
    });


    t.test('custom', function (t) {
        var options, app;

        t.on('end', reset);

        function start() {
            var custom = app.kraken.get('custom');
            t.equal(custom, 'Hello, world!');
            t.end();
        }

        options = {
            basedir: path.join(__dirname, 'fixtures', 'settings'),
            protocols: {
                custom: function (value) {
                    return util.format('Hello, %s!', value);
                }
            }
        };

        app = express();
        app.on('start', start);
        app.on('error', t.error.bind(t));
        app.use(kraken(options));
    });

});