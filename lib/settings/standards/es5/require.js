module.exports = function(heap, node, params){
	if (node.type == 'From'){
		return parseFromExpr.call(this, node, params);
	}
	return parseRequireExpr.call(this, node, params);
};
function parseFromExpr(node, params){
	params = parseRequireParams.call(this, node, node[0].location.fileName);
	return this.card('RequireExpr', 'require', '(', params[0], ')');
};
function parseRequireExpr(node, params){
	var list;
	params = parseRequireParams.call(this, node[1], node[0].location.fileName);
	list = [];
	for (var name, i = 0; i < params.length; i++){
		name = params[i];
		list.push(this.card('RequireExpr', node[0], '(', name, ')'));
	}
	if (list.length == 1){
		return list[0];
	}
	switch (node.parent.type){
		case 'BlockNode':case 'Root':
			for (var item, i = 0; i < list.length; i++){
				item = list[i];
				list[i] = this.card('VarExpr', 'var ', moduleName(item[2]), ' = ', item);
			}
			return this.card('List', list);
		case 'JsonDest':
			for (var item, i = 0; i < list.length; i++){
				item = list[i];
				list[i] = this.card('PropertyInit', moduleName(item[2]), ' : ', item);
			}
			return this.transform('{#join(@)}', list, 'JsonExpr');
		default:
			return this.transform('[#join(@)]', list, 'ArrayExpr');
	}
};
function parseRequireParams(node, from){
	var list, dir, file_list;
	list = [];
	dir = Fp.dirName(from);
	for (var item, i = 0; i < node.length; i++){
		item = node[i];
		if (item.is('STRING')){
			if (/\/|\*/.test(item.text)){
				file_list = checkRequireFile(item.text, dir);
				if (file_list.length){
					for (var data, j = 0; j < file_list.length; j++){
						data = file_list[j];
						list.push(data.name.replace(/\.tea$/, '.js'));
					}
					continue;
				}
			}
			list.push(item);
		}else {
			list.push(this.transform(item));
		}
	}
	return list;
};
function checkRequireFile(name, dir){
	var filebase, ref, file, list, exits, files, _name;
	filebase = Fp.resolve(dir, name).replace(/\.(tea|js)$|\/+$/, '');
	for (var ref = ['', '.tea', '.js', '/index.tea', '/index.js'], exe, i = 0; i < ref.length; i++){
		exe = ref[i];
		file = filebase+exe;
		if (Fp.isFile(file)){
			return [{"name": name, "file": file}];
		}
	}
	list = [];
	exits = {};
	files = Fp.checkFiles(name, dir, ['index.js', 'index.tea']);
	if (!files.error){
		for (var file, i = 0; i < files.length; i++){
			file = files[i];
			_name = file.replace(/\.(tea|js)$/, '');
			if (!exits[_name] || /\.js$/.test(file)){
				exits[_name] = file;
				list.push({"name": Fp.relative(dir, file), "file": file});
			}
		}
	}
	return list;
};
function moduleName(node, prefix){
	var file, name;
	if (prefix == null) prefix = '';
	file = node.text || node;
	if (file){
		file = file.replace(/^['"]+|['"]+$|\.[^\.\/\\]*$|/g, '');
		name = Fp.baseName(file);
		if (name == 'index'){
			name = Fp.baseName(Fp.dirName(file));
		}
		name = (prefix+name).replace(/[^\w\$]+/ig, '_').replace(/_[a-z]/g, function($0){return $0[1].toUpperCase()});
		return name;
	}
};