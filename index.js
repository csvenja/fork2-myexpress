'use strict';

var http = require('http');
var Layer = require('./lib/Layer');

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
				if (middleware.handle.length < 4) {
					next(err);
				} else {
					middleware.handle.apply(app, [err, req, res, next]);
				}
			} else {
				if (middleware === undefined) {
					return;
				}
				i++;
				if (middleware.handle.length < 4 && middleware.match(req.url)) {
					try {
						middleware.handle.apply(app, [req, res, next]);
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
	app.__isMyexpressApp__ = true;

	app.listen = function (port, done) {
		return http.createServer(this).listen(port, done);
	};

	app.use = function (route, middleware) {
		if ('string' != typeof route) {
			middleware = route;
			route = '/';
		}
		middleware = new Layer(route, middleware);
		if (middleware.handle.__isMyexpressApp__) {
			this.stack.push.apply(this.stack, middleware.handle.stack);
		} else {
			this.stack.push(middleware);
		}
	};

	return app;
};
