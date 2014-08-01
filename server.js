var	path = require('path');
var express = require('express');
var app = express();

app.use(express.json());
app.use(express.static(__dirname));
var server = app.listen(3001);
console.log('Listening on port 3001...');

