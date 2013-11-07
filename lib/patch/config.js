/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
'use strict';

var assert = require('assert');

/**
 * Contains all the logic to map old config settings to new
 * settings. When we no longer want to support old config,
 * this can go away.
 * @param app
 * @param config
 */
exports.apply = function (app, config) {
    var views, engine, module, engines, existing, proxy;

    // Map old viewEngine config to new
    views = config.get('viewEngine');
    if (views) {

        console.warn('`viewEngine` configuration is deprecated. Please see documentation for details.');

        if (views.cache !== undefined) {
            config.set('express:view cache', views.cache);
            delete views.cache;
        }

        if (views.templatePath !== undefined) {
            config.set('express:views', views.templatePath);
            delete views.templatePath;
        }

        // There should ALWAYS be an engine, either in old or new config.
        engine = views.ext || config.get('express:view engine');
        assert(engine, 'No view engine configured.');
        config.set('express:view engine', engine);
        delete views.ext;

        module = views.module;
        delete views.module;

        // Ok, if an engine is defined first check the new config style to
        // see if we need to overwrite/merge `module` and `settings` or create
        // a new entry altogether.
        existing = config.get('view engines:' + engine) || {
            module: undefined,
            settings: {}
        };

        // No module was defined, so don't overwrite. Then update the engine config,
        // and finally set the settings directly so the values of `views` get merged
        // into the object instead of overwritten.
        module && (existing.module = module);
        config.set('view engines:' + engine, existing);
        config.set('view engines:' + engine + ':settings', views);
        config.remove('viewEngine');
    }

    // Map old proxy config to new
    proxy = config.get('proxy:trust');
    if (proxy !== undefined) {
        config.set('express:trust proxy', config.get('proxy:trust'));
    }
};