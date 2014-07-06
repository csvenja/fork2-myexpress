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

describe('calling middleware stack',function () {
	var app;

	beforeEach(function () {
		app = new express();
	});

	it('should be able to call a single middleware', function (done) {
		var m1 = function (req, res) {
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

		var m2 = function (req, res) {
			res.end('hello from m2');
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

describe('error handling', function () {
	var app;

	beforeEach(function () {
		app = new express();
	});

	it('should return 500 for unhandled error', function (done) {
		var m1 = function (req, res, next) {
			next(new Error('boom!'));
		};

		app.use(m1);

		request(app)
			.get('/')
			.expect(500)
			.end(done);
	});

	it('should return 500 for uncaught error', function (done) {
		var m1 = function () {
			throw new Error('boom!');
		};

		app.use(m1);

		request(app)
			.get('/')
			.expect(500)
			.end(done);
	});

	it('should skip error handlers when next is called without an error', function (done) {
		var m1 = function (req, res, next) {
			next();
		};

		var e1 = function (err, req, res, next) {};

		var m2 = function (req, res) {
			res.end('m2');
		};

		app.use(m1);
		app.use(e1);
		app.use(m2);

		request(app)
			.get('/')
			.expect('m2')
			.end(done);
	});

	it('should skip normal middlewares if next is called with an error', function (done) {
		var m1 = function (req, res, next) {
			next(new Error('boom!'));
		};

		var m2 = function () {};

		var e1 = function (err, req, res, next) {
			res.end('e1');
		};

		app.use(m1);
		app.use(m2);
		app.use(e1);

		request(app)
			.get('/')
			.expect('e1')
			.end(done);
	});
});

describe('app embedding as middleware', function () {
	var app;
	var subApp;

	beforeEach(function () {
		app = new express();
		subApp = new express();
	});

	it('should pass unhandled request to parent', function (done) {
		function m2(req, res) {
			res.end('m2');
		}

		app.use(subApp);
		app.use(m2);

		request(app)
			.get('/')
			.expect('m2')
			.end(done);
	});

	it('should pass unhandled error to parent', function (done) {
		function m1(req, res, next) {
			next('m1 error');
		}

		function e1(err, req, res, next) {
			res.end(err);
		}

		subApp.use(m1);

		app.use(subApp);
		app.use(e1);

		request(app)
			.get('/')
			.expect('m1 error')
			.end(done);
	});

	it('should work as middleware', function (done) {
		function m(req, res, next) {
			res.write('m ');
			next();
		}

		function subm(req, res, next) {
			res.write('subm');
			next();
		}

		subApp.use(subm);

		app.use(m);
		app.use(subApp);

		request(app)
			.get('/')
			.expect('m subm')
			.end(done);
	});
});
