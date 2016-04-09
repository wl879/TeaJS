var Card;
Card = require("../../../core/card.js");
module.exports = function(node, params){
	var list, vars, right, left, left_len;
	list = [];
	vars = this.handle.variables;
	right = node[2];
	left = node[0];
	if (!(right.is('Variable', 'AccessExpr'))){
		list.push(this.pattern('@ref = @', right), ',');
		right = vars.ref;
	}
	vars.right = right;
	left_len = left.length;
	for (var i = 0; i < left.length; i++){
		list.push(parseItem.call(this, left[i], right, vars, left_len), ',');
	}
	list.pop();
	return new Card('ArrayAssignExpr', list);
};
function parseItem(left, right, variables, left_len){
	if (left.type == 'AssignExpr'){
		return this.pattern('@2 = @right["@0"]', left);
	}
	return this.pattern('@ = @right["@"]', left);
};