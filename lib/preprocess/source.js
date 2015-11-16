var Tokens = require("../tokens");
var Source = (function(){
	function Source(source, file){
		this.index = 0;
		this.length = 0;
		this.source = source;
		this.fileName = file;
		this.preProcessor = null;
	}
	var Splice = Array.prototype.splice,
		Slice = Array.prototype.slice,
		IndexOf = Array.prototype.indexOf;
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
	// ----
	Source.prototype.indexPair = function (s1, s2, index, reverse, not_throw_error){
		index = (index != null ? index : this.index);
		var ab = IndexPair(this, s1, s2, index, reverse);
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
	// ----
	Source.prototype.indexOf = function (){
		return IndexOf.apply(this, arguments);
	}
	Source.prototype.delete = function (a, b){
		if (b == null) b = a;
		for (var i = a; i <= b; i++){
			this[i] = null;
		}
		return this;
	}
	Source.prototype.insert = function (pos, list){
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
		src.add(Tokens.endToken);
		return src;
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
		a = a < 0 ? this.length+a : (a || 0), b = b < 0 ? this.length-1+b : Math.min(b || Infinity, this.length-2);
		var texts = [];
		for (var i = a; i <= b; i++){
			if (this[i] && this[i].text != '\4') texts.push(this[i].text);
		}
		return texts.join('');
	}
	Source.parse = function(text, file){
		var token, m;
		if (!file && !/^["']/.test(text) && Path.isPathText(text)){
			file = text, text = null;
		}
		var loc = Tokens.location(file, text),
			src = new Source(loc.source, loc.fileName),
			i = 0,
			token_re = /#token\s*(\w+(?:\s*,\s*\w+)*)\s*(.*?)(?:\n|$)/mg;
		file = src.fileName;
		text = src.source;
		while (i < text.length && (token = Tokens.parse(text, i))){
			if (typeof token == 'string'){
				throw tea.error(new Error(), token, [text, i, text[i], file]);
			}
			if (token.text == '#token'){
				token_re.lastIndex = i;
				if ((m = token_re.exec(text)) && i == m.index){
					var types = Text.split(m[1], ',', true), symbols = Text.split(m[2], ',', true);
					Tokens.define(types, symbols);
					i += m[0].length;
					if (debug.prep){
						debug.prep('[Prep define token: g{"'+symbols.join('", "')+'"}]', token);
					}
					continue;
				}else {
					token.location = loc.fission(token.text, i);
					throw tea.error(new Error(), 501, token);
				}
			}
			token.location = loc.fission(token.text, i);
			if (token.location.columnNumber === 0){
				token.indent = token.type == 'BlankTokn' ? token.text.replace(/\t/g, tab_size).length : 0;
			}
			i = token.location.end+1;
			src.add(token);
		}
		src.add(Tokens.endToken);
		return src;
	};
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
	function IndexPair(src, s1, s2, index, reverse){
		var s1_re = new RegExp('^'+s1.replace(/([^\w\|])/g, '\\$1')+'$'),
			s2_re = new RegExp('^'+s2.replace(/([^\w\|])/g, '\\$1')+'$');
		if (reverse){
			var b = -1, jump = 0;
			while (index >= 0){
				if (s2_re.test(src[index].text)){
					if (b == -1){
						b = index;
					}else if (s1 == s2){
						return [index, b];
					}else {
						jump += 1;
					}
				}else if (s1_re.test(src[index].text) && b != -1){
					if (jump == 0) return [index, b];
					jump -= 1;
				}
				index -= 1;
			}
		}else {
			var len = src.length, a = -1, jump = 0;
			while (index < len){
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
	}
	return Source;
})();
module.exports = Source;