/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var webcore = require('../index'),
    http = require('http'),
    assert = require('chai').assert;


describe('view', function () {

    var application;

    var VALID_RESPONSE = '<!DOCTYPE html><html lang="en"><head><title>Hello, world</title></head><body><h1>node template test</h1></body></html>';


    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(__dirname);
    });


    afterEach(function (next) {
        webcore.stop(next);
    });


    it('should use the default view engine (dust)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('routes:routePath', ['fixtures', 'controllers']);
                config.set('viewEngine:templatePath', ['fixtures', 'public', 'templates']);
                callback(null, config);
            }
        };

        webcore.start(application, function () {
            inject(function (err, body) {
                assert.ok(!err);
                assert.strictEqual(body, VALID_RESPONSE);
                next();
            });
        });
    });


    it('should use the precompiled view engine (dust)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('routes:routePath', ['fixtures', 'controllers']);
                config.set('viewEngine:ext', 'js');
                config.set('viewEngine:templatePath', ['fixtures', 'public', 'templates']);
                callback(null, config);
            }
        };

        webcore.start(application, function () {
            inject(function (err, body) {
                assert.ok(!err);
                assert.strictEqual(body, VALID_RESPONSE);
                next();
            });
        });
    });


    it('should use the jade view engine', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('routes:routePath', ['fixtures', 'controllers']);
                config.set('viewEngine', {
                    ext: 'jade',
                    module: 'consolidate',
                    templatePath: ['fixtures', 'public', 'templates']
                });
                callback(null, config);
            }
        };

        webcore.start(application, function () {
            inject(function (err, body) {
                assert.ok(!err);
                assert.strictEqual(body, VALID_RESPONSE);
                next();
            });
        });
    });

});


function inject(callback) {
    var req = http.request({ method: 'GET', port: 8000, path:'/' }, function (res) {
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

