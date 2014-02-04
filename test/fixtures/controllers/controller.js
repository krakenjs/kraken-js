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


    app.get('/json', function (req, res) {
        res.json({ call: 'me maybe' });
    });


    app.get('/plain', function (req, res) {
        res.set('Content-Type', 'text/plain');
        res.send(200, 'ok');
    });

    app.get('/jekyll', function (req, res) {

        res.locals({
            'whoAmI' : req.body.whoAmI
        });

        res.render('jekyll', {
            title: 'Kraken unleashes split personality'
        });
    });

};