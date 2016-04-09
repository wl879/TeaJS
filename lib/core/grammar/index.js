var Pattern = require("./pattern.js");
var Grammar = require("./grammar.js");
function create(prepor){
	return new Grammar(prepor);
};
module.exports.create = create;
function pattern(text, src, prepor){
	var patt, grm, node;
	patt = Pattern.compile(text);
	if (src){
		grm = new Grammar(prepor);
		node = grm.pattern(patt, src);
		return node;
	}
	return patt;
};
module.exports.pattern = pattern;
function parser(name, src, params, prepor){
	var grm, node;
	grm = new Grammar(prepor);
	node = grm.parser(name, src, params, true);
	if (node && !node.isSyntax && node.length == 1){
		node = node[0];
	}
	return node;
};
module.exports.parser = parser;
function define(name, patt, mode){
	var debug;
	if (mode == 'debug'){
		mode = null;
		debug = true;
	}
	if (!mode){
		if (name.match(/\w+(Token|Expr|Decl|Patt|Stam)$/)){
			mode = 'ret node';
		}else {
			mode = 'not check';
		}
	}
	if (typeof patt == 'function'){
		Grammar[name] = {"name": name, "mode": mode, "fn": patt, "debug": debug};
	}else {
		Grammar[name] = {"name": name, "mode": mode, "pattern": Pattern.compile(patt), "debug": debug};
		if (debug){
			print('| * '+name, Grammar[name].pattern);
		}
	}
	return Grammar[name];
};
module.exports.define = define;