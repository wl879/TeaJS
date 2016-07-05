module.exports = lexer;
var Location = require("./location.js");
var Token = require("../token.js");
var Script = require("../sugar/script.js");
function lexer(text, file, sugar_box){
	var loc, len, index, src, leap, token, ref;
	loc = new Location(file, text);
	text = loc.source;
	len = text.length;
	index = 0;
	src = [];
	leap = [];
	while (index < len){
		if (leap.length){
			index = checkLeap(leap, index);
			if (index >= len){
				break;
			}
		}
		token = Token.create(text, index);
		token.location = loc.fission(token.text, index);
		if (ref = tokenLexer(src, token, text, index, sugar_box)){
			if (typeof ref == 'number'){
				index = ref;
				continue;
			}
			if (ref.isToken){
				token = ref;
			}else if (Array.isArray(ref)){
				leap.push.apply(leap, ref);
				continue;
			}
		}
		index = token.location.end+1;
		src.push(token);
	}
	return src;
};
function tokenLexer(src, token, text, index, sugar_box){
	switch (token.text){
		case '#line':
			return defineLine(src, token, text, index, sugar_box);
		case '#argv':
			deleteBlank(src);
			return defineArgv(src, token, text, index, sugar_box);
		case '#token':
			deleteBlank(src);
			return defineToken(src, token, text, index, sugar_box);
		case '#define':
			deleteBlank(src);
			return defineMarco(src, token, text, index, sugar_box);
		case '#expr':case '#stam':case '#sugar':
			deleteBlank(src);
			return defineSugar(src, token, text, index, sugar_box);
		case '#std':
			deleteBlank(src);
			return defineStandard(src, token, text, index, sugar_box);
		case '#undef':
			deleteBlank(src);
			return defineDelete(src, token, text, index, sugar_box);
		case '#if':case '#ifdef':
			deleteBlank(src);
			return defineIF(src, token, text, index, sugar_box);
		case '#script':
			deleteBlank(src);
			return defineScript(src, token, text, index, sugar_box);
		case '#include':
			return defineInclude(src, token, text, index, sugar_box);
		case '/=':case '/':
			return concatRegExp(src, token, text, index, sugar_box);
		case '""""':case '"""':case '"':case '`':case '\'\'\'\'':case '\'\'\'':case '\'':
			return concatString(src, token, text, index, sugar_box);
		case '#!':case '//':case '/*':
			return concatComment(src, token, text, index, sugar_box);
		case '#elfi':case '#elifdef':case '#else':case '#endif':
			Tea.error(2002, token);
			break;
	}
};
/**
 * 
 */
function concatComment(src, token, text, index, sugar_bo){
	var ab;
	if (token.text == '/*'){
		if (ab = matchPair(text, index, '/*', '*/')){
			concatToken(token, text, ab[0], ab[1], ['COMMENT']);
		}else {
			Tea.error(1101, token);
		}
	}else {
		ab = matchPair(text, index, token.text, '\n') || [index, text.length-1];
		concatToken(token, text, ab[0], ab[1]-1, ['COMMENT']);
	}
};
function concatRegExp(src, token, text, index, sugar_box){
	var m;
	if (!checkIsValue(src, src.length-1)){
		if (m = text.substr(index).match(/^\/(?:\\.|\[(?:\\.|[^\]])+\]|[^\/])+?\/([gimyu]+\b)?/)){
			concatToken(token, text, index, index+m[0].length-1, ['REGEXP', 'CONST']);
		}
	}
};
// return;
// if ab = matchPair(text, index, '/', '/', /[gimyu]+/):
// 	concatToken(token, text, ab[0], ab[1], ['REGEXP', 'CONST']);
function concatString(src, token, text, index, sugar_box){
	var ab;
	if (ab = matchPair(text, index, token.text, token.text)){
		concatToken(token, text, ab[0], ab[1], ['STRING', 'CONST']);
	}
};
function defineLine(src, token, text, index, sugar_box){
	token.text = token.location.lineNumber+'';
	token.types = ['NUMBER', 'CONST'];
};
function defineArgv(src, token, text, index, sugar_box){
	var param, argv;
	if (param = matchParam(text, index+token.text.length, sugar_box)){
		argv = param.text.replace(/\s+/g, ' ').trim().split(' ');
		Tea.argv.parse(argv);
		Tea.log('#argv        : '+argv, token.location);
		return param.b+1;
	}else {
		Tea.error(2008, token);
	}
};
function defineToken(src, token, text, index, sugar_box){
	var re, m, names, value;
	re = /#token\s*(\w+(?: \w+)*)\s*<((?:\\\\|\\>|[^>])+)>\s*(\n|$)/g;
	re.lastIndex = index;
	if ((m = re.exec(text)) && m.index === index){
		names = m[1].split(' ');
		value = m[2];
		Token.define(names, [value]);
		Tea.log('#token: '+names+' -> "'+value+'"', token.location);
		return index+m[0].length;
	}else {
		Tea.error(2005, token);
	}
};
function defineMarco(src, token, text, index, sugar_box){
	var re, m, name, args, param, body;
	re = /#define\s*(\w+)(?:\((.*)\))?/g;
	re.lastIndex = index;
	if ((m = re.exec(text)) && m.index === index){
		name = m[1];
		args = m[2];
		param = matchParam(text, index+m[0].length, sugar_box);
		body = param.text;
		sugar_box.add('macro', name, args, body, token.location);
		Tea.log('#define marco: '+name, token.location);
		return param.b+1;
	}else {
		Tea.error(2009, token);
	}
};
function defineSugar(src, token, text, index, sugar_box){
	var re, m, type, name, value, param;
	re = /#(expr|stam|sugar)\s*(\w+)\s*<((?:\\\\|\\>|[^>])+)>/g;
	re.lastIndex = index;
	if ((m = re.exec(text)) && m.index === index){
		type = m[1];
		name = m[2];
		value = m[3];
		param = matchParam(text, index+m[0].length, sugar_box);
		sugar_box.add(type, name, value, param.text, token.location);
		Tea.log('#define '+type+' : '+name, token.location);
		return param.b+1;
	}else {
		Tea.error(2011, token.text, token);
	}
};
function defineStandard(src, token, text, index, sugar_box){
	var re, m, name, param;
	re = /#std\s*(\w+)/g;
	re.lastIndex = index;
	if ((m = re.exec(text)) && m.index === index){
		name = m[1];
		param = matchParam(text, index+m[0].length, sugar_box);
		sugar_box.add('sugar', name, null, param.text, token.location);
		Tea.log('#define std: '+name, token.location);
		return param.b+1;
	}else {
		Tea.error(2011, token.text, token);
	}
};
function defineDelete(src, token, text, index, sugar_box){
	var param, names;
	if (param = matchParam(text, index+token.text.length, sugar_box)){
		names = param.text.replace(/\s+/g, ' ').trim().split(' ');
		sugar_box.undef.apply(sugar_box, names);
		Tea.log('#undef        : '+names, token.location);
		return param.b+1;
	}else {
		Tea.error(2010, token);
	}
};
function defineIF(src, token, text, index, sugar_box){
	var blocks, dels, cond, file, last;
	blocks = matchControlBlock(text, index);
	dels = [];
	cond = false;
	file = token.location.fileName;
	for (var block, i = 0; i < blocks.length; i++){
		block = blocks[i];
		if (!cond){
			cond = conditionEval(block.tag, block.param, sugar_box, file, token.location);
			if (cond){
				last = blocks[blocks.length-1];
				dels.push([block.a, block.b, block.b+1]);
				dels.push([block.c+1, last.d, last.d+1]);
				Tea.log('#'+block.tag+' "'+block.param+'" is true : ignore line '+SText.indexLine(text, block.c)[1]+' ~ '+SText.indexLine(text, last.d)[1]);
				break;
			}else {
				Tea.log('#'+block.tag+' "'+block.param+'" is false : ignore line '+SText.indexLine(text, block.a)[1]+' ~ '+SText.indexLine(text, block.d)[1]);
				dels.push([block.a, block.d, block.d+1]);
			}
		}
	}
	return dels;
};
function defineInclude(src, token, text, index, sugar_box){
	var re, m, dir, file;
	re = /#include\s*(["'`])((?:\\\\|\\\1|.)+)\1\s*(;|\n|$)/g;
	re.lastIndex = index;
	if ((m = re.exec(text)) && m.index === index){
		dir = Fp.dirName(token.location.fileName);
		file = m[2];
		file = Fp.resolve(dir, file, ['.tea', '.js', '/index.tea', '/index.js']);
		if (file){
			if (file === token.location.fileName){
				Tea.error(2007, token);
			}
			src.push.apply(src, lexer(null, file, sugar_box));
		}
		return index+m[0].length;
	}else {
		Tea.error(2006, token);
	}
};
function defineScript(src, token, text, index, sugar_box){
	var block, script, args, params, fn;
	block = matchCodeBlock(text, index);
	script = text.slice(block.b+1, block.c+1);
	if (script.trim()){
		script = tokensToString(lexer(script, null, sugar_box));
	}
	args = [];
	params = [];
	fn = Script.createScript(script, args, sugar_box);
	try {
		var block, script, args, params, fn;
		output = fn.apply(null, params);
	}catch (e) {
		var block, script, args, params, fn;
		Tea.error(2014, e.message, token);
	};
	if (output){
		src.push.apply(src, lexer(output, null, sugar_box));
	}
	Tea.log('#script runed: '+output.substr(0, 20)+'...', token.location);
	return block.d+1;
};
/**
 * 
 */
function checkLeap(data, index){
	for (var item, i = 0; i < data.length; i++){
		item = data[i];
		if (index >= item[0] && index <= item[1]){
			data.splice(i, 1);
			return item[2];
		}
	}
	return index;
};
function prevIndex(src, index){
	while (src[index] && src[index].is('COMMENT', 'BLANK', 'LF')){
		index -= 1;
	}
	return index;
};
function checkIsValue(src, index){
	var token;
	index = prevIndex(src, index);
	if (token = src[index]){
		if (token.is('CONST', 'CLOSE', 'POSTFIX')){
			return true;
		}
		if (token.is('IDENTIFIER')){
			if (!token.is('BINARY', 'UNARY')){
				return true;
			}
		}else if (!token.is('KEYWORD')){
			return false;
		}
		token = src[prevIndex(src, index-1)];
		if (token && token.is('LINK')){
			return true;
		}
	}
	return false;
};
function concatToken(token, source, a, b, types){
	token.text = source.slice(a, b+1);
	token.types = types;
	token.location.code = token.text;
	token.location.end = b;
};
function deleteBlank(src){
	if (src.length && src[src.length-1].is('BLANK')){
		src.length -= 1;
	}
};
function matchPair(text, index, s1, s2, s3){
	var ab, m;
	ab = SText.indexPair(text, s1, s2, index, true);
	if (ab && ab[0] == index){
		ab[1] += s2.length-1;
		if (s3){
			if (typeof s3 == 'string'){
				if (text.substr(ab[1]+1).indexOf(s3) === 0){
					ab[1] += s3.length;
					return ab;
				}
			}else if (m = text.substr(ab[1]+1).match(s3)){
				if (m.index == 0){
					ab[1] += m[0].length;
					return ab;
				}
			}
		}
		return ab;
	}
};
function matchParam(text, index, sugar_box){
	var m, ab, b, a;
	if (m = text.substr(index).match(/^\s*\{\{/)){
		if (ab = matchPair(text, index+m[0].length-2, '{{', '}}')){
			b = text.indexOf('\n', ab[1]+2);
			if (b == -1){
				b = text.length-1;
			}
			return {"a": index, "b": b, "text": text.slice(ab[0]+2, ab[1])};
		}
	}
	b = a = index;
	while (true){
		b = text.indexOf('\n', b);
		if (b >= 0){
			if (text[b-1] == '\\'){
				b += 1;
				continue;
			}
		}else {
			b = text.length-1;
		}
		break;
	}
	text = text.slice(a, b+1).replace(/\\\n/mg, '\n');
	return {"a": a, "b": b, "text": text};
};
function matchControlBlock(text, index){
	var blocks, block;
	blocks = [];
	while (true){
		if (block = matchCodeBlock(text, index)){
			blocks.push(block);
			if (/^(else|elif|elifdef)$/.test(block.nextTag)){
				index = block.c+1;
				continue;
			}
		}
		break;
	}
	return blocks;
};
function matchCodeBlock(text, index){
	var re, m, param, block, ref;
	re = /([\t ]*)#(\w+)\b/g;
	re.lastIndex = index;
	if ((m = re.exec(text)) && m.index == index){
		param = matchParam(text, m.index+m[0].length);
		block = {
			"tag": m[2],
			"param": param.text.trim(),
			"a": index,
			"b": param.b,
			"c": null,
			"d": null};
		re.lastIndex = block.b+1;
		while (m = re.exec(text)){
			block.nextTag = m[2];
			switch (m[2]){
				case 'script':case 'test':
					re.lastIndex = matchCodeBlock(text, m.index).d;
					break;
				case 'if':case 'ifdef':
					ref = matchControlBlock(text, m.index);
					re.lastIndex = ref[ref.length-1].d;
					break;
				case 'else':case 'elif':case 'elifdef':
					block.d = block.c = m.index-1;
					return block;
				case 'endif':
					block.c = m.index-1;
					if (!/^(if|ifdef|else|elif|elifdef)$/.test(block.tag)){
						block.d = block.c;
					}else {
						block.d = text.indexOf('\n', m.index+m[0].length);
						if (block.d == -1){
							block.d = text.length-1;
						}
					}
					return block;
				case 'end':
					block.c = m.index-1;
					block.d = text.indexOf('\n', m.index+m[0].length);
					if (block.d == -1){
						block.d = text.length-1;
					}
					return block;
			}
			break;
		}
		block.d = block.c = text.length-1;
		return block;
	}else {
		Tea.error(2012, [text, index]);
	}
};
function conditionEval(tag, cond, sugar_box, file, loc){
	var ifdef, root_file, exp;
	if (tag == 'else'){
		return true;
	}
	cond = cond.replace(/\:\s*$|\;\s*$/g, '').trim();
	if (!cond){
		return false;
	}
	ifdef = tag.indexOf('def') != -1;
	root_file = Tea.argv.file;
	exp = cond.replace(/((-{0,2})[\$a-zA-Z_][\w]*)\b/g, function($0, $1, $2){
		var res;
		switch ($1){
			case '--main':
				return root_file == file;
			case '--root':
				return '"'+root_file+'"';
			case '--version':case '-v':
				return '"'+Tea.version+'"';
			case '--file':
				return '"'+file+'"';
			default:
				if ($2){
					res = Tea.argv[$1];
				}else if (ifdef){
					return !!sugar_box.get($1);
				}else if (global.hasOwnProperty($1)){
					res = global[$1];
				}else {
					return $1;
				}
				break;
		}
		return typeof res == 'string' ? '"'+res.replace(/\"/g, '\\"')+'"' : res;
	});
	try {
		var ifdef, root_file, exp;
		return exp && eval('!!('+exp+')');
	}catch (e) {
		var ifdef, root_file, exp;
		Tea.error(2013, exp, e.message, loc);
	};
};
function tokensToString(src){
	var texts;
	texts = [];
	for (var token, i = 0; i < src.length; i++){
		token = src[i];
		if (token){
			texts.push(token.text);
		}
	}
	return texts.join('');
};