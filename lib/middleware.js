'use strict';

var express = require('express');


function tryRequire(moduleName, fallback) {
    var result;
    try {
        result = moduleName && require(moduleName);
    } catch (err) {
        // noop
    }
    return result || fallback;
}


// It's possible for clients to define middleware by name or fall back to a default as defined
// by webcore. This takes advantage of node module lookup rules, thus will use the module
// available in the parent module as it won't be available in the current module.
exports.logger = function (settings) {
    var override = tryRequire(settings && settings.module, express.logger);
    if (typeof override === 'object' && typeof override.logger === 'function') {
        override = override.logger;
    }
    return override(settings);
};


exports.session = function (settings) {
    return tryRequire(settings && settings.module, express.session)(settings);
};


exports.errorHandler = function (settings) {
    return tryRequire(settings && settings.module, express.errorHandler)(settings);
};


exports.compiler = require('webcore-devtools').compiler;


exports.appsec = require('webcore-appsec');