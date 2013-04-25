'use strict';

var fs = require('fs');


exports.js = function (name, callback) {
    //console.log('read handler for js', name);
    fs.readFile(name, 'utf8', callback);
};


exports.dust = function (name, callback) {
    //console.log('read handler for dust', name);
    fs.readFile(name, 'utf8', callback);
};
