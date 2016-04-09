var Card;
Card = require("../../../core/card.js");
module.exports = function(node, param){
	var handle, vars, scope, i, name, extend, block, start, init_block;
	handle = this.handle;
	vars = handle.variables;
	scope = node.scope;
	if (node[i = 1].type == 'NameExpr'){
		name = node[i++];
	}else if (node.parent.type == 'AssignExpr' && node.parent[0].type == 'VariableExpr'){
		name = node.parent[0][0];
	}else {
		name = '_Class_';
	}
	if (node[i].type == 'ExtendsExpr'){
		extend = node[i++];
		scope.super = 'this.__super__';
	}else {
		scope.super = 'Object.prototype';
	}
	name = vars.name = scope.name = name.text || name;
	block = this.read(node[i], false, true)[1];
	start = 0;
	for (var j = 0; j < block.length; j++){
		if (block[j].type){
			if (/VarStam|LetStam|AssignExpr|RequireExpr|COMMENT|STRING/.test(block[j].type)){
				continue;
			}
		}
		start = j;
		break;
	}
	if (extend){
		block.insert(start, ClassExtends.call(this, scope, extend));
	}
	block.insert(start, ClassConstructor.call(this, scope));
	block.add(new Card('Line', 'return '+name));
	init_block = this.pattern('(function(){@})()', block, 'ClassInit');
	if (node.parent.type == 'AssignExpr'){
		return init_block;
	}
	return this.pattern('var @name = @', init_block, 'ClassDecl');
};
function ClassConstructor(scope){
	var cache, constructor, propertys, argu, block;
	cache = scope.cache;
	constructor = cache.constructors && cache.constructors[0];
	propertys = cache.propertys;
	if (constructor){
		argu = this.read(constructor[1]);
		if (propertys){
			constructor.scope.cachePush('head', propertys);
		}
		block = this.read(constructor[2], false, true)[1];
	}else {
		argu = '()';
		block = new Card('Block', propertys);
	}
	return this.pattern('function @name@[0]{@[1]}', [argu, block], 'ConstructorExpr');
};
function ClassExtends(scope, node){
	var list, params;
	list = [];
	params = node[1];
	list.push(this.pattern('@name.prototype = Object.create(@[0].prototype)', params, 'Line'));
	list.push(this.pattern('@name.prototype.__super__ = @[0].prototype', params, 'Line'));
	list.push(this.pattern('@name.prototype.constructor = @name', params, 'Line'));
	if (params.length > 1){
		list.push(this.pattern('@name.__extends__ = function(){for(var i=0, args = arguments; i<args.length; i++){var _super = args[i].prototype;for (var name in _super){if (_super[name].hasOwnProperty(name)){this.prototype[name] = _super[name];}}}}', params, 'Line'));
		list.push(this.pattern('@name.__extends__(#COMMA(1))', params));
	}
	return list;
};