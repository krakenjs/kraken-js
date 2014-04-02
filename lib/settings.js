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

var Q = require('q');
var config = require('./config');
var View = require('express/lib/view');
var debug = require('debuglog')('kraken/settings');


module.exports = function settings(app, options) {
    var deferred, protocols, file, factory;

    debug('initializing settings');

    function onconfig(config) {
        var deferred = Q.defer();
        options.onconfig(config, deferred.makeNodeResolver());
        return deferred.promise;
    }

    function complete(config) {
        app.settings = app.locals.settings = config.get('express');
        app.set('env', config.get('env:env'));
        app.set('view', config.get('express:view') ? require(config.get('express:view')) : View);
        app.kraken = config;
        app.route = (app.settings.route && app.settings.route !== '/') ? app.settings.route : app.route;

        debug('express settings\n', app.settings);
        return app;
    }

    return config.create(options)
        .then(onconfig)
        .then(complete);
};
