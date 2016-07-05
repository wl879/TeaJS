module.exports = function(heap, node, params){
	switch (node.type){
		case 'ExportDecl':
			return parseExportDecl.call(this, node);
		case 'ExportDefaultDecl':
			return parseExportDefaultDecl.call(this, node);
		case 'ExportAllDecl':
			return parseExportAllDecl.call(this, node);
	}
};
function parseExportDecl(node){
	switch (node[0].type){
		case 'FunctionDecl':case 'MethodDecl':case 'ClassDecl':
			return this.card('List', this.transform(node[0]), this.transform('module.exports.@[name] = @[name]', node[0], 'ExportDecl'));
		case 'GetterDecl':
			return this.transform('module.exports.__defineGetter__("@0", function@1@2)', node[0], 'ExportDecl');
		case 'SetterDecl':
			return this.transform('module.exports.__defineSetter__("@0", function@1@2)', node[0], 'ExportDecl');
		case 'VarDecl':case 'ConstDecl':
			return this.card('List', this.transform(node[0]), this.transform('#join( "(@:ExportDecl)module.exports.@0 = @0", false)', node[0][0], 'List'));
		case 'SequenceDecl':
			return this.transform('#join( "(@:ExportDecl)module.exports.@0 = #group(@)", false)', node[0], 'List');
		case 'JsonPatt':
			if (node[1]){
				return parseExportFrom.call(this, node);
			}
			return parseExportDest.call(this, node);
		default:
			Tea.error(1103, node);
			break;
	}
};
function parseExportDefaultDecl(node){
	switch (node[0].type){
		case 'FunctionDecl':case 'MethodDecl':
			this.transform('#head("module.exports = @[0.name]")', node);
			return this.transform(node[0]);
		case 'ClassDecl':
			return this.card('List', this.transform(node[0]), this.transform('module.exports = @[name]', node[0], 'ExportDecl'));
		default:
			return this.transform('module.exports = #group(@0)', node);
	}
};
function parseExportAllDecl(node){
	return this.card("ExportAllDecl", "(function(from, exp){\n    Object.keys(from).forEach(\n        function(k){\n            exp.__defineGetter__(k, function(){return from[k]});\n        }\n    )\n})(", this.transform(node[0][0].is('STRING') ? 'require(@0)' : '(typeof(@0)=="string"?require(@0):@0)', node), ', module.exports)');
};
function parseExportFrom(node){
	var scope, json_patt, from, keys, names, use_names;
	scope = node.scope;
	json_patt = node[0];
	from = this.transform('RequireExp', node[1]);
	keys = [];
	names = [];
	use_names = false;
	for (var item, i = 0; i < json_patt.length; i++){
		item = json_patt[i];
		node.scope.alias(item);
		if (item.type == 'PropertyInit'){
			keys.push(this.transform('"@0"', item), ',');
			names.push(this.transform('"@2"', item), ',');
			use_names = true;
		}else {
			keys.push(this.transform('"@"', item), ',');
			names.push(this.transform('"@"', item), ',');
		}
	}
	keys.pop();
	names.pop();
	return this.card("ExportDecl", "(function(from, keys, names){keys.forEach(function(k, i){module.exports.__defineGetter__(names[i] || k, function(){return from[k]})}})\n", "(", from, ", [", keys, "], [", use_names && names, "])");
};
function parseExportDest(node){
	var scope, json_patt, list, ref;
	scope = node.scope;
	json_patt = node[0];
	list = [];
	for (var item, i = 0; i < json_patt.length; i++){
		item = json_patt[i];
		scope.alias(item);
		switch (item.type){
			case 'RestPatt':
				Tea.error(1131, item);
				break;
			case 'PropertyInit':
				if (item[2].text == 'default'){
					ref = this.transform('module.exports = @0', item, 'ExportDecl');
				}else {
					ref = this.transform('module.exports.@2 = @0', item, 'ExportDecl');
				}
				break;
			default:
				ref = this.transform('module.exports.@ = @', item, 'ExportDecl');
				break;
		}
		list.push(ref);
	}
	return this.card('List', list);
};