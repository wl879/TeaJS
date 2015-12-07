var Processor = (function(){
	var include_cache = {}, Template = require("./template.js");
	function Processor(ctx){
		this.context = ctx;
	}
	Processor.prototype.string = function (src, text, i, token){
		return Processor.string(this.context, src, text, i, token);
	}
	Processor.prototype.comm = function (src, text, i, token){
		return Processor.comm(this.context, src, text, i, token);
	}
	Processor.prototype.regexp = function (src, text, i, token){
		return Processor.regexp(this.context, src, text, i, token);
	}
	Processor.prototype.pound = function (src, text, i, token, control_cache){
		return Processor.pound(this.context, src, text, i, token, control_cache);
	}
	Processor.prototype.macro = function (src, text, i, token){
		return Processor.macro(this.context, src, text, i, token);
	}
	Processor.prototype.matchNode = function (type, src, opt){
		var exp;
		if (!(this.context[type])) return;
		var map = this.context[type].map, _index = src.index;
		for (var i=0, name; i < map.length; i++){
			name = map[i];
			src.index = _index;
			if (exp = this.context[type][name].parse(src, opt)){
				if (debug.prep){
					debug.prep('[Prep '+type+': '+name+' matched]', src[_index]);
				}
				return exp;
			}
		}
	}
	Processor.string = function(ctx, src, text, i, token){
		var b, str, re, m, val;
		if ((b = indexRight(text, i, token.text)) === false){
			throw tea.error(new Error(), 'tokenize string pattern error! miss right token', token);
		}
		str = text.slice(i, b+1);
		re = /([^\\]|^)(\#\{((\w+)(.*?))\})/g;
		while (m = re.exec(str)){
			val = parseMacro(ctx, null, m[3], 0, null, m[4]);
			str = str.slice(0, m.index+1)+(val || '')+str.substr(m.index+m[0].length);
			re.lastIndex = m.index+1;
		}
		str = Template.string(str);
		token.text = str;
		token.types = ['StringTokn', 'ConstTokn'];
		token.location.end = b;
		return token;
	};
	Processor.regexp = function(ctx, src, text, i, token){
		var b, match;
		if (!testValue(src, src.prevIndex(src.length, true))){
			if ((b = indexRight(text, i, '/', '/')) === false){
				throw tea.error(new Error(), 'tokenize regexp pattern error! miss right token', token);
			}
			if (match = text.substr(b+1).match(/^[gimy]+/)){
				b = b+match[0].length;
			}
			token.text = Template.regexp(text.slice(i, b+1));
			token.types = ['RegExpDecl', 'ConstTokn'];
			token.location.end = b;
		}
		return token;
	};
	Processor.comm = function(ctx, src, text, i, token){
		var b;
		switch (token.text){
			case '/*':
				if ((b = indexRight(text, i, '/*', '*/')) === false){
					throw tea.error(new Error(), 'tokenize comment pattern error! miss right token', token);
				}
				token.types = ['CommDecl', 'MultiLineComm'];
				break;
			case '//':
				token.types = ['CommDecl', 'LineComm'];
				break;
			case '#!':
				token.types = ['CommDecl', 'ShellComm'];
				break;
		}
		if (!b){
			if ((b = text.indexOf('\n', i)) == -1){
				b = text.length;
			}
			b -= 1;
		}
		token.text = text.slice(i, b+1);
		token.location.end = b;
		return token;
	};
	Processor.pound = function(ctx, src, text, i, token, cache){
		var match, type;
		if (match = text.substr(i+1).match(/^([\$A-Za-z_][\w\$]*)(\:?)/)){
			type = match[1];
			if (Processor.hasOwnProperty(type)){
				token = Processor[type](ctx, src, text, i, token);
			}else if (/^(elifdef|elif|ifdef|else|endif|if)$/.test(type)){
				token = Processor.control(ctx, src, text, i, token, type, cache);
			}else if (type == 'end'){
				token = text.indexOf('\n', i);
			}else {
				token.text = '#'+match[0];
				token.types = ['InstructionExpr', 'ConstTokn'];
				token.location.end = i+match[0].length;
				token = parseMacro(ctx, src, text, i, token, match[0], token.location.end);
			}
		}
		return token;
	};
	Processor.token = function(ctx, src, text, i, token){
		var m;
		if (m = text.substr(i).match(/^#token (\w+(?:\s*,\s*\w+)*) (.*)$/m)){
			var types = Text.split(m[1], ',', true), symbols = Text.split(m[2], ',', true);
			tea.defineToken(types, symbols);
			if (debug.prep){
				debug.prep('[Prep define token: g{"'+symbols.join('","')+'"}]', token);
			}
			return i+m[0].length;
		}else {
			throw tea.error(new Error(), 'define token syntax error!', token);
		}
	};
	Processor.line = function(ctx, src, text, i, token){
		token.text = token.location.lineNumber+'';
		token.types = ['NumTokn', 'ConstTokn'];
		if (token.indent >= 0){
			token.types.push('LineHead');
		}
		token.location.end = i+4;
		return token;
	};
	Processor.argv = function(ctx, src, text, i, token){
		var m, arg;
		if (!(m = text.substr(i).match(/^#argv (.*$)/m))){
			throw tea.error(new Error(), 'define argv syntax error!', token);
		}
		var args = Text.split(m[1], ' ', true);
		for (var _i=0, item; _i < args.length; _i++){
			item = args[_i];
			if (!item){
				continue;
			}
			if (arg = item.match(/\s*((-{0,2})[\w\-]+)(?:\s*=\s*(.*))?/)){
				tea.argv[arg[1]] = evalValue(arg[3]);
				if (debug.prep){
					debug.prep('[Prep set argv: g{'+arg[1]+' == '+tea.argv[arg[1]]+'}]', token);
				}
			}
		}
		return i+m[0].length;
	};
	Processor.run = function(ctx, src, text, i, token){
		var abcd, b, res;
		if (!(abcd = indexInstruction(text, i))){
			throw tea.error(new Error(), 'define run script syntax error', token);
		}
		b = abcd[3];
		try {
			if (res = Template.run(text.slice(i+4, b-3), ['source', 'index', 'argv'], [src, i, tea.argv], ctx)){
				src.parse(res, null, ctx);
				if (debug.prep){
					debug.prep('[Prep run instruction]', token);
				}
			}
		}catch (e) {
			var err_pot = tea.helper.errorPot(token);
			err_pot = err_pot.replace(/[^\n]*$/g, '')+text.slice(i+4, b-3).replace(/^/mg, err_pot.match(/"(\s*\d+\s*\|)/)[1]+'\t')+'\n"';
			throw tea.error(new Error(), e, 'Prep run eval error: '+e.message, err_pot);
		}
		return b+1;
	};
	Processor.define = function(ctx, src, text, i, token){
		var m, name, params, body;
		if (!(m = text.substr(i).match(/^#define +(\w+)(\(.*?\))? *(\s*""""[\w\W]*?""""|(?:.*\\\n)*.*)/))){
			throw tea.error(new Error(), 'define macro syntax error!', token);
		}
		name = m[1], params = m[2] && (m[2].slice(1, -1).trim() || []), body = m[3] && Text.trimIndent(m[3].replace(/\\\n/g, '\n').replace(/^\s*""""|""""\s*$/g, ''));
		if (body && /#(?:if|argv)/.test(body)){
			body = ctx.parse(body).join();
		}
		var macro = ctx.add(name, params, body);
		if (macro.error){
			throw tea.error(new Error(), macro.error, token);
		}
		if (debug.prep){
			debug.prep('[Prep define: g{'+name+(m[2] || '')+'}]', token);
		}
		return i+m[0].length;
	};
	Processor.undef = function(ctx, src, text, i, token){
		var m;
		if (!(m = text.substr(i).match(/^#undef (.+)$/m))){
			throw tea.error(new Error(), 'undefine syntax error!', token);
		}
		var names = m[1].trim().replace(/\s+/g, ' ').split(' ');
		for (var _i=0, name; _i < names.length; _i++){
			name = names[_i];
			ctx.undef(name);
		}
		if (debug.prep){
			debug.prep('[Prep undef: g{'+names.join(', ')+'}]', token);
		}
		return i+m[0].length;
	};
	Processor.include = function(ctx, src, text, i, token){
		var m, file_list, file_dir, files, temp;
		if (!(m = text.substr(i).match(/^#include +((?:[^\,\;\s\\]+(?:\\\ )*)+(?:\s*,\s*(?:[^\,\;\s\\]+(?:\\\ )*)+)*)\;*/))){
			throw tea.error(new Error(), 'include syntax error!', token);
		}
		file_list = m[1].replace(/\s*,\s*/g, ',').replace(/\s*;+/g, '').trim().split(','), file_dir = Path.dirname(token.fileName || src.fileName);
		files = [];
		for (var f=0; f < file_list.length; f++){
			temp = Path.parseFile(file_list[f], file_dir);
			if (temp.error){
				throw tea.error(new Error(), 'Can not find file: '+file_list[f]+' in "'+file_dir+'" dir', token);
			}
			for (var _i=0, file; _i < temp.length; _i++){
				file = temp[_i];
				if (!include_cache[file]){
					include_cache[file] = ctx.parse(null, file);
					include_cache[file].trimIndent();
				}
				if (include_cache[file].length){
					src.insert(token.clone('/* Include file "'+file+'" */\n', ['CommDecl']));
					src.insert(include_cache[file].clone());
					if (debug.prep){
						debug.prep('[Prep include: file at g{"'+file+'"}]', token);
					}
				}
			}
		}
		return i+m[0].length;
	};
	Processor.test = function(ctx, src, text, i, token){
		var b, m;
		if (!(b = indexRight(text, i, '#test', '#end'))){
			b = text.length;
		}
		text = text.slice(i, b-3);
		if (!(m = text.match(/#test(.*)\n/))){
			throw tea.error(new Error(), 'define test block syntax error', token);
		}
		text = text.substr(m[0].length);
		if (m[1] && m[1].trim() == 'run'){
			tea.argv['--test'] = true;
		}
		token.text = '/* Test: */\n'+tea.compile(text, ctx)+'\n/* Test end */';
		token.types = ['TestPatt', 'CommDecl'];
		src.add(token);
		return b+1;
	};
	Processor.expr = function(ctx, src, text, i, token){
		var m, type, name, pattern, writer;
		if (!(m = text.substr(i).match(/#(expr|stat) +([A-Z][\w]+(?:Tokn|Patt|Decl|Expr|Stam)) +[\/\`]((?:[^\/\`]|\\\/|\\\`)+)[\/\`] *(\s*""""[\w\W]*?""""|(?:.*\\\n)*.+)/))){
			throw tea.error(new Error(), 'define syntactic sugar syntax error', token);
		}
		type = m[1] == 'expr' ? 'expression' : 'statement';
		name = m[2];
		pattern = m[3];
		writer = Text.trimIndent(m[4].replace(/\\\n/g, '\n').replace(/^\s*""""|""""\s*$/g, ''));
		var ss = ctx.add(type, name, pattern, writer);
		if (ss.error){
			throw tea.error(new Error(), ss.error, token);
		}
		if (debug.prep){
			debug.prep('[Prep register '+type+': '+name+' -> /'+pattern+'/]', token);
		}
		return i+m[0].length;
	};
	Processor.control = function(ctx, src, text, i, token, type, cache){
		var blocks, status, data;
		if (type == 'if' || type == 'ifdef'){
			if (!(blocks = indexControl(text, i))){
				throw tea.error(new Error(), 'define control preprocess syntax error', token);
			}
			status = false;
			for (var _i=0, item; _i < blocks.length; _i++){
				item = blocks[_i];
				if (status){
					item[1] = false;
				}else {
					item[1] = status = evalCondition(ctx, item[0], item[1], src, token);
				}
				cache[item[2]] = item;
			}
		}
		if (!(data = cache[i])){
			throw tea.error(new Error(), 'unexpected #'+type+' ctx instruction', token);
		}
		if (data[1]){
			return data[4]+1;
		}else {
			return data[5]+1;
		}
	};
	Processor.macro = function(ctx, src, text, i, token){
		if (testIdExpr(src, src.length)){
			return parseMacro(ctx, src, text, i, token, token.text);
		}
		return token;
	};
	Processor.stam = Processor.expr;
	function parseMacro(ctx, src, text, i, token, name, b){
		if (b == null) b = i+name.length-1;
		var macro, params, ab, val_src;
		if (macro = ctx.get(name, 'macrofun')){
			params = text.substr(b+1);
			if (/^\s*\(/g.test(params) && (ab = Text.indexPair(params, 0, '(', ')'))){
				b += ab[1]+1;
				params = params.slice(ab[0]+1, ab[1]);
			}else if (/^\ +[^\n\;\}\]\)\,]/.test(params)){
				ab = Text.indexBreak(params, 0);
				b += ab+1;
				params = params.slice(0, ab+1);
			}else {
				params = '';
			}
		}
		if (!macro || !params){
			macro = ctx.get(name, 'macro');
		}
		if (macro){
			val_src = macro.getValue(params, true);
			if (src){
				src.insert(val_src);
				if (debug.prep){
					debug.prep('[Prep macro matched: '+name+']', token);
				}
			}else {
				return val_src.join();
			}
			return b+1;
		}
		return token;
	}
	function indexInstruction(text, i){
		var m, a, a_, b, type, label, b_, abcd;
		if (m = text.substr(i).match(/^#(\w+)(\:?)/)){
			a = i, a_ = i+m[0].length-1;
			b = i+m[0].length-1;
			type = m[1];
			label = !!m[2];
			var t = 10;
			while (t--){
				if (!(m = text.substr(b+1).match(/#(\w+)(\:?)/))){
					b = text.length, b_ = b;
					break;
				}else {
					if (m[1] == 'end' || m[1] == 'end'+type || m[1] == 'endif' && /^(ifdef|if|elifdef|elif|else)$/.test(type)){
						b = b+1+m.index, b_ = b+m[0].length-1;
						break;
					}else if (label && m[2] || /^(elifdef|elif|else)$/.test(m[1])){
						b_ = b = b+m.index;
						break;
					}
					b = b+m.index;
					if (/^(ifdef|if)$/.test(m[1])){
						if (!(b = indexControl(text, b+1, 'end'))){
							return;
						}
					}else if (/^(run|test)$/.test(m[1]) || m[2] == ':'){
						if (!(abcd = indexInstruction(text, b+1))){
							return;
						}
						b = abcd[3];
					}
				}
			}
			return [a, b, a_, b_];
		}else {
			throw tea.error(new Error(), 'not find instruction');
		}
	}
	function indexControl(text, i, only_index){
		var re, cache, abcd, a, b, _a, _b, m;
		re = /^#(ifdef|if)\b/;
		cache = [];
		while (re.test(text.substr(i))){
			if (!(abcd = indexInstruction(text, i))){
				return;
			}
			a = abcd[0], b = abcd[1], _a = abcd[2], _b = abcd[3];
			if (only_index){
				cache.push([a, b, _a, _b]);
			}else {
				m = text.substr(_a+1).match(/.*$/m);
				cache.push([text.slice(a+1, _a+1), m[0], a, b, _a+m[0].length, _b]);
			}
			re = /^#(elifdef|elif|else)\b/;
			i = _b+1;
		}
		if (!only_index){
			var last = cache[cache.length-1];
			if (m = text.substr(last[3]).match(/^#(endif|end).*$/m)){
				cache.push(['endif', '', last[3], last[3], last[5], last[3]+m[0].length-1]);
			}
		}
		if (only_index == 'end'){
			return cache[cache.length-1][3];
		}
		return cache;
	}
	function indexRight(text, index, s1, s2){
		if (s2 == null) s2 = s1;
		var a_b = Text.indexPair(text, index, s1, s2, true);
		return !a_b || a_b[0] !== index ? false : a_b[1]+s2.length-1;
	}
	function testValue(src, index){
		var token;
		if (token = src[index]){
			if (token.is('ConstTokn', 'Close', 'Postfix')){
				return true;
			}
			if (token.is('IdentifierTokn')){
				if (!token.is('Binary', 'Unary')){
					return true;
				}
			}else if (token.is('Keyword')){
				if (token.is('Restricted')){
					return false;
				}
			}else {
				return false;
			}
			token = src[src.prevIndex(index, true)];
			if (token && token.is('Member')){
				return true;
			}
		}
		return false;
	}
	function testIdExpr(src, index){
		var last;
		last = src[src.prevIndex(index, true)];
		if (last && last.eq('.', '::', '..', 'function', 'set', 'get', 'static')){
			return false;
		}
		return true;
	}
	function evalValue(val){
		if (val == 'false' || val == 'null'){
			return false;
		}else if (val){
			try {
				return eval(val);
			}catch (e) {
				return '"'+val+'"';
			}
		}
		return true;
	}
	function evalCondition(ctx, type, condition, src, token){
		var isdef, root_file, the_file, exp;
		isdef = type.indexOf('def') != -1, root_file = tea.argv.file, the_file = token.fileName || src.fileName, exp = condition.trim().replace(/\:$/, '').replace(/((-{0,2})([\$a-zA-Z_][\w]*)\b)/g, function($0, $1, $2, $3){
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
				return !!ctx.get($1)+'';
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
			return exp && eval('!!('+exp+')') || type == 'else';
		}catch (e) {
			throw tea.error(new Error(), e, '[ProProcess condition '+type+' "'+condition+'" -> "'+exp+'" error', token, 'ProProcess condition error!');
		}
	}
	module.exports = Processor;
	return Processor;
})();