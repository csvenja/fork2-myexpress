'use strict';

function Layer (route, middleware) {
	this.handle = middleware;
	this.match = function (newRoute) {
		if (route === newRoute.substr(0, route.length)) {
			return {path: route};
		}
		return undefined;
	};
}

module.exports = Layer;
