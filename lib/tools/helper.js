require("./debug.js");
var Helpter = module.exports;
Helpter.getLocation = function(something){
	switch (isClass(something)){
		case 'Ast':
			return this.getLocation(something.tokens(0));
		case 'Node':
			return this.getLocation(something.tokens(0));
		case 'Source':
			return this.getLocation(something.current);
		case 'Token':
			return this.getLocation(something.location);
		case 'Location':
			return something;
	}
};
Helpter.errorPot = function(something){
	switch (isClass(something)){
		case 'Ast':case 'Node':case 'Source':case 'Token':
			if (!(something = this.getLocation(something))){
				break;
			}
		case 'Location':
			var text = something.source,
				pos = something.start,
				code = text.slice(something.start, something.end+1),
				file = something.fileName;
			return this.errorPotByText(text, pos, code, file);
		case 'Array':
			return this.errorPotByText.apply(this, something);
		case 'String':
			if (arguments.length > 1){
				return this.errorPotByText.apply(this, arguments);
			}
			return something;
	}
};
Helpter.errorPotByText = function(text, pos, code, file){
	if (pos == -1 && code){
		pos = text.indexOf(code);
	}
	var line = Text.indexLine(text, pos),
		line_text = line[0],
		num = line[1],
		col = line[2];
	if (code){
		code = code.replace(/\n/, '\\n');
	}
	var pot_num = num+' | ',
		pot_shift = (pot_num+line_text.substr(0, col)).replace(/[^\s]/g, ' ')+code.replace(/./g, '^'),
		pot_line = (line_text.substr(0, col)+print.color('#r{'+code+'}')+line_text.substr(col+code.length)).replace(/\n/, '\\n'),
		qq_mark = (/(?:[^\\]|^)"/).test(line_text) ? "'" : '"',
		pot_echo = qq_mark+pot_num+pot_line+'\n'+qq_mark+pot_shift;
	if (file){
		pot_echo = (Path.isPathText(file) ? 'At ' : 'From ')+file+':'+num+':'+col+'\n'+pot_echo.replace(/^(\'|\")/mg, '$1\t');
	}
	return pot_echo;
};
Helpter.atFile = function(something){
	var location;
	if (location = Helpter.getLocation(something)){
		return 'at '+location.fileName+':'+location.lineNumber+':'+location.columnNumber;
	}
	return '';
};
Helpter.atFileByText = function(file, text, pos){
	var line = Text.indexLine(text, pos), num = line[1], col = line[2];
	return (Path.isPathText(file) ? 'At ' : 'From ')+file+':'+num+':'+col;
};
// debub event
debug.addEvent('log', function(){
	debug.echo(print.toString(arguments));
});
debug.addEvent('prep', function(msg, token){
	if (token && token.istoken){
		token = ' <--> '+Helpter.atFile(token);
	}
	debug.echo(print.toString(arguments).replace(/^(\s+)/mg, ' ·$1'));
});
debug.addEvent('syntax', function(){
	debug.echo(print.toString(arguments));
});
debug.addEvent('write', function(){
	debug.echo(print.toString(arguments));
});
debug.addEvent('token', function(){
	debug.echo(print.toString(arguments));
});
// class printer
function tokenPrinter(token, show_token){
	if (show_token || show_token == null){
		var type = token.types.join(',');
		if (show_token == 'shot'){
			type = type.replace(/[a-z]+/g, '');
		}
		return '['+(token.indent >= 0 ? '*' : '')+'('+(type)+') g{\''+Text(token.text)+'\'}]';
	}
	return '[(TOKEN) '+token.text+']';
}
function sourcePrinter(src){
	var texts = [];
	for (var i=0, t; i < src.length; i++){
		t = src[i];
		if (!t){
			continue;
		}
		if (t.istoken){
			texts.push((i && t.is('LineHead') ? '\n' : '')+tokenPrinter(t, 'shot'));
		}else {
			texts.push(lexemePrinter(src[i], 'shot')+(src[i].isToken('LF') ? '\n' : ''));
		}
	}
	return texts.join(', ');
}
function nodePrinter(node, text, _level, _indent){
	if (!_level) _level = 0;
	if (!_indent) _indent = 0;
	var O = _level%2 ? 'r{[}' : '[',
		C = _level%2 ? 'r{]}' : ']',
		isBlock = /BLOCK/.test(node.type) && node.length,
		isNode = /node|block/i.test(node.type);
	if (!text) text = '';
	text += O+'(g{'+node.type+'}) ';
	if (isBlock){
		text += '\n'+print.strc('\t', _indent+1);
	}
	for (var i=0; i < node.length; i++){
		if (!node[i]) continue;
		if (i != 0){
			text += ', ';
		}
		if (isNode){
			text += '\n'+print.strc('\t', _indent+1);
		}
		if (node[i].length >= 0){
			text = nodePrinter(node[i], text, (_level || 0)+1, isBlock || isNode ? _indent+1 : _indent);
		}else if (node[i].text){
			text += "'"+Text(node[i].text)+"'";
		}
	}
	text += (isBlock || isNode ? '\n'+print.strc('\t', _indent)+C : C);
	if (_level == 0){
		text = text.replace(/^(\s+)((?:\*\*\*\ \]\ \*\*\*|\])+\,)\s*/mg, '$1$2\n$1');
	}
	return text;
}
function macroPrinter(macro){
	var text;
	text = '[(Macro - '+macro.type+') '+macro.name+(macro.params ? '('+macro.params.join(',')+')' : '')+' "'+Text(macro.body.length > 30 ? macro.body.substr(0, 30)+'...' : macro.body)+'"'+']';
	return text;
}
function scopePrinter(scope){
	var temp, texts = [];
	for (var key in scope){
		if (!scope.hasOwnProperty(key)) continue;
		var item = scope[key];
		if (key == 'node' || key == 'top' || key == '_top_' || item == null){
			continue;
		}
		if (key == 'variables'){
			var v_types = {};
			for (var name in item){
				if (!item.hasOwnProperty(name)) continue;
				var type = item[name];
				if (!v_types[type]) v_types[type] = [];
				v_types[type].push(name);
			}
			var v_text = [];
			for (var type in v_types){
				if (!v_types.hasOwnProperty(type)) continue;
				var varbs = v_types[type];
				v_text.push(type+' : ["'+varbs.join('", "')+'"]');
			}
			if (v_text.length){
				texts.push(key+' :\n'+v_text.join(',\n').replace(/^/mg, '\t'));
			}
			continue;
		}
		if (key == 'argumentsDefine'){
			var sub_text = [];
			for (var j=0; j < item.length; j++){
				sub_text.push(print.toText(item[j]).replace(/^/mg, '\t'));
			}
			if (sub_text.length){
				texts.push(key+' : [\n'+sub_text.join(',\n')+']');
			}
			continue;
		}
		if (key == 'sub' || key == 'letScope'){
			var sub_text = [];
			for (k in item){
				if (!item.hasOwnProperty(k)) continue;
				sub_text.push(k+' : '+scopePrinter(item[k]));
			}
			if (sub_text.length){
				texts.push(key+' : [\n'+sub_text.join(',\n').replace(/^/mg, '\t')+']');
			}
			continue;
		}
		if (temp = print.toString([item])){
			if (temp.length > 2){
				texts.push(key+' : '+temp);
			}
		}
	}
	return '[\n'+texts.join('\n').replace(/^/mg, '\t')+']';
}
function writerPrinter(data, level, _circular_cache){
	if (!_circular_cache){
		_circular_cache = [];
	}
	_circular_cache.push(data);
	var texts = [];
	for (var i=0, item; i < data.length; i++){
		item = data[i];
		if (item.istoken){
			texts.push("'"+Text(item.text)+"'");
		}else if (typeof item == 'string'){
			texts.push("'"+Text(item)+"'");
		}else {
			if (_circular_cache.indexOf(item) != -1){
				return '[Circular]';
			}
			texts.push(writerPrinter(item, (level || 0)+1, _circular_cache));
		}
	}
	var text = '[('+data.type+') '+texts.join('·')+']';
	return text;
}
function SyntaxPrinter(sre, __level){
	var text = [];
	for (var i=0, r; i < sre.length; i++){
		r = sre[i];
		if (r.type == 'Or'){
			if (text.length){
				text.push('|');
			}
			text.push((__level%2 ? 'd{' : 'w{')+SyntaxPrinter(r, (__level || 0))+'}');
		}else if (r.type == 'Sub'){
			text.push("("+(r.assertion)+SyntaxPrinter(r.key, (__level || 0)+1)+')');
		}else {
			text.push("[("+(r.type)+")"+(r.key)+r.quantifier+"]");
		}
	}
	return text.join(' ');
}
print.register('Token', tokenPrinter);
print.register('Source', sourcePrinter);
print.register('Node', nodePrinter);
print.register('Ast', nodePrinter);
print.register('Macro', macroPrinter);
print.register('Scope', scopePrinter);
print.register('Writer', writerPrinter);
print.register('SyntaxReg', SyntaxPrinter);