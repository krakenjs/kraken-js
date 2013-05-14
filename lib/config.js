'use strict';

var fs = require('fs'),
    path = require('path');


var ENVIRONMENTS = {
    development: /^dev/i,
    test       : /^test/i,
    staging    : /^stag/i,
    production : /^prod/i
};


function findRoot(dir) {
    var pkg = path.join(dir, 'config');
    while (!fs.existsSync(pkg)) {
        dir = path.dirname(dir);
        pkg = path.join(dir, 'config');
    }
    return pkg;
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


function load(nconf, root, files) {
    var file, env, ext;

    env = nconf.get('env:env');
    ext = '.json';

    // Include env-specific files...
    files.forEach(function (fileName) {
        file = path.join(root, fileName + '-' + env + ext);
        if (fs.existsSync(file)) {
            nconf.file(file, file);
        }
    });

    //  Then, include base files...
    files.forEach(function (fileName) {
        file = path.join(root, fileName + ext);
        if (fs.existsSync(file)) {
            nconf.file(file, file);
        }
    });

}


exports.load = function (nconf, callback) {
    setEnv(nconf);
    load(nconf, findRoot(process.cwd()), ['app', 'middleware']);
    load(nconf, findRoot(__dirname),     ['webcore', 'middleware']);
    callback && callback(null, nconf);
};