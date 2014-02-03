/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2014 eBay Software Foundation                                │
│                                                                             │
│hh ,'""`.                                                                    │
│  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
│  |(@)(@)|  you may not use this file except in compliance with the License. │
│  )  __  (  You may obtain a copy of the License at                          │
│ /,'))((`.\                                                                  │
│(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
│ `\ `)(' /'                                                                  │
│                                                                             │
│   Unless required by applicable law or agreed to in writing, software       │
│   distributed under the License is distributed on an "AS IS" BASIS,         │
│   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
│   See the License for the specific language governing permissions and       │
│   limitations under the License.                                            │
\*───────────────────────────────────────────────────────────────────────────*/
'use strict';

var fs = require('fs'),
    path = require('path'),
    nconf = require('nconf'),
    shortstop = require('shortstop');

// Patches JSON
require('jsonminify');



function Configurator(appRoot) {
    // Setup default memory store with settings from command line and env.
    this._nconf = nconf;
    this._resolver = shortstop.create();
    this._init(appRoot);
}


Configurator.Protocol = {
    path: function (value) {
        if (path.resolve(value) === value) {
            // Absolute path already, so just return it.
            return value;
        }
        value = value.split('/');
        value.unshift(nconf.get('appRoot'));
        return path.resolve.apply(path, value);
    },
    file: function (value) {
        value = Configurator.Protocol.path(value);
        return fs.readFileSync(value);
    },
    base64: function (value) {
        return new Buffer(value, 'base64');
    }

};


Configurator.ENVIRONMENTS = {
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
Configurator.isSystemRoot = function (dir) {
    return path.dirname(dir) === dir;
};


Configurator.prototype = {

    /**
     * Read the provided files and put their contents into nconf, resolving possible
     * env-specific files/config.
     * @param root
     * @param files
     */
    load: function load(root, files) {
        var file, store, env, ext;

        env = nconf.get('env:env');
        ext = '.json';

        root = this._findConfigRoot(root);
        if (!root) {
            return this;
        }

        // Include env-specific files...
        files.forEach(function (fileName) {
            file = path.join(root, fileName + '-' + env + ext);
            store = this._createJsonStore(file);

            if (store) {
                nconf.use(file, store);
            }
        }, this);

        //  Then, include base files...
        files.forEach(function (fileName) {
            file = path.join(root, fileName + ext);
            store = this._createJsonStore(file);

            if (store) {
                nconf.use(file, store);
            }
        }, this);

        return this;
    },


    done: function () {
        return this._nconf;
    },


    /**
     * Adds convenience properties for determining the application's
     * current environment (dev, test, prod, etc), configures protocol, etc.
     */
    _init: function init(appRoot) {
        var nconf, env;

        // Configure environment convenience properties.
        nconf = this._nconf;

        nconf.argv().env().use('memory');
        env = nconf.get('NODE_ENV') || 'development';
        nconf.set('NODE_ENV', env);
        nconf.set('env:env', env);
        nconf.set('env:' + env, true);
        nconf.set('appRoot', appRoot);

        Object.keys(Configurator.ENVIRONMENTS).forEach(function (key) {
            nconf.set('env:' + key, !!env.match(Configurator.ENVIRONMENTS[key]));
        });

        // Configure protocol handlers
        Object.keys(Configurator.Protocol).forEach(function (protocol) {
            this._resolver.use(protocol, Configurator.Protocol[protocol]);
        }, this);
    },


    /**
     * Find the first config directory starting at the provided root.
     * @param dir the directory from which to start searching for the config dir.
     * @returns {undefined} the config directory or undefined if not found.
     */
    _findConfigRoot: function (dir) {
        var pkg, root, exists;

        do {

            pkg = path.join(dir, 'config');
            dir = path.dirname(dir);
            root = Configurator.isSystemRoot(dir);

        } while (!(exists = fs.existsSync(pkg)) && !root);

        return exists ? pkg : undefined;
    },


    /**
     * Create a JSON nconf store for the given file.
     * @param file the file for which to create the JSON literal store.
     * @returns {{type: string, store: *}}
     */
    _createJsonStore: function createJsonStore(file) {
        var contents;

        if (fs.existsSync(file)) {
            // Minify the code to remove the comments
            // NOTE: using fs.readFile instead of `require`
            // so JSON parsing doesn't happen automatically.
            contents = fs.readFileSync(file, 'utf8');
            contents = JSON.minify(contents);
            if (typeof contents === 'string' && contents.length > 0) {
                try {
                    contents = JSON.parse(contents);
                    contents = this._resolver.resolve(contents);
                } catch (e) {
                    throw new Error(e + " at " + file);
                }
                return {
                    type: 'literal',
                    store: contents
                };
            }
        }

        return undefined;
    }

};



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

    nconf = new Configurator(appRoot)
        .load(appRoot,   ['app', 'middleware'])
        .load(__dirname, ['webcore', 'middleware'])
        .done();

    return Object.create(nconf, {
        raw: {
            get: function () {
                return Object.getPrototypeOf(this);
            }
        },

        port: {
            enumerable: true,
            get: function () {
                return getPort(this);
            }
        },

        host: {
            enumerable: true,
            get: function () {
                return getHost(this);
            }
        }
    });
};
