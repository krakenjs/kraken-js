/*global describe:false, it:false, before:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    request = require('supertest'),
    kraken = require('../index'),
    http = require('http'),
    assert = require('chai').assert;


describe('view', function () {

    var VALID_RESPONSE = '<!DOCTYPE html><html lang="en"><head><title>Hello, world</title></head><body><h1>node template test</h1></body></html>';
    var NOT_FOUND = '<h1>404 template</h1><p>/fourohfour</p>';
    var SERVER_ERROR = '<h1>500 template</h1><p>/ohnoes</p><p>uh oh</p>';

    var cwd, src, bin, itses;

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


    function run(app, resolve, reject) {
        var builder = kraken.create(app);
        builder.listen(8000).then(function (server) {
            server.close(function done() {
                resolve(builder.app);
            });
        }, reject);
    }


    itses = {
        'should use the default view engine (dust)': {
            delegate: {
                configure: function (config, callback) {
                    config.set('express:views', src);
                    callback();
                }
            },
            assert: function (app, next) {
                request(app)
                    .get('/')
                    .expect(200)
                    .expect('Content-Type', /html/)
                    .expect(VALID_RESPONSE, next);
            }
        },

        'should localize using the default view engine (dust)': {
            delegate: {
                configure: function (config, callback) {
                    config.set('express:views', src);
                    callback();
                }
            },
            assert: function (app, next) {
                request(app)
                    .get('/localized')
                    .expect(200)
                    .expect('Content-Type', /html/)
                    .expect(VALID_RESPONSE, next);
            }
        },

        'should use the precompiled view engine (dust)': {
            delegate: {
                configure: function (config, callback) {
                    config.set('express:view engine', 'js');
                    config.set('express:views', bin);
                    callback();
                }
            },
            assert: function success(app, next) {
                request(app)
                    .get('/localized')
                    .expect(200)
                    .expect('Content-Type', /html/)
                    .expect(VALID_RESPONSE, next);
            }
        },

        'should localize using the precompiled view engine (dust)': {
            delegate: {
                configure: function (config, callback) {
                    config.set('express:view engine', 'js');
                    config.set('express:views', bin);
                    callback();
                }
            },
            assert: function (app, next) {
                request(app)
                    .get('/localized')
                    .expect(200)
                    .expect('Content-Type', /html/)
                    .expect(VALID_RESPONSE, next);
            }
        },

        'should support cached views': {
            delegate: {
                configure: function (config, callback) {
                    config.set('view engines:js:cache', true);
                    config.set('express:view engine', 'js');
                    config.set('express:views', bin);
                    callback();
                }
            },
            assert: function (app, next) {
                request(app)
                    .get('/localized')
                    .expect(200)
                    .expect('Content-Type', /html/)
                    .expect(VALID_RESPONSE, next);
            }
        },

        'should support streaming views (when applicable)': {
            delegate: {
                configure: function (config, callback) {
                    config.set('view engines:js', { cache: false, stream: true });
                    config.set('express:view engine', 'js');
                    config.set('express:views', bin);
                    callback();
                }
            },
            assert: function (app, next) {
                request(app)
                    .get('/localized')
                    .expect(200)
                    .expect('Content-Type', /html/)
                    .expect(VALID_RESPONSE, next);
            }
        },

        'should use the jade view engine': {
            delegate: {
                configure: function (config, callback) {
                    config.set('view engines:jade', { module: 'consolidate' });
                    config.set('express:view engine', 'jade');
                    config.set('express:views', src);
                    callback();
                }
            },
            assert: function (app, next) {
                request(app)
                    .get('/')
                    .expect(200)
                    .expect('Content-Type', /html/)
                    .expect(VALID_RESPONSE, next);
            }
        },

        'should support 404 pages': {
            delegate: {
                configure: function (config, callback) {
                    config.set('express:view engine', 'dust');
                    config.set('express:views', src);
                    config.set('middleware:errorPages:404', 'errors/404');
                    callback();
                }
            },
            assert: function (app, next) {
                request(app)
                    .get('/fourohfour')
                    .expect(404)
                    .expect('Content-Type', /html/)
                    .expect(NOT_FOUND, next);
            }
        },

        'should support 500 pages': {
            delegate: {
                configure: function (config, callback) {
                    config.set('express:view engine', 'dust');
                    config.set('express:views', src);
                    config.set('middleware:errorPages:500', 'errors/500');
                    callback();
                }
            },
            assert:  function (app, next) {
                request(app)
                    .get('/ohnoes')
                    .expect(500)
                    .expect('Content-Type', /html/)
                    .expect(SERVER_ERROR, next);
            }
        }
    };


    Object.keys(itses).forEach(function (name) {
        it(name, function (next) {
            var test = itses[name];

            function success(app) {
                test.assert(app, next);
            }

            run(test.delegate, success, next);
        });
    });

});