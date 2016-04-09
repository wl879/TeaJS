var id_index;
if (typeof global == 'undefined'){
	if (typeof window == 'undefined'){
		throw 'Tea script run environment error!';
	}
	window.global = window;
}
id_index = 0;
global.SText = require("./stext");
global.Jsop = require("./jsop");
global.print = require("./print");
global.Fp = require("./fp");
global.Argv = require("./argv").create();
global.isArray = Array.isArray;
global.isJson = Jsop.isJson;
global.isClass = Jsop.isClass;
global.ID = function(){
	return parseInt((Date.now()+'').substr(-8)+(id_index++)+Math.round(Math.random()*100))+'';
};
global.checkGlobal = function(){
	var def = 'global process GLOBAL root console Path Tea Fp'.split(' ');
	for (var name in global){
		if (!global.hasOwnProperty(name)) continue;
		if (def.indexOf(name) >= 0){
			continue;
		}
		if (typeof global[name] == 'function'){
			continue;
		}
		print('[r<Global scope pollution>]', name, global[name]);
	}
};