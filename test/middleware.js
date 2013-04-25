/*global describe:false, it:false, before:false, after:false*/
'use strict';

var webcore = require('../index'),
    assert = require('chai').assert;

describe('middleware', function () {

    var application;

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(__dirname);
    });

    after(function (next) {
        webcore.stop(next);
    });

    it('should allow custom middleware', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('routes:routePath', ['fixtures', 'controllers']);

                config.set('middleware:logger', {
                    module: 'express-winston',
                    transports: [{}]
                });
                callback(null, config);
            }
        };

        webcore.start(application, next);
    });

});