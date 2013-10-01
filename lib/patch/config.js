'use strict';


/**
 * Contains all the logic to map old config settings to new
 * settings. When we no longer want to support old config,
 * this can go away.
 * @param config
 */
exports.apply = function (app, config) {
    var views, engine, module, engines, proxy;

    // Map old viewEngine config to new
    views = config.get('viewEngine');
    if (views) {

        console.warn('`viewEngine` is deprecated. Please see documentation for details.');

        if (views.cache !== undefined) {
            config.set('express:view cache', views.cache);
            delete views.cache;
        }

        if (views.templatePath !== undefined) {
            config.set('express:views', views.templatePath);
            delete views.templatePath;
        }

        engine = views.ext;
        if (engine !== undefined) {
            config.set('express:view engine', engine);
            delete views.ext;
        }

        module = views.module;
        delete views.module;

        if (engine && module) {
            engines = config.get('view engines');
            engines[engine] = {
                module: module,
                settings: views
            };
        }

        config.remove('viewEngine');
    }

    // Map old proxy config to new
    proxy = config.get('proxy:trust');
    if (proxy !== undefined) {
        config.set('express:trust proxy', config.get('proxy:trust'));
    }
};