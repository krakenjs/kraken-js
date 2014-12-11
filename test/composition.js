'use strict';

process.env.NODE_ENV='_krakendev';

var test = require('tape');
var path = require('path');
var express = require('express');
var request = require('supertest');
var kraken = require('../');


test('composition', function (t) {

    var SETTINGS = [ 'x-powered-by', 'etag', 'env', 'query parser', 'subdomain offset', 'trust proxy',
                     'jsonp callback name', 'case sensitive routing', 'strict routing', 'query parser fn'];

    t.test('plugin', function (t) {
        var args, options, parent;

        args = {
            onstart: function onstart() {
                var child;

                child = this;

                // Compare settings to ensure they are inherited correctly.
                t.notEqual(child.get('views'), parent.get('views'));
                t.notEqual(child.kraken.get('express:views'), parent.kraken.get('express:views'));
                SETTINGS.forEach(function (name) {
                    t.equal(child.get(name), parent.get(name), 'Expected \'' + name + '\' to be equal.');
                });

                request(parent)
                    .get('/')
                    .expect(200)
                    .expect('Hello, world!', function done(err) {
                        t.error(err);
                        t.end();
                    });
            },
            onmount: Function.prototype
        };

        options = {
            basedir: path.join(__dirname, 'fixtures', 'settings'),
            onconfig: function (config, next) {
                config.set('middleware:plugin', {
                    enabled: true,
                    priority: 119,
                    module: {
                        name: path.join(__dirname, 'fixtures', 'settings', 'lib', 'plugin'),
                        arguments: [args]
                    }
                });
                next(null, config);
            }
        };

        parent = express();
        parent.use(kraken(options));
        parent.on('error', t.error.bind(t));
    });


    t.test('plugin with mountpath', function (t) {
        var args, options, parent;

        args = {
            onstart: function onstart() {
                var child;

                child = this;

                // Compare settings to ensure they are inherited correctly.
                t.notEqual(child.get('views'), parent.get('views'));
                t.notEqual(child.kraken.get('express:views'), parent.kraken.get('express:views'));
                SETTINGS.forEach(function (name) {
                    t.equal(child.get(name), parent.get(name), 'Expected \'' + name + '\' to be equal.');
                });

                request(parent)
                    .get('/plugin')
                    .expect(200)
                    .expect('Hello, world!', function done(err) {
                        t.error(err);
                        t.end();
                    });
            },
            onmount: Function.prototype
        };

        options = {
            basedir: path.join(__dirname, 'fixtures', 'settings'),
            onconfig: function (config, next) {
                config.set('middleware:plugin', {
                    enabled: true,
                    priority: 119,
                    route: '/plugin',
                    module: {
                        name: path.join(__dirname, 'fixtures', 'settings', 'lib', 'plugin'),
                        arguments: [args]
                    }
                });
                next(null, config);
            }
        };

        parent = express();
        parent.use(kraken(options));
        parent.on('error', t.error.bind(t));
    });


    t.test('inherited views', function (t) {
        var args, options, parent;

        args = {
            onstart: function onstart() {
                var child;

                child = this;

                // Compare settings to ensure they are inherited correctly.
                t.equal(child.get('views'), parent.get('views'));
                t.equal(child.kraken.get('express:views'), parent.kraken.get('express:views'));
                SETTINGS.forEach(function (name) {
                    t.equal(child.get(name), parent.get(name), 'Expected \'' + name + '\' to be equal.');
                });

                request(parent)
                    .get('/plugin')
                    .expect(200)
                    .expect('Hello, world!', function done(err) {
                        t.error(err);
                        t.end();
                    });
            },
            onmount: Function.prototype,
            inheritViews: true
        };

        options = {
            basedir: path.join(__dirname, 'fixtures', 'settings'),
            onconfig: function (config, next) {
                config.set('middleware:plugin', {
                    enabled: true,
                    priority: 119,
                    route: '/plugin',
                    module: {
                        name: path.join(__dirname, 'fixtures', 'settings', 'lib', 'plugin'),
                        arguments: [args]
                    }
                });
                next(null, config);
            }
        };

        parent = express();
        parent.use(kraken(options));
        parent.on('error', t.error.bind(t));
    });


    t.test('late mounting', function () {
        var args, factory, parent;

        args = {
            onstart: function onstart() {

                // After the child has started, mount the application and make requests.
                parent = express();
                parent.use('/plugin', this);

                request(parent)
                    .get('/plugin')
                    .expect(200)
                    .expect('Hello, world!', function done(err) {
                        t.error(err);
                        t.end();
                    });
            },
            onmount: function (parent) {
                // Compare settings to ensure they are inherited correctly.
                // Not checking all settings because child kraken app intentionally
                // overrides some settings by default.
                t.notEqual(this.get('views'), parent.get('views'));
                t.notEqual(this.kraken.get('express:views'), parent.get('views'));
            }
        };

        factory = require('./fixtures/settings/lib/plugin');
        factory(args);
    });

});