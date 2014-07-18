'use strict';

function createInjector(handler, app) {
	var injector = function (req, res, next) {
		var loader = injector.dependencies_loader(req, res, next);
		loader(function (err, values) {
			if (err) {
				next(err);
			} else {
				handler.apply(this, values);
			}
		});
	};

	injector.extract_params = function () {
		var fnText = handler.toString();

		if (injector.extract_params.cache[fnText]) {
			return injector.extract_params.cache[fnText];
		}

		var FN_ARGS        = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
		var FN_ARG_SPLIT   = /,/;
		var FN_ARG         = /^\s*(_?)(\S+?)\1\s*$/;
		var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

		var inject = [];
		var argDecl = fnText.replace(STRIP_COMMENTS, '').match(FN_ARGS);

		argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
			arg.replace(FN_ARG, function(all, underscore, name) {
				inject.push(name);
			});
		});
		injector.extract_params.cache[handler] = inject;

		return inject;
	};

	injector.extract_params.cache = {};

	injector.dependencies_loader = function (req, res, next) {
		var loader = function (fn) {
			var err = null;
			var values = [];
			var i = 0;
			var params = injector.extract_params();

			if (!needInject(params)) {
				return fn;
			}

			var default_params = {'req': req, 'res': res, 'next': next};
			Object.keys(default_params).forEach(function (key) {
				app.factory(key, function (req, res, next) {
					next(null, default_params[key]);
				});
			});

			function _next(error, value) {
				if (value) {
					values.push(value);
					app._dependencies[params[i - 1]] = value;
				}
				if (error) {
					err = error;
					return;
				}

				var name = params[i];
				i++;

				if (name) {
					if (app._dependencies[name]) {
						_next(err, app._dependencies[name]);
						return;
					}

					var handler = app._factories[name];
					if (handler) {
						try {
							handler(req, res, _next);
						} catch (e) {
							err = e;
							return;
						}
					} else {
						err = new Error('Factory not defined: ' + name);
						return;
					}
				}
			}
			_next();
			fn(err, values);
		};
		return loader;
	};
	return injector;
}

function needInject(params) {
	var skipRules = [
		[],
		['req'],
		['req', 'res'],
		['req', 'res', 'next'],
		['err', 'req', 'res', 'next'],
		['error', 'req', 'res', 'next']
	];

	for (var i = 0; i < skipRules.length; ++i) {
		if (arraysEqual(skipRules[i], params)) {
			return false;
		}
	}

	return true;
}

function arraysEqual(arr1, arr2) {
	if (arr1 === arr2) return true;
	if (arr1 === null || arr2 === null) return false;
	if (arr1.length != arr2.length) return false;

	for (var i = 0; i < arr1.length; ++i) {
		if (arr1[i] !== arr2[i]) return false;
	}

	return true;
}

module.exports = createInjector;
