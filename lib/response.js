'use strict';

var http = require('http');
var mime = require('mime');
var accepts = require('accepts');

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

proto.format = function (formats) {
	var accept = accepts(this.req);
	var format = accept.types(Object.keys(formats));
	console.log(format);
	if (format == false) {
		this.setHeader('Content-Type', mime.lookup(format));
		formats[format]();
	} else {
		var err = new Error('Not Acceptable');
		err.statusCode = 406;
		throw err;
	}
};

proto.__proto__ = http.ServerResponse.prototype;

module.exports = proto;
