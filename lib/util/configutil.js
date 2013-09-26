'use strict';

var fs = require('fs'),
    path = require('path'),
    nconf = require('nconf');


// Patches JSON
require('jsonminify');


var ENVIRONMENTS = {
    development: /^dev/i,
    test       : /^test/i,
    staging    : /^stag/i,
    production : /^prod/i
};


/**
 * Helper function to find out if the provided dir is the filesystem root.
 * @param dir the directory in question
 * @returns {boolean} true if we're at the filesystem root, false if not.
 */
function isSystemRoot(dir) {
    return path.dirname(dir) === dir;
}


/**
 * Find the first config directory starting at the provided root.
 * @param dir the directory from which to start searching for the config dir.
 * @returns {undefined} the config directory or undefined if not found.
 */
function findConfigRoot(dir) {
    var pkg, root;

    do {

        pkg = path.join(dir, 'config');
        dir = path.dirname(dir);
        root = isSystemRoot(dir);

    } while (!fs.existsSync(pkg) && !root);

    return root ? undefined : pkg;
}


/**
 * Adds convenience properties for determining the application's
 * current environment (dev, test, prod, etc).
 * @param nconf
 */
function setEnv(nconf) {
    var env;

    env = nconf.get('NODE_ENV') || 'development';
    nconf.set('NODE_ENV', env);
    nconf.set('env:env', env);
    nconf.set('env:' + env, true);

    Object.keys(ENVIRONMENTS).forEach(function (key) {
        nconf.set('env:' + key, !!env.match(ENVIRONMENTS[key]));
    });
}


/**
 * Create a JSON nconf store for the given file.
 * @param file the file for which to create the JSON literal store.
 * @returns {{type: string, store: *}}
 */
function createJsonStore(file) {
    var contents, minified;

    if (fs.existsSync(file)) {

        // Minify the code to remove the comments
        // NOTE: using fs.readFile instead of `require`
        // so JSON parsing doesn't happen automatically.
        contents = fs.readFileSync(file, 'utf8');
        minified = JSON.parse(JSON.minify(contents));

        return {
            type: 'literal',
            store: minified
        };
    }

    return undefined;
}


/**
 * Read the provided files and put their contents into nconf, resolving possible
 * env-specific files/config.
 * @param nconf
 * @param root
 * @param files
 */
function load(nconf, root, files) {
    var file, store, env, ext;

    if (!root) {
        return;
    }

    env = nconf.get('env:env');
    ext = '.json';

    // Include env-specific files...
    files.forEach(function (fileName) {
        file = path.join(root, fileName + '-' + env + ext);
        store = createJsonStore(file);

        if (store) {
            nconf.use(file, store);
        }
    });

    //  Then, include base files...
    files.forEach(function (fileName) {
        file = path.join(root, fileName + ext);
        store = createJsonStore(file);

        if (store) {
            nconf.use(file, store);
        }
    });
}




function getPort(nconf) {
    var value, port, ports;

    value = undefined;
    port = undefined;
    ports = nconf.get('port');
    ports = Array.isArray(ports) ? ports : [ ports ];
    ports.some(function (env) {
        value = (typeof env === 'number') ? env : nconf.get(env);
        port = parseInt(value, 10);
        port = isNaN(port) ? value : port;
        return !!port;
    });

    return port;
}


function getHost(nconf) {
    var host, hosts;

    if (typeof getPort(nconf) === 'string') {
        return undefined;
    }

    host = undefined;
    hosts = nconf.get('host');
    hosts = Array.isArray(hosts) ? hosts : [ hosts ];
    hosts.some(function (env) {
        host = nconf.get(env);
        return !!host;
    });

    return host;
}



exports.create = function (appRoot) {
    // Setup default memory store with settings from command line and env.
    nconf.argv().env().use('memory');
    nconf.set('appRoot', appRoot);

    // Add environment convenience values
    setEnv(nconf);

    // Load app config and then webcore config (order is important)
    load(nconf, findConfigRoot(appRoot),   ['app', 'middleware']);
    load(nconf, findConfigRoot(__dirname), ['webcore', 'middleware']);

    return Object.create(nconf, {
        raw: {
            value: nconf
        },
        port: {
            enumerable: true,
            get: function () {
                return getPort(this.raw);
            }
        },
        host: {
            enumerable: true,
            get: function () {
                return getHost(this.raw);
            }
        }
    });
};