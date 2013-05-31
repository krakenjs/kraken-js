/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    webcore = require('../index'),
    http = require('http'),
    assert = require('chai').assert,
    i18n = require('webcore-i18n');


describe('view', function () {

    var application;

    var VALID_RESPONSE = '<!DOCTYPE html><html lang="en"><head><title>Hello, world</title></head><body><h1>node template test</h1></body></html>';


    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(path.join(__dirname, 'fixtures'));
    });


    afterEach(function (next) {
        webcore.stop(next);
    });


    it('should use the default view engine (dust)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('viewEngine:templatePath', ['public', 'templates']);
                callback(null, config);
            }
        };

        webcore.start(application, function () {
            inject('/', function (err, body) {
                assert.ok(!err);
                assert.strictEqual(body, VALID_RESPONSE);
                next();
            });
        });
    });


    it('should localize using the default view engine (dust)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('viewEngine:templatePath', ['public', 'templates']);
                config.set('i18n:contentPath', ['locales']);
                callback(null, config);
            }
        };

        webcore.start(application, function () {
            inject('/localized', function (err, body) {
                assert.ok(!err);
                assert.strictEqual(body, VALID_RESPONSE);
                next();
            });
        });
    });


    it('should use the precompiled view engine (dust)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('viewEngine:ext', 'js');
                config.set('viewEngine:templatePath', ['.build', 'templates']);
                callback(null, config);
            }
        };

        webcore.start(application, function () {
            inject('/', function (err, body) {
                assert.ok(!err);
                assert.strictEqual(body, VALID_RESPONSE);
                next();
            });
        });
    });


    it('should localize using the precompiled view engine (dust)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('viewEngine:ext', 'js');
                config.set('viewEngine:templatePath', ['.build', 'templates']);
                callback(null, config);
            }
        };

        webcore.start(application, function () {
            inject('/localized', function (err, body) {
                err && console.log(err.message);
                assert.ok(!err);
                assert.strictEqual(body, VALID_RESPONSE);
                next();
            });
        });
    });


    it('should support cached views', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('viewEngine:ext', 'js');
                config.set('viewEngine:templatePath', ['.build', 'templates']);
                config.set('viewEngine:cache')
                callback(null, config);
            }
        };

        webcore.start(application, function () {
            inject('/localized', function (err, body) {
                err && console.log(err.message);
                assert.ok(!err);
                assert.strictEqual(body, VALID_RESPONSE);
                next();
            });
        });
    });


    it('should use the jade view engine', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('viewEngine', {
                    ext: 'jade',
                    module: 'consolidate',
                    templatePath: ['public', 'templates']
                });
                callback(null, config);
            }
        };

        webcore.start(application, function () {
            inject('/', function (err, body) {
                assert.ok(!err);
                assert.strictEqual(body, VALID_RESPONSE);
                next();
            });
        });
    });

});


function inject(path, callback) {
    var req = http.request({ method: 'GET', port: 8000, path: path }, function (res) {
        var data = [];

        res.on('data', function (chunk) {
            data.push(chunk)
        });

        res.on('end', function () {
            var body = Buffer.concat(data).toString('utf8');
            if (res.statusCode !== 200) {
                callback(new Error(body));
                return;
            }
            callback(null, body);
        });
    });
    req.on('error', callback);
    req.end();
}

