'use strict';

var request = require('supertest');
var expect = require('chai').expect;

var express = require('../');

describe('Implement Dependencies Caching:',function() {
	var app = express();
	it('should cache the same dependency', function(done) {
		var times = 0;
		app.factory('test', function(req, res, next) {
			times += 1;
			next(null, times);
		});
		app.use(app.inject(function(next, test) {
			next();
		}));
		app.use(app.inject(function(req, res, test) {
			expect(test).to.eql(1);
			expect(app._dependencies.test).to.eql(1);
			return res.end(200);
		}));
		request(app).get('/').expect(200).end(done);
	});
});
