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

var formidable = require('formidable'),
    fs = require('fs');

module.exports = function (settings) {
    var settings = typeof settings === 'object' ? settings : {};

    return function(req, res, next) {
        var form = new formidable.IncomingForm(), contentType = req.headers['content-type'];

        if (typeof contentType === 'string' && contentType.indexOf('multipart/form-data') > -1) {
            form.parse(req, function(err, fields, files) {
                req.body = fields; // pass along form fields
                req.files = files; // pass along files

                // remove tmp files after request finishes
                var cleanup = function() {
                    var i;
                    if (files) {
                        for (i in files) {
                            fs.unlink(files[i].path);
                        }
                    }
                };
                res.on('finish', cleanup);
                res.on('close', cleanup);
                res.on('error', cleanup);
                next();
            });
        }
        else {
            next();
        }
    };

};