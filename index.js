'use strict';

var path = require('path'),
    nconf = require('nconf'),
    express = require('express'),
    i18n = require('webcore-i18n'),
    enrouten = require('express-enrouten'),
    middleware = require('./lib/middleware');


if (__dirname !== process.cwd()) {
    console.warn('WARNING: Process not started from application root.');
    console.warn('Current directory:', process.cwd());
    console.warn('Application root:', __dirname);
}

var pathutil = {
    resolve: function () {
        var args, segments;

        args = Array.prototype.slice.call(arguments);
        segments = args.reduce(function (prev, curr) {
            if (curr !== undefined) {
                if (!Array.isArray(curr)) {
                    curr = [curr];
                }
                return prev.concat(curr);
            }
            return prev;
        }, [ process.cwd() ]);

        return path.join.apply(null, segments);
    }
};

// Deps
// Peer
// - enrouten?
// - express-dustjs?
// - express?
//
// Peer Dev (untracked)
// - LESS
// - consolidate
// - Jade (Testing only)
// - r.js
//
// Self
// - webcore-appsec
// - express-winston?
// - nconf
//
// Self Dev
// - Mocha
// - chai
// - webcore-devtools




function AppCore(delegate) {
    this._delegate = delegate;
    this._application = express();
    this._server = null;
    this._config = null;
}

AppCore.prototype = {

    init: function (callback) {
        this._configure(callback);
    },


    start: function (callback) {
        var port = this._config.get('port');
        this._server = this._application.listen(port, function () {
            callback(null, port);
        });
    },


    stop: function (callback) {
        this._server.once('close', callback);
        this._server.close();
    },


    _configure: function (callback) {
        var that, app, config;

        that = this;
        app  = this._application;

        require('./lib/config').load(nconf);
        this._delegate.configure(nconf, function (err, config) {
            if (err) {
                callback(err);
                return;
            }

            app.disable('x-powered-by');
            app.set('env', config.get('env:env'));

            that._config = config;
            that._views();
            that._middleware();
            callback();
        });
    },


    _views: function () {
        var config, engine, renderer, app;

        // API for view renderer can either be module.name or module.name(config)
        // Supports 'consolidate' as well as express-dustjs.
        config = this._config.get('viewEngine');
        engine = require(config.module);
        renderer = engine[config.ext];

        // Assume a single argument renderer means it's actually a factory method and needs to be configured.
        if (typeof renderer === 'function' && renderer.length === 1) {
            // Now create the real renderer
            renderer = renderer(config);
        }

        app = this._application;
        app.engine(config.ext, renderer);
        app.set('view engine', config.ext);
        app.set('view cache', false);
        app.set('views', pathutil.resolve(config.templatePath));

        config = this._config.get('i18n');
        if (config) {
            config.contentPath = pathutil.resolve(config.contentPath);
            i18n.init(app, engine, config);
        }
    },


    _middleware: function () {
        var app, delegate, settings, srcRoot, staticRoot;

        app = this._application;
        delegate = this._delegate;
        settings = this._config.get('middleware');
        srcRoot = pathutil.resolve(settings.static.srcRoot);
        staticRoot = pathutil.resolve(settings.static.rootPath);

        app.use(express.favicon());
        app.use(middleware.compiler(srcRoot, staticRoot, settings.compiler)); // Only set when env === 'dev'
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


var application;

exports.start = function (delegate, callback) {
    var app = new AppCore(delegate);
    app.init(function (err) {
        if (err) {
            callback(err);
            return;
        }
        application = app;
        application.start(callback);
    });
};

exports.stop = function (callback) {
    if (!application) {
        callback(new Error('Application not initialized.'));
        return;
    }
    application.stop(callback);
    application = undefined;
};