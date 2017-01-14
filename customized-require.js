"use strict";

var path = require("path");

var Module = require('module');
var _require = Module.prototype.require;

Module.prototype.require = function require(name) {
	var result = null;

	try {
    	result = _require.call(this, name);
	} catch (e){
		var name2 = path.join(__dirname, "..", name);
    	result = _require.call(this, name2);
	}
	return result;
};
