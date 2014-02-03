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


// NOTE: It's possible for clients to define middleware by name or fall back to a default as defined
// by kraken. This takes advantage of node module lookup rules, thus will use the module
// available in the parent module as it won't be available in the current module.
module.exports = function (settings) {
    var override = util.tryRequire(settings && settings.module, express.logger);
    if (typeof override === 'object' && typeof override.logger === 'function') {
        override = override.logger;
    }
    return override(settings);
};
