/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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