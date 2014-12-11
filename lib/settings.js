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

var Bluebird = require('bluebird');
var config = require('./config');
var debug = require('debuglog')('kraken/settings');


var VIEW_CONFIG_KEYS = ['views', 'view engine', 'view cache'];

module.exports = function settings(app, options) {
    debug('initializing settings');

    function mount(app, options, config) {
        var settings, defaults, handler;

        // Get configured settings and express defaults.
        settings = config.get('express');
        defaults = Object.keys(app.settings);

        if (options.inheritViews) {
            // If the mounted app SHOULD inherit views, delete from local
            // kraken settings so the app settings aren't updated later.
            handler = function (name) {
                debug('inheriting express config setting', '\'' + name + '\'', 'from parent');
                delete settings[name];
            };

        } else {
            // If the views SHOULD NOT be inherited, remove from list
            // of default settings such that they are NOT deleted below.
            handler = function (name) {
                var idx = defaults.indexOf(name);
                if (idx >= 0) {
                    defaults.splice(idx, 1);
                }
            };
        }

        // Update our configuration (provided settings or app defaults)
        VIEW_CONFIG_KEYS.forEach(handler);

        // Now delete the default app settings so they may be inherited
        // from the parent app. Any remaining kraken config will be set
        // during setting initialization.
        defaults.forEach(function (name) {
            delete app.settings[name];
        });
    }


    function compose(config) {
        // If this application is mounted on a parent app we need to make sure
        // the two work together cleanly and appropriate settings are inherited.
        if (typeof app.parent === 'function') {
            // If it has already been mounted do all the work to update settings.
            mount(app, options, config);
        } else {
            // ...if it hasn't been mounted, register a handler for the `mount`
            // event to apply them as necessary.
            app.once('mount', function () {
                mount(this, options, config);
            });
        }

        return config;
    }


    function complete(config) {
        var settings;

        settings = config.get('express');

        // Allow configuration of custom View impl. This really can be
        // accomplished using shortstop, but maintain for compatibility.
        if (typeof settings.view === 'string') {
            settings.view = require(settings.view);
        }

        // Override default settings, leaving the settings object
        // intact to maintain express' setting inheritance.
        Object.keys(settings).forEach(function (name) {
            app.set(name, settings[name]);
        });

        if (options.inheritViews) {
            // Update kraken config to reflect express settings
            // for view options. Previously, the view settings
            // were removed from config so only the appropriate
            // settings were copied into express. At this point
            // the app has been mounted and configures, so parent
            // values are available to update kraken config as
            // appropriate.
            VIEW_CONFIG_KEYS.forEach(function (name) {
                config.set('express:' + name, app.get(name));
            });
        }

        // If options.mountpath was set, override config settings.
        app.set('mountpath', ((typeof options.mountpath === 'string') && options.mountpath !== '/') ? options.mountpath : app.get('mountpath'));
        app.set('trust proxy', config.get('express:trust proxy'));
        app.set('env', config.get('env:env'));
        app.kraken = config;

        debug('express settings\n', app.settings);
        return app;
    }

    return config.create(options)
        .then(Bluebird.promisify(options.onconfig))
        .then(compose)
        .then(complete);
};
