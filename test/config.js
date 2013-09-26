/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var webcore = require('../index'),
    http = require('http'),
    path = require('path'),
    assert = require('chai').assert,
    configutil = require('../lib/util/configutil');


describe('config', function () {

    var config;

    before(function () {
        config = configutil.create(path.join(__dirname, 'fixtures'));
    });


    after(function () {
        config.reset();
        config.remove('file');
        config.remove('memory');
        config.remove('argv');
        config.remove('env');
    });


    it('should cascade properties', function () {
        var testcase = config.get('testcase');
        assert.isObject(testcase);
        assert.strictEqual(testcase.prop1, 'webcore-all');
        assert.strictEqual(testcase.prop2, 'webcore-dev');
        assert.strictEqual(testcase.prop3, 'app-all');
        assert.strictEqual(testcase.prop4, 'app-dev');
    });


    it('should check env variables for port', function () {
        var port;

        port = config.port;
        assert.strictEqual(port, 8000);

        config.set('OPENSHIFT_NODEJS_PORT', 8001);

        port = config.port;
        assert.strictEqual(port, 8001);

        config.set('OPENSHIFT_NODEJS_PORT', undefined);
    });



    it('should accept a socket instead of number for PORT', function () {
        var port, host;

        port = config.port;
        assert.strictEqual(port, 8000);

        config.set('PORT', '\\tmp\\test.sock');

        port = config.port;
        assert.strictEqual(port, '\\tmp\\test.sock');

        // If port is a socket, host is noop/undefined.
        host = config.host;
        assert.isUndefined(host);

        config.set('PORT', undefined);
    });



    it('should check env variables for host', function () {
        var host;

        host = config.host;
        assert.strictEqual(host, undefined);

        config.set('OPENSHIFT_NODEJS_IP', '127.0.0.1');

        host = config.host;
        assert.strictEqual(host, '127.0.0.1');

        config.set('OPENSHIFT_NODEJS_IP', undefined);
    });


});