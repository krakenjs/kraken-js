/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    webcore = require('../index'),
    assert = require('chai').assert;

describe.skip('middleware', function () {

    var cwd, server;

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        cwd = process.cwd();
        process.chdir(path.join(__dirname, 'fixtures'));
    });


    after(function (next) {
        server.close(function () {
            process.chdir(cwd);
            next();
        });
    });


    it('should allow custom middleware', function (next) {
        var application = {};

        webcore.create(application).listen(8000, function (err, srvr) {
            assert.isNull(err);
            server = srvr;
            next();
        });
    });

});