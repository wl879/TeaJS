function argv(handle, node, params){
	if (params[0]){
		return handle.argv(params[0]);
	}
};
module.exports.argv = argv;
function join(handle, node, params){
	var startIndex, i, endIndex, patt, separator, list, item;
	startIndex = /^\d$/.test(params[i = 0]) ? parseInt(params[i++]) : 0;
	endIndex = /^\d$/.test(params[i]) ? parseInt(params[i++]) : node.length;
	patt = /#|@/.test(params[i]) ? params[i++] : null;
	separator = params[i] || ', ';
	list = [];
	for (var i=startIndex; i < endIndex; i++){
		item = node[i];
		if (item.isToken || item.isNode){
			if (patt){
				item = handle.transform(patt.replace(/\$/g, i), item);
			}else {
				item = item.isToken && item.text == ',' ? item.clone('null') : handle.transform(item);
			}
		}
		if (item){
			list.push(item);
		}
	}
	if (list.length){
		return separator && separator != 'false' ? Jsop.join(list, separator) : list;
	}
};
module.exports.join = join;
function body(handle, node, params){
	var body_card;
	body_card = handle.card('BodyNode');
	for (var item, i = 0; i < node.length; i++){
		item = node[i];
		if (!item){
			continue;
		}
		body_card.add(handle.transform(item));
	}
	return body_card;
};
module.exports.body = body;
function head(handle, node, params){
	var heap;
	if (heap = handle.heap.find('scope-heap')){
		if (params.length == 0){
			return heap.set('HeadNode', handle.card('HeadNode'));
		}else {
			return cache(handle, node, ['heads', params[0], params[1]]);
		}
	}
};
module.exports.head = head;
function foot(handle, node, params){
	var heap;
	if (heap = handle.heap.find('scope-heap')){
		if (params.length == 0){
			return heap.set('FootNode', handle.card('FootNode'));
		}else {
			return cache(handle, node, ['foots', params[0], params[1]]);
		}
	}
};
module.exports.foot = foot;
function cache(handle, node, params){
	var name, asset, type;
	name = params[0];
	asset = params[1];
	if (/#|@/.test(asset)){
		asset = handle.transform(asset, node);
	}
	type = params[2];
	return !!handle.heap.cache(name, asset, 'scope-heap', type);
};
module.exports.cache = cache;
function del(handle, node, params){
	node.parent[node.index] = null;
	return true;
};
module.exports.del = del;
function or(handle, node, params){
	for (var asset, i = 0; i < params.length; i++){
		asset = params[i];
		if (/#|@/.test(asset)){
			asset = handle.transform(asset, node);
		}
		if (asset){
			return asset;
		}
	}
	return 'undefined';
};
module.exports.or = or;
function group(handle, node, params){
	return handle.transform(!node.is('Value') && '(@)', node);
};
module.exports.group = group;
function alias(handle, node, params){
	var scope, name, state, _name;
	scope = node.scope || handle.heap.target.scope;
	if (params.length){
		name = params[0];
		state = params[1];
		_name = scope.createVariable(name);
		handle.heap.variable(name, _name);
		scope.define(state, node, _name);
		return _name;
	}
	scope.alias(node);
	return node;
};
module.exports.alias = alias;
exports.var = function(handle, node, params){
	var scope, state, name, value;
	scope = node.scope || handle.heap.target.scope;
	state = params[0] || checkState(node);
	name = params[1];
	value = /#|@/.test(params[2]) ? handle.transform(params[2], node) : params[2];
	return handle.heap.variable(name, value || scope.createVariable(name, state));
};
function ref(handle, node, params){
	var scope, name, _name;
	scope = node.scope || handle.heap.target.scope;
	name = params[0] || 'ref';
	if (node.is('Variable', 'IDENTIFIER', 'NUMBER', 'STRING', 'REGEXP')){
		return handle.heap.variable(name, node);
	}
	_name = scope.createVariable(name, params[1] || checkState(node));
	handle.heap.variable(name, _name);
	if (node.parent.is('Express')){
		return handle.transform('(@'+name+' = @)', node);
	}
	return handle.transform('@'+name+' = @', node);
};
module.exports.ref = ref;
function check(handle, node, params){
	var scope;
	scope = node.scope || handle.heap.target.scope;
	scope.check(node);
	return node;
};
module.exports.check = check;
function card(handle, node, params){
	var type, target, list;
	type = params[0];
	target = params[1] ? handle.transform(params[1], node) : node;
	list = [];
	for (var item, i = 0; i < target.length; i++){
		item = target[i];
		list.push(item.isNode || item.isToken ? handle.transform(item) : item);
	}
	if (list.length){
		switch (type){
			case 'var':
				return handle.card('VarDecl', Jsop.join(list, ','));
			default:
				return handle.card(type || 'Line', list);
		}
	}
};
module.exports.card = card;
function error(handle, node, params){
	var code;
	code = params[0];
	handle.throw(parseInt(code) || code, node);
};
module.exports.error = error;
function checkState(node){
	if (!node.is){
		return 'let undefined';
	}
	if (/condition/i.test(node.type)){
		return 'undefined';
	}
	if (node.parent && node.parent.is('Assign')){
		node = node.parent;
	}
	if (node.parent && node.parent.is('SequenceDecl')){
		node = node.parent;
	}
	if (node.is('VarDecl', 'LetDecl', 'ConstDecl', 'InitPatt') || (node.parent && node.parent.is('VarDecl', 'LetDecl', 'ConstDecl', 'InitPatt'))){
		return;
	}
	return 'let undefined';
};