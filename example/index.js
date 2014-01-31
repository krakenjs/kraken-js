'use strict';

var express = require('express'),
    kraken = require('../');

var app = express();
app.use(kraken());
app.listen(8000);