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
'use strict';

var States = {
    CONNECTED: 0,
    DISCONNECTING: 2
};


module.exports = function (config) {
    var template, timeout, state, app, server;

    function close() {
        state = States.DISCONNECTING;
        app.emit('shutdown', server, timeout);
    }

    config = config || {};
    template = config.template;
    timeout = config.timeout || 10 * 1000;
    state = States.CONNECTED;

    return function shutdown(req, res, next) {
        var headers = config.shutdownHeaders || {};

        function json() {
            res.send('Server is shutting down.');
        }

        function html() {
            template ? res.render(template) : json();
        }

        if (state === States.DISCONNECTING) {
            headers.Connection = headers.Connection || 'close';
            res.header(headers);
            res.status(503);
            res.format({
                json: json,
                html: html
            });
            return;
        }

        if (!app) {
            // Lazy-bind - only attempt clean shutdown
            // if we've taken at least one request.
            app = req.app;
            server = req.socket.server;
            process.once('SIGTERM', close);
            process.once('SIGINT', close);
        }

        next();

    };

};
