/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    kraken = require('../index'),
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
        kraken.start({}, function (err, port) {
            assert.isNull(err);
            assert.isNumber(port);
            kraken.stop(next);
        });
    });


});