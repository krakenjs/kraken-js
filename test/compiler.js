/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var webcore = require('../index'),
    http = require('http'),
    path = require('path'),
    assert = require('chai').assert;


describe('compiler', function () {

    before(function (next) {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(path.join(__dirname, 'fixtures'));

        var application = {
            configure: function (config, callback) {
                callback(null, config);
            }
        };
        webcore.start(application, next);
    });


    after(function (next) {
        webcore.stop(next);
    });


    it('should compile a template', function (next) {
        inject('/templates/index.js', function (err, data) {
            assert.ok(!err);
            assert.ok(data);
            next();
        });
    });


    it('should compile a namespaced template', function (next) {
        inject('/templates/inc/partial.js', function (err, data) {
            assert.ok(!err);
            assert.ok(data);
            next();
        });
    });


    it('should load javascript', function (next) {
        inject('/js/main.js', function (err, data) {
            assert.ok(!err);
            assert.ok(data);
            next();
        });
    });

//    it.skip('should invoke r.js for javascript', function (next) {
//        inject('/js/main.js', function (err, data) {
//            assert.ok(!err);
//            assert.ok(data);
//            next();
//        });
//    });


    it('should compile less to css', function (next) {
        inject('/css/app.css', function (err, data) {
            assert.ok(!err);
            assert.ok(data);
            next();
        });
    });

    it('should compile less files in nested directories', function (next) {
        inject('/css/inc/colors.css', function (err, data) {
            assert.ok(!err);
            assert.ok(data);
            next();
        });
    });


    it('should copy unhandled files', function (next) {
        inject('/img/nyan.jpg', function (err, data) {
            assert.ok(!err);
            assert.ok(data);
            next();
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