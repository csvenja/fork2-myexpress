'use strict';

var http = require('http');
var mime = require('mime');

var proto = {};

proto.isExpress = true;

proto.redirect = function (statusCode, path) {
	if (!path) {
		path = statusCode;
		statusCode = 302;
	}
	this.writeHead(statusCode, {
		'Location': path,
		'Content-Length': 0
	});
	this.end();
};

proto.type = function (ext) {
	this.setHeader('Content-Type', mime.lookup(ext));
};

proto.default_type = function (ext) {
	if (!this.getHeader('Content-Type')) {
		this.setHeader('Content-Type', mime.lookup(ext));
	}
};

proto.__proto__ = http.ServerResponse.prototype;

module.exports = proto;
