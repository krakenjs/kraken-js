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

var formidable = require('formidable'),
    fs = require('fs'),
    settings,

    multipart = function (settings) {
        settings = typeof settings === 'object' ? settings : {};
        return function (req, res, next) {
            var form,
                contentType = req.headers['content-type'],
                cleanupTempFiles = function () {
                    var files = req.files;

                    Object.keys(files).forEach(function (file) {
                        var filePath = files[file].path,
                            removeFile = function (exists) {
                                if (exists) {
                                    fs.unlink(filePath, fileRemoved);
                                }
                            },
                            fileRemoved = function (err) {
                                if (err) {
                                    if (err.errno === 34 && err.code === 'ENOENT') {
                                        return; // ignore file not found error
                                    }
                                    console.error('Kraken failed to remove tmp file: ' + filePath);
                                    console.error(err);
                                }
                            };

                        if (typeof filePath === 'string') {
                            fs.exists(filePath, removeFile);
                        }
                    });
                };

            if (typeof contentType === 'string' && contentType.indexOf('multipart/form-data') > -1) {
                form = new formidable.IncomingForm(settings);
                form.parse(req, function (err, fields, files) {
                    if (err) {
                        next(err);
                        return;
                    }
                    req.body = fields; // pass along form fields
                    req.files = files; // pass along files

                    // remove tmp files after request finishes
                    res.once('finish', cleanupTempFiles);
                    res.once('close', cleanupTempFiles);
                    next();
                });
            }
            else {
                next();
            }
        };
    };

module.exports = multipart;