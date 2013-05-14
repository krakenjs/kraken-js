/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    webcore = require('../index'),
    assert = require('chai').assert;

describe('webcore', function () {

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(path.join(__dirname, 'fixtures'));
    });

    var application = {

        _config: undefined,
        _methods: [],

        configure: function (config, callback) {
            this._config = config;
            config.set('foo:bar', 'baz');
            callback(null, config);
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
        webcore.start(appBadConfig, function (err, port) {
            assert.ok(err);
            assert.strictEqual(err.message, 'Config Error');
            next();
        });
    });


    it('should not allow stop prior to successful start', function (next) {
        webcore.stop(function (err) {
            assert.instanceOf(err, Error);
            next();
        });
    });


    it('should start the server', function (next) {
        webcore.start(application, function (err, port) {
            assert.ok(!err);
            assert.typeOf(port, 'number');
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
        webcore.stop(next);
    });

});


