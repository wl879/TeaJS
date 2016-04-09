var Token, Node, Grammar, Scope, Standard, ref, names, values, ref0, mode, ref1, ref2;
Token = require("../core/token.js");
Node = require("../core/node.js");
Grammar = require("../core/grammar");
Scope = require("../core/scope.js");
Standard = require("../core/standard");
for (var name in (ref = require("./token.js"))){
	if (!ref.hasOwnProperty(name)) continue;
	var value = ref[name];
	names = name.split(' ').filter(function($){return $});
	values = value.replace(/([^\n])\s*\n+\s*/g, '$1  ').split('  ').filter(function($){return $});
	Token.define(names, values);
}
for (var name in (ref0 = require("./syntax"))){
	if (!ref0.hasOwnProperty(name)) continue;
	var value = ref0[name];
	mode = null;
	if (typeof value == 'string'){
		value = value.replace(/\n\s*/g, ' ');
	}
	if (/:debug$/.test(name)){
		mode = 'debug';
		name = name.slice(0, -6);
	}
	Grammar.define(name, value, mode);
}
for (var name in (ref1 = require("./node.js"))){
	if (!ref1.hasOwnProperty(name)) continue;
	var value = ref1[name];
	names = name.split(' ').filter(function($){return $});
	values = value.replace(/\s*\n+\s*/g, '  ').split('  ').filter(function($){return $});
	Node.define(names, values);
}
for (var ref2 = require("./scope.js"), value, i = 0; i < ref2.length; i++){
	value = ref2[i];
	Scope.defineScope(value);
}
Standard.define('es5', require("./standards/es5"));