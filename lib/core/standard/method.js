var Asset, Card;
Asset = null;
Card = require("../card.js");
function EACH(node, params){
	var i, index, patt, rep, sep, list;
	if (/^\d$/.test(params[i = 0])){
		index = parseInt(params[i++]);
	}else {
		index = 0;
	}
	if (/#|@/.test(params[i])){
		patt = params[i++];
	}
	if (params[i] && /. \-\-\> ./.test(params[i])){
		rep = SText.split(params[i++], '\-\-\>', true, true);
	}
	if (params[i]){
		sep = params[i++];
	}
	list = [];
	for (var item, j = index; j < node.length; j++){
		item = node[j];
		if (patt){
			item = this.pattern(patt.replace(/\$/g, j), item);
		}else {
			if (rep && item.isToken && rep[0] == item.text){
				item = rep[1];
			}else {
				item = this.read(item);
			}
		}
		if (item){
			list.push(item);
			if (sep){
				list.push(sep);
			}
		}
	}
	if (sep && list[list.length-1] == sep){
		list.pop();
	}
	return list;
};
module.exports.EACH = EACH;
function COMMA(node, params){
	var list;
	params = (params || []).concat([', ']);
	list = EACH.call(this, node, params);
	return new Card('CommaExpr', list);
};
module.exports.COMMA = COMMA;
function INSERT(node, params){
	var name, asset, type, scope;
	name = params[0];
	asset = checkAsset(params[1], node, this);
	type = params[2];
	scope = type && node.scope.query(type) || node.scope;
	scope.cachePush(name, asset);
	return true;
};
module.exports.INSERT = INSERT;
function HEAD(node, params){
	return INSERT.call(this, node, ['head', params[0], params[1]]);
};
module.exports.HEAD = HEAD;
function END(node, params){
	return INSERT.call(this, node, ['end', params[0], params[1]]);
};
module.exports.END = END;
function CHECK(node, params){
	var state;
	if (!(state = node.scope.check(node))){
		return node.scope.define(node);
	}
	return state[0];
};
module.exports.CHECK = CHECK;
function STATE(node, params){
	var state, target, alias;
	if (params.length){
		state = params[0];
		target = checkAsset(params[1], node, this);
		alias = params[2];
		return node.scope.define(state, target, alias);
	}else {
		return node.scope.state(node);
	}
};
module.exports.STATE = STATE;
function ALIAS(node, params){
	var text, token;
	if (text = node.scope.alias(node)){
		token = node.tokens(0).clone(text);
		return token;
	}else {
		return node;
	}
};
module.exports.ALIAS = ALIAS;
function CONST(node, params){
	var text, scope, cache;
	text = node.text;
	if (node.parent.type == 'AssignExpr'){
		return text;
	}
	scope = node.scope.root;
	!scope.consts && (scope.consts = {});
	if (scope.consts[text]){
		return scope.consts[text];
	}else {
		scope.consts[text] = checkVariable('_rg_', scope);
		cache = scope.cache;
		!cache.head && (cache.head = []);
		cache.head.push(scope.consts[text]+' = '+text);
		return scope.consts[text];
	}
};
module.exports.CONST = CONST;
function VALUE(node, params){
	var name, ref, _name;
	if (!params || !params.length){
		// return node.is('Value', 'Operate') ? @.read(node) : @.pattern('(@)', node);
		return node.is('AssignExpr') ? this.pattern('(@)', node) : this.read(node);
	}
	name = params[0];
	if (/@|#/.test(name)){
		ref = checkAsset(name, node, this);
		// if node.parent.is('AssignExpr'):
		// 	return ref.insert(0, '(').add(')');
		return ref;
	}
	if (['VariableExpr', 'AccessExpr', 'IDENTIFIER'].indexOf(node.type)>=0){
		return this.handle.variables[name] = node;
	}
	_name = checkVariable(name, node.scope, node);
	this.handle.variables[name] = _name;
	return this.pattern('(@'+name+' = @)', node);
};
module.exports.VALUE = VALUE;
function LIST(node, params){
	var list, ref;
	list = [];
	for (var i = 0; i < params.length; i++){
		ref = this.pattern(params[i], node);
		if (isArray(ref)){
			list.push.apply(list, ref);
		}else {
			list.push(ref);
		}
	}
	return list;
};
module.exports.LIST = LIST;
function VAR(node, params){
	var type, name, _name, asset;
	type = params[0];
	name = params[1];
	if (!name){
		name = type, type = 'undefined';
	}
	_name = checkVariable(name, node.scope, node, type);
	if (asset = params[2]){
		if (/#|@/.test(asset)){
			asset = checkAsset(asset, node, this);
		}
		if (asset){
			node.scope.define(type, asset, _name);
		}
	}
	return this.handle.variables[name] = _name;
};
module.exports.VAR = VAR;
function STR(node, params){
	if (node.is('STRING')){
		return node;
	}
	return this.pattern('"@"', node);
};
module.exports.STR = STR;
function DEL(node, params){
	node.parent[node.index] = null;
	return true;
};
module.exports.DEL = DEL;
function CARD(node, params){
	var type, list, card;
	type = params[0];
	if (params[1]){
		node = checkAsset(params[1], node, this);
	}
	list = [];
	for (var i = 0; i < node.length; i++){
		if (node[i]){
			if (node[i].isNode){
				list.push(this.read(node[i]));
			}else {
				list.push(node[i]);
			}
		}
	}
	if (list.length){
		switch (type){
			case 'var':
				card = this.pattern('var #COMMA(@)', list);
				card.type = 'VarStam';
				return card;
			default:
				return new Card(type || 'Line', list);
		}
	}
};
module.exports.CARD = CARD;
function checkAsset(text, node, std){
	var m;
	!Asset && (Asset = require("./asset.js"));
	if (m = Asset.test(text)){
		if (m[0] == text){
			return Asset.parse(text, node, std);
		}
		return std.pattern(text, node);
	}
	return text;
};
function checkVariable(name, scope, node, type, deep){
	var name_map, i, _name, state;
	if (name == null) name = 'i';
	if (deep == null) deep = true;
	if (name.length == 1){
		name_map = [
			'i',
			'j',
			'k',
			'l',
			'm',
			'n',
			'o',
			'p',
			'q',
			'r',
			's',
			't',
			'u',
			'v',
			'w',
			'k',
			'y',
			'z'];
		i = name_map.indexOf(name);
	}else {
		i = 0;
	}
	_name = name;
	while (state = checkExist(_name, scope, deep)){
		if (state == 'undefined ref'){
			break;
		}
		if (name_map){
			_name = name_map[++i];
		}else {
			_name = name+(i++);
		}
	}
	if (node.parent.is('Assign')){
		node = node.parent;
	}
	if (node.parent.is('ArgusStam')){
		node = node.parent;
	}
	if (node.is('VarStam', 'LetStam', 'ConstStam') || node.parent.is('VarStam', 'LetStam', 'ConstStam')){
		return _name;
	}
	scope.define(type || 'undefined', _name);
	return _name;
};
function checkExist(name, scope, deep){
	var state, node;
	if (state = scope.state(name)){
		return state;
	}
	if (deep && (node = scope.target)){
		node.each(function(target, indexs){
			var type;
			type = target.type;
			if (target.is('Function') || type == 'MemberExpr'){
				return 0;
			}
			if (type == 'IDENTIFIER' || type == 'KEYWORD'){
				if (target.text == name){
					state = 'unknow';
					return false;
				}
			}
		});
	}
	return state;
};