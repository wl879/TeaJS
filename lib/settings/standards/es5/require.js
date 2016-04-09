var Card;
Card = require("../../../core/card.js");
module.exports = function(node, param){
	var scope, file, dir, params, list, card;
	scope = node.scope.root;
	file = node[0].location.fileName;
	dir = Fp.dirName(node[0].location.fileName);
	params = parseRequireParams.call(this, node[1], dir, file);
	list = [];
	for (var data, i = 0; i < params.length; i++){
		data = params[i];
		if (data.file){
			scope.cachePush('require', data.file);
		}
		card = new Card('RequireExpr', node[0], '(', data.card, ')');
		list.push(card);
	}
	if (list.length == 1){
		return list[0];
	}
	if (node.parent.is('BlockNode', 'Root')){
		for (var i = 0; i < list.length; i++){
			list[i] = new Card('VarExpr', 'var ', getName(list[i][2].text), ' = ', list[i]);
		}
	}else if (node.parent.is('JsonAssignExpr')){
		for (var i = 0; i < list.length; i++){
			list[i] = new Card('AssignExpr', getName(list[i][2].text), ' : ', list[i]);
		}
		return this.pattern('{#COMMA(@)}', list, 'JsonExpr');
	}else {
		return this.pattern('[#COMMA(@)]', list, 'ArrayExpr');
	}
	return list;
};
function parseRequireParams(node, dir, from){
	var list, text, file, files;
	list = [];
	for (var item, i = 0; i < node.length; i++){
		item = node[i];
		if (item.is('STRING')){
			text = item.text;
			if (/\//.test(text)){
				file = Fp.resolve(dir, text);
				if (Fp.isFile(file)){
					list.push(makeData(text, file, dir, item));
					continue;
				}
				if (!/\.js$|\.tea$/.test(file)){
					if (Fp.isFile(file+'.js')){
						list.push(makeData(text, file+'.js', dir, item));
						continue;
					}
					if (Fp.isFile(file+'.tea')){
						list.push(makeData(text, file+'.tea', dir, item));
						continue;
					}
				}
				if (/\.js$/.test(file)){
					if (Fp.isFile(file.replace(/\.js/, '.tea'))){
						list.push(makeData(text, file.replace(/\.js/, '.tea'), dir, item));
						continue;
					}
				}
				if (/\.tea$/.test(file)){
					if (Fp.isFile(file.replace(/\.tea/, '.js'))){
						list.push(makeData(text, file.replace(/\.tea/, '.js'), dir, item));
						continue;
					}
				}
				files = Fp.checkFiles(text, dir, ['index.js', 'index.tea']);
				if (!files.error){
					for (var file, j = 0; j < files.length; j++){
						file = files[j];
						if (file == from){
							continue;
						}
						list.push(makeData(text, file, dir, item));
					}
					continue;
				}
			}
			list.push({"card": item, "file": ''});
		}else {
			list.push({"card": this.read(item), "file": ''});
		}
	}
	return list;
};
function makeData(text, file, dir, token){
	var filename;
	filename = Fp.relative(dir, file);
	if (/\/index\.(js|tea)$/.test(filename) && !/\/index\.(js|tea)$/.test(text)){
		filename = Fp.dirName(filename);
	}
	filename = filename.replace(/\.tea$/, '.js');
	return {"card": token.clone('"'+filename+'"'), "file": file};
};
function getName(text){
	if (text){
		text = text.replace(/^['"]+|['"]+$|\.[^\.\/\\]*$|/g, '');
		var name = Fp.baseName(text);
		if (name == 'index'){
			name = Fp.baseName(Fp.dirName(text));
		}
		name = name.replace(/(?:^|[^a-zA-Z0-9\$]+)(\w)/g, function($0, $1){return $1.toUpperCase()});
		return name;
	}
};