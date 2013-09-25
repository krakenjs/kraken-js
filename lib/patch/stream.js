/*jshint proto:true*/
'use strict';

var Stream = require('stream');

/**
 * This express patch allows rendering engines to return a stream
 * instead of a string to pipe responses to the client on render.
 * @param app and express application.
 */
exports.apply = function (app) {

    app.response = {

        __proto__: app.response,

        super_: app.response,

        render: function (view, options, fn) {
            var self = this;

            if (typeof options === 'function') {
                fn = options;
                options = {};
            }

            fn = fn || function (err, str) {
                if (err) {
                    self.req.next(err);
                    return;
                }

                if (str instanceof Stream) {
                    str.pipe(self);
                    return;
                }

                self.send(str);
            };

            this.super_.render.call(this, view, options, fn);
        }
    };

};