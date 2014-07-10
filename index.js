'use strict';

var http = require('http');
var methods = require('methods');
var Layer = require('./lib/Layer');
var makeRoute = require('./lib/route');

module.exports = function () {
	var app = function (req, res, next) {
		return app.handle(req, res, next);
	};

	app.handle = function (req, res, next) {
		var i = 0;
		var removed = '';
		var slashAdded = false;
		req.params = {};
		function _next(err) {
			if (slashAdded) {
				req.url = req.url.substr(1);
				slashAdded = false;
			}
			req.url = removed + req.url;
			removed = '';

			var middleware = app.stack[i];
			i++;

			if (middleware === undefined) {
				if (next) {
					return next(err);
				} else {
					if (!err) {
						res.statusCode = 404;
						return res.end();
					}
					res.statusCode = 500;
					return res.end();
				}
			}

			var match = middleware.match(req.url);
			if (match) {
				req.params = match.params;
				if ('function' === typeof middleware.handle.handle) {
					removed = middleware.route;
					req.url = req.url.substr(removed.length);
					if ('/' != req.url[0]) {
						req.url = '/' + req.url;
						slashAdded = true;
					}
				}
			} else {
				_next(err);
			}

			if (err) {
				if (middleware.handle.length >= 4) {
					middleware.handle.apply(app, [err, req, res, _next]);
				}
			} else {
				if (middleware.handle.length < 4) {
					try {
						middleware.handle.apply(app, [req, res, _next]);
					} catch(error) {
						err = error;
					}
				}
			}
			_next(err);
		}
		_next();
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
		this.stack.push(layer);
	};

	methods.forEach(function (method) {
		app[method] = function (route, handler) {
			var middleware = makeRoute(method, handler);
			var layer = new Layer(route, middleware, true);
			this.stack.push(layer);
		};
	});

	return app;
};
