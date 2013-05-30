'use strict';

var path = require('path');

exports.resolve = function () {
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
};