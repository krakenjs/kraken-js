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

var Promise = require('bluebird');
var config = require('./config');
var View = require('express/lib/view');
var debug = require('debuglog')('kraken/settings');


module.exports = function settings(app, options) {
    debug('initializing settings');

    function complete(config) {
        app.settings = app.locals.settings = config.get('express');
        app.set('env', config.get('env:env'));
        app.set('view', config.get('express:view') ? require(config.get('express:view')) : View);
        app.set('trust proxy', config.get('express:trust proxy'));
        app.kraken = config;

        // If options.mountpath was set, override config settings.
        app.settings.mountpath = (options.mountpath && options.mountpath !== '/') ? options.mountpath : app.settings.mountpath;

        debug('express settings\n', app.settings);
        return app;
    }

    return config.create(options)
        .then(Promise.promisify(options.onconfig))
        .then(complete);
};
