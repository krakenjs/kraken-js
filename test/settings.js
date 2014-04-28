'use strict';

var fs = require('fs');
var test = require('tape');
var path = require('path');
var util = require('util');
var express = require('express');
var kraken = require('../');


test('settings', function (t) {

    t.test('custom', function (t) {
        var options, app;

        function start() {
            var foo = app.kraken.get('foo'),
                click = app.kraken.get('click'),
                custom = app.kraken.get('custom');
            t.equal(foo, 'baz');
            t.equal(click, 'clack');
            t.equal(custom, 'Hello, world!');
            t.deepEqual(app.kraken.get('nestedA:nestedB:seasonals'), [ 'spring', 'autumn', 'summer', 'winter' ]);
            t.end();
        }

        options = {
            basedir: path.join(__dirname, 'fixtures', 'settings'),
            protocols: {
                custom: function (value) {
                    return util.format('Hello, %s!', value);
                }
            }
        };

        app = express();
        app.on('start', start);
        app.on('error', t.error.bind(t));
        app.use(kraken(options));
    });

});