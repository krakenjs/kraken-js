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

var fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    devtools = require('kraken-devtools'),
    util = require('../util');


module.exports = function (srcRoot, destRoot, config, intl) {
    var i18n, dust, options, directory;

    i18n = config.get('i18n');
    dust = util.tryRequire('dustjs-linkedin');
    options = config.get('middleware:compiler');
    directory = options && options.dust;


    if (i18n && util.tryRequire('makara') && dust && directory) {

        options.dust = {

            dir: directory,

            precompile: function (context, callback) {
                var locality, locale, dest;

                // Look for Country/Locale tuple in path
                locale = context.name.match(/(?:([A-Za-z]{2})\/([A-Za-z]{2})\/)?(.*)/);
                if (locale && locale[1] && locale[2]) {
                    locality = {
                        country: locale[1],
                        language: locale[2]
                    };
                }

                if (locale[3]) {
                    context.name = locale[3];
                }

                // Store original source root and switch it so a tmp directory.
                context.origSrcRoot = context.srcRoot;
                context.srcRoot = path.join(context.srcRoot, 'tmp');

                // Determine the interim tempfile (a preprocessed dust file)
                dest = path.join(context.srcRoot, context.filePath);
                dest = dest.replace(path.extname(dest), '') + '.dust';

                intl.localize(context.name, locality, function (err, data) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    mkdirp(path.dirname(dest), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        fs.writeFile(dest, data, function (err) {
                            callback(err, context);
                        });
                    });

                });

            },

            postcompile: function (context, callback) {
                // Remove temp files
                rimraf(context.srcRoot, callback);
            }

        };
    }

    return devtools.compiler(srcRoot, destRoot, options);
};
