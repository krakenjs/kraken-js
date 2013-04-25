'use strict';

var path = require('path'),
    nconf = require('nconf'),
    express = require('express'),
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
            if (!Array.isArray(curr)) {
                curr = [curr];
            }
            return prev.concat(curr);
        }, [ process.cwd() ]);

        return path.join.apply(null, segments);
    }
};


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
        var that, app;
        that = this;
        app  = this._application;

        nconf.argv().env();
        nconf.file('webcore', { file: path.join(__dirname, 'config', 'webcore.json') });
        nconf.file('middleware', { file: path.join(__dirname, 'config', 'middleware.json') });

        this._delegate.configure(nconf, function (err, config) {
            if (err) {
                callback(err);
                return;
            }

            app.disable('x-powered-by');
            app.set('env', config.get('env'));

            // Configure routes
            enrouten(app).withRoutes({
                directory: pathutil.resolve(config.get('routes:routePath'))
            });

            that._config = config;
            that._views();
            that._middleware();
            callback();
        });
    },


    _views: function () {
        var engine, renderer, app;

        // API for view renderer can either be module.name or module.name(config)
        // Supports 'consolidate' as well as express-dustjs.
        engine = this._config.get('viewEngine');
        renderer = require(engine.module)[engine.ext];
        if (typeof renderer === 'function' && renderer.length === 1) {
            // Optionally configure a read handler (for renderers that honor it).
            if (typeof engine.read !== 'function') {
                engine.read = require('./lib/view/read')[engine.ext];
            }
            renderer = renderer(engine);
        }

        app = this._application;
        app.engine(engine.ext, renderer);
        app.set('view engine', engine.ext);
        app.set('view cache', false);
        app.set('views', pathutil.resolve(engine.templatePath));
    },


    _middleware: function () {
        var app, delegate, settings;

        app = this._application;
        delegate = this._delegate;
        settings = this._config.get('middleware');

        app.use(express.favicon());
        app.use(middleware.logger(settings.logger));

        if (typeof delegate.requestStart === 'function') {
            delegate.requestStart( /* TODO: Pass facade, not *real* server */ );
        }

        app.use(middleware.devCompiler(settings.devCompiler)); // Only set when env === 'dev*'
        app.use(express.bodyParser(settings.bodyParser || { limit: 2097152 })); // default to 2mb limit
        app.use(express.cookieParser(settings.session.secret));
        app.use(middleware.session(settings.session));
        app.use(middleware.appsec(settings.appsec));

        if (typeof delegate.requestBeforeRoute === 'function') {
            delegate.requestBeforeRoute( /* TODO: Pass facade, not *real* server */ );
        }

        app.use(app.routes);

        if (typeof delegate.requestAfterRoute === 'function') {
            delegate.requestAfterRoute( /* TODO: Pass facade, not *real* server */ );
        }

        app.use(express.static(pathutil.resolve(settings.static.rootPath)));
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