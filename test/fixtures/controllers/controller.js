'use strict';

module.exports = function (app) {

    app.get('/', function (req, res) {

        res.render('index', {
            title: 'Hello, world'
        });

    });


    app.get('/localized', function (req, res) {

        res.locals.locality = {
            country: 'US',
            locale: 'en'
        };

        res.render('localized', {
            title: 'Hello, world'
        });

    });

};