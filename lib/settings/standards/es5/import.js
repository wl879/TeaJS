module.exports = function(heap, node, param){
	var i, def, spe, from, requir, scope, module_name, list, patt;
	if (node[0].type == 'From'){
		return this.transform("RequireExpr", node[0]);
	}
	if (node[i = 0].type == 'DefaultSpecifiers'){
		def = node[i++][0].text;
	}
	if (node[i].type == 'Specifiers'){
		spe = node[i++][0];
	}
	from = node[i];
	requir = this.transform("RequireExpr", from);
	scope = node.scope.query('RootScope');
	module_name = heap.variable('module', def || scope.createVariable(moduleName(from, 'module'), 'var'));
	list = [];
	list.push(this.transform("@module = @0", [requir], 'AssignExpr'), ', ');
	switch (spe && spe.type){
		case 'JsonPatt':
			for (var item, j = 0; j < spe.length; j++){
				item = spe[j];
				scope.alias(item);
				switch (item.type){
					case 'RestPatt':
						Tea.error(1131, item);
						break;
					case 'PropertyInit':
						scope.define('var', item[2].text, module_name+'.'+item[0].text);
						break;
					default:
						scope.define('var', item.text, module_name+'.'+item.text);
						break;
				}
			}
			break;
		case 'All':
			patt = "@0 = (function(from){var m = {}; for(var k in from) if(form.hasOwnProperty(k))m[k] = from[k]; return m})(@1)";
			if (def){
				list.push(this.transform(patt, [spe[2], def], 'AssignExpr'), ', ');
			}else {
				list[0] = this.transform(patt, [spe[2], requir], 'AssignExpr');
			}
			break;
	}
	list.pop();
	return this.card('VarDecl', 'var ', list);
};
function moduleName(node, prefix){
	var name;
	if (prefix == null) prefix = '';
	name = node.text;
	if (name){
		name = (prefix+name).replace(/[^\w\$]+/ig, '_').replace(/_[a-z]/g, function($0){return $0[1].toUpperCase()});
	}
	return name || '';
};