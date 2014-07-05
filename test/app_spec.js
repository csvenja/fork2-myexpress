'use strict';

var express = require('../');
var request = require('supertest');
var http = require('http');
var expect = require('chai').expect;

describe('app', function() {
	describe('create http server', function () {
		var app = express();
		var server = http.createServer(app);

		it('should create a http server', function() {
			expect(server).be.instanceof(http.Server);
		});

		it('should respond to /foo with 404', function(done) {
			request(app)
				.get('/foo')
				.expect(404)
				.end(done);
		});
	});

	describe("#listen", function () {
		var app = express();
		var port = 7000;

		before(function(done) {
			app.listen(port, done);
		})

		it('should listen on port 7000', function(done) {
			request("http://localhost:7000")
				.get("/foo")
				.expect(404)
				.end(done);
		});
	});
});
