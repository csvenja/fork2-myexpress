'use strict';

var http = require('http');
var methods = require('methods').concat('all');
var Layer = require('./lib/Layer');
var makeRoute = require('./lib/route');
var createInjector = require('./lib/injector');
var reqExtension = require('./lib/request');
var resExtension = require('./lib/response');

module.exports = function () {
	var app = function (req, res, next) {
		app.monkey_patch(req, res);
		req.app = app;
		return app.handle(req, res, next);
	};

	app.stack = [];
	app._factories = {};
	app._dependencies = {};

	app.handle = function (req, res, next) {
		var i = 0;
		var removed = '';
		var slashAdded = false;
		req.params = {};
		var restoreApp = null;
		if (!app._dependencies) {
			app._dependencies = {};
		}

		function _next(err) {
			if (slashAdded) {
				req.url = req.url.substr(1);
				slashAdded = false;
			}
			req.url = removed + req.url;
			removed = '';

			if (restoreApp) {
				req.app = restoreApp;
				restoreApp = null;
			}

			var middleware = app.stack[i];
			i++;

			if (!middleware) {
				if (next) {
					return next(err);
				} else {
					if (!err) {
						res.statusCode = 404;
						return res.end();
					}
					res.statusCode = err.statusCode || 500;
					return res.end();
				}
			}

			var match = middleware.match(req.url);
			if (match) {
				req.params = match.params;
				if ('function' === typeof middleware.handle.handle) {
					restoreApp = req.app;
					req.app = middleware;

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
		return app;
	};

	app.route = function (path) {
		var route = makeRoute();
		var layer = new Layer(path, route, true);
		this.stack.push(layer);
		return route;
	};

	methods.forEach(function (method) {
		app[method] = function (path, handler) {
			var route = app.route(path);
			route[method](handler);
			return app;
		};
	});

	app.factory = function (name, fn) {
		if ('function' === typeof fn) {
			this._factories[name] = fn;
		} else {
			throw new Error();
		}
	};

	app.inject = function (handler) {
		var injector = createInjector(handler, app);
		return injector;
	};

	app.monkey_patch = function (req, res) {
		req.__proto__ = reqExtension;
		res.__proto__ = resExtension;
		req.res = res;
		res.req = req;
	};

	return app;
};
