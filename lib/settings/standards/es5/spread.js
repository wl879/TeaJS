module.exports = function(heap, node, params){
	if (node.parent.type == 'ParamsExpr'){
		heap = heap.find('target', node.parent.parent);
	}else if (node.parent.type == 'ArrayExpr'){
		heap = heap.find('target', node.parent);
	}
	if (heap){
		heap.ondid(reparseSpreadCallback);
		return '';
	}
	Tea.error(1116, node);
};
function reparseSpreadCallback(heap, result, params){
	var node, patt;
	node = heap.target;
	switch (node.type){
		case 'ParamsExpr':
			return this.card('ParamsExpr', '.apply(null, ', parseSpreadList.call(this, node), ')');
		case 'ArrayExpr':
			return parseSpreadList.call(this, node);
		case 'SuperExpr':
			params = parseSpreadList.call(this, node[1].type == 'ParamsExpr' ? node[1] : node[2]);
			for (var i = result.length - 1; i >= 0; i--){
				if (typeof result[i] == 'string'){
					if (/\.call/.test(result[i])){
						result[i] = result[i].replace(/\.call/, '.apply');
						result.delete(i+1, result.length);
						result.add(params, ')');
						break;
					}
				}
			}
			return result;
		case 'CallExpr':case 'RequireExpr':
			if (node[0].type == 'AccessExpr'){
				patt = '#ref(@[0.0])@[0.1].apply(@ref, ';
			}else {
				patt = '@0.apply(null, ';
			}
			return this.transform(patt, node).add(parseSpreadList.call(this, node[1]), ')');
		default:
			Tea.error(1117, node.type, node);
			break;
	}
	return result;
};
function parseSpreadList(node){
	var list, arr;
	list = [];
	arr = [];
	for (var item, i = 0; i < node.length; i++){
		item = node[i];
		if (item.type == 'SpreadExpr'){
			if (arr.length){
				list.push('[', Jsop.join(arr, ','), ']', ',');
			}
			arr = [];
			list.push(this.transform(item[1]), ',');
		}else {
			arr.push(this.transform(item));
		}
	}
	if (arr.length){
		list.push('[', Jsop.join(arr), ']');
	}
	list.pop();
	return this.card(node.type, '[].concat(', list, ')');
};