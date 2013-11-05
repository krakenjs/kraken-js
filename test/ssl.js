/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    http = require('http'),
    kraken = require('../index'),
    assert = require('chai').assert,
    https = require('https'),
    fs = require('fs');

describe('kraken ssl', function () {

    var cwd, config, server;

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        cwd = process.cwd();
        process.chdir(path.join(__dirname, 'fixtures'));
    });

    after(function () {
        config.set('ssl', undefined);
        server.close();
        process.chdir(cwd);
    });

    var application = {

        _config: undefined,

        configure: function (cfg, callback) {
            config = cfg;
            config.set('ssl', {
                key: fs.readFileSync('./config/ssl/key.pem'),
                cert: fs.readFileSync('./config/ssl/cert.pem')
            });
            callback();
        }

    };

    it('should start an https server', function (next) {
        kraken.create(application).listen(9000, function (err, srvr) {
            assert.isNull(err);
            assert.isObject(srvr);
            assert.isObject(srvr.cert);
            assert.isObject(srvr.key);
            assert.isTrue(srvr instanceof https.Server);
            server = srvr;
            next();
        });
    });

});