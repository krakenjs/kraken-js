/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    webcore = require('../index'),
    assert = require('chai').assert;

describe('webcore', function () {

    var cwd, server;

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        cwd = process.cwd();
        process.chdir(path.join(__dirname, 'fixtures'));
    });

    after(function () {
        process.chdir(cwd);
    });

    var application = {

        _config: undefined,
        _methods: [],

        configure: function (config) {
            this._config = config;
            config.set('foo:bar', 'baz');
            config.set('routes:routePath', ['controllers']);
        },

        requestStart: function () {
            this._methods.push('requestStart');
        },

        requestBeforeRoute: function () {
            this._methods.push('requestBeforeRoute');
        },

        requestAfterRoute: function () {
            this._methods.push('requestAfterRoute');
        }

    };


    var appBadConfig = {
        configure: function (config, callback) {
            callback(new Error('Config Error'));
        }
    };


    it('should error on bad configuration', function (next) {
        webcore.create(appBadConfig).listen(function (err, server) {
            assert.ok(err);
            assert.strictEqual(err.message, 'Config Error');
            next();
        });
    });


    it('should support listening on a socket', function (next) {
        process.env.PORT = '/tmp/webcore.sock';
        process.env.HOST = '127.0.0.1'; // HOST should be ignored

        webcore.create(application).listen(function (err, server) {
            var address;

            delete process.env.PORT;
            delete process.env.HOST;

            assert.isNull(err);
            assert.isObject(server);

            address = server.address();
            assert.strictEqual(address, '/tmp/webcore.sock');

            server.close(next);
        });
    });


    it('should start server on provided socket', function (next) {
        webcore.create(application).listen('/tmp/webcore2.sock', function (err, server) {
            var address;

            assert.isNull(err);
            assert.isObject(server);

            address = server.address();
            assert.strictEqual(address, '/tmp/webcore2.sock');

            server.close(next);
        });
    });


    it('should ignore host when socket is provided', function (next) {
        webcore.create(application).listen('/tmp/webcore3.sock', 'localhost', function (err, server) {
            var address;

            assert.isNull(err);
            assert.isObject(server);

            address = server.address();
            assert.strictEqual(address, '/tmp/webcore3.sock');

            server.close(next);
        });
    });


    it('should start server without optional port', function (next) {
        process.env.PORT = 8001;
        process.env.HOST = '127.0.0.1';

        webcore.create(application).listen(function (err, server) {
            var address;

            delete process.env.PORT;
            delete process.env.HOST;

            assert.isNull(err);
            assert.isObject(server);

            address = server.address();
            assert.strictEqual(address.port, 8001);
            assert.strictEqual(address.address, '127.0.0.1');

            server.close(next);
        });
    });


    it('should start the server', function (next) {
        webcore.create(application).listen(8000, function (err, srvr) {
            assert.isNull(err);
            assert.isObject(srvr);
            server = srvr;
            next();
        });
    });


    it('should have read custom configuration', function () {
        assert.typeOf(application._config, 'object');
        assert.strictEqual(application._config.get('foo:bar'), 'baz');
    });


    it('should have invoked lifecycle functions', function () {
        var invoked = application._methods;
        assert.ok(~invoked.indexOf('requestStart'));
        assert.ok(~invoked.indexOf('requestBeforeRoute'));
        assert.ok(~invoked.indexOf('requestAfterRoute'));
    });


    it('should run 5 seconds', function (next) {
        setTimeout(next, 5000);
    });


    it('should shutdown the server', function (next) {
        server.close(next);
    });

});


