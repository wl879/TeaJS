var Tokens = require("../tokens"),
	Node = require("./node.js"),
	Parser = require("./parser.js");
var SyntaxReg = (function(){
	function SyntaxReg(){
		this.length = 0;
		this.quantifier = '';
		this.minmatch = 0;
	}
	var stx_re_cache = {};
	SyntaxReg.prototype.push = function (){
		for (var i=0; i < arguments.length; i++){
			if (arguments[i] instanceof SyntaxReg){
				arguments[i].parent = this;
			}
		}
		return Array.prototype.push.apply(this, arguments);
	}
	SyntaxReg.prototype.match = function (srcr){
		return SyntaxReg.match(this, src);
	}
	SyntaxReg.compile = function(source){
		if (stx_re_cache[source]){
			return stx_re_cache[source];
		}
		var stx_re = compileSyReg(source);
		stx_re.source = source;
		return stx_re_cache[source] = stx_re;
	};
	SyntaxReg.match = function(stx_re, src){
		var res, matchlist = [];
		matchlist.index = src.index;
		if (res = matchInit(stx_re, src, matchlist)){
			matchlist.lastIndex = src.index;
			matchlist.unshift(res);
		}else {
			matchlist.length = 0;
		}
		return matchlist;
	};
	SyntaxReg.matchNode = function(name, stx_re, src, rule){
		var res = matchInit(stx_re, src);
		if (res){
			if (rule){
				if (typeof rule == 'string' && res.type == rule){
					res.type = name;
				}else if (rule == 'check empty'){
					if (res.length == 0){
						res = new Node(name);
					}else if (res.length == 1){
						res = res[0];
					}else {
						res = new Node(name, res);
					}
				}else if (rule == 'ret list'){
					if (res.isnode){
						res = Hash.slice(res);
					}
				}else if (rule != 'not check'){
					res = new Node(name, res === true ? null : res);
				}
			}else {
				if (!res.istoken && !res.isnode && res !== true){
					if (res.length == 1){
						res = res[0];
					}else if (res.length > 1){
						res = new Node(name, res);
					}
				}
			}
			return res;
		}
	};
	// ------------------------
	function compileSyReg(source, __parent){
		var chipp, chips = Text.split(source, ' ');
		for (var i=chips.length-1, chip; i >= 0; i--){
			chip = chips[i];
			if (/[^\\]\|[^\|]/.test(chip)){
				chipp = Text.split(chip, '|');
				if (chipp.length){
					for (var j = chipp.length-1; j > 0; j--){
						chipp.splice(j, 0, '|');
					}
					chips.splice.apply(chips, [i, 1].concat(chipp));
				}
			}
		}
		var stx_re = new SyntaxReg(), or_list = [], ptn;
		for (var i=0, chip; i < chips.length; i++){
			chip = chips[i];
			if (chip == '|'){
				or_list.push(stx_re);
				stx_re = new SyntaxReg();
				continue;
			}
			ptn = compilePtn(chip);
			ptn.parent = stx_re;
			stx_re.push(ptn);
			stx_re.minmatch += !ptn.quantifier || ptn.quantifier[0] == '+' ? 1 : 0;
		}
		if (or_list.length){
			if (stx_re.length){
				or_list.push(stx_re);
			}
			stx_re = new SyntaxReg();
			for (var i=0; i < or_list.length; i++){
				or_list[i].type = 'Or';
				or_list[i].quantifier = '?';
				or_list[i].parent = stx_re;
				stx_re.push(or_list[i]);
				stx_re.minmatch += or_list[i].minmatch;
			}
		}
		stx_re.parent = __parent;
		return stx_re;
	}
	function compilePtn(source){
		var m,
			ptn = {"type": '', "key": '', "quantifier": '', "param": {}, "text": source},
			text = source;
		if (m = text.match(/[^\\](\+\?|\*\?|\!|\?|\+|\*)$/)){
			ptn.quantifier = m[1], text = text.slice(0, -1);
		}
		if (m = text.match(/(?:\{([^\}]*)\})$/)){
			ptn.param = compileParam(m[1]);
			text = text.slice(0, m.index);
		}
		if (text[0] == '(' && text[text.length-1] == ')'){
			text = text.slice(1, -1);
			// set name
			if (m = text.match(/^(\?[\=\!\:]?)?(?:(\:{1,3})([A-Z][\w\.\-]+(?:Tokn|Patt|Expr|Stam|Decl)\b))?/)){
				if (m[1] || m[2]){
					ptn.assertion = (m[1] || '')+(m[2] || '');
					if (m[3]){
						ptn.name = m[3];
					}
					text = text.substr(m[0].length);
				}
			}
			ptn.type = 'Sub';
			ptn.key = compileSyReg(text, ptn);
		}else if (text == '*'){
			ptn.type = 'ALL';
			ptn.key = text;
		}else if (Tokens.types.hasOwnProperty(text)){
			ptn.type = 'Tokn';
			ptn.key = text;
		}else if (m = text.match(/^[A-Z]\w+(?:Tokn|(Patt|Expr|Stam|Decl))$/)){
			ptn.type = m[1] ? 'Node' : 'Tokn';
			ptn.key = text;
		}else if (m = text.match(/^(?:([\+\-]{1,2})(\d+))?(\w+)([\=\?]?)\((.*?)\)$/)){
			return compileCall(ptn, m);
		}else if (m = text.match(/^\/(.*?)\/([img]*)$|^\[(.*?)\]([img]*)$/)){
			ptn.type = 'RegExp';
			try {
				if (text[0] == '['){
					ptn.key = new RegExp('^('+compileVal(m[3]).replace(/([^\|\\\w])/g, '\\$1')+')$', m[4]);
				}else {
					ptn.key = new RegExp(compileVal(m[1]).replace(/\\{2}/g, '\\'), m[2]);
				}
			}catch (e) {
				throw tea.error(new Error(), e.message, [source, source.indexOf(text), text], 'Syntax RegExp parse error');
			}
		}else {
			text = compileVal(text);
			var token_list = Tokens.tokenize(text, 'code list');
			if (token_list.length == 1){
				ptn.type = 'Code';
				ptn.key = text;
			}else {
				ptn.type = 'CodeList';
				ptn.key = token_list;
			}
		}
		return ptn;
	}
	function compileVal(text){
		return text.replace(/\\(\W)/g, '$1');
	}
	function compileParam(source){
		return source ? Hash(source) : {};
	}
	function compileCall(ptn, match){
		ptn.type = 'Call';
		ptn.key = match[3];
		ptn.test = match[4] || match[1];
		if (match[5]){
			if (ptn.key == 'is' || ptn.key == 'eq' || ptn.key == 'if'){
				ptn.param = Hash.concat(ptn.param, compileTokenCallParams(compileVal(match[5])));
			}else {
				ptn.param = Hash.concat(ptn.param, compileParam(compileVal(match[5])));
			}
		}
		ptn.param.mark = match[1];
		ptn.param.num = match[2] && parseInt(match[2]);
		return ptn;
	}
	function compileTokenCallParams(param){
		var param = param.split(' '), yes_param = [], not_param = [];
		for (var i=0; i < param.length; i++){
			if (param[i][0] == '!'){
				not_param.push(param[i].substr(1));
			}else {
				yes_param.push(param[i]);
			}
		}
		return {"yes": yes_param.length && yes_param, "no": not_param.length && not_param};
	}
	// ------------------------
	function matchInit(stx_re, src, __m){
		var o_name = stx_re.tempName;
		stx_re.tempName = null;
		stx_re.checkIndent = false;
		var res = matchSyReg.call(stx_re, stx_re, src, __m);
		stx_re.tempName = o_name;
		return res;
	}
	function matchSyReg(stx_re, src, __m, __r){
		var res,
			next_ptn,
			o_index = src.index,
			s_index = o_index,
			p_index = o_index,
			sub_index,
			res_list = [];
		res_list.matched = 0;
		for (var i=0, ptn; i < stx_re.length; i++){
			ptn = stx_re[i];
			// 复原
			if (ptn.type == 'Or'){
				src.index = o_index, res_list.length = 0, res_list.matched = 0, this.checkIndent = false;
			}
			// save sub pattern
			sub_index = matchSubIndex.call(this, ptn, __m);
			// parse pattern
			s_index = src.index;
			res = matchPattern.call(this, ptn, src, __r || res_list, __m);
			if (res){
				res_list.matched++;
				if (ptn.type == 'Or'){
					return res;
				}
				if (ptn.assertion == '?!'){
					return matchBad.call(this, ptn, src, o_index, __m);
				}
				if (ptn.assertion == '?='){
					src.index = s_index = p_index;
					continue;
				}
				if (ptn.quantifier[0] == '*' || ptn.quantifier[0] == '+'){
					if (ptn.quantifier[1] == '?'){
						next_ptn = stx_re[i+1];
					}
					res = matchPatternMore.call(this, res, ptn, next_ptn, src, __r || res_list, __m);
				}
				if (res === true){
					p_index = src.index;
					continue;
				}
				if (ptn.assertion != '?'){
					// 设置匹配结果为节点
					res = matchResName.call(this, ptn, res);
					matchSaveSubList.call(this, ptn, sub_index, res, __m);
					if (res.istoken || res.isnode){
						res_list.push(res);
					}else if (res.length){
						res_list.push.apply(res_list, res);
					}
				}
				p_index = src.index;
				src.next(!ptn.param.lf);
			}else {
				if (ptn.quantifier[0] == '?' || ptn.quantifier[0] == '*'){
					src.index = s_index;
					continue;
				}
				if (ptn.assertion == '?!' || ptn.type == 'Or'){
					src.index = s_index;
					continue;
				}
				if (ptn.type == 'Sub' && ptn.key.minmatch == 0){
					src.index = s_index;
					continue;
				}
				// console.log(Text.print(ptn))
				return matchBad.call(this, ptn, src, o_index, __m);
			}
		}
		src.index = p_index;
		if (res_list.matched){
			if (res_list.length == 1 && stx_re.length == 1 && /^(Sub|Tokn|Node|Call)$/.test(stx_re[0].type)){
				res_list = res_list[0];
			}
			return matchResName.call(this, stx_re, res_list);
		}else {
			src.index = o_index;
		}
	}
	function matchPattern(ptn, src, __r, __m){
		var res, o_index = src.index, token = src.current;
		// check indent
		if (this.checkIndent || this.checkIndent === 0){
			// console.log('???????', src.text, @.checkIndent, src.lineIndent(o_index), @.source)
			if (this.checkIndent > src.lineIndent(o_index)){
				this.checkIndent = false;
				return;
			}
			this.checkIndent = false;
		}
		switch (ptn.type){
			case 'ALL':
				return token;
			case 'RegExp':
				if (ptn.key.test(token.text)) return token;
				break;
			case 'Code':
				if (ptn.key == token.text) return token;
				break;
			case 'Tokn':
				if (token.is(ptn.key)) return token;
				break;
			case 'CodeList':
				return matchTokenList.call(this, ptn, src);
			case 'Patt':case 'Expr':case 'Stam':case 'Decl':case 'Node':case 'Call':
				res = matchCallPattern.call(this, ptn, src, __r, __m);
				break;
			case 'Sub':
				res = matchSyReg.call(this, ptn.key, src, __m, __r);
				break;
			case 'Or':
				res = matchSyReg.call(this, ptn, src, __m, null);
				break;
		}
		if (res){
			if (res == true || res.isnode || res.istoken || res.length || res.matched){
				return res;
			}
			return true;
		}
		src.index = o_index;
		return res;
	}
	function matchPatternMore(res, ptn, next_ptn, src, __r, __m){
		var _res_list = res.istoken || res.isnode ? [res] : res,
			_res,
			o_index = src.index;
		while (_res = matchPatternNext.call(this, ptn, next_ptn, src, __r, __m)){
			if (o_index == src.index){
				return _res_list;
			}
			o_index = src.index;
			if (_res_list === true){
				continue;
			}
			if (_res.istoken || _res.isnode){
				_res_list.push(_res);
			}else if (_res.length){
				_res_list.push.apply(_res_list, _res);
			}
		}
		src.index = o_index;
		return _res_list;
	}
	function matchPatternNext(ptn, next_ptn, src, __r, __m){
		var res, o_index = src.index, next_res;
		if (next_ptn){
			this.try = true;
			next_res = matchPattern.call(this, next_ptn, src.next(!ptn.param.lf), __r, __m);
			this.try = false;
		}
		if (!next_res){
			src.index = o_index;
			if (res = matchPattern.call(this, ptn, src.next(!ptn.param.lf), __r, __m)){
				return res;
			}
		}
		src.index = o_index;
	}
	function matchCallPattern(ptn, src, __r, __m){
		var res;
		switch (ptn.key){
			case 'is':case 'eq':
				return matchToken.call(this, ptn, src);
			case 'if':
				var lase_res = __r[__r.length-1], yes = ptn.param.yes, no = ptn.param.no;
				if (!lase_res || !lase_res.is){
					return ptn.param.yes ? false : true;
				}
				if ((!yes || lase_res.is.apply(lase_res, yes)) && (!no || !lase_res.is.apply(lase_res, no))){
					return true;
				}
				return false;
			default:
				var name = ptn.key;
				if (Parser.hasOwnProperty(name)){
					var o_index = src.index;
					res = Parser[name](src, ptn.param, __m);
					this.checkIndent = false;
					if (res){
						if (res.type == 'IndentBlockStam' || res.type == 'LineBlockStam'){
							this.checkIndent = src.lineIndent(o_index);
						}else {
							var last = res[res.length-1];
							if (last && (last.type == 'IndentBlockStam' || last.type == 'LineBlockStam')){
								this.checkIndent = src.lineIndent(o_index);
							}
						}
					}
					return ptn.test ? !!res : res;
				}else {
					throw tea.error(new Error(), "unexpected syntax parser as \""+name+"\"");
				}
				break;
		}
		throw tea.error(new Error(), 'Syntax pattern unexpected call function', [this.source, -1, name]);
	}
	function matchToken(ptn, src){
		var param = ptn.param, num = param.num, _index = src.index;
		switch (param.mark){
			case '+':
				while (--num >= 0){
					_index = src.nextIndex(_index, !param.lf);
				}
				break;
			case '++':
				while (--num >= 0){
					_index++;
				}
				break;
			case '-':
				while (--num >= 0){
					_index = src.prevIndex(_index, !param.lf);
				}
				break;
			case '--':
				while (--num >= 0){
					_index--;
				}
				break;
		}
		var yes = param.yes, no = param.no, token = src[_index];
		if (!token){
			return !yes && no && ptn.test ? true : false;
		}
		if ((!yes || token[ptn.key].apply(token, yes)) && (!no || !token[ptn.key].apply(token, no))){
			return !ptn.test ? token : true;
		}
		return false;
	}
	function matchTokenList(ptn, src){
		var index = src.index-1, list = [], tokens = ptn.key;
		for (var _i=0, key; _i < tokens.length; _i++){
			key = tokens[_i];
			index++;
			if (/^\s+$/.test(tokens) && src[index].type == 'BlankTokn'){
				continue;
			}
			if (key == src[index].text){
				list.push(src[index]);
				continue;
			}
			return;
		}
		if (list.length){
			src.index = index;
			return list;
		}
	}
	function matchBad(ptn, src, o_index, __m){
		var err_token = src.current;
		src.index = o_index;
		if (ptn.param.err && !ptn.param.try && !this.try){
			throw tea.error(new Error(), ptn.param.err, err_token, 'Syntax parse error');
		}
		return false;
	}
	function matchResName(ptn, res){
		if (ptn.type == 'Or'){
			ptn = ptn.parent || ptn;
		}
		var name = ptn.tempName || ptn.name;
		if (name){
			if (!res || res === true){
				return res;
			}
			if (ptn.assertion == '::'){
				if (!res.isnode && res.length > 1){
					res = new Node(name, res);
				}
			}else if (ptn.assertion == ':::'){
				this.tempName = ptn.name;
			}else {
				res = new Node(name, res);
			}
		}
		return res;
	}
	function matchSubIndex(ptn, __m){
		if (__m && ptn.type == 'Sub' && (!ptn.assertion || ptn.assertion[0] != '?')){
			__m.push(null);
			return __m.length-1;
		}
	}
	function matchSaveSubList(ptn, sub_index, res, __m){
		if (__m){
			if (sub_index != null){
				__m.splice(sub_index, 1, res);
			}
			if (ptn.type == 'Node' || ptn.type == 'Tokn'){
				if (!__m[ptn.key]){
					__m[ptn.key] = [];
				}
				__m[ptn.key].push(res);
			}
			return true;
		}
	}
	return SyntaxReg;
})();
module.exports = SyntaxReg;