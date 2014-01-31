'use strict';

var fs = require('fs'),
    path = require('path'),
    requires = {};


exports.raptor = function raptor(filepath, options, fn) {
    var engine;

    // TROLOL - raptor needs to "install" itself, so you need to require
    // the base package before you can require child packages.
    engine = requires.raptor || (require('raptor') && (requires.raptor = require('raptor/templating')));
    fn(null, engine.renderToString(filepath, options));
};


exports.compiledRaptor = function compiledRaptor(filepath, options, fn) {
    var engine, name;

    engine = requires.raptor || (require('raptor') && (requires.raptor = require('raptor/templating')));
    name = path.relative(options.settings.views, filepath);
    name = name.replace(path.extname(name), '');

    try {

        fn(null, engine.renderToString(name, options));

    } catch (err) {

        fs.readFile(filepath, 'utf8', function onfile(err, data) {
            if (err) {
                fn(err);
                return;
            }

            eval(data); // TROLOL - raptor global pollution
            fn(null, engine.renderToString(name, options));
        });

    }
};