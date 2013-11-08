/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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