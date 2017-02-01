/**
 * @copyright (c) 2016 Stephan Ahlf
 * @license MIT
 * @author Stephan Ahlf
*/ 
var fs = require("fs");
var path = require("path");
var events = require("events");
var ApplicationNotifier = require("./app.notifier.js");
var GUI = require("./app.GUI.js");


/**
 * @class ApplicationController
 * @param {Object} config - ApplicationController configuration
*/
var ApplicationController = function(config) {
	this.config = config;
	var Config = require("user-appdata");
	var config = new Config({appname : "sulu", defaultSettings : {
	}}); 
	config.settings.home = path.join(__dirname, "..", "..");
	config.save();
	this.config = config;
	this.GUI = new GUI(this);
	var applicationNotifier = new ApplicationNotifier(this);
	this.error = applicationNotifier.error;
	this.msg = applicationNotifier.msg;
	this.dlg = applicationNotifier.dlg;
	this.events = new events.EventEmitter();
	this.registeredHotKeys = [];
	return this;
};


/**
* Determines if a function has a name.
* @param {function} fn - a JavaScript function
* @returns {String} The name of function
*/
ApplicationController.prototype.getFunctionName = function(fn) {
	var ret = fn.toString();
	ret = ret.substr("function ".length);
	ret = ret.substr(0, ret.indexOf("(")).trim();
	if (ret === "") {
		ret = null;
	}
	if (!ret){
		throw 'could not determine function name of \"' + fn.toString() + '\"';
	}
	return ret;
}

/**
* [Obsolete] Registers a shortcut (https://github.com/madrobby/keymaster#supported-keys).
* @param {String} key - A comma seperated list of short cut keys.
* @param {function} fn - A named JavaScript function.
*/
ApplicationController.prototype.registerHotKey = function(key, fn) {
	console.warn("registerHotKey(\"" + key + "\", fn) is obsolete - Create a \"suluPackage\" object with \"hotkeys\" section in your package.json file instead.");
	var functionName  = this.getFunctionName(fn);
	if (!this.registeredHotKeys){
		this.registeredHotKeys = [];
	} 
 
	this.registeredHotKeys.push({
		name: functionName,
		f : fn,
		key: key
	});
	console.warn("press \"" + key + "\" to \"" + functionName + "\"");
	window.key(key, "global", fn.bind(this));
	window.key.setScope("global");
}; 

ApplicationController.prototype.registerHotkey = function(hotkey, f) {
	if (!this.registeredHotKeys){
		this.registeredHotKeys = [];
	} 
 
	this.registeredHotKeys.push({
		name: hotkey.function,
		f : f,
		key: hotkey.key
	});
	console.debug("press \"" + hotkey.key + "\" to \"" + hotkey.function + "\"");
	window.key(hotkey.key, "global", f.bind(this));
	window.key.setScope("global");
};  

ApplicationController.prototype.registerAsLoadedModule = function(fn) {
	var p = path.join(__dirname, "package.json");
	var f = JSON.parse( fs.readFileSync(p).toString());
	this.packageController.loadedPlugins.push({
		dir: __dirname,
		instance : this,
		meta: f
	});
}

ApplicationController.prototype.isFunction = function(f) {
	return typeof(f === "function");
}

ApplicationController.prototype.isCommandFunction = function(package, parentProperty, hotkey) {
	return (package.instance.hasOwnProperty(parentProperty) && this.isFunction(package.instance[parentProperty][hotkey.function]));
}

ApplicationController.prototype.registerHotKeys = function() {

	for (var i = 0; i < this.packageController.loadedPlugins.length; i++) {
		var package = this.packageController.loadedPlugins[i];
		if (package.meta.suluPackage.hotkeys){
			for (var h = 0; h < package.meta.suluPackage.hotkeys.length; h++) {
				var hotkey = package.meta.suluPackage.hotkeys[h];
				var f = null;
				if (this.isCommandFunction(package, "command", hotkey)){
					f = package.instance.command[hotkey.function];
				}
				if (this.isCommandFunction(package, "GUI", hotkey)){
					f = package.instance.GUI[hotkey.function];
				}
				if (f !== null){
					this.registerHotkey(hotkey, f);
				}
			}
		}
	}
}

/**
* Auto scans and loads installed packages.
*/
ApplicationController.prototype.requireAll = function() {
	var result = false;
	var meta;
	try{
		window.key = require("keymaster");
		this.packageController = require("package.js");
		var folders = [path.join(__dirname, "..")];
		
		this.packageController.autoload({
			debug: false,
			directories: folders,
			identify: function() {
				var identified = (
					this.meta.suluPackage === true || typeof(this.meta.suluPackage) === "object"
				);
				if (identified){
					meta = this.meta; 
					identified = (meta.suluPackage.init !== false);
				}
				return identified;
			},
			packageContstructorSettings: {app : this}
		});

		this.registerAsLoadedModule();
		this.registerHotKeys();
		result = true;
	} catch (e) {
		e.suluPackage = meta;
		this.error(e);
	}
	return result;
};

/**
* Import external CSS code file.
* @param {String} path - Relative or absulote path to file.
*/
ApplicationController.prototype.loadCSS = function(path) {
	var head  = document.getElementsByTagName("head")[0];
	var link  = document.createElement("link");
	link.rel  = "stylesheet";
	link.type = "text/css";
	link.href = path;
	link.media = "all";
	head.appendChild(link);
};

/**
* Import external HTML code file.
* @param {String} path - Relative or absulote path to file.
*/
ApplicationController.prototype.loadHTML = function(path) {
	var head  = document.getElementsByTagName("head")[0];
	var link  = document.createElement("link");
	// link.id   = "cssId";
	link.rel  = "import";
	link.href = path;
	head.appendChild(link);
};

/**
* Import external JavaScript code file.
* @param {String} path - Relative or absulote path to file.
*/
ApplicationController.prototype.loadJS = function(path) {
	var head  = document.getElementsByTagName("head")[0];
	var script  = document.createElement("script");
	// link.id   = "cssId";
	script.type = "text/javascript";
	script.src = path;
	head.appendChild(script);
};

ApplicationController.prototype.initialize = function() {
	var result = this.requireAll();
	return result;
};

module.exports = ApplicationController;