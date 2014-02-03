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

var path = require('path');


var proto = {

    resolve: function () {
        var args, segments, result;

        args = Array.prototype.slice.call(arguments);
        segments = args.reduce(function (prev, curr) {
            if (curr !== undefined) {
                if (!Array.isArray(curr)) {
                    curr = [curr];
                }
                return prev.concat(curr);
            }
            return prev;
        }, []);

        result = path.join.apply(null, segments);
        if (path.resolve(result) === result) {
            // already absolute path, so no need to use root
            return result;
        }

        segments.unshift(this.root || (this.root = this._doResolve()));
        return path.join.apply(null, segments);
    }

};


exports.create = function (resolver) {
    return Object.create(proto, {
        root: {
            value: undefined,
            enumerable: true,
            writable: true
        },

        _doResolve: {
            value: resolver || function () { return process.cwd(); }
        }
    });
};
