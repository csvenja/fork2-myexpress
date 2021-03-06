'use strict';

var p2re = require('path-to-regexp');

function Layer (route, middleware, fullPath) {
	this.names = [];
	this.route = decodeURIComponent(route);
	this.re = p2re(this.route, this.names, {end: fullPath || false});
	this.handle = middleware;
}

Layer.prototype.match = function (newRoute) {
	newRoute = decodeURIComponent(newRoute);
	if (this.re.test(newRoute)) {
		var dict = {};
		var exec = this.re.exec(newRoute);
		for (var i = 0; i < this.names.length; i++) {
			dict[this.names[i].name] = exec[i + 1];
		}
		return {path: exec[0],
				params: dict};
	}
};

module.exports = exports = Layer;
