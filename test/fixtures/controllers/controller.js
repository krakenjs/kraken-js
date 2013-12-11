'use strict';

module.exports = function (app) {

    app.get('/', function (req, res) {

        res.locals.context = {};

        res.render('index', {
            title: 'Hello, world'
        });

    });


    app.get('/localized', function (req, res) {

        res.locals.context = {
            locality: {
                country: 'US',
                language: 'en'
            }
        };

        res.render('localized', {
            title: 'Hello, world'
        });

    });


    app.get('/ohnoes', function (req, res) {
        throw new Error('uh oh');
    });

    app.on('event:serverError', function (req, res, err) {
        var data = {};
        data.url = req.url;
        data.err = err;
        res.status(500);
        res.render('errors/500', data);
    });

    app.on('event:fileNotFound', function (req, res) {
        var data = {};
        data.url = req.url;
        res.status(404);
        res.render('errors/404', data);
    });

};