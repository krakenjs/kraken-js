'use strict';

var Q = require('q'),
    http = require('http'),
    nconf = require('nconf'),
    express = require('express'),
    enrouten = require('express-enrouten'),
    middleware = require('./middleware'),
    pathutil = require('./util/pathutil'),
    configutil = require('./util/configutil');

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
        var that, app;

        that = this;
        app  = this._app;

        configutil.load(nconf);

        function next(err, config) {
            var agentSettings;

            if (err) {
                callback(err);
                return;
            }

            // Make global agent maxSocket setting configurable
            agentSettings = config.get('globalAgent');
            http.globalAgent.maxSockets = agentSettings && agentSettings.maxSockets ? agentSettings.maxSockets : Infinity;

            app.disable('x-powered-by');
            app.set('env', config.get('env:env'));
            app.set('port', configutil.getPort(nconf));
            app.set('host', configutil.getHost(nconf));

            that._config = config;
            that._views();
            that._middleware();
            callback();
        }

        if (typeof this._delegate.configure === 'function') {
            if (this._delegate.configure.length > 1) {
                this._delegate.configure(nconf, next);
                return;
            }

            this._delegate.configure(nconf);
        }

        next(null, nconf);
    },


    _views: function () {
        var viewEngineConfig, i18nConfig, engine, renderer, app;

        // API for view renderer can either be module.name or module.name(config)
        // Supports 'consolidate' as well as express-dustjs.
        viewEngineConfig = this._config.get('viewEngine');
        engine = require(viewEngineConfig.module);
        renderer = engine[viewEngineConfig.ext];

        i18nConfig = this._config.get('i18n');
        if (i18nConfig && viewEngineConfig.cache) {
            // If i18n is enabled, disable view renderer cache
            // and use i18n internal cache.
            i18nConfig.cache = viewEngineConfig.cache;
            viewEngineConfig.cache = !viewEngineConfig.cache;
        }

        // Assume a single argument renderer means it's actually a factory
        // method and needs to be configured.
        if (typeof renderer === 'function' && renderer.length === 1) {
            // Now create the real renderer
            renderer = renderer(viewEngineConfig);
        }

        app = this._app;
        app.engine(viewEngineConfig.ext, renderer);
        app.set('view engine', viewEngineConfig.ext);
        app.set('view cache', false);
        app.set('views', pathutil.resolve(viewEngineConfig.templatePath));

        if (i18nConfig) {
            var dusti18n = tryRequire('dustjs-i18n');
            if (dusti18n) {
                i18nConfig.contentPath = pathutil.resolve(i18nConfig.contentPath);
                //var i18n = dusti18n.create(i18nConfig);
                this._i18n = dusti18n.create(app, i18nConfig);
            }
        }
    },


    _middleware: function () {
        var app, delegate, settings, srcRoot, staticRoot;

        app = this._app;
        delegate = this._delegate;
        settings = this._config.get('middleware');
        srcRoot = pathutil.resolve(settings.static.srcRoot);
        staticRoot = pathutil.resolve(settings.static.rootPath);

        app.use(express.favicon());
        // app.use(middleware.domain()); // TODO: This hangs for some reason. Investigate.
        app.use(middleware.compiler(srcRoot, staticRoot, this._config, this._i18n));
        app.use(express.static(staticRoot));
        app.use(middleware.logger(settings.logger));

        if (typeof delegate.requestStart === 'function') {
            delegate.requestStart(app); // TODO: Pass facade, not *real* server?
        }

        app.use(express.bodyParser(settings.bodyParser || { limit: 2097152 })); // default to 2mb limit
        app.use(express.cookieParser(settings.session.secret));
        app.use(middleware.session(settings.session));
        app.use(middleware.appsec(settings.appsec));

        if (typeof delegate.requestBeforeRoute === 'function') {
            delegate.requestBeforeRoute(app); // TODO: Pass facade, not *real* server?
        }

        enrouten(app).withRoutes({
            directory: pathutil.resolve(this._config.get('routes:routePath'))
        });

        if (typeof delegate.requestAfterRoute === 'function') {
            delegate.requestAfterRoute(app); // TODO: Pass facade, not *real* server?
        }

        app.use(middleware.errorHandler(settings.errorHandler));

        // TODO: Optional requestError?
        // TODO: Optional requestEnd?
    }
};


function create(delegate, callback) {
    var app, appcore;

    if (typeof delegate === 'function') {
        if (isExpress(delegate)) {
            callback(null, delegate);
            return;
        }
        callback = delegate;
        delegate = null;
    }

    app = express();
    if (!delegate) {
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


exports.create = function (delegate, callback) {
    if (typeof delegate === 'function' && !isExpress(delegate)) {
        callback = delegate;
        delegate = undefined;
    }

    if (!callback) {
        return Q.nfbind(create)(delegate);
    }

    create(delegate, callback);
};
