'use strict';

var http = require('http');

module.exports = function () {
	var app = function (req, res) {
		var i = 0;
		function next(err) {
			var middleware = app.stack[i];
			if (err) {
				if (middleware === undefined) {
					res.statusCode = 500;
					res.end();
				}
				i++;
				if (middleware.length < 4) {
					next(err);
				} else {
					middleware.apply(app, [err, req, res, next]);
				}
			} else {
				if (middleware === undefined) {
					return;
				}
				i++;
				if (middleware.length < 4) {
					try {
						middleware.apply(app, [req, res, next]);
					} catch(error) {
						res.statusCode = 500;
						res.end();
					}
				} else {
					next();
				}
			}
		}
		next();
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
