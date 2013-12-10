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
'use strict';

var express = require('express'),
    util = require('../util');


exports.defaultHandler = function (settings) {
    var handler = util.tryRequire(settings && settings.module, express.errorHandler);
    return handler(settings);
};

exports.fileNotFound = function (callback) {
    return function (err, req, res) {
        callback(req, res, 'event:fileNotFound', new Error(err));
    };
};

exports.serverError = function (callback) {
    return function (err, req, res, next) {
        callback(req, res, 'event:serverError', new Error(err));
    };
};
