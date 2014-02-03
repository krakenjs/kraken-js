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

var assert = require('assert');

/**
 * Contains all the logic to map old config settings to new
 * settings. When we no longer want to support old config,
 * this can go away.
 * @param app
 * @param config
 */
exports.apply = function (app, config) {
    var views, engine, module, engines, existing, proxy;

    // Map old viewEngine config to new
    views = config.get('viewEngine');
    if (views) {

        console.warn('`viewEngine` configuration is deprecated. Please see documentation for details.');

        if (views.cache !== undefined) {
            config.set('express:view cache', views.cache);
            delete views.cache;
        }

        if (views.templatePath !== undefined) {
            config.set('express:views', views.templatePath);
            delete views.templatePath;
        }

        // There should ALWAYS be an engine, either in old or new config.
        engine = views.ext || config.get('express:view engine');
        assert(engine, 'No view engine configured.');
        config.set('express:view engine', engine);
        delete views.ext;

        module = views.module;
        delete views.module;

        // Ok, if an engine is defined first check the new config style to
        // see if we need to overwrite/merge `module` and `settings` or create
        // a new entry altogether.
        existing = config.get('view engines:' + engine) || {
            module: undefined,
            settings: {}
        };

        // No module was defined, so don't overwrite. Then update the engine config,
        // and finally set the settings directly so the values of `views` get merged
        // into the object instead of overwritten.
        module && (existing.module = module);
        config.set('view engines:' + engine, existing);
        config.set('view engines:' + engine + ':settings', views);
        config.remove('viewEngine');
    }

    // Map old proxy config to new
    proxy = config.get('proxy:trust');
    if (proxy !== undefined) {
        config.set('express:trust proxy', config.get('proxy:trust'));
    }
};
