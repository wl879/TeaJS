var Syntax;
Syntax = require("../../core/syntax.js");
module.exports = function(src, params){
	var node;
	this.parser('COMMENT', src, null, false, true);
	if (src.current && src.current.is('BLANK', 'END', 'COMM', 'COMMENT')){
		this.next(src, 1);
	}
	node = this.parser('Block', src, ['brace'], false, true) || new Syntax('Root');
	node.type = 'Root';
	return node;
};