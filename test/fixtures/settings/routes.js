'use strict';


module.exports = function (router) {

    router.get('/ip', function (req, res) {
      var ip, err;

      try {
        ip = req.ip;
      } catch (e) {}

      res.status( ip ? 201 : 500).end();
    });
};
