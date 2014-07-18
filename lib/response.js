'use strict';

var http = require('http');
var mime = require('mime');
var accepts = require('accepts');
var crc32 = require('buffer-crc32');
var fs = require('fs');
var path = require('path');
var rparser = require('range-parser');

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

proto.send = function (code, data) {
	if (arguments.length == 1 && 'number' !== typeof code) {
		data = code;
		code = 200;
	}

	if ('string' === typeof data) {
		this.default_type('html');
		this.setHeader('Content-Length', Buffer.byteLength(data));
	} else if (data instanceof Buffer) {
		this.setHeader('Content-Type', 'application/octet-stream');
		this.setHeader('Content-Length', data.length);
	} else if ('object' === typeof data) {
		if (!this.getHeader('Content-Type')) {
			this.type('json');
		}
		data = JSON.stringify(data);
	}

	if (data &&
		this.req.method.toUpperCase() === 'GET' &&
		!this.getHeader('ETag')) {
		var etag = crc32.unsigned(data);
		this.setHeader('ETag', '"' + etag + '"');
	}

	if (this.getHeader('ETag') && this.getHeader('ETag') === this.req.headers['if-none-match']) {
		code = 304;
	}

	if (this.getHeader('Last-Modified') <= this.req.headers['if-modified-since']) {
		code = 304;
	}

	this.statusCode = code;

	if (data || data === '') {
		this.end(data);
	} else {
		this.end(http.STATUS_CODES[String(code)]);
	}
};

proto.stream = function (stream) {
	var res = this;
	stream.pipe(res);
};

proto.sendfile = function (data, options) {
	var res = this;

	if (options && options.hasOwnProperty('root')) {
		data = path.normalize(options.root + data);
	}

	if (data.indexOf('..') > -1) {
		return res.send(403);
	}

	fs.stat(data, function (err, stat) {
		if (err) {
			return res.send(404);
		}

		if (stat.isDirectory()) {
			return res.send(403);
		}

		var opts = {};
		var range = res.req.headers.range;
		if (range) {
			var r = rparser(stat.size, range);

			if (r === -1) {
				return res.send(416);
			}

			if (r instanceof Array) {
				opts = r[0];
				res.statusCode = 206;
				res.setHeader('Content-Range', r.type + ' ' + opts.start + '-' + opts.end + '/' + stat.size);
				res.setHeader('Accept-Range', r.type);
			}
		}

		var file = fs.createReadStream(data, opts);

		res.stream(file);
		res.type(path.extname(data));
		res.setHeader('Content-Length', stat.size);
		if (!res.getHeader('Accept-Range')) {
			res.setHeader('Accept-Range', 'bytes');
		}
	});

};

proto.__proto__ = http.ServerResponse.prototype;

module.exports = proto;
