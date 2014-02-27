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
    util = require('../util'),
    localizr = require('localizr'),
    resolvr = require('fileResolver');


module.exports = function (srcRoot, destRoot, config) {
    var i18n, dust, options, directory, propResolvr;

    i18n = config.get('i18n');
    dust = util.tryRequire('dustjs-linkedin');
    options = config.get('middleware:compiler');
    directory = options && options.dust;

    console.info('****i18n', i18n);
    propResolvr = resolvr.create({
        root: i18n.contentPath || i18n.contentRoot,
        ext: 'properties',
        fallback: i18n.fallback || i18n.fallbackLocale
    });

    if (i18n && util.tryRequire('makara') && dust && directory) {

        options.dust = {

            dir: directory,

            precompile: function (context, callback) {
                var locality, locale, dest, src;

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

                src = path.join(config.get('express:views'), context.name + '.dust');

                // Store original source root and switch it so a tmp directory.
                context.origSrcRoot = context.srcRoot;
                context.srcRoot = path.join(context.srcRoot, 'tmp');

                //handle the template not found case
                if (!fs.existsSync(src)) {
                    callback(null, context);
                    return;
                }

                // Determine the interim tempfile (a preprocessed dust file)
                dest = path.join(context.srcRoot, context.filePath);
                dest = dest.replace(path.extname(dest), '') + '.dust';
                var resolved = propResolvr.resolve(context.name, locality);

                console.info('src:', src);
                console.info('dest:', dest);
                try {
                    //if we have a corresponding property file then translate
                    if (resolved.file) {
                        var opt = {
                            src: src,
                            props: resolved.file
                        };
                        mkdirp(path.dirname(dest), function (err) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            localizr.createReadStream(opt).pipe(fs.createWriteStream(dest));
                            callback(null, context);
                        });
                    } else {
                        //else just use the src file directly
                        mkdirp(path.dirname(dest), function (err) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            fs.createReadStream(src).pipe(fs.createWriteStream(dest));
                            callback(null, context);
                        });
                    }
                }
                catch (e) {
                    callback(e);
                }


                /*intl.localize(context.name, locality, function (err, data) {
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

                });*/


            },

            postcompile: function (context, callback) {
                // Remove temp files
                rimraf(context.srcRoot, callback);
            }

        };
    }

    return devtools.compiler(srcRoot, destRoot, options);
};
