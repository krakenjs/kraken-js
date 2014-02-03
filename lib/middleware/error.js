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

var express = require('express'),
    util = require('../util');


exports.defaultHandler = function (settings) {
    var handler = util.tryRequire(settings && settings.module, express.errorHandler);
    return handler(settings);
};

exports.fileNotFound = function (template) {
    return function (req, res, next) {
        var model = { url: req.url };

        if (template) {
            if (req.xhr) {
                res.send(404, model);
            } else {
                res.status(404);
                res.render(template, model);
            }
        } else {
            next();
        }
    };
};


exports.serverError = function (template) {
    return function (err, req, res, next) {
        var model = { url: req.url, err: err };

        console.error('Error:' + err.message);

        if (template) {
            if (req.xhr) {
                res.send(500, model);
            } else {
                res.status(500);
                res.render(template, model);
            }
        } else {
            next(err);
        }
    };
};
