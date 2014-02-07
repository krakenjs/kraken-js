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

var Q = require('q'),
    views = require('./views'),
    endgame = require('endgame'),
    events = require('./events'),
    settings = require('./settings'),
    middleware = require('./middleware'),
    debug = require('debuglog')('kraken/bootstrap');


function complete() {
    debug('init complete');
}


module.exports = function (app, options) {

    endgame(options.uncaughtException);

    return Q(settings).fapply(arguments)
        .then(views)
        .then(middleware)
        .then(events)
        .then(complete);
};