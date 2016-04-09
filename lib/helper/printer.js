print.register('Token', tokenPrinter);
print.register('Source', sourcePrinter);
print.register('Location', locationPrinter);
print.register('Pattern', patternPrinter);
print.register('Syntax', syntaxPrinter);
print.register('Scope', scopePrinter);
print.register('Card', cardPrinter);
print.register('Asset', assetPrinter);
print.register('GrammarStack', grammarStackPrinter);
function locationPrinter(loc){
	var text, pos, code, file;
	text = loc.source, pos = loc.start, code = text.slice(loc.start, loc.end+1), file = loc.fileName;
	return printer('Location', print.fragment(text, code, pos, file));
};
function tokenPrinter(token){
	return "(<g:"+(token.type.slice(0,3))+":> '"+(SText(token.text))+"')";
};
function sourcePrinter(src){
	var texts;
	texts = [];
	for (var token, i = 0; i < src.length; i++){
		token = src[i];
		if (!token){
			continue;
		}
		if (token.isToken){
			texts.push((i && token.is('HEAD') ? '\n' : '')+tokenPrinter(token));
		}
	}
	return printer('Source', texts.join(' '));
};
function assetPrinter(asset, __level){
	var texts, conf, text;
	if (__level == null) __level = 0;
	texts = [asset.type];
	conf = asset.config;
	for (var key in conf){
		if (!conf.hasOwnProperty(key)) continue;
		if (conf[key]){
			texts.push(key+':"'+conf[key]+'"');
		}
	}
	switch (asset.type){
		case '*':case 'Code Test':case 'Node Test':
			texts[0] += ': "'+asset.content+'"';
			break;
		case 'Codes Test':
			texts[0] += ': ["'+asset.content.join('" "')+'"]';
			break;
		case 'Method Test':
			texts[0] += ': '+asset.content+'('+asset.param.join(', ')+')';
			break;
		case 'Sub':
			texts.push('\n'+patternPrinter(asset.content, __level+1).replace(/^/mg, SText.tabsize)+'\n');
			break;
		case 'Pair Test':
			texts[0] += ': "'+asset.content[0]+'" ... "'+asset.content[1]+'"';
			break;
	}
	text = '['+texts.join(' ')+']';
	return text;
};
function patternPrinter(patt, __level){
	var texts, text;
	if (__level == null) __level = 0;
	switch (isClass(patt)){
		case 'Asset':
			return assetPrinter(patt, __level);
		case 'Pattern':
			texts = [];
			for (var i = 0; i < patt.length; i++){
				texts.push(patternPrinter(patt[i], __level+1));
			}
			if (isClass(patt[0]) == 'Pattern'){
				text = texts.join('\n[r{or}]----\n');
			}else {
				text = texts.join('\n').replace(/^/mg, '|  ');
			}
			break;
	}
	if (__level === 0){
		text = printer('Grammar Pattern', '"<'+patt.string+'>"'+'\n'+text);
	}
	return text;
};
function syntaxPrinter(node, __level, __indent){
	var indent, texts, text;
	if (__level == null) __level = 0;
	if (__indent == null) __indent = 0;
	indent = '';
	texts = [];
	if (/root|block/i.test(node.type) && node.length){
		indent = '\n'+SText.copy(SText.tabsize, __indent+1);
	}
	for (var item, i = 0; i < node.length; i++){
		item = node[i];
		if (!item) continue;
		if (node[i].isToken){
			texts.push("'"+SText(node[i].text)+"'");
		}else {
			texts.push(indent+syntaxPrinter(node[i], __level+1, indent ? __indent+1 : __indent));
		}
	}
	text = "[(<g:"+(node.type)+":>) "+texts.join(', ')+(indent ? '\n'+SText.copy(SText.tabsize, __indent) : '')+']';
	if (__level === 0){
		return printer('Syntax Tree', text);
	}
	return text;
};
function scopePrinter(scope, __level){
	var texts, undefineds, ref, c, m, text;
	if (__level == null) __level = 0;
	texts = [];
	texts.push(scope.type+(scope.name ? ' "'+scope.name+'"' : ''));
	undefineds = Object.keys(scope.undefines);
	if (undefineds.length){
		texts.push('  undefineds : "'+undefineds.join('", "')+'"');
	}
	for (var ref = ['variables', 'protos', 'statics'], type, i = 0; i < ref.length; i++){
		type = ref[i];
		if (c = scope[type]){
			m = {};
			for (var k in c){
				if (!c.hasOwnProperty(k)) continue;
				var v = c[k];
				if (v){
					!m[v[0]] && (m[v[0]] = []);
					m[v[0]].push(k);
				}
			}
			if (!Jsop.isEmpty(m)){
				texts.push('  '+type+' :');
			}
			for (var k in m){
				if (!m.hasOwnProperty(k)) continue;
				var v = m[k];
				texts.push('      "'+k+'" : "'+v.join('", "')+'"');
			}
		}
	}
	if (scope.subs){
		texts.push('<-->');
		for (var i = 0; i < scope.subs.length; i++){
			texts.push('  sub : '+(scopePrinter(scope.subs[i], __level+1)).replace(/^/mg, '        ').trim());
		}
	}
	text = '[ '+texts.join('\n')+'\n]';
	if (__level === 0){
		return printer('Scope Object', text);
	}
	return text;
};
function cardPrinter(data, __level, __circular){
	var texts, isblock, text;
	if (__level == null) __level = 0;
	if (__circular == null) __circular = [];
	__circular.push(data);
	texts = [];
	for (var item, i = 0; i < data.length; i++){
		item = data[i];
		if (item.isToken){
			texts.push('"'+SText(item.text)+'"');
		}else if (typeof item == 'string'){
			texts.push(SText(item));
		}else {
			if (__circular.indexOf(item) != -1){
				return '[Circular]';
			}
			texts.push(cardPrinter(item, __level+1, __circular));
		}
	}
	isblock = /root|block/i.test(data.type);
	text = '[('+data.type.replace(/(Expr|Stam|Decl|Patt)$/g, '')+')'+(data.type == 'Root' ? '\n' : '');
	text += texts.join(isblock ? '\n' : '');
	text += ']';
	if (/block/i.test(data.type)){
		text = text.replace(/^/mg, '\t');
	}
	if (__level === 0){
		return printer('Script Card', text);
	}
	return text;
};
function grammarStackPrinter(stack, __level){
	var texts, text;
	if (__level == null) __level = 0;
	texts = [];
	if (stack.name){
		texts.push(stack.name);
	}
	for (var item, i = 0; i < stack.subs.length; i++){
		item = stack.subs[i];
		if (typeof item == 'string'){
			texts.push(item);
		}else {
			texts.push(grammarStackPrinter(item, __level+1));
		}
	}
	if (texts.length > 2){
		text = ('*'+texts.join('\n    > ')).replace(/^(?!\*)/mg, '  ');
	}else {
		text = texts.join(' - ');
	}
	if (__level == 0){
		return printer('Grammar stack', text);
	}
	return text;
};
function printer(title, text){
	text = "| * "+title+" Printer\n"+(text.replace(/^/mg, '  *  '))+"\n| * End\n";
	return text;
};