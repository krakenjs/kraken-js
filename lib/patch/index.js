'use strict';

var patches = {
    stream: require('./stream'),
    config: require('./config')
};

/**
 * This feature add the ability to apply names patches to express. Usually,
 * this practice is risky as it has dependencies on express internals, thus
 * is separate from core application code.
 */
exports.apply = function (names, app, config) {

    names = names.split(/\s*,\s*/);
    names.forEach(function (name) {
        var patch;

        if (!(name in patches)) {
            throw new Error('Patch ' + name + ' not found.');
        }

        patch = patches[name];
        patch.apply(app, config);
    });

};