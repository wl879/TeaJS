var Standard = require("./standard.js");
var Pattern = require("./pattern.js");
var Scope = require("../scope.js");
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
			var std, ref;
			std = new Standard(value);
			for (var ref = name.split(' '), name, i = 0; i < ref.length; i++){
				name = ref[i];
				if (!/^[A-Z]/.test(name)){
					Tea.error(5001, name);
				}
				this[name] = std;
			}
		}});
	Object.defineProperty(map, 'version', {"writable": false, "value": version});
	return map;
};
module.exports.create = create;
function standard(patt){
	return Standard.compile(patt);
};
module.exports.standard = standard;
function pattern(patt){
	return Pattern.compile(patt);
};
module.exports.pattern = pattern;
function parse(handle, std, node, params){
	var ref;
	if (std){
		if (std.isStandard || std.isTransformPattern){
			return std.exec(handle, node, params);
		}
		if (std.isNode || std.isToken){
			node = std, std = null;
		}
	}
	if (std){
		if (/^[a-z]+$/i.test(std)){
			ref = checkStandard(handle, std, node, params);
		}else if (/^\s*(if|else if|else|each|switch)\s*\(.*?\)\s*:/m.test(std)){
			ref = parse(handle, Standard.compile(std), node, params);
		}else {
			ref = parse(handle, Pattern.compile(std), node, params);
		}
		if (ref && ref.isNode){
			ref = ref != node ? parse(handle, ref) : null;
		}
	}else {
		if (Scope.test(node)){
			node.scope.check(node).alias(node);
		}
		ref = checkStandard(handle, node.type, node, params);
		if (!ref || ref == node){
			if (node.isToken){
				return node;
			}
			ref = handle.card(node.type);
			for (var sub, i = 0; i < node.length; i++){
				sub = node[i];
				sub && ref.add(parse(handle, sub));
			}
		}
	}
	return ref;
};
module.exports.parse = parse;
/**
 * 
 */
function checkStandard(handle, name, node, params){
	var ss, ref;
	if (ss = handle.sugarBox && handle.sugarBox.get(name, 'std')){
		ref = handle.transform(ss.value(handle, node, node.scope), node, params);
	}
	if (ref == null){
		if (handle.__standard__[name]){
			ref = handle.transform(handle.__standard__[name], node, params);
		}
		if (ref == null && handle.__standard__.version != 'es5'){
			if (STANDARD['es5'][name]){
				ref = handle.transform(STANDARD['es5'][name], node, params);
			}
		}
	}
	return ref;
};