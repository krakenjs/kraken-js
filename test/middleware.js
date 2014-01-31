'use strict';

var test = require('tape'),
    path = require('path'),
    kraken = require('../'),
    nconf = require('nconf'),
    express = require('express'),
    request = require('supertest');

test('middleware', function (t) {

    function reset() {
        nconf.stores  = {};
        nconf.sources = [];
    }

    t.test('no config', function (t) {
        var options, app;

        t.on('end', reset);


        options = {
            basedir: path.join(__dirname, 'fixtures', 'middleware'),
            onconfig: function (settings, cb) {
                settings.set('middleware', null);
                cb(null, settings);
            }
        };

        app = express();
        app.on('start', t.end.bind(t));
        app.on('error', t.error.bind(t));
        app.use(kraken(options));
    });


    t.test('multipart', function (t) {
        var basedir, app, file, server;

        t.plan(8);
        t.on('end', reset);

        function start() {
            var file;

            t.pass('server started');

            file = path.join(__dirname, 'fixtures', 'middleware', 'public', 'img', 'lazerz.jpg');
            server = request(app).post('/').attach('file', file).expect(200, function (err) {
                // support for multipart requests
                t.error(err, 'server is accepting requests');
                server.app.close();

                // trololol
                server = request(app).get('/').expect(200, function (err) {
                    // support for non-multipart requests
                    t.error(err);
                    server.app.close(t.end.bind(t));
                });
            });
        }

        function error(err) {
            t.error(err, 'server startup failed');
            t.end();
        }

        basedir = path.join(__dirname, 'fixtures', 'middleware');

        app = express();
        app.on('start', start);
        app.on('error', error);
        app.use(kraken(basedir));

        app.get('/', function standard(req, res) {
            res.send(200);
        });

        app.post('/', function multipart(req, res) {
            t.ok(~req.headers['content-type'].indexOf('multipart/form-data'));
            t.equal(typeof req.body, 'object');
            t.equal(typeof req.files, 'object');
            t.equal(typeof req.files.file, 'object');
            t.equal(req.files.file.name, 'lazerz.jpg');
            res.send(200);
        });
    });

});