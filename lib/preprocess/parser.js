var Parser = module.exports,
	Tokens = require("../tokens"),
	Syntax = require("../syntax"),
	Template = require("./template.js"),
	IncludeCache = {};
Parser.instruction = function(src, index, token){
	var type = token.text.substr(1);
	if (Parser.hasOwnProperty(type)){
		Parser[type].call(this, src, index, token);
	}else if (/^(elifdef|elif|ifdef|else|endif|if)$/.test(type)){
		if (type == 'if' || type == 'ifdef'){
			Parser.control.call(this, src, index, token);
		}else {
			throw tea.error(new Error(), 'unexpected #'+type+' prep instruction', token);
		}
	}else if (type == 'end'){
		throw tea.error(new Error(), 'unexpected #end prep instruction', token);
	}else {
		if (!Parser.compileMacro.call(this, src, index, token)){
			var line = src.indexLine(index);
			src.delete(index, line[1]-1);
		}
	}
};
Parser.compileMacro = function(src, index, token){
	var name = token.text, param, value;
	if (token.type == 'InstructionExpr'){
		name = name.substr(1);
	}else {
		var last = src[src.prevIndex(index, true)];
		if (last && last.eq('.', '::', '..', 'function', 'set', 'get', 'static')){
			return;
		}
	}
	var macro = this.get(name, 'macrofun');
	if (macro){
		src.index = index;
		var param_node = Syntax.match(src.next(1).text == '(' ? 'ParamsExpr' : 'ParamsStam', src);
		if (param_node){
			var param = src.join(index+1, src.index).trim();
			if (param_node.type == 'ParamsExpr'){
				param = param.slice(1, -1).trim();
			}
			src.delete(index, src.index);
		}else {
			macro = null;
		}
	}
	if (!macro){
		macro = this.get(name, 'macro');
	}
	if (macro){
		value = macro.getValue(param, src);
		src.delete(index, index);
		if (value){
			src.insert(index, this.parse(value));
		}
		if (debug.prep){
			debug.prep('[Prep macro matched: '+name+']', token);
		}
		return true;
	}
	return false;
};
Parser.line = function(src, index, token){
	token.text = token.location.lineNumber+'';
	token.types = ['NumTokn', 'ConstTokn'];
	if (token.indent >= 0){
		token.types.push('LineHead');
	}
};
Parser.argv = function(src, index, token){
	var m, line = src.indexLine(index);
	if (typeof tea != 'undefined'){
		var line_text = src.join(line[0], line[1]);
		if (m = line_text.match(/\#argv\s*((-{0,2})[\w\-]+)\s*(.*)/)){
			var type = m[2], name = m[1], value = true;
			if (m[3] == 'false' || m[3] == 'null'){
				value = false;
			}else if (m[3]){
				try {
					value = eval(m[3]);
				} catch (_e){}
			}
			tea.argv[name] = value;
			if (debug.prep){
				debug.prep('[Prep set argv: g{'+name+' == '+tea.argv[name]+'}]', token);
			}
		}
	}
	src.delete(line[0], line[1]);
};
Parser.token = function(src, index, token){
	// ---> run at source parse
	var m, line = src.indexLine(index), line_text = src.join(line[0], line[1]);
	src.delete(line[0], line[1]);
	if (m = line_text.match(/#token\s*(\w+(?:\s*,\s*\w+)*)\s*(.*)/)){
		var types = Text.split(m[1], ',', true), symbols = Text.split(m[2], ',', true);
		Tokens.define(types, symbols);
		if (debug.prep){
			debug.prep('[Prep define token: g{"'+symbols.join('", "')+'"}]', token);
		}
	}
};
Parser.run = function(src, index, token){
	var res, block = src.indexPair('#run', '#endrun|#end', index);
	if (!block){
		block = [index, src.length];
	}
	var block_text = src.join(block[0]+1, block[1]-1);
	src.delete(block[0], block[1]);
	if (block_text){
		try {
			var script = Template.runScript(block_text);
			if (res = eval(script)){
				src.insert(index, Tokens.tokenize(res));
			}
			if (debug.prep){
				debug.prep('[Prep run instruction]', token);
			}
		}catch (e) {
			var err_pot = tea.helper.errorPot(token);
			err_pot = err_pot.replace(/[^\n]*$/g, '')+block_text.replace(/^/mg, err_pot.match(/"(\s*\d+\s*\|)/)[1]+'\t')+'\n"';
			throw tea.error(new Error(), e, 'Prep run eval error: '+e.message, err_pot);
			//,token;
		}
	}
};
Parser.define = function(src, index, token){
	var m,
		_ref = indexInstruction(src, index, token), a = _ref[0], b = _ref[1],
		text = src.join(a+1, b);
	if (m = text.match(/\s*(\w+)(\(.*?\))?\s*((?:.*(?:\n\s*)?""""[\w\W]*?""""|(?:.*\\\n)*.*)(?:\n|$))/)){
		var name = m[1],
			params = m[2] && m[2].slice(1, -1).replace(/\s/g, '').split(','),
			body = m[3] && Text.trimIndent(m[3].replace(/\\\n/g, '\n').replace(/^""""|""""\s*$/g, ''));
		if (body && /#(?:if|argv)/.test(body)){
			body = this.parse(body).join();
		}
		var macro = this.add(name, params, body);
		if (macro.error){
			throw tea.error(new Error(), macro.error, token);
		}
		if (debug.prep){
			debug.prep('[Prep define: g{'+name+(m[2] || '')+'}]', token);
		}
	}
	src.delete(a, b);
};
Parser.undef = function(src, index, token){
	var line = src.indexLine(index), line_text = src.join(line[0]+1, line[1]).trim();
	src.delete(line[0], line[1]);
	if (line_text){
		var names = line_text.replace(/\s+/g, ' ').split(' ');
		for (var i=0; i < names.length; i++){
			this.undef(names[i]);
		}
		if (debug.prep){
			debug.prep('[Prep undef: g{'+names.join(', ')+'}]', token);
		}
	}
};
Parser.include = function(src, index, token){
	src.index = index;
	var b = index,
		the_dir = Path.dirname(token.location && token.location.fileName || src.fileName),
		files = [],
		temp = [];
	while (src.next(1).type == 'StringTokn'){
		temp = Path.parseFile(src.current.text, the_dir);
		if (temp.error){
			throw tea.error(new Error(), 'Can not find file: '+src.text+' in "'+the_dir+'" dir', token);
		}
		files.push.apply(files, temp);
		b = src.index;
		if (src.next(1).text == ','){
			continue;
		}
		break;
	}
	src.delete(index, b);
	var insert = [];
	for (var i=0, file; i < files.length; i++){
		file = files[i];
		if (!IncludeCache[file]){
			IncludeCache[file] = this.parse(file, true);
			IncludeCache[file].trimIndent();
		}
		if (IncludeCache[file].length){
			insert.push.apply(insert, Tokens.tokenize('/* Include file "'+file+'" */\n'));
			insert.push.apply(insert, IncludeCache[file].clone());
			if (debug.prep){
				debug.prep('[Prep include: file at g{"'+file+'"}]', token);
			}
		}
	}
	if (insert.length){
		src.insert(index, insert);
	}
};
Parser.control = function(src, index, token){
	var cache = [], nest = -1;
	for (var i=index, token; i < src.length; i++){
		token = src[i];
		if (!token || !/#(ifdef|if|elifdef|elif|else|endif|end)/.test(token.text)){
			continue;
		}
		if (token.text == '#ifdef' || token.text == '#if'){
			nest += 1;
		}
		if (nest === 0){
			var line = src.indexLine(i);
			if (cache.length){
				cache[cache.length-1].push(line[1]);
			}
			cache.push([token.text,
				(token.text == '#else' ? '' : src.join(line[0]+1, line[1]).trim()),
				line[0],
				line[1]]);
		}
		if (token.text == '#endif' || token.text == '#end'){
			nest -= 1;
		}
	}
	if (cache.length && cache[cache.length-1][0].substr(0, 4) != '#end'){
		cache[cache.length-1].push(src.length-1);
		cache.push(['#endif', '', src.length-1, src.length-1]);
	}
	if (!src._cachePrepData){
		src._cachePrepData = {};
	}
	var type, cond, status, a, b, c;
	for (var i=0, block; i < cache.length; i++){
		block = cache[i];
		type = block[0], cond = block[1], a = block[2], b = block[3], c = block[4];
		if (type == '#endif' || type == '#end'){
			src.delete(a, c);
			break;
		}
		if (status){
			src.delete(a, c);
			continue;
		}
		if (type == '#else'){
			src.delete(a, b);
			continue;
		}
		if (status = cond && EvalCondition.call(this, type, cond, src, src[a])){
			src.delete(a, b);
		}else {
			src.delete(a, c);
		}
	}
};
Parser.test = function(src, index, token){
	var _ref = src.indexPair('#test', '#end', index), a = _ref[0], b = _ref[1];
	token.text = '/* Test: */\n'+tea.compile(src.clone(a+1, b-1), this)+'\n/* Test end */';
	token.types = ['TestPatt', 'CommDecl'];
	src.delete(a+1, b);
};
Parser.expr = function(src, index, token){
	var _ref = indexInstruction(src, index, token), a = _ref[0], b = _ref[1],
		i = src.nextIndex(index),
		type = token.text.substr(1),
		name = src[i].text;
	i = src.nextIndex(i);
	if (i > b){
		throw tea.error(new Error(), 'Prep grammar define syntax error', token);
	}
	var pattern = src[i].text.slice(1, -1), writer = src.join(i+1, b);
	writer = Text.trimIndent(writer.replace(/\\\n/g, '\n').replace(/^\s*""""|""""\s*$/g, ''));
	this.add(type == 'expr' ? 'expression' : 'statement', name, pattern, writer);
	if (debug.prep){
		debug.prep('[Prep register '+type+': '+name+' -> /'+pattern+'/]', token);
	}
	src.delete(a, b);
};
Parser.stam = Parser.expr;
function indexInstruction(src, index, token){
	var line = src.indexLine(index), a = line[0], b = line[1], c;
	if (src[b-1].text == '\\'){
		while (src[b-1].text == '\\'){
			b = src.indexLine(b+1)[1];
		}
	}else if ((c = src.nextIndex(b, true)) && src[c].text.substr(0, 4) == '""""'){
		b = src.indexLine(b+1)[1];
	}
	return [a, b];
}
function EvalCondition(type, condition, src, token){
	var isdef = type.indexOf('def') != -1,
		root_file = tea.argv.file,
		the_file = token.location && token.location.fileName || src.fileName,
		that = this,
		exp = condition.trim().replace(/((-{0,2})([\$a-zA-Z_][\w]*)\b)/g, function($0, $1, $2, $3){
			var res;
			if ($2){
				if ($3 == 'main'){
					return root_file == the_file;
				}
				if ($3 == 'root'){
					return '"'+root_file+'"';
				}
				if ($3 == 'file'){
					return '"'+the_file+'"';
				}
				res = tea.argv[$1];
			}else if (isdef){
				return !!(that.get($1))+'';
			}else {
				if (global.hasOwnProperty($1)){
					res = global[$1];
				}else if (tea.argv.hasOwnProperty($1)){
					res = tea.argv[$1];
				}else {
					return $1;
				}
			}
			return typeof res == 'string' ? '"'+res.replace(/\"/g, '\"')+'"' : res;
		});
	try {
		return eval('!!('+exp+')');
	}catch (e) {
		throw tea.error(new Error(), e, '[ProProcess condition '+type+' "'+condition+'" -> "'+exp+'" error', token, 'ProProcess condition error!');
	}
}