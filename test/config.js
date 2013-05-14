/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var webcore = require('../index'),
    http = require('http'),
    path = require('path'),
    assert = require('chai').assert;


describe('config', function () {

    var nconf;

    before(function (next) {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(path.join(__dirname, 'fixtures'));

        var application = {
            configure: function (config, callback) {
                nconf = config;
                callback(null, config);
            }
        };
        webcore.start(application, next);
    });


    after(function (next) {
//        nconf.reset();
//        nconf.remove('file');
//        nconf.remove('memory');
//        nconf.remove('argv');
//        nconf.remove('env');
        webcore.stop(next);
    });


    it('should cascade properties', function () {
        var testcase = nconf.get('testcase');
        assert.isObject(testcase);
        assert.strictEqual(testcase.prop1, 'webcore-all');
        assert.strictEqual(testcase.prop2, 'webcore-dev');
        assert.strictEqual(testcase.prop3, 'app-all');
        assert.strictEqual(testcase.prop4, 'app-dev');
    });


});