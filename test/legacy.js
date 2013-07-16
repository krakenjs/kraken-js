/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    webcore = require('../index'),
    assert = require('chai').assert;

describe('legacy', function () {

    var cwd;

    before(function () {
        cwd = process.cwd();
        process.chdir(path.join(__dirname, 'fixtures'));
    });

    after(function () {
        process.chdir(cwd);
    });


    it('should support the legacy API', function (next) {
        webcore.start({}, function (err, port) {
            assert.isNull(err);
            assert.isNumber(port);
            webcore.stop(next);
        });
    });


});