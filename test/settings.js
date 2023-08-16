'use strict';

process.env.NODE_ENV='_krakendev';

var test = require('tape');
var path = require('path');
var util = require('util');
var express = require('express');
var request = require('supertest');
var kraken = require('../');


test('settings', function (t) {

    t.test('custom', function (t) {
        var options, app;

        function start() {
            var foo = app.kraken.get('foo'),
                click = app.kraken.get('click'),
                custom = app.kraken.get('custom');
            t.equal(foo, 'baz');
            t.equal(click, 'clack');
            t.equal(custom, 'Hello, world!');
            t.deepEqual(app.kraken.get('nestedA:nestedB:seasonals'), [ 'spring', 'autumn', 'summer', 'winter' ]);
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


    t.test('should resolve from config (shortstop-resolve)', function (t) {
      var options, app, basedir;

      basedir = path.join(__dirname, 'fixtures', 'settings');

      function onconfig(config, cb) {
        var faviconPath = config.get('middleware:favicon:module:arguments')[0];
        t.equal(faviconPath, path.join(basedir, 'node_modules', 'favicon', 'icon.ico'));
        t.end();
      }

      app = express();
      app.use(kraken({
        basedir: basedir,
        onconfig: onconfig
      }));
    });


    t.test('should not clobber `trust proxy fn`', function (t) {
        // bug introduced by:
        // visionmedia/express@566720
        // expressjs/proxy-addr@7a7a7e
        var options, app;

        function start() {
            request(app)
                .get('/ip')
                .expect(201, function done(err) {
                    t.error(err);
                    t.end();
                });
        }

        options = {
            basedir: path.join(__dirname, 'fixtures', 'settings'),
            onconfig: function (settings, cb) {
                settings.set('express:trust proxy', false);
                cb(null, settings);
            }
        };

        app = express();
        app.use(kraken(options));
        app.on('start', start);
        app.on('error', t.error.bind(t));

    });

    t.test('should accept confit options', function (t) {
      var options, app, basedir;

      process.env.krakenjs_test_settings_should_accept_confit_options = 'foo';

      function onconfig(config, cb) {
        var ignoredEnvVar = config.get('krakenjs_test_settings_should_accept_confit_options');
        t.equal(ignoredEnvVar, undefined);
        t.end();
      }

      app = express();
      app.use(kraken({
        basedir: path.join(__dirname, 'fixtures', 'settings'),
        onconfig: onconfig,
        confit: {
            envignore: ['krakenjs_test_settings_should_accept_confit_options']
        }
      }));
    });
});
