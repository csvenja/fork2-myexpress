'use strict';

var express = require('../');
var request = require('supertest');
var http = require('http');
var expect = require('chai').expect;

describe('app', function () {
	describe('create http server', function () {
		var app = express();
		var server = http.createServer(app);

		it('should create a http server', function () {
			expect(server).be.instanceof(http.Server);
		});

		it('should respond to /foo with 404', function (done) {
			request(app)
				.get('/foo')
				.expect(404)
				.end(done);
		});
	});

	describe('#listen', function () {
		var app = express();
		var port = 7000;

		before(function (done) {
			app.listen(port, done);
		});

		it('should listen on port 7000', function (done) {
			request('http://localhost:7000')
				.get('/foo')
				.expect(404)
				.end(done);
		});
	});
});

describe('.use', function () {
	var app = express();

	var m1 = function () {};
	var m2 = function () {};

	it('should be able to add middlewares to stack', function () {
		app.use(m1);
		app.use(m2);
		expect(app.stack.length).to.equal(2);
	});
});

describe("calling middleware stack",function() {
	var app;

	beforeEach(function () {
		app = new express();
	});

	it('should be able to call a single middleware', function (done) {
		var m1 = function (req, res, next) {
			res.end('hello from m1');
		};
		app.use(m1);
		request(app)
			.get('/')
			.expect('hello from m1')
			.end(done);
	});

	it('should be able to call next to go to the next middleware', function (done) {
		var m1 = function (req, res, next) {
			next();
		};

		var m2 = function (req, res, next) {
			res.end("hello from m2");
		};

		app.use(m1);
		app.use(m2);

		request(app)
			.get('/')
			.expect('hello from m2')
			.end(done);
	});

	it('should 404 at the end of middleware chain', function (done) {
		var m1 = function (req, res, next) {
			next();
		};

		var m2 = function (req, res, next) {
			next();
		};

		app.use(m1);
		app.use(m2);

		request(app)
			.get('/')
			.expect(404)
			.end(done);
	});

	it('should 404 if no middleware is added', function (done) {
		app.stack = [];

		request(app)
			.get('/')
			.expect(404)
			.end(done);
	});
});
