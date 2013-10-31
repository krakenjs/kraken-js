/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    kraken = require('../index'),
    express = require('express'),
    assert = require('chai').assert;

describe('kraken', function () {

    var delegate = {};

    describe('create', function () {

        it('should provide a `create` factory method', function () {
            var server = kraken.create('/', {});
            assert.isFunction(server.use);
            assert.isFunction(server.listen);
        });


        it('should support optional arguments', function () {
            var server = kraken.create();
            assert.isFunction(server.use);
            assert.isFunction(server.listen);
        });


        it('should expose the root application', function (next) {
            var kk = kraken.create();
            kk.listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isFunction(kk.app); // express is a function
                server.close(next);
            })
        });


        it('should accept a mount point', function (next) {
            kraken.create('/').listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept an express application', function (next) {
            kraken.create(express()).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept a mount point and express application', function (next) {
            kraken.create('/', express()).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept an app delegate', function (next) {
            kraken.create(delegate).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept a mount point and app delegate', function (next) {
            kraken.create('/', delegate).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept a kraken instance', function (next) {
            kraken.create(kraken.create()).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should accept a mount point and kraken instance', function (next) {
            kraken.create('/app', kraken.create()).listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should support complex app composition', function (next) {
            kraken.create()
                .use('/baz', delegate)
                .use('/app', kraken.create('/foo', delegate))
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
            kraken.create()
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
            kraken.create().listen(8000).then(function (server) {
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should support an optional `host`', function (next) {
            kraken.create().listen(8000, 'localhost').then(function (server) {
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should support an optional `callback`', function (next) {
            kraken.create().listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should support both `host` and `callback`', function (next) {
            kraken.create().listen(8000, 'localhost', function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
        });


        it('should not return a promise if `callback` if defined', function (next) {
            var promise = kraken.create().listen(8000, 'localhost', function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                server.close(next);
            });
            assert.isUndefined(promise);
        });

    });


    describe('isKraken', function () {

        it('should identify a kraken instance', function (next) {
            var kk = kraken.create();
            assert.ok(kraken.isKraken(kk));

            kk = kk.use('/foo', delegate);
            assert.ok(kraken.isKraken(kk));

            kk.listen(8000, function (err, server) {
                assert.isNull(err);
                assert.isObject(server);
                assert.isFalse(kraken.isKraken(server));
                assert.isFalse(kraken.isKraken(kk.app));
                server.close(next);
            });
        });

    });


});