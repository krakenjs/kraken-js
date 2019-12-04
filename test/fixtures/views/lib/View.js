'use strict';

module.exports = View;

function View(name, options) {
    this.path = name;
}


View.prototype.lookup = function (path) {
    return this.path;
};


View.prototype.render = function (options, fn) {
    fn(null, 'Hello, world!');
};