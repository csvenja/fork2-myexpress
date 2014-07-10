'use strict';

function makeRoute(verb, handler) {
	var route = function (req, res, next) {
		return route.handle(req, res, next);
	};

	route.handle = function (req, res, next) {};

	route.stack = [];

	route.use = function (verb, handler) {
		this.stack.push({'verb': verb, 'handler': handler});
	};

	return route;
}

module.exports = makeRoute;
