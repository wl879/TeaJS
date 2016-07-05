var Code;
Code = require("./code.js");
module.exports = function(){
	var args, name, msg, err, stacks, code;
	args = Jsop.toArray(arguments.length == 1 && arguments[0].length ? arguments[0] : arguments);
	name = 'Parse error';
	msg = '';
	if (args[args.length-1] instanceof Error){
		err = args.pop();
		stacks = print.stacks(err);
		msg = err.message;
	}else {
		err = new Error();
		stacks = print.stacks(err);
		stacks.shift();
	}
	if (typeof args[0] == 'string'){
		msg = args.shift();
	}else if (typeof args[0] == 'number'){
		code = args.shift();
		msg = (Code[code] || "Undefined error code")+" · "+code;
		name = (Code[Math.floor(code/1000)*1000] || name);
	}
	err.code = code;
	err.message = print.format(format('<r:['+name+']:> '+msg, args, stacks).replace(/^/mg, '  ! '));
	err.stacks = stacks;
	err.__defineGetter__('stack', toText);
	return err;
};
function format(text, args, stacks){
	for (var item, i = 0; i < args.length; i++){
		item = args[i];
		switch (Jsop.isClass(item)){
			case 'Number':
				text = replace(text, '%d', item);
				break;
			case 'String':
				text = replace(text, '%s', item);
				break;
			case 'Standard':
				text = replace(text, '%j', formatStandard(item));
				break;
			case 'Node':case 'Token':case 'Source':case 'Location':case 'Array':
				text = replace(text, '%j', formatLocation(item));
				break;
			case 'Object':
			default:
				text = replace(text, '%j', SText(item));
				break;
		}
	}
	if (text.indexOf('%e')){
		text = text.replace(/%e/g, function(){return '<> at "'+stacks[0].fileName+':'+stacks[0].lineNumber+':'+stacks[0].columnNumber+'"'});
	}
	return text;
};
function replace(text, substr, target){
	if (text.indexOf(substr) != -1){
		return text.replace(substr, target);
	}
	return text+'\n'+target;
};
function formatLocation(obj){
	var source, index, code, num;
	switch (Jsop.isClass(obj)){
		case 'Node':
			return formatLocation(obj.toList(0));
		case 'Source':
			return formatLocation(obj.current);
		case 'Token':
			return formatLocation(obj.location);
		case 'Array':
			source = obj[0];
			index = obj[1];
			code = obj[2];
			num = SText.indexLine(source, index);
			return formatFragment(source, code || source[index], num[1], num[2], '');
		case 'Location':
			return formatFragment(obj.source, obj.code, obj.lineNumber, obj.columnNumber, obj.fileName);
	}
	return 'undefined';
};
function formatFragment(text, code, line, col, file){
	var ref, str;
	if (text == null) text = '';
	if (code == null) code = '';
	if (line == null) line = 0;
	if (col == null) col = 0;
	if (arguments.length == 1 && typeof text == 'object'){
		file = text.fileName || text.file;
		col = text.columnNumber || text.column || text.col;
		line = text.lineNumber || text.line || text.number;
		code = text.code || text.text;
		text = null;
	}
	if (arguments.length == 4){
		file = col;
	}
	if (!text){
		text = Fp.readFile(file);
	}
	if (/\n/.test(text)){
		if (arguments.length == 4){
			ref = SText.indexLine(text, line), text = ref[0], line = ref[1], col = ref[2];
		}else if (!line && code){
			ref = SText.indexLine(text, text.indexOf(code)), text = ref[0], line = ref[1], col = ref[2];
		}else {
			text = text.split('\n')[line-1];
		}
	}
	if (!code && col){
		code = SText.split(text.substr(col-1), /[\;\)\]\}\,]/)[0];
	}
	text = text.replace(/\n+$/g, '');
	str = '  '+line+' | '+text+'\\n\n';
	str += str.substr(0, str.length-3-text.length+col).replace(/[^\s]/g, ' ');
	str += '<r:'+SText.copy('^', code.length || 1)+':>';
	if (file){
		str = '"'+file+':'+line+':'+col+'"\n\n'+str;
	}
	return str;
};
function formatStandard(std){
	var cache, texts, p;
	cache = std.cache;
	texts = [
		'-> '+cache.version+'.'+cache.standard+'<>"'+cache.condition+'" : "'+(cache.pattern || '???')+'"'];
	p = cache.__parent;
	while (p){
		if (p.standard){
			texts.push(p.version+'.'+p.standard+'<>"'+p.condition+'" : "'+p.pattern+'"');
		}
		p = p.__parent;
	}
	texts.reverse();
	for (var i = 0; i < texts.length; i++){
		texts[i] = SText.copy('  ', i)+texts[i];
	}
	return texts.join('\n');
};
function toText(){
	if (toText.caller){
		return this.message;
	}
	console.log('\n'+this.message+'\n');
	console.log(print.toText(this.stacks));
	Tea.exit(this.code || 999);
};