'use strict';

var path = require('path');


var proto = {

    resolve: function () {
        var args, segments, result;

        args = Array.prototype.slice.call(arguments);
        segments = args.reduce(function (prev, curr) {
            if (curr !== undefined) {
                if (!Array.isArray(curr)) {
                    curr = [curr];
                }
                return prev.concat(curr);
            }
            return prev;
        }, []);

        result = path.join.apply(null, segments);
        if (path.resolve(result) === result) {
            // already absolute path, so no need to use root
            return result;
        }

        segments.unshift(this.root || (this.root = this._doResolve()));
        return path.join.apply(null, segments);
    }

};


exports.create = function (resolver) {
    return Object.create(proto, {
        root: {
            value: undefined,
            enumerable: true,
            writable: true
        },

        _doResolve: {
            value: resolver || function () { return process.cwd(); }
        }
    });
};