/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    webcore = require('../index'),
    express = require('express'),
    assert = require('chai').assert;

describe('webcore', function () {

    var config;

    var delegate = {
        configure: function (nconf, callback) {
            nconf.set('routes:routePath', path.join('test', 'fixtures', 'controllers'));
            config = nconf;
            callback();
        }
    };

    after(function () {
        config.set('routes:routePath', undefined);
    });

    describe('create', function () {

        it('should provide a `create` factory method', function () {
            var server = webcore.create('/', {});
            assert.isFunction(server.use);
            assert.isFunction(server.listen);
        });


        it('should support optional arguments', function () {
            var server = webcore.create();
            assert.isFunction(server.use);
            assert.isFunction(server.listen);
        });


        it('should expose the root application', function (next) {
            var wc = webcore.create();
            wc.listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isFunction(wc.app); // express is a function
                server.close(next);
            })
        });


        it('should accept a mount point', function (next) {
            webcore.create('/').listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept an express application', function (next) {
            webcore.create(express()).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept a mount point and express application', function (next) {
            webcore.create('/', express()).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept an app delegate', function (next) {
            webcore.create(delegate).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept a mount point and app delegate', function (next) {
            webcore.create('/', delegate).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept a webcore instance', function (next) {
            webcore.create(webcore.create()).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept a mount point and webcore instance', function (next) {
            webcore.create('/app', webcore.create()).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should support complex app composition', function (next) {
            webcore.create()
                .use('/baz', delegate)
                .use('/app', webcore.create('/foo', delegate))
                .use('/bam', express())
                .listen(8000, function (err, server) {
                    assert.isNull(err);
                    assert.isObject(server);
                    server.close(next);
                });
        });

    });


    describe('use', function () {

        it('should allow chaining of mounted applications', function (next) {
            webcore.create()
                .use('/foo')
                .use('/bar')
                .listen(8000, function (err, server) {
                    assert.isNull(err);
                    assert.isObject(server);
                    server.close(next);
                });
        });

    });


    describe('listen', function () {

        it('should support no optional arguments', function (next) {
            webcore.create().listen(8000).then(function (server) {
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should support an optional `host`', function (next) {
            webcore.create().listen(8000, 'localhost').then(function (server) {
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should support an optional `callback`', function (next) {
            webcore.create().listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should support both `host` and `callback`', function (next) {
            webcore.create().listen(8000, 'localhost', function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should not return a promise if `callback` if defined', function (next) {
            var promise = webcore.create().listen(8000, 'localhost', function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
            assert.isUndefined(promise);
        });

    });


    describe('isWebcore', function () {

        it('should identify a webcore instance', function (next) {
            var wc = webcore.create();
            assert.ok(webcore.isWebcore(wc));

            wc = wc.use('/foo', delegate);
            assert.ok(webcore.isWebcore(wc));

            wc.listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                assert.isFalse(webcore.isWebcore(server));
                assert.isFalse(webcore.isWebcore(wc.app));
                server.close(next);
            });
        });

    });


});