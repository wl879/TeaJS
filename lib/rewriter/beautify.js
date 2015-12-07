function Beautify(writer){
	var shell_comm = [], list = Beautify.start(writer, null, shell_comm);
	if (shell_comm.length){
		list.unshift(shell_comm[0], '\n');
	}
	return list;
}
Beautify.start = function(writer, not_concat, shell_comm){
	var w_list = [];
	for (var i=0, item; i < writer.length; i++){
		item = writer[i];
		switch (item.type){
			case 'CommDecl':
				if (item[0]){
					item = item[0];
				}
				if (item.is('ShellComm')){
					if (shell_comm){
						shell_comm.push(item);
					}
					if (writer[i+1] == '\n'){
						i++;
					}
					continue;
				}
				break;
			case 'VarDecl':case 'LetDecl':
				item = this.varList(item);
				i = this.concatVarList(writer, i, item);
				item = this.wrapList(item, writer.constructor.listToText(item));
				break;
			case 'JsonExpr':case 'ArrayExpr':
				item = this.start(item, true, shell_comm);
				item = this.wrapList(item, writer.constructor.listToText(item));
				break;
			case 'NodeStam':
				item = this.start(item, null, shell_comm);
				if (item.length && writer.type != 'Root'){
					this.indentList(item);
					this.trimList(item).unshift('\n\t');
					item.push('\n');
				}
				break;
			default:
				if (item.iswriter){
					item = this.start(item, null, shell_comm);
				}else if (item == ','){
					item = ', ';
				}
				break;
		}
		w_list.push(item);
	}
	if (not_concat){
		return w_list;
	}
	return this.concatList(w_list);
};
Beautify.indentList = function(list){
	for (var i=0, item; i < list.length; i++){
		item = list[i];
		if (item.istoken){
			if (item.type != 'StringTokn'){
				item.text = item.text.replace(/\n/g, '\n\t');
			}
		}else if (typeof item == 'string'){
			list[i] = item.replace(/\n/g, '\n\t');
		}
	}
	return list;
};
Beautify.wrapList = function(list, text){
	if (text.length > 80 || /\n/.test(text)){
		for (var i=0, item; i < list.length; i++){
			item = list[i];
			if (/^\s*,\s*$/.test(item)){
				list[i] = ',\n';
			}
		}
		list = this.concatList(list);
		this.indentList(list);
	}
	return list;
};
Beautify.varList = function(writer){
	var list = [];
	for (var i=0, item; i < writer.length; i++){
		item = writer[i];
		if (item.type == 'ArgumentsDecl'){
			list.push.apply(list, this.start(item, true));
		}else if (item.iswriter){
			list.push(this.start(item));
		}else if (item == ','){
			list.push(', ');
		}else {
			list.push(item);
		}
	}
	return list;
};
Beautify.concatVarList = function(writer, index, list){
	var _b, b = index;
	while (true){
		_b = b+1;
		while (typeof writer[_b] == 'string' && /^[;|\n|\s]+$/.test(writer[_b])){
			_b += 1;
		}
		if (writer[_b] && /LetDecl|VarDecl/.test(writer[_b].type)){
			list.push(', ');
			list.push.apply(list, this.trimList(this.varList(writer[_b]), /^(var\ |var\b|\ )/, /(;|\n)$/));
			b = _b;
			continue;
		}
		break;
	}
	return b;
};
Beautify.concatList = function(list){
	var res_list = [];
	for (var _i=0, item; _i < list.length; _i++){
		item = list[_i];
		if (isArray(item)){
			res_list.push.apply(res_list, item);
		}else {
			res_list.push(item);
		}
	}
	return res_list;
};
Beautify.trimList = function(list, left, right){
	if (left == null) left = /^\s+/;
	if (right == null) right = /\s+$/;
	if (left){
		this.trimLeft(list, left);
	}
	if (right){
		this.trimRight(list, right);
	}
	return list;
};
Beautify.trimLeft = function(list, re){
	if (re == null) re = /^\s+/;
	while (list[0]){
		if (list[0].istoken){
			if (!(list[0].text = list[0].text.replace(re, ''))){
				list.shift();
				continue;
			}
		}else if (typeof list[0] == 'string'){
			if (!(list[0] = list[0].replace(re, ''))){
				list.shift();
				continue;
			}
		}else if (list.hasOwnProperty('length')){
			if (this.trimLeft(list[0], re).length == 0){
				list.shift();
				continue;
			}
		}
		break;
	}
	return list;
};
Beautify.trimRight = function(list, re){
	if (re == null) re = /\s+$/;
	var last;
	while (list[last = list.length-1]){
		if (list[last].istoken){
			if (!(list[last].text = list[last].text.replace(re, ''))){
				list.pop();
				continue;
			}
		}else if (typeof list[last] == 'string'){
			if (!(list[last] = list[last].replace(re, ''))){
				list.pop();
				continue;
			}
		}else if (list.hasOwnProperty('length')){
			if (this.trimRight(list[last], re).length == 0){
				list.pop();
				continue;
			}
		}
		break;
	}
	return list;
};
module.exports = Beautify;