'use strict';

function createInjector(handler, app) {
	var injector = function (req, res, next) {};

	injector.extract_params = function () {
		var fnText = handler.toString();
		if (injector.extract_params.cache[fnText]) {
			return injector.extract_params.cache[fnText];
		}

		var FN_ARGS        = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
			FN_ARG_SPLIT   = /,/,
			FN_ARG         = /^\s*(_?)(\S+?)\1\s*$/,
			STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

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

	return injector;
}



module.exports = createInjector;
