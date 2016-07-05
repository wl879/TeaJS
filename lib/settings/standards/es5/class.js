module.exports = function(heap, node, param){
	switch (node.type){
		case 'ClassDecl':case 'ClassExpr':
			return parseClassDecl.call(this, heap, node);
		case 'ConstructorDecl':
			return parseConstructorDecl.call(this, heap, node);
		case 'SetterDecl':
			return parseSetterDecl.call(this, heap, node);
		case 'GetterDecl':
			return parseGetterDecl.call(this, heap, node);
		case 'StaticDecl':
			return parseStaticDecl.call(this, heap, node);
		case 'SuperExpr':
			return parseSuperExpr.call(this, heap, node);
		case 'AtExpr':
			return parseAtExpr.call(this, heap, node);
	}
};
function parseClassDecl(heap, node){
	var scope, i, name, extend, block, clas;
	scope = node.scope;
	if (!scope.name){
		if (node.parent.type == 'AssignExpr' && node.parent[0].type == 'VariableExpr'){
			scope.name = node.parent[0].text;
		}else {
			scope.name = '_class_';
		}
	}
	if (node[i = 1].type == 'NameExpr'){
		name = node[i++];
	}
	if (node[i].type == 'ExtendsExpr' || node[i].type == 'ExtendsMix'){
		extend = node[i++];
	}
	block = parseClassBlock.call(this, heap, node[i], extend);
	clas = this.card(node.type);
	if (node.type == 'ClassDecl'){
		clas.add('var '+scope.name+' = ');
	}
	clas.add('(function()', block, ')()');
	return clas;
};
function parseClassBlock(heap, node, extend){
	var scope, block, head, foot, body;
	scope = node.scope;
	block = this.transform('{#head#foot}', node);
	head = block[1];
	foot = block[2];
	body = this.card('BodyNode');
	block.insert(2, body);
	for (var item, i = 0; i < node.length; i++){
		item = node[i];
		switch (item.type){
			case 'ConstructorDecl':
				head.insert(0, this.transform(item));
				break;
			case 'AssignExpr':
				if (item[0].type == 'VariableExpr'){
					body.add(this.transform("@name.prototype.@0 = @2", item));
				}else {
					body.add(this.transform(item));
				}
				break;
			default:
				body.add(this.transform(item));
				break;
		}
	}
	if (extend){
		head.insert(1, parseExtends.call(this, heap, extend));
	}
	foot.add('return '+scope.name);
	return block;
};
function parseExtends(heap, node){
	var param, list, mixin;
	param = node[1];
	list = [];
	if (node.type == 'ExtendsExpr'){
		list.push(this.transform('@[Class.name].prototype = Object.create(@[0].prototype, {constructor:{value:@name}})', param, 'ExtendsExpr'));
		if (param.length > 1){
			mixin = this.transform('[#join(1)]', param);
		}
	}else {
		mixin = this.transform('[#join]', param);
	}
	if (mixin){
		list.push(this.card('MixExpr', "(function(mixin){\n\tfor(var i = 0, mix; i < mixin.length; i++){for (var k in (mix = mixin[i].prototype))if (mix.hasOwnProperty(k))Object.defineProperty(this, k, Object.getOwnPropertyDescriptor(mix, k))}\n).call(", node.scope.name, ",", mixin, ")"));
	}
	return list;
};
function parseConstructorDecl(heap, node){
	return this.transform('function @[Class.name]@1@2', node);
};
function parseSetterDecl(heap, node){
	return this.transform('@[Class.name].prototype.__defineSetter__("@0", function@1@2)', node);
};
function parseGetterDecl(heap, node){
	return this.transform('@[Class.name].prototype.__defineGetter__("@0", function@1@2)', node);
};
function parseStaticDecl(heap, node){
	if (node[0].type == 'MethodDecl'){
		return this.transform(node[0]);
	}else {
		return this.transform('#join("@[Class.name].@", false)', node[0], 'List');
	}
};
function parseSuperExpr(heap, node){
	var scope, class_scope, params;
	scope = node.scope;
	class_scope = scope.query('ClassScope');
	if (!class_scope){
		Tea.error(1115, node);
	}
	heap.variable('super', 'Object.getPrototypeOf('+class_scope.name+'.prototype)');
	if (node[1] && node[1].type == 'MemberExpr'){
		heap.variable('member', this.transform(node[1]));
		params = node[2];
	}else {
		heap.variable('member', '.'+scope.name);
		params = node[1];
	}
	if (params){
		return this.transform('@super@member.call(this, #join)', params, 'SuperExpr');
	}else {
		return this.card('SuperExpr', heap.variable('super'));
	}
};
function parseAtExpr(heap, node, params){
	var name, scope, parent, member;
	name = 'this';
	scope = node.scope;
	if (scope.valid.type == 'ClassScope'){
		name = scope.valid.name;
	}else {
		parent = scope.parent;
		if (node[1]){
			member = node[1].text;
		}else if (parent && parent.type == 'AccessExpr' && parent[1].type == 'MemberExpr'){
			member = parent[1][1].text;
		}
		if (member && scope.member(member) == 'static'){
			name = scope.query('ClassScope').name;
		}else if (parent && parent.type == 'FunctionScope' && scope.target.type == 'ArrowExpr'){
			while (parent.parent && parent.parent.type == 'ArrowExpr'){
				parent = parent.parent;
			}
			if (heap = heap.find('target', parent.target)){
				heap.cache('heads', '_this = this', 'scope-heap');
			}
			name = '_this';
		}
	}
	if (node[1]){
		name += '.@1';
	}
	return this.card('At', name);
};