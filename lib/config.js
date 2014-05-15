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

var Promise = require('bluebird');
var path = require('path');
var confit = require('confit');
var handlers = require('shortstop-handlers');


function createHandlers(options) {
    var result;

    result = {
        file:    handlers.file(options.basedir),
        path:    handlers.path(options.basedir),
        base64:  handlers.base64(),
        env:     handlers.env(),
        require: handlers.require(options.basedir),
        exec:    handlers.exec(options.basedir),
        glob:    handlers.glob(options.basedir)
    };

    Object.keys(options.protocols).forEach(function (protocol) {
        result[protocol] = options.protocols[protocol];
    });

    return result;
}


exports.create = function create(options) {
    var deferred, protocols, baseFactory, appFactory;

    deferred = Promise.pending();
    protocols = createHandlers(options);

    baseFactory = confit({ basedir: path.join(path.dirname(__dirname), 'config'), protocols: protocols });
    baseFactory.create(function(err, baseConf) {
        if (err) {
            deferred.reject(err);
            return;
        }

        appFactory = confit({basedir: path.join(options.basedir, 'config'), protocols: protocols });
        appFactory.create(function(err, appConf) {
            if (err) {
                deferred.reject(err);
                return;
            }

            baseConf.merge(appConf);
            deferred.resolve(baseConf);
        });
    });

    return deferred.promise;
};
