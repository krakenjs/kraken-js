/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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

        root = this._findConfigRoot(root);
        env = nconf.get('env:env');
        ext = '.json';

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
        var pkg, root;

        do {

            pkg = path.join(dir, 'config');
            dir = path.dirname(dir);
            root = Configurator.isSystemRoot(dir);

        } while (!fs.existsSync(pkg) && !root);

        return root ? undefined : pkg;
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
                contents = JSON.parse(contents);
                contents = this._resolver.resolve(contents);

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