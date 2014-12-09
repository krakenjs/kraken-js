'use strict';

var express = require('express');
var kraken = require('../../../../../');


module.exports = function (options) {
    var app;
    app = express();
    app.use(kraken({
        inheritViews: options.inheritViews,
        onconfig: function (config, next) {
            // disable favicon to suppress config error caused my fixtures.
            config.set('middleware:favicon', null);
            next(null, config);
        }
    }));
    app.on('mount', options.onmount);
    app.on('start', options.onstart);
    return app;
};