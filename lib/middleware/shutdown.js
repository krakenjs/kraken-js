/***@@@ BEGIN LICENSE @@@***/
/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2013 eBay Software Foundation                                │
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
/***@@@ END LICENSE @@@***/
'use strict';

module.exports = function (app, settings, template) {

    var gracefulShutdown = function () {
        settings.set('kraken:shuttingDown', true);
        console.log("Received kill signal, shutting down gracefully.");
        var server = app.get('kraken:server');
        // switch to kraken.close once it's implemented
        server.close(function () {
            console.log("Closed out remaining connections.");
            process.exit();
        });

        setTimeout(function () {
            console.error("Could not close connections in time, forcefully shutting down.");
            process.exit(1);
        }, 30 * 1000);
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    return function (req, res, next) {
        if (!settings.get('kraken:shuttingDown')) {
            return next();
        }
        res.setHeader("Connection", "close");
        if (template && !req.xhr) {
            res.status(503);
            res.render(template);
        } else {
            res.send(503, "Server is in the process of restarting.");
        }
    };

};
