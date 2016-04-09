var Card;
Card = require("../../../core/card.js");
module.exports = function(node, params){
	var list, vars, right, left, parser, left_len;
	list = [];
	vars = this.handle.variables;
	right = node[2];
	left = node[0];
	parser = parseItem;
	if (!(right.is('ArrayExpr', 'Variable', 'AccessExpr'))){
		list.push(this.pattern('@ref = @', right), ',');
		right = vars.ref;
	}else if (right.type == 'ArrayExpr'){
		parser = parseArrayRight;
	}
	left_len = left.length;
	for (var i = 0; i < left.length; i++){
		list.push(parser.call(this, left[i], right, vars, left_len), ',');
	}
	list.pop();
	if (node.parent.is('ArgusStam')){
		return list;
	}
	return new Card('ArrayAssignExpr', list);
};
function parseItem(left, right, variables, left_len){
	var index;
	index = variables.index || 0;
	variables.index = index+1;
	if (left.type == 'RestExpr'){
		if (left_len > index+1){
			variables.slice = true;
			return this.pattern('@[0] = [].slice.call(@[1], @[2], @[1].length - @[3])', [left, right, index, left_len-index-1], 'AssignExpr');
		}else {
			return this.pattern('@[0] = [].slice.call(@[1], @[2])', [left, right, index+''], 'AssignExpr');
		}
	}
	if (variables.slice){
		return this.pattern('@[0] = @[1][@[1].length - @[2]]', [left, right, left_len-index], 'AssignExpr');
	}
	return this.pattern('@[0] = @[1][@[2]]', [left, right, index+''], 'AssignExpr');
};
function parseArrayRight(left, right, variables, left_len){
	var index;
	index = variables.index || 0;
	variables.index = index+1;
	if (index >= right.length){
		return this.read(left);
	}
	if (left.type == 'RestExpr'){
		if (left_len > index+1){
			variables.index = right.length-(left_len-index-1);
			return this.pattern('@[0] = [#COMMA(@[1])]', [left, Jsop.toArray(right, index, variables.index)]);
		}else {
			return this.pattern('@[0] = [#COMMA(@[1])]', [left, Jsop.toArray(right, index)]);
		}
	}
	return this.pattern('@[0] = @[1]', [left, right[index]]);
};