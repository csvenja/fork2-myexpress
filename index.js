'use strict';

var http = require('http');

module.exports = function () {
	var app = function (req, res) {
		res.statusCode = 404;
		res.end();
	};

	app.stack = [];

	app.listen = function (port, done) {
		return http.createServer(this).listen(port, done);
	};

	app.use = function (middleware) {
		this.stack.push(middleware);
	};

	return app;
};
