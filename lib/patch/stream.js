/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2014 eBay Software Foundation                                │
│                                                                             │
│hh ,'""`.                                                                    │
│  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
│  |(@)(@)|  you may not use this file except in compliance with the License. │
│  )  __  (  You may obtain a copy of the License at                          │
│ /,'))((`.\                                                                  │
│(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
│ `\ `)(' /'                                                                  │
│                                                                             │
│   Unless required by applicable law or agreed to in writing, software       │
│   distributed under the License is distributed on an "AS IS" BASIS,         │
│   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
│   See the License for the specific language governing permissions and       │
│   limitations under the License.                                            │
\*───────────────────────────────────────────────────────────────────────────*/
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
