/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    http = require('http'),
    kraken = require('../index'),
    assert = require('chai').assert,
    https = require('https'),
    fs = require('fs');

describe('kraken ssl', function () {

    var cwd, config;

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        cwd = process.cwd();
        process.chdir(path.join(__dirname, 'fixtures'));
    });


    after(function () {
        process.chdir(cwd);
    });


    it('should start an https server', function (next) {
        var app, config;

        app = {
            configure: function (cfg, callback) {
                config = cfg;
                config.set('ssl', {
                    key:  fs.readFileSync('./config/ssl/key.pem'),
                    cert: fs.readFileSync('./config/ssl/cert.pem')
                });
                callback();
            }
        };

        kraken.create(app).listen(8000, function (err, server) {
            assert.isNull(err);
            assert.isObject(server);
            assert.ok(Buffer.isBuffer(server.cert));
            assert.ok(Buffer.isBuffer(server.key));
            assert.isTrue(server instanceof https.Server);

            config.set('ssl', undefined);
            server.close(next);
        });
    });

});