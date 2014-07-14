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
	var types = Object.keys(formats);
	if (types.length > 0) {
		var format = accept.types(types);
		this.setHeader('Content-Type', mime.lookup(format));
		formats[format]();
	} else {
		var err = new Error('Not Acceptable');
		err.statusCode = 406;
		throw err;
	}
};

proto.send = function (data) {
	if ('string' === typeof data) {
		this.default_type('html');
	} else if (data instanceof Buffer) {
		this.setHeader('Content-Type', 'application/octet-stream');
	}

	this.end(data);
};

proto.__proto__ = http.ServerResponse.prototype;

module.exports = proto;
