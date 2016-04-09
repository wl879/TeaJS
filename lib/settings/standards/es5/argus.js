var Card;
Card = require("../../../core/card.js");
module.exports = function(node, param){
	var list;
	list = [];
	for (var i = 0; i < node.length; i++){
		list.push(parseItem.call(this, node[i]), ',');
	}
	list.pop();
	return new Card('ArgusExpr', '(', list, ')');
};
function parseItem(node, params){
	var type, vars, index;
	type = node.type;
	vars = this.handle.variables;
	if (type == 'RestExpr'){
		index = node.index;
		if (node.parent.length > index+1){
			vars['i'] = node.parent.length-index-1;
			this.pattern('#HEAD(`@[0] = [].slice.call(arguments, @[index], -@i)`)', node);
		}else {
			this.pattern('#HEAD(`@[0] = [].slice.call(arguments, @[index])`)', node);
		}
		return this.read(node, true);
	}
	if (type == 'AssignExpr'){
		if (vars['i']){
			this.pattern('#HEAD(`@[0] = arguments[arguments.length - @i]`)', node);
			vars['i']--;
		}
		this.pattern('#HEAD(`if (@[0] == null) @`)', node);
		return this.read(node[0]);
	}
	if (vars['i']){
		this.pattern('@ = arguments[arguments.length - @i]`)', node);
		vars['i']--;
	}
	return this.read(node);
};