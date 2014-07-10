'use strict';

var methods = require('methods');

function makeRoute() {
	var route = function (req, res, next) {
		return route.handle(req, res, next);
	};

	route.handle = function (req, res, next) {
		var i = 0;
		function _next(err) {
			if (err == 'route') {
				if (next) {
					return next();
				}
			}

			if (err) {
				throw err;
			}

			var handler = route.stack[i];
			i++;

			if (!handler) {
				if (next) {
					return next();
				} else {
					return res.end();
				}
			} else {
				if (handler.verb.toUpperCase() === 'ALL' ||
					req.method.toUpperCase() === handler.verb.toUpperCase()) {
					handler.handler(req, res, _next);
				}
			}
			_next(err);
		}
		_next();
	};

	route.stack = [];

	route.use = function (verb, handler) {
		this.stack.push({'verb': verb, 'handler': handler});
	};

	methods.forEach(function (method) {
		route[method] = function (handler) {
			route.use(method, handler);
			return route;
		};
	});

	route.all = function (handler) {
		route.use('all', handler);
		return route;
	};

	return route;
}

module.exports = makeRoute;
