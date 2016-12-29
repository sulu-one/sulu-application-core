/**
 * @copyright (c) 2016 Stephan Ahlf
 * @license MIT
 * @author Stephan Ahlf
*/

var fs = require("fs");
var path = require("path");

/**
 * @class ApplicationNotifier
 * @param {ApplicationController} app - the ApplicationController
 * @borrows ApplicationController as app
*/
var ApplicationNotifier = function  (app) {
	this.app = app;
	this.ironOverlayClosed = function() {};
	document.querySelector("#dialog").addEventListener("iron-overlay-closed", this.ironOverlayClosed);
	return this;
};


/**
* Show a toaster with a given message string.
* @param {String} msg - the toaster message
*/
ApplicationNotifier.prototype.msg = function(msg) {
	/*var notifier = require('node-notifier');
	notifier.notify(msg);*/
	document.querySelector("#toast").text = msg;
	document.querySelector("#toast").show();
};

/**
* Show a toaster with a given message string.
* @param {String} msg - the toaster message
*/
ApplicationNotifier.prototype.error = function(err) {
	var fn = path.join(this.GUI.app.config.dataFolder, "error.log");
	const {dialog} = require('electron').remote; 
	var PrettyError = require('pretty-error');
	var pe = new PrettyError();
	pe.withoutColors();
	pe.skipNodeFiles(); // this will skip events.js and http.js and similar core node files
	pe.skipPackage('express'); // this will skip all the trace lines about express` core and sub-modules
	var renderedError = pe.render(err);  
	document.querySelector("#toast").text = "Error! Press \"F12\" to show console or take a look at \"" + fn + "\".";
	document.querySelector("#toast").show();
	console.error(err);
	console.error(renderedError);
	var text = new Date().toISOString() + "\r\n" + "\r\n" + renderedError.replace(/\n/g, "\r\n") + "\r\n";
	fs.appendFile(fn, text, function (err) {
		console.warn("wrote error to ", fn);
	});
};


/**
* Show a dialog with the given settings.
* @param {String} settings - the dialog settings
* @param {Function} done - the dialog close callback
*/
ApplicationNotifier.prototype.dlg = function(settings, done) {
	var self = this;
	if (!settings.buttons){
		settings.buttons = {id: 0, text: "Cancel"}
	}

	var buttons = [];
	for (var i = 0; i < settings.buttons.length; i++) {
		var btn = settings.buttons[i];
		buttons.push('<paper-button dialog-confirm onclick="document.querySelector(\'#dialog\').action=\'' + btn.id + '\';" ' + (btn.autofocus ? "autofocus" : "") + ">" + btn.text + "</paper-button>");
	}
	document.querySelector("#dialog-buttons").innerHTML = buttons.join("");

	var content = "<" + settings.polymerElementName + ' id="' + settings.polymerElementName + '"></' + settings.polymerElementName + ">";
	document.querySelector("#dialog-content").innerHTML = content;

	var dlg = document.querySelector("#dialog");
	dlg.removeEventListener("iron-overlay-closed", this.ironOverlayClosed);
	this.ironOverlayClosed = function(){
		debugger;
		window.document.onkeydown = self.app.GUI.onKeyBoardInput.bind(this);
		done()
	};

	dlg.action = "-1";
	this.ironOverlayClosed = function(e) {
		var btnIndex = parseInt(e.target.action, 10);
		var model = $("#" + settings.polymerElementName).data("controller");
		if (done){
			var context = {event:e, result : btnIndex, model: model, app: self, el: this};
			done.bind(context)();
		}
		window.key.setScope("global");
	};
	dlg.addEventListener("iron-overlay-closed", this.ironOverlayClosed);
	window.key.setScope("modal-dialog");
	window.document.onkeydown = null;
	dlg.open();
};


module.exports = ApplicationNotifier;