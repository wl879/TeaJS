var Source = (function(){
	var Token, Location, re_cache;
	Token = require("./token.js");
	Location = require("./location.js");
	re_cache = {};
	function Source(text, file){
		this.index = 0;
		this.length = 0;
		if (arguments.length){
			this.read(text, file);
		}
	};
	Source.prototype.__defineGetter__("current", function(){
		return this.get(this.index);
	});
	Source.prototype.__defineGetter__("string", function(){
		return this.join();
	});
	Source.prototype.__defineGetter__("peek", function(){
		return this.get(this.nextIndex(this.index, true));
	});
	Source.prototype.__defineGetter__("prev", function(){
		return this.get(this.prevIndex(this.index, true));
	});
	Source.prototype.read = function (text, file){
		var loc, i, len, token;
		loc = new Location(file, text);
		text = loc.source;
		file = loc.fileName;
		this.index = 0;
		this.length = 0;
		i = 0;
		len = text.length;
		while (i < len && (token = Token.create(text, i, loc))){
			if (token.error){
				throw Error.create(token.error, [text, i, text[i], file], new Error());
			}
			i = token.location.end+1;
			this.add(token);
		}
		return this.refresh();
	};
	Source.prototype.get = function (index){
		return this[index] || new Token('\4');
	};
	Source.prototype.add = function (token){
		if (!token || !token.isToken){
			throw Error.create('Add the wrong parameters('+isClass(token)+'), Only to can add Lexeme object', new Error());
		}
		this[this.length++] = token;
		return this;
	};
	Source.prototype.back = function (opt, catch_comm){
		while (opt > 1){
			this.index = this.prevIndex(this.index, opt--, catch_comm);
		}
		this.index = this.prevIndex(this.index, opt, catch_comm);
		return this;
	};
	Source.prototype.next = function (opt, catch_comm){
		while (opt > 1){
			this.index = this.nextIndex(this.index, opt--, catch_comm);
		}
		this.index = this.nextIndex(this.index, opt, catch_comm);
		return this;
	};
	Source.prototype.nextIndex = function (index, ig_lf, catch_comm){
		return countIndex(1, this, index, ig_lf, catch_comm);
	};
	Source.prototype.prevIndex = function (index, ig_lf, catch_comm){
		return countIndex(-1, this, index, ig_lf, catch_comm);
	};
	Source.prototype.delete = function (a, b){
		if (b == null) b = a;
		for (var i=a; i <= b; i++){
			this[i] = null;
		}
		return this;
	};
	Source.prototype.insert = function (pos, value, del_len){
		var list, indent, head_token;
		if (pos == null) pos = 0;
		if (del_len == null) del_len = 0;
		if (typeof value == 'string'){
			value = new Source(value, 'preprocess/insert');
		}else if (value.isToken){
			value = [value];
		}
		list = [pos, del_len];
		if (indent = this.lineIndent(pos)){
			indent = SText.copy(' ', indent);
		}
		for (var token, i = 0; i < value.length; i++){
			token = value[i];
			if (!token || token.type == 'EOT'){
				continue;
			}
			if (i && indent && token.indent >= 0){
				if (token.is('BLANK')){
					token.text += indent;
					token.indent = token.text.length;
				}else {
					token.indent = null;
					head_token = token.clone(indent, ['BLANK']);
					head_token.indent = indent.length;
					list.push(head_token);
				}
			}
			list.push(token);
		}
		Array.prototype.splice.apply(this, list);
		return this;
	};
	Source.prototype.clone = function (a, b){
		var src, i;
		src = new Source();
		a = a < 0 ? this.length+a : (a || 0);
		b = b < 0 ? this.length+b : (b || this.length-1);
		for (i = a; i <= b; i++){
			if (this[i]){
				src.add(this[i]);
			}
		}
		if (b != this.length-1){
			src.add(new Token('\4'));
		}
		return src;
	};
	Source.prototype.indexPair = function (s1, s2, index, not_throw_error){
		index = index != null ? index : this.index;
		var ab = indexPair(this, s1, s2, index);
		if (!ab && !not_throw_error){
			throw Error.create(1004, s2, this[index], new Error());
		}
		return ab;
	};
	Source.prototype.indexLine = function (index){
		index = index != null ? index : this.index;
		var a = index, b = index, len = this.length-2;
		while (a > len || (a > 0 && this[a-1] && this[a-1].type != 'LF')){
			a--;
		}
		while (b < len && (!this[b] || this[b].type != 'LF')){
			b++;
		}
		return [(a > len ? len : a), (b > len ? len : b), index];
	};
	Source.prototype.indexOf = function (target, index){
		var is_re, is_str;
		if (index == null) index = 0;
		if (!(is_re = target instanceof RegExp)){
			is_str = typeof target == 'string';
		}
		for (var i = index; i < this.length; i++){
			if (!this[i]){
				continue;
			}
			if (is_re){
				if (target.test(this[i].text)){
					return i;
				}
			}else if (is_str){
				if (this[i].text == target){
					return i;
				}
			}else if (this[i] == target){
				return i;
			}
		}
	};
	Source.prototype.matchOf = function (re, index){
		var m;
		if (index == null) index = 0;
		var a, b;
		if (m = this.string.match(re)){
			for (var tk, i = index; i < this.length; i++){
				tk = this[i];
				if (!tk){
					continue;
				}
				if (tk.start == m.index){
					a = i;
				}
				if (tk.end == m.index+m[0].length){
					b = i;
				}
				if (a != null && b != null){
					return [a, b];
				}
			}
		}
	};
	Source.prototype.lineIndent = function (index){
		index = index != null ? index : this.index;
		while (index >= 0){
			if (this[index] && this[index].indent >= 0){
				return this[index].indent;
			}
			index--;
		}
		return -1;
	};
	Source.prototype.trimIndent = function (a, b, len){
		var i, token;
		a = a < 0 ? this.length+a : (a || 0);
		b = b < 0 ? this.length+b : (b || this.length-1);
		if (len == null){
			for (i = a; i <= b; i++){
				token = this[i];
				if (token && token.indent >= 0){
					if (len == null || token.indent < len){
						len = token.indent;
					}
				}
			}
		}
		if (len > 0){
			for (i = a; i <= b; i++){
				token = this[i];
				if (token && token.indent >= 0){
					token.indent = Math.max(token.indent-len, 0);
					if (token.type = 'BLANK'){
						token.text = token.text.substr(0, token.indent);
					}
				}
			}
		}
		return this;
	};
	Source.prototype.refresh = function (index){
		var target;
		if (typeof index == 'number'){
			this.index = index;
		}
		target = this[this.index];
		clearSource(this);
		for (var token, i = this.length - 1; i >= 0; i--){
			token = this[i];
			token.indent = -1;
			if (!i || (token.type == 'LF' && (token = this[i+1]))){
				if (token.type == 'BLANK'){
					token.text = SText.spaceTab(token.text);
					token.indent = token.text.length;
				}else {
					token.indent = 0;
				}
			}
		}
		if (target != this[this.index]){
			index = this.indexOf(target);
			if (index >= 0){
				this.index = index;
			}
		}
		return this;
	};
	Source.prototype.join = function (a, b){
		if (isArray(a)){
			b = a[1], a = a[0];
		}
		a = a < 0 ? this.length+a : (a || 0), b = b < 0 ? this.length+b : (b || b === 0 ? b : this.length);
		var texts = [];
		for (var i=a; i <= b; i++){
			if (this[i] && this[i].text != '\4') texts.push(this[i].text);
		}
		return texts.join('');
	};
	Source.prototype.isSource = true;
	function countIndex(ori, src, index, ig_lf, catch_comm){
		var len = src.length-1, type;
		while ((index += ori) >= 0 && index <= len){
			type = src[index] && src[index].type;
			if (!type || type == 'BLANK' || (!catch_comm && type == 'COMMENT') || (ig_lf && type == 'LF')){
				continue;
			}
			return index;
		}
		if (ori > 0){
			return index > len ? len : index;
		}
		return index < 0 ? 0 : index;
	};
	function indexPair(src, s1, s2, index){
		var s1_re, s2_re, len, a, jump, text;
		s1_re = re_cache[s1] || (re_cache[s1] = new RegExp('^('+SText.re(s1)+')$'));
		s2_re = re_cache[s2] || (re_cache[s2] = new RegExp('^('+SText.re(s2)+')$'));
		len = src.length;
		a = -1;
		jump = 0;
		while (index < len){
			if (src[index]){
				text = src[index].text;
				if (text == '\\'){
					index += 2;
					continue;
				}
				if (s1_re.test(text)){
					if (a == -1){
						a = index;
					}else if (s1 == s2 || s2_re.test(text)){
						return [a, index];
					}else {
						jump += 1;
					}
				}else if (s2_re.test(text) && a != -1){
					if (jump == 0){
						return [a, index];
					}
					jump -= 1;
				}
			}
			index += 1;
		}
	};
	function clearSource(src){
		var len, a, list;
		len = src.length;
		for (var token, i = 0; i < src.length; i++){
			token = src[i];
			if (!token){
				continue;
			}
			if (token.type == 'EOT'){
				src[i] = null;
				continue;
			}
			if (token.is('HEAD')){
				a = i;
				while (i < len){
					if (!src[i]){
						i++;
						continue;
					}
					if (src[i].type == 'LF'){
						if (src[a].indent >= 0){
							src.delete(a, i);
						}else {
							src.delete(a, i-1);
						}
						break;
					}
					if (src[i].is('BLANK', 'END')){
						i++;
						continue;
					}
					break;
				}
			}
		}
		list = [];
		for (var token, i = 0; i < src.length; i++){
			token = src[i];
			if (token){
				list.push(token);
			}
			src[i] = null;
		}
		src.length = 0;
		Array.prototype.push.apply(src, list);
		return src.add(new Token('\4'));
	};
	return Source;
})();
module.exports = Source;