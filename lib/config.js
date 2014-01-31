'use strict';

var nconf = require('nconf');


var ENV = {
    development: /^dev/i,
    test       : /^test/i,
    staging    : /^stag/i,
    production : /^prod/i
};


function init(config) {
    var env;

    env = config.get('NODE_ENV') || 'development';
    config.set('NODE_ENV', env);
    config.set('env:env', env);
    config.set('env:' + env, true);

    // Setup environment convenience properties
    exports.ENV.forEach(function (key) {
        config.set('env:' + key, !!env.match(ENV[key]));
    });

    return config;
}


exports.ENV = Object.keys(ENV);

exports.create = function () {
    var config;

    config = init(nconf.argv().env().use('memory'));

    return {
        get: config.get.bind(config),
        set: config.set.bind(config),
        use: function use(name, data) {
            config.use(name, {
                type: 'literal',
                store: data
            });
        }
    };
};