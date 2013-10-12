/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var kreaken = require('../index'),
    http = require('http'),
    path = require('path'),
    assert = require('chai').assert;


describe('compiler', function () {

    var VALID_LOCALIZED_TEMPLATE = '(function(){dust.register("localized",body_0);function body_0(chk,ctx){return chk.write("<!DOCTYPE html><html lang=\\"en\\"><head><title>").reference(ctx.get("title"),ctx,"h").write("</title></head><body><h1>node template test</h1></body></html>");}return body_0;})();';

    var cwd, server;

    before(function (next) {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        cwd = process.cwd();
        process.chdir(path.join(__dirname, 'fixtures'));

        var application = {};
        kreaken
            .create(application)
            .listen()
            .then(function (srvr) {
                server = srvr;
            })
            .then(next, next);
    });


    after(function (next) {
        process.chdir(cwd);
        server.close(next);
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


    it('should compile a localized template', function (next) {
        inject('/templates/US/en/localized.js', function (err, body) {
            assert.ok(!err);
            assert.strictEqual(body, VALID_LOCALIZED_TEMPLATE);
            next();
        });
    });


    it('should fail on a nonexistent template', function (next) {
        inject('/templates/US/en/wat.js', function (err, body) {
            assert.ok(err);
            assert.ok(!body);
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