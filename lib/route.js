'use strict';

function makeRoute(verb, handler) {
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
				if (handler.verb === 'all' ||
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

	return route;
}

module.exports = makeRoute;
