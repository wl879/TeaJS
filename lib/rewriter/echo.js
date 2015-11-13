function toText(write, comma_mark){
	var texts = [], text;
	for (var i=0, item; i < write.length; i++){
		item = write[i];
		if (!item){
			continue;
		}
		if (item == ','){
			texts.push(',\0');
			continue;
		}
		if (typeof item == 'string' || typeof item == 'number'){
			texts.push(item);
			continue;
		}
		if (item.istoken){
			texts.push(item.text);
			continue;
		}
		if (!item.iswriter){
			throw tea.error(new Error(), 'bad writer data!!'+isClass(item));
		}
		switch (item.type){
			case 'VarDecl':case 'LetDecl':
				var _ref;
				_ref = concatVarDecl(write, i), text = _ref[0], i = _ref[1];
				break;
			default:
				text = toText(item);
				break;
		}
		text = beautify(item.type, text, write.type);
		if (!comma_mark){
			text = text.replace(/,\0/g, ', ');
		}
		texts.push(text);
	}
	return texts.join('');
}
function concatVarDecl(parent, index){
	var str, _i;
	str = toText(parent[index], true);
	while (true){
		_i = index+1;
		while (typeof parent[_i] == 'string' && /^[;|\n|\s]+$/.test(parent[_i])){
			_i += 1;
		}
		if (parent[_i] && /LetDecl|VarDecl/.test(parent[_i].type)){
			str += ',\0'+toText(parent[_i], true).replace(/^var\s*/, '');
			index = _i;
			continue;
		}
		break;
	}
	return [str, index];
}
function beautify(type, text, parent_type){
	switch (type){
		case 'NodeStam':
			if (parent_type != 'Root' && text){
				text = '\n\t'+text.replace(/^/mg, '\t').trim()+'\n';
			}
			break;
		case 'JsonExpr':case 'ArrayExpr':case 'VarDecl':
			if (text.length > 80 || /\n/.test(text)){
				text = text.replace(/,\0/g, ',\n').replace(/^/mg, '\t').trim();
			}
			break;
	}
	return text;
}
exports.toText = toText;