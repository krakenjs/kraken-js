/*global describe:false, it:false, before:false, after:false*/
'use strict';

var kraken = require('../index'),
    http = require('http'),
    path = require('path'),
    assert = require('chai').assert,
    request = require('supertest');

describe('compiler', function () {

    var VALID_LOCALIZED_TEMPLATE = '(function(){dust.register("localized",body_0);function body_0(chk,ctx){return chk.write("<!DOCTYPE html><html lang=\\"en\\"><head><title>").reference(ctx.get("title"),ctx,"h").write("</title></head><body><h1>node template test</h1></body></html>");}return body_0;})();';

    var cwd, app;

    before(function (next) {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        cwd = process.cwd();
        process.chdir(path.join(__dirname, 'fixtures'));

        var builder = kraken.create({});
        builder.listen(function (err, server) {
            if (err) {
                next(err);
                return;
            }
            app = builder.app;
            server.close(next);
        });
    });


    after(function (next) {
        process.chdir(cwd);
        next();
    });


    it('should compile a template', function (next) {
        request(app)
            .get('/templates/index.js')
            .expect('Content-Type', /javascript/)
            .expect(200, next);
    });


    it('should compile a namespaced template', function (next) {
        request(app)
            .get('/templates/inc/partial.js')
            .expect('Content-Type', /javascript/)
            .expect(200, next);
    });


    it('should compile a localized template', function (next) {
        request(app)
            .get('/templates/US/en/localized.js')
            .expect('Content-Type', /javascript/)
            .expect(200)
            .expect(VALID_LOCALIZED_TEMPLATE, next);
    });


    it('should fail on a nonexistent template', function (next) {
        request(app)
            .get('/templates/US/en/wat.js')
            .expect(404, next);
    });


    it('should load javascript', function (next) {
        request(app)
            .get('/js/main.js')
            .expect('Content-Type', /javascript/)
            .expect(200, next);
    });


    it('should compile less to css', function (next) {
        request(app)
            .get('/css/app.css')
            .expect('Content-Type', /css/)
            .expect(200, next);
    });

    it('should compile less files in nested directories', function (next) {
        request(app)
            .get('/css/inc/colors.css')
            .expect('Content-Type', /css/)
            .expect(200, next);
    });


    it('should copy misc files', function (next) {
        request(app)
            .get('/img/nyan.jpg')
            .expect('Content-Type', /jpeg/)
            .expect(200, next);
    });


    it('should copy misc files in subdirectories', function (next) {
        request(app)
            .get('/misc/dur/foo.txt')
            .expect('Content-Type', /plain/)
            .expect(200)
            .expect('foo', next);
    });

});