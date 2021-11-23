/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright 2016 PayPal                                                      │
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

var path = require('path');
var assert = require('assert');
var thing = require('core-util-is');
var debug = require('debuglog')('kraken/views');
function tryResolverHelper(paths=module.paths) {
    // If this module is deployed outside the app's node_modules, it wouldn't be
    // able to resolve plugin modules deployed under app. Adding app's node_modules 
    // folder to the paths will help handle this case.
    const appDependencyPath = path.resolve(process.cwd(), 'node_modules');
    if (!paths.includes(appDependencyPath)) {
        paths = [ ...paths ];
        paths.push(appDependencyPath);
    }
    return function tryResolve(modulePath) {
        assert.strictEqual(typeof modulePath, 'string', 'modulePath should be a string');
        try {
            return require.resolve(modulePath, { paths });
        } catch (e) {
            if (e.code === 'MODULE_NOT_FOUND')
                return;
            throw e;
        }
    };
}


module.exports = function views(app) {
    var engines;

    debug('initializing views');
    const tryResolve = tryResolverHelper();

    engines = app.kraken.get('view engines') || {};
    Object.keys(engines).forEach(function (ext) {
        var spec, module, args, engine;

        spec = engines[ext];
        const modulePath = tryResolve(spec.module);
        if (!modulePath) {
          throw new TypeError(`Module ${spec.module} not found`);
        }
        module = require(modulePath);

        if (thing.isObject(spec.renderer) && thing.isFunction(module[spec.renderer.method])) {
            args = Array.isArray(spec.renderer['arguments']) ? spec.renderer['arguments'].slice() : [];
            engine = module[spec.renderer.method].apply(null, args);

        } else if (thing.isString(spec.renderer) && thing.isFunction(module[spec.renderer])) {
            engine = module[spec.renderer];

        } else if (thing.isFunction(module[spec.name])) {
            engine = module[spec.name];

        } else if (thing.isFunction(module[ext])) {
            engine = module[ext];

        } else {
            engine = module;
        }

        app.engine(ext, engine);
    });

    return app;
};
