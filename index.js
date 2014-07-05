'use strict';

var http = require('http');

module.exports = function () {
	var app = function (req, res) {
		res.statusCode = 404;
		res.end();
	};
	return app;
};
