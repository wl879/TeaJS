var Code;
Code = require("./code.js");
Error.create = function(){
	var args, msg, name, err, stacks, code;
	args = Jsop.toArray(arguments);
	msg = '';
	name = 'Parse error';
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
		msg = Code[code] || 'Undefined error code "'+code+'"';
		name = (Code[Math.floor(code/100)*100] || name)+' ('+code+')';
	}
	err.message = '['+name+']\n\n'+format(msg, args, stacks).replace(/^/mg, ' • ');
	err.stacks = stacks;
	err.__defineGetter__('stack', toStack);
	return err;
};
Error.code = Code;
function format(text, args, stacks){
	var i;
	for (var item, i = 0; i < args.length; i++){
		item = args[i];
		switch (isClass(item)){
			case 'Number':
				text = replace(text, '%d', item);
				break;
			case 'String':
				text = replace(text, '%s', item);
				break;
			case 'Standard':
				text = replace(text, '%j', formatStandard(item));
				break;
			case 'Syntax':case 'Token':case 'Source':case 'Location':
				text = replace(text, '%j', formatLocation(item));
				break;
			case 'Object':
			default:
				text = replace(text, '%j', SText(item));
				break;
		}
	}
	if (text.indexOf('%e')){
		i = 0;
		text = text.replace(/%e/g, function(){return '<> at "'+stacks[i].fileName+':'+stacks[i].lineNumber+':'+stacks[i++].columnNumber+'"'});
	}
	return print.format(text);
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
function formatLocation(obj){
	switch (isClass(obj)){
		case 'Syntax':
			return formatLocation(obj.tokens(0));
		case 'Source':
			return formatLocation(obj.current);
		case 'Token':
			return formatLocation(obj.location);
		case 'Location':
			return print.fragment(obj.source, obj.code, obj.lineNumber, obj.columnNumber, obj.fileName);
	}
	return 'undefined';
};
function replace(text, substr, target){
	if (text.indexOf(substr) != -1){
		return text.replace(substr, target);
	}
	return text+'\n\n'+target;
};
function toStack(){
	if (toStack.caller){
		return this.message;
	}
	console.log(this.message+'\n');
	console.log(print.toText(this.stacks));
	Tea.exit(99);
};