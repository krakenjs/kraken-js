'use strict';

var Q = require('q'),
    views = require('./views'),
    endgame = require('endgame'),
    events = require('./events'),
    settings = require('./settings'),
    middleware = require('./middleware'),
    debug = require('debuglog')('kraken/bootstrap');


function complete() {
    debug('init complete');
}


module.exports = function (app, options) {

    endgame(options.uncaughtException);

    return Q(settings).fapply(arguments)
        .then(views)
        .then(middleware)
        .then(events)
        .then(complete);
};