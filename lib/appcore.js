/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2013 eBay, Inc.                                              │
│                                                                             │
│   ,'""`.                                                                    │
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

/*jshint maxstatements:35, maxcomplexity:10*/
'use strict';

var Q = require('q'),
    http = require('http'),
    express = require('express'),
    enrouten = require('express-enrouten'),
    patch = require('./patch'),
    webcore = require('./middleware'),
    pathutil = require('./util/pathutil'),
    config = require('./util/configutil');


function tryRequire(module) {
    var impl;
    try {
        impl = require(module);
    } catch (err) {
        console.error('Could not load module', module);
    }
    return impl;
}


var proto = {

    init: function (callback) {
        this._configure(callback);
    },


    _configure: function (callback) {
        var self, app;

        self = this;
        app  = this._app;

        function next(err) {
            var config, settings;

            if (err) {
                callback(err);
                return;
            }

            config = self._config;
            patch.apply('config', app, config);

            // XXX: Special-case resolving `express:views` until we get config protocols working.
            config.set('express:views', self._resolve(config.get('express:views')));
            config.set('express:env',  config.get('env:env'));
            config.set('express:port', config.port);
            config.set('express:host', config.host);

            settings = config.get('express');
            Object.keys(settings).forEach(function (key) {
                app.set(key, settings[key]);
            });

            http.globalAgent.maxSockets = config.get('globalAgent:maxSockets') || Infinity;

            self._views();
            self._middleware();
            callback();
        }


        this._config = config.create(this._resolve('.'));

        if (typeof this._delegate.configure === 'function') {
            this._delegate.configure(this._config.raw, next);
            return;
        }

        next();
    },


    _views: function () {
        var app, config, i18n, cache, engines, module;

        app = this._app;
        config = this._config;

        // If i18n is enabled (config is available), set its cache
        // to the view cache value, and disable the view cache.
        i18n = config.get('i18n');
        cache = config.get('express:view cache');
        if (i18n) {
            // Set i18n to the view engine cache settings. If the view
            // engine cache is enabled, disable it so i18n can take over.
            // Either way caching is still enabled, so renderer caches will
            // still be disabled below.
            i18n.cache = cache;
            cache && config.set('express:view cache', false);
        }


        // Register each rendering engine
        engines = config.get('view engines');
        Object.keys(engines).forEach(function (ext) {
            var meta, engine, renderer;

            meta = engines[ext];
            engine = require(meta.module);
            renderer = engine[ext];

            // Assume a single argument renderer means it's actually a factory
            // method and needs to be configured.
            if (typeof renderer === 'function' && renderer.length === 1) {
                // Now create the real renderer. If express cache is enabled
                // favor that over view engine cache.
                meta.settings = meta.settings || {};
                meta.settings.cache = (cache === true) ? false : meta.settings.cache;
                renderer = renderer(meta.settings);
            }

            app.engine(ext, renderer);
        });

        if (i18n) {
            module = tryRequire('dustjs-i18n');
            i18n.contentPath = this._resolve(i18n.contentPath);
            this._i18n = module && module.create(app, i18n);
        }
    },


    _middleware: function () {
        var app, delegate, config, srcRoot, staticRoot, errorPages;

        app = this._app;
        delegate = this._delegate;
        config = this._config.get('middleware');
        srcRoot = this._resolve(config.static.srcRoot);
        staticRoot = this._resolve(config.static.rootPath);

        app.use(express.favicon());
        app.use(webcore.compiler(srcRoot, staticRoot, this._config, this._i18n));
        app.use(express.static(staticRoot));
        app.use(webcore.logger(config.logger));

        if (typeof delegate.requestStart === 'function') {
            delegate.requestStart(app);
        }

        app.use(express.json(config.bodyParser || config.json));
        app.use(express.urlencoded(config.bodyParser || config.urlencoded));
        app.use(express.multipart(config.bodyParser || config.multipart || { limit: 2097152 })); // default to 2mb limit
        app.use(express.cookieParser(config.session.secret));
        app.use(webcore.session(config.session));
        app.use(webcore.appsec(config.appsec));

        if (typeof delegate.requestBeforeRoute === 'function') {
            delegate.requestBeforeRoute(app);
        }

        enrouten(app).withRoutes({
            directory: this._resolve(this._config.get('routes:routePath'))
        });

        if (typeof delegate.requestAfterRoute === 'function') {
            delegate.requestAfterRoute(app);
        }

        errorPages = config.errorPages || {};

        app.use(webcore.fileNotFound(errorPages['404']));
        app.use(webcore.serverError(errorPages['500']));
        app.use(webcore.errorHandler(config.errorHandler));

        // TODO: Optional requestError?
        // TODO: Optional requestEnd?
    },

    _resolve: function (path) {
        return this._resolver.resolve(path);
    }
};


function create(delegate, resolver, callback) {
    var app, appcore;

    if (isExpress(delegate)) {
        callback(null, delegate);
        return;
    }

    if (typeof resolver === 'function') {
        callback = resolver;
        resolver = pathutil.create();
    }

    app = express();
    if (!delegate) {
        patch.apply('stream', app);
        callback(null, app);
        return;
    }

    appcore = Object.create(proto, {
        _app: {
            enumerable: true,
            writable: false,
            value: app
        },
        _delegate: {
            enumerable: true,
            writable: false,
            value: delegate
        },
        _resolver: {
            enumerable: true,
            writable: false,
            value: resolver
        },
        _config: {
            enumerable: true,
            writable: true,
            value: undefined
        },
        _i18n: {
            enumerable: true,
            writable: true,
            value: undefined
        }
    });

    appcore.init(function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, app);
    });
}


function isExpress(obj) {
    return typeof obj === 'function' && obj.handle && obj.set;
}


exports.create = function (delegate, resolver, callback) {
    if (!callback) {
        return Q.nfbind(create)(delegate, resolver);
    }

    setImmediate(create.bind(null, delegate, resolver, callback));
};
