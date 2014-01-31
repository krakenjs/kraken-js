'use strict';

var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    shush = require('shush'),
    config = require('./config'),
    readdirp = require('readdirp'),
    shortstop = require('shortstop'),
    View = require('express/lib/view'),
    debug = require('debuglog')('kraken/settings');


/**
 * Read files for a given root, as well as files in a predefined root.
 * @param basedir
 * @param env
 * @returns {*}
 */
function readFiles(basedir, env) {
    var app, defaults, filter;

    app = path.join(basedir, 'config');
    defaults = path.resolve(__dirname, '..', 'config');
    filter = createFilter(env);

    return Q([])
        .then(createScanner(app, filter))
        .then(createScanner(defaults, filter));
}


/**
 * Creates a file filter for env-specific JSON configuration files
 * @param env
 * @returns {filter}
 */
function createFilter(env) {
    var currentEnv, noEnv;

    currentEnv = '\\-' + env + '.json';
    noEnv = '^' + config.ENV.map(function (env) { return '(?!.*\\-' + env + '\\.json$)';  }).join('') + '.*\\.json$';

    return function filter(entry) {
        return entry.name.match(currentEnv) || entry.name.match(noEnv);
    };
}


/**
 * Creates a scanning promise function for the provided root directory, applying the provided filter.
 * @param root
 * @param fileFilter
 * @returns {*}
 */
function createScanner(root, fileFilter) {
    if (!fs.existsSync(root)) {
        return function noop(files) {
            return files;
        };
    }

    return function read(allFiles) {
        var deferred, reader, files;

        deferred = Q.defer();
        files = [];

        reader = readdirp({ root: root, fileFilter: fileFilter });
        reader.on('error', deferred.reject.bind(deferred));

        reader.on('end', function () {
            files.sort();
            deferred.resolve(allFiles.concat(files));
        });

        reader.on('data', function (entry) {
            files.push(entry.fullPath);
        });

        return deferred.promise;
    };
}


/**
 * Creates the file processor, adding the config data located within the file to
 * the provided settings.
 * @param settings
 * @param preprocessor
 * @returns {process}
 */
function createProcessor(settings, preprocessor) {
    return function process(files) {
        files.forEach(function (file) {
            var data;
            debug('loading config', file);
            data = shush(file);
            data = preprocessor.resolve(data);
            settings.use(file, data);
        });
        return settings;
    };
}


/**
 * Creates the protocol handler for the `path:` protocol
 * @param basedir
 * @returns {pathHandler}
 */
function createPathHandler(basedir) {
    return function pathHandler(file) {
        if (path.resolve(file) === file) {
            // Absolute path already, so just return it.
            return file;
        }
        file = file.split('/');
        file.unshift(basedir);
        return path.resolve.apply(path, file);
    };
}


/**
 * Creates the protocol handler for the `file:` protocol
 * @param basedir
 * @returns {fileHandler}
 */
function createFileHandler(basedir) {
    var pathHandler = createPathHandler(basedir);
    return function fileHandler(file) {
        file = pathHandler(file);
        return fs.readFileSync(file);
    };
}


/**
 * The protocol handler for the `buffer:` protocol
 * @param value
 * @returns {Buffer}
 */
function base64Handler(value) {
    return new Buffer(value, 'base64');
}



module.exports = function (app, options) {
    var settings, preprocessor;

    debug('initializing settings');

    function onconfig(settings) {
        var deferred = Q.defer();
        options.onconfig(settings, deferred.makeNodeResolver());
        return deferred.promise;
    }

    function complete(settings) {
        app.settings = app.locals.settings =settings.get('express');
        app.set('env', settings.get('env:env'));
        app.set('view', View);
        app.kraken = settings;

        debug('express settings\n', app.settings);
        return app;
    }

    // Create the actual settings object
    settings = config.create();
    settings.set('basedir', options.basedir);

    // Setup the shortstop instance.
    preprocessor = shortstop.create();
    preprocessor.use('file', createFileHandler(options.basedir));
    preprocessor.use('path', createPathHandler(options.basedir));
    preprocessor.use('base64', base64Handler);
    Object.keys(options.protocols).forEach(function (protocol) {
        preprocessor.use(protocol, options.protocols[protocol]);
    });

    return readFiles(options.basedir, settings.get('env:env'))
        .then(createProcessor(settings, preprocessor))
        .then(onconfig)
        .then(complete);
};