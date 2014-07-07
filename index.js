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

			var url = req.url;
			req.url = req.url.substr(middleware.trim.length);
			var match = middleware.match(req.url);
			if (match) {
				req.params = match.params;
			} else {
				req.url = url;
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
						err = error;
					}
				}
			}
			req.url = url;
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
			for (var i = 0; i < layer.handle.stack.length; i++) {
				layer.handle.stack[i].trim = layer.route + layer.handle.stack[i].trim;
				this.stack.push(layer.handle.stack[i]);
			}
		} else {
			this.stack.push(layer);
		}
	};

	return app;
};
