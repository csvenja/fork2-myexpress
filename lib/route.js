'use strict';

function makeRoute(verb, handler) {
	return function (req, res, next) {
		if (req.method.toUpperCase() === verb.toUpperCase()) {
			handler(req, res, next);
		} else {
			next();
		}
	};
}

module.exports = makeRoute;
