'use strict';

var fs = require('fs'),
    path = require('path'),
    jsonminify = require('jsonminify');


var ENVIRONMENTS = {
    development: /^dev/i,
    test       : /^test/i,
    staging    : /^stag/i,
    production : /^prod/i
};

function isSystemRoot(dir) {
    return path.dirname(dir) === dir;
}


function findConfigRoot(dir) {
    var pkg, root;

    do {

        pkg = path.join(dir, 'config');
        dir = path.dirname(dir);
        root = isSystemRoot(dir);

    } while (!fs.existsSync(pkg) && !root);

    return root ? undefined: pkg;
}


function setEnv(nconf) {
    var env;

    nconf.argv().env().use('memory');

    env = nconf.get('NODE_ENV') || 'development';
    nconf.set('NODE_ENV', env);
    nconf.set('env:env', env);
    nconf.set('env:' + env, true);

    Object.keys(ENVIRONMENTS).forEach(function (key) {
        nconf.set('env:' + key, !!env.match(ENVIRONMENTS[key]));
    });
}


function parseJs(file) {
    var contents, minified;

    if (fs.existsSync(file)) {
        contents = fs.readFileSync(file, 'utf8');

        try {
            // Minify the code to remove the comments
            minified = JSON.parse(JSON.minify(contents));

            return {
                type: 'literal',
                store: minified
            };
        } catch (e) {
            throw e;
        }
    }

    return;
}


function load(nconf, root, files) {
    var file, store, env, ext;

    env = nconf.get('env:env');
    ext = '.json';

    // Include env-specific files...
    files.forEach(function (fileName) {
        file = path.join(root, fileName + '-' + env + ext);
        store = parseJs(file);

        if (store) {
            nconf.use(file, store);
        }
    });

    //  Then, include base files...
    files.forEach(function (fileName) {
        file = path.join(root, fileName + ext);
        store = parseJs(file);

        if (store) {
            nconf.use(file, store);
        }
    });
}


exports.load = function (nconf, callback) {
    setEnv(nconf);
    load(nconf, findConfigRoot(process.cwd()), ['app', 'middleware']);
    load(nconf, findConfigRoot(__dirname),     ['webcore', 'middleware']);
    callback && callback(null, nconf);
};


exports.getPort = function (nconf) {
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
};


exports.getHost = function (nconf) {
    var host, hosts;

    if (typeof exports.getPort(nconf) === 'string') {
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
};