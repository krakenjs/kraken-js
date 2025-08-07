/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright 2016 PayPal                                                      │
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
    formidable = require('formidable'),
    { firstValues } = require('formidable/src/helpers/firstValues.js'),
    debug = require('debuglog')('kraken/middleware/multipart');
var IncomingForm = formidable.IncomingForm;


/**
 * Filters requests for only those that are `multipart/form-data`
 * @param fn the handler to invoke
 * @returns {Function}
 */
function filter(fn) {
    return function multipart(req, res, next) {
        var contentType = req.headers['content-type'];
        if (typeof contentType === 'string' && ~contentType.indexOf('multipart/form-data')) {
            debug('received multipart request');
            fn.apply(null, arguments);
            return;
        }
        next();
    };
}


/**
 * simple forEach that enumerates an object's properties
 * @param obj the object to enumerate
 * @param callback the callback to invoke, with the signature `callback(value, key, obj)`
 */
function forEachValue(obj, callback) {
    Object.keys(obj).forEach(function (item) {
        callback(obj[item], item, obj);
    });
}


/**
 * Cleanup handler factory
 * @param files the list of files to clean up
 * @returns {function(this:null)}
 */
function cleanify(files) {
    return forEachValue.bind(null, files, funlink);
}


/**
 * Removes the provided file from the filesystem
 * @param file a formidable File object
 */
function funlink(file) {
    // Handle both formidable 1.x and 3.x file object properties
    var path = file.filepath || file.path; // 3.x uses filepath, 1.x uses path
    var name = file.originalFilename || file.name; // 3.x uses originalFilename, 1.x uses name
    debug('removing', name);
    if (typeof path === 'string') {
        fs.unlink(path, function (err) {
            if (err) {
                debug('Failed to remove ' + path);
                debug(err);
            }
        });
    }
}


module.exports = function (config) {
    config = config || {};

    return filter(function (req, res, next) {
        var form = new IncomingForm(config);
        form.parse(req, function (err, fields, files) {
            if (err) {
                next(err);
                return;
            }

            // Use firstValues to handle formidable 3.x array format
            req.body = firstValues(form, fields);
            req.files = addBackwardCompatibility(firstValues(form, files));
            res.once('finish', cleanify(req.files));
            next();
        });
    });
};


/**
 * Add backward compatibility properties to file objects
 * @param files the files object from formidable
 */
function addBackwardCompatibility(files) {
    if (!files) {
        return {};
    }
    
    Object.keys(files).forEach(function(key) {
        var file = files[key];
        if (file) {
            // Add backward compatibility properties for both formidable versions
            file.path = file.filepath || file.path;
            file.name = file.originalFilename || file.name;
            file.type = file.mimetype || file.type;
            // Also add forward compatibility
            file.filepath = file.filepath || file.path;
            file.originalFilename = file.originalFilename || file.name;
            file.mimetype = file.mimetype || file.type;
        }
    });
    return files;
}
