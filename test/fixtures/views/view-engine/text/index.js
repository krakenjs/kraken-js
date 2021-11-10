'use strict';

const fs = require('fs');

function txtHandler() {
    return function renderer(file, options, cb) {
        fs.readFile(file, function onread(err, html) {
            if (err) {
                cb(err);
                return;
            }
            if (html && options) {
                html = html.toString();
                const supported_props = new Set([ 'name' ]);
                for ( const [ name, value ] of Object.entries(options) ) {
                    if (supported_props.has(name)) {
                        html = html.replace(`%${name}%`, value);
                    }
                }
                html = html.trim();
            }
            cb(null, html);
        });
    };
}
module.exports = {
  txtHandler,
  text: txtHandler(),
};
