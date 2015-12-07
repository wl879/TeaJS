var Source = (function(){
	var Splice = Array.prototype.splice,
		Slice = Array.prototype.slice,
		IndexOf = Array.prototype.indexOf,
		Token = require("./token.js"),
		Location = require("./location.js"),
		PreProcess = require("../preprocess");
	function Source(source, file, ctx){
		if (this.constructor != Source){
			return new Source(source, file, ctx);
		}
		this.index = 0;
		this.length = 0;
		this.source = null;
		this.fileName = null;
		this.context = ctx || PreProcess.context();
		if (arguments.length){
			this.parse(source, file, this.context, true).clean();
		}
	}
	Source.prototype.parse = function (text, file, ctx, init){
		if (ctx == null) ctx = this.context;
		var loc, i, control_cache, token, code;
		if (!file && !/^["']/.test(text) && Path.isPathText(text)){
			file = text, text = null;
		}
		loc = new Location(file, text);
		text = loc.source;
		file = loc.fileName;
		i = 0;
		control_cache = {};
		if (init || !this.source){
			this.source = text;
			this.fileName = file;
		}
		while (i < text.length && (token = Token(text, i))){
			if (token.error){
				throw tea.error(new Error(), token.error, [text, i, text[i], file]);
			}
			token.location = loc.fission(token.text, i);
			if (this.length && this[this.length-1].is('LF')){
				token.indent = token.type == 'BlankTokn' ? token.text.replace(/\t/g, tab_size).length : 0;
			}
			switch (code = token.text){
				case '"':case '"""':case '""""':case '`':case "'":case "'''":case "''''":
					token = ctx.processor.string(this, text, i, token);
					break;
				case '/*':case '#!':case '//':
					token = ctx.processor.comm(this, text, i, token);
					break;
				case '/':
					token = ctx.processor.regexp(this, text, i, token);
					break;
				case '#':
					token = ctx.processor.pound(this, text, i, token, control_cache);
					break;
				default:
					if (token.type == 'IdentifierTokn'){
						token = ctx.processor.macro(this, text, i, token);
					}
					break;
			}
			if (typeof token == 'number'){
				if (token < 0){
					break;
				}
				i = token;
			}else {
				i = token.location.end+1;
				this.add(token);
			}
		}
		return this;
	}
	Source.prototype.__defineGetter__("text", function(){
		return this.current.text;
	});
	Source.prototype.__defineGetter__("type", function(){
		return this.current.type;
	});
	Source.prototype.__defineGetter__("current", function(){
		return this.get(this.index);
	});
	Source.prototype.__defineGetter__("peek", function(){
		return this.get(this.nextIndex(this.index, true));
	});
	Source.prototype.__defineGetter__("prev", function(){
		return this.get(this.prevIndex(this.index, true));
	});
	Source.prototype.is = function (){
		return this.current.is.apply(this[this.index], arguments);
	}
	Source.prototype.eq = function (){
		return this.current.eq.apply(this[this.index], arguments);
	}
	Source.prototype.get = function (index){
		return this[index] || {};
	}
	Source.prototype.add = function (tok){
		if (!tok || !tok.istoken){
			throw tea.error(new Error(), 'Add the wrong parameters('+isClass(tok)+'), Only to can add Lexeme object');
		}
		this[this.length++] = tok;
		return this;
	}
	Source.prototype.back = function (opt, catch_comm){
		while (opt > 1){
			this.index = this.prevIndex(this.index, opt--, catch_comm);
		}
		this.index = this.prevIndex(this.index, opt, catch_comm);
		return this;
	}
	Source.prototype.next = function (opt, catch_comm){
		while (opt > 1){
			this.index = this.nextIndex(this.index, opt--, catch_comm);
		}
		this.index = this.nextIndex(this.index, opt, catch_comm);
		return this;
	}
	Source.prototype.nextIndex = function (index, ig_lf, catch_comm){
		return GoIndex(1, this, index, ig_lf, catch_comm);
	}
	Source.prototype.prevIndex = function (index, ig_lf, catch_comm){
		return GoIndex(-1, this, index, ig_lf, catch_comm);
	}
	Source.prototype.indexPair = function (s1, s2, index, not_throw_error){
		index = (index != null ? index : this.index);
		var ab = IndexPair(this, s1, s2, index);
		if (!ab && !not_throw_error){
			throw tea.error(new Error(), 'Source index pair miss "'+s2+'" token', this[index], 'Source error');
		}
		return ab;
	}
	Source.prototype.indexLine = function (index){
		index = (index != null ? index : this.index);
		var a = index, b = index, len = this.length-2;
		while (a > len || (a > 0 && this[a-1] && this[a-1].type != 'LF')){
			a--;
		}
		while (b < len && (!this[b] || this[b].type != 'LF')){
			b++;
		}
		return [(a > len ? len : a), (b > len ? len : b), index];
	}
	Source.prototype.lineIndent = function (index){
		index = (index != null ? index : this.index);
		while (index >= 0){
			if (this[index] && this[index].indent >= 0){
				return this[index].indent;
			}
			index--;
		}
		return -1;
	}
	Source.prototype.trimIndent = function (a, b){
		this.length && TrimIndent(this, a, b);
		return this;
	}
	Source.prototype.indexOf = function (){
		return IndexOf.apply(this, arguments);
	}
	Source.prototype.matchOf = function (re, index){
		if (index == null) index = 0;
		var m, a, b;
		if (m = this.source.match(re)){
			for (var i=index, tk; i < this.length; i++){
				tk = this[i];
				if (!tk){
					continue;
				}
				if (tk.start == m.index && tk.fileName == this.fileName){
					a = i;
				}
				if (tk.end == m.index+m[0].length && tk.fileName == this.fileName){
					b = i;
				}
				if (a != null && b != null){
					return [a, b];
				}
			}
		}
	}
	Source.prototype.delete = function (a, b){
		if (b == null) b = a;
		for (var i = a; i <= b; i++){
			this[i] = null;
		}
		return this;
	}
	Source.prototype.insert = function (pos, list){
		if (arguments.length == 1){
			list = pos, pos = this.length;
		}
		list = list.istoken ? [list] : Slice.call(list);
		var indent = this.lineIndent(pos);
		for (var i=list.length-1, t; i >= 0; i--){
			t = list[i];
			if (!t || t.type == 'EOT'){
				Splice.call(list, i, 1);
			}else if (indent > 0 && t.indent >= 0){
				t.indent += indent;
			}
		}
		list.unshift(pos, 0);
		Splice.apply(this, list);
		return this;
	}
	Source.prototype.clone = function (a, b){
		var src = new Source();
		a = typeof a != 'number' ? 0 : a;
		b = typeof b != 'number' ? this.length : b;
		for (var i = a; i < b; i++){
			if (this[i]){
				src.add(this[i]);
			}
		}
		if (b != this.length){
			src.add(this[this.length-1]);
		}
		return src;
	}
	Source.prototype.clean = function (){
		var a;
		a = -1;
		for (var i=0, token; i < this.length; i++){
			token = this[i];
			if (!token){
				continue;
			}
			if (token.type == 'EOT'){
				this[i] = null;
			}
			if (token.is('LineHead')){
				a = i;
			}
			if (token.is('LF')){
				if (a != -1){
					this.delete(a, i);
				}
				a = -1;
				continue;
			}
			if (!token.is('BlankTokn')){
				a = -1;
			}
		}
		return this.refresh().add(Token('\4'));
	}
	Source.prototype.refresh = function (){
		var target = this[this.index], a = 0, del_i = -1, del_len = 0;
		for (var i=this.length-1, token; i >= 0; i--){
			token = this[i];
			if (token){
				if (del_len){
					Splice.call(this, del_i, del_len);
				}
				del_i = -1, del_len = 0;
			}else {
				del_i = i, del_len += 1;
			}
		}
		if (del_len){
			Splice.call(this, del_i, del_len);
		}
		if (target != this[this.index]){
			this.index = this.indexOf(target);
		}
		return this;
	}
	Source.prototype.join = function (a, b){
		if (isArray(a)){
			b = a[1], a = a[0];
		}
		a = a < 0 ? this.length+a : (a || 0), b = b < 0 ? this.length+b : Math.min(b || Infinity, this.length);
		var texts = [];
		for (var i = a; i <= b; i++){
			if (this[i] && this[i].text != '\4') texts.push(this[i].text);
		}
		return texts.join('');
	}
	function TrimIndent(src, a, b){
		if (a == null) a = 0;
		if (b == null) b = src.length-1;
		var _a = a, _b = b;
		// trim left blank
		while (src[_a].is('BlankTokn', 'LF')){
			_a++;
		}
		if (_a > a){
			if (src[--_a].type != 'LF'){
				_a--;
			}
			src.delete(a, _a);
		}
		// trim right blank
		while (src[_b].is('BlankTokn', 'LF')){
			_b--;
		}
		if (_b < b){
			src.delete(++_b, b);
		}
		// trim line indent
		var min = -1;
		for (var i = a; i <= b; i++){
			if (src[i] && src[i].indent >= 0){
				if (min == -1 || src[i].indent < min){
					min = src[i].indent;
				}
			}
		}
		if (min > 0){
			for (var i = a; i <= b; i++){
				if (src[i] && src[i].indent >= 0){
					src[i].indent -= min;
					if (src[i].indent == 0){
						src[i+1].indent = src[i].indent;
						src[i++] = null;
					}else if (src[i].type == 'BlankTokn'){
						src[i].text = src[i].text.replace(/\t/g, tab_size).substr(0, src[i].indent);
					}
				}
			}
		}
		return src;
	}
	function GoIndex(ori, src, index, ig_lf, catch_comm){
		var len = src.length-1, type;
		while ((index += ori) >= 0 && index <= len){
			type = src[index] && src[index].type;
			if (!type || type == 'BlankTokn' || (!catch_comm && type == 'CommDecl') || (ig_lf && type == 'LF')){
				continue;
			}
			return index;
		}
		if (ori > 0){
			return index > len ? len : index;
		}
		return index < 0 ? 0 : index;
	}
	function IndexPair(src, s1, s2, index){
		var s1_re = new RegExp('^'+s1.replace(/([^\w\|])/g, '\\$1')+'$'),
			s2_re = new RegExp('^'+s2.replace(/([^\w\|])/g, '\\$1')+'$'),
			len = src.length,
			a = -1,
			jump = 0;
		while (index < len){
			if (src[index].text == '\\'){
				index += 2;
				continue;
			}
			if (s1_re.test(src[index].text)){
				if (a == -1){
					a = index;
				}else if (s1 == s2){
					return [a, index];
				}else {
					jump += 1;
				}
			}else if (s2_re.test(src[index].text) && a != -1){
				if (jump == 0) return [a, index];
				jump -= 1;
			}
			index += 1;
		}
	}
	return Source;
})();
module.exports = Source;