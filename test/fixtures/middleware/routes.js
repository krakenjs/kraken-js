'use strict';


module.exports = function (router) {

    router.get('/uncaught', function (req, res) {
        setImmediate(function () {
            throw new Error('uncaught!');
        });
    });
    
};
