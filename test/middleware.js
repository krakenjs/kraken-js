/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    webcore = require('../index'),
    winston = require('winston'),
    assert = require('chai').assert;

describe('middleware', function () {

    var application;

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(path.join(__dirname, 'fixtures'));
    });

    after(function (next) {
        webcore.stop(next);
    });


    it('should allow custom middleware', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('middleware:logger', {
                    module: 'express-winston',
                    transports: [new winston.transports.Console({
                        json: false,
                        colorize: true
                    })]
                });
                callback(null, config);
            }
        };

        webcore.start(application, next);
    });

});