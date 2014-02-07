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