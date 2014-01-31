'use strict';

var thing = require('core-util-is'),
    debug = require('debuglog')('kraken/views');


module.exports = function views(app) {
    var engines;

    debug('initializing views');

    engines = app.kraken.get('view engines') || {};
    Object.keys(engines).forEach(function (ext) {
        var spec, module, args, engine;

        spec = engines[ext];
        module = require(spec.module);

        if (thing.isObject(spec.rendererFactory) && thing.isFunction(module[spec.rendererFactory.method])) {
            args = Array.isArray(spec.rendererFactory['arguments']) ? spec.rendererFactory['arguments'].slice() : [];
            engine = module[spec.rendererFactory.method].apply(null, args);

        } else if (thing.isFunction(module[spec.renderer])) {
            engine = module[spec.renderer];

        } else if (thing.isFunction(module[spec.name])) {
            engine = module[spec.name];

        } else if (thing.isFunction(module[ext])) {
            engine = module[ext];

        } else {
            engine = module;
        }

        // It's possible to override the default view, but it's a separate setting
        // than `view engine` so we need to do our best to keep them in sync here.
        if (app.get('view engine') === ext && typeof spec.viewConstructor === 'string') {
            app.set('view', require(spec.viewConstructor));
        }

        app.engine(ext, engine);
    });

    return app;
};