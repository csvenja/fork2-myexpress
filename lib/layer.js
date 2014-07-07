'use strict';

function Layer (route, middleware) {
	this.route = route;
	this.handle = middleware;
}

Layer.prototype.match = function (newRoute) {
	if (this.route === newRoute.substr(0, this.route.length)) {
		return {path: this.route};
	}
	return undefined;
};

module.exports = exports = Layer;
