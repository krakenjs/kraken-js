'use strict';

var fs = require('fs'),
    path = require('path');


function i18n(name, options) {
    var src, locale, country, lang;

    src = options.context || options;
    country = lang = '';
    if (src && src.locality) {
        if (typeof src.locality === 'string') {
            locale = src.locality.split(/[-_]/);
            country = locale[1];
            lang = locale[0];
        } else {
            locale = src.locality;
            country = locale.country;
            lang = locale.language;
        }
    }
    return path.join(path.dirname(name), country, lang, path.basename(name));
}


exports.js = function (path, options, fn) {
    //console.log('read handler for js', name);
    console.dir(i18n(path, options));
    fs.readFile(path, 'utf8', fn);
};


exports.dust = function (path, options, fn) {
    //console.log('read handler for dust', name);
    console.dir(i18n(path, options));
    fs.readFile(path, 'utf8', fn);
};
