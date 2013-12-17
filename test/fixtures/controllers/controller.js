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

    app.on('error', function (url, error) {
        //error event handling here.
    });

};