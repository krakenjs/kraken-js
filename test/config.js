/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var webcore = require('../index'),
    http = require('http'),
    path = require('path'),
    assert = require('chai').assert,
    configutil = require('../lib/util/configutil');


describe('config', function () {

    var nconf, cwd, server;

    before(function (next) {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        cwd = process.cwd();
        process.chdir(path.join(__dirname, 'fixtures'));

        var application = {
            configure: function (config) {
                nconf = config;
            }
        };

        webcore
            .create(application)
            .listen()
            .then(function (srvr) {
                server = srvr;
            })
            .then(next, next);

    });


    after(function (next) {
        server.close(function () {
            process.chdir(cwd);
            nconf.reset();
            nconf.remove('file');
            nconf.remove('memory');
            nconf.remove('argv');
            nconf.remove('env');
            next();
        });
    });


    it('should cascade properties', function () {
        var testcase = nconf.get('testcase');
        assert.isObject(testcase);
        assert.strictEqual(testcase.prop1, 'webcore-all');
        assert.strictEqual(testcase.prop2, 'webcore-dev');
        assert.strictEqual(testcase.prop3, 'app-all');
        assert.strictEqual(testcase.prop4, 'app-dev');
    });


    it('should check env variables for port', function () {
        var port;

        port = configutil.getPort(nconf);
        assert.strictEqual(port, 8000);

        nconf.set('OPENSHIFT_NODEJS_PORT', 8001);

        port = configutil.getPort(nconf);
        assert.strictEqual(port, 8001);

        nconf.set('OPENSHIFT_NODEJS_PORT', undefined);
    });



    it('should accept a socket instead of number for PORT', function () {
        var port, host;

        port = configutil.getPort(nconf);
        assert.strictEqual(port, 8000);

        nconf.set('PORT', '\\tmp\\test.sock');

        port = configutil.getPort(nconf);
        assert.strictEqual(port, '\\tmp\\test.sock');

        // If port is a socket, host is noop/undefined.
        host = configutil.getHost(nconf);
        assert.isUndefined(host);

        nconf.set('PORT', undefined);
    });



    it('should check env variables for host', function () {
        var host;

        host = configutil.getHost(nconf);
        assert.strictEqual(host, undefined);

        nconf.set('OPENSHIFT_NODEJS_IP', '127.0.0.1');

        host = configutil.getHost(nconf);
        assert.strictEqual(host, '127.0.0.1');

        nconf.set('OPENSHIFT_NODEJS_IP', undefined);
    });


});