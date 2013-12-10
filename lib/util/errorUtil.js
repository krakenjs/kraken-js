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

var EventEmitter = require('events').EventEmitter;

function ErrorEmitter() {
    //anything to be sent custom by us with errors
    this.internalData = {
        from : 'kraken'
    };
}

ErrorEmitter.prototype.__proto__ = EventEmitter.prototype;

ErrorEmitter.prototype = {
    //ANY FANCY SUPPORT
    //Eg: Check for something specific in error before emitting
    emitByType: function (error) {
        error.additionalInfo = this.internalData;
        this.emit((error.type || 'error'), error);
    }
};

module.exports = ErrorEmitter;