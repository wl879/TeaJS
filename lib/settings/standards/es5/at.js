module.exports = function(node, params){
	var name, scope, member;
	name = 'this';
	scope = node.scope;
	if (scope.valid.type == 'Class'){
		name = scope.valid.name;
	}else {
		if (node[1]){
			member = node[1].text;
		}else if (node.parent.type == 'AccessExpr' && node.parent[1].type == 'MemberExpr'){
			member = node.parent[1][1].text;
		}
		if (member && scope.member(member) == 'static'){
			name = scope.query('Class').name;
		}
		// TODO: AT
		// else if scope.parent.type == 'Function':
		// 	f_scope = scope.parent;
		// 	while f_scope.parent.type == 'Function':
		// 		f_scope = f_scope.parent;
		// 	f_scope.cachePush( 'head', 'var _this = this' );
		// 	name = '_this';
		// 	// console.log('???????', f_scope.name)
		
		if (node[1]){}
		return name+'.@1';
	}
	return name;
};