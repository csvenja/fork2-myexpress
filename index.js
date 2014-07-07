'use strict';

var http = require('http');
var Layer = require('./lib/Layer');

module.exports = function () {
	var app = function (req, res) {
		return app.handle(req, res);
	};
	app.handle = function (req, res) {
		var i = 0;
		req.params = {};
		function next(err) {
			var middleware = app.stack[i];
			i++;

			if (middleware === undefined) {
				if (!err) {
					return;
				}
				res.statusCode = 500;
				return res.end();
			}

			var match = middleware.match(req.url);
			if (match) {
				req.params = match.params;
			} else {
				next(err);
			}

			if (err) {
				if (middleware.handle.length >= 4) {
					middleware.handle.apply(app, [err, req, res, next]);
				}
			} else {
				if (middleware.handle.length < 4) {
					try {
						middleware.handle.apply(app, [req, res, next]);
					} catch(error) {
						next(error);
					}
				}
			}

			next(err);
		}
		next();
		res.statusCode = 404;
		return res.end();
	};

	app.stack = [];

	app.listen = function (port, done) {
		return http.createServer(this).listen(port, done);
	};

	app.use = function (route, middleware) {
		if ('string' != typeof route) {
			middleware = route;
			route = '/';
		}
		var layer = new Layer(route, middleware);
		if ('function' === typeof middleware.handle) {
			this.stack.push.apply(this.stack, layer.handle.stack);
		} else {
			this.stack.push(layer);
		}
	};

	return app;
};
