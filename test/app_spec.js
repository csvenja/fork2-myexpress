'use strict';

var express = require('../');
var request = require('supertest');
var http = require('http');
var expect = require('chai').expect;

describe('app', function() {
	describe('create http server', function () {
		var app;
		var server;

		before(function () {
			app = express();
			server = http.createServer(app);
		});

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
});
