'use strict';

var http = require('http');

module.exports = function () {
	var app = function (req, res) {
		res.statusCode = 404;
		res.end();
	};
	app.listen = function (port, done) {
		return http.createServer(this).listen(port, done);
	};
	return app;
};
