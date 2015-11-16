var Reader = require("./reader.js"), SourceMap = require("./sourcemap.js");
exports.read = function(ast, preprocessor){
	if (!preprocessor) preprocessor = ast.preProcessor;
	var write = Reader(preprocessor).read(ast);
	return beautify(write);
};
exports.sourceMap = function(){
	return new SourceMap();
};
function beautify(writer){
	for (var i=0, item; i < writer.length; i++){
		item = writer[i];
		if (item == ','){
			writer[i] = ', ';
			continue;
		}
		switch (item.type){
			case 'VarDecl':case 'LetDecl':
				beautifyVarDecl(writer, i);
				beautify(item);
				break;
			case 'NodeStam':
				beautify(item);
				if (item.length && writer.type != 'Root'){
					beautifyIndent(item);
					beautifyTrim(item).insert(0, '\n\t').add('\n');
				}
				break;
			default:
				if (item.iswriter){
					beautify(item);
				}
				break;
		}
	}
	if (/JsonExpr|ArrayExpr|VarDecl/.test(writer.type)){
		var text = writer.text;
		if (text.length > 80 || /\n/.test(text)){
			beautifyWrap(writer);
			beautifyIndent(writer);
		}
	}
	return writer;
}
function beautifyVarDecl(writer, index){
	var _b, var_writer = writer[index], b = index;
	while (true){
		_b = b+1;
		while (typeof writer[_b] == 'string' && /^[;|\n|\s]+$/.test(writer[_b])){
			_b += 1;
		}
		if (writer[_b] && /LetDecl|VarDecl/.test(writer[_b].type)){
			beautifyTrim(writer[_b], /^(var\ |var\b|\ )/, /(;|\n)$/);
			var_writer.add(',').add.apply(var_writer, Hash.slice(writer[_b]));
			b = _b;
			continue;
		}
		break;
	}
	if (b != index){
		writer.delete(index+1, b);
	}
	return writer;
}
function beautifyIndent(writer){
	for (var i=0, item; i < writer.length; i++){
		item = writer[i];
		if (item.iswriter){
			beautifyIndent(item);
		}else if (item.istoken){
			if (item.type != 'StringTokn'){
				item.text = item.text.replace(/\n/g, '\n\t');
			}
		}else {
			writer[i] = item.replace(/\n/g, '\n\t');
		}
	}
	return writer;
}
function beautifyWrap(writer){
	for (var i=0, item; i < writer.length; i++){
		item = writer[i];
		if (item == ', '){
			writer[i] = ',\n';
		}else if (item.type == 'ArgumentsDecl'){
			beautifyWrap(item);
		}
	}
	return writer;
}
function beautifyTrim(writer, lre, rre){
	if (lre == null) lre = /^\s+/;
	if (rre == null) rre = /\s+$/;
	if (lre){
		beautifyTrimLeft(writer, lre);
	}
	if (rre){
		beautifyTrimRight(writer, rre);
	}
	return writer;
}
function beautifyTrimLeft(writer, re){
	if (re == null) re = /^\s+/;
	var temp = writer;
	while (temp[0]){
		if (typeof temp[0] == 'string'){
			if (re.test(temp[0]) && !(temp[0] = temp[0].replace(re, ''))){
				temp.delete(0);
				continue;
			}
		}else if (temp[0].istoken && re.test(temp[0].text)){
			if (!(temp[0].text = temp[0].text.replace(re, ''))){
				temp.delete(0);
				continue;
			}
		}else if (temp[0].iswriter){
			beautifyTrimLeft(temp[0], re);
		}
		break;
	}
	return writer;
}
function beautifyTrimRight(writer, re){
	if (re == null) re = /\s+$/;
	var last = writer.length-1, temp = writer;
	while (temp[last]){
		if (typeof temp[last] == 'string'){
			if (re.test(temp[last]) && !(temp[last] = temp[last].replace(re, ''))){
				last = temp.delete(last).length-1;
				continue;
			}
		}else if (temp[last].istoken && re.test(temp[last].text)){
			if (!(temp[last].text = temp[last].text.replace(re, ''))){
				last = temp.delete(last).length-1;
				continue;
			}
		}else if (temp[last].iswriter){
			beautifyTrimRight(temp[last], re);
		}
		break;
	}
	return writer;
}