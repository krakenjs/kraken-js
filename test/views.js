/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    kraken = require('../index'),
    http = require('http'),
    assert = require('chai').assert;


describe('view', function () {

    var VALID_RESPONSE = '<!DOCTYPE html><html lang="en"><head><title>Hello, world</title></head><body><h1>node template test</h1></body></html>';


    var application, cwd, src, bin;

    before(function () {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        cwd = process.cwd();
        process.chdir(path.join(__dirname, 'fixtures'));
        src = path.join(process.cwd(), 'public', 'templates');
        bin = path.join(process.cwd(), '.build', 'templates');
    });


    after(function () {
        process.chdir(cwd);
    });


    it('should use the default view engine (dust)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('express:views', src);
                callback();
            }
        };

        kraken.create(application).listen(8000).then(function (server) {
            inject('/', function (err, body) {
                assert.isNull(err);
                assert.strictEqual(body, VALID_RESPONSE);
                server.close(next);
            });
        }, next);
    });


    it('should localize using the default view engine (dust)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('express:views', src);
                callback();
            }
        };

        kraken.create(application).listen(8000).then(function (server) {
            inject('/localized', function (err, body) {
                assert.isNull(err);
                assert.strictEqual(body, VALID_RESPONSE);
                server.close(next);
            });
        }, next);
    });


    it('should use the precompiled view engine (dust)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('express:view engine', 'js');
                config.set('express:views', bin);
                callback();
            }
        };

        kraken.create(application).listen(8000).then(function (server) {
            inject('/', function (err, body) {
                assert.isNull(err);
                assert.strictEqual(body, VALID_RESPONSE);
                server.close(next);
            });
        }, next);
    });


    it('should localize using the precompiled view engine (dust)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('express:view engine', 'js');
                config.set('express:views', bin);
                callback();
            }
        };

        kraken.create(application).listen(8000).then(function (server) {
            inject('/localized', function (err, body) {
                assert.isNull(err);
                assert.strictEqual(body, VALID_RESPONSE);
                server.close(next);
            });
        }, next);
    });


    it('should support cached views', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('view engines:js:cache', true);
                config.set('express:view engine', 'js');
                config.set('express:views', bin);
                callback();
            }
        };

        kraken.create(application).listen(8000).then(function (server) {
            inject('/localized', function (err, body) {
                assert.isNull(err);
                assert.strictEqual(body, VALID_RESPONSE);
                server.close(next);
            });
        }, next);
    });


    it('should support streaming views (when applicable)', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('view engines:js', { cache: false, stream: true });
                config.set('express:view engine', 'js');
                config.set('express:views', bin);
                callback();
            }
        };

        kraken.create(application).listen(8000).then(function (server) {
            inject('/localized', function (err, body) {
                assert.isNull(err);
                assert.strictEqual(body, VALID_RESPONSE);
                server.close(next);
            });
        }, next);
    });


    it('should use the jade view engine', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('view engines:jade', { module: 'consolidate' });
                config.set('express:view engine', 'jade');
                config.set('express:views', src);
                callback();
            }
        };

        kraken.create(application).listen(8000).then(function (server) {
            inject('/', function (err, body) {
                assert.isNull(err);
                assert.strictEqual(body, VALID_RESPONSE);
                server.close(next);
            });
        }, next);
    });


    it('should support 404 pages', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('express:view engine', 'dust');
                config.set('express:views', src);
                config.set('middleware:errorPages:404', 'errors/404');
                callback();
            }
        };

        kraken.create(application).listen(8000).then(function (server) {
            inject('/fourohfour', function (err, body) {
                assert(err);
                assert.strictEqual(err.code, 404);
                assert.strictEqual(err.message, '<h1>404 template</h1><p>/fourohfour</p>');
                server.close(next);
            });
        }, next);
    });


    it('should support 500 pages', function (next) {
        application = {
            configure: function (config, callback) {
                config.set('express:view engine', 'dust');
                config.set('express:views', src);
                config.set('middleware:errorPages:500', 'errors/500');
                callback();
            }
        };

        kraken.create(application).listen(8000).then(function (server) {
            inject('/ohnoes', function (err, body) {
                assert(err);
                assert.strictEqual(err.code, 500);
                assert.strictEqual(err.message, '<h1>500 template</h1><p>/ohnoes</p><p>uh oh</p>');
                server.close(next);
            });
        }, next);
    });

});


function inject(path, callback) {
    var req = http.request({ method: 'GET', port: 8000, path: path }, function (res) {
        var data = [];

        res.on('data', function (chunk) {
            data.push(chunk)
        });

        res.on('end', function () {
            var body, error;

            body = Buffer.concat(data).toString('utf8');
            if (res.statusCode !== 200) {
                error = new Error(body);
                error.code = res.statusCode;
                callback(error);
                return;
            }
            callback(null, body);
        });
    });
    req.on('error', callback);
    req.end();
}

