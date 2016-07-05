print.register('Location', locationPrinter);
print.register('Token', tokenPrinter);
print.register('Source', sourcePrinter);
print.register('Node', nodePrinter);
print.register('Scope', scopePrinter);
print.register('Card', cardPrinter);
print.register('Syntax', syntaxPrinter);
print.register('Pattern', patternPrinter);
print.register('Standard', standardPrinter);
function locationPrinter(loc){
	var text, pos, code, file;
	text = loc.source, pos = loc.start, code = text.slice(loc.start, loc.end+1), file = loc.fileName;
	return printer('Location', print.fragment(text, code, pos, file));
};
function tokenPrinter(token){
	return "("+(token.indent>=0?'*':'')+"<g:"+(token.types.join(' ').replace(/\b(\w{3})\w+\b/g, '$1'))+":> '"+(SText(token.text))+"')";
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
function nodePrinter(node, __level, __indent){
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
			texts.push(indent+nodePrinter(node[i], __level+1, indent ? __indent+1 : __indent));
		}
	}
	text = "[(<g:"+(node.type)+":>) "+texts.join(', ')+(indent ? '\n'+SText.copy(SText.tabsize, __indent) : '')+']';
	if (__level === 0){
		return printer('Node Tree', text);
	}
	return text;
};
function scopePrinter(scope, __level){
	var texts, undefineds, ref, c, m, text;
	if (__level == null) __level = 0;
	texts = [];
	texts.push(scope.type+' < '+scope.target.type+(scope.name ? ' < "'+scope.name+'"' : ''));
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
					m[v[0]].push(v[1] ? k+'('+v[1]+')' : k);
				}
			}
			if (!Jsop.isEmpty(m)){
				texts.push('  '+type+' :');
			}
			for (var k in m){
				if (!m.hasOwnProperty(k)) continue;
				var v = m[k];
				texts.push('      "'+k+'" : '+v.join(', '));
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
function cardPrinter(card, __level){
	var texts, lf, text;
	if (__level == null) __level = 0;
	texts = [];
	for (var item, i = 0; i < card.length; i++){
		item = card[i];
		if (item.isToken){
			texts.push('"'+SText(item.text)+'"');
		}else if (typeof item == 'string'){
			texts.push('"'+SText(item)+'"');
		}else {
			if (item = cardPrinter(item, __level+1)){
				texts.push(item);
			}
		}
	}
	lf = /root|node/i.test(card.type) ? '\n' : '';
	text = texts.join(lf);
	if (text && lf){
		text = text.replace(/^/mg, '\t');
	}
	text = '[('+(card.type || '??').replace(/(Expr|Stam|Decl|Patt)$/g, '')+')'+(text ? lf+text+lf : '')+']';
	if (__level === 0){
		return printer('Transform Card', text);
	}
	return text;
};
function syntaxPrinter(syntax){
	var text;
	if (syntax.pattern){
		text = syntaxPatternPrinter(syntax.pattern, 1);
		return printer(syntax.name+' syntax pattern', '"<'+syntax.pattern.string+'>"'+'\n'+text);
	}
};
function patternPrinter(patt){
	if (patt.isSyntaxPattern){
		return syntaxPatternPrinter(patt);
	}
	if (patt.isTransformPattern){
		return transformPatternPrinter(patt);
	}
};
function syntaxPatternPrinter(patt, __level){
	var texts, text;
	if (__level == null) __level = 0;
	texts = [];
	for (var asset, i = 0; i < patt.length; i++){
		asset = patt[i];
		if (asset.isSyntaxPattern){
			texts.push(syntaxPatternPrinter(asset, __level+1));
		}else {
			texts.push(syntaxAssetPrinter(asset, __level));
		}
	}
	if (patt.type == 'Or'){
		text = texts.join('\n|································\n');
	}else {
		text = texts.join('\n').replace(/^/mg, '|  ');
	}
	if (patt.type == 'Or' || patt.type == 'Group'){
		text = text.replace(/^\|  /g, '|- ').replace(/\n\|  (.*)$/g, '\n|- $1');
	}
	if (__level === 0){
		text = printer('syntax pattern', '"<'+patt.string+'>"'+'\n'+text);
	}
	return text;
};
function syntaxAssetPrinter(asset, __level){
	var texts, title, value;
	if (__level == null) __level = 0;
	texts = [asset.type];
	for (var key in asset.config){
		if (!asset.config.hasOwnProperty(key)) continue;
		var value = asset.config[key];
		if (value){
			texts.push(key+':"'+value+'"');
		}
	}
	title = '['+texts.join(' ')+']';
	texts = [];
	value = asset.value;
	switch (asset.type){
		case 'Group':
			texts.push('\n'+syntaxPatternPrinter(asset.value, __level+1));
			break;
		case '*':case 'Code Test':
			texts.push('"'+value+'"');
			break;
		case 'Codes Test':
			texts.push('["'+value.join('" "')+'"]');
			break;
		case 'Node Test':
			texts.push(value);
			break;
		case 'Pair Test':
			texts.push('"'+value[0]+'" ... "'+value[1]+'"');
			break;
		case 'Method Test':
			texts.push(value+'('+asset.params.join(', ')+')');
			break;
		case 'Set Test':
			for (var key in value){
				if (!value.hasOwnProperty(key)) continue;
				if (key[0] != '_'){
					texts.push("      \""+key+"\"<> → <"+(value[key].value)+">");
				}
			}
			for (var patt, i = 0; i < value.__Defaults__.length; i++){
				patt = value.__Defaults__[i];
				texts.push("       -<> → <"+(patt.value)+">");
			}
			return title+' [\n'+print.format(texts.join('\n'))+'\n    ]';
	}
	return title+' '+texts.join(' ');
};
function standardPrinter(std, __level){
	var texts;
	if (__level == null) __level = 0;
	texts = [];
	if (std.pattern){
		return '    '+std.pattern;
	}
	if (std.control){
		texts.push('['+std.control+'] '+(std.condition || std.target || '')+':');
	}
	if (std.branch && std.branch.length){
		for (var i = 0; i < std.branch.length; i++){
			texts.push(standardPrinter(std.branch[i], __level+1));
		}
	}
	if (__level === 0){
		return printer('standard object', texts.join('\n'));
	}
	return texts.join('\n').replace(/^/mg, '    ');
};
function transformPatternPrinter(patt){
	var texts;
	texts = [];
	for (var asset, i = 0; i < patt.length; i++){
		asset = patt[i];
		if (!asset.isAsset){
			texts.push('         "'+asset+'"');
			continue;
		}
		texts.push(transformAssetPrinter(asset));
	}
	return printer('transform pattern', texts.join('\n').replace(/^/mg, '    '));
};
function transformAssetPrinter(asset){
	return "["+(asset.type)+"]"+(SText.copy(' ', 6-asset.type.length))+" "+asset.string;
};
function printer(title, text){
	text = ("[<b:"+title+":>]\n"+text+"\n[<b:End:>]").replace(/^/mg, '  <r:*:>  ')+'\n';
	if (print.isTerminal){
		text = text.replace(/(\[[^\]]+\])/g, '<b:$1:>');
		text = text.replace(/("(?:\\"|[^"])+")/g, '<g:$1:>');
	}
	return text;
};