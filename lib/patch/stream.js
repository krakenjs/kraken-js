/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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
                    // If content length was somehow added, remove it. Not applicable.
                    self.removeHeader('Content-Length');

                    // Set appropriate headers for this payload.
                    // TODO: ETags? Don't really see how, but who knows.
                    self.set('Transfer-Encoding', 'chunked');
                    if (!self.get('Content-Type')) {
                        self.charset = self.charset || 'utf-8';
                        self.type('html');
                    }

                    str.pipe(self);
                    return;
                }

                self.send(str);
            };

            this.super_.render.call(this, view, options, fn);
        }
    };

};