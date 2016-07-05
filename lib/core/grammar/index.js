var Syntax = require("./syntax.js");
var cache = {};
module.exports.cache = cache;
function define(version, name, value){
	if (!cache[version]){
		cache[version] = create(version);
	}
	cache[version].define(name, value);
};
module.exports.define = define;
function create(version){
	var map;
	map = Jsop();
	Object.defineProperty(map, 'define', {
		"writable": false,
		"value": function(name, value){
			this[name] = new Syntax(name, value);
		}});
	Object.defineProperty(map, 'version', {"writable": false, "value": version});
	return map;
};
module.exports.create = create;
function syntax(name, patt, pack_mode){
	return Syntax.compile(name, patt, pack_mode);
};
module.exports.syntax = syntax;
function parse(handle, syntax, params, name, mode){
	var stx, ref;
	if (syntax.isSyntax){
		return syntax.exec(handle, handle.source, params);
	}
	if (handle.sugarBox && (stx = handle.sugarBox.get(syntax))){
		if (ref = parse(handle, stx, params)){
			return ref;
		}
	}
	if (stx = handle.__grammar__[syntax]){
		return parse(handle, stx, params);
	}
	return parse(handle, Syntax.compile(name, syntax, mode), params);
};
module.exports.parse = parse;