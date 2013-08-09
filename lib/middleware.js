'use strict';

var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    //domain = require('domain'),
    express = require('express'),
    devtools = require('webcore-devtools');


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
    var override = tryRequire(settings && settings.module);

    if (override) {
        var Store = override(express);

        settings.store = new Store(settings.config);
    }

    return express.session(settings);
};


exports.errorHandler = function (settings) {
    return tryRequire(settings && settings.module, express.errorHandler)(settings);
};


// This hangs - also @see `connect-domain` module
//exports.domain = function () {
//    return function (req, res, next) {
//        var requestDomain;
//        requestDomain = domain.create();
//
//        function dispose() {
//            requestDomain && requestDomain.dispose();
//            requestDomain = undefined;
//        }
//
//        res.on('close', dispose);
//        res.on('finish', dispose);
//
//        requestDomain.on('error', function (err) {
//            dispose();
//            next(err);
//        });
//
//        requestDomain.run(next);
//    };
//};


exports.appsec = require('express-appsec');


exports.compiler = function (srcRoot, destRoot, config, intl) {
    var i18n, dust, options, directory;

    i18n = config.get('i18n');
    dust = tryRequire('dustjs-linkedin');
    options = config.get('middleware:compiler');
    directory = options && options.dust;


    if (i18n && tryRequire('dustjs-i18n') && dust && directory) {

        options.dust = {

            dir: directory,

            precompile: function (context, callback) {
                var locality, locale, dest;

                // Look for Country/Locale tuple in path
                locale = context.name.match(/(?:([A-Za-z]{2})\/([A-Za-z]{2})\/)?(.*)/);
                if (locale && locale[1] && locale[2]) {
                    locality = {
                        country: locale[1],
                        language: locale[2]
                    };
                }

                if (locale[3]) {
                    context.name = locale[3];
                }

                // Store original source root and switch it so a tmp directory.
                context.origSrcRoot = context.srcRoot;
                context.srcRoot = path.join(context.srcRoot, 'tmp');

                // Determine the interim tempfile (a preprocessed dust file)
                dest = path.join(context.srcRoot, context.filePath);
                dest = dest.replace(path.extname(dest), '') + '.dust';

                intl.localize(context.name, locality, function (err, data) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    mkdirp(path.dirname(dest), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        fs.writeFile(dest, data, function (err) {
                            callback(err, context);
                        });
                    });

                });

            },

            postcompile: function (context, callback) {
                // Remove temp files
                rimraf(context.srcRoot, callback);
            }

        };
    }

    return devtools.compiler(srcRoot, destRoot, options);
};
